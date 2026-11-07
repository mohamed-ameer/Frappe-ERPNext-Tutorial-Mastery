# Frappe Permission Hooks: `permission_query_conditions` and `has_permission`

## Overview

Frappe provides two powerful hooks for implementing custom permission logic:
- **`permission_query_conditions`**: Filters data at the database query level (for lists and reports)
- **`has_permission`**: Checks permissions for individual documents (for document access)

Both hooks allow you to add custom permission logic beyond Frappe's standard role-based permissions.

---

## 1. `permission_query_conditions` Hook

### What It Does

`permission_query_conditions` adds **SQL WHERE clause conditions** to database queries automatically. It filters data **before** it's fetched from the database, ensuring users only see records they're allowed to access.

### When It's Called

This hook is automatically triggered when:
- Using `frappe.get_list()` or `frappe.get_all()` to fetch documents
- Loading data in List Views
- Generating reports that query the database
- Any database query operation that goes through Frappe's `DatabaseQuery` class

### How It Works

1. Frappe calls `get_permission_query_conditions()` method internally
2. It looks up registered hooks in `hooks.py` for the DocType
3. Executes your custom function
4. Your function returns a SQL WHERE condition string (without the `WHERE` keyword)
5. Frappe automatically adds it to the query with `AND`

### Example Implementation

**Step 1: Create the function in your DocType file**

```python
# my_app/my_app/doctype/my_doctype/my_doctype.py

def get_permission_query_conditions(user):
    """
    Returns SQL WHERE conditions to filter documents based on user permissions.
    
    Args:
        user: The username to check permissions for
    
    Returns:
        str: SQL condition (without WHERE keyword) or None/empty string if no restriction
    """
    if not user:
        user = frappe.session.user
    
    # Administrator sees everything
    if user == "Administrator":
        return None  # No filtering
    
    # Example: Users can only see their own documents
    return f"`tabMy DocType`.`owner` = {frappe.db.escape(user)}"
    
    # Example: Users can only see documents from their company
    # user_company = frappe.db.get_value("User", user, "company")
    # if user_company:
    #     return f"`tabMy DocType`.`company` = {frappe.db.escape(user_company)}"
    # return None
```

**Step 2: Register the hook in `hooks.py`**

```python
# my_app/my_app/hooks.py

permission_query_conditions = {
    "My DocType": "my_app.my_app.doctype.my_doctype.my_doctype.get_permission_query_conditions",
}
```

### Real-World Example: Dashboard Chart

From Frappe's implementation:

```python
def get_permission_query_conditions(user):
    if user == "Administrator":
        return None
    
    # Get user's allowed doctypes, reports, and modules
    allowed_doctypes = frappe.permissions.get_doctypes_with_read()
    allowed_reports = get_allowed_report_names()
    allowed_modules = get_modules_from_all_apps_for_user()
    
    # Build SQL conditions
    doctype_condition = f"`tabDashboard Chart`.`document_type` in ({allowed_doctypes})"
    report_condition = f"`tabDashboard Chart`.`report_name` in ({allowed_reports})"
    module_condition = f"`tabDashboard Chart`.`module` in ({allowed_modules})"
    
    # Return combined condition
    return f"""
        ((`tabDashboard Chart`.`chart_type` in ('Count', 'Sum', 'Average', 'Group By')
        and {doctype_condition})
        or
        (`tabDashboard Chart`.`chart_type` = 'Report'
        and {report_condition}))
        and
        ({module_condition})
    """
```

**What happens:**
- When a user opens the Dashboard Chart list, Frappe automatically adds these conditions
- The SQL query becomes: `SELECT * FROM tabDashboard Chart WHERE ... AND (your conditions)`
- Users only see charts they have permission to view

### Why We Need It

**Without `permission_query_conditions`:**
- Users might see all records in lists/reports
- You'd need to filter manually in every query
- Performance issues (fetching all data then filtering in Python)
- Security risk if you forget to add filters

**With `permission_query_conditions`:**
- Automatic filtering at database level
- Better performance (database does the filtering)
- Consistent security across all queries
- No need to remember to add filters manually

