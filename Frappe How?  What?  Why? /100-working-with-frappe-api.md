# Complete Guide to Working with APIs in Frappe

This guide explains how to create, consume, and manage APIs in Frappe Framework, covering both server-side and client-side implementations.

---

## Table of Contents

1. [Understanding the Code Snippet](#understanding-the-code-snippet)
2. [API Architecture in Frappe](#api-architecture-in-frappe)
3. [Creating Server-Side APIs](#creating-server-side-apis)
4. [Consuming APIs (Client-Side)](#consuming-apis-client-side)
5. [Request Data Handling](#request-data-handling)
6. [Response Handling](#response-handling)
7. [Authentication & Permissions](#authentication--permissions)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Best Practices](#best-practices)

---

## Understanding the Code Snippet

### The Import Statement with Fallback

```python
try:
    from frappe.api.v1 import get_request_form_data
except ImportError:
    from frappe.api import get_request_form_data
```

**Purpose**: Ensures **backward compatibility** across different Frappe versions.

**How it works:**
1. **Try** to import from `frappe.api.v1` (Frappe v14+)
2. **Fallback** to `frappe.api` if v1 doesn't exist (older versions)
3. **Result**: Code works seamlessly across versions

**Why this matters:**
- Frappe introduced API versioning in v14
- Apps need to support multiple Frappe versions
- Prevents `ImportError` crashes

### The get_request_form_data() Function

**Source:** `frappe/frappe/api/v1.py` (lines 98-107)

```python
def get_request_form_data():
    if frappe.form_dict.data is None:
        data = frappe.safe_decode(frappe.request.get_data())
    else:
        data = frappe.form_dict.data

    try:
        return frappe.parse_json(data)
    except ValueError:
        return frappe.form_dict
```

**Step-by-Step Breakdown:**

#### Step 1: Check for Existing Data
```python
if frappe.form_dict.data is None:
```
- `frappe.form_dict` contains parsed request parameters
- If `.data` is `None`, raw request body needs to be read

#### Step 2: Get Raw Request Data
```python
data = frappe.safe_decode(frappe.request.get_data())
```
- `frappe.request.get_data()` - Gets raw bytes from request body
- `frappe.safe_decode()` - Converts bytes to UTF-8 string safely

#### Step 3: Parse JSON
```python
try:
    return frappe.parse_json(data)
except ValueError:
    return frappe.form_dict
```
- **Try**: Parse as JSON (for `application/json` requests)
- **Catch**: If parsing fails, return form data (for `application/x-www-form-urlencoded`)

**Use Cases:**

| Request Type | Content-Type | Handling |
|--------------|--------------|----------|
| JSON POST | `application/json` | Parsed as JSON |
| Form POST | `application/x-www-form-urlencoded` | Returns form_dict |
| GET with params | N/A | Returns form_dict |

---

## API Architecture in Frappe

### API Versioning

Frappe supports multiple API versions:

```
/api/method/{method}          → v1 (default, backward compatible)
/api/v1/method/{method}       → v1 (explicit)
/api/v2/method/{method}       → v2 (latest)
```

**Source:** `frappe/frappe/api/__init__.py` (lines 20-42)

### API Endpoints Structure

#### 1. RPC-Style Endpoints (Method Calls)
```
POST /api/method/{path.to.method}
```

#### 2. RESTful Resource Endpoints
```
GET    /api/resource/{doctype}              → List documents
POST   /api/resource/{doctype}              → Create document
GET    /api/resource/{doctype}/{name}       → Read document
PUT    /api/resource/{doctype}/{name}       → Update document
DELETE /api/resource/{doctype}/{name}       → Delete document
```

**Source:** `frappe/frappe/api/v1.py` (lines 110-117)

```python
url_rules = [
    Rule("/method/<path:method>", endpoint=handle_rpc_call),
    Rule("/resource/<doctype>", methods=["GET"], endpoint=document_list),
    Rule("/resource/<doctype>", methods=["POST"], endpoint=create_doc),
    Rule("/resource/<doctype>/<path:name>/", methods=["GET"], endpoint=read_doc),
    Rule("/resource/<doctype>/<path:name>/", methods=["PUT"], endpoint=update_doc),
    Rule("/resource/<doctype>/<path:name>/", methods=["DELETE"], endpoint=delete_doc),
]
```

---

## Creating Server-Side APIs

### 1. Basic Whitelisted Method

**Source:** `frappe/frappe/__init__.py` (lines 813-826)

```python
@frappe.whitelist()
def get_user_info(user_id):
    """Get user information by ID"""
    user = frappe.get_doc("User", user_id)
    return {
        "name": user.name,
        "full_name": user.full_name,
        "email": user.email
    }
```

**Endpoint:** `POST /api/method/myapp.api.get_user_info`

**Request:**
```json
{
    "user_id": "john@example.com"
}
```

**Response:**
```json
{
    "message": {
        "name": "john@example.com",
        "full_name": "John Doe",
        "email": "john@example.com"
    }
}
```

### 2. Allow Guest Access

```python
@frappe.whitelist(allow_guest=True)
def get_public_data():
    """Accessible without login"""
    return {
        "company_name": frappe.db.get_single_value("System Settings", "company_name"),
        "timezone": frappe.db.get_single_value("System Settings", "time_zone")
    }
```

**Use Cases:**
- Public APIs
- Login/signup endpoints
- Public data retrieval

### 3. Restrict HTTP Methods

```python
@frappe.whitelist(methods=["POST"])
def create_order(customer, items):
    """Only accepts POST requests"""
    order = frappe.get_doc({
        "doctype": "Sales Order",
        "customer": customer,
        "items": items
    })
    order.insert()
    return order.name
```

**Allowed Methods:**
- `GET` - Read operations
- `POST` - Create operations
- `PUT` - Update operations
- `DELETE` - Delete operations
- `PATCH` - Partial updates

### 4. DocType Controller Methods

```python
# File: myapp/myapp/doctype/sales_order/sales_order.py

class SalesOrder(Document):
    @frappe.whitelist()
    def approve_order(self):
        """Approve this sales order"""
        self.status = "Approved"
        self.save()
        return {"status": "success", "message": "Order approved"}
```

**Endpoint:** `POST /api/method/run_doc_method`

**Request:**
```json
{
    "dt": "Sales Order",
    "dn": "SO-0001",
    "method": "approve_order"
}
```

### 5. Handling Different Request Data Formats

#### JSON Request Body
```python
@frappe.whitelist()
def process_json_data():
    """Handles JSON request body"""
    data = frappe.request.get_data()
    parsed = frappe.parse_json(data)
    return {"received": parsed}
```

#### Form Data
```python
@frappe.whitelist()
def process_form_data():
    """Handles form-encoded data"""
    name = frappe.form_dict.get("name")
    email = frappe.form_dict.get("email")
    return {"name": name, "email": email}
```

#### Using get_request_form_data()
```python
from frappe.api.v1 import get_request_form_data

@frappe.whitelist()
def process_any_data():
    """Handles both JSON and form data"""
    data = get_request_form_data()
    # Works with both content types
    return data
```

### 6. File Upload API

**Source:** `frappe/frappe/handler.py` (lines 169-179)

```python
@frappe.whitelist(allow_guest=True)
def upload_file():
    """Upload file endpoint"""
    # Built-in Frappe method
    pass
```

**Custom File Upload:**
```python
@frappe.whitelist()
def upload_document():
    """Upload file and attach to document"""
    if frappe.request.files:
        file = frappe.request.files['file']

        # Save file
        file_doc = frappe.get_doc({
            "doctype": "File",
            "file_name": file.filename,
            "content": file.stream.read(),
            "is_private": 1
        })
        file_doc.save()

        return {
            "file_url": file_doc.file_url,
            "file_name": file_doc.file_name
        }
```

---

## Consuming APIs (Client-Side)

### 1. JavaScript - frappe.call()

**Source:** `frappe/frappe/public/js/frappe/request.js` (lines 29-126)

#### Basic Call
```javascript
frappe.call({
    method: 'myapp.api.get_user_info',
    args: {
        user_id: 'john@example.com'
    },
    callback: function(r) {
        if (r.message) {
            console.log(r.message);
        }
    }
});
```

#### With Error Handling
```javascript
frappe.call({
    method: 'myapp.api.create_order',
    args: {
        customer: 'CUST-001',
        items: [{item_code: 'ITEM-001', qty: 10}]
    },
    freeze: true,
    freeze_message: __('Creating order...'),
    callback: function(r) {
        if (!r.exc) {
            frappe.msgprint(__('Order created: {0}', [r.message]));
        }
    },
    error: function(r) {
        frappe.msgprint(__('Failed to create order'));
    }
});
```

#### Async/Await with frappe.xcall()

**Source:** `frappe/frappe/public/js/frappe/request.js` (lines 13-26)

```javascript
async function getUserInfo(userId) {
    try {
        const data = await frappe.xcall('myapp.api.get_user_info', {
            user_id: userId
        });
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### 2. JavaScript - Fetch API

```javascript
async function callAPI() {
    const response = await fetch('/api/method/myapp.api.get_user_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': frappe.csrf_token
        },
        body: JSON.stringify({
            user_id: 'john@example.com'
        })
    });

    const data = await response.json();
    return data.message;
}
```

### 3. Python - requests Library

```python
import requests

def call_frappe_api():
    url = "https://your-site.com/api/method/myapp.api.get_user_info"

    # Login first to get cookies
    session = requests.Session()
    session.post("https://your-site.com/api/method/login", data={
        "usr": "user@example.com",
        "pwd": "password"
    })

    # Make API call
    response = session.post(url, json={
        "user_id": "john@example.com"
    })

    data = response.json()
    return data["message"]
```

### 4. cURL

```bash
# Login and get cookies
curl -X POST https://your-site.com/api/method/login \
  -H "Content-Type: application/json" \
  -d '{"usr":"user@example.com","pwd":"password"}' \
  -c cookies.txt

# Call API with cookies
curl -X POST https://your-site.com/api/method/myapp.api.get_user_info \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"user_id":"john@example.com"}'
```

### 5. RESTful Resource API

#### List Documents
```bash
curl -X GET "https://your-site.com/api/resource/User?fields=[\"name\",\"email\"]&limit_page_length=10" \
  -H "Authorization: token api_key:api_secret"
```

#### Get Single Document
```bash
curl -X GET "https://your-site.com/api/resource/User/john@example.com" \
  -H "Authorization: token api_key:api_secret"
```

#### Create Document
```bash
curl -X POST "https://your-site.com/api/resource/Customer" \
  -H "Content-Type: application/json" \
  -H "Authorization: token api_key:api_secret" \
  -d '{
    "customer_name": "John Doe",
    "customer_type": "Individual"
  }'
```

#### Update Document
```bash
curl -X PUT "https://your-site.com/api/resource/Customer/CUST-001" \
  -H "Content-Type: application/json" \
  -H "Authorization: token api_key:api_secret" \
  -d '{
    "customer_name": "John Doe Updated"
  }'
```

#### Delete Document
```bash
curl -X DELETE "https://your-site.com/api/resource/Customer/CUST-001" \
  -H "Authorization: token api_key:api_secret"
```

---

## Request Data Handling

### frappe.form_dict

**Global dictionary** containing all request parameters (GET/POST).

```python
@frappe.whitelist()
def example_endpoint():
    # Access parameters
    name = frappe.form_dict.get("name")
    email = frappe.form_dict.get("email")

    # All parameters
    all_params = frappe.form_dict

    return {"name": name, "email": email}
```

### frappe.request

**Werkzeug Request object** with full request details.

```python
@frappe.whitelist()
def inspect_request():
    return {
        "method": frappe.request.method,           # GET, POST, PUT, DELETE
        "url": frappe.request.url,                 # Full URL
        "path": frappe.request.path,               # Path only
        "headers": dict(frappe.request.headers),   # Request headers
        "remote_addr": frappe.request.remote_addr, # Client IP
        "user_agent": frappe.request.user_agent.string
    }
```

### Request Body Parsing

#### JSON Body
```python
@frappe.whitelist()
def parse_json_body():
    # Get raw data
    raw_data = frappe.request.get_data()

    # Decode bytes to string
    decoded = frappe.safe_decode(raw_data)

    # Parse JSON
    data = frappe.parse_json(decoded)

    return data
```

#### Form Data
```python
@frappe.whitelist()
def parse_form_data():
    # Automatically available in frappe.form_dict
    name = frappe.form_dict.get("name")
    email = frappe.form_dict.get("email")

    return {"name": name, "email": email}
```

#### Files
```python
@frappe.whitelist()
def handle_file_upload():
    if frappe.request.files:
        file = frappe.request.files.get('file')

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(file.stream.read())
        }
```

### Query Parameters

```python
@frappe.whitelist()
def search_users():
    # GET /api/method/myapp.api.search_users?query=john&limit=10

    query = frappe.form_dict.get("query")
    limit = frappe.form_dict.get("limit", 20)  # Default 20

    users = frappe.get_all("User",
        filters={"full_name": ["like", f"%{query}%"]},
        limit=limit
    )

    return users
```

---

## Response Handling

### frappe.response

**Global response dictionary** that gets returned to client.

```python
@frappe.whitelist()
def custom_response():
    # Set response data
    frappe.response["message"] = {"status": "success"}

    # Set HTTP status code
    frappe.response["http_status_code"] = 201

    # Add custom headers
    frappe.response["headers"] = {
        "X-Custom-Header": "value"
    }

    # Return value goes to frappe.response["message"]
    return {"data": "value"}
```

### Response Formats

#### Standard Success Response
```json
{
    "message": {
        "status": "success",
        "data": {...}
    }
}
```

#### Error Response
```json
{
    "exc": "...",
    "exc_type": "ValidationError",
    "_server_messages": "[...]"
}
```

### Custom Response Codes

```python
@frappe.whitelist()
def create_resource():
    # Create resource
    doc = frappe.get_doc({...})
    doc.insert()

    # Set 201 Created
    frappe.response.http_status_code = 201

    return doc

@frappe.whitelist()
def delete_resource():
    frappe.delete_doc("Customer", "CUST-001")

    # Set 204 No Content
    frappe.response.http_status_code = 204

    return None
```

### Returning Different Data Types

```python
@frappe.whitelist()
def return_examples():
    # Dictionary (most common)
    return {"key": "value"}

    # List
    return [1, 2, 3, 4, 5]

    # String
    return "Success"

    # Number
    return 42

    # None (empty response)
    return None
```

---

## Authentication & Permissions

### 1. Session-Based Authentication

**Default for browser requests** - uses cookies.

```python
@frappe.whitelist()
def get_current_user():
    """Requires logged-in user"""
    return {
        "user": frappe.session.user,
        "full_name": frappe.get_value("User", frappe.session.user, "full_name")
    }
```

### 2. Token-Based Authentication

**For API integrations** - uses API keys.

#### Generate API Keys
```python
# In Frappe UI: User → API Access → Generate Keys
# Returns: api_key and api_secret
```

#### Use in Requests
```bash
curl -X GET "https://your-site.com/api/resource/User" \
  -H "Authorization: token api_key:api_secret"
```

```python
import requests

headers = {
    "Authorization": "token api_key:api_secret"
}

response = requests.get(
    "https://your-site.com/api/resource/User",
    headers=headers
)
```

### 3. Permission Checks

```python
@frappe.whitelist()
def get_customer(customer_id):
    # Check if user has read permission
    if not frappe.has_permission("Customer", "read", customer_id):
        frappe.throw("No permission", frappe.PermissionError)

    customer = frappe.get_doc("Customer", customer_id)
    return customer

@frappe.whitelist()
def create_customer(customer_data):
    # Check if user can create
    if not frappe.has_permission("Customer", "create"):
        frappe.throw("No permission to create", frappe.PermissionError)

    customer = frappe.get_doc(customer_data)
    customer.insert()
    return customer.name
```

### 4. Role-Based Access

```python
@frappe.whitelist()
def admin_only_function():
    """Only accessible by System Manager"""
    if "System Manager" not in frappe.get_roles():
        frappe.throw("Access denied", frappe.PermissionError)

    # Admin-only logic
    return {"status": "success"}
```

### 5. Guest Access

```python
@frappe.whitelist(allow_guest=True)
def public_endpoint():
    """Accessible without login"""

    # Check if user is guest
    if frappe.session.user == "Guest":
        return {"message": "Hello, Guest!"}
    else:
        return {"message": f"Hello, {frappe.session.user}!"}
```

---

## Error Handling

### 1. Throwing Errors

```python
@frappe.whitelist()
def validate_data(email):
    # Validation error
    if not email:
        frappe.throw("Email is required", frappe.ValidationError)

    # Permission error
    if not frappe.has_permission("User", "read"):
        frappe.throw("No permission", frappe.PermissionError)

    # Not found error
    if not frappe.db.exists("User", email):
        frappe.throw("User not found", frappe.DoesNotExistError)

    # Generic error
    frappe.throw("Something went wrong")
```

### 2. Try-Except Blocks

```python
@frappe.whitelist()
def safe_operation():
    try:
        # Risky operation
        result = perform_operation()
        return {"status": "success", "result": result}

    except frappe.ValidationError as e:
        frappe.log_error(f"Validation failed: {str(e)}")
        return {"status": "error", "message": str(e)}

    except Exception as e:
        frappe.log_error(f"Unexpected error: {str(e)}")
        frappe.throw("An unexpected error occurred")
```

### 3. Custom Error Messages

```python
@frappe.whitelist()
def create_order(customer):
    if not customer:
        frappe.throw(
            msg="Customer is required to create an order",
            title="Missing Customer",
            exc=frappe.ValidationError
        )

    # Create order
    return {"status": "success"}
```

### 4. Error Logging

```python
@frappe.whitelist()
def risky_operation():
    try:
        # Operation
        pass
    except Exception as e:
        # Log error to Error Log doctype
        frappe.log_error(
            message=frappe.get_traceback(),
            title="Risky Operation Failed"
        )

        # Re-raise or return error
        frappe.throw("Operation failed. Please contact support.")

---

## Rate Limiting

**Source:** `frappe/frappe/rate_limiter.py`

### 1. Global Rate Limiting

Configure in `site_config.json`:

```json
{
    "rate_limit": {
        "limit": 1000,
        "window": 86400
    }
}
```

**Meaning:** 1000 requests per 86400 seconds (24 hours)

### 2. Endpoint-Specific Rate Limiting

**Source:** `frappe/frappe/rate_limiter.py` (lines 105-128)

```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist(allow_guest=True)
@rate_limit(limit=5, seconds=60)
def send_otp(mobile):
    """Limited to 5 requests per minute"""
    # Send OTP logic
    return {"status": "OTP sent"}
```

### 3. Advanced Rate Limiting

```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist()
@rate_limit(
    key="email",           # Rate limit by email parameter
    limit=10,              # 10 requests
    seconds=3600,          # Per hour
    methods=["POST"],      # Only POST requests
    ip_based=True          # Also consider IP address
)
def create_account(email):
    """Rate limited account creation"""
    # Create account logic
    return {"status": "Account created"}
```

### 4. Dynamic Rate Limits

```python
from frappe.rate_limiter import rate_limit

def get_user_limit():
    """Dynamic limit based on user role"""
    if "System Manager" in frappe.get_roles():
        return 1000  # Higher limit for admins
    return 100       # Lower limit for regular users

@frappe.whitelist()
@rate_limit(limit=get_user_limit, seconds=3600)
def api_endpoint():
    return {"status": "success"}
```

### 5. Rate Limit Response

When rate limit is exceeded:

**HTTP Status:** `429 Too Many Requests`

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1643723400
Retry-After: 3600
```

**Response:**
```json
{
    "exc": "Too Many Requests"
}
```

---

## Best Practices

### 1. Use Proper HTTP Methods

```python
# ✅ GOOD - Semantic HTTP methods
@frappe.whitelist(methods=["GET"])
def get_users():
    return frappe.get_all("User")

@frappe.whitelist(methods=["POST"])
def create_user(user_data):
    return frappe.get_doc(user_data).insert()

@frappe.whitelist(methods=["PUT"])
def update_user(user_id, user_data):
    doc = frappe.get_doc("User", user_id)
    doc.update(user_data)
    doc.save()
    return doc

@frappe.whitelist(methods=["DELETE"])
def delete_user(user_id):
    frappe.delete_doc("User", user_id)
    return {"status": "deleted"}

# ❌ BAD - All methods accept all HTTP verbs
@frappe.whitelist()
def user_operations():
    pass
```

### 2. Validate Input Data

```python
@frappe.whitelist()
def create_customer(customer_name, email):
    # ✅ GOOD - Validate inputs
    if not customer_name:
        frappe.throw("Customer name is required")

    if not email:
        frappe.throw("Email is required")

    if not frappe.utils.validate_email_address(email):
        frappe.throw("Invalid email address")

    # Create customer
    customer = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": customer_name,
        "email_id": email
    })
    customer.insert()

    return customer.name
