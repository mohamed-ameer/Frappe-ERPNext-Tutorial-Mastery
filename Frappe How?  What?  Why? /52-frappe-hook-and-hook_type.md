# Creating Custom Hook Types in Frappe Framework

## Table of Contents
- **1. Introduction**
- **2. Understanding Frappe's Dynamic Hook System**
- **3. How to Create Custom Hook Types**
- **4. Step-by-Step Examples**
- **5. Real Examples from Frappe Codebase**

---

## Introduction

One of the most powerful and often overlooked features of Frappe's hook system is the ability to create **custom hook types**. Unlike many other frameworks that have a predefined set of hook types, Frappe's hook system is completely dynamic, allowing you to define your own hook types that can be used throughout your application.

This guide will show you how to create custom hook types like `my_custom_before_save`, `data_processing_hooks`, or `api_endpoints` that work seamlessly with Frappe's existing hook infrastructure.

## Hook vs Hook Type: The Key Difference

**Hook Type** is the **category** or **name** of the hook (like `doc_events`, `scheduler_events`, `before_request`). It's like a **label** that tells Frappe what kind of event this hook responds to. For example, `doc_events` is a hook type that handles document-related events.

**Hook** is the **actual function** that gets executed when the event happens. It's the **implementation** - the real code that runs. For example, `"my_app.hooks.send_email"` is a hook (a function) that gets called when a document is created.

Think of it this way: **Hook Type** is the **mailbox category** (like "urgent mail" or "bills"), and **Hook** is the **actual letter** you put in that mailbox. The hook type defines when your code runs, and the hook is the code itself that runs.

In your `hooks.py` file:
```python
# "doc_events" is the HOOK TYPE
doc_events = {
    "Customer": {
        "after_insert": "my_app.hooks.send_email"  # "send_email" is the HOOK
    }
}
```

- `doc_events` = hook type/event/when (tells Frappe "this is for document events")
- `after_insert` = hook type/event/when (tells Frappe "run this after inserting")
- `"my_app.hooks.send_email"` = hook/function/what (the actual code that runs)

**Bottom line**: Hook type/event/when = the trigger. Hook/function/what = the action.

## Understanding Frappe's Dynamic Hook System

### How Frappe Discovers Hooks

Frappe's hook discovery mechanism is implemented in the `_load_app_hooks()` function in `frappe/__init__.py`. The key insight is that Frappe loads **ANY** non-private attribute from your `hooks.py` file as a potential hook:

```python
def _load_app_hooks(app_name: str | None = None):
    hooks = {}
    apps = [app_name] if app_name else get_installed_apps(_ensure_on_bench=True)
    
    for app in apps:
        try:
            app_hooks = get_module(f"{app}.hooks")
        except ImportError as e:
            # Handle import errors gracefully
            pass
        
        def _is_valid_hook(obj):
            # Only exclude module types, function types, and class types
            return not isinstance(obj, types.ModuleType | types.FunctionType | type)
        
        for key, value in inspect.getmembers(app_hooks, predicate=_is_valid_hook):
            if not key.startswith("_"):  # Skip private attributes
                append_hook(hooks, key, value)  # This is where magic happens!
    return hooks
```

### Key Points About Frappe's Hook System

1. **No Predefined Hook Types**: Frappe doesn't have a hardcoded list of valid hook types
2. **Dynamic Discovery**: Any variable in your `hooks.py` file becomes a hook type
3. **Flexible Data Structures**: Supports lists, dictionaries, strings, and any other Python data type
4. **Automatic Caching**: Custom hooks are cached just like built-in hooks
5. **No Registration Required**: No need to register your custom hook types anywhere

## How to Create Custom Hook Types

### Basic Structure

To create a custom hook type, simply define a variable in your `hooks.py` file:

```python
# In your_app/hooks.py

# Simple list-based hook
my_custom_hook = [
    "your_app.hooks.function_1",
    "your_app.hooks.function_2"
]

# Dictionary-based hook
data_processing_hooks = {
    "Customer": "your_app.hooks.process_customer",
    "Item": "your_app.hooks.process_item"
}

# Simple string hook
notification_hook = "your_app.hooks.send_notification"
```

### Accessing Your Custom Hooks

Use `frappe.get_hooks()` to access your custom hooks anywhere in your code:

```python
import frappe

# Get your custom hook
custom_hooks = frappe.get_hooks("my_custom_hook")
# Returns: ["your_app.hooks.function_1", "your_app.hooks.function_2"]

# Execute the hooks
for hook_func in custom_hooks:
    frappe.get_attr(hook_func)()
```

## Step-by-Step Examples

### Example 1: Simple Custom Hook

**Step 1: Define the hook in hooks.py**

