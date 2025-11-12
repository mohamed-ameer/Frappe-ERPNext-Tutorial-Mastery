# Frappe Unit Testing Guide - Part 3: Test Patterns and Best Practices

## Table of Contents
1. [Common Test Patterns](#common-test-patterns)
2. [Assertion Methods](#assertion-methods)
3. [Context Managers](#context-managers)
4. [Test Setup and Teardown](#test-setup-and-teardown)
5. [Best Practices](#best-practices)
6. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
7. [Test Organization](#test-organization)
8. [Real-World Examples](#real-world-examples)

---

## Common Test Patterns

### Pattern 1: Document Lifecycle Testing

Test the complete lifecycle of a document: create, read, update, delete.

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestMyDocType(FrappeTestCase):
    def test_document_lifecycle(self):
        # Create
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        doc_name = doc.name
        
        # Read
        doc = frappe.get_doc("MyDocType", doc_name)
        self.assertEqual(doc.field1, "value1")
        
        # Update
        doc.field1 = "updated_value"
        doc.save()
        doc.reload()
        self.assertEqual(doc.field1, "updated_value")
        
        # Delete
        frappe.delete_doc("MyDocType", doc_name)
        self.assertFalse(frappe.db.exists("MyDocType", doc_name))
```

### Pattern 2: Validation Testing

Test all validation rules and constraints.

```python
def test_required_field_validation(self):
    """Test that required fields are enforced"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        # Missing required field 'field1'
    })
    
    with self.assertRaises(frappe.ValidationError) as cm:
        doc.insert()
    
    self.assertIn("field1", str(cm.exception))

def test_field_validation(self):
    """Test field-level validation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "valid_value",
        "email_field": "invalid-email"  # Invalid email format
    })
    
    with self.assertRaises(frappe.ValidationError):
        doc.insert()

def test_custom_validation(self):
    """Test custom validate() method"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1",
        "field2": "invalid_combination"
    })
    
    with self.assertRaises(frappe.ValidationError):
        doc.validate()

def test_date_range_validation(self):
    """Test date range validation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    })
    doc.insert()
    
    # Test invalid date range
    doc.end_date = "2023-12-31"  # Before start_date
    with self.assertRaises(frappe.exceptions.InvalidDates):
        doc.validate_from_to_dates("start_date", "end_date")
```

### Pattern 3: Permission Testing

Test role-based access control and permissions.

```python
def test_read_permission(self):
    """Test read permission for different roles"""
    # Create document as Administrator
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Test as regular user
    with self.set_user("test@example.com"):
        doc = frappe.get_doc("MyDocType", doc.name)
        self.assertTrue(doc.has_permission("read"))
        self.assertFalse(doc.has_permission("write"))

def test_permission_restriction(self):
    """Test that users without permission cannot access"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    with self.set_user("restricted_user@example.com"):
        with self.assertRaises(frappe.PermissionError):
            frappe.get_doc("MyDocType", doc.name)

def test_submit_permission(self):
    """Test submit permission"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    with self.set_user("test@example.com"):
        doc = frappe.get_doc("MyDocType", doc.name)
        if doc.has_permission("submit"):
            doc.submit()
            self.assertEqual(doc.docstatus, 1)
        else:
            with self.assertRaises(frappe.PermissionError):
                doc.submit()

def test_user_permissions_in_list(self):
    """Test user permissions affect list queries"""
    # Create documents
    doc1 = frappe.get_doc({"doctype": "MyDocType", "field1": "value1"}).insert()
    doc2 = frappe.get_doc({"doctype": "MyDocType", "field1": "value2"}).insert()
    
    # Add user permission for doc1 only
    frappe.permissions.add_user_permission("MyDocType", doc1.name, "test@example.com")
    
    with self.set_user("test@example.com"):
        names = [d.name for d in frappe.get_list("MyDocType", fields=["name"])]
        self.assertIn(doc1.name, names)
        self.assertNotIn(doc2.name, names)
```

### Pattern 4: Workflow Testing

Test document workflows and state transitions.

```python
def test_workflow_transitions(self):
    """Test workflow state transitions"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1",
        "workflow_state": "Draft"
    })
    doc.insert()
    
    # Transition to Submitted
    doc.workflow_state = "Submitted"
    doc.save()
    self.assertEqual(doc.workflow_state, "Submitted")
    
    # Test invalid transition
    doc.workflow_state = "Cancelled"
    with self.assertRaises(frappe.ValidationError):
        doc.save()  # Cannot transition directly from Submitted to Cancelled

def test_submit_and_cancel(self):
    """Test document submission and cancellation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Submit
    doc.submit()
    self.assertEqual(doc.docstatus, 1)
    
    # Verify cannot update after submit
    doc.field1 = "new_value"
    with self.assertRaises(frappe.UpdateAfterSubmitError):
        doc.save()
    
    # Cancel
    doc.cancel()
    self.assertEqual(doc.docstatus, 2)
```

### Pattern 5: Child Table Testing

Test child tables and related documents.

```python
def test_child_table_operations(self):
    """Test operations on child tables"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1",
        "child_table": [
            {
                "child_field1": "value1",
                "child_field2": "value2"
            },
            {
                "child_field1": "value3",
                "child_field2": "value4"
            }
        ]
    })
    doc.insert()
    
    # Verify child records
    self.assertEqual(len(doc.child_table), 2)
    self.assertEqual(doc.child_table[0].child_field1, "value1")
    
    # Add child record
    doc.append("child_table", {
        "child_field1": "value5",
        "child_field2": "value6"
    })
    doc.save()
    self.assertEqual(len(doc.child_table), 3)
    
    # Remove child record
    doc.remove(doc.child_table[0])
    doc.save()
    self.assertEqual(len(doc.child_table), 2)

def test_child_table_defaults(self):
    """Test default values in child tables"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "child_table": [{}]  # Empty child row
    })
    doc.insert()
    
    # Verify default value is applied
    self.assertEqual(doc.child_table[0].some_fieldname, "default_value")
```

### Pattern 6: Calculation Testing

Test calculated fields and formulas.

```python
def test_calculated_field(self):
    """Test automatic calculation of fields"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "quantity": 10,
        "rate": 100
    })
    doc.insert()
    
    # Verify calculated field
    self.assertEqual(doc.amount, 1000)  # quantity * rate
    
    # Update and verify recalculation
    doc.quantity = 20
    doc.save()
    doc.reload()
    self.assertEqual(doc.amount, 2000)

def test_formula_field(self):
    """Test formula field calculations"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": 100,
        "field2": 50
    })
    doc.insert()
    
    # Formula: field1 + field2
    self.assertEqual(doc.calculated_field, 150)