```

### 3. Use Transactions

```python
@frappe.whitelist()
def create_order_with_items(customer, items):
    try:
        # Start transaction
        order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": customer
        })

        for item in items:
            order.append("items", item)

        order.insert()
        frappe.db.commit()  # Commit transaction

        return order.name

    except Exception as e:
        frappe.db.rollback()  # Rollback on error
        frappe.log_error(str(e))
        frappe.throw("Failed to create order")
```

### 4. Return Consistent Response Format

```python
# ✅ GOOD - Consistent format
@frappe.whitelist()
def get_customer(customer_id):
    try:
        customer = frappe.get_doc("Customer", customer_id)
        return {
            "success": True,
            "data": customer.as_dict(),
            "message": "Customer retrieved successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to retrieve customer"
        }

# ❌ BAD - Inconsistent format
@frappe.whitelist()
def get_customer_bad(customer_id):
    customer = frappe.get_doc("Customer", customer_id)
    return customer  # Sometimes returns doc, sometimes throws error
```

### 5. Use Caching for Expensive Operations

```python
@frappe.whitelist()
def get_dashboard_stats():
    # Check cache first
    cache_key = f"dashboard_stats_{frappe.session.user}"
    cached_data = frappe.cache().get_value(cache_key)

    if cached_data:
        return cached_data

    # Expensive calculation
    stats = {
        "total_customers": frappe.db.count("Customer"),
        "total_orders": frappe.db.count("Sales Order"),
        "revenue": calculate_revenue()  # Expensive
    }

    # Cache for 5 minutes
    frappe.cache().set_value(cache_key, stats, expires_in_sec=300)

    return stats
