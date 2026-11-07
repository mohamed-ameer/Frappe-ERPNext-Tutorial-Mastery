# Chapter 4: Jinja Templating in Portal Pages

## 4.1 What is Jinja?

Jinja is a modern, designer-friendly templating engine for Python. It is the default templating engine in Frappe and is used to render all portal pages. A Jinja template is a text file (usually HTML) that contains variables, expressions, and control flow constructs that are evaluated and replaced with actual values when the template is rendered.

In Frappe, every `.html` and `.md` file in the `www/` directory is a Jinja template. When a page is requested, Frappe compiles the template, injects the context data, and produces the final HTML.

## 4.2 Template Inheritance Hierarchy

Frappe's portal templates follow a three-level inheritance hierarchy:

```
base.html (root template)
    ↑
web.html (standard page layout)
    ↑
your-page.html (your content)
```

### 4.2.1 The base.html Template

Located at `frappe/templates/base.html`, this is the root HTML document. It defines the complete HTML5 page structure:

```html
<!DOCTYPE html>
<html lang="{{boot.lang}}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}{{ title | striptags }}{% endblock %}</title>
    {% block head %}{% include "templates/includes/head.html" %}{% endblock %}
    {% block style %}{% if colocated_css %}<style>{{ colocated_css }}</style>{% endif %}{% endblock %}
</head>
<body>
    {% block banner %}{% endblock %}
    {% block navbar %}{% endblock %}
    {% block content %}{{ content }}{% endblock %}
    {% block footer %}{% endblock %}
    {% block base_scripts %}{% endblock %}
    {% block script %}{% endblock %}
</body>
</html>
```

Key things `base.html` provides:

- **HTML5 doctype and language** from boot context
- **Meta tags block** (includes Open Graph, Twitter cards)
- **Title block** — defaults to `{{ title }}`
- **Favicon** from website settings
- **Head block** — includes theme CSS or default website bundle
- **Style block** — for co-located CSS or page-specific styles
- **Banner block** — displays announcement banners
- **Navbar block** — renders the navigation bar
- **Content block** — the main content area
- **Footer block** — renders the footer
- **Scripts** — loads Frappe JS bundle, CSRF token, co-located JS
- **Inline SVG icons** from Frappe's icon sets

### 4.2.2 The web.html Template

Located at `frappe/templates/web.html`, this extends `base.html` and adds the standard page chrome — breadcrumbs, sidebar support, and the content container:

```jinja
{% extends base_template_path %}

{% block content %}
<div class="page-content-wrapper">
    <div class="page-breadcrumbs">
        {% block breadcrumbs %}
            {% include 'templates/includes/breadcrumbs.html' %}
        {% endblock %}
    </div>
    <main class="{% if not full_width %}container my-4{% endif %}">
        <div class="page-header-wrapper">
            <div class="page-header">
                {% block header %}{% endblock %}
            </div>
        </div>
        <div class="page_content">
            {% block page_content %}{% endblock %}
        </div>
    </main>
</div>
{% endblock %}
```

The `web.html` template is the default `base_template_path` for all portal pages. Unless you specify a different base template in your controller or frontmatter, your page content will be wrapped in `web.html`'s layout.

If `show_sidebar` is `True` in the context, `web.html` renders a two-column layout with the sidebar on the left (or right, if `sidebar_right` is set).

### 4.2.3 Your Page Template

Your page template (e.g., `www/contact.html`) typically only needs to define the content inside the `page_content` block:

```jinja
{% block page_content %}
<h1>Contact Us</h1>
<form>
    <!-- your form fields -->
</form>
{% endblock %}
```

Because it extends `web.html`, it automatically gets the navbar, footer, breadcrumbs, theme styling, and all other standard page elements.

## 4.3 Template Inheritance Syntax

### 4.3.1 Extends

The `{% extends %}` tag tells Jinja that this template inherits from another template:

```jinja
{% extends "templates/web.html" %}
```

When using `extends`, the child template defines blocks that replace the corresponding blocks in the parent template. If a block is not defined in the child, the parent's block content is used.

### 4.3.2 Blocks

Blocks are defined with `{% block name %}` and `{% endblock %}`:

```jinja
{% block page_content %}
    <h1>My Custom Content</h1>
{% endblock %}
```

You can call the parent's block content using `{{ super() }}`:

```jinja
{% block head %}
    {{ super() }}
    <link rel="stylesheet" href="/assets/css/custom.css">
{% endblock %}
```

