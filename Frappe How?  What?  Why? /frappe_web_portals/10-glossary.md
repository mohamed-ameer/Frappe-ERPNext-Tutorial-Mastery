# Chapter 10: Glossary

This glossary defines all critical concepts related to Frappe Web Portals. Terms are organized alphabetically within each category.

## Core Concepts

### Route
The URL path that identifies a page. In Frappe, the route is derived from the file path within the `www/` directory. For example, the file `www/about.html` has the route `/about`. Routes can also be dynamic (e.g., `/blog/<slug>`) when using Web Page doctypes with `dynamic_route=1`.

### Context
A Python dictionary (`frappe._dict`) that carries all data from the server to the Jinja template. The context is initialized by Frappe with website settings and site configuration, then augmented by the page's Python controller via `get_context()`. All keys in the context are available as variables in the Jinja template.

### Jinja
The templating engine used by Frappe to render portal pages. Jinja processes HTML templates with embedded variables (`{{ var }}`), control flow (`{% if %}`, `{% for %}`), and template inheritance (`{% extends %}`, `{% block %}`). Frappe uses Jinja's sandboxed environment by default for security.

### Controller
A Python file that accompanies an HTML template in the `www/` directory. The controller defines a `get_context(context)` function that populates the template context with data. Not all pages need a controller — static pages work with just an HTML file.

### Safe Render
A security feature that uses Jinja's `SandboxedEnvironment` to restrict what Python code can be executed inside templates. Safe rendering prevents access to dangerous operations like file I/O, subprocess execution, and arbitrary attribute access. It is enabled by default for portal pages.

### Website Generator
A DocType that automatically creates website pages for each of its records. The DocType must have `has_web_view = 1` and optionally `is_website_generator = 1`. Each record generates a page at its `route` field, and the DocType can define `get_context()` to provide data to the template.

### Static Page
A portal page that does not require a Python controller. It can be a simple `.html` file or a `.md` (Markdown) file in the `www/` directory. Static pages still go through Jinja processing and inherit the base template layout.

### Dynamic Page
A portal page that uses a Python controller to fetch data from the database, check permissions, or compute values before rendering. Dynamic pages have both an `.html` template and a `.py` controller in the `www/` directory.

## Rendering and Architecture

### Page Renderer
A class in Frappe's `website/page_renderers/` module that handles a specific type of page. Each renderer implements `can_render()` (to determine if it can handle a request) and `render()` (to produce the response). Examples include `TemplatePage`, `DocumentPage`, `StaticPage`, `ListPage`, and `NotFoundPage`.

### PathResolver
The decision engine that selects the correct page renderer for a given URL path. It tries each renderer in priority order and returns the first one that can handle the request. It also handles redirects, 404 caching, and home page resolution.

### BaseTemplatePage
The base class for all page renderers that use Jinja templates. It provides `init_context()` (populates context with website settings) and `post_process_context()` (finalizes context with meta tags, title prefix, user info, etc.).

### TemplatePage
The page renderer responsible for all file-based portal pages (files in `www/` and `templates/pages/`). It handles template path discovery, co-located Python module execution, co-located JS/CSS files, frontmatter parsing, Markdown conversion, and Jinja rendering.

### DocumentPage
The page renderer responsible for rendering individual documents from DocTypes with `has_web_view = 1`. It searches for matching documents by iterating over all web-view-enabled DocTypes and checking URL conditions.

### StaticPage Renderer
The page renderer responsible for serving binary files (images, PDFs, ZIPs, etc.) from the `www/` directory. It does not process files through Jinja; it serves them as raw binary responses.

### SSG vs SSR
- **SSG (Server-Side Generation)**: Pages are pre-rendered and cached. Frappe uses this for guest-accessible pages via the `@cache_html` decorator.
- **SSR (Server-Side Rendering)**: Pages are rendered on each request. Frappe uses this for user-specific pages where caching is disabled.

### Desk vs Portal
- **Desk**: Frappe's back-office interface. A single-page application (SPA) built with Vue.js. Requires authentication. Used for system administration.
- **Portal**: Frappe's public-facing website. Server-side rendered with Jinja. Can serve both public and authenticated users. Used for customer-facing content.

## Template System

