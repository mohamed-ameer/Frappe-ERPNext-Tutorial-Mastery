# Frappe Assertions Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Standard unittest Assertions](#standard-unittest-assertions)
3. [Frappe-Specific Assertions](#frappe-specific-assertions)
4. [Context Manager Assertions](#context-manager-assertions)
5. [Exception Assertions](#exception-assertions)
6. [Document Assertions](#document-assertions)
7. [Database Assertions](#database-assertions)
8. [Performance Assertions](#performance-assertions)
9. [Custom Assertions](#custom-assertions)
10. [Best Practices](#best-practices)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

Assertions are the core of unit testing in Frappe. They verify that your code behaves as expected. Frappe extends Python's standard `unittest.TestCase` with additional assertion methods tailored for Frappe-specific scenarios.

### What are Assertions?

Assertions are statements that check if a condition is true. If the condition is false, the test fails with a descriptive error message.

### Base Test Class

All Frappe tests inherit from `FrappeTestCase`, which extends `unittest.TestCase`:

```python
from frappe.tests.utils import FrappeTestCase

class TestMyFeature(FrappeTestCase):
    def test_something(self):
        # Your assertions here
        pass
```

---

## Standard unittest Assertions

These are the standard assertions inherited from Python's `unittest.TestCase`. They work exactly as in standard Python unit testing.

### Equality Assertions

#### `assertEqual(first, second, msg=None)`

Checks if two values are equal.

```python
def test_equality(self):
    result = calculate_total(10, 20)
    self.assertEqual(result, 30)
    
    # With custom message
    self.assertEqual(result, 30, msg="Total calculation is incorrect")
```

**Use Cases:**
- Comparing calculated values
- Verifying field values
- Checking return values

**Examples:**
```python
# Compare numbers
self.assertEqual(5, 5)

# Compare strings
self.assertEqual("Hello", "Hello")

# Compare lists
self.assertEqual([1, 2, 3], [1, 2, 3])

# Compare document fields
doc = frappe.get_doc("Employee", "EMP-00001")
self.assertEqual(doc.status, "Active")
```

#### `assertNotEqual(first, second, msg=None)`

Checks if two values are NOT equal.

```python
def test_not_equal(self):
    status1 = "Active"
    status2 = "Inactive"
    self.assertNotEqual(status1, status2)
```

**Use Cases:**
- Verifying values changed
- Ensuring different states
- Checking uniqueness

**Examples:**
```python
# Verify status changed
old_status = doc.status
doc.status = "Left"
doc.save()
self.assertNotEqual(old_status, doc.status)

# Verify different employees
self.assertNotEqual(emp1.name, emp2.name)
```

### Boolean Assertions

#### `assertTrue(expr, msg=None)`

Checks if expression is `True`.

```python
def test_boolean(self):
    is_active = check_employee_status("EMP-00001")
    self.assertTrue(is_active)
    
    # Check document exists
    self.assertTrue(frappe.db.exists("Employee", "EMP-00001"))
    
    # Check permission
    doc = frappe.get_doc("Employee", "EMP-00001")
    self.assertTrue(doc.has_permission("read"))
```

**Use Cases:**
- Checking boolean return values
- Verifying document existence
- Checking permissions
- Validating conditions

**Examples:**
```python
# Check existence
self.assertTrue(frappe.db.exists("Employee", emp))

# Check permissions
self.assertTrue(doc.has_permission("write"))

# Check flags
self.assertTrue(frappe.flags.in_test)

# Check conditions
self.assertTrue(len(items) > 0)
```

#### `assertFalse(expr, msg=None)`

Checks if expression is `False`.

```python
def test_false(self):
    is_deleted = check_if_deleted("EMP-00001")
    self.assertFalse(is_deleted)
    
    # Check document doesn't exist
    self.assertFalse(frappe.db.exists("Employee", "NON-EXISTENT"))
```

**Use Cases:**
- Verifying negative conditions
- Checking document doesn't exist
- Validating disabled states

**Examples:**
```python
# Check doesn't exist
self.assertFalse(frappe.db.exists("Employee", "INVALID"))

# Check not deleted
self.assertFalse(doc.is_deleted)

# Check not cancelled
self.assertFalse(doc.docstatus == 2)
```

### Comparison Assertions

#### `assertGreater(first, second, msg=None)`

Checks if `first > second`.

```python
def test_greater(self):
    balance = get_account_balance("ACC-00001")
    self.assertGreater(balance, 0)
    
    # Check quantity
    qty = get_stock_balance("ITEM-00001", "WH-00001")
    self.assertGreater(qty, 10)
```

**Use Cases:**
- Checking minimum values
- Verifying quantities
- Validating thresholds

**Examples:**
```python
# Check balance
self.assertGreater(balance, 0)

# Check quantity
self.assertGreater(qty, minimum_qty)

# Check count
self.assertGreater(len(items), 0)
```

#### `assertGreaterEqual(first, second, msg=None)`

Checks if `first >= second`.

```python
def test_greater_equal(self):
    age = calculate_age("1990-01-01")
    self.assertGreaterEqual(age, 18)
```

**Examples:**
```python
# Check minimum age
self.assertGreaterEqual(age, 18)

# Check minimum service years
self.assertGreaterEqual(service_years, 1)
```

#### `assertLess(first, second, msg=None)`

Checks if `first < second`.

```python
def test_less(self):
    balance = get_account_balance("ACC-00001")
    self.assertLess(balance, 1000000)
```

**Examples:**
```python
# Check maximum balance
self.assertLess(balance, max_balance)

# Check quantity
self.assertLess(qty, max_qty)
```

#### `assertLessEqual(first, second, msg=None)`

Checks if `first <= second`.

```python
def test_less_equal(self):
    discount = calculate_discount(amount)
    self.assertLessEqual(discount, 100)  # Max 100%
```

**Examples:**
```python
# Check maximum discount
self.assertLessEqual(discount, 100)

# Check maximum quantity
self.assertLessEqual(qty, max_qty)
```

### Membership Assertions

#### `assertIn(member, container, msg=None)`

Checks if `member` is in `container`.

```python
def test_in(self):
    roles = get_user_roles("user@example.com")
    self.assertIn("Employee", roles)
    
    # Check in list
    statuses = ["Draft", "Submitted", "Cancelled"]
    self.assertIn(doc.status, statuses)
```

**Use Cases:**
- Checking list membership
- Verifying roles
- Validating status values

**Examples:**
```python
# Check in list
self.assertIn("Active", ["Active", "Inactive", "Left"])

# Check in roles
self.assertIn("System Manager", user_roles)

# Check in dictionary keys
self.assertIn("name", doc.as_dict())

# Check in string
self.assertIn("error", error_message.lower())
```

#### `assertNotIn(member, container, msg=None)`

Checks if `member` is NOT in `container`.

```python
def test_not_in(self):
    roles = get_user_roles("user@example.com")
    self.assertNotIn("Administrator", roles)
```

**Examples:**
```python
# Check not in list
self.assertNotIn("Deleted", statuses)

# Check not in roles
self.assertNotIn("Guest", user_roles)
```

### Type Assertions

#### `assertIsInstance(obj, cls, msg=None)`

Checks if `obj` is an instance of `cls`.

```python
def test_instance(self):
    doc = frappe.get_doc("Employee", "EMP-00001")
    self.assertIsInstance(doc, frappe.model.document.Document)
    
    # Check types
    self.assertIsInstance(doc.salary, (int, float))
```

**Use Cases:**
- Verifying return types
- Checking document types
- Validating data types

**Examples:**
```python
# Check document type
self.assertIsInstance(doc, frappe.model.document.Document)

# Check numeric type
self.assertIsInstance(amount, (int, float))

# Check string type
self.assertIsInstance(name, str)

# Check list type
self.assertIsInstance(items, list)
```

#### `assertIsNotInstance(obj, cls, msg=None)`

Checks if `obj` is NOT an instance of `cls`.

```python
def test_not_instance(self):
    value = get_value()
    self.assertIsNotInstance(value, str)  # Should be number
```

### Identity Assertions

#### `assertIs(first, second, msg=None)`

Checks if `first is second` (same object identity).

```python
def test_is(self):
    doc1 = frappe.get_doc("Employee", "EMP-00001")
    doc2 = frappe.get_doc("Employee", "EMP-00001")
    # These are different objects even if same document
    self.assertIsNot(doc1, doc2)
    
    # But reloaded doc is same object
    doc1.reload()
    self.assertIs(doc1, doc1)
```

**Use Cases:**
- Checking object identity
- Verifying same instance
- Testing singleton patterns

#### `assertIsNot(first, second, msg=None)`

Checks if `first is not second`.

### None Assertions

#### `assertIsNone(expr, msg=None)`

Checks if expression is `None`.

```python
def test_is_none(self):
    deleted_doc = frappe.db.get_value("Employee", "DELETED-001")
    self.assertIsNone(deleted_doc)
    
    # Check optional field
    self.assertIsNone(doc.relieving_date)
```

**Use Cases:**
- Checking deleted documents
- Verifying optional fields
- Validating null values

**Examples:**
```python
# Check deleted document
self.assertIsNone(frappe.db.get_value("Employee", deleted_emp))

# Check optional field
self.assertIsNone(doc.relieving_date)

# Check return value
result = get_optional_value()
self.assertIsNone(result)
```

#### `assertIsNotNone(expr, msg=None)`

Checks if expression is NOT `None`.

```python
def test_is_not_none(self):
    doc = frappe.get_doc("Employee", "EMP-00001")
    self.assertIsNotNone(doc.name)
    self.assertIsNotNone(doc.date_of_joining)
```

**Examples:**
```python
# Check required field
self.assertIsNotNone(doc.name)

# Check created document
self.assertIsNotNone(created_doc)

# Check return value
result = calculate_value()
self.assertIsNotNone(result)
```

### Sequence Assertions

#### `assertSequenceEqual(first, second, msg=None)`

Checks if two sequences are equal.

```python
def test_sequence(self):
    expected = [1, 2, 3]
    actual = get_numbers()
    self.assertSequenceEqual(expected, actual)
```

**Examples:**
```python
# Compare lists
self.assertSequenceEqual([1, 2, 3], [1, 2, 3])

# Compare tuples
self.assertSequenceEqual((1, 2), (1, 2))
```

#### `assertListEqual(first, second, msg=None)`

Checks if two lists are equal.

```python
def test_list(self):
    expected = ["Item 1", "Item 2"]
    actual = get_items()
    self.assertListEqual(expected, actual)
```

#### `assertTupleEqual(first, second, msg=None)`

Checks if two tuples are equal.

#### `assertSetEqual(first, second, msg=None)`

Checks if two sets are equal (order doesn't matter).

```python
def test_set(self):
    expected = {1, 2, 3}
    actual = {3, 2, 1}  # Order doesn't matter
    self.assertSetEqual(expected, actual)
```

**Use Cases:**
- Comparing roles (order doesn't matter)
- Checking permissions
- Validating unique values

**Examples:**
```python
# Compare roles (order doesn't matter)
expected_roles = {"Employee", "Manager"}
actual_roles = {"Manager", "Employee"}
self.assertSetEqual(expected_roles, actual_roles)
```

#### `assertDictEqual(first, second, msg=None)`

Checks if two dictionaries are equal.

```python
def test_dict(self):
    expected = {"name": "Test", "status": "Active"}
    actual = doc.as_dict()
    self.assertDictEqual(expected, actual)
```

**Use Cases:**
- Comparing document dictionaries
- Verifying API responses
- Checking configuration

**Examples:**
```python
# Compare document dicts
expected = {"status": "Active", "name": "EMP-00001"}
actual = doc.as_dict()
self.assertDictEqual(expected, actual)

# Compare API responses
expected_response = {"success": True, "data": []}
self.assertDictEqual(expected_response, response)
```

### String Assertions

#### `assertMultiLineEqual(first, second, msg=None)`

Checks if two multi-line strings are equal (shows diff).

```python
def test_multiline(self):
    expected = """Line 1
Line 2
Line 3"""
    actual = get_multiline_text()
    self.assertMultiLineEqual(expected, actual)
```

**Use Cases:**
- Comparing HTML content
- Verifying email templates
- Checking formatted text

#### `assertRegex(text, regex, msg=None)`

Checks if `text` matches `regex`.

```python
def test_regex(self):
    email = "test@example.com"
    self.assertRegex(email, r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    # Check naming series
    doc_name = "EMP-00001"
    self.assertRegex(doc_name, r'^EMP-\d{5}$')
```

**Use Cases:**
- Validating email formats
- Checking naming series
- Verifying patterns

**Examples:**
```python
# Check email format
self.assertRegex(email, r'^[\w\.-]+@[\w\.-]+\.\w+$')

# Check naming series
self.assertRegex(doc_name, r'^EMP-\d{5}$')

# Check phone number
self.assertRegex(phone, r'^\d{10}$')
```

#### `assertNotRegex(text, regex, msg=None)`

Checks if `text` does NOT match `regex`.

### Numeric Assertions

#### `assertAlmostEqual(first, second, places=7, msg=None, delta=None)`

Checks if two numbers are almost equal (for floating point).

```python
def test_almost_equal(self):
    result = calculate_percentage(10, 3)
    # 10 / 3 = 3.333333...
    self.assertAlmostEqual(result, 3.333, places=3)
    
    # Using delta
    self.assertAlmostEqual(result, 3.33, delta=0.01)
```

**Use Cases:**
- Comparing floating point calculations
- Verifying percentages
- Checking currency amounts

**Examples:**
```python
# Compare with precision
self.assertAlmostEqual(10/3, 3.333, places=3)

# Compare currency
self.assertAlmostEqual(amount, 100.50, places=2)

# Compare with delta
self.assertAlmostEqual(result, expected, delta=0.01)
```

#### `assertNotAlmostEqual(first, second, places=7, msg=None, delta=None)`

Checks if two numbers are NOT almost equal.

### Count Assertions

#### `assertCountEqual(first, second, msg=None)`

Checks if two sequences have the same elements (order doesn't matter).

```python
def test_count_equal(self):
    expected = [1, 2, 3, 3]
    actual = [3, 2, 1, 3]
    self.assertCountEqual(expected, actual)  # Same elements, different order
```

**Use Cases:**
- Comparing lists where order doesn't matter
- Checking item collections
- Validating child table rows

**Examples:**
```python
# Compare items (order doesn't matter)
expected_items = ["Item A", "Item B", "Item C"]
actual_items = ["Item C", "Item A", "Item B"]
self.assertCountEqual(expected_items, actual_items)
```

---

## Frappe-Specific Assertions

Frappe extends `unittest.TestCase` with custom assertions for Frappe-specific scenarios.

### Document Assertions

#### `assertDocumentEqual(expected, actual)`

Compares a (partial) expected document with actual Document. This is the most powerful Frappe-specific assertion.

```python
def test_document_equal(self):
    # Create expected document
    expected = {
        "doctype": "Employee",
        "employee_name": "Test Employee",
        "status": "Active",
        "date_of_joining": "2024-01-01"
    }
    
    # Get actual document
    doc = frappe.get_doc("Employee", "EMP-00001")
    
    # Compare
    self.assertDocumentEqual(expected, doc)
```

**Features:**
- Handles float precision automatically
- Compares child tables recursively
- Handles datetime objects
- Supports partial comparison (only specified fields)

**Use Cases:**
- Comparing document fields
- Verifying document creation
- Testing document updates
- Validating child table data

**Examples:**

```python
# Compare full document
expected = {
    "doctype": "Employee",
    "employee_name": "John Doe",
    "status": "Active",
    "date_of_joining": "2024-01-01",
    "salary": 50000.00
}
doc = frappe.get_doc("Employee", "EMP-00001")
self.assertDocumentEqual(expected, doc)

# Partial comparison (only specified fields)
expected = {
    "status": "Active",
    "employee_name": "John Doe"
}
self.assertDocumentEqual(expected, doc)  # Only checks these fields

# Compare with child tables
expected = {
    "doctype": "Sales Invoice",
    "customer": "_Test Customer",
    "items": [
        {"item_code": "_Test Item", "qty": 10, "rate": 100},
        {"item_code": "_Test Item 2", "qty": 5, "rate": 50}
    ]
}
invoice = frappe.get_doc("Sales Invoice", "SI-00001")
self.assertDocumentEqual(expected, invoice)

# Compare using document object
expected_doc = frappe.get_doc("Employee", "EMP-00001")
actual_doc = frappe.get_doc("Employee", "EMP-00001")
self.assertDocumentEqual(expected_doc, actual_doc)
```

**How it works:**
- For floats: Uses document precision for comparison
- For booleans/ints: Converts using `cint()`
- For datetime: Compares string representation
- For lists: Recursively compares child documents
- For other types: Standard equality check

### Sequence Assertions

#### `assertSequenceSubset(larger, smaller, msg=None)`

Asserts that `smaller` is a subset of `larger`.

```python
def test_sequence_subset(self):
    all_roles = ["Employee", "Manager", "Administrator", "Guest"]
    user_roles = ["Employee", "Manager"]
    
    self.assertSequenceSubset(all_roles, user_roles)
```

**Use Cases:**
- Checking user roles
- Verifying permissions
- Validating included items

**Examples:**
```python
# Check roles subset
all_roles = ["Employee", "Manager", "Administrator"]
user_roles = ["Employee", "Manager"]
self.assertSequenceSubset(all_roles, user_roles)

# Check items subset
all_items = ["Item A", "Item B", "Item C", "Item D"]
selected_items = ["Item A", "Item C"]
self.assertSequenceSubset(all_items, selected_items)
```

---

## Context Manager Assertions

These assertions are used as context managers to test behavior within a specific scope.

### Database Query Assertions

#### `assertQueryCount(count)`

Asserts that the number of SQL queries executed is less than or equal to `count`.

```python
def test_query_count(self):
    with self.assertQueryCount(5):
        # This block should execute at most 5 queries
        doc = frappe.get_doc("Employee", "EMP-00001")
        doc.status = "Active"
        doc.save()
        doc.submit()
```

**Use Cases:**
- Performance testing
- Detecting N+1 query problems
- Optimizing database access
- Ensuring efficient queries

**Examples:**
```python
# Test query efficiency
with self.assertQueryCount(3):
    doc = frappe.get_doc("Employee", "EMP-00001")
    doc.reload()
    doc.save()

# Test bulk operations
with self.assertQueryCount(10):
    for i in range(100):
        create_employee(f"emp{i}@example.com")

# Test report generation
with self.assertQueryCount(5):
    generate_report("Employee Report")
```

**Error Message:**
If query count exceeds, shows all executed queries for debugging.

#### `assertRowsRead(count)`

Asserts that the number of rows read from database is less than or equal to `count`.

```python
def test_rows_read(self):
    with self.assertRowsRead(100):
        # Should read at most 100 rows
        employees = frappe.get_all("Employee", limit=100)
```

**Use Cases:**
- Testing pagination
- Verifying limit clauses
- Optimizing data retrieval

**Examples:**
```python
# Test pagination
with self.assertRowsRead(50):
    employees = frappe.get_all("Employee", limit=50)

# Test filtered queries
with self.assertRowsRead(10):
    active_employees = frappe.get_all(
        "Employee",
        filters={"status": "Active"},
        limit=10
    )
```

#### `assertQueryEqual(first, second)`

Asserts that two SQL queries are equal (normalized).

```python
def test_query_equal(self):
    query1 = "SELECT * FROM `tabEmployee` WHERE status = 'Active'"
    query2 = """
        SELECT *
        FROM `tabEmployee`
        WHERE status = 'Active'
    """
    self.assertQueryEqual(query1, query2)  # Same query, different formatting
```

**Use Cases:**
- Testing query builders
- Verifying generated SQL
- Comparing query structures

**Examples:**
```python
# Compare normalized queries
query1 = "SELECT name FROM tabEmployee"
query2 = "SELECT name FROM `tabEmployee`"
self.assertQueryEqual(query1, query2)

# Compare formatted queries
from frappe.query_builder import DocType
Employee = DocType("Employee")
query1 = frappe.qb.from_(Employee).select(Employee.name)
query2 = "SELECT name FROM `tabEmployee`"
self.assertQueryEqual(str(query1), query2)
```

### Redis/Cache Assertions

#### `assertRedisCallCounts(count)`

Asserts that the number of Redis calls is less than or equal to `count`.

```python
def test_redis_calls(self):
    with self.assertRedisCallCounts(5):
        # Should make at most 5 Redis calls
        frappe.cache.get_value("key1")
        frappe.cache.set_value("key2", "value")
        frappe.cache.delete_value("key3")
```

**Use Cases:**
- Testing cache efficiency
- Detecting excessive cache calls
- Optimizing cache usage

**Examples:**
```python
# Test cache operations
with self.assertRedisCallCounts(3):
    frappe.cache.get_value("key1")
    frappe.cache.set_value("key2", "value")
    frappe.cache.delete_value("key3")
```

---

## Exception Assertions

These assertions verify that exceptions are raised correctly.

### `assertRaises(exception, callable, *args, **kwargs)`

Asserts that `callable` raises `exception` when called with `*args` and `**kwargs`.

```python
def test_raises_exception(self):
    # Test that validation error is raised
    self.assertRaises(
        frappe.ValidationError,
        create_invalid_employee
    )
    
    # Test with arguments
    self.assertRaises(
        frappe.ValidationError,
        create_employee,
        "invalid@email"  # Missing required fields
    )
```

**Use Cases:**
- Testing validation errors
- Verifying permission errors
- Checking error handling
- Testing edge cases

**Examples:**

```python
# Test validation error
def test_validation_error(self):
    doc = frappe.new_doc("Employee")
    # Missing required field
    self.assertRaises(frappe.ValidationError, doc.insert)

# Test permission error
def test_permission_error(self):
    with self.set_user("test@example.com"):
        doc = frappe.get_doc("Employee", "EMP-00001")
        self.assertRaises(frappe.PermissionError, doc.submit)

# Test with context manager (preferred)
def test_raises_with_context(self):
    with self.assertRaises(frappe.ValidationError) as cm:
        doc = frappe.new_doc("Employee")
        doc.insert()  # Missing required fields
    
    # Check error message
    self.assertIn("required", str(cm.exception).lower())

# Test specific exception message
def test_exception_message(self):
    with self.assertRaises(frappe.ValidationError) as cm:
        create_invalid_document()
    
    error_message = str(cm.exception)
    self.assertIn("required field", error_message)
```

### `assertRaisesRegex(exception, regex, callable, *args, **kwargs)`

Asserts that `callable` raises `exception` and the message matches `regex`.

```python
def test_raises_regex(self):
    self.assertRaisesRegex(
        frappe.ValidationError,
        r"required.*field",
        create_invalid_document
    )
```

**Examples:**

```python
# Test error message pattern
def test_error_message_pattern(self):
    self.assertRaisesRegex(
        frappe.ValidationError,
        r"required.*field.*name",
        create_employee_without_name
    )

# Test with context manager
def test_regex_with_context(self):
    with self.assertRaisesRegex(frappe.ValidationError, r"invalid.*email"):
        validate_email("invalid-email")
```

### Common Exception Types in Frappe

```python
# ValidationError - For validation failures
self.assertRaises(frappe.ValidationError, invalid_operation)

# PermissionError - For permission issues
self.assertRaises(frappe.PermissionError, unauthorized_operation)

# DoesNotExistError - For missing documents
self.assertRaises(frappe.DoesNotExistError, get_nonexistent_doc)

# DuplicateEntryError - For duplicate entries
self.assertRaises(frappe.DuplicateEntryError, create_duplicate)

# LinkValidationError - For invalid links
self.assertRaises(frappe.LinkValidationError, link_invalid_doc)

# MandatoryError - For missing mandatory fields
self.assertRaises(frappe.MandatoryError, save_without_required_field)

# InvalidStatusError - For invalid status transitions
self.assertRaises(frappe.InvalidStatusError, invalid_status_change)

# DocstatusTransitionError - For invalid docstatus transitions
self.assertRaises(frappe.DocstatusTransitionError, cancel_draft_doc)
```

---

## Document Assertions (Advanced)

### Complete Document Comparison

```python
def test_complete_document(self):
    # Create expected document structure
    expected = {
        "doctype": "Sales Invoice",
        "customer": "_Test Customer",
        "posting_date": "2024-01-15",
        "due_date": "2024-01-30",
        "items": [
            {
                "item_code": "_Test Item",
                "qty": 10,
                "rate": 100.00,
                "amount": 1000.00
            },
            {
                "item_code": "_Test Item 2",
                "qty": 5,
                "rate": 50.00,
                "amount": 250.00
            }
        ],
        "grand_total": 1250.00,
        "outstanding_amount": 1250.00
    }
    
    invoice = frappe.get_doc("Sales Invoice", "SI-00001")
    self.assertDocumentEqual(expected, invoice)
```

### Testing Child Tables

```python
def test_child_table(self):
    expected = {
        "doctype": "Purchase Order",
        "supplier": "_Test Supplier",
        "items": [
            {"item_code": "ITEM-001", "qty": 10},
            {"item_code": "ITEM-002", "qty": 20}
        ]
    }
    
    po = frappe.get_doc("Purchase Order", "PO-00001")
    self.assertDocumentEqual(expected, po)
    
    # Verify child table count
    self.assertEqual(len(po.items), 2)
    
    # Verify specific child row
    self.assertEqual(po.items[0].item_code, "ITEM-001")
    self.assertEqual(po.items[0].qty, 10)
```

### Testing Calculated Fields

```python
def test_calculated_fields(self):
    doc = frappe.get_doc("Sales Invoice", "SI-00001")
    
    # Test calculation
    expected_total = sum(item.amount for item in doc.items)
    self.assertEqual(doc.grand_total, expected_total)
    
    # Test with precision
    self.assertAlmostEqual(doc.grand_total, 1250.00, places=2)
```

---

## Database Assertions

### Document Existence

```python
def test_document_exists(self):
    # Check document exists
    self.assertTrue(frappe.db.exists("Employee", "EMP-00001"))
    
    # Check document doesn't exist
    self.assertFalse(frappe.db.exists("Employee", "INVALID"))
    
    # Check with filters
    exists = frappe.db.exists("Employee", {"status": "Active", "company": "_Test Company"})
    self.assertTrue(exists)
```

### Field Value Assertions

```python
def test_field_value(self):
    # Get single value
    status = frappe.db.get_value("Employee", "EMP-00001", "status")
    self.assertEqual(status, "Active")
    
    # Get multiple values
    values = frappe.db.get_value("Employee", "EMP-00001", ["status", "company"])
    self.assertEqual(values["status"], "Active")
    self.assertEqual(values["company"], "_Test Company")
    
    # Check None for deleted
    deleted_value = frappe.db.get_value("Employee", "DELETED-001")
    self.assertIsNone(deleted_value)
```

### Count Assertions

```python
def test_count(self):
    # Count all documents
    total = frappe.db.count("Employee")
    self.assertGreater(total, 0)
    
    # Count with filters
    active_count = frappe.db.count("Employee", {"status": "Active"})
    self.assertGreaterEqual(active_count, 1)
    
    # Count child table rows
    items_count = frappe.db.count("Sales Invoice Item", {"parent": "SI-00001"})
    self.assertGreater(items_count, 0)
```

### SQL Assertions

```python
def test_sql_results(self):
    # Execute SQL and verify
    result = frappe.db.sql("""
        SELECT COUNT(*) as count
        FROM `tabEmployee`
        WHERE status = 'Active'
    """, as_dict=True)
    
    self.assertGreater(result[0]["count"], 0)
    
    # Verify specific query result
    employees = frappe.db.sql("""
        SELECT name, status
        FROM `tabEmployee`
        WHERE company = %s
    """, ("_Test Company",), as_dict=True)
    
    self.assertGreater(len(employees), 0)
    for emp in employees:
        self.assertIn("name", emp)
        self.assertIn("status", emp)
```

### Transaction Assertions

```python
def test_transaction(self):
    # Test that changes are rolled back
    initial_count = frappe.db.count("Employee")
    
    # Create document (will be rolled back)
    make_employee("test@example.com")
    
    # After rollback, count should be same
    # (This happens automatically in FrappeTestCase)
    final_count = frappe.db.count("Employee")
    # Note: In actual test, rollback happens in tearDown
```

---

## Performance Assertions

### Query Performance

```python
def test_query_performance(self):
    # Ensure query count is reasonable
    with self.assertQueryCount(5):
        doc = frappe.get_doc("Employee", "EMP-00001")
        doc.reload()
        doc.save()
    
    # Test bulk operations
    with self.assertQueryCount(20):
        for i in range(100):
            create_employee(f"emp{i}@example.com")
```

### Row Read Performance

```python
def test_row_read_performance(self):
    # Ensure we don't read too many rows
    with self.assertRowsRead(50):
        employees = frappe.get_all("Employee", limit=50)
    
    # Test with filters
    with self.assertRowsRead(10):
        active_employees = frappe.get_all(
            "Employee",
            filters={"status": "Active"},
            limit=10
        )
```

### Cache Performance

```python
def test_cache_performance(self):
    # Ensure cache calls are reasonable
    with self.assertRedisCallCounts(5):
        # Multiple cache operations
        frappe.cache.get_value("key1")
        frappe.cache.set_value("key2", "value")
        frappe.cache.get_value("key3")
```

---

## Custom Assertions

### Creating Custom Assertions

You can create custom assertion methods for your specific use cases:

```python
class TestMyFeature(FrappeTestCase):
    def assertEmployeeActive(self, employee):
        """Custom assertion to check employee is active"""
        emp = frappe.get_doc("Employee", employee)
        self.assertEqual(emp.status, "Active")
        self.assertIsNone(emp.relieving_date)
        self.assertTrue(emp.enabled)
    
    def assertDocumentSubmitted(self, doctype, name):
        """Custom assertion to check document is submitted"""
        doc = frappe.get_doc(doctype, name)
        self.assertEqual(doc.docstatus, 1)
        self.assertIsNotNone(doc.submitted_by)
        self.assertIsNotNone(doc.submitted_on)
    
    def assertGLEntriesMatch(self, voucher_type, voucher_no, expected_entries):
        """Custom assertion for GL entries"""
        gl_entries = frappe.get_all(
            "GL Entry",
            filters={
                "voucher_type": voucher_type,
                "voucher_no": voucher_no,
                "is_cancelled": 0
            },
            fields=["account", "debit", "credit"],
            order_by="account"
        )
        
        self.assertEqual(len(gl_entries), len(expected_entries))
        for expected, actual in zip(expected_entries, gl_entries):
            self.assertEqual(expected["account"], actual["account"])
            self.assertAlmostEqual(expected["debit"], actual["debit"], places=2)
            self.assertAlmostEqual(expected["credit"], actual["credit"], places=2)
    
    def test_custom_assertions(self):
        employee = make_employee("test@example.com")
        self.assertEmployeeActive(employee)
        
        invoice = make_sales_invoice()
        invoice.submit()
        self.assertDocumentSubmitted("Sales Invoice", invoice.name)
```

### ERPNext/HRMS Custom Assertions

```python
# From ERPNext StockTestMixin
class StockTestMixin:
    def assertSLEs(self, doc, expected_sles, sle_filters=None):
        """Assert Stock Ledger Entries"""
        filters = {
            "voucher_no": doc.name,
            "voucher_type": doc.doctype,
            "is_cancelled": 0
        }
        if sle_filters:
            filters.update(sle_filters)
        
        sles = frappe.get_all(
            "Stock Ledger Entry",
            fields=["*"],
            filters=filters,
            order_by="timestamp(posting_date, posting_time), creation",
        )
        
        self.assertGreaterEqual(len(sles), len(expected_sles))
        for exp_sle, act_sle in zip(expected_sles, sles, strict=False):
            for k, v in exp_sle.items():
                self.assertEqual(v, act_sle[k], msg=f"{k} doesn't match")
    
    def assertGLEs(self, doc, expected_gles, gle_filters=None):
        """Assert General Ledger Entries"""
        filters = {
            "voucher_no": doc.name,
            "voucher_type": doc.doctype,
            "is_cancelled": 0
        }
        if gle_filters:
            filters.update(gle_filters)
        
        gles = frappe.get_all(
            "GL Entry",
            fields=["*"],
            filters=filters,
            order_by="posting_date, creation",
        )
        
        self.assertGreaterEqual(len(gles), len(expected_gles))
        for exp_gle, act_gle in zip(expected_gles, gles, strict=False):
            for k, exp_value in exp_gle.items():
                act_value = act_gle[k]
                self.assertEqual(exp_value, act_value, msg=f"{k} doesn't match")
```

---

## Best Practices

### 1. Use Descriptive Messages

```python
# Good
self.assertEqual(result, expected, msg="Total calculation failed")

# Bad
self.assertEqual(result, expected)
```

### 2. Test One Thing Per Assertion

```python
# Good
self.assertEqual(doc.status, "Active")
self.assertEqual(doc.company, "_Test Company")

# Bad
self.assertTrue(doc.status == "Active" and doc.company == "_Test Company")
```

### 3. Use Appropriate Assertions

```python
# Good - Use assertIsNone for None checks
self.assertIsNone(deleted_doc)

# Bad - Don't use assertEqual for None
self.assertEqual(deleted_doc, None)

# Good - Use assertTrue for boolean
self.assertTrue(doc.enabled)

# Bad - Don't use assertEqual for boolean
self.assertEqual(doc.enabled, True)
```

### 4. Use assertDocumentEqual for Documents

```python
# Good - Use Frappe-specific assertion
expected = {"status": "Active", "company": "_Test Company"}
self.assertDocumentEqual(expected, doc)

# Bad - Manual field-by-field comparison
self.assertEqual(doc.status, "Active")
self.assertEqual(doc.company, "_Test Company")
# ... many more lines
```

### 5. Use Context Managers for Exceptions

```python
# Good - Can access exception
with self.assertRaises(frappe.ValidationError) as cm:
    invalid_operation()
self.assertIn("required", str(cm.exception))

# Bad - Can't access exception details
self.assertRaises(frappe.ValidationError, invalid_operation)
```

### 6. Use assertAlmostEqual for Floating Point

```python
# Good - Handles floating point precision
self.assertAlmostEqual(result, 3.333, places=3)

# Bad - May fail due to precision
self.assertEqual(result, 3.333333333)
```

### 7. Use Performance Assertions

```python
# Good - Test query performance
with self.assertQueryCount(5):
    expensive_operation()

# Bad - No performance check
expensive_operation()  # May be slow
```

### 8. Group Related Assertions

```python
# Good - Logical grouping
def test_employee_creation(self):
    employee = make_employee("test@example.com")
    
    # Basic fields
    self.assertIsNotNone(employee.name)
    self.assertEqual(employee.status, "Active")
    
    # Dates
    self.assertIsNotNone(employee.date_of_joining)
    self.assertIsNone(employee.relieving_date)
    
    # Permissions
    self.assertTrue(employee.has_permission("read"))
```

---

## Common Patterns

### Pattern 1: Testing Document Lifecycle

```python
def test_document_lifecycle(self):
    # Create
    doc = make_test_document()
    self.assertEqual(doc.docstatus, 0)  # Draft
    self.assertIsNotNone(doc.name)
    
    # Submit
    doc.submit()
    self.assertEqual(doc.docstatus, 1)  # Submitted
    self.assertIsNotNone(doc.submitted_by)
    
    # Cancel
    doc.cancel()
    self.assertEqual(doc.docstatus, 2)  # Cancelled
```

### Pattern 2: Testing Calculations

```python
def test_calculations(self):
    doc = make_test_document()
    
    # Test individual calculations
    expected_total = sum(item.amount for item in doc.items)
    self.assertEqual(doc.total, expected_total)
    
    # Test with precision
    self.assertAlmostEqual(doc.grand_total, 1250.00, places=2)
    
    # Test percentage
    discount_percent = (doc.discount_amount / doc.total) * 100
    self.assertLessEqual(discount_percent, 100)
```

### Pattern 3: Testing Validations

```python
def test_validations(self):
    # Test required field
    doc = frappe.new_doc("Employee")
    with self.assertRaises(frappe.ValidationError) as cm:
        doc.insert()
    self.assertIn("required", str(cm.exception).lower())
    
    # Test invalid value
    doc.employee_name = "Test"
    doc.email = "invalid-email"
    with self.assertRaises(frappe.ValidationError):
        doc.insert()
```

### Pattern 4: Testing Permissions

```python
def test_permissions(self):
    doc = make_test_document()
    
    # Test as different user
    with self.set_user("test@example.com"):
        doc = frappe.get_doc("Employee", doc.name)
        self.assertTrue(doc.has_permission("read"))
        self.assertFalse(doc.has_permission("write"))
        
        # Test submit permission
        with self.assertRaises(frappe.PermissionError):
            doc.submit()
```

### Pattern 5: Testing Child Tables

```python
def test_child_table(self):
    doc = make_test_document()
    
    # Test child table count
    self.assertEqual(len(doc.items), 2)
    
    # Test child table values
    self.assertEqual(doc.items[0].item_code, "_Test Item")
    self.assertEqual(doc.items[0].qty, 10)
    
    # Test child table calculations
    expected_amount = doc.items[0].qty * doc.items[0].rate
    self.assertEqual(doc.items[0].amount, expected_amount)
```

### Pattern 6: Testing Database State

```python
def test_database_state(self):
    # Before
    initial_count = frappe.db.count("Employee")
    
    # Action
    make_employee("test@example.com")
    
    # After
    final_count = frappe.db.count("Employee")
    self.assertEqual(final_count, initial_count + 1)
    
    # Verify document exists
    self.assertTrue(frappe.db.exists("Employee", {"email": "test@example.com"}))
```

### Pattern 7: Testing Performance

```python
def test_performance(self):
    # Test query count
    with self.assertQueryCount(5):
        doc = frappe.get_doc("Employee", "EMP-00001")
        doc.reload()
        doc.save()
    
    # Test row reads
    with self.assertRowsRead(100):
        employees = frappe.get_all("Employee", limit=100)
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Floating Point Precision

**Problem:**
```python
self.assertEqual(10/3, 3.333333333)  # Fails due to precision
```

**Solution:**
```python
self.assertAlmostEqual(10/3, 3.333, places=3)
# or
self.assertAlmostEqual(10/3, 3.33, delta=0.01)
```

#### Issue 2: Document Comparison

**Problem:**
```python
# Comparing documents field by field is tedious
self.assertEqual(doc.field1, expected1)
self.assertEqual(doc.field2, expected2)
# ... many lines
```

**Solution:**
```python
expected = {"field1": expected1, "field2": expected2}
self.assertDocumentEqual(expected, doc)
```

#### Issue 3: Exception Message Testing

**Problem:**
```python
# Can't access exception message
self.assertRaises(frappe.ValidationError, invalid_operation)
```

**Solution:**
```python
with self.assertRaises(frappe.ValidationError) as cm:
    invalid_operation()
self.assertIn("required", str(cm.exception))
```

#### Issue 4: Query Count Failures

**Problem:**
```python
# Query count assertion fails unexpectedly
with self.assertQueryCount(5):
    operation()  # Executes 10 queries
```

**Solution:**
- Check if operation is doing unnecessary queries
- Use `frappe.db.explain()` to see queries
- Consider caching or optimization
- Adjust expected count if operation legitimately needs more queries

#### Issue 5: Time-Dependent Tests

**Problem:**
```python
# Test fails due to time differences
self.assertEqual(doc.creation, now())
```

**Solution:**
```python
# Use freeze_time context manager
with self.freeze_time("2024-01-15 10:00:00"):
    doc = make_test_document()
    self.assertEqual(str(doc.creation), "2024-01-15 10:00:00")
```

### Debugging Failed Assertions

#### 1. Use Descriptive Messages

```python
self.assertEqual(result, expected, 
    msg=f"Calculation failed: expected {expected}, got {result}")
```

#### 2. Print Values Before Assertion

```python
def test_debug(self):
    result = calculate_value()
    print(f"Result: {result}")  # Debug output
    print(f"Type: {type(result)}")
    self.assertEqual(result, expected)
```

#### 3. Use maxDiff for Long Comparisons

```python
class TestMyFeature(FrappeTestCase):
    maxDiff = 10000  # Show more diff details
    
    def test_long_comparison(self):
        expected = {"very": "long", "dictionary": "with", "many": "fields"}
        actual = get_actual_dict()
        self.assertDictEqual(expected, actual)
```

#### 4. Check Assertion Order

```python
# Good - Check prerequisites first
def test_order(self):
    self.assertIsNotNone(doc)  # Check exists first
    self.assertEqual(doc.status, "Active")  # Then check value
```

---

## Quick Reference

### Standard Assertions

| Assertion | Purpose | Example |
|-----------|---------|---------|
| `assertEqual(a, b)` | a == b | `self.assertEqual(5, 5)` |
| `assertNotEqual(a, b)` | a != b | `self.assertNotEqual(1, 2)` |
| `assertTrue(x)` | x is True | `self.assertTrue(doc.enabled)` |
| `assertFalse(x)` | x is False | `self.assertFalse(doc.deleted)` |
| `assertIs(a, b)` | a is b | `self.assertIs(obj1, obj1)` |
| `assertIsNot(a, b)` | a is not b | `self.assertIsNot(obj1, obj2)` |
| `assertIsNone(x)` | x is None | `self.assertIsNone(deleted_doc)` |
| `assertIsNotNone(x)` | x is not None | `self.assertIsNotNone(doc.name)` |
| `assertIn(a, b)` | a in b | `self.assertIn("Active", statuses)` |
| `assertNotIn(a, b)` | a not in b | `self.assertNotIn("Deleted", statuses)` |
| `assertIsInstance(a, b)` | isinstance(a, b) | `self.assertIsInstance(doc, Document)` |
| `assertGreater(a, b)` | a > b | `self.assertGreater(balance, 0)` |
| `assertGreaterEqual(a, b)` | a >= b | `self.assertGreaterEqual(age, 18)` |
| `assertLess(a, b)` | a < b | `self.assertLess(balance, 1000)` |
| `assertLessEqual(a, b)` | a <= b | `self.assertLessEqual(discount, 100)` |
| `assertAlmostEqual(a, b)` | a ≈ b | `self.assertAlmostEqual(10/3, 3.333, places=3)` |
| `assertRaises(ex, fn)` | fn raises ex | `self.assertRaises(ValidationError, invalid_op)` |

### Frappe-Specific Assertions

| Assertion | Purpose | Example |
|-----------|---------|---------|
| `assertDocumentEqual(exp, act)` | Compare documents | `self.assertDocumentEqual(expected, doc)` |
| `assertSequenceSubset(larger, smaller)` | smaller ⊆ larger | `self.assertSequenceSubset(all_roles, user_roles)` |
| `assertQueryCount(n)` | ≤ n queries | `with self.assertQueryCount(5): ...` |
| `assertRowsRead(n)` | ≤ n rows | `with self.assertRowsRead(100): ...` |
| `assertQueryEqual(q1, q2)` | Queries equal | `self.assertQueryEqual(query1, query2)` |
| `assertRedisCallCounts(n)` | ≤ n Redis calls | `with self.assertRedisCallCounts(5): ...` |

---

## Summary

This guide covers all assertion methods available in Frappe testing:

1. **Standard unittest assertions** - Basic equality, comparison, membership, type checks
2. **Frappe-specific assertions** - Document comparison, sequence subsets
3. **Context manager assertions** - Query counts, row reads, Redis calls
4. **Exception assertions** - Testing error conditions
5. **Custom assertions** - Creating your own assertion methods
6. **Best practices** - How to write effective assertions
7. **Common patterns** - Real-world testing scenarios
8. **Troubleshooting** - Solving common issues

Remember:
- Use descriptive messages
- Choose the right assertion for the job
- Test one thing per assertion
- Use Frappe-specific assertions when appropriate

---

## Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 8: Reports](./80-Frappe_Unit_Testing_Guide_Part_8_Reports.md)
- [Part 9: Test Records](./82-Frappe_Unit_Testing_Guide_Part_9_Test_Records.md)