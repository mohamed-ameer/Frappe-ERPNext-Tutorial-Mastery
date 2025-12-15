# Frappe/ERPNext Interview Questions & Answers

> **Note:** This document contains interview questions from various Frappe/ERPNext interviews I have attended. All answers are verified against the official Frappe framework source code.

---

## Complete Question Index

### Junior Developer Questions (1-13)
1. [What is the Frappe Framework, and how is it different from traditional web frameworks?](#1-what-is-the-frappe-framework-and-how-is-it-different-from-traditional-web-frameworks)
2. [What are DocTypes in Frappe? How do you create one?](#2-what-are-doctypes-in-frappe-how-do-you-create-one)
3. [What is the difference between a DocType and a Document in Frappe?](#3-what-is-the-difference-between-a-doctype-and-a-document-in-frappe)
4. [What is the difference between a DocType and a Custom Field in Frappe?](#4-what-is-the-difference-between-a-doctype-and-a-custom-field-in-frappe)
5. [What is a Frappe Hook, and why is it used?](#5-what-is-a-frappe-hook-and-why-is-it-used)
6. [How would you implement a custom API in Frappe?](#6-how-would-you-implement-a-custom-api-in-frappe)
7. [How does Role-Based Permission work in Frappe?](#7-how-does-role-based-permission-work-in-frappe)
8. [Explain the concept of workflow in Frappe.](#8-explain-the-concept-of-workflow-in-frappe)
9. [What is the purpose of the `bench` command in Frappe?](#9-what-is-the-purpose-of-the-bench-command-in-frappe)
10. [How does Frappe manage database migrations?](#10-how-does-frappe-manage-database-migrations)
11. [What is a patch in Frappe?](#11-what-is-a-patch-in-frappe)
12. [How would you handle data migration in Frappe from an external system to ERPNext?](#12-how-would-you-handle-data-migration-in-frappe-from-an-external-system-to-erpnext)
13. [What do you know about Fixtures?](#13-what-do-you-know-about-fixtures)
14. [What do you know about Property Setter?](#14-what-do-you-know-about-property-setter)

### Senior Developer Questions (15-26)
15. [What is the difference between Redis cache and local cache in Frappe?](#15-what-is-the-difference-between-redis-cache-and-local-cache-in-frappe)
16. [What is the difference between Frappe and ERPNext?](#16-what-is-the-difference-between-frappe-and-erpnext)
17. [What do you know about bench commands? What commands do you know about?](#17-what-do-you-know-about-bench-commands-what-commands-do-you-know-about)
18. [What is the architecture of Frappe and bench?](#18-what-is-the-architecture-of-frappe-and-bench)
19. [How does Frappe handle database transactions? Explain commit and rollback.](#19-how-does-frappe-handle-database-transactions-explain-commit-and-rollback)
20. [What is the Singles table in Frappe?](#20-what-is-the-singles-table-in-frappe)
21. [How do you implement background jobs in Frappe?](#21-how-do-you-implement-background-jobs-in-frappe)
22. [How does Frappe implement multi-tenancy?](#22-how-does-frappe-implement-multi-tenancy)
23. [How do you secure a Frappe application?](#23-how-do-you-secure-a-frappe-application)
24. [What are Web Forms in Frappe?](#24-what-are-web-forms-in-frappe)
25. [How do you optimize performance in Frappe applications?](#25-how-do-you-optimize-performance-in-frappe-applications)
26. [What is the difference between `frappe.get_doc()` and `frappe.get_all()`?](#26-what-is-the-difference-between-frappeget_doc-and-frappeget_all)
27. [What are Server Scripts in Frappe?](#27-what-are-server-scripts-in-frappe)

---

## Junior Frappe/ERPNext Developer

### 1. What is the Frappe Framework, and how is it different from traditional web frameworks?

**Answer:** Frappe is a full-stack, **meta-driven** web application framework built on Python (backend) and JavaScript (frontend). Unlike traditional frameworks like Django or Flask, Frappe is **metadata-first**, meaning you define your application structure through DocTypes (metadata definitions) rather than writing explicit models, views, and controllers.

**Key Differentiators:**
- **Automatic API Generation**: Every DocType automatically gets REST APIs (`/api/resource/{doctype}`) without writing any code
- **Built-in UI**: Forms, lists, and reports are auto-generated from DocType metadata
- **Integrated Features**: Role-based permissions, workflows, print formats, email notifications, and background jobs come out-of-the-box
- **Meta-driven Architecture**: Changes to DocTypes automatically update database schema, APIs, and UI
- **Multi-tenancy**: Native support for multiple sites (tenants) with isolated databases using a single codebase

Traditional frameworks require you to write models, serializers, views, and templates separately. Frappe generates all of this from a single DocType definition.

---

### 2. What are DocTypes in Frappe? How do you create one?

**Answer:** A **DocType** is the fundamental building block of Frappe - it's a metadata definition that describes:
- **Database schema** (fields and their types)
- **Business logic** (validation, permissions, workflows)
- **UI behavior** (forms, lists, filters)
- **Relationships** with other DocTypes

**Creating a DocType:**

1. **Via UI**: Navigate to DocType List → New DocType → Define fields, permissions, and settings
2. **Via Bench Command**: `bench new-doctype <doctype-name> --app <app-name>`
3. **Programmatically**: Create a JSON file in `{app}/doctype/{doctype_name}/{doctype_name}.json`

**Behind the Scenes** (Source: `frappe/core/doctype/doctype/doctype.py`):
- DocType metadata is stored in `tabDocType` table
- Field definitions are stored in `tabDocField` table
- When saved, `on_update()` method calls `frappe.db.updatedb()` to sync the database schema
- A Python controller class is auto-generated in `{doctype_name}.py`
- Database table `tab{DocType Name}` is created automatically

**Types of DocTypes:**
- **Document DocTypes**: Regular tables with multiple records (e.g., Customer, Sales Order)
- **Single DocTypes** (`issingle=1`): Only one record, stored in `tabSingles` (e.g., System Settings)
- **Child DocTypes** (`istable=1`): Nested tables (e.g., Sales Order Item)
- **Virtual DocTypes** (`is_virtual=1`): No database table, data loaded programmatically

---

### 3. What is the difference between a DocType and a Document in Frappe?

**Answer:**
- **DocType**: The **schema/blueprint** - defines the structure, fields, permissions, and behavior (like a class definition or database table schema)
- **Document**: An **instance** of a DocType - actual data/record (like an object instance or database row)

**Example:**
```python
# DocType = "Customer" (the schema)
# Document = A specific customer record
customer = frappe.get_doc("Customer", "CUST-00001")  # Document instance
```

**Technical Details:**
- DocType metadata is stored in `tabDocType` and `tabDocField`
- Documents are stored in `tab{DocType Name}` tables
- DocType is loaded once and cached via `frappe.get_meta()`; Documents are loaded per request

---

### 4. What is the difference between a DocType and a Custom Field in Frappe?

**Answer:**
- **DocType**: Represents an entire database table with complete structure, business logic, permissions, and UI configuration. Created when you need a new entity/module.

- **Custom Field**: Adds individual fields to **existing** DocTypes without modifying core code. Stored in `tabCustom Field` table and merged with DocType metadata at runtime via `frappe/model/meta.py`.

**When to use Custom Fields:**
- Extending standard DocTypes (e.g., adding "Tax ID" to Customer)
- Customizations that should survive framework updates
- Client-specific requirements

**Key Difference**: Custom Fields are **additive** and **non-destructive** - they don't modify the original DocType definition and are preserved during framework updates.

---

### 5. What is a Frappe Hook, and why is it used?

**Answer:** Hooks are **extension points** defined in `hooks.py` that allow you to inject custom logic into Frappe's execution flow without modifying core code. They follow the **Open/Closed Principle** - extending functionality without modification.

**Common Hook Types** (Source: `frappe/hooks.py`):

1. **Document Events** (`doc_events`):
```python
doc_events = {
    "Sales Order": {
        "before_save": "myapp.custom.validate_sales_order",
        "on_submit": "myapp.custom.create_delivery_note",
        "on_cancel": "myapp.custom.reverse_stock"
    }
}
```

2. **Scheduler Events** (`scheduler_events`):
```python
scheduler_events = {
    "daily": ["myapp.tasks.send_daily_report"],
    "hourly": ["myapp.tasks.sync_inventory"],
    "cron": {
        "0 2 * * *": ["myapp.tasks.midnight_backup"]  # 2 AM daily
    }
}
```

3. **Override Whitelisted Methods** (`override_whitelisted_methods`):
```python
override_whitelisted_methods = {
    "frappe.client.get": "myapp.api.custom_get"
}
```

4. **Permission Hooks** (`has_permission`):
```python
has_permission = {
    "Sales Order": "myapp.permissions.sales_order_permission"
}
```

**Why Use Hooks:**
- Maintain upgrade compatibility
- Separate custom code from core framework
- Enable modular app architecture
- Multiple apps can hook into the same events

---

### 6. How would you implement a custom API in Frappe?

**Answer:** Frappe provides the `@frappe.whitelist()` decorator to expose Python functions as HTTP endpoints.

**Implementation** (Source: `frappe/__init__.py`, lines 813-859):

```python
# myapp/api.py
import frappe

@frappe.whitelist()
def get_customer_orders(customer_name):
    """Get all orders for a customer"""
    return frappe.get_all("Sales Order",
        filters={"customer": customer_name},
        fields=["name", "transaction_date", "grand_total"]
    )
```

**Access the API:**
```
GET/POST /api/method/myapp.api.get_customer_orders?customer_name=CUST-00001
```

**Advanced Options:**

```python
@frappe.whitelist(allow_guest=True, methods=["GET"])
def public_api():
    """Publicly accessible, GET only"""
    return {"status": "ok"}

@frappe.whitelist(methods=["POST"])
def create_order(customer, items):
    """POST only, requires authentication"""
    doc = frappe.get_doc({
        "doctype": "Sales Order",
        "customer": customer,
        "items": frappe.parse_json(items)
    })
    doc.insert()
    return doc.name
```

**Security Features:**
- `@frappe.whitelist()` registers the function in the whitelist (security requirement)
- `allow_guest=True` allows unauthenticated access (default: False)
- `methods=["GET", "POST"]` restricts HTTP methods
- Frappe automatically handles CSRF protection, rate limiting, and input sanitization
- Rate limiting can be added with `@frappe.rate_limit(limit=10, seconds=60)`

---

### 7. How does Role-Based Permission work in Frappe?

**Answer:** Frappe implements a sophisticated **multi-layered permission system** (Source: `frappe/permissions.py`):

**1. Role Permissions (DocType Level)**:
- Configured in Role Permission Manager for each DocType
- Defines what roles can Read, Write, Create, Submit, Cancel, Delete, etc.
- Supports permission levels (0, 1, 2...) for field-level permissions
- Can set "If Owner" conditions (user can only access their own documents)

**2. User Permissions (Document Level)**:
- Restricts users to specific documents (e.g., Sales Manager can only see orders from their territory)
- Configured in User Permissions DocType
- Applied as filters on queries automatically

**3. Permission Evaluation Flow:**
```python
# Source: frappe/permissions.py
def has_permission(doctype, ptype="read", doc=None, user=None):
    # 1. Administrator always has permission
    if user == "Administrator":
        return True

    # 2. Check role permissions
    role_permissions = get_role_permissions(doctype, user)
    if not role_permissions.get(ptype):
        return False

    # 3. Check user permissions (document-level restrictions)
    if doc and not has_user_permission(doc, user):
        return False

    # 4. Check controller permissions (custom logic)
    if not has_controller_permissions(doc, ptype, user):
        return False

    return True
```

**4. Dynamic Permissions via Hooks:**
```python
# Custom permission in hooks.py
has_permission = {
    "Sales Order": "myapp.permissions.sales_order_permission"
}

# myapp/permissions.py
def sales_order_permission(doc, ptype, user):
    # Sales Manager can only see orders from their territory
    if "Sales Manager" in frappe.get_roles(user):
        user_territory = frappe.db.get_value("User", user, "territory")
        return doc.territory == user_territory
    return True
```

---

### 8. Explain the concept of workflow in Frappe.

**Answer:** Workflows in Frappe model **state machines** for documents, defining states, transitions, and approval processes (Source: `frappe/workflow/doctype/workflow/`).

**Core Components:**

1. **Workflow States**: Different stages a document can be in
   - Each state has a `doc_status` (0=Draft, 1=Submitted, 2=Cancelled)
   - Can update fields when entering a state (`update_field`, `update_value`)
   - Can restrict editing based on state (`allow_edit`)

2. **Workflow Transitions**: Rules for moving between states
   - Define which roles can trigger the transition (`allowed`)
   - Can have conditions (Python expressions evaluated at runtime)
   - Can allow/disallow self-approval (`allow_self_approval`)

3. **Workflow Actions**: Buttons shown to users
   - Auto-generated based on available transitions
   - Can send email notifications (`send_email_alert`)

**Example Workflow Configuration:**
```python
# Workflow: Leave Application
States:
- Draft (doc_status=0, allow_edit=Employee)
- Pending Approval (doc_status=0, allow_edit=None)
- Approved (doc_status=1, allow_edit=None, update_field=status, update_value=Approved)
- Rejected (doc_status=2, allow_edit=None)

Transitions:
- Draft → Pending Approval (Action: Submit, Allowed: Employee)
- Pending Approval → Approved (Action: Approve, Allowed: Leave Approver)
- Pending Approval → Rejected (Action: Reject, Allowed: Leave Approver)
```

**Programmatic Workflow Application** (Source: `frappe/model/workflow.py`):
```python
from frappe.model.workflow import apply_workflow

doc = frappe.get_doc("Leave Application", "LA-00001")
updated_doc = apply_workflow(doc, "Approve")
# Automatically saves/submits/cancels based on state's doc_status
```

**Behind the Scenes:**
- Workflow state stored in document's `workflow_state` field
- Workflow actions create `Workflow Action` documents for pending approvals
- Email alerts sent automatically if configured
- Workflow history tracked in comments
- Transition conditions support: `frappe.db.get_value`, `frappe.db.get_list`, `frappe.session`, `frappe.utils` functions

---

### 9. What is the purpose of the `bench` command in Frappe?

**Answer:** `bench` is Frappe's **command-line interface (CLI)** for managing the entire development and deployment lifecycle. It's a separate Python package that orchestrates Frappe sites, manages virtual environments, handles process management (via Supervisor), and configures web servers (nginx).

**Key Command Categories:**

**1. Site Management:**
```bash
bench new-site site1.local --db-name site1_db
bench drop-site site1.local
bench use site1.local  # Set default site
bench backup  # Backup database and files
bench restore backup_file.sql.gz
bench backup-all-sites
```

**2. App Management:**
```bash
bench get-app https://github.com/frappe/erpnext
bench install-app erpnext --site site1.local
bench uninstall-app erpnext --site site1.local
bench remove-app erpnext  # Remove from bench
```

**3. Development:**
```bash
bench start  # Start development server (web, socketio, redis, scheduler)
bench migrate  # Run database migrations
bench clear-cache
bench clear-website-cache
bench build  # Build frontend assets
bench new-app myapp  # Create new app
bench new-site site1.local --install-app myapp
```

**4. Production:**
```bash
bench setup production  # Configure nginx, supervisor
bench restart
bench update  # Update all apps and migrate
bench setup nginx  # Generate nginx config
bench setup supervisor  # Generate supervisor config
```

**5. Database:**
```bash
bench mariadb  # Open database console
bench postgres  # For PostgreSQL
bench execute "frappe.db.sql('SELECT * FROM tabUser')"
bench console  # Python console with Frappe context
```

**6. Utilities:**
```bash
bench set-config key value
bench doctor  # Check bench health
bench version  # Show versions of all apps
bench enable-scheduler
bench disable-scheduler
```

---

### 10. How does Frappe manage database migrations?

**Answer:** Frappe uses a **two-phase migration system** combining automatic schema sync and manual patches (Source: `frappe/migrate.py`, `frappe/model/sync.py`).

**1. Automatic Schema Sync (`bench migrate`)**:
```python
# Source: frappe/model/sync.py
def sync_all():
    # Syncs all DocType JSON files to database
    for app in frappe.get_installed_apps():
        sync_for(app)
        # Reads {doctype}.json files
        # Calls frappe.db.updatedb(doctype) for each
        # Automatically adds/modifies/removes columns
```

**2. Manual Patches (`patches.txt`)**:
```
# apps/myapp/patches.txt
[pre_model_sync]
myapp.patches.v1_0.rename_old_field

[post_model_sync]
myapp.patches.v1_0.migrate_customer_data
execute:frappe.reload_doc('core', 'doctype', 'user')
```

**Migration Flow:**
```
bench migrate
├── Run before_migrate hooks
├── Run pre_model_sync patches
├── Sync all DocTypes (automatic schema changes)
├── Run post_model_sync patches
└── Run after_migrate hooks
```

**Schema Sync Details** (Source: `frappe/database/schema.py`):
- Compares DocType JSON with actual database schema
- Adds new columns automatically
- Modifies column types if changed
- Adds/drops indexes and unique constraints
- Sets default values
- **Does NOT drop columns** (for safety - manual intervention required)

**Patch Example:**
```python
# myapp/patches/v1_0/migrate_customer_data.py
import frappe

def execute():
    """Migrate old customer format to new format"""
    customers = frappe.get_all("Customer", fields=["name", "old_field"])
    for customer in customers:
        frappe.db.set_value("Customer", customer.name,
            "new_field", transform(customer.old_field))
    frappe.db.commit()
```

**Safety Features:**
- Patches are logged in `tabPatch Log` to prevent re-execution
- Database transactions ensure atomicity
- `bench migrate --skip-failing` skips failing patches
- Automatic backups recommended before migration

---

### 11. What is a patch in Frappe?

**Answer:** A **patch** is a Python script that performs one-time data migrations, schema changes, or fixes that cannot be handled by automatic DocType syncing (Source: `frappe/modules/patch_handler.py`).

**When to Use Patches:**
- Data transformation (e.g., splitting full name into first/last name)
- Complex schema changes (e.g., migrating from one DocType to another)
- Fixing data inconsistencies
- Bulk updates that need to run once
- Executing SQL that can't be done via DocType changes

**Patch Structure:**
```python
# apps/myapp/patches/v2_0/update_tax_rates.py
import frappe

def execute():
    """
    Update tax rates from 5% to 8% for all items
    """
    frappe.db.sql("""
        UPDATE `tabItem Tax`
        SET tax_rate = 8
        WHERE tax_rate = 5
    """)
    frappe.db.commit()
```

**Registration in `patches.txt`:**
```
[pre_model_sync]
# Runs before DocType schema sync
myapp.patches.v2_0.rename_doctype

[post_model_sync]
# Runs after DocType schema sync
myapp.patches.v2_0.update_tax_rates
execute:frappe.reload_doc('stock', 'doctype', 'item')
execute:frappe.db.sql("UPDATE tabUser SET enabled=1")
```

**Execution Tracking:**
- Executed patches are logged in `tabPatch Log` with timestamp
- Patches are never re-executed (unless manually deleted from Patch Log)
- Failed patches can be marked as skipped
- Use `finally:` prefix to run patch at the very end

**Best Practices:**
- Always include docstring explaining what the patch does
- Use `frappe.db.commit()` for large operations
- Handle errors gracefully
- Test on staging before production
- Use `frappe.reload_doc()` after schema changes

---

### 12. How would you handle data migration in Frappe from an external system to ERPNext?

**Answer:** Data migration in Frappe follows a structured approach:

**1. Preparation Phase:**
- Map external system fields to ERPNext DocTypes
- Identify data dependencies (e.g., Customers before Sales Orders)
- Clean and validate source data
- Create data transformation rules
- Determine migration order (master data → transactions)

**2. Migration Methods:**

**A. Data Import Tool (UI-based)**:
- Best for: CSV files, non-technical users, < 10,000 records
- Navigate to DocType → Menu → Import
- Download template, fill data, upload
- Supports insert and update operations
- Validates data before import

**B. Frappe ORM Scripts** (Recommended):
```python
import frappe
import csv

def migrate_customers():
    with open('customers.csv', 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if not frappe.db.exists("Customer", row['customer_id']):
                doc = frappe.get_doc({
                    "doctype": "Customer",
                    "customer_name": row['name'],
                    "customer_type": row['type'],
                    "territory": row['region']
                })
                doc.insert(ignore_permissions=True)
                frappe.db.commit()
```

**C. Direct SQL (for bulk operations)**:
```python
def bulk_migrate():
    frappe.db.sql("""
        INSERT INTO `tabCustomer` (name, customer_name, customer_type)
        SELECT
            customer_id,
            name,
            type
        FROM external_db.customers
        WHERE NOT EXISTS (
            SELECT 1 FROM `tabCustomer` WHERE name = customer_id
        )
    """)
    frappe.db.commit()
```

**D. Background Jobs (for large datasets)**:
```python
def enqueue_migration():
    # Split into chunks
    total_records = get_total_count()
    chunk_size = 1000

    for offset in range(0, total_records, chunk_size):
        frappe.enqueue(
            "myapp.migration.migrate_chunk",
            queue="long",
            timeout=3600,
            offset=offset,
            limit=chunk_size
        )
```

**3. Error Handling:**
```python
def safe_migrate():
    failed_records = []
    success_count = 0

    for record in source_data:
        try:
            create_document(record)
            success_count += 1
        except Exception as e:
            failed_records.append({
                "record": record,
                "error": str(e)
            })
            frappe.log_error(
                title=f"Migration failed for {record.get('id')}",
                message=frappe.get_traceback()
            )

    # Export failed records for review
    save_failed_records_csv(failed_records)
    print(f"Success: {success_count}, Failed: {len(failed_records)}")
```

**4. Best Practices:**
- Use `frappe.enqueue()` for large datasets (background processing)
- Implement error logging and rollback mechanisms
- Validate data before insertion
- Test on staging environment first
- Use `ignore_permissions=True` for system migrations
- Maintain migration order (master data → transactions)
- Use `frappe.db.commit()` periodically to avoid long transactions
- Create migration reports for tracking

---

### 13. What do you know about Fixtures?

**Answer:** **Fixtures** are predefined data records that are exported from a site and bundled with an app for installation on other sites. They enable version-controlled configuration management.

**Purpose:**
- Package configuration data with your app
- Ensure consistent setup across environments (dev, staging, production)
- Version control customizations (Custom Fields, Property Setters, etc.)
- Share configurations between sites

**Configuration in `hooks.py`:**
```python
fixtures = [
    "Custom Field",
    "Property Setter",
    "Client Script",
    {"dt": "Role", "filters": [["name", "in", ["Custom Role 1", "Custom Role 2"]]]},
    {"dt": "Print Format", "filters": [["module", "=", "My App"]]},
    {"dt": "Workflow", "filters": [["document_type", "=", "Leave Application"]]},
]
```

**Export Fixtures:**
```bash
bench export-fixtures
# Creates JSON files in apps/myapp/myapp/fixtures/
# Example: apps/myapp/myapp/fixtures/custom_field.json
```

**Installation:**
- Fixtures are automatically installed when app is installed via `bench install-app`
- Existing records are updated, new ones are created
- Stored in `apps/{app}/fixtures/` directory
- Loaded during `bench migrate` or `bench install-app`

**Common Fixture Types:**
- Custom Fields
- Property Setters
- Custom Scripts (Client Script, Server Script)
- Print Formats
- Roles and Permissions
- Workflow configurations
- Web Forms
- Custom DocTypes

**Example Fixture File:**
```json
// apps/myapp/myapp/fixtures/custom_field.json
[
    {
        "doctype": "Custom Field",
        "dt": "Customer",
        "fieldname": "tax_id",
        "label": "Tax ID",
        "fieldtype": "Data",
        "insert_after": "customer_name"
    }
]
```

---

### 14. What do you know about Property Setter?

**Answer:** **Property Setter** is a DocType that allows you to override properties of standard DocTypes and fields **without modifying core code** (Source: `frappe/model/meta.py`).

**Key Features:**
- Changes are stored in database (`tabProperty Setter`)
- Survives framework updates
- Can be exported as fixtures
- Applied at runtime when meta is loaded via `apply_property_setters()`

**What Can Be Customized:**
- **Field properties**: label, hidden, read_only, mandatory, default, options, etc.
- **DocType properties**: allow_rename, is_submittable, title_field, search_fields, etc.
- **Form behavior**: quick_entry, track_changes, allow_copy, etc.

**Example:**
```python
# Make "Customer Name" field mandatory in Customer DocType
frappe.get_doc({
    "doctype": "Property Setter",
    "doctype_or_field": "DocField",
    "doc_type": "Customer",
    "field_name": "customer_name",
    "property": "reqd",
    "value": "1",
    "property_type": "Check"
}).insert()
```

**Behind the Scenes** (Source: `frappe/model/meta.py`):
```python
def apply_property_setters(self):
    """Apply Property Setters to DocType meta"""
    property_setters = frappe.db.get_values(
        "Property Setter",
        filters={"doc_type": self.name},
        fieldname="*",
        as_dict=True
    )
    for ps in property_setters:
        # Override the property in meta
        if ps.doctype_or_field == "DocField":
            field = self.get_field(ps.field_name)
            if field:
                field[ps.property] = ps.value
        else:
            # DocType level property
            self[ps.property] = ps.value
```

**Use Cases:**
- Making standard fields mandatory
- Hiding fields for specific clients
- Changing field labels
- Modifying form behavior
- Customizing without code changes
- Client-specific customizations that survive updates

**Common Properties:**
- `reqd`: Make field mandatory
- `hidden`: Hide field
- `read_only`: Make field read-only
- `label`: Change field label
- `default`: Set default value
- `options`: Change select options
- `allow_on_submit`: Allow editing after submit

---

## Senior Frappe/ERPNext Developer

### 15. What is the difference between Redis cache and local cache in Frappe?

**Answer:** Frappe implements **two distinct caching layers** with different scopes and use cases (Source: `frappe/__init__.py`):

**1. Redis Cache (`frappe.cache`)**:
- **Scope**: Shared across all workers and processes
- **Persistence**: Survives process restarts (stored in Redis)
- **Use Case**: Data that needs to be shared across requests/workers
- **Implementation**: `RedisWrapper` class in `frappe/utils/redis_wrapper.py`

```python
# Set cache (available to all workers)
frappe.cache.set_value("key", "value", expires_in_sec=3600)

# Get cache
value = frappe.cache.get_value("key")

# Hash operations
frappe.cache.hset("doctype_meta", "Customer", meta_dict)
meta = frappe.cache.hget("doctype_meta", "Customer")
```

**2. Local Cache (`frappe.local.cache`)**:
- **Scope**: Request-scoped, single process only
- **Persistence**: Cleared after each request completes
- **Use Case**: Temporary data within a single request
- **Implementation**: Python dictionary in `frappe.local`

```python
# Set local cache (only for current request)
frappe.local.cache["temp_data"] = some_value

# Get local cache
value = frappe.local.cache.get("temp_data")
```

**3. Site Cache (Process-level)**:
- **Scope**: Per-process, survives across requests
- **Persistence**: Cleared on process restart
- **Use Case**: DocType meta, translations, etc.

**Comparison Table:**

| Feature | Redis Cache | Local Cache |
|---------|-------------|-------------|
| Scope | All workers | Single request |
| Persistence | Redis DB | Memory (request) |
| Speed | Network call | In-memory (fastest) |
| Use Case | Shared data | Temporary data |
| Cleared by | `bench clear-cache` | End of request |

**When to Use:**
- **Redis Cache**: User sessions, DocType meta, system settings, rate limiting
- **Local Cache**: Query results within request, temporary calculations, request-specific data

---

### 16. What is the difference between Frappe and ERPNext?

**Answer:**

**Frappe:**
- **Framework**: Full-stack web application framework
- **Purpose**: Build any type of web application
- **Components**: ORM, REST API, UI components, authentication, permissions, workflows
- **Analogy**: Like Django or Ruby on Rails
- **Use Cases**: CRM, LMS, HRMS, custom business applications

**ERPNext:**
- **Application**: Enterprise Resource Planning software **built on** Frappe
- **Purpose**: Manage business operations (accounting, inventory, HR, etc.)
- **Components**: 20+ modules (Accounting, Stock, Manufacturing, HR, etc.)
- **Analogy**: Like Odoo or SAP
- **Use Cases**: Complete business management solution

**Relationship:**
```
Frappe Framework (Foundation)
    ↓
ERPNext (Application built on Frappe)
    ↓
Custom Apps (Your apps extending ERPNext)
```

**Technical Differences:**

| Aspect | Frappe | ERPNext |
|--------|--------|---------|
| Type | Framework | Application |
| Installation | `bench get-app frappe` | `bench get-app erpnext` |
| Dependencies | Python, MariaDB/Postgres, Redis | Requires Frappe |
| DocTypes | Core (User, Role, DocType, etc.) | Business (Customer, Item, Invoice, etc.) |
| Purpose | Build apps | Run business |

**Key Point**: You can use Frappe without ERPNext to build custom applications, but ERPNext requires Frappe as its foundation.

---

### 17. What do you know about bench commands? What commands do you know about?

**Answer:** Bench is the CLI tool for managing Frappe/ERPNext. Here are the essential commands organized by category:

**Site Management:**
```bash
# Create new site
bench new-site site1.local --db-name site1_db --admin-password admin

# Drop site
bench drop-site site1.local --force

# Set default site
bench use site1.local

# Backup
bench backup --site site1.local
bench backup-all-sites

# Restore
bench restore /path/to/backup.sql.gz --site site1.local

# Reinstall site
bench reinstall --site site1.local
```

**App Management:**
```bash
# Get app from GitHub
bench get-app https://github.com/frappe/erpnext --branch version-15

# Install app to site
bench install-app erpnext --site site1.local

# Uninstall app from site
bench uninstall-app erpnext --site site1.local

# Remove app from bench
bench remove-app erpnext

# List apps
bench version
```

**Development:**
```bash
# Start development server
bench start

# Migrate database
bench migrate
bench migrate --site site1.local

# Clear cache
bench clear-cache
bench clear-website-cache

# Build assets
bench build
bench build --app myapp

# Watch and rebuild
bench watch

# Create new app
bench new-app myapp

# Run tests
bench run-tests --app myapp
bench run-tests --doctype "Sales Order"
```

**Database:**
```bash
# Open database console
bench mariadb
bench postgres

# Execute Python code
bench execute "frappe.db.sql('SELECT * FROM tabUser')"

# Python console
bench console

# Run patch
bench execute frappe.modules.patch_handler.run_single --args "['myapp.patches.v1_0.my_patch']"
```

**Production:**
```bash
# Setup production
bench setup production user

# Setup nginx
bench setup nginx

# Setup supervisor
bench setup supervisor

# Restart services
bench restart

# Update bench and apps
bench update
bench update --pull
bench update --patch
bench update --build
```

**Scheduler:**
```bash
# Enable scheduler
bench enable-scheduler

# Disable scheduler
bench disable-scheduler

# Run specific scheduler event
bench execute frappe.utils.scheduler.enqueue_events_for_all_sites
```

**Utilities:**
```bash
# Set config
bench set-config key value

# Get config
bench config

# Doctor (health check)
bench doctor

# Show bench info
bench version

# Migrate to different branch
bench switch-to-branch version-15 frappe erpnext

# Retry failed jobs
bench retry-upgrade

# Export fixtures
bench export-fixtures
```

---

### 18. What is the architecture of Frappe and bench?

**Answer:** Frappe follows a **multi-tier architecture** with clear separation of concerns:

**1. Frappe Architecture Layers:**

```
┌─────────────────────────────────────────┐
│         Frontend (Browser)              │
│  - Frappe UI (Desk)                     │
│  - Vue.js components                    │
│  - Custom pages/forms                   │
└─────────────────────────────────────────┘
                  ↓ HTTP/WebSocket
┌─────────────────────────────────────────┐
│         Web Server (nginx)              │
│  - Reverse proxy                        │
│  - Static file serving                  │
│  - Load balancing                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Application Server (Gunicorn)      │
│  - WSGI server                          │
│  - Multiple worker processes            │
│  - Request handling                     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Frappe Framework                │
│  ┌───────────────────────────────────┐  │
│  │  Request Handler (app.py)         │  │
│  │  - Route requests                 │  │
│  │  - Initialize site context        │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  ORM Layer (model/)               │  │
│  │  - Document CRUD                  │  │
│  │  - Validation                     │  │
│  │  - Permissions                    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Database Layer (database/)       │  │
│  │  - Query builder                  │  │
│  │  - Transactions                   │  │
│  │  - Schema management              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  MariaDB/Postgres│  │  Redis           │
│  - Data storage  │  │  - Cache         │
│  - Transactions  │  │  - Sessions      │
│  - Multi-tenant  │  │  - Job queue     │
└──────────────────┘  └──────────────────┘
```

**2. Multi-Tenancy Architecture** (Source: `frappe/installer.py`, `frappe/__init__.py`):

```
Bench Directory
├── sites/
│   ├── site1.local/
│   │   ├── site_config.json  # DB credentials, settings
│   │   ├── private/files/
│   │   └── public/files/
│   ├── site2.local/
│   │   ├── site_config.json
│   │   ├── private/files/
│   │   └── public/files/
│   └── common_site_config.json  # Shared settings
├── apps/
│   ├── frappe/  # Framework
│   ├── erpnext/  # Application
│   └── custom_app/  # Your app
└── env/  # Python virtual environment
```

**Site Isolation:**
- Each site has its own database (e.g., `_site1_db`, `_site2_db`)
- Separate file storage per site
- Shared codebase (apps) across all sites
- Site determined by HTTP Host header or `--site` parameter

**3. Request Flow:**

```
1. Browser → nginx (port 80/443)
2. nginx → Gunicorn (port 8000)
3. Gunicorn → Frappe app.py
4. app.py → init_request()
   - Determine site from Host header
   - frappe.init(site) - Load site config
   - frappe.connect() - Connect to site's database
5. Route to appropriate handler
   - API: frappe.handler
   - Form: frappe.desk.form
   - Web page: frappe.website
6. Execute business logic
7. Return response
8. Cleanup (frappe.destroy())
```

**4. Background Jobs Architecture** (Source: `frappe/utils/background_jobs.py`):

```
┌─────────────────────────────────────────┐
│         Application                     │
│  frappe.enqueue("method", queue="long") │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Redis Queue (RQ)                │
│  - default queue                        │
│  - short queue                          │
│  - long queue                           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         RQ Workers                      │
│  - bench worker --queue default         │
│  - bench worker --queue short           │
│  - bench worker --queue long            │
└─────────────────────────────────────────┘
```

**5. Bench Architecture:**

Bench is a **wrapper/orchestrator** that manages:
- **Virtual environment**: Python packages isolation
- **Process management**: Supervisor configs for workers, web server, scheduler
- **Web server**: nginx configuration
- **Multiple sites**: Site creation, backup, restore
- **App management**: Install, update, remove apps
- **Development server**: `bench start` runs all services

**Key Components:**
- `bench start`: Runs Procfile (web, socketio, watch, schedule, worker)
- `bench setup production`: Configures nginx + supervisor for production
- `bench migrate`: Runs patches and syncs schema
- `bench update`: Git pull + migrate + build

---

### 19. How does Frappe handle database transactions? Explain commit and rollback.

**Answer:** Frappe implements **explicit transaction management** with auto-commit behavior and savepoint support (Source: `frappe/database/database.py`).

**Transaction Lifecycle:**

```python
# Source: frappe/database/database.py
class Database:
    def begin(self):
        """Start a new transaction"""
        self.sql("START TRANSACTION")

    def commit(self):
        """Commit current transaction"""
        self.sql("COMMIT")
        # Frappe automatically starts a new transaction after commit
        self.begin()

    def rollback(self, save_point=None):
        """Rollback to savepoint or entire transaction"""
        if save_point:
            self.sql(f"ROLLBACK TO SAVEPOINT {save_point}")
        else:
            self.sql("ROLLBACK")
            self.begin()

    def savepoint(self, save_point):
        """Create a savepoint for partial rollback"""
        self.sql(f"SAVEPOINT {save_point}")

    def release_savepoint(self, save_point):
        """Release a savepoint"""
        self.sql(f"RELEASE SAVEPOINT {save_point}")
```

**Auto-Commit Behavior:**
- Frappe **automatically commits** at the end of each request
- Explicit `frappe.db.commit()` commits immediately
- After commit, a new transaction is automatically started
- Rollback happens automatically on exceptions

**Example Usage:**

```python
# Automatic transaction (recommended)
def create_sales_order():
    doc = frappe.get_doc({
        "doctype": "Sales Order",
        "customer": "CUST-001"
    })
    doc.insert()
    # Auto-committed at end of request

# Explicit commit (for background jobs)
def background_task():
    for i in range(1000):
        create_record(i)
        if i % 100 == 0:
            frappe.db.commit()  # Commit every 100 records

# Rollback on error
def risky_operation():
    try:
        doc1.save()
        doc2.save()
        frappe.db.commit()
    except Exception:
        frappe.db.rollback()
        raise

# Savepoints for nested transactions
def complex_operation():
    frappe.db.savepoint("before_risky_op")
    try:
        risky_operation()
    except Exception:
        frappe.db.rollback(save_point="before_risky_op")
        # Continue with safe operations

    safe_operation()
    frappe.db.commit()
```

**Transaction Write Limits:**
- Frappe tracks writes per transaction
- Configurable limit to prevent long-running transactions
- Automatically commits when limit is reached
- Prevents database lock issues

**Best Practices:**
- Let Frappe auto-commit for web requests
- Use explicit `commit()` in background jobs
- Use savepoints for complex multi-step operations
- Always handle exceptions to prevent partial data
- Avoid long-running transactions (use chunking)

---

### 20. What is the Singles table in Frappe?

**Answer:** The **Singles table** (`tabSingles`) is a special table that stores data for **Single DocTypes** - DocTypes that have only one record (Source: `frappe/database/mariadb/framework_mariadb.sql`).

**Schema:**
```sql
CREATE TABLE `tabSingles` (
    `doctype` VARCHAR(255) NOT NULL,
    `field` VARCHAR(255) NOT NULL,
    `value` TEXT,
    PRIMARY KEY (`doctype`, `field`)
);
```

**Storage Format:**
Instead of creating a separate table for each Single DocType, all singles share one table with **key-value storage**:

```
| doctype          | field              | value           |
|------------------|--------------------|-----------------|
| System Settings  | language           | en              |
| System Settings  | time_zone          | Asia/Kolkata    |
| System Settings  | enable_scheduler   | 1               |
| Global Defaults  | default_currency   | USD             |
| Global Defaults  | default_company    | My Company      |
```

**Creating a Single DocType:**
```json
{
    "doctype": "DocType",
    "name": "System Settings",
    "issingle": 1,
    "fields": [
        {
            "fieldname": "language",
            "fieldtype": "Select",
            "options": "en\nfr\nes"
        },
        {
            "fieldname": "time_zone",
            "fieldtype": "Select"
        }
    ]
}
```

**Accessing Single DocTypes:**
```python
# Get single document
settings = frappe.get_single("System Settings")
print(settings.language)  # "en"

# Update single document
settings.language = "fr"
settings.save()

# Get single value directly
language = frappe.db.get_single_value("System Settings", "language")

# Set single value directly
frappe.db.set_single_value("System Settings", "language", "es")
```

**Behind the Scenes:**
```python
# Source: frappe/model/document.py
class Document:
    def db_insert(self):
        if self.meta.issingle:
            # Insert into tabSingles
            for field in self.meta.fields:
                frappe.db.sql("""
                    INSERT INTO `tabSingles` (doctype, field, value)
                    VALUES (%s, %s, %s)
                    ON DUPLICATE KEY UPDATE value=%s
                """, (self.doctype, field.fieldname, self.get(field.fieldname), self.get(field.fieldname)))
        else:
            # Insert into tab{DocType}
            self.db_insert_normal()
```

**Common Single DocTypes:**
- System Settings
- Global Defaults
- Selling Settings
- Buying Settings
- Stock Settings
- Accounts Settings

**Why Use Singles:**
- Configuration/settings that have only one record
- Avoid creating tables with single row
- Efficient storage for global settings
- Easy to query and update

---

### 21. How do you implement background jobs in Frappe?

**Answer:** Frappe uses **RQ (Redis Queue)** for background job processing (Source: `frappe/utils/background_jobs.py`).

**Basic Usage:**

```python
# Enqueue a job
frappe.enqueue(
    method="myapp.tasks.send_email",
    queue="default",
    timeout=300,
    is_async=True,
    now=False,
    job_name="send_email_job",
    **kwargs  # Arguments passed to the method
)
```

**Queue Types:**
- **default**: General purpose (timeout: 300s)
- **short**: Quick tasks (timeout: 300s)
- **long**: Long-running tasks (timeout: 1500s)

**Implementation Example:**

```python
# myapp/tasks.py
import frappe

def send_bulk_emails(recipients):
    """Send emails to multiple recipients"""
    for recipient in recipients:
        frappe.sendmail(
            recipients=[recipient],
            subject="Notification",
            message="Hello!"
        )
        frappe.db.commit()  # Commit after each email

# Enqueue from anywhere
def trigger_bulk_email():
    recipients = frappe.get_all("Customer", pluck="email_id")

    frappe.enqueue(
        method="myapp.tasks.send_bulk_emails",
        queue="long",
        timeout=3600,
        recipients=recipients
    )

    frappe.msgprint("Emails are being sent in background")
```

**Advanced Features:**

```python
# 1. Enqueue with retry
frappe.enqueue(
    method="myapp.tasks.api_call",
    queue="default",
    timeout=300,
    enqueue_after_commit=True,  # Enqueue only if transaction commits
    deduplicate=True,  # Prevent duplicate jobs
    job_id="unique_job_id"  # Custom job ID
)

# 2. Scheduled jobs (via hooks.py)
scheduler_events = {
    "daily": [
        "myapp.tasks.daily_report"
    ],
    "hourly": [
        "myapp.tasks.sync_data"
    ],
    "cron": {
        "0 2 * * *": [  # 2 AM daily
            "myapp.tasks.cleanup"
        ]
    }
}

# 3. Progress tracking
def long_task():
    total = 1000
    for i in range(total):
        process_item(i)
        frappe.publish_progress(
            percent=(i/total)*100,
            title="Processing items",
            description=f"Processed {i}/{total}"
        )

# 4. Error handling
def safe_task():
    try:
        risky_operation()
    except Exception as e:
        frappe.log_error(
            title="Task Failed",
            message=frappe.get_traceback()
        )
        # Optionally re-raise to mark job as failed
        raise
```

**Worker Management:**

```bash
# Start workers (development)
bench worker --queue default
bench worker --queue short
bench worker --queue long

# Production (via Supervisor)
bench setup supervisor
sudo supervisorctl restart all
```

**Job Monitoring:**

```python
# Get job status
from rq import Queue
from frappe.utils.background_jobs import get_redis_conn

redis_conn = get_redis_conn()
queue = Queue("default", connection=redis_conn)

# List jobs
jobs = queue.jobs
for job in jobs:
    print(f"Job: {job.id}, Status: {job.get_status()}")

# Get specific job
from rq.job import Job
job = Job.fetch("job_id", connection=redis_conn)
print(job.result)  # Job result
print(job.exc_info)  # Exception info if failed
```

**Best Practices:**
- Use `long` queue for tasks > 5 minutes
- Commit database changes periodically in long tasks
- Implement error logging
- Use `enqueue_after_commit=True` for transactional safety
- Set appropriate timeouts
- Monitor failed jobs via RQ dashboard or logs

---

### 22. How does Frappe implement multi-tenancy?

**Answer:** Frappe implements **database-level multi-tenancy** where each site (tenant) has its own isolated database while sharing the same codebase (Source: `frappe/__init__.py`, `frappe/installer.py`).

**Architecture:**

```
Single Bench Installation
├── Shared Codebase (apps/)
│   ├── frappe/
│   ├── erpnext/
│   └── custom_app/
│
└── Multiple Sites (sites/)
    ├── site1.local/
    │   ├── Database: _site1_db
    │   ├── Files: private/, public/
    │   └── Config: site_config.json
    │
    ├── site2.local/
    │   ├── Database: _site2_db
    │   ├── Files: private/, public/
    │   └── Config: site_config.json
    │
    └── site3.local/
        ├── Database: _site3_db
        ├── Files: private/, public/
        └── Config: site_config.json
```

**Site Isolation Mechanisms:**

**1. Database Isolation:**
```python
# Source: frappe/__init__.py
def init(site, sites_path=None):
    """Initialize site context"""
    local.site = site
    local.site_path = os.path.join(sites_path or ".", "sites", site)

    # Load site-specific config
    local.conf = get_site_config()

    # Connect to site's database
    connect(site)

def connect(site=None):
    """Connect to site's database"""
    from frappe.database import get_db
    local.db = get_db(
        host=local.conf.db_host,
        user=local.conf.db_name,  # Site-specific DB
        password=local.conf.db_password
    )
```

**2. Request Routing:**
```python
# Source: frappe/app.py
def application(environ, start_response):
    """WSGI application entry point"""
    # Determine site from HTTP Host header
    site = get_site_name(environ.get("HTTP_HOST"))

    # Initialize site context
    frappe.init(site=site)
    frappe.connect()

    # Process request
    response = handle_request(environ)

    # Cleanup
    frappe.destroy()

    return response
```

**3. File Storage Isolation:**
```
sites/
├── site1.local/
│   ├── private/files/  # Site 1 private files
│   └── public/files/   # Site 1 public files
└── site2.local/
    ├── private/files/  # Site 2 private files
    └── public/files/   # Site 2 public files
```

**4. Configuration Isolation:**
```json
// sites/site1.local/site_config.json
{
    "db_name": "_site1_db",
    "db_password": "password1",
    "encryption_key": "key1",
    "host_name": "https://site1.example.com"
}

// sites/site2.local/site_config.json
{
    "db_name": "_site2_db",
    "db_password": "password2",
    "encryption_key": "key2",
    "host_name": "https://site2.example.com"
}
```

**Site Creation:**
```bash
# Create new site
bench new-site site1.local \
    --db-name _site1_db \
    --admin-password admin123 \
    --install-app erpnext

# Creates:
# - Database: _site1_db
# - Directory: sites/site1.local/
# - Config: sites/site1.local/site_config.json
# - Admin user in the new database
```

**Benefits:**
- **Complete Isolation**: Each tenant's data is completely separate
- **Shared Resources**: Single codebase, single server
- **Independent Customization**: Each site can have different apps/customizations
- **Scalability**: Easy to move sites to different servers
- **Security**: Database-level isolation prevents data leakage

**Limitations:**
- More databases = more resource usage
- Schema changes require migration on all sites
- Shared Redis cache (can be isolated if needed)

**Production Setup:**
```nginx
# nginx configuration for multi-tenancy
server {
    server_name site1.example.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;  # Site determined by Host header
    }
}

server {
    server_name site2.example.com;
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

---

### 23. How do you secure a Frappe application?

**Answer:** Frappe implements **multiple security layers** to protect applications:

**1. Authentication & Authorization:**

```python
# API Security with @frappe.whitelist()
@frappe.whitelist()  # Requires authentication
def protected_api():
    return {"data": "sensitive"}

@frappe.whitelist(allow_guest=True)  # Public access
def public_api():
    return {"data": "public"}

# Permission checking
if not frappe.has_permission("Sales Order", "read", doc):
    frappe.throw("Insufficient permissions")
```

**2. CSRF Protection:**
- Automatic CSRF token validation for POST requests
- Token stored in cookies and validated on each request
- Source: `frappe/auth.py`

**3. SQL Injection Prevention:**
```python
# SAFE: Parameterized queries
frappe.db.sql("""
    SELECT * FROM tabCustomer
    WHERE name = %s
""", (customer_name,))

# UNSAFE: String concatenation (DON'T DO THIS)
frappe.db.sql(f"SELECT * FROM tabCustomer WHERE name = '{customer_name}'")
```

**4. XSS Prevention:**
```python
# Auto-escaping in templates
{{ frappe.utils.escape_html(user_input) }}

# Sanitize HTML
from frappe.utils.html_utils import clean_html
safe_html = clean_html(user_html)

# Whitelist with xss_safe
@frappe.whitelist(xss_safe=True)
def api_returning_html():
    return "<b>Safe HTML</b>"
```

**5. Rate Limiting:**
```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist(allow_guest=True)
@rate_limit(limit=10, seconds=60)  # 10 requests per minute
def login_api():
    pass
```

**6. Password Security:**
- Passwords hashed using bcrypt
- Configurable password policy (length, complexity)
- Two-factor authentication support
- Password reset with time-limited tokens

**7. File Upload Security:**
```python
# Validate file types
allowed_extensions = [".pdf", ".jpg", ".png"]
file_ext = os.path.splitext(filename)[1]
if file_ext not in allowed_extensions:
    frappe.throw("Invalid file type")

# Validate file size
max_size = 5 * 1024 * 1024  # 5MB
if file_size > max_size:
    frappe.throw("File too large")
```

**8. Encryption:**
```python
# Encrypt sensitive data
from frappe.utils.password import encrypt, decrypt

encrypted = encrypt("sensitive_data")
frappe.db.set_value("DocType", "name", "field", encrypted)

# Decrypt
decrypted = decrypt(encrypted)
```

**9. Security Headers:**
```python
# Set in site_config.json
{
    "enable_hsts": 1,
    "x_frame_options": "SAMEORIGIN",
    "content_security_policy": "default-src 'self'"
}
```

**10. Best Practices:**
- Always use `@frappe.whitelist()` for API endpoints
- Validate and sanitize all user inputs
- Use parameterized queries
- Implement proper permission checks
- Enable SSL/TLS in production
- Regular security updates (`bench update`)
- Audit logs for sensitive operations
- Restrict file upload types and sizes

---

### 24. What are Web Forms in Frappe?

**Answer:** **Web Forms** allow you to create public-facing forms that can be accessed without login, enabling external users to submit data (Source: `frappe/website/doctype/web_form/web_form.py`).

**Key Features:**
- Public or login-required forms
- Customizable fields and layout
- File uploads
- Email notifications
- Success message/redirect
- Edit submitted data (if allowed)

**Creating a Web Form:**

1. **Via UI**: Create new Web Form DocType
2. **Configuration:**

```json
{
    "doctype": "Web Form",
    "title": "Job Application",
    "route": "apply-job",
    "doc_type": "Job Applicant",
    "is_standard": 0,
    "allow_edit": 1,
    "allow_multiple": 1,
    "show_list": 0,
    "login_required": 0,
    "allow_delete": 0,
    "allow_print": 0,
    "allow_comments": 1,
    "success_message": "Thank you for applying!",
    "success_url": "/thank-you",
    "web_form_fields": [
        {
            "fieldname": "applicant_name",
            "label": "Full Name",
            "fieldtype": "Data",
            "reqd": 1
        },
        {
            "fieldname": "email_id",
            "label": "Email",
            "fieldtype": "Data",
            "reqd": 1
        },
        {
            "fieldname": "resume",
            "label": "Resume",
            "fieldtype": "Attach"
        }
    ]
}
```

**Accessing Web Form:**
```
https://yoursite.com/apply-job
```

**Behind the Scenes** (Source: `frappe/website/doctype/web_form/web_form.py`):

```python
class WebForm(Document):
    @frappe.whitelist(allow_guest=True)
    def accept(self, data):
        """Handle form submission"""
        # Validate if login required
        if self.login_required and frappe.session.user == "Guest":
            frappe.throw("Please login to submit")

        # Create document
        doc = frappe.get_doc({
            "doctype": self.doc_type,
            **frappe.parse_json(data)
        })

        # Set owner if guest
        if frappe.session.user == "Guest":
            doc.owner = "Guest"

        doc.insert(ignore_permissions=True)

        # Send email notification
        if self.send_email:
            self.send_email_notification(doc)

        return doc.name
```

**Customization:**

```python
# Custom validation in DocType controller
class JobApplicant(Document):
    def validate(self):
        # Custom validation for web form submissions
        if self.source == "Web Form":
            self.validate_email()
            self.validate_resume()
```

**Use Cases:**
- Job applications
- Contact forms
- Customer feedback
- Event registration
- Support tickets
- Lead capture
- Survey forms

**Security Considerations:**
- Set `login_required=1` for sensitive forms
- Validate all inputs in DocType controller
- Use CAPTCHA for public forms (via custom script)
- Limit file upload size and types
- Rate limit submissions

---

### 25. How do you optimize performance in Frappe applications?

**Answer:** Performance optimization in Frappe involves multiple strategies:

**1. Database Query Optimization:**

```python
# BAD: N+1 query problem
customers = frappe.get_all("Customer")
for customer in customers:
    # Each iteration makes a separate query
    territory = frappe.db.get_value("Customer", customer.name, "territory")

# GOOD: Fetch all data in one query
customers = frappe.get_all("Customer", fields=["name", "territory"])

# Use pluck for single field
territories = frappe.get_all("Customer", pluck="territory")

# Use filters instead of Python filtering
# BAD
all_orders = frappe.get_all("Sales Order")
pending = [o for o in all_orders if o.status == "Pending"]

# GOOD
pending = frappe.get_all("Sales Order", filters={"status": "Pending"})
```

**2. Caching:**

```python
# Cache expensive operations
@frappe.whitelist()
def get_dashboard_data():
    cache_key = f"dashboard_data_{frappe.session.user}"
    data = frappe.cache.get_value(cache_key)

    if not data:
        data = compute_expensive_dashboard_data()
        frappe.cache.set_value(cache_key, data, expires_in_sec=300)

    return data

# Cache DocType meta
meta = frappe.get_meta("Sales Order")  # Cached automatically

# Use local cache for request-scoped data
if "temp_data" not in frappe.local.cache:
    frappe.local.cache["temp_data"] = expensive_computation()
```

**3. Indexing:**

```python
# Add database indexes in DocType JSON
{
    "fields": [
        {
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer"
        }
    ],
    "indexes": [
        ["customer", "posting_date"],  # Composite index
        ["status"]  # Single field index
    ]
}

# Or via SQL
frappe.db.sql("""
    CREATE INDEX idx_customer_date
    ON `tabSales Order` (customer, posting_date)
""")
```

**4. Lazy Loading:**

```python
# Don't load child tables unless needed
doc = frappe.get_doc("Sales Order", "SO-001")
# Child tables loaded automatically

# For lists, avoid loading child tables
orders = frappe.get_all("Sales Order",
    fields=["name", "customer", "grand_total"])
# Much faster than frappe.get_all with child table fields
```

**5. Background Jobs:**

```python
# Move heavy operations to background
@frappe.whitelist()
def generate_report():
    frappe.enqueue(
        method="myapp.reports.generate_heavy_report",
        queue="long",
        timeout=3600
    )
    return {"message": "Report generation started"}
```

**6. Database Connection Pooling:**

```json
// site_config.json
{
    "db_pool_size": 10,
    "max_overflow": 20
}
```

**7. Frontend Optimization:**

```javascript
// Debounce search
frappe.ui.form.on('Customer', {
    customer_name: frappe.utils.debounce(function(frm) {
        // Search logic
    }, 300)
});

// Lazy load images
<img loading="lazy" src="image.jpg">

// Use frappe.call with freeze
frappe.call({
    method: "myapp.api.heavy_operation",
    freeze: true,  // Show loading indicator
    freeze_message: "Processing..."
});
```

**8. Monitoring:**

```python
# Enable query logging
frappe.db.sql("SET profiling = 1")

# Log slow queries
import time
start = time.time()
result = expensive_query()
duration = time.time() - start
if duration > 1:
    frappe.log_error(f"Slow query: {duration}s")
```

**9. Production Settings:**

```json
// site_config.json
{
    "enable_frappe_logger": 0,
    "disable_website_cache": 0,
    "developer_mode": 0,
    "auto_cache_clear": 0
}
```

**10. Best Practices:**
- Use `frappe.get_all()` instead of `frappe.get_list()` when possible
- Avoid loading full documents in lists
- Use database indexes on frequently queried fields
- Cache expensive computations
- Use background jobs for heavy operations
- Minimize database round trips
- Use CDN for static assets
- Enable gzip compression
- Monitor and optimize slow queries

---

### 26. What is the difference between `frappe.get_doc()` and `frappe.get_all()`?

**Answer:**

**`frappe.get_doc()`:**
- Loads a **single complete document** with all fields and child tables
- Returns a `Document` object with methods (save, submit, etc.)
- Slower for bulk operations
- Use when you need to modify the document

```python
# Load single document
doc = frappe.get_doc("Sales Order", "SO-001")
doc.status = "Completed"
doc.save()

# Create new document
doc = frappe.get_doc({
    "doctype": "Customer",
    "customer_name": "John Doe"
})
doc.insert()
```

**`frappe.get_all()`:**
- Loads **multiple documents** with selected fields only
- Returns list of dictionaries
- Much faster for bulk reads
- Cannot modify documents directly

```python
# Get multiple records with specific fields
orders = frappe.get_all("Sales Order",
    filters={"status": "Pending"},
    fields=["name", "customer", "grand_total"],
    order_by="creation desc",
    limit=100
)

# Returns: [{"name": "SO-001", "customer": "CUST-001", "grand_total": 1000}, ...]
```

**Comparison:**

| Feature | `frappe.get_doc()` | `frappe.get_all()` |
|---------|-------------------|-------------------|
| Returns | Document object | List of dicts |
| Fields | All fields | Selected fields |
| Child tables | Loaded | Not loaded |
| Methods | Available | Not available |
| Performance | Slower | Faster |
| Use case | Single doc CRUD | Bulk read operations |

---

### 27. What are Server Scripts in Frappe?

**Answer:** **Server Scripts** allow you to write Python code directly in the UI without creating custom apps (Source: `frappe/core/doctype/server_script/`).

**Types:**

1. **DocType Event Scripts:**
```python
# Triggered on document events
# Script Type: DocType Event
# DocType: Sales Order
# Event: Before Save

if doc.grand_total > 100000:
    frappe.throw("Order amount exceeds limit")
```

2. **API Scripts:**
```python
# Script Type: API
# API Name: get_customer_balance

customer = frappe.form_dict.customer
balance = frappe.db.get_value("Customer", customer, "outstanding_amount")
frappe.response["message"] = {"balance": balance}

# Access: /api/method/get_customer_balance?customer=CUST-001
```

3. **Permission Query Scripts:**
```python
# Script Type: Permission Query
# DocType: Sales Order

# Only show orders from user's territory
user_territory = frappe.db.get_value("User", frappe.session.user, "territory")
conditions = f"territory = '{user_territory}'"
```

4. **Scheduler Event Scripts:**
```python
# Script Type: Scheduler Event
# Event Frequency: Daily

# Send daily report
frappe.sendmail(
    recipients=["admin@example.com"],
    subject="Daily Report",
    message="Report content"
)
```

**Benefits:**
- No need to create custom app
- Quick prototyping
- Version controlled (stored in database)
- Can be exported as fixtures

**Limitations:**
- Limited to available Python modules
- No access to file system
- Performance overhead
- Harder to debug than app code

---

## Conclusion

This document covers the most common Frappe/ERPNext interview questions from junior to senior levels. All answers are verified against the actual Frappe framework source code to ensure accuracy and demonstrate deep understanding.

**Key Takeaways:**
- Frappe is a **meta-driven framework** that generates UI, APIs, and database schema from DocType definitions
- **Multi-tenancy** is achieved through database isolation with shared codebase
- **Hooks** enable extending functionality without modifying core code
- **Background jobs** use RQ (Redis Queue) for async processing
- **Caching** has multiple layers: Redis (shared), local (request), and site (process)
- **Security** is multi-layered with authentication, permissions, CSRF, XSS protection
- **Performance** optimization involves query optimization, caching, indexing, and background jobs


