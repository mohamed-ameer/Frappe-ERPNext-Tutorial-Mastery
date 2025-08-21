# Frappe Response Handling Documentation

## Overview

Frappe provides two main response handling mechanisms: `frappe.local.response` and `frappe.response`. Understanding the difference between these is crucial for building proper API endpoints and controlling response structures in Frappe applications.

## Core Concepts

### Thread-Local Storage
Frappe uses Werkzeug's `Local` class for thread-local storage, which means each request gets its own isolated storage space. This prevents data leakage between concurrent requests.

```python
from werkzeug.local import Local
local = Local()
```

### Response Initialization
When Frappe initializes for a site, it sets up the response object:

```python
local.response = _dict({"docs": []})
```

The `_dict` is Frappe's custom dictionary class that provides additional functionality.

## frappe.local.response

`frappe.local.response` is the **actual response object** that gets serialized and sent back to the client. It's a thread-local dictionary that stores all response data.

### Access Pattern
```python
response = local("response")  # Creates a LocalProxy
```

This creates a `LocalProxy` that automatically accesses the thread-local `response` object.

### Structure
The default structure of `frappe.local.response` is:
```python
{
    "docs": [],  # Default empty list for documents
    # Other response data gets added here
}
```

### Key Properties

#### 1. HTTP Status Code
```python
frappe.local.response["http_status_code"] = 200  # Success
frappe.local.response["http_status_code"] = 400  # Bad Request
frappe.local.response["http_status_code"] = 401  # Unauthorized
frappe.local.response["http_status_code"] = 404  # Not Found
frappe.local.response["http_status_code"] = 500  # Internal Server Error
```

#### 2. Response Type
```python
frappe.local.response["type"] = "json"      # JSON response
frappe.local.response["type"] = "csv"       # CSV download
frappe.local.response["type"] = "pdf"       # PDF download
frappe.local.response["type"] = "binary"    # Binary file download
frappe.local.response["type"] = "redirect"  # Redirect response
frappe.local.response["type"] = "page"      # Web page response
```

#### 3. File Downloads
```python
frappe.local.response["filename"] = "report.pdf"
frappe.local.response["filecontent"] = pdf_content
frappe.local.response["type"] = "download"
```

#### 4. Custom Data
```python
# Add any custom data to the response
frappe.local.response["custom_field"] = "custom_value"
frappe.local.response["data"] = {"key": "value"}
```

## frappe.response

`frappe.response` is a **LocalProxy** that provides convenient access to `frappe.local.response`. It's essentially a shorthand for accessing the thread-local response object.

### Access Pattern
```python
# These are equivalent:
frappe.response["message"] = "Hello"
frappe.local.response["message"] = "Hello"
```

### Default Behavior
By default, Frappe's handler automatically wraps return values in a `message` field:

```python
# If your function returns "Hello World"
def my_api():
    return "Hello World"

# The response becomes:
{
    "message": "Hello World"
}
```

## Key Differences

| Aspect | frappe.local.response | frappe.response |
|--------|----------------------|-----------------|
| **Type** | Actual dictionary object | LocalProxy (accessor) |
| **Direct Access** | Yes | Yes (via proxy) |
| **Default Wrapping** | No | Yes (adds "message" field) |
| **Control Level** | Full control | Full control |
| **Use Case** | Custom response structures | Standard Frappe responses |

## Response Flow

### 1. Request Processing
```python
# Request comes in
# Frappe initializes thread-local storage
local.response = _dict({"docs": []})
```

### 2. API Execution
```python
@frappe.whitelist()
def my_api():
    # Your custom logic here
    data = {"status": "success", "data": [1, 2, 3]}
    
    # Option 1: Use frappe.local.response for full control
    frappe.local.response["http_status_code"] = 200
    frappe.local.response["custom_data"] = data
    frappe.local.response.pop("message", None)  # Remove default message
    
    # Option 2: Return data (gets wrapped in "message")
    return data
```

