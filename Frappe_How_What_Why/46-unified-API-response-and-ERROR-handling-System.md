# Unified Exception Handling and Response System for Custom APIs

## Overview

### The Problem
Traditional Frappe API error handling lacks consistency and structure. Developers face:
- **Inconsistent error formats** across different API endpoints
- **Poor error visibility** with generic messages that don't help debugging
- **No standardized HTTP status codes** for different error types
- **Mixed error handling approaches** leading to maintenance challenges
- **Limited debugging information** in production environments

### Our Solution
The API Exception Handling System provides a **unified approach** to error management for our custom Frappe APIs. It solves these challenges by:

- **Standardizing error responses** with consistent JSON structure across all endpoints
- **Providing structured error codes** and meaningful messages for better API consumer experience
- **Implementing proper HTTP status code mapping** for different error scenarios
- **Offering developer-friendly debugging** with detailed tracebacks in development mode
- **Ensuring production-ready error handling** with clean, user-friendly messages
- **Centralizing error management** through a single, extensible exception hierarchy

### Key Benefits
- **Consistent API experience** for all consumers
- **Faster debugging** with structured error information
- **Easier maintenance** through centralized error handling
- **Better error tracking** and monitoring capabilities
- **Professional API standards** that match industry best practices

### Key Features
- **Structured Error Responses**: Consistent JSON error format across all APIs
- **HTTP Status Code Mapping**: Automatic mapping of exceptions to appropriate HTTP status codes
- **Developer-Friendly**: Detailed error information in development mode
- **Production-Ready**: Clean error messages in production
- **Extensible**: Easy to create custom exception types
- **Frappe Integration**: Seamless integration with Frappe's response system

## Core Concepts

### 1. Exception Hierarchy
The system follows a hierarchical exception structure:
```
Exception (Python built-in)
└── APIException (Base class)
├── MissingFieldError (400 Bad Request)
└── MethodNotAllowedError (405 Method Not Allowed)
.
.
.etc and so on
```

### 2. Error Response Standardization
All exceptions are converted to a standardized JSON response format:
```json
{
    "success": false,
    "http_status": 400,
    "error_code": "400-001",
    "message": "Field username is required",
    "traceback": "..." // Only in development mode
}
```

### 3. Message Templating
Exceptions support dynamic message formatting using Python's string formatting:
```python
# Template: "Field {placeholder} is required"
# Usage: MissingFieldError(placeholder="username")
# Result: "Field username is required"
```


## Code Implementation

### File: `exceptions.py`

```python
import frappe

class APIException(Exception):
    """Base exception class for API-related errors."""
    
    http_status_code = 500
    error_code = "INTERNAL_SERVER_ERROR"
    message = "An unexpected error occurred"
    
    def __init__(self, message=None, **kwargs):
        """
        Initialize API exception.
        
        Args:
            message (str): Human-readable error message
            **kwargs: Additional data to include in response
        """
        # format message using kwargs if placeholders exist
        if not message:
            try:
                self.message = self.__class__.message.format(**kwargs)
            except (KeyError, IndexError):
                self.message = self.__class__.message
        else:
            self.message = message
        
        super().__init__(self.message)
    
    def to_dict(self):
        """Convert exception to API response format."""
        response = {
            "success": False,
            "http_status": self.http_status_code,
            "error_code": self.error_code,
            "message": self.message
        }
        
        # Include traceback only in development mode
        if frappe.conf.developer_mode:
            import traceback
            response["traceback"] = traceback.format_exc()
            
        return response
    
    def __str__(self):
        return f"[{self.error_code}] {self.message} (HTTP {self.http_status_code})"
    
    def respond(self):
        """Send error response and exit."""
        frappe.local.response.update(self.to_dict())
        frappe.local.response['http_status_code'] = self.http_status_code

#--------------------------------

class MissingFieldError(APIException):
    http_status_code = 400
    error_code = "400-001"
    message = "Field {placeholder} is required"

#--------------------------------

class MethodNotAllowedError(APIException):
    http_status_code = 405
    error_code = "405-001"
    message = "Method not allowed. Expected {expected_method} but received {actual_method}"
```

