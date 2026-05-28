# Chapter 7: Behind-the-Scenes Architecture

This chapter pulls back the curtain on Frappe's internal architecture for portal rendering. Understanding these internals will make you a more effective portal developer, able to debug issues, optimize performance, and extend the system.

## 7.1 The Renderer Architecture

Frappe uses a **strategy pattern** for page rendering. Each type of page has its own renderer class that knows how to handle that specific type. The `PathResolver` acts as the strategy selector, trying each renderer in order until one accepts the request.

The renderer hierarchy is:

```
BaseRenderer (abstract)
    |
    ├── BaseTemplatePage (for template-based pages)
    │       ├── TemplatePage (for www/ files)
    │       ├── DocumentPage (for DocType web views)
    │       │       └── WebFormPage (for Web Forms)
    │       ├── ListPage (for DocType lists)
    │       ├── PrintPage (for print views)
    │       ├── NotFoundPage (for 404)
    │       └── ErrorPage (for 500)
    │
    ├── StaticPage (for binary files)
    │
    └── RedirectPage (for redirects)
```

### 7.1.1 BaseRenderer

The abstract base class (`base_renderer.py`) defines the interface:

```python
class BaseRenderer:
    def __init__(self, path, http_status_code=None):
        self.path = path
        self.http_status_code = http_status_code
    
    def can_render(self):
        return False
    
    def render(self):
        raise NotImplementedError
    
    def build_response(self, data):
        # Build a Werkzeug Response object
```

### 7.1.2 BaseTemplatePage

The `BaseTemplatePage` (`base_template_page.py`) is the base for all page renderers that use Jinja templates. Its key method is `init_context()`, which initializes the context with website settings:

```python
def init_context(self):
    self.context = frappe._dict()
    self.context.update(get_website_settings())
    self.context.update(frappe.local.conf.get("website_context") or {})
```

It also provides `post_process_context()`, which finalizes the context by adding meta tags, setting the base template, and performing other cleanup tasks.

### 7.1.3 TemplatePage

`TemplatePage` (`template_page.py`) handles all file-based portal pages (files in `www/` or `templates/pages/`). Its `can_render()` method returns `True` if it found a matching template file that is not a Python file:

```python
def can_render(self):
    return (
        hasattr(self, "template_path")
        and self.template_path
        and not self.template_path.endswith(PY_LOADER_SUFFIXES)
    )
```

### 7.1.4 DocumentPage

`DocumentPage` (`document_page.py`) renders a single document from a DocType that has `has_web_view = 1`. It uses a search function that is cached with a 1-hour TTL:

```python
@frappe.cache()
def _find_matching_document_webview(path):
    doctype_conditions = get_doctypes_with_web_view()
    for doctype, conditions in doctype_conditions.items():
        name = frappe.db.get_value(doctype, conditions, "name")
        if name:
            return {"doctype": doctype, "doc": name, "page_or_generator": "Generator"}
```

This is how Frappe serves pages like `/blog-post-title` where the URL maps to a `Blog Post` document.

### 7.1.5 PathResolver

The `PathResolver` (`path_resolver.py`) is the decision engine. Its `resolve()` method:

```python
def resolve(self):
    # 1. Check 404 cache
    # 2. Check redirects
    # 3. Resolve home page
    # 4. Try renderers in order
    for renderer_class in self.get_renderers():
        renderer_instance = renderer_class(self.path, self.http_status_code)
        if renderer_instance.can_render():
            return renderer_instance
    return NotFoundPage(self.path, 404)
```

The `get_renderers()` method returns the renderer classes in priority order, including any custom renderers registered via hooks:

```python
def get_renderers(self):
    renderers = []
    
    # Custom renderers from hooks (highest priority)
    for renderer_path in frappe.get_hooks("www_renderer_classes"):
        renderers.append(frappe.get_attr(renderer_path))
    
    # Built-in renderers
    renderers.extend([
        StaticPage,
        WebFormPage,
        DocumentPage,
        TemplatePage,
        ListPage,
        PrintPage,
    ])
    
    return renderers
```

## 7.2 The Routing Table

Frappe builds a routing table from the filesystem. The key function is `get_pages(app=None)` in `router.py`:

```python
@frappe.cache()
def get_pages(app=None):
    """Get all pages from all apps (cached)."""
    pages = {}
    for app in frappe.get_installed_apps():
        app_path = frappe.get_app_path(app)
        pages.update(get_pages_from_path("www", app, app_path))
        pages.update(get_pages_from_path("templates/pages", app, app_path))
    return pages
```

