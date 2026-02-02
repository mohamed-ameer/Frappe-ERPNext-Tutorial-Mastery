# Decorators in Frappe Controllers: Concept, Theory & Code

This guide explains decorators in Frappe DocType controllers, focusing on `@property`, `@cached_property`, `@frappe.whitelist()`, `@staticmethod`, `@classmethod`, and other useful decorators with 100% accurate examples from the Frappe and ERPNext codebases.

---

## Table of Contents

1. [What are Decorators?](#what-are-decorators)
2. [The @property Decorator](#the-property-decorator)
3. [The @cached_property Decorator](#the-cached_property-decorator)
4. [The @frappe.whitelist() Decorator](#the-frappewhitelist-decorator)
5. [The @staticmethod Decorator](#the-staticmethod-decorator)
6. [The @classmethod Decorator](#the-classmethod-decorator)
7. [The @Document.hook Decorator](#the-documenthook-decorator)
8. [Custom Decorators](#custom-decorators)
9. [Decorator Combinations](#decorator-combinations)
10. [Best Practices](#best-practices)

---

## What are Decorators?

### Definition

A **decorator** is a Python design pattern that allows you to modify or enhance the behavior of functions or methods without changing their source code.

**Syntax:**
```python
@decorator_name
def function_name():
    pass
```

**What it does:**
```python
# This:
@decorator
def func():
    pass

# Is equivalent to:
def func():
    pass
func = decorator(func)
```

### Why Use Decorators in Frappe Controllers?

1. **Computed Properties**: Calculate values on-the-fly without storing them
2. **Caching**: Avoid expensive recalculations
3. **API Exposure**: Make methods accessible via HTTP
4. **Code Reusability**: Share logic across methods
5. **Separation of Concerns**: Keep business logic clean

---

## The @property Decorator

### What is @property?

The `@property` decorator converts a **method** into a **read-only attribute**. You can access it like a field, but it's computed dynamically.

### Why Use @property?

1. **Computed Fields**: Calculate values based on other fields
2. **Lazy Loading**: Fetch data only when needed
3. **Encapsulation**: Hide implementation details
4. **Backward Compatibility**: Change internal logic without breaking API
5. **Validation**: Control how values are accessed

### Theory: How @property Works

```python
class Example:
    def __init__(self):
        self._value = 10
    
    @property
    def value(self):
        """This method becomes a property"""
        return self._value * 2

# Usage
obj = Example()
print(obj.value)  # 20 (called like an attribute, not a method)
# NOT: obj.value()  # This would raise TypeError
```

### Real-World Example 1: Company Currency

**Source:** `erpnext/erpnext/controllers/accounts_controller.py` (lines 116-121)

```python
class AccountsController(TransactionBase):
    @property
    def company_currency(self):
        if not hasattr(self, "__company_currency"):
            self.__company_currency = erpnext.get_company_currency(self.company)
        
        return self.__company_currency
```

**How it works:**
1. First access: Fetches currency from database and caches in `__company_currency`
2. Subsequent accesses: Returns cached value
3. Usage: `self.company_currency` (not `self.company_currency()`)

**Why this pattern?**
- Avoids multiple database queries
- Looks like a field but computed dynamically
- Caches result for performance

### Real-World Example 2: Prepared Report Properties

**Source:** `frappe/frappe/core/doctype/prepared_report/prepared_report.py` (lines 45-51)

```python
class PreparedReport(Document):
    @property
    def queued_by(self):
        return self.owner
    
    @property
    def queued_at(self):
        return self.creation
```

**Why use @property here?**
- Provides semantic aliases (`queued_by` instead of `owner`)
- Makes code more readable
- Can change implementation later without breaking code

### Real-World Example 3: File Remote Check

**Source:** `frappe/frappe/core/doctype/file/file.py` (lines 75-79)

```python
class File(Document):
    @property
    def is_remote_file(self):
        if self.file_url:
            return self.file_url.startswith(URL_PREFIXES)
        return not self.content
```

**Why @property?**
- Computed boolean based on file_url
- Clean syntax: `if file.is_remote_file:` instead of `if file.is_remote_file():`
- Logic can change without affecting callers

### Real-World Example 4: Email Sender

**Source:** `frappe/frappe/core/doctype/communication/communication.py` (lines 294-296)

```python
class Communication(Document):
    @property
    def sender_mailid(self):
        return parse_addr(self.sender)[1] if self.sender else ""
```

**Why @property?**
- Extracts email from "Name <email>" format
- Computed on-demand
- Clean interface

### When to Use @property

| Use Case | Example |
|----------|---------|
| **Computed values** | `total_amount = quantity * rate` |
| **Derived fields** | `full_name = first_name + last_name` |
| **Lazy loading** | Fetch related data only when accessed |
| **Aliases** | Provide semantic names for existing fields |
| **Validation** | Check conditions before returning |

### When NOT to Use @property

❌ **Don't use for:**
- Methods that modify state (use regular methods)
- Expensive operations without caching (use `@cached_property`)
- Methods that take parameters (properties can't have parameters)
- Operations with side effects

### Complete Example: Custom DocType with @property

```python
# File: myapp/myapp/doctype/sales_order/sales_order.py

import frappe
from frappe.model.document import Document

class SalesOrder(Document):
    @property
    def total_amount(self):
        """Calculate total from items"""
        total = 0
        for item in self.items:
            total += item.amount
        return total

    @property
    def is_overdue(self):
        """Check if order is overdue"""
        from frappe.utils import getdate, nowdate
        if self.delivery_date:
            return getdate(self.delivery_date) < getdate(nowdate())
        return False

    @property
    def customer_email(self):
        """Get customer email (lazy loading)"""
        if not hasattr(self, "_customer_email"):
            self._customer_email = frappe.db.get_value("Customer", self.customer, "email_id")
        return self._customer_email

    def validate(self):
        # Use properties like regular fields
        if self.is_overdue:
            frappe.msgprint(f"Order is overdue! Total: {self.total_amount}")
```

**Usage in code:**
```python
# Get document
order = frappe.get_doc("Sales Order", "SO-0001")

# Access properties (no parentheses!)
print(order.total_amount)      # Computed
print(order.is_overdue)        # Boolean check
print(order.customer_email)    # Lazy loaded

# In Jinja templates
# {{ doc.total_amount }}
# {% if doc.is_overdue %}Overdue!{% endif %}
```

---

## The @cached_property Decorator

### What is @cached_property?

`@cached_property` is like `@property` but **caches the result** after the first access. It's from Python's `functools` module.

**Source:** `frappe/frappe/model/base_document.py` (lines 141-147)

```python
from functools import cached_property

class BaseDocument:
    @cached_property
    def meta(self):
        return frappe.get_meta(self.doctype)

    @cached_property
    def permitted_fieldnames(self) -> set[str]:
        return set(get_permitted_fields(doctype=self.doctype, parenttype=getattr(self, "parenttype", None)))
```

### Difference: @property vs @cached_property

| Feature | @property | @cached_property |
|---------|-----------|------------------|
| **Computation** | Every access | Only first access |
| **Caching** | Manual (if needed) | Automatic |
| **Performance** | Slower for expensive ops | Faster after first call |
| **Memory** | No extra memory | Stores result |
| **Use Case** | Dynamic values | Static/expensive values |

### Example: @property vs @cached_property

```python
import time
from functools import cached_property

class Example:
    @property
    def expensive_property(self):
        """Computed every time"""
        print("Computing...")
        time.sleep(1)
        return "result"

    @cached_property
    def cached_expensive_property(self):
        """Computed only once"""
        print("Computing...")
        time.sleep(1)
        return "result"

# Usage
obj = Example()

# @property: Computes every time
print(obj.expensive_property)  # Computing... (1 second)
print(obj.expensive_property)  # Computing... (1 second)
print(obj.expensive_property)  # Computing... (1 second)

# @cached_property: Computes only once
print(obj.cached_expensive_property)  # Computing... (1 second)
print(obj.cached_expensive_property)  # (instant)
print(obj.cached_expensive_property)  # (instant)
```

### Real-World Example: Document Meta

**Source:** `frappe/frappe/model/base_document.py` (lines 141-143)

```python
class BaseDocument:
    @cached_property
    def meta(self):
        return frappe.get_meta(self.doctype)
```

**Why @cached_property?**
- `frappe.get_meta()` is expensive (loads DocType definition)
- Meta doesn't change during document lifecycle
- Accessed frequently throughout code
- Perfect candidate for caching

**Usage:**
```python
# In any Document method
def validate(self):
    # First access: Loads meta from database
    for field in self.meta.fields:
        print(field.fieldname)

    # Subsequent accesses: Returns cached meta (instant)
    if self.meta.is_submittable:
        self.validate_submission()
```

### When to Use @cached_property

✅ **Use for:**
- Expensive database queries
- Complex calculations
- Values that don't change during object lifetime
- Frequently accessed computed values

❌ **Don't use for:**
- Values that might change
- Simple calculations (overhead not worth it)
- Values that depend on mutable state

### Custom Example: Cached Properties

```python
from functools import cached_property
import frappe
from frappe.model.document import Document

class Customer(Document):
    @cached_property
    def total_orders(self):
        """Count total orders (expensive query)"""
        return frappe.db.count("Sales Order", {"customer": self.name})

    @cached_property
    def credit_balance(self):
        """Calculate credit balance (complex calculation)"""
        invoices = frappe.get_all("Sales Invoice",
            filters={"customer": self.name, "docstatus": 1},
            fields=["grand_total", "outstanding_amount"]
        )
        return sum(inv.outstanding_amount for inv in invoices)

    @cached_property
    def customer_group_tree(self):
        """Get customer group hierarchy (expensive)"""
        from frappe.utils.nestedset import get_ancestors_of
        return get_ancestors_of("Customer Group", self.customer_group)

    def validate(self):
        # First access: Queries database
        if self.total_orders > 100:
            self.customer_type = "VIP"

        # Second access: Returns cached value (instant)
        if self.total_orders > 1000:
            self.customer_type = "Platinum"
```

---

## The @frappe.whitelist() Decorator

### What is @frappe.whitelist()?

The `@frappe.whitelist()` decorator **exposes a Python method as an HTTP API endpoint**. It makes the method callable from:
- JavaScript (client-side)
- External applications (REST API)
- Other Python code

### Why Use @frappe.whitelist()?

1. **API Exposure**: Make methods accessible via HTTP
2. **Security**: Only whitelisted methods can be called remotely
3. **Client-Server Communication**: Call server methods from JavaScript
4. **Integration**: Allow external systems to interact with Frappe

### Basic Syntax

```python
@frappe.whitelist()
def my_method():
    """This method can be called via API"""
    return {"status": "success"}
```

**API Endpoint:** `/api/method/myapp.mymodule.my_method`

### Real-World Example 1: DocType Controller Method

**Source:** `erpnext/erpnext/controllers/accounts_controller.py` (lines 2915-2922)

```python
class AccountsController(TransactionBase):
    @frappe.whitelist()
    def repost_accounting_entries(self):
        repost_ledger = frappe.new_doc("Repost Accounting Ledger")
        repost_ledger.company = self.company
        repost_ledger.append("vouchers", {"voucher_type": self.doctype, "voucher_no": self.name})
        repost_ledger.flags.ignore_permissions = True
        repost_ledger.insert()
        repost_ledger.submit()
```

**How to call:**

**From JavaScript:**
```javascript
// In form script
frappe.ui.form.on("Sales Invoice", {
    refresh: function(frm) {
        frm.add_custom_button("Repost Entries", function() {
            frm.call({
                method: "repost_accounting_entries",
                doc: frm.doc,
                callback: function(r) {
                    frappe.msgprint("Entries reposted!");
                }
            });
        });
    }
});
```

**From Python:**
```python
# Get document and call method
doc = frappe.get_doc("Sales Invoice", "SI-0001")
doc.repost_accounting_entries()
```

**Via HTTP API:**
```bash
curl -X POST https://example.com/api/method/run_doc_method \
  -H "Authorization: token xxx:yyy" \
  -H "Content-Type: application/json" \
  -d '{
    "dt": "Sales Invoice",
    "dn": "SI-0001",
    "method": "repost_accounting_entries"
  }'
```

### Real-World Example 2: Module-Level Function

**Source:** `frappe/frappe/desk/doctype/system_console/system_console.py` (lines 57-73)

```python
@frappe.whitelist()
def show_processlist():
    frappe.only_for("System Manager")

    return frappe.db.multisql(
        {
            "postgres": """
            SELECT pid AS "Id",
                query_start AS "Time",
                state AS "State",
                query AS "Info",
                wait_event AS "Progress"
            FROM pg_stat_activity""",
            "mariadb": "show full processlist",
        },
        as_dict=True,
    )
```

**How to call:**

**From JavaScript:**
```javascript
frappe.call({
    method: "frappe.desk.doctype.system_console.system_console.show_processlist",
    callback: function(r) {
        console.log(r.message);
    }
});
```

**Via HTTP:**
```bash
curl -X POST https://example.com/api/method/frappe.desk.doctype.system_console.system_console.show_processlist \
  -H "Authorization: token xxx:yyy"
```

### @frappe.whitelist() Options

#### 1. allow_guest=True

Allow unauthenticated access:

```python
@frappe.whitelist(allow_guest=True)
def public_api():
    """Anyone can call this, even without login"""
    return {"message": "Hello, World!"}
```

**Use cases:**
- Public APIs
- Website forms
- Guest checkout
- Public data endpoints

#### 2. methods=["POST"]

Restrict HTTP methods:

```python
@frappe.whitelist(methods=["POST"])
def create_order(data):
    """Only POST requests allowed"""
    order = frappe.get_doc(json.loads(data))
    order.insert()
    return order.name
```

**Available methods:**
- `GET` - Read operations
- `POST` - Create/modify operations
- `PUT` - Update operations
- `DELETE` - Delete operations

#### 3. xss_safe=True

Mark output as XSS-safe (HTML allowed):

```python
@frappe.whitelist(xss_safe=True)
def get_html_content():
    """Returns HTML that won't be escaped"""
    return "<h1>Hello</h1>"
```

### Security Considerations

**Without @frappe.whitelist():**
```python
def sensitive_method():
    """This CANNOT be called via API"""
    frappe.db.sql("DELETE FROM tabUser")  # Safe from remote calls
```

**With @frappe.whitelist():**
```python
@frappe.whitelist()
def public_method():
    """This CAN be called via API - add permission checks!"""
    if not frappe.has_permission("User", "delete"):
        frappe.throw("Not permitted")

    frappe.db.sql("DELETE FROM tabUser WHERE name = %s", user)
```

### Complete Example: Whitelisted Methods

```python
# File: myapp/myapp/doctype/sales_order/sales_order.py

import frappe
from frappe.model.document import Document
import json

class SalesOrder(Document):
    @frappe.whitelist()
    def approve_order(self):
        """Approve this sales order"""
        if not frappe.has_permission(self.doctype, "submit", self):
            frappe.throw("Not permitted to approve")

        self.status = "Approved"
        self.approved_by = frappe.session.user
        self.save()
        return {"status": "success", "message": "Order approved"}

    @frappe.whitelist()
    def calculate_shipping(self, shipping_method):
        """Calculate shipping cost"""
        # This method takes parameters
        rates = {
            "Standard": 10,
            "Express": 25,
            "Overnight": 50
        }
        return rates.get(shipping_method, 0)

    @frappe.whitelist(methods=["POST"])
    def add_item(self, item_code, qty):
        """Add item to order (POST only)"""
        self.append("items", {
            "item_code": item_code,
            "qty": qty
        })
        self.save()
        return self.items[-1]

# Module-level whitelisted function
@frappe.whitelist()
def get_pending_orders(customer=None):
    """Get all pending orders"""
    filters = {"status": "Pending"}
    if customer:
        filters["customer"] = customer

    return frappe.get_all("Sales Order",
        filters=filters,
        fields=["name", "customer", "grand_total"]
    )

@frappe.whitelist(allow_guest=True)
def get_public_catalog():
    """Public API - no login required"""
    return frappe.get_all("Item",
        filters={"show_in_website": 1},
        fields=["name", "item_name", "standard_rate"]
    )
```

**JavaScript usage:**
```javascript
// Call doc method
frm.call({
    method: "approve_order",
    doc: frm.doc,
    callback: function(r) {
        console.log(r.message);
    }
});

// Call doc method with parameters
frm.call({
    method: "calculate_shipping",
    doc: frm.doc,
    args: {
        shipping_method: "Express"
    },
    callback: function(r) {
        console.log("Shipping cost:", r.message);
    }
});

// Call module function
frappe.call({
    method: "myapp.myapp.doctype.sales_order.sales_order.get_pending_orders",
    args: {
        customer: "CUST-001"
    },
    callback: function(r) {
        console.log(r.message);
    }
});
```

---

## The @staticmethod Decorator

### What is @staticmethod?

A **static method** is a method that belongs to a class but **doesn't access instance data** (`self`) or class data (`cls`). It's like a regular function but organized within a class.

### Why Use @staticmethod?

1. **Utility Functions**: Group related functions in a class
2. **No Instance Needed**: Can be called without creating an object
3. **Namespace Organization**: Keep related functions together
4. **Virtual DocTypes**: Required for virtual DocType methods

### Basic Syntax

```python
class MyClass:
    @staticmethod
    def utility_function(x, y):
        """No self or cls parameter"""
        return x + y

# Call without instance
result = MyClass.utility_function(5, 3)  # 8

# Or with instance
obj = MyClass()
result = obj.utility_function(5, 3)  # 8
```

### Real-World Example: Virtual DocType

**Source:** `frappe/frappe/model/virtual_doctype.py` (lines 71-80)

```python
def validate_controller(doctype: str) -> None:
    controller = get_controller(doctype)

    expected_static_method = ["get_list", "get_count", "get_stats"]
    for m in expected_static_method:
        method = inspect.getattr_static(controller, m, None)
        if not isinstance(method, staticmethod):
            frappe.msgprint(
                _("Virtual DocType {} requires a static method called {} found {}").format(
                    frappe.bold(doctype), frappe.bold(m), frappe.bold(_as_str(method))
                ),
                title=_("Incomplete Virtual Doctype Implementation"),
            )
```

**Virtual DocType Example:**
```python
# File: myapp/myapp/doctype/api_log/api_log.py

import frappe
from frappe.model.document import Document

class APILog(Document):
    # Virtual DocType - no database table

    @staticmethod
    def get_list(args):
        """Required for virtual DocType"""
        # Fetch data from external source
        logs = fetch_logs_from_api()
        return logs

    @staticmethod
    def get_count(args):
        """Required for virtual DocType"""
        return len(fetch_logs_from_api())

    @staticmethod
    def get_stats(args):
        """Required for virtual DocType"""
        return {}
```

### When to Use @staticmethod

✅ **Use for:**
- Utility functions related to the class
- Virtual DocType required methods
- Functions that don't need instance/class data
- Helper functions for the class

❌ **Don't use for:**
- Methods that need `self` (use regular methods)
- Methods that need `cls` (use `@classmethod`)
- Methods that modify instance state

---

## The @classmethod Decorator

### What is @classmethod?

A **class method** receives the **class** (`cls`) as the first parameter instead of the instance (`self`). It can access class-level data but not instance data.

### Why Use @classmethod?

1. **Alternative Constructors**: Create instances in different ways
2. **Factory Methods**: Build objects with different configurations
3. **Class-Level Operations**: Modify class state
4. **Inheritance**: Methods that work with subclasses

### Basic Syntax

```python
class MyClass:
    count = 0

    @classmethod
    def increment_count(cls):
        """Receives cls, not self"""
        cls.count += 1

    @classmethod
    def create_from_dict(cls, data):
        """Alternative constructor"""
        return cls(**data)

# Call without instance
MyClass.increment_count()
obj = MyClass.create_from_dict({"name": "Test"})
```

### Example: Alternative Constructor

```python
import frappe
from frappe.model.document import Document
from frappe.utils import getdate

class SalesOrder(Document):
    @classmethod
    def create_from_quotation(cls, quotation_name):
        """Factory method to create Sales Order from Quotation"""
        quotation = frappe.get_doc("Quotation", quotation_name)

        # Create new Sales Order
        sales_order = cls({
            "doctype": "Sales Order",
            "customer": quotation.customer,
            "transaction_date": getdate(),
        })

        # Copy items
        for item in quotation.items:
            sales_order.append("items", {
                "item_code": item.item_code,
                "qty": item.qty,
                "rate": item.rate
            })

        return sales_order

    @classmethod
    def get_default_company(cls):
        """Class-level utility"""
        return frappe.defaults.get_user_default("Company")

# Usage
order = SalesOrder.create_from_quotation("QTN-0001")
order.insert()
```

### @staticmethod vs @classmethod vs Regular Method

| Feature | Regular Method | @staticmethod | @classmethod |
|---------|---------------|---------------|--------------|
| **First Parameter** | `self` (instance) | None | `cls` (class) |
| **Access Instance Data** | ✅ Yes | ❌ No | ❌ No |
| **Access Class Data** | ✅ Yes | ❌ No | ✅ Yes |
| **Can Modify Instance** | ✅ Yes | ❌ No | ❌ No |
| **Can Modify Class** | ✅ Yes | ❌ No | ✅ Yes |
| **Inheritance** | Inherits | Inherits | Inherits (with cls) |
| **Use Case** | Instance operations | Utilities | Factories, class ops |

---

## The @Document.hook Decorator

### What is @Document.hook?

The `@Document.hook` decorator makes a method **hookable**, meaning other apps can extend its functionality without modifying the original code.

**Source:** `frappe/frappe/model/document.py` (lines 1331-1373)

```python
class Document:
    @staticmethod
    def hook(f):
        """Decorator: Make method `hookable` (i.e. extensible by another app).

        Note: If each hooked method returns a value (dict), then all returns are
        collated in one dict and returned. Ideally, don't return values in hookable
        methods, set properties in the document."""

        def composer(self, *args, **kwargs):
            hooks = []
            method = f.__name__
            doc_events = frappe.get_doc_hooks()
            for handler in doc_events.get(self.doctype, {}).get(method, []) + doc_events.get("*", {}).get(method, []):
                hooks.append(frappe.get_attr(handler))

            composed = compose(f, *hooks)
            return composed(self, method, *args, **kwargs)

        return composer
```

### Why Use @Document.hook?

1. **Extensibility**: Allow other apps to extend functionality
2. **Plugin Architecture**: Add features without modifying core
3. **Separation of Concerns**: Keep customizations separate
4. **Maintainability**: Core code remains clean

### Example: Hookable Method

```python
# File: frappe/frappe/model/document.py

class Document:
    @Document.hook
    def validate(self):
        """This method can be extended by other apps"""
        pass
```

**In another app's hooks.py:**
```python
# File: custom_app/hooks.py

doc_events = {
    "Sales Order": {
        "validate": "custom_app.custom_validations.validate_sales_order"
    },
    "*": {
        "validate": "custom_app.custom_validations.validate_all_docs"
    }
}
```

**Custom validation:**
```python
# File: custom_app/custom_validations.py

def validate_sales_order(doc, method):
    """This runs when Sales Order.validate() is called"""
    if doc.grand_total > 100000:
        frappe.msgprint("Large order detected!")

def validate_all_docs(doc, method):
    """This runs for ALL DocTypes"""
    print(f"Validating {doc.doctype}")
```

### When to Use @Document.hook

✅ **Use for:**
- Methods that should be extensible
- Core framework methods
- Plugin points in your app

❌ **Don't use for:**
- Private methods
- Performance-critical methods
- Methods with complex return values

---

## Custom Decorators

### Creating Custom Decorators

You can create your own decorators for common patterns in your Frappe app.

### Example 1: Permission Check Decorator

```python
# File: myapp/myapp/utils/decorators.py

import frappe
from functools import wraps

def require_permission(doctype, ptype="read"):
    """Decorator to check permissions before method execution"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not frappe.has_permission(doctype, ptype):
                frappe.throw(f"No {ptype} permission for {doctype}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage
@frappe.whitelist()
@require_permission("Sales Order", "write")
def update_order(order_name, status):
    """Only users with write permission can call this"""
    doc = frappe.get_doc("Sales Order", order_name)
    doc.status = status
    doc.save()
    return doc
```

### Example 2: Logging Decorator

```python
import frappe
from functools import wraps
import time

def log_execution_time(func):
    """Decorator to log method execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()

        frappe.log_error(
            f"Method {func.__name__} took {end_time - start_time:.2f} seconds",
            "Performance Log"
        )
        return result
    return wrapper

# Usage
class SalesOrder(Document):
    @log_execution_time
    def calculate_totals(self):
        """This method's execution time will be logged"""
        # Complex calculation
        pass
```

### Example 3: Caching Decorator

```python
import frappe
from functools import wraps

def cache_result(expires_in_sec=300):
    """Decorator to cache method results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}_{str(args)}_{str(kwargs)}"

            # Check cache
            cached = frappe.cache().get_value(cache_key)
            if cached:
                return cached

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            frappe.cache().set_value(cache_key, result, expires_in_sec=expires_in_sec)
            return result
        return wrapper
    return decorator

# Usage
@frappe.whitelist()
@cache_result(expires_in_sec=600)  # Cache for 10 minutes
def get_dashboard_stats():
    """Expensive calculation, cached for 10 minutes"""
    return {
        "total_customers": frappe.db.count("Customer"),
        "total_orders": frappe.db.count("Sales Order"),
        "revenue": calculate_total_revenue()  # Expensive
    }
```

### Example 4: Validation Decorator

```python
import frappe
from functools import wraps

def validate_args(**validators):
    """Decorator to validate function arguments"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for arg_name, validator in validators.items():
                if arg_name in kwargs:
                    if not validator(kwargs[arg_name]):
                        frappe.throw(f"Invalid value for {arg_name}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage
@frappe.whitelist()
@validate_args(
    qty=lambda x: float(x) > 0,
    rate=lambda x: float(x) >= 0
)
def create_order_item(item_code, qty, rate):
    """Arguments are validated before execution"""
    return {
        "item_code": item_code,
        "qty": float(qty),
        "rate": float(rate)
    }
```

---

## Decorator Combinations

### Combining Multiple Decorators

You can stack multiple decorators on a single method. They are applied **bottom-to-top**.

```python
@decorator1
@decorator2
@decorator3
def function():
    pass

# Equivalent to:
# function = decorator1(decorator2(decorator3(function)))
```

### Example 1: Whitelisted Property

```python
class SalesOrder(Document):
    @frappe.whitelist()
    @property
    def total_amount(self):
        """ERROR: This doesn't work!"""
        # @property makes it an attribute, can't be called via API
        return sum(item.amount for item in self.items)
```

**Why it fails:**
- `@property` makes it an attribute (accessed without `()`)
- `@frappe.whitelist()` expects a callable method
- These two decorators are incompatible

### Example 2: Cached Whitelisted Method

```python
from functools import lru_cache

class Customer(Document):
    @frappe.whitelist()
    @lru_cache(maxsize=128)
    def get_order_history(self):
        """Whitelisted method with caching"""
        return frappe.get_all("Sales Order",
            filters={"customer": self.name},
            fields=["name", "grand_total", "status"]
        )
```

**Order matters:**
1. `@lru_cache` wraps the method first (caching)
2. `@frappe.whitelist()` wraps the cached method (API exposure)

### Example 3: Permission + Logging + Whitelist

```python
@frappe.whitelist()
@require_permission("Sales Order", "write")
@log_execution_time
def approve_order(order_name):
    """
    Execution order:
    1. @frappe.whitelist() - Makes it callable via API
    2. @require_permission - Checks permissions
    3. @log_execution_time - Logs execution time
    4. Function executes
    """
    doc = frappe.get_doc("Sales Order", order_name)
    doc.status = "Approved"
    doc.save()
    return doc
```

### Example 4: Complete Real-World Example

```python
# File: myapp/myapp/doctype/sales_order/sales_order.py

import frappe
from frappe.model.document import Document
from functools import cached_property, lru_cache
from myapp.utils.decorators import require_permission, log_execution_time

class SalesOrder(Document):
    # Property: Computed field
    @property
    def is_overdue(self):
        """Check if order is overdue"""
        from frappe.utils import getdate, nowdate
        if self.delivery_date:
            return getdate(self.delivery_date) < getdate(nowdate())
        return False

    # Cached Property: Expensive computation
    @cached_property
    def customer_credit_limit(self):
        """Get customer credit limit (cached)"""
        return frappe.db.get_value("Customer", self.customer, "credit_limit") or 0

    # Whitelisted Method: API accessible
    @frappe.whitelist()
    def approve_order(self):
        """Approve this sales order"""
        if not frappe.has_permission(self.doctype, "submit", self):
            frappe.throw("Not permitted")

        self.status = "Approved"
        self.save()
        return {"status": "success"}

    # Whitelisted + Custom Decorators
    @frappe.whitelist()
    @require_permission("Sales Order", "cancel")
    @log_execution_time
    def cancel_order(self, reason):
        """Cancel order with permission check and logging"""
        self.status = "Cancelled"
        self.cancellation_reason = reason
        self.save()
        return {"status": "cancelled"}

    # Static Method: Utility function
    @staticmethod
    def get_tax_rate(tax_category):
        """Get tax rate for category"""
        return frappe.db.get_value("Tax Category", tax_category, "tax_rate") or 0

    # Class Method: Factory
    @classmethod
    def create_from_quotation(cls, quotation_name):
        """Create Sales Order from Quotation"""
        quotation = frappe.get_doc("Quotation", quotation_name)
        order = cls({"doctype": "Sales Order", "customer": quotation.customer})
        return order
```

---

## Best Practices

### 1. Choose the Right Decorator

| Need | Use |
|------|-----|
| Computed field | `@property` |
| Expensive computation (cached) | `@cached_property` |
| API endpoint | `@frappe.whitelist()` |
| Utility function | `@staticmethod` |
| Factory method | `@classmethod` |
| Extensible method | `@Document.hook` |

### 2. Property Naming Conventions

```python
class Customer(Document):
    # Good: Descriptive names
    @property
    def full_address(self):
        return f"{self.address_line1}, {self.city}"

    @property
    def is_vip_customer(self):
        return self.customer_type == "VIP"

    # Bad: Confusing names
    @property
    def get_address(self):  # Don't use "get_" prefix
        return self.address

    @property
    def address(self):  # Don't shadow existing fields
        return self.address_line1  # Confusing!
```

### 3. Performance Considerations

```python
class SalesOrder(Document):
    # Bad: Expensive operation without caching
    @property
    def total_orders_this_month(self):
        """Queries database every time!"""
        return frappe.db.count("Sales Order", {
            "customer": self.customer,
            "creation": [">=", frappe.utils.get_first_day(frappe.utils.nowdate())]
        })

    # Good: Use cached_property for expensive operations
    @cached_property
    def total_orders_this_month(self):
        """Queries database only once"""
        return frappe.db.count("Sales Order", {
            "customer": self.customer,
            "creation": [">=", frappe.utils.get_first_day(frappe.utils.nowdate())]
        })
```

### 4. Security Best Practices

```python
# Bad: No permission check
@frappe.whitelist()
def delete_all_orders():
    """Anyone can call this!"""
    frappe.db.sql("DELETE FROM `tabSales Order`")

# Good: Permission check
@frappe.whitelist()
def delete_order(order_name):
    """Checks permissions before deleting"""
    doc = frappe.get_doc("Sales Order", order_name)
    if not doc.has_permission("delete"):
        frappe.throw("Not permitted")
    doc.delete()

# Better: Use decorator
@frappe.whitelist()
@require_permission("Sales Order", "delete")
def delete_order(order_name):
    """Permission checked by decorator"""
    frappe.get_doc("Sales Order", order_name).delete()
```

### 5. Documentation

```python
class SalesOrder(Document):
    @property
    def total_amount(self):
        """Calculate total amount from items.

        Returns:
            float: Sum of all item amounts

        Example:
            >>> order = frappe.get_doc("Sales Order", "SO-0001")
            >>> print(order.total_amount)
            1500.00
        """
        return sum(item.amount for item in self.items)

    @frappe.whitelist()
    def approve_order(self):
        """Approve this sales order.

        Requires:
            - Submit permission on Sales Order

        Returns:
            dict: {"status": "success", "message": "Order approved"}

        Raises:
            frappe.PermissionError: If user lacks permission
        """
        if not self.has_permission("submit"):
            frappe.throw("Not permitted")

        self.status = "Approved"
        self.save()
        return {"status": "success", "message": "Order approved"}
```

### 6. Avoid Common Pitfalls

```python
# Pitfall 1: Property with side effects
@property
def total_amount(self):
    """BAD: Modifies state"""
    self.calculated = True  # Side effect!
    return sum(item.amount for item in self.items)

# Pitfall 2: Property that takes parameters
@property
def get_total(self, include_tax):  # ERROR: Properties can't have parameters
    return self.total * (1 + include_tax)

# Pitfall 3: Mutable cached property
@cached_property
def items_list(self):
    """BAD: Returns mutable list"""
    return self.items  # If modified, cache is corrupted

# Pitfall 4: Forgetting @wraps in custom decorators
def my_decorator(func):
    def wrapper(*args, **kwargs):  # Missing @wraps(func)
        return func(*args, **kwargs)
    return wrapper  # func.__name__ is lost!

# Correct:
from functools import wraps

def my_decorator(func):
    @wraps(func)  # Preserves function metadata
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
```

---

## Summary

### Quick Reference Table

| Decorator | Purpose | Example Use Case |
|-----------|---------|------------------|
| `@property` | Computed attribute | `total_amount`, `is_overdue` |
| `@cached_property` | Cached computed attribute | `customer_credit_limit`, `meta` |
| `@frappe.whitelist()` | API endpoint | `approve_order()`, `get_stats()` |
| `@staticmethod` | Utility function | `calculate_tax()`, `validate_email()` |
| `@classmethod` | Factory method | `create_from_quotation()` |
| `@Document.hook` | Extensible method | `validate()`, `on_submit()` |
| `@lru_cache` | Function result caching | Expensive calculations |
| Custom decorators | Reusable patterns | Permission checks, logging |

### Key Takeaways

1. **@property**: Use for computed fields that look like attributes
2. **@cached_property**: Use for expensive computations that don't change
3. **@frappe.whitelist()**: Required for API-accessible methods
4. **@staticmethod**: For utility functions that don't need instance data
5. **@classmethod**: For alternative constructors and factory methods
6. **Combine decorators** carefully - order matters!
7. **Always add permission checks** to whitelisted methods
8. **Document your decorators** for maintainability

---

## Additional Resources

### Frappe Framework Documentation
- [Frappe API Documentation](https://frappeframework.com/docs/user/en/api)
- [DocType Controllers](https://frappeframework.com/docs/user/en/basics/doctypes/controllers)

### Python Documentation
- [Python Decorators](https://docs.python.org/3/glossary.html#term-decorator)
- [functools.cached_property](https://docs.python.org/3/library/functools.html#functools.cached_property)
- [functools.lru_cache](https://docs.python.org/3/library/functools.html#functools.lru_cache)

### Source Code References
- `frappe/frappe/model/document.py` - Document class and decorators
- `frappe/frappe/model/base_document.py` - BaseDocument with cached_property
- `erpnext/erpnext/controllers/accounts_controller.py` - Real-world @property examples
- `frappe/frappe/__init__.py` - @frappe.whitelist() implementation