### File: `api.py`

```python
import frappe
import time
import uuid
from functools import wraps
from typing import Optional, Dict, Any, Callable, Tuple, Union
from .exceptions import APIException, MethodNotAllowedError

def api_response_normalizer(
    request_method: Optional[str] = None,
    success_message: Optional[str] = None,
    error_message: Optional[str] = None,
    validate_request: bool = True,
    log_request: bool = True,
    include_metadata: bool = True,
    override_frappe_response: bool = True
):
    """
    Enhanced decorator to handle API requests with comprehensive error handling,
    request validation, and response normalization using Frappe's response system.
    
    Args:
        request_method: Expected HTTP method. If None, auto-detects from frappe.request
        success_message: Custom success message. If None, auto-generates based on method
        error_message: Custom error message for unhandled exceptions
        validate_request: Whether to validate request method matches expected method
        log_request: Whether to log request details and execution time
        include_metadata: Whether to include request metadata in response
        override_frappe_response: Whether to override Frappe's default response handling
    
    Usage Scenarios:
    
    1. Basic API with auto-detection:
        @frappe.whitelist()
        @api_response_normalizer()
        def get_users():
            return frappe.get_all("User")
        # Response: {"success": true, "message": "Data retrieved successfully", "data": [...]}
    
    2. Method-specific API with validation:
        @frappe.whitelist()
        @api_response_normalizer(request_method="POST")
        def create_user():
            return {"id": 1, "name": "John"}
        # GET requests will return 405 Method Not Allowed
        # POST requests will return: {"success": true, "message": "Resource created successfully", "data": {...}}
    
    3. Custom success message:
        @frappe.whitelist()
        @api_response_normalizer(success_message="User profile updated")
        def update_profile():
            return {"status": "updated"}
        # Response: {"success": true, "message": "User profile updated", "data": {...}}
    
    4. Tuple return with custom message:
        @frappe.whitelist()
        @api_response_normalizer()
        def get_data():
            return {"users": [...]}, "Custom success message"
        # Response: {"success": true, "message": "Custom success message", "data": {...}}
    
    5. Error handling with custom message:
        @frappe.whitelist()
        @api_response_normalizer(error_message="Failed to process request")
        def risky_operation():
            if some_condition:
                raise Exception("Something went wrong")
            return {"result": "success"}
        # On error: {"success": false, "message": "Failed to process request", "http_status": 500}
    
    6. Minimal configuration (no validation, no logging):
        @frappe.whitelist()
        @api_response_normalizer(validate_request=False, log_request=False)
        def simple_endpoint():
            return {"status": "ok"}
    
    7. Use Frappe's default response handling:
        @frappe.whitelist()
        @api_response_normalizer(override_frappe_response=False)
        def frappe_default():
            return {"message": "This will be wrapped by Frappe"}
        # Response: {"message": {"message": "This will be wrapped by Frappe"}}
    
    8. Development mode with metadata:
        @frappe.whitelist()
        @api_response_normalizer(include_metadata=True)
        def debug_endpoint():
            return {"data": "value"}
        # Response includes: {"success": true, "message": "...", "data": {...}, "metadata": {"request_id": "...", "execution_time_ms": 45.67, ...}}
    
    9. Different HTTP methods:
        @frappe.whitelist()
        @api_response_normalizer(request_method="PUT")
        def update_resource():
            return {"updated": True}
        
        @frappe.whitelist()
        @api_response_normalizer(request_method="DELETE")
        def delete_resource():
            return {"deleted": True}
        
        @frappe.whitelist()
        @api_response_normalizer(request_method="PATCH")
        def partial_update():
            return {"patched": True}
    
    10. Complex API with all options:
        @frappe.whitelist()
        @api_response_normalizer(
            request_method="POST",
            success_message="Order created successfully",
            error_message="Failed to create order",
            validate_request=True,
            log_request=True,
            include_metadata=True
        )
        def create_order():
            return {"order_id": 123, "status": "pending"}
    
    Response Format:
        Success: {"success": true, "message": "...", "data": {...}, "metadata": {...}}
        Error: {"success": false, "http_status": 400, "error_code": "...", "message": "..."}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Initialize request tracking
            request_id = str(uuid.uuid4())[:8]
            start_time = time.time()
                      
            try:
                # Normalize request method to uppercase if provided
                normalized_request_method = request_method.upper() if request_method else None
                # Get and validate request context
                context = _get_request_context(normalized_request_method)
                if validate_request:
                    _validate_request(context, func.__name__)
                
                # Log request start
                if log_request:
                    _log_request_start(func.__name__, context, request_id)

                # Execute the function
                result = func(*args, **kwargs)
                
                # Handle response
                if override_frappe_response:
                    _set_success_response(
                        result, 
                        success_message or _get_success_message(context.get('method')),
                        context,
                        request_id,
                        start_time,
                        include_metadata,
                        log_request,
                        func.__name__
                    )
                else:
                    return result

            except APIException as e:
                _handle_api_exception(e, func.__name__, request_id, log_request, override_frappe_response)
            except Exception as e:
                _handle_unhandled_exception(e, func.__name__, request_id, log_request, error_message, override_frappe_response)

        return wrapper
    return decorator

def _get_request_context(request_method: Optional[str]) -> Dict[str, Any]:
    """Extract request context from frappe.request or use provided method."""
    # Safely extract request data
    actual_method = _safe_getattr(frappe.request, 'method', '').upper() or None
    endpoint = _safe_getattr(frappe.request, 'path')
    user = _safe_getattr(frappe.session, 'user')
    headers = dict(_safe_getattr(frappe.request, 'headers', {}))
    params = _safe_getattr(frappe.request, 'params', {})
    data = _safe_getattr(frappe.request, 'data', {})
    
    return {
        'method': request_method,
        'expected_method': request_method,
        'actual_method': actual_method,
        'endpoint': endpoint,
        'user': user,
        'headers': headers,
        'params': params,
        'data': data
    }

def _safe_getattr(obj: Any, attr: str, default: Any = None) -> Any:
    """Safely get attribute from object with default value."""
    return getattr(obj, attr, default) if obj else default

def _validate_request(context: Dict[str, Any], func_name: str) -> None:
    """Validate request method and basic parameters."""
    expected_method = context.get('expected_method')
    actual_method = context.get('actual_method')
    
    # Skip validation if no expected method is specified
    if not expected_method:
        return
    
    # Check if actual request method matches expected method
    if actual_method and actual_method != expected_method:
        raise MethodNotAllowedError(
            expected_method=expected_method,
            actual_method=actual_method
        )

def _set_success_response(
    result: Any,
    success_message: str,
    context: Dict[str, Any],
    request_id: str,
    start_time: float,
    include_metadata: bool,
    log_request: bool,
    func_name: str
) -> None:
    """Set success response using frappe.local.response."""
    # Handle tuple return (data, message)
    data, message = _extract_result_data(result, success_message)
    execution_time = round((time.time() - start_time) * 1000, 2)
    
    # Build response data
    response_data = {
        "success": True,
        "message": message,
        "data": data
    }
    
    # Add metadata if enabled and in developer mode
    if include_metadata and frappe.conf.developer_mode:
        response_data['metadata'] = {
            'request_id': request_id,
            'execution_time_ms': execution_time,
            'method': context.get('method'),
            'endpoint': context.get('endpoint', func_name)
        }
    
    # Set Frappe response
    frappe.local.response.update(response_data)
    frappe.local.response["http_status_code"] = 200
    
    # Log success
    if log_request:
        _log_request_success(func_name, request_id, execution_time)

def _extract_result_data(result: Any, success_message: str) -> Tuple[Any, str]:
    """Extract data and message from function result."""
    if isinstance(result, tuple) and len(result) == 2:
        data, custom_message = result
        return data, custom_message or success_message
    return result if result is not None else {}, success_message

def _set_error_response(exception: APIException) -> None:
    """Set error response using frappe.local.response."""
    error_data = exception.to_dict()
    frappe.local.response.update(error_data)
    frappe.local.response["http_status_code"] = exception.http_status_code

def _handle_api_exception(
    exception: APIException, 
    func_name: str, 
    request_id: str, 
    log_request: bool, 
    override_frappe_response: bool
) -> None:
    """Handle API exceptions."""
    if log_request:
        _log_api_exception(func_name, exception, request_id)
    
    if override_frappe_response:
        _set_error_response(exception)
    else:
        exception.respond()

def _handle_unhandled_exception(
    exception: Exception, 
    func_name: str, 
    request_id: str, 
    log_request: bool, 
    error_message: Optional[str], 
    override_frappe_response: bool
) -> None:
    """Handle unhandled exceptions."""
    if log_request:
        _log_unhandled_exception(func_name, exception, request_id)
    
    error_msg = error_message or f"An unexpected error occurred in {func_name}"
    api_exception = APIException(error_msg)
    
    if override_frappe_response:
        _set_error_response(api_exception)
    else:
        api_exception.respond()

def _get_success_message(method: str) -> str:
    """Get success message based on HTTP method."""
    messages = {
        'GET': 'Data retrieved successfully',
        'POST': 'Resource created successfully',
        'PUT': 'Resource updated successfully',
        'PATCH': 'Resource partially updated successfully',
        'DELETE': 'Resource deleted successfully',
        'HEAD': 'Headers retrieved successfully',
        'OPTIONS': 'Options retrieved successfully'
    }
    return messages.get(method, 'Request completed successfully')

def _log_request_start(func_name: str, context: Dict[str, Any], request_id: str) -> None:
    """Log request start with context."""
    frappe.logger().info(
        f"[API-{request_id}] Starting {func_name} - "
        f"Method: {context.get('method')}, "
        f"User: {context.get('user', 'Anonymous')}, "
        f"Endpoint: {context.get('endpoint', 'N/A')}"
    )

def _log_request_success(func_name: str, request_id: str, execution_time: float) -> None:
    """Log successful request completion."""
    frappe.logger().info(
        f"[API-{request_id}] Completed {func_name} successfully in {execution_time}ms"
    )

def _log_api_exception(func_name: str, exception: APIException, request_id: str) -> None:
    """Log API exception."""
    frappe.logger().error(
        f"[API-{request_id}] API Exception in {func_name}: {exception}"
    )

def _log_unhandled_exception(func_name: str, exception: Exception, request_id: str) -> None:
    """Log unhandled exception."""
    frappe.logger().error(
        f"[API-{request_id}] Unhandled exception in {func_name}: {str(exception)}"
    )

# Backward compatibility
def api_error_handler(func):
    """Backward compatibility alias for the old decorator name."""
    return api_response_normalizer()(func)
```
## Exception Classes