```python
# In your_app/hooks.py
app_name = "your_app"
app_title = "Your App"

# Custom hook for logging
custom_logging_hooks = [
    "your_app.hooks.log_user_action",
    "your_app.hooks.log_system_event"
]
```

**Step 2: Create the hook functions**

```python
# In your_app/hooks.py or separate module
import frappe

def log_user_action():
    """Log user actions"""
    print(f"User {frappe.session.user} performed an action")

def log_system_event():
    """Log system events"""
    print("System event occurred")
```

**Step 3: Use the hook in your code**

```python
# In your_app/some_module.py
import frappe

def some_business_logic():
    # Your business logic here
    process_data()
    
    # Execute custom logging hooks
    for hook_func in frappe.get_hooks("custom_logging_hooks"):
        frappe.get_attr(hook_func)()
```

### Example 2: Dictionary-Based Custom Hook

**Step 1: Define the hook**

```python
# In your_app/hooks.py
data_validation_hooks = {
    "Customer": "your_app.hooks.validate_customer_data",
    "Item": "your_app.hooks.validate_item_data",
    "Sales Order": "your_app.hooks.validate_sales_order_data"
}
```

**Step 2: Create validation functions**

```python
# In your_app/hooks.py
def validate_customer_data(doc):
    """Validate customer data"""
    if not doc.customer_name:
        frappe.throw("Customer name is required")

def validate_item_data(doc):
    """Validate item data"""
    if doc.item_code and len(doc.item_code) < 3:
        frappe.throw("Item code must be at least 3 characters")

def validate_sales_order_data(doc):
    """Validate sales order data"""
    if not doc.items:
        frappe.throw("Sales Order must have at least one item")
```

**Step 3: Use the hook in document events**

```python
# In your_app/hooks.py
doc_events = {
    "Customer": {
        "before_save": "your_app.hooks.run_custom_validation"
    },
    "Item": {
        "before_save": "your_app.hooks.run_custom_validation"
    },
    "Sales Order": {
        "before_save": "your_app.hooks.run_custom_validation"
    }
}

# In your_app/hooks.py
def run_custom_validation(doc, method):
    """Run custom validation based on doctype"""
    validation_hooks = frappe.get_hooks("data_validation_hooks")
    
    if doc.doctype in validation_hooks:
        validator = frappe.get_attr(validation_hooks[doc.doctype])
        validator(doc)
```

## Real Examples from Frappe Codebase

### Example 1: `extend_bootinfo` Hook

Frappe uses this custom hook to allow apps to extend the boot information:

```python
# In frappe/hooks.py
extend_bootinfo = [
    "frappe.utils.telemetry.add_bootinfo",
    "frappe.core.doctype.user_permission.user_permission.send_user_permissions",
]

# In frappe/sessions.py
for hook in frappe.get_hooks("extend_bootinfo"):
    frappe.get_attr(hook)(bootinfo=bootinfo)
```

### Example 2: `get_changelog_feed` Hook

This hook allows apps to provide changelog feed data:

```python
# In frappe/hooks.py
get_changelog_feed = "frappe.desk.doctype.changelog_feed.changelog_feed.get_feed"

# In frappe/desk/doctype/changelog_feed/changelog_feed.py
for fn in frappe.get_hooks("get_changelog_feed"):
    try:
        changelog_feed = frappe.call(fn, since=since)[:20] or []
        # Process changelog feed
    except Exception:
        frappe.log_error(f"Failed to fetch changelog from {fn}")
```

### Example 3: `standard_navbar_items` Hook

This hook allows customization of navbar items:

```python
# In frappe/hooks.py
standard_navbar_items = [
    {
        "item_label": "My Profile",
        "item_type": "Route",
        "route": "/app/user-profile",
        "is_standard": 1,
    },
    # ... more items
]

# Used in navbar rendering code
navbar_items = frappe.get_hooks("standard_navbar_items")
```

### Cache Issues

If your custom hooks aren't updating, clear the cache:

```python
# Clear hook cache
frappe.cache.delete_value("app_hooks")

# Or clear all cache
frappe.clear_cache()
```

## Conclusion

Creating custom hook types in Frappe is a powerful way to extend the framework's functionality. The dynamic nature of Frappe's hook system means you can create any hook type you need, with any data structure that makes sense for your use case.

Key takeaways:

1. **Any variable** in your `hooks.py` file becomes a hook type
2. **No registration** is required - Frappe discovers them automatically
3. **Flexible data structures** - use lists, dicts, strings, or any Python type
4. **Built-in caching** - your custom hooks are cached like built-in ones
5. **Error handling** - always wrap hook execution in try-catch blocks
6. **Documentation** - document your custom hooks for other developers