def test_child_table_calculations(self):
    """Test calculations across child tables"""
    doc = frappe.get_doc({
        "doctype": "Invoice",
        "items": [
            {"quantity": 2, "rate": 100},  # Amount: 200
            {"quantity": 3, "rate": 50}    # Amount: 150
        ]
    })
    doc.insert()
    
    # Total should be sum of all item amounts
    self.assertEqual(doc.total, 350)
```

### Pattern 7: Link Field Testing

Test link fields and related document references.

```python
def test_link_field_validation(self):
    """Test link field validation"""
    # Create linked document
    linked_doc = frappe.get_doc({
        "doctype": "LinkedDocType",
        "field1": "value1"
    })
    linked_doc.insert()
    
    # Create document with link
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "linked_field": linked_doc.name
    })
    doc.insert()
    
    self.assertEqual(doc.linked_field, linked_doc.name)
    
    # Test invalid link
    doc.linked_field = "NonExistent"
    with self.assertRaises(frappe.ValidationError):
        doc.save()

def test_dynamic_link(self):
    """Test dynamic link fields"""
    # Create documents of different types
    doc1 = frappe.get_doc({
        "doctype": "DocType1",
        "name": "test1"
    })
    doc1.insert()
    
    # Create document with dynamic link
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "link_doctype": "DocType1",
        "link_name": "test1"
    })
    doc.insert()
    
    self.assertEqual(doc.link_name, "test1")
```

### Pattern 8: Date and Time Testing

Test date/time fields and time-based logic.

```python
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate, getdate

def test_date_validation(self):
    """Test date field validation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    })
    doc.insert()
    
    # Test invalid date range
    doc.end_date = "2023-12-31"  # Before start_date
    with self.assertRaises(frappe.ValidationError):
        doc.save()

def test_time_based_logic(self):
    """Test time-based business logic"""
    with self.freeze_time("2024-01-15"):
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "date_field": nowdate()
        })
        doc.insert()
        
        # Verify date is frozen
        self.assertEqual(str(doc.date_field), "2024-01-15")

def test_date_comparisons(self):
    """Test date comparisons and calculations"""
    with self.freeze_time("2024-01-15"):
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "start_date": nowdate(),
            "end_date": add_days(nowdate(), 30)
        })
        doc.insert()
        
        # Verify date calculations
        self.assertEqual(
            (getdate(doc.end_date) - getdate(doc.start_date)).days,
            30
        )
```

### Pattern 9: Error Handling Testing

Test error handling and exception scenarios.

```python
def test_duplicate_validation(self):
    """Test duplicate prevention"""
    doc1 = frappe.get_doc({
        "doctype": "MyDocType",
        "unique_field": "unique_value"
    })
    doc1.insert()
    
    # Try to create duplicate
    doc2 = frappe.get_doc({
        "doctype": "MyDocType",
        "unique_field": "unique_value"
    })
    
    with self.assertRaises(frappe.DuplicateEntryError):
        doc2.insert()

def test_mandatory_field_error(self):
    """Test mandatory field error messages"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        # Missing mandatory field
    })
    
    with self.assertRaises(frappe.MandatoryError) as cm:
        doc.insert()
    
    error_message = str(cm.exception)
    self.assertIn("mandatory", error_message.lower())

def test_character_length_validation(self):
    """Test character length limits"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "a" * 1000  # Exceeds varchar limit
    })
    
    with self.assertRaises(frappe.CharacterLengthExceededError):
        doc.insert()

def test_non_negative_validation(self):
    """Test non-negative number validation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "quantity": -1  # Negative value
    })
    
    with self.assertRaises(frappe.NonNegativeError):
        doc.insert()

def test_does_not_exist_error(self):
    """Test error when trying to save new doc with existing name"""
    doc = frappe.get_doc({
        "doctype": "ToDo",
        "description": "test",
        "name": "existing-name"  # Trying to set name on new doc
    })
    
    with self.assertRaises(frappe.DoesNotExistError):
        doc.save()
```

### Pattern 10: API Testing

Test API endpoints and responses.

```python
from frappe.tests.test_api import FrappeAPITestCase