### 1. APIException (Base Class)

**Purpose**: Base class for all API-related exceptions

**Attributes**:
- `http_status_code`: HTTP status code (default: 500)
- `error_code`: Unique error identifier (default: "INTERNAL_SERVER_ERROR")
- `message`: Error message template (default: "An unexpected error occurred")

**Key Methods**:
- `__init__(message=None, **kwargs)`: Initialize with optional custom message or template formatting
- `to_dict()`: Convert exception to standardized JSON response
- `respond()`: Send error response using Frappe's response system
- `__str__()`: String representation for logging

**How it works**:
1. **Message Resolution**: If no custom message provided, attempts to format the class message template with provided kwargs
2. **Fallback Handling**: If template formatting fails, uses the default class message
3. **Response Building**: Creates standardized JSON response with success, http_status, error_code, and message
4. **Development Support**: Includes traceback in development mode for debugging

### 2. MissingFieldError

**Purpose**: Handle missing required fields in API requests

**Configuration**:
- HTTP Status: 400 (Bad Request)
- Error Code: "400-001"
- Message Template: "Field {placeholder} is required"

**Usage**:
```python
# Method 1: Direct exception raising (Recommended)
placeholder = "username"
raise MissingFieldError(placeholder=placeholder)

# Method 2: Using frappe.throw with custom exception
placeholder = "username"
frappe.throw(MissingFieldError(placeholder=placeholder))

# Method 3: Using frappe.throw with message and exception
placeholder = "username"
frappe.throw(f"Field {placeholder} is required", MissingFieldError)
```

