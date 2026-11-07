# Chapter 5: Python Controllers and get_context

## 5.1 What is a Controller?

In the context of Frappe portal pages, a **controller** is a Python file that lives alongside an HTML template in the `www/` directory. Its job is to prepare data for the template. The controller is optional — if your page is purely static (no dynamic data), you do not need one. But for any page that needs to access the database, check permissions, or compute values, the controller is where that logic lives.

The controller's primary interface is the `get_context(context)` function.

## 5.2 The get_context Function

The `get_context` function is the single most important function in portal page development. It receives a single argument — the `context` dictionary — and populates it with data that will be available in the Jinja template.

**Signature:**

```python
def get_context(context):
    # context is a frappe._dict (a dictionary with attribute-style access)
    # Add your data to it
    context.my_variable = "Hello, World!"
    # You can also return a dict, which will be merged into context
    return {"another_variable": 42}
```

The context starts with a set of default values (from `get_website_settings()`) and your job in `get_context` is to add page-specific data to it.

## 5.3 How Frappe Discovers and Executes the Controller

As we saw in Chapter 3, when a `TemplatePage` renderer finds a matching `.html` file, it also looks for a co-located `.py` file. The discovery process is:

1. The template path is `www/my-page.html`
2. Frappe looks for `www/my-page.py` (with hyphens converted to underscores)
3. If found, it imports the module using Python's import system
4. It checks if the module defines a `get_context` function
5. If it does, it calls `get_context(context)`, passing the current context
6. Any dictionary returned by `get_context` is merged into the context

The actual code that executes the controller:

```python
def update_context(self):
    # ...
    if self.pymodule_name:
        self.pymodule = frappe.get_module(self.pymodule_name)
        data = self.run_pymodule_method("get_context")
        if data:
            self.context.update(data)
```

And the method that invokes the function:

```python
def run_pymodule_method(self, method_name):
    if hasattr(self.pymodule, method_name):
        import inspect
        method = getattr(self.pymodule, method_name)
        if inspect.getfullargspec(method).args:
            return method(self.context)
        else:
            return method()
```

Notice the flexibility: if `get_context` accepts arguments, it is passed the context. If not (no parameters), it is called without arguments. This supports both modern and legacy patterns.

## 5.4 What You Can Do Inside get_context

### 5.4.1 Fetch Database Records

The most common task is fetching data from the database:

```python
def get_context(context):
    # Fetch a single document
    context.about_us = frappe.get_doc("About Us Settings")
    
    # Fetch multiple records
    context.posts = frappe.get_all(
        "Blog Post",
        fields=["title", "published_on", "blogger"],
        filters={"published": 1},
        order_by="published_on desc",
        limit=10
    )
    
    # Run a raw SQL query
    context.stats = frappe.db.sql("""
        SELECT status, COUNT(*) as count
        FROM `tabSupport Ticket`
        GROUP BY status
    """, as_dict=True)
```

### 5.4.2 Check Permissions

You can control access to pages:

```python
def get_context(context):
    # Redirect guests to login
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect
    
    # Check if user has a specific role
    if "Customer" not in frappe.get_roles():
        frappe.throw(_("You are not authorized to view this page"), frappe.PermissionError)
    
    # Fetch only the current user's data
    context.my_orders = frappe.get_all(
        "Sales Order",
        filters={"customer": frappe.session.user},
        fields=["name", "status", "transaction_date", "grand_total"]
    )
```

### 5.4.3 Handle Query Parameters

Access URL query parameters via `frappe.form_dict`:

```python
def get_context(context):
    category = frappe.form_dict.get("category")
    search = frappe.form_dict.get("q")
    
    filters = {"published": 1}
    if category:
        filters["category"] = category
    if search:
        filters["title"] = ["like", f"%{search}%"]
    
    context.products = frappe.get_all("Item", filters=filters, fields=["*"])
    context.selected_category = category
    context.search_query = search
```

For a URL like `/products?category=Electronics&q=phone`, the controller would receive `category=Electronics` and `q=phone`.

### 5.4.4 Set Page Properties

Set or override page-level properties:

```python
def get_context(context):
    context.title = "Custom Page Title"
    context.no_cache = 1
    context.show_sidebar = True
    context.add_breadcrumbs = True
    context.parents = [
        {"route": "/", "title": "Home"},
        {"route": "/products", "title": "Products"}
    ]
```

### 5.4.5 Set HTTP Status Code

You can change the HTTP status code:

```python
def get_context(context):
    context.http_status_code = 404  # Or 403, 500, 301, etc.
```

## 5.5 Real-World Examples from Frappe Core

Let us examine the actual controllers in Frappe core to see how they work.

### 5.5.1 The About Page Controller

`frappe/www/about.py`:

```python
def get_context(context):
    context.doc = frappe.get_cached_doc("About Us Settings")
    return context
```

This is the simplest possible controller. It fetches the cached `About Us Settings` document and puts it in context as `doc`. The template can then access `{{ doc.company_name }}`, `{{ doc.company_introduction }}`, etc.

### 5.5.2 The Contact Page Controller

`frappe/www/contact.py`:

```python
def get_context(context):
    doc = frappe.get_doc("Contact Us Settings", "Contact Us Settings")
    out = {"query_options": [...]}
    out.update(doc.as_dict())
    return out
```

The contact controller loads all fields from `Contact Us Settings` and adds `query_options` for the dropdown. This demonstrates how to combine static data with database fields.

### 5.5.3 The Me Page Controller (User Profile)

`frappe/www/me.py`:

```python
def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("You need to be logged in to access this page."))
    
    context.current_user = frappe.get_doc("User", frappe.session.user)
    context.show_sidebar = True
```

This controller shows:
1. Authentication guard — guests are blocked
2. Loading the current user's document
3. Enabling the sidebar

### 5.5.4 The 404 Controller

`frappe/www/404.py`:

```python
def get_context(context):
    context.http_status_code = 404
```

A minimal controller that sets the HTTP status code.

### 5.5.5 The Login Controller

`frappe/www/login.py`:

```python
def get_context(context):
    context.no_header = True
    context["title"] = "Login"
    context.provider_logins = []
    # ... social login setup, SSO providers, etc.
    context.disable_signup = ...
    return context
```

This shows the pattern for login pages, including social login providers and SSO integration.

### 5.5.6 The List Controller (Generic DocType List)

`frappe/www/list.py`:

```python
def get_context(context, **dict_params):
    doctype = frappe.form_dict.doctype
    context.parents = [{"route": "me", "title": _("My Account")}]
    context.meta = frappe.get_meta(doctype)
    context.update(get_list_context(context, doctype) or {})
    return context
```

This demonstrates the generic list pattern where the same template can display different DocTypes by reading `doctype` from query parameters.

## 5.6 Module-Level Properties

In addition to `get_context`, a controller module can define these class-level attributes that Frappe reads directly:

```python
base_template_path = "templates/custom_base.html"
template = "templates/custom_template.html" 
no_cache = 1
sitemap = 0
condition_field = "published"
```

These are read by `set_pymodule_properties()`:

```python
def set_pymodule_properties(self):
    for prop in WEBPAGE_PY_MODULE_PROPERTIES:
        if hasattr(self.pymodule, prop):
            self.context[prop] = getattr(self.pymodule, prop)
```

`WEBPAGE_PY_MODULE_PROPERTIES` includes: `base_template_path`, `template`, `no_cache`, `sitemap`, `condition_field`.

## 5.7 Controllers Without Templates

It is possible to create a controller that generates a response directly without an HTML template. In these cases, the Python file does not have an accompanying `.html` file, and the `can_render()` check of `TemplatePage` will fail because the `template_path` ends with `.py`. However, the controller can still work if it is invoked directly.

A common pattern is using `frappe.respond_as_web_page` inside a controller:

```python
import frappe

def get_context(context):
    frappe.respond_as_web_page(
        title="Payment Confirmed",
        html="<h1>Thank you for your payment</h1>",
        indicator_color="green"
    )
```

Another pattern is generating non-HTML responses. The `robots.txt` and `sitemap.xml` endpoints work this way — the `.py` controller writes directly to the response:

```python
# robots.txt equivalent  
def get_context(context):
    context.content_type = "text/plain"
    context.content = "User-agent: *\nDisallow: /app\n"
```