### 3. Response Building
```python
# In frappe/utils/response.py
def as_json():
    response = Response()
    if frappe.local.response.http_status_code:
        response.status_code = frappe.local.response["http_status_code"]
        del frappe.local.response["http_status_code"]
    
    response.mimetype = "application/json"
    response.data = json.dumps(frappe.local.response, default=json_handler)
    return response
```

### 4. Response Types
Frappe supports multiple response types:

#### JSON Response
```python
frappe.local.response["type"] = "json"  # Default
# Returns JSON with all data in frappe.local.response
```

#### File Download
```python
frappe.local.response["type"] = "download"
frappe.local.response["filename"] = "file.pdf"
frappe.local.response["filecontent"] = pdf_content
```

#### Redirect
```python
frappe.local.response["type"] = "redirect"
frappe.local.response["location"] = "/new-url"
```

## Best Practices

### 1. Use frappe.local.response for Custom APIs
When building custom APIs that need specific response structures:

```python
@frappe.whitelist()
def custom_api():
    try:
        # Your logic here
        result = {"status": "success", "data": [...]}
        
        # Set custom response
        frappe.local.response["http_status_code"] = 200
        frappe.local.response["result"] = result
        frappe.local.response.pop("message", None)  # Remove default
        
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        frappe.local.response["error"] = str(e)
        frappe.local.response.pop("message", None)
```

### 2. Handle Status Codes Properly
Always set appropriate HTTP status codes:

```python
# Success
frappe.local.response["http_status_code"] = 200

# Client Errors
frappe.local.response["http_status_code"] = 400  # Bad Request
frappe.local.response["http_status_code"] = 401  # Unauthorized
frappe.local.response["http_status_code"] = 403  # Forbidden
frappe.local.response["http_status_code"] = 404  # Not Found

# Server Errors
frappe.local.response["http_status_code"] = 500  # Internal Server Error
```

### 3. Remove Default Message When Needed
If you want a custom response structure, remove the default message:

```python
frappe.local.response.pop("message", None)
```

### 4. Use Consistent Error Handling
```python
def api_with_error_handling():
    try:
        # Your logic
        pass
    except ValidationError as e:
        frappe.local.response["http_status_code"] = 400
        frappe.local.response["error"] = str(e)
        frappe.local.response.pop("message", None)
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        frappe.local.response["error"] = "Internal server error"
        frappe.local.response.pop("message", None)
```

## Common Use Cases

### 1. Custom JSON API Response
```python
@frappe.whitelist()
def get_custom_data():
    data = {
        "items": [{"id": 1, "name": "Item 1"}],
        "total": 1,
        "page": 1
    }
    
    frappe.local.response["http_status_code"] = 200
    frappe.local.response["data"] = data
    frappe.local.response.pop("message", None)
```

### 2. File Download
```python
@frappe.whitelist()
def download_report():
    pdf_content = generate_pdf()
    
    frappe.local.response["type"] = "download"
    frappe.local.response["filename"] = "report.pdf"
    frappe.local.response["filecontent"] = pdf_content
```

### 3. Error Response
```python
@frappe.whitelist()
def api_with_validation():
    if not frappe.form_dict.get("required_field"):
        frappe.local.response["http_status_code"] = 400
        frappe.local.response["error"] = "Required field is missing"
        frappe.local.response.pop("message", None)
        return
```

### 4. Redirect Response
```python
@frappe.whitelist()
def redirect_after_action():
    # Process something
    frappe.local.response["type"] = "redirect"
    frappe.local.response["location"] = "/app/success-page"
```

## Examples

### Example 1: Device Price API
```python
@frappe.whitelist(allow_guest=True)
def get_device_price(phone: dict) -> dict:
    try:
        # Validation and processing logic...
        
        # Custom response structure
        frappe.local.response["http_status_code"] = 200
        frappe.local.response[device_data] = device_data
        frappe.local.response.pop("message", None)  # Remove default message
        
    except Exception as e:
        frappe.local.response["http_status_code"] = 500
        frappe.local.response["error"] = "An unexpected error occurred"
        frappe.local.response.pop("message", None)
```