class TestMyAPI(FrappeAPITestCase):
    version = "v1"
    
    def test_get_resource(self):
        """Test GET API endpoint"""
        # Create test document
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        # Test GET request
        response = self.get(self.resource("MyDocType", doc.name))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["field1"], "value1")
    
    def test_create_resource(self):
        """Test POST API endpoint"""
        data = {
            "doctype": "MyDocType",
            "field1": "value1"
        }
        
        response = self.post(self.resource("MyDocType"), data)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json["data"]["name"])
    
    def test_update_resource(self):
        """Test PUT API endpoint"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "old_value"
        })
        doc.insert()
        
        data = {"field1": "new_value"}
        response = self.put(self.resource("MyDocType", doc.name), data)
        self.assertEqual(response.status_code, 200)
        
        # Verify update
        doc.reload()
        self.assertEqual(doc.field1, "new_value")
    
    def test_delete_resource(self):
        """Test DELETE API endpoint"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1"
        })
        doc.insert()
        
        response = self.delete(self.resource("MyDocType", doc.name))
        self.assertEqual(response.status_code, 202)
        
        # Verify deletion
        response = self.get(self.resource("MyDocType", doc.name))
        self.assertEqual(response.status_code, 404)
    
    def test_api_method(self):
        """Test API method endpoint"""
        response = self.get(self.method("frappe.auth.get_logged_user"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["message"], "Administrator")
    
    def test_api_authentication(self):
        """Test API authentication"""
        # Test with valid credentials
        # (Setup API key and secret)
        response = self.get(self.method("frappe.auth.get_logged_user"))
        self.assertEqual(response.status_code, 200)
        
        # Test with invalid credentials
        # (Modify authorization token)
        response = self.get(self.method("frappe.auth.get_logged_user"))
        self.assertEqual(response.status_code, 401)
```

### Pattern 11: Database Query Testing

Test database queries and query optimization.

```python
def test_db_get_value(self):
    """Test database get_value operations"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Test various get_value operations
    value = frappe.db.get_value("MyDocType", doc.name, "field1")
    self.assertEqual(value, "value1")
    
    # Test with filters
    value = frappe.db.get_value("MyDocType", {"field1": "value1"})
    self.assertEqual(value, doc.name)
    
    # Test with operators
    value = frappe.db.get_value("MyDocType", {"field1": ["like", "val%"]})
    self.assertEqual(value, doc.name)

def test_query_optimization(self):
    """Test query count optimization"""
    with self.assertQueryCount(5):  # Maximum 5 queries
        # Your code that should be optimized
        docs = frappe.get_all("MyDocType", limit=10)
        for doc in docs:
            frappe.get_doc("MyDocType", doc.name)

def test_db_set_value(self):
    """Test direct database updates"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Update directly in database
    frappe.db.set_value("MyDocType", doc.name, "field1", "new_value")
    
    # Verify update
    value = frappe.db.get_value("MyDocType", doc.name, "field1")
    self.assertEqual(value, "new_value")
```

### Pattern 12: Document Methods Testing

Test custom document methods and hooks.

```python
def test_document_methods(self):
    """Test custom document methods"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Test custom method
    result = doc.my_custom_method()
    self.assertEqual(result, expected_value)
    
    # Test run_method
    result = doc.run_method("my_custom_method")
    self.assertEqual(result, expected_value)

def test_document_hooks(self):
    """Test document event hooks"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    
    # Test before_insert hook
    doc.insert()  # Should trigger before_insert
    
    # Test on_update hook
    doc.field1 = "new_value"
    doc.save()  # Should trigger on_update
    
    # Test before_submit hook
    doc.submit()  # Should trigger before_submit
```

### Pattern 13: Naming Series Testing

Test naming series and autoname functionality.

```python
def test_naming_series(self):
    """Test naming series generation"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "naming_series": "TEST-"
    })
    doc.insert()
    
    # Verify name follows naming series
    self.assertTrue(doc.name.startswith("TEST-"))
    
    # Test naming series reversion
    from frappe.model.naming import revert_series_if_last
    revert_series_if_last("TEST-", doc.name)
    
    # Verify series was reverted
    # (Check Series table)

def test_autoname(self):
    """Test autoname functionality"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "value1"
    })
    doc.insert()
    
    # Verify autoname was applied
    self.assertIsNotNone(doc.name)
    self.assertNotEqual(doc.name, "")
