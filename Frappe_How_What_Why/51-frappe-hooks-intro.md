# Frappe Hooks Intro

## Table of Contents
- **1. What Are Hooks? A Simple Introduction**
- **2. Why Hooks Matter: The Big Picture**
- **3. How Hooks Work in Other Software**
- **4. Frappe's Hook System: The Complete Journey**
- **5. How Hooks Work Behind the Scenes: Step by Step**
- **6. Different Types of Hooks in Frappe**
- **7. Creating Your Own Hooks: Easy Step-by-Step Guide**
- **9. Common Questions and Answers**

---

## What Are Hooks? A Simple Introduction

Think of hooks like **special buttons** that you can add to a machine without opening it up. Imagine you have a coffee machine that makes coffee automatically. Now, you want to add a feature that sends you a text message every time it makes coffee. 

Instead of taking apart the coffee machine (which would break it), you can add a **hook** - a special connection point where you can attach your text messaging feature. The coffee machine will call your function every time it makes coffee, and your function will send the text message.

**In Frappe, hooks work the same way.** They are special connection points where you can add your own code without changing Frappe's core code. This means:

- **You can add new features** without breaking existing ones
- **Your code runs automatically** when certain events happen
- **You don't need to modify** Frappe's original files
- **Other developers** can also add their own hooks without interfering with yours

### Real-World Example

Let's say you have a Frappe application for managing customers. You want to automatically send an email every time a new customer is added. Instead of changing Frappe's customer code, you can use a hook:

```python
# In your hooks.py file
doc_events = {
    "Customer": {
        "after_insert": "your_app.hooks.send_welcome_email"
    }
}
```

When someone adds a new customer, Frappe will automatically call your `send_welcome_email` function. It's like adding a special button that gets pressed every time a customer is created!

## Why Hooks Matter: The Big Picture

Hooks are important because they solve a big problem in software development: **How do you add new features without breaking existing ones?**

### The Problem Without Hooks

Imagine you have a house (your application) and you want to add a new room. Without hooks, you would need to:
1. **Break down walls** (modify core code)
2. **Risk damaging** the existing structure
3. **Make it hard** for others to add their own rooms
4. **Create conflicts** when multiple people try to add rooms

### The Solution With Hooks

Hooks are like **pre-built connection points** in your house. You can:
1. **Add new rooms** (features) without breaking existing ones
2. **Multiple people** can add their own rooms safely
3. **Easy to remove** or change rooms later
4. **No conflicts** between different additions

### Key Benefits of Hooks

1. **Safety**: Your code won't break Frappe's core functionality
2. **Flexibility**: You can add features exactly when you need them
3. **Reusability**: Other developers can use your hooks
4. **Maintainability**: Easy to update or remove features
5. **Modularity**: Each feature is separate and independent

## How Hooks Work in Other Software

Hooks are not unique to Frappe. They are used in many software applications you use every day:

### Web Browsers
- **Browser extensions** (like ad blockers) use hooks to modify web pages
- When you visit a website, the browser calls your extension's code
- Your extension can change how the page looks or behaves

### Text Editors
- **Plugins** in editors like VS Code use hooks
- When you save a file, the editor calls your plugin's code
- Your plugin can format the code, check for errors, etc.

### Operating Systems
- **System hooks** respond to events like mouse clicks or keyboard presses
- When you click something, the system calls registered functions
- These functions can perform custom actions

### The Common Pattern

All these examples follow the same pattern:
1. **Main application** (browser, editor, OS) runs normally
2. **Special events** happen (page load, file save, mouse click)
3. **Hooks are called** - the application looks for registered functions
4. **Your code runs** - you can modify behavior or add features
5. **Application continues** - with your changes applied

## Frappe's Hook System: The Complete Journey

Let's take a journey through how Frappe's hook system works, from the very beginning to the end.

### Step 1: The Starting Point - Your Application

When you create a Frappe application, you get a special file called `hooks.py`. This file is like a **menu** that tells Frappe what your application wants to do.

```python
# This is your hooks.py file
app_name = "my_awesome_app"
app_title = "My Awesome App"

# Here you tell Frappe what you want to hook into
doc_events = {
    "Customer": {
        "after_insert": "my_awesome_app.hooks.send_email"
    }
}
```

### Step 2: Frappe Discovers Your Hooks

When Frappe starts up, it goes through all installed applications and reads their `hooks.py` files. It's like Frappe is reading all the menus from different restaurants to see what food is available.

