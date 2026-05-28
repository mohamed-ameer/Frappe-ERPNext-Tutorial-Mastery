# Chapter 3: The Request-to-Response Lifecycle

In this chapter, we will trace the complete journey of a single HTTP request from the moment it arrives at the Frappe application server to the moment the final HTML is delivered to the browser. Understanding this lifecycle is crucial for debugging, optimizing, and extending portal pages.

## 3.1 High-Level Overview

The lifecycle of a portal page request consists of the following stages:

```
Browser → WSGI Server → Frappe App → URL Routing → Path Resolution → 
Renderer Selection → Context Building → Template Rendering → Response
```

Each stage transforms the request in specific ways. Let us follow a concrete example: a user visits `https://example.com/contact`.

## 3.2 Stage 1: The WSGI Entry Point

When the HTTP request arrives at the server (Gunicorn, uWSGI, or the development server), it is converted into a WSGI (Web Server Gateway Interface) call. Frappe implements the WSGI application interface in `frappe.app`.

The WSGI handler:

1. Creates a new `frappe.local` thread-local object for this request
2. Parses the request URL, headers, and body
3. Initializes the database connection
4. Sets up the session (authenticates the user via cookies or tokens)
5. Determines the site and path from the URL
6. Calls `frappe.website.serve.get_response(path)` to handle the request

If the request path starts with `/api`, `/_`, or `/assets`, it is handled by different handlers (REST API, internal routes, or static file serving). For all other paths, the website handler is invoked.

## 3.3 Stage 2: The serve.get_response() Function

The entry point for website rendering is in `frappe/website/serve.py`:

```python
def get_response(path=None, http_status_code=200) -> Response:
    path_resolver = PathResolver(path, http_status_code)
    endpoint, renderer_instance = path_resolver.resolve()
    return renderer_instance.render()
```

This simple three-line function does the following:

1. Creates a `PathResolver` with the requested path
2. Calls `resolve()` on it, which returns a renderer instance capable of handling this path
3. Calls `render()` on the renderer to produce a `Response` object

If any exception occurs during resolution or rendering, `handle_exception()` catches it and returns an appropriate error response (404, 403, 500, or redirect).

## 3.4 Stage 3: Path Resolution

The `PathResolver` class (in `frappe/website/path_resolver.py`) implements the decision logic for matching a URL path to the correct renderer.

### 3.4.1 404 Cache Check

Before anything else, the resolver checks if this path is in the 404 cache. If the same path was previously requested and resulted in a 404, it returns a cached 404 response immediately without hitting the database or filesystem. This prevents repeated expensive lookups for non-existent pages.

### 3.4.2 Redirect Resolution

Next, the resolver checks if the path matches any redirect rules:

- **Hooks-based redirects**: The `website_redirects` hook can define redirect maps
- **Doctype-based redirects**: The `Website Route Redirect` doctype allows per-route redirects configured from the UI

If a match is found, the resolver returns a `RedirectPage` renderer that issues a 301 or 302 redirect.

### 3.4.3 Home Page Resolution

If the path is empty or `/`, the resolver resolves the home page. The home page can be configured in several places:

1. **Website Settings** — The `home_page` field
2. **Portal Settings** — The `default_portal` setting  
3. **Role-based home page** — Different roles can have different home pages
4. **Hooks** — The `website_context` hook can set a home page
5. **Fallback** — The `/me` page (user profile) or `/login` for guests

### 3.4.4 Renderer Selection

The resolver now tries each renderer in order, calling `can_render()` on each one. The first renderer that returns `True` wins. The order is:

```
Custom renderers (from hooks) → StaticPage → WebFormPage → 
DocumentPage → TemplatePage → ListPage → PrintPage
```

For our `/contact` example, the `TemplatePage` renderer will match because a file `www/contact.html` exists.

## 3.5 Stage 4: The TemplatePage Renderer

The `TemplatePage` class (in `frappe/website/page_renderers/template_page.py`) is the workhorse renderer for all file-based portal pages. It extends `BaseTemplatePage`, which extends `BaseRenderer`.

### 3.5.1 Initialization and Template Path Discovery

When `TemplatePage.__init__()` is called, it calls `set_template_path()` which:

1. Iterates over all installed apps in reverse order
2. For each app, searches the `www/` and `templates/pages/` folders
3. For each search path, tries these extensions: exact match → `.html` → `.md` → `/index.html` → `/index.md`
4. When a matching file is found, it stores:
   - `self.app` — which app owns the file
   - `self.template_path` — relative path from the app root
   - `self.basepath` — directory path of the file
   - `self.basename` — full path without extension
   - `self.name` — the filename without extension