### Template Inheritance
The mechanism by which a Jinja template extends a parent template, inheriting its structure while allowing specific blocks to be overridden. Frappe's inheritance chain is: `base.html` → `web.html` → your page template.

### Block
A named section in a Jinja template that can be overridden by child templates. Defined with `{% block name %}` and closed with `{% endblock %}`. Child templates use `{% extends %}` to inherit and override specific blocks.

### Frontmatter
YAML metadata at the top of a template file, delimited by `---` or `+++`. Frontmatter values are parsed and merged directly into the context. Example:
```
---
title: My Page
show_sidebar: true
---
```

### Macro
A reusable template fragment in Jinja, similar to a function. Defined with `{% macro name(args) %}` and invoked with `{{ name(args) }}`.

### Include
A Jinja directive that inserts the content of another template at the current position. Uses `{% include "path/to/template.html" %}`.

### Co-located Files
Files placed alongside an HTML template in the `www/` directory, with the same base name but different extensions. Supported types:
- `.py` — Python controller with `get_context()`
- `.js` — JavaScript inlined in the page
- `.css` — CSS inlined in the page

## Context Keys

### title
The page title displayed in the browser tab and HTML `<title>` tag. If the site has a `title_prefix`, it is automatically prepended.

### show_sidebar
A boolean that controls whether the page displays a sidebar. When enabled, the template renders a two-column layout with navigation.

### add_breadcrumbs
A boolean that enables breadcrumb navigation. When enabled, you should also set `parents` to define the breadcrumb trail.

### no_header
A boolean that hides the page header section. Useful for custom pages with their own heading.

### no_cache
A boolean that disables HTML caching for the page. Set this for pages that display user-specific or frequently changing data.

### full_width
A boolean that removes the Bootstrap container width constraint, allowing content to span the full browser width.

### safe_render
A boolean that controls whether Jinja's sandboxed environment is used. Default is `True`. Disable only when you need full Jinja power and trust the template source.

### sitemap
A boolean that controls whether this page appears in the sitemap XML. Set to `0` to exclude from search engine crawling.

### parents
A list of dictionaries defining the breadcrumb trail. Each item has `route` and `title` keys. The last item is the current page.

### base_template_path
The base template that this page extends. Default is `templates/web.html`. Can be overridden in the controller or frontmatter.

### metatags
A dictionary of HTML meta tags for SEO, including Open Graph (`og:`) and Twitter Card (`twitter:`) tags. Automatically generated from the context.

### theme
The active Website Theme document's properties, available as a `frappe._dict`. Contains `theme_url`, `custom`, `js`, and all theme configuration fields.

## Caching

### HTML Page Cache
Frappe caches the rendered HTML of portal pages using the `@cache_html` decorator. The cache key includes the path, language, and user type (guest vs. logged-in). Cache is invalidated when the page is cleared or website settings change.

### Routing Cache
The page routing table (mapping URLs to files) is cached to avoid repeated filesystem scans. Invalidated during migrations or explicit cache clearing.

### 404 Cache
Non-existent paths are cached as 404 to prevent repeated lookups. This improves performance for bots scanning for non-existent pages.

### Cache Key
The unique identifier for a cached item. For portal pages, the key includes the page path, language code, and whether the user is a guest.

## Theme System

### Website Theme
A Doctype that stores theme configuration including fonts, colors, button styles, custom SCSS, and JavaScript. When saved, Frappe compiles the SCSS to CSS and stores the output file.

### Color Doctype
A simple doctype that maps a color name to a hex value (e.g., `"My Dark Primary" → "#6C5CE7"`). Website Themes reference colors by linking to Color records.

### theme_url
A read-only field on the Website Theme doctype. It contains the URL to the compiled CSS file (e.g., `/files/website_theme/my_dark_abc123.css`).

### theme_scss
A read-only field that displays the generated SCSS code before compilation. Useful for debugging.

### Standard Theme
The default theme shipped with Frappe. It is defined as a JSON file on disk (not in the database) and serves as the fallback when no custom theme is selected.

### Custom SCSS
A field on the Website Theme where you can write additional SCSS rules that are appended to the generated stylesheet. This is where most theme customization happens.

### Custom Overrides
A field for Bootstrap variable overrides. These are placed before the app SCSS imports, allowing you to override Bootstrap default variables.

