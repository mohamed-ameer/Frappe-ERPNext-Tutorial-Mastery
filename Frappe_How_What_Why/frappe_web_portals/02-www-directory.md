# Chapter 2: The www Directory — Structure and Routing

## 2.1 What is the www Directory?

The `www/` directory is the most important folder for portal development in Frappe. It is the document root for your website. Every file placed inside this folder becomes accessible as a web page. It is Frappe's equivalent of the `public/` or `htdocs/` folder in traditional web servers.

Every Frappe app can have its own `www/` directory. When a request comes in, Frappe searches all installed apps (in reverse priority order) for a matching file. This means:

- The last installed app's `www/` takes highest priority
- Apps installed earlier have lower priority
- The core `frappe` app itself has the lowest priority

This priority system is what allows you to **override** standard pages. If you create a file `my_custom_app/www/about.html`, your version will be served instead of `frappe/www/about.html`.

## 2.2 Simple File-to-URL Mapping

The mapping from file to URL is intuitive and rule-based. Let us look at the simplest case first.

### 2.2.1 HTML Files

If you create a file at `your_app/www/hello.html`, it becomes accessible at:

```
https://example.com/hello
```

The `.html` extension is stripped. The file name becomes the URL path. The content of the HTML file is rendered as a Jinja template and served to the browser.

Example: `your_app/www/hello.html`

```html
<h1>Hello, World!</h1>
<p>Welcome to my portal page.</p>
```

This page will be served at `/hello`. It will automatically inherit the standard Frappe website layout (navbar, footer, base styling) because of the template inheritance system we will discuss in Chapter 4.

### 2.2.2 Markdown Files

If you create a file at `your_app/www/hello.md`, it also becomes accessible at `/hello`. The Markdown content is automatically converted to HTML using Frappe's Markdown renderer.

Example: `your_app/www/hello.md`

```markdown
# Hello, World!

Welcome to my portal page. This is written in **Markdown**.
```

The output will be the rendered HTML wrapped in a `<div class="from-markdown">` container. It also inherits the standard layout automatically.

### 2.2.3 Static Pages: HTML Without Jinja

If you do not need any dynamic data and want a pure HTML file (not processed through Jinja), you can still create `.html` files. However, by default, all `.html` files in the `www/` folder are processed as Jinja templates. If you want to bypass Jinja processing, you can use a raw HTML file that does not contain any Jinja syntax, and it will still work — the Jinja engine will simply pass it through unchanged.

## 2.3 Nested Routes and Subdirectories

URLs can have multiple path segments. Frappe maps these to subdirectories inside `www/`.

### 2.3.1 Files in Subdirectories

A file at `your_app/www/blog/my-post.html` becomes accessible at:

```
https://example.com/blog/my-post
```

The directory structure mirrors the URL structure exactly.

### 2.3.2 Index Files

When a URL path ends without a file name, Frappe looks for an `index` file. For example, accessing `/blog` will cause Frappe to look for:

1. `www/blog.html`
2. `www/blog.md`
3. `www/blog/index.html`
4. `www/blog/index.md`

The search order is always: exact filename → `.html` → `.md` → `/index.html` → `/index.md`.

This means you can create a directory `/blog/` with an `index.html` inside it to represent the `/blog` URL. This is especially useful when a section of your site has multiple pages.

Example structure:
```
your_app/www/
  blog/
    index.html        → /blog
    my-first-post.html → /blog/my-first-post
    my-second-post.html → /blog/my-second-post
```

### 2.3.3 Dynamic Route Segments

While the `www/` directory itself does not support dynamic segments directly (like `/blog/<slug>`), Frappe supports dynamic routes through the **Web Page** doctype (with `dynamic_route=1`) and through **Web Forms**. These dynamic routes are resolved at a higher level by the `DocumentPage` and `WebFormPage` renderers, which we will discuss in Chapter 7.

However, you can also handle dynamic behavior inside a single controller file. For example, a single `www/profile.py` controller can read `frappe.form_dict.name` to display different user profiles. The URL might be `/profile?name=john`, or you can use Frappe's dynamic route mechanism to make it `/profile/john`.

## 2.4 Co-located Files: JS, CSS, and Python

For any `.html` file in the `www/` directory, you can place additional files with the same base name but different extensions. Frappe will automatically discover and use them.

### 2.4.1 Python Controllers (get_context)

The most important co-located file is the `.py` file. If `www/my-page.html` exists, Frappe will look for `www/my-page.py` and import it as a Python module. If it defines a function `get_context(context)`, that function will be called to populate the template context.