Actually, let me clarify: files like `robots.py` and `sitemap.py` do NOT use `get_context`. They set properties at the module level that change how they are rendered. Let me be precise.

Files in `www/` that are pure Python (no `.html` companion) work differently. They ARE matched by `TemplatePage`, but since there is no `.html` template, the renderer cannot produce HTML. However, Frappe's routing system handles `robots.txt` and `sitemap.xml` specially via the `StaticPage` renderer or specialized controllers.

The actual mechanism: `robots.txt` is a static text file served directly. `sitemap.xml` is also a static file (generated periodically or on-the-fly via a Python script `sitemap.py`). The `sitemap.py` file exports a `get_context` that Frappe processes, but the actual XML output is generated by the controller directly manipulating the response.

For `www/billing.py`, the pattern is different — it defines a `get_context` that sets up the billing page with Stripe subscription details.

## 5.8 Best Practices for Controllers

### 5.8.1 Keep Controllers Lean

Controllers should only prepare data, not render HTML. All presentation logic belongs in the template.

### 5.8.2 Use Cached Data

Use `frappe.get_cached_doc()` for documents that change infrequently:

```python
# Good - cached
context.settings = frappe.get_cached_doc("Website Settings")

# Less ideal - always hits the database
context.settings = frappe.get_doc("Website Settings")
```

### 5.8.3 Handle Missing Data Gracefully

```python
def get_context(context):
    try:
        context.profile = frappe.get_doc("User", frappe.session.user)
    except frappe.DoesNotExistError:
        frappe.local.flags.redirect_location = "/login"
        raise frappe.Redirect
```

### 5.8.4 Use Permission Checks Early

Check permissions at the top of `get_context` before doing expensive work:

```python
def get_context(context):
    if "Customer" not in frappe.get_roles():
        frappe.throw(_("Not permitted"), frappe.PermissionError)
    
    # Now do the expensive work
    context.data = frappe.get_all(...)
```

### 5.8.5 Avoid Business Logic in Templates

Resist the urge to put complex logic in Jinja. The template's job is to display data, not compute it.

### 5.8.6 Use _() for All User-Facing Strings

Mark all user-facing strings for translation:

```python
def get_context(context):
    context.greeting = _("Welcome back, {0}").format(frappe.session.user_fullname)
```

## 5.9 Common Patterns

### Pattern 1: Simple Data Fetch

```python
def get_context(context):
    context.doc = frappe.get_doc("My DocType", frappe.form_dict.name)
    context.related_items = frappe.get_all("Related DocType", 
        filters={"parent": frappe.form_dict.name})
```

### Pattern 2: Authentication Gate

```python
def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to continue"), frappe.PermissionError)
    context.user_doc = frappe.get_doc("User", frappe.session.user)
```

### Pattern 3: Dynamic URL Handling

```python
def get_context(context):
    context.data = frappe.get_all("Blog Post", 
        fields=["title", "content", "published_on"],
        filters={"published": 1, "category": frappe.form_dict.get("category")},
        order_by="published_on desc"
    )
```

### Pattern 4: Form Submission Handling

```python
import frappe

def get_context(context):
    if frappe.request.method == "POST":
        name = frappe.form_dict.get("name")
        email = frappe.form_dict.get("email")
        
        if name and email:
            doc = frappe.get_doc({
                "doctype": "Contact Request",
                "name": name,
                "email": email
            })
            doc.insert(ignore_permissions=True)
            frappe.local.flags.redirect_location = "/thank-you"
            raise frappe.Redirect
    
    context.title = _("Contact Us")
```

### Pattern 5: DocType Information Page

```python
def get_context(context):
    doctype = frappe.form_dict.doctype
    context.meta = frappe.get_meta(doctype)
    context.fields = [f for f in context.meta.fields if f.fieldtype not in ["Tab Break", "Section Break", "Column Break"]]
```

## 5.10 Summary

The `get_context` function is the bridge between your database and your template. It receives a context dictionary, populates it with data, and optionally returns additional data. Controllers can fetch records, check permissions, read query parameters, set page properties, and handle form submissions. The best controllers are focused: they prepare data and let the template handle presentation. Understanding `get_context` is the key to building dynamic, data-driven portal pages.