### SCSS Compilation
The process of converting SCSS (Sassy CSS) to standard CSS. Frappe uses a Node.js script (`generate_bootstrap_theme.js`) with Dart Sass to perform this compilation.

### get_active_theme()
A function in `website_theme.py` that loads the currently active Website Theme document based on the `website_theme` field in Website Settings.

### Google Font
A field on the Website Theme that specifies a Google Font to load from Google Fonts CDN. The font is automatically imported and set as the primary font family.

### Font Properties
A field on the Website Theme that specifies which font weights to load (e.g., `wght@300;400;500;600;700;800`).

## File and Folder Structure

### www/
The primary directory for portal page files. Every file placed here becomes accessible as a web page. The directory structure mirrors the URL structure.

### templates/pages/
An alternative directory for portal page files. Searched after `www/`. Some apps use this for organizational purposes.

### templates/base.html
The root HTML template that defines the complete HTML5 document structure, including doctype, head, body, navbar, footer, and script loading.

### templates/web.html
The standard page layout template that extends `base.html`. It adds breadcrumbs, sidebar support, and the page content container.

### templates/includes/
A directory of reusable template partials including head, navbar, footer, breadcrumbs, sidebar, macros, and web blocks.

### website_theme_template.scss
A Jinja template (not a regular SCSS file) that generates the theme SCSS. It includes Google Font import, Bootstrap variable overrides, app SCSS imports, custom SCSS, and CSS custom properties.

## Request Lifecycle

### WSGI
Web Server Gateway Interface — the standard interface between Python web applications and web servers. Frappe implements WSGI to handle incoming HTTP requests.

### Path Resolution
The process of determining which renderer and template to use for a given URL path. Handled by the `PathResolver` class.

### Render
The process of producing an HTTP response. For template-based pages, this involves context initialization, controller execution, Jinja rendering, and response building.

### Response
A Werkzeug `Response` object containing the HTTP status code, headers, and body (usually HTML). Returned by the renderer and sent to the browser.

### CSRF Token
Cross-Site Request Forgery protection token. Injected into every portal page for logged-in users via `add_csrf_token()`. Used by JavaScript when making POST/PUT/DELETE requests.

## Hooks

### website_context
A hook that allows setting default context values for all portal pages. Values set here are available in every page's context.

### update_website_context
A hook that registers callback functions which modify the context after initialization. Each callback receives the context and can add or modify values.

### www_renderer_classes
A hook to register custom page renderer classes. Custom renderers are tried before built-in renderers, allowing complete control over page handling.

### web_include_js
A hook to include JavaScript files on all portal pages. Values are asset paths resolved by Frappe's asset system.

### web_include_css
A hook to include CSS files on all portal pages.

### website_redirects
A hook to define URL redirect rules. Each rule maps a source path to a target URL with an HTTP status code (301 or 302).

### base_template
A hook to override the default base template path (default: `templates/base.html`).

## Miscellaneous

### frappe.form_dict
A dictionary of URL query parameters or POST form data. Available in both controllers and templates. Access values with `frappe.form_dict.get("key")`.

### frappe.session
The current user's session object. Key properties: `frappe.session.user` (username or "Guest"), `frappe.session.data` (session data dict), `frappe.session.full_name`.

### frappe.respond_as_web_page()
A utility function for generating simple web pages programmatically. Used in controllers that want to display a message, confirmation, or error without a dedicated template.

### Website Settings
A single-document Doctype that stores site-wide configuration for the portal, including navigation, branding, banner, footer, social sharing, theme selection, and SEO settings.

### Web Page
A Doctype that allows creating portal pages from the UI without writing code. Supports dynamic routes, custom templates, and embedded content. Web pages are rendered by the `DocumentPage` renderer.

### Web Form
A Doctype that creates data-entry forms on the portal. Web forms can be published and accessed by guests or logged-in users. They have their own renderer (`WebFormPage`).

### Website Sidebar
A Doctype that defines sidebar navigation menus. Can be assigned to specific pages or used as a default sidebar across the site.

### _sidebar.json
A JSON file placed in a directory to define sidebar items for that section of the site. An alternative to the Website Sidebar doctype.

### benach clear-cache
A bench command that clears all Frappe caches, including the routing cache, HTML cache, and theme cache. Useful during development after making changes to portal pages or themes.