Example: `www/dashboard.html` + `www/dashboard.py`

The Python controller is how you make dynamic pages — pages that fetch data from the database, check permissions, or perform calculations.

We will cover `get_context` in extensive detail in Chapter 5.

### 2.4.2 JavaScript Files

If you place a `www/my-page.js` alongside `www/my-page.html`, its contents will be automatically injected into the page inside a `<script>` tag. This is called a **co-located JS file**. The content is inlined directly into the HTML, not loaded as a separate file.

However, if your template already defines a `{% block script %}` block, the co-located JS file will be ignored (the block takes precedence).

### 2.4.3 CSS Files

Similarly, a `www/my-page.css` file placed alongside the HTML template will be inlined inside a `<style>` tag in the page `<head>`. This is overridden if the template defines a `{% block style %}` block.

## 2.5 Real Directory Structure Examples

Let us look at the actual `www/` directory of the core `frappe` app to see real-world patterns:

```
frappe/www/
  __init__.py           (empty, marks as Python package)
  404.html              → /404
  404.py                → Controller for 404 page
  about.html            → /about
  about.py              → Controller for about page
  login.html            → /login
  login.py              → Controller for login page
  me.html               → /me (user profile)
  me.py                 → Controller for profile
  search.html           → /search
  search.py             → Controller for search
  contact.html          → /contact
  contact.py            → Controller for contact
  list.html             → /list (generic DocType list view)
  list.py               → Controller for list
  robots.txt            → /robots.txt (static text file)
  sitemap.xml           → /sitemap.xml (generated XML)
  sitemap.py            → Controller for sitemap generation
  rss.xml               → /rss.xml
  rss.py                → Controller for RSS generation
  app.html              → /app (boots the Desk SPA)
  app.py                → Controller for desk boot
  error.html            → /error
  error.py              → Controller for error page
  message.html          → /message
  message.py            → Controller for message page
  printview.html        → /printview
  printview.py          → Controller for print
  billing.py            → Controller (no HTML; generates response directly)
```

Notice some patterns:
- Some pages have both `.html` and `.py` (dynamic pages like about, login, me)
- Some pages have only `.py` and generate responses programmatically (billing, robots, sitemap)
- Some have only `.html` (static content)
- Some pages generate non-HTML responses like XML (sitemap, rss)

## 2.6 How Overriding Works

One of the most powerful features of the `www/` system is that you can **override** any standard page by placing a file with the same path in your custom app's `www/` directory.

Since Frappe searches installed apps in reverse order (last installed app first), your custom app's files take priority over the core `frappe` app's files.

For example, to override the login page:

1. Create `your_custom_app/www/login.html`
2. Create `your_custom_app/www/login.py` (optional)
3. Your version will now be served at `/login`

You do not need to modify any configuration, hooks, or settings. The file system alone determines which version of a page is served.

The same applies to nested paths. To override the blog index, create `your_custom_app/www/blog/index.html`.

## 2.7 The templates/pages Directory

In addition to the `www/` folder, Frappe also searches the `templates/pages/` folder inside each app. This is an alternative location for page files that some apps use for organizational purposes. The same file mapping rules apply. The search order for renderable pages is defined in the `get_start_folders()` function:

```python
def get_start_folders():
    return frappe.local.flags.web_pages_folders or ("www", "templates/pages")
```

The `www` folder is always searched first; `templates/pages` is the fallback.

## 2.8 What Happens When There is No Match

If no file matches the requested URL path, Frappe does not immediately return a 404. Instead, the `PathResolver` tries several other strategies (in order):

1. **StaticPage renderer** — Checks if the path points to a binary file (image, PDF, zip) in the `www/` folder
2. **WebFormPage renderer** — Checks if the path matches a published Web Form
3. **DocumentPage renderer** — Checks if the path matches a DocType with `has_web_view=1` or a `Web Page` with `dynamic_route=1`
4. **TemplatePage renderer** — The one we have been discussing (searches `www/` and `templates/pages/`)
5. **ListPage renderer** — Checks if the path is a valid DocType name that has web view enabled
6. **PrintPage renderer** — Checks if the path matches a `doctype/name` pattern for printing

If all of these fail, the **NotFoundPage** renderer returns a 404 response.

This layered approach means you can create both simple file-based pages and complex database-driven pages, all under the same URL space.

## 2.9 Summary

The `www/` directory is the foundation of Frappe's portal page system. By understanding how file names map to URLs, how co-located files work, and how overrides take priority, you have already mastered the most important concepts. In the next chapter, we will trace the complete journey of a request from the browser to the rendered HTML page.
