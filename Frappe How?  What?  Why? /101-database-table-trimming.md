# Database Table Trimming & MySQL Row Size Limits in Frappe

This guide explains database table trimming, the MySQL/MariaDB 65KB row size limitation, why Data fields consume more space than Text fields, and how to resolve the "Row size too large" error.

---

## Table of Contents

1. [Understanding the Problem](#understanding-the-problem)
2. [MySQL/MariaDB Row Size Limitation](#mysqlmariadb-row-size-limitation)
3. [Why Data Fields Take More Space Than Text](#why-data-fields-take-more-space-than-text)
4. [What is Table Trimming?](#what-is-table-trimming)
5. [Using bench trim-tables](#using-bench-trim-tables)
6. [Trim Table in Customize Form](#trim-table-in-customize-form)
7. [Solutions to Row Size Problem](#solutions-to-row-size-problem)
8. [Understanding Orphan Fields](#understanding-orphan-fields)
9. [Best Practices](#best-practices)

---

## Understanding the Problem

### The Error Message

```
Row size too large. The maximum row size for the used table type, 
not counting BLOBs, is 65535. This includes storage overhead, 
check the manual. You have to change some columns to TEXT or BLOBs
```

**What it means:**
- Your database table has exceeded MySQL/MariaDB's 65KB (65,535 bytes) row size limit
- This limit applies to the **maximum possible size** of a single row, not actual data
- BLOBs and TEXT fields are stored separately and don't count toward this limit

**When it happens:**
- Adding too many custom fields to a DocType
- Using many Data/VARCHAR fields instead of Text fields
- Customizing standard DocTypes with numerous fields

---

## MySQL/MariaDB Row Size Limitation

### The 65KB Limit

**Source:** `frappe/frappe/database/mariadb/database.py` (line 171)

```python
MAX_ROW_SIZE_LIMIT = 65_535  # bytes
```

### Why This Limit Exists

MySQL/MariaDB stores row data in **pages** (typically 16KB each). The row size limit ensures:
1. Rows can fit within database pages
2. Efficient indexing and querying
3. Proper buffer pool management

### What Counts Toward the Limit

**Included in 65KB limit:**
- `VARCHAR` columns (Data, Link, Select fields)
- `INT`, `BIGINT`, `DECIMAL` columns
- `DATE`, `DATETIME`, `TIME` columns
- Storage overhead (1-2 bytes per column)

**NOT included in 65KB limit:**
- `TEXT` columns (Small Text, Text, Long Text)
- `LONGTEXT` columns (Code, HTML Editor, Markdown Editor)
- `BLOB` columns
- `JSON` columns

### How Frappe Calculates Row Size

**Source:** `frappe/frappe/database/mariadb/database.py` (lines 497-548)

```python
def get_row_size(self, doctype: str) -> int:
    """Get estimated max row size of any table in bytes."""
    
    # Query calculates size based on data types:
    # - varchar: IF(length > 255, 2, 1) + length
    # - text: 10 bytes (pointer only)
    # - longtext: 12 bytes (pointer only)
    # - int: 4 bytes
    # - bigint: 8 bytes
    # - decimal: calculated based on precision
    # - datetime: 5 + CEIL(precision/2) bytes
```

**Example calculation:**
```python
# Get row size for a DocType
row_size = frappe.db.get_row_size("Customer")
print(f"Row size: {row_size} bytes")

# Get utilization percentage
from frappe.core.doctype.doctype.doctype import get_row_size_utilization
utilization = get_row_size_utilization("Customer")
print(f"Utilization: {utilization}%")
```

---

## Why Data Fields Take More Space Than Text

### Field Type Mapping

**Source:** `frappe/frappe/database/mariadb/database.py` (lines 173-210)

```python
type_map = {
    "Data": ("varchar", 140),        # VARCHAR(140) - 140+ bytes in row
    "Link": ("varchar", 140),        # VARCHAR(140) - 140+ bytes in row
    "Select": ("varchar", 140),      # VARCHAR(140) - 140+ bytes in row
    
    "Text": ("text", ""),            # TEXT - only 10 bytes in row
    "Small Text": ("text", ""),      # TEXT - only 10 bytes in row
    "Long Text": ("longtext", ""),   # LONGTEXT - only 12 bytes in row
    "Password": ("text", ""),        # TEXT - only 10 bytes in row
}
```

### Storage Comparison

| Frappe Field | MySQL Type | In-Row Storage | Actual Data Storage |
|--------------|------------|----------------|---------------------|
| **Data** | `VARCHAR(140)` | 140-142 bytes | In the row |
| **Link** | `VARCHAR(140)` | 140-142 bytes | In the row |
| **Select** | `VARCHAR(140)` | 140-142 bytes | In the row |
| **Text** | `TEXT` | **10 bytes** | Separate page |
| **Small Text** | `TEXT` | **10 bytes** | Separate page |
| **Long Text** | `LONGTEXT` | **12 bytes** | Separate page |

### Why This Difference?

#### VARCHAR (Data Field) Storage
```
┌─────────────────────────────────────┐
│  Row Data (in 16KB page)            │
├─────────────────────────────────────┤
│  name: VARCHAR(140)     [142 bytes] │
│  customer_name: VARCHAR(140) [142]  │
│  email: VARCHAR(140)    [142 bytes] │
│  phone: VARCHAR(140)    [142 bytes] │
│  ...                                │
└─────────────────────────────────────┘
Total: Adds up quickly!
```

#### TEXT Field Storage
```
┌─────────────────────────────────────┐
│  Row Data (in 16KB page)            │
├─────────────────────────────────────┤
│  name: VARCHAR(140)     [142 bytes] │
│  description: TEXT      [10 bytes]  │ ──┐
│  notes: TEXT            [10 bytes]  │ ──┤
│  comments: TEXT         [10 bytes]  │ ──┤
└─────────────────────────────────────┘   │
                                          │
┌─────────────────────────────────────┐   │
│  Separate Storage (overflow pages)  │ ◄─┘
├─────────────────────────────────────┤
│  description: "Long text content..."│
│  notes: "More text content..."      │
│  comments: "Even more text..."      │
└─────────────────────────────────────┘
```

### The Paradox Explained

**Why Text fields "take more space" but save row size:**

1. **In-Row Storage (what matters for 65KB limit):**
   - Data field: 140-142 bytes
   - Text field: 10 bytes
   - **Text saves 130+ bytes per field!**

2. **Total Storage (disk space):**
   - Data field: Actual string length + overhead
   - Text field: Actual string length + overhead + pointer
   - **Text uses slightly more disk space overall**

3. **The Trade-off:**
   - Use **Data** for: Short, indexed, frequently searched fields
   - Use **Text** for: Long content, descriptions, notes

---

## What is Table Trimming?

### Definition

**Table trimming** removes **orphan database columns** that no longer exist in the DocType definition but still exist in the database table.

### Why Orphan Fields Exist

When you delete a field from a DocType in Frappe:
1. ✅ The field is removed from the DocType JSON
2. ✅ The Custom Field record is deleted (if custom)
3. ❌ **The database column is NOT automatically dropped**

**Reason:** Safety - prevents accidental data loss if you delete a field by mistake.

### What are Orphan Fields?

**Orphan fields** are database columns that:
- Exist in the database table (`tab{DocType}`)
- Do NOT exist in the DocType definition
- Do NOT exist as Custom Fields
- Are not standard Frappe fields (name, owner, creation, etc.)

### How trim_table() Works

**Source:** `frappe/frappe/model/meta.py` (lines 874-890)

```python
def trim_table(doctype, dry_run=True):
    # Clear cache
    frappe.cache.hdel("table_columns", f"tab{doctype}")

    # Get fields to ignore (standard Frappe fields)
    ignore_fields = default_fields + optional_fields + child_table_fields

    # Get actual database columns
    columns = frappe.db.get_table_columns(doctype)

    # Get fields defined in DocType + Custom Fields
    fields = frappe.get_meta(doctype, cached=False).get_fieldnames_with_value()

    # Find orphan columns
    def is_internal(field):
        return field not in ignore_fields and not field.startswith("_")

    columns_to_remove = [f for f in list(set(columns) - set(fields)) if is_internal(f)]

    # Drop columns (if not dry run)
    if columns_to_remove and not dry_run:
        columns_to_remove = ", ".join(f"DROP `{c}`" for c in columns_to_remove)
        frappe.db.sql_ddl(f"ALTER TABLE `tab{doctype}` {columns_to_remove}")

    return columns_to_remove
```

### Example

```python
# Scenario: You had a custom field "old_field" that you deleted

# Database columns
columns = ["name", "owner", "creation", "customer_name", "old_field"]

# DocType fields
fields = ["name", "owner", "creation", "customer_name"]

# Orphan fields (will be dropped)
orphans = ["old_field"]
```

---

## Using bench trim-tables

### Command Syntax

**Source:** `frappe/frappe/commands/site.py` (lines 1439-1469)

```bash
# Dry run (preview what will be deleted)
bench --site [sitename] trim-tables --dry-run

# Actual execution (with backup)
bench --site [sitename] trim-tables

# Skip backup (not recommended)
bench --site [sitename] trim-tables --no-backup

# JSON output format
bench --site [sitename] trim-tables --dry-run --format json
```

### Step-by-Step Usage

#### 1. Dry Run First (Always!)

```bash
bench --site mysite.local trim-tables --dry-run
```

**Output:**
```
DocType: Customer
  - old_customer_field
  - deleted_field_1
  - deleted_field_2

DocType: Sales Order
  - legacy_field
  - unused_column
```

#### 2. Review the Output

Check if any important fields are listed. If you see fields you need:
- They might be from deleted Custom Fields
- You may need to recreate them before trimming

#### 3. Execute Trimming

```bash
# With automatic backup (recommended)
bench --site mysite.local trim-tables
```

**What happens:**
1. Creates a full site backup
2. Scans all DocTypes
3. Identifies orphan columns
4. Drops orphan columns from database
5. Shows summary of removed columns

#### 4. Verify Results

```bash
# Check specific DocType
bench --site mysite.local console
```

```python
# In console
columns = frappe.db.get_table_columns("Customer")
print(columns)

# Check row size
row_size = frappe.db.get_row_size("Customer")
print(f"Row size: {row_size} bytes")
```

### Python API Usage

```python
from frappe.model.meta import trim_tables, trim_table

# Trim all tables (dry run)
result = trim_tables(dry_run=True)
print(result)
# Output: {'Customer': ['old_field'], 'Sales Order': ['legacy_field']}

# Trim specific DocType (dry run)
orphans = trim_table("Customer", dry_run=True)
print(orphans)
# Output: ['old_field', 'deleted_field']

# Actually trim (no dry run)
trim_table("Customer", dry_run=False)
```

---

## Trim Table in Customize Form

### UI Location

1. Go to **Customize Form**
2. Select your DocType
3. Click **Actions** → **Trim Table**

### How It Works

**Source:** `frappe/frappe/custom/doctype/customize_form/customize_form.js` (lines 205-237)

```javascript
async trim_table(frm) {
    // Get orphaned columns (dry run)
    let dropped_columns = await frappe.xcall(
        "frappe.custom.doctype.customize_form.customize_form.get_orphaned_columns",
        { doctype: frm.doc.doc_type }
    );

    if (!dropped_columns?.length) {
        frappe.toast(__("This doctype has no orphan fields to trim"));
        return;
    }

    // Show warning with list of columns
    let msg = __(
        "Warning: DATA LOSS IMMINENT! Proceeding will permanently delete following database columns from doctype {0}:",
        [frm.doc.doc_type.bold()]
    );
    msg += "<ol>" + dropped_columns.map((col) => `<li>${col}</li>`).join("") + "</ol>";
    msg += __("This action is irreversible. Do you wish to continue?");

    // Confirm and execute
    frappe.confirm(msg, () => {
        return frm.call({
            doc: frm.doc,
            method: "trim_table",
            callback: function (r) {
                if (!r.exc) {
                    frappe.show_alert({
                        message: __("Table Trimmed"),
                        indicator: "green",
                    });
                    frappe.customize_form.clear_locals_and_refresh(frm);
                }
            },
        });
    });
}
```

### Server-Side Methods

**Source:** `frappe/frappe/custom/doctype/customize_form/customize_form.py` (lines 645-674)

```python
@frappe.whitelist()
def trim_table(self):
    """Removes database fields that don't exist in the doctype.

    This may be needed as maintenance since removing a field in a DocType
    doesn't automatically delete the db field.
    """
    if not self.doc_type:
        return

    trim_table(self.doc_type, dry_run=False)
    self.fetch_to_customize()

@frappe.whitelist()
def get_orphaned_columns(doctype: str):
    frappe.only_for("System Manager")
    frappe.db.begin(read_only=True)  # Avoid any potential bug from writing to db
    return trim_table(doctype, dry_run=True)
```

### Understanding frappe.db.begin(read_only=True)

```python
frappe.db.begin(read_only=True)
```

**Purpose:** Starts a **read-only transaction** to prevent accidental writes.

**Why it's used:**
- `get_orphaned_columns()` only reads data (dry run)
- Prevents bugs from accidentally modifying database
- Safety measure for preview operations

**How it works:**
1. Starts a database transaction
2. Sets transaction to read-only mode
3. Any write operations will fail
4. Transaction is rolled back after function completes

**Example:**
```python
# Without read-only (risky)
def preview_changes():
    # Bug could accidentally write to DB
    frappe.db.set_value("Customer", "CUST-001", "status", "Active")  # Oops!
    return get_preview_data()

# With read-only (safe)
def preview_changes():
    frappe.db.begin(read_only=True)
    # Any write will fail
    frappe.db.set_value("Customer", "CUST-001", "status", "Active")  # Error!
    return get_preview_data()
```

---

## Solutions to Row Size Problem

### Solution 1: Change Data Fields to Text Fields

**Best for:** Fields that don't need indexing or exact matching.

#### Step-by-Step

1. **Identify large VARCHAR fields:**
```python
# Check row size
from frappe.core.doctype.doctype.doctype import get_row_size_utilization

doctype = "Customer"
utilization = get_row_size_utilization(doctype)
print(f"Row size utilization: {utilization}%")

# Get field list
meta = frappe.get_meta(doctype)
for field in meta.fields:
    if field.fieldtype == "Data":
        print(f"{field.fieldname}: {field.fieldtype}")
```

2. **Change field type in Customize Form:**
   - Go to **Customize Form**
   - Select your DocType
   - Find the Data field
   - Change **Type** from "Data" to "Text" or "Small Text"
   - Click **Update**

3. **Or use Python:**
```python
# Change field type programmatically
from frappe.custom.doctype.property_setter.property_setter import make_property_setter

make_property_setter(
    doctype="Customer",
    fieldname="description",
    property="fieldtype",
    value="Text",
    property_type="Data"
)

# Rebuild table
frappe.db.sql("ALTER TABLE `tabCustomer` MODIFY `description` TEXT")
```

**Impact:**
- Saves 130+ bytes per field in row size
- Data remains intact
- Slightly slower for exact searches
- Cannot be indexed

### Solution 2: Remove Custom Fields

**Best for:** Unused or redundant fields.

#### Identify Unused Fields

```python
# Find custom fields with no data
doctype = "Customer"
custom_fields = frappe.get_all("Custom Field",
    filters={"dt": doctype},
    fields=["fieldname", "label"]
)

for cf in custom_fields:
    # Check if field has any data
    count = frappe.db.count(doctype, {cf.fieldname: ["is", "set"]})
    if count == 0:
        print(f"Unused field: {cf.fieldname} ({cf.label})")
```

#### Remove Custom Fields

1. **Via UI:**
   - Go to **Customize Form**
   - Select your DocType
   - Find the custom field
   - Click **Delete** (trash icon)
   - Click **Update**

2. **Via Python:**
```python
# Delete custom field
frappe.delete_doc("Custom Field", "Customer-custom_field_name")

# Then trim the table to remove the column
from frappe.model.meta import trim_table
trim_table("Customer", dry_run=False)
```

### Solution 3: Trim Orphan Columns

**Best for:** Cleaning up after deleted fields.

```python
# Check for orphan columns
from frappe.model.meta import trim_table

orphans = trim_table("Customer", dry_run=True)
print(f"Orphan columns: {orphans}")

# Remove orphan columns
if orphans:
    trim_table("Customer", dry_run=False)
    print(f"Removed {len(orphans)} orphan columns")

    # Check new row size
    new_size = frappe.db.get_row_size("Customer")
    print(f"New row size: {new_size} bytes")
```

### Solution 4: Split DocType into Related DocTypes

**Best for:** DocTypes with too many logical groupings.

#### Example: Split Customer into Customer + Customer Details

**Before:**
```
Customer (65KB+ row size)
├── Basic Info (name, customer_name, email, phone)
├── Address Info (address_line1, address_line2, city, state, zip, country)
├── Tax Info (tax_id, tax_category, tax_exemption_reason)
├── Payment Info (payment_terms, credit_limit, credit_days)
├── Shipping Info (shipping_address, shipping_contact, shipping_notes)
└── Custom Fields (50+ custom fields)
```

**After:**
```
Customer (main table - reduced size)
├── Basic Info (name, customer_name, email, phone)
└── customer_details (Link to Customer Details)

Customer Details (child table)
├── Address Info
├── Tax Info
├── Payment Info
└── Shipping Info

Customer Custom Data (separate DocType)
└── All custom fields
```

**Implementation:**
```python
# Create new DocType for extended data
customer_details = frappe.get_doc({
    "doctype": "DocType",
    "name": "Customer Details",
    "module": "CRM",
    "fields": [
        {"fieldname": "customer", "fieldtype": "Link", "options": "Customer"},
        {"fieldname": "tax_id", "fieldtype": "Data"},
        {"fieldname": "credit_limit", "fieldtype": "Currency"},
        # ... more fields
    ]
})
customer_details.insert()

# Migrate data
for customer in frappe.get_all("Customer"):
    customer_doc = frappe.get_doc("Customer", customer.name)

    # Create details record
    details = frappe.get_doc({
        "doctype": "Customer Details",
        "customer": customer.name,
        "tax_id": customer_doc.get("tax_id"),
        "credit_limit": customer_doc.get("credit_limit"),
    })
    details.insert()
```

### Comparison of Solutions

| Solution | Row Size Savings | Data Loss Risk | Complexity | Best For |
|----------|------------------|----------------|------------|----------|
| **Change to Text** | High (130+ bytes/field) | None | Low | Description fields |
| **Remove Fields** | High (140+ bytes/field) | High | Low | Unused fields |
| **Trim Orphans** | Medium | None | Very Low | Deleted fields |
| **Split DocType** | Very High | None | High | Over-customized DocTypes |

---

## Understanding Orphan Fields

### How Orphan Fields Are Created

#### Scenario 1: Deleted Custom Field

```python
# 1. Create custom field
custom_field = frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Customer",
    "fieldname": "custom_loyalty_points",
    "fieldtype": "Int"
})
custom_field.insert()
# Database: ALTER TABLE `tabCustomer` ADD COLUMN `custom_loyalty_points` INT

# 2. Delete custom field
frappe.delete_doc("Custom Field", "Customer-custom_loyalty_points")
# Database: Column still exists! (orphan)

# 3. Check orphans
from frappe.model.meta import trim_table
orphans = trim_table("Customer", dry_run=True)
# Output: ['custom_loyalty_points']
```

#### Scenario 2: Renamed Field

```python
# 1. Original field
# fieldname: "customer_type"

# 2. Rename field via Property Setter
make_property_setter("Customer", "customer_type", "fieldname", "cust_type")
# Database: New column created, old column remains (orphan)

# 3. Orphan: "customer_type"
```

#### Scenario 3: DocType Migration

```python
# During app upgrade, fields may be removed from DocType JSON
# but database columns remain

# Example: ERPNext v13 → v14 migration
# Some fields were removed from standard DocTypes
# Database columns still exist until trimmed
```

### Identifying Orphan Fields Manually

```python
# Method 1: Using trim_table
from frappe.model.meta import trim_table

orphans = trim_table("Customer", dry_run=True)
print(f"Orphan fields: {orphans}")

# Method 2: Compare columns vs fields
doctype = "Customer"

# Get database columns
db_columns = set(frappe.db.get_table_columns(doctype))

# Get DocType fields
meta = frappe.get_meta(doctype, cached=False)
doctype_fields = set(meta.get_fieldnames_with_value())

# Find orphans
orphans = db_columns - doctype_fields

# Filter out standard fields
from frappe.model.meta import default_fields, optional_fields, child_table_fields
ignore = set(default_fields + optional_fields + child_table_fields)

orphans = [f for f in orphans if f not in ignore and not f.startswith("_")]
print(f"Orphan fields: {orphans}")
```

### Risks of Keeping Orphan Fields

1. **Wasted Row Size:**
   - Each VARCHAR orphan wastes 140+ bytes
   - Can prevent adding new fields
   - May cause "Row size too large" error

2. **Confusion:**
   - Developers see columns that don't exist in DocType
   - Unclear which fields are active
   - Makes debugging harder

3. **Performance:**
   - Larger row size = slower queries
   - More disk I/O
   - Larger backups

4. **Data Integrity:**
   - Orphan data cannot be validated
   - No form controls to manage it
   - May contain stale/incorrect data

### When NOT to Trim

**Don't trim if:**
- You're unsure what the orphan fields contain
- You haven't backed up your database
- You're in production without testing first
- The fields might be used by custom scripts
- You plan to recreate the fields soon

**Safe approach:**
```python
# 1. Dry run first
orphans = trim_table("Customer", dry_run=True)

# 2. Check if orphans have data
for field in orphans:
    count = frappe.db.count("Customer", {field: ["is", "set"]})
    print(f"{field}: {count} records with data")

# 3. Backup specific data if needed
if count > 0:
    data = frappe.db.get_all("Customer",
        fields=["name", field],
        filters={field: ["is", "set"]}
    )
    # Save to file or separate table

# 4. Then trim
trim_table("Customer", dry_run=False)
```

---

## Best Practices

### 1. Choose the Right Field Type

**Decision Tree:**

```
Need to store text data?
│
├─ Short (< 140 chars) AND needs indexing/search?
│  └─ Use: Data, Link, or Select
│
├─ Medium length (< 65KB) AND no indexing needed?
│  └─ Use: Text or Small Text
│
└─ Long content (> 65KB) OR rich text?
   └─ Use: Long Text, Text Editor, or HTML Editor
```

**Examples:**

| Use Case | Field Type | Reason |
|----------|------------|--------|
| Email address | Data | Short, needs indexing |
| Phone number | Data | Short, needs exact match |
| Customer name | Data | Short, needs search |
| Product description | Text | Medium, no indexing |
| Terms & conditions | Long Text | Long content |
| HTML content | HTML Editor | Rich text |
| Comments/notes | Small Text | Medium, no indexing |

### 2. Monitor Row Size Utilization

```python
# Create a scheduled job to monitor row size
def monitor_row_sizes():
    """Check row size for all DocTypes"""
    from frappe.core.doctype.doctype.doctype import get_row_size_utilization

    warnings = []

    for doctype in frappe.get_all("DocType", {"issingle": 0, "is_virtual": 0}, pluck="name"):
        try:
            utilization = get_row_size_utilization(doctype)

            if utilization > 90:
                warnings.append({
                    "doctype": doctype,
                    "utilization": utilization,
                    "severity": "Critical"
                })
            elif utilization > 75:
                warnings.append({
                    "doctype": doctype,
                    "utilization": utilization,
                    "severity": "Warning"
                })
        except Exception:
            pass

    if warnings:
        # Send email notification
        frappe.sendmail(
            recipients=["admin@example.com"],
            subject="Row Size Warnings",
            message=frappe.as_json(warnings, indent=2)
        )

    return warnings
```

### 3. Regular Maintenance with trim-tables

**Monthly maintenance script:**

```bash
#!/bin/bash
# monthly_trim.sh

SITE="mysite.local"

# 1. Backup first
bench --site $SITE backup --with-files

# 2. Dry run to see what will be removed
bench --site $SITE trim-tables --dry-run > trim_preview.txt

# 3. Review the preview
cat trim_preview.txt

# 4. If OK, execute
read -p "Proceed with trimming? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    bench --site $SITE trim-tables
fi
```

### 4. Test in Development First

```python
# Development workflow
def safe_field_type_change(doctype, fieldname, new_type):
    """Safely change field type with testing"""

    # 1. Check current row size
    old_size = frappe.db.get_row_size(doctype)
    print(f"Current row size: {old_size} bytes")

    # 2. Make change in dev
    make_property_setter(doctype, fieldname, "fieldtype", new_type)

    # 3. Rebuild table
    frappe.db.sql(f"ALTER TABLE `tab{doctype}` MODIFY `{fieldname}` TEXT")

    # 4. Check new row size
    new_size = frappe.db.get_row_size(doctype)
    print(f"New row size: {new_size} bytes")
    print(f"Saved: {old_size - new_size} bytes")

    # 5. Test functionality
    # - Create test records
    # - Verify data integrity
    # - Test forms and reports

    # 6. If OK, apply to production
```

### 5. Document Custom Fields

```python
# Create a Custom Field Registry
custom_field_registry = frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Customer",
    "fieldname": "custom_loyalty_tier",
    "fieldtype": "Select",
    "options": "Bronze\nSilver\nGold\nPlatinum",
    "description": "Customer loyalty tier based on purchase history. Added for loyalty program feature. Contact: john@example.com"
})
custom_field_registry.insert()
```

### 6. Backup Before Trimming

```bash
# Always backup before trimming
bench --site mysite.local backup --with-files

# Trim tables
bench --site mysite.local trim-tables

# If something goes wrong, restore
bench --site mysite.local restore /path/to/backup.sql.gz
```

### 7. Use Naming Conventions

**Prevent orphans with clear naming:**

```python
# Good: Clear, descriptive names
custom_loyalty_points
custom_referral_code
custom_membership_level

# Bad: Generic names that might conflict
points
code
level
```

---

## Summary

### Quick Reference

#### Commands

```bash
# Preview orphan columns
bench --site [site] trim-tables --dry-run

# Trim all tables (with backup)
bench --site [site] trim-tables

# Trim without backup (risky!)
bench --site [site] trim-tables --no-backup
```

#### Python API

```python
# Check row size
row_size = frappe.db.get_row_size("Customer")

# Get utilization percentage
from frappe.core.doctype.doctype.doctype import get_row_size_utilization
utilization = get_row_size_utilization("Customer")

# Find orphan columns
from frappe.model.meta import trim_table
orphans = trim_table("Customer", dry_run=True)

# Remove orphan columns
trim_table("Customer", dry_run=False)

# Trim all tables
from frappe.model.meta import trim_tables
result = trim_tables(dry_run=False)
```

### Key Takeaways

1. **65KB Row Size Limit:**
   - MySQL/MariaDB hard limit
   - Includes VARCHAR but NOT TEXT/BLOB
   - Data fields: 140+ bytes, Text fields: 10 bytes

2. **Why Data > Text (in row size):**
   - VARCHAR stored in-row (140+ bytes)
   - TEXT stored separately (10 bytes pointer)
   - Use Text for descriptions, Data for short indexed fields

3. **Orphan Fields:**
   - Created when fields are deleted
   - Database columns remain
   - Waste row size and cause confusion

4. **Table Trimming:**
   - Removes orphan database columns
   - Always dry-run first
   - Always backup before executing

5. **Solutions to Row Size Problem:**
   - Change Data → Text (saves 130+ bytes/field)
   - Remove unused custom fields
   - Trim orphan columns
   - Split into multiple DocTypes

6. **Best Practices:**
   - Choose correct field types
   - Monitor row size regularly
   - Trim tables monthly
   - Test in development first
   - Always backup before trimming

---

## Additional Resources

### Frappe Forum Discussions

Common solutions suggested in Frappe Forum:

1. **Change VARCHAR to TEXT:**
   - Most common solution
   - Immediate row size reduction
   - No data loss

2. **Remove Custom Fields:**
   - Clean up unused customizations
   - Review before deleting

3. **Split DocTypes:**
   - For heavily customized DocTypes
   - Use child tables or linked DocTypes

4. **Regular Trimming:**
   - Include in maintenance schedule
   - Prevents accumulation of orphans

### Related Documentation

- [Frappe Database API](https://frappeframework.com/docs/user/en/api/database)
- [DocType Customization](https://frappeframework.com/docs/user/en/desk/customize-form)
- [MySQL Row Size Limits](https://dev.mysql.com/doc/refman/8.0/en/column-count-limit.html)
- [MariaDB Storage Requirements](https://mariadb.com/kb/en/data-type-storage-requirements/)