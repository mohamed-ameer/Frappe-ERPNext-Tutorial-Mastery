# Frappe Unit Testing: Complete Guide to test_records

## Table of Contents
1. [What are test_records?](#what-are-test_records)
2. [Why Do We Need test_records?](#why-do-we-need-test_records)
3. [When to Use test_records](#when-to-use-test_records)
4. [How test_records Work](#how-test_records-work)
5. [Three Methods of Defining test_records](#three-methods-of-defining-test_records)
6. [Detailed Examples](#detailed-examples)
7. [Use Cases](#use-cases)
8. [Generic Steps for Creating and Using test_records](#generic-steps-for-creating-and-using-test_records)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## What are test_records?

`test_records` are predefined test data structures used in Frappe unit tests to create consistent, reusable test fixtures. They represent document data that will be automatically inserted into the database before your tests run.

### Key Characteristics

- **Test Data Definitions**: They define the structure and values of documents to be created for testing
- **Automatic Creation**: Frappe's test runner automatically creates these records before tests execute
- **Dependency Resolution**: Frappe automatically resolves and creates dependencies (linked DocTypes)
- **Caching**: Created records are cached to avoid recreation on subsequent test runs
- **Isolation**: Each test run gets fresh data, ensuring test isolation

### Types of test_records

Frappe supports three ways to define test_records:

1. **test_records.json** - JSON file containing test data (most common)
2. **test_records variable** - Python variable in test file
3. **_make_test_records() function** - Programmatic creation function

---

## Why Do We Need test_records?

### 1. **Consistency and Repeatability**

Test records ensure that every test run uses the same baseline data, making tests predictable and repeatable.

**Without test_records:**
```python
def test_sales_invoice(self):
    # Each test creates its own data - inconsistent
    customer = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": "Test Customer",
        # ... many fields
    })
    customer.insert()
    # Test logic...
```

**With test_records:**
```python
# test_records.json defines consistent data
# All tests use the same "_Test Customer" record
def test_sales_invoice(self):
    customer = frappe.get_doc("Customer", "_Test Customer")
    # Test logic...
```

### 2. **Automatic Dependency Management**

Frappe automatically creates dependencies (linked DocTypes) before creating your test records. This eliminates manual dependency management.

**Example:**
If your `Sales Invoice` test_records reference:
- `Company` (_Test Company)
- `Customer` (_Test Customer)
- `Item` (_Test Item)

Frappe will automatically:
1. Create `_Test Company` first
2. Create `_Test Customer` (which depends on Company)
3. Create `_Test Item` (which depends on Company, Item Group, etc.)
4. Finally create your `Sales Invoice` records

### 3. **Performance Optimization**

Test records are created once and cached. Subsequent test runs reuse existing records (unless `force=True`), significantly improving test performance.

### 4. **Code Reusability**

Test records can be shared across multiple test methods and even across different test files, reducing code duplication.

### 5. **Maintainability**

Centralized test data makes it easier to update test data when DocType schemas change. You update the test_records once, and all tests benefit.

### 6. **Test Isolation**

Each test run starts with a clean slate. Database rollback after each test ensures no test affects another.

---

## When to Use test_records

### ✅ Use test_records When:

1. **Testing DocTypes with Dependencies**
   - Your DocType has Link fields to other DocTypes
   - You need consistent reference data across tests

2. **Multiple Test Methods Need Same Data**
   - Several test methods require the same base data
   - You want to avoid duplicating data creation code

3. **Complex Test Data Setup**
   - Your test data requires multiple related records
   - Child tables, nested relationships, etc.

4. **Integration Testing**
   - Testing workflows that span multiple DocTypes
   - Testing business logic that depends on existing data

5. **Regression Testing**
   - Ensuring consistent behavior across test runs
   - Testing against known data sets

### ❌ Don't Use test_records When:

1. **Simple Unit Tests**
   - Testing isolated functions with minimal dependencies
   - Creating test data inline is simpler

2. **Test-Specific Data**
   - Data that's unique to a single test method
   - Data that changes per test scenario

3. **Dynamic Test Data**
   - Data that needs to be generated at runtime
   - Data that depends on test parameters

---

## How test_records Work

### The Test Record Creation Flow

```
1. Test Runner Starts
   ↓
2. Discovers test file (test_my_doctype.py)
   ↓
3. Checks for test_records in this order:
   a. _make_test_records() function in test file
   b. test_records variable in test file
   c. test_records.json file in DocType directory
   ↓
4. Resolves Dependencies:
   - Finds all Link fields in DocType
   - Finds Link fields in child tables
   - Checks test_dependencies list
   - Removes test_ignore items
   ↓
5. Creates Dependencies First (recursively)
   ↓
6. Creates Your Test Records
   ↓
7. Stores in frappe.local.test_objects
   ↓
8. Caches in .test_log file
   ↓
9. Runs Your Tests
```

### Key Components

#### 1. **frappe.local.test_objects**

A dictionary that stores created test records:
```python
frappe.local.test_objects = {
    "Company": ["_Test Company", "_Test Company 1"],
    "Customer": ["_Test Customer"],
    "Item": ["_Test Item", "_Test Item 2"]
}
```

#### 2. **.test_log File**

Located at `sites/[site-name]/.test_log`, this file caches which DocTypes have had test records created. This prevents recreation unless `force=True`.

#### 3. **Dependency Resolution**

Frappe automatically resolves dependencies by:
- Scanning Link fields in DocType meta
- Scanning Link fields in child table DocTypes
- Checking `test_dependencies` list
- Excluding items in `test_ignore` list

#### 4. **Naming Series Handling**

If a DocType uses naming series:
- Default series `_T-{DocType}-` is used if not specified
- Series is reverted if document creation fails
- Fixed names can be specified in test_records

---

## Three Methods of Defining test_records

### Method 1: test_records.json File (Recommended)

**Location:** Must be in the DocType directory
```
your_app/
└── your_app/
    └── module/
        └── doctype/
            └── doctype_name/
                ├── doctype_name.py
                ├── test_doctype_name.py
                └── test_records.json  ← Here
```

**Structure:** JSON array of document dictionaries

**Example:**
```json
[
  {
    "doctype": "Company",
    "company_name": "_Test Company",
    "abbr": "_TC",
    "default_currency": "INR",
    "country": "India",
    "domain": "Manufacturing",
    "chart_of_accounts": "Standard"
  },
  {
    "doctype": "Company",
    "company_name": "_Test Company 1",
    "abbr": "_TC1",
    "default_currency": "USD",
    "country": "United States"
  }
]
```

**How Frappe Loads It:**
```python
# In frappe/__init__.py
def get_test_records(doctype):
    """Returns list of objects from `test_records.json`"""
    path = os.path.join(
        get_module_path(get_doctype_module(doctype)),
        "doctype",
        scrub(doctype),
        "test_records.json"
    )
    if os.path.exists(path):
        with open(path) as f:
            return json.loads(f.read())
    else:
        return []
```

**Advantages:**
- ✅ Separates test data from test logic
- ✅ Easy to read and modify
- ✅ Version controlled
- ✅ Can be edited without Python knowledge

**Disadvantages:**
- ❌ No dynamic data generation
- ❌ Limited to static JSON structures

### Method 2: test_records Variable

**Location:** In your test file (`test_my_doctype.py`)

**Structure:** Python list/dict of document dictionaries

**Example:**
```python
# test_my_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase

# Option 1: Load from JSON file
test_records = frappe.get_test_records("MyDocType")

# Option 2: Define inline
test_records = [
    {
        "doctype": "MyDocType",
        "field1": "value1",
        "field2": "value2"
    },
    {
        "doctype": "MyDocType",
        "field1": "value3",
        "field2": "value4"
    }
]

class TestMyDocType(FrappeTestCase):
    def test_something(self):
        # Access test records
        doc = frappe.get_doc(test_records[0])
        doc.insert()
```

**How Frappe Uses It:**
```python
# In frappe/test_runner.py
def make_test_records_for_doctype(doctype, verbose=0, force=False, commit=False):
    module, test_module = get_modules(doctype)
    
    if hasattr(test_module, "_make_test_records"):
        # Method 3 takes precedence
        frappe.local.test_objects[doctype] += test_module._make_test_records(verbose)
    
    elif hasattr(test_module, "test_records"):
        # Method 2: Use test_records variable
        frappe.local.test_objects[doctype] = make_test_objects(
            doctype, test_module.test_records, verbose, force, commit=commit
        )
    
    else:
        # Method 1: Load from JSON
        test_records = frappe.get_test_records(doctype)
        if test_records:
            frappe.local.test_objects[doctype] += make_test_objects(
                doctype, test_records, verbose, force, commit=commit
            )
```

**Advantages:**
- ✅ Can use Python logic to generate data
- ✅ Can combine JSON data with programmatic data
- ✅ More flexible than JSON

**Disadvantages:**
- ❌ Mixes data with test code
- ❌ Less readable for complex structures

### Method 3: _make_test_records() Function

**Location:** In your test file (`test_my_doctype.py`)

**Structure:** Function that returns list of document names

**Example:**
```python
# test_my_doctype.py
import frappe
from frappe.test_runner import make_test_objects
from frappe.tests.utils import FrappeTestCase

def _make_test_records(verbose=None):
    """Create test records programmatically"""
    test_data = []
    
    # Generate multiple test records
    for i in range(5):
        test_data.append({
            "doctype": "MyDocType",
            "field1": f"value_{i}",
            "field2": f"data_{i}",
            "date_field": frappe.utils.add_days(frappe.utils.today(), i)
        })
    
    # Create records and return their names
    return make_test_objects("MyDocType", test_data, verbose)

class TestMyDocType(FrappeTestCase):
    def test_something(self):
        # Test records are already created
        # Access via frappe.local.test_objects
        test_names = frappe.local.test_objects.get("MyDocType", [])
        doc = frappe.get_doc("MyDocType", test_names[0])
        # Test logic...
```

**How Frappe Uses It:**
```python
# In frappe/test_runner.py
if hasattr(test_module, "_make_test_records"):
    frappe.local.test_objects[doctype] += test_module._make_test_records(verbose)
```

**Advantages:**
- ✅ Maximum flexibility
- ✅ Can generate dynamic data
- ✅ Can create complex relationships programmatically
- ✅ Can handle conditional logic

**Disadvantages:**
- ❌ Most complex approach
- ❌ Harder to maintain
- ❌ Requires understanding of Frappe internals

**Priority Order:**
Frappe checks methods in this order (first match wins):
1. `_make_test_records()` function
2. `test_records` variable
3. `test_records.json` file

---

## Detailed Examples

### Example 1: Simple DocType with test_records.json

**DocType:** `Department`

**File:** `apps/hrms/hrms/hr/doctype/department/test_records.json`
```json
[
  {
    "doctype": "Department",
    "department_name": "_Test Department",
    "company": "_Test Company"
  },
  {
    "doctype": "Department",
    "department_name": "_Test Department 1",
    "company": "_Test Company"
  }
]
```

**Test File:** `test_department.py`
```python
import frappe
from frappe.tests.utils import FrappeTestCase

test_dependencies = ["Company"]

class TestDepartment(FrappeTestCase):
    def test_department_creation(self):
        # Test records are automatically created
        dept = frappe.get_doc("Department", "_Test Department")
        self.assertEqual(dept.department_name, "_Test Department")
        self.assertEqual(dept.company, "_Test Company")
    
    def test_multiple_departments(self):
        # Access all test records
        test_records = frappe.get_test_records("Department")
        self.assertEqual(len(test_records), 2)
        
        for record in test_records:
            dept = frappe.get_doc("Department", record["department_name"])
            self.assertTrue(dept.name)
```

### Example 2: Complex DocType with Child Tables

**DocType:** `Item` (with child tables: `item_defaults`, `uoms`, `reorder_levels`)

**File:** `apps/erpnext/erpnext/stock/doctype/item/test_records.json`
```json
[
  {
    "doctype": "Item",
    "item_code": "_Test Item",
    "item_name": "_Test Item",
    "description": "_Test Item 1",
    "item_group": "_Test Item Group",
    "is_stock_item": 1,
    "has_batch_no": 0,
    "has_serial_no": 0,
    "stock_uom": "_Test UOM",
    "item_defaults": [
      {
        "company": "_Test Company",
        "default_warehouse": "_Test Warehouse - _TC",
        "expense_account": "_Test Account Cost for Goods Sold - _TC",
        "income_account": "Sales - _TC"
      }
    ],
    "uoms": [
      {
        "uom": "_Test UOM",
        "conversion_factor": 1.0
      },
      {
        "uom": "_Test UOM 1",
        "conversion_factor": 10.0
      }
    ],
    "reorder_levels": [
      {
        "warehouse": "_Test Warehouse - _TC",
        "warehouse_reorder_level": 20,
        "warehouse_reorder_qty": 20,
        "material_request_type": "Purchase"
      }
    ]
  }
]
```

**Test File:** `test_item.py`
```python
import frappe
from frappe.tests.utils import FrappeTestCase

test_dependencies = ["Warehouse", "Item Group", "UOM"]
test_records = frappe.get_test_records("Item")

class TestItem(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Test records are automatically created before setUp
    
    def test_item_with_defaults(self):
        item = frappe.get_doc("Item", "_Test Item")
        
        # Check main fields
        self.assertEqual(item.item_code, "_Test Item")
        self.assertEqual(item.is_stock_item, 1)
        
        # Check child table: item_defaults
        self.assertEqual(len(item.item_defaults), 1)
        self.assertEqual(item.item_defaults[0].company, "_Test Company")
        self.assertEqual(item.item_defaults[0].default_warehouse, "_Test Warehouse - _TC")
        
        # Check child table: uoms
        self.assertEqual(len(item.uoms), 2)
        self.assertEqual(item.uoms[0].uom, "_Test UOM")
        self.assertEqual(item.uoms[0].conversion_factor, 1.0)
        
        # Check child table: reorder_levels
        self.assertEqual(len(item.reorder_levels), 1)
        self.assertEqual(item.reorder_levels[0].warehouse_reorder_level, 20)
    
    def get_item(self, idx):
        """Helper method to get test record by index"""
        item_code = test_records[idx].get("item_code")
        if not frappe.db.exists("Item", item_code):
            item = frappe.copy_doc(test_records[idx])
            item.insert()
        else:
            item = frappe.get_doc("Item", item_code)
        return item
```

### Example 3: Using test_records Variable

**Test File:** `test_custom_doctype.py`
```python
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import today, add_days

# Define test_records as Python variable
test_records = [
    {
        "doctype": "CustomDocType",
        "title": "Test Record 1",
        "date": today(),
        "status": "Active"
    },
    {
        "doctype": "CustomDocType",
        "title": "Test Record 2",
        "date": add_days(today(), 1),
        "status": "Inactive"
    }
]

# Or combine with JSON data
json_records = frappe.get_test_records("CustomDocType")
test_records = json_records + [
    {
        "doctype": "CustomDocType",
        "title": "Dynamic Record",
        "date": today()
    }
]

class TestCustomDocType(FrappeTestCase):
    def test_with_variable_records(self):
        # Access test records
        doc = frappe.get_doc(test_records[0])
        self.assertEqual(doc.title, "Test Record 1")
```

### Example 4: Using _make_test_records() Function

**Test File:** `test_account.py`
```python
import frappe
from frappe.test_runner import make_test_objects
from frappe.tests.utils import FrappeTestCase

test_dependencies = ["Company"]

def _make_test_records(verbose=None):
    """Create test accounts for multiple companies"""
    test_data = []
    
    companies = ["_Test Company", "_Test Company 1"]
    account_types = ["Bank", "Cash", "Expense"]
    
    for company in companies:
        for acc_type in account_types:
            test_data.append({
                "doctype": "Account",
                "account_name": f"{acc_type} - {company}",
                "account_type": acc_type,
                "company": company,
                "parent_account": f"Application of Funds (Assets) - {company.split()[-1]}"
            })
    
    # Create records and return their names
    return make_test_objects("Account", test_data, verbose)

class TestAccount(FrappeTestCase):
    def test_accounts_created(self):
        # Check that accounts were created
        account_names = frappe.local.test_objects.get("Account", [])
        self.assertGreater(len(account_names), 0)
        
        # Verify accounts exist
        for name in account_names:
            account = frappe.get_doc("Account", name)
            self.assertTrue(account.name)
```

### Example 5: DocType with Fixed Names and Submitted Status

**File:** `test_records.json`
```json
[
  {
    "doctype": "Sales Invoice",
    "name": "_Test Sales Invoice-00001",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "posting_date": "2024-01-01",
    "items": [
      {
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
      }
    ],
    "docstatus": 1
  }
]
```

**Key Points:**
- `"name"` field specifies fixed name
- `"docstatus": 1` means document will be submitted after creation
- Frappe automatically handles submission

**How It Works:**
```python
# In frappe/test_runner.py - make_test_objects()
docstatus = d.docstatus
d.docstatus = 0  # Set to draft for insertion

try:
    d.insert(ignore_if_duplicate=True)
    
    if docstatus == 1:
        d.submit()  # Submit if docstatus was 1
```

### Example 6: Handling Dependencies

**Test File:** `test_sales_invoice.py`
```python
import frappe
from frappe.tests.utils import FrappeTestCase

# Explicitly declare dependencies
test_dependencies = [
    "Company",
    "Customer", 
    "Item",
    "Price List",
    "Cost Center"
]

# Ignore certain dependencies to break circular dependencies
test_ignore = ["Account"]  # Account depends on Company, but we'll create manually

class TestSalesInvoice(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Dependencies are automatically created before setUp runs
        # Company, Customer, Item, etc. are already available
    
    def test_sales_invoice_creation(self):
        # All dependencies are ready
        si = frappe.get_doc({
            "doctype": "Sales Invoice",
            "customer": "_Test Customer",  # From test_records
            "company": "_Test Company",    # From test_records
            "items": [{
                "item_code": "_Test Item",  # From test_records
                "qty": 10,
                "rate": 100
            }]
        })
        si.insert()
        self.assertTrue(si.name)
```

**Dependency Resolution Flow:**
```
1. Test runner sees test_dependencies = ["Company", "Customer", "Item"]
2. Checks if Company test_records exist
   → Creates Company test_records first
3. Checks if Customer test_records exist
   → Creates Customer test_records (Company already exists)
4. Checks if Item test_records exist
   → Creates Item test_records (Company, Item Group already exist)
5. Finally creates Sales Invoice test_records
```

---

## Use Cases

### Use Case 1: Testing Business Logic with Consistent Data

**Scenario:** Testing sales invoice calculations

```python
# test_records.json defines standard test items with known prices
[
  {
    "doctype": "Item",
    "item_code": "_Test Item - Standard",
    "standard_rate": 100.0
  }
]

# test_sales_invoice.py
class TestSalesInvoiceCalculations(FrappeTestCase):
    def test_tax_calculation(self):
        # Always uses _Test Item - Standard with rate 100
        item = frappe.get_doc("Item", "_Test Item - Standard")
        # Test calculations are consistent
```

### Use Case 2: Testing Workflows Across Multiple DocTypes

**Scenario:** Testing purchase order → purchase receipt → purchase invoice workflow

```python
# Each DocType has test_records.json
# test_purchase_order.json
# test_purchase_receipt.json  
# test_purchase_invoice.json

class TestPurchaseWorkflow(FrappeTestCase):
    def test_complete_workflow(self):
        # All test records are available
        po = frappe.get_doc("Purchase Order", "_Test Purchase Order")
        pr = make_purchase_receipt(po.name)
        pi = make_purchase_invoice(pr.name)
        # Test workflow logic
```

### Use Case 3: Testing Permissions with Test Users

**Scenario:** Testing document access with different user roles

```python
# test_records.json creates test users
[
  {
    "doctype": "User",
    "email": "test_user@example.com",
    "first_name": "Test",
    "roles": [{"role": "Sales User"}]
  }
]

class TestPermissions(FrappeTestCase):
    def test_user_access(self):
        frappe.set_user("test_user@example.com")
        # Test user permissions
```

### Use Case 4: Testing Reports with Known Data

**Scenario:** Testing report generation with predictable data

```python
# test_records.json creates multiple sales invoices
# Report tests can rely on known data

class TestSalesReport(FrappeTestCase):
    def test_report_data(self):
        # Test records ensure report has known data
        report_data = frappe.get_all("Sales Invoice", filters={"customer": "_Test Customer"})
        # Assertions are predictable
```

### Use Case 5: Testing Custom Validations

**Scenario:** Testing custom field validations

```python
# test_records.json provides valid test data
# Tests can verify validations work correctly

class TestCustomValidations(FrappeTestCase):
    def test_validation_passes(self):
        # Test records should pass validation
        doc = frappe.get_doc("MyDocType", "_Test Record")
        self.assertTrue(doc.is_valid())
    
    def test_validation_fails(self):
        # Create invalid data programmatically
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "invalid_value"
        })
        with self.assertRaises(frappe.ValidationError):
            doc.insert()
```

---

## Generic Steps for Creating and Using test_records

### Step 1: Identify Your Test Data Needs

1. **List Required Fields**
   - Check DocType meta for mandatory fields
   - Identify Link fields (dependencies)
   - Note child tables

2. **Identify Dependencies**
   - List all Link fields
   - Check child table Link fields
   - Determine dependency order

3. **Plan Test Scenarios**
   - What data variations do you need?
   - How many test records?
   - What edge cases to cover?

### Step 2: Choose the Right Method

**Use test_records.json if:**
- Data is static
- Multiple records needed
- Simple structure

**Use test_records variable if:**
- Need to combine JSON with Python logic
- Simple dynamic data

**Use _make_test_records() if:**
- Complex dynamic generation
- Conditional logic needed
- Many variations

### Step 3: Create test_records.json File

1. **Navigate to DocType Directory**
   ```bash
   cd apps/your_app/your_app/module/doctype/your_doctype/
   ```

2. **Create test_records.json**
   ```bash
   touch test_records.json
   ```

3. **Write JSON Structure**
   ```json
   [
     {
       "doctype": "YourDocType",
       "field1": "value1",
       "field2": "value2"
     }
   ]
   ```

4. **Validate JSON**
   ```bash
   python -m json.tool test_records.json
   ```

### Step 4: Handle Dependencies

1. **Declare test_dependencies**
   ```python
   # In test file
   test_dependencies = ["Company", "Customer"]
   ```

2. **Use test_ignore if Needed**
   ```python
   # Break circular dependencies
   test_ignore = ["Account"]
   ```

3. **Verify Dependency Creation**
   ```python
   def setUp(self):
       super().setUp()
       # Dependencies are created automatically
       self.assertTrue(frappe.db.exists("Company", "_Test Company"))
   ```

### Step 5: Write Your Test File

1. **Import Required Modules**
   ```python
   import frappe
   from frappe.tests.utils import FrappeTestCase
   ```

2. **Load test_records (if using variable method)**
   ```python
   test_records = frappe.get_test_records("YourDocType")
   ```

3. **Declare Dependencies**
   ```python
   test_dependencies = ["Company"]
   ```

4. **Write Test Methods**
   ```python
   class TestYourDocType(FrappeTestCase):
       def test_something(self):
           # Access test records
           doc = frappe.get_doc(test_records[0])
           # Or
           doc = frappe.get_doc("YourDocType", "_Test Record Name")
           # Test logic...
   ```

### Step 6: Access test_records in Tests

**Method 1: By Name (if name is fixed)**
```python
doc = frappe.get_doc("YourDocType", "_Test Record Name")
```

**Method 2: From test_records Variable**
```python
test_records = frappe.get_test_records("YourDocType")
doc = frappe.get_doc(test_records[0])
doc.insert()  # If not already created
```

**Method 3: From frappe.local.test_objects**
```python
# After _make_test_records()
test_names = frappe.local.test_objects.get("YourDocType", [])
doc = frappe.get_doc("YourDocType", test_names[0])
```

**Method 4: Copy and Modify**
```python
test_records = frappe.get_test_records("YourDocType")
doc = frappe.copy_doc(test_records[0])
doc.field1 = "modified_value"
doc.insert()
```

### Step 7: Run Tests

1. **Run Tests Normally**
   ```bash
   bench --site test_site run-tests --doctype YourDocType
   ```

2. **Force Recreation (if needed)**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --force
   ```

3. **Verbose Output (for debugging)**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --verbose
   ```

4. **Skip test_records (if needed)**
   ```bash
   bench --site test_site run-tests --skip-test-records
   ```

### Step 8: Verify Test Records Creation

1. **Check .test_log File**
   ```bash
   cat sites/test_site/.test_log
   # Should list YourDocType
   ```

2. **Query Database**
   ```python
   # In test or console
   frappe.get_all("YourDocType", filters={"name": ("like", "_Test%")})
   ```

3. **Use Verbose Flag**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --verbose
   # Shows creation messages
   ```

### Complete Example: End-to-End

**1. Create DocType Structure**
```
apps/my_app/my_app/custom/doctype/my_custom_doctype/
├── my_custom_doctype.json
├── my_custom_doctype.py
├── test_my_custom_doctype.py
└── test_records.json  ← Create this
```

**2. Write test_records.json**
```json
[
  {
    "doctype": "My Custom DocType",
    "title": "_Test Record 1",
    "status": "Active",
    "company": "_Test Company",
    "child_table": [
      {
        "field1": "value1",
        "field2": "value2"
      }
    ]
  },
  {
    "doctype": "My Custom DocType",
    "title": "_Test Record 2",
    "status": "Inactive",
    "company": "_Test Company"
  }
]
```

**3. Write Test File**
```python
# test_my_custom_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase

# Declare dependencies
test_dependencies = ["Company"]

# Load test records (optional, for direct access)
test_records = frappe.get_test_records("My Custom DocType")

class TestMyCustomDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Test records are automatically created before setUp
    
    def test_record_creation(self):
        # Access by name
        doc = frappe.get_doc("My Custom DocType", "_Test Record 1")
        self.assertEqual(doc.title, "_Test Record 1")
        self.assertEqual(doc.status, "Active")
    
    def test_multiple_records(self):
        # Access all test records
        self.assertEqual(len(test_records), 2)
        
        for record in test_records:
            doc = frappe.get_doc("My Custom DocType", record["title"])
            self.assertTrue(doc.name)
    
    def test_with_modifications(self):
        # Copy and modify test record
        doc = frappe.copy_doc(test_records[0])
        doc.status = "Modified"
        doc.insert()
        self.assertEqual(doc.status, "Modified")
    
    def test_child_table(self):
        doc = frappe.get_doc("My Custom DocType", "_Test Record 1")
        self.assertEqual(len(doc.child_table), 1)
        self.assertEqual(doc.child_table[0].field1, "value1")
```

**4. Run Tests**
```bash
bench --site test_site run-tests --doctype "My Custom DocType"
```

---

## Best Practices

### 1. Naming Conventions

**✅ Good:**
- Use `_Test` prefix for test records
- Be descriptive: `_Test Company`, `_Test Customer - Retail`
- Use consistent naming patterns

**❌ Bad:**
- Generic names: `Test1`, `Test2`
- Production-like names: `Acme Corporation`
- Inconsistent patterns

### 2. Include Only Necessary Fields

**✅ Good:**
```json
{
  "doctype": "Item",
  "item_code": "_Test Item",
  "item_name": "_Test Item",
  "is_stock_item": 1
}
```

**❌ Bad:**
```json
{
  "doctype": "Item",
  "item_code": "_Test Item",
  "item_name": "_Test Item",
  "description": "Long description...",
  "image": "...",
  "website_image": "...",
  "thumbnail": "...",
  // 50+ more fields not used in tests
}
```

### 3. Handle Dependencies Explicitly

**✅ Good:**
```python
test_dependencies = ["Company", "Customer", "Item"]
test_ignore = ["Account"]  # Break circular dependency
```

**❌ Bad:**
```python
# No dependencies declared, relying on auto-detection
# May fail if dependencies change
```

### 4. Use Fixed Names When Needed

**✅ Good:**
```json
{
  "doctype": "Sales Invoice",
  "name": "_Test Sales Invoice-00001",
  "customer": "_Test Customer"
}
```

**When to Use:**
- When tests reference records by name
- When testing naming series
- When records are referenced across tests

### 5. Document Complex test_records

**✅ Good:**
```python
def _make_test_records(verbose=None):
    """
    Create test accounts for multiple companies.
    
    Creates:
    - Bank accounts for each company
    - Cash accounts for each company
    - Expense accounts for each company
    
    Returns list of account names.
    """
    # Implementation...
```

### 6. Keep test_records.json Valid

**✅ Good:**
- Validate JSON before committing
- Use JSON linter
- Test JSON loading

**❌ Bad:**
- Invalid JSON syntax
- Missing commas
- Unclosed brackets

### 7. Version Control test_records

**✅ Good:**
- Commit test_records.json to git
- Keep test data stable
- Document changes

**❌ Bad:**
- Ignoring test_records.json in .gitignore
- Frequently changing test data
- No documentation

### 8. Reuse When Possible

**✅ Good:**
```python
# Reuse test records across tests
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        self.test_records = frappe.get_test_records("MyDocType")
    
    def test_one(self):
        doc = frappe.get_doc(self.test_records[0])
        # Test...
    
    def test_two(self):
        doc = frappe.get_doc(self.test_records[0])  # Reuse
        # Test...
```

**❌ Bad:**
```python
# Creating same data in each test
def test_one(self):
    doc = frappe.get_doc({"doctype": "MyDocType", "field1": "value"})
    doc.insert()
    # Test...

def test_two(self):
    doc = frappe.get_doc({"doctype": "MyDocType", "field1": "value"})  # Duplicate
    doc.insert()
    # Test...
```

### 9. Handle Errors Gracefully

**✅ Good:**
```python
def _make_test_records(verbose=None):
    try:
        # Create records
        return make_test_objects("MyDocType", test_data, verbose)
    except Exception as e:
        if verbose:
            print(f"Error creating test records: {e}")
        return []
```

### 10. Test test_records Themselves

**✅ Good:**
```python
class TestMyDocType(FrappeTestCase):
    def test_test_records_valid(self):
        """Verify test_records are valid"""
        test_records = frappe.get_test_records("MyDocType")
        for record in test_records:
            doc = frappe.get_doc(record)
            doc.validate()  # Ensure valid
```

---

## Troubleshooting

### Problem 1: test_records Not Created

**Symptoms:**
- Tests fail with "Record not found"
- `frappe.get_doc()` returns None

**Solutions:**

1. **Check File Location**
   ```bash
   # Verify file exists
   ls apps/your_app/your_app/module/doctype/your_doctype/test_records.json
   ```

2. **Check JSON Validity**
   ```bash
   python -m json.tool test_records.json
   ```

3. **Check Dependencies**
   ```python
   # Ensure dependencies are declared
   test_dependencies = ["Company"]
   ```

4. **Run with Verbose**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --verbose
   ```

5. **Force Recreation**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --force
   ```

### Problem 2: Circular Dependencies

**Symptoms:**
- Tests hang
- Dependency errors
- Infinite loops

**Solutions:**

1. **Use test_ignore**
   ```python
   test_ignore = ["Account"]  # Break cycle
   ```

2. **Create Manually**
   ```python
   def setUp(self):
       super().setUp()
       if not frappe.db.exists("Account", "_Test Account"):
           # Create manually
           create_account()
   ```

3. **Reorder Dependencies**
   ```python
   # Create in correct order
   test_dependencies = ["Company"]  # First
   # Then create Account manually
   ```

### Problem 3: test_records Already Exist

**Symptoms:**
- Old data used in tests
- Tests fail unexpectedly
- Data not updated

**Solutions:**

1. **Use force Flag**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --force
   ```

2. **Delete in setUp**
   ```python
   def setUp(self):
       super().setUp()
       if frappe.db.exists("YourDocType", "_Test Record"):
           frappe.delete_doc("YourDocType", "_Test Record")
   ```

3. **Clear .test_log**
   ```bash
   rm sites/test_site/.test_log
   ```

### Problem 4: Missing Required Fields

**Symptoms:**
- Validation errors
- "Field is mandatory" errors

**Solutions:**

1. **Check Mandatory Fields**
   ```python
   # In frappe/test_runner.py
   def print_mandatory_fields(doctype):
       # Shows required fields
   ```

2. **Run with Verbose**
   ```bash
   bench --site test_site run-tests --doctype YourDocType --verbose
   # Shows missing fields
   ```

3. **Check DocType Meta**
   ```python
   meta = frappe.get_meta("YourDocType")
   required_fields = [f for f in meta.fields if f.reqd]
   ```

### Problem 5: Child Table Data Not Created

**Symptoms:**
- Main document created but child table empty
- Child table validation fails

**Solutions:**

1. **Verify JSON Structure**
   ```json
   {
     "doctype": "Parent",
     "child_table": [
       {
         "field1": "value1"
       }
     ]
   }
   ```

2. **Check Child Table Field Name**
   ```python
   # Ensure field name matches DocType definition
   meta = frappe.get_meta("YourDocType")
   child_tables = [f.fieldname for f in meta.fields if f.fieldtype == "Table"]
   ```

3. **Use frappe.copy_doc**
   ```python
   # Ensures child tables are copied correctly
   doc = frappe.copy_doc(test_records[0])
   doc.insert()
   ```

### Problem 6: Naming Series Issues

**Symptoms:**
- Names don't match expectations
- Series not reverted on failure

**Solutions:**

1. **Specify Naming Series**
   ```json
   {
     "doctype": "Sales Invoice",
     "naming_series": "TEST-SINV-",
     "customer": "_Test Customer"
   }
   ```

2. **Use Fixed Names**
   ```json
   {
     "doctype": "Sales Invoice",
     "name": "_Test Sales Invoice-00001",
     "customer": "_Test Customer"
   }
   ```

3. **Check Series Reversion**
   ```python
   # Frappe automatically reverts series on failure
   # Ensure test_records have valid data
   ```

---

## Summary

### Key Takeaways

1. **test_records provide consistent, reusable test data**
2. **Three methods: JSON file, Python variable, or function**
3. **Dependencies are automatically resolved**
4. **Records are cached for performance**
5. **Priority: _make_test_records() > test_records variable > test_records.json**

### Quick Reference

**Create test_records.json:**
```json
[
  {
    "doctype": "YourDocType",
    "field1": "value1"
  }
]
```

**Load in test file:**
```python
test_records = frappe.get_test_records("YourDocType")
```

**Declare dependencies:**
```python
test_dependencies = ["Company", "Customer"]
```

**Access in tests:**
```python
doc = frappe.get_doc("YourDocType", "_Test Record")
# Or
doc = frappe.get_doc(test_records[0])
```

**Run tests:**
```bash
bench --site test_site run-tests --doctype YourDocType
```

---

This guide covers everything you need to know about test_records in Frappe unit testing. Use it as a reference when creating and maintaining your test data.