### Example 2: Standard Frappe Response
```python
@frappe.whitelist()
def standard_api():
    # This will be wrapped in {"message": "Hello World"}
    return "Hello World"
```

### Example 3: Document List Response
```python
@frappe.whitelist()
def get_documents():
    docs = frappe.get_all("User", fields=["name", "full_name"])
    
    # This will be wrapped in {"message": docs}
    return docs
```

## Response Type Mapping

Frappe maps response types to specific handlers:

```python
response_type_map = {
    "csv": as_csv,
    "txt": as_txt,
    "download": as_raw,
    "json": as_json,      # Default
    "pdf": as_pdf,
    "page": as_page,
    "redirect": redirect,
    "binary": as_binary,
}
```

## Important Notes

1. **Thread Safety**: Both `frappe.local.response` and `frappe.response` are thread-safe due to Werkzeug's Local implementation.

2. **Default Behavior**: Frappe automatically wraps return values in a `message` field unless you explicitly control the response structure.

3. **Status Code Handling**: HTTP status codes are automatically removed from the response body and set as the actual HTTP status code.

4. **JSON Serialization**: Frappe automatically handles JSON serialization of complex objects like dates, decimals, and Frappe documents.

5. **Error Handling**: Always handle exceptions and set appropriate status codes for proper API behavior.

---

# LocalProxy Explained

## What is LocalProxy?

`LocalProxy` is a **lazy accessor** from Werkzeug that provides thread-safe access to thread-local data.

- **Thread-Local Storage**  
  A mechanism that provides isolated data storage for each thread, ensuring that data from one request does not interfere with another.

- **Proxy Pattern**  
  A design pattern where a "proxy" object acts as an intermediary to control access to another object — in Frappe, it enables dynamic access to context-specific data.

- **Thread Safety**  
  The property of code or data that ensures safe execution in a multi-threaded environment without race conditions or data corruption.

- **Request Context**  
  The environment or scope of a single HTTP request, including data like the current user, session, and database connection.

## Simple Definition

```python
# Instead of direct access:
actual_data = local.response

# LocalProxy creates a "promise" to access later:
proxy = local("response")  # Promise to access local.response
```

## How It Works

### 1. Creation (No Data Access)
```python
response = local("response")  # Creates proxy, doesn't access data yet
```

### 2. Usage (Automatic Access)
```python
response["message"] = "Hello"  # Automatically accesses local.response["message"]
```

## Visual Example

```python
from werkzeug.local import Local, LocalProxy

# Create storage
local = Local()

# Create proxy
my_proxy = local("my_data")

# Initialize data
local.my_data = {"name": "John"}

# Use proxy (automatically accesses real data)
print(my_proxy["name"])  # "John"
my_proxy["age"] = 30     # local.my_data["age"] = 30
```

## Frappe Implementation

```python
# In frappe/__init__.py
local = Local()                    # Thread-local storage
response = local("response")       # Create proxy

# Later in init():
local.response = _dict({"docs": []})  # Initialize actual data

# Usage:
frappe.response["message"] = "Hello"  # Proxy accesses local.response
```


## What Happens Behind the Scenes

```python
# When you do this:
frappe.response["message"] = "Hello"

# LocalProxy automatically does this:
frappe.local.response["message"] = "Hello"
```

## Summary

`LocalProxy` = **Smart pointer** that:
- Remembers what data to access
- Accesses it automatically when used
- Provides thread safety
- Makes APIs cleaner

**In Frappe**: `frappe.response` is a `LocalProxy` to `frappe.local.response` 

So `frappe.response` is indeed a LocalProxy that automatically accesses `frappe.local.response`, which is the actual `_dict` object containing your response data.

This is why both of these work identically:
```python
frappe.response["message"] = "Hello"
frappe.local.response["message"] = "Hello"
```
The proxy pattern allows Frappe to provide convenient access to thread-local data while maintaining thread safety.

---

### In Short

Use `frappe.local.response` when you need full control over the response structure, and use `frappe.response` (or return values) for standard Frappe responses. Always set appropriate HTTP status codes and handle errors properly for a professional API experience. 
