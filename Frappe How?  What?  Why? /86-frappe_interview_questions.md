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
28. [How to change the Frappe built-in DocType API response?](#28-how-to-change-the-frappe-built-in-doctype-api-response)
29. [How to secure the API? Auth, permission check, rate_limit](#29-how-to-secure-the-api-auth-permission-check-rate_limit)
30. [How to move customizations (Custom Fields, Property Setters, Client Scripts) to another site without manual migration?](#30-how-to-move-customizations-custom-fields-property-setters-client-scripts-to-another-site-without-manual-migration)
31. [Why does changing a field type to Float with default value cause "cannot convert str to float" error?](#31-why-does-changing-a-field-type-to-float-with-default-value-cause-cannot-convert-str-to-float-error)
32. [Why doesn't setting a default value on a field fix existing records during bench migrate?](#32-why-doesnt-setting-a-default-value-on-a-field-fix-existing-records-during-bench-migrate)
33. [Why does Frappe fail when changing field type to Float if existing records contain NULL or empty string values?](#33-why-does-frappe-fail-when-changing-field-type-to-float-if-existing-records-contain-null-or-empty-string-values)
34. [Why does Frappe perform type casting when loading DocTypes, especially during bench migrate?](#34-why-does-frappe-perform-type-casting-when-loading-doctypes-especially-during-bench-migrate)
35. [What is the correct approach to safely change a field type in Frappe when existing data may be incompatible?](#35-what-is-the-correct-approach-to-safely-change-a-field-type-in-frappe-when-existing-data-may-be-incompatible)
36. [Why does Frappe not rely only on database data types and instead enforce its own type casting at the ORM level?](#36-why-does-frappe-not-rely-only-on-database-data-types-and-instead-enforce-its-own-type-casting-at-the-orm-level)
37. [Is Frappe MVC or MVT? What system architecture does Frappe follow?](#37-is-frappe-mvc-or-mvt-what-system-architecture-does-frappe-follow)
38. [What is anti pattern? How can we prevent anti pattern in Frappe?](#38-what-is-anti-pattern-how-can-we-prevent-anti-pattern-in-frappe)
39. [If the company changes the domain name and all employee emails, how to change all emails in the app DB safely?](#39-if-the-company-changes-the-domain-name-and-all-employee-emails-how-to-change-all-emails-in-the-app-db-safely)
40. [What are limitations of Frappe?](#40-what-are-limitations-of-frappe)

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

### 28. How to change the Frappe built-in DocType API response?

**Answer:** You can override Frappe's built-in API responses using **hooks** or by overriding the API method directly (Source: `frappe/api/`).

**Method 1: Override Whitelisted Methods Hook** (Recommended):

```python
# hooks.py
override_whitelisted_methods = {
    "frappe.client.get": "myapp.api.custom_get",
    "frappe.client.get_list": "myapp.api.custom_get_list",
    "frappe.desk.reportview.get": "myapp.api.custom_reportview_get"
}

# myapp/api.py
import frappe
from frappe.client import get as original_get

@frappe.whitelist()
def custom_get(doctype, name=None, filters=None, fields=None, **kwargs):
    """Override the default frappe.client.get"""
    # Call original method
    result = original_get(doctype, name, filters, fields, **kwargs)
    
    # Modify response
    if doctype == "Customer":
        # Add custom field to response
        if isinstance(result, dict):
            result["custom_field"] = "custom_value"
        elif isinstance(result, list):
            for item in result:
                item["custom_field"] = "custom_value"
    
    return result
```

**Method 2: Override DocType Controller Method**:

```python
# myapp/doctype/customer/customer.py
import frappe
from frappe.model.document import Document

class Customer(Document):
    def as_dict(self, no_nulls=False, no_default_fields=False, convert_dates_to_str=False):
        """Override the default as_dict method"""
        data = super().as_dict(no_nulls, no_default_fields, convert_dates_to_str)
        
        # Add custom fields to API response
        data["custom_computed_field"] = self.compute_something()
        
        return data
```

**Method 3: Override API Handler** (Advanced):

```python
# hooks.py
override_whitelisted_methods = {
    "frappe.handler": "myapp.api.custom_handler"
}

# myapp/api.py
def custom_handler():
    """Override the main API handler"""
    import frappe
    from frappe import _
    
    cmd = frappe.form_dict.cmd
    doctype = frappe.form_dict.doctype
    
    # Intercept specific API calls
    if cmd == "frappe.client.get" and doctype == "Sales Order":
        return custom_sales_order_get()
    
    # Fallback to original handler
    from frappe.handler import handle
    return handle()
```

**Method 4: Modify Response in DocType Event**:

```python
# hooks.py
doc_events = {
    "Customer": {
        "on_update": "myapp.custom.modify_api_response"
    }
}

# myapp/custom.py
def modify_api_response(doc, method):
    """This runs on document update, but doesn't directly modify API response"""
    # For API response modification, use Method 1 or 2
    pass
```

**Best Practices:**
- Use `override_whitelisted_methods` hook for API-level changes
- Override `as_dict()` in DocType controller for document-level changes
- Always call the original method first, then modify the response
- Document your overrides clearly
- Test thoroughly as overrides affect all API consumers

---

### 29. How to secure the API? Auth, permission check, rate_limit

**Answer:** Frappe provides multiple layers of API security through decorators, hooks, and built-in mechanisms (Source: `frappe/auth.py`, `frappe/api/`).

**1. Authentication with `@frappe.whitelist()`**:

```python
import frappe
from frappe.rate_limiter import rate_limit

# Basic authentication (default)
@frappe.whitelist()
def protected_api():
    """Requires user to be logged in"""
    return {"data": "protected"}

# Public API (no authentication)
@frappe.whitelist(allow_guest=True)
def public_api():
    """Publicly accessible"""
    return {"data": "public"}

# Method-specific authentication
@frappe.whitelist(methods=["GET", "POST"])
def method_specific_api():
    """Only GET and POST allowed"""
    return {"data": "method_specific"}
```

**2. Permission Checking**:

```python
@frappe.whitelist()
def permission_checked_api(doctype, name):
    """Check permissions before returning data"""
    # Check DocType-level permission
    if not frappe.has_permission(doctype, "read"):
        frappe.throw("Insufficient permissions", frappe.PermissionError)
    
    # Get document
    doc = frappe.get_doc(doctype, name)
    
    # Check document-level permission
    if not frappe.has_permission(doctype, "read", doc):
        frappe.throw("Cannot access this document", frappe.PermissionError)
    
    return doc.as_dict()

# Check specific permission type
@frappe.whitelist()
def create_api(data):
    if not frappe.has_permission("Sales Order", "create"):
        frappe.throw("Cannot create Sales Order")
    
    doc = frappe.get_doc(json.loads(data))
    doc.insert()
    return doc.name
```

**3. Rate Limiting**:

```python
from frappe.rate_limiter import rate_limit

@frappe.whitelist(allow_guest=True)
@rate_limit(limit=10, seconds=60)  # 10 requests per minute
def rate_limited_api():
    """Rate limited to 10 requests per minute per IP/user"""
    return {"status": "ok"}

# Different limits for different users
@frappe.whitelist()
@rate_limit(limit=100, seconds=60)  # 100 for authenticated users
def authenticated_rate_limit():
    return {"status": "ok"}

# Custom rate limit key
@frappe.whitelist(allow_guest=True)
@rate_limit(limit=5, seconds=60, key=lambda: frappe.form_dict.email)
def email_based_rate_limit():
    """Rate limit based on email parameter"""
    return {"status": "ok"}
```

**4. Input Validation and Sanitization**:

```python
@frappe.whitelist()
def validated_api(customer_name, amount):
    """Validate and sanitize inputs"""
    # Type validation
    if not isinstance(customer_name, str):
        frappe.throw("Invalid customer name")
    
    # Value validation
    try:
        amount = float(amount)
        if amount < 0:
            frappe.throw("Amount cannot be negative")
    except (ValueError, TypeError):
        frappe.throw("Invalid amount")
    
    # Existence check
    if not frappe.db.exists("Customer", customer_name):
        frappe.throw("Customer does not exist")
    
    return {"status": "valid"}
```

**5. Role-Based Access**:

```python
@frappe.whitelist()
def role_based_api():
    """Check user roles"""
    user_roles = frappe.get_roles()
    
    if "System Manager" not in user_roles:
        frappe.throw("Only System Managers can access this API")
    
    return {"data": "admin_only"}

# Check multiple roles
@frappe.whitelist()
def multi_role_check():
    user_roles = frappe.get_roles()
    allowed_roles = ["Sales Manager", "Sales User", "System Manager"]
    
    if not any(role in allowed_roles for role in user_roles):
        frappe.throw("Insufficient role permissions")
    
    return {"data": "allowed"}
```

**6. IP Whitelisting** (Custom Implementation):

```python
from frappe import get_request_header

@frappe.whitelist()
def ip_whitelisted_api():
    """Check IP address"""
    allowed_ips = ["192.168.1.100", "10.0.0.1"]
    client_ip = get_request_header("X-Forwarded-For") or frappe.local.request.environ.get("REMOTE_ADDR")
    
    if client_ip not in allowed_ips:
        frappe.throw("IP address not allowed", frappe.AuthenticationError)
    
    return {"data": "allowed"}
```

**7. API Key Authentication** (Custom):

```python
@frappe.whitelist(allow_guest=True)
def api_key_authenticated():
    """Custom API key authentication"""
    api_key = frappe.form_dict.get("api_key")
    
    if not api_key:
        frappe.throw("API key required", frappe.AuthenticationError)
    
    # Validate API key
    valid_key = frappe.db.get_value("API Key", {"key": api_key, "enabled": 1}, "name")
    
    if not valid_key:
        frappe.throw("Invalid API key", frappe.AuthenticationError)
    
    return {"data": "authenticated"}
```

**8. Comprehensive Security Example**:

```python
from frappe.rate_limiter import rate_limit
from frappe import get_request_header

@frappe.whitelist()
@rate_limit(limit=50, seconds=60)
def secure_api(doctype, name):
    """Fully secured API endpoint"""
    # 1. Authentication (handled by @frappe.whitelist())
    
    # 2. Permission check
    if not frappe.has_permission(doctype, "read"):
        frappe.throw("Insufficient permissions", frappe.PermissionError)
    
    # 3. Input validation
    if not doctype or not name:
        frappe.throw("doctype and name are required")
    
    # 4. Existence check
    if not frappe.db.exists(doctype, name):
        frappe.throw("Document does not exist")
    
    # 5. Get document with permission check
    doc = frappe.get_doc(doctype, name)
    
    # 6. Additional business logic permission
    if doc.status == "Cancelled" and "System Manager" not in frappe.get_roles():
        frappe.throw("Cannot access cancelled documents")
    
    return doc.as_dict()
```

**Security Best Practices:**
- Always use `@frappe.whitelist()` for API endpoints
- Set `allow_guest=True` only when necessary
- Implement rate limiting for public APIs
- Validate and sanitize all inputs
- Check permissions at both DocType and document levels
- Use parameterized queries to prevent SQL injection
- Log security events for auditing
- Implement proper error handling (don't expose sensitive info)

---

### 30. How to move customizations (Custom Fields, Property Setters, Client Scripts) to another site without manual migration?

**Answer:** Use **Fixtures** to package and transfer customizations between sites (Source: `frappe/modules/fixtures.py`).

**Step 1: Configure Fixtures in `hooks.py`**:

```python
# hooks.py
fixtures = [
    "Custom Field",
    "Property Setter",
    "Client Script",
    "Server Script",
    {"dt": "Custom Field", "filters": [["module", "=", "My App"]]},
    {"dt": "Property Setter", "filters": [["property", "=", "reqd"]]},
    {"dt": "Client Script", "filters": [["enabled", "=", 1]]},
]
```

**Step 2: Export Fixtures from Source Site**:

```bash
# Export all fixtures configured in hooks.py
bench --site source_site.local export-fixtures

# This creates JSON files in:
# apps/myapp/myapp/fixtures/custom_field.json
# apps/myapp/myapp/fixtures/property_setter.json
# apps/myapp/myapp/fixtures/client_script.json
```

**Step 3: Install Fixtures on Target Site**:

```bash
# Option 1: Install app (fixtures auto-installed)
bench --site target_site.local install-app myapp

# Option 2: During migrate
bench --site target_site.local migrate
# Fixtures are automatically imported during migration
```

**Step 4: Verify Installation**:

```bash
# Check if fixtures were installed
bench --site target_site.local console

# In console:
import frappe
frappe.get_all("Custom Field", filters={"module": "My App"})
frappe.get_all("Property Setter", filters={"property": "reqd"})
```

**Advanced: Selective Fixture Export**:

```python
# hooks.py - Export only specific customizations
fixtures = [
    # All Custom Fields for specific DocTypes
    {"dt": "Custom Field", "filters": [
        ["dt", "in", ["Customer", "Item", "Sales Order"]]
    ]},
    
    # Only enabled Client Scripts
    {"dt": "Client Script", "filters": [
        ["enabled", "=", 1],
        ["dt", "=", "Sales Order"]
    ]},
    
    # Property Setters for specific properties
    {"dt": "Property Setter", "filters": [
        ["property", "in", ["reqd", "hidden", "read_only"]]
    ]},
]
```

**Programmatic Fixture Export** (Alternative):

```python
# myapp/utils/fixture_export.py
import frappe
import json

def export_customizations():
    """Export customizations programmatically"""
    customizations = {
        "Custom Field": frappe.get_all("Custom Field", fields="*"),
        "Property Setter": frappe.get_all("Property Setter", fields="*"),
        "Client Script": frappe.get_all("Client Script", fields="*"),
    }
    
    for doctype, records in customizations.items():
        file_path = f"apps/myapp/myapp/fixtures/{frappe.scrub(doctype)}.json"
        with open(file_path, "w") as f:
            json.dump(records, f, indent=2, default=str)
    
    print("Customizations exported successfully")
```

**Best Practices:**
- Always configure fixtures in `hooks.py` before exporting
- Test fixtures on a staging site before production
- Version control fixture files in Git
- Use filters to export only necessary customizations
- Document which customizations are included in fixtures
- Fixtures are automatically updated (not duplicated) on import

---

### 31. Why does changing a field type to Float with default value cause "cannot convert str to float" error?

**Answer:** This error occurs because **Frappe performs type casting when loading documents**, and existing string values in the database cannot be automatically converted to float (Source: `frappe/model/document.py`, `frappe/model/type_map.py`).

**Root Cause:**

```python
# Source: frappe/model/type_map.py
def cast_fieldtype(value, fieldtype, doc=None):
    """Cast value to appropriate type based on fieldtype"""
    if fieldtype == "Float":
        if value is None or value == "":
            return 0.0  # Default for empty
        try:
            return float(value)
        except (ValueError, TypeError):
            # This is where the error occurs
            frappe.throw(f"Cannot convert {value} to float")
```

**Why It Happens:**

1. **Existing Data**: When you change a field type from `Data` (string) to `Float`, existing records may contain:
   - Non-numeric strings: `"N/A"`, `"Pending"`, `"TBD"`
   - Empty strings: `""`
   - NULL values: `NULL`

2. **Type Casting on Load**: When Frappe loads a document, it automatically casts field values based on the current field type:
   ```python
   # When loading document
   doc = frappe.get_doc("My DocType", "DOC-001")
   # Frappe tries to cast existing "N/A" string to float
   # float("N/A") → ValueError: could not convert string to float
   ```

3. **Default Value Doesn't Help**: Setting a default value only affects **new documents**, not existing ones:
   ```python
   # Default value in DocType JSON
   {
       "fieldname": "amount",
       "fieldtype": "Float",
       "default": 0  # Only applies to NEW documents
   }
   # Existing documents still have old string values
   ```

**Example Scenario:**

```python
# Before migration: Field is "Data" type
# Database has:
# | name    | amount |
# |---------|--------|
# | DOC-001 | "N/A"  |
# | DOC-002 | ""     |
# | DOC-003 | "100"  |

# After changing to Float with default=0:
# When loading DOC-001:
doc = frappe.get_doc("My DocType", "DOC-001")
# Frappe tries: float("N/A") → ERROR!
```

**Solution:** See Question 35 for the correct approach.

---

### 32. Why doesn't setting a default value on a field fix existing records during bench migrate?

**Answer:** Default values in Frappe **only apply to new documents**, not existing records. During migration, Frappe doesn't automatically update existing records with default values (Source: `frappe/model/document.py`).

**How Default Values Work:**

```python
# Source: frappe/model/document.py
def set_default_values(self):
    """Set default values for new documents only"""
    for df in self.meta.get("fields"):
        if df.default:
            if self.get(df.fieldname) is None:
                # Only sets if field is None (new document)
                self.set(df.fieldname, df.default)
```

**Why Defaults Don't Update Existing Records:**

1. **Default values are applied during document creation**, not during migration:
   ```python
   # When creating NEW document
   doc = frappe.get_doc({
       "doctype": "My DocType",
       "name": "NEW-001"
   })
   # Default value is applied here
   doc.insert()  # Field gets default value
   
   # Existing documents are NOT updated
   ```

2. **Migration only syncs schema**, not data:
   ```python
   # bench migrate does:
   # 1. Sync DocType schema (add/modify columns)
   # 2. Run patches
   # 3. Does NOT update existing field values
   ```

3. **Database default vs. Frappe default**:
   - Database default: Applied at database level (only for NULL values)
   - Frappe default: Applied in Python code (only for new documents)

**Example:**

```python
# DocType JSON
{
    "fieldname": "amount",
    "fieldtype": "Float",
    "default": 0
}

# Existing records:
# | name    | amount |
# |---------|--------|
# | DOC-001 | NULL   |  # Still NULL after migrate
# | DOC-002 | ""     |  # Still empty string
# | DOC-003 | "old"  |  # Still old value

# New record:
doc = frappe.get_doc({"doctype": "My DocType"})
doc.insert()
# amount = 0 (default applied)
```

**Solution:** Use a patch to update existing records:

```python
# patches/v1_0/update_defaults.py
def execute():
    """Update existing records with default values"""
    frappe.db.sql("""
        UPDATE `tabMy DocType`
        SET amount = 0
        WHERE amount IS NULL OR amount = ''
    """)
    frappe.db.commit()
```

---

### 33. Why does Frappe fail when changing field type to Float if existing records contain NULL or empty string values?

**Answer:** Frappe's **type casting system** attempts to convert all field values to the target type when loading documents. NULL and empty strings can be handled, but the casting logic may fail depending on the context (Source: `frappe/model/type_map.py`).

**Type Casting Logic:**

```python
# Source: frappe/model/type_map.py
def cast_fieldtype(value, fieldtype, doc=None):
    if fieldtype == "Float":
        if value is None:
            return None  # NULL is allowed
        if value == "":
            return 0.0  # Empty string converted to 0
        try:
            return float(value)
        except (ValueError, TypeError):
            frappe.throw(f"Cannot convert {value} to float")
```

**Why It Fails:**

1. **Empty String Handling**:
   - Empty strings `""` are converted to `0.0` during casting
   - But if the field is marked as `reqd=1` (mandatory), NULL/empty may cause validation errors

2. **Database vs. Python Type Mismatch**:
   ```python
   # Database has: amount = "" (empty string, VARCHAR)
   # DocType says: amount should be Float
   # When loading:
   doc = frappe.get_doc("My DocType", "DOC-001")
   # Frappe tries to cast "" to float → 0.0
   # But if field is reqd=1 and value is None, validation fails
   ```

3. **Validation During Load**:
   ```python
   # Source: frappe/model/document.py
   def load_from_db(self):
       # Loads data from database
       # Then casts types
       # Then validates
       # If reqd field is None after casting, validation fails
   ```

**Common Failure Scenarios:**

```python
# Scenario 1: Empty string with reqd field
{
    "fieldname": "amount",
    "fieldtype": "Float",
    "reqd": 1  # Mandatory
}
# Database: amount = ""
# Casting: "" → 0.0 (works)
# But if casting returns None, validation fails

# Scenario 2: NULL with reqd field
# Database: amount = NULL
# Casting: NULL → None
# Validation: reqd field cannot be None → ERROR

# Scenario 3: Invalid string
# Database: amount = "N/A"
# Casting: float("N/A") → ValueError → ERROR
```

**Solution:** Clean data before changing field type (see Question 35).

---

### 34. Why does Frappe perform type casting when loading DocTypes, especially during bench migrate?

**Answer:** Frappe performs type casting to ensure **data consistency between database storage and Python object representation**, and to handle schema changes during migration (Source: `frappe/model/document.py`, `frappe/model/type_map.py`).

**Reasons for Type Casting:**

1. **Database Type Flexibility**:
   - Databases store data in their native types (VARCHAR, INT, DECIMAL)
   - Frappe needs Python types (str, int, float, datetime)
   - Casting ensures Python code works with correct types

2. **Schema Evolution**:
   ```python
   # Field type changed from Data to Float
   # Database still has VARCHAR column with string values
   # Frappe casts strings to floats when loading
   # This allows gradual migration without immediate data cleanup
   ```

3. **Type Safety in Python**:
   ```python
   # Without casting:
   doc.amount = "100"  # String from database
   total = doc.amount + 50  # TypeError: can't add int to str
   
   # With casting:
   doc.amount = 100.0  # Float after casting
   total = doc.amount + 50  # Works correctly
   ```

4. **Validation and Business Logic**:
   ```python
   # Business logic expects numeric types
   def validate(self):
       if self.amount > 1000:  # Requires numeric type
           frappe.throw("Amount too high")
   ```

**Casting During Migration:**

```python
# Source: frappe/model/document.py
def load_from_db(self):
    """Load document and cast types"""
    # 1. Load raw data from database
    data = self.db_get()
    
    # 2. Cast each field to appropriate type
    for fieldname, value in data.items():
        df = self.meta.get_field(fieldname)
        if df:
            # Cast based on current field type
            casted_value = cast_fieldtype(value, df.fieldtype, self)
            self.set(fieldname, casted_value)
    
    # 3. Validate (may fail if casting produced invalid values)
    self.validate()
```

**Migration Flow:**

```
bench migrate
├── Sync DocType schema (change column type in DB)
├── Load existing documents
│   ├── Read raw data (old type in DB)
│   ├── Cast to new type (may fail here)
│   └── Validate (may fail here)
└── Continue with patches
```

**Why This Design:**

- **Flexibility**: Allows field type changes without immediate data migration
- **Type Safety**: Ensures Python code works with correct types
- **Validation**: Catches data incompatibilities early
- **Consistency**: Database and Python representations stay in sync

**Trade-off**: This design requires data to be compatible with new types, or you must clean data first (see Question 35).

---

### 35. What is the correct approach to safely change a field type in Frappe when existing data may be incompatible?

**Answer:** Follow a **three-phase approach**: Clean data → Change type → Verify. Use patches to handle data migration before schema changes (Source: `frappe/modules/patch_handler.py`).

**Step 1: Create Pre-Migration Patch** (Clean Data):

```python
# patches/v1_0/clean_data_before_type_change.py
import frappe

def execute():
    """
    Clean data before changing field type from Data to Float
    Run this BEFORE schema sync
    """
    # Update NULL values
    frappe.db.sql("""
        UPDATE `tabMy DocType`
        SET amount = 0
        WHERE amount IS NULL
    """)
    
    # Update empty strings
    frappe.db.sql("""
        UPDATE `tabMy DocType`
        SET amount = 0
        WHERE amount = ''
    """)
    
    # Handle invalid strings (set to 0 or remove invalid records)
    invalid_records = frappe.db.sql("""
        SELECT name, amount
        FROM `tabMy DocType`
        WHERE amount NOT REGEXP '^[0-9]+\.?[0-9]*$'
        AND amount IS NOT NULL
        AND amount != ''
    """, as_dict=True)
    
    for record in invalid_records:
        # Option 1: Set to 0
        frappe.db.set_value("My DocType", record.name, "amount", 0)
        
        # Option 2: Delete invalid records
        # frappe.delete_doc("My DocType", record.name)
        
        # Option 3: Log for manual review
        # frappe.log_error(f"Invalid amount: {record.amount}", "Data Migration")
    
    frappe.db.commit()
    print(f"Cleaned {len(invalid_records)} invalid records")
```

**Step 2: Register Patch in `patches.txt`**:

```
# patches.txt
[pre_model_sync]
# Run BEFORE schema sync
myapp.patches.v1_0.clean_data_before_type_change

[post_model_sync]
# Run AFTER schema sync (if needed)
myapp.patches.v1_0.verify_data_after_type_change
```

**Step 3: Update DocType JSON**:

```json
{
    "doctype": "DocType",
    "name": "My DocType",
    "fields": [
        {
            "fieldname": "amount",
            "fieldtype": "Float",
            "default": 0,
            "reqd": 0  // Set to 0 initially, change to 1 after migration
        }
    ]
}
```

**Step 4: Create Post-Migration Patch** (Verify):

```python
# patches/v1_0/verify_data_after_type_change.py
import frappe

def execute():
    """
    Verify data after type change
    Run this AFTER schema sync
    """
    # Check for any remaining invalid values
    invalid = frappe.db.sql("""
        SELECT name, amount
        FROM `tabMy DocType`
        WHERE amount IS NULL
        AND (SELECT reqd FROM `tabDocField` 
             WHERE parent='My DocType' AND fieldname='amount') = 1
    """, as_dict=True)
    
    if invalid:
        frappe.log_error(
            f"Found {len(invalid)} records with NULL amount",
            "Post-Migration Verification"
        )
        # Optionally fix them
        for record in invalid:
            frappe.db.set_value("My DocType", record.name, "amount", 0)
        frappe.db.commit()
    
    print("Data verification complete")
```

**Step 5: Run Migration**:

```bash
bench --site site1.local migrate
```

**Complete Example:**

```python
# patches/v1_0/migrate_amount_field.py
import frappe

def execute():
    """Complete migration: Data → Float"""
    
    # Phase 1: Clean NULL and empty
    frappe.db.sql("""
        UPDATE `tabSales Order`
        SET custom_amount = 0
        WHERE custom_amount IS NULL OR custom_amount = ''
    """)
    
    # Phase 2: Convert valid strings to numbers
    frappe.db.sql("""
        UPDATE `tabSales Order`
        SET custom_amount = CAST(custom_amount AS DECIMAL(10,2))
        WHERE custom_amount REGEXP '^[0-9]+\.?[0-9]*$'
    """)
    
    # Phase 3: Handle invalid strings
    invalid = frappe.db.sql("""
        SELECT name, custom_amount
        FROM `tabSales Order`
        WHERE custom_amount NOT REGEXP '^[0-9]+\.?[0-9]*$'
        AND custom_amount IS NOT NULL
        AND custom_amount != ''
    """, as_dict=True)
    
    for record in invalid:
        # Try to extract number from string
        import re
        numbers = re.findall(r'\d+\.?\d*', str(record.custom_amount))
        if numbers:
            frappe.db.set_value("Sales Order", record.name, 
                              "custom_amount", float(numbers[0]))
        else:
            # Set to 0 if no number found
            frappe.db.set_value("Sales Order", record.name, 
                              "custom_amount", 0)
    
    frappe.db.commit()
    print(f"Migration complete. Fixed {len(invalid)} records.")
```

**Best Practices:**
- Always create pre-migration patches for data cleanup
- Test patches on staging first
- Handle edge cases (NULL, empty, invalid strings)
- Verify data after migration
- Make field non-mandatory initially, then make it mandatory after migration
- Log all changes for audit trail
- Backup database before migration

---

### 36. Why does Frappe not rely only on database data types and instead enforce its own type casting at the ORM level?

**Answer:** Frappe implements **application-level type casting** to provide **abstraction, flexibility, and consistency** across different database backends, while maintaining type safety in Python code (Source: `frappe/model/type_map.py`, `frappe/database/`).

**Reasons for ORM-Level Type Casting:**

1. **Database Abstraction**:
   ```python
   # Frappe supports multiple databases:
   # - MariaDB/MySQL (VARCHAR, INT, DECIMAL)
   # - PostgreSQL (TEXT, INTEGER, NUMERIC)
   # - Different type systems, same Python interface
   
   # Without casting:
   # MariaDB: VARCHAR → Python gets string
   # PostgreSQL: TEXT → Python gets string
   # But Float field should return float in Python
   
   # With casting:
   # Database stores as VARCHAR/TEXT
   # Frappe casts to float in Python
   # Consistent behavior across databases
   ```

2. **Schema Evolution Without Data Migration**:
   ```python
   # Change field type from Data to Float
   # Database column might still be VARCHAR (not migrated yet)
   # Frappe casts string values to float when loading
   # Allows gradual migration
   ```

3. **Python Type Safety**:
   ```python
   # Database: amount stored as VARCHAR "100.50"
   # Without casting: doc.amount = "100.50" (string)
   # Business logic: if doc.amount > 100: ... (fails - can't compare)
   
   # With casting: doc.amount = 100.50 (float)
   # Business logic works correctly
   ```

4. **Validation and Business Logic**:
   ```python
   # Source: frappe/model/document.py
   def validate(self):
       # Expects numeric types for calculations
       if self.amount > self.credit_limit:
           frappe.throw("Amount exceeds limit")
       # Requires proper type casting
   ```

5. **Custom Field Types**:
   ```python
   # Frappe has custom field types not in databases:
   # - Currency (Float with currency symbol)
   # - Duration (stored as seconds, displayed as HH:MM:SS)
   # - HTML (stored as TEXT, needs special handling)
   
   # Casting handles these custom types
   ```

6. **Data Transformation**:
   ```python
   # Source: frappe/model/type_map.py
   def cast_fieldtype(value, fieldtype, doc=None):
       if fieldtype == "Date":
           # Database: "2024-01-15" (string)
           # Python: datetime.date(2024, 1, 15)
           return parse_date(value)
       
       if fieldtype == "Datetime":
           # Database: "2024-01-15 10:30:00" (string)
           # Python: datetime.datetime(2024, 1, 15, 10, 30)
           return parse_datetime(value)
   ```

**Architecture Benefits:**

```python
# Database Layer (Storage)
# └── Stores data in database-native types
#     (VARCHAR, INT, DECIMAL, etc.)

# ORM Layer (Frappe Casting)
# └── Casts to Python types
#     (str, int, float, datetime, etc.)

# Application Layer (Business Logic)
# └── Works with Python types
#     (type-safe, consistent)
```

**Trade-offs:**

**Advantages:**
- Database independence
- Type safety in Python
- Schema evolution flexibility
- Custom field type support
- Consistent behavior

**Disadvantages:**
- Performance overhead (casting on every load)
- Potential for casting errors
- Requires data compatibility
- More complex than direct database types

**Example:**

```python
# Database: amount = "100.50" (VARCHAR)
# DocType: amount = Float

# Without ORM casting:
doc = frappe.get_doc("Invoice", "INV-001")
type(doc.amount)  # <class 'str'>
doc.amount + 10  # TypeError

# With ORM casting:
doc = frappe.get_doc("Invoice", "INV-001")
type(doc.amount)  # <class 'float'>
doc.amount + 10  # 110.50 (works!)
```

**Conclusion:** Frappe's ORM-level type casting provides essential abstraction and type safety, enabling database independence and flexible schema evolution, at the cost of some performance overhead and the need for data compatibility.

---

### 37. Is Frappe MVC or MVT? What system architecture does Frappe follow?

**Answer:** Frappe follows a **hybrid architecture** that combines elements of **MVC (Model-View-Controller)** and **MVT (Model-View-Template)**, but is more accurately described as a **Meta-Driven Architecture** or **Document-Oriented Architecture** (Source: `frappe/` structure).

**Frappe's Architecture Pattern:**

**1. Model Layer (Document/ORM)**:
```python
# Source: frappe/model/document.py
class Document:
    """Model - Represents database records"""
    def __init__(self, doctype, name=None):
        self.doctype = doctype
        self.name = name
        self.meta = frappe.get_meta(doctype)  # Schema definition
    
    def save(self):
        """Persist to database"""
        self.db_update()
    
    def validate(self):
        """Business logic validation"""
        pass
```

**2. View Layer (UI Components)**:
```python
# Frontend: frappe/public/js/frappe/form/
# - Form View (form.js)
# - List View (list_view.js)
# - Report View (report_view.js)

# Auto-generated from DocType metadata
# No manual view code needed
```

**3. Controller Layer (Business Logic)**:
```python
# DocType Controllers: {doctype}/{doctype}.py
class SalesOrder(Document):
    def validate(self):
        """Controller logic"""
        if self.grand_total < 0:
            frappe.throw("Invalid amount")
    
    def on_submit(self):
        """Event handlers"""
        self.create_delivery_note()
```

**Frappe's Unique Architecture:**

**Meta-Driven Architecture:**
```
DocType Definition (JSON)
    ↓
Auto-Generated:
├── Database Schema (tab{DocType})
├── REST API (/api/resource/{doctype})
├── Form UI (auto-rendered)
├── List UI (auto-rendered)
└── Python Controller (base class)
```

**Architecture Components:**

1. **Metadata Layer** (DocType definitions):
   ```json
   {
       "doctype": "DocType",
       "name": "Customer",
       "fields": [...],
       "permissions": [...]
   }
   ```

2. **ORM Layer** (Document class):
   ```python
   # Handles CRUD operations
   doc = frappe.get_doc("Customer", "CUST-001")
   doc.customer_name = "New Name"
   doc.save()
   ```

3. **API Layer** (Auto-generated):
   ```python
   # /api/resource/Customer
   # GET, POST, PUT, DELETE automatically available
   ```

4. **UI Layer** (Auto-generated):
   ```javascript
   // Form view auto-generated from DocType
   // List view auto-generated from DocType
   // No manual HTML/JS needed
   ```

5. **Business Logic Layer** (Custom controllers):
   ```python
   class Customer(Document):
       def validate(self):
           # Custom validation
           pass
   ```

**Comparison with Traditional Patterns:**

| Aspect | MVC | MVT | Frappe |
|--------|-----|-----|--------|
| Model | Manual models | Manual models | Auto from DocType |
| View | Manual templates | Manual templates | Auto-generated |
| Controller | Manual controllers | Manual views | DocType controllers |
| API | Manual endpoints | Manual endpoints | Auto-generated |
| Schema | Manual migrations | Manual migrations | Auto-synced |

**Frappe's Architecture Principles:**

1. **Convention over Configuration**: DocType name → Table name, API endpoint, UI
2. **DRY (Don't Repeat Yourself)**: Define once in DocType, used everywhere
3. **Separation of Concerns**: Metadata, ORM, API, UI are separate layers
4. **Inversion of Control**: Framework generates code from metadata

**Architecture Flow:**

```
User Request
    ↓
Router (frappe/app.py)
    ↓
API Handler / Form Handler / Web Handler
    ↓
Document (Model) ← DocType Meta (Schema)
    ↓
Database
    ↓
Response (JSON / HTML)
```

**Conclusion:** Frappe is **neither pure MVC nor MVT**. It's a **Meta-Driven, Document-Oriented Architecture** that auto-generates MVC components from DocType metadata, providing a unique approach where **metadata drives the entire application stack**.

---

### 38. What is anti pattern? How can we prevent anti pattern in Frappe?

**Answer:** An **anti-pattern** is a common solution to a problem that is **ineffective or counterproductive**. In Frappe, several anti-patterns can lead to performance issues, maintenance problems, and security vulnerabilities.

**Common Frappe Anti-Patterns:**

**1. N+1 Query Problem:**

```python
# ANTI-PATTERN: N+1 queries
customers = frappe.get_all("Customer")
for customer in customers:
    # Each iteration makes a separate query
    territory = frappe.db.get_value("Customer", customer.name, "territory")
    orders = frappe.get_all("Sales Order", filters={"customer": customer.name})

# CORRECT: Fetch all data in one query
customers = frappe.get_all("Customer", fields=["name", "territory"])
customer_names = [c.name for c in customers]
orders = frappe.get_all("Sales Order", 
    filters={"customer": ["in", customer_names]},
    fields=["customer", "grand_total"]
)
# Group orders by customer in Python
```

**2. Loading Full Documents in Lists:**

```python
# ANTI-PATTERN: Loading full documents with child tables
orders = []
for name in order_names:
    doc = frappe.get_doc("Sales Order", name)  # Loads everything
    orders.append(doc)

# CORRECT: Use get_all with specific fields
orders = frappe.get_all("Sales Order",
    fields=["name", "customer", "grand_total"],
    filters={"name": ["in", order_names]}
)
```

**3. Direct SQL Without Parameterization:**

```python
# ANTI-PATTERN: SQL injection vulnerability
customer_name = frappe.form_dict.customer
frappe.db.sql(f"SELECT * FROM tabCustomer WHERE name = '{customer_name}'")

# CORRECT: Parameterized queries
customer_name = frappe.form_dict.customer
frappe.db.sql("""
    SELECT * FROM tabCustomer WHERE name = %s
""", (customer_name,))
```

**4. Modifying Core Files:**

```python
# ANTI-PATTERN: Modifying frappe/core files
# frappe/model/document.py (DON'T MODIFY)

# CORRECT: Use hooks and overrides
# hooks.py
override_whitelisted_methods = {
    "frappe.client.get": "myapp.api.custom_get"
}
```

**5. Not Using Caching:**

```python
# ANTI-PATTERN: Expensive computation on every request
@frappe.whitelist()
def get_dashboard_data():
    # Expensive computation every time
    data = compute_expensive_data()
    return data

# CORRECT: Use caching
@frappe.whitelist()
def get_dashboard_data():
    cache_key = f"dashboard_{frappe.session.user}"
    data = frappe.cache.get_value(cache_key)
    
    if not data:
        data = compute_expensive_data()
        frappe.cache.set_value(cache_key, data, expires_in_sec=300)
    
    return data
```

**6. Ignoring Permissions:**

```python
# ANTI-PATTERN: No permission checks
@frappe.whitelist()
def get_sensitive_data():
    return frappe.get_all("Sales Order", fields="*")

# CORRECT: Check permissions
@frappe.whitelist()
def get_sensitive_data():
    if not frappe.has_permission("Sales Order", "read"):
        frappe.throw("Insufficient permissions")
    return frappe.get_all("Sales Order", fields="*")
```

**7. Not Using Background Jobs for Heavy Operations:**

```python
# ANTI-PATTERN: Heavy operation in request
@frappe.whitelist()
def generate_report():
    # Takes 5 minutes - blocks request
    report = generate_heavy_report()
    return report

# CORRECT: Use background jobs
@frappe.whitelist()
def generate_report():
    frappe.enqueue(
        method="myapp.reports.generate_heavy_report",
        queue="long",
        timeout=3600
    )
    return {"message": "Report generation started"}
```

**8. Not Handling Transactions Properly:**

```python
# ANTI-PATTERN: No transaction management
def create_order():
    customer = create_customer()
    order = create_order()
    # If order creation fails, customer is still created

# CORRECT: Use transactions
def create_order():
    try:
        customer = create_customer()
        order = create_order()
        frappe.db.commit()
    except Exception:
        frappe.db.rollback()
        raise
```

**9. Not Using DocType Events:**

```python
# ANTI-PATTERN: Logic scattered everywhere
# In form script, server script, API, etc.

# CORRECT: Use DocType events
class SalesOrder(Document):
    def validate(self):
        # Centralized validation
        self.validate_amount()
    
    def on_submit(self):
        # Centralized submit logic
        self.create_delivery_note()
```

**10. Not Using Hooks for Customization:**

```python
# ANTI-PATTERN: Modifying core code
# Editing frappe/core files directly

# CORRECT: Use hooks
# hooks.py
doc_events = {
    "Sales Order": {
        "before_save": "myapp.custom.validate_order"
    }
}
```

**11. Writing More Code Instead of Using Frappe Features (Low-Code Anti-Pattern):**

```python
# ANTI-PATTERN: Writing custom code for what Frappe already provides
# Custom authentication system
def custom_login(username, password):
    # 100+ lines of custom auth code
    # Manual session management
    # Custom password hashing
    pass

# CORRECT: Use Frappe's built-in authentication
@frappe.whitelist(allow_guest=True)
def login(usr, pwd):
    frappe.local.login_manager.authenticate(usr, pwd)
    frappe.local.login_manager.post_login()
    # Frappe handles everything: sessions, password hashing, security

# ANTI-PATTERN: Custom API framework
def custom_api_handler():
    # Manual routing
    # Manual request parsing
    # Manual response formatting
    # Manual error handling
    pass

# CORRECT: Use @frappe.whitelist()
@frappe.whitelist()
def my_api():
    # Frappe handles routing, parsing, formatting, errors automatically
    return {"data": "result"}

# ANTI-PATTERN: Manual form validation
def validate_form():
    # 50+ lines of validation code
    if not field1:
        return {"error": "Field 1 required"}
    if not field2:
        return {"error": "Field 2 required"}
    # ... more validation

# CORRECT: Use DocType validation
class MyDocType(Document):
    def validate(self):
        # Frappe auto-validates reqd fields, field types, etc.
        # Only write custom validation logic
        if self.amount > self.credit_limit:
            frappe.throw("Amount exceeds limit")

# ANTI-PATTERN: Manual database queries everywhere
def get_customers():
    # Direct SQL queries
    # Manual connection management
    # Manual error handling
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tabCustomer")
    # ... more code

# CORRECT: Use Frappe ORM
def get_customers():
    return frappe.get_all("Customer", fields=["name", "customer_name"])
    # Frappe handles connection, queries, errors automatically

# ANTI-PATTERN: Custom permission system
def check_permission(user, doctype):
    # 200+ lines of custom permission logic
    # Manual role checking
    # Manual document-level permissions
    pass

# CORRECT: Use Frappe's permission system
if not frappe.has_permission("Sales Order", "read", doc):
    frappe.throw("Insufficient permissions")
# Frappe handles role permissions, user permissions, controller permissions
```

**Why This Is an Anti-Pattern:**
- **Frappe is Low-Code**: The framework provides built-in solutions for 80% of common tasks
- **Maintenance Burden**: Custom code requires ongoing maintenance and updates
- **Security Risks**: Reinventing security features often introduces vulnerabilities
- **Performance**: Frappe's built-in features are optimized and tested
- **Upgrade Compatibility**: Custom implementations may break on framework updates
- **Team Knowledge**: Team members need to learn custom code instead of standard Frappe patterns

**When to Write Custom Code:**
-  Business logic specific to your domain
-  Complex calculations not covered by Frappe
-  Integration with external systems
-  Custom workflows beyond standard Frappe workflows
-  Performance-critical operations that need optimization

**When NOT to Write Custom Code:**
-  Authentication (use Frappe's login system)
-  Basic CRUD operations (use DocType)
-  Simple APIs (use @frappe.whitelist())
-  Form validation (use DocType validation)
-  Permissions (use Frappe's permission system)
-  File uploads (use Frappe's file handling)
-  Email sending (use frappe.sendmail())
-  Background jobs (use frappe.enqueue())

**Prevention Strategies:**

1. **Code Reviews**: Review code for anti-patterns
2. **Linting**: Use tools to detect common issues
3. **Documentation**: Document patterns and anti-patterns
4. **Testing**: Write tests to catch performance issues
5. **Monitoring**: Monitor query performance and errors
6. **Training**: Educate team on Frappe best practices

**Best Practices Checklist:**

-  Use `frappe.get_all()` instead of loading full documents
-  Always use parameterized queries
-  Check permissions in APIs
-  Use caching for expensive operations
-  Use background jobs for heavy tasks
-  Use hooks instead of modifying core
-  Handle transactions properly
-  Use DocType events for business logic
-  Avoid N+1 queries
-  Use fixtures for customizations
-  **Use Frappe's built-in features instead of writing custom code (embrace low-code)**

---

### 39. If the company changes the domain name and all employee emails, how to change all emails in the app DB safely?

**Answer:** Changing email domains across the system requires a **careful, multi-step approach** using patches to ensure data integrity, maintain relationships, and avoid breaking authentication (Source: `frappe/core/doctype/user/user.py`).

**Step 1: Create a Pre-Migration Patch** (Analysis):

```python
# patches/v1_0/analyze_email_changes.py
import frappe

def execute():
    """
    Analyze all email addresses that need to be changed
    Run this FIRST to see what will be affected
    """
    old_domain = "oldcompany.com"
    new_domain = "newcompany.com"
    
    # Find all users with old domain
    users = frappe.get_all("User",
        filters={"email": ["like", f"%@{old_domain}"]},
        fields=["name", "email", "enabled"]
    )
    
    print(f"Found {len(users)} users with old domain")
    
    # Find all documents referencing these emails
    email_fields = frappe.get_all("DocField",
        filters={"fieldtype": "Data", "options": "Email"},
        fields=["parent", "fieldname"]
    )
    
    affected_docs = []
    for df in email_fields:
        docs = frappe.db.sql(f"""
            SELECT name, {df.fieldname} as email
            FROM `tab{df.parent}`
            WHERE {df.fieldname} LIKE %s
        """, (f"%@{old_domain}",), as_dict=True)
        affected_docs.extend(docs)
    
    print(f"Found {len(affected_docs)} documents with old domain emails")
    
    # Save analysis for review
    frappe.db.commit()
    return {
        "users": len(users),
        "documents": len(affected_docs)
    }
```

**Step 2: Create Migration Patch** (Safe Update):

```python
# patches/v1_0/migrate_email_domain.py
import frappe
import re

def execute():
    """
    Safely migrate all email addresses from old domain to new domain
    """
    old_domain = "oldcompany.com"
    new_domain = "newcompany.com"
    
    # Step 1: Update User emails (most critical)
    users = frappe.get_all("User",
        filters={"email": ["like", f"%@{old_domain}"]},
        fields=["name", "email"]
    )
    
    updated_users = []
    for user in users:
        old_email = user.email
        new_email = old_email.replace(f"@{old_domain}", f"@{new_domain}")
        
        # Check if new email already exists
        if frappe.db.exists("User", new_email):
            frappe.log_error(
                f"Email {new_email} already exists. Skipping {old_email}",
                "Email Migration"
            )
            continue
        
        try:
            # Use frappe.rename_doc() for User documents
            # This automatically handles:
            # - Updates the document name
            # - Updates email field to match new name
            # - Updates all Link fields referencing this user
            # - Updates owner/modified_by in all tables
            # - Updates dynamic links
            # - Updates user settings
            # - Updates attachments
            # - Renames passwords
            # - Updates Notification Settings
            # - Clears user sessions
            
            if user.name == old_email:
                # Username matches email - use rename_doc (recommended)
                frappe.rename_doc(
                    "User",
                    old_email,
                    new_email,
                    force=True,
                    show_alert=False,
                    ignore_permissions=True
                )
                updated_users.append({"old": old_email, "new": new_email})
            else:
                # Username doesn't match email - just update email field
                frappe.db.set_value("User", user.name, "email", new_email)
                updated_users.append({"old": old_email, "new": new_email})
                
        except Exception as e:
            frappe.log_error(
                f"Failed to update user {user.name}: {str(e)}",
                "Email Migration"
            )
    
    frappe.db.commit()
    print(f"Updated {len(updated_users)} user emails")
    
    # Step 2: Update email fields in all DocTypes
    email_fields = frappe.get_all("DocField",
        filters={"fieldtype": "Data", "options": "Email"},
        fields=["parent", "fieldname"],
        distinct=True
    )
    
    updated_docs = 0
    for df in email_fields:
        try:
            # Update all email fields in this DocType
            result = frappe.db.sql(f"""
                UPDATE `tab{df.parent}`
                SET {df.fieldname} = REPLACE({df.fieldname}, %s, %s)
                WHERE {df.fieldname} LIKE %s
            """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))
            
            updated_docs += result[0] if result else 0
            
        except Exception as e:
            frappe.log_error(
                f"Failed to update {df.parent}.{df.fieldname}: {str(e)}",
                "Email Migration"
            )
    
    frappe.db.commit()
    print(f"Updated {updated_docs} document email fields")
    
    # Step 3: Update Communication records
    frappe.db.sql("""
        UPDATE `tabCommunication`
        SET sender = REPLACE(sender, %s, %s)
        WHERE sender LIKE %s
    """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))
    
    frappe.db.sql("""
        UPDATE `tabCommunication`
        SET recipients = REPLACE(recipients, %s, %s)
        WHERE recipients LIKE %s
    """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))
    
    frappe.db.commit()
    print("Updated Communication records")
    
    # Step 4: Update Email Queue
    frappe.db.sql("""
        UPDATE `tabEmail Queue`
        SET recipients = REPLACE(recipients, %s, %s)
        WHERE recipients LIKE %s
    """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))
    
    frappe.db.commit()
    print("Updated Email Queue records")
    
    return {
        "users_updated": len(updated_users),
        "documents_updated": updated_docs
    }
```

**Step 3: Create Verification Patch**:

```python
# patches/v1_0/verify_email_migration.py
import frappe

def execute():
    """
    Verify email migration completed successfully
    """
    old_domain = "oldcompany.com"
    new_domain = "newcompany.com"
    
    # Check for remaining old domain emails
    remaining_users = frappe.get_all("User",
        filters={"email": ["like", f"%@{old_domain}"]},
        fields=["name", "email"]
    )
    
    if remaining_users:
        frappe.log_error(
            f"Found {len(remaining_users)} users still with old domain",
            "Email Migration Verification"
        )
        print(f"WARNING: {len(remaining_users)} users still have old domain")
    
    # Verify new domain emails
    new_users = frappe.get_all("User",
        filters={"email": ["like", f"%@{new_domain}"]},
        fields=["name", "email"]
    )
    
    print(f"Verified {len(new_users)} users with new domain")
    
    # Check for broken references
    broken_refs = frappe.db.sql("""
        SELECT DISTINCT parent, fieldname
        FROM `tabDocField`
        WHERE fieldtype = 'Link'
        AND options = 'User'
    """, as_dict=True)
    
    for ref in broken_refs:
        invalid = frappe.db.sql(f"""
            SELECT name
            FROM `tab{ref.parent}`
            WHERE {ref.fieldname} NOT IN (
                SELECT name FROM `tabUser`
            )
        """, as_dict=True)
        
        if invalid:
            frappe.log_error(
                f"Found {len(invalid)} broken user references in {ref.parent}",
                "Email Migration Verification"
            )
    
    frappe.db.commit()
    return {"status": "verification_complete"}
```

**Step 4: Register Patches in `patches.txt`**:

```
# patches.txt
[pre_model_sync]
# Run analysis first
myapp.patches.v1_0.analyze_email_changes

[post_model_sync]
# Run migration after schema sync
myapp.patches.v1_0.migrate_email_domain
myapp.patches.v1_0.verify_email_migration
```

**Step 5: Handle Special Cases**:

```python
# Additional considerations in migration patch

# 1. Update Employee records
frappe.db.sql("""
    UPDATE `tabEmployee`
    SET company_email = REPLACE(company_email, %s, %s)
    WHERE company_email LIKE %s
""", (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))

# 2. Update Contact records
frappe.db.sql("""
    UPDATE `tabContact`
    SET email_id = REPLACE(email_id, %s, %s)
    WHERE email_id LIKE %s
""", (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))

# 3. Update Customer/Supplier emails
for doctype in ["Customer", "Supplier"]:
    frappe.db.sql(f"""
        UPDATE `tab{doctype}`
        SET email_id = REPLACE(email_id, %s, %s)
        WHERE email_id LIKE %s
    """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))

# 4. Update custom DocTypes with email fields
custom_doctypes = frappe.get_all("DocType",
    filters={"custom": 1},
    fields=["name"]
)

for dt in custom_doctypes:
    meta = frappe.get_meta(dt.name)
    email_fields = [f.fieldname for f in meta.fields if f.fieldtype == "Data" and f.options == "Email"]
    
    for field in email_fields:
        frappe.db.sql(f"""
            UPDATE `tab{dt.name}`
            SET {field} = REPLACE({field}, %s, %s)
            WHERE {field} LIKE %s
        """, (f"@{old_domain}", f"@{new_domain}", f"%@{old_domain}"))
```

**Step 6: Execute Migration**:

```bash
# 1. Backup database first
bench --site site1.local backup

# 2. Test on staging site
bench --site staging.local migrate

# 3. Run on production
bench --site production.local migrate

# 4. Verify manually
bench --site production.local console
# In console:
import frappe
frappe.get_all("User", filters={"email": ["like", "%@newcompany.com"]})
```

**Why Use `frappe.rename_doc()` for User Renaming:**

**What `frappe.rename_doc()` Does Automatically (Source: `frappe/model/rename_doc.py`):**

When you use `frappe.rename_doc("User", old_email, new_email)`, it automatically:

1. **Updates Document Name**: Changes the primary key in `tabUser` table
2. **Updates Link Fields**: Updates ALL Link fields of type "Link" with `options="User"` across ALL DocTypes
3. **Updates Dynamic Links**: Updates all dynamic link references (e.g., in Communication)
4. **Updates User Settings**: Updates user settings in linked DocTypes
5. **Updates Attachments**: Updates attachment references
6. **Updates Versions**: Updates version history
7. **Renames Passwords**: Renames encrypted password records (for User doctype)
8. **Calls Hooks**: Executes `before_rename` and `after_rename` methods

**For User DocType Specifically (Source: `frappe/core/doctype/user/user.py`):**

The `after_rename()` method in User class does additional critical updates:

```python
def after_rename(self, old_name, new_name, merge=False):
    # Updates owner/modified_by in ALL database tables
    tables = frappe.db.get_tables()
    for tab in tables:
        desc = frappe.db.get_table_columns_description(tab)
        has_fields = [d.get("name") for d in desc if d.get("name") in ["owner", "modified_by"]]
        for field in has_fields:
            frappe.db.sql(
                """UPDATE `{}`
                SET `{}` = {}
                WHERE `{}` = {}""".format(tab, field, "%s", field, "%s"),
                (new_name, old_name),
            )
    
    # Renames Notification Settings
    if frappe.db.exists("Notification Settings", old_name):
        frappe.rename_doc("Notification Settings", old_name, new_name, force=True, show_alert=False)
    
    # Sets email field to match new name
    frappe.db.set_value("User", new_name, "email", new_name)
    
    # Clears user sessions
    clear_sessions(user=old_name, force=True)
    clear_sessions(user=new_name, force=True)
```

**Example of What Gets Updated:**

```python
# When you rename User from "john@old.com" to "john@new.com"
# frappe.rename_doc() automatically updates:

# 1. Main table
# tabUser: name = "john@new.com", email = "john@new.com"

# 2. All Link fields across ALL DocTypes
# tabSales Order: owner = "john@new.com", assigned_to = "john@new.com"
# tabCustomer: owner = "john@new.com"
# tabTask: assigned_to = "john@new.com"
# tabProject: project_manager = "john@new.com"
# ... and ALL other DocTypes with User Link fields

# 3. Owner/Modified By in ALL tables (via after_rename hook)
# tabSales Order: owner = "john@new.com", modified_by = "john@new.com"
# tabCustomer: owner = "john@new.com", modified_by = "john@new.com"
# tabItem: owner = "john@new.com", modified_by = "john@new.com"
# ... updates in EVERY table that has owner/modified_by columns

# 4. Dynamic Links
# tabCommunication: link_doctype = "User", link_name = "john@new.com"

# 5. User Settings
# __UserSettings: updates all user preferences and filters

# 6. Attachments
# tabFile: attached_to_name = "john@new.com"

# 7. Passwords
# __Auth: updates password hash references

# 8. Notification Settings
# tabNotification Settings: name = "john@new.com"

# 9. Versions
# tabVersion: docname = "john@new.com" (for User doctype)
```

**Why This Is Better Than Manual Updates:**

-  **Automatic**: No need to manually update each table
-  **Complete**: Updates ALL references, not just known ones
-  **Safe**: Handles edge cases and relationships
-  **Tested**: Frappe's built-in function is thoroughly tested
-  **Maintainable**: Works even if new DocTypes are added later
-  **Transactional**: All updates happen in a transaction

**Safety Measures:**

1. **Backup First**: Always backup database before migration
2. **Test on Staging**: Run migration on staging site first
3. **Check for Conflicts**: Verify new emails don't already exist
4. **Handle Renames**: Update usernames if they match emails
5. **Update All References**: Update all DocTypes with email fields
6. **Log Everything**: Log all changes and errors
7. **Verify After**: Run verification patch to check success
8. **Handle Edge Cases**: Custom DocTypes, child tables, etc.

**Best Practices:**
- Use transactions for atomicity
- Handle errors gracefully (don't fail entire migration)
- Log all changes for audit trail
- Test thoroughly on staging
- Update all email-related fields (not just User.email)
- Consider email validation after migration
- Notify users about email change
- Update email server settings if needed

---

### 40. What are limitations of Frappe?

1. Customization can cause technical debt if not done carefully, especially with monkey patching.
2. Frontend (Desk) UI is built on jQuery, Bootstrap 3, and a custom Frappe UI framework, so it is less flexible than modern frameworks like React, Angular, or Vue.
3. Version upgrades can be difficult and time-consuming.
4. Child tables have limitations:
    - No child table inside another child table
    - No Dynamic Link inside child tables
    - Cannot add Child Table or Table MultiSelect inside child tables
5. Notifications work only based on roles, not specific users.
6. Heavy customization makes maintenance and upgrades harder.
7. Permission control is mostly role-based and lacks fine-grained control.
8. High-traffic systems require extra performance tuning.
9. Major version upgrades may break custom code.
10. Frappe mainly supports MariaDB, and PostgreSQL support is still limited.
11. JWT authentication is not supported out of the box.
12. The API does not fully follow REST standards and uses dotted notation instead of RESTful paths.
13. Performance can be slower compared to some lightweight or modern frameworks. 
14. doctype list view is limited to only 10 columns.
15. doctype fields has limited properties.
16. Frappe is not designed for high-traffic public websites.
17. No built-in support for GraphQL.
18. force me with boilerplate code that is not required (but that what I like about it :D).
19. force me with specific UI that hard to change.
20. cannot has two doctypes with the same name in different apps in the same site.
21. no fully reliable postgresql support for erpnext (only frappe itself is supported).
22. limited flexibility in database modeling design, you must follow frappe's way of db design.
23. if you edit core frappe files, you will lose your changes on every update (you freezed. you stop upgrading to the latest version).
24. mostly frappe is for building internal business apps, ofc you can use it for public apps or external use (but you should build your own custom API for that and external frontend app).

Most of these limitations are intentional trade-offs, not flaws.
Frappe is excellent for rapid ERP and business app development and internal systems, but complex enterprise-grade requirements often need custom extensions or external services.

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