### 3. MethodNotAllowedError

**Purpose**: Handle HTTP method validation errors

**Configuration**:
- HTTP Status: 405 (Method Not Allowed)
- Error Code: "405-001"
- Message Template: "Method not allowed. Expected {expected_method} but received {actual_method}"

**Usage**:
```python
# Automatic method validation
raise MethodNotAllowedError(expected_method="POST", actual_method="GET")
```

## Integration with API Decorator

The exception system integrates seamlessly with the `api_response_normalizer` decorator:

### Exception Handling Flow
```python
@frappe.whitelist()
@api_response_normalizer(request_method="POST")
def create_user():
    # Business logic here
    pass
```

**Process**:
1. **Request Validation**: Decorator validates HTTP method
2. **Method Mismatch**: If method doesn't match, raises `MethodNotAllowedError`
3. **Business Logic**: Executes the actual function
4. **Exception Catching**: Decorator catches all `APIException` instances
5. **Response Building**: Converts exception to standardized response
6. **Client Response**: Sends formatted JSON to client

### Error Handling in Decorator
```python
try:
    result = func(*args, **kwargs)
    # Success handling...
except APIException as e:
    _handle_api_exception(e, func.__name__, request_id, log_request, override_frappe_response)
except Exception as e:
    _handle_unhandled_exception(e, func.__name__, request_id, log_request, error_message, override_frappe_response)
```

