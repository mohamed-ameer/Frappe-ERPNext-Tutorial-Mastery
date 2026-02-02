# Virtual Fields and Virtual DocTypes in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Virtual DocTypes](#understanding-virtual-doctypes)
   - [What is a Virtual DocType?](#what-is-a-virtual-doctype)
   - [Why Use Virtual DocTypes?](#why-use-virtual-doctypes)
   - [How Virtual DocTypes Work](#how-virtual-doctypes-work)
3. [Creating Virtual DocTypes](#creating-virtual-doctypes)
   - [Required Methods](#required-methods)
   - [Step-by-Step Implementation](#step-by-step-implementation)
   - [Real-World Examples](#real-world-examples-virtual-doctype)
4. [Understanding Virtual Fields](#understanding-virtual-fields)
   - [What is a Virtual Field?](#what-is-a-virtual-field)
   - [Why Use Virtual Fields?](#why-use-virtual-fields)
   - [How Virtual Fields Work](#how-virtual-fields-work)
5. [Creating Virtual Fields](#creating-virtual-fields)
   - [Method 1: Using @property Decorator](#method-1-using-property-decorator)
   - [Method 2: Using Options Field](#method-2-using-options-field)
   - [Adding Virtual Fields via Custom Field](#adding-virtual-fields-via-custom-field)
6. [Accessing and Using Virtual Fields and DocTypes](#accessing-and-using-virtual-fields-and-doctypes)
7. [Comparison: Virtual DocType vs Virtual Field vs Regular DocType](#comparison-table)
8. [Best Practices](#best-practices)
9. [Common Use Cases](#common-use-cases)
10. [Summary](#summary)

---

## Introduction

Frappe Framework provides two powerful features for working with data that doesn't need to be stored in the database:

1. **Virtual DocTypes**: Entire DocTypes without database tables
2. **Virtual Fields**: Individual fields within a DocType that don't have database columns

Both features allow you to work with computed or external data while maintaining the familiar Frappe document interface.

---

## Understanding Virtual DocTypes

### What is a Virtual DocType?

A **Virtual DocType** is a DocType that **does not have a database table**. Instead of storing data in the database, it fetches data from:
- External APIs
- File systems
- In-memory data structures
- Other databases
- Network services
- Any custom backend

**Source:** `frappe/frappe/model/virtual_doctype.py` (lines 10-19)

```python
@runtime_checkable
class VirtualDoctype(Protocol):
    """This class documents requirements that must be met by a doctype controller to function as virtual doctype
    
    Additional requirements:
    - DocType controller has to inherit from `frappe.model.document.Document` class
    
    Note:
    - "Backend" here means any storage service, it can be a database, flat file or network call to API.
    """
```

### Why Use Virtual DocTypes?

✅ **Use Virtual DocTypes when:**

1. **External Data Source**: Data lives in an external system (API, file, etc.)
2. **Read-Only Data**: Data is primarily read-only or managed externally
3. **Temporary Data**: Data doesn't need permanent storage
4. **Real-Time Data**: Data must always be fresh from the source
5. **Legacy Systems**: Integrating with existing systems without data migration
6. **Performance**: Avoiding database overhead for certain operations

**Examples:**
- RQ Workers (background job workers)
- API logs from external services
- Real-time system metrics
- File system browsers
- External database records

### How Virtual DocTypes Work

**Key Concept:** Virtual DocTypes use the `is_virtual=1` flag in the DocType definition.

**Source:** `frappe/frappe/core/doctype/doctype/doctype.json` (lines 551-555)

```json
{
  "default": "0",
  "fieldname": "is_virtual",
  "fieldtype": "Check",
  "label": "Is Virtual"
}
```

**What happens when `is_virtual=1`:**

1. ❌ **No database table is created**
2. ✅ **DocType definition is stored** (in `tabDocType`)
3. ✅ **Form interface works normally**
4. ✅ **List view works normally**
5. ✅ **All Frappe features available** (permissions, workflows, etc.)
6. ⚠️ **You must implement required methods** to handle data operations

**Source:** `frappe/frappe/core/doctype/doctype/test_doctype.py` (lines 532-542)

```python
def test_create_virtual_doctype(self):
    """Test virtual DocType."""
    virtual_doc = new_doctype("Test Virtual Doctype")
    virtual_doc.is_virtual = 1
    virtual_doc.insert(ignore_if_duplicate=True)
    virtual_doc.reload()
    doc = frappe.get_doc("DocType", "Test Virtual Doctype")
    
    self.assertDictEqual(doc.as_dict(), virtual_doc.as_dict())
    self.assertEqual(doc.is_virtual, 1)
    self.assertFalse(frappe.db.table_exists("Test Virtual Doctype"))  # No table!
```

---

## Creating Virtual DocTypes

### Required Methods

Virtual DocTypes **must implement 7 specific methods** to function properly.

**Source:** `frappe/frappe/model/virtual_doctype.py` (lines 23-56)

#### Static Methods (Class-Level)

These methods are called **without creating an instance** and handle list view operations:

```python
@staticmethod
def get_list(args) -> list[frappe._dict]:
    """Similar to reportview.get_list

    Args:
        args: Dictionary with filters, fields, start, page_length, etc.

    Returns:
        List of dictionaries representing documents
    """
    ...

@staticmethod
def get_count(args) -> int:
    """Similar to reportview.get_count

    Args:
        args: Dictionary with filters

    Returns:
        Total count of documents for list view
    """
    ...

@staticmethod
def get_stats(args):
    """Similar to reportview.get_stats

    Args:
        args: Dictionary with filters

    Returns:
        Dictionary with sidebar statistics (optional, can return {})
    """
    ...
```

#### Instance Methods (Document-Level)

These methods are called **on document instances** and handle CRUD operations:

```python
def db_insert(self, *args, **kwargs) -> None:
    """Serialize the Document object and insert it in backend.

    Called when: doc.insert()
    """
    ...

def load_from_db(self) -> None:
    """Using self.name initialize current document from backend data.

    This is responsible for updating __dict__ of class with all the fields on doctype.

    Called when: frappe.get_doc("DocType", "name")
    """
    ...

def db_update(self, *args, **kwargs) -> None:
    """Serialize the Document object and update existing document in backend.

    Called when: doc.save()
    """
    ...

def delete(self, *args, **kwargs) -> None:
    """Delete the current document from backend.

    Called when: doc.delete()
    """
    ...
```

### Validation of Required Methods

Frappe automatically validates that all required methods are implemented.

**Source:** `frappe/frappe/model/virtual_doctype.py` (lines 59-93)

```python
def validate_controller(doctype: str) -> None:
    try:
        controller = get_controller(doctype)
    except ImportError:
        frappe.msgprint(_("Failed to import virtual doctype {}, is controller file present?").format(doctype))
        return

    # Check static methods
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

    # Check instance methods
    expected_instance_methods = ["db_insert", "db_update", "load_from_db", "delete"]
    parent_class = controller.mro()[1]
    for m in expected_instance_methods:
        method = getattr(controller, m, None)
        original_method = getattr(parent_class, m, None)
        if method == original_method:
            frappe.msgprint(
                _("Virtual DocType {} requires overriding an instance method called {} found {}").format(
                    frappe.bold(doctype), frappe.bold(m), frappe.bold(_as_str(method))
                ),
                title=_("Incomplete Virtual Doctype Implementation"),
            )
```

**When validation runs:**

**Source:** `frappe/frappe/core/doctype/doctype/doctype.py` (lines 419-426)

```python
def validate_virtual_doctype_methods(self):
    if not self.get("is_virtual") or self.is_new():
        return

    from frappe.model.virtual_doctype import validate_controller

    validate_controller(self.name)
```

### Step-by-Step Implementation

#### Step 1: Create the DocType

1. Go to **DocType List**
2. Create a new DocType
3. Add fields as needed
4. ✅ **Check "Is Virtual"** checkbox
5. Save the DocType

#### Step 2: Create the Controller File

Create a Python file in your app's doctype folder:

```
myapp/myapp/doctype/my_virtual_doctype/my_virtual_doctype.py
```

#### Step 3: Implement Required Methods

```python
# File: myapp/myapp/doctype/my_virtual_doctype/my_virtual_doctype.py

import frappe
from frappe.model.document import Document

class MyVirtualDoctype(Document):
    # Static methods for list view
    @staticmethod
    def get_list(args):
        # Fetch data from your backend
        data = fetch_from_backend()
        return [frappe._dict(item) for item in data]

    @staticmethod
    def get_count(args):
        # Return total count
        return len(fetch_from_backend())

    @staticmethod
    def get_stats(args):
        # Return sidebar stats (optional)
        return {}

    # Instance methods for CRUD
    def db_insert(self, *args, **kwargs):
        # Save to your backend
        save_to_backend(self.as_dict())

    def load_from_db(self):
        # Load from your backend
        data = load_from_backend(self.name)
        super(Document, self).__init__(data)

    def db_update(self, *args, **kwargs):
        # Update in your backend
        update_in_backend(self.name, self.as_dict())

    def delete(self):
        # Delete from your backend
        delete_from_backend(self.name)
```

---

## Real-World Examples: Virtual DocType

### Example 1: JSON File Backend

This is a complete working example from Frappe's test suite.

**Source:** `frappe/frappe/tests/test_virtual_doctype.py` (lines 17-82)

```python
import json
import os
import frappe
from frappe.model.document import Document

class VirtualDoctypeTest(Document):
    """This is a virtual doctype controller for test/demo purposes.

    - It uses a JSON file on disk as "backend".
    - Key is docname and value is the document itself.

    Example:
    {
        "doc1": {"name": "doc1", ...}
        "doc2": {"name": "doc2", ...}
    }
    """

    DATA_FILE = "data_file.json"

    @staticmethod
    def get_current_data() -> dict[str, dict]:
        """Read data from disk"""
        if not os.path.exists(VirtualDoctypeTest.DATA_FILE):
            return {}

        with open(VirtualDoctypeTest.DATA_FILE) as f:
            return json.load(f)

    @staticmethod
    def update_data(data: dict[str, dict]) -> None:
        """Flush updated data to disk"""
        with open(VirtualDoctypeTest.DATA_FILE, "w+") as data_file:
            json.dump(data, data_file)

    def db_insert(self, *args, **kwargs):
        d = self.get_valid_dict(convert_dates_to_str=True)

        data = self.get_current_data()
        data[d.name] = d

        self.update_data(data)

    def load_from_db(self):
        data = self.get_current_data()
        d = data.get(self.name)
        super(Document, self).__init__(d)

    def db_update(self, *args, **kwargs):
        # For this example insert and update are same operation,
        # it might be different for you
        self.db_insert(*args, **kwargs)

    def delete(self):
        data = self.get_current_data()
        data.pop(self.name, None)
        self.update_data(data)

    @staticmethod
    def get_list(args):
        data = VirtualDoctypeTest.get_current_data()
        return [frappe._dict(doc) for name, doc in data.items()]

    @staticmethod
    def get_count(args):
        data = VirtualDoctypeTest.get_current_data()
        return len(data)

    @staticmethod
    def get_stats(args):
        return {}
```

**Usage:**

```python
# Create a new document
doc = frappe.new_doc("Virtual Doctype Test")
doc.some_field = "value"
doc.insert()  # Calls db_insert() -> saves to JSON file

# Load document
doc = frappe.get_doc("Virtual Doctype Test", "doc-name")  # Calls load_from_db()

# Update document
doc.some_field = "new value"
doc.save()  # Calls db_update() -> updates JSON file

# Delete document
doc.delete()  # Calls delete() -> removes from JSON file

# List view
docs = frappe.get_list("Virtual Doctype Test")  # Calls get_list()
```

### Example 2: RQ Workers (Real-World Production Example)

This example shows how Frappe uses Virtual DocTypes to display background job workers.

**Source:** `frappe/frappe/core/doctype/rq_worker/rq_worker.py` (lines 16-81)

```python
import frappe
from frappe.model.document import Document
from frappe.utils import cint
from frappe.utils.background_jobs import get_workers

class RQWorker(Document):
    # Virtual DocType - no database table
    # Data comes from RQ (Redis Queue) workers

    def load_from_db(self):
        """Load worker data from RQ"""
        all_workers = get_workers()
        workers = [w for w in all_workers if w.name == self.name]
        if not workers:
            raise frappe.DoesNotExistError
        d = serialize_worker(workers[0])

        super(Document, self).__init__(d)

    @staticmethod
    def get_list(args):
        """Get list of workers for list view"""
        start = cint(args.get("start"))
        page_length = cint(args.get("page_length"))

        workers = get_workers()

        valid_workers = [w for w in workers if w.pid]

        if page_length:
            valid_workers = valid_workers[start : start + page_length]
        else:
            valid_workers = valid_workers[start:]

        return [serialize_worker(worker) for worker in valid_workers]

    @staticmethod
    def get_count(args) -> int:
        """Count total workers"""
        return len(get_workers())

    # None of these methods apply to virtual workers, overriden for sanity.
    @staticmethod
    def get_stats(args):
        return {}

    def db_insert(self, *args, **kwargs):
        pass  # Workers are managed by RQ, not by Frappe

    def db_update(self, *args, **kwargs):
        pass  # Workers are managed by RQ, not by Frappe

    def delete(self):
        pass  # Workers are managed by RQ, not by Frappe

def serialize_worker(worker) -> frappe._dict:
    """Convert RQ Worker object to Frappe dict"""
    queue_names = worker.queue_names()

    queue = ", ".join(queue_names)
    queue_types = ",".join(q.rsplit(":", 1)[1] for q in queue_names)

    current_job = worker.get_current_job_id()
    if current_job and not current_job.startswith(frappe.local.site):
        current_job = None

    return frappe._dict(
        name=worker.name,
        queue=queue,
        queue_type=queue_types,
        worker_name=worker.name,
        status=worker.get_state(),
        pid=worker.pid,
        current_job_id=current_job,
        # ... more fields
    )
```

**Key Points:**
- Data comes from **Redis Queue (RQ)**, not database
- Workers are **read-only** (insert/update/delete do nothing)
- Perfect use case: displaying external system data in Frappe UI

---

## Understanding Virtual Fields

### What is a Virtual Field?

A **Virtual Field** is a field in a DocType that **does not have a database column**. The field's value is:
- Computed on-the-fly
- Derived from other fields
- Fetched from external sources
- Calculated using Python expressions

**Source:** `frappe/frappe/core/doctype/docfield/docfield.json` (lines 550-554)

```json
{
  "default": "0",
  "fieldname": "is_virtual",
  "fieldtype": "Check",
  "label": "Virtual"
}
```

**Source:** `frappe/frappe/custom/doctype/custom_field/custom_field.json` (lines 252-257)

```json
{
  "default": "0",
  "fieldname": "is_virtual",
  "fieldtype": "Check",
  "label": "Is Virtual"
}
```

### Why Use Virtual Fields?

✅ **Use Virtual Fields when:**

1. **Computed Values**: Field value is calculated from other fields
2. **Derived Data**: Value is derived from related documents
3. **Display-Only**: Field is for display purposes only
4. **No Storage Needed**: Value doesn't need to be persisted
5. **Dynamic Content**: Value changes based on context
6. **Save Database Space**: Avoid storing redundant data

**Examples:**
- Full name (computed from first_name + last_name)
- Age (computed from date_of_birth)
- Total amount (sum of item amounts)
- Status indicators (based on other field values)
- Formatted display values

### How Virtual Fields Work

Virtual fields are handled specially in the `get_valid_dict()` method.

**Source:** `frappe/frappe/model/base_document.py` (lines 357-390)

```python
def get_valid_dict(self, sanitize=True, convert_dates_to_str=False,
                   ignore_nulls=False, ignore_virtual=False) -> _dict:
    d = _dict()
    field_values = self.__dict__

    for fieldname in self.meta.get_valid_columns():
        value = field_values.get(fieldname)

        if not sanitize and value is None:
            d[fieldname] = None
            continue

        df = self.meta.get_field(fieldname)
        is_virtual_field = df and df.get("is_virtual")

        if df:
            if is_virtual_field:
                if ignore_virtual or fieldname not in self.permitted_fieldnames:
                    continue

                # Method 1: Check if it's a @property
                if (prop := getattr(type(self), fieldname, None)) and is_a_property(prop):
                    value = getattr(self, fieldname)

                # Method 2: Or evaluate options field
                elif options := getattr(df, "options", None):
                    from frappe.utils.safe_exec import get_safe_globals
                    value = frappe.safe_eval(
                        code=options,
                        eval_globals=get_safe_globals(),
                        eval_locals={"doc": self},
                    )

            # ... rest of the method
```

**Key Points:**
1. Virtual fields are **skipped** when `ignore_virtual=True`
2. Virtual fields can be computed via **@property** decorator
3. Virtual fields can be computed via **options** field (Python expression)
4. Virtual fields are **not saved to database**

### Virtual Fields in JavaScript

Virtual fields are handled specially in JavaScript as well.

**Source:** `frappe/frappe/public/js/frappe/form/script_manager.js` (lines 193-222)

```javascript
function setup_add_fetch(df) {
    let is_read_only_field =
        [
            "Data", "Read Only", "Text", "Small Text", "Currency",
            "Check", "Text Editor", "Attach Image", "Code", "Link",
            "Float", "Int", "Date", "Datetime", "Select", "Duration", "Time",
        ].includes(df.fieldtype) ||
        df.read_only == 1 ||
        df.is_virtual == 1;  // Virtual fields can use fetch_from

    if (is_read_only_field && df.fetch_from && df.fetch_from.indexOf(".") != -1) {
        var parts = df.fetch_from.split(".");
        me.frm.add_fetch(parts[0], parts[1], df.fieldname, df.parent);
    }
}
```

**Source:** `frappe/frappe/public/js/frappe/form/quick_entry.js` (lines 58-71)

```javascript
set_meta_and_mandatory_fields() {
    this.meta = frappe.get_meta(this.doctype);
    let fields = this.meta.fields;

    this.mandatory = fields.filter((df) => {
        return (
            (df.reqd || df.allow_in_quick_entry) &&
            !df.read_only &&
            !df.is_virtual &&  // Exclude virtual fields from quick entry
            df.fieldtype !== "Tab Break"
        );
    });
}
```

**Key Points:**
- Virtual fields are **excluded from quick entry**
- Virtual fields **can use fetch_from**
- Virtual fields are treated as **read-only** in most contexts

### Virtual Fields and List View

Virtual fields have special handling for list view.

**Source:** `frappe/frappe/core/doctype/docfield/docfield.json` (lines 160-168)

```json
{
  "default": "0",
  "depends_on": "eval:!doc.is_virtual",
  "fieldname": "in_list_view",
  "fieldtype": "Check",
  "label": "In List View",
  "print_width": "70px",
  "width": "70px"
}
```

**Key Point:** The `in_list_view` checkbox is **hidden** for virtual fields because virtual fields don't exist in the database and can't be efficiently queried for list views.

---

## Creating Virtual Fields

There are **two methods** to create virtual fields in Frappe:

1. **Using @property decorator** in the controller
2. **Using options field** with Python expression

### Method 1: Using @property Decorator

This is the **recommended method** for complex calculations.

#### Step 1: Add Field to DocType

1. Go to your DocType
2. Add a new field
3. ✅ **Check "Virtual"** checkbox
4. Set fieldtype (Data, Currency, Check, etc.)
5. Save the DocType

#### Step 2: Add @property in Controller

```python
# File: myapp/myapp/doctype/sales_order/sales_order.py

import frappe
from frappe.model.document import Document

class SalesOrder(Document):
    @property
    def total_amount(self):
        """Calculate total from items (virtual field)"""
        total = 0
        for item in self.items:
            total += item.amount
        return total

    @property
    def is_overdue(self):
        """Check if order is overdue (virtual field)"""
        from frappe.utils import getdate, nowdate
        if self.delivery_date:
            return getdate(self.delivery_date) < getdate(nowdate())
        return False

    @property
    def customer_full_name(self):
        """Get customer full name (virtual field)"""
        if self.customer:
            return frappe.db.get_value("Customer", self.customer, "customer_name")
        return None
```

**Usage:**

```python
# Get document
order = frappe.get_doc("Sales Order", "SO-0001")

# Access virtual fields (no parentheses!)
print(order.total_amount)        # Computed from items
print(order.is_overdue)          # Boolean check
print(order.customer_full_name)  # Fetched from Customer

# In Jinja templates
# {{ doc.total_amount }}
# {% if doc.is_overdue %}Overdue!{% endif %}
```

### Method 2: Using Options Field

This method is for **simple Python expressions**.

#### Step 1: Add Field to DocType

1. Go to your DocType
2. Add a new field
3. ✅ **Check "Virtual"** checkbox
4. Set fieldtype
5. In **Options** field, enter a Python expression
6. Save the DocType

#### Step 2: Write Python Expression in Options

The expression has access to `doc` variable.

**Examples:**

| Field | Options Expression | Result |
|-------|-------------------|--------|
| `full_name` | `doc.first_name + " " + doc.last_name` | "John Doe" |
| `age` | `frappe.utils.date_diff(frappe.utils.nowdate(), doc.date_of_birth) // 365` | 25 |
| `total` | `sum(item.amount for item in doc.items)` | 1500.00 |
| `is_active` | `doc.status == "Active"` | True/False |

**Example in DocType JSON:**

```json
{
  "fieldname": "full_name",
  "fieldtype": "Data",
  "label": "Full Name",
  "is_virtual": 1,
  "options": "doc.first_name + ' ' + doc.last_name"
}
```

**How it works:**

**Source:** `frappe/frappe/model/base_document.py` (lines 382-389)

```python
elif options := getattr(df, "options", None):
    from frappe.utils.safe_exec import get_safe_globals

    value = frappe.safe_eval(
        code=options,
        eval_globals=get_safe_globals(),
        eval_locals={"doc": self},
    )
```

### Adding Virtual Fields via Custom Field

You can add virtual fields to **any DocType** using Custom Fields.

#### Via UI:

1. Go to **Customize Form**
2. Select your DocType
3. Add a new field
4. ✅ **Check "Is Virtual"**
5. Set fieldtype and label
6. (Optional) Add Python expression in **Options**
7. Save

#### Via Code:

```python
# Create a virtual custom field
custom_field = frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Sales Order",
    "fieldname": "total_amount_virtual",
    "label": "Total Amount",
    "fieldtype": "Currency",
    "is_virtual": 1,
    "insert_after": "items",
    "options": "sum(item.amount for item in doc.items)"
})
custom_field.insert()
```

---

## Accessing and Using Virtual Fields and DocTypes

### Accessing Virtual DocTypes

Virtual DocTypes work **exactly like regular DocTypes** from the user's perspective:

```python
# Create
doc = frappe.new_doc("Virtual DocType Name")
doc.field1 = "value"
doc.insert()  # Calls db_insert()

# Read
doc = frappe.get_doc("Virtual DocType Name", "name")  # Calls load_from_db()

# Update
doc.field1 = "new value"
doc.save()  # Calls db_update()

# Delete
doc.delete()  # Calls delete()

# List
docs = frappe.get_list("Virtual DocType Name")  # Calls get_list()
count = frappe.db.count("Virtual DocType Name")  # Calls get_count()
```

### Accessing Virtual Fields

Virtual fields are accessed **like regular fields**:

```python
# Get document
doc = frappe.get_doc("Sales Order", "SO-0001")

# Access virtual field (computed automatically)
total = doc.total_amount  # Calls @property or evaluates options

# Virtual fields in as_dict()
data = doc.as_dict()
print(data.get("total_amount"))  # Included if permitted

# Virtual fields in JSON
json_data = doc.as_json()  # Virtual fields included
```

### Virtual Fields in Forms

Virtual fields appear in forms but are **read-only**:

```javascript
// In form script
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // Virtual field value is available
        console.log(frm.doc.total_amount);

        // But you can't set it directly
        // frm.set_value("total_amount", 100);  // Won't work
    }
});
```

### Virtual Fields in Reports

Virtual fields can be used in reports if they're computed via @property:

```python
# In report query
def execute(filters=None):
    columns = [
        {"fieldname": "name", "label": "Order", "fieldtype": "Link", "options": "Sales Order"},
        {"fieldname": "total_amount", "label": "Total", "fieldtype": "Currency"},  # Virtual field
    ]

    data = []
    for order in frappe.get_all("Sales Order", fields=["name"]):
        doc = frappe.get_doc("Sales Order", order.name)
        data.append({
            "name": doc.name,
            "total_amount": doc.total_amount  # Virtual field accessed
        })

    return columns, data
```

### Virtual Fields in fetch_from

Virtual fields **can use fetch_from** to populate from linked documents.

**Source:** `frappe/frappe/model/base_document.py` (lines 822-840)

```python
# Handling virtual DocTypes in fetch_from
if not meta.get("is_virtual"):
    if not fields_to_fetch:
        values = _dict(name=frappe.db.get_value(doctype, docname, "name", cache=True))
    else:
        values_to_fetch = ["name"] + [
            _df.fetch_from.split(".")[-1] for _df in fields_to_fetch
        ]
        values = frappe.db.get_value(doctype, docname, values_to_fetch, as_dict=True)

if getattr(meta, "issingle", 0):
    values.name = doctype

if meta.get("is_virtual"):
    values = frappe.get_doc(doctype, docname).as_dict()
```

**Example:**

```json
{
  "fieldname": "customer_email",
  "fieldtype": "Data",
  "label": "Customer Email",
  "is_virtual": 1,
  "fetch_from": "customer.email_id"
}
```

---

## Comparison Table

### Virtual DocType vs Virtual Field vs Regular DocType

| Feature | Regular DocType | Virtual DocType | Virtual Field |
|---------|----------------|-----------------|---------------|
| **Database Table** | ✅ Yes | ❌ No | Field: ❌ No |
| **Data Storage** | Database | Custom backend | Computed/None |
| **CRUD Operations** | Automatic | Manual (7 methods) | Read-only |
| **List View** | ✅ Yes | ✅ Yes (via get_list) | ⚠️ Limited |
| **Form View** | ✅ Yes | ✅ Yes | ✅ Yes (read-only) |
| **Permissions** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Workflows** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Search** | ✅ Yes | ⚠️ Custom | ❌ No |
| **Filters** | ✅ Yes | ⚠️ Custom | ❌ No |
| **Reports** | ✅ Yes | ⚠️ Custom | ⚠️ Limited |
| **Performance** | Fast (indexed) | Depends on backend | Fast (computed) |
| **Use Case** | Standard data | External data | Computed values |

### @property vs options Expression

| Feature | @property Decorator | options Expression |
|---------|--------------------|--------------------|
| **Complexity** | Any Python code | Simple expressions |
| **Performance** | Can be slow | Can be slow |
| **Caching** | Use @cached_property | No caching |
| **Debugging** | Easy | Harder |
| **Reusability** | High | Low |
| **Maintenance** | Better | Harder |
| **Best For** | Complex logic | Simple calculations |

---

## Best Practices

### Virtual DocTypes

#### ✅ Do:

1. **Implement all 7 required methods** properly
2. **Handle errors gracefully** in load_from_db()
3. **Return consistent data structures** from get_list()
4. **Cache expensive operations** when possible
5. **Document your backend** clearly
6. **Test thoroughly** - virtual DocTypes are harder to debug
7. **Use for read-heavy operations** where data comes from external sources

```python
class MyVirtualDoctype(Document):
    @staticmethod
    def get_list(args):
        try:
            # Cache the result if possible
            cache_key = f"virtual_doctype_list_{args}"
            cached = frappe.cache().get_value(cache_key)
            if cached:
                return cached

            # Fetch from backend
            data = fetch_from_backend(args)

            # Cache for 5 minutes
            frappe.cache().set_value(cache_key, data, expires_in_sec=300)
            return data
        except Exception as e:
            frappe.log_error(f"Error in get_list: {str(e)}")
            return []
```

#### ❌ Don't:

1. **Don't use for write-heavy operations** - database is better
2. **Don't skip error handling** - external systems can fail
3. **Don't forget pagination** in get_list()
4. **Don't return inconsistent data types**
5. **Don't ignore performance** - slow backends = slow UI

### Virtual Fields

#### ✅ Do:

1. **Use @property for complex logic**
2. **Use options for simple expressions**
3. **Cache expensive computations** with @cached_property
4. **Document what the field computes**
5. **Handle None values** gracefully
6. **Keep computations fast** - they run on every access

```python
from functools import cached_property

class SalesOrder(Document):
    @cached_property
    def total_amount(self):
        """Calculate total from items (cached)

        This is cached because it's accessed multiple times
        and the calculation is expensive.
        """
        if not self.items:
            return 0
        return sum(item.amount for item in self.items)

    @property
    def is_overdue(self):
        """Check if order is overdue (not cached)

        This is not cached because it depends on current date
        and should always be fresh.
        """
        from frappe.utils import getdate, nowdate
        if not self.delivery_date:
            return False
        return getdate(self.delivery_date) < getdate(nowdate())
```

#### ❌ Don't:

1. **Don't use for fields that need to be saved**
2. **Don't make expensive database calls** without caching
3. **Don't modify document state** in @property
4. **Don't use for fields needed in list view**
5. **Don't forget to handle edge cases**

```python
# BAD: Expensive operation without caching
@property
def customer_orders_count(self):
    # This queries database every time!
    return frappe.db.count("Sales Order", {"customer": self.customer})

# GOOD: Cached expensive operation
@cached_property
def customer_orders_count(self):
    # This queries database only once
    return frappe.db.count("Sales Order", {"customer": self.customer})
```

### Security Considerations

#### Virtual DocTypes:

```python
class MyVirtualDoctype(Document):
    def load_from_db(self):
        # ✅ Check permissions
        if not frappe.has_permission(self.doctype, "read"):
            frappe.throw("Not permitted")

        # ✅ Validate input
        if not self.name:
            frappe.throw("Name is required")

        # ✅ Sanitize data from external source
        data = fetch_from_backend(self.name)
        data = frappe.as_json(data)  # Sanitize

        super(Document, self).__init__(data)
```

#### Virtual Fields:

```python
class SalesOrder(Document):
    @property
    def sensitive_data(self):
        # ✅ Check permissions before returning sensitive data
        if not frappe.has_permission(self.doctype, "read", self):
            return None

        return self.get_sensitive_calculation()
```

---

## Common Use Cases

### Virtual DocTypes Use Cases

#### 1. External API Integration

```python
class GitHubIssue(Document):
    """Virtual DocType for GitHub Issues"""

    @staticmethod
    def get_list(args):
        import requests
        response = requests.get("https://api.github.com/repos/owner/repo/issues")
        issues = response.json()
        return [frappe._dict(issue) for issue in issues]

    def load_from_db(self):
        import requests
        response = requests.get(f"https://api.github.com/repos/owner/repo/issues/{self.name}")
        data = response.json()
        super(Document, self).__init__(data)
```

#### 2. File System Browser

```python
class FileSystemBrowser(Document):
    """Virtual DocType for browsing file system"""

    @staticmethod
    def get_list(args):
        import os
        path = args.get("path", "/")
        files = os.listdir(path)
        return [frappe._dict({"name": f, "path": os.path.join(path, f)}) for f in files]
```

#### 3. Real-Time System Metrics

```python
class SystemMetric(Document):
    """Virtual DocType for system metrics"""

    @staticmethod
    def get_list(args):
        import psutil
        return [
            frappe._dict({"name": "CPU", "value": psutil.cpu_percent()}),
            frappe._dict({"name": "Memory", "value": psutil.virtual_memory().percent}),
        ]
```

### Virtual Fields Use Cases

#### 1. Computed Display Fields

```python
class Employee(Document):
    @property
    def full_name(self):
        """Virtual field: Full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        """Virtual field: Age from date of birth"""
        from frappe.utils import date_diff, nowdate
        if self.date_of_birth:
            return date_diff(nowdate(), self.date_of_birth) // 365
        return None
```

#### 2. Status Indicators

```python
class Task(Document):
    @property
    def is_overdue(self):
        """Virtual field: Overdue status"""
        from frappe.utils import getdate, nowdate
        if self.status != "Completed" and self.due_date:
            return getdate(self.due_date) < getdate(nowdate())
        return False

    @property
    def priority_color(self):
        """Virtual field: Color based on priority"""
        colors = {"High": "red", "Medium": "orange", "Low": "green"}
        return colors.get(self.priority, "gray")
```

#### 3. Aggregated Values

```python
class SalesOrder(Document):
    @cached_property
    def total_amount(self):
        """Virtual field: Total from items"""
        return sum(item.amount for item in self.items)

    @cached_property
    def total_tax(self):
        """Virtual field: Total tax"""
        return sum(tax.tax_amount for tax in self.taxes)

    @cached_property
    def grand_total(self):
        """Virtual field: Grand total"""
        return self.total_amount + self.total_tax
```

#### 4. Related Document Data

```python
class SalesInvoice(Document):
    @cached_property
    def customer_credit_limit(self):
        """Virtual field: Customer's credit limit"""
        if self.customer:
            return frappe.db.get_value("Customer", self.customer, "credit_limit")
        return 0

    @cached_property
    def customer_outstanding(self):
        """Virtual field: Customer's outstanding amount"""
        if self.customer:
            return frappe.db.get_value("Customer", self.customer, "outstanding_amount")
        return 0
```

---

## Summary

### Key Takeaways

#### Virtual DocTypes:

1. **No database table** - data comes from custom backend
2. **Must implement 7 methods** - 3 static, 4 instance
3. **Perfect for external data** - APIs, files, other systems
4. **Full Frappe features** - forms, lists, permissions, workflows
5. **More complex** - requires careful implementation

#### Virtual Fields:

1. **No database column** - value is computed
2. **Two methods** - @property or options expression
3. **Perfect for computed values** - derived, calculated, formatted
4. **Read-only** - cannot be directly set
5. **Simpler** - easier to implement and maintain

### Quick Reference

**Create Virtual DocType:**
```python
# 1. Set is_virtual=1 in DocType
# 2. Implement in controller:

class MyVirtualDoctype(Document):
    @staticmethod
    def get_list(args): ...
    @staticmethod
    def get_count(args): ...
    @staticmethod
    def get_stats(args): ...
    def db_insert(self): ...
    def load_from_db(self): ...
    def db_update(self): ...
    def delete(self): ...
```

**Create Virtual Field:**
```python
# Method 1: @property
class MyDoctype(Document):
    @property
    def my_virtual_field(self):
        return "computed value"

# Method 2: options field
# In DocType: is_virtual=1, options="doc.field1 + doc.field2"
```

### When to Use What

| Scenario | Use |
|----------|-----|
| External API data | Virtual DocType |
| File system data | Virtual DocType |
| Real-time metrics | Virtual DocType |
| Computed display value | Virtual Field |
| Derived from other fields | Virtual Field |
| Aggregated values | Virtual Field (@cached_property) |
| Status indicators | Virtual Field |
| Need to save data | Regular DocType/Field |
| Need in list view | Regular Field |
| Need to filter/search | Regular Field |

---

### Source Code References
- `frappe/frappe/model/virtual_doctype.py` - Virtual DocType Protocol
- `frappe/frappe/tests/test_virtual_doctype.py` - Complete working example
- `frappe/frappe/core/doctype/rq_worker/rq_worker.py` - Real-world example
- `frappe/frappe/model/base_document.py` - Virtual field handling
- `frappe/frappe/core/doctype/docfield/docfield.json` - DocField definition
- `frappe/frappe/custom/doctype/custom_field/custom_field.json` - Custom Field definition