Here's what happens:
1. **Frappe looks** at all installed apps
2. **Reads each** `hooks.py` file
3. **Collects all** the hook definitions
4. **Stores them** in memory for quick access

### Step 3: The Magic Happens - Events Occur

Now, when something happens in your application (like creating a customer), Frappe checks its list of hooks to see if anyone wants to be notified.

It's like this:
1. **User creates** a new customer
2. **Frappe thinks**: "Someone just created a customer, let me check if any apps want to know about this"
3. **Frappe looks** at the `doc_events` for "Customer" and "after_insert"
4. **Frappe finds** your hook: `"my_awesome_app.hooks.send_email"`
5. **Frappe calls** your function

### Step 4: Your Code Runs

Your function runs automatically:

```python
def send_email(doc, method):
    # This function runs every time a customer is created
    print(f"New customer created: {doc.name}")
    # Send welcome email here
```

### Step 5: Everything Continues Normally

After your code runs, Frappe continues with its normal process. The customer is saved, and the user sees the success message.

## How Hooks Work Behind the Scenes: Step by Step

Let's dive deeper into the technical details of how Frappe's hook system works.

### The Discovery Process

When Frappe starts, it runs a function called `_load_app_hooks()`. This function is like a detective that finds all the hooks in your system.

```python
def _load_app_hooks():
    hooks = {}  # Empty dictionary to store all hooks
    
    # Get list of all installed apps
    apps = get_installed_apps()
    
    for app in apps:
        try:
            # Try to load the hooks.py file from each app
            app_hooks = get_module(f"{app}.hooks")
            
            # Look at all variables in the hooks file
            for key, value in inspect.getmembers(app_hooks):
                if not key.startswith("_"):  # Skip private variables
                    append_hook(hooks, key, value)
                    
        except ImportError:
            # If app doesn't have hooks.py, skip it
            pass
    
    return hooks
```

### The Storage Process

All discovered hooks are stored in a special dictionary structure:

```python
# This is how hooks are stored in memory
hooks = {
    "app_name": ["frappe", "erpnext", "my_app"],
    "doc_events": {
        "Customer": {
            "after_insert": ["my_app.hooks.send_email"],
            "before_save": ["my_app.hooks.validate_data"]
        },
        "Item": {
            "on_update": ["my_app.hooks.update_inventory"]
        }
    },
    "scheduler_events": {
        "daily": ["my_app.hooks.cleanup_old_data"]
    }
}
```

### The Execution Process

When an event happens, Frappe follows this process:

1. **Event occurs**: User saves a Customer document
2. **Frappe checks**: "What hooks are registered for Customer + before_save?"
3. **Frappe finds**: `["my_app.hooks.validate_data"]`
4. **Frappe calls**: `frappe.get_attr("my_app.hooks.validate_data")(doc, "before_save")`
5. **Your function runs**: `validate_data(doc, "before_save")`
6. **Frappe continues**: With the original save process

### The Caching System

To make things fast, Frappe caches all hooks in memory:

```python
# Hooks are cached so they don't need to be loaded every time
@request_cache
def get_hooks(hook_name=None):
    if not hasattr(local, "cached_hooks"):
        local.cached_hooks = _load_app_hooks()
    
    if hook_name:
        return local.cached_hooks.get(hook_name, [])
    return local.cached_hooks
```

This means:
- **First time**: Frappe loads all hooks from files (slow)
- **Next times**: Frappe gets hooks from memory (fast)
- **Cache expires**: When you restart Frappe or clear cache

### The Composition System

For document events, Frappe uses a special composition system. This means multiple hooks can run for the same event:

```python
# If multiple apps have hooks for the same event
doc_events = {
    "Customer": {
        "after_insert": [
            "app1.hooks.send_email",
            "app2.hooks.create_task", 
            "app3.hooks.log_activity"
        ]
    }
}

# Frappe runs all of them in order
def run_hooks(doc, method):
    hooks = get_hooks("doc_events")[doc.doctype][method]
    
    for hook_func in hooks:
        try:
            frappe.get_attr(hook_func)(doc, method)
        except Exception as e:
            frappe.log_error(f"Hook {hook_func} failed: {e}")
```

## Different Types of Hooks in Frappe

Frappe provides many different types of hooks for different purposes. Let's explore each one:

### 1. Application Lifecycle Hooks

These hooks run when your app is installed, updated, or removed:

```python
# In your hooks.py
before_install = "my_app.hooks.check_requirements"
after_install = "my_app.hooks.setup_initial_data"
before_migrate = "my_app.hooks.backup_data"
after_migrate = "my_app.hooks.update_database"
```