## Usage Examples

### 1. Basic Field Validation
```python
@frappe.whitelist()
@api_response_normalizer()
def create_user():
    data = frappe.form_dict
    
    if not data.get('username'):
        raise MissingFieldError(placeholder="username")
    
    if not data.get('email'):
        raise MissingFieldError(placeholder="email")
    
    # Create user logic...
    return {"id": 1, "username": data['username']}
```

**Response for missing username**:
```json
{
    "success": false,
    "http_status": 400,
    "error_code": "400-001",
    "message": "Field username is required"
}
```

### 2. Method Validation
```python
@frappe.whitelist()
@api_response_normalizer(request_method="POST")
def update_user():
    # This will only accept POST requests
    return {"message": "User updated"}
```

**Response for GET request**:
```json
{
    "success": false,
    "http_status": 405,
    "error_code": "405-001",
    "message": "Method not allowed. Expected POST but received GET"
}
```

### 3. Custom Exception
```python
class UserNotFoundError(APIException):
    http_status_code = 404
    error_code = "404-001"
    message = "User with ID {user_id} not found"

# Usage
@frappe.whitelist()
@api_response_normalizer()
def get_user(user_id):
    user = frappe.get_doc("User", user_id)
    if not user:
        raise UserNotFoundError(user_id=user_id)
    return user
```

