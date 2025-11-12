# Frappe Unit Testing Guide - Part 5: Test Data Management

## Table of Contents
1. [Introduction](#introduction)
2. [test_records.json Files](#test_recordsjson-files)
3. [Test Dependencies](#test-dependencies)
4. [Programmatic Test Data Creation](#programmatic-test-data-creation)
5. [The _make_test_records Function](#the-_make_test_records-function)
6. [Test Data in Test Files](#test-data-in-test-files)
7. [Managing Test Fixtures](#managing-test-fixtures)
8. [Test Data Cleanup](#test-data-cleanup)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)
11. [Troubleshooting Test Data](#troubleshooting-test-data)

---

## Introduction

Effective test data management is crucial for reliable and maintainable tests. Frappe provides several mechanisms for creating and managing test data:

- **test_records.json**: JSON files containing test data definitions
- **test_dependencies**: Automatic dependency resolution
- **_make_test_records()**: Programmatic test data creation
- **test_records variable**: In-memory test data definitions

This guide covers all aspects of test data management in Frappe.

---

## test_records.json Files

The simplest way to define test data is using `test_records.json` files. These files are automatically discovered and used by Frappe's test runner.

### File Location

Test records JSON files must be located in the DocType's directory:

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

**Example Path**: `apps/frappe/frappe/core/doctype/user/test_records.json`

### File Structure

`test_records.json` is a JSON array where each object represents a test record:

```json
[
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
```

### Complete Example

```json
[
  {
    "doctype": "User",
    "email": "test@example.com",
    "enabled": 1,
    "first_name": "_Test",
    "new_password": "SecurePassword123",
    "roles": [
      {
        "doctype": "Has Role",
        "parentfield": "roles",
        "role": "System Manager"
      }
    ]
  },
  {
    "doctype": "User",
    "email": "test1@example.com",
    "first_name": "_Test1",
    "new_password": "SecurePassword123",
    "enabled": 1
  }
]
```

### Key Features

1. **Automatic Discovery**: Frappe automatically finds and loads `test_records.json` files
2. **Automatic Creation**: Records are created automatically when tests run
3. **Dependency Resolution**: Linked DocTypes are automatically created first
4. **Naming Series**: Automatic naming series handling
5. **Child Tables**: Support for child table records

### Child Table Records

Include child table records in the JSON:

```json
[
  {
    "doctype": "Sales Invoice",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "items": [
      {
        "doctype": "Sales Invoice Item",
        "parentfield": "items",
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
      },
      {
        "doctype": "Sales Invoice Item",
        "parentfield": "items",
        "item_code": "_Test Item 2",
        "qty": 5,
        "rate": 50
      }
    ]
  }
]
```

### Submitted Documents

Set `docstatus` to 1 to create submitted documents:

```json
[
  {
    "doctype": "Sales Invoice",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "docstatus": 1,
    "items": [
      {
        "doctype": "Sales Invoice Item",
        "parentfield": "items",
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
      }
    ]
  }
]
```

**Note**: Documents with `docstatus: 1` are automatically submitted after insertion.

### Fixed Names

You can specify fixed names for test records:

```json
[
  {
    "doctype": "MyDocType",
    "name": "_Test Fixed Name",
    "field1": "value1"
  }
]
```

**Important**: If a document with the specified name already exists, it won't be recreated unless `force=True` is used.

### Naming Series

If you don't specify a name, Frappe will:
1. Use the naming series if specified in the record
2. Use default naming series `_T-{DocType}-` if no series is specified
3. Generate a unique name automatically

```json
[
  {
    "doctype": "MyDocType",
    "naming_series": "TEST-",
    "field1": "value1"
  }
]
```

---

## Test Dependencies

Frappe automatically resolves dependencies when creating test records. Dependencies are DocTypes that are linked to your DocType.

### Automatic Dependency Resolution

Frappe automatically:
1. Finds all Link fields in your DocType
2. Finds all Link fields in child tables
3. Creates test records for all linked DocTypes first
4. Handles circular dependencies

### Explicit Dependencies

You can explicitly declare dependencies in your test file:

```python
# test_my_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase

# Declare explicit dependencies
test_dependencies = ["Company", "Customer", "Item"]

class TestMyDocType(FrappeTestCase):
    def test_something(self):
        # Company, Customer, and Item test records are created first
        pass
```

### How Dependencies Work

1. **Link Fields**: All Link fields are automatically detected
2. **Child Tables**: Link fields in child tables are also detected
3. **Explicit Dependencies**: `test_dependencies` list adds additional dependencies
4. **Recursive**: Dependencies of dependencies are also created
5. **Ordering**: Dependencies are created in the correct order

### Example: Complex Dependencies

```python
# test_sales_invoice.py
test_dependencies = ["Company", "Customer", "Item", "Price List"]

class TestSalesInvoice(FrappeTestCase):
    # Sales Invoice has:
    # - Link to Company
    # - Link to Customer
    # - Child table with Link to Item
    # - Link to Price List (explicit dependency)
    
    # All these will be created automatically:
    # 1. Company (and its dependencies)
    # 2. Customer (and its dependencies)
    # 3. Item (and its dependencies)
    # 4. Price List (and its dependencies)
    # 5. Sales Invoice
    pass
```

### Ignoring Dependencies

You can ignore certain dependencies:

```python
# test_my_doctype.py
test_dependencies = ["Company", "Customer"]
test_ignore = ["User"]  # Don't create User test records

class TestMyDocType(FrappeTestCase):
    pass
```

**Use Cases**:
- When a dependency is too expensive to create
- When a dependency is not needed for your tests
- When a dependency causes issues

### Global Test Dependencies

Define dependencies that apply to all tests in an app:

```python
# your_app/your_app/tests/__init__.py
global_test_dependencies = ["User", "Company"]
```

These dependencies are created once for all tests in the app.

---

## Programmatic Test Data Creation

Sometimes you need to create test data programmatically, especially when:
- Data depends on runtime conditions
- Data needs to be generated dynamically
- Complex logic is required

### Using frappe.get_doc()

The most common way to create test data programmatically:

```python
class TestMyDocType(FrappeTestCase):
    def test_with_programmatic_data(self):
        # Create test document
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1",
            "field2": "value2"
        })
        doc.insert()
        
        # Use the document in tests
        self.assertEqual(doc.field1, "value1")
```

### Using frappe.new_doc()

Create a new document instance:

```python
def test_with_new_doc(self):
    doc = frappe.new_doc("MyDocType")
    doc.field1 = "value1"
    doc.field2 = "value2"
    doc.insert()
    
    self.assertIsNotNone(doc.name)
```

### Creating Multiple Records

```python
def test_multiple_records(self):
    records = []
    for i in range(5):
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": f"value_{i}",
            "field2": i * 10
        })
        doc.insert()
        records.append(doc.name)
    
    # Verify all records created
    self.assertEqual(len(records), 5)
    for name in records:
        self.assertTrue(frappe.db.exists("MyDocType", name))
```

### Creating Records with Child Tables

```python
def test_with_child_table(self):
    doc = frappe.get_doc({
        "doctype": "Sales Invoice",
        "customer": "_Test Customer",
        "company": "_Test Company",
        "items": []
    })
    
    # Add child records
    doc.append("items", {
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
    })
    doc.append("items", {
        "item_code": "_Test Item 2",
        "qty": 5,
        "rate": 50
    })
    
    doc.insert()
    
    self.assertEqual(len(doc.items), 2)
```

### Using Helper Functions

Create reusable helper functions:

```python
class TestMyDocType(FrappeTestCase):
    def create_test_document(self, **kwargs):
        """Helper to create test document"""
        defaults = {
            "doctype": "MyDocType",
            "field1": "default_value1",
            "field2": "default_value2"
        }
        defaults.update(kwargs)
        doc = frappe.get_doc(defaults)
        doc.insert()
        return doc
    
    def test_scenario_one(self):
        doc = self.create_test_document(field1="custom_value")
        # Test logic
    
    def test_scenario_two(self):
        doc = self.create_test_document(
            field1="value1",
            field2="value2"
        )
        # Test logic
```

### Creating Related Records

```python
def test_related_records(self):
    # Create parent
    parent = frappe.get_doc({
        "doctype": "Company",
        "company_name": "_Test Company",
        "abbr": "_TC"
    })
    parent.insert()
    
    # Create child with reference to parent
    child = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": "_Test Customer",
        "company": parent.name
    })
    child.insert()
    
    # Verify relationship
    self.assertEqual(child.company, parent.name)
```

---

## The _make_test_records Function

For complex test data that requires programmatic generation, use the `_make_test_records()` function.

### Function Signature

```python
def _make_test_records(verbose=None):
    """
    Create test records programmatically.
    
    Args:
        verbose: If True, print progress messages
    
    Returns:
        List of document names created
    """
    pass
```

### When to Use _make_test_records

Use `_make_test_records()` when:
- Test data depends on other records that must be created first
- You need to create records for multiple companies/sites
- Complex logic is required to generate test data
- You need to create many variations of records

### Basic Example

```python
# test_my_doctype.py
from frappe.test_runner import make_test_objects

def _make_test_records(verbose=None):
    """Create test records for MyDocType"""
    records = []
    
    # Create test records
    test_data = [
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
    
    records = make_test_objects("MyDocType", test_data, verbose=verbose)
    return records
```

### Advanced Example: Multiple Companies

```python
def _make_test_records(verbose=None):
    """Create test records for multiple companies"""
    from frappe.test_runner import make_test_objects
    
    records = []
    
    companies = [
        ("_Test Company", "_TC"),
        ("_Test Company 1", "_TC1")
    ]
    
    for company_name, abbr in companies:
        test_data = [
            {
                "doctype": "Account",
                "account_name": f"_Test Account - {company_name}",
                "company": company_name,
                "parent_account": f"Accounts Receivable - {abbr}",
                "account_type": "Receivable"
            }
        ]
        
        company_records = make_test_objects("Account", test_data, verbose=verbose)
        records.extend(company_records)
    
    return records
```

### Using make_test_objects

The `make_test_objects()` function is used internally by Frappe:

```python
from frappe.test_runner import make_test_objects

def _make_test_records(verbose=None):
    test_data = [
        {
            "doctype": "MyDocType",
            "field1": "value1"
        }
    ]
    
    # make_test_objects returns list of document names
    records = make_test_objects(
        "MyDocType",
        test_data,
        verbose=verbose,
        reset=False,  # Don't recreate if exists
        commit=False  # Don't commit after each record
    )
    
    return records
```

### Parameters for make_test_objects

- `doctype`: DocType name
- `test_records`: List of dictionaries (test data)
- `verbose`: Print progress messages
- `reset`: If True, recreate records even if they exist
- `commit`: If True, commit after each record

### Real-World Example

From `erpnext/accounts/doctype/account/test_account.py`:

```python
def _make_test_records(verbose=None):
    from frappe.test_runner import make_test_objects
    
    accounts = [
        # [account_name, parent_account, is_group, account_type, currency]
        ["_Test Bank", "Bank Accounts", 0, "Bank", None],
        ["_Test Cash", "Cash In Hand", 0, "Cash", None],
        ["_Test Account Stock Expenses", "Direct Expenses", 1, None, None],
    ]
    
    records = []
    for company, abbr in [
        ("_Test Company", "_TC"),
        ("_Test Company 1", "_TC1"),
    ]:
        test_objects = make_test_objects(
            "Account",
            [
                {
                    "doctype": "Account",
                    "account_name": account_name,
                    "parent_account": parent_account + " - " + abbr,
                    "company": company,
                    "is_group": is_group,
                    "account_type": account_type,
                    "account_currency": currency,
                }
                for account_name, parent_account, is_group, account_type, currency in accounts
            ],
        )
        records.extend(test_objects)
    
    return records
```

---

## Test Data in Test Files

You can also define test data directly in your test files.

### Using test_records Variable

```python
# test_my_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase

# Define test records in the test file
test_records = frappe.get_test_records("MyDocType")

# Or define directly
test_records = [
    {
        "doctype": "MyDocType",
        "field1": "value1"
    },
    {
        "doctype": "MyDocType",
        "field1": "value2"
    }
]

class TestMyDocType(FrappeTestCase):
    def setUp(self):
        # Load test records
        self.test_records = frappe.get_test_records("MyDocType")
        # Or use the module variable
        self.test_records = test_records
    
    def test_with_test_records(self):
        # Use test records
        doc = frappe.get_doc(self.test_records[0])
        doc.insert()
        
        self.assertEqual(doc.field1, "value1")
```

### Loading from JSON

```python
# Load from test_records.json
test_records = frappe.get_test_records("MyDocType")

class TestMyDocType(FrappeTestCase):
    def test_using_json_records(self):
        # Use records from JSON file
        for record in test_records:
            doc = frappe.get_doc(record)
            doc.insert()
            # Test logic
```

### Example from Frappe Core

```python
# frappe/desk/doctype/event/test_event.py
test_records = frappe.get_test_records("Event")

class TestEvent(FrappeTestCase):
    def setUp(self):
        self.test_records = frappe.get_test_records("Event")
    
    def test_with_records(self):
        ev = frappe.get_doc(self.test_records[0])
        ev.insert()
        name = ev.name
        
        # Delete and recreate
        frappe.delete_doc("Event", ev.name)
        ev = frappe.get_doc(self.test_records[0])
        ev.insert()
        
        # Name should be the same (due to naming series reversion)
        self.assertEqual(ev.name, name)
```

---

## Managing Test Fixtures

Test fixtures are reusable test data that can be shared across multiple tests.

### Class-Level Fixtures

Use `setUpClass` for expensive fixtures:

```python
class TestMyDocType(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        
        # Create shared fixtures
        cls.company = frappe.get_doc({
            "doctype": "Company",
            "company_name": "_Test Company",
            "abbr": "_TC"
        })
        if not frappe.db.exists("Company", cls.company.company_name):
            cls.company.insert()
        else:
            cls.company = frappe.get_doc("Company", "_Test Company")
        
        cls.customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": "_Test Customer"
        })
        if not frappe.db.exists("Customer", cls.customer.customer_name):
            cls.customer.insert()
        else:
            cls.customer = frappe.get_doc("Customer", "_Test Customer")
        
        frappe.db.commit()  # Commit for sharing across tests
    
    def test_with_fixtures(self):
        # Use cls.company and cls.customer
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "company": self.company.name,
            "customer": self.customer.name
        })
        doc.insert()
```

### Method-Level Fixtures

Use `setUp` for per-test fixtures:

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        
        # Create fresh fixtures for each test
        self.test_doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "test_value"
        })
        self.test_doc.insert()
    
    def test_one(self):
        # Use self.test_doc
        pass
    
    def test_two(self):
        # Use self.test_doc (fresh instance)
        pass
```

### Shared Fixture Functions

Create reusable fixture functions:

```python
# test_fixtures.py or in test file
def create_test_company(company_name="_Test Company", abbr="_TC"):
    """Create a test company"""
    if frappe.db.exists("Company", company_name):
        return frappe.get_doc("Company", company_name)
    
    company = frappe.get_doc({
        "doctype": "Company",
        "company_name": company_name,
        "abbr": abbr
    })
    company.insert()
    return company

def create_test_customer(customer_name="_Test Customer"):
    """Create a test customer"""
    if frappe.db.exists("Customer", customer_name):
        return frappe.get_doc("Customer", customer_name)
    
    customer = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": customer_name
    })
    customer.insert()
    return customer

# Use in tests
class TestMyDocType(FrappeTestCase):
    def test_with_fixtures(self):
        company = create_test_company()
        customer = create_test_customer()
        
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "company": company.name,
            "customer": customer.name
        })
        doc.insert()
```

### Fixture Cleanup

Frappe automatically rolls back database changes, but you may need to clean up:

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        self.created_docs = []
    
    def tearDown(self):
        # Cleanup if needed (usually not required due to auto-rollback)
        for doc_name in self.created_docs:
            if frappe.db.exists("MyDocType", doc_name):
                frappe.delete_doc("MyDocType", doc_name, force=1)
        super().tearDown()
    
    def test_something(self):
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        self.created_docs.append(doc.name)
```

---

## Test Data Cleanup

Frappe automatically handles test data cleanup, but understanding the process helps.

### Automatic Rollback

Frappe automatically rolls back all database changes after each test:

```python
class TestMyDocType(FrappeTestCase):
    def test_creates_data(self):
        # Create documents
        doc1 = frappe.get_doc({"doctype": "MyDocType", "field1": "value1"}).insert()
        doc2 = frappe.get_doc({"doctype": "MyDocType", "field1": "value2"}).insert()
        
        # Documents exist during test
        self.assertTrue(frappe.db.exists("MyDocType", doc1.name))
        self.assertTrue(frappe.db.exists("MyDocType", doc2.name))
    
    # After test: All changes are automatically rolled back
    # doc1 and doc2 no longer exist
```

### Test Record Log

Frappe maintains a log of created test records in `.test_log`:

```python
# Location: sites/{site}/.test_log
# Contains list of DocTypes for which test records were created
```

This log prevents recreating test records unnecessarily.

### Force Recreation

Force recreation of test records:

```python
# In test file
from frappe.test_runner import make_test_records_for_doctype

class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Force recreation of test records
        make_test_records_for_doctype("MyDocType", force=True)
```

Or when running tests:

```bash
bench --site test_site run-tests --doctype MyDocType --force
```

### Manual Cleanup

Sometimes manual cleanup is needed:

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Delete existing test records
        frappe.db.delete("MyDocType", {"name": ["like", "_Test%"]})
        frappe.db.commit()
    
    def test_something(self):
        # Create fresh test data
        pass
```

### Cleaning Up Test Records

```python
def cleanup_test_records(doctype, pattern="_Test%"):
    """Clean up test records matching pattern"""
    names = frappe.db.get_all(
        doctype,
        filters={"name": ["like", pattern]},
        pluck="name"
    )
    
    for name in names:
        try:
            frappe.delete_doc(doctype, name, force=1)
        except Exception:
            pass
    
    frappe.db.commit()
```

---

## Best Practices

### 1. Use Descriptive Names

**Good**:
```json
{
  "doctype": "User",
  "email": "test_accounts_manager@example.com",
  "first_name": "_Test Accounts Manager"
}
```

**Bad**:
```json
{
  "doctype": "User",
  "email": "test1@example.com",
  "first_name": "Test"
}
```

### 2. Use Consistent Naming Patterns

Use a consistent prefix for test data:

```json
[
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer"
  },
  {
    "doctype": "Item",
    "item_code": "_Test Item"
  },
  {
    "doctype": "Company",
    "company_name": "_Test Company"
  }
]
```

**Common Prefixes**:
- `_Test` - Standard test prefix
- `_T-` - For naming series
- `TEST-` - Alternative prefix

### 3. Include All Required Fields

Ensure test records have all mandatory fields:

```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",  // Required
  "company": "_Test Company",     // Required
  "posting_date": "2024-01-15",   // Required
  "items": [                      // Required child table
    {
      "doctype": "Sales Invoice Item",
      "parentfield": "items",
      "item_code": "_Test Item",  // Required
      "qty": 1,                   // Required
      "rate": 100                 // Required
    }
  ]
}
```

### 4. Use Realistic Data

Use realistic test data that represents real-world scenarios:

```json
{
  "doctype": "Item",
  "item_code": "_Test Laptop",
  "item_name": "Test Laptop Computer",
  "item_group": "Electronics",
  "stock_uom": "Unit",
  "is_stock_item": 1,
  "valuation_rate": 999.99
}
```

### 5. Document Complex Test Data

Add comments in code for complex test data:

```python
def _make_test_records(verbose=None):
    """
    Create test accounts for multiple companies.
    
    Creates:
    - Bank accounts for each company
    - Cash accounts for each company
    - Expense accounts for each company
    """
    # Implementation
    pass
```

### 6. Avoid Hard-Coded IDs

**Bad**:
```python
doc = frappe.get_doc("MyDocType", "DOC-00001")  # Assumes document exists
```

**Good**:
```python
doc = frappe.get_doc({
    "doctype": "MyDocType",
    "field1": "value1"
})
doc.insert()
# Use doc.name
```

### 7. Handle Dependencies Explicitly

```python
# Explicitly declare dependencies
test_dependencies = ["Company", "Customer", "Item"]

class TestMyDocType(FrappeTestCase):
    # Dependencies are created automatically
    pass
```

### 8. Reuse Test Records

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Load test records once
        self.test_records = frappe.get_test_records("MyDocType")
    
    def test_one(self):
        # Use test records
        doc = frappe.get_doc(self.test_records[0])
        doc.insert()
    
    def test_two(self):
        # Reuse same test records
        doc = frappe.get_doc(self.test_records[1])
        doc.insert()
```

### 9. Keep Test Data Minimal

Only include fields necessary for tests:

**Good**:
```json
{
  "doctype": "MyDocType",
  "field1": "value1",  // Only required fields
  "field2": "value2"   // Only fields used in tests
}
```

**Bad**:
```json
{
  "doctype": "MyDocType",
  "field1": "value1",
  "field2": "value2",
  "field3": "unused_value",  // Not used in tests
  "field4": "unused_value",  // Not used in tests
  // ... 20 more unused fields
}
```

### 10. Version Control Test Data

Keep test data in version control:
- `test_records.json` files should be committed
- Test data should be stable and predictable
- Avoid test data that changes frequently

---

## Common Patterns

### Pattern 1: Creating Test Data with Defaults

```python
class TestMyDocType(FrappeTestCase):
    DEFAULT_DATA = {
        "doctype": "MyDocType",
        "field1": "default_value1",
        "field2": "default_value2"
    }
    
    def create_test_doc(self, **overrides):
        """Create test document with defaults and overrides"""
        data = self.DEFAULT_DATA.copy()
        data.update(overrides)
        doc = frappe.get_doc(data)
        doc.insert()
        return doc
    
    def test_with_defaults(self):
        doc = self.create_test_doc()
        self.assertEqual(doc.field1, "default_value1")
    
    def test_with_overrides(self):
        doc = self.create_test_doc(field1="custom_value")
        self.assertEqual(doc.field1, "custom_value")
```

### Pattern 2: Factory Functions

```python
def make_test_user(email=None, roles=None, **kwargs):
    """Factory function to create test users"""
    if email is None:
        email = f"test_{frappe.generate_hash(length=8)}@example.com"
    
    defaults = {
        "doctype": "User",
        "email": email,
        "first_name": "_Test",
        "new_password": "TestPassword123",
        "enabled": 1,
        "roles": roles or []
    }
    defaults.update(kwargs)
    
    if frappe.db.exists("User", email):
        return frappe.get_doc("User", email)
    
    user = frappe.get_doc(defaults)
    user.insert()
    return user

# Use in tests
class TestMyDocType(FrappeTestCase):
    def test_with_factory(self):
        user = make_test_user(
            email="custom@test.com",
            roles=[{"role": "System Manager"}]
        )
        # Use user
```

### Pattern 3: Test Data Builders

```python
class TestDataBuilder:
    """Builder pattern for complex test data"""
    
    def __init__(self, doctype):
        self.doctype = doctype
        self.data = {"doctype": doctype}
        self.child_tables = {}
    
    def with_field(self, field, value):
        self.data[field] = value
        return self
    
    def with_child(self, child_field, child_data):
        if child_field not in self.child_tables:
            self.child_tables[child_field] = []
        self.child_tables[child_field].append(child_data)
        return self
    
    def build(self):
        """Build and insert document"""
        for field, children in self.child_tables.items():
            self.data[field] = children
        
        doc = frappe.get_doc(self.data)
        doc.insert()
        return doc

# Use builder
class TestMyDocType(FrappeTestCase):
    def test_with_builder(self):
        doc = (TestDataBuilder("Sales Invoice")
            .with_field("customer", "_Test Customer")
            .with_field("company", "_Test Company")
            .with_child("items", {
                "item_code": "_Test Item",
                "qty": 10,
                "rate": 100
            })
            .build())
        
        self.assertEqual(doc.customer, "_Test Customer")
```

### Pattern 4: Test Data Templates

```python
# Define templates
TEMPLATES = {
    "minimal_invoice": {
        "doctype": "Sales Invoice",
        "customer": "_Test Customer",
        "company": "_Test Company",
        "items": [{
            "item_code": "_Test Item",
            "qty": 1,
            "rate": 100
        }]
    },
    "full_invoice": {
        "doctype": "Sales Invoice",
        "customer": "_Test Customer",
        "company": "_Test Company",
        "posting_date": "2024-01-15",
        "due_date": "2024-02-15",
        "items": [
            {"item_code": "_Test Item", "qty": 10, "rate": 100},
            {"item_code": "_Test Item 2", "qty": 5, "rate": 50}
        ],
        "taxes": [{
            "charge_type": "On Net Total",
            "rate": 10
        }]
    }
}

def create_from_template(template_name, **overrides):
    """Create document from template"""
    template = TEMPLATES[template_name].copy()
    template.update(overrides)
    doc = frappe.get_doc(template)
    doc.insert()
    return doc

# Use templates
class TestSalesInvoice(FrappeTestCase):
    def test_minimal(self):
        doc = create_from_template("minimal_invoice")
        # Test minimal invoice
    
    def test_full(self):
        doc = create_from_template("full_invoice")
        # Test full invoice
    
    def test_customized(self):
        doc = create_from_template(
            "minimal_invoice",
            posting_date="2024-02-01"
        )
        # Test with custom date
```

### Pattern 5: Test Data Inheritance

```python
def get_base_test_data():
    """Base test data that can be extended"""
    return {
        "doctype": "MyDocType",
        "field1": "base_value1",
        "field2": "base_value2"
    }

def get_extended_test_data(**overrides):
    """Extended test data"""
    data = get_base_test_data()
    data.update(overrides)
    return data

# Use inheritance
class TestMyDocType(FrappeTestCase):
    def test_base(self):
        doc = frappe.get_doc(get_base_test_data())
        doc.insert()
    
    def test_extended(self):
        doc = frappe.get_doc(get_extended_test_data(
            field3="extended_value"
        ))
        doc.insert()
```

---

## Troubleshooting Test Data

### Problem: Test Records Not Created

**Symptoms**: Tests fail with "Record not found" errors

**Solutions**:
1. Check `test_records.json` exists and is valid JSON
2. Verify file location is correct
3. Check for JSON syntax errors
4. Ensure `test_dependencies` are correct
5. Run with `--verbose` to see creation messages

```bash
# Check JSON validity
python -m json.tool test_records.json

# Run with verbose output
bench --site test_site run-tests --doctype MyDocType --verbose
```

### Problem: Circular Dependencies

**Symptoms**: Tests hang or fail with dependency errors

**Solutions**:
1. Use `test_ignore` to break circular dependencies
2. Create records manually in `setUp`
3. Use `_make_test_records()` for complex scenarios

```python
# Break circular dependency
test_dependencies = ["Company"]
test_ignore = ["Account"]  # Ignore Account to break cycle

class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create Account manually if needed
        if not frappe.db.exists("Account", "_Test Account"):
            # Create account
            pass
```

### Problem: Test Records Already Exist

**Symptoms**: Test records not recreated, tests use old data

**Solutions**:
1. Use `force=True` to recreate
2. Delete existing records in `setUp`
3. Use unique names for test records

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Delete existing test records
        frappe.db.delete("MyDocType", {"name": ["like", "_Test%"]})
        frappe.db.commit()
        
        # Recreate
        from frappe.test_runner import make_test_records_for_doctype
        make_test_records_for_doctype("MyDocType", force=True)
```

### Problem: Missing Required Fields

**Symptoms**: Validation errors when creating test records

**Solutions**:
1. Check DocType meta for required fields
2. Add all mandatory fields to test records
3. Use `ignore_mandatory` flag if appropriate

```python
def _make_test_records(verbose=None):
    # Check required fields
    meta = frappe.get_meta("MyDocType")
    required_fields = [f.fieldname for f in meta.fields if f.reqd]
    
    # Ensure all required fields are included
    test_data = {
        "doctype": "MyDocType",
        # Include all required fields
    }
    # ...
```

### Problem: Test Data Not Isolated

**Symptoms**: Tests interfere with each other

**Solutions**:
1. Use unique names for each test
2. Clean up in `tearDown`
3. Use `setUp` to create fresh data

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create unique test data
        self.unique_id = frappe.generate_hash(length=8)
        self.test_doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": f"test_{self.unique_id}"
        })
        self.test_doc.insert()
```

### Problem: Slow Test Data Creation

**Symptoms**: Tests run slowly due to test data creation

**Solutions**:
1. Use `setUpClass` for shared data
2. Skip test record creation when not needed
3. Optimize `_make_test_records()` function
4. Use `--skip-test-records` when records exist

```python
class TestMyDocType(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create expensive test data once
        cls.company = create_expensive_company()
        frappe.db.commit()
    
    def test_one(self):
        # Use cls.company (created once)
        pass
    
    def test_two(self):
        # Use cls.company (reused)
        pass
```

### Problem: Test Records with Special Characters

**Symptoms**: JSON parsing errors or validation issues

**Solutions**:
1. Escape special characters properly in JSON
2. Use Unicode escape sequences if needed
3. Validate JSON before committing

```json
{
  "doctype": "User",
  "email": "test'5@example.com",  // Single quote in email
  "first_name": "_Test'5"         // Single quote in name
}
```

### Problem: Child Table Records Not Created

**Symptoms**: Parent document created but child records missing

**Solutions**:
1. Ensure `doctype` and `parentfield` are specified
2. Check child table field name is correct
3. Verify child table structure matches DocType

```json
{
  "doctype": "Sales Invoice",
  "items": [
    {
      "doctype": "Sales Invoice Item",  // Required
      "parentfield": "items",            // Required
      "item_code": "_Test Item",
      "qty": 10,
      "rate": 100
    }
  ]
}
```

---

## Advanced Test Data Scenarios

### Scenario 1: Multi-Company Test Data

```python
def _make_test_records(verbose=None):
    """Create test data for multiple companies"""
    from frappe.test_runner import make_test_objects
    
    companies = [
        ("_Test Company", "_TC"),
        ("_Test Company 1", "_TC1"),
        ("_Test Company with perpetual inventory", "TCP1")
    ]
    
    records = []
    for company_name, abbr in companies:
        # Create company-specific test data
        test_data = [
            {
                "doctype": "Account",
                "account_name": "_Test Account",
                "company": company_name,
                "parent_account": f"Accounts Receivable - {abbr}"
            }
        ]
        
        company_records = make_test_objects("Account", test_data, verbose=verbose)
        records.extend(company_records)
    
    return records
```

### Scenario 2: Conditional Test Data

```python
def _make_test_records(verbose=None):
    """Create test data conditionally"""
    from frappe.test_runner import make_test_objects
    
    records = []
    
    # Create base records
    base_records = make_test_objects("MyDocType", [
        {"doctype": "MyDocType", "field1": "base"}
    ])
    records.extend(base_records)
    
    # Create conditional records based on settings
    if frappe.db.get_single_value("System Settings", "enable_feature_x"):
        conditional_records = make_test_objects("MyDocType", [
            {"doctype": "MyDocType", "field1": "conditional"}
        ])
        records.extend(conditional_records)
    
    return records
```

### Scenario 3: Test Data with Relationships

```python
def create_test_invoice_with_dependencies():
    """Create invoice with all dependencies"""
    # Create company
    company = frappe.get_doc({
        "doctype": "Company",
        "company_name": "_Test Company",
        "abbr": "_TC"
    })
    if not frappe.db.exists("Company", company.company_name):
        company.insert()
    
    # Create customer
    customer = frappe.get_doc({
        "doctype": "Customer",
        "customer_name": "_Test Customer"
    })
    if not frappe.db.exists("Customer", customer.customer_name):
        customer.insert()
    
    # Create item
    item = frappe.get_doc({
        "doctype": "Item",
        "item_code": "_Test Item",
        "item_name": "_Test Item",
        "item_group": "_Test Item Group",
        "stock_uom": "_Test UOM"
    })
    if not frappe.db.exists("Item", item.item_code):
        item.insert()
    
    # Create invoice
    invoice = frappe.get_doc({
        "doctype": "Sales Invoice",
        "company": company.name,
        "customer": customer.name,
        "items": [{
            "item_code": item.item_code,
            "qty": 10,
            "rate": 100
        }]
    })
    invoice.insert()
    
    return invoice
```

### Scenario 4: Test Data with Hooks

```python
def _make_test_records(verbose=None):
    """Create test data using hooks"""
    from frappe.test_runner import make_test_objects
    
    # Get test data from hooks
    test_data_hooks = frappe.get_hooks("test_data", app_name="my_app")
    
    records = []
    for hook_function in test_data_hooks:
        hook_data = frappe.get_attr(hook_function)()
        records.extend(hook_data)
    
    return records
```

---

## Summary

This guide has covered comprehensive test data management in Frappe:

### Key Concepts

1. **test_records.json**: Simple JSON-based test data definition
2. **test_dependencies**: Automatic dependency resolution
3. **_make_test_records()**: Programmatic test data creation
4. **Test Fixtures**: Reusable test data patterns
5. **Test Data Cleanup**: Automatic and manual cleanup strategies

### Test Data Methods

| Method | When to Use | Complexity |
|--------|-------------|------------|
| `test_records.json` | Simple, static test data | Low |
| `test_records` variable | In-memory test data | Low |
| `_make_test_records()` | Complex, dynamic test data | High |
| Programmatic creation | Test-specific data | Medium |
| Factory functions | Reusable test data | Medium |

### Best Practices Summary

1. ✅ Use descriptive, consistent naming
2. ✅ Include all required fields
3. ✅ Use realistic test data
4. ✅ Handle dependencies explicitly
5. ✅ Keep test data minimal
6. ✅ Document complex test data
7. ✅ Avoid hard-coded IDs
8. ✅ Reuse test records when possible
9. ✅ Clean up test data properly
10. ✅ Version control test data

### Quick Reference

**Create test records from JSON**:
```python
test_records = frappe.get_test_records("MyDocType")
doc = frappe.get_doc(test_records[0])
doc.insert()
```

**Declare dependencies**:
```python
test_dependencies = ["Company", "Customer", "Item"]
```

**Create programmatically**:
```python
def _make_test_records(verbose=None):
    from frappe.test_runner import make_test_objects
    return make_test_objects("MyDocType", test_data)
```

**Force recreation**:
```bash
bench --site test_site run-tests --doctype MyDocType --force
```

**Skip test records**:
```bash
bench --site test_site run-tests --skip-test-records
```

---

### Additional Resources

- [Frappe Testing Documentation](https://docs.frappe.io/framework/user/en/testing)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Frappe Source Code Tests](https://github.com/frappe/frappe/tree/develop/frappe/tests)

### Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
