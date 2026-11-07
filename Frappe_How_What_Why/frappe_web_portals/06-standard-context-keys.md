# Chapter 6: Standard Context Keys Reference

The context dictionary is the communication channel between your Python controller and your Jinja template. Frappe pre-populates it with many standard keys, and you can add your own. This chapter documents every standard context key, explaining what it does and how to use it.

## 6.1 Navigation and Layout Keys

### title

**Type:** `string`  
**Purpose:** Sets the browser tab title and the HTML `<title>` tag.

If the site has a `title_prefix` configured in Website Settings, it is automatically prepended:

```
<title>My Site - About Us</title>
```

Set in controller:
```python
context.title = "About Us"
```

Set in frontmatter:
```
---
title: About Us
---
```

### show_sidebar

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** When set to `True`, the page displays a sidebar. The sidebar is rendered from the `website_sidebar` field of the context.

```python
context.show_sidebar = True
```

The sidebar is populated from the `Website Sidebar` doctype or from a `_sidebar.json` file in the page's directory.

### sidebar_right

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** When `show_sidebar` is enabled, this places the sidebar on the right side instead of the left.

### website_sidebar

**Type:** `string`  
**Purpose:** The name of the `Website Sidebar` doctype to use for this page's sidebar. If not set, Frappe looks for a `_sidebar.json` file or uses the default sidebar.

### add_breadcrumbs

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** Enables breadcrumb navigation at the top of the page. When enabled, you should also set `parents` to define the breadcrumb trail.

```python
context.add_breadcrumbs = True
context.parents = [
    {"route": "/", "title": "Home"},
    {"route": "/products", "title": "Products"}
]
```

### parents

**Type:** `list` of `dict`  
**Purpose:** The breadcrumb trail. Each item should have `route` and `title`.

```python
context.parents = [
    {"route": "/", "title": _("Home")},
    {"route": "/account", "title": _("My Account")},
]
```

The last item (current page) is automatically displayed as the active page without a link.

### no_header

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** Hides the page header (the title area at the top of the content). Useful for pages that have their own custom heading.

```python
context.no_header = True
```

### no_breadcrumbs

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** Hides breadcrumbs even if they would otherwise be shown.

### hide_login

**Type:** `bool` or `int` (0/1)  
**Default:** `False` (set by Website Settings)  
**Purpose:** Hides the login button in the navbar.

### full_width

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** Removes the container width constraint, allowing the page content to span the full browser width. Normally, pages are wrapped in a Bootstrap `container` class.

```python
context.full_width = True
```

## 6.2 Caching and Performance Keys

### no_cache

**Type:** `bool` or `int` (0/1)  
**Default:** `False`  
**Purpose:** Disables HTML caching for this page. Set this for pages that display user-specific or frequently changing data.

```python
context.no_cache = 1
```

When `no_cache` is set, every request will execute `get_context` and render the template from scratch.

### safe_render

`safe_render` is a context variable that controls whether Jinja template rendering enforces security restrictions to prevent server-side scripting attacks.

How It Works

When `safe_render`=True, the `render_template` function checks for the string `.__` in the template and throws an error if found, preventing access to private attributes via double underscore methods.

Example:

```python
# In a template file
{{ user.__class__ }}  # Throws error when safe_render=True

# In controller to disable security
context.safe_render = False
```

Security Behavior:

The test cases demonstrate the difference:

1. With `safe_render=True`: Templates containing `.__` are rejected, showing "Show Error" instead of rendering the content test_website.py:348-356
2. With `safe_render=False`: Templates can access private attributes like test.__test and render normally test_website.py:353-356

Notes:

This security measure works alongside the `FrappeSandboxedEnvironment` which uses `RestrictedPython` to limit access to unsafe attributes during template rendering. jinja.py:48-53 The `safe_render` check provides an additional layer of protection specifically against double underscore attribute access patterns.

**Type:** `bool` or `int` (0/1)  
**Default:** `True`  
**Purpose:** Controls whether Jinja's sandboxed environment is used. When `True`, template code is restricted from accessing arbitrary Python objects. Disable only when you need full Jinja power in templates and trust the template source.