```

### Pattern 14: Formatted Values Testing

Test formatted field values and display.

```python
def test_get_formatted(self):
    """Test formatted field values"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "currency_field": 100000
    })
    doc.insert()
    
    # Test currency formatting
    formatted = doc.get_formatted("currency_field", currency="USD")
    self.assertIn("100,000", formatted)
    
    # Test date formatting
    formatted = doc.get_formatted("date_field")
    self.assertIsInstance(formatted, str)
```

---

## Assertion Methods

### Standard Assertions

FrappeTestCase inherits all standard unittest assertions:

```python
# Equality
self.assertEqual(a, b)
self.assertNotEqual(a, b)

# Truthiness
self.assertTrue(x)
self.assertFalse(x)

# None
self.assertIsNone(x)
self.assertIsNotNone(x)

# Type
self.assertIsInstance(obj, Class)
self.assertNotIsInstance(obj, Class)

# Containment
self.assertIn(item, container)
self.assertNotIn(item, container)

# Exceptions
self.assertRaises(Exception, function, *args)
with self.assertRaises(Exception) as cm:
    function()
    self.assertIn("error message", str(cm.exception))

# Comparison
self.assertGreater(a, b)
self.assertGreaterEqual(a, b)
self.assertLess(a, b)
self.assertLessEqual(a, b)

# Almost equal (for floats)
self.assertAlmostEqual(a, b, places=2)
```

### Frappe-Specific Assertions

#### assertDocumentEqual

Compare documents field by field:

```python
def test_document_comparison(self):
    expected = {
        "doctype": "MyDocType",
        "field1": "value1",
        "field2": 100
    }
    
    actual = frappe.get_doc("MyDocType", "test-doc")
    
    self.assertDocumentEqual(expected, actual)
```

**Features**:
- Handles nested child tables
- Compares float values with precision
- Handles datetime comparisons
- Recursive comparison for child documents

#### assertSequenceSubset

Check if one sequence is a subset of another:

```python
def test_subset(self):
    larger = ["a", "b", "c", "d"]
    smaller = ["a", "c"]
    
    self.assertSequenceSubset(larger, smaller)  # Passes
```

#### assertQueryEqual

Compare SQL queries (normalized):

```python
def test_query(self):
    query1 = "SELECT * FROM `tabUser` WHERE name = 'Admin'"
    query2 = "select * from tabUser where name='Admin'"
    
    self.assertQueryEqual(query1, query2)  # Passes after normalization
```

**Normalization**:
- Uppercase keywords
- Consistent indentation
- Removed comments
- Standardized whitespace

---

## Context Managers

### set_user

Temporarily switch user context:

```python
def test_user_context(self):
    with self.set_user("test@example.com"):
        # All operations run as test@example.com
        doc = frappe.get_doc("MyDocType", "test-doc")
        # User is automatically restored after context
```

**Use Cases**:
- Testing permissions
- Testing user-specific behavior
- Testing role-based access

### switch_site

Switch to a different site:

```python
def test_multi_site(self):
    with self.switch_site("other_site"):
        # Operations run on other_site
        doc = frappe.get_doc("MyDocType", "test-doc")
        # Site is automatically restored after context
```

**Use Cases**:
- Multi-site testing
- Site-specific configurations
- Cross-site operations

### freeze_time

Freeze time for time-based tests:

```python
def test_time_freeze(self):
    with self.freeze_time("2024-01-15 10:00:00"):
        # All datetime operations use frozen time
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "date_field": frappe.utils.nowdate()
        })
        # date_field will be 2024-01-15
```

**Use Cases**:
- Testing time-based logic
- Testing scheduled tasks
- Testing date calculations
- Testing expiration logic

### primary_connection / secondary_connection

Simulate multiple database connections (for concurrency testing):

```python
def test_concurrent_access(self):
    # Primary connection
    with self.primary_connection():
        doc1 = frappe.get_doc("MyDocType", "test-doc")
        doc1.field1 = "value1"
        doc1.save()
    
    # Secondary connection (simulates another user)
    with self.secondary_connection():
        doc2 = frappe.get_doc("MyDocType", "test-doc")
        # May see different state
        doc2.field1 = "value2"
        doc2.save()
    
    # Both connections are rolled back after test
```

**Use Cases**:
- Testing concurrent access
- Testing race conditions
- Testing transaction isolation
- Testing locking mechanisms

### assertQueryCount

Assert maximum number of SQL queries:

```python
def test_query_optimization(self):
    with self.assertQueryCount(5):  # Maximum 5 queries allowed
        # Your code that should be optimized
        docs = frappe.get_all("MyDocType", limit=10)
        for doc in docs:
            frappe.get_doc("MyDocType", doc.name)
```

**Use Cases**:
- Performance testing
- Query optimization verification
- N+1 query detection
- Database efficiency testing

### assertRedisCallCounts

Assert maximum number of Redis calls:

```python
def test_cache_optimization(self):
    with self.assertRedisCallCounts(3):  # Maximum 3 Redis calls
        # Your code that uses cache
        frappe.cache().get_value("key1")
        frappe.cache().get_value("key2")
        frappe.cache().set_value("key3", "value")
```

**Use Cases**:
- Cache optimization
- Redis performance testing
- Cache efficiency verification

### assertRowsRead

Assert maximum number of rows read:

```python
def test_data_access(self):
    with self.assertRowsRead(100):  # Maximum 100 rows
        # Your code that reads data
        frappe.get_all("MyDocType", limit=100)
```

**Use Cases**:
- Data access optimization
- Query result size verification
- Performance testing

---

## Test Setup and Teardown

### setUp and tearDown

Run before and after each test method:

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        """Run before each test method"""
        super().setUp()
        # Create common test data
        self.test_doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "test_value"
        })
        self.test_doc.insert()
    
    def tearDown(self):
        """Run after each test method"""
        # Cleanup (usually not needed due to auto-rollback)
        super().tearDown()
    
    def test_something(self):
        # self.test_doc is available here
        self.assertEqual(self.test_doc.field1, "test_value")
```

**Important**: Always call `super().setUp()` and `super().tearDown()`.

### setUpClass and tearDownClass

Run once before/after all test methods in the class:

```python
class TestMyDocType(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        """Run once before all test methods"""
        super().setUpClass()  # IMPORTANT: Always call super()
        
        # Create shared test data
        cls.shared_doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "shared_value"
        })
        cls.shared_doc.insert()
        frappe.db.commit()  # Commit if needed across tests
    
    @classmethod
    def tearDownClass(cls):
        """Run once after all test methods"""
        # Cleanup shared resources
        super().tearDownClass()
    
    def test_one(self):
        # cls.shared_doc is available
        pass
    
    def test_two(self):
        # cls.shared_doc is available
        pass
```

**Important Notes**:
- Always call `super().setUpClass()` first
- Database changes in `setUpClass` may need explicit commit
- Use class variables (`cls.`) for shared data
- `tearDownClass` runs even if tests fail

### When to Use setUp vs setUpClass

**Use `setUp`** when:
- Each test needs fresh data
- Tests modify shared data
- Data is test-specific

**Use `setUpClass`** when:
- Data is expensive to create
- Data is read-only across tests
- Performance is critical

---

## Best Practices

### 1. Test Naming

**Good**:
```python
def test_create_document_with_required_fields(self):
    pass

def test_validation_prevents_duplicate_entries(self):
    pass

def test_user_without_permission_cannot_access(self):
    pass

def test_calculate_total_includes_all_items(self):
    pass
```

**Bad**:
```python
def test1(self):
    pass

def test_thing(self):
    pass

def test_it(self):
    pass

def test(self):
    pass
```

**Guidelines**:
- Use descriptive names that explain what is being tested
- Follow pattern: `test_[what]_[condition]_[expected_result]`
- Use underscores, not camelCase
- Be specific about the scenario

### 2. One Assertion Per Concept

**Good**:
```python
def test_document_creation(self):
    doc = create_document()
    self.assertIsNotNone(doc.name)
    self.assertEqual(doc.status, "Draft")
    self.assertTrue(doc.is_new())
```

**Bad**:
```python
def test_everything(self):
    doc = create_document()
    # Too many unrelated assertions
    self.assertIsNotNone(doc.name)
    self.assertEqual(doc.status, "Draft")
    self.assertTrue(doc.is_new())
    # ... 20 more unrelated assertions
```

**Guidelines**:
- Group related assertions together
- Split unrelated assertions into separate tests
- Each test should verify one concept or behavior

### 3. Use Descriptive Test Data

**Good**:
```python
def test_calculate_total(self):
    doc = frappe.get_doc({
        "doctype": "Invoice",
        "items": [
            {"quantity": 2, "rate": 100},  # Total: 200
            {"quantity": 3, "rate": 50}     # Total: 150
        ]
    })
    # Expected total: 350
    self.assertEqual(doc.total, 350)
```

**Bad**:
```python
def test_calculate_total(self):
    doc = frappe.get_doc({
        "doctype": "Invoice",
        "items": [
            {"quantity": 1, "rate": 1},
            {"quantity": 1, "rate": 1}
        ]
    })
    # Not clear what the expected result should be
    self.assertEqual(doc.total, 2)
```

**Guidelines**:
- Use meaningful test data
- Add comments explaining expected results
- Make calculations obvious
- Use realistic values

### 4. Test Edge Cases

```python
def test_empty_values(self):
    """Test handling of empty/None values"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": None,
        "field2": ""
    })
    # Should handle gracefully
    doc.insert()
    self.assertIsNone(doc.field1)

def test_boundary_values(self):
    """Test min/max values"""
    # Test minimum value
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "quantity": 0
    })
    doc.insert()
    
    # Test maximum value
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "quantity": 999999
    })
    doc.insert()

def test_special_characters(self):
    """Test special characters in strings"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "field1": "Test & <Special> 'Characters' \"Quotes\""
    })
    doc.insert()
    # Should escape properly
    self.assertIn("&", doc.field1)

def test_very_large_numbers(self):
    """Test handling of large numbers"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "amount": 999999999999.99
    })
    doc.insert()
    self.assertEqual(doc.amount, 999999999999.99)
