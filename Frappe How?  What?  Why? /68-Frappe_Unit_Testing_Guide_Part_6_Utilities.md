# ERPNext & HRMS Test Utilities and Techniques Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Factory Functions (make_ functions)](#factory-functions-make_-functions)
3. [Test Setup and Teardown Patterns](#test-setup-and-teardown-patterns)
4. [Helper Utilities](#helper-utilities)
5. [Assertion Helpers](#assertion-helpers)
6. [Test Mixins](#test-mixins)
7. [Common Test Patterns](#common-test-patterns)
8. [Best Practices](#best-practices)
9. [Complete Function Reference](#complete-function-reference)
10. [Advanced Patterns](#advanced-patterns)
11. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## Introduction

This guide documents all the useful test utilities, helper functions, and techniques found in ERPNext and HRMS test files. These patterns can be reused in any custom Frappe application to write better, more maintainable tests.

### Key Concepts

- **Factory Functions**: Functions that create test objects (usually prefixed with `make_` or `create_`)
- **Test Mixins**: Reusable test classes that provide common functionality
- **Helper Utilities**: Utility functions for common test operations
- **Assertion Helpers**: Custom assertion methods for complex validations

---

## Factory Functions (make_ functions)

Factory functions are the most common pattern in ERPNext/HRMS tests. They create test documents with sensible defaults and allow customization through keyword arguments.

### Pattern Structure

```python
def make_doctype_name(**args):
    """Create a test document with defaults"""
    args = frappe._dict(args)
    
    doc = frappe.new_doc("DocType Name")
    doc.field1 = args.field1 or "default_value"
    doc.field2 = args.field2 or "default_value"
    
    if not args.do_not_save:
        doc.insert()
        if not args.do_not_submit:
            doc.submit()
    
    return doc
```

### Key Features

1. **Default Values**: Sensible defaults for all required fields
2. **Flexible Arguments**: Accept `**args` for customization
3. **Control Flags**: `do_not_save` and `do_not_submit` flags
4. **Return Document**: Always return the created document

### Example: make_purchase_receipt

```python
def make_purchase_receipt(**args):
    """Create a Purchase Receipt with defaults"""
    args = frappe._dict(args)
    pr = frappe.new_doc("Purchase Receipt")
    
    # Set defaults
    pr.posting_date = args.posting_date or today()
    pr.company = args.company or "_Test Company"
    pr.supplier = args.supplier or "_Test Supplier"
    pr.currency = args.currency or "INR"
    
    # Add item
    qty = args.qty if args.qty is not None else 5
    item_code = args.item or args.item_code or "_Test Item"
    
    pr.append("items", {
        "item_code": item_code,
        "warehouse": args.warehouse or "_Test Warehouse - _TC",
        "qty": qty,
        "rate": args.rate if args.rate is not None else 50,
    })
    
    # Control flags
    if not args.do_not_save:
        pr.insert()
        if not args.do_not_submit:
            pr.submit()
        pr.load_from_db()
    
    return pr
```

### Usage Examples

```python
# Basic usage
pr = make_purchase_receipt()

# Custom quantity
pr = make_purchase_receipt(qty=10)

# Custom item and rate
pr = make_purchase_receipt(item_code="_Test Item 2", rate=100)

# Don't submit
pr = make_purchase_receipt(do_not_submit=True)

# Don't save (for validation testing)
pr = make_purchase_receipt(do_not_save=True)
```

### Common Factory Functions in ERPNext

| Function | Location | Purpose |
|----------|----------|---------|
| `make_item()` | `erpnext.stock.doctype.item.test_item` | Create test items |
| `make_purchase_receipt()` | `erpnext.stock.doctype.purchase_receipt.test_purchase_receipt` | Create purchase receipts |
| `make_sales_invoice()` | `erpnext.accounts.doctype.sales_invoice.test_sales_invoice` | Create sales invoices |
| `make_stock_entry()` | `erpnext.stock.doctype.stock_entry.test_stock_entry` | Create stock entries |
| `make_purchase_order()` | `erpnext.buying.doctype.purchase_order.test_purchase_order` | Create purchase orders |
| `make_sales_order()` | `erpnext.selling.doctype.sales_order.test_sales_order` | Create sales orders |
| `make_delivery_note()` | `erpnext.stock.doctype.delivery_note.test_delivery_note` | Create delivery notes |
| `make_journal_entry()` | `erpnext.accounts.doctype.journal_entry.test_journal_entry` | Create journal entries |
| `make_payment_entry()` | `erpnext.accounts.doctype.payment_entry.test_payment_entry` | Create payment entries |
| `make_serial_batch_bundle()` | `erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle` | Create serial/batch bundles |
| `make_employee()` | `erpnext.setup.doctype.employee.test_employee` | **Create test employees (MOST IMPORTANT!)** |

### Common Factory Functions in HRMS

| Function | Location | Purpose |
|----------|----------|---------|
| `make_employee_salary_slip()` | `hrms.payroll.doctype.salary_slip.test_salary_slip` | Create salary slips |
| `make_salary_structure()` | `hrms.payroll.doctype.salary_structure.test_salary_structure` | Create salary structures |
| `make_leave_application()` | `hrms.hr.doctype.leave_application.test_leave_application` | Create leave applications |
| `make_holiday_list()` | `hrms.payroll.doctype.salary_slip.test_salary_slip` | Create holiday lists |
| `make_payroll_period()` | `hrms.payroll.doctype.salary_slip.test_salary_slip` | Create payroll periods |
| `make_shift_assignment()` | `hrms.hr.doctype.shift_type.test_shift_type` | Create shift assignments |
| `make_shift_request()` | `hrms.hr.doctype.shift_request.test_shift_request` | Create shift requests |
| `make_expense_claim()` | `hrms.hr.doctype.expense_claim.test_expense_claim` | Create expense claims |
| `make_employee_advance()` | `hrms.hr.doctype.employee_advance.test_employee_advance` | Create employee advances |

---

## Test Setup and Teardown Patterns

### Class-Level Setup (setUpClass)

Use `setUpClass` for expensive operations that can be shared across all tests in a class:

```python
class TestMyDocType(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # Create shared test data
        cls.company = create_company()
        cls.customer = create_customer()
        frappe.db.commit()  # Commit for sharing across tests
    
    def test_one(self):
        # Use cls.company and cls.customer
        pass
    
    def test_two(self):
        # Reuse cls.company and cls.customer
        pass
```

### Method-Level Setup (setUp)

Use `setUp` for per-test setup that needs to be fresh for each test:

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Create fresh test data for each test
        self.test_doc = make_test_document()
    
    def test_one(self):
        # Use self.test_doc
        pass
    
    def test_two(self):
        # Use self.test_doc (fresh instance)
        pass
```

### Cleanup Patterns

```python
class TestMyDocType(FrappeTestCase):
    def setUp(self):
        super().setUp()
        # Clean up before test
        frappe.db.delete("MyDocType", {"name": ["like", "_Test%"]})
        frappe.db.commit()
    
    def tearDown(self):
        # Clean up after test (usually not needed due to auto-rollback)
        frappe.db.rollback()
        super().tearDown()
```

### before_tests Hook

Use `before_tests` hook for global test setup:

```python
# In your_app/your_app/tests/__init__.py or hooks.py
def before_tests():
    frappe.clear_cache()
    
    # Setup if missing
    if not frappe.db.a_row_exists("Company"):
        setup_complete({...})
    
    # Set defaults
    set_defaults_for_tests()
    frappe.db.commit()
```

---

## Helper Utilities

### Date Utilities

```python
from frappe.utils import (
    add_days,
    add_months,
    get_first_day,
    get_last_day,
    get_year_start,
    get_year_ending,
    getdate,
    nowdate,
    today,
)

# Get first Sunday of month (HRMS pattern)
def get_first_sunday(holiday_list="Salary Slip Test Holiday List", for_date=None):
    date = for_date or getdate()
    month_start_date = get_first_day(date)
    month_end_date = get_last_day(date)
    
    first_sunday = frappe.db.sql(
        """
        select holiday_date from `tabHoliday`
        where parent = %s
            and holiday_date between %s and %s
        order by holiday_date
        """,
        (holiday_list, month_start_date, month_end_date),
    )[0][0]
    
    return first_sunday
```

### Company Utilities

```python
def create_company(name="_Test Company", is_group=0, parent_company=None):
    """Create a test company"""
    if frappe.db.exists("Company", name):
        return frappe.get_doc("Company", name)
    
    return frappe.get_doc({
        "doctype": "Company",
        "company_name": name,
        "default_currency": "INR",
        "country": "India",
        "is_group": is_group,
        "parent_company": parent_company,
    }).insert()
```

### Department Utilities

```python
def create_department(name, company="_Test Company"):
    """Create a test department"""
    from erpnext.setup.doctype.department.department import get_abbreviated_name
    
    docname = get_abbreviated_name(name, company)
    
    if frappe.db.exists("Department", docname):
        return docname
    
    department = frappe.new_doc("Department")
    department.update({
        "doctype": "Department",
        "department_name": name,
        "company": company
    })
    department.insert()
    return department.name
```

### Email Utilities

```python
def get_email_by_subject(subject):
    """Get email by subject from Email Queue"""
    return frappe.db.exists("Email Queue", {"message": ("like", f"%{subject}%")})
```

### Holiday List Utilities

```python
def add_date_to_holiday_list(date, holiday_list):
    """Add a date to holiday list"""
    if frappe.db.exists("Holiday", {"parent": holiday_list, "holiday_date": date}):
        return
    
    holiday_list_doc = frappe.get_doc("Holiday List", holiday_list)
    holiday_list_doc.append("holidays", {
        "holiday_date": date,
        "description": "test",
    })
    holiday_list_doc.save()
```

---

## Assertion Helpers

### Stock Ledger Entry Assertions

```python
class StockTestMixin:
    """Mixin for stock ledger tests"""
    
    def assertSLEs(self, doc, expected_sles, sle_filters=None):
        """Compare sorted Stock Ledger Entries"""
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
                act_value = act_sle[k]
                if k == "stock_queue":
                    act_value = json.loads(act_value)
                    if act_value and act_value[0][0] == 0:
                        continue
                
                self.assertEqual(v, act_value, msg=f"{k} doesn't match")
```

### GL Entry Assertions

```python
def assertGLEs(self, doc, expected_gles, gle_filters=None, order_by=None):
    """Compare General Ledger Entries"""
    filters = {
        "voucher_no": doc.name,
        "voucher_type": doc.doctype,
        "is_cancelled": 0
    }
    
    if gle_filters:
        filters.update(gle_filters)
    
    actual_gles = frappe.get_all(
        "GL Entry",
        fields=["*"],
        filters=filters,
        order_by=order_by or "posting_date, creation",
    )
    
    self.assertGreaterEqual(len(actual_gles), len(expected_gles))
    
    for exp_gle, act_gle in zip(expected_gles, actual_gles, strict=False):
        for k, exp_value in exp_gle.items():
            act_value = act_gle[k]
            self.assertEqual(exp_value, act_value, msg=f"{k} doesn't match")
```

### Usage Example

```python
class TestStockEntry(FrappeTestCase, StockTestMixin):
    def test_stock_entry_sle(self):
        se = make_stock_entry(
            item_code="_Test Item",
            qty=10,
            source="_Test Warehouse - _TC",
            target="_Test Warehouse 1 - _TC"
        )
        
        expected_sles = [
            {
                "item_code": "_Test Item",
                "warehouse": "_Test Warehouse - _TC",
                "actual_qty": -10,
            },
            {
                "item_code": "_Test Item",
                "warehouse": "_Test Warehouse 1 - _TC",
                "actual_qty": 10,
            },
        ]
        
        self.assertSLEs(se, expected_sles)
```

---

## Test Mixins

### StockTestMixin

```python
class StockTestMixin:
    """Mixin to simplify stock ledger tests"""
    
    def make_item(self, item_code=None, properties=None, *args, **kwargs):
        """Helper to create items"""
        from erpnext.stock.doctype.item.test_item import make_item
        return make_item(item_code, properties, *args, **kwargs)
    
    def assertSLEs(self, doc, expected_sles, sle_filters=None):
        """Assert Stock Ledger Entries"""
        # ... implementation
    
    def assertGLEs(self, doc, expected_gles, gle_filters=None, order_by=None):
        """Assert GL Entries"""
        # ... implementation
```

### Usage

```python
class TestMyStockDocType(FrappeTestCase, StockTestMixin):
    def test_stock_transaction(self):
        item = self.make_item()
        # Use self.assertSLEs() and self.assertGLEs()
```

---

## Common Test Patterns

### Pattern 1: Testing Document Lifecycle

```python
def test_document_lifecycle(self):
    # Create
    doc = make_test_document()
    self.assertEqual(doc.status, "Draft")
    
    # Submit
    doc.submit()
    self.assertEqual(doc.status, "Submitted")
    
    # Cancel
    doc.cancel()
    self.assertEqual(doc.status, "Cancelled")
```

### Pattern 2: Testing with Multiple Items

```python
def test_multiple_items(self):
    doc = make_test_document(do_not_save=True)
    
    # Add multiple items
    for i in range(3):
        doc.append("items", {
            "item_code": f"_Test Item {i}",
            "qty": 10,
            "rate": 100
        })
    
    doc.insert()
    self.assertEqual(len(doc.items), 3)
```

### Pattern 3: Testing Validation

```python
def test_validation(self):
    doc = make_test_document(do_not_save=True)
    doc.required_field = None  # Set invalid value
    
    with self.assertRaises(frappe.ValidationError) as cm:
        doc.save()
    
    self.assertIn("required", str(cm.exception))
```

### Pattern 4: Testing Permissions

```python
def test_permissions(self):
    doc = make_test_document()
    
    # Test as different user
    with self.set_user("test@example.com"):
        doc = frappe.get_doc("MyDocType", doc.name)
        self.assertTrue(doc.has_permission("read"))
        self.assertFalse(doc.has_permission("write"))
```

### Pattern 5: Testing Calculations

```python
def test_calculations(self):
    doc = make_test_document(
        items=[
            {"item_code": "_Test Item", "qty": 10, "rate": 100},
            {"item_code": "_Test Item 2", "qty": 5, "rate": 50}
        ]
    )
    
    expected_total = (10 * 100) + (5 * 50)
    self.assertEqual(doc.total, expected_total)
```

### Pattern 6: Testing Workflow

```python
def test_workflow(self):
    doc = make_test_document()
    doc.submit()
    
    # Test workflow transition
    doc.status = "Approved"
    doc.save()
    
    self.assertEqual(doc.status, "Approved")
```

### Pattern 7: Testing with Settings

```python
@change_settings("Accounts Settings", {"allow_negative_stock": 1})
def test_with_settings(self):
    # Test with specific settings
    doc = make_test_document()
    # ... test logic
```

### Pattern 8: Testing Date-Based Logic

```python
def test_date_based_logic(self):
    from frappe.utils import add_days, getdate
    
    today = getdate()
    future_date = add_days(today, 30)
    
    doc = make_test_document(posting_date=future_date)
    # ... test date-based logic
```

### Pattern 9: Testing Serial/Batch Numbers

```python
def test_serial_batch(self):
    from erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle import (
        make_serial_batch_bundle
    )
    
    bundle = make_serial_batch_bundle({
        "item_code": "_Test Serial Item",
        "warehouse": "_Test Warehouse - _TC",
        "qty": 5,
        "serial_nos": ["SN001", "SN002", "SN003", "SN004", "SN005"],
        "voucher_type": "Stock Entry",
        "posting_date": today(),
    })
    
    doc = make_stock_entry(
        item_code="_Test Serial Item",
        serial_and_batch_bundle=bundle.name
    )
```

### Pattern 10: Testing Multi-Company

```python
def test_multi_company(self):
    company1 = create_company("_Test Company 1", abbr="_TC1")
    company2 = create_company("_Test Company 2", abbr="_TC2")
    
    doc1 = make_test_document(company=company1.name)
    doc2 = make_test_document(company=company2.name)
    
    # Test company-specific logic
```

---

## Best Practices

### 1. Use Factory Functions

**Good**:
```python
def test_something(self):
    pr = make_purchase_receipt(qty=10)
    # Test logic
```

**Bad**:
```python
def test_something(self):
    pr = frappe.new_doc("Purchase Receipt")
    pr.company = "_Test Company"
    pr.supplier = "_Test Supplier"
    pr.posting_date = today()
    pr.append("items", {
        "item_code": "_Test Item",
        "qty": 10,
        "rate": 50
    })
    pr.insert()
    pr.submit()
    # Test logic
```

### 2. Use Descriptive Test Names

**Good**:
```python
def test_purchase_receipt_creates_stock_ledger_entry(self):
    pass
```

**Bad**:
```python
def test_pr(self):
    pass
```

### 3. Clean Up in setUp

```python
def setUp(self):
    super().setUp()
    # Clean up before test
    frappe.db.delete("MyDocType", {"name": ["like", "_Test%"]})
    frappe.db.commit()
```

### 4. Use do_not_save for Validation Tests

```python
def test_validation(self):
    doc = make_test_document(do_not_save=True)
    doc.required_field = None
    
    with self.assertRaises(frappe.ValidationError):
        doc.save()
```

### 5. Use change_settings Decorator

```python
@change_settings("Accounts Settings", {"allow_negative_stock": 1})
def test_with_settings(self):
    # Test logic
```

### 6. Test Edge Cases

```python
def test_zero_quantity(self):
    with self.assertRaises(InvalidQtyError):
        make_purchase_receipt(qty=0)
```

### 7. Use Assertion Helpers

```python
def test_stock_entry(self):
    se = make_stock_entry(...)
    expected_sles = [...]
    self.assertSLEs(se, expected_sles)
```

### 8. Document Complex Tests

```python
def test_complex_calculation(self):
    """
    Test that complex calculation works correctly:
    1. Creates invoice with multiple items
    2. Applies discount
    3. Calculates tax
    4. Verifies final amount
    """
    # Test implementation
```

### 9. Use setUpClass for Expensive Operations

```python
@classmethod
def setUpClass(cls):
    super().setUpClass()
    # Create expensive test data once
    cls.company = create_company_with_all_setup()
    frappe.db.commit()
```

### 10. Test Both Positive and Negative Cases

```python
def test_positive_case(self):
    # Test normal flow
    pass

def test_negative_case(self):
    # Test error cases
    with self.assertRaises(ValidationError):
        # Invalid operation
        pass
```

---

## HRMS Factory Functions Reference

### Payroll Module

```python
# Holiday List
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_holiday_list
holiday_list = make_holiday_list("Test Holiday List", from_date="2024-01-01", to_date="2024-12-31")

# Payroll Period
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_payroll_period
payroll_period = make_payroll_period()

# Leave Application
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_leave_application
leave_app = make_leave_application(employee="EMP-00001", from_date="2024-01-01", to_date="2024-01-05", leave_type="Annual Leave")

# Expense Claim
from hrms.hr.doctype.expense_claim.test_expense_claim import make_expense_claim
expense_claim = make_expense_claim(employee="EMP-00001", company="_Test Company", posting_date="2024-01-15")

# Employee Advance
from hrms.hr.doctype.employee_advance.test_employee_advance import make_employee_advance
advance = make_employee_advance(employee="EMP-00001", amount=5000)

# Shift Assignment
from hrms.hr.doctype.shift_type.test_shift_type import make_shift_assignment
shift_assignment = make_shift_assignment(employee="EMP-00001", shift_type="Day Shift", start_date="2024-01-01")

# Shift Request
from hrms.hr.doctype.shift_request.test_shift_request import make_shift_request
shift_request = make_shift_request(employee="EMP-00001", shift_type="Night Shift", from_date="2024-01-01", to_date="2024-01-07")

# Vehicle Log
from hrms.hr.doctype.vehicle_log.test_vehicle_log import make_vehicle_log
vehicle_log = make_vehicle_log(license_plate="ABC-123", employee_id="EMP-00001", with_services=True)

# Job Requisition
from hrms.hr.doctype.job_requisition.test_job_requisition import make_job_requisition
job_req = make_job_requisition(designation="Engineer", no_of_positions=2)

# Job Offer
from hrms.hr.doctype.job_offer.test_job_offer import create_job_offer
job_offer = create_job_offer(job_applicant="APP-00001", offer_date="2024-01-15")

# Leave Allocation
from hrms.hr.doctype.leave_allocation.test_leave_allocation import create_leave_allocation
allocation = create_leave_allocation(employee="EMP-00001", leave_type="Annual Leave", from_date="2024-01-01", to_date="2024-12-31", new_leaves_allocated=20)

# Leave Type
from hrms.hr.doctype.leave_type.test_leave_type import create_leave_type
leave_type = create_leave_type(leave_type_name="Test Leave", include_holiday=True)

# Leave Policy
from hrms.hr.doctype.leave_policy.test_leave_policy import create_leave_policy
leave_policy = create_leave_policy(policy_name="Test Policy", leave_type="Annual Leave", annual_allocation=20)

# Leave Period
from hrms.hr.doctype.leave_period.test_leave_period import create_leave_period
leave_period = create_leave_period(from_date="2024-01-01", to_date="2024-12-31", company="_Test Company")

# Leave Encashment
from hrms.hr.doctype.leave_encashment.test_leave_encashment import create_leave_encashment
encashment = create_leave_encashment(employee="EMP-00001", leave_type="Annual Leave", encashment_date="2024-12-31")

# Training Program
from hrms.hr.doctype.training_event.test_training_event import create_training_program
training_program = create_training_program("Python Training")

# Training Event
from hrms.hr.doctype.training_event.test_training_event import create_training_event
training_event = create_training_event(attendees=["EMP-00001", "EMP-00002"])

# Training Feedback
from hrms.hr.doctype.training_feedback.test_training_feedback import create_training_feedback
feedback = create_training_feedback(event="TRAIN-00001", employee="EMP-00001")

# Interview
from hrms.hr.doctype.interview.test_interview import create_interview_and_dependencies
interview = create_interview_and_dependencies(job_applicant="APP-00001", scheduled_on="2024-01-15 10:00:00")

# Interview Round
from hrms.hr.doctype.interview.test_interview import create_interview_round
interview_round = create_interview_round(name="Technical Round", skill_set=["Python", "Django"])

# Interview Feedback
from hrms.hr.doctype.interview_feedback.test_interview_feedback import create_interview_feedback
interview_feedback = create_interview_feedback(interview="INT-00001", interviewer="EMP-00001", skills_ratings={"Python": 5})

# Gratuity
from hrms.payroll.doctype.gratuity.test_gratuity import create_gratuity
gratuity = create_gratuity(employee="EMP-00001", posting_date="2024-01-15")

# Employee Tax Exemption Declaration
from hrms.payroll.doctype.employee_tax_exemption_declaration.test_employee_tax_exemption_declaration import create_exemption_declaration
declaration = create_exemption_declaration(employee="EMP-00001", payroll_period="2024-2025")

# Employee Tax Exemption Proof Submission
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_proof_submission
proof = create_proof_submission(employee="EMP-00001", payroll_period="2024-2025", amount=50000)

# Employee Benefit Application
from hrms.payroll.doctype.employee_benefit_application.test_employee_benefit_application import make_employee_benefit_application
benefit_app = make_employee_benefit_application(employee="EMP-00001", payroll_period="2024-2025", date="2024-01-15")

# Employee Benefit Claim
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_benefit_claim
benefit_claim = create_benefit_claim(employee="EMP-00001", payroll_period="2024-2025", amount=10000, component="Medical Allowance")

# Additional Salary
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_additional_salary
additional_salary = create_additional_salary(employee="EMP-00001", payroll_period="2024-2025", amount=5000)

# Recurring Additional Salary
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_recurring_additional_salary
recurring_salary = create_recurring_additional_salary(employee="EMP-00001", salary_component="Bonus", amount=1000, from_date="2024-01-01", to_date="2024-12-31")

# Employee Other Income
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_employee_other_income
other_income = create_employee_other_income(employee="EMP-00001", payroll_period="2024-2025", company="_Test Company")

# Tax Slab
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_tax_slab
tax_slab = create_tax_slab(payroll_period="2024-2025", effective_date="2024-01-01")

# Salary Withholding
from hrms.payroll.doctype.salary_withholding.test_salary_withholding import create_salary_withholding
withholding = create_salary_withholding(employee="EMP-00001", from_date="2024-01-01", number_of_withholding_cycles=3)

# Payroll Entry
from hrms.payroll.doctype.payroll_entry.test_payroll_entry import make_payroll_entry
payroll_entry = make_payroll_entry(company="_Test Company", posting_date="2024-01-15", payment_date="2024-01-20")

# Shift Schedule Assignment
from hrms.hr.doctype.shift_assignment_tool.test_shift_assignment_tool import make_shift_schedule_assignment
schedule_assignment = make_shift_schedule_assignment(schedule="Schedule 1", employee="EMP-00001", create_shifts_after="2024-01-01")

# Employee Checkin
from hrms.hr.doctype.employee_checkin.test_employee_checkin import make_checkin
checkin = make_checkin(employee="EMP-00001", time="2024-01-15 09:00:00", log_type="IN")

# Multiple Checkins
from hrms.hr.doctype.employee_checkin.test_employee_checkin import make_n_checkins
checkins = make_n_checkins(employee="EMP-00001", n=5, hours_to_reverse=1)

# Shift Location
from hrms.hr.doctype.employee_checkin.test_employee_checkin import make_shift_location
location = make_shift_location(location_name="Office", latitude=28.6139, longitude=77.2090, checkin_radius=500)
```

### ERPNext Setup Functions

```python
# Employee (CRITICAL - Most commonly used!)
from erpnext.setup.doctype.employee.test_employee import make_employee
employee = make_employee("test@example.com", company="_Test Company", designation="Engineer", department="IT")

# Customer
from erpnext.selling.doctype.customer.test_customer import get_customer_dict, create_customer
customer = create_customer(customer_name="_Test Customer", customer_group="All Customer Groups")

# Supplier
from erpnext.buying.doctype.supplier.test_supplier import create_supplier
supplier = create_supplier(supplier_name="_Test Supplier", supplier_group="Local")

# Company
from erpnext.accounts.doctype.opening_invoice_creation_tool.test_opening_invoice_creation_tool import make_company
company = make_company(company_name="_Test Company", abbr="_TC")

# Account
from erpnext.accounts.doctype.account.test_account import create_account, get_inventory_account
account = create_account(account_name="_Test Account", company="_Test Company", parent_account="Accounts Receivable - _TC")

# Warehouse
from erpnext.stock.doctype.warehouse.test_warehouse import create_warehouse
warehouse = create_warehouse(warehouse_name="_Test Warehouse", company="_Test Company")

# Item Group
from erpnext.stock.doctype.item_group.test_item_group import make_item_group
item_group = make_item_group(item_group_name="_Test Item Group", parent_item_group="All Item Groups")

# Brand
from erpnext.stock.doctype.brand.test_brand import make_brand
brand = make_brand(brand_name="_Test Brand")

# UOM
from erpnext.stock.doctype.uom.test_uom import make_uom
uom = make_uom(uom_name="_Test UOM")

# Designation
from erpnext.setup.doctype.designation.test_designation import create_designation
designation = create_designation(designation_name="Engineer")

# Department
from hrms.tests.test_utils import create_department
department = create_department("IT", company="_Test Company")

# Employee Grade
from hrms.tests.test_utils import create_employee_grade
employee_grade = create_employee_grade("Senior", default_base=100000)

# Job Applicant
from hrms.tests.test_utils import create_job_applicant
job_applicant = create_job_applicant(applicant_name="John Doe", email_id="john@example.com")

# Mode of Payment
from erpnext.accounts.doctype.mode_of_payment.test_mode_of_payment import set_default_account_for_mode_of_payment
set_default_account_for_mode_of_payment(mode_of_payment, company, account)

# POS Profile
from erpnext.accounts.doctype.pos_profile.test_pos_profile import make_pos_profile
pos_profile = make_pos_profile(company="_Test Company", warehouse="_Test Warehouse - _TC")

# Payment Terms Template
from erpnext.accounts.doctype.payment_entry.test_payment_entry import create_payment_term
payment_term = create_payment_term("_Test Payment Term")

# Pricing Rule
from erpnext.accounts.doctype.pricing_rule.test_pricing_rule import make_pricing_rule
pricing_rule = make_pricing_rule(applicable_for="Item", item_code="_Test Item", selling=1, buying=0, price_or_discount="Price", rate=100)

# Item Price
from erpnext.accounts.doctype.pricing_rule.test_pricing_rule import make_item_price
item_price = make_item_price(item="_Test Item", price_list_name="_Test Price List", item_price=100)

# Budget
from erpnext.accounts.doctype.budget.test_budget import make_budget
budget = make_budget(budget_against="Cost Center", cost_center="_Test Cost Center - _TC", fiscal_year="2024-2025", company="_Test Company")

# Cost Center
from erpnext.accounts.doctype.cost_center.test_cost_center import create_cost_center
cost_center = create_cost_center(cost_center_name="_Test Cost Center", company="_Test Company")

# Project
from erpnext.projects.doctype.project.test_project import make_project
project = make_project({"project_name": "_Test Project", "company": "_Test Company"})

# BOM
from erpnext.manufacturing.doctype.bom.test_bom import make_bom
bom = make_bom(item="_Test Item", quantity=1, raw_materials=[{"item_code": "_Test Raw Material", "qty": 2}])

# Work Order
from erpnext.manufacturing.doctype.work_order.test_work_order import make_wo_order_test_record
work_order = make_wo_order_test_record(item="_Test Item", qty=10, company="_Test Company")

# Operation
from erpnext.manufacturing.doctype.work_order.test_work_order import make_operation
operation = make_operation(operation_name="Cutting", workcenter="_Test Work Center")

# Workstation
from erpnext.manufacturing.doctype.work_order.test_work_order import make_workstation
workstation = make_workstation(workstation_name="_Test Workstation", company="_Test Company")

# Lead
from erpnext.crm.doctype.lead.test_lead import make_lead
lead = make_lead(first_name="John", company_name="Test Company", email_id="john@example.com")

# Opportunity
from erpnext.crm.doctype.opportunity.test_opportunity import make_opportunity
opportunity = make_opportunity(customer="_Test Customer", opportunity_type="Sales", company="_Test Company")

# Prospect
from erpnext.crm.doctype.prospect.test_prospect import make_prospect
prospect = make_prospect(company_name="Test Company", email_id="test@example.com")

# Issue
from erpnext.support.doctype.issue.test_issue import make_issue
issue = make_issue(customer="_Test Customer", priority="High", issue_type="Bug")

# Service Level Agreement
from erpnext.support.doctype.service_level_agreement.test_service_level_agreement import make_holiday_list
holiday_list = make_holiday_list()

# Asset
from erpnext.assets.doctype.asset.test_asset import create_asset, create_asset_data
asset = create_asset(item_code="_Test Asset Item", company="_Test Company", location="Test Location")

# Asset Movement
from erpnext.assets.doctype.asset_movement.test_asset_movement import create_asset_movement
asset_movement = create_asset_movement(assets=["AST-00001"], purpose="Transfer", company="_Test Company")

# Asset Value Adjustment
from erpnext.assets.doctype.asset_value_adjustment.test_asset_value_adjustment import make_asset_value_adjustment
adjustment = make_asset_value_adjustment(asset="AST-00001", company="_Test Company", current_value=100000)

# Asset Repair
from erpnext.assets.doctype.asset_repair.test_asset_repair import create_asset_repair
asset_repair = create_asset_repair(asset="AST-00001", company="_Test Company", failure_date="2024-01-15")

# Location
from erpnext.assets.doctype.asset_movement.test_asset_movement import make_location
location = make_location()

# Serial Batch Bundle
from erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle import (
    make_serial_batch_bundle,
    get_serial_nos_from_bundle,
    get_batch_from_bundle
)
bundle = make_serial_batch_bundle({
    "item_code": "_Test Serial Item",
    "warehouse": "_Test Warehouse - _TC",
    "qty": 5,
    "serial_nos": ["SN001", "SN002", "SN003", "SN004", "SN005"],
    "voucher_type": "Stock Entry",
    "posting_date": today(),
    "do_not_submit": 1
})

# Batch
from erpnext.stock.doctype.batch.test_batch import make_new_batch, create_batch
batch = make_new_batch(item_code="_Test Batch Item", batch_id="BATCH-001")

# Serialized Item
from erpnext.stock.doctype.stock_entry.test_stock_entry import make_serialized_item
serialized_item = make_serialized_item(item_code="_Test Serial Item", warehouse="_Test Warehouse - _TC")

# Inventory Dimension
from erpnext.stock.doctype.inventory_dimension.test_inventory_dimension import create_inventory_dimension, create_store_dimension
dimension = create_inventory_dimension(dimension_name="Store", reference_document="Store")

# Stock Reconciliation
from erpnext.stock.doctype.stock_reconciliation.test_stock_reconciliation import create_stock_reconciliation
stock_reco = create_stock_reconciliation(item_code="_Test Item", warehouse="_Test Warehouse - _TC", qty=100, rate=50)

# Material Request
from erpnext.stock.doctype.material_request.test_material_request import make_material_request
material_request = make_material_request(item_code="_Test Item", qty=10, company="_Test Company")

# Pick List
from erpnext.stock.doctype.pick_list.test_pick_list import create_pick_list
pick_list = create_pick_list(sales_order="SO-00001")

# Delivery Trip
from erpnext.stock.doctype.delivery_trip.test_delivery_trip import make_delivery_trip
delivery_trip = make_delivery_trip(customer="_Test Customer", company="_Test Company")

# Shipment
from erpnext.stock.doctype.shipment.test_shipment import make_shipment
shipment = make_shipment(item_code="_Test Item", qty=10, company="_Test Company")

# Quality Inspection
from erpnext.stock.doctype.quality_inspection.test_quality_inspection import make_quality_inspection
quality_inspection = make_quality_inspection(item_code="_Test Item", inspection_type="Incoming", company="_Test Company")

# Subcontracting Receipt
from erpnext.subcontracting.doctype.subcontracting_receipt.test_subcontracting_receipt import make_return_subcontracting_receipt
subcontracting_receipt = make_return_subcontracting_receipt(company="_Test Company", supplier="_Test Supplier")

# Tax Category
from erpnext.accounts.report.tax_withholding_details.test_tax_withholding_details import create_tax_category
tax_category = create_tax_category(category="TCS", rate=0.075, account="TCS - _TC", cumulative_threshold=0)

# Tax Accounts
from erpnext.accounts.report.tax_withholding_details.test_tax_withholding_details import create_tax_accounts
create_tax_accounts()

# Contact and Address
from erpnext.tests.utils import create_test_contact_and_address
create_test_contact_and_address()
```

---

## Additional Utility Functions

### Stock Utilities

```python
# Get Stock Balance
from erpnext.stock.utils import get_stock_balance
balance = get_stock_balance(item_code="_Test Item", warehouse="_Test Warehouse - _TC")

# Get Incoming Rate
from erpnext.stock.utils import get_incoming_rate
rate = get_incoming_rate(item_code="_Test Item", warehouse="_Test Warehouse - _TC", posting_date="2024-01-15")

# Get Qty After Transaction
from erpnext.stock.doctype.stock_entry.test_stock_entry import get_qty_after_transaction
qty = get_qty_after_transaction(item_code="_Test Item", warehouse="_Test Warehouse - _TC")

# Scan Barcode
from erpnext.stock.utils import scan_barcode
barcode_result = scan_barcode("12399")
```

### Accounts Utilities

```python
# Get GL Entries
def get_gl_entries(voucher_type, voucher_no):
    return frappe.get_all(
        "GL Entry",
        filters={"voucher_type": voucher_type, "voucher_no": voucher_no, "is_cancelled": 0},
        fields=["*"],
        order_by="posting_date, creation"
    )

# Check GL Entries
from erpnext.accounts.doctype.sales_invoice.test_sales_invoice import check_gl_entries
check_gl_entries(doc, voucher_no, expected_gle, posting_date, voucher_type="Sales Invoice")

# Get Inventory Account
from erpnext.accounts.doctype.account.test_account import get_inventory_account
inventory_account = get_inventory_account("_Test Item", "_Test Company", "_Test Warehouse - _TC")
```

### Date and Time Utilities

```python
from frappe.utils import (
    add_days,
    add_months,
    add_years,
    get_first_day,
    get_last_day,
    get_year_start,
    get_year_ending,
    getdate,
    nowdate,
    today,
    get_datetime,
    now_datetime,
    format_date,
    format_datetime,
    date_diff,
    time_diff,
    get_first_day_of_week,
    get_last_day_of_week,
    get_quarter_start,
    get_quarter_ending,
    get_fiscal_year,
    get_fiscal_year_start_date,
    get_fiscal_year_end_date,
)

# Get First Sunday (HRMS pattern)
from hrms.tests.test_utils import get_first_sunday
first_sunday = get_first_sunday(holiday_list="Salary Slip Test Holiday List", for_date=getdate())

# Get First Day for Previous Month
from hrms.tests.test_utils import get_first_day_for_prev_month
prev_month_first = get_first_day_for_prev_month()
```

### Attendance Utilities

```python
# Mark Attendance
from hrms.hr.doctype.attendance.attendance import mark_attendance
mark_attendance(employee="EMP-00001", attendance_date="2024-01-15", status="Present", ignore_validate=True)

# Mark Attendance with Leave Type
mark_attendance(
    employee="EMP-00001",
    attendance_date="2024-01-16",
    status="On Leave",
    leave_type="Annual Leave",
    ignore_validate=True
)

# Mark Half Day
mark_attendance(
    employee="EMP-00001",
    attendance_date="2024-01-17",
    status="Half Day",
    leave_type="Annual Leave",
    half_day_status="Present",
    ignore_validate=True
)
```

### Email Utilities

```python
# Get Email by Subject
from hrms.tests.test_utils import get_email_by_subject
email_id = get_email_by_subject("Salary Slip")

# Create Email Template
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_ss_email_template
create_ss_email_template()
```

### Account Creation Utilities

```python
# Create Account
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_account
account = create_account(account_name="_Test Salary Account", company="_Test Company", parent_account="Expenses - _TC", account_type="Expense")

# Set Salary Component Account
from hrms.payroll.doctype.salary_slip.test_salary_slip import set_salary_component_account
set_salary_component_account(salary_component="Basic Salary", company_list=["_Test Company"])
```

### Leave Utilities

```python
# Create Leave Allocation
from hrms.hr.doctype.leave_allocation.test_leave_allocation import create_leave_allocation
allocation = create_leave_allocation(
    employee="EMP-00001",
    from_date="2024-01-01",
    to_date="2024-12-31",
    new_leaves_allocated=20,
    leave_type="_Test Leave Type"
)

# Make Allocation Record
from hrms.hr.doctype.leave_application.test_leave_application import make_allocation_record
allocation = make_allocation_record(
    leave_type="_Test Leave Type",
    from_date="2024-01-01",
    to_date="2024-12-31",
    leaves=20
)

# Create Carry Forwarded Allocation
from hrms.hr.doctype.leave_application.test_leave_application import create_carry_forwarded_allocation
allocation = create_carry_forwarded_allocation(employee="EMP-00001", leave_type="_Test Leave Type", date="2024-01-01")
```

### Shift Utilities

```python
# Setup Shift Type
from hrms.hr.doctype.shift_type.test_shift_type import setup_shift_type
shift_type = setup_shift_type(
    shift_type="Day Shift",
    start_time="08:00:00",
    end_time="17:00:00",
    working_hours_threshold_for_half_day=4,
    working_hours_threshold_for_absent=2
)

# Make Shift Assignment
from hrms.hr.doctype.shift_type.test_shift_type import make_shift_assignment
shift_assignment = make_shift_assignment(
    employee="EMP-00001",
    shift_type="Day Shift",
    start_date="2024-01-01",
    end_date="2024-12-31"
)
```

### Payroll Utilities

```python
# Make Income Tax Components
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_income_tax_components
make_income_tax_components()

# Make Salary Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_salary_component
salary_component = make_salary_component(salary_components=["Basic Salary", "HRA"], test_tax=True, company_list=["_Test Company"])

# Make Earning Salary Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_earning_salary_component
earning_component = make_earning_salary_component(
    salary_components=["Basic Salary", "HRA"],
    setup=False,
    test_tax=False,
    company_list=["_Test Company"]
)

# Make Deduction Salary Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_deduction_salary_component
deduction_component = make_deduction_salary_component(
    setup=False,
    test_tax=False,
    company_list=["_Test Company"]
)

# Create Salary Component
from hrms.payroll.doctype.salary_component.test_salary_component import create_salary_component
salary_component = create_salary_component(component_name="Basic Salary", type="Earning", is_tax_applicable=1)

# Create Salary Structure Assignment
from hrms.payroll.doctype.salary_structure.test_salary_structure import create_salary_structure_assignment
assignment = create_salary_structure_assignment(
    employee="EMP-00001",
    salary_structure="Test Structure",
    from_date="2024-01-01"
)

# Create Salary Slips for Payroll Period
from hrms.payroll.doctype.salary_slip.test_salary_slip import create_salary_slips_for_payroll_period
salary_slips = create_salary_slips_for_payroll_period(
    employee="EMP-00001",
    payroll_period="2024-2025",
    salary_structure="Test Structure"
)

# Get Tax Paid in Period
from hrms.payroll.doctype.salary_slip.test_salary_slip import get_tax_paid_in_period
tax_paid = get_tax_paid_in_period(employee="EMP-00001")

# Make Salary Structure for Payment Days Based Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_salary_structure_for_payment_days_based_component_dependency
salary_structure = make_salary_structure_for_payment_days_based_component_dependency(test_statistical_comp=False)

# Make Salary Structure for Timesheet
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_salary_structure_for_timesheet
salary_structure = make_salary_structure_for_timesheet(employee="EMP-00001", company="_Test Company")

# Make Salary Structure for Statistical Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_salary_structure_for_statistical_component
salary_structure = make_salary_structure_for_statistical_component(company="_Test Company")

# Make Salary Slip with Non-Taxable Component
from hrms.payroll.doctype.salary_slip.test_salary_slip import make_salary_slip_with_non_taxable_component
salary_slip = make_salary_slip_with_non_taxable_component()
```

### Appraisal Utilities

```python
# Create Appraisal Cycle
from hrms.hr.doctype.appraisal_cycle.test_appraisal_cycle import create_appraisal_cycle
appraisal_cycle = create_appraisal_cycle(
    cycle_name="Annual Appraisal 2024",
    company="_Test Company",
    start_date="2024-01-01",
    end_date="2024-12-31"
)

# Create Appraisal Template
from hrms.hr.doctype.appraisal_template.test_appraisal_template import create_appraisal_template
template = create_appraisal_template(template_name="Engineer Appraisal")

# Create Performance Feedback
from hrms.hr.doctype.employee_performance_feedback.test_employee_performance_feedback import create_performance_feedback
feedback = create_performance_feedback(employee="EMP-00001", review="Good performance")
```

### Interview Utilities

```python
# Create Interview and Dependencies
from hrms.hr.doctype.interview.test_interview import create_interview_and_dependencies
interview = create_interview_and_dependencies(
    job_applicant="APP-00001",
    scheduled_on="2024-01-15 10:00:00",
    interview_round="Technical Round"
)

# Create Interview Round
from hrms.hr.doctype.interview.test_interview import create_interview_round
interview_round = create_interview_round(
    name="Technical Round",
    skill_set=["Python", "Django"],
    interviewers=["EMP-00001"],
    designation="Engineer"
)

# Create Skill Set
from hrms.hr.doctype.interview.test_interview import create_skill_set
skill_set = create_skill_set(skill_set="Technical Skills")

# Create Interview Type
from hrms.hr.doctype.interview.test_interview import create_interview_type
interview_type = create_interview_type(name="Technical Interview")
```

### Exit Management Utilities

```python
# Create Exit Interview
from hrms.hr.report.employee_exits.test_employee_exits import create_exit_interview
exit_interview = create_exit_interview(employee="EMP-00001")

# Create Full and Final Statement
from hrms.hr.report.employee_exits.test_employee_exits import create_full_and_final_statement
fnf = create_full_and_final_statement(employee="EMP-00001")
```

---

## Test Mixins and Helper Classes

### AccountsTestMixin

```python
from erpnext.accounts.test.accounts_mixin import AccountsTestMixin

class TestMyDocType(FrappeTestCase, AccountsTestMixin):
    def setUp(self):
        super().setUp()
        # Use mixin methods
        self.create_customer()
        self.create_supplier()
        self.create_item()
        self.create_company()
    
    def test_something(self):
        # Use self.customer, self.supplier, self.item, self.company
        pass
```

### StockTestMixin

```python
from erpnext.stock.tests.test_utils import StockTestMixin

class TestMyStockDocType(FrappeTestCase, StockTestMixin):
    def test_stock_transaction(self):
        # Use mixin methods
        item = self.make_item()
        
        # Use assertion helpers
        expected_sles = [
            {"item_code": item.name, "warehouse": "_Test Warehouse - _TC", "actual_qty": 10}
        ]
        self.assertSLEs(doc, expected_sles)
        
        expected_gles = [
            {"account": "_Test Account - _TC", "debit": 1000, "credit": 0}
        ]
        self.assertGLEs(doc, expected_gles)
```

---

## Advanced Patterns

### Pattern 1: Testing with Multiple Companies

```python
def test_multi_company(self):
    company1 = create_company("_Test Company 1", abbr="_TC1")
    company2 = create_company("_Test Company 2", abbr="_TC2")
    
    # Create documents for each company
    doc1 = make_test_document(company=company1.name)
    doc2 = make_test_document(company=company2.name)
    
    # Test company-specific logic
    self.assertEqual(doc1.company, company1.name)
    self.assertEqual(doc2.company, company2.name)
```

### Pattern 2: Testing with Serial Numbers

```python
def test_serial_numbers(self):
    from erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle import (
        make_serial_batch_bundle,
        get_serial_nos_from_bundle
    )
    
    # Create serialized item
    item = make_item(properties={"has_serial_no": 1})
    
    # Create bundle with serial numbers
    bundle = make_serial_batch_bundle({
        "item_code": item.name,
        "warehouse": "_Test Warehouse - _TC",
        "qty": 5,
        "serial_nos": ["SN001", "SN002", "SN003", "SN004", "SN005"],
        "voucher_type": "Stock Entry",
        "posting_date": today(),
        "do_not_submit": 1
    })
    
    # Get serial numbers from bundle
    serial_nos = get_serial_nos_from_bundle(bundle.name)
    self.assertEqual(len(serial_nos), 5)
```

### Pattern 3: Testing with Batch Numbers

```python
def test_batch_numbers(self):
    from erpnext.stock.doctype.batch.test_batch import make_new_batch
    from erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle import (
        make_serial_batch_bundle,
        get_batch_from_bundle
    )
    
    # Create batch item
    item = make_item(properties={"has_batch_no": 1, "create_new_batch": 1})
    
    # Create batch
    batch = make_new_batch(item_code=item.name, batch_id="BATCH-001")
    
    # Create bundle with batch
    bundle = make_serial_batch_bundle({
        "item_code": item.name,
        "warehouse": "_Test Warehouse - _TC",
        "qty": 10,
        "batches": {batch.name: 10},
        "voucher_type": "Stock Entry",
        "posting_date": today(),
        "do_not_submit": 1
    })
    
    # Get batch from bundle
    batch_no = get_batch_from_bundle(bundle.name)
    self.assertEqual(batch_no, batch.name)
```

### Pattern 4: Testing Payroll Calculations

```python
def test_payroll_calculations(self):
    # Create employee
    employee = make_employee("test@payroll.com", company="_Test Company")
    
    # Create salary structure
    salary_structure = make_salary_structure(
        "Test Structure",
        "Monthly",
        employee=employee,
        company="_Test Company"
    )
    
    # Create salary slip
    salary_slip = make_employee_salary_slip(employee, "Monthly", salary_structure.name)
    
    # Test calculations
    self.assertEqual(salary_slip.gross_pay, 50000)
    self.assertEqual(salary_slip.total_deduction, 5000)
    self.assertEqual(salary_slip.net_pay, 45000)
```

### Pattern 5: Testing Leave Balance

```python
def test_leave_balance(self):
    # Create employee
    employee = make_employee("test@leave.com", company="_Test Company")
    
    # Create leave allocation
    allocation = create_leave_allocation(
        employee=employee,
        from_date="2024-01-01",
        to_date="2024-12-31",
        new_leaves_allocated=20,
        leave_type="_Test Leave Type"
    )
    allocation.submit()
    
    # Create leave application
    leave_app = make_leave_application(
        employee=employee,
        from_date="2024-01-15",
        to_date="2024-01-20",
        leave_type="_Test Leave Type"
    )
    leave_app.submit()
    
    # Check balance
    from hrms.hr.doctype.leave_application.leave_application import get_leave_balance_on
    balance = get_leave_balance_on(employee, "_Test Leave Type", "2024-01-21")
    self.assertEqual(balance, 15)  # 20 allocated - 5 used
```

### Pattern 6: Testing Attendance Processing

```python
def test_attendance_processing(self):
    # Create employee
    employee = make_employee("test@attendance.com", company="_Test Company")
    
    # Create shift
    shift_type = setup_shift_type(
        shift_type="Day Shift",
        start_time="08:00:00",
        end_time="17:00:00"
    )
    
    # Assign shift
    shift_assignment = make_shift_assignment(
        employee=employee,
        shift_type=shift_type.name,
        start_date="2024-01-01"
    )
    
    # Create checkins
    make_checkin(employee, "2024-01-15 08:00:00", "IN")
    make_checkin(employee, "2024-01-15 17:00:00", "OUT")
    
    # Mark attendance
    mark_attendance(
        employee=employee,
        attendance_date="2024-01-15",
        status="Present"
    )
    
    # Verify attendance
    attendance = frappe.get_doc("Attendance", {
        "employee": employee,
        "attendance_date": "2024-01-15"
    })
    self.assertEqual(attendance.status, "Present")
```

### Pattern 7: Testing Workflow States

```python
def test_workflow_states(self):
    doc = make_test_document()
    
    # Submit to change state
    doc.submit()
    self.assertEqual(doc.workflow_state, "Submitted")
    
    # Approve
    doc.workflow_state = "Approved"
    doc.save()
    self.assertEqual(doc.workflow_state, "Approved")
    
    # Reject
    doc.workflow_state = "Rejected"
    doc.save()
    self.assertEqual(doc.workflow_state, "Rejected")
```

### Pattern 8: Testing with change_settings Decorator

```python
@change_settings("Accounts Settings", {
    "allow_negative_stock": 1,
    "maintain_same_internal_transaction_rate": 1
})
def test_with_settings(self):
    # Test with specific settings enabled
    doc = make_test_document()
    # ... test logic
```

### Pattern 9: Testing Email Notifications

```python
def test_email_notification(self):
    # Create document that triggers email
    doc = make_test_document()
    doc.submit()
    
    # Check if email was sent
    from hrms.tests.test_utils import get_email_by_subject
    email_id = get_email_by_subject("Test Document Notification")
    self.assertIsNotNone(email_id)
    
    # Verify email content
    email = frappe.get_doc("Email Queue", email_id)
    self.assertIn("Test Document", email.message)
```

### Pattern 10: Testing with Time Freezing

```python
def test_with_frozen_time(self):
    from frappe.tests.utils import freeze_time
    
    with freeze_time("2024-01-15 10:00:00"):
        doc = make_test_document()
        self.assertEqual(doc.posting_date, "2024-01-15")
        self.assertEqual(doc.posting_time, "10:00:00")
```

---

## Complete Import Reference

### Most Commonly Used Imports

```python
# Core Frappe
import frappe
from frappe.tests.utils import FrappeTestCase, change_settings
from frappe.utils import (
    add_days, add_months, getdate, nowdate, today,
    get_first_day, get_last_day, flt, cint, cstr
)

# ERPNext Setup (CRITICAL!)
from erpnext.setup.doctype.employee.test_employee import make_employee
from erpnext.setup.doctype.designation.test_designation import create_designation
from hrms.tests.test_utils import create_company, create_department, create_employee_grade

# ERPNext Stock
from erpnext.stock.doctype.item.test_item import make_item, create_item
from erpnext.stock.doctype.purchase_receipt.test_purchase_receipt import make_purchase_receipt
from erpnext.stock.doctype.stock_entry.test_stock_entry import make_stock_entry
from erpnext.stock.doctype.delivery_note.test_delivery_note import make_delivery_note
from erpnext.stock.doctype.serial_and_batch_bundle.test_serial_and_batch_bundle import (
    make_serial_batch_bundle,
    get_serial_nos_from_bundle,
    get_batch_from_bundle
)

# ERPNext Accounts
from erpnext.accounts.doctype.sales_invoice.test_sales_invoice import create_sales_invoice
from erpnext.accounts.doctype.purchase_invoice.test_purchase_invoice import make_purchase_invoice
from erpnext.accounts.doctype.journal_entry.test_journal_entry import make_journal_entry
from erpnext.accounts.doctype.payment_entry.test_payment_entry import create_payment_entry
from erpnext.accounts.doctype.account.test_account import create_account, get_inventory_account

# ERPNext Buying
from erpnext.buying.doctype.purchase_order.test_purchase_order import make_purchase_order
from erpnext.buying.doctype.supplier.test_supplier import create_supplier

# ERPNext Selling
from erpnext.selling.doctype.sales_order.test_sales_order import make_sales_order
from erpnext.selling.doctype.customer.test_customer import get_customer_dict, create_customer

# HRMS Payroll
from hrms.payroll.doctype.salary_slip.test_salary_slip import (
    make_employee_salary_slip,
    make_holiday_list,
    make_payroll_period,
    make_leave_application,
    make_salary_component,
    make_earning_salary_component,
    make_deduction_salary_component
)
from hrms.payroll.doctype.salary_structure.test_salary_structure import (
    make_salary_structure,
    create_salary_structure_assignment
)

# HRMS HR
from hrms.hr.doctype.leave_application.test_leave_application import make_leave_application
from hrms.hr.doctype.leave_allocation.test_leave_allocation import create_leave_allocation
from hrms.hr.doctype.leave_type.test_leave_type import create_leave_type
from hrms.hr.doctype.shift_type.test_shift_type import setup_shift_type, make_shift_assignment
from hrms.hr.doctype.expense_claim.test_expense_claim import make_expense_claim
from hrms.hr.doctype.employee_advance.test_employee_advance import make_employee_advance
from hrms.hr.doctype.attendance.attendance import mark_attendance

# HRMS Utilities
from hrms.tests.test_utils import (
    create_company,
    create_department,
    create_employee_grade,
    create_job_applicant,
    get_first_sunday,
    get_email_by_subject
)

# Test Mixins
from erpnext.accounts.test.accounts_mixin import AccountsTestMixin
from erpnext.stock.tests.test_utils import StockTestMixin
```

---

## Quick Reference Cheat Sheet

### Top 20 Most Used Functions

1. **`make_employee()`** - Create test employee
2. **`make_item()`** - Create test item
3. **`make_purchase_receipt()`** - Create purchase receipt
4. **`make_sales_invoice()`** - Create sales invoice
5. **`make_stock_entry()`** - Create stock entry
6. **`make_employee_salary_slip()`** - Create salary slip
7. **`make_salary_structure()`** - Create salary structure
8. **`create_company()`** - Create test company
9. **`create_customer()`** - Create test customer
10. **`create_supplier()`** - Create test supplier
11. **`make_leave_application()`** - Create leave application
12. **`create_leave_allocation()`** - Create leave allocation
13. **`mark_attendance()`** - Mark employee attendance
14. **`make_expense_claim()`** - Create expense claim
15. **`make_holiday_list()`** - Create holiday list
16. **`make_payroll_period()`** - Create payroll period
17. **`make_serial_batch_bundle()`** - Create serial/batch bundle
18. **`make_journal_entry()`** - Create journal entry
19. **`create_account()`** - Create account
20. **`create_warehouse()`** - Create warehouse

---

## Summary

This guide has documented **hundreds of useful test utility functions** from ERPNext and HRMS that you can use in your custom Frappe applications. Key takeaways:

1. **Always use factory functions** (`make_*` or `create_*`) instead of manually creating documents
2. **Use test mixins** (`AccountsTestMixin`, `StockTestMixin`) for common functionality
3. **Leverage assertion helpers** (`assertSLEs`, `assertGLEs`) for complex validations
4. **Use `make_employee()`** - it's the most commonly used function in HRMS tests
5. **Follow the patterns** shown in this guide for consistency
6. **Import from test files** - most functions are in `test_*.py` files
7. **Use `do_not_save` and `do_not_submit`** flags for validation testing
8. **Use `change_settings` decorator** for testing with different settings
9. **Use `setUpClass`** for expensive operations shared across tests
10. **Document your tests** with clear docstrings

## Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)