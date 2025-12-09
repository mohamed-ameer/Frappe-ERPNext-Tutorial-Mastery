# Frappe Report Unit Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [Report Types in Frappe](#report-types-in-frappe)
3. [Test Structure and Setup](#test-structure-and-setup)
4. [Testing Approaches](#testing-approaches)
5. [Test Utilities and Helpers](#test-utilities-and-helpers)
6. [Common Test Patterns](#common-test-patterns)
7. [Advanced Testing Scenarios](#advanced-testing-scenarios)
8. [Best Practices](#best-practices)
9. [Complete Examples](#complete-examples)

---

## Overview

This guide provides comprehensive instructions for writing unit tests for reports in Frappe custom apps. It covers all report types, testing patterns, utilities, and best practices based on analysis of real-world test implementations across the Frappe and ERPNext codebases.

### Key Concepts

- **Report Execution**: Reports in Frappe execute through an `execute()` function that returns `(columns, data)`
- **Filter Testing**: Tests verify reports work correctly with various filter combinations
- **Data Validation**: Tests validate that reports return expected data structures and values
- **Permission Testing**: Tests verify report access permissions and role-based restrictions

---

## Report Types in Frappe

Frappe supports four main report types, each requiring different testing approaches:

### 1. Script Report
- **Structure**: Python file with `execute(filters)` function
- **Location**: `apps/[app]/[app]/[module]/report/[report_name]/[report_name].py`
- **Returns**: `(columns, data)` tuple
- **Testing**: Direct function call testing

### 2. Query Report
- **Structure**: SQL query defined in Report DocType
- **Location**: Report DocType with `query` field
- **Returns**: `(columns, data)` tuple from SQL execution
- **Testing**: Report DocType testing with query execution

### 3. Report Builder
- **Structure**: JSON configuration with visual settings
- **Location**: Report DocType with `json` field
- **Returns**: `(columns, data)` tuple from DocType query
- **Testing**: Report DocType testing with filter validation

### 4. Custom Report
- **Structure**: Customized version of standard reports
- **Location**: Report DocType with `reference_report` field
- **Returns**: `(columns, data)` tuple from referenced report
- **Testing**: Report DocType testing with custom column validation

---

## Test Structure and Setup

### File Location

Tests should be placed in one of these locations:

1. **Module-level bulk tests**: `apps/[app]/[app]/[module]/test/test_reports.py`
   - Tests multiple reports in a module
   - Uses utility functions for batch testing

2. **Individual report tests**: `apps/[app]/[app]/[module]/report/[report_name]/test_[report_name].py`
   - Tests specific report functionality
   - More detailed and comprehensive

### Base Test Class

Always inherit from `FrappeTestCase`:

```python
import unittest
import frappe
from frappe.tests.utils import FrappeTestCase

class TestReports(FrappeTestCase):
    def setUp(self):
        """Set up test fixtures"""
        pass
    
    def tearDown(self):
        """Clean up after tests"""
        frappe.db.rollback()
```

### Safe Execution

For Script Reports, enable safe execution in `setUpClass`:

```python
@classmethod
def setUpClass(cls) -> None:
    cls.enable_safe_exec()
    return super().setUpClass()
```

---

## Testing Approaches

### Approach 1: Bulk Testing (Recommended for Multiple Reports)

This approach tests multiple reports efficiently using a utility function. Ideal for testing all reports in a module.

**Pattern Structure:**

```python
import unittest
from erpnext.tests.utils import ReportFilters, ReportName, execute_script_report

DEFAULT_FILTERS = {
    "company": "_Test Company",
    "from_date": "2010-01-01",
    "to_date": "2030-01-01",
}

REPORT_FILTER_TEST_CASES: list[tuple[ReportName, ReportFilters]] = [
    ("Report Name 1", {"filter1": "value1"}),
    ("Report Name 2", {"filter2": "value2"}),
    ("Report Name 3", {}),  # No additional filters
]

OPTIONAL_FILTERS = {
    "warehouse": "_Test Warehouse - _TC",
    "item": "_Test Item",
}

class TestReports(unittest.TestCase):
    def test_execute_all_reports(self):
        """Test that all script reports in module are executable with supported filters"""
        for report, filter in REPORT_FILTER_TEST_CASES:
            with self.subTest(report=report):
                execute_script_report(
                    report_name=report,
                    module="ModuleName",
                    filters=filter,
                    default_filters=DEFAULT_FILTERS,
                    optional_filters=OPTIONAL_FILTERS if filter.get("_optional") else None,
                )
```

**Key Components:**

1. **DEFAULT_FILTERS**: Common filters applied to all reports (company, dates, etc.)
2. **REPORT_FILTER_TEST_CASES**: List of tuples containing report names and their specific filters
3. **OPTIONAL_FILTERS**: Filters to test individually when `_optional` flag is set
4. **subTest**: Uses `subTest` to run each report as a separate test case

**Example from ERPNext Accounts Module:**

```python
# apps/erpnext/erpnext/accounts/test/test_reports.py
DEFAULT_FILTERS = {
    "company": "_Test Company",
    "from_date": "2010-01-01",
    "to_date": "2030-01-01",
    "period_start_date": "2010-01-01",
    "period_end_date": "2030-01-01",
}

REPORT_FILTER_TEST_CASES: list[tuple[ReportName, ReportFilters]] = [
    ("General Ledger", {"categorize_by": "Categorize by Voucher (Consolidated)"}),
    ("Accounts Payable", {"range": "30, 60, 90, 120"}),
    ("Gross Profit", {"group_by": "Invoice"}),
    ("Gross Profit", {"group_by": "Item Code"}),
    ("Sales Register", {}),
]
```

### Approach 2: Individual Report Testing

This approach provides detailed testing for specific reports with data validation.

**Pattern Structure:**

```python
import frappe
from frappe.tests.utils import FrappeTestCase
from your_app.module.report.report_name.report_name import execute

class TestReportName(FrappeTestCase):
    def setUp(self):
        """Set up test data"""
        self.filters = frappe._dict(
            company="_Test Company",
            from_date="2021-01-01",
            to_date="2021-12-31",
        )
    
    def tearDown(self):
        frappe.db.rollback()
    
    def test_report_execution(self):
        """Test basic report execution"""
        columns, data = execute(self.filters)
        
        # Validate columns
        self.assertIsInstance(columns, list)
        self.assertGreater(len(columns), 0)
        
        # Validate data
        self.assertIsInstance(data, list)
    
    def test_report_with_specific_filters(self):
        """Test report with specific filter combinations"""
        filters = self.filters.copy()
        filters.update({"item_code": "_Test Item"})
        
        columns, data = execute(filters)
        
        # Validate filtered results
        self.assertIsInstance(data, list)
        # Add specific assertions based on expected results
```

**Example from ERPNext Stock Module:**

```python
# apps/erpnext/erpnext/stock/report/item_shortage_report/test_item_shortage_report.py
class TestItemShortageReport(FrappeTestCase):
    def test_item_shortage_report(self):
        item = make_item().name
        so = make_sales_order(item_code=item)
        
        # Verify bin data
        reserved_qty, projected_qty = frappe.db.get_value(
            "Bin",
            {"item_code": item, "warehouse": so.items[0].warehouse},
            ["reserved_qty", "projected_qty"],
        )
        self.assertEqual(reserved_qty, so.items[0].qty)
        
        # Test report execution
        filters = {"company": so.company}
        report_data = item_shortage_report(filters)[1]
        item_code_list = [row.get("item_code") for row in report_data]
        self.assertIn(item, item_code_list)
        
        # Test with warehouse filter
        filters = {"company": so.company, "warehouse": [so.items[0].warehouse]}
        report_data = item_shortage_report(filters)[1]
        self.assertIn(item, item_code_list)
        
        # Test exclusion
        filters = {"company": so.company, "warehouse": ["Work In Progress - _TC"]}
        report_data = item_shortage_report(filters)[1]
        self.assertNotIn(item, item_code_list)
```

### Approach 3: Report DocType Testing

For Query Reports and Report Builder, test through the Report DocType:

```python
import frappe
from frappe.tests.utils import FrappeTestCase

class TestReportDocType(FrappeTestCase):
    def test_query_report(self):
        """Test Query Report execution"""
        report = frappe.get_doc("Report", "Report Name")
        columns, data = report.get_data(filters={"user": "Administrator"})
        
        self.assertEqual(columns[0].get("label"), "Name")
        self.assertIsInstance(data, list)
    
    def test_report_builder(self):
        """Test Report Builder execution"""
        report = frappe.get_doc("Report", "User Activity Report")
        columns, data = report.get_data()
        
        self.assertEqual(columns[0].get("label"), "ID")
        self.assertTrue("Administrator" in [d[0] for d in data])
```

---

## Test Utilities and Helpers

### execute_script_report Utility

The `execute_script_report` utility function (from `erpnext.tests.utils`) provides a standardized way to test Script Reports:

```python
def execute_script_report(
    report_name: ReportName,
    module: str,
    filters: ReportFilters,
    default_filters: ReportFilters | None = None,
    optional_filters: ReportFilters | None = None,
):
    """
    Util for testing execution of a report with specified filters.
    
    Tests the execution of report with default_filters + filters.
    Tests the execution using optional_filters one at a time.
    
    Args:
        report_name: Human readable name of report (unscrubbed)
        module: module to which report belongs to
        filters: specific values for filters
        default_filters: default values for filters such as company name
        optional_filters: filters which should be tested one at a time
    """
```

**How it works:**

1. Combines `default_filters` with `filters`
2. Executes the report with combined filters
3. If `optional_filters` provided, tests each optional filter individually
4. Raises exception if report execution fails

**Usage Example:**

```python
execute_script_report(
    report_name="Stock Ledger",
    module="Stock",
    filters={"item_code": "_Test Item"},
    default_filters={"company": "_Test Company", "from_date": "2021-01-01"},
    optional_filters={"warehouse": "_Test Warehouse - _TC"},
)
```

### get_report_module_dotted_path

Utility function to get the module path for a report:

```python
from frappe.core.doctype.report.report import get_report_module_dotted_path

# Returns: "erpnext.stock.report.stock_ledger.stock_ledger"
path = get_report_module_dotted_path("Stock", "Stock Ledger")
```

### Direct Report Execution

For direct testing without utilities:

```python
from frappe.core.doctype.report.report import get_report_module_dotted_path

# Get report execute function
module_path = get_report_module_dotted_path("Module", "Report Name")
execute_fn = frappe.get_attr(module_path + ".execute")

# Execute report
columns, data = execute_fn(filters)
```

---

## Common Test Patterns

### Pattern 1: Filter Validation

Test that reports handle various filter combinations correctly:

```python
def test_report_filters(self):
    """Test report with different filter combinations"""
    base_filters = {"company": "_Test Company"}
    
    # Test 1: No additional filters
    columns, data = execute(base_filters)
    self.assertIsInstance(data, list)
    
    # Test 2: With date range
    filters = base_filters.copy()
    filters.update({"from_date": "2021-01-01", "to_date": "2021-12-31"})
    columns, data = execute(filters)
    self.assertIsInstance(data, list)
    
    # Test 3: With item filter
    filters = base_filters.copy()
    filters.update({"item_code": "_Test Item"})
    columns, data = execute(filters)
    # Validate item appears in results
    item_codes = [row.get("item_code") for row in data]
    self.assertIn("_Test Item", item_codes)
```

### Pattern 2: Data Structure Validation

Validate that reports return correct data structures:

```python
def test_report_data_structure(self):
    """Test report returns correct data structure"""
    columns, data = execute(self.filters)
    
    # Validate columns
    self.assertIsInstance(columns, list)
    for col in columns:
        self.assertIn("label", col)
        self.assertIn("fieldname", col)
        self.assertIn("fieldtype", col)
    
    # Validate data
    self.assertIsInstance(data, list)
    if data:
        # If data is list of lists
        if isinstance(data[0], list):
            self.assertEqual(len(data[0]), len(columns))
        # If data is list of dicts
        elif isinstance(data[0], dict):
            for row in data:
                for col in columns:
                    self.assertIn(col["fieldname"], row)
```

### Pattern 3: Expected Data Validation

Test that reports return expected data values:

```python
def test_report_expected_data(self):
    """Test report returns expected data"""
    # Create test data
    item = make_item().name
    make_stock_entry(item_code=item, qty=100)
    
    # Execute report
    filters = {"item_code": item}
    columns, data = execute(filters)
    
    # Validate expected data
    item_row = next((row for row in data if row.get("item_code") == item), None)
    self.assertIsNotNone(item_row)
    self.assertEqual(item_row.get("qty"), 100)
```

### Pattern 4: Edge Cases

Test edge cases and error conditions:

```python
def test_report_edge_cases(self):
    """Test report handles edge cases"""
    # Test 1: Empty filters
    columns, data = execute({})
    self.assertIsInstance(data, list)
    
    # Test 2: Invalid filters
    filters = {"invalid_filter": "value"}
    # Should not raise error, but may return empty results
    columns, data = execute(filters)
    self.assertIsInstance(data, list)
    
    # Test 3: No data scenario
    filters = {"item_code": "NonExistentItem"}
    columns, data = execute(filters)
    self.assertEqual(len(data), 0)
```

### Pattern 5: Validation Error Testing

Test that reports raise appropriate validation errors:

```python
from frappe.exceptions import ValidationError

def test_report_validation_errors(self):
    """Test report raises validation errors for invalid inputs"""
    # Test with invalid qty_to_produce
    filters = frappe._dict({
        "bom": self.bom.name,
        "warehouse": "Stores - _TC",
        "qty_to_produce": 0,  # Invalid value
    })
    self.assertRaises(ValidationError, bom_stock_report, filters)
```

### Pattern 6: Dynamic Filter Setup

Set up filters dynamically based on test data:

```python
class TestManufacturingReports(unittest.TestCase):
    def setUp(self):
        self.setup_default_filters()
    
    def setup_default_filters(self):
        # Get dynamic test data
        self.last_bom = frappe.get_last_doc("BOM").name
        
        self.DEFAULT_FILTERS = {
            "company": "_Test Company",
            "from_date": "2010-01-01",
            "to_date": "2030-01-01",
        }
        
        # Build test cases dynamically
        self.REPORT_FILTER_TEST_CASES = [
            ("BOM Explorer", {"bom": self.last_bom}),
            ("BOM Stock Report", {"bom": self.last_bom, "qty_to_produce": 2}),
        ]
        
        # Conditionally add test cases
        if frappe.db.a_row_exists("Production Plan"):
            self.REPORT_FILTER_TEST_CASES.append(
                ("Production Plan Summary", {
                    "production_plan": frappe.get_last_doc("Production Plan").name
                })
            )
```

---

## Advanced Testing Scenarios

### Scenario 1: Testing Report Permissions

Test that reports respect role-based permissions:

```python
def test_report_permissions(self):
    """Test report access permissions"""
    # Create test user with limited role
    create_user("test_report_user@example.com", "Test Role")
    frappe.set_user("test_report_user@example.com")
    
    # Create report with specific role
    report = frappe.get_doc({
        "doctype": "Report",
        "report_name": "Test Report",
        "report_type": "Query Report",
        "roles": [{"role": "Test Role"}],
    }).insert(ignore_permissions=True)
    
    # Test permission check
    self.assertEqual(report.is_permitted(), True)
    
    # Test with user without role
    frappe.set_user("test@example.com")
    self.assertNotEqual(report.is_permitted(), True)
    
    frappe.set_user("Administrator")
```

### Scenario 2: Testing Custom Reports

Test reports with custom columns:

```python
def test_custom_report(self):
    """Test report with custom columns"""
    custom_report_name = save_report(
        "Permitted Documents For User",
        "Permitted Documents For User Custom",
        json.dumps([{
            "fieldname": "email",
            "fieldtype": "Data",
            "label": "Email",
            "insert_after_index": 0,
        }]),
        json.dumps({"user": "Administrator", "doctype": "User"}),
    )
    
    custom_report = frappe.get_doc("Report", custom_report_name)
    columns, result = custom_report.run_query_report(user=frappe.session.user)
    
    # Validate custom column exists
    self.assertListEqual(["email"], [col.get("fieldname") for col in columns])
    
    # Validate data includes custom column
    admin_dict = frappe.core.utils.find(result, lambda d: d["name"] == "Administrator")
    self.assertIn("email", admin_dict)
```

### Scenario 3: Testing Report Export

Test report export functionality (CSV, Excel):

```python
def test_report_export(self):
    """Test report export to CSV/Excel"""
    from frappe.desk.query_report import export_query
    
    frappe.local.form_dict = frappe._dict({
        "report_name": "Test Report",
        "file_format_type": "CSV",
        "csv_delimiter": ",",
        "csv_quoting": csv.QUOTE_MINIMAL,
    })
    
    export_query()
    
    self.assertTrue(frappe.response["filename"].endswith(".csv"))
    self.assertEqual(frappe.response["type"], "binary")
```

### Scenario 4: Testing Prepared Reports

Test prepared report functionality:

```python
def test_prepared_report(self):
    """Test prepared report creation and execution"""
    doc = frappe.get_doc({
        "doctype": "Prepared Report",
        "report_name": "Database Storage Usage By Tables",
    }).insert()
    
    frappe.db.commit()
    
    # Wait for completion
    self.wait_for_status(doc, "Completed")
    
    # Validate prepared data
    prepared_data = json.loads(doc.get_prepared_data().decode("utf-8"))
    generated_data = generate_report_result(get_report_doc("Database Storage Usage By Tables"))
    
    self.assertEqual(len(prepared_data["columns"]), len(generated_data["columns"]))
    self.assertEqual(len(prepared_data["result"]), len(generated_data["result"]))
```

### Scenario 5: Testing Report with Tree Structure

Test reports with tree/hierarchical data:

```python
def test_tree_report(self):
    """Test report with tree structure"""
    from frappe.desk.query_report import add_total_row
    
    report_settings = {"tree": True, "parent_field": "parent_value"}
    
    columns = [
        {"fieldname": "parent_column", "label": "Parent Column", "fieldtype": "Data"},
        {"fieldname": "column_1", "label": "Column 1", "fieldtype": "Float"},
    ]
    
    result = [
        {"parent_column": "Parent 1", "column_1": 200},
        {"parent_column": "Child 1", "column_1": 100, "parent_value": "Parent 1"},
    ]
    
    result = add_total_row(
        result,
        columns,
        meta=None,
        is_tree=report_settings["tree"],
        parent_field=report_settings["parent_field"],
    )
    
    # Validate total row added
    self.assertEqual(result[-1][0], "Total")
    self.assertEqual(result[-1][1], 200)
```

### Scenario 6: Testing Report with CTE (Common Table Expressions)

Test Query Reports with CTE:

```python
def test_cte_in_query_report(self):
    """Test Query Report with Common Table Expression"""
    cte_query = """
        with enabled_users as (
            select name
            from `tabUser`
            where enabled = 1
        )
        select * from enabled_users;
    """
    
    report = frappe.get_doc({
        "doctype": "Report",
        "report_name": "Enabled Users List",
        "report_type": "Query Report",
        "query": cte_query,
    }).insert()
    
    if frappe.db.db_type == "mariadb":
        col, rows = report.execute_query_report(filters={})
        self.assertEqual(col[0], "name")
        self.assertGreaterEqual(len(rows), 1)
    elif frappe.db.db_type == "postgres":
        # CTE may require special permissions in Postgres
        self.assertRaises(frappe.PermissionError, report.execute_query_report, filters={})
```

---

## Best Practices

### 1. Use Appropriate Test Base Class

- Use `FrappeTestCase` for all report tests
- Enable safe execution for Script Reports in `setUpClass`
- Always call `super().setUpClass()` when overriding
- Consider using test mixins (like `AccountsTestMixin`) for common setup

### 2. Clean Up After Tests

- Use `tearDown()` to rollback database changes
- Clean up test data created during tests
- Use `frappe.db.rollback()` to ensure clean state
- Use Query Builder for efficient bulk cleanup:

```python
def cleanup(self):
    doctypes = ["GL Entry", "Payment Ledger Entry", "Sales Invoice"]
    for doctype in doctypes:
        qb.from_(qb.DocType(doctype)).delete().where(
            qb.DocType(doctype).company == self.company
        ).run()
```

### 3. Use Descriptive Test Names

```python
# Good - describes what is being tested
def test_accounts_receivable_with_payment(self):
    pass

def test_foreign_account_balance_after_exchange_rate_revaluation(self):
    pass

# Bad - too generic
def test_report(self):
    pass
```

### 4. Test Multiple Filter Combinations

- Test with no filters (default behavior)
- Test with individual filters
- Test with filter combinations
- Test filter progression (add filters incrementally)
- Test with optional filters when applicable

**Example of Filter Progression:**

```python
def test_filter_progression(self):
    # Step 1: Basic filters
    filters = {"company": self.company, "from_date": today()}
    report = execute(filters)
    self.assertIsInstance(report[1], list)
    
    # Step 2: Add customer filter
    filters.update({"customer": self.customer})
    report = execute(filters)
    self.assertEqual(len(report[1]), 1)
    
    # Step 3: Add additional filter
    filters.update({"show_gl_balance": True})
    report = execute(filters)
    self.assertIn("gl_balance", report[1][0])
```

### 5. Validate Both Structure and Content

- Validate column structure
- Validate data structure
- Validate expected data values using `assertDictEqual` for complete validation
- Validate edge cases
- Use `subTest` for multiple field validations:

```python
def test_report_data_validation(self):
    report = execute(self.filters)
    expected_data = {
        "party": self.customer,
        "invoiced": 200.0,
        "paid": 0.0,
        "outstanding": 200.0,
    }
    
    # Validate complete dictionary
    self.assertDictEqual(report[1][0], expected_data)
    
    # Or validate individual fields with subTest
    for field in expected_data:
        with self.subTest(field=field):
            self.assertEqual(report[1][0].get(field), expected_data.get(field))
```

### 6. Use Test Mixins for Common Setup

Create reusable test mixins for common test data setup:

```python
# accounts_mixin.py
class AccountsTestMixin:
    def create_company(self, company_name="_Test Company"):
        # Common company setup logic
        pass
    
    def create_customer(self, customer_name="_Test Customer"):
        # Common customer setup logic
        pass
    
    def clear_old_entries(self):
        # Common cleanup logic
        pass

# test_report.py
class TestReport(AccountsTestMixin, FrappeTestCase):
    def setUp(self):
        self.create_company()
        self.create_customer()
        self.clear_old_entries()
```

### 7. Use Helper Methods Within Test Class

Create helper methods for reusable test data creation:

```python
class TestReport(FrappeTestCase):
    def create_sales_invoice(self, do_not_submit=False, **args):
        """Helper to create sales invoice with defaults"""
        si = create_sales_invoice(
            item=self.item,
            company=self.company,
            customer=self.customer,
            do_not_save=1,
            **args,
        )
        si = si.save()
        if not do_not_submit:
            si = si.submit()
        return si
    
    def create_payment_entry(self, docname, do_not_submit=False):
        """Helper to create payment entry"""
        pe = get_payment_entry("Sales Invoice", docname)
        pe.insert()
        if not do_not_submit:
            pe.submit()
        return pe
```

### 8. Test Multi-Step Business Scenarios

Test complex business scenarios that involve multiple steps:

```python
def test_invoice_payment_credit_note_scenario(self):
    """Test complete invoice lifecycle"""
    # Step 1: Create invoice
    si = self.create_sales_invoice()
    filters = {"company": self.company, "report_date": today()}
    report = execute(filters)
    self.assertEqual(report[1][0]["outstanding"], 100.0)
    
    # Step 2: Make partial payment
    self.create_payment_entry(si.name)
    report = execute(filters)
    self.assertEqual(report[1][0]["outstanding"], 60.0)
    
    # Step 3: Create credit note
    cr_note = self.create_credit_note(si.name)
    report = execute(filters)
    self.assertEqual(report[1][0]["outstanding"], -100.0)
```

### 9. Use subTest for Multiple Assertions

When testing multiple fields or multiple test cases:

```python
def test_multiple_fields(self):
    report = execute(self.filters)
    expected_fields = {
        "invoiced": 200.0,
        "paid": 150.0,
        "outstanding": 50.0,
    }
    
    for field, expected_value in expected_fields.items():
        with self.subTest(field=field):
            self.assertEqual(report[1][0].get(field), expected_value)
```

### 10. Test Edge Cases and Boundary Conditions

- Test with empty data
- Test with minimal outstanding amounts (e.g., 0.01)
- Test with future dates
- Test with negative values
- Test with zero values

```python
def test_minor_outstanding_amount(self):
    """Test that minor outstanding amounts are reported correctly"""
    si = self.create_sales_invoice()
    # Make payment leaving 0.01 outstanding
    pe = get_payment_entry(si.doctype, si.name, party_amount=99.99)
    pe.submit()
    
    report = execute(self.filters)
    self.assertEqual(report[1][0]["outstanding"], 0.01)
```

### 11. Test Settings Changes

Use `change_settings` decorator to test with different settings:

```python
from frappe.tests.utils import change_settings

@change_settings("Selling Settings", {"cust_master_name": "Naming Series"})
def test_with_different_settings(self):
    # Test report behavior with different settings
    report = execute(self.filters)
    # Assertions...
```

### 12. Test Multi-Currency Scenarios

Test reports with foreign currency:

```python
def test_foreign_currency_report(self):
    # Create USD receivable account
    self.create_usd_receivable_account()
    
    # Create invoice in USD
    si = self.create_sales_invoice(do_not_submit=True)
    si.currency = "USD"
    si.conversion_rate = 80
    si.debit_to = self.debtors_usd
    si.save().submit()
    
    filters = {"company": self.company, "in_party_currency": 1}
    report = execute(filters)
    
    # Validate currency and amounts
    self.assertEqual(report[1][0]["account_currency"], "USD")
    self.assertEqual(report[1][0]["outstanding"], 100.0)  # In USD
```

### 13. Test Accounting Dimensions

Test reports with accounting dimensions:

```python
def test_with_accounting_dimensions(self):
    # Create accounting dimension
    create_accounting_dimension()
    
    # Create transaction with dimension
    si = create_sales_invoice(branch="Location 1")
    
    # Test report with dimension filter
    filters = {"company": self.company, "branch": ["Location 1"]}
    report = execute(filters)
    
    # Validate dimension filtering works correctly
    self.assertEqual(len(report[1]), 1)
```

### 14. Test Report Export Functionality

Test report export to different formats:

```python
def test_report_export(self):
    from frappe.desk.query_report import export_query
    
    # Create test data
    self.create_sales_invoice()
    
    # Test CSV export
    frappe.local.form_dict = frappe._dict({
        "report_name": "Report Name",
        "file_format_type": "CSV",
        "filters": self.filters,
    })
    export_query()
    
    self.assertTrue(frappe.response["filename"].endswith(".csv"))
    self.assertEqual(frappe.response["type"], "binary")
```

### 15. Handle Dynamic Test Data

When test data depends on existing records:

```python
def setUp(self):
    # Check if required data exists
    if frappe.db.a_row_exists("Production Plan"):
        self.production_plan = frappe.get_last_doc("Production Plan").name
    else:
        self.skipTest("Production Plan not available")
```

### 16. Test Error Conditions

- Test validation errors
- Test permission errors
- Test edge cases (empty data, invalid filters)
- Test exception handling

```python
from frappe.exceptions import ValidationError

def test_validation_error(self):
    filters = {"qty_to_produce": 0}  # Invalid value
    self.assertRaises(ValidationError, execute, filters)
```

### 17. Keep Tests Independent

- Each test should be independent
- Don't rely on test execution order
- Clean up after each test
- Use `setUp` and `tearDown` appropriately
- Use `clear_old_entries()` or similar cleanup methods

### 18. Use maxDiff for Better Assertion Messages

Set `maxDiff` to `None` for better error messages when assertions fail:

```python
def setUp(self):
    self.maxDiff = None  # Shows full diff on assertion failure
```

### 19. Test Filter Combinations Systematically

Test all relevant filter combinations:

```python
def test_all_filter_combinations(self):
    base_filters = {"company": self.company}
    
    # Test each filter individually
    for filter_name in ["customer", "item", "warehouse"]:
        filters = base_filters.copy()
        filters[filter_name] = getattr(self, filter_name)
        report = execute(filters)
        self.assertIsInstance(report[1], list)
    
    # Test combinations
    filters = base_filters.copy()
    filters.update({
        "customer": self.customer,
        "item": self.item,
    })
    report = execute(filters)
    self.assertIsInstance(report[1], list)
```

### 20. Document Complex Test Scenarios

Add docstrings explaining complex test scenarios:

```python
def test_order_connected_dn_and_inv(self):
    """
    Test gp calculation when invoice and delivery note aren't directly connected.
    SO -- INV
    |
    DN
    """
    # Test implementation...
```

---

## Advanced Patterns from Accounts Reports

Based on analysis of comprehensive accounts report tests, here are advanced patterns you can use:

### Pattern 1: Using Test Mixins

Create reusable mixins for common test setup:

```python
# test_mixin.py
class AccountsTestMixin:
    def create_company(self, company_name="_Test Company"):
        """Create test company with all required accounts"""
        if frappe.db.exists("Company", company_name):
            company = frappe.get_doc("Company", company_name)
        else:
            company = frappe.get_doc({
                "doctype": "Company",
                "company_name": company_name,
                "country": "India",
                "default_currency": "INR",
                "create_chart_of_accounts_based_on": "Standard Template",
            }).save()
        
        self.company = company.name
        self.cost_center = company.cost_center
        self.debit_to = "Debtors - " + company.abbr
        self.creditors = "Creditors - " + company.abbr
    
    def create_customer(self, customer_name="_Test Customer"):
        """Create test customer"""
        if not frappe.db.exists("Customer", customer_name):
            customer = frappe.new_doc("Customer")
            customer.customer_name = customer_name
            customer.type = "Individual"
            customer.save()
            self.customer = customer.name
        else:
            self.customer = customer_name
    
    def clear_old_entries(self):
        """Clean up old test data"""
        doctypes = ["GL Entry", "Payment Ledger Entry", "Sales Invoice"]
        for doctype in doctypes:
            qb.from_(qb.DocType(doctype)).delete().where(
                qb.DocType(doctype).company == self.company
            ).run()

# test_report.py
class TestReport(AccountsTestMixin, FrappeTestCase):
    def setUp(self):
        self.create_company()
        self.create_customer()
        self.clear_old_entries()
```

### Pattern 2: Comprehensive Data Validation

Use `assertDictEqual` for complete data validation:

```python
def test_comprehensive_data_validation(self):
    """Test all fields in report output"""
    si = self.create_sales_invoice()
    
    filters = {
        "company": self.company,
        "customer": self.customer,
        "posting_date": today(),
    }
    
    report = execute(filters)
    rpt_output = report[1]
    
    # Complete expected data dictionary
    expected_data = {
        "party_type": "Customer",
        "party": self.customer,
        "invoiced": 200.0,
        "paid": 0.0,
        "credit_note": 0.0,
        "outstanding": 200.0,
        "range1": 200.0,
        "range2": 0.0,
        "range3": 0.0,
        "range4": 0.0,
        "range5": 0.0,
        "total_due": 200.0,
        "currency": si.currency,
    }
    
    self.assertEqual(len(rpt_output), 1)
    self.assertDictEqual(rpt_output[0], expected_data)
```

### Pattern 3: Multi-Step Scenario Testing

Test complex business scenarios step by step:

```python
def test_invoice_payment_credit_note_flow(self):
    """Test complete invoice lifecycle"""
    filters = {
        "company": self.company,
        "customer": self.customer,
        "posting_date": today(),
    }
    
    # Step 1: Create invoice
    si = self.create_sales_invoice()
    report = execute(filters)
    expected_data = {
        "invoiced": 200.0,
        "paid": 0.0,
        "outstanding": 200.0,
    }
    self.assertDictContainsSubset(expected_data, report[1][0])
    
    # Step 2: Make advance payment
    pe = get_payment_entry(si.doctype, si.name)
    pe.paid_amount = 50
    pe.references[0].allocated_amount = 0  # Unlinked advance
    pe.save().submit()
    
    report = execute(filters)
    expected_data.update({
        "advance": 50.0,
        "outstanding": 150.0,
    })
    self.assertDictContainsSubset(expected_data, report[1][0])
    
    # Step 3: Make partial payment against invoice
    pe = get_payment_entry(si.doctype, si.name)
    pe.paid_amount = 125
    pe.references[0].allocated_amount = 125
    pe.save().submit()
    
    report = execute(filters)
    expected_data.update({
        "advance": 50.0,
        "paid": 125.0,
        "outstanding": 25.0,
    })
    self.assertDictContainsSubset(expected_data, report[1][0])
```

### Pattern 4: Filter Progression Testing

Test filters incrementally to ensure each filter works correctly:

```python
def test_filter_progression(self):
    """Test filters work correctly when added incrementally"""
    # Base filters
    filters = {"company": self.company, "from_date": today()}
    report = execute(filters)
    self.assertGreater(len(report[1]), 0)
    
    # Add customer filter
    filters.update({"customer": self.customer})
    report = execute(filters)
    customer_rows = [r for r in report[1] if r.get("party") == self.customer]
    self.assertEqual(len(customer_rows), len(report[1]))
    
    # Add GL balance filter
    filters.update({"show_gl_balance": True})
    report = execute(filters)
    self.assertIn("gl_balance", report[1][0])
    
    # Add future payments filter
    filters.update({"show_future_payments": True})
    report = execute(filters)
    self.assertIn("future_amount", report[1][0])
```

### Pattern 5: Testing with Settings Changes

Use `change_settings` decorator to test different configurations:

```python
from frappe.tests.utils import change_settings

@change_settings("Selling Settings", {"cust_master_name": "Naming Series"})
def test_with_different_settings(self):
    """Test report behavior with different system settings"""
    si = self.create_sales_invoice()
    report = execute(self.filters)
    
    # Assertions based on naming series setting
    self.assertIsNotNone(report[1][0].get("party_name"))
```

### Pattern 6: Testing Multi-Currency Reports

Test reports with foreign currency transactions:

```python
def test_multi_currency_report(self):
    """Test report with foreign currency"""
    # Create USD receivable account
    self.create_usd_receivable_account()
    
    # Create invoice in USD
    si = self.create_sales_invoice(do_not_submit=True)
    si.currency = "USD"
    si.conversion_rate = 80
    si.debit_to = self.debtors_usd
    si.save().submit()
    
    # Test in party currency
    filters = {
        "company": self.company,
        "in_party_currency": 1,
    }
    report = execute(filters)
    self.assertEqual(report[1][0]["account_currency"], "USD")
    self.assertEqual(report[1][0]["outstanding"], 100.0)  # In USD
    
    # Test in base currency
    filters["in_party_currency"] = 0
    report = execute(filters)
    self.assertEqual(report[1][0]["outstanding"], 8000.0)  # In base currency
```

### Pattern 7: Testing Accounting Dimensions

Test reports with accounting dimensions:

```python
def test_with_accounting_dimensions(self):
    """Test report filtering by accounting dimensions"""
    # Create accounting dimension
    branch1 = frappe.new_doc("Branch")
    branch1.branch = "Location 1"
    branch1.insert(ignore_if_duplicate=True)
    
    branch2 = frappe.new_doc("Branch")
    branch2.branch = "Location 2"
    branch2.insert(ignore_if_duplicate=True)
    
    # Create transaction with dimension
    si = create_sales_invoice(company=self.company)
    si.branch = "Location 1"
    si.items[0].branch = "Location 2"
    si.save().submit()
    
    # Test with dimension filter
    filters = {
        "company": self.company,
        "branch": ["Location 1"],
    }
    report = execute(filters)
    
    # Validate dimension filtering
    self.assertEqual(len(report[1]), 1)
    self.assertEqual(report[1][0].get("branch"), "Location 1")
```

### Pattern 8: Testing Edge Cases

Test boundary conditions and edge cases:

```python
def test_edge_cases(self):
    """Test various edge cases"""
    # Test 1: Minor outstanding amount
    si = self.create_sales_invoice()
    pe = get_payment_entry(si.doctype, si.name, party_amount=99.99)
    pe.submit()
    
    report = execute(self.filters)
    self.assertEqual(report[1][0]["outstanding"], 0.01)
    
    # Test 2: Future payments
    si = self.create_sales_invoice()
    pe = get_payment_entry(si.doctype, si.name)
    pe.posting_date = add_days(today(), 1)
    pe.save().submit()
    
    filters = self.filters.copy()
    filters.update({"show_future_payments": True})
    report = execute(filters)
    self.assertGreater(report[1][0]["future_amount"], 0)
    
    # Test 3: Fully paid invoice (should not appear)
    pe = get_payment_entry(si.doctype, si.name)
    pe.save().submit()
    
    report = execute(self.filters)
    self.assertEqual(len(report[1]), 0)
```

### Pattern 9: Testing Group By Functionality

Test reports with group_by options:

```python
def test_group_by_functionality(self):
    """Test report grouping options"""
    # Create multiple invoices
    si1 = self.create_sales_invoice(rate=100)
    si2 = self.create_sales_invoice(rate=200)
    
    # Test group by invoice
    filters = {
        "company": self.company,
        "from_date": today(),
        "to_date": today(),
        "group_by": "Invoice",
    }
    report = execute(filters)
    self.assertEqual(len(report[1]), 2)  # Two invoices
    
    # Test group by customer
    filters["group_by"] = "Customer"
    report = execute(filters)
    # Should have customer totals
    self.assertGreater(len(report[1]), 2)
```

### Pattern 10: Testing Report Export

Test report export functionality:

```python
def test_report_export(self):
    """Test report export to CSV/Excel"""
    from frappe.desk.query_report import export_query
    
    # Create test data
    self.create_sales_invoice()
    
    # Test CSV export
    frappe.local.form_dict = frappe._dict({
        "report_name": "Report Name",
        "file_format_type": "CSV",
        "filters": self.filters,
        "visible_idx": [0, 1, 2],
    })
    export_query()
    
    self.assertTrue(frappe.response["filename"].endswith(".csv"))
    self.assertEqual(frappe.response["type"], "binary")
    
    # Verify CSV content
    contents = frappe.response["filecontent"].decode()
    self.assertIn(self.customer, contents)
```

### Pattern 11: Testing Complex Calculations

Test reports with complex calculations:

```python
def test_complex_calculations(self):
    """Test report calculations"""
    # Create invoice with payment terms
    si = self.create_sales_invoice()
    
    filters = {
        "company": self.company,
        "based_on_payment_terms": 1,
        "report_date": today(),
        "range": "30, 60, 90, 120",
    }
    
    report = execute(filters)
    
    # Validate payment term calculations
    expected_data = [
        [100, 30, "No Remarks"],  # First payment term
        [100, 50, "No Remarks"],  # Second payment term
        [100, 20, "No Remarks"],  # Third payment term
    ]
    
    for i in range(3):
        row = report[1][i]
        self.assertEqual(
            expected_data[i],
            [row.invoice_grand_total, row.invoiced, row.remarks]
        )
```

### Pattern 12: Testing with Cleanup Methods

Use efficient cleanup methods:

```python
def setUp(self):
    self.create_company()
    self.cleanup()

def cleanup(self):
    """Efficient cleanup using Query Builder"""
    doctypes = [
        qb.DocType("GL Entry"),
        qb.DocType("Payment Ledger Entry"),
        qb.DocType("Sales Invoice"),
    ]
    
    for doctype in doctypes:
        qb.from_(doctype).delete().where(
            doctype.company == self.company
        ).run()
```

---

## Complete Examples

### Example 1: Bulk Testing Multiple Reports

```python
# apps/your_app/your_app/module/test/test_reports.py
import unittest
import frappe
from erpnext.tests.utils import ReportFilters, ReportName, execute_script_report

DEFAULT_FILTERS = {
    "company": "_Test Company",
    "from_date": "2010-01-01",
    "to_date": "2030-01-01",
}

REPORT_FILTER_TEST_CASES: list[tuple[ReportName, ReportFilters]] = [
    ("Report One", {"filter1": "value1"}),
    ("Report Two", {"filter2": "value2", "_optional": True}),
    ("Report Three", {}),
]

OPTIONAL_FILTERS = {
    "warehouse": "_Test Warehouse - _TC",
    "item": "_Test Item",
}

class TestModuleReports(unittest.TestCase):
    def test_execute_all_module_reports(self):
        """Test that all script reports in module are executable"""
        for report, filter in REPORT_FILTER_TEST_CASES:
            with self.subTest(report=report):
                execute_script_report(
                    report_name=report,
                    module="ModuleName",
                    filters=filter,
                    default_filters=DEFAULT_FILTERS,
                    optional_filters=OPTIONAL_FILTERS if filter.get("_optional") else None,
                )
```

### Example 2: Individual Report with Data Validation

```python
# apps/your_app/your_app/module/report/custom_report/test_custom_report.py
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import today, add_days
from your_app.module.report.custom_report.custom_report import execute

class TestCustomReport(FrappeTestCase):
    def setUp(self):
        """Set up test fixtures"""
        self.filters = frappe._dict(
            company="_Test Company",
            from_date=today(),
            to_date=add_days(today(), 30),
        )
    
    def tearDown(self):
        frappe.db.rollback()
    
    def test_basic_execution(self):
        """Test basic report execution"""
        columns, data = execute(self.filters)
        
        # Validate structure
        self.assertIsInstance(columns, list)
        self.assertIsInstance(data, list)
        self.assertGreater(len(columns), 0)
        
        # Validate column structure
        for col in columns:
            self.assertIn("label", col)
            self.assertIn("fieldname", col)
            self.assertIn("fieldtype", col)
    
    def test_with_item_filter(self):
        """Test report with item filter"""
        filters = self.filters.copy()
        filters.update({"item_code": "_Test Item"})
        
        columns, data = execute(filters)
        
        # Validate filtered results
        if data:
            item_codes = [row.get("item_code") if isinstance(row, dict) else row[0] 
                         for row in data]
            self.assertIn("_Test Item", item_codes)
    
    def test_empty_results(self):
        """Test report with filters that return no results"""
        filters = self.filters.copy()
        filters.update({"item_code": "NonExistentItem"})
        
        columns, data = execute(filters)
        self.assertEqual(len(data), 0)
```

### Example 3: Report with Complex Validation

```python
# apps/your_app/your_app/module/report/complex_report/test_complex_report.py
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.exceptions import ValidationError
from your_app.module.report.complex_report.complex_report import execute

class TestComplexReport(FrappeTestCase):
    def setUp(self):
        """Set up test data"""
        self.item = make_item().name
        self.warehouse = "_Test Warehouse - _TC"
        make_stock_entry(item_code=self.item, qty=100, target=self.warehouse)
        
        self.filters = frappe._dict(
            company="_Test Company",
            from_date="2021-01-01",
            to_date="2021-12-31",
        )
    
    def tearDown(self):
        frappe.db.rollback()
    
    def test_report_with_expected_data(self):
        """Test report returns expected data"""
        filters = self.filters.copy()
        filters.update({"item_code": self.item})
        
        columns, data = execute(filters)
        
        # Find item in results
        item_row = None
        for row in data:
            if isinstance(row, dict):
                if row.get("item_code") == self.item:
                    item_row = row
                    break
            elif isinstance(row, list) and row[0] == self.item:
                item_row = row
                break
        
        self.assertIsNotNone(item_row, "Item not found in report results")
        
        # Validate quantities
        if isinstance(item_row, dict):
            self.assertEqual(item_row.get("qty"), 100)
        else:
            # Assuming qty is at index 1
            self.assertEqual(item_row[1], 100)
    
    def test_validation_error(self):
        """Test report raises validation error for invalid input"""
        filters = self.filters.copy()
        filters.update({"qty": -1})  # Invalid negative qty
        
        # Adjust based on your report's validation
        # self.assertRaises(ValidationError, execute, filters)
```

### Example 4: Query Report Testing

```python
# apps/your_app/your_app/module/report/query_report/test_query_report.py
import frappe
from frappe.tests.utils import FrappeTestCase

class TestQueryReport(FrappeTestCase):
    def test_query_report_execution(self):
        """Test Query Report execution"""
        report = frappe.get_doc("Report", "Your Query Report Name")
        columns, data = report.get_data(filters={"user": "Administrator"})
        
        # Validate structure
        self.assertIsInstance(columns, list)
        self.assertIsInstance(data, list)
        
        # Validate column labels
        self.assertEqual(columns[0].get("label"), "Name")
        
        # Validate data contains expected values
        if data:
            names = [d.get("name") if isinstance(d, dict) else d[0] for d in data]
            self.assertIn("Administrator", names)
    
    def test_query_report_with_custom_filters(self):
        """Test Query Report with custom filters"""
        report = frappe.get_doc("Report", "Your Query Report Name")
        
        custom_filters = {
            "user": "Administrator",
            "doctype": "User",
            "status": "Active",
        }
        
        columns, data = report.get_data(filters=custom_filters)
        
        # Validate filtered results
        self.assertIsInstance(data, list)
        # Add specific validations based on expected results
```

### Example 5: Report Builder Testing

```python
# apps/your_app/your_app/module/report/report_builder/test_report_builder.py
import frappe
import json
from frappe.tests.utils import FrappeTestCase

class TestReportBuilder(FrappeTestCase):
    def test_report_builder_execution(self):
        """Test Report Builder execution"""
        report = frappe.get_doc("Report", "Your Report Builder Name")
        columns, data = report.get_data()
        
        # Validate structure
        self.assertIsInstance(columns, list)
        self.assertIsInstance(data, list)
        
        # Validate column structure
        self.assertEqual(columns[0].get("label"), "ID")
        self.assertEqual(columns[1].get("label"), "User Type")
        
        # Validate data contains expected values
        if data:
            # For list of lists
            if isinstance(data[0], list):
                self.assertTrue("Administrator" in [d[0] for d in data])
            # For list of dicts
            elif isinstance(data[0], dict):
                self.assertTrue("Administrator" in [d.get("name") for d in data])
```

### Example 6: Comprehensive Accounts Report Test (Real-World Pattern)

This example demonstrates a comprehensive test pattern used in ERPNext accounts reports:

```python
# apps/your_app/your_app/accounts/report/accounts_receivable/test_accounts_receivable.py
import frappe
from frappe.tests.utils import FrappeTestCase, change_settings
from frappe.utils import add_days, today
from erpnext.accounts.doctype.payment_entry.payment_entry import get_payment_entry
from erpnext.accounts.doctype.sales_invoice.test_sales_invoice import create_sales_invoice
from erpnext.accounts.report.accounts_receivable.accounts_receivable import execute
from erpnext.accounts.test.accounts_mixin import AccountsTestMixin

class TestAccountsReceivable(AccountsTestMixin, FrappeTestCase):
    def setUp(self):
        self.maxDiff = None  # Show full diff on assertion failure
        self.create_company()
        self.create_customer()
        self.create_item()
        self.create_usd_receivable_account()
        self.clear_old_entries()
    
    def tearDown(self):
        frappe.db.rollback()
    
    def create_sales_invoice(self, no_payment_schedule=False, do_not_submit=False, **args):
        """Helper to create sales invoice with payment schedule"""
        si = create_sales_invoice(
            item=self.item,
            company=self.company,
            customer=self.customer,
            debit_to=self.debit_to,
            posting_date=today(),
            rate=100,
            do_not_save=1,
            **args,
        )
        if not no_payment_schedule:
            si.append("payment_schedule", {
                "due_date": add_days(today(), 30),
                "invoice_portion": 30.00,
                "payment_amount": 30,
            })
            si.append("payment_schedule", {
                "due_date": add_days(today(), 60),
                "invoice_portion": 50.00,
                "payment_amount": 50,
            })
            si.append("payment_schedule", {
                "due_date": add_days(today(), 90),
                "invoice_portion": 20.00,
                "payment_amount": 20,
            })
        si = si.save()
        if not do_not_submit:
            si = si.submit()
        return si
    
    def create_payment_entry(self, docname, do_not_submit=False):
        """Helper to create payment entry"""
        pe = get_payment_entry("Sales Invoice", docname, bank_account=self.cash, party_amount=40)
        pe.paid_from = self.debit_to
        pe.insert()
        if not do_not_submit:
            pe.submit()
        return pe
    
    def test_accounts_receivable_with_payment(self):
        """Test accounts receivable with payment terms and payments"""
        filters = {
            "company": self.company,
            "based_on_payment_terms": 1,
            "report_date": today(),
            "range": "30, 60, 90, 120",
            "show_remarks": True,
        }
        
        # Step 1: Create invoice with payment terms
        si = self.create_sales_invoice()
        report = execute(filters)
        
        # Validate payment terms
        expected_data = [
            [100, 30, "No Remarks"],
            [100, 50, "No Remarks"],
            [100, 20, "No Remarks"],
        ]
        
        for i in range(3):
            row = report[1][i]
            self.assertEqual(
                expected_data[i],
                [row.invoice_grand_total, row.invoiced, row.remarks]
            )
        
        # Step 2: Make partial payment
        self.create_payment_entry(si.name)
        report = execute(filters)
        
        expected_data_after_payment = [[100, 50, 10, 40], [100, 20, 0, 20]]
        for i in range(2):
            row = report[1][i]
            self.assertEqual(
                expected_data_after_payment[i],
                [row.invoice_grand_total, row.invoiced, row.paid, row.outstanding]
            )
    
    def test_multi_currency_report(self):
        """Test report with foreign currency"""
        filters = {
            "company": self.company,
            "party_type": "Customer",
            "party": [self.customer],
            "report_date": today(),
            "range": "30, 60, 90, 120",
            "in_party_currency": 1,
        }
        
        # Create USD invoice
        si = self.create_sales_invoice(no_payment_schedule=True, do_not_submit=True)
        si.currency = "USD"
        si.conversion_rate = 80
        si.debit_to = self.debtors_usd
        si.save().submit()
        
        report = execute(filters)
        
        expected = {
            "voucher_type": si.doctype,
            "voucher_no": si.name,
            "party_account": self.debtors_usd,
            "invoiced": 100.0,
            "outstanding": 100.0,
            "account_currency": "USD",
        }
        
        self.assertEqual(len(report[1]), 1)
        report_output = report[1][0]
        for field in expected:
            with self.subTest(field=field):
                self.assertEqual(report_output.get(field), expected.get(field))
    
    def test_filter_progression(self):
        """Test filters work correctly when added incrementally"""
        si = self.create_sales_invoice()
        
        # Base filters
        filters = {"company": self.company, "report_date": today()}
        report = execute(filters)
        self.assertGreater(len(report[1]), 0)
        
        # Add customer filter
        filters.update({"customer": self.customer})
        report = execute(filters)
        self.assertEqual(len(report[1]), 1)
        
        # Add GL balance filter
        filters.update({"show_gl_balance": True})
        report = execute(filters)
        self.assertIn("gl_balance", report[1][0])
    
    def test_edge_cases(self):
        """Test edge cases"""
        # Test minor outstanding amount
        si = self.create_sales_invoice(no_payment_schedule=True)
        pe = get_payment_entry(si.doctype, si.name, party_amount=99.99)
        pe.submit()
        
        filters = {"company": self.company, "report_date": today()}
        report = execute(filters)
        
        self.assertEqual(len(report[1]), 1)
        self.assertEqual(report[1][0]["outstanding"], 0.01)
        
        # Test fully paid (should not appear)
        pe = get_payment_entry(si.doctype, si.name)
        pe.submit()
        
        report = execute(filters)
        self.assertEqual(len(report[1]), 0)
```

This comprehensive example demonstrates:
- Using test mixins for common setup
- Helper methods for test data creation
- Multi-step scenario testing
- Filter progression testing
- Multi-currency testing
- Edge case testing
- Using `subTest` for multiple assertions
- Proper cleanup and teardown

```python
# apps/your_app/your_app/module/report/report_builder/test_report_builder.py
import frappe
import json
from frappe.tests.utils import FrappeTestCase

class TestReportBuilder(FrappeTestCase):
    def test_report_builder_execution(self):
        """Test Report Builder execution"""
        report = frappe.get_doc("Report", "Your Report Builder Name")
        columns, data = report.get_data()
        
        # Validate structure
        self.assertIsInstance(columns, list)
        self.assertIsInstance(data, list)
        
        # Validate column structure
        self.assertEqual(columns[0].get("label"), "ID")
        self.assertEqual(columns[1].get("label"), "User Type")
        
        # Validate data contains expected values
        if data:
            # For list of lists
            if isinstance(data[0], list):
                self.assertTrue("Administrator" in [d[0] for d in data])
            # For list of dicts
            elif isinstance(data[0], dict):
                self.assertTrue("Administrator" in [d.get("name") for d in data])
```

---

## Generic Report Testing Template For Any Report

```python
import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.desk.query_report import run

class TestMyReport(FrappeTestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.enable_safe_exec()
        return super().setUpClass()

    def setUp(self):
        """Set up test fixtures"""
        self.report_name = "my_report_name"
        self.filters = frappe._dict(
            company="_Test Company",
            from_date="2020-01-01",
            to_date="2025-12-31",
        )
    
    def tearDown(self):
        """Clean up after tests"""
        frappe.db.rollback()

    def test_report_runs(self):
        """Ensure the report executes without errors"""
        result = run(self.report_name, self.filters)

        self.assertIsInstance(result, dict)
        self.assertIn("result", result)
        self.assertIn("columns", result)

    def test_columns_valid(self):
        """Ensure columns exist and follow valid structure"""
        result = run(self.report_name, self.filters)

        self.assertIsInstance(result["columns"], list)
        self.assertGreater(len(result["columns"]), 0)

    def test_result_structure(self):
        """Ensure returned rows are list/dict (valid Frappe format)"""
        result = run(self.report_name, self.filters)

        for row in result["result"]:
            self.assertTrue(
                isinstance(row, (list, dict)),
                "Each result row must be a list or dict"
            )
```

### Run Test command for specific report

```bash
bench run-tests --module <app>.<app>.report.<report_name>.test_<report_name> --skip-test-records
```

---

## Summary

This guide covers comprehensive unit testing for Frappe reports:

1. **Report Types**: Script Reports, Query Reports, Report Builder, Custom Reports
2. **Testing Approaches**: Bulk testing, individual testing, DocType testing
3. **Utilities**: `execute_script_report`, `get_report_module_dotted_path`
4. **Common Patterns**: Filter validation, data structure validation, edge cases
5. **Advanced Scenarios**: Permissions, custom reports, exports, prepared reports
6. **Best Practices**: Clean setup/teardown, descriptive names, independent tests

Use this guide as a reference when writing unit tests for reports in your Frappe custom apps. Adapt the patterns to your specific requirements while following the established best practices.

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 7: Assertions](./69-Frappe_Unit_Testing_Guide_Part_7_Assertions.md)
- [Part 9: Test Records](./82-Frappe_Unit_Testing_Guide_Part_9_Test_Records.md)