```

### 6. Implement Pagination

```python
@frappe.whitelist()
def get_customers(page=1, page_size=20):
    # ✅ GOOD - Paginated results
    page = int(page)
    page_size = int(page_size)

    # Limit page size
    if page_size > 100:
        page_size = 100

    start = (page - 1) * page_size

    customers = frappe.get_all(
        "Customer",
        fields=["name", "customer_name", "email_id"],
        start=start,
        page_length=page_size
    )

    total = frappe.db.count("Customer")

    return {
        "data": customers,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": (total + page_size - 1) // page_size
    }
```

### 7. Log API Calls

```python
@frappe.whitelist()
def important_operation():
    # Log API call
    frappe.logger().info(f"API called by {frappe.session.user}")

    try:
        result = perform_operation()

        # Log success
        frappe.logger().info(f"Operation successful: {result}")

        return {"status": "success", "result": result}

    except Exception as e:
        # Log error
        frappe.logger().error(f"Operation failed: {str(e)}")
        frappe.log_error(frappe.get_traceback())

        frappe.throw("Operation failed")
```

### 8. Use Type Hints (Python 3.6+)

```python
from typing import Dict, List, Optional

@frappe.whitelist()
def get_user_orders(user_id: str, status: Optional[str] = None) -> Dict:
    """
    Get orders for a user

    Args:
        user_id: User ID
        status: Optional order status filter

    Returns:
        Dictionary with orders list
    """
    filters = {"user": user_id}

    if status:
        filters["status"] = status

    orders = frappe.get_all("Sales Order", filters=filters)

    return {
        "user_id": user_id,
        "orders": orders,
        "count": len(orders)
    }