```

### 5. Isolate Tests

Each test should be independent:

```python
# Good: Each test is independent
def test_create(self):
    doc = create_document()
    self.assertIsNotNone(doc.name)

def test_update(self):
    doc = create_document()
    doc.field1 = "new_value"
    doc.save()
    self.assertEqual(doc.field1, "new_value")

# Bad: Tests depend on each other
def test_create(self):
    self.doc = create_document()

def test_update(self):
    # Depends on test_create running first
    self.doc.field1 = "new_value"
    self.doc.save()
```

**Guidelines**:
- Each test should be able to run independently
- Don't rely on test execution order
- Create fresh data in each test if needed
- Use `setUp` for common setup, not shared state

### 6. Use setUp for Common Setup

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Common setup for all tests
        self.base_doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "base_value"
        })
        self.base_doc.insert()
    
    def test_scenario_one(self):
        # Use self.base_doc
        self.assertEqual(self.base_doc.field1, "base_value")
    
    def test_scenario_two(self):
        # Use self.base_doc (fresh instance each time)
        doc = frappe.get_doc("MyDocType", self.base_doc.name)
        self.assertIsNotNone(doc)
```

### 7. Clean Up After Tests

```python
def test_with_cleanup(self):
    # Create temporary data
    temp_doc = frappe.get_doc({
        "doctype": "TempDocType",
        "field1": "temp"
    })
    temp_doc.insert()
    
    try:
        # Test logic
        result = perform_operation(temp_doc)
        self.assertEqual(result, expected)
    finally:
        # Cleanup (though auto-rollback usually handles this)
        if frappe.db.exists("TempDocType", temp_doc.name):
            frappe.delete_doc("TempDocType", temp_doc.name, force=1)
```

**Note**: Frappe automatically rolls back database changes after each test, so explicit cleanup is usually not needed. However, cleanup may be needed for:
- External resources (files, network connections)
- Cache entries
- Temporary settings

### 8. Test Error Messages

```python
def test_error_message(self):
    with self.assertRaises(frappe.ValidationError) as cm:
        invalid_operation()
    
    error_message = str(cm.exception)
    self.assertIn("expected error text", error_message)
    self.assertIn("field1", error_message.lower())
```

**Guidelines**:
- Verify error messages are helpful
- Check that error messages mention relevant fields
- Ensure error messages are user-friendly

### 9. Use Constants for Test Data

```python
class TestMyDocType(FrappeTestCase):
    TEST_FIELD1 = "test_value_1"
    TEST_FIELD2 = "test_value_2"
    TEST_EMAIL = "test@example.com"
    
    def test_something(self):
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": self.TEST_FIELD1,
            "field2": self.TEST_FIELD2
        })
        # ...
```

**Benefits**:
- Easy to update test data
- Consistent across tests
- Clear what values are being tested

### 10. Document Complex Tests

```python
def test_complex_calculation(self):
    """
    Test the complex calculation logic:
    1. Base amount is calculated from items
    2. Discount is applied if total > 1000
    3. Tax is calculated on discounted amount
    4. Final amount = discounted amount + tax
    
    Test case: 3 items with total 1500
    - Base: 1500
    - Discount (10%): 150
    - Discounted: 1350
    - Tax (5%): 67.50
    - Final: 1417.50
    """
    doc = frappe.get_doc({
        "doctype": "Invoice",
        "items": [
            {"quantity": 5, "rate": 200},  # 1000
            {"quantity": 2, "rate": 150},  # 300
            {"quantity": 1, "rate": 200}   # 200
        ]
    })
    doc.insert()
    
    self.assertEqual(doc.total, 1500)
    self.assertEqual(doc.discount_amount, 150)
    self.assertEqual(doc.final_amount, 1417.50)
```

### 11. Test Both Positive and Negative Cases

```python
def test_valid_email(self):
    """Test that valid emails are accepted"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "email": "valid@example.com"
    })
    doc.insert()
    self.assertEqual(doc.email, "valid@example.com")

def test_invalid_email(self):
    """Test that invalid emails are rejected"""
    doc = frappe.get_doc({
        "doctype": "MyDocType",
        "email": "invalid-email"
    })
    with self.assertRaises(frappe.ValidationError):
        doc.insert()
```

### 12. Use Helper Methods

```python
class TestMyDocType(FrappeTestCase):
    def create_test_document(self, **kwargs):
        """Helper to create test document"""
        defaults = {
            "doctype": "MyDocType",
            "field1": "default_value"
        }
        defaults.update(kwargs)
        doc = frappe.get_doc(defaults)
        doc.insert()
        return doc
    
    def create_test_user(self, email="test@example.com", roles=None):
        """Helper to create test user"""
        if not frappe.db.exists("User", email):
            user = frappe.get_doc({
                "doctype": "User",
                "email": email,
                "first_name": "Test",
                "roles": roles or []
            })
            user.insert()
        return frappe.get_doc("User", email)
    
    def test_scenario_one(self):
        doc = self.create_test_document(field1="custom_value")
        # Test logic
    
    def test_scenario_two(self):
        user = self.create_test_user(roles=[{"role": "System Manager"}])
        with self.set_user(user.email):
            # Test logic
```

---

## Anti-Patterns to Avoid

### 1. Testing Implementation Details

**Bad**:
```python
def test_internal_variable(self):
    doc = create_document()
    # Testing internal implementation
    self.assertEqual(doc._internal_cache, {...})
    self.assertEqual(doc._meta, {...})
```

**Good**:
```python
def test_behavior(self):
    doc = create_document()
    # Testing behavior/outcome
    self.assertEqual(doc.calculated_field, expected_value)
    self.assertTrue(doc.is_valid())
```

**Why**: Tests should verify behavior, not implementation. Implementation can change without breaking behavior.

### 2. Over-Mocking

**Bad**:
```python
@patch('frappe.get_doc')
@patch('frappe.db.get_value')
@patch('frappe.cache')
@patch('frappe.get_list')
def test_something(self, mock_list, mock_cache, mock_db, mock_get_doc):
    # Too many mocks, not testing real behavior
    mock_get_doc.return_value = mock_doc
    # ...
```

