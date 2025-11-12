# Frappe Unit Testing Guide - Part 1: Fundamentals

## Table of Contents
1. [Introduction](#introduction)
2. [Test Structure and Organization](#test-structure-and-organization)
3. [Base Test Classes](#base-test-classes)
4. [Writing Your First Test](#writing-your-first-test)
5. [Test File Naming Conventions](#test-file-naming-conventions)
6. [Test Discovery](#test-discovery)

---

## Introduction

Frappe uses Python's built-in `unittest` framework for unit testing. The framework provides a robust testing infrastructure that integrates seamlessly with Frappe's database, caching, and permission systems.

### Key Features of Frappe Testing

- **Automatic Database Rollback**: All database changes are automatically rolled back after each test
- **Test Record Management**: Automatic creation and management of test data
- **Permission Testing**: Built-in utilities for testing user permissions
- **Transaction Management**: Proper handling of database transactions
- **Cache Management**: Automatic cache clearing between tests
- **Parallel Execution**: Support for running tests in parallel

### Prerequisites

Before writing tests, ensure:

1. **Tests are enabled** for your site:
   ```bash
   bench --site [site-name] set-config allow_tests true
   ```

2. **Development dependencies** are installed:
   ```bash
   bench setup requirements --dev
   ```

3. **Test site** is properly configured (usually `test_site` or your development site)

---

## Test Structure and Organization

### Directory Structure

Tests in Frappe follow a specific directory structure:

```
your_app/
├── your_app/
│   ├── module/
│   │   ├── doctype/
│   │   │   └── doctype_name/
│   │   │       ├── doctype_name.py
│   │   │       ├── test_doctype_name.py      # Test file
│   │   │       └── test_records.json         # Test data (optional)
│   │   └── tests/
│   │       └── test_module.py                # Module-level tests
│   └── tests/
│       └── test_app.py                        # App-level tests
```

### Test File Locations

1. **DocType Tests**: Located in the same directory as the DocType
   - Path: `apps/your_app/your_app/module/doctype/doctype_name/test_doctype_name.py`
   - Example: `apps/erpnext/erpnext/stock/doctype/item/test_item.py`

2. **Module Tests**: Located in module's `tests/` directory
   - Path: `apps/your_app/your_app/module/tests/test_module.py`
   - Example: `apps/frappe/frappe/tests/test_utils.py`

3. **App-Level Tests**: Located in app's root `tests/` directory
   - Path: `apps/your_app/your_app/tests/test_app.py`

---

## Base Test Classes

Frappe provides several base test classes that you should inherit from when writing tests.

### FrappeTestCase

The primary base class for all Frappe tests. It extends Python's `unittest.TestCase` and provides Frappe-specific functionality.

**Location**: `frappe.tests.utils.FrappeTestCase`

**Key Features**:
- Automatic database rollback after each test
- Thread-local variable cleanup
- Database connection management
- Cache clearing
- Custom assertion methods
- User context management
- Time freezing utilities

**Basic Usage**:
```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestMyDocType(FrappeTestCase):
    def test_something(self):
        # Your test code here
        pass
```

**Important Notes**:
- Always call `super().setUpClass()` if you override `setUpClass`
- Database changes are automatically rolled back after each test
- Each test runs in a clean environment

### FrappeAPITestCase

Specialized test case for testing API endpoints. Extends `FrappeTestCase`.

**Location**: `frappe.tests.test_api.FrappeAPITestCase`

**Key Features**:
- Built-in HTTP client methods (`get`, `post`, `put`, `patch`, `delete`)
- Automatic session management
- API path helpers
- Support for both v1 and v2 APIs

**Usage**:
```python
from frappe.tests.test_api import FrappeAPITestCase

class TestMyAPI(FrappeAPITestCase):
    version = "v1"  # or "v2" or "" for v1
    
    def test_get_resource(self):
        response = self.get(self.resource("ToDo", "test-todo"))
        self.assertEqual(response.status_code, 200)
    
    def test_create_resource(self):
        data = {"doctype": "ToDo", "description": "Test"}
        response = self.post(self.resource("ToDo"), data)
        self.assertEqual(response.status_code, 200)
```

### MockedRequestTestCase

For testing code that makes external HTTP requests. Automatically mocks all HTTP requests.

**Location**: `frappe.tests.utils.MockedRequestTestCase`

**Usage**:
```python
from frappe.tests.utils import MockedRequestTestCase
import responses

class TestExternalAPI(MockedRequestTestCase):
    def test_external_call(self):
        # Mock the external API response
        self.responses.add(
            responses.GET,
            "https://api.example.com/data",
            json={"status": "ok"},
            status=200
        )
        
        # Your code that calls the external API
        result = call_external_api()
        self.assertEqual(result["status"], "ok")
```

### UnitTestCase and IntegrationTestCase

These are newer test case classes (used in some apps like Raven) that provide a clearer separation between unit and integration tests.

**Note**: These may be aliases or wrappers around `FrappeTestCase` in newer Frappe versions. Check your Frappe version for availability.

**Usage** (if available):
```python
from frappe.tests import UnitTestCase, IntegrationTestCase

class TestMyDocType(UnitTestCase):
    """Unit tests - test individual functions/methods"""
    pass

class TestMyDocType(IntegrationTestCase):
    """Integration tests - test component interactions"""
    pass
```

---

## Writing Your First Test

### Basic Test Structure

```python
# Copyright (c) 2024, Your Company and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase

class TestMyDocType(FrappeTestCase):
    """Test cases for MyDocType"""
    
    def test_create_document(self):
        """Test creating a new document"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1",
            "field2": "value2"
        })
        doc.insert()
        
        # Assertions
        self.assertIsNotNone(doc.name)
        self.assertEqual(doc.field1, "value1")
        self.assertTrue(frappe.db.exists("MyDocType", doc.name))
    
    def test_validation(self):
        """Test document validation"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            # Missing required field
        })
        
        # Should raise validation error
        self.assertRaises(frappe.ValidationError, doc.insert)
```

### Test Method Naming

- Test methods **must** start with `test_`
- Use descriptive names: `test_create_document`, `test_validate_required_fields`
- Follow snake_case convention

### Common Test Patterns

#### 1. Testing Document Creation

```python
def test_create_document(self):
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Verify document was created
    self.assertIsNotNone(doc.name)
    self.assertTrue(frappe.db.exists("MyDocType", doc.name))
```

#### 2. Testing Document Updates

```python
def test_update_document(self):
    # Create document
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "old_value"
    })
    doc.insert()
    
    # Update document
    doc.field1 = "new_value"
    doc.save()
    
    # Reload and verify
    doc.reload()
    self.assertEqual(doc.field1, "new_value")
```

#### 3. Testing Document Deletion

```python
def test_delete_document(self):
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    doc_name = doc.name
    
    # Delete document
    frappe.delete_doc("MyDocType", doc_name)
    
    # Verify deletion
    self.assertFalse(frappe.db.exists("MyDocType", doc_name))
```

#### 4. Testing Validation Errors

```python
def test_required_field_validation(self):
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        # Missing required field
    })
    
    # Should raise ValidationError
    with self.assertRaises(frappe.ValidationError):
        doc.insert()
```

#### 5. Testing Permissions

```python
def test_permissions(self):
    # Create document as Administrator
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Switch to regular user
    with self.set_user("test@example.com"):
        # Try to access document
        doc = frappe.get_doc("MyDocType", doc.name)
        
        # Check permissions
        self.assertTrue(doc.has_permission("read"))
        self.assertFalse(doc.has_permission("write"))
```

---

## Test File Naming Conventions

### Rules

1. **Test files must start with `test_`**
   - ✅ `test_my_doctype.py`
   - ✅ `test_utils.py`
   - ❌ `my_doctype_test.py`
   - ❌ `testmy_doctype.py`

2. **Test files must end with `.py`**

3. **For DocType tests**: Match the DocType name
   - DocType: `Item` → Test file: `test_item.py`
   - DocType: `Sales Invoice` → Test file: `test_sales_invoice.py`

4. **For module tests**: Use descriptive names
   - `test_utils.py`
   - `test_permissions.py`
   - `test_api.py`

### Examples

```
# DocType test
apps/erpnext/erpnext/stock/doctype/item/test_item.py

# Module test
apps/frappe/frappe/tests/test_utils.py

# App-level test
apps/erpnext/erpnext/tests/test_perf.py
```

---

## Test Discovery

Frappe automatically discovers tests based on file naming conventions.

### Discovery Rules

1. **Files starting with `test_`** are automatically discovered
2. **Files ending with `.py`** are considered test files
3. **Excluded directories**:
   - `locals/`
   - `.git/`
   - `public/`
   - `__pycache__/`
   - `doctype/doctype/boilerplate/`

### Test Class Discovery

- Classes inheriting from `unittest.TestCase` (or `FrappeTestCase`) are discovered
- Test methods starting with `test_` are discovered
- `setUp`, `tearDown`, `setUpClass`, `tearDownClass` are automatically called

### Example

```python
# This file will be discovered: test_my_doctype.py
import frappe
from frappe.tests.utils import FrappeTestCase

# This class will be discovered
class TestMyDocType(FrappeTestCase):
    # This method will be discovered and run
    def test_something(self):
        pass
    
    # This method will NOT be run as a test
    def helper_method(self):
        pass
```

---

## Next Steps

Continue to:
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