---

## 2. `has_permission` Hook

### What It Does

`has_permission` checks if a **specific user** has permission to perform an action (read, write, delete, etc.) on a **specific document**. It's called for individual document access, not bulk queries.

### When It's Called

This hook is automatically triggered when:
- Opening a document form (`frappe.get_doc()`)
- Checking permissions before saving/updating
- Checking permissions before deleting
- Any call to `frappe.has_permission(doc, ptype)`
- Document's `has_permission()` method is called

### How It Works

1. Frappe calls `has_controller_permissions()` internally
2. It looks up registered hooks in `hooks.py` for the DocType
3. Executes your custom function **in reverse order** (last registered first)
4. Your function receives the document and permission type
5. Returns `True` (allow), `False` (deny), or `None` (no opinion, let other checks decide)
6. **Important**: This hook can only **deny** permissions, not grant new ones

### Example Implementation

**Step 1: Create the function in your DocType file**

```python
# my_app/my_app/doctype/my_doctype/my_doctype.py

def has_permission(doc, ptype, user, debug=False):
    """
    Checks if user has permission for a specific document.
    
    Args:
        doc: The document object to check
        ptype: Permission type ('read', 'write', 'delete', 'submit', etc.)
        user: The username to check permissions for
        debug: Whether to log debug information
    
    Returns:
        bool: True if allowed, False if denied, None if no opinion
    """
    if not user:
        user = frappe.session.user
    
    # Administrator has all permissions
    if user == "Administrator":
        return True
    
    # Example: Users can only read their own documents
    if ptype == "read":
        if doc.owner == user:
            return True
        return False  # Deny access
    
    # Example: Users can only write documents from their company
    if ptype == "write":
        user_company = frappe.db.get_value("User", user, "company")
        if doc.company == user_company:
            return True
        return False  # Deny access
    
    # Return None if you don't want to override default behavior
    return None
```

**Step 2: Register the hook in `hooks.py`**

```python
# my_app/my_app/hooks.py

has_permission = {
    "My DocType": "my_app.my_app.doctype.my_doctype.my_doctype.has_permission",
}
```

### Real-World Example: Dashboard Chart

From Frappe's implementation:

```python
def has_permission(doc, ptype, user):
    # System Manager has all permissions
    if "System Manager" in frappe.get_roles(user):
        return True
    
    # Check if document has specific roles assigned
    if doc.roles:
        user_roles = frappe.get_roles(user)
        allowed_roles = [d.role for d in doc.roles]
        if has_common(user_roles, allowed_roles):
            return True
    
    # Check report-based permissions
    elif doc.chart_type == "Report":
        if doc.report_name in get_allowed_report_names():
            return True
    
    # Check doctype-based permissions
    else:
        allowed_doctypes = frappe.permissions.get_doctypes_with_read()
        if doc.document_type in allowed_doctypes:
            return True
    
    # Deny access if none of the conditions match
    return False
```

**What happens:**
- When a user tries to open a Dashboard Chart document, Frappe calls this function
- The function checks various conditions and returns `True` or `False`
- If `False`, the user gets a permission error
- If `True`, the user can access the document

### Why We Need It

**Without `has_permission`:**
- Users might access documents they shouldn't see
- You'd need to check permissions manually everywhere
- Inconsistent permission checks
- Security vulnerabilities

**With `has_permission`:**
- Automatic permission checking for every document access
- Centralized permission logic
- Consistent security
- Can implement complex business rules (e.g., "users can only edit documents from their department")

---

## Key Differences

| Aspect | `permission_query_conditions` | `has_permission` |
|--------|-------------------------------|------------------|
| **Level** | DocType level (all documents) | Document level (single document) |
| **When** | Before querying database | When accessing specific document |
| **Returns** | SQL WHERE condition string | Boolean (True/False/None) |
| **Purpose** | Filter lists/reports | Check document access |
| **Performance** | Database-level filtering (fast) | Application-level check |
| **Use Case** | "Show only my documents in list" | "Can I open this specific document?" |