### 4.3.3 Variables

Variables are enclosed in `{{ }}`:

```jinja
<h1>{{ title }}</h1>
<p>Welcome, {{ fullname }}</p>
```

Variables come from the context dictionary prepared by `get_context()` and the standard Frappe context.

### 4.3.4 Filters

Variables can be modified by filters, specified after a pipe `|`:

```jinja
{{ title | striptags }}        <!-- Remove HTML tags -->
{{ name | upper }}              <!-- Convert to uppercase -->
{{ created | date }}            <!-- Format date -->
{{ description | truncate(100) }} <!-- Truncate to 100 chars -->
{{ price | flt(2) }}            <!-- Format as float with 2 decimals -->
{{ html | safe }}               <!-- Mark as safe HTML (do not escape) -->
```

### 4.3.5 Control Flow

**Conditionals:**

```jinja
{% if frappe.session.user != "Guest" %}
    <p>Welcome back, {{ fullname }}!</p>
{% else %}
    <a href="/login">Login</a>
{% endif %}
```

**Loops:**

```jinja
<ul>
{% for item in items %}
    <li>{{ item.name }} — {{ item.amount | flt(2) }}</li>
{% endfor %}
</ul>
```

**Loops with special variables:**

```jinja
{% for item in items %}
    {% if loop.first %}<ol>{% endif %}
    <li>{{ loop.index }}. {{ item }}</li>
    {% if loop.last %}</ol>{% endif %}
{% else %}
    <p>No items found.</p>
{% endfor %}
```

## 4.4 Frappe-Specific Jinja Globals

Frappe injects several objects and functions into the Jinja environment, making them available in every template without needing to be passed through context:

### 4.4.1 frappe Object

The entire `frappe` module is available as a global. You can access:

```jinja
{{ frappe.session.user }}              <!-- Current username or "Guest" -->
{{ frappe.form_dict.key }}             <!-- URL query parameters -->
{{ frappe.request.method }}            <!-- HTTP method -->
{{ frappe.get_doc("DocType", name) }}  <!-- Fetch a document -->
{{ frappe.db.get_value("DocType", name, "field") }}  <!-- Quick field lookup -->
{{ frappe.db.get_all("DocType", filters={}) }}  <!-- List records -->
{{ frappe.get_url("/some-path") }}     <!-- Get full URL -->
```

### 4.4.2 _() Translation Function

The underscore function marks strings for translation:

```jinja
<h1>{{ _("Welcome to our Portal") }}</h1>
<p>{{ _("Hello {0}, you have {1} new messages.").format(name, count) }}</p>
```

### 4.4.3 URL Helpers

```jinja
{{ abs_url("/about") }}     <!-- Convert relative URL to absolute -->
{{ get_url("/about") }}     <!-- Same as abs_url -->
```

### 4.4.4 Asset Helpers

```jinja
{{ include_style("website.bundle.css") }}   <!-- Include a CSS bundle -->
{{ include_script("frappe-web.bundle.js") }} <!-- Include a JS bundle -->
```

### 4.4.5 Web Block Helper

Frappe provides a `web_block()` function to render reusable web template blocks:

```jinja
{{ web_block("Hero Slider", values={"slides": slides}, add_container=1) }}
```

### 4.4.6 Other Helpers

```jinja
{{ get_doc("About Us Settings") }}         <!-- Fetch a single doctype -->
{{ get_meta("DocType") }}                   <!-- Get metadata for a doctype -->
{{ get_fullname() }}                        <!-- Current user full name -->
{{ get_gravatar(email) }}                   <!-- Gravatar URL -->
{{ days_to_ago(date) }}                     <!-- "3 days ago" format -->
{{ comment_widget(docname) }}               <!-- Render comment widget -->
```

## 4.5 Frontmatter

Templates can include YAML frontmatter at the top, delimited by `---` or `+++`. Frontmatter values are merged directly into the context.

```
---
title: My Custom Page
show_sidebar: true
no_header: true
---
<h1>{{ title }}</h1>
```

This is equivalent to setting those values in your `get_context()` function. Frontmatter is especially useful for simple pages that do not need a Python controller.

## 4.6 Custom Base Templates

By default, every page uses `web.html` (which extends `base.html`). You can change this:

**In the Python controller:**

```python
def get_context(context):
    context.base_template_path = "templates/my_layout.html"
```

**In the template frontmatter:**

```
---
base_template_path: templates/my_layout.html
---
```

