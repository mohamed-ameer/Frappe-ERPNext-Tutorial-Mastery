# Frappe Database Operations - Complete Reference Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Create Operations](#create-operations)
3. [Read Operations](#read-operations)
4. [Write Operations](#write-operations)
5. [Transaction Management](#transaction-management)
6. [Query Builder](#query-builder)
7. [Raw SQL Operations](#raw-sql-operations)
8. [Schema Operations](#schema-operations)
9. [Single DocType Operations](#single-doctype-operations)
10. [Bulk Operations](#bulk-operations)
11. [Utility Operations](#utility-operations)

---

## Introduction

Frappe provides multiple layers for database access:
- **Document ORM**: High-level object-oriented interface with hooks and validations
- **Database Facade (`frappe.db`)**: Convenience methods for common operations
- **Query Builder (`frappe.qb`)**: Type-safe, parameterized query construction
- **Raw SQL**: Direct SQL execution for advanced cases

This guide covers every method with practical examples and parameter explanations.

---

## Create Operations

Creating documents in Frappe can be done through multiple methods, each with different use cases. The Document ORM methods (`frappe.new_doc()` and `doc.insert()`) are recommended for most cases as they trigger hooks, validations, and permissions.

### 1. `frappe.new_doc()`

**Purpose**: Create a new Document object with defaults set.

**Signature**:
```python
frappe.new_doc(
    doctype,              # DocType name (str)
    parent_doc=None,      # Parent Document object (for child tables)
    parentfield=None,     # Parent field name (for child tables)
    as_dict=False,       # Return as dict instead of Document
    **kwargs             # Field values as keyword arguments
)
```

**Use Case 1: Create simple document**
```python
# Create a new customer
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
customer.customer_type = "Company"
customer.insert()
# Document is created with all hooks and validations

# Parameters explained:
# - doctype="Customer": The DocType to create
# - Returns Document object ready to be populated
```

**Use Case 2: Create with initial values**
```python
# Create customer with values in one call
customer = frappe.new_doc(
    "Customer",
    customer_name="Acme Corporation",
    customer_type="Company",
    territory="North America"
)
customer.insert()
# All fields set before insert

# Parameters explained:
# - **kwargs: Field values passed as keyword arguments
```

**Use Case 3: Create child table row**
```python
# Create parent document
sales_order = frappe.new_doc("Sales Order")
sales_order.customer = "CUST-001"
sales_order.transaction_date = "2024-01-15"

# Add child table row
item = frappe.new_doc(
    "Sales Order Item",
    parent_doc=sales_order,
    parentfield="items"
)
item.item_code = "ITEM-001"
item.qty = 10
item.rate = 100

# Add another child row
item2 = frappe.new_doc(
    "Sales Order Item",
    parent_doc=sales_order,
    parentfield="items"
)
item2.item_code = "ITEM-002"
item2.qty = 5
item2.rate = 200

sales_order.insert()
# Parent and all children inserted together

# Parameters explained:
# - parent_doc=sales_order: Parent Document object
# - parentfield="items": Field name in parent that contains child table
```

**Use Case 4: Create as dictionary**
```python
# Get document as dict (useful for APIs)
customer_dict = frappe.new_doc(
    "Customer",
    customer_name="Acme Corporation",
    as_dict=True
)
# Returns: {"doctype": "Customer", "customer_name": "Acme Corporation", ...}

# Parameters explained:
# - as_dict=True: Return dict instead of Document object
```

**Use Case 5: Create with defaults from DocType**
```python
# Create document - defaults are automatically set
task = frappe.new_doc("Task")
# Defaults like status, priority, etc. are set from DocType defaults
task.subject = "New Task"
task.insert()

# Parameters explained:
# - Defaults are automatically applied from DocType meta
```

---

### 2. `Document.insert()`

**Purpose**: Insert a Document into the database with full validation and hooks.

**Signature**:
```python
doc.insert(
    ignore_permissions=None,    # Skip permission checks
    ignore_links=None,          # Skip link validation
    ignore_if_duplicate=False,  # Don't raise on duplicate
    ignore_mandatory=None,     # Skip mandatory field checks
    set_name=None,             # Custom name to set
    set_child_names=True       # Auto-generate child row names
)
```

**Use Case 1: Basic insert**
```python
# Create and insert document
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
customer.insert()
# Returns: Document object with name set

# Parameters explained:
# - Automatically sets name, creation, modified, owner, etc.
# - Triggers before_insert, validate, on_update, after_insert hooks
```

**Use Case 2: Insert with custom name**
```python
# Insert with specific name
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
customer.insert(set_name="CUST-CUSTOM-001")
# Document name is set to "CUST-CUSTOM-001"

# Parameters explained:
# - set_name="...": Override auto-generated name
# - Name must be valid and unique
```

**Use Case 3: Insert ignoring permissions**
```python
# Insert without permission checks (use carefully)
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
customer.insert(ignore_permissions=True)
# Skips permission checks (useful in background jobs, migrations)

# Parameters explained:
# - ignore_permissions=True: Bypass permission checks
# - Use only when necessary (system operations, migrations)
```

**Use Case 4: Insert ignoring link validation**
```python
# Insert without validating linked documents
task = frappe.new_doc("Task")
task.subject = "New Task"
task.assigned_to = "non-existent-user@example.com"
task.insert(ignore_links=True)
# Doesn't check if assigned_to user exists

# Parameters explained:
# - ignore_links=True: Skip validation of Link fields
# - Useful when creating documents before linked documents exist
```

**Use Case 5: Insert ignoring mandatory fields**
```python
# Insert without mandatory field checks
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
# Missing other mandatory fields
customer.insert(ignore_mandatory=True)
# Skips mandatory field validation

# Parameters explained:
# - ignore_mandatory=True: Skip mandatory field checks
# - Use only in special cases (data migration, system operations)
```

**Use Case 6: Insert ignoring duplicates**
```python
# Insert, don't raise error if duplicate exists
customer = frappe.new_doc("Customer")
customer.customer_name = "Acme Corporation"
customer.insert(ignore_if_duplicate=True)
# If duplicate exists, returns existing document instead of raising error

# Parameters explained:
# - ignore_if_duplicate=True: Return existing doc if duplicate found
# - Useful for idempotent operations
```

**Use Case 7: Insert without auto-naming child rows**
```python
# Insert parent with child rows, don't auto-generate child names
sales_order = frappe.new_doc("Sales Order")
sales_order.customer = "CUST-001"

item = frappe.new_doc("Sales Order Item", parent_doc=sales_order, parentfield="items")
item.item_code = "ITEM-001"
item.name = "CUSTOM-ITEM-NAME"  # Custom name
item.qty = 10

sales_order.insert(set_child_names=False)
# Child row keeps custom name

# Parameters explained:
# - set_child_names=False: Don't auto-generate child row names
# - Useful when you need specific child row names
```

**Use Case 8: Insert with child tables**
```python
# Create parent with multiple child rows
sales_order = frappe.new_doc("Sales Order")
sales_order.customer = "CUST-001"
sales_order.transaction_date = "2024-01-15"

# Add child rows
for item_data in [{"item_code": "ITEM-001", "qty": 10, "rate": 100},
                  {"item_code": "ITEM-002", "qty": 5, "rate": 200}]:
    item = frappe.new_doc("Sales Order Item", parent_doc=sales_order, parentfield="items")
    item.update(item_data)

sales_order.insert()
# Parent and all children inserted in single transaction

# Parameters explained:
# - Child rows are automatically linked via parent, parenttype, parentfield
# - All inserted in same transaction
```

---

### 3. `frappe.get_doc()` with dict

**Purpose**: Create Document from dictionary and insert.

**Use Case 1: Create from dict**
```python
# Create document from dictionary
customer_dict = {
    "doctype": "Customer",
    "customer_name": "Acme Corporation",
    "customer_type": "Company",
    "territory": "North America"
}
customer = frappe.get_doc(customer_dict)
customer.insert()
# Document created from dict, then inserted

# Parameters explained:
# - dict must include "doctype" key
# - All fields can be set in dict
```

**Use Case 2: Create with child tables from dict**
```python
# Create parent with children from nested dict
sales_order_dict = {
    "doctype": "Sales Order",
    "customer": "CUST-001",
    "transaction_date": "2024-01-15",
    "items": [
        {
            "item_code": "ITEM-001",
            "qty": 10,
            "rate": 100
        },
        {
            "item_code": "ITEM-002",
            "qty": 5,
            "rate": 200
        }
    ]
}
sales_order = frappe.get_doc(sales_order_dict)
sales_order.insert()
# Parent and children created from nested structure

# Parameters explained:
# - Child tables as list of dicts
# - Automatically sets parent, parenttype, parentfield
```

**Use Case 3: Create and insert in one line**
```python
# Create and insert in single call
customer = frappe.get_doc({
    "doctype": "Customer",
    "customer_name": "Acme Corporation"
}).insert()
# Returns inserted Document

# Parameters explained:
# - Chain .insert() for one-liner
```

---

### 4. Query Builder Insert

**Purpose**: Insert using Query Builder (bypasses hooks, use with caution).

**Use Case 1: Simple insert**
```python
# Insert using Query Builder
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.into(Task)
    .columns("name", "subject", "status", "owner", "creation")
    .insert("TASK-999", "New Task", "Open", "admin@example.com", "2024-01-15 10:00:00")
)

query.run()
# Executes: INSERT INTO tabTask (name, subject, status, owner, creation) VALUES (...)

# Parameters explained:
# - frappe.qb.into(Task): Insert query builder
# - .columns(...): Field names
# - .insert(...): Values (must match columns order and count)
# - Warning: Bypasses hooks and validations
```

**Use Case 2: Insert multiple rows**
```python
# Insert multiple rows
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.into(Task)
    .columns("name", "subject", "status", "owner")
    .insert("TASK-001", "Task 1", "Open", "admin@example.com")
    .insert("TASK-002", "Task 2", "Open", "admin@example.com")
    .insert("TASK-003", "Task 3", "Closed", "admin@example.com")
)

query.run()
# Inserts all rows in single query

# Parameters explained:
# - Chain multiple .insert() calls
# - All rows inserted in one transaction
```

**Use Case 3: Insert with ignore duplicates**
```python
# Insert, ignore duplicates (MariaDB)
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.into(Task)
    .columns("name", "subject", "status")
    .insert("TASK-001", "Task 1", "Open")
    .ignore()  # MariaDB: INSERT IGNORE
)

query.run()
# If duplicate exists, silently skips

# Parameters explained:
# - .ignore(): MariaDB INSERT IGNORE
# - For Postgres, use .on_conflict().do_nothing()
```

**Use Case 4: Insert with conflict handling (Postgres)**
```python
# Insert with conflict resolution (Postgres)
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.into(Task)
    .columns("name", "subject", "status")
    .insert("TASK-001", "Task 1", "Open")
    .on_conflict(Task.name)
    .do_nothing()  # Postgres: ON CONFLICT DO NOTHING
)

query.run()
# If duplicate exists, skips insert

# Parameters explained:
# - .on_conflict(Task.name): Conflict on name field
# - .do_nothing(): Skip on conflict
```

---

### 5. Raw SQL Insert

**Purpose**: Direct SQL insert (bypasses hooks, use only when necessary).

**Use Case 1: Simple SQL insert**
```python
# Insert using raw SQL
frappe.db.sql("""
    INSERT INTO `tabTask` 
    (name, subject, status, owner, creation, modified, modified_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
""", (
    "TASK-999",
    "New Task",
    "Open",
    "admin@example.com",
    "2024-01-15 10:00:00",
    "2024-01-15 10:00:00",
    "admin@example.com"
))
# Executes direct INSERT

# Parameters explained:
# - Use parameterized queries (%s) for safety
# - Must include all required fields (name, creation, modified, etc.)
# - Warning: Bypasses all hooks and validations
```

**Use Case 2: Insert with named parameters**
```python
# Insert with named parameters
frappe.db.sql("""
    INSERT INTO `tabTask` 
    (name, subject, status, owner, creation, modified, modified_by)
    VALUES (%(name)s, %(subject)s, %(status)s, %(owner)s, %(creation)s, %(modified)s, %(modified_by)s)
""", {
    "name": "TASK-999",
    "subject": "New Task",
    "status": "Open",
    "owner": "admin@example.com",
    "creation": "2024-01-15 10:00:00",
    "modified": "2024-01-15 10:00:00",
    "modified_by": "admin@example.com"
})
# More readable with named parameters

# Parameters explained:
# - %(name)s: Named parameter syntax
# - Pass dict of values
```

**Use Case 3: Insert multiple rows**
```python
# Insert multiple rows efficiently
values = [
    ("TASK-001", "Task 1", "Open", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
    ("TASK-002", "Task 2", "Open", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
    ("TASK-003", "Task 3", "Closed", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
]

frappe.db.sql("""
    INSERT INTO `tabTask` 
    (name, subject, status, owner, creation, modified, modified_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
""", values, as_list=True)
# Inserts all rows (but not as efficient as bulk_insert)

# Parameters explained:
# - Pass list of tuples
# - Each tuple is one row
```

**Use Case 4: Insert with auto-commit**
```python
# Insert and commit immediately
frappe.db.sql("""
    INSERT INTO `tabTask` (name, subject, status, owner, creation, modified, modified_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
""", ("TASK-999", "New Task", "Open", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
    auto_commit=True
)
# Commits immediately after insert

# Parameters explained:
# - auto_commit=True: Commit after query
# - Useful in migrations
```

---

### 6. `frappe.db.bulk_insert()`

**Purpose**: Efficiently insert many rows (covered in Bulk Operations section).

**Quick Example**:
```python
# Insert thousands of rows efficiently
fields = ["name", "subject", "status", "owner", "creation", "modified", "modified_by"]
values = [
    ("TASK-001", "Task 1", "Open", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
    ("TASK-002", "Task 2", "Open", "admin@example.com", "2024-01-15 10:00:00", "2024-01-15 10:00:00", "admin@example.com"),
    # ... thousands more
]

frappe.db.bulk_insert("Task", fields, values, chunk_size=10_000)
# Processes in batches of 10,000

# See [Bulk Operations](#bulk-operations) section for details
```

---

## Comparison: When to Use Which Method

| Method | Use When | Hooks/Validations | Performance |
|--------|----------|-------------------|-------------|
| `frappe.new_doc().insert()` | **Recommended for most cases** | ✅ Full hooks & validations | Good |
| `frappe.get_doc(dict).insert()` | Creating from API data | ✅ Full hooks & validations | Good |
| Query Builder Insert | Need programmatic query building | ❌ No hooks | Excellent |
| Raw SQL Insert | Migrations, system operations | ❌ No hooks | Excellent |
| `bulk_insert()` | Inserting thousands of rows | ❌ No hooks | Best |

---

## Create Operations Best Practices

1. **Use Document ORM** (`frappe.new_doc().insert()`) for business logic
   - Triggers hooks (`before_insert`, `validate`, `after_insert`)
   - Validates links, mandatory fields, permissions
   - Sets defaults automatically
   - Handles child tables correctly

2. **Use Query Builder/Raw SQL** only when:
   - Performance is critical (bulk operations)
   - Migrating data
   - System operations that don't need hooks
   - You understand the implications

3. **Always set required fields**:
   - `name`: Auto-generated if not set
   - `creation`, `modified`: Auto-set by ORM
   - `owner`, `modified_by`: Auto-set from session
   - DocType-specific required fields

4. **Handle child tables properly**:
   - Use `parent_doc` and `parentfield` parameters
   - Insert parent first, then children (or together)
   - Child rows need `parent`, `parenttype`, `parentfield` (auto-set by ORM)

5. **Transaction safety**:
   - All inserts in same request are in one transaction
   - Use `frappe.db.commit()` explicitly in background jobs
   - Use savepoints for nested operations

---

## Common Create Operation Pitfalls

1. **Missing required fields**: Always check DocType meta for required fields
2. **Bypassing hooks**: Raw SQL/Query Builder don't trigger hooks - use Document ORM when needed
3. **Child table linking**: Must set `parent`, `parenttype`, `parentfield` correctly (auto-handled by ORM)
4. **Name conflicts**: Check if name exists before inserting (or use `ignore_if_duplicate=True`)
5. **Permission errors**: Use `ignore_permissions=True` only when necessary (system operations)
6. **Link validation**: Use `ignore_links=True` only when creating documents before linked docs exist
7. **Missing defaults**: Document ORM sets defaults automatically, raw SQL doesn't

---

## Read Operations

### 1. `frappe.db.get_value()`

**Purpose**: Fetch a single value or row from a DocType.

**Signature**:
```python
frappe.db.get_value(
    doctype,                    # DocType name (str)
    filters=None,               # Filter dict, string (name), or None for Singles
    fieldname="name",          # Field name(s) to fetch
    ignore=None,                # Don't raise if table/column missing
    as_dict=False,             # Return as dict instead of tuple
    debug=False,               # Print query to console
    order_by=DefaultOrderBy,   # Order by clause
    cache=False,               # Cache result in request
    for_update=False,          # SELECT FOR UPDATE lock
    pluck=False,              # Return first column only (for single field)
    distinct=False,           # DISTINCT modifier
    skip_locked=False,        # Skip locked rows (Postgres/MariaDB 10.6+)
    wait=True                 # Wait for lock or raise immediately
)
```

**Use Case 1: Get a single field value**
```python
# Get customer name by document name
customer_name = frappe.db.get_value("Customer", "CUST-001", "customer_name")
# Returns: "Acme Corporation"

# Parameters explained:
# - doctype="Customer": The DocType to query
# - filters="CUST-001": Document name (shortcut for {"name": "CUST-001"})
# - fieldname="customer_name": Single field to retrieve
```

**Use Case 2: Get multiple fields as tuple**
```python
# Get name and email from User
name, email = frappe.db.get_value("User", "admin@example.com", ["full_name", "email"])
# Returns: ("Administrator", "admin@example.com")

# Parameters explained:
# - fieldname=["full_name", "email"]: List of fields returns tuple
```

**Use Case 3: Get multiple fields as dictionary**
```python
# Get entire row as dict
user_data = frappe.db.get_value("User", "admin@example.com", "*", as_dict=True)
# Returns: {"name": "admin@example.com", "full_name": "Administrator", ...}

# Parameters explained:
# - fieldname="*": Fetch all fields
# - as_dict=True: Return as dictionary instead of tuple
```

**Use Case 4: Get with complex filters**
```python
# Get first open task assigned to user
task_name = frappe.db.get_value(
    "Task",
    {"status": "Open", "assigned_to": "user@example.com"},
    "name",
    order_by="creation desc"
)
# Returns: "TASK-00123"

# Parameters explained:
# - filters={"status": "Open", ...}: Dict filter (AND conditions)
# - order_by="creation desc": Order results before taking first
```

**Use Case 5: Get with operators**
```python
# Get customer created after date
customer = frappe.db.get_value(
    "Customer",
    {"creation": (">", "2024-01-01")},
    "name",
    as_dict=True
)

# Operators: ">", "<", ">=", "<=", "!=", "like", "not like", "in", "not in", 
# "between", "is", "is not", "ancestors of", "descendants of"
```

**Use Case 6: Lock row for update**
```python
# Lock row to prevent concurrent modifications
balance = frappe.db.get_value(
    "Account",
    "ACC-001",
    "balance",
    for_update=True
)
# Executes: SELECT balance FROM tabAccount WHERE name='ACC-001' FOR UPDATE

# Parameters explained:
# - for_update=True: Locks row until transaction commits/rolls back
```

**Use Case 7: Skip locked rows**
```python
# Get next available task, skip if locked
task = frappe.db.get_value(
    "Task",
    {"status": "Pending"},
    "name",
    for_update=True,
    skip_locked=True,
    order_by="creation asc"
)
# If row is locked by another transaction, returns None instead of waiting

# Parameters explained:
# - skip_locked=True: Don't wait for lock, skip row
# - wait=False: Alternative to skip_locked, raises error if can't acquire lock
```

**Use Case 8: Get from Single DocType**
```python
# Get system setting (Single DocType)
date_format = frappe.db.get_value("System Settings", None, "date_format")
# Returns: "yyyy-mm-dd"

# Parameters explained:
# - filters=None: For Singles, pass None or doctype name
```

**Use Case 9: Cache result**
```python
# Cache expensive lookup within request
company = frappe.db.get_value("Company", "Main Company", "name", cache=True)
# Subsequent calls with same params return cached value

# Parameters explained:
# - cache=True: Store in request-level cache (only works with string filters)
```

**Use Case 10: Pluck single column**
```python
# Get list of names directly
names = frappe.db.get_value(
    "Customer",
    {"status": "Active"},
    "name",
    pluck=True
)
# Returns: ["CUST-001", "CUST-002", ...] (if multiple matches, returns first)

# Note: For multiple rows, use get_values with pluck=True
```

---

### 2. `frappe.db.get_values()`

**Purpose**: Fetch multiple rows from a DocType.

**Signature**:
```python
frappe.db.get_values(
    doctype,                   # DocType name
    filters=None,              # Filter dict, list, or string
    fieldname="name",         # Field(s) to fetch
    ignore=None,              # Don't raise on missing table/column
    as_dict=False,            # Return as list of dicts
    debug=False,              # Print query
    order_by=DefaultOrderBy,  # Order by clause
    update=None,              # Dict to merge into each result
    cache=False,              # Cache results
    for_update=False,         # SELECT FOR UPDATE
    pluck=False,             # Return first column only
    distinct=False,          # DISTINCT modifier
    limit=None,              # Limit number of rows
    skip_locked=False,       # Skip locked rows
    wait=True                # Wait for lock
)
```

**Use Case 1: Get multiple rows as list of tuples**
```python
# Get all active customers
customers = frappe.db.get_values("Customer", {"status": "Active"}, ["name", "customer_name"])
# Returns: [("CUST-001", "Acme Corp"), ("CUST-002", "Beta Inc"), ...]

# Parameters explained:
# - fieldname=["name", "customer_name"]: List of fields returns list of tuples
```

**Use Case 2: Get multiple rows as list of dicts**
```python
# Get all tasks as dictionaries
tasks = frappe.db.get_values(
    "Task",
    {"status": "Open"},
    "*",
    as_dict=True,
    order_by="creation desc",
    limit=10
)
# Returns: [{"name": "TASK-001", "subject": "...", ...}, ...]

# Parameters explained:
# - fieldname="*": All fields
# - as_dict=True: Each row is a dict
# - limit=10: Only fetch 10 rows
```

**Use Case 3: Get with list of names**
```python
# Get multiple specific documents
users = frappe.db.get_values(
    "User",
    ["admin@example.com", "user@example.com", "guest@example.com"],
    ["name", "full_name", "enabled"]
)
# Returns: [("admin@example.com", "Admin", 1), ...]

# Parameters explained:
# - filters=[...]: List of names is shortcut for {"name": ("in", [...])}
```

**Use Case 4: Get with complex list filters**
```python
# Multiple filter conditions
tasks = frappe.db.get_values(
    "Task",
    [
        ["status", "=", "Open"],
        ["priority", "in", ["High", "Medium"]],
        ["due_date", ">", "2024-01-01"]
    ],
    "name",
    as_dict=True
)
# Returns: [{"name": "TASK-001"}, ...]

# Parameters explained:
# - filters=[...]: List of [field, operator, value] creates AND conditions
```

**Use Case 5: Pluck single column from multiple rows**
```python
# Get just names
customer_names = frappe.db.get_values(
    "Customer",
    {"status": "Active"},
    "name",
    pluck=True
)
# Returns: ["CUST-001", "CUST-002", "CUST-003", ...]

# Parameters explained:
# - pluck=True: Extract first column, returns flat list
```

**Use Case 6: Add extra data to results**
```python
# Merge additional data into each row
tasks = frappe.db.get_values(
    "Task",
    {"status": "Open"},
    ["name", "subject"],
    as_dict=True,
    update={"source": "API", "processed": True}
)
# Each result includes: {"name": "...", "subject": "...", "source": "API", "processed": True}

# Parameters explained:
# - update={...}: Dict merged into each result row
```

**Use Case 7: Get distinct values**
```python
# Get unique statuses
statuses = frappe.db.get_values(
    "Task",
    None,
    "status",
    distinct=True,
    pluck=True
)
# Returns: ["Open", "Closed", "Cancelled"]

# Parameters explained:
# - distinct=True: Only return unique values
# - filters=None: No filter, get all rows
```

---

### 3. `frappe.get_all()`

**Purpose**: High-level query API that bypasses permissions (use with caution).

**Signature**:
```python
frappe.get_all(
    doctype,                    # DocType name
    fields=None,                # Fields to select (default: ["name"])
    filters=None,               # Filter dict or list
    order_by=None,             # Order by clause
    limit_start=0,            # Pagination offset
    limit_page_length=0,       # Number of rows (0 = all)
    group_by=None,             # Group by field
    as_list=False,             # Return as list of lists
    or_filters=None,           # OR conditions
    debug=False,               # Print query
    pluck=None                 # Field to pluck
)
```

**Use Case 1: Basic query**
```python
# Get all customers
customers = frappe.get_all("Customer", fields=["name", "customer_name"])
# Returns: [{"name": "CUST-001", "customer_name": "Acme"}, ...]

# Parameters explained:
# - fields=["name", "customer_name"]: Fields to select
# - limit_page_length=0: Default, returns all rows
```

**Use Case 2: With pagination**
```python
# Get page 2 (rows 21-40)
customers = frappe.get_all(
    "Customer",
    fields=["name", "customer_name"],
    limit_start=20,
    limit_page_length=20,
    order_by="creation desc"
)
# Returns: 20 customers starting from row 21

# Parameters explained:
# - limit_start=20: Skip first 20 rows
# - limit_page_length=20: Fetch 20 rows
```

**Use Case 3: With OR filters**
```python
# Get customers matching any condition
customers = frappe.get_all(
    "Customer",
    fields=["name"],
    filters={"status": "Active"},
    or_filters=[
        {"customer_name": ("like", "%Corp%")},
        {"territory": "North"}
    ]
)
# Returns customers that are Active AND (name contains "Corp" OR territory is North)

# Parameters explained:
# - filters={...}: AND conditions
# - or_filters=[...]: OR conditions (combined with AND of filters)
```

**Use Case 4: Pluck single field**
```python
# Get just names
names = frappe.get_all("Customer", pluck="name")
# Returns: ["CUST-001", "CUST-002", ...]

# Parameters explained:
# - pluck="name": Extract single field, returns flat list instead of list of dicts ===> ["CUST-001", "CUST-002", ...]
# - fields=["name"]: it will return list of dicts with single key "name" ===> [{"name": "CUST-001"}, {"name": "CUST-002"}, ...]
```

**Use Case 5: Group by**
```python
# Count customers by status
from frappe.query_builder.functions import Count

Customer = frappe.qb.DocType("Customer")
results = frappe.get_all(
    "Customer",
    fields=["status", Count(Customer.name).as_("count")],
    group_by="status"
)
# Returns: [{"status": "Active", "count": 50}, {"status": "Inactive", "count": 10}]

# Note: For aggregations, Query Builder is often better
```

---

### 4. `frappe.get_list()`

**Purpose**: Same as `get_all()` but respects permissions.

**Signature**: Same as `frappe.get_all()`

**Use Case 1: Permission-aware query**
```python
# Get tasks user has permission to read
tasks = frappe.get_list(
    "Task",
    fields=["name", "subject", "status"],
    filters={"assigned_to": frappe.session.user},
    limit_page_length=20
)
# Only returns tasks user can read (respects role permissions)

# Parameters explained:
# - Automatically checks frappe.has_permission() before returning results
```

---

### 5. `frappe.db.exists()`

**Purpose**: Check if a document exists.

**Signature**:
```python
frappe.db.exists(
    dt,           # DocType name or dict with "doctype" key
    dn=None,      # Document name or filter dict
    cache=False   # Cache result
)
```

**Use Case 1: Check by name**
```python
# Check if customer exists
if frappe.db.exists("Customer", "CUST-001"):
    print("Customer exists")

# Parameters explained:
# - dt="Customer": DocType
# - dn="CUST-001": Document name
# - Returns: "CUST-001" if exists, None otherwise
```

**Use Case 2: Check with filters**
```python
# Check if user with email exists
if frappe.db.exists("User", {"email": "admin@example.com"}):
    print("User exists")

# Parameters explained:
# - dn={"email": "..."}: Filter dict, returns name if match found
```

**Use Case 3: Check with dict (doctype in filters)**
```python
# Alternative syntax
if frappe.db.exists({"doctype": "User", "email": "admin@example.com"}):
    print("User exists")
```

**Use Case 4: Cache existence check**
```python
# Cache within request
if frappe.db.exists("Customer", "CUST-001", cache=True):
    # Subsequent calls return cached result
    pass
```

---

### 6. `frappe.db.count()`

**Purpose**: Count rows matching filters.

**Signature**:
```python
frappe.db.count(
    dt,              # DocType name
    filters=None,    # Filter dict
    debug=False,     # Print query
    cache=False,     # Cache result
    distinct=True    # Count distinct rows
)
```

**Use Case 1: Count all rows**
```python
# Count all customers
total = frappe.db.count("Customer")
# Returns: 150

# Parameters explained:
# - filters=None: Count all rows
```

**Use Case 2: Count with filters**
```python
# Count active customers
active_count = frappe.db.count("Customer", {"status": "Active"})
# Returns: 120

# Parameters explained:
# - filters={"status": "Active"}: Only count matching rows
```

**Use Case 3: Cache count**
```python
# Cache expensive count
total = frappe.db.count("Customer", cache=True)
# Cached for 24 hours in Redis

# Parameters explained:
# - cache=True: Store in Redis cache (only if filters=None)
```

---

### 7. `frappe.db.get_single_value()`

**Purpose**: Get a field value from a Single DocType.

**Signature**:
```python
frappe.db.get_single_value(
    doctype,      # Single DocType name
    fieldname,    # Field name
    cache=True    # Cache result (default: True)
)
```

**Use Case 1: Get system setting**
```python
# Get date format
date_format = frappe.db.get_single_value("System Settings", "date_format")
# Returns: "yyyy-mm-dd"

# Parameters explained:
# - doctype="System Settings": Single DocType
# - fieldname="date_format": Field to fetch
# - cache=True: Cached by default (frequently accessed)
```

**Use Case 2: Get without cache**
```python
# Get fresh value (bypass cache)
setting = frappe.db.get_single_value("System Settings", "some_setting", cache=False)
```

---

### 8. `frappe.db.get_singles_dict()`

**Purpose**: Get entire Single DocType as dictionary.

**Signature**:
```python
frappe.db.get_singles_dict(
    doctype,        # Single DocType name
    debug=False,    # Print query
    for_update=False, # SELECT FOR UPDATE
    cast=False      # Cast values to Python types
)
```

**Use Case 1: Get all settings**
```python
# Get all system settings
settings = frappe.db.get_singles_dict("System Settings")
# Returns: {"name": "System Settings", "date_format": "yyyy-mm-dd", ...}

# Parameters explained:
# - Returns all fields as dict
```

**Use Case 2: Get with type casting**
```python
# Get with proper Python types
settings = frappe.db.get_singles_dict("System Settings", cast=True)
# Returns: {"enable_password_policy": True, "session_expiry": 3600, ...}
# (instead of strings "1", "3600")

# Parameters explained:
# - cast=True: Converts field types (Int -> int, Check -> bool, etc.)
```

---

## Write Operations

### 1. `frappe.db.set_value()`

**Purpose**: Update field(s) without triggering Document hooks.

**Signature**:
```python
frappe.db.set_value(
    dt,                    # DocType name
    dn,                    # Document name or filter dict
    field,                 # Field name or dict of fields
    val=None,              # Value (if field is string)
    modified=None,         # Custom modified timestamp
    modified_by=None,      # Custom modified_by user
    update_modified=True,  # Update modified timestamp
    debug=False           # Print query
)
```

**Use Case 1: Update single field**
```python
# Update task status
frappe.db.set_value("Task", "TASK-001", "status", "Completed")
# Executes: UPDATE tabTask SET status='Completed', modified=..., modified_by=... WHERE name='TASK-001'

# Parameters explained:
# - dt="Task": DocType
# - dn="TASK-001": Document name
# - field="status": Field to update
# - val="Completed": New value
# - update_modified=True: Automatically updates modified/modified_by
```

**Use Case 2: Update multiple fields**
```python
# Update multiple fields at once
frappe.db.set_value(
    "Task",
    "TASK-001",
    {
        "status": "Completed",
        "completed_on": "2024-01-15",
        "priority": "Low"
    }
)
# Updates all fields in single query

# Parameters explained:
# - field={...}: Dict of field: value pairs
```

**Use Case 3: Update without modifying timestamp**
```python
# Update without touching modified fields
frappe.db.set_value(
    "Task",
    "TASK-001",
    "internal_note",
    "Updated by system",
    update_modified=False
)
# modified and modified_by remain unchanged

# Parameters explained:
# - update_modified=False: Don't update modified/modified_by
```

**Use Case 4: Update with custom timestamp**
```python
# Set specific modified timestamp
frappe.db.set_value(
    "Task",
    "TASK-001",
    "status",
    "Completed",
    modified="2024-01-15 10:00:00",
    modified_by="system@example.com"
)
# Uses provided values instead of current time/user

# Parameters explained:
# - modified="...": Custom timestamp
# - modified_by="...": Custom user
```

**Use Case 5: Update multiple documents**
```python
# Update all matching documents
frappe.db.set_value(
    "Task",
    {"status": "Open", "priority": "High"},
    "status",
    "In Progress"
)
# Updates all Open, High priority tasks

# Parameters explained:
# - dn={"status": "Open", ...}: Filter dict updates all matches
```

**Warning**: `set_value()` bypasses Document hooks (`validate`, `on_update`, etc.). Use `doc.save()` for full validation.

---

### 2. `frappe.db.set_single_value()`

**Purpose**: Update Single DocType field(s).

**Signature**:
```python
frappe.db.set_single_value(
    doctype,              # Single DocType name
    fieldname,            # Field name or dict
    value=None,          # Value (if fieldname is string)
    modified=None,       # Custom modified timestamp
    modified_by=None,    # Custom modified_by user
    update_modified=True, # Update modified timestamp
    debug=False          # Print query
)
```

**Use Case 1: Update single field**
```python
# Update system setting
frappe.db.set_single_value("System Settings", "enable_password_policy", 1)
# Deletes old value from tabSingles, inserts new one

# Parameters explained:
# - doctype="System Settings": Single DocType
# - fieldname="enable_password_policy": Field to update
# - value=1: New value
```

**Use Case 2: Update multiple fields**
```python
# Update multiple settings
frappe.db.set_single_value(
    "System Settings",
    {
        "enable_password_policy": 1,
        "password_reset_limit": 3,
        "session_expiry": 3600
    }
)
# Updates all fields in single transaction

# Parameters explained:
# - fieldname={...}: Dict of field: value pairs
```

---

### 3. `frappe.db.delete()`

**Purpose**: Delete rows matching filters.

**Signature**:
```python
frappe.db.delete(
    doctype,        # DocType name
    filters=None,   # Filter dict, list, or string (name)
    debug=False     # Print query
)
```

**Use Case 1: Delete by name**
```python
# Delete specific document
frappe.db.delete("Task", "TASK-001")
# Executes: DELETE FROM tabTask WHERE name='TASK-001'

# Parameters explained:
# - filters="TASK-001": Shortcut for {"name": "TASK-001"}
```

**Use Case 2: Delete with filters**
```python
# Delete all matching documents
frappe.db.delete("Task", {"status": "Cancelled", "creation": ("<", "2024-01-01")})
# Deletes all cancelled tasks created before 2024

# Parameters explained:
# - filters={...}: Filter dict deletes all matches
```

**Use Case 3: Delete with list filters**
```python
# Delete multiple specific documents
frappe.db.delete("Task", [["name", "in", ["TASK-001", "TASK-002", "TASK-003"]]])
# Deletes specific tasks

# Parameters explained:
# - filters=[...]: List of filter conditions
```

**Warning**: `delete()` does NOT trigger Document hooks. Use `doc.delete()` for full validation.

---

### 4. `frappe.db.truncate()`

**Purpose**: Truncate table (remove all rows, cannot be rolled back).

**Signature**:
```python
frappe.db.truncate(doctype)  # DocType name
```

**Use Case 1: Clear all data**
```python
# Truncate table (irreversible)
frappe.db.truncate("Custom Log")
# Executes: TRUNCATE TABLE `tabCustom Log`

# Warning: Cannot be rolled back, use with extreme caution
```

---

## Transaction Management

### 1. `frappe.db.commit()`

**Purpose**: Commit current transaction.

**Use Case 1: Explicit commit**
```python
# Perform multiple operations, then commit
frappe.db.set_value("Task", "TASK-001", "status", "Completed")
frappe.db.set_value("Task", "TASK-002", "status", "Completed")
frappe.db.commit()  # Save all changes

# Note: Frappe auto-commits on request end, but explicit commits useful in:
# - Background jobs
# - Long-running scripts
# - When you need to ensure data is saved before next operation
```

---

### 2. `frappe.db.rollback()`

**Purpose**: Rollback current transaction or to a savepoint.

**Signature**:
```python
frappe.db.rollback(save_point=None)  # Savepoint name or None
```

**Use Case 1: Rollback all changes**
```python
try:
    frappe.db.set_value("Task", "TASK-001", "status", "Completed")
    # ... more operations
    frappe.db.commit()
except Exception:
    frappe.db.rollback()  # Undo all changes
    raise

# Parameters explained:
# - save_point=None: Rolls back entire transaction
```

**Use Case 2: Rollback to savepoint**
```python
frappe.db.savepoint("before_update")
try:
    frappe.db.set_value("Task", "TASK-001", "status", "Completed")
    frappe.db.commit()
except Exception:
    frappe.db.rollback(save_point="before_update")  # Rollback to savepoint
    raise

# Parameters explained:
# - save_point="before_update": Rollback to named savepoint
```

---

### 3. `frappe.db.savepoint()`

**Purpose**: Create a named savepoint (nested transaction).

**Signature**:
```python
frappe.db.savepoint(save_point)  # Savepoint name
```

**Use Case 1: Nested transactions**
```python
# Create savepoint
frappe.db.savepoint("checkpoint1")

try:
    frappe.db.set_value("Task", "TASK-001", "status", "Completed")
    frappe.db.savepoint("checkpoint2")
    
    try:
        frappe.db.set_value("Task", "TASK-002", "status", "Completed")
    except Exception:
        frappe.db.rollback(save_point="checkpoint2")  # Rollback to checkpoint2
        raise
    
    frappe.db.commit()
except Exception:
    frappe.db.rollback(save_point="checkpoint1")  # Rollback to checkpoint1
    raise

# Parameters explained:
# - save_point="checkpoint1": Unique name for savepoint
```

---

### 4. `frappe.db.release_savepoint()`

**Purpose**: Release a savepoint (no longer needed).

**Signature**:
```python
frappe.db.release_savepoint(save_point)  # Savepoint name
```

**Use Case 1: Clean up savepoint**
```python
frappe.db.savepoint("temp_checkpoint")
try:
    # ... operations
    frappe.db.commit()
    frappe.db.release_savepoint("temp_checkpoint")  # Clean up
except Exception:
    frappe.db.rollback(save_point="temp_checkpoint")
    frappe.db.release_savepoint("temp_checkpoint")
    raise
```

---

### 5. `frappe.db.begin()`

**Purpose**: Start a new transaction (explicit).

**Signature**:
```python
frappe.db.begin(read_only=False)  # Start read-only transaction
```

**Use Case 1: Explicit transaction start**
```python
# Start new transaction
frappe.db.begin()

try:
    frappe.db.set_value("Task", "TASK-001", "status", "Completed")
    frappe.db.commit()
except Exception:
    frappe.db.rollback()
```

**Use Case 2: Read-only transaction**
```python
# Start read-only transaction (Postgres)
frappe.db.begin(read_only=True)
# Useful for reporting queries that shouldn't modify data
```

---

## Query Builder

### 1. Basic Query Construction

**Purpose**: Type-safe, parameterized query building.

**Use Case 1: Simple select**
```python
from frappe.query_builder import Order

Customer = frappe.qb.DocType("Customer")

query = (
    frappe.qb.from_(Customer)
    .select(Customer.name, Customer.customer_name)
    .where(Customer.status == "Active")
    .orderby(Customer.creation, order=Order.desc)
    .limit(10)
)

results = query.run(as_dict=True)
# Returns: [{"name": "CUST-001", "customer_name": "Acme"}, ...]

# Parameters explained:
# - frappe.qb.DocType("Customer"): Creates table reference
# - .select(...): Fields to fetch
# - .where(...): Filter conditions
# - .orderby(...): Sort order
# - .limit(10): Maximum rows
# - .run(as_dict=True): Execute and return as dicts
```

**Use Case 2: Complex filters**
```python
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.from_(Task)
    .select(Task.name, Task.subject, Task.status)
    .where(
        (Task.status == "Open") &
        (Task.priority.isin(["High", "Medium"])) &
        (Task.due_date >= "2024-01-01")
    )
    .orderby(Task.due_date, order=Order.asc)
)

results = query.run(as_dict=True)

# Parameters explained:
# - & operator: AND condition
# - | operator: OR condition
# - .isin([...]): IN operator
# - >=, <=, !=: Comparison operators
```

**Use Case 3: Joins**
```python
Task = frappe.qb.DocType("Task")
User = frappe.qb.DocType("User")

query = (
    frappe.qb.from_(Task)
    .left_join(User).on(Task.assigned_to == User.name)
    .select(
        Task.name,
        Task.subject,
        User.full_name.as_("assigned_to_name")
    )
    .where(Task.status == "Open")
)

results = query.run(as_dict=True)
# Returns: [{"name": "TASK-001", "subject": "...", "assigned_to_name": "John Doe"}, ...]

# Parameters explained:
# - .left_join(User): Left join with User table
# - .on(...): Join condition
# - .as_("alias"): Field alias
```

**Use Case 4: Aggregations**
```python
from frappe.query_builder.functions import Count, Sum, Avg

Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.from_(Task)
    .select(
        Task.status,
        Count(Task.name).as_("total"),
        Avg(Task.priority).as_("avg_priority")
    )
    .groupby(Task.status)
    .where(Task.creation >= "2024-01-01")
)

results = query.run(as_dict=True)
# Returns: [{"status": "Open", "total": 50, "avg_priority": 2.5}, ...]

# Parameters explained:
# - Count(...): Count rows
# - Sum(...), Avg(...), Max(...), Min(...): Aggregation functions
# - .groupby(...): Group by field
```

**Use Case 5: Subqueries**
```python
Task = frappe.qb.DocType("Task")
subquery = (
    frappe.qb.from_(Task)
    .select(Task.assigned_to)
    .where(Task.status == "Open")
    .groupby(Task.assigned_to)
    .having(Count(Task.name) > 5)
)

User = frappe.qb.DocType("User")
query = (
    frappe.qb.from_(User)
    .select(User.name, User.full_name)
    .where(User.name.isin(subquery))
)

results = query.run(as_dict=True)
# Returns users with more than 5 open tasks

# Parameters explained:
# - subquery: Nested query
# - .isin(subquery): Use subquery in filter
```

**Use Case 6: Locking**
```python
Account = frappe.qb.DocType("Account")

query = (
    frappe.qb.from_(Account)
    .select(Account.name, Account.balance)
    .where(Account.name == "ACC-001")
    .for_update(skip_locked=True, nowait=False)
)

results = query.run(as_dict=True)
# Locks row for update

# Parameters explained:
# - .for_update(): Lock row
# - skip_locked=True: Skip if locked
# - nowait=False: Wait for lock (True = raise immediately)
```

**Use Case 7: Update query**
```python
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.update(Task)
    .set(Task.status, "Completed")
    .set(Task.completed_on, "2024-01-15")
    .where(Task.name == "TASK-001")
)

query.run()
# Executes: UPDATE tabTask SET status='Completed', completed_on='2024-01-15' WHERE name='TASK-001'

# Parameters explained:
# - frappe.qb.update(...): Update query
# - .set(field, value): Set field value
# - .where(...): Update condition
```

**Use Case 8: Insert query**
```python
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.into(Task)
    .columns("name", "subject", "status", "owner")
    .insert("TASK-999", "New Task", "Open", "admin@example.com")
)

query.run()
# Executes: INSERT INTO tabTask (name, subject, status, owner) VALUES (...)

# Parameters explained:
# - frappe.qb.into(...): Insert query
# - .columns(...): Field names
# - .insert(...): Values (must match columns order)
```

**Use Case 9: Delete query**
```python
Task = frappe.qb.DocType("Task")

query = (
    frappe.qb.from_(Task)
    .delete()
    .where(
        (Task.status == "Cancelled") &
        (Task.creation < "2024-01-01")
    )
)

query.run()
# Executes: DELETE FROM tabTask WHERE status='Cancelled' AND creation<'2024-01-01'

# Parameters explained:
# - .delete(): Delete query
# - .where(...): Delete condition
```

**Use Case 10: Union queries**
```python
Task = frappe.qb.DocType("Task")
Issue = frappe.qb.DocType("Issue")

query1 = (
    frappe.qb.from_(Task)
    .select(Task.name, Task.subject.as_("title"))
    .where(Task.status == "Open")
)

query2 = (
    frappe.qb.from_(Issue)
    .select(Issue.name, Issue.subject.as_("title"))
    .where(Issue.status == "Open")
)

union_query = query1.union(query2)
results = union_query.run(as_dict=True)
# Returns combined results from both queries

# Parameters explained:
# - .union(...): Combine results (removes duplicates)
# - .union_all(...): Combine results (keeps duplicates)
```

---

## Raw SQL Operations

### 1. `frappe.db.sql()`

**Purpose**: Execute raw SQL queries.

**Signature**:
```python
frappe.db.sql(
    query,              # SQL query string
    values=(),          # Parameters (tuple, list, or dict)
    as_dict=0,         # Return as dicts
    as_list=0,         # Return as lists
    debug=0,           # Print query
    ignore_ddl=0,      # Don't raise on missing table/column
    auto_commit=0,     # Commit after query
    update=None,       # Dict to merge into results
    explain=False,     # Print EXPLAIN
    run=True,         # Execute query (False = return SQL string)
    pluck=False,      # Return first column only
    as_iterator=False  # Return iterator (for large results)
)
```

**Use Case 1: Simple select**
```python
# Get customers
results = frappe.db.sql(
    "SELECT name, customer_name FROM `tabCustomer` WHERE status = %s",
    "Active",
    as_dict=True
)
# Returns: [{"name": "CUST-001", "customer_name": "Acme"}, ...]

# Parameters explained:
# - query: SQL string with %s placeholders
# - values="Active": Parameter value (escaped automatically)
# - as_dict=True: Return as list of dicts
```

**Use Case 2: Multiple parameters**
```python
# Query with multiple parameters
results = frappe.db.sql(
    "SELECT * FROM `tabTask` WHERE status = %s AND priority = %s",
    ("Open", "High"),
    as_dict=True
)
# Returns: [{"name": "TASK-001", ...}, ...]

# Parameters explained:
# - values=("Open", "High"): Tuple of parameters (order matters)
```

**Use Case 3: Named parameters**
```python
# Query with named parameters
results = frappe.db.sql(
    "SELECT * FROM `tabTask` WHERE status = %(status)s AND priority = %(priority)s",
    {"status": "Open", "priority": "High"},
    as_dict=True
)
# Returns: [{"name": "TASK-001", ...}, ...]

# Parameters explained:
# - values={"status": "Open", ...}: Dict of named parameters
```

**Use Case 4: Return as list**
```python
# Return as list of lists
results = frappe.db.sql(
    "SELECT name, customer_name FROM `tabCustomer`",
    as_list=True
)
# Returns: [["CUST-001", "Acme"], ["CUST-002", "Beta"], ...]

# Parameters explained:
# - as_list=True: Each row is a list
```

**Use Case 5: Pluck single column**
```python
# Get just names
names = frappe.db.sql(
    "SELECT name FROM `tabCustomer` WHERE status = %s",
    "Active",
    pluck=True
)
# Returns: ["CUST-001", "CUST-002", ...]

# Parameters explained:
# - pluck=True: Extract first column, returns flat list
```

**Use Case 6: Debug mode**
```python
# Print query for debugging
results = frappe.db.sql(
    "SELECT * FROM `tabCustomer` WHERE status = %s",
    "Active",
    debug=True,
    explain=True
)
# Prints query and EXPLAIN plan to console

# Parameters explained:
# - debug=True: Print query to console
# - explain=True: Print EXPLAIN plan
```

**Use Case 7: Iterator for large results**
```python
# Process large result set in chunks
for row in frappe.db.sql(
    "SELECT name FROM `tabCustomer`",
    as_dict=True,
    as_iterator=True
):
    process_customer(row["name"])
# Memory efficient: fetches 1000 rows at a time

# Parameters explained:
# - as_iterator=True: Return iterator (fetches in batches of 1000)
# - Use with unbuffered_cursor() for O(1) memory usage
```

**Use Case 8: Update query**
```python
# Update with raw SQL
frappe.db.sql(
    "UPDATE `tabTask` SET status = %s WHERE name = %s",
    ("Completed", "TASK-001")
)
# Executes update (no return value)

# Parameters explained:
# - UPDATE queries return empty tuple
```

**Use Case 9: Get SQL without executing**
```python
# Get SQL string without executing
sql_string = frappe.db.sql(
    "SELECT * FROM `tabCustomer` WHERE status = %s",
    "Active",
    run=False
)
# Returns: "SELECT * FROM `tabCustomer` WHERE status = 'Active'"

# Parameters explained:
# - run=False: Return SQL string instead of executing
```

**Use Case 10: Auto-commit**
```python
# Commit immediately after query
frappe.db.sql(
    "UPDATE `tabTask` SET status = %s",
    "Completed",
    auto_commit=True
)
# Commits transaction after query

# Parameters explained:
# - auto_commit=True: Commit after query (useful in migrations)
```

**Use Case 11: Ignore missing table/column**
```python
# Don't raise error if table/column missing
results = frappe.db.sql(
    "SELECT custom_field FROM `tabCustomer`",
    ignore_ddl=1
)
# Returns empty list if column doesn't exist

# Parameters explained:
# - ignore_ddl=1: Catch and ignore missing table/column errors
```

---

### 2. `frappe.db.sql_list()`

**Purpose**: Get first column as list (convenience method).

**Use Case 1: Simple list**
```python
# Get names as list
names = frappe.db.sql_list("SELECT name FROM `tabCustomer` WHERE status = %s", "Active")
# Returns: ["CUST-001", "CUST-002", ...]

# Equivalent to: frappe.db.sql(..., pluck=True)
```

---

### 3. `frappe.db.sql_ddl()`

**Purpose**: Execute DDL statements (CREATE, ALTER, DROP, etc.).

**Signature**:
```python
frappe.db.sql_ddl(query, debug=False)
```

**Use Case 1: Create index**
```python
# Create index
frappe.db.sql_ddl(
    "CREATE INDEX idx_status ON `tabTask` (status)",
    debug=True
)
# Executes DDL (auto-commits, cannot be rolled back)

# Parameters explained:
# - DDL statements cause implicit commit
# - Use in migrations, not in transactions
```

---

## Schema Operations

### 1. `frappe.db.has_table()`

**Purpose**: Check if table exists.

**Use Case 1: Check table**
```python
# Check if table exists
if frappe.db.has_table("Custom DocType"):
    print("Table exists")
```

---

### 2. `frappe.db.has_column()`

**Purpose**: Check if column exists.

**Use Case 1: Check column**
```python
# Check if column exists
if frappe.db.has_column("Customer", "custom_field"):
    print("Column exists")
```

---

### 3. `frappe.db.get_table_columns()`

**Purpose**: Get list of column names.

**Use Case 1: Get columns**
```python
# Get all columns
columns = frappe.db.get_table_columns("Customer")
# Returns: ["name", "creation", "modified", "customer_name", ...]
```

---

### 4. `frappe.db.get_tables()`

**Purpose**: Get list of all tables.

**Use Case 1: List tables**
```python
# Get all tables
tables = frappe.db.get_tables(cached=True)
# Returns: ["tabCustomer", "tabTask", ...]

# Parameters explained:
# - cached=True: Use cached list (faster)
```

---

## Single DocType Operations

### 1. `frappe.db.get_single_value()`

See [Read Operations](#7-frappedbget_single_value) section.

---

### 2. `frappe.db.get_singles_dict()`

See [Read Operations](#8-frappedbget_singles_dict) section.

---

### 3. `frappe.db.set_single_value()`

See [Write Operations](#2-frappedbset_single_value) section.

---

## Bulk Operations

### 1. `frappe.db.bulk_insert()`

**Purpose**: Insert multiple rows efficiently.

**Signature**:
```python
frappe.db.bulk_insert(
    doctype,              # DocType name
    fields,               # List of field names
    values,               # Iterable of value tuples
    ignore_duplicates=False, # Ignore duplicate key errors
    chunk_size=10_000    # Rows per batch
)
```

**Use Case 1: Insert many rows**
```python
# Insert 1000 customers
fields = ["name", "customer_name", "status"]
values = [
    ("CUST-001", "Acme Corp", "Active"),
    ("CUST-002", "Beta Inc", "Active"),
    # ... 998 more
]

frappe.db.bulk_insert("Customer", fields, values)
# Inserts all rows in batches of 10,000

# Parameters explained:
# - fields: List of column names
# - values: List of tuples (must match fields order)
# - chunk_size=10_000: Process in batches
```

**Use Case 2: Ignore duplicates**
```python
# Insert, skip duplicates
frappe.db.bulk_insert(
    "Customer",
    ["name", "customer_name"],
    [("CUST-001", "Acme"), ...],
    ignore_duplicates=True
)
# Uses INSERT IGNORE (MariaDB) or ON CONFLICT DO NOTHING (Postgres)

# Parameters explained:
# - ignore_duplicates=True: Skip rows that violate unique constraints
```

---

### 2. `frappe.db.bulk_update()`

**Purpose**: Update multiple documents efficiently.

**Signature**:
```python
frappe.db.bulk_update(
    doctype,              # DocType name
    doc_updates,         # Dict of {docname: {field: value}}
    chunk_size=100,     # Documents per batch
    modified=None,       # Custom modified timestamp
    modified_by=None,    # Custom modified_by user
    update_modified=True, # Update modified timestamp
    debug=False         # Print queries
)
```

**Use Case 1: Update multiple documents**
```python
# Update multiple tasks
updates = {
    "TASK-001": {"status": "Completed", "priority": "Low"},
    "TASK-002": {"status": "In Progress", "priority": "Medium"},
    "TASK-003": {"status": "Open", "priority": "High"},
}

frappe.db.bulk_update("Task", updates)
# Uses CASE WHEN for efficient bulk update

# Parameters explained:
# - doc_updates: Dict where key is docname, value is dict of fields to update
# - chunk_size=100: Process in batches (adjust based on field count)
```

**Use Case 2: Update with custom timestamp**
```python
# Bulk update with system timestamp
frappe.db.bulk_update(
    "Task",
    updates,
    modified="2024-01-15 10:00:00",
    modified_by="system@example.com"
)
# All documents get same modified/modified_by

# Parameters explained:
# - modified: Custom timestamp for all updates
# - modified_by: Custom user for all updates
```

---

## Utility Operations

### 1. `frappe.db.get_last_created()`

**Purpose**: Get creation timestamp of last created document.

**Use Case 1: Get last creation time**
```python
# Get when last customer was created
last_created = frappe.db.get_last_created("Customer")
# Returns: datetime object or None

# Parameters explained:
# - Returns datetime of most recent creation
```

---

### 2. `frappe.db.get_creation_count()`

**Purpose**: Count documents created in last X minutes.

**Use Case 1: Count recent creations**
```python
# Count customers created in last 60 minutes
count = frappe.db.get_creation_count("Customer", minutes=60)
# Returns: 25

# Parameters explained:
# - minutes=60: Time window to check
```

---

### 3. `frappe.db.get_default()`

**Purpose**: Get user/default value.

**Use Case 1: Get default**
```python
# Get user's default company
company = frappe.db.get_default("company", parent=frappe.session.user)
# Returns: "Main Company" or None

# Parameters explained:
# - key="company": Setting key
# - parent: User name or "__default" for global
```

---

### 4. `frappe.db.set_default()`

**Purpose**: Set user/default value.

**Use Case 1: Set default**
```python
# Set user's default company
frappe.db.set_default("company", "Main Company", parent=frappe.session.user)

# Parameters explained:
# - key="company": Setting key
# - val="Main Company": Value
# - parent: User name or "__default" for global
```

---

### 5. `frappe.db.get_global()`

**Purpose**: Get global setting.

**Use Case 1: Get global**
```python
# Get global setting
value = frappe.db.get_global("some_setting")
# Returns: value or None
```

---

### 6. `frappe.db.set_global()`

**Purpose**: Set global setting.

**Use Case 1: Set global**
```python
# Set global setting
frappe.db.set_global("some_setting", "value")
```

---

### 7. `frappe.db.get_system_setting()`

**Purpose**: Get system setting from System Settings.

**Use Case 1: Get system setting**
```python
# Get system setting
setting = frappe.db.get_system_setting("enable_password_policy")
# Returns: 1 or 0

# Equivalent to: frappe.db.get_single_value("System Settings", "enable_password_policy")
```

---

### 8. `frappe.db.get_descendants()`

**Purpose**: Get descendant nodes in tree structure.

**Use Case 1: Get tree descendants**
```python
# Get all descendants of a group
descendants = frappe.db.get_descendants("Account", "Assets")
# Returns: ["Asset-001", "Asset-002", ...]

# Parameters explained:
# - doctype: Tree DocType
# - name: Parent node name
```

---

### 9. `frappe.db.escape()`

**Purpose**: Escape string for SQL (use parameterized queries instead).

**Use Case 1: Escape string**
```python
# Escape string (prefer parameterized queries)
safe_name = frappe.db.escape("O'Brien")
# Returns: "O\\'Brien"

# Warning: Prefer parameterized queries (%s) over escape()
```

---

### 10. `frappe.db.unbuffered_cursor()`

**Purpose**: Context manager for unbuffered cursor (memory efficient).

**Use Case 1: Process large results**
```python
# Process huge result set with O(1) memory
with frappe.db.unbuffered_cursor():
    for row in frappe.db.sql(
        "SELECT * FROM `tabCustomer`",
        as_dict=True,
        as_iterator=True
    ):
        process_customer(row)
# Memory efficient: doesn't buffer results

# Parameters explained:
# - Must process entire result set within context
# - Use with as_iterator=True for best results
```

---

## Best Practices Summary

1. **Use Document ORM** for business logic (triggers hooks, validations)
2. **Use `frappe.db` helpers** for simple operations
3. **Use Query Builder** for complex queries, joins, aggregations
4. **Use Raw SQL** only when necessary (migrations, vendor-specific features)
5. **Always use parameterized queries** (never string concatenation)
6. **Use transactions** for multi-step operations
7. **Use bulk operations** for performance
8. **Cache expensive queries** when appropriate
9. **Use iterators** for large result sets
10. **Respect permissions** (use `get_list` instead of `get_all` when possible)

---

## Common Pitfalls

1. **`set_value()` bypasses hooks** - Use `doc.save()` for validation
2. **`delete()` bypasses hooks** - Use `doc.delete()` for cleanup
3. **DDL causes implicit commit** - Don't use in transactions
4. **`get_all()` ignores permissions** - Use `get_list()` for user-facing queries
5. **String concatenation in SQL** - Always use parameterized queries
6. **Large result sets** - Use iterators to avoid memory issues
7. **Missing commits** - Background jobs need explicit commits
8. **Transaction limits** - MAX_WRITES_PER_TRANSACTION (200,000) enforced