```

### 9. Handle CORS for External APIs

Configure in `site_config.json`:

```json
{
    "allow_cors": "*"
}
```

Or specific origins:

```json
{
    "allow_cors": [
        "https://example.com",
        "https://app.example.com"
    ]
}
```

**Source:** `frappe/frappe/app.py` (lines 256-288)

### 10. Document Your APIs

```python
@frappe.whitelist()
def create_customer(customer_name: str, email: str, phone: str = None) -> Dict:
    """
    Create a new customer

    Args:
        customer_name (str): Full name of the customer (required)
        email (str): Email address (required)
        phone (str): Phone number (optional)

    Returns:
        dict: {
            "success": bool,
            "customer_id": str,
            "message": str
        }

    Raises:
        ValidationError: If required fields are missing
        PermissionError: If user doesn't have create permission

    Example:
        POST /api/method/myapp.api.create_customer
        {
            "customer_name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890"
        }

    Response:
        {
            "message": {
                "success": true,
                "customer_id": "CUST-001",
                "message": "Customer created successfully"
            }
        }
    """
    # Validation
    if not customer_name:
        frappe.throw("Customer name is required", frappe.ValidationError)

    if not email:
        frappe.throw("Email is required", frappe.ValidationError)

    # Permission check
    if not frappe.has_permission("Customer", "create"):
        frappe.throw("No permission to create customer", frappe.PermissionError)

    # Create customer
    customer = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": customer_name,
        "email_id": email,
        "mobile_no": phone
    })
    customer.insert()

    return {
        "success": True,
        "customer_id": customer.name,
        "message": "Customer created successfully"
    }