```python
# Disable sandboxing (use with caution!)
context.safe_render = False
```

## 6.3 SEO and Content Discovery Keys

### sitemap

**Type:** `bool` or `int` (0/1)  
**Default:** `True` (inferred)  
**Purpose:** Controls whether this page appears in the sitemap XML. Set to `0` to exclude from sitemap and search engine crawling.

```python
context.sitemap = 0
```

### canonical

**Type:** `string` (URL)  
**Purpose:** The canonical URL for this page. Automatically set from the request path, but you can override it.

```python
context.canonical = frappe.utils.get_url("/my-canonical-path")
```

### robots

**Type:** `string`  
**Purpose:** Custom robots.txt rule for this page's robots header.

## 6.4 Appearance and Branding Keys

### favicon

**Type:** `string` (URL)  
**Default:** `/assets/frappe/images/frappe-favicon.svg`  
**Purpose:** URL to the favicon displayed in browser tabs.

### banner_html

**Type:** `string` (HTML)  
**Purpose:** HTML for an announcement banner displayed at the top of the page.

### banner_image

**Type:** `string` (URL)  
**Purpose:** Image URL for a banner image.

### brand_html

**Type:** `string` (HTML)  
**Purpose:** HTML for the brand text/logo in the navbar.

### head_html

**Type:** `string` (HTML)  
**Purpose:** Additional HTML to inject into the `<head>` section. Useful for custom meta tags, analytics scripts, etc.

```python
context.head_html = '<meta name="custom" content="value">'
```

### body_include

**Type:** `string` (HTML)  
**Purpose:** HTML to inject at the end of the `<body>` section.

### footer_powered

**Type:** `string` (HTML)  
**Default:** Frappe's default powered-by notice  
**Purpose:** Custom footer attribution HTML.

## 6.5 JavaScript and CSS Keys

### colocated_js

**Type:** `string` (JavaScript code)  
**Purpose:** Automatically set when a `.js` file exists alongside the template. The JavaScript is inlined in a `<script>` tag.

### colocated_css

**Type:** `string` (CSS code)  
**Purpose:** Automatically set when a `.css` file exists alongside the template. The CSS is inlined in a `<style>` tag.

### web_include_js

**Type:** `list` of `string`  
**Purpose:** List of JavaScript asset paths to include on this page. Set globally via hooks or per-page in the controller.

### web_include_css

**Type:** `list` of `string`  
**Purpose:** List of CSS asset paths to include on this page.

### web_include_icons

**Type:** `list` of `string`  
**Purpose:** List of icon sets to include.

## 6.6 Page Metadata Keys

### route

**Type:** `string`  
**Purpose:** The current page route (e.g., `/about`). Automatically set.

### path

**Type:** `string`  
**Purpose:** Alias for `route`. Automatically set.

### pathname

**Type:** `string`  
**Purpose:** The current URL path, as understood by the framework. Automatically set.

### name

**Type:** `string`  
**Purpose:** The page name (filename without extension). Automatically set.

### template

**Type:** `string`  
**Purpose:** The template file path (e.g., `www/about.html`). Automatically set.

### base_template_path

**Type:** `string`  
**Default:** `templates/web.html`  
**Purpose:** The base template that this page extends. Can be overridden.

```python
# Use a custom layout
context.base_template_path = "templates/landing_page.html"
```

### base_template

**Type:** `string`  
**Purpose:** Alias for `base_template_path`. Set automatically.

### metatags

**Type:** `dict`  
**Purpose:** Automatically generated dictionary of meta tags for SEO (Open Graph, Twitter Cards). Includes `title`, `description`, `image`, `url`, `type`, `twitter:card`, `og:title`, etc.

### language

**Type:** `string`  
**Purpose:** The current language code (e.g., `en`, `fr`, `de`). Used for translation and HTML `lang` attribute.

### boot