**When they run:**
- `before_install`: Before your app is installed
- `after_install`: After your app is successfully installed
- `before_migrate`: Before database changes are applied
- `after_migrate`: After database changes are completed

**Common uses:**
- Check if system requirements are met
- Create initial data or settings
- Backup data before changes
- Update database structure

### 2. Document Event Hooks

These are the most commonly used hooks. They run when documents are created, updated, or deleted:

```python
doc_events = {
    "Customer": {
        "before_insert": "my_app.hooks.validate_customer",
        "after_insert": "my_app.hooks.send_welcome_email",
        "before_save": "my_app.hooks.calculate_totals",
        "on_update": "my_app.hooks.update_related_docs",
        "on_submit": "my_app.hooks.create_invoice",
        "on_cancel": "my_app.hooks.reverse_transactions",
        "on_trash": "my_app.hooks.cleanup_data"
    }
}
```

**Available events:**
- `before_insert`: Before document is created
- `after_insert`: After document is created
- `before_save`: Before document is saved (create or update)
- `on_update`: After document is updated
- `before_submit`: Before document is submitted
- `on_submit`: After document is submitted
- `before_cancel`: Before document is cancelled
- `on_cancel`: After document is cancelled
- `on_trash`: Before document is deleted

### 3. Scheduler Event Hooks

These hooks run automatically at scheduled times:

```python
scheduler_events = {
    "all": ["my_app.hooks.run_every_minute"],
    "hourly": ["my_app.hooks.sync_data"],
    "daily": ["my_app.hooks.cleanup_old_files"],
    "weekly": ["my_app.hooks.generate_reports"],
    "monthly": ["my_app.hooks.archive_data"],
    "cron": {
        "0 2 * * *": ["my_app.hooks.midnight_processing"]  # 2 AM daily
    }
}
```

**When they run:**
- `all`: Every few minutes
- `hourly`: Every hour
- `daily`: Every day
- `weekly`: Every week
- `monthly`: Every month
- `cron`: At specific times (using cron syntax)

### 4. Request Lifecycle Hooks

These hooks run for every web request:

```python
before_request = ["my_app.hooks.log_request"]
after_request = ["my_app.hooks.log_response"]
```

**When they run:**
- `before_request`: Before any web request is processed
- `after_request`: After any web request is completed

**Common uses:**
- Logging requests and responses
- Authentication checks
- Rate limiting
- Performance monitoring

### 5. Permission Hooks

These hooks control who can access what:

```python
has_permission = {
    "Customer": "my_app.hooks.check_customer_access"
}

permission_query_conditions = {
    "Customer": "my_app.hooks.add_customer_filters"
}
```

**What they do:**
- `has_permission`: Check if user can access a specific document
- `permission_query_conditions`: Add filters to database queries

### 6. UI and Asset Hooks

These hooks add custom JavaScript and CSS:

```python
app_include_js = ["my_app.bundle.js"]
app_include_css = ["my_app.bundle.css"]
doctype_js = {
    "Customer": "public/js/customer.js"
}
```

**What they do:**
- `app_include_js`: Add JavaScript to all pages
- `app_include_css`: Add CSS to all pages
- `doctype_js`: Add JavaScript to specific document types

### 7. Override Hooks

These hooks replace Frappe's default behavior:

```python
override_doctype_class = {
    "Customer": "my_app.overrides.CustomCustomer"
}

override_whitelisted_methods = {
    "frappe.desk.query_report.get_report_data": "my_app.overrides.custom_report_data"
}
```

**What they do:**
- `override_doctype_class`: Replace document classes
- `override_whitelisted_methods`: Replace API methods

## Creating Your Own Hooks: Easy Step-by-Step Guide

Creating custom hooks in Frappe is easy once you understand the pattern. This section will show you exactly how to create your own hooks with simple examples.

### Step 1: Understanding the Hook Structure

Every Frappe application has a special file called `hooks.py`. This file tells Frappe what your app wants to do.

Here's the basic structure:

```python
# Basic app information
app_name = "my_awesome_app"
app_title = "My Awesome App"
app_publisher = "Your Company"
app_description = "What your app does"
app_license = "Your License"

# Your hooks go here
hook_name = "your_function_name"
```

### Step 2: Creating Document Event Hooks

Document event hooks are the most common type of hooks. They run when documents are created, updated, or deleted.

**Step 2.1: Create Your Function**

First, write a function that does what you want:

```python
# In your_app/hooks.py
def before_save_customer(doc, method):
    """
    This function runs before a customer is saved
    """
    # Add your custom logic here
    if not doc.customer_code:
        doc.customer_code = f"CUST-{doc.name}"
    
    if not doc.customer_type:
        doc.customer_type = "Individual"
```

**Step 2.2: Register Your Hook**

Tell Frappe when to run your function:

```python
# In your_app/hooks.py
doc_events = {
    "Customer": {
        "before_save": "your_app.hooks.before_save_customer"
    }
}
```

**Step 2.3: Test It**

Create or update a Customer document and see if your function runs!

### Step 3: Creating Scheduler Event Hooks

Scheduler hooks run automatically at specific times. Great for cleanup tasks and data sync.

**Step 3.1: Create Your Function**

```python
# In your_app/hooks.py
def daily_cleanup():
    """
    This runs every day
    """
    import frappe
    
    # Clean up old data
    frappe.db.sql("""
        DELETE FROM `tabError Log` 
        WHERE creation < DATE_SUB(NOW(), INTERVAL 30 DAY)
    """)
    
    frappe.db.commit()
    print("Daily cleanup completed")
```

**Step 3.2: Register Your Hook**

```python
# In your_app/hooks.py
scheduler_events = {
    "daily": [
        "your_app.hooks.daily_cleanup"
    ],
    "hourly": [
        "your_app.hooks.hourly_sync"
    ]
}
```

### Step 4: Creating Request Lifecycle Hooks

These hooks run for every web request. Great for logging and security.

**Step 4.1: Create Your Functions**

```python
# In your_app/hooks.py
def before_request():
    """
    This runs before every web request
    """
    import frappe
    
    # Log the request
    frappe.logger().info(f"Request to {frappe.local.request.path}")

def after_request(response, request):
    """
    This runs after every web request
    """
    import frappe
    
    # Log the response
    frappe.logger().info(f"Response status: {response.status_code}")
```

**Step 4.2: Register Your Hooks**

```python
# In your_app/hooks.py
before_request = [
    "your_app.hooks.before_request"
]

after_request = [
    "your_app.hooks.after_request"
]
```

### Step 5: Creating Permission Hooks

Permission hooks control who can access what data.

**Step 5.1: Create Your Functions**

```python
# In your_app/hooks.py
def check_customer_access(doc, user):
    """
    Check if user can access this customer
    """
    import frappe
    
    # Only owner can access
    if doc.owner == user:
        return True
    
    return False

def add_customer_filters(user):
    """
    Add filters to customer queries
    """
    return f"`tabCustomer`.owner = '{user}'"
```

**Step 5.2: Register Your Hooks**

```python
# In your_app/hooks.py
has_permission = {
    "Customer": "your_app.hooks.check_customer_access"
}

permission_query_conditions = {
    "Customer": "your_app.hooks.add_customer_filters"
}
```

### Step 6: Creating UI and Asset Hooks

These hooks add custom JavaScript and CSS to your app.

**Step 6.1: Create Your Files**

Create JavaScript and CSS files:

```javascript
// In your_app/public/js/customer.js
frappe.ui.form.on('Customer', {
    refresh: function(frm) {
        // Add custom button
        frm.add_custom_button('Send Email', function() {
            // Your custom action
        });
    }
});
```

```css
/* In your_app/public/css/customer.css */
.customer-form {
    background-color: #f0f0f0;
}
```

**Step 6.2: Register Your Hooks**

```python
# In your_app/hooks.py
app_include_js = ["your_app.bundle.js"]
app_include_css = ["your_app.bundle.css"]

doctype_js = {
    "Customer": "public/js/customer.js"
}
```

### Step 7: Testing Your Hooks

Testing is important to make sure your hooks work correctly.

**Step 7.1: Enable Developer Mode**

Turn on developer mode to see error messages:

```python
# In site_config.json
{
    "developer_mode": 1
}
```

**Step 7.2: Add Logging**

Add print statements to see what's happening:

```python
def your_hook_function(doc, method):
    """
    Your hook function with logging
    """
    print(f"Running hook for {doc.doctype} - {method}")
    
    try:
        # Your hook logic here
        print("Hook completed successfully")
    except Exception as e:
        print(f"Hook failed: {str(e)}")
        raise
```

**Step 7.3: Test It**

Do the action that should trigger your hook and check if it works!

### Step 8: Advanced Hook Patterns

For more complex needs, here are some advanced patterns:

**Step 8.1: Conditional Hooks**

Only run your hook under certain conditions:

```python
def conditional_hook(doc, method):
    """
    Only run for specific conditions
    """
    if doc.doctype == "Customer" and doc.customer_type == "Company":
        # Your logic here
        pass
```