This function walks the `www/` and `templates/pages/` directories of every installed app and builds a dictionary mapping routes to page info. The result is cached, so the filesystem is only scanned on cache clear.

```python
def get_pages_from_path(start, app, app_path):
    pages = {}
    start_path = os.path.join(app_path, start)
    if not os.path.exists(start_path):
        return pages
    
    for root, dirs, files in os.walk(start_path):
        for f in files:
            page_info = get_page_info(f, app, start, root)
            if page_info:
                pages[page_info.route] = page_info
    
    return pages
```

Each page info dictionary contains:

```python
page_info = {
    "basename": "contact",
    "basepath": "/path/to/app/www",
    "template": "www/contact.html",
    "route": "contact",
    "controller_path": "www/contact.py",
    "source": "HTML or Markdown source",
    "title": "Contact Us",
}
```

## 7.3 Template Loading and Compilation

Frappe configures Jinja with a custom loader that can find templates across all installed apps. The Jinja environment is configured in `frappe.__init__.py` and accessed via `frappe.get_jenv()` and `frappe.get_jloader()`.

```python
def get_jloader():
    if not getattr(frappe.local, "jloader", None):
        frappe.local.jloader = jinja2.ChoiceLoader([
            jinja2.FileSystemLoader(frappe.get_app_path(app))
            for app in frappe.get_installed_apps()
        ])
    return frappe.local.jloader
```

The `ChoiceLoader` tries each app's filesystem in order until it finds the requested template. This is how template inheritance works across apps — when `base.html` extends `templates/base.html`, Jinja searches all apps for that path.

Templates are compiled to Python code the first time they are rendered. The compiled template is cached in memory (within the Jinja environment) for the lifetime of the Python process. This means the first request to a page is slower (compilation), while subsequent requests use the cached compiled template.

## 7.4 Safe Rendering Internals

Frappe uses two Jinja environments:

1. **Regular environment** — Full Jinja power, used for system templates
2. **Sandboxed environment** — Restricted Jinja, used for user-defined templates

When `safe_render = True` (the default for portal pages), Frappe uses `jinja2.sandbox.SandboxedEnvironment`. The sandbox prevents:

- Access to `__class__`, `__base__`, `__subclasses__`, `__globals__`, `__code__`
- Import of arbitrary modules
- File I/O
- Execution of arbitrary Python code
- Attribute access on unsafe objects

The sandbox is not a security silver bullet, but it prevents common attack vectors where an attacker could execute arbitrary code through a template.

## 7.5 Cache Management

Frappe employs multiple caching layers for portal pages:

### 7.5.1 HTML Page Cache

The `@cache_html` decorator on `TemplatePage.get_html()` caches the complete rendered HTML. The cache key includes:

- The page path (e.g., `/about`)
- The language code
- Whether the user is a guest or logged in

The cache is invalidated when:

- `clear_cache()` is called for the specific path
- `Website Settings` is modified
- A theme is changed or recompiled
- The routing cache is cleared

### 7.5.2 Routing Cache

The page routing table (from `get_pages()`) is cached with `@frappe.cache()`. It is invalidated when:

- Any app is migrated (bench migrate)
- A new app is installed
- `clear_routing_cache()` is called explicitly

### 7.5.3 Document Web View Cache

The `_find_matching_document_webview()` function that maps URLs to DocType documents is cached with a 1-hour TTL in Redis. This prevents repeated database queries for URL resolution.

### 7.5.4 404 Cache

When a page is not found, the 404 is cached to prevent repeated lookups for the same non-existent path. The cache duration is configured in Website Settings.

## 7.6 Session and Authentication

Frappe's session management works the same way for portal pages as it does for the REST API:

1. **Cookie-based auth**: The `sid` cookie contains the session ID
2. **Guest sessions**: Unauthenticated users get a `Guest` session
3. **Session data**: Available via `frappe.session`

In `base.html`, the session status is exposed as a data attribute:

```html
<body frappe-session-status="{{ 'logged-in' if frappe.session.user != 'Guest' else 'logged-out'}}">
```

This allows JavaScript to detect the authentication state and react accordingly.

The session is initialized before the page rendering pipeline begins, so by the time `get_context()` is called, `frappe.session.user` and `frappe.session.data` are already populated.

## 7.7 Error Handling

Errors during portal page rendering are handled at multiple levels:

1. **404 (Not Found)** — When no renderer matches, `NotFoundPage` renders the `www/404.html` template
2. **403 (Permission Denied)** — When `frappe.PermissionError` is raised, `NotPermittedPage` renders the error
3. **500 (Server Error)** — When an unhandled exception occurs, `ErrorPage` renders the `www/error.html` template
4. **Redirects** — When `frappe.Redirect` is raised, the `RedirectPage` redirects the browser

