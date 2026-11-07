# Chapter 1: Introduction to Frappe Web Portals

## 1.1 What is a Web Portal?

In the context of the Frappe Framework, a **web portal** (also called a **website page** or **portal page**) is any web page that is served to users through a browser, outside of the Frappe Desk interface. While the Desk is the private, authenticated, back-office interface that Frappe administrators and system users work with, the portal is the public-facing (or customer-facing) side of your application.

Think of it this way:

- **Frappe Desk** is the admin panel — where you create DocTypes, set up workflows, manage users, and configure the system. It is a single-page application (SPA) built with Vue.js.
- **Frappe Portal** is the website — where your customers, visitors, or end-users interact with your application. They might browse a product catalog, submit a support ticket, view their order history, or read your blog. Portal pages are rendered server-side using Jinja templates.

A portal page is not a separate system. It is deeply integrated into the same Frappe application that powers the Desk. It accesses the same database, the same DocTypes, the same permissions, and the same business logic. The only difference is how the page is rendered and delivered to the browser.

## 1.2 Portal vs Desk — Understanding the Difference

Frappe has two entirely different rendering engines for two different kinds of pages:

| Aspect | Desk (SPA) | Portal (SSR) |
|--------|-----------|-------------|
| Rendering | Client-side JavaScript (Vue.js) | Server-side Jinja templates |
| Login | Required for all pages | Optional; pages can be public |
| Framework | frappe-ui / Vue components | HTML + Jinja + Bootstrap |
| Routing | Client-side router | Server-side URL matching |
| State | Single-page app with reactive state | Each request is independent |
| Authentication | JWT / session cookies | Session cookies |
| Use case | Admin, back-office, configuration | Customer-facing, public content |

When you create a page in the Desk, you create a Page doctype or add items to the navigation menu. When you create a portal page, you simply place a file in the `www/` directory of your app. No doctype registration is needed. No compilation step. Just a file and optionally a Python controller.

## 1.3 Why Organizations Need Portals

Organizations use Frappe portals for many reasons:

**Customer Self-Service.** A portal allows customers to log in and view their own data — invoices, support tickets, orders, subscriptions — without needing access to the Desk. The portal shows only the data relevant to that customer, filtered by their permissions.

**Public Content.** An organization might want a public website — an about page, a contact page, a blog, a knowledge base — that anyone can visit without logging in. Frappe's portal system supports this trivially.

**Branded Experience.** The portal can be fully customized with your own theme, logo, fonts, and styling. It is completely separate from the Desk's appearance, so your customers see your brand, not Frappe's interface.

**SEO and Discoverability.** Portal pages are server-side rendered, which means search engines can crawl and index them. This is critical for public-facing content like blogs, documentation, and landing pages.

**Extensibility.** You can add any page you want — dashboards, custom forms, data tables, charts, payment pages, API documentation — simply by adding files to the `www/` folder of your custom app.

## 1.4 The Core Concept: Route → File → Controller → Template

Every portal page in Frappe follows a simple but powerful pattern:

```
A URL path  →  matches a file in www/  →  optionally executes a Python controller  →  renders a Jinja template  →  returns HTML
```

For example, when a user visits `https://example.com/about`, Frappe:

1. Receives the path `/about`
2. Looks for a matching file in every installed app's `www/` folder
3. Finds `frappe/www/about.html`
4. Checks for a co-located Python file `frappe/www/about.py`
5. If it exists, calls `get_context(context)` to prepare data
6. Renders the HTML template through Jinja, injecting the context
7. Returns the final HTML to the browser

This is the fundamental architecture. Everything else in this book is a refinement or elaboration of this core idea.

## 1.5 What This Book Will Teach You

By the end of this book, you will understand:

- How to create any kind of page in the `www/` directory
- How file naming maps to URL routes
- How to write Python controllers that prepare data for templates
- How Jinja templates inherit from base layouts
- How the Frappe framework renders pages internally
- How to control caching, sidebars, breadcrumbs, titles, and SEO
- How to build custom themes with custom fonts and colors
- How the theme toggle discovers and switches themes
- How to override existing standard pages

Let us begin this journey by understanding the heart of the portal system: the `www/` directory.