### 4. Complex Validation
```python
@frappe.whitelist()
@api_response_normalizer()
def create_booking():
    data = frappe.form_dict
    
    # Multiple field validation
    required_fields = ['hotel_id', 'check_in', 'check_out', 'guests']
    for field in required_fields:
        if not data.get(field):
            raise MissingFieldError(placeholder=field)
    
    # Business logic validation
    if data['check_in'] >= data['check_out']:
        raise APIException(
            message="Check-in date must be before check-out date",
            http_status_code=400,
            error_code="400-002"
        )
    
    # Create booking...
    return {"booking_id": 123}
```

## Best Practices

### 1. Exception Hierarchy
- Always inherit from `APIException` for API-related errors
- Use specific exception types for different error categories
- Maintain consistent error codes and HTTP status mappings

### 2. Error Messages
- Use descriptive, user-friendly error messages
- Leverage message templating for dynamic content
- Avoid exposing internal system details in production

### 3. Error Codes
- Use structured error codes (e.g., "400-001", "404-002")
- Document all error codes in API documentation
- Maintain consistency across the application

### 4. HTTP Status Codes
- Use appropriate HTTP status codes
- Follow REST API conventions
- Map business logic errors to appropriate status codes

### 5. Development vs Production
- Include detailed tracebacks only in development
- Use generic error messages in production
- Log detailed errors server-side for debugging

## Error Response Format

### Standard Response Structure
```json
{
    "success": false,
    "http_status": 400,
    "error_code": "400-001",
    "message": "Field username is required",
    "traceback": "Traceback (most recent call last):\n..." // Development only
}
```

### Field Descriptions
- **success**: Always `false` for error responses
- **http_status**: HTTP status code (400, 404, 405, 500, etc.)
- **error_code**: Unique error identifier for programmatic handling
- **message**: Human-readable error description
- **traceback**: Full Python traceback (development mode only)

## Development vs Production

### Development Mode
```python
# frappe.conf.developer_mode = True
{
    "success": false,
    "http_status": 400,
    "error_code": "400-001",
    "message": "Field username is required",
    "traceback": "Traceback (most recent call last):\n  File \"...\", line 123, in create_user\n    raise MissingFieldError(placeholder=\"username\")\nMissingFieldError: Field username is required"
}
```

### Production Mode
```python
# frappe.conf.developer_mode = False
{
    "success": false,
    "http_status": 400,
    "error_code": "400-001",
    "message": "Field username is required"
}
```

## Advanced Usage

### 1. Custom Exception with Additional Data
```python
class ValidationError(APIException):
    http_status_code = 422
    error_code = "422-001"
    message = "Validation failed"
    
    def __init__(self, message=None, errors=None, **kwargs):
        super().__init__(message, **kwargs)
        self.errors = errors or []
    
    def to_dict(self):
        response = super().to_dict()
        if self.errors:
            response['errors'] = self.errors
        return response

# Usage
raise ValidationError(
    message="Multiple validation errors occurred",
    errors=[
        {"field": "email", "message": "Invalid email format"},
        {"field": "password", "message": "Password too short"}
    ]
)
```

### 2. Exception Chaining
```python
@frappe.whitelist()
@api_response_normalizer()
def complex_operation():
    try:
        # Some operation that might fail
        result = risky_operation()
    except SomeSpecificError as e:
        # Re-raise as API exception with context
        raise APIException(
            message=f"Operation failed: {str(e)}",
            http_status_code=500,
            error_code="500-001"
        ) from e
```

### 3. Bulk Validation
```python
class BulkValidationError(APIException):
    http_status_code = 400
    error_code = "400-003"
    message = "Multiple validation errors occurred"
    
    def __init__(self, validation_errors, **kwargs):
        super().__init__(**kwargs)
        self.validation_errors = validation_errors
    
    def to_dict(self):
        response = super().to_dict()
        response['validation_errors'] = self.validation_errors
        return response

# Usage
validation_errors = []
if not username: validation_errors.append({"field": "username", "message": "Required"})
if not email: validation_errors.append({"field": "email", "message": "Required"})

if validation_errors:
    raise BulkValidationError(validation_errors=validation_errors)
```