---

## When to Use Each Hook

### Use `permission_query_conditions` when:
- You want to filter data in List Views
- You want to restrict what appears in reports
- You need database-level filtering for performance
- The rule applies to all queries (e.g., "users see only their company's data")

### Use `has_permission` when:
- You need to check access to a specific document
- The permission depends on document properties
- You need complex business logic (e.g., "can edit if status is Draft")
- You want to prevent access even if user has role permissions

### Use Both when:
- You want comprehensive security (filter lists AND check individual access)
- You need different rules for lists vs. individual documents

---

## Complete Example: Implementing Both Hooks

```python
# my_app/my_app/doctype/sales_order/sales_order.py

import frappe
from frappe import _

def get_permission_query_conditions(user):
    """
    Filter sales orders in lists: users see only their company's orders
    """
    if not user:
        user = frappe.session.user
    
    if user == "Administrator":
        return None
    
    # Get user's company
    user_company = frappe.db.get_value("User", user, "company")
    if user_company:
        return f"`tabSales Order`.`company` = {frappe.db.escape(user_company)}"
    
    return None

def has_permission(doc, ptype, user, debug=False):
    """
    Check individual document access: users can only submit their own orders
    """
    if not user:
        user = frappe.session.user
    
    if user == "Administrator":
        return True
    
    # For submit permission, check if user owns the document
    if ptype == "submit":
        if doc.owner == user:
            return True
        return False  # Deny submit for others
    
    # For other permissions, use default behavior
    return None
```

**Register in hooks.py:**

```python
permission_query_conditions = {
    "Sales Order": "my_app.my_app.doctype.sales_order.sales_order.get_permission_query_conditions",
}

has_permission = {
    "Sales Order": "my_app.my_app.doctype.sales_order.sales_order.has_permission",
}
```

**Result:**
- List View: Users only see Sales Orders from their company
- Document Access: Users can only submit Sales Orders they created

---

## Important Notes

### For `permission_query_conditions`:
1. **Always escape user input** using `frappe.db.escape()` to prevent SQL injection
2. **Return `None` or empty string** if no filtering needed (Administrator case)
3. **Return SQL condition without `WHERE`** keyword
4. **Use table name format**: `` `tabDocType`.`fieldname` ``
5. **Multiple conditions** are joined with `AND` automatically

### For `has_permission`:
1. **Can only deny, not grant** permissions that don't exist
2. **Return `None`** if you don't want to override default behavior
3. **Return `True`** to allow (if user already has role permission)
4. **Return `False`** to deny (even if user has role permission)
5. **Called in reverse order** (last registered hook runs first)

---

## Summary

**`permission_query_conditions`** is a Frappe hook that adds automatic filtering to database queries at the DocType level. It works by triggering a function named `get_permission_query_conditions` which is nothing but a function that returns a SQL WHERE clause condition string (without the `WHERE` keyword). This condition is automatically added to all database queries for that DocType using `AND`, ensuring users only see data they're permitted to access. It's called automatically when fetching lists, generating reports, or any operation that queries the database through Frappe's `DatabaseQuery` class. The function receives the `user` parameter and optionally the `doctype` parameter, and returns a string like `"`tabDocType`.`field` = 'value'"` or `None` if no filtering is needed.

**`has_permission`** is a Frappe hook that checks permissions for individual documents at the document level. It works by triggering a function named `has_permission` which is nothing but a function that takes a `doc` (document object), `ptype` (permission type like 'read', 'write', 'delete'), `user` (username), and optionally `debug` as input parameters, and returns `True` (allow), `False` (deny), or `None` (no opinion, let other permission checks decide). This hook is called automatically when accessing a specific document, checking permissions before opening, saving, deleting, or performing any action on that document. Unlike `permission_query_conditions`, this hook can only deny permissions that would otherwise be granted by role permissions - it cannot grant new permissions. The function is called in reverse order (last registered hook runs first), and if any hook returns `False`, access is denied even if the user has role-based permissions.

