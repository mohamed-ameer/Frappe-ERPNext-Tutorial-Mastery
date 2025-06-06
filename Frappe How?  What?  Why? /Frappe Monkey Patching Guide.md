# Frappe Monkey Patching Guide: Overriding/Change Core Code Without Touching it 

A guide for Frappe developers on how to override core Frappe code and third-party app functions using monkey patching techniques.

## Table of Contents

1. [What is Monkey Patching?](#what-is-monkey-patching)
2. [When to Use Monkey Patching](#when-to-use-monkey-patching)
3. [Frappe-Specific Override Methods](#frappe-specific-override-methods)
4. [Implementation Patterns](#implementation-patterns)
5. [Best Practices](#best-practices)
6. [Common Use Cases](#common-use-cases)
7. [Troubleshooting](#troubleshooting)

## What is Monkey Patching?

**Monkey patching** is a technique that allows you to dynamically modify or extend existing code at runtime without changing the original source files. In Python, this is possible because functions and methods are first-class objects that can be reassigned.

>monkey patch = change core [method, function, class] without touching the core 

### Basic Concept:
```python
# Original function in some_module.py
def original_function():
    return "original behavior"

# Your override in custom_app
def enhanced_function():
    return "enhanced behavior"

# Monkey patch - replace the original
import some_module
some_module.original_function = enhanced_function
```

## When to Use Monkey Patching

### **Good Use Cases:**
- **Bug Fixes**: Fix issues in core Frappe or third-party apps without waiting for updates or without even touching the core code (i will keep remind you WITHOUT TOUCHING THE CORE)
- **Feature Enhancement**: Add functionality to existing methods (enhance it)
- **Integration Requirements**: Modify behavior for specific business needs
- **Temporary Workarounds**: Quick fixes while waiting for proper solutions

### **Avoid When:**
- **Simple Customizations**: Use Frappe's built-in customization features instead of Monkey Patching
- **DocType Modifications**: Use Custom Fields, Custom Scripts, or DocType inheritance instead of Monkey Patching
- **UI Changes**: Use Client Scripts or Custom Apps with proper UI extensions instead of Monkey Patching
- **Performance Critical**: Monkey patching adds overhead so don't over using it

## Frappe-Specific Override Methods

### Method 1: Hook-Based Overrides (Recommended)

Frappe provides several hooks that allow clean overrides:

**Note**: you can find these hooks in the official documentation.

#### **Document Events**
```python
# In hooks.py
doc_events = {
    "User": {
        "before_save": "custom_app.overrides.user_overrides.before_save",
        "after_insert": "custom_app.overrides.user_overrides.after_insert"
    },
    "*": {
        "on_update": "custom_app.overrides.global_overrides.on_update"
    }
}
```

#### **Method Overrides**
```python
# In hooks.py
override_whitelisted_methods = {
    "frappe.desk.doctype.event.event.get_events": "custom_app.overrides.event_overrides.get_events"
}
```

#### **Function Overrides**
```python
# In hooks.py
import custom_app.overrides.file_utils as custom_file_utils
import frappe.utils.file as core_file_utils

core_file_utils.set_file_details = custom_file_utils.custom_set_file_details
```

#### **DocType Class Overrides**
```python
# In hooks.py
override_doctype_class = {
    "User": "custom_app.overrides.CustomUser"
}

# In custom_app/overrides.py
from frappe.core.doctype.user.user import User

class CustomUser(User):
    def validate(self):
        super().validate()
        # Your custom validation logic
```

### Method 2: Boot Session Overrides

For core function overrides that need to be applied system-wide:

```python
# In hooks.py
boot_session = "custom_app.overrides.apply_core_overrides"

# In custom_app/overrides.py
def apply_core_overrides():
    """Apply monkey patches to core Frappe functions"""
    import frappe.utils
    
    # Store original function
    frappe.utils._original_get_url = frappe.utils.get_url
    
    # Replace with enhanced version
    frappe.utils.get_url = enhanced_get_url

def enhanced_get_url(*args, **kwargs):
    """Enhanced version of frappe.utils.get_url"""
    # Your custom logic here
    result = frappe.utils._original_get_url(*args, **kwargs)
    # Additional processing
    return result
```

### Method 3: App Installation Hooks

For overrides that should be applied when your app is installed:

```python
# In hooks.py
after_app_install = "custom_app.overrides.apply_overrides"
before_app_uninstall = "custom_app.overrides.restore_overrides"

# In custom_app/overrides.py
def apply_overrides():
    """Apply all monkey patches"""
    override_core_functions()
    override_third_party_functions()

def restore_overrides():
    """Restore original functions"""
    restore_core_functions()
    restore_third_party_functions()
```

## Implementation Patterns

### Pattern 1: Simple Function Replacement

```python
import frappe.utils

def apply_overrides():
    # Store original for potential restoration
    if not hasattr(frappe.utils, '_original_cint'):
        frappe.utils._original_cint = frappe.utils.cint
    
    # Replace with enhanced version
    frappe.utils.cint = enhanced_cint

def enhanced_cint(value, default=0):
    """Enhanced version with better error handling"""
    try:
        return frappe.utils._original_cint(value, default)
    except Exception as e:
        frappe.logger().warning(f"cint conversion failed: {e}")
        return default
```

### Pattern 2: Method Decoration

```python
def apply_overrides():
    import frappe.model.document
    
    # Store original
    original_save = frappe.model.document.Document.save
    
    def enhanced_save(self, *args, **kwargs):
        """Enhanced save with additional logging"""
        frappe.logger().info(f"Saving document: {self.doctype} - {self.name}")
        return original_save(self, *args, **kwargs)
    
    # Apply override
    frappe.model.document.Document.save = enhanced_save
```

### Pattern 3: Class Method Override

```python
def apply_overrides():
    from frappe.core.doctype.user.user import User
    
    # Store original method
    User._original_validate = User.validate
    
    def enhanced_validate(self):
        """Enhanced validation with custom rules"""
        # Call original validation
        self._original_validate()
        
        # Add custom validation
        if self.email and not self.email.endswith('@company.com'):
            frappe.throw("Only company emails are allowed")
    
    # Apply override
    User.validate = enhanced_validate
```

### Pattern 4: Module-Level Function Override

```python
def apply_overrides():
    import frappe.auth
    
    # Store original
    frappe.auth._original_check_password = frappe.auth.check_password
    
    def enhanced_check_password(user, pwd, doctype='User', fieldname='password'):
        """Enhanced password check with additional security"""
        # Add custom security checks
        if is_suspicious_login(user):
            frappe.throw("Login temporarily blocked")
        
        # Call original function
        return frappe.auth._original_check_password(user, pwd, doctype, fieldname)
    
    # Apply override
    frappe.auth.check_password = enhanced_check_password
```

## Best Practices

### 1. **Always Backup Original Functions**
```python
# Good: Store original for restoration
if not hasattr(module, '_original_function'):
    module._original_function = module.function

# Bad: Direct replacement without backup
module.function = new_function
```

### 2. **Use Descriptive Function Names**
```python
# Good: Clear naming convention
def enhanced_get_user_permissions(user):
    pass

# Bad: Unclear naming
def new_func(user):
    pass
```

### 3. **Implement Proper Error Handling**
```python
def apply_overrides():
    try:
        import target_module
        target_module.function = enhanced_function
        frappe.logger().info("Successfully applied override")
    except ImportError:
        frappe.logger().warning("Target module not found")
    except Exception as e:
        frappe.logger().error(f"Failed to apply override: {e}")
```

### 4. **Provide Restoration Functions**
```python
def restore_overrides():
    """Restore all original functions"""
    try:
        import target_module
        if hasattr(target_module, '_original_function'):
            target_module.function = target_module._original_function
            delattr(target_module, '_original_function')
    except Exception as e:
        frappe.logger().error(f"Failed to restore override: {e}")
```

### 5. **Document Your Overrides**
```python
def enhanced_function(*args, **kwargs):
    """
    Enhanced version of original_module.function
    
    Changes:
    - Added input validation
    - Improved error handling
    - Added logging
    
    Args:
        *args: Original function arguments
        **kwargs: Original function keyword arguments
    
    Returns:
        Same as original function
    """
    pass
```

### 6. **Use Conditional Overrides**
```python
def apply_overrides():
    # Only apply if certain conditions are met
    if frappe.conf.get('enable_custom_overrides'):
        apply_user_overrides()
    
    if frappe.get_installed_apps().get('third_party_app'):
        apply_third_party_overrides()
```

## Common Use Cases

### Use Case 1: Fixing Third-Party App Bugs

```python
# In custom_app/overrides/third_party_fixes.py
def apply_bug_fixes():
    """Fix known bugs in third-party apps"""
    try:
        import third_party_app.utils
        
        # Store original
        third_party_app.utils._original_buggy_function = third_party_app.utils.buggy_function
        
        def fixed_function(*args, **kwargs):
            """Fixed version of buggy_function"""
            # Add proper validation
            if not args or not isinstance(args[0], str):
                return None
            
            return third_party_app.utils._original_buggy_function(*args, **kwargs)
        
        # Apply fix
        third_party_app.utils.buggy_function = fixed_function
        
    except ImportError:
        pass  # Third-party app not installed
```

### Use Case 2: Adding Logging to Core Functions

```python
def add_logging_overrides():
    """Add comprehensive logging to core functions"""
    import frappe.model.document
    
    original_insert = frappe.model.document.Document.insert
    
    def logged_insert(self, *args, **kwargs):
        """Document insert with logging"""
        start_time = time.time()
        
        try:
            result = original_insert(self, *args, **kwargs)
            duration = time.time() - start_time
            
            frappe.logger().info(f"Document inserted: {self.doctype} - {self.name} ({duration:.2f}s)")
            return result
            
        except Exception as e:
            frappe.logger().error(f"Document insert failed: {self.doctype} - {e}")
            raise
    
    frappe.model.document.Document.insert = logged_insert
```

### Use Case 3: Enhancing Security

```python
def apply_security_overrides():
    """Add additional security checks"""
    import frappe.handler
    
    original_handle = frappe.handler.handle
    
    def secure_handle():
        """Enhanced request handler with security checks"""
        # Add rate limiting
        if is_rate_limited(frappe.session.user):
            frappe.throw("Rate limit exceeded")
        
        # Add IP filtering
        if is_blocked_ip(frappe.local.request_ip):
            frappe.throw("Access denied")
        
        return original_handle()
    
    frappe.handler.handle = secure_handle
```

## Troubleshooting

### Common Issues and Solutions

#### **Issue 1: Override Not Applied**
```python
# Problem: Override applied too late
# Solution: Use boot_session hook
boot_session = "custom_app.overrides.apply_overrides"
```

#### **Issue 2: Circular Import**
```python
# Problem: Importing module causes circular dependency
# Solution: Import inside function
def apply_overrides():
    import target_module  # Import here, not at module level
    target_module.function = enhanced_function
```

#### **Issue 3: Override Conflicts**
```python
# Problem: Multiple apps overriding same function
# Solution: Check for existing overrides
def apply_overrides():
    import target_module
    
    if hasattr(target_module.function, '__name__'):
        if 'enhanced' in target_module.function.__name__:
            frappe.logger().warning("Function already overridden")
            return
    
    target_module.function = enhanced_function
```

#### **Issue 4: Testing Overrides**
```python
# Create test functions to verify overrides
def test_overrides():
    """Test that overrides are working correctly"""
    import target_module
    
    # Test that override is applied
    assert hasattr(target_module, '_original_function')
    assert target_module.function.__name__ == 'enhanced_function'
    
    # Test functionality
    result = target_module.function(test_input)
    assert result == expected_output
```

## Advanced Patterns

### Pattern 5: Decorator-Based Overrides

```python
def create_override_decorator(original_func):
    """Create a decorator that enhances the original function"""
    def decorator(enhancement_func):
        def wrapper(*args, **kwargs):
            # Pre-processing
            result = enhancement_func(*args, **kwargs)
            if result is not None:
                return result

            # Call original if enhancement returns None
            return original_func(*args, **kwargs)
        return wrapper
    return decorator

# Usage
import frappe.utils
original_cint = frappe.utils.cint

@create_override_decorator(original_cint)
def enhanced_cint(value, default=0):
    """Enhanced cint with special handling"""
    if isinstance(value, str) and value.startswith('SPECIAL_'):
        return int(value.replace('SPECIAL_', ''))
    return None  # Let original handle it

frappe.utils.cint = enhanced_cint
```

### Pattern 6: Context Manager Overrides

```python
from contextlib import contextmanager

@contextmanager
def temporary_override(module, function_name, new_function):
    """Temporarily override a function"""
    original = getattr(module, function_name)
    setattr(module, function_name, new_function)
    try:
        yield
    finally:
        setattr(module, function_name, original)

# Usage
with temporary_override(frappe.utils, 'cint', custom_cint):
    # Custom behavior active only in this block
    result = frappe.utils.cint("123")
```

### Pattern 7: Conditional Override Chain

```python
def create_override_chain():
    """Create a chain of conditional overrides"""
    import frappe.auth

    original_login = frappe.auth.login_manager.login

    def chained_login(self, *args, **kwargs):
        # Override 1: Custom authentication
        if frappe.conf.get('custom_auth_enabled'):
            if custom_authenticate(self.user):
                return original_login(self, *args, **kwargs)

        # Override 2: LDAP integration
        if frappe.conf.get('ldap_enabled'):
            if ldap_authenticate(self.user):
                return original_login(self, *args, **kwargs)

        # Override 3: Two-factor authentication
        if frappe.conf.get('2fa_enabled'):
            if verify_2fa(self.user):
                return original_login(self, *args, **kwargs)

        # Default behavior
        return original_login(self, *args, **kwargs)

    frappe.auth.login_manager.login = chained_login
```
## Summary

Monkey patching in Frappe is a powerful technique that should be used carefuly. Always prefer Frappe's built-in customization methods when possible, and use monkey patching only when necessary. Remember to:

- Always backup original functions
- Use proper error handling
- Document your changes completely (next developer after you will definitly need it)
- Provide restoration mechanisms to restore the old implementation if you uninstall the custom_override_app from your site
- Test your overrides as much as you can specially in production

With these patterns and best practices, you can safely extend and modify Frappe's behavior while maintaining system stability and upgrade compatibility.