**Good**:
```python
def test_something(self):
    # Use real Frappe functions
    doc = frappe.get_doc("MyDocType", "test-doc")
    # Test actual behavior
    result = doc.calculate_something()
    self.assertEqual(result, expected)
```

**Why**: Over-mocking makes tests brittle and doesn't verify real integration.

### 3. Testing Framework Code

**Bad**:
```python
def test_frappe_get_doc(self):
    # Testing Frappe framework itself
    doc = frappe.get_doc("User", "Administrator")
    self.assertIsNotNone(doc)
```

**Good**:
```python
def test_my_business_logic(self):
    # Testing your business logic using Frappe
    doc = create_my_document()
    result = my_business_function(doc)
    self.assertEqual(result, expected)
```

**Why**: Frappe framework is already tested. Test your application code.

### 4. Slow Tests

**Bad**:
```python
def test_slow_operation(self):
    # Unnecessary sleep or delays
    import time
    time.sleep(5)
    # ...
```

**Good**:
```python
def test_operation(self):
    # Use freeze_time for time-based tests
    with self.freeze_time("2024-01-15"):
        # Test time-based logic
        result = time_based_function()
        self.assertEqual(result, expected)
```

**Why**: Slow tests reduce developer productivity and CI/CD efficiency.

### 5. Non-Deterministic Tests

**Bad**:
```python
def test_random(self):
    import random
    value = random.randint(1, 100)
    # Test depends on random value
    self.assertGreater(value, 0)
```

**Good**:
```python
def test_with_fixed_value(self):
    value = 50  # Fixed test value
    result = process_value(value)
    self.assertEqual(result, expected)
    
def test_with_seed(self):
    import random
    random.seed(42)  # Fixed seed for reproducibility
    value = random.randint(1, 100)
    # Now deterministic
```

**Why**: Non-deterministic tests are unreliable and hard to debug.

### 6. Testing Multiple Things in One Test

**Bad**:
```python
def test_everything(self):
    # Testing creation
    doc = create_document()
    self.assertIsNotNone(doc.name)
    
    # Testing update
    doc.field1 = "new"
    doc.save()
    self.assertEqual(doc.field1, "new")
    
    # Testing delete
    frappe.delete_doc("MyDocType", doc.name)
    self.assertFalse(frappe.db.exists("MyDocType", doc.name))
```

**Good**:
```python
def test_create_document(self):
    doc = create_document()
    self.assertIsNotNone(doc.name)

def test_update_document(self):
    doc = create_document()
    doc.field1 = "new"
    doc.save()
    self.assertEqual(doc.field1, "new")

def test_delete_document(self):
    doc = create_document()
    frappe.delete_doc("MyDocType", doc.name)
    self.assertFalse(frappe.db.exists("MyDocType", doc.name))
```

**Why**: Focused tests are easier to understand, debug, and maintain.

### 7. Ignoring Test Failures

**Bad**:
```python
def test_something(self):
    try:
        operation()
    except Exception:
        pass  # Ignoring failures
    # Test always passes
```

**Good**:
```python
def test_something(self):
    # Let exceptions propagate
    result = operation()
    self.assertEqual(result, expected)
```

**Why**: Tests should fail when something is wrong.

### 8. Hard-Coding Test Data

**Bad**:
```python
def test_calculation(self):
    # Hard-coded values
    doc = frappe.get_doc("Invoice", "INV-00001")
    # Assumes document exists
```

**Good**:
```python
def test_calculation(self):
    # Create test data
    doc = frappe.get_doc({
        "doctype": "Invoice",
        "items": [{"quantity": 2, "rate": 100}]
    })
    doc.insert()
    # Test with known data
```

**Why**: Tests should be self-contained and not depend on external data.

---

## Test Organization

### Group Related Tests

```python
class TestMyDocType(FrappeTestCase):
    """Group: Document Creation"""
    
    def test_create_with_minimal_fields(self):
        pass
    
    def test_create_with_all_fields(self):
        pass
    
    def test_create_with_child_table(self):
        pass
    
    """Group: Validation"""
    
    def test_required_field_validation(self):
        pass
    
    def test_field_format_validation(self):
        pass
    
    def test_custom_validation(self):
        pass
    
    """Group: Permissions"""
    
    def test_read_permission(self):
        pass
    
    def test_write_permission(self):
        pass
    
    def test_submit_permission(self):
        pass
```

### Use Helper Methods

```python
class TestMyDocType(FrappeTestCase):
    def create_test_document(self, **kwargs):
        """Helper to create test document"""
        defaults = {
            "doctype": "MyDocType",
            "field1": "default_value"
        }
        defaults.update(kwargs)
        return frappe.get_doc(defaults).insert()
    
    def create_test_user_with_role(self, role):
        """Helper to create test user with specific role"""
        email = f"test_{role}@example.com"
        if not frappe.db.exists("User", email):
            user = frappe.get_doc({
                "doctype": "User",
                "email": email,
                "first_name": "Test",
                "roles": [{"role": role}]
            })
            user.insert()
        return frappe.get_doc("User", email)
    
    def test_scenario_one(self):
        doc = self.create_test_document(field1="custom_value")
        # Test logic
    
    def test_scenario_two(self):
        user = self.create_test_user_with_role("System Manager")
        with self.set_user(user.email):
            # Test logic
```

### Organize by Feature

```python
# test_invoicing.py
class TestInvoiceCreation(FrappeTestCase):
    """Tests for invoice creation"""
    pass

class TestInvoiceCalculation(FrappeTestCase):
    """Tests for invoice calculations"""
    pass

class TestInvoicePermissions(FrappeTestCase):
    """Tests for invoice permissions"""
    pass
```

### Use Test Fixtures

```python
class TestMyDocType(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create test fixtures
        cls.company = create_test_company()
        cls.customer = create_test_customer()
        cls.item = create_test_item()
    
    def test_with_fixtures(self):
        # Use cls.company, cls.customer, cls.item
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "company": self.company.name,
            "customer": self.customer.name
        })
        # ...
```

---

## Real-World Examples

### Example 1: Complete DocType Test