**Step 8.2: Error Handling**

Make your hooks more robust:

```python
def robust_hook(doc, method):
    """
    Hook with error handling
    """
    try:
        # Your hook logic here
        pass
    except Exception as e:
        # Log error but don't break the app
        frappe.logger().error(f"Hook error: {str(e)}")
```

**Step 8.3: Database Operations**

Handle database operations safely:

```python
def database_hook(doc, method):
    """
    Hook with database operations
    """
    try:
        # Your database operations
        frappe.db.sql("UPDATE `tabTable` SET field = %s WHERE name = %s", 
                     [value, doc.name])
        frappe.db.commit()
    except Exception as e:
        frappe.db.rollback()
        raise
```

## Common Questions and Answers

### What are hooks?

Hooks are special connection points where you can add your own code without changing the main application. Think of them like special buttons you can add to a machine without opening it up.

### How are hooks different from regular functions?

Regular functions are called directly by your code. Hooks are called automatically by Frappe when certain events happen. You just register your function, and Frappe calls it at the right time.

### Why are hooks important?

Hooks let you add new features without breaking existing code. They make your application more flexible and easier to maintain.

### How does Frappe find my hooks?

Frappe looks at your `hooks.py` file and reads all the variables you define. It then stores them in memory so it can call them when needed.

### What types of hooks can I create?

You can create many types of hooks:
- **Document hooks**: Run when documents are created, updated, or deleted
- **Scheduler hooks**: Run at specific times (daily, hourly, etc.)
- **Request hooks**: Run for every web request
- **Permission hooks**: Control who can access what
- **UI hooks**: Add custom JavaScript and CSS
- **Override hooks**: Replace Frappe's default behavior

### How do I create a simple hook?

1. Create a function in your `hooks.py` file
2. Register it in the appropriate hook type
3. Test it to make sure it works

Example:
```python
# 1. Create function
def my_hook(doc, method):
    print("My hook is running!")

# 2. Register it
doc_events = {
    "Customer": {
        "after_insert": "my_app.hooks.my_hook"
    }
}
```

### Can I create my own hook types?

Yes! Frappe's hook system is completely dynamic. You can create any hook type you want by simply defining a variable in your `hooks.py` file.

### How do I make my hooks run faster?

- Use caching to avoid repeated database queries
- Batch database operations
- Keep your hook functions simple and focused

### How do I handle errors in hooks?

Always wrap your hook code in try-catch blocks and log errors properly. Don't let your hooks break the main application.

### How do I test my hooks?

Create test cases that trigger the events your hooks should respond to, then check if your hooks work as expected.

### What's the best way to organize many hooks?

For big applications, split your hooks into separate files and import them into your main `hooks.py` file.

### Can multiple apps use the same hook?

Yes! Multiple apps can register hooks for the same event. Frappe will run all of them in order.

### How do I debug hook problems?

- Enable developer mode to see detailed error messages
- Add logging to your hooks
- Check the Frappe logs for error messages
- Test your hooks step by step

### Are hooks cached?

Yes! Frappe caches all hooks in memory to make them run faster. The cache is cleared when you restart Frappe or clear the cache manually.

### Can I disable a hook temporarily?

Yes, you can comment out the hook registration in your `hooks.py` file, or add a condition to check if the hook should run.

### What happens if my hook fails?

It depends on how you handle the error. If you don't catch the error, it might stop the main process. Always handle errors gracefully in your hooks.

### How do I know which hooks are available?

Check the Frappe documentation or look at existing apps' `hooks.py` files to see what hook types are available.

### Can I create hooks that run before other hooks?

Yes, hooks run in the order they are registered. The order depends on the app installation order and how the hooks are defined.

### How do I make my hooks configurable?

You can read settings from a DocType and only run your hooks if certain conditions are met.

### What's the difference between before_* and after_* hooks?

- `before_*` hooks run before the action happens (good for validation)
- `after_*` hooks run after the action happens (good for notifications and updates)

### Can I create hooks that modify the document?

Yes! You can modify document fields in `before_*` hooks. Just be careful not to create infinite loops.

### How do I create a hook that runs for all document types?

Use `"*"` as the doctype name in your `doc_events`:

```python
doc_events = {
    "*": {
        "after_insert": "my_app.hooks.log_all_creates"
    }
}
```

### Can I create custom hook types that don't exist in Frappe?

Yes! Frappe's hook system is completely dynamic. You can create any hook type you want by simply defining a variable in your `hooks.py` file.

