# Frappe Call Method: run_doc_method()

## Overview

Ever wondered how you can call a DocType method from JavaScript without creating the object first? And why does Postman give you "Method not found" when you try to call it directly?!

`frappe.call()` is a revolutionary mechanism in Frappe that fundamentally transforms client-server communication by allowing JavaScript to execute Python DocType methods directly without manual object creation or management. 

When you call `frm.call('method_name')` from a form, Frappe automatically takes your current document data, creates a Document object on the server using `frappe.get_doc()`, executes your whitelisted method on that object, and returns the result - all while handling serialization, security validation, permission checks, and error management transparently. 

This is why JavaScript calls work seamlessly but Postman fails with "Method not found" when you try to call the method directly, because Postman needs to use the special `run_doc_method` endpoint with the complete document data structure rather than just the method name. 

The system eliminates the need for traditional API endpoints, manual object instantiation, and complex serialization logic, making it possible to focus purely on business logic while Frappe handles all the underlying orchestration, security, and data flow between frontend and backend automatically.

## How frappe.call() Works

### The Core Architecture

The `frappe.call()` system consists of two main components:

1. **`run_doc_method`** - The entry point that creates document objects
2. **`run_method`** - The executor that runs your actual methods

### High-Level Flow

```
Client JavaScript → frappe.call() → HTTP Request → Server Handler → run_doc_method() → run_method() → Your Method → Response → Client

1. Client calls frappe.call() 
    ↓
2. Server calls run_doc_method()
    ↓
3. run_doc_method() creates document object
    ↓
4. run_doc_method() calls doc.run_method()
    ↓
5. run_method() finds and executes your method
    ↓
6. Result goes back to client
```

## Client-Side Implementation

### Basic Syntax

```javascript
frappe.call({
    method: "method_path",
    args: {
        // Your arguments
    },
    callback: function(response) {
        // Handle response
    },
    error: function(error) {
        // Handle errors
    }
});
```

### Form Integration

```javascript
// Using with forms
frappe.ui.form.on('DocType', {
    refresh: function(frm) {
        frm.add_custom_button('Custom Action', function() {
            frm.call('method_name', {
                param1: 'value1',
                param2: 'value2'
            }).then(function(response) {
                // Handle success
                frm.set_value('field_name', response.message);
                frm.refresh_field('field_name');
            });
        });
    }
});
```

### Promise-Based Approach

```javascript
// Modern async/await approach
async function executeMethod() {
    try {
        const response = await frappe.xcall('method_path', {
            param1: 'value1',
            param2: 'value2'
        });
        console.log('Result:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

## Server-Side Implementation

### Document Method Structure

```python
class YourDocType(Document):
    @frappe.whitelist()
    def your_method(self, param1=None, param2=None):
        """
        Your custom method
        
        Args:
            param1: First parameter
            param2: Second parameter
            
        Returns:
            Any: Your return value
        """
        # Your business logic here
        result = self.some_field * 2
        
        # You can modify the document
        self.some_other_field = result
        
        # Return the result
        return result
```

### Module Method Structure

```python
# In your module file (e.g., myapp/utils/calculations.py)
import frappe

@frappe.whitelist()
def calculate_something(param1, param2):
    """
    Standalone method (not tied to a document)
    
    Args:
        param1: First parameter
        param2: Second parameter
        
    Returns:
        Any: Calculation result
    """
    # Your logic here
    return param1 + param2
```

## Document Method Execution Flow

### Step-by-Step Process

1. **Client Request**
   ```javascript
   frm.call('calculate_total', {multiplier: 1.5})
   ```

2. **Request Processing**
   ```javascript
   // Client automatically creates:
   {
       cmd: "run_doc_method",
       docs: frm.doc,  // Current document data
       method: "calculate_total",
       args: {multiplier: 1.5}
   }
   ```

3. **Server Handler**
   ```python
   def run_doc_method(method, docs=None, dt=None, dn=None, args=None):
       # Create document object
       if dt:
           doc = frappe.get_doc(dt, dn)
       else:
           docs = frappe.parse_json(docs)
           doc = frappe.get_doc(docs)
           doc._original_modified = doc.modified
           doc.check_if_latest()
       
       # Security check
       method_obj = getattr(doc, method)
       fn = getattr(method_obj, "__func__", method_obj)
       is_whitelisted(fn)
       
       # Execute method
       response = doc.run_method(method, **args)
       
       # Return response
       frappe.response.docs.append(doc)
       frappe.response["message"] = response
   ```

4. **Method Execution**
   ```python
   def run_method(self, method, *args, **kwargs):
       # Get method object
       method_object = getattr(self, method, None)
       
       # Execute with hooks
       out = Document.hook(fn)(self, *args, **kwargs)
       
       # Run additional triggers
       self.run_notifications(method)
       run_webhooks(self, method)
       run_server_script_for_doc_event(self, method)
       
       return out
   ```

## Security: Whitelist System

### Whitelisting Methods

All methods must be whitelisted for security:

```python
@frappe.whitelist()
def public_method(self):
    # This can be called from client
    pass

def private_method(self):
    # This CANNOT be called from client
    pass