```

---

## Quick Reference

### Common API Patterns

#### 1. Simple GET Endpoint
```python
@frappe.whitelist()
def get_data():
    return frappe.get_all("DocType")
```

#### 2. POST with Validation
```python
@frappe.whitelist(methods=["POST"])
def create_record(name, email):
    if not name or not email:
        frappe.throw("Name and email required")
    # Create logic
    return {"status": "created"}
```

#### 3. Update Endpoint
```python
@frappe.whitelist(methods=["PUT"])
def update_record(doc_id, data):
    doc = frappe.get_doc("DocType", doc_id)
    doc.update(data)
    doc.save()
    return doc
```

#### 4. Delete Endpoint
```python
@frappe.whitelist(methods=["DELETE"])
def delete_record(doc_id):
    frappe.delete_doc("DocType", doc_id)
    return {"status": "deleted"}
```

### Request Objects Quick Reference

| Object | Description | Example |
|--------|-------------|---------|
| `frappe.form_dict` | Request parameters | `frappe.form_dict.get("name")` |
| `frappe.request` | Werkzeug Request | `frappe.request.method` |
| `frappe.request.get_data()` | Raw request body | `frappe.request.get_data()` |
| `frappe.request.files` | Uploaded files | `frappe.request.files.get("file")` |
| `frappe.request.headers` | Request headers | `frappe.request.headers.get("User-Agent")` |

### Response Objects Quick Reference

| Object | Description | Example |
|--------|-------------|---------|
| `frappe.response` | Response dictionary | `frappe.response["message"] = data` |
| `frappe.response.http_status_code` | HTTP status | `frappe.response.http_status_code = 201` |
| `return value` | Goes to `message` | `return {"data": "value"}` |

### Common HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Summary

This guide covered:

- ✅ **Code Snippet Explanation** - Backward compatibility and request parsing
- ✅ **API Architecture** - Versioning, RPC vs REST endpoints
- ✅ **Creating APIs** - `@frappe.whitelist()`, methods, permissions
- ✅ **Consuming APIs** - JavaScript, Python, cURL, REST
- ✅ **Request Handling** - form_dict, request object, parsing
- ✅ **Response Handling** - frappe.response, status codes, formats
- ✅ **Authentication** - Session, token, permissions, roles
- ✅ **Error Handling** - Throwing errors, logging, try-except
- ✅ **Rate Limiting** - Global, endpoint-specific, dynamic
- ✅ **Best Practices** - Validation, caching, pagination, documentation

**Key Takeaways:**

1. Always use `@frappe.whitelist()` to expose methods via HTTP
2. Validate input data and check permissions
3. Use appropriate HTTP methods (GET, POST, PUT, DELETE)
4. Return consistent response formats
5. Implement error handling and logging
6. Use rate limiting for sensitive endpoints
7. Cache expensive operations
8. Document your APIs thoroughly