**Via HTML comment (legacy):**

```html
<!-- base_template: templates/my_layout.html -->
```

If you set `base_template_path` to a custom template, you gain full control over the page structure. For instance, you might create a minimal template without navbar or footer for landing pages or embedded content.

## 4.7 Comment-Based Properties (Legacy)

Frappe supports setting page properties via HTML comments in the template:

```html
<!-- title: Custom Page Title -->
<!-- show-sidebar -->
<!-- add-breadcrumbs -->
<!-- no-header -->
<!-- no-cache -->
<!-- no-sitemap -->
<!-- sitemap -->
```

These are legacy features. The modern approach is to use frontmatter or set these keys in `get_context()`. These comment-based properties are deprecated and will be removed in future versions.

## 4.8 Safe Rendering

By default, Frappe uses Jinja's `SandboxedEnvironment` for rendering templates. This restricts what Python code can be executed inside the template. The sandbox prevents access to:

- Module imports
- File operations
- Subprocess execution
- Arbitrary Python object attributes

This is a security feature. If a template is defined by untrusted users (e.g., via Web Page doctype), sandboxing prevents them from executing arbitrary code on the server.

To disable safe rendering for a specific page (use with caution):

```python
def get_context(context):
    context.safe_render = False
```

## 4.9 Macros and Includes

### 4.9.1 Macros

Macros are reusable template fragments, similar to functions:

```jinja
{% macro card(title, content) %}
<div class="card">
    <div class="card-body">
        <h5 class="card-title">{{ title }}</h5>
        <p class="card-text">{{ content }}</p>
    </div>
</div>
{% endmacro %}

{{ card("Hello", "World") }}
{{ card("Foo", "Bar") }}
```

### 4.9.2 Includes

The `{% include %}` directive inserts the content of another template:

```jinja
{% include "templates/includes/breadcrumbs.html" %}
```

### 4.9.3 Importing Macros

You can import macros from other templates:

```jinja
{% import "templates/includes/macros.html" as macros %}
{{ macros.card("Title", "Content") }}
```

## 4.10 Working with Forms

Portal pages often need forms. Frappe provides form macros:

```jinja
{% from "templates/includes/form_macros.html" import render_field %}

<form>
    {{ render_field(frappe.form_dict, "name", label="Name") }}
    {{ render_field(frappe.form_dict, "email", label="Email") }}
    <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

## 4.11 Complete Template Example

Here is a complete example showing the typical structure of a portal page template:

```jinja
{% extends "templates/web.html" %}

{% block title %}{{ _("My Dashboard") }}{% endblock %}

{% block page_content %}
<div class="dashboard">
    <h1 class="page-title">{{ _("Welcome, {0}").format(fullname) }}</h1>
    
    <div class="row mt-4">
        {% for card in dashboard_cards %}
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body text-center">
                    <h3 class="card-count">{{ card.count }}</h3>
                    <p class="card-text text-muted">{{ card.label }}</p>
                </div>
            </div>
        </div>
        {% endfor %}
    </div>
    
    {% if recent_items %}
    <h3 class="mt-4">{{ _("Recent Items") }}</h3>
    <table class="table table-striped">
        <thead>
            <tr>
                <th>{{ _("Name") }}</th>
                <th>{{ _("Status") }}</th>
                <th>{{ _("Date") }}</th>
            </tr>
        </thead>
        <tbody>
            {% for item in recent_items %}
            <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.status }}</td>
                <td>{{ frappe.utils.format_date(item.creation) }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
    {% else %}
    <p class="text-muted">{{ _("No recent items found.") }}</p>
    {% endif %}
</div>
{% endblock %}

{% block style %}
<style>
    .dashboard .card-count {
        font-size: 2.5rem;
        font-weight: bold;
        color: var(--primary);
    }
</style>
{% endblock %}

{% block script %}
<script>
    frappe.ready(function() {
        console.log("Dashboard loaded!");
    });
</script>
{% endblock %}
```

## 4.12 Summary

Jinja templating is the rendering engine for all portal pages. The inheritance chain from `base.html` through `web.html` to your page template provides a consistent structure while allowing full customization. Frappe injects a rich set of globals into the Jinja environment — the `frappe` object, translation functions, URL helpers, and asset helpers — making it possible to access the full power of the framework from within your templates. Frontmatter provides a clean way to set page properties directly in the template file, and safe rendering ensures that untrusted templates cannot execute arbitrary code.
