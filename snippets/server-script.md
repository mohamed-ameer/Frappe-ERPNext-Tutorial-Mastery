# Frappe Server-Side Code Snippets

**Essential Python Patterns for Frappe Development**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Imports](#imports)
3. [Reading Data](#reading-data)
4. [Writing Data](#writing-data)
5. [Querying Data](#querying-data)
6. [Child Tables](#child-tables)
7. [Messages and Logging](#messages-and-logging)
8. [Configuration and Settings](#configuration-and-settings)
9. [Document Lifecycle](#document-lifecycle)
10. [Advanced Patterns](#advanced-patterns)
11. [Best Practices](#best-practices)
12. [Quick Reference](#quick-reference)

---

## Introduction

This guide contains **commonly used code snippets** for Frappe server-side development. Each snippet includes:
- ✅ Clear explanation
- ✅ When to use it
- ✅ Common pitfalls
- ✅ Real-world examples

**Use cases:**
- Server Scripts
- DocType Controllers
- API Methods
- Background Jobs
- Hooks

---

## Imports

### Standard Imports

```python
import frappe
from frappe import _
```

**Explanation:**
- `import frappe` - Main Frappe module with all core functions
- `from frappe import _` - Translation function for multi-language support

**When to use:**
- At the top of **every** server script
- In all controller files
- In custom API methods

**Example:**
```python
import frappe
from frappe import _

def my_function():
    # Use frappe functions
    doc = frappe.get_doc("Sales Order", "SO-0001")
    
    # Use translation
    frappe.msgprint(_("Order created successfully"))
```

---

## Reading Data

### 1. Get Single Field Value

```python
# Get one field
value = frappe.db.get_value("Customer", "CUST-001", "customer_name")
```

**Explanation:**
- Gets a **single field** value from a document
- Returns the value directly (not a dict)
- Fast and efficient for single field lookups

**When to use:**
- Need only one field value
- Quick lookups in loops
- Validation checks

**Example:**
```python
# Check if customer is active
is_active = frappe.db.get_value("Customer", "CUST-001", "disabled")

if is_active == 0:
    frappe.msgprint(_("Customer is active"))
```

### 2. Get Multiple Fields (Tuple)

```python
# Get multiple fields as tuple
field1, field2, field3 = frappe.db.get_value(
    "Customer", 
    "CUST-001", 
    ["customer_name", "customer_group", "territory"]
)
```

**Explanation:**
- Gets **multiple fields** from a document
- Returns a **tuple** of values
- Order matches the field list order
- Unpacks directly into variables

**When to use:**
- Need 2-5 fields from same document
- Want to unpack into separate variables
- Performance-critical code (faster than get_doc)

**Example:**
```python
# Get customer details
name, group, territory = frappe.db.get_value(
    "Customer",
    "CUST-001",
    ["customer_name", "customer_group", "territory"]
)

frappe.msgprint(_(f"Customer: {name}, Group: {group}, Territory: {territory}"))
```

### 3. Get Multiple Fields (Dictionary)

```python
# Get multiple fields as dictionary
doc = frappe.db.get_value(
    "Customer", 
    "CUST-001", 
    ["customer_name", "customer_group", "territory"],
    as_dict=True
)

# Access fields
print(doc.customer_name)
print(doc.customer_group)
```

**Explanation:**
- Gets **multiple fields** from a document
- Returns a **dictionary** (frappe._dict)
- Access fields using dot notation or dict keys
- More readable than tuple unpacking

**When to use:**
- Need many fields (5+)
- Want named access to fields
- Passing data to other functions
- More readable code

**Example:**
```python
# Get customer details
customer = frappe.db.get_value(
    "Customer",
    "CUST-001",
    ["customer_name", "customer_group", "territory", "credit_limit"],
    as_dict=True
)

# Use in calculations
if customer.credit_limit > 0:
    frappe.msgprint(_(f"{customer.customer_name} has credit limit: {customer.credit_limit}"))
```

### 4. Get Full Document

```python
# Get complete document with all fields
doc = frappe.get_doc("Sales Order", "SO-0001")

# Access any field
print(doc.customer)
print(doc.grand_total)

# Access child tables
for item in doc.items:
    print(item.item_code, item.qty)
```

**Explanation:**
- Loads **complete document** with all fields
- Includes child tables
- Returns Document object with methods
- Slower than get_value (loads everything)

**When to use:**
- Need many fields from document
- Need child table data
- Need to call document methods
- Need to modify and save document

**Example:**
```python
# Get sales order
order = frappe.get_doc("Sales Order", "SO-0001")

# Calculate total quantity
total_qty = sum(item.qty for item in order.items)

frappe.msgprint(_(f"Total items: {total_qty}"))
```

### 5. Get Document as Dictionary

```python
# Get document and convert to dict
doc = frappe.get_doc("Sales Order", "SO-0001")
args = doc.as_dict()

# Now it's a plain dictionary
print(args["customer"])
print(args["grand_total"])
```

**Explanation:**
- Converts Document object to plain dictionary
- Useful for passing to functions
- Serializable (can be JSON encoded)
- Loses Document methods

**When to use:**
- Passing data to API responses
- Logging document data
- Comparing documents
- Creating copies

**Example:**
```python
# Get order data
order = frappe.get_doc("Sales Order", "SO-0001")
order_data = order.as_dict()

# Pass to custom function
process_order(order_data)

# Or return in API
return order_data
```

---

## Writing Data

### 1. Create New Document

```python
# Create new document
new_doc = frappe.new_doc("Customer")
new_doc.update({
    "customer_name": "ABC Corp",
    "customer_group": "Commercial",
    "territory": "All Territories",
})
new_doc.insert(ignore_permissions=True)

# Get the created document name
print(new_doc.name)  # e.g., "CUST-0001"
```

**Explanation:**
- Creates a **new document** instance
- `update()` sets multiple fields at once
- `insert()` saves to database
- `ignore_permissions=True` bypasses permission checks

**When to use:**
- Creating documents programmatically
- Background jobs
- Data import scripts
- Automated document creation

**Example:**
```python
# Create customer from lead
lead = frappe.get_doc("Lead", "LEAD-0001")

customer = frappe.new_doc("Customer")
customer.update({
    "customer_name": lead.lead_name,
    "customer_group": "Individual",
    "territory": lead.territory,
    "email_id": lead.email_id,
})
customer.insert(ignore_permissions=True)

frappe.msgprint(_(f"Customer {customer.name} created"))
```

### 2. Update Single Field (db_set)

```python
# Update single field without loading document
doc = frappe.get_doc("Sales Order", "SO-0001")
doc.db_set("status", "Completed")
```

**Explanation:**
- Updates **single field** directly in database
- **Skips** validations and triggers
- **Skips** on_update hooks
- Fast and efficient
- Use with caution!

**When to use:**
- Simple status updates
- Background jobs
- Bulk updates
- When you want to skip validations

**⚠️ Warning:**
- Skips all validations
- Skips workflow
- Skips permission checks
- Use `save()` if you need validations

**Example:**
```python
# Mark order as completed
order = frappe.get_doc("Sales Order", "SO-0001")
order.db_set("status", "Completed")

# Update modified timestamp
order.db_set("modified", frappe.utils.now())
```

### 3. Update Multiple Fields (db_set)

```python
# Update multiple fields at once
doc = frappe.get_doc("Sales Order", "SO-0001")
doc.db_set({
    "status": "Completed",
    "delivery_status": "Delivered",
    "billing_status": "Fully Billed",
})
```

**Explanation:**
- Updates **multiple fields** directly in database
- Same as single field `db_set()` but for multiple fields
- **Skips** validations and triggers
- More efficient than multiple single updates

**When to use:**
- Updating multiple related fields
- Bulk status updates
- Background synchronization
- When validations not needed

**Example:**
```python
# Update order completion details
order = frappe.get_doc("Sales Order", "SO-0001")
order.db_set({
    "status": "Completed",
    "completed_date": frappe.utils.today(),
    "completed_by": frappe.session.user,
})
```

### 4. Update with Validations (set_value)

```python
# Update fields with validations
update_fields = {
    "status": "Completed",
    "delivery_status": "Delivered",
    "billing_status": "Fully Billed",
}

frappe.db.set_value(
    "Sales Order",
    "SO-0001",
    update_fields
)
```

**Explanation:**
- Updates fields **with validations**
- Triggers `validate()` method
- Triggers `on_update()` hooks
- Slower than `db_set()` but safer

**When to use:**
- Need validations to run
- Need hooks to execute
- User-initiated updates
- When data integrity is critical

**Example:**
```python
# Update customer with validation
frappe.db.set_value(
    "Customer",
    "CUST-001",
    {
        "credit_limit": 100000,
        "payment_terms": "Net 30",
    }
)
# This will trigger validate() and check credit limit rules
```

### 5. Update and Save Document

```python
# Load, update, and save document
doc = frappe.get_doc("Sales Order", "SO-0001")
doc.status = "Completed"
doc.delivery_date = frappe.utils.today()
doc.save(ignore_permissions=True)
```

**Explanation:**
- Loads full document
- Updates fields
- Calls `validate()` and `on_update()`
- Triggers all hooks and workflows
- Safest but slowest method

**When to use:**
- Complex updates
- Need full validation
- Need workflow transitions
- User-facing operations

**Example:**
```python
# Complete sales order with full validation
order = frappe.get_doc("Sales Order", "SO-0001")
order.status = "Completed"
order.delivery_date = frappe.utils.today()

# This will:
# - Validate all fields
# - Check permissions
# - Trigger on_update hooks
# - Update modified timestamp
order.save()
```

---

## Querying Data

### 1. SQL Query (as_dict=True)

```python
# Execute SQL query
data = frappe.db.sql("""
    SELECT
        customer,
        SUM(grand_total) as total_amount,
        COUNT(*) as order_count
    FROM `tabSales Order`
    WHERE docstatus = 1
        AND posting_date BETWEEN %(from_date)s AND %(to_date)s
    GROUP BY customer
    ORDER BY total_amount DESC
""", {
    "from_date": "2024-01-01",
    "to_date": "2024-12-31",
}, as_dict=True)

# Access results
for row in data:
    print(row.customer, row.total_amount, row.order_count)
```

**Explanation:**
- Executes **raw SQL** query
- `as_dict=True` returns list of dictionaries
- Use **parameterized queries** (`%(param)s`) for safety
- Table names must be in backticks with `tab` prefix

**When to use:**
- Complex queries with JOINs
- Aggregations (SUM, COUNT, AVG)
- Performance-critical queries
- Reporting

**⚠️ Security:**
- Always use parameterized queries
- Never concatenate user input into SQL
- Prevents SQL injection

**Example:**
```python
# Get top customers by revenue
top_customers = frappe.db.sql("""
    SELECT
        customer,
        customer_name,
        SUM(grand_total) as revenue
    FROM `tabSales Order`
    WHERE docstatus = 1
        AND YEAR(posting_date) = %(year)s
    GROUP BY customer
    ORDER BY revenue DESC
    LIMIT 10
""", {"year": 2024}, as_dict=True)

for customer in top_customers:
    print(f"{customer.customer_name}: {customer.revenue}")
```

### 2. Get All (Filtered List)

```python
# Get filtered list of documents
orders = frappe.get_all(
    "Sales Order",
    filters={
        "customer": "CUST-001",
        "status": "Draft",
        "docstatus": 0,
    },
    fields=["name", "posting_date", "grand_total"],
    order_by="posting_date desc",
    limit=10,
)

# Access results
for order in orders:
    print(order.name, order.grand_total)
```

**Explanation:**
- Gets **filtered list** of documents
- Returns only specified fields
- Supports ordering and limiting
- Cleaner than SQL for simple queries

**When to use:**
- Simple filtering
- No JOINs needed
- Standard field queries
- List view data

**Example:**
```python
# Get pending orders for customer
pending_orders = frappe.get_all(
    "Sales Order",
    filters={
        "customer": "CUST-001",
        "status": ["in", ["Draft", "To Deliver"]],
        "docstatus": ["!=", 2],  # Not cancelled
    },
    fields=["name", "posting_date", "grand_total", "status"],
    order_by="posting_date desc",
)

total = sum(order.grand_total for order in pending_orders)
frappe.msgprint(_(f"Pending orders: {len(pending_orders)}, Total: {total}"))
```

### 3. Check if Document Exists

```python
# Check if document exists
exists = frappe.db.exists("Customer", {
    "customer_name": "ABC Corp",
    "customer_group": "Commercial",
    "territory": "All Territories",
})

if exists:
    print(f"Customer exists: {exists}")  # Returns the name
else:
    print("Customer does not exist")
```

**Explanation:**
- Checks if document **exists** with given filters
- Returns **document name** if exists, **None** if not
- Efficient (doesn't load full document)
- Can check by name or filters

**When to use:**
- Before creating duplicates
- Validation checks
- Conditional logic
- Data import scripts

**Example:**
```python
# Check if customer exists before creating
customer_name = "ABC Corp"

existing = frappe.db.exists("Customer", {"customer_name": customer_name})

if existing:
    frappe.msgprint(_(f"Customer already exists: {existing}"))
else:
    # Create new customer
    customer = frappe.new_doc("Customer")
    customer.customer_name = customer_name
    customer.insert()
```

### 4. Count Documents

```python
# Count documents with filters
count = frappe.db.count(
    "Sales Order",
    filters={
        "customer": "CUST-001",
        "status": "Draft",
    }
)

print(f"Draft orders: {count}")
```

**Explanation:**
- Counts documents matching filters
- Returns integer
- Efficient (doesn't load documents)
- Useful for statistics

**When to use:**
- Dashboard statistics
- Validation (check limits)
- Reporting
- Conditional logic

**Example:**
```python
# Check if customer has too many pending orders
pending_count = frappe.db.count(
    "Sales Order",
    filters={
        "customer": "CUST-001",
        "status": ["in", ["Draft", "To Deliver"]],
    }
)

if pending_count > 10:
    frappe.throw(_("Customer has too many pending orders"))
```

---

## Child Tables

### 1. Get Child Table Data

```python
# Get child table rows
child_table_data = frappe.get_all(
    "Sales Order Item",  # Child DocType
    filters={
        "parent": "SO-0001",  # Parent document name
        "parenttype": "Sales Order",  # Parent DocType
        "item_code": "ITEM-001",  # Additional filters
    },
    fields=["item_code", "qty", "rate", "amount"],
    order_by="idx",  # Order by row index
)

for row in child_table_data:
    print(row.item_code, row.qty, row.rate)
```

**Explanation:**
- Gets rows from **child table**
- Must specify `parent` and `parenttype`
- Can add additional filters
- Returns list of dictionaries

**When to use:**
- Query specific child rows
- Without loading parent document
- Performance-critical queries
- Reporting on child data

**Example:**
```python
# Get all items ordered by customer
items = frappe.get_all(
    "Sales Order Item",
    filters={
        "parenttype": "Sales Order",
        "parent": ["in", ["SO-0001", "SO-0002", "SO-0003"]],
    },
    fields=["parent", "item_code", "qty", "amount"],
)

# Group by item
from collections import defaultdict
item_totals = defaultdict(float)

for row in items:
    item_totals[row.item_code] += row.qty
```

### 2. Loop Through Child Table

```python
# Get parent document
doc = frappe.get_doc("Sales Order", "SO-0001")

# Loop through child table
for row in doc.get("items"):  # "items" is the fieldname
    print(row.item_code, row.qty, row.rate)

    # Access row properties
    print(row.idx)  # Row index
    print(row.name)  # Row ID (e.g., "SOI-0001")

    # Modify row
    row.qty = row.qty * 2
    row.amount = row.qty * row.rate

# Save changes
doc.save()
```

**Explanation:**
- Loads parent document
- `get("fieldname")` returns child table rows
- Each row is a Document object
- Can modify and save

**When to use:**
- Need to modify child rows
- Complex calculations
- Need parent context
- Validation logic

**Example:**
```python
# Apply discount to all items
order = frappe.get_doc("Sales Order", "SO-0001")

for item in order.get("items"):
    # Apply 10% discount
    item.discount_percentage = 10
    item.rate = item.price_list_rate * 0.9
    item.amount = item.qty * item.rate

# Recalculate totals
order.calculate_taxes_and_totals()
order.save()
```

### 3. Append to Child Table

```python
# Get parent document
doc = frappe.get_doc("Sales Order", "SO-0001")

# Append new row
doc.append("items", {
    "item_code": "ITEM-001",
    "qty": 10,
    "rate": 100,
    "amount": 1000,
    "idx": len(doc.items) + 1,  # Set index
})

# Save document
doc.save()
```

**Explanation:**
- Adds new row to child table
- `append(fieldname, dict)` adds row
- `idx` sets row position
- Must save parent document

**When to use:**
- Adding items programmatically
- Copying rows
- Data import
- Automated document creation

**Example:**
```python
# Add items from template
order = frappe.get_doc("Sales Order", "SO-0001")
template = frappe.get_doc("Item Template", "TMPL-001")

for template_item in template.items:
    order.append("items", {
        "item_code": template_item.item_code,
        "qty": template_item.default_qty,
        "rate": frappe.db.get_value("Item", template_item.item_code, "standard_rate"),
    })

order.save()
```

### 4. Remove from Child Table

```python
# Get parent document
doc = frappe.get_doc("Sales Order", "SO-0001")

# Remove specific rows
rows_to_remove = []
for row in doc.get("items"):
    if row.qty == 0:
        rows_to_remove.append(row)

# Remove rows
for row in rows_to_remove:
    doc.remove(row)

# Save document
doc.save()
```

**Explanation:**
- Removes rows from child table
- `remove(row)` marks row for deletion
- Must save to persist changes
- Don't modify list while iterating

**When to use:**
- Removing invalid rows
- Cleanup operations
- Conditional deletion
- Data validation

**Example:**
```python
# Remove cancelled items
order = frappe.get_doc("Sales Order", "SO-0001")

# Collect rows to remove
to_remove = [row for row in order.items if row.status == "Cancelled"]

# Remove them
for row in to_remove:
    order.remove(row)

# Recalculate and save
order.calculate_taxes_and_totals()
order.save()
```

---

## Messages and Logging

### 1. Show Message to User

```python
# Show message to user
frappe.msgprint(_("Order created successfully"))

# With color indicator
frappe.msgprint(
    _("The order {0} has been created").format("SO-0001"),
    indicator="green",
    title=_("Success")
)

# Different indicators
frappe.msgprint(_("Warning message"), indicator="orange", title=_("Warning"))
frappe.msgprint(_("Error message"), indicator="red", title=_("Error"))
frappe.msgprint(_("Info message"), indicator="blue", title=_("Information"))
```

**Explanation:**
- Shows **popup message** to user
- `_()` translates message
- `indicator` sets color (green, orange, red, blue)
- `title` sets popup title
- `.format()` for dynamic values

**When to use:**
- User feedback
- Success confirmations
- Warnings
- Information messages

**Example:**
```python
# Create order and show message
order = frappe.new_doc("Sales Order")
order.customer = "CUST-001"
order.insert()

frappe.msgprint(
    _("Sales Order {0} created for customer {1}").format(
        order.name,
        order.customer_name
    ),
    indicator="green",
    title=_("Order Created")
)
```

### 2. Throw Error (Stop Execution)

```python
# Throw error and stop execution
if not customer:
    frappe.throw(_("Customer is required"))

# With title
if credit_limit_exceeded:
    frappe.throw(
        _("Credit limit exceeded for customer {0}").format(customer_name),
        title=_("Credit Limit Error")
    )
```

**Explanation:**
- **Stops execution** immediately
- Shows error message to user
- Rolls back database transaction
- Use for validation errors

**When to use:**
- Validation failures
- Business rule violations
- Required field checks
- Permission errors

**Example:**
```python
# Validate credit limit
def validate_credit_limit(customer, order_total):
    credit_limit = frappe.db.get_value("Customer", customer, "credit_limit")
    outstanding = frappe.db.get_value("Customer", customer, "outstanding_amount")

    if credit_limit and (outstanding + order_total) > credit_limit:
        frappe.throw(
            _("Credit limit exceeded. Limit: {0}, Outstanding: {1}, Order: {2}").format(
                credit_limit,
                outstanding,
                order_total
            ),
            title=_("Credit Limit Exceeded")
        )
```

### 3. Log Error

```python
# Log error with traceback
try:
    # Some code that might fail
    result = risky_operation()
except Exception as e:
    frappe.log_error(
        title=f"Error in risky_operation",
        message=frappe.get_traceback()
    )
```

**Explanation:**
- Logs error to **Error Log** DocType
- `frappe.get_traceback()` gets full stack trace
- Doesn't stop execution
- Useful for debugging

**When to use:**
- Background jobs
- Try-except blocks
- Non-critical errors
- Debugging production issues

**Example:**
```python
# Send email with error logging
def send_order_confirmation(order_name):
    try:
        order = frappe.get_doc("Sales Order", order_name)

        frappe.sendmail(
            recipients=[order.contact_email],
            subject=f"Order Confirmation - {order.name}",
            message=f"Your order has been confirmed.",
        )
    except Exception as e:
        frappe.log_error(
            title=f"Email Error - {order_name}",
            message=frappe.get_traceback()
        )
        # Continue execution
```

### 4. Simple Log Error

```python
# Simple error log
frappe.log_error("Error Title", "Error message or details")

# With variables
frappe.log_error(
    f"Order Processing Error - {order_name}",
    f"Failed to process order: {error_details}"
)
```

**Explanation:**
- Simpler version of `log_error()`
- First param: title
- Second param: message
- No traceback needed

**When to use:**
- Simple error logging
- Custom error messages
- Business logic errors
- Audit trail

**Example:**
```python
# Log business rule violation
if order_total < minimum_order_value:
    frappe.log_error(
        f"Minimum Order Value - {order.name}",
        f"Order total {order_total} is below minimum {minimum_order_value}"
    )
```

---

## Configuration and Settings

### 1. Get Single DocType Value

```python
# Get value from Single DocType
setting_value = frappe.db.get_single_value('System Settings', 'enable_scheduler')

# Use the value
if setting_value:
    print("Scheduler is enabled")
```

**Explanation:**
- Gets field value from **Single DocType**
- Single DocTypes have only one record
- Fast and efficient
- No need to load full document

**When to use:**
- Reading settings
- Configuration values
- System preferences
- Feature flags

**Example:**
```python
# Check if email is enabled
email_enabled = frappe.db.get_single_value('Email Account', 'enable_outgoing')

if email_enabled:
    send_email_notification()
else:
    frappe.msgprint(_("Email is disabled"))
```

### 2. Get System Settings

```python
# Get System Settings document
settings = frappe.get_doc("System Settings")

# Access fields
print(settings.country)
print(settings.time_zone)
print(settings.enable_scheduler)
```

**Explanation:**
- Loads **System Settings** Single DocType
- Access all settings fields
- Can modify and save
- Commonly used settings

**When to use:**
- Need multiple settings
- Modifying settings
- System configuration
- Setup scripts

**Example:**
```python
# Update system settings
settings = frappe.get_doc("System Settings")
settings.enable_scheduler = 1
settings.backup_limit = 10
settings.save()
```

### 3. Get Site Config

```python
# Get value from site_config.json
developer_mode = frappe.get_site_config().get("developer_mode", 0)

# Check if in developer mode
if developer_mode:
    print("Developer mode is ON")
```

**Explanation:**
- Reads from `site_config.json` file
- `.get(key, default)` returns value or default
- Site-specific configuration
- Not stored in database

**When to use:**
- Developer mode checks
- Site-specific settings
- Environment configuration
- Feature flags

**Example:**
```python
# Different behavior in developer mode
if frappe.get_site_config().get("developer_mode"):
    # Show detailed errors
    frappe.msgprint(frappe.get_traceback())
else:
    # Show user-friendly message
    frappe.msgprint(_("An error occurred"))
```

### 4. Get Field Precision

```python
# Get precision for currency field
doc = frappe.get_doc("Sales Order", "SO-0001")
precision = doc.precision("grand_total") or 2

# Use precision for rounding
rounded_value = frappe.utils.flt(123.456789, precision)
print(rounded_value)  # 123.46 (if precision is 2)
```

**Explanation:**
- Gets **decimal precision** for a field
- Based on field type and currency
- Returns number of decimal places
- Defaults to 2 if not found

**When to use:**
- Rounding calculations
- Currency formatting
- Display formatting
- Precision-sensitive calculations

**Example:**
```python
# Calculate with correct precision
order = frappe.get_doc("Sales Order", "SO-0001")
precision = order.precision("grand_total") or 2

# Calculate discount
discount_amount = order.grand_total * 0.1
discount_amount = frappe.utils.flt(discount_amount, precision)

order.discount_amount = discount_amount
order.save()
```

### 5. Set User Context

```python
# Switch to Administrator user
frappe.set_user("Administrator")

# Perform operations as Administrator
doc = frappe.get_doc("Sales Order", "SO-0001")
doc.status = "Completed"
doc.save()  # Saves with Administrator permissions

# Switch back to original user
frappe.set_user(original_user)
```

**Explanation:**
- Changes current user context
- All operations run as specified user
- Affects permissions and audit trail
- Use with caution!

**When to use:**
- Background jobs
- System operations
- Bypassing permissions
- Automated tasks

**⚠️ Warning:**
- Changes audit trail (modified_by)
- Bypasses permissions
- Use only when necessary
- Remember to switch back

**Example:**
```python
# Background job to cleanup old records
def cleanup_old_records():
    original_user = frappe.session.user

    try:
        # Switch to Administrator
        frappe.set_user("Administrator")

        # Delete old records
        old_records = frappe.get_all(
            "Error Log",
            filters={"creation": ["<", "2023-01-01"]},
            pluck="name"
        )

        for name in old_records:
            frappe.delete_doc("Error Log", name)

        frappe.db.commit()
    finally:
        # Always switch back
        frappe.set_user(original_user)
```

---

## Document Lifecycle

### 1. Get Document Before Save

```python
def on_update(self, *args, **kwargs):
    """Called when document is saved"""

    # Get document state before save
    old_doc = self.get_doc_before_save()

    if old_doc:
        # Check if field changed
        if self.status != old_doc.status:
            frappe.msgprint(
                _("Status changed from {0} to {1}").format(
                    old_doc.status,
                    self.status
                )
            )

        # Check if amount increased
        if self.grand_total > old_doc.grand_total:
            difference = self.grand_total - old_doc.grand_total
            frappe.msgprint(_(f"Amount increased by {difference}"))
```

**Explanation:**
- Gets document **before current save**
- Returns None on first save (insert)
- Useful for detecting changes
- Available in `validate()` and `on_update()`

**When to use:**
- Detecting field changes
- Audit trail
- Conditional logic
- Change notifications

**Example:**
```python
class SalesOrder(Document):
    def validate(self):
        """Validate before save"""
        old_doc = self.get_doc_before_save()

        if old_doc:
            # Prevent changing customer after submission
            if self.docstatus == 1 and self.customer != old_doc.customer:
                frappe.throw(_("Cannot change customer after submission"))

            # Log price changes
            if self.grand_total != old_doc.grand_total:
                self.add_comment(
                    "Info",
                    f"Price changed from {old_doc.grand_total} to {self.grand_total}"
                )
```

### 2. Before Insert Hook

```python
def before_insert(self):
    """Called before document is inserted"""

    # Set default values
    if not self.posting_date:
        self.posting_date = frappe.utils.today()

    # Generate custom naming
    if not self.custom_id:
        self.custom_id = generate_custom_id()

    # Validation
    if not self.customer:
        frappe.throw(_("Customer is required"))
```

**Explanation:**
- Called **before** document is inserted
- Document doesn't have `name` yet
- Set defaults
- Custom validation

**When to use:**
- Setting default values
- Custom naming logic
- Pre-insert validation
- Initialization

**Example:**
```python
class SalesOrder(Document):
    def before_insert(self):
        # Set default delivery date (7 days from now)
        if not self.delivery_date:
            self.delivery_date = frappe.utils.add_days(frappe.utils.today(), 7)

        # Set default warehouse
        if not self.warehouse:
            self.warehouse = frappe.db.get_single_value(
                "Stock Settings",
                "default_warehouse"
            )
```

### 3. After Insert Hook

```python
def after_insert(self):
    """Called after document is inserted"""

    # Send notification
    frappe.sendmail(
        recipients=["manager@example.com"],
        subject=f"New Order: {self.name}",
        message=f"Order {self.name} created for {self.customer}"
    )

    # Create related documents
    self.create_delivery_note()

    # Update counters
    self.update_customer_order_count()
```

**Explanation:**
- Called **after** document is inserted
- Document has `name` now
- Safe to create related documents
- Good for notifications

**When to use:**
- Sending notifications
- Creating related documents
- Updating counters
- Post-creation tasks

**Example:**
```python
class SalesOrder(Document):
    def after_insert(self):
        # Create task for sales team
        task = frappe.new_doc("Task")
        task.subject = f"Process Order {self.name}"
        task.reference_type = "Sales Order"
        task.reference_name = self.name
        task.assigned_to = self.sales_person
        task.insert()
```

### 4. Validate Hook

```python
def validate(self):
    """Called before save (insert or update)"""

    # Validate required fields
    if not self.customer:
        frappe.throw(_("Customer is required"))

    # Business logic validation
    if self.grand_total < 0:
        frappe.throw(_("Total cannot be negative"))

    # Calculate fields
    self.calculate_totals()

    # Set values
    self.status = self.get_status()
```

**Explanation:**
- Called **before every save**
- Both insert and update
- Throw errors to prevent save
- Calculate and set values

**When to use:**
- Field validation
- Business rules
- Calculations
- Setting computed values

**Example:**
```python
class SalesOrder(Document):
    def validate(self):
        # Validate delivery date
        if self.delivery_date and self.delivery_date < self.posting_date:
            frappe.throw(_("Delivery date cannot be before posting date"))

        # Validate credit limit
        self.validate_credit_limit()

        # Calculate totals
        self.calculate_taxes_and_totals()

        # Set status
        self.set_status()
```

### 5. On Update Hook

```python
def on_update(self):
    """Called after document is saved"""

    # Update related documents
    self.update_delivery_notes()

    # Send notifications
    if self.status == "Completed":
        self.send_completion_email()

    # Update dashboard
    self.update_customer_dashboard()
```

**Explanation:**
- Called **after save** (insert or update)
- Document is already saved
- Safe to update other documents
- Good for side effects

**When to use:**
- Updating related documents
- Sending notifications
- Updating dashboards
- Post-save tasks

**Example:**
```python
class SalesOrder(Document):
    def on_update(self):
        # Update customer's last order date
        frappe.db.set_value(
            "Customer",
            self.customer,
            "last_order_date",
            self.posting_date
        )

        # Notify sales team if high value order
        if self.grand_total > 100000:
            self.notify_sales_manager()
```

### 6. On Submit Hook

```python
def on_submit(self):
    """Called when document is submitted"""

    # Create delivery note
    self.create_delivery_note()

    # Update stock
    self.update_stock_levels()

    # Send confirmation
    self.send_order_confirmation()
```

**Explanation:**
- Called when document is **submitted** (docstatus = 1)
- Document is locked after submission
- Create related documents
- Trigger workflows

**When to use:**
- Creating related documents
- Stock updates
- Financial postings
- Workflow triggers

**Example:**
```python
class SalesOrder(Document):
    def on_submit(self):
        # Reserve stock
        for item in self.items:
            frappe.get_doc({
                "doctype": "Stock Reservation",
                "item_code": item.item_code,
                "qty": item.qty,
                "warehouse": item.warehouse,
                "reference_type": "Sales Order",
                "reference_name": self.name,
            }).insert()
```

### 7. On Cancel Hook

```python
def on_cancel(self):
    """Called when document is cancelled"""

    # Cancel related documents
    self.cancel_delivery_notes()

    # Reverse stock updates
    self.reverse_stock_entries()

    # Send notification
    self.send_cancellation_email()
```

**Explanation:**
- Called when document is **cancelled** (docstatus = 2)
- Reverse operations from submit
- Cancel related documents
- Cleanup

**When to use:**
- Reversing submit operations
- Cancelling related documents
- Cleanup tasks
- Notifications

**Example:**
```python
class SalesOrder(Document):
    def on_cancel(self):
        # Cancel stock reservations
        reservations = frappe.get_all(
            "Stock Reservation",
            filters={
                "reference_type": "Sales Order",
                "reference_name": self.name,
            },
            pluck="name"
        )

        for name in reservations:
            frappe.delete_doc("Stock Reservation", name)
```

---

## Advanced Patterns

### 1. Bulk Operations

```python
# Bulk update multiple documents
def bulk_update_status(order_names, new_status):
    """Update status for multiple orders"""

    for name in order_names:
        frappe.db.set_value("Sales Order", name, "status", new_status)

    frappe.db.commit()
    frappe.msgprint(_(f"Updated {len(order_names)} orders"))
```

**When to use:**
- Batch processing
- Data migration
- Bulk status updates
- Cleanup scripts

**Example:**
```python
# Complete all delivered orders
delivered_orders = frappe.get_all(
    "Sales Order",
    filters={
        "delivery_status": "Fully Delivered",
        "status": ["!=", "Completed"],
    },
    pluck="name"
)

for order_name in delivered_orders:
    order = frappe.get_doc("Sales Order", order_name)
    order.status = "Completed"
    order.save()

frappe.db.commit()
```

### 2. Transaction Management

```python
# Manual transaction control
def process_orders():
    """Process orders with transaction control"""

    try:
        # Start transaction
        frappe.db.begin()

        # Process orders
        for order_name in order_list:
            process_single_order(order_name)

        # Commit if all successful
        frappe.db.commit()
        frappe.msgprint(_("All orders processed"))

    except Exception as e:
        # Rollback on error
        frappe.db.rollback()
        frappe.log_error("Order Processing Error", frappe.get_traceback())
        frappe.throw(_("Error processing orders"))
```

**When to use:**
- Batch operations
- All-or-nothing operations
- Complex workflows
- Data integrity critical

**Example:**
```python
# Transfer stock between warehouses
def transfer_stock(items, from_warehouse, to_warehouse):
    try:
        frappe.db.begin()

        for item in items:
            # Reduce from source
            reduce_stock(item.item_code, item.qty, from_warehouse)

            # Add to destination
            add_stock(item.item_code, item.qty, to_warehouse)

        frappe.db.commit()
        frappe.msgprint(_("Stock transferred successfully"))

    except Exception as e:
        frappe.db.rollback()
        frappe.throw(_("Stock transfer failed"))
```

### 3. Caching

```python
# Cache expensive operations
@frappe.whitelist()
def get_customer_stats(customer):
    """Get customer statistics with caching"""

    # Check cache
    cache_key = f"customer_stats_{customer}"
    cached_data = frappe.cache().get_value(cache_key)

    if cached_data:
        return cached_data

    # Calculate stats
    stats = {
        "total_orders": frappe.db.count("Sales Order", {"customer": customer}),
        "total_revenue": frappe.db.sql("""
            SELECT SUM(grand_total)
            FROM `tabSales Order`
            WHERE customer = %s AND docstatus = 1
        """, customer)[0][0] or 0,
    }

    # Cache for 1 hour
    frappe.cache().set_value(cache_key, stats, expires_in_sec=3600)

    return stats
```

**When to use:**
- Expensive calculations
- Frequently accessed data
- Dashboard data
- API responses

**Example:**
```python
# Cache item price
def get_item_price(item_code, price_list):
    cache_key = f"item_price_{item_code}_{price_list}"

    # Check cache
    price = frappe.cache().get_value(cache_key)
    if price:
        return price

    # Get from database
    price = frappe.db.get_value(
        "Item Price",
        {"item_code": item_code, "price_list": price_list},
        "price_list_rate"
    )

    # Cache for 10 minutes
    frappe.cache().set_value(cache_key, price, expires_in_sec=600)

    return price
```

### 4. Enqueue Background Job

```python
# Enqueue long-running task
def process_large_order(order_name):
    """Process order in background"""

    frappe.enqueue(
        method="my_app.tasks.process_order",
        queue="long",
        timeout=3600,
        order_name=order_name,
        now=False,  # Run in background
    )

    frappe.msgprint(_("Order processing started in background"))
```

**When to use:**
- Long-running operations
- Bulk processing
- Email sending
- Report generation

**Example:**
```python
# Send bulk emails in background
def send_promotional_emails(customer_list):
    """Send emails to customers in background"""

    frappe.enqueue(
        method="my_app.email.send_bulk_emails",
        queue="long",
        timeout=7200,
        customers=customer_list,
        template="promotional_email",
    )

    frappe.msgprint(_(f"Sending emails to {len(customer_list)} customers"))
```

### 5. Permission Checks

```python
# Check permissions before operation
def update_order(order_name, new_status):
    """Update order with permission check"""

    # Check if user has permission
    if not frappe.has_permission("Sales Order", "write", order_name):
        frappe.throw(_("You don't have permission to update this order"))

    # Update order
    order = frappe.get_doc("Sales Order", order_name)
    order.status = new_status
    order.save()
```

**When to use:**
- Custom operations
- API methods
- Workflow actions
- Security-critical operations

**Example:**
```python
@frappe.whitelist()
def approve_order(order_name):
    """Approve order (requires approval permission)"""

    # Check custom permission
    if not frappe.has_permission("Sales Order", "approve", order_name):
        frappe.throw(_("You don't have permission to approve orders"))

    # Approve order
    order = frappe.get_doc("Sales Order", order_name)
    order.approval_status = "Approved"
    order.approved_by = frappe.session.user
    order.approved_on = frappe.utils.now()
    order.save()

    frappe.msgprint(_("Order approved successfully"))
```

---

## Best Practices

### 1. Always Use Parameterized Queries

✅ **Do:**
```python
# Safe - parameterized query
data = frappe.db.sql("""
    SELECT * FROM `tabCustomer`
    WHERE customer_name = %(name)s
""", {"name": customer_name}, as_dict=True)
```

❌ **Don't:**
```python
# Dangerous - SQL injection risk!
data = frappe.db.sql(f"""
    SELECT * FROM `tabCustomer`
    WHERE customer_name = '{customer_name}'
""", as_dict=True)
```

### 2. Use get_value for Single Fields

✅ **Do:**
```python
# Fast - only gets one field
customer_name = frappe.db.get_value("Customer", "CUST-001", "customer_name")
```

❌ **Don't:**
```python
# Slow - loads entire document
customer = frappe.get_doc("Customer", "CUST-001")
customer_name = customer.customer_name
```

### 3. Use db_set for Simple Updates

✅ **Do:**
```python
# Fast - direct database update
doc.db_set("status", "Completed")
```

❌ **Don't:**
```python
# Slow - loads, validates, saves
doc = frappe.get_doc("Sales Order", "SO-0001")
doc.status = "Completed"
doc.save()
```

**But:** Use `save()` when you need validations!

### 4. Check Existence Before Creating

✅ **Do:**
```python
# Check first
if not frappe.db.exists("Customer", {"customer_name": "ABC Corp"}):
    customer = frappe.new_doc("Customer")
    customer.customer_name = "ABC Corp"
    customer.insert()
```

❌ **Don't:**
```python
# Creates duplicates!
customer = frappe.new_doc("Customer")
customer.customer_name = "ABC Corp"
customer.insert()
```

### 5. Use Translation Function

✅ **Do:**
```python
# Translatable
frappe.msgprint(_("Order created successfully"))
frappe.throw(_("Customer is required"))
```

❌ **Don't:**
```python
# Not translatable
frappe.msgprint("Order created successfully")
frappe.throw("Customer is required")
```

### 6. Handle Errors Gracefully

✅ **Do:**
```python
try:
    order = frappe.get_doc("Sales Order", order_name)
    order.submit()
except Exception as e:
    frappe.log_error("Order Submit Error", frappe.get_traceback())
    frappe.msgprint(_("Error submitting order"))
```

❌ **Don't:**
```python
# No error handling
order = frappe.get_doc("Sales Order", order_name)
order.submit()  # Might fail!
```

### 7. Use Appropriate Update Method

| Method | Validations | Hooks | Speed | Use When |
|--------|-------------|-------|-------|----------|
| `db_set()` | ❌ No | ❌ No | ⚡ Fast | Simple updates, background jobs |
| `set_value()` | ✅ Yes | ✅ Yes | 🐌 Slow | Need validations |
| `save()` | ✅ Yes | ✅ Yes | 🐌 Slowest | Complex updates, user actions |

### 8. Commit Transactions Carefully

✅ **Do:**
```python
# Explicit commit for batch operations
for order in orders:
    process_order(order)

frappe.db.commit()  # Commit once at end
```

❌ **Don't:**
```python
# Too many commits
for order in orders:
    process_order(order)
    frappe.db.commit()  # Slow!
```

---

## Quick Reference

### Reading Data

```python
# Single field
value = frappe.db.get_value("DocType", "name", "field")

# Multiple fields (tuple)
f1, f2, f3 = frappe.db.get_value("DocType", "name", ["f1", "f2", "f3"])

# Multiple fields (dict)
doc = frappe.db.get_value("DocType", "name", ["f1", "f2"], as_dict=True)

# Full document
doc = frappe.get_doc("DocType", "name")

# List with filters
docs = frappe.get_all("DocType", filters={...}, fields=[...])

# SQL query
data = frappe.db.sql("SELECT ...", {...}, as_dict=True)

# Check existence
exists = frappe.db.exists("DocType", {"field": "value"})

# Count
count = frappe.db.count("DocType", filters={...})
```

### Writing Data

```python
# Create new
doc = frappe.new_doc("DocType")
doc.update({...})
doc.insert()

# Update single field (no validation)
doc.db_set("field", "value")

# Update multiple fields (no validation)
doc.db_set({"f1": "v1", "f2": "v2"})

# Update with validation
frappe.db.set_value("DocType", "name", {"f1": "v1"})

# Update and save
doc = frappe.get_doc("DocType", "name")
doc.field = "value"
doc.save()
```

### Child Tables

```python
# Get child rows
rows = frappe.get_all("Child DocType", filters={"parent": "name"})

# Loop through child table
for row in doc.get("child_field"):
    print(row.field)

# Append row
doc.append("child_field", {...})

# Remove row
doc.remove(row)
```

### Messages

```python
# Show message
frappe.msgprint(_("Message"), indicator="green", title=_("Title"))

# Throw error
frappe.throw(_("Error message"))

# Log error
frappe.log_error(title="Title", message=frappe.get_traceback())
```

### Settings

```python
# Single DocType value
value = frappe.db.get_single_value("Single DocType", "field")

# System Settings
settings = frappe.get_doc("System Settings")

# Site config
value = frappe.get_site_config().get("key", default)

# Field precision
precision = doc.precision("field") or 2
```

### Hooks

```python
def before_insert(self): ...
def after_insert(self): ...
def validate(self): ...
def on_update(self): ...
def on_submit(self): ...
def on_cancel(self): ...
def on_trash(self): ...

# Get old document
old_doc = self.get_doc_before_save()
```