**Type:** `dict`  
**Purpose:** Boot data containing system configuration, language settings, and user information. Injected into JavaScript as `frappe.boot`.

### theme

**Type:** `frappe._dict`  
**Purpose:** The active Website Theme document's properties. Contains `theme_url`, `custom`, `js`, and all theme configuration fields. Used by `head.html` to include the theme's CSS file.

### developer_mode

**Type:** `bool`  
**Purpose:** Whether the site is in developer mode. Can be used to show debug information.

```jinja
{% if developer_mode %}
    <div class="alert alert-info">Debug info: {{ context | pprint }}</div>
{% endif %}
```

## 6.7 User and Session Keys

### user

**Type:** `string`  
**Purpose:** The current user's username (e.g., `Administrator` or `guest@example.com`). Set automatically.

### fullname

**Type:** `string`  
**Purpose:** The current user's full name. Set automatically.

### user_image

**Type:** `string` (URL)  
**Purpose:** URL to the current user's avatar/image. Set automatically.

### frappe.session

**Type:** Session object (available as a Jinja global)  
**Purpose:** The current user session. Access `frappe.session.user`, `frappe.session.data`, etc.

### frappe.form_dict

**Type:** `dict` (available as a Jinja global)  
**Purpose:** URL query parameters (`?key=value`). Also contains POST data for form submissions.

## 6.8 Content and Data Keys

### doc

**Type:** `frappe.model.document.Document`  
**Purpose:** When rendering a web view of a DocType (via DocumentPage renderer), this is the actual document being displayed. For file-based pages, you can set it manually.

### page_toc_html

**Type:** `string` (HTML)  
**Purpose:** Table of contents HTML, generated automatically for Markdown pages. Contains links to all headings in the page.

### content_type

**Type:** `string`  
**Purpose:** The MIME content type of the response. Defaults to `text/html`.

### http_status_code

**Type:** `int`  
**Default:** `200`  
**Purpose:** The HTTP status code for the response. Set to `404`, `403`, `500`, etc., to return different status codes.

```python
context.http_status_code = 404
```

### build_version

**Type:** `string`  
**Purpose:** The current build version string. Can be used for cache busting.

## 6.9 Website Settings Keys

These keys are automatically populated from the Website Settings doctype and are available in every page's context:

| Key | Source | Purpose |
|-----|--------|---------|
| `top_bar_items` | Website Settings | Navbar link items |
| `footer_items` | Website Settings | Footer link items |
| `post_login` | System | Post-login menu items (My Account, Log out) |
| `copyright` | Website Settings | Footer copyright text |
| `disable_signup` | Website Settings | Whether to disable self-signup |
| `hide_footer_signup` | Website Settings | Hide footer signup form |
| `navbar_search` | Website Settings | Show search in navbar (bool) |
| `enable_view_tracking` | Website Settings | Track page views (bool) |
| `show_language_picker` | Website Settings | Show language switcher (bool) |
| `call_to_action` | Website Settings | CTA button text |
| `call_to_action_url` | Website Settings | CTA button URL |
| `read_only_mode` | System | Site is in read-only mode (bool) |
| `footer_address` | Website Settings | Address in footer |

## 6.10 Complete Context Summary

When a page renders, the context is the union of:

1. **Default values** from `BaseTemplatePage.init_context()` (website settings, theme, boot data)
2. **Page properties** from `TemplatePage.set_page_properties()` (route, name, template, basepath)
3. **Module properties** from the `.py` controller module (base_template_path, no_cache, etc.)
4. **get_context() additions** from the controller function
5. **Frontmatter** from the template file
6. **Source properties** extracted from the template (title, base template comment)
7. **Post-processed values** from `post_process_context()` (meta tags, title prefix, canonical, user info, sidebar, breadcrumbs)
8. **Co-located files** (colocated_js, colocated_css)
9. **Hooks** from `update_website_context` hooks

This layered approach means you can set a key in any of these layers, and the last one to be set wins. Understanding this layering is key to debugging why a particular context value is (or is not) appearing in your template.