```python
# Copyright (c) 2024, Your Company and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase

test_dependencies = ["Company", "Customer"]

class TestSalesInvoice(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create shared test data
        if not frappe.db.exists("Company", "_Test Company"):
            cls.company = frappe.get_doc({
                "doctype": "Company",
                "company_name": "_Test Company",
                "abbr": "_TC"
            }).insert()
        else:
            cls.company = frappe.get_doc("Company", "_Test Company")
    
    def setUp(self):
        super().setUp()
        # Create test customer
        if not frappe.db.exists("Customer", "_Test Customer"):
            self.customer = frappe.get_doc({
                "doctype": "Customer",
                "customer_name": "_Test Customer"
            }).insert()
        else:
            self.customer = frappe.get_doc("Customer", "_Test Customer")
    
    def test_create_invoice(self):
        """Test creating a sales invoice"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        })
        invoice.insert()
        
        self.assertIsNotNone(invoice.name)
        self.assertEqual(invoice.total, 100)
        self.assertEqual(invoice.docstatus, 0)
    
    def test_submit_invoice(self):
        """Test submitting a sales invoice"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        })
        invoice.insert()
        invoice.submit()
        
        self.assertEqual(invoice.docstatus, 1)
        self.assertFalse(invoice.is_new())
    
    def test_cannot_update_after_submit(self):
        """Test that invoice cannot be updated after submission"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        })
        invoice.insert()
        invoice.submit()
        
        invoice.total = 200
        with self.assertRaises(frappe.UpdateAfterSubmitError):
            invoice.save()
    
    def test_cancel_invoice(self):
        """Test canceling a sales invoice"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        })
        invoice.insert()
        invoice.submit()
        invoice.cancel()
        
        self.assertEqual(invoice.docstatus, 2)
```

### Example 2: API Testing

```python
from frappe.tests.test_api import FrappeAPITestCase
import frappe

class TestSalesInvoiceAPI(FrappeAPITestCase):
    version = "v1"
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create test data
        cls.company = frappe.get_doc({
            "doctype": "Company",
            "company_name": "_Test Company",
            "abbr": "_TC"
        }).insert()
        
        cls.customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": "_Test Customer"
        }).insert()
    
    def test_create_invoice_via_api(self):
        """Test creating invoice via API"""
        data = {
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        }
        
        response = self.post(self.resource("Sales Invoice"), data)
        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(response.json["data"]["name"])
    
    def test_get_invoice_via_api(self):
        """Test retrieving invoice via API"""
        # Create invoice first
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": self.company.name,
            "customer": self.customer.name,
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        }).insert()
        
        response = self.get(self.resource("Sales Invoice", invoice.name))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["data"]["customer"], self.customer.name)
```

### Example 3: Permission Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.permissions import add_user_permission

class TestSalesInvoicePermissions(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create test user
        self.test_user = frappe.get_doc({
            "doctype": "User",
            "email": "test_invoice_user@example.com",
            "first_name": "Test",
            "roles": [{"role": "Accounts User"}]
        })
        if not frappe.db.exists("User", self.test_user.email):
            self.test_user.insert()
        
        # Create test invoice
        self.invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        }).insert()
    
    def test_user_can_read_own_invoices(self):
        """Test that user can read invoices they created"""
        with self.set_user(self.test_user.email):
            # User creates invoice
            invoice = frappe.get_doc({
                "doctype": "Sales Invoice",
                "company": "_Test Company",
                "customer": "_Test Customer",
                "items": [{
                    "item_code": "_Test Item",
                    "qty": 1,
                    "rate": 100
                }]
            }).insert()
            
            # User can read their own invoice
            doc = frappe.get_doc("Sales Invoice", invoice.name)
            self.assertTrue(doc.has_permission("read"))
    
    def test_user_cannot_read_other_invoices(self):
        """Test that user cannot read invoices created by others"""
        with self.set_user(self.test_user.email):
            # Try to access invoice created by Administrator
            with self.assertRaises(frappe.PermissionError):
                frappe.get_doc("Sales Invoice", self.invoice.name)
    
    def test_user_permission_restriction(self):
        """Test user permission restrictions"""
        # Add user permission for specific customer
        add_user_permission("Customer", "_Test Customer", self.test_user.email)
        
        with self.set_user(self.test_user.email):
            # User can only see invoices for permitted customer
            invoices = frappe.get_list("Sales Invoice", filters={"customer": "_Test Customer"})
            self.assertGreater(len(invoices), 0)
            
            # User cannot see invoices for other customers
            other_invoices = frappe.get_list("Sales Invoice", filters={"customer": ["!=", "_Test Customer"]})
            self.assertEqual(len(other_invoices), 0)
```

### Example 4: Complex Calculation Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestInvoiceCalculations(FrappeTestCase):
    def test_tax_calculation(self):
        """Test tax calculation on invoice"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [{
                "item_code": "_Test Item",
                "qty": 10,
                "rate": 100
            }],
            "taxes": [{
                "charge_type": "On Net Total",
                "rate": 10
            }]
        })
        invoice.insert()
        
        # Base amount: 10 * 100 = 1000
        # Tax (10%): 100
        # Total: 1100
        self.assertEqual(invoice.net_total, 1000)
        self.assertEqual(invoice.total_taxes_and_charges, 100)
        self.assertEqual(invoice.grand_total, 1100)
    
    def test_discount_calculation(self):
        """Test discount calculation"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [{
                "item_code": "_Test Item",
                "qty": 10,
                "rate": 100,
                "discount_percentage": 10
            }]
        })
        invoice.insert()
        
        # Base: 1000
        # Discount (10%): 100
        # Net: 900
        self.assertEqual(invoice.total, 900)
    
    def test_rounding_calculation(self):
        """Test rounding in calculations"""
        invoice = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [{
                "item_code": "_Test Item",
                "qty": 3,
                "rate": 33.33  # Will result in 99.99
            }]
        })
        invoice.insert()
        
        # Should handle rounding correctly
        self.assertAlmostEqual(invoice.total, 99.99, places=2)
```

