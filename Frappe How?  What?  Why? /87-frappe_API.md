# Frappe API

## Table of Contents

1. [Overview](#1-overview)
2. [Understanding API Types in Frappe: REST vs RPC](#2-understanding-api-types-in-frappe-rest-vs-rpc)
3. [REST APIs in Frappe](#3-rest-apis-in-frappe)
4. [Building Custom APIs](#4-building-custom-apis)
5. [Creating Custom REST APIs](#5-creating-custom-rest-apis)
6. [Custom Routes & REST Controllers](#6-custom-routes--rest-controllers)
7. [DocType REST (Resource) APIs](#7-doctype-rest-resource-apis)

---

## 1. Overview

### 1.1 What APIs Frappe Provides Out-of-the-Box

Frappe provides a comprehensive REST API system built on top of Werkzeug routing. The framework exposes:

#### HTTP REST Endpoints

Frappe automatically provides REST endpoints for:

1. **Method-based RPC calls** (`/api/method/<method_path>`)
   - Calls whitelisted Python functions
   - Supports GET, POST, PUT, DELETE methods
   - Example: `/api/method/frappe.client.get_list`

2. **Resource-based CRUD** (`/api/resource/<DocType>`)
   - Automatic CRUD operations for any DocType
   - GET: List documents
   - POST: Create document
   - PUT: Update document
   - DELETE: Delete document
   - Example: `/api/resource/User`

3. **Document-level operations** (`/api/document/<DocType>/<name>`)
   - V2 API endpoints (newer, more structured)
   - Same CRUD operations with improved response format
   - Example: `/api/v2/document/User/Administrator`

4. **Built-in utility methods** (via `frappe.client`)
   - `get_list()` - Query documents with filters
   - `get()` - Get single document
   - `get_value()` - Get field values
   - `insert()` - Create document
   - `save()` - Update document
   - `delete()` - Delete document

**Source Files:**
- API routing: `frappe/frappe/api/__init__.py`
- V1 implementation: `frappe/frappe/api/v1.py`
- V2 implementation: `frappe/frappe/api/v2.py`
- Client utilities: `frappe/frappe/client.py`

#### WebSocket / Real-time Support

Frappe **natively supports WebSocket** via Socket.IO for real-time communication:
- Real-time updates and notifications
- Live document updates
- Progress tracking for long-running tasks
- Multi-user collaboration features

**Source Files:**
- Server: `frappe/frappe/realtime.py`
- Client: `frappe/frappe/public/js/frappe/socketio_client.js`
- Socket.IO server: `frappe/realtime/index.js`

#### Other API Protocols

Frappe does **not** natively support GraphQL or gRPC. However, these can be integrated separately through custom apps if needed for specific use cases.

### 1.2 When to Use Built-in APIs vs Custom Endpoints

**Use Built-in APIs when:**
- You need standard CRUD operations on DocTypes
- Simple data retrieval with filters/pagination
- Standard document operations (create, read, update, delete)
- You want automatic permission checking
- Rapid prototyping

**Build Custom Endpoints when:**
- You need complex business logic
- Multi-step operations or workflows
- Aggregations or calculations
- Integration with external services
- Custom response formats
- Performance optimization (caching, bulk operations)

---

## 2. Understanding API Types in Frappe: REST vs RPC

### 2.1 What Are APIs? (For Absolute Beginners)

**API (Application Programming Interface)** is a way for different software applications to talk to each other.

The purpose of API is software reusability, you can reuse software in another software with different language, so API is a way to transfer data between two diff softwares.

### 2.2 Two Main API Styles in Frappe

Frappe supports **two different styles** of APIs, and understanding the difference is crucial:

| API Style | What It Means | Frappe Example | When to Use |
|-----------|---------------|----------------|-------------|
| **REST** | Resource-based (work with "things") | `/api/resource/User` | Working with DocTypes (CRUD operations) |
| **RPC** | Action-based (call "functions") | `/api/method/my_function` | Custom business logic, calculations |

### 2.3 REST APIs: Working with Resources (Things)

**REST (Representational State Transfer)** treats everything as a **resource** (a "thing" in your database).

#### The REST Mindset

In REST, you think about **WHAT** you want to work with:
- "I want to work with **Users**"
- "I want to work with **Sales Orders**"
- "I want to work with **Customers**"

Each resource has a URL, and you use HTTP methods to perform actions:

| HTTP Method | Action | Example |
|-------------|--------|---------|
| **GET** | Read/Retrieve | Get list of users |
| **POST** | Create | Create a new user |
| **PUT/PATCH** | Update | Update user details |
| **DELETE** | Delete | Delete a user |

#### REST Example in Frappe

```bash
# Get all users (READ)
GET /api/resource/User

# Get specific user (READ)
GET /api/resource/User/john@example.com

# Create new user (CREATE)
POST /api/resource/User
Body: {"email": "jane@example.com", "first_name": "Jane"}

# Update user (UPDATE)
PUT /api/resource/User/jane@example.com
Body: {"first_name": "Jane Updated"}

# Delete user (DELETE)
DELETE /api/resource/User/jane@example.com
```

**Key Characteristics of REST:**
- Resource-oriented (URLs represent "things")
- Uses standard HTTP methods (GET, POST, PUT, DELETE)
- Stateless (each request is independent)
- Automatic in Frappe (every DocType gets REST endpoints)
- Great for CRUD operations

### 2.4 RPC APIs: Calling Functions (Actions)

**RPC (Remote Procedure Call)** lets you **call a function** on the server, just like calling a function in your code.

#### The RPC Mindset

In RPC, you think about **WHAT ACTION** you want to perform:
- "I want to **calculate** the total sales for this month"
- "I want to **send** an email to this customer"
- "I want to **generate** a report"
- "I want to **validate** this data"

You're not working with a resource directly—you're calling a function that does something.

#### RPC Example in Frappe

```bash
# Call a function to get customer orders
GET /api/method/my_app.api.get_customer_orders?customer=CUST-001

# Call a function to calculate discount
POST /api/method/my_app.api.calculate_discount
Body: {"order_total": 1000, "customer_type": "VIP"}

# Call a function to send email
POST /api/method/frappe.core.doctype.communication.email.make
Body: {"recipients": "user@example.com", "subject": "Hello"}
```

**Key Characteristics of RPC:**
- Action-oriented (URLs represent "functions")
- Flexible (can do anything a Python function can do)
- Custom business logic
- You define the function using `@frappe.whitelist()`
- Great for complex operations, calculations, workflows

#### Real-World RPC Examples in Frappe

```python
# Example 1: Calculate shipping cost
@frappe.whitelist()
def calculate_shipping_cost(weight, destination):
    """Calculate shipping cost based on weight and destination"""
    if destination == "Local":
        rate = 5
    else:
        rate = 15

    return weight * rate

# Call it: GET /api/method/my_app.api.calculate_shipping_cost?weight=10&destination=Local
# Response: {"message": 50}
```

```python
# Example 2: Get dashboard statistics
@frappe.whitelist()
def get_dashboard_stats():
    """Get statistics for dashboard"""
    return {
        "total_orders": frappe.db.count("Sales Order"),
        "pending_orders": frappe.db.count("Sales Order", {"status": "Pending"}),
        "total_revenue": frappe.db.get_value("Sales Order",
            filters={"docstatus": 1},
            fieldname="sum(grand_total)")
    }

# Call it: GET /api/method/my_app.api.get_dashboard_stats
# Response: {"message": {"total_orders": 150, "pending_orders": 25, "total_revenue": 50000}}
```

### 2.5 REST vs RPC: When to Use Which?

This is the **most important decision** when building APIs in Frappe.

#### Comparison Table

| Aspect | REST API | RPC API |
|--------|----------|---------|
| **Purpose** | Work with data (CRUD) | Perform actions/logic |
| **URL Pattern** | `/api/resource/DocType` | `/api/method/function_name` |
| **Mindset** | "What thing am I working with?" | "What action do I want to perform?" |
| **Automatic?** | Yes (every DocType) | No (you write the function) |
| **Use Case** | Standard database operations | Custom business logic |
| **Example** | Get/Create/Update/Delete User | Calculate discount, send email, generate report |

#### Decision Guide: REST or RPC?

**Use REST when:**
- You want to **get, create, update, or delete** a DocType record
- You're doing **standard CRUD operations**
- You want to **list documents** with filters
- The operation maps directly to a **single DocType**

**Examples:**
```bash
# Get all customers
GET /api/resource/Customer

# Create a sales order
POST /api/resource/Sales Order

# Update an item
PUT /api/resource/Item/ITEM-001
```

**Use RPC when:**
- You need **custom business logic**
- You're doing **calculations or transformations**
- You're working with **multiple DocTypes** at once
- You need to **trigger workflows or processes**
- The operation doesn't fit CRUD (Create, Read, Update, Delete)

**Examples:**
```bash
# Calculate shipping cost (custom logic)
GET /api/method/calculate_shipping_cost

# Generate monthly report (complex operation)
POST /api/method/generate_monthly_report

# Send bulk emails (action)
POST /api/method/send_bulk_emails

# Validate credit limit (business rule)
GET /api/method/validate_credit_limit
```

#### Real-World Scenario

Let's say you're building an e-commerce system:

**Scenario 1: Get product details**
```bash
# Use REST - you're just retrieving a resource
GET /api/resource/Item/LAPTOP-001
```

**Scenario 2: Add item to cart**
```bash
# Use RPC - this involves business logic (check stock, calculate price, apply discounts)
POST /api/method/my_app.cart.add_to_cart
Body: {"item_code": "LAPTOP-001", "qty": 1}
```

**Scenario 3: Update customer address**
```bash
# Use REST - simple update operation
PUT /api/resource/Address/ADDR-001
Body: {"city": "New York"}
```

**Scenario 4: Calculate order total with discounts**
```bash
# Use RPC - complex calculation involving multiple rules
POST /api/method/my_app.orders.calculate_order_total
Body: {"items": [...], "customer": "CUST-001", "coupon": "SAVE20"}
```

### 2.6 What API Protocols Does Frappe Support?

Summary of all API types supported by Frappe:

| Protocol | Support Level | Use Case | Frappe Implementation |
|----------|--------------|----------|----------------------|
| **REST (HTTP/JSON)** |  **Native & Primary** | CRUD operations on DocTypes | Built-in via `/api/resource/` |
| **RPC (HTTP/JSON)** |  **Native & Primary** | Custom functions and business logic | Built-in via `/api/method/` |
| **WebSocket (Socket.IO)** |  **Native** | Real-time updates, live collaboration | Built-in via `frappe.realtime` |
| **GraphQL** |  **Not Supported** | Flexible queries (requires custom integration) | Must be added via custom app |
| **gRPC** |  **Not Supported** | High-performance RPC (requires custom integration) | Must be added via custom app |

### 2.7 WebSocket APIs: Real-Time Communication

In addition to REST and RPC, Frappe also supports **WebSocket** for real-time, two-way communication.

#### What is WebSocket?

**WebSocket** is like a **phone call** between client and server:
- REST/RPC = Sending letters (request → response)
- WebSocket = Phone call (continuous connection, both can talk anytime)

**When to Use WebSocket:**
-  Real-time notifications
-  Live updates (e.g., someone else editing the same document)
-  Progress bars for long-running tasks
-  Chat applications
-  Live dashboards

#### WebSocket Example in Frappe

Frappe uses **Socket.IO** for WebSocket communication.

**Server-side (Python):**
```python
import frappe

@frappe.whitelist()
def process_large_file():
    """Process a large file and send progress updates"""
    total_items = 1000

    for i in range(total_items):
        # Process item
        process_item(i)

        # Send real-time progress update to the user
        frappe.publish_progress(
            percent=(i/total_items)*100,
            title="Processing File",
            description=f"Processed {i}/{total_items} items"
        )

    # Send completion notification
    frappe.publish_realtime(
        event="file_processed",
        message={"status": "success", "total": total_items},
        user=frappe.session.user
    )
```

**Client-side (JavaScript):**
```javascript
// Listen for progress updates
frappe.realtime.on('progress', (data) => {
    console.log(`Progress: ${data.percent}%`);
    // Update progress bar in UI
    update_progress_bar(data.percent);
});

// Listen for completion
frappe.realtime.on('file_processed', (data) => {
    frappe.show_alert({
        message: `File processed! Total items: ${data.total}`,
        indicator: 'green'
    });
});
```

**Source Files:**
- Server: `frappe/frappe/realtime.py`
- Client: `frappe/frappe/public/js/frappe/socketio_client.js`
- Socket.IO server: `frappe/realtime/index.js`

### 2.8 Summary: Three API Types in Frappe

Here's a simple way to remember when to use each API type:

| API Type | Think of it as... | Use when... | Example |
|----------|-------------------|-------------|---------|
| **REST** | Working with **things** (nouns) | Getting/creating/updating/deleting DocType records | Get User, Create Sales Order |
| **RPC** | Performing **actions** (verbs) | Custom logic, calculations, workflows | Calculate discount, Send email |
| **WebSocket** | **Live connection** (phone call) | Real-time updates, notifications, progress tracking | Live chat, Progress bars |

**Quick Decision Tree:**

```
Do you need real-time updates?
├─ YES → Use WebSocket (frappe.publish_realtime)
└─ NO → Continue...
    │
    Are you working with a DocType (CRUD)?
    ├─ YES → Use REST (/api/resource/DocType)
    └─ NO → Use RPC (/api/method/function_name)
```

**Beginner Tip:**
- Start with **REST** for simple CRUD operations
- Move to **RPC** when you need custom logic
- Add **WebSocket** when you need real-time features

---

## 3. REST APIs in Frappe

### 3.1 Built-in REST Patterns

#### API Versioning

Frappe supports two API versions:

- **V1 (Legacy)**: `/api/resource/<DocType>` and `/api/method/<method>`
- **V2 (Current)**: `/api/v2/document/<DocType>` and `/api/v2/method/<method>`

Both versions are accessible. V2 provides better structured responses.

**Source:** `frappe/frappe/api/__init__.py` lines 15-80

#### Endpoint Patterns

**V1 Endpoints:**
```
GET    /api/resource/<DocType>              # List documents
POST   /api/resource/<DocType>              # Create document
GET    /api/resource/<DocType>/<name>       # Get document
PUT    /api/resource/<DocType>/<name>       # Update document
DELETE /api/resource/<DocType>/<name>       # Delete document
POST   /api/resource/<DocType>/<name>       # Execute doc method
GET    /api/method/<method_path>            # Call whitelisted method
POST   /api/method/<method_path>            # Call whitelisted method
```

**V2 Endpoints:**
```
GET    /api/v2/document/<DocType>                    # List documents
POST   /api/v2/document/<DocType>                    # Create document
GET    /api/v2/document/<DocType>/<name>              # Get document
PATCH  /api/v2/document/<DocType>/<name>              # Update document
PUT    /api/v2/document/<DocType>/<name>              # Update document
DELETE /api/v2/document/<DocType>/<name>              # Delete document
GET    /api/v2/document/<DocType>/<name>/copy         # Copy document
GET    /api/v2/document/<DocType>/<name>/method/<method>  # Execute doc method
GET    /api/v2/doctype/<DocType>/meta                 # Get DocType metadata
GET    /api/v2/doctype/<DocType>/count                # Get document count
GET    /api/v2/method/<method_path>                    # Call whitelisted method
POST   /api/v2/method/<method_path>                    # Call whitelisted method
```

**Source:** `frappe/frappe/api/v1.py` lines 110-118, `frappe/frappe/api/v2.py` lines 185-213

### 3.2 Authentication Mechanisms

Frappe supports multiple authentication methods:

#### 1. Session Authentication (Cookie-based)

Uses browser cookies. Automatically handled for web requests.

**Example (curl):**
```bash
# Login first
curl -X POST "http://localhost:8000/api/method/login" \
  -d "usr=Administrator&pwd=admin" \
  -c cookies.txt

# Use session cookie
curl -X GET "http://localhost:8000/api/resource/User" \
  -b cookies.txt
```

**Source:** `frappe/frappe/auth.py` lines 610-626

#### 2. API Key Authentication (Token-based)

Uses API Key and API Secret from User document.

**Format:** `Authorization: Basic <base64(api_key:api_secret)>` or `Authorization: token api_key:api_secret`

**Example (curl):**
```bash
# Generate API key/secret from User document first
# Then use:
curl -X GET "http://localhost:8000/api/resource/User" \
  -H "Authorization: Basic $(echo -n 'api_key:api_secret' | base64)"

# Or using token format:
curl -X GET "http://localhost:8000/api/resource/User" \
  -H "Authorization: token api_key:api_secret"
```

**Source:** `frappe/frappe/auth.py` lines 668-716

#### 3. OAuth Bearer Token

For OAuth2 integrations.

**Format:** `Authorization: Bearer <access_token>`

**Example (curl):**
```bash
curl -X GET "http://localhost:8000/api/resource/User" \
  -H "Authorization: Bearer <access_token>"
```

**Source:** `frappe/frappe/auth.py` lines 628-665

#### 4. Custom Authentication Hooks

Apps can register custom authentication via `auth_hooks` in `hooks.py`:

```python
# hooks.py
auth_hooks = [
    "my_app.auth.validate_custom_auth"
]
```

**Source:** `frappe/frappe/auth.py` lines 719-721

### 3.3 Supported HTTP Methods

Frappe supports standard HTTP methods:

- **GET**: Read operations (list, retrieve)
- **POST**: Create operations, method calls
- **PUT**: Update operations (full update)
- **PATCH**: Partial update (V2 only)
- **DELETE**: Delete operations

**Default Behavior:**
- GET requests are read-only (require "read" permission)
- POST/PUT/PATCH/DELETE require "write" permission
- Methods can restrict allowed HTTP methods via `@frappe.whitelist(methods=["GET", "POST"])`

**Source:** `frappe/frappe/handler.py` lines 98-109

### 3.4 Standard Response Formats

#### V1 Response Format

```json
{
  "message": <data>,
  "exc_type": <exception_type>,  // Only on error
  "exception": <traceback>        // Only on error with traceback enabled
}
```

#### V2 Response Format

**Success:**
```json
{
  "data": <response_data>,
  "message_log": []  // Optional messages
}
```

**Error:**
```json
{
  "errors": [
    {
      "type": "<ExceptionType>",
      "exception": "<traceback>",  // Only if traceback enabled
      "message": "<error_message>"
    }
  ]
}
```

**Source:** `frappe/frappe/utils/response.py` lines 32-57, 133-143

### 3.5 URL Parameters, Filters, Pagination, Sorting

#### Query Parameters for List Endpoints

**Common Parameters:**
- `fields`: JSON array of field names to return
  - Example: `?fields=["name", "email", "full_name"]`
- `filters`: JSON array of filter conditions
  - Example: `?filters=[["User", "enabled", "=", 1]]`
- `or_filters`: JSON array of OR conditions
- `order_by`: Field to sort by
  - Example: `?order_by=creation desc`
- `limit_start`: Offset for pagination (default: 0)
- `limit_page_length`: Number of records (default: 20)
- `group_by`: Field to group by
- `as_dict`: Return as dictionary (default: true)
- `debug`: Show SQL query (default: false)

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/resource/User?fields=[\"name\",\"email\"]&filters={\"enabled\": 1}" \
  -H "Authorization: token api_key:api_secret"
```

**Example Response:**
```json
{
  "message": [
    {
      "name": "Administrator",
      "email": "admin@example.com"
    },
    {
      "name": "user@example.com",
      "email": "user@example.com"
    }
  ]
}
```

**Source:** `frappe/frappe/api/v1.py` lines 10-27, `frappe/frappe/client.py` lines 28-67

#### Filter Syntax

Filters use Frappe's standard filter format:

```python
# Single filter
[["DocType", "fieldname", "operator", "value"]]

# Multiple filters (AND)
[
  ["DocType", "field1", "=", "value1"],
  ["DocType", "field2", ">", 100]
]

# OR filters
or_filters=[
  ["DocType", "field1", "=", "value1"],
  ["DocType", "field2", "=", "value2"]
]
```

but Frappe's REST API should recieve filter query params as json:

```python
?filters={"fieldname": "value"}
// or
?filters={"fieldname": ["operator", "value"]}
```

**Operators:** `=`, `!=`, `>`, `<`, `>=`, `<=`, `like`, `not like`, `in`, `not in`, `is`, `is not`, `between`

---

## 4. Building Custom APIs

This section provides a comprehensive guide to building custom APIs in Frappe, from theory to practice.

### 4.1 Why Create Custom APIs?

While Frappe provides automatic REST endpoints for all DocTypes, you'll need custom APIs when:

**Business Logic Requirements:**
-  Complex calculations (discounts, taxes, shipping costs)
-  Multi-step workflows (order processing, approval chains)
-  Data aggregation from multiple DocTypes
-  Custom validation rules
-  Integration with external services (payment gateways, shipping APIs)

**Performance Optimization:**
-  Reduce multiple API calls to a single endpoint
-  Custom caching strategies
-  Optimized database queries
-  Bulk operations

**Security & Access Control:**
-  Custom permission logic beyond standard DocType permissions
-  Rate limiting
-  Data masking or filtering based on user roles
-  Audit logging

**Example Scenarios:**

| Scenario | Why Custom API? | Built-in API Limitation |
|----------|----------------|------------------------|
| Calculate order total with complex discount rules | Multiple business rules, tax calculations | REST API only does CRUD |
| Get dashboard statistics (orders, revenue, pending tasks) | Aggregates data from multiple DocTypes | Would require multiple API calls |
| Process payment and update order status | Multi-step transaction, external API call | Can't be done with single CRUD operation |
| Bulk import customers with validation | Custom validation, error handling, rollback | REST API processes one at a time |

### 4.2 Clean Architecture for Frappe APIs

Following clean architecture principles ensures your APIs are maintainable, testable, and scalable.

#### Recommended File Structure

```
my_app/
├── my_app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── customers.py      # Customer-related endpoints
│   │   │   ├── orders.py         # Order-related endpoints
│   │   │   └── products.py       # Product-related endpoints
│   │   └── v2/
│   │       ├── __init__.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── customer_service.py   # Business logic for customers
│   │   ├── order_service.py      # Business logic for orders
│   │   └── payment_service.py    # Business logic for payments
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py         # Validation functions
│   │   ├── formatters.py         # Data formatting
│   │   └── helpers.py            # Helper functions
│   └── exceptions/
│       ├── __init__.py
│       └── api_exceptions.py     # Custom exceptions
```

#### Why This Structure?

**1. Separation of Concerns:**
- **`api/`** - HTTP layer (request/response handling)
- **`services/`** - Business logic (reusable across APIs, background jobs, etc.)
- **`utils/`** - Helper functions (validation, formatting)
- **`exceptions/`** - Custom error handling

**2. Versioning:**
- **`v1/`**, **`v2/`** - Allows API evolution without breaking existing clients
- Old clients continue using v1, new clients use v2

**3. Domain Organization:**
- Group related endpoints by domain (customers, orders, products)
- Easier to find and maintain code

**4. Testability:**
- Business logic in `services/` can be tested independently
- API layer can be tested separately

#### Example: Clean Architecture Implementation

**File: `my_app/api/v1/orders.py` (API Layer)**
```python
"""
Order API endpoints - Version 1
Handles HTTP requests and responses
"""
import frappe
from my_app.services.order_service import OrderService
from my_app.utils.validators import validate_customer
from my_app.exceptions.api_exceptions import ValidationError

@frappe.whitelist()
def create_order(customer, items, delivery_date=None):
    """
    Create a new sales order

    Args:
        customer (str): Customer ID
        items (list): List of items with item_code and qty
        delivery_date (str): Optional delivery date

    Returns:
        dict: Created order details
    """
    try:
        # Validate input
        validate_customer(customer)

        # Call service layer
        order_service = OrderService()
        order = order_service.create_order(
            customer=customer,
            items=items,
            delivery_date=delivery_date
        )

        # Return response
        return {
            "success": True,
            "order": order.as_dict()
        }

    except ValidationError as e:
        frappe.throw(str(e), frappe.ValidationError)
    except Exception as e:
        frappe.log_error(f"Order creation failed: {str(e)}")
        frappe.throw("Failed to create order", frappe.ValidationError)
```

**File: `my_app/services/order_service.py` (Business Logic Layer)**
```python
"""
Order Service - Business Logic
Contains reusable business logic for orders
"""
import frappe
from frappe.utils import nowdate, add_days

class OrderService:
    """Service class for order-related business logic"""

    def create_order(self, customer, items, delivery_date=None):
        """
        Create sales order with business logic

        This method can be called from:
        - API endpoints
        - Background jobs
        - Other services
        - Scheduled tasks
        """
        # Business logic: Set default delivery date
        if not delivery_date:
            delivery_date = add_days(nowdate(), 7)

        # Business logic: Validate stock availability
        self._validate_stock(items)

        # Business logic: Calculate pricing
        items_with_pricing = self._calculate_pricing(customer, items)

        # Create document
        order = frappe.get_doc({
            "doctype": "Sales Order",
            "customer": customer,
            "delivery_date": delivery_date,
            "items": items_with_pricing
        })

        # Business logic: Apply customer-specific discounts
        self._apply_discounts(order, customer)

        order.insert()
        order.submit()

        return order

    def _validate_stock(self, items):
        """Validate stock availability"""
        for item in items:
            available_qty = frappe.db.get_value(
                "Bin",
                {"item_code": item["item_code"]},
                "actual_qty"
            ) or 0

            if available_qty < item["qty"]:
                frappe.throw(
                    f"Insufficient stock for {item['item_code']}. "
                    f"Available: {available_qty}, Required: {item['qty']}"
                )

    def _calculate_pricing(self, customer, items):
        """Calculate item pricing based on customer"""
        # Business logic here
        return items

    def _apply_discounts(self, order, customer):
        """Apply customer-specific discounts"""
        # Business logic here
        pass
```

**File: `my_app/utils/validators.py` (Utilities)**
```python
"""
Validation utilities
Reusable validation functions
"""
import frappe

def validate_customer(customer):
    """Validate customer exists and is active"""
    if not frappe.db.exists("Customer", customer):
        raise ValidationError(f"Customer {customer} does not exist")

    if frappe.db.get_value("Customer", customer, "disabled"):
        raise ValidationError(f"Customer {customer} is disabled")
```

**File: `my_app/exceptions/api_exceptions.py` (Custom Exceptions)**
```python
"""
Custom API exceptions
"""

class ValidationError(Exception):
    """Raised when validation fails"""
    pass

class InsufficientStockError(Exception):
    """Raised when stock is insufficient"""
    pass

class PaymentError(Exception):
    """Raised when payment processing fails"""
    pass
```

#### Benefits of This Architecture

| Benefit | Description | Example |
|---------|-------------|---------|
| **Reusability** | Business logic can be used anywhere | `OrderService.create_order()` can be called from API, background job, or scheduled task |
| **Testability** | Each layer can be tested independently | Test `OrderService` without HTTP layer |
| **Maintainability** | Changes are isolated to specific layers | Update business logic without touching API layer |
| **Versioning** | Support multiple API versions | v1 and v2 can use same service layer |
| **Separation** | Clear boundaries between concerns | HTTP handling separate from business logic |

### 4.3 API Versioning: Theory and Best Practices

#### What is API Versioning?

**API Versioning** is the practice of managing changes to your API over time without breaking existing clients.

Think of it like **software updates**:
- **Version 1.0** - Initial release
- **Version 2.0** - New features, some breaking changes
- Old apps still use v1.0, new apps use v2.0

#### Why is API Versioning Important?

**Problem Without Versioning:**

Imagine you have a mobile app using your API:

```python
# Original API
@frappe.whitelist()
def get_customer_info(customer_id):
    return {
        "name": "John Doe",
        "email": "john@example.com"
    }
```

Now you want to add phone number and change the response structure:

```python
# Modified API (BREAKS OLD CLIENTS!)
@frappe.whitelist()
def get_customer_info(customer_id):
    return {
        "customer": {  # Changed structure!
            "full_name": "John Doe",  # Changed field name!
            "email": "john@example.com",
            "phone": "+1234567890"  # New field
        }
    }
```

**Result:** All existing mobile apps break because they expect `name`, not `customer.full_name`!

**Solution With Versioning:**

```python
# v1/customers.py - Keep old version working
@frappe.whitelist()
def get_customer_info(customer_id):
    return {
        "name": "John Doe",
        "email": "john@example.com"
    }

# v2/customers.py - New version with improvements
@frappe.whitelist()
def get_customer_info(customer_id):
    return {
        "customer": {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "+1234567890"
        }
    }
```

**Result:**
- Old apps call `/api/method/my_app.api.v1.customers.get_customer_info` (still works!)
- New apps call `/api/method/my_app.api.v2.customers.get_customer_info` (new features!)

#### Versioning Strategies

| Strategy | URL Pattern | Example | Pros | Cons |
|----------|-------------|---------|------|------|
| **URL Path** | `/api/v1/...` | `/api/v1/customers` | Clear, easy to route | URL changes |
| **Query Parameter** | `/api/customers?version=1` | `/api/customers?v=1` | Same URL | Easy to forget |
| **Header** | `Accept: application/vnd.api.v1+json` | Custom header | Clean URLs | Not visible in URL |
| **Subdomain** | `v1.api.example.com` | `v1.api.example.com/customers` | Complete isolation | DNS management |

**Frappe Recommendation:** Use **URL Path** versioning (most common and clear)

#### When to Create a New Version

Create a new API version when you make **breaking changes**:

**Breaking Changes (Require New Version):**
- Removing a field from response
- Renaming a field
- Changing data type (string → number)
- Changing response structure
- Removing an endpoint
- Changing required parameters

**Non-Breaking Changes (No New Version Needed):**
-  Adding a new field to response
-  Adding a new optional parameter
-  Adding a new endpoint
-  Fixing bugs
-  Performance improvements

#### Versioning Example in Frappe

**Directory Structure:**
```
my_app/
├── api/
│   ├── v1/
│   │   ├── __init__.py
│   │   └── customers.py
│   └── v2/
│       ├── __init__.py
│       └── customers.py
```

**v1/customers.py:**
```python
"""API Version 1 - Original implementation"""
import frappe

@frappe.whitelist()
def get_customer(customer_id):
    """Get customer info - Version 1"""
    customer = frappe.get_doc("Customer", customer_id)

    return {
        "name": customer.customer_name,
        "email": customer.email_id
    }

# Call: /api/method/my_app.api.v1.customers.get_customer?customer_id=CUST-001
```

**v2/customers.py:**
```python
"""API Version 2 - Enhanced implementation"""
import frappe

@frappe.whitelist()
def get_customer(customer_id):
    """Get customer info - Version 2 with more details"""
    customer = frappe.get_doc("Customer", customer_id)

    # Enhanced response structure
    return {
        "customer": {
            "id": customer.name,
            "full_name": customer.customer_name,
            "contact": {
                "email": customer.email_id,
                "phone": customer.mobile_no,
                "website": customer.website
            },
            "address": {
                "primary": get_primary_address(customer.name)
            },
            "metadata": {
                "created_at": customer.creation,
                "modified_at": customer.modified
            }
        }
    }

def get_primary_address(customer):
    """Helper to get primary address"""
    # Implementation here
    pass

# Call: /api/method/my_app.api.v2.customers.get_customer?customer_id=CUST-001
```

#### Version Lifecycle Management

**Best Practices:**

1. **Deprecation Notice** - Warn users before removing old versions
2. **Support Window** - Support old versions for 6-12 months
3. **Documentation** - Clearly document what changed between versions
4. **Migration Guide** - Provide guide for upgrading from v1 to v2

**Example Deprecation:**
```python
# v1/customers.py
@frappe.whitelist()
def get_customer(customer_id):
    """
    Get customer info - Version 1

    DEPRECATED: This endpoint will be removed on 2025-12-31
    Please migrate to v2: /api/method/my_app.api.v2.customers.get_customer
    """
    # Add deprecation warning to response
    frappe.log_error(
        f"Deprecated API v1 called by {frappe.session.user}",
        "API Deprecation Warning"
    )

    # Return data with deprecation notice
    return {
        "_deprecated": True,
        "_message": "This API version is deprecated. Please use v2.",
        "_sunset_date": "2025-12-31",
        "name": "...",
        "email": "..."
    }
```

### 4.4 How to Call Your Custom API

Once you've created your custom API, you need to call it from different clients. Here's how:

#### 4.4.1 Calling from DocType JavaScript (Client Script)

**Scenario:** You have a Sales Order form and want to calculate shipping cost when user clicks a button.

**File: `sales_order.js` (Client Script)**

```javascript
frappe.ui.form.on('Sales Order', {
    // Method 1: Using frappe.call (Recommended)
    calculate_shipping: function(frm) {
        frappe.call({
            method: 'my_app.api.v1.orders.calculate_shipping_cost',
            args: {
                weight: frm.doc.total_weight,
                destination: frm.doc.shipping_address,
                customer_type: frm.doc.customer_type
            },
            callback: function(r) {
                if (r.message) {
                    frm.set_value('shipping_cost', r.message.cost);
                    frappe.show_alert({
                        message: `Shipping cost: ${r.message.cost}`,
                        indicator: 'green'
                    });
                }
            },
            error: function(r) {
                frappe.msgprint({
                    title: 'Error',
                    message: 'Failed to calculate shipping cost',
                    indicator: 'red'
                });
            }
        });
    },

    // Method 2: Using async/await (Modern approach)
    async load_customer_orders(frm) {
        try {
            const response = await frappe.call({
                method: 'my_app.api.v1.customers.get_customer_orders',
                args: {
                    customer: frm.doc.customer
                }
            });

            if (response.message) {
                console.log('Customer orders:', response.message);
                // Update form or show data
            }
        } catch (error) {
            frappe.msgprint('Failed to load customer orders');
        }
    },

    // Method 3: Using frappe.xcall (Promise-based, cleaner)
    refresh: async function(frm) {
        if (frm.doc.customer) {
            try {
                const stats = await frappe.xcall(
                    'my_app.api.v1.customers.get_customer_stats',
                    {
                        customer: frm.doc.customer
                    }
                );

                frm.dashboard.add_indicator(
                    `Total Orders: ${stats.total_orders}`,
                    'blue'
                );
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
    },

    // Method 4: POST request with complex data
    submit_bulk_items: function(frm) {
        const items = frm.doc.items.map(item => ({
            item_code: item.item_code,
            qty: item.qty,
            rate: item.rate
        }));

        frappe.call({
            method: 'my_app.api.v1.orders.process_bulk_items',
            args: {
                items: items,  // Array of objects
                customer: frm.doc.customer
            },
            freeze: true,  // Show loading indicator
            freeze_message: 'Processing items...',
            callback: function(r) {
                if (r.message.success) {
                    frappe.show_alert('Items processed successfully');
                    frm.reload_doc();
                }
            }
        });
    }
});
```

**Key Parameters for `frappe.call`:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `method` | string | Full path to your whitelisted function | `'my_app.api.v1.orders.create_order'` |
| `args` | object | Arguments to pass to the function | `{customer: 'CUST-001', qty: 10}` |
| `callback` | function | Success callback | `function(r) { console.log(r.message); }` |
| `error` | function | Error callback | `function(r) { frappe.msgprint('Error'); }` |
| `freeze` | boolean | Show loading overlay | `true` |
| `freeze_message` | string | Loading message | `'Processing...'` |
| `async` | boolean | Make async request | `true` (default) |

#### 4.4.2 Calling with cURL (Command Line)

**Basic GET Request:**
```bash
curl -X GET "http://localhost:8000/api/method/my_app.api.v1.customers.get_customer?customer_id=CUST-001" \
  -H "Authorization: token api_key:api_secret"
```

**POST Request with JSON Data:**
```bash
curl -X POST "http://localhost:8000/api/method/my_app.api.v1.orders.create_order" \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "CUST-001",
    "items": [
      {"item_code": "ITEM-001", "qty": 5},
      {"item_code": "ITEM-002", "qty": 3}
    ],
    "delivery_date": "2025-01-15"
  }'
```

**Using Session Authentication:**
```bash
# Step 1: Login and save cookies
curl -X POST "http://localhost:8000/api/method/login" \
  -H "Content-Type: application/json" \
  -d '{"usr": "administrator", "pwd": "admin"}' \
  -c cookies.txt

# Step 2: Use cookies for subsequent requests
curl -X GET "http://localhost:8000/api/method/my_app.api.v1.customers.get_customer?customer_id=CUST-001" \
  -b cookies.txt
```

**With Query Parameters:**
```bash
curl -X GET "http://localhost:8000/api/method/my_app.api.v1.orders.get_orders?status=Pending&limit=10&offset=0" \
  -H "Authorization: token api_key:api_secret"
```

**Pretty Print JSON Response:**
```bash
curl -X GET "http://localhost:8000/api/method/my_app.api.v1.customers.get_customer?customer_id=CUST-001" \
  -H "Authorization: token api_key:api_secret" | python -m json.tool
```

---

## 5. Creating Custom REST APIs

### 5.1 Multiple Approaches

#### Approach 1: Function-based with `@frappe.whitelist` (Recommended)

The simplest and most common approach.

**Step 1: Create a Python function**

```python
# my_app/api/orders.py
import frappe
from frappe import _

@frappe.whitelist()
def get_customer_orders(customer=None, status=None):
    """
    Get orders for a customer
    
    Args:
        customer: Customer name/ID
        status: Order status filter
    
    Returns:
        List of order documents
    """
    # Validate input
    if not customer:
        frappe.throw(_("Customer is required"), frappe.ValidationError)
    
    # Build filters
    filters = {"customer": customer}
    if status:
        filters["status"] = status
    
    # Check permissions
    if not frappe.has_permission("Sales Order", "read"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)
    
    # Query and return
    orders = frappe.get_all(
        "Sales Order",
        filters=filters,
        fields=["name", "customer", "status", "grand_total", "transaction_date"],
        order_by="creation desc"
    )
    
    return orders
```

**Step 2: Access via API**

```bash
# GET request
curl -X GET "http://localhost:8000/api/method/my_app.api.orders.get_customer_orders?customer=CUST-001&status=Completed" \
  -H "Authorization: token api_key:api_secret"

# POST request (for complex data)
curl -X POST "http://localhost:8000/api/method/my_app.api.orders.get_customer_orders" \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{"customer": "CUST-001", "status": "Completed"}'
```

**Expected Response:**
```json
{
  "message": [
    {
      "name": "SO-00001",
      "customer": "CUST-001",
      "status": "Completed",
      "grand_total": 1000.00,
      "transaction_date": "2024-01-15"
    }
  ]
}
```

### 5.2 Understanding `@frappe.whitelist` in Detail

#### What It Does

The `@frappe.whitelist` decorator:
1. Registers the function as accessible via HTTP
2. Enables permission checking
3. Allows HTTP method restrictions
4. Enables guest access (if configured)
5. Applies XSS protection for guest users

**Source:** `frappe/frappe/__init__.py` lines 813-859

#### Parameters

```python
@frappe.whitelist(
    allow_guest=False,      # Allow unauthenticated access
    xss_safe=False,          # Mark as safe from XSS (only if allow_guest=True)
    methods=None             # Allowed HTTP methods (default: ["GET", "POST", "PUT", "DELETE"])
)
```

**Examples:**

```python
# Allow only GET requests
@frappe.whitelist(methods=["GET"])
def read_only_endpoint():
    return {"data": "read only"}

# Allow guest access
@frappe.whitelist(allow_guest=True)
def public_endpoint():
    return {"data": "public"}

# Guest access with XSS protection
@frappe.whitelist(allow_guest=True, xss_safe=True)
def safe_public_endpoint():
    return {"data": "safe public"}

# POST only
@frappe.whitelist(methods=["POST"])
def create_only_endpoint():
    return {"data": "created"}
```

#### How It Works Behind the Scenes

1. **Registration**: When the decorator is applied, the function is added to `frappe.whitelisted` list
   - **Source:** `frappe/frappe/__init__.py` line 848

2. **HTTP Method Check**: On request, `is_valid_http_method()` checks if the request method is allowed
   - **Source:** `frappe/frappe/handler.py` lines 98-109

3. **Whitelist Check**: `is_whitelisted()` verifies the function is registered
   - **Source:** `frappe/frappe/__init__.py` lines 862-877

4. **Guest Check**: If user is "Guest", checks if function is in `guest_methods`
   - **Source:** `frappe/frappe/__init__.py` lines 865-866

5. **XSS Sanitization**: For guest users, sanitizes HTML in `form_dict` unless `xss_safe=True`
   - **Source:** `frappe/frappe/__init__.py` lines 872-877

6. **Routing**: The API router (`frappe/api/v1.py` or `v2.py`) calls `handle_rpc_call()` which:
   - Resolves the method path to the function
   - Checks whitelist status
   - Validates HTTP method
   - Calls the function with `frappe.form_dict` as kwargs
   - **Source:** `frappe/frappe/api/v2.py` lines 27-50

#### Security Implications

**Input Validation:**
- Always validate and sanitize inputs
- Use `frappe.parse_json()` for JSON strings
- Check data types and ranges

**Permission Checks:**
- Use `frappe.has_permission()` for DocType-level checks
- Use `doc.check_permission()` for document-level checks
- Use `frappe.only_for()` for role-based access

**SQL Injection Prevention:**
- Use `frappe.get_all()`, `frappe.get_list()`, `frappe.db.get_value()` instead of raw SQL
- These methods automatically escape inputs
- If using raw SQL, use `frappe.db.sql()` with parameterized queries

**Example - Secure Endpoint:**
```python
@frappe.whitelist()
def secure_get_orders(customer=None, limit=20):
    # Validate input types
    if customer and not isinstance(customer, str):
        frappe.throw(_("Invalid customer"), frappe.ValidationError)
    
    limit = int(limit)  # Ensure integer
    if limit > 100:
        limit = 100  # Cap limit
    
    # Check permission
    if not frappe.has_permission("Sales Order", "read"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)
    
    # Build safe filters
    filters = {}
    if customer:
        filters["customer"] = customer
    
    # Use safe query method (prevents SQL injection)
    orders = frappe.get_all(
        "Sales Order",
        filters=filters,
        fields=["name", "customer", "grand_total"],
        limit=limit
    )
    
    return orders
```

### 5.3 Approach 2: Class-based Controllers

For complex APIs with multiple related endpoints:

```python
# my_app/api/orders_controller.py
import frappe
from frappe import _

class OrdersController:
    @staticmethod
    @frappe.whitelist()
    def list(customer=None, status=None):
        """GET /api/method/my_app.api.orders_controller.list"""
        filters = {}
        if customer:
            filters["customer"] = customer
        if status:
            filters["status"] = status
        
        return frappe.get_all("Sales Order", filters=filters)
    
    @staticmethod
    @frappe.whitelist(methods=["POST"])
    def create(order_data):
        """POST /api/method/my_app.api.orders_controller.create"""
        if isinstance(order_data, str):
            order_data = frappe.parse_json(order_data)
        
        # Validate required fields
        if not order_data.get("customer"):
            frappe.throw(_("Customer is required"), frappe.ValidationError)
        
        # Check permission
        if not frappe.has_permission("Sales Order", "create"):
            frappe.throw(_("Not permitted"), frappe.PermissionError)
        
        # Create document
        doc = frappe.get_doc({
            "doctype": "Sales Order",
            **order_data
        })
        doc.insert()
        
        return doc.as_dict()
    
    @staticmethod
    @frappe.whitelist()
    def get(name):
        """GET /api/method/my_app.api.orders_controller.get"""
        doc = frappe.get_doc("Sales Order", name)
        doc.check_permission("read")
        return doc.as_dict()
```

**Usage:**
```bash
# List orders
curl -X GET "http://localhost:8000/api/method/my_app.api.orders_controller.list?customer=CUST-001" \
  -H "Authorization: token api_key:api_secret"

# Create order
curl -X POST "http://localhost:8000/api/method/my_app.api.orders_controller.create" \
  -H "Authorization: token api_key:api_secret" \
  -H "Content-Type: application/json" \
  -d '{"customer": "CUST-001", "items": [...]}'
```

---

## 6. Custom Routes & REST Controllers

### 6.1 Using Hooks for Route Registration

While Frappe doesn't provide a built-in hook for custom API routes, you can use `before_request` hooks to intercept requests:

```python
# my_app/hooks.py
before_request = [
    "my_app.api.middleware.handle_custom_api"
]

# my_app/api/middleware.py
import frappe
from werkzeug.wrappers import Response
from werkzeug.exceptions import NotFound

def handle_custom_api():
    """Handle custom API routes"""
    path = frappe.request.path
    
    # Custom route handling
    if path == "/api/v1/custom/health":
        return Response(
            response='{"status": "ok"}',
            mimetype="application/json",
            status=200
        )
    
    # Let other routes pass through
    return None
```

### 6.2 Creating Route Handlers

For more complex routing, create a dedicated router:

```python
# my_app/api/router.py
import frappe
from werkzeug.wrappers import Response
from werkzeug.routing import Map, Rule

# Define route map
url_map = Map([
    Rule("/api/v1/orders", endpoint="list_orders", methods=["GET"]),
    Rule("/api/v1/orders", endpoint="create_order", methods=["POST"]),
    Rule("/api/v1/orders/<name>", endpoint="get_order", methods=["GET"]),
])

def handle_request():
    """Route custom API requests"""
    adapter = url_map.bind_to_environ(frappe.request.environ)
    try:
        endpoint, values = adapter.match()
        
        # Route to appropriate handler
        if endpoint == "list_orders":
            return list_orders(**values)
        elif endpoint == "create_order":
            return create_order(**values)
        elif endpoint == "get_order":
            return get_order(**values)
    except NotFound:
        return None  # Let Frappe handle it
```

### 6.3 Middleware in Frappe Apps

Use `before_request` and `after_request` hooks for middleware:

```python
# my_app/hooks.py
before_request = [
    "my_app.api.middleware.log_request",
    "my_app.api.middleware.validate_api_key"
]

after_request = [
    "my_app.api.middleware.add_cors_headers",
    "my_app.api.middleware.log_response"
]

# my_app/api/middleware.py
import frappe
import time

def log_request():
    """Log API requests"""
    if frappe.request.path.startswith("/api/"):
        frappe.local.request_start_time = time.time()
        frappe.logger().info(f"API Request: {frappe.request.method} {frappe.request.path}")

def validate_api_key():
    """Custom API key validation"""
    if frappe.request.path.startswith("/api/v1/secure/"):
        api_key = frappe.get_request_header("X-API-Key")
        if not api_key or not validate_custom_api_key(api_key):
            frappe.throw("Invalid API key", frappe.AuthenticationError)

def add_cors_headers(response):
    """Add CORS headers to responses"""
    if frappe.request.path.startswith("/api/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE"
    return response

def log_response(response):
    """Log API responses"""
    if hasattr(frappe.local, "request_start_time"):
        duration = time.time() - frappe.local.request_start_time
        frappe.logger().info(f"API Response: {response.status_code} ({duration:.3f}s)")
    return response
```

**Source:** `frappe/frappe/app.py` lines 158-163, 197-198

---

## 7. DocType REST (Resource) APIs

### 7.1 How Frappe Automatically Exposes DocType CRUD

Frappe automatically creates REST endpoints for every DocType:

**Automatic Endpoints:**
- `GET /api/resource/<DocType>` - List documents
- `POST /api/resource/<DocType>` - Create document
- `GET /api/resource/<DocType>/<name>` - Get document
- `PUT /api/resource/<DocType>/<name>` - Update document
- `DELETE /api/resource/<DocType>/<name>` - Delete document

**Source:** `frappe/frappe/api/v1.py` lines 110-118

### 7.2 Customizing Behavior

#### Using `has_web_view`

DocTypes with `has_web_view=1` can be accessed via web URLs:

```python
# DocType JSON
{
    "name": "Blog Post",
    "has_web_view": 1,
    "route": "blog"
}
```

This enables: `GET /blog/<name>` for public access.

#### Permission Rules

Frappe automatically enforces permissions:

```python
# In DocType controller
class MyDocType(Document):
    def has_permission(self, perm_type="read"):
        # Custom permission logic
        if perm_type == "read" and self.status == "Draft":
            return frappe.has_permission("MyDocType", "read")
        return super().has_permission(perm_type)
```

**Source:** `frappe/frappe/model/document.py` - Permission methods

#### `allow_guest` for Public Access

To allow guest access to a DocType:

```python
# In DocType controller
class PublicDocType(Document):
    def has_permission(self, perm_type="read"):
        if perm_type == "read":
            return True  # Allow public read
        return super().has_permission(perm_type)
```

Or use `@frappe.whitelist(allow_guest=True)` for custom methods.

#### Controllers and Overrides

Override DocType controller methods:

```python
# my_app/my_app/doctype/my_doctype/my_doctype.py
import frappe
from frappe.model.document import Document

class MyDocType(Document):
    def before_insert(self):
        # Custom logic before insert
        self.validate_custom_rules()
    
    def after_insert(self):
        # Custom logic after insert
        self.send_notification()
    
    def validate(self):
        # Custom validation
        if not self.required_field:
            frappe.throw("Required field is missing")
    
    # Whitelist methods for API access
    @frappe.whitelist()
    def custom_action(self):
        """Custom method accessible via API"""
        return {"result": "success"}
```

**Access custom methods:**
```bash
# Via resource endpoint
POST /api/resource/MyDocType/<name>
Body: {"run_method": "custom_action"}

# Via method endpoint
GET /api/method/my_app.my_app.doctype.my_doctype.my_doctype.custom_action
```

**Source:** `frappe/frappe/api/v1.py` lines 81-95

---

[Frappe Call Method: run_doc_method() Behind the Scene](./56-frappe-call-behind-the-scene(run_doc_method).md)