The `handle_exception()` function in `serve.py` routes exceptions to the appropriate handler:

```python
def handle_exception(e, endpoint, path, http_status_code):
    if isinstance(e, frappe.Redirect):
        return RedirectPage(path, http_status_code, e.http_status_code)
    if isinstance(e, frappe.PermissionError):
        return NotPermittedPage(path, http_status_code)
    if isinstance(e, frappe.PageDoesNotExistError):
        return NotFoundPage(path, 404)
    # Generic error
    return ErrorPage(path, 500)
```

## 7.8 Hooks System for Website

Frappe's hooks system allows apps to customize portal behavior without modifying core code. Key hooks for portal pages:

| Hook | Purpose |
|------|---------|
| `www_renderer_classes` | Register custom page renderers |
| `website_context` | Set default context values for all pages |
| `update_website_context` | Callback functions that modify context after initialization |
| `base_template` | Override the default base template (`templates/base.html`) |
| `web_include_js` | Include JavaScript on all portal pages |
| `web_include_css` | Include CSS on all portal pages |
| `website_redirects` | Define URL redirect rules |
| `website_generators` | Register DocTypes as website generators |

## 7.9 Website Generators

A **Website Generator** is a DocType that automatically generates website pages for each of its records. The DocType must have `has_web_view = 1` and optionally `is_website_generator = 1`.

When a DocType is a website generator:

1. Each record has a `route` field (auto-generated from the title)
2. Each record's route is checked by `DocumentPage` renderer
3. The DocType can define `get_context(self, context)` to provide data to the template
4. The DocType's web template is defined in the doctype's JSON or via `website_template` field

This is how `Blog Post`, `Web Page`, and similar DocTypes automatically create pages at routes like `/blog/my-post-title`.

The `WebsiteGenerator` class in `website_generator.py` provides base functionality:

```python
class WebsiteGenerator(Document):
    def autoname(self):
        self.name = self.scrubbed_title()
    
    def validate(self):
        self.set_route()
    
    def make_route(self):
        return self.scrubbed_title()
    
    def get_page_info(self):
        return {
            "doc": self,
            "page_or_generator": "Generator",
            "ref_doctype": self.doctype,
            "controller": self.get_website_properties(),
            "title": self.get_title(),
        }
```

## 7.10 The Theme Loading Mechanism

The active theme is loaded in every portal page through `get_website_settings()`:

```python
if context.disable_website_theme:
    context.theme = frappe._dict()
else:
    from frappe.website.doctype.website_theme.website_theme import get_active_theme
    context.theme = get_active_theme() or frappe._dict()
```

The `get_active_theme()` function looks up the theme name stored in Website Settings and loads the corresponding Website Theme document from cache.

In `head.html`, the theme CSS is included:

```jinja
{%- if theme and theme.name != 'Standard' -%}
<link type="text/css" rel="stylesheet" href="{{ theme.theme_url }}">
{%- else -%}
{{ include_style('website.bundle.css') }}
{%- endif -%}
```

If a custom theme is active, its compiled CSS file is linked. Otherwise, the default `website.bundle.css` is used.

## 7.11 Backward Compatibility

Frappe maintains backward compatibility with several legacy features:

- **HTML comment properties**: `<!-- title -->`, `<!-- show-sidebar -->`, etc. (deprecated, will be removed)
- **Jinja comment syntax**: `{# title: value #}` (alternative to HTML comments)
- **`get_context` with no arguments**: Older controllers that define `def get_context():` still work

## 7.12 Security Considerations

Several security mechanisms protect portal pages:

1. **Sandboxed Jinja**: Prevents code injection in templates
2. **CSRF protection**: CSRF tokens are injected into every page for logged-in users
3. **Permission checking**: Controllers can check roles and permissions
4. **Guest access control**: `frappe.throw()` in `get_context` blocks unauthorized access
5. **Safe HTML escaping**: Jinja auto-escapes variables by default
6. **No direct filesystem access**: Templates cannot read arbitrary files from the server

## 7.13 Summary

The architecture of Frappe's portal rendering system is built on three pillars:

1. **Path Resolution** — The `PathResolver` select the correct renderer for each URL
2. **Template Rendering** — The `BaseTemplatePage` hierarchy provides context initialization, controller execution, and Jinja rendering
3. **Caching** — Multiple caching layers (HTML, routing, document lookup, 404) optimize performance

Understanding these internals gives you the power to extend, optimize, and debug the portal system effectively.