### Example 5: Workflow Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestWorkflowStates(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create test document
        self.doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "value1",
            "workflow_state": "Draft"
        })
        self.doc.insert()
    
    def test_draft_to_submitted(self):
        """Test workflow transition from Draft to Submitted"""
        self.assertEqual(self.doc.workflow_state, "Draft")
        
        # Transition to Submitted
        self.doc.workflow_state = "Submitted"
        self.doc.save()
        
        self.assertEqual(self.doc.workflow_state, "Submitted")
    
    def test_invalid_transition(self):
        """Test that invalid workflow transitions are prevented"""
        self.doc.workflow_state = "Draft"
        self.doc.save()
        
        # Try invalid transition: Draft -> Cancelled (should go through Submitted first)
        self.doc.workflow_state = "Cancelled"
        with self.assertRaises(frappe.ValidationError):
            self.doc.save()
    
    def test_workflow_action_permissions(self):
        """Test that workflow actions respect permissions"""
        with self.set_user("test@example.com"):
            doc = frappe.get_doc("MyDocType", self.doc.name)
            
            # User may not have permission to transition
            if not doc.has_permission("write"):
                with self.assertRaises(frappe.PermissionError):
                    doc.workflow_state = "Submitted"
                    doc.save()
```

### Example 6: Child Table Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestChildTableOperations(FrappeTestCase):
    def test_add_child_rows(self):
        """Test adding child table rows"""
        doc = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": []
        })
        
        # Add items
        doc.append("items", {
            "item_code": "_Test Item",
            "qty": 1,
            "rate": 100
        })
        doc.append("items", {
            "item_code": "_Test Item",
            "qty": 2,
            "rate": 50
        })
        
        doc.insert()
        
        self.assertEqual(len(doc.items), 2)
        self.assertEqual(doc.total, 200)  # 1*100 + 2*50
    
    def test_remove_child_rows(self):
        """Test removing child table rows"""
        doc = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [
                {"item_code": "_Test Item", "qty": 1, "rate": 100},
                {"item_code": "_Test Item", "qty": 2, "rate": 50}
            ]
        })
        doc.insert()
        
        # Remove first item
        doc.remove(doc.items[0])
        doc.save()
        
        self.assertEqual(len(doc.items), 1)
        self.assertEqual(doc.total, 100)  # Only 2*50 remains
    
    def test_update_child_row(self):
        """Test updating child table row"""
        doc = frappe.get_doc({
            "doctype": "Sales Invoice",
            "company": "_Test Company",
            "customer": "_Test Customer",
            "items": [{
                "item_code": "_Test Item",
                "qty": 1,
                "rate": 100
            }]
        })
        doc.insert()
        
        # Update quantity
        doc.items[0].qty = 5
        doc.save()
        
        self.assertEqual(doc.items[0].qty, 5)
        self.assertEqual(doc.total, 500)
```

### Example 7: Date and Time Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate, getdate

class TestDateOperations(FrappeTestCase):
    def test_date_range_validation(self):
        """Test date range validation"""
        with self.freeze_time("2024-01-15"):
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "start_date": nowdate(),
                "end_date": add_days(nowdate(), 30)
            })
            doc.insert()
            
            # Valid range
            self.assertIsNotNone(doc.name)
            
            # Invalid range
            doc.end_date = add_days(nowdate(), -1)  # Before start
            with self.assertRaises(frappe.exceptions.InvalidDates):
                doc.validate_from_to_dates("start_date", "end_date")
    
    def test_date_calculations(self):
        """Test date-based calculations"""
        with self.freeze_time("2024-01-15"):
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "start_date": nowdate(),
                "end_date": add_days(nowdate(), 30)
            })
            doc.insert()
            
            # Calculate duration
            duration = (getdate(doc.end_date) - getdate(doc.start_date)).days
            self.assertEqual(duration, 30)
    
    def test_time_based_queries(self):
        """Test queries filtered by date"""
        with self.freeze_time("2024-01-15"):
            # Create document with today's date
            doc = frappe.get_doc({
                "doctype": "MyDocType",
                "date_field": nowdate()
            })
            doc.insert()
            
            # Query documents for today
            today_docs = frappe.get_all(
                "MyDocType",
                filters={"date_field": nowdate()}
            )
            self.assertGreaterEqual(len(today_docs), 1)
```

### Example 8: Error Handling Testing

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestErrorHandling(FrappeTestCase):
    def test_duplicate_entry_error(self):
        """Test duplicate entry prevention"""
        doc1 = frappe.get_doc({
            "doctype": "MyDocType",
            "unique_field": "unique_value"
        })
        doc1.insert()
        
        # Try to create duplicate
        doc2 = frappe.get_doc({
            "doctype": "MyDocType",
            "unique_field": "unique_value"
        })
        
        with self.assertRaises(frappe.DuplicateEntryError) as cm:
            doc2.insert()
        
        error_message = str(cm.exception)
        self.assertIn("unique", error_message.lower())
        self.assertIn("unique_field", error_message)
    
    def test_mandatory_error(self):
        """Test mandatory field error"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            # Missing mandatory field
        })
        
        with self.assertRaises(frappe.MandatoryError) as cm:
            doc.insert()
        
        error_message = str(cm.exception)
        self.assertIn("mandatory", error_message.lower())
    
    def test_validation_error_with_context(self):
        """Test validation error with context manager"""
        doc = frappe.get_doc({
            "doctype": "MyDocType",
            "field1": "invalid_value"
        })
        
        with self.assertRaises(frappe.ValidationError) as cm:
            doc.validate()
        
        # Check error message
        error_message = str(cm.exception)
        self.assertIsNotNone(error_message)
        
        # Check exception type
        self.assertIsInstance(cm.exception, frappe.ValidationError)
```

---

## Summary

This guide has covered comprehensive test patterns and best practices for Frappe unit testing:

### Key Takeaways

1. **Test Patterns**: Use established patterns for common scenarios (lifecycle, validation, permissions, workflows, etc.)

2. **Assertions**: Leverage both standard unittest assertions and Frappe-specific assertions like `assertDocumentEqual`

3. **Context Managers**: Use Frappe's context managers (`set_user`, `freeze_time`, etc.) for clean test setup

4. **Organization**: Structure tests logically with proper setup/teardown and helper methods

5. **Best Practices**: 
   - Write descriptive test names
   - Test one concept per test
   - Use meaningful test data
   - Test edge cases
   - Keep tests isolated

6. **Anti-Patterns**: Avoid testing implementation details, over-mocking, and non-deterministic tests

7. **Real-World Examples**: Follow examples from actual Frappe codebase for practical implementation

### Additional Resources

- [Frappe Testing Documentation](https://docs.frappe.io/framework/user/en/testing)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Frappe Source Code Tests](https://github.com/frappe/frappe/tree/develop/frappe/tests)

### Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