```

### Permission Checks

```python
@frappe.whitelist()
def secure_method(self):
    # Check permissions
    if not self.has_permission("write"):
        frappe.throw("Not permitted")
    
    # Your logic here
    pass
```

## Postman Integration

#### Example 1: Call Document Method with Document Data

```http
POST {{base_url}}/api/method/run_doc_method
Content-Type: application/json
Authorization: token {{api_key}}:{{api_secret}}

{
    "method": "calculate_tax",
    "docs": {
        "doctype": "Sales Invoice",
        "name": "SI-2024-00001",
        "grand_total": 1000,
        "total_taxes": 0
    },
    "args": {
        "tax_rate": 0.1
    }
}
```

#### Example 2: Call Document Method with DocType and Name

```http
POST {{base_url}}/api/method/run_doc_method
Content-Type: application/json
Authorization: token {{api_key}}:{{api_secret}}

{
    "method": "calculate_tax",
    "dt": "Sales Invoice",
    "dn": "SI-2024-00001",
    "args": {
        "tax_rate": 0.1
    }
}
```

#### Example 3: Call Module Method

```http
POST {{base_url}}/api/method/myapp.utils.currency.get_exchange_rate
Content-Type: application/json
Authorization: token {{api_key}}:{{api_secret}}

{
    "from_currency": "USD",
    "to_currency": "EUR",
    "date": "2024-01-01"
}
```
### In SHORT:

#### To Call Document Method
```http
POST {{base_url}}/api/method/run_doc_method
Content-Type: application/json
Authorization: token {{api_key}}:{{api_secret}}

{
    "method": "{{method_name}}",
    "dt": "{{doctype}}",
    "dn": "{{docname}}",
    "args": {
        "param1": "{{param1_value}}",
        "param2": "{{param2_value}}"
    }
}
```

#### To Call Module Method
```http
POST {{base_url}}/api/method/{{module_method_path}}
Content-Type: application/json
Authorization: token {{api_key}}:{{api_secret}}

{
    "param1": "{{param1_value}}",
    "param2": "{{param2_value}}"
}
```

## Conclusion

The `frappe.call()` system represents a paradigm shift in web development, eliminating the traditional complexity of client-server communication by providing a seamless, secure, and intelligent bridge that handles all the heavy lifting automatically. 

By understanding the core flow between `run_doc_method` (which creates document objects) and `run_method` (which executes your business logic), we can build robust applications without worrying about object lifecycle management, serialization, or security implementation. 

The key to success lies in five fundamental principles: properly whitelisting methods with `@frappe.whitelist()`, implementing comprehensive error handling with try-catch blocks and meaningful user feedback, following best practices for method design with clear documentation and input validation, leveraging Postman for API testing using the correct `run_doc_method` endpoint structure, and understanding the security implications of each method through permission checks and audit trails.

This revolutionary approach transforms Frappe from just another framework into a developer-friendly platform that allows you to focus entirely on solving business problems rather than wrestling with infrastructure concerns, making it possible to build enterprise-grade applications with significantly less code, fewer bugs, and faster development cycles while maintaining the highest standards of security and maintainability.

---

## Key Files to Study for Implementation Understanding

### Core Client-Side Files
- **`/apps/frappe/frappe/public/js/frappe/request.js`** - Main `frappe.call()` implementation, handles HTTP requests and response processing
- **`/apps/frappe/frappe/public/js/frappe/form/form.js`** - Form integration with `frm.call()` method and document method execution
- **`/apps/frappe/frappe/public/js/frappe/website/js/website.js`** - Website-specific call implementations and error handling

### Server-Side Core Files
- **`/apps/frappe/frappe/handler.py`** - Main server handler with `run_doc_method()` function (lines 301-358)
- **`/apps/frappe/frappe/model/document.py`** - Document class with `run_method()` implementation (lines 999-1017)
- **`/apps/frappe/frappe/api/v2.py`** - Modern API endpoints including `execute_doc_method()` and `run_doc_method()` (lines 137-182)
- **`/apps/frappe/frappe/api/v1.py`** - Legacy API endpoints for document method execution (lines 81-95)

### Security and Validation Files
- **`/apps/frappe/frappe/utils/safe_exec.py`** - Security functions including `is_whitelisted()` and method validation
- **`/apps/frappe/frappe/core/doctype/server_script/server_script_utils.py`** - Server script execution and document event handling
- **`/apps/frappe/frappe/__init__.py`** - Core Frappe initialization and method whitelisting functions

### Form and UI Integration Files
- **`/apps/frappe/frappe/public/js/frappe/form/save.js`** - Document saving and method integration
- **`/apps/frappe/frappe/public/js/frappe/form/controls/button.js`** - Button controls that trigger method calls
- **`/apps/frappe/frappe/public/js/frappe/ui/messages.js`** - Message handling and user feedback

### Testing and Examples
- **`/apps/frappe/frappe/tests/test_client.py`** - Client-side testing examples
- **`/apps/frappe/cypress/support/commands.js`** - Cypress testing commands for API calls

### Configuration and Hooks
- **`/apps/frappe/frappe/core/doctype/client_script/client_script.js`** - Client script execution and method calling
- **`/apps/frappe/frappe/model/workflow.py`** - Workflow integration with document methods