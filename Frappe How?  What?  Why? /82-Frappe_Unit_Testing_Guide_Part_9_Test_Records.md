# Frappe Unit Testing: Complete Guide to test_records

## Table of Contents
1. [Glossary: Key Terms Explained](#glossary-key-terms-explained)
2. [What are test_records?](#what-are-test_records)
3. [Why Do We Need test_records?](#why-do-we-need-test_records)
4. [When to Use test_records](#when-to-use-test_records)
5. [How test_records Work](#how-test_records-work)
6. [Three Methods of Defining test_records](#three-methods-of-defining-test_records)
7. [Detailed Examples](#detailed-examples)
8. [Use Cases](#use-cases)
9. [Generic Steps for Creating and Using test_records](#generic-steps-for-creating-and-using-test_records)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Glossary: Key Terms Explained

Before diving into test_records, let's understand the key technical terms used throughout this guide:

### **DocType**
**What it is:** A DocType is Frappe's fundamental data structure - think of it as a database table definition. Every document in Frappe (like Customer, Sales Invoice, Item) is based on a DocType. DocTypes define:
- What fields a document has (like `customer_name`, `email`, `phone`)
- What type each field is (Text, Number, Date, Link, etc.)
- Validation rules
- Permissions
- Workflows

**Why it matters:** When you create test_records, you're creating test data for a specific DocType. For example, `test_records.json` for the "Customer" DocType will create test customer records.

**Example:** The "Customer" DocType defines that a customer has fields like `customer_name`, `customer_type`, `territory`, etc.

### **Link Field**
**What it is:** A Link field is a special field type in Frappe that creates a relationship between two DocTypes. It stores a reference to another document. For example, a Sales Invoice has a Link field called `customer` that references a Customer document.

**Why it matters:** Link fields create dependencies. If your test_records for Sales Invoice reference a Customer, Frappe must create that Customer first. This is why dependency resolution is important.

**Example:** 
- Sales Invoice has `customer` field (Link to Customer DocType)
- Sales Invoice has `company` field (Link to Company DocType)
- These are dependencies that must exist before creating a Sales Invoice

### **Child Table**
**What it is:** A child table is a field type that allows a document to have multiple related rows. Think of it like a sub-table within a main table. For example, a Sales Invoice has a child table called `items` that can contain multiple invoice line items.

**Why it matters:** When creating test_records, you need to include child table data as arrays. Frappe will automatically create these child records when creating the parent document.

**Example:**
```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",
  "items": [  // This is a child table
    {"item_code": "_Test Item", "qty": 10},
    {"item_code": "_Test Item 2", "qty": 5}
  ]
}
```

### **Naming Series**
**What it is:** A naming series is Frappe's way of automatically generating document names/IDs. Instead of manually entering "SINV-00001", "SINV-00002", etc., Frappe generates them automatically based on a pattern like "SINV-".

**Why it matters:** In test_records, if you don't specify a name, Frappe will use a default naming series `_T-{DocType}-` (like `_T-Sales Invoice-00001`). You can also specify a custom naming series or a fixed name.

**Example:**
- Default: `_T-Sales Invoice-00001`, `_T-Sales Invoice-00002`
- Custom: `TEST-SINV-00001` (if you specify `"naming_series": "TEST-SINV-"`)
- Fixed: `"_Test Sales Invoice-00001"` (if you specify `"name": "_Test Sales Invoice-00001"`)

### **DocStatus**
**What it is:** DocStatus (Document Status) indicates the state of a document in Frappe:
- `0` = Draft (unsaved/new document)
- `1` = Submitted (document is finalized and cannot be edited)
- `2` = Cancelled (document was cancelled)

**Why it matters:** In test_records, if you set `"docstatus": 1`, Frappe will automatically submit the document after creating it. This is useful for testing submitted documents without manually submitting them.

**Example:**
```json
{
  "doctype": "Sales Invoice",
  "docstatus": 1,  // Document will be submitted automatically
  "customer": "_Test Customer"
}
```

### **Database Rollback**
**What it is:** Database rollback is a mechanism that undoes all database changes made during a test. After each test completes (whether it passes or fails), Frappe automatically rolls back all changes, restoring the database to its previous state.

**Why it matters:** This ensures test isolation - each test starts with a clean database state. Changes made in one test don't affect other tests. This is why test_records are recreated for each test run.

**How it works:** Frappe wraps each test in a database transaction. When the test finishes, it rolls back the transaction, undoing all inserts, updates, and deletes.

### **Test Fixtures**
**What it is:** Test fixtures are pre-configured test data or setup code that provides a known baseline for tests. In Frappe, test_records are a type of test fixture - they provide consistent test data.

**Why it matters:** Fixtures ensure tests are repeatable and predictable. Every test run uses the same data, making it easier to debug failures and ensure consistency.

**Example:** Instead of creating a customer in every test, you create it once in test_records and reuse it.

### **Dependency Resolution**
**What it is:** Dependency resolution is the process of automatically determining what other DocTypes need to be created before creating your test records, and creating them in the correct order.

**Why it matters:** If your Sales Invoice test_records reference a Customer, that Customer must exist first. Frappe automatically:
1. Detects all Link fields (dependencies)
2. Creates dependencies first
3. Handles circular dependencies
4. Creates your records last

**Example:** Creating a Sales Invoice requires:
1. Company (created first)
2. Customer (depends on Company, created second)
3. Item (depends on Company, Item Group, created third)
4. Sales Invoice (created last)

### **JSON (JavaScript Object Notation)**
**What it is:** JSON is a lightweight data format used to store and exchange data. It's human-readable and easy to parse. test_records.json files use JSON format.

**Why it matters:** JSON is simple, doesn't require Python knowledge, and separates data from code. It's perfect for static test data.

**Example:**
```json
[
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer",
    "customer_type": "Company"
  }
]
```

### **frappe.local.test_objects**
**What it is:** `frappe.local.test_objects` is a Python dictionary (in-memory data structure) that Frappe uses to store the names of all test records that have been created during the current test run. It's scoped to the current request/test run.

**Why it matters:** This is how Frappe tracks which test records have been created. You can access it to get the names of created records, especially when using `_make_test_records()`.

**Structure:**
```python
frappe.local.test_objects = {
    "Company": ["_Test Company", "_Test Company 1"],  # List of created Company names
    "Customer": ["_Test Customer"],                   # List of created Customer names
    "Item": ["_Test Item", "_Test Item 2"]            # List of created Item names
}
```

### **.test_log File**
**What it is:** `.test_log` is a cache file located at `sites/[site-name]/.test_log` that stores a list of DocTypes for which test records have been created. It's a simple text file with one DocType name per line.

**Why it matters:** Frappe checks this file to avoid recreating test records unnecessarily. If a DocType is in this file, Frappe skips creating its test records (unless `force=True`). This improves test performance.

**Example content:**
```
Company
Customer
Item
Sales Invoice
```

### **Test Runner**
**What it is:** The test runner is Frappe's testing framework that discovers, loads, and executes unit tests. It handles test record creation, dependency resolution, database rollback, and test execution.

**Why it matters:** The test runner is what processes your test_records and creates the actual database records before running your tests.

**How to use:** Run tests using:
```bash
bench --site test_site run-tests --doctype YourDocType
```

### **Meta (DocType Meta)**
**What it is:** Meta is metadata about a DocType - information about the DocType itself, including all its fields, validations, permissions, etc. You can access it using `frappe.get_meta("DocTypeName")`.

**Why it matters:** Frappe uses meta to understand DocType structure, find Link fields (for dependency resolution), and validate test_records.

**Example:**
```python
meta = frappe.get_meta("Sales Invoice")
link_fields = meta.get_link_fields()  # Get all Link fields (dependencies)
required_fields = [f for f in meta.fields if f.reqd]  # Get required fields
```

### **Circular Dependency**
**What it is:** A circular dependency occurs when DocType A depends on DocType B, and DocType B depends on DocType A (directly or indirectly). This creates a loop that can cause infinite recursion.

**Why it matters:** Circular dependencies can cause test failures or infinite loops. Frappe handles this by using `test_ignore` to break the cycle.

**Example:**
- Company depends on Account (for default accounts)
- Account depends on Company (accounts belong to companies)
- This is circular! Use `test_ignore = ["Account"]` to break it.

### **Test Isolation**
**What it is:** Test isolation means each test runs independently without affecting other tests. Changes in one test don't impact another test.

**Why it matters:** Isolated tests are reliable, predictable, and can run in any order. Frappe achieves this through database rollback after each test.

**How Frappe ensures it:** After each test, Frappe rolls back all database changes, ensuring the next test starts with a clean state.

---

## What are test_records?

`test_records` are predefined test data structures used in Frappe unit tests to create consistent, reusable test fixtures. They represent document data that will be automatically inserted into the database before your tests run.

**In Simple Terms:** Think of test_records as a blueprint or template for creating test data. Instead of writing code in every test to create a customer, item, or company, you define them once in test_records, and Frappe automatically creates them before your tests run.

### Key Characteristics

- **Test Data Definitions**: They define the structure and values of documents to be created for testing. Essentially, they're like a recipe that tells Frappe "create these documents with these values."

- **Automatic Creation**: Frappe's test runner automatically creates these records before tests execute. You don't need to manually call `insert()` for each test record - Frappe does it for you automatically when tests start.

- **Dependency Resolution**: Frappe automatically resolves and creates dependencies (linked DocTypes). If your Sales Invoice test_records reference a Customer, Frappe will automatically create that Customer first, even if you didn't explicitly ask for it.

- **Caching**: Created records are cached to avoid recreation on subsequent test runs. Frappe stores which DocTypes have been created in the `.test_log` file, so it doesn't recreate them unless you use `force=True`. This makes tests run faster.

- **Isolation**: Each test run gets fresh data, ensuring test isolation. Even though records are cached, database rollback ensures each test starts with a clean state. Changes in one test don't affect another.

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

**What are dependencies?** Dependencies are other DocTypes that your DocType references through Link fields. For example, a Sales Invoice depends on Company, Customer, and Item because it has Link fields pointing to these DocTypes.

**Why this matters:** Without automatic dependency management, you'd have to manually create Company, Customer, Item, Item Group, Warehouse, and many other DocTypes before creating a Sales Invoice. This is tedious and error-prone.

**How it works:** Frappe scans your DocType's meta (field definitions) to find all Link fields. It then creates test records for all linked DocTypes first, recursively handling their dependencies too.

**Example:**
If your `Sales Invoice` test_records reference:
- `Company` (_Test Company) - Link field
- `Customer` (_Test Customer) - Link field  
- `Item` (_Test Item) - Link field in child table

Frappe will automatically:
1. Create `_Test Company` first (no dependencies)
2. Create `_Test Customer` (which depends on Company - already created)
3. Create `_Test Item` (which depends on Company, Item Group, Warehouse - all created recursively)
4. Finally create your `Sales Invoice` records (all dependencies ready)

**Without test_records:** You'd write code like this in every test:
```python
# Manual dependency creation - tedious!
company = frappe.get_doc({"doctype": "Company", "company_name": "_Test Company", ...})
company.insert()
customer = frappe.get_doc({"doctype": "Customer", "customer_name": "_Test Customer", "company": company.name, ...})
customer.insert()
# ... many more dependencies
```

**With test_records:** Frappe handles all of this automatically!

### 3. **Performance Optimization**

Test records are created once and cached. Subsequent test runs reuse existing records (unless `force=True`), significantly improving test performance.

**How caching works:** When Frappe creates test records, it:
1. Stores the DocType name in `.test_log` file
2. Stores record names in `frappe.local.test_objects` dictionary
3. On subsequent test runs, checks `.test_log` to see if records already exist
4. Skips creation if records exist (unless `force=True`)

**Why this matters:** Creating test records involves:
- Database INSERT operations
- Running validations
- Creating child table records
- Handling dependencies

If you have 100 tests and each needs a Company, Customer, and Item, without caching you'd create 300 records. With caching, you create them once and reuse them.

**Performance impact:** 
- Without caching: Creating 10 test records × 100 tests = 1000 database operations
- With caching: Creating 10 test records once = 10 database operations

**Note:** Database rollback still happens after each test, but the records are recreated quickly from the cache rather than from scratch.

### 4. **Code Reusability**

Test records can be shared across multiple test methods and even across different test files, reducing code duplication.

### 5. **Maintainability**

Centralized test data makes it easier to update test data when DocType schemas change. You update the test_records once, and all tests benefit.

### 6. **Test Isolation**

Each test run starts with a clean slate. Database rollback after each test ensures no test affects another.

**What is test isolation?** Test isolation means each test is independent - it doesn't depend on other tests and doesn't affect other tests. This is crucial for reliable testing.

**How Frappe ensures isolation:**
1. **Database Transactions**: Each test runs inside a database transaction
2. **Automatic Rollback**: After each test (pass or fail), Frappe rolls back all database changes
3. **Fresh State**: The next test starts with the database in the same state as before the previous test

**Why this matters:**
- Tests can run in any order
- One test's failures don't affect other tests
- Tests are predictable and repeatable
- You can run individual tests without running the entire suite

**Example:**
```python
def test_one(self):
    # Creates a document
    doc = frappe.get_doc({"doctype": "Customer", "customer_name": "Test"})
    doc.insert()
    # Test ends, database rolls back

def test_two(self):
    # This test starts with a clean database
    # The document from test_one doesn't exist here
    # Even though test_records are cached, database rollback ensures isolation
```

**Important:** Even though test_records are cached, database rollback ensures that modifications made during tests don't persist. The cached records are recreated from test_records definitions, not from modified database state.

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

**What it is:** `frappe.local.test_objects` is a Python dictionary (a key-value data structure) that stores the names of all test records created during the current test run. It's part of Frappe's local context, meaning it's specific to the current request/test run.

**Structure:** It's a dictionary where:
- **Keys** are DocType names (strings like "Company", "Customer")
- **Values** are lists of document names (strings like ["_Test Company", "_Test Company 1"])

**Example:**
```python
frappe.local.test_objects = {
    "Company": ["_Test Company", "_Test Company 1"],  # Two Company records created
    "Customer": ["_Test Customer"],                    # One Customer record created
    "Item": ["_Test Item", "_Test Item 2"]            # Two Item records created
}
```

**Why it exists:** This dictionary allows Frappe to:
1. Track which records have been created
2. Avoid duplicate creation
3. Provide access to created record names in tests
4. Support the `_make_test_records()` function which returns these names

**How to use it:** You can access it in your tests:
```python
# Get all created Company test record names
company_names = frappe.local.test_objects.get("Company", [])
# Returns: ["_Test Company", "_Test Company 1"]

# Get a specific record
if "Company" in frappe.local.test_objects:
    first_company = frappe.local.test_objects["Company"][0]
    doc = frappe.get_doc("Company", first_company)
```

**Scope:** This dictionary is cleared after each test run, ensuring test isolation.

#### 2. **.test_log File**

**What it is:** `.test_log` is a simple text file that acts as a cache to track which DocTypes have had their test records created. It's located at `sites/[site-name]/.test_log` in your Frappe installation.

**Structure:** It's a plain text file with one DocType name per line:
```
Company
Customer
Item
Sales Invoice
```

**Why it exists:** This file prevents Frappe from unnecessarily recreating test records. When Frappe starts creating test records, it checks this file first. If a DocType is listed, Frappe assumes its test records already exist and skips creation (unless `force=True`).

**How it works:**
1. First test run: Frappe creates test records and writes DocType names to `.test_log`
2. Subsequent runs: Frappe reads `.test_log`, sees DocTypes are listed, and skips creation
3. With `force=True`: Frappe ignores `.test_log` and recreates everything

**Example workflow:**
```bash
# First run
bench --site test_site run-tests --doctype Sales Invoice
# Creates Company, Customer, Item, Sales Invoice test records
# Writes to .test_log: Company\nCustomer\nItem\nSales Invoice

# Second run (same command)
# Reads .test_log, sees records exist, skips creation
# Tests run faster!

# Force recreation
bench --site test_site run-tests --doctype Sales Invoice --force
# Ignores .test_log, recreates all records
```

**When to clear it:** If you modify test_records.json and want to recreate records:
```bash
rm sites/test_site/.test_log
# Or use --force flag
```

**Note:** This file is site-specific. Each site has its own `.test_log` file.

#### 3. **Dependency Resolution**

**What it is:** Dependency resolution is the process of automatically determining what other DocTypes need to be created before your test records, and creating them in the correct order.

**How Frappe resolves dependencies:**

1. **Scanning Link fields in DocType meta:**
   - Frappe reads the DocType's metadata (field definitions)
   - Finds all fields with `fieldtype = "Link"`
   - These Link fields point to other DocTypes that must exist first
   - Example: Sales Invoice has `customer` field (Link to Customer) → Customer is a dependency

2. **Scanning Link fields in child table DocTypes:**
   - Child tables can also have Link fields
   - Frappe recursively checks child table DocTypes for Link fields
   - Example: Sales Invoice Items child table has `item_code` (Link to Item) → Item is a dependency

3. **Checking `test_dependencies` list:**
   - You can explicitly declare dependencies in your test file
   - Example: `test_dependencies = ["Company", "Customer"]`
   - These are added to the automatic dependency list

4. **Excluding items in `test_ignore` list:**
   - Sometimes you want to break circular dependencies
   - Example: `test_ignore = ["Account"]` tells Frappe to ignore Account dependencies
   - This prevents infinite loops

**Dependency creation order:**
Frappe creates dependencies in a topological order (dependencies before dependents):
1. DocTypes with no dependencies first
2. Then DocTypes that depend only on already-created DocTypes
3. Finally, your actual test records

**Example resolution flow:**
```
Sales Invoice test_records need:
├── Company (no dependencies) → Create first
├── Customer (depends on Company) → Create second
├── Item (depends on Company, Item Group, Warehouse)
│   ├── Item Group (no dependencies) → Create first
│   └── Warehouse (depends on Company) → Create after Company
└── Sales Invoice → Create last
```

**Why this is powerful:** You don't need to manually figure out or create dependencies. Frappe handles the complexity automatically!

#### 4. **Naming Series Handling**

**What is a naming series?** A naming series is a pattern Frappe uses to automatically generate document names/IDs. Instead of manually entering "SINV-00001", "SINV-00002", Frappe generates them based on a pattern.

**How Frappe handles naming series in test_records:**

1. **Default series `_T-{DocType}-` is used if not specified:**
   - If your test_records don't specify a `name` or `naming_series`, Frappe uses a default pattern
   - Format: `_T-{DocType Name}-` followed by a number
   - Example: `_T-Sales Invoice-00001`, `_T-Sales Invoice-00002`
   - The `_T-` prefix indicates it's a test record

2. **Series is reverted if document creation fails:**
   - When Frappe creates a document, it increments the naming series counter
   - If creation fails (validation error, etc.), Frappe reverts the counter
   - This prevents "gaps" in naming series from failed test record creation
   - Example: If `_T-Sales Invoice-00001` creation fails, the next attempt still uses `_T-Sales Invoice-00001`, not `00002`

3. **Fixed names can be specified in test_records:**
   - You can specify exact names using the `"name"` field
   - Example: `"name": "_Test Sales Invoice-00001"`
   - This is useful when tests reference records by name
   - Fixed names don't use naming series

**Example scenarios:**

**Scenario 1: No name specified (uses default series)**
```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer"
  // No "name" field → Uses _T-Sales Invoice-00001
}
```

**Scenario 2: Custom naming series**
```json
{
  "doctype": "Sales Invoice",
  "naming_series": "TEST-SINV-",
  "customer": "_Test Customer"
  // Uses TEST-SINV-00001, TEST-SINV-00002, etc.
}
```

**Scenario 3: Fixed name**
```json
{
  "doctype": "Sales Invoice",
  "name": "_Test Sales Invoice-00001",
  "customer": "_Test Customer"
  // Always uses this exact name
}
```

**Why naming series matter:** Consistent naming makes it easier to:
- Reference records in tests
- Debug test failures
- Identify test data in the database
- Avoid naming conflicts with production data

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

**What is JSON?** JSON (JavaScript Object Notation) is a lightweight, human-readable data format. It uses:
- `{}` for objects (key-value pairs)
- `[]` for arrays (lists)
- Strings in double quotes
- Numbers, booleans, null as values

**Why JSON?** JSON is perfect for test data because:
- It's simple and readable
- No Python knowledge required
- Separates data from code
- Easy to edit and maintain
- Version control friendly

**JSON Structure for test_records:**
- The file must be a JSON array `[]`
- Each element `{}` represents one test record
- Each record is a dictionary with field names as keys and values as... values
- Child tables are arrays of objects

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

Frappe uses the `get_test_records()` function to load JSON files. Here's what happens:

```python
# In frappe/__init__.py
def get_test_records(doctype):
    """Returns list of objects from `test_records.json`"""
    # Step 1: Build the file path
    # Example: apps/erpnext/erpnext/setup/doctype/company/test_records.json
    path = os.path.join(
        get_module_path(get_doctype_module(doctype)),  # Get app/module path
        "doctype",                                      # DocType directory
        scrub(doctype),                                # Clean DocType name (lowercase, replace spaces)
        "test_records.json"                            # The JSON file
    )
    
    # Step 2: Check if file exists
    if os.path.exists(path):
        # Step 3: Read and parse JSON
        with open(path) as f:
            return json.loads(f.read())  # Convert JSON string to Python list/dict
    else:
        return []  # Return empty list if file doesn't exist
```

**What `scrub()` does:** Converts DocType names to file-safe format:
- "Sales Invoice" → "sales_invoice"
- "My Custom DocType" → "my_custom_doctype"
- Handles special characters and spaces

**Return value:** This function returns a Python list of dictionaries, where each dictionary represents one test record. The dictionaries can be used directly with `frappe.get_doc()` or `frappe.copy_doc()`.

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

**What is a Python variable?** A variable is a named storage location in your Python code. In this case, `test_records` is a variable that stores a list of dictionaries.

**What is a list?** A list is a Python data structure that holds multiple items in order. Example: `[item1, item2, item3]`

**What is a dictionary?** A dictionary is a Python data structure that stores key-value pairs. Example: `{"key": "value", "field1": "value1"}`

**Why use Python variables instead of JSON?** Sometimes you need:
- Dynamic data generation (dates, random values)
- Python logic (loops, conditionals)
- Combining data from multiple sources
- Calculations or transformations

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

**What is a function?** A function is a reusable block of code that performs a specific task. In Python, functions are defined with `def function_name():`

**What does `_make_test_records()` do?** This is a special function that Frappe looks for. If it exists in your test file, Frappe calls it to create test records programmatically. The function should return a list of document names (strings) that were created.

**Why use a function?** Functions allow you to:
- Generate dynamic test data
- Use loops to create multiple variations
- Apply conditional logic
- Create complex relationships programmatically
- Handle edge cases

**Function signature:** The function must accept `verbose` parameter (even if unused) and return a list of document names.

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

Frappe checks methods in this order (first match wins - stops checking once it finds one):

1. **`_make_test_records()` function** (Highest priority)
   - Frappe checks if your test module has this function
   - If found, calls it and uses the returned record names
   - Most flexible but most complex

2. **`test_records` variable** (Medium priority)
   - Frappe checks if your test module has a variable named `test_records`
   - If found, uses it to create records
   - Good balance of flexibility and simplicity

3. **`test_records.json` file** (Lowest priority, but most common)
   - Frappe looks for `test_records.json` in the DocType directory
   - If found, loads and uses it
   - Simplest and most maintainable

**Why this order?** Functions are checked first because they're the most flexible. If you have a function, you probably want to use it. JSON files are checked last as a fallback because they're the simplest option.

**Important:** Only one method is used. If you have both `_make_test_records()` and `test_records.json`, only the function will be used. The JSON file will be ignored.

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

**Key Points Explained:**

- **`"name"` field specifies fixed name:**
  - Normally, Frappe generates names automatically using naming series
  - By specifying `"name"`, you override this and use an exact name
  - Useful when tests reference records by name
  - Example: `"name": "_Test Sales Invoice-00001"` always creates a document with this exact name

- **`"docstatus": 1` means document will be submitted after creation:**
  - `docstatus` is a special field that indicates document state
  - `0` = Draft (can be edited)
  - `1` = Submitted (finalized, cannot be edited)
  - `2` = Cancelled
  - When you set `"docstatus": 1` in test_records, Frappe will:
    1. Create the document as draft (`docstatus = 0`)
    2. Insert it into the database
    3. Automatically submit it (`docstatus = 1`)
  - This is useful for testing submitted documents without manually submitting them

- **Frappe automatically handles submission:**
  - You don't need to call `doc.submit()` manually
  - Frappe's test runner detects `docstatus: 1` and handles submission automatically
  - If submission fails, the test will fail (which is what you want)

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

# What is test_ignore?
# test_ignore is a list of DocType names that Frappe should NOT automatically create
# even if they're detected as dependencies. This is used to break circular dependencies.
#
# Example circular dependency:
# - Company needs Account (for default accounts)
# - Account needs Company (accounts belong to companies)
# - This creates a loop!
#
# Solution: test_ignore = ["Account"] tells Frappe:
# "Don't automatically create Account test records, I'll handle it manually"

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
   - **Check DocType meta for mandatory fields:**
     - DocType meta contains all field definitions
     - Required fields (`reqd = 1`) must have values
     - Use `frappe.get_meta("DocTypeName")` to access meta
     - Example: `meta = frappe.get_meta("Sales Invoice")`
   
   - **Identify Link fields (dependencies):**
     - Link fields create relationships to other DocTypes
     - These are your dependencies
     - Use `meta.get_link_fields()` to find them
     - Example: Sales Invoice has `customer` (Link to Customer) → Customer is a dependency
   
   - **Note child tables:**
     - Child tables are fields with `fieldtype = "Table"`
     - They can also have Link fields (creating more dependencies)
     - Example: Sales Invoice Items child table has `item_code` (Link to Item) → Item is a dependency

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
   
   **What does this do?** This command:
   - Reads your JSON file
   - Parses it to check for syntax errors
   - Pretty-prints it (formats it nicely)
   - If there are errors, it shows them
   - If valid, it displays the formatted JSON
   
   **Why validate?** JSON syntax errors will cause test_records to fail loading. Common errors:
   - Missing commas between objects
   - Unclosed brackets `]` or braces `}`
   - Trailing commas (not allowed in JSON)
   - Unquoted strings
   
   **Alternative:** Use a JSON validator online or your code editor's JSON validation

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

This method works when you know the exact document name. Frappe looks up the document by its name/ID.

```python
doc = frappe.get_doc("YourDocType", "_Test Record Name")
# Parameters:
# - "YourDocType": The DocType name (string)
# - "_Test Record Name": The document name/ID (string)
# Returns: Document object (or raises error if not found)
```

**When to use:** When test_records specify fixed names using `"name"` field, or when you know the exact name.

**Method 2: From test_records Variable**

This method loads test_records and creates a document from the first record. Use `frappe.get_doc()` with a dictionary to create a document object (but doesn't insert it yet).

```python
test_records = frappe.get_test_records("YourDocType")
# Returns: List of dictionaries, e.g., [{"doctype": "...", "field1": "value1"}, ...]

doc = frappe.get_doc(test_records[0])
# test_records[0] is the first dictionary in the list
# frappe.get_doc() creates a document object from the dictionary
# Note: This doesn't insert it into database yet!

doc.insert()  # If not already created
# insert() actually saves the document to the database
# Use this only if the record wasn't created automatically by test_records
```

**When to use:** When you want to modify test_records before creating, or when records weren't auto-created.

**Method 3: From frappe.local.test_objects**

This method accesses the dictionary where Frappe stores created test record names. Useful with `_make_test_records()`.

```python
# After _make_test_records()
test_names = frappe.local.test_objects.get("YourDocType", [])
# .get() safely retrieves the list, returns [] if key doesn't exist
# Returns: List of document names, e.g., ["_Test Record 1", "_Test Record 2"]

doc = frappe.get_doc("YourDocType", test_names[0])
# Gets the first created record by name
```

**When to use:** When using `_make_test_records()` function, which returns names but doesn't store them in a variable.

**Method 4: Copy and Modify**

This method copies a test record and modifies it before creating. Useful for creating variations of test data.

```python
test_records = frappe.get_test_records("YourDocType")
doc = frappe.copy_doc(test_records[0])
# copy_doc() creates a new document object with same data
# The new document has a different name (not inserted yet)

doc.field1 = "modified_value"
# Modify fields as needed

doc.insert()
# Insert the modified copy as a new document
```

**When to use:** When you need a variation of test_records data, or when you want to test with slightly different values.

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

## Complete Guide: Using test_records.json for Unit Testing

This section provides everything you need to know to use `test_records.json` for all your future unit testing. This is a complete, self-contained guide focused specifically on the JSON method.

### Quick Start Checklist

When creating test_records.json for a new DocType, follow these steps:

1. ✅ Create `test_records.json` file in the correct location
2. ✅ Write valid JSON with proper structure
3. ✅ Include all required fields
4. ✅ Handle child tables correctly
5. ✅ Declare dependencies in test file
6. ✅ Use proper naming conventions
7. ✅ Validate JSON syntax
8. ✅ Test that records are created

---

### 1. File Location and Structure

#### Where to Create test_records.json

**Location:** Must be in the DocType directory, alongside the DocType files.

```
your_app/
└── your_app/
    └── module/
        └── doctype/
            └── doctype_name/
                ├── doctype_name.json          # DocType definition
                ├── doctype_name.py            # DocType Python code
                ├── test_doctype_name.py        # Your test file
                └── test_records.json          ← CREATE THIS FILE HERE
```

**Example:**
```
apps/my_app/my_app/custom/doctype/my_custom_doctype/
├── my_custom_doctype.json
├── my_custom_doctype.py
├── test_my_custom_doctype.py
└── test_records.json  ← Create here
```

#### File Naming

- **Must be named exactly:** `test_records.json`
- **Case-sensitive:** Use lowercase
- **No spaces:** Use underscore if needed in directory name, but file is always `test_records.json`

---

### 2. JSON File Structure

#### Basic Structure

`test_records.json` must be a JSON array `[]` containing one or more objects `{}`. Each object represents one test record.

```json
[
  {
    "doctype": "YourDocType",
    "field1": "value1",
    "field2": "value2"
  },
  {
    "doctype": "YourDocType",
    "field1": "value3",
    "field2": "value4"
  }
]
```

**Key Rules:**
- Must start with `[` and end with `]`
- Each record is an object `{}`
- Records are separated by commas `,`
- Last record should NOT have a trailing comma
- All strings must be in double quotes `"`

#### Required Fields

**Always include:**
1. **`"doctype"`** - The DocType name (required)
2. **All mandatory fields** - Fields marked as `reqd = 1` in DocType definition
3. **Link field values** - If Link fields are required, provide valid document names

**How to find required fields:**
```python
# In Frappe console or test file
meta = frappe.get_meta("YourDocType")
required_fields = [f.fieldname for f in meta.fields if f.reqd]
print(required_fields)
```

#### Example: Complete test_records.json

```json
[
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer",
    "customer_type": "Company",
    "territory": "_Test Territory"
  },
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer 2",
    "customer_type": "Individual",
    "territory": "_Test Territory"
  }
]
```

---

### 3. Handling Different Field Types

#### Text Fields
```json
{
  "doctype": "Customer",
  "customer_name": "_Test Customer",
  "email": "test@example.com"
}
```

#### Number Fields
```json
{
  "doctype": "Item",
  "item_code": "_Test Item",
  "standard_rate": 100.50,
  "stock_qty": 10
}
```
**Note:** Numbers don't need quotes in JSON.

#### Date Fields
```json
{
  "doctype": "Sales Invoice",
  "posting_date": "2024-01-15",
  "due_date": "2024-02-15"
}
```
**Format:** `YYYY-MM-DD` (ISO date format)

#### Link Fields (Dependencies)
```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",  // Link to Customer DocType
  "company": "_Test Company"      // Link to Company DocType
}
```
**Important:** The linked documents must exist. Use `test_dependencies` to ensure they're created first.

#### Select Fields (Dropdown)
```json
{
  "doctype": "Customer",
  "customer_type": "Company",  // Must be one of the options defined in DocType
  "gender": "Male"              // If gender is a Select field
}
```

#### Checkbox Fields
```json
{
  "doctype": "Item",
  "is_stock_item": 1,  // 1 = checked, 0 = unchecked
  "has_batch_no": 0
}
```

#### Child Tables

Child tables are arrays of objects. Each object represents one row in the child table.

```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",
  "items": [  // This is a child table
    {
      "item_code": "_Test Item",
      "qty": 10,
      "rate": 100
    },
    {
      "item_code": "_Test Item 2",
      "qty": 5,
      "rate": 50
    }
  ]
}
```

**Key Points:**
- Child table field name matches the field name in DocType
- Value is always an array `[]`
- Each child row is an object `{}`
- Child tables can have their own Link fields (creating nested dependencies)

#### Nested Child Tables

Some DocTypes have child tables within child tables:

```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",
  "items": [
    {
      "item_code": "_Test Item",
      "qty": 10,
      "rate": 100,
      "taxes": [  // Nested child table
        {
          "account_head": "_Test Tax Account",
          "rate": 10
        }
      ]
    }
  ]
}
```

---

### 4. Naming Conventions

#### Document Names

**Option 1: Let Frappe generate (Recommended)**
```json
{
  "doctype": "Customer",
  "customer_name": "_Test Customer"
  // No "name" field → Frappe generates: _T-Customer-00001
}
```

**Option 2: Use fixed name**
```json
{
  "doctype": "Customer",
  "name": "_Test Customer",  // Fixed name
  "customer_name": "_Test Customer"
}
```

**Option 3: Custom naming series**
```json
{
  "doctype": "Sales Invoice",
  "naming_series": "TEST-SINV-",  // Custom series
  "customer": "_Test Customer"
  // Generates: TEST-SINV-00001, TEST-SINV-00002, etc.
}
```

#### Naming Best Practices

✅ **Good:**
- Use `_Test` prefix: `_Test Customer`, `_Test Item`
- Be descriptive: `_Test Customer - Retail`, `_Test Item - Standard`
- Use consistent patterns: `_Test Company 1`, `_Test Company 2`

❌ **Bad:**
- Generic: `Test1`, `Test2`
- Production-like: `Acme Corporation`, `John Doe`
- Inconsistent: `Test Customer`, `_test_item`, `TEST_COMPANY`

---

### 5. Document Status (docstatus)

#### Draft Documents (Default)
```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer"
  // No docstatus → Created as draft (docstatus = 0)
}
```

#### Submitted Documents
```json
{
  "doctype": "Sales Invoice",
  "customer": "_Test Customer",
  "docstatus": 1  // Document will be submitted automatically
}
```

**When to use docstatus: 1:**
- Testing submitted document workflows
- Testing cancellation flows
- Testing reports that only show submitted documents
- Testing document state validations

**Important:** Submitted documents cannot be edited. If you need to modify them in tests, create them as draft (`docstatus: 0` or omit the field).

---

### 6. Handling Dependencies

#### What are Dependencies?

Dependencies are other DocTypes that your DocType references through Link fields. For example:
- Sales Invoice depends on: Company, Customer, Item, Price List, Cost Center
- Item depends on: Company, Item Group, Warehouse, UOM

#### Declaring Dependencies in Test File

In your `test_doctype_name.py` file, declare dependencies:

```python
import frappe
from frappe.tests.utils import FrappeTestCase

# Declare dependencies - these will be created BEFORE your test records
test_dependencies = [
    "Company",
    "Customer",
    "Item",
    "Price List"
]

class TestYourDocType(FrappeTestCase):
    def test_something(self):
        # All dependencies are already created
        # Your test_records are also already created
        doc = frappe.get_doc("YourDocType", "_Test Record")
        # Test logic...
```

#### How Dependency Resolution Works

1. Frappe reads `test_dependencies` list
2. For each dependency, checks if test_records exist
3. Creates dependency test_records first (recursively)
4. Then creates your DocType test_records
5. All records are ready when your tests run

**Example Flow:**
```
test_dependencies = ["Company", "Customer", "Item"]

1. Create Company test_records (no dependencies)
2. Create Customer test_records (depends on Company - already exists)
3. Create Item test_records (depends on Company, Item Group - all exist)
4. Create YourDocType test_records (all dependencies ready)
5. Run your tests
```

#### Breaking Circular Dependencies

Sometimes dependencies create loops:
- Company needs Account (for default accounts)
- Account needs Company (accounts belong to companies)

**Solution:** Use `test_ignore` to break the cycle:

```python
test_dependencies = ["Company"]
test_ignore = ["Account"]  # Don't auto-create Account

class TestYourDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create Account manually if needed
        if not frappe.db.exists("Account", "_Test Account"):
            # Create account manually
            pass
```

---

### 7. Complete Example: End-to-End

#### Step 1: Create test_records.json

**File:** `apps/my_app/my_app/custom/doctype/sales_order/test_records.json`

```json
[
  {
    "doctype": "Sales Order",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "transaction_date": "2024-01-15",
    "delivery_date": "2024-01-30",
    "items": [
      {
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
      },
      {
        "item_code": "_Test Item 2",
        "qty": 5,
        "rate": 50
      }
    ],
    "docstatus": 0
  },
  {
    "doctype": "Sales Order",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "transaction_date": "2024-01-16",
    "delivery_date": "2024-01-31",
    "items": [
      {
        "item_code": "_Test Item",
        "qty": 20,
        "rate": 100
      }
    ],
    "docstatus": 1
  }
]
```

#### Step 2: Create Test File

**File:** `apps/my_app/my_app/custom/doctype/sales_order/test_sales_order.py`

```python
import frappe
from frappe.tests.utils import FrappeTestCase

# Declare dependencies
test_dependencies = [
    "Company",
    "Customer",
    "Item",
    "Price List"
]

# Optional: Load test_records for direct access
test_records = frappe.get_test_records("Sales Order")

class TestSalesOrder(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Test records are automatically created before setUp runs
        # All dependencies are also created
    
    def test_sales_order_creation(self):
        # Access test record by name (if you know it)
        # Or use test_records variable
        so = frappe.get_doc(test_records[0])
        self.assertEqual(so.customer, "_Test Customer")
        self.assertEqual(len(so.items), 2)
    
    def test_submitted_sales_order(self):
        # Access the second record (submitted)
        so = frappe.get_doc(test_records[1])
        self.assertEqual(so.docstatus, 1)
        self.assertTrue(so.is_submitted())
    
    def test_multiple_records(self):
        # Verify all test records were created
        self.assertEqual(len(test_records), 2)
        
        for record in test_records:
            so = frappe.get_doc("Sales Order", record.get("name") or frappe.db.get_value("Sales Order", {"customer": record["customer"], "transaction_date": record["transaction_date"]}))
            self.assertTrue(so.name)
```

#### Step 3: Validate JSON

```bash
# Check JSON syntax
python -m json.tool apps/my_app/my_app/custom/doctype/sales_order/test_records.json

# Should output formatted JSON (no errors)
```

#### Step 4: Run Tests

```bash
# Run tests
bench --site test_site run-tests --doctype "Sales Order"

# With verbose output (to see test record creation)
bench --site test_site run-tests --doctype "Sales Order" --verbose

# Force recreation (if you modified test_records.json)
bench --site test_site run-tests --doctype "Sales Order" --force
```

---

### 8. Common Patterns and Examples

#### Pattern 1: Simple DocType (No Dependencies)

```json
[
  {
    "doctype": "Department",
    "department_name": "_Test Department",
    "company": "_Test Company"
  }
]
```

**Test file:**
```python
test_dependencies = ["Company"]
```

#### Pattern 2: DocType with Child Table

```json
[
  {
    "doctype": "Item",
    "item_code": "_Test Item",
    "item_name": "_Test Item",
    "item_group": "_Test Item Group",
    "is_stock_item": 1,
    "item_defaults": [
      {
        "company": "_Test Company",
        "default_warehouse": "_Test Warehouse - _TC"
      }
    ]
  }
]
```

**Test file:**
```python
test_dependencies = ["Company", "Item Group", "Warehouse"]
```

#### Pattern 3: Multiple Test Records

```json
[
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer - Retail",
    "customer_type": "Company"
  },
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer - Wholesale",
    "customer_type": "Company"
  },
  {
    "doctype": "Customer",
    "customer_name": "_Test Customer - Individual",
    "customer_type": "Individual"
  }
]
```

#### Pattern 4: Submitted Documents

```json
[
  {
    "doctype": "Sales Invoice",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "posting_date": "2024-01-15",
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

#### Pattern 5: Fixed Names

```json
[
  {
    "doctype": "Sales Invoice",
    "name": "_Test Sales Invoice-00001",
    "customer": "_Test Customer",
    "company": "_Test Company",
    "items": [
      {
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 100
      }
    ]
  }
]
```

**Use when:** Tests reference documents by exact name.

---

### 9. Best Practices for test_records.json

#### ✅ DO:

1. **Include only necessary fields**
   - Only fields used in tests
   - All required fields
   - Link fields that are dependencies

2. **Use descriptive names**
   - `_Test Customer - Retail` instead of `_Test Customer 1`
   - `_Test Item - Standard` instead of `_Test Item`

3. **Group related records**
   - Put all records for one DocType in one file
   - Use consistent naming patterns

4. **Validate JSON before committing**
   ```bash
   python -m json.tool test_records.json
   ```

5. **Document complex structures**
   ```json
   [
     {
       "doctype": "ComplexDocType",
       // This record tests scenario X
       "field1": "value1",
       "field2": "value2"
     }
   ]
   ```

6. **Use realistic test data**
   - Dates that make sense
   - Numbers in reasonable ranges
   - Valid email formats, etc.

7. **Version control test_records.json**
   - Commit to git
   - Keep stable
   - Document changes

#### ❌ DON'T:

1. **Don't include unused fields**
   ```json
   // Bad: Including 50+ fields when only 5 are needed
   {
     "doctype": "Item",
     "item_code": "_Test Item",
     // ... 50 more fields not used in tests
   }
   ```

2. **Don't use production-like data**
   ```json
   // Bad
   {
     "customer_name": "Acme Corporation",
     "email": "john.doe@acme.com"
   }
   
   // Good
   {
     "customer_name": "_Test Customer",
     "email": "test@example.com"
   }
   ```

3. **Don't hard-code IDs**
   ```json
   // Bad: Assuming document exists
   {
     "customer": "CUST-00001"
   }
   
   // Good: Use test record names
   {
     "customer": "_Test Customer"
   }
   ```

4. **Don't forget trailing commas**
   ```json
   // Bad: Trailing comma (not allowed in JSON)
   {
     "field1": "value1",
     "field2": "value2",  // ← Error!
   }
   
   // Good: No trailing comma
   {
     "field1": "value1",
     "field2": "value2"
   }
   ```

5. **Don't mix quotes**
   ```json
   // Bad: Single quotes (not valid JSON)
   {
     'doctype': 'Customer',
     'customer_name': '_Test Customer'
   }
   
   // Good: Double quotes
   {
     "doctype": "Customer",
     "customer_name": "_Test Customer"
   }
   ```

---

### 10. Troubleshooting Common Issues

#### Issue 1: JSON Syntax Error

**Symptoms:**
- Tests fail to load
- Error: "Expecting property name" or similar

**Solution:**
```bash
# Validate JSON
python -m json.tool test_records.json

# Common errors:
# - Missing comma between objects
# - Trailing comma after last object
# - Unclosed brackets or braces
# - Single quotes instead of double quotes
```

#### Issue 2: Missing Required Fields

**Symptoms:**
- Validation error: "Field is mandatory"
- Test records not created

**Solution:**
```python
# Find required fields
meta = frappe.get_meta("YourDocType")
required = [f.fieldname for f in meta.fields if f.reqd]
print(required)

# Add missing fields to test_records.json
```

#### Issue 3: Dependencies Not Created

**Symptoms:**
- Error: "Link validation failed"
- "Customer not found" errors

**Solution:**
```python
# Add to test file
test_dependencies = ["Company", "Customer", "Item"]

# Verify dependencies have test_records.json files
# Or create them manually in setUp()
```

#### Issue 4: Child Table Not Created

**Symptoms:**
- Main document created but child table empty
- Child table validation fails

**Solution:**
```json
// Verify child table field name matches DocType
{
  "doctype": "Sales Invoice",
  "items": [  // Field name must match DocType definition
    {
      "item_code": "_Test Item",
      "qty": 10
    }
  ]
}
```

#### Issue 5: Test Records Not Created

**Symptoms:**
- `frappe.get_doc()` returns None
- "Record not found" errors

**Solution:**
```bash
# Check file location
ls apps/your_app/your_app/module/doctype/your_doctype/test_records.json

# Check JSON validity
python -m json.tool test_records.json

# Run with verbose
bench --site test_site run-tests --doctype YourDocType --verbose

# Force recreation
bench --site test_site run-tests --doctype YourDocType --force
```

---

### 11. Quick Reference Card

#### File Structure
```
doctype_name/
├── doctype_name.json
├── doctype_name.py
├── test_doctype_name.py
└── test_records.json  ← Create here
```

#### Basic JSON Template
```json
[
  {
    "doctype": "YourDocType",
    "field1": "value1",
    "field2": "value2"
  }
]
```

#### Test File Template
```python
import frappe
from frappe.tests.utils import FrappeTestCase

test_dependencies = ["Company", "Customer"]

class TestYourDocType(FrappeTestCase):
    def test_something(self):
        doc = frappe.get_doc("YourDocType", "_Test Record")
        # Test logic...
```

#### Common Commands
```bash
# Validate JSON
python -m json.tool test_records.json

# Run tests
bench --site test_site run-tests --doctype YourDocType

# Run with verbose
bench --site test_site run-tests --doctype YourDocType --verbose

# Force recreation
bench --site test_site run-tests --doctype YourDocType --force
```

#### Field Type Examples
```json
{
  "text_field": "value",
  "number_field": 100,
  "date_field": "2024-01-15",
  "link_field": "_Test Customer",
  "select_field": "Option",
  "checkbox_field": 1,
  "child_table": [
    {"field": "value"}
  ]
}
```

---

### 12. Final Checklist

Before using test_records.json in production:

- [ ] Created `test_records.json` in correct location
- [ ] JSON syntax is valid (no errors)
- [ ] All required fields included
- [ ] Child tables properly formatted
- [ ] Dependencies declared in test file
- [ ] Naming conventions followed
- [ ] Test records can be created successfully
- [ ] Tests can access test records
- [ ] File committed to version control
- [ ] Documentation updated if needed

---

### Summary

**To use test_records.json for unit testing:**

1. **Create** `test_records.json` in DocType directory
2. **Write** valid JSON array with test record objects
3. **Include** all required fields and dependencies
4. **Declare** dependencies in test file with `test_dependencies`
5. **Validate** JSON syntax before committing
6. **Run** tests - records are created automatically
7. **Access** records in tests using `frappe.get_doc()` or `test_records` variable

**That's it!** Frappe handles the rest automatically. Test records are created before your tests run, dependencies are resolved, and everything is ready when your test methods execute.

---

This guide covers everything you need to know about test_records in Frappe unit testing. Use it as a reference when creating and maintaining your test data.

---

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 7: Assertions](./69-Frappe_Unit_Testing_Guide_Part_7_Assertions.md)
- [Part 8: Reports](./80-Frappe_Unit_Testing_Guide_Part_8_Reports.md)
- [Part 10: Improve Test Coverage](./93-Frappe_Unit_Testing_Guide_Part_10_Improve_Test_Coverage.md)