For `/contact`, it finds `frappe/www/contact.html` and sets:
- `app = "frappe"`
- `template_path = "www/contact.html"`
- `name = "contact"`

### 3.5.2 The render() → get_html() Pipeline

When `render()` is called, it invokes `get_html()`, which is decorated with `@cache_html`. This means the rendered HTML is cached (by path and language) so subsequent requests are served faster.

The `get_html()` method executes these steps in order:

```
init_context() → set_pymodule() → update_context() → 
setup_template_source() → load_colocated_files() → 
set_properties_from_source() → post_process_context() → 
render_template() → update_toc()
```

Let us examine each step.

### 3.5.3 init_context()

This method (defined in `BaseTemplatePage`) initializes the context dictionary:

```python
def init_context(self):
    self.context = frappe._dict()
    self.context.update(get_website_settings())
    self.context.update(frappe.local.conf.get("website_context") or {})
```

The `get_website_settings()` function loads data from the `Website Settings` doctype:

- Navigation bar items (top bar, footer)
- Banner HTML and images
- Brand HTML and copyright
- Social sharing settings (Twitter, Facebook, LinkedIn)
- Signup settings
- Title prefix
- Navbar and footer templates
- **Active theme** (loads the current Website Theme)
- Favicon
- Boot data (language, system defaults)
- Web include JS and CSS from hooks
- Website context from hooks

This means every portal page automatically has access to the site's branding, navigation, theme settings, and basic configuration through the context.

### 3.5.4 set_pymodule()

This method looks for a co-located Python file:

```python
def set_pymodule(self):
    template_basepath = os.path.splitext(self.template_path)[0]
    self.pymodule_name = None
    self.pymodule_path = os.path.join(
        os.path.dirname(template_basepath),
        os.path.basename(template_basepath.replace("-", "_")) + ".py",
    )
    if os.path.exists(os.path.join(self.app_path, self.pymodule_path)):
        self.pymodule_name = self.app + "." + self.pymodule_path.replace(os.path.sep, ".")[:-3]
```

If a `.py` file exists alongside the template, it is imported as a Python module. For `/contact`, it would try to import `frappe.www.contact` as a Python module.

Note the `replace("-", "_")` — hyphens in filenames are converted to underscores for Python module names, since Python module names cannot contain hyphens.

### 3.5.5 update_context()

This method does several things:

1. **Sets page properties**: `base_template`, `basepath`, `basename`, `name`, `path`, `route`, `template`
2. **Build version**: Injects the current build version
3. **Loads module properties**: If a `pymodule` was found, it reads properties like `base_template_path`, `template`, `no_cache`, `sitemap`, `condition_field` directly from the module
4. **Calls get_context()**: The critical step — if the module defines a `get_context` function, it is called here:

```python
data = self.run_pymodule_method("get_context")
if data:
    self.context.update(data)
```

The `run_pymodule_method` checks the function's signature. If `get_context` accepts an argument, it passes `self.context`. If it accepts no arguments, it calls it without arguments. The return value, if any, is merged into the context.

### 3.5.6 setup_template_source()

This method:

1. **Gets the raw template**: Loads the template source from the Jinja loader
2. **Extracts frontmatter**: Parses YAML frontmatter from the file (delimited by `---` or `+++`) and merges it into the context
3. **Converts from Markdown**: If the template is `.md`, it converts the Markdown to HTML

### 3.5.7 load_colocated_files()

This method checks for co-located `.js` and `.css` files and inlines their content:

```python
def load_colocated_files(self):
    js_path = self.basename + ".js"
    if os.path.exists(js_path) and "{% block script %}" not in self.source:
        self.context.colocated_js = self.get_colocated_file(js_path)
    css_path = self.basename + ".css"
    if os.path.exists(css_path) and "{% block style %}" not in self.source:
        self.context.colocated_css = self.get_colocated_file(css_path)
```

### 3.5.8 set_properties_from_source()

This method extracts metadata from the template source:

1. **Title**: Extracts from an `<!-- title -->` comment or an `<h1>` tag
2. **Base template**: Extracts from `<!-- base_template -->` comment
3. **Auto-wrapping**: If the template defines a `base_template` but does not use `{% extends %}`, it wraps the content in the base template
4. **Comment-based properties**: Processes legacy `<!-- comment -->` tags like `<!-- show-sidebar -->`, `<!-- add-breadcrumbs -->`, etc.

### 3.5.9 post_process_context()

This method (defined in `BaseTemplatePage` and extended in `TemplatePage`) finalizes the context:

1. **MetaTags**: Generates Open Graph and Twitter card tags from the context
2. **Base template**: Ensures a base template is set (defaults to `templates/base.html`)
3. **Title prefix**: Prepends the site-wide title prefix (e.g., "My Site - Contact Us")
4. **Website context hooks**: Calls any hooks registered under `update_website_context`
5. **User info**: Sets `fullname`, `user_image`, and `user` from the current session
6. **Sidebar and breadcrumbs**: Resolves sidebar items and breadcrumb parents
7. **Missing values**: Sets `canonical`, `url_prefix`, `path`, `pathname`

### 3.5.10 render_template()

The final step — the template is rendered through Jinja:

```python
def render_template(self):
    if self.context.safe_render is not None:
        safe_render = self.context.safe_render
    else:
        safe_render = True
    html = frappe.render_template(self.source, self.context, safe_render=safe_render)
    return html
```

By default, safe rendering is enabled. This means Jinja's `SandboxedEnvironment` is used, which restricts the template from accessing arbitrary Python objects (a security feature). If `safe_render` is explicitly set to `False`, the full Jinja environment is used.

### 3.5.11 update_toc()

After rendering, the HTML is post-processed to replace special markers:

- `{index}` — replaced with a table of contents generated from the page hierarchy
- `{next}` — replaced with a link to the next page in sequence

## 3.6 Stage 5: The Response

Back in `render()`:

```python
def render(self):
    html = self.get_html()
    html = self.add_csrf_token(html)
    return self.build_response(html)
```

1. Gets the rendered HTML (possibly from cache)
2. Injects the CSRF token JavaScript (if the user has an active session)
3. Builds a Werkzeug `Response` object with the HTML, status code, and content-type headers

The response is then returned up the call stack, through the WSGI handler, and finally to the web server which sends it to the browser.

## 3.7 The Caching Layer

The `@cache_html` decorator on `get_html()` enables page caching:

```python
@cache_html
def get_html(self):
    ...
```

Caching is controlled by:

- **no_cache context key**: If set to `1` or `True`, caching is disabled
- **Guest vs logged-in**: Guest pages are cached; logged-in pages are not (unless explicitly configured)
- **Language**: Cache keys include the language, so different language versions are cached separately

When cached, subsequent requests for the same URL (by the same type of user) are served the pre-rendered HTML without re-executing the controller or re-rendering the template.

## 3.8 Complete Flow Diagram

```
Browser Request: GET /contact
       │
       ▼
WSGI Handler (frappe.app)
  • Parse URL
  • Initialize DB connection
  • Authenticate session
  • Determine site
       │
       ▼
serve.get_response("/contact")
       │
       ▼
PathResolver("/contact")
  • Check 404 cache → miss
  • Check redirects → none
  • Resolve home page → not home
  • Try renderers:
    - Custom renderers → none
    - StaticPage → *.html not binary → skip
    - WebFormPage → no matching web form → skip
    - DocumentPage → no doctype match → skip
    - TemplatePage → can_render() → YES!
       │
       ▼
TemplatePage("/contact")
  • set_template_path() → finds frappe/www/contact.html
  • render()
       │
       ▼
  get_html()  [@cache_html]
    │
    ├── init_context()
    │   • get_website_settings() → navbar, footer, theme, boot data
    │
    ├── set_pymodule()
    │   • Finds frappe/www/contact.py
    │
    ├── update_context()
    │   • Sets page properties (route, template, name)
    │   • Loads module properties
    │   • Calls contact.py's get_context(context)
    │     → context now has query_options, parents, doc data
    │
    ├── setup_template_source()
    │   • Loads raw template from Jinja loader
    │   • Parses frontmatter (if any)
    │
    ├── load_colocated_files()
    │   • Checks for contact.js, contact.css → inlines them
    │
    ├── set_properties_from_source()
    │   • Extracts title, base_template from comments
    │
    ├── post_process_context()
    │   • Generates meta tags
    │   • Sets base template (templates/web.html → templates/base.html)
    │   • Sets title prefix
    │   • Adds user info
    │   • Resolves sidebar & breadcrumbs
    │
    ├── render_template()
    │   • Jinja renders contact.html with context
    │   • contact.html extends web.html, which extends base.html
    │
    └── update_toc()
        • Replaces {index}, {next} if present
       │
       ▼
  add_csrf_token(html)
       │
       ▼
  build_response(html) → Response(200, HTML)
       │
       ▼
WSGI Handler → Web Server → Browser
```

## 3.9 Summary

The request-to-response lifecycle is a pipeline with well-defined stages. Understanding this pipeline helps you know exactly where to add your code, how to override behavior, and how to optimize performance. The key takeaway is that every portal page goes through context initialization, controller execution, template rendering, and response building — and each stage is customizable.
