# Frappe Report Performance Optimization

**Complete Guide to Optimizing Script Reports and Preventing Memory Issues**

---

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding the Problem](#understanding-the-problem)
3. [How Frappe Reports Work](#how-frappe-reports-work)
4. [Performance Concepts](#performance-concepts)
5. [Optimization Techniques](#optimization-techniques)
6. [Prepared Reports](#prepared-reports)
7. [Query Optimization](#query-optimization)
8. [Memory Management](#memory-management)
9. [Database Indexing](#database-indexing)
10. [Real-World Examples](#real-world-examples)
11. [Testing and Monitoring](#testing-and-monitoring)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)
14. [Quick Reference](#quick-reference)

---

## Introduction

### The Problem

**Sometime we may have a **Script Report** that:**
- Consumes almost **100% of RAM & CPU**
- Makes the **site crash**
- Takes too long to execute
- Loads too much data into memory

### What we must Learn

- How Frappe reports work internally
- Why reports consume memory
- How to optimize database queries
- How to use Prepared Reports for heavy operations
- How to implement pagination and limits
- How to add database indexes
- How to monitor and debug performance
- Real-world optimization examples from ERPNext

---

## Understanding the Problem

### Why Reports Consume 100% RAM

**Common causes:**

#### 1. Loading All Data Into Memory

```python
# BAD - Loads everything into memory
def execute(filters=None):
    # This loads ALL records into memory at once
    data = frappe.db.sql("""
        SELECT * FROM `tabSales Order`
    """, as_dict=True)
    
    return columns, data  # Might be millions of rows!
```

**Problem:**
- Loads **all rows** from database
- Stores **all data** in Python list
- Consumes RAM = (row_size × number_of_rows)
- For 1 million rows × 1KB each = **1GB RAM**

#### 2. No Filters or Limits

```python
# BAD - No date range, no limits
def execute(filters=None):
    data = frappe.db.sql("""
        SELECT * FROM `tabGL Entry`
    """, as_dict=True)
    
    return columns, data
```

**Problem:**
- Queries **entire table** (could be millions of rows)
- No WHERE clause to limit data
- No LIMIT clause
- Database sends all data to Python

#### 3. Inefficient Queries

```python
# BAD - N+1 query problem
def execute(filters=None):
    orders = frappe.get_all("Sales Order", fields=["name"])
    
    data = []
    for order in orders:  # 10,000 orders
        # This runs 10,000 separate queries!
        customer = frappe.db.get_value("Customer", order.customer, "customer_name")
        data.append({"order": order.name, "customer": customer})
    
    return columns, data
```

**Problem:**
- **N+1 queries**: 1 query + N queries in loop
- 10,000 orders = 10,001 database queries
- Each query has overhead
- Very slow and memory-intensive

#### 4. Loading Child Tables

```python
# BAD - Loading full documents with child tables
def execute(filters=None):
    data = []
    
    orders = frappe.get_all("Sales Order", pluck="name")
    for order_name in orders:  # 10,000 orders
        # Loads full document + all child tables
        order = frappe.get_doc("Sales Order", order_name)
        data.append({
            "name": order.name,
            "customer": order.customer,
            "total": order.grand_total,
            # This loads ALL items (child table)
            "items": order.items
        })
    
    return columns, data
```

**Problem:**
- `get_doc()` loads **complete document**
- Includes **all child tables**
- 10,000 orders × 10 items each = 100,000 child records
- Massive memory consumption

---

## How Frappe Reports Work

### Report Types

Frappe has **3 types** of reports:

| Type | Description | Use Case |
|------|-------------|----------|
| **Report Builder** | Visual report builder | Simple reports, no code |
| **Query Report** | SQL-based reports | Complex SQL queries |
| **Script Report** | Python-based reports | Complex logic, calculations |

### Script Report Structure

```python
# my_app/my_app/report/my_report/my_report.py

import frappe

def execute(filters=None):
    """
    Main entry point for the report.
    
    Args:
        filters (dict): User-selected filters
    
    Returns:
        tuple: (columns, data, message, chart, report_summary, skip_total_row)
    """
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define report columns"""
    return [
        {
            "fieldname": "name",
            "label": "ID",
            "fieldtype": "Link",
            "options": "Sales Order",
            "width": 150
        },
        {
            "fieldname": "customer",
            "label": "Customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 200
        },
    ]

def get_data(filters):
    """Fetch and process data"""
    # Your query logic here
    return []
```

### Report Execution Flow

```
User clicks "Refresh"
        ↓
Frontend (query_report.js)
        ↓
frappe.call("frappe.desk.query_report.run")
        ↓
Backend (query_report.py)
        ↓
Report.execute_script_report(filters)
        ↓
Your execute(filters) function
        ↓
Return (columns, data)
        ↓
Frontend renders DataTable
```

### Automatic Prepared Report Trigger

**From `frappe/frappe/core/doctype/report/report.py`:**

```python
def execute_script_report(self, filters):
    # Threshold: 15 seconds
    threshold = 15
    
    start_time = datetime.datetime.now()
    prepared_report_watcher = None
    
    if not self.prepared_report:
        # Start timer - if report takes > 15 seconds,
        # automatically enable "Prepared Report" mode
        prepared_report_watcher = threading.Timer(
            interval=threshold,
            function=enable_prepared_report,
            kwargs={"report": self.name, "site": frappe.local.site},
        )
        prepared_report_watcher.start()
    
    # Execute your report
    try:
        if self.is_standard == "Yes":
            res = self.execute_module(filters)
        else:
            res = self.execute_script(filters)
    finally:
        prepared_report_watcher and prepared_report_watcher.cancel()
    
    # Track execution time
    execution_time = (datetime.datetime.now() - start_time).total_seconds()
    frappe.cache.hset("report_execution_time", self.name, execution_time)
    
    return res
```

**Key Points:**
- If report takes **> 15 seconds**, Frappe suggests using Prepared Reports
- Execution time is **cached** for monitoring
- Timer is **cancelled** if report finishes quickly

### Frontend Row Limit

**From `frappe/frappe/public/js/frappe/views/reports/query_report.js`:**

```javascript
render_datatable() {
    let data = this.data;
    let columns = this.columns.filter((col) => !col.hidden);
    
    // Check max rows (default: 100,000)
    if (data.length > (cint(frappe.boot.sysdefaults.max_report_rows) || 100000)) {
        let msg = __(
            "This report contains {0} rows and is too big to display in browser, you can {1} this report instead.",
            [cstr(format_number(data.length, null, 0)).bold(), __("export").bold()]
        );
        
        this.toggle_message(true, `${frappe.utils.icon("solid-warning")} ${msg}`);
        return;  // Don't render!
    }
    
    // Render DataTable
    this.datatable = new window.DataTable(this.$report[0], datatable_options);
}
```

**Key Points:**
- Frontend **refuses to render** > 100,000 rows
- Configurable via `sysdefaults.max_report_rows`
- Shows warning message instead
- Suggests exporting the report

---

## Performance Concepts

### 1. Database Query Performance

**Query execution time depends on:**

| Factor | Impact | Solution |
|--------|--------|----------|
| **Table size** | More rows = slower | Add WHERE filters |
| **Indexes** | No index = table scan | Add indexes on filter columns |
| **JOINs** | Multiple tables = slower | Optimize JOIN conditions |
| **Aggregations** | SUM/COUNT = slower | Use indexes, limit data |
| **Sorting** | ORDER BY = slower | Index sort columns |

### 2. Memory Usage

**Memory consumed by:**

```
Total Memory = (Number of Rows) × (Size per Row) × (Python Overhead)
```

**Example:**
- 100,000 rows
- 10 columns × 100 bytes each = 1KB per row
- Python overhead: ~3x
- **Total: 100,000 × 1KB × 3 = 300MB**

### 3. Network Transfer

**Data transfer:**
```
Database → Python → JSON → Frontend → Browser
```

**Each step adds:**
- Serialization overhead
- Network latency
- Memory copies

### 4. Browser Rendering

**DataTable rendering:**
- Creates DOM elements for each cell
- Applies styling
- Enables sorting/filtering
- **Memory: ~10x data size**

**Example:**
- 50,000 rows × 10 columns = 500,000 cells
- Each cell = DOM element
- **Browser memory: ~500MB**

---

## Optimization Techniques

### Technique 1: Add Filters and Limits

#### Before (Bad)

```python
def execute(filters=None):
    columns = get_columns()
    
    # Loads ALL orders (could be millions)
    data = frappe.db.sql("""
        SELECT
            name,
            customer,
            posting_date,
            grand_total
        FROM `tabSales Order`
    """, as_dict=True)
    
    return columns, data
```

#### After (Good)

```python
def execute(filters=None):
    columns = get_columns()
    
    # Validate filters
    if not filters.get("from_date") or not filters.get("to_date"):
        frappe.throw("From Date and To Date are required")
    
    # Add WHERE clause with filters
    conditions = get_conditions(filters)
    
    data = frappe.db.sql("""
        SELECT
            name,
            customer,
            posting_date,
            grand_total
        FROM `tabSales Order`
        WHERE {conditions}
        ORDER BY posting_date DESC
        LIMIT 10000
    """.format(conditions=conditions), filters, as_dict=True)
    
    return columns, data

def get_conditions(filters):
    conditions = []
    
    # Date range (REQUIRED)
    conditions.append("posting_date BETWEEN %(from_date)s AND %(to_date)s")
    
    # Optional filters
    if filters.get("customer"):
        conditions.append("customer = %(customer)s")
    
    if filters.get("company"):
        conditions.append("company = %(company)s")
    
    return " AND ".join(conditions)
```

**Improvements:**
- **Mandatory date range** - prevents loading all data
- **WHERE clause** - filters at database level
- **LIMIT 10000** - caps maximum rows
- **Parameterized queries** - prevents SQL injection
- **Optional filters** - user can narrow down data

**Result:**
- From millions of rows → max 10,000 rows
- faster query execution
- less memory usage

### Technique 2: Use Efficient Queries (Avoid N+1)

#### Before (Bad - N+1 Problem)

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    # Get all orders
    orders = frappe.get_all("Sales Order",
        filters={"posting_date": ["between", [filters.from_date, filters.to_date]]},
        fields=["name", "customer", "grand_total"]
    )

    # N+1 problem: 1 query + N queries in loop
    for order in orders:  # 10,000 iterations
        # Separate query for each order!
        customer_name = frappe.db.get_value("Customer", order.customer, "customer_name")
        territory = frappe.db.get_value("Customer", order.customer, "territory")

        data.append({
            "order": order.name,
            "customer": customer_name,
            "territory": territory,
            "total": order.grand_total
        })

    return columns, data
```

**Problem:**
- 10,000 orders = **10,001 database queries**
- Each query has overhead (~5ms)
- Total time: 10,000 × 5ms = **50 seconds**

#### After (Good - Single JOIN Query)

```python
def execute(filters=None):
    columns = get_columns()

    # Single query with JOIN
    data = frappe.db.sql("""
        SELECT
            so.name as order,
            c.customer_name as customer,
            c.territory as territory,
            so.grand_total as total
        FROM `tabSales Order` so
        INNER JOIN `tabCustomer` c ON so.customer = c.name
        WHERE so.posting_date BETWEEN %(from_date)s AND %(to_date)s
        ORDER BY so.posting_date DESC
        LIMIT 10000
    """, filters, as_dict=True)

    return columns, data
```

**Improvements:**
- **Single query** instead of 10,001
- **JOIN** fetches related data efficiently
- **Database does the work** (optimized)
- **Much faster** execution

**Result:**
- From 10,001 queries → 1 query
- From 50 seconds → 0.5 seconds (100x faster)
- Less memory overhead

### Technique 3: Select Only Required Fields

#### Before (Bad)

```python
def execute(filters=None):
    columns = get_columns()

    # SELECT * loads ALL fields (50+ columns)
    data = frappe.db.sql("""
        SELECT * FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)

    return columns, data
```

**Problem:**
- `SELECT *` loads **all 50+ columns**
- Most columns are **not needed**
- Wastes memory and bandwidth
- Slower data transfer

#### After (Good)

```python
def execute(filters=None):
    columns = get_columns()

    # Select only required fields
    data = frappe.db.sql("""
        SELECT
            name,
            customer,
            posting_date,
            grand_total,
            status
        FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
        LIMIT 10000
    """, filters, as_dict=True)

    return columns, data
```

**Improvements:**
- **Only 5 fields** instead of 50+
- **90% less data** transferred
- **Faster query** execution
- **Less memory** usage

**Result:**
- From 50 columns → 5 columns
- 10x less data transfer
- 90% less memory

### Technique 4: Use Aggregation at Database Level

#### Before (Bad - Python Aggregation)

```python
def execute(filters=None):
    columns = get_columns()

    # Load ALL order items
    items = frappe.db.sql("""
        SELECT
            parent,
            item_code,
            qty,
            amount
        FROM `tabSales Order Item`
        WHERE parenttype = 'Sales Order'
    """, as_dict=True)  # Could be millions of rows!

    # Aggregate in Python
    from collections import defaultdict
    customer_totals = defaultdict(lambda: {"qty": 0, "amount": 0})

    for item in items:  # Loop through millions
        order = frappe.db.get_value("Sales Order", item.parent, "customer")
        customer_totals[order]["qty"] += item.qty
        customer_totals[order]["amount"] += item.amount

    data = [
        {"customer": k, "qty": v["qty"], "amount": v["amount"]}
        for k, v in customer_totals.items()
    ]

    return columns, data
```

**Problem:**
- Loads **millions of rows** into Python
- Loops through **all rows** in Python
- **Slow** and **memory-intensive**
- Database can do this **much faster**

#### After (Good - Database Aggregation)

```python
def execute(filters=None):
    columns = get_columns()

    # Let database do the aggregation
    data = frappe.db.sql("""
        SELECT
            so.customer,
            c.customer_name,
            SUM(soi.qty) as total_qty,
            SUM(soi.amount) as total_amount,
            COUNT(DISTINCT so.name) as order_count
        FROM `tabSales Order` so
        INNER JOIN `tabSales Order Item` soi ON soi.parent = so.name
        INNER JOIN `tabCustomer` c ON so.customer = c.name
        WHERE so.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND so.docstatus = 1
        GROUP BY so.customer
        ORDER BY total_amount DESC
        LIMIT 1000
    """, filters, as_dict=True)

    return columns, data
```

**Improvements:**
- **Database aggregation** (SUM, COUNT, GROUP BY)
- **Only aggregated results** returned
- **No Python loops** needed
- **Database is optimized** for this

**Result:**
- From millions of rows → 1,000 aggregated rows
- faster execution
- less memory

### Technique 5: Use Generators for Large Datasets

#### Before (Bad - Load All Into Memory)

```python
def execute(filters=None):
    columns = get_columns()

    # Loads ALL rows into memory at once
    all_orders = frappe.db.sql("""
        SELECT name FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)  # 100,000 rows in memory

    data = []
    for order in all_orders:
        # Process each order
        processed = process_order(order.name)
        data.append(processed)

    return columns, data
```

**Problem:**
- Loads **all 100,000 rows** into memory
- Then processes them one by one
- Memory usage = **all rows + processed data**

#### After (Good - Use Iterator)

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    # Use unbuffered cursor for large datasets
    with frappe.db.unbuffered_cursor():
        # as_iterator=True returns generator (O(1) memory)
        orders = frappe.db.sql("""
            SELECT name FROM `tabSales Order`
            WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
        """, filters, as_iterator=True)

        # Process one row at a time
        for (order_name,) in orders:
            processed = process_order(order_name)
            data.append(processed)

            # Optional: limit results
            if len(data) >= 10000:
                break

    return columns, data
```

**Improvements:**
- **Generator** - processes one row at a time
- **O(1) memory** - constant memory usage
- **Unbuffered cursor** - doesn't load all rows
- **Can limit** results easily

**Result:**
- From 100,000 rows in memory → 1 row at a time
- less memory usage
- Can start processing immediately

**Note:** From `frappe/frappe/database/database.py`:
```python
@contextmanager
def unbuffered_cursor(self):
    """Context manager to temporarily use unbuffered cursor.

    Using this with `as_iterator=True` provides O(1) memory usage
    while reading large result sets.

    Usage:
        with frappe.db.unbuffered_cursor():
            for row in frappe.db.sql("query with huge result", as_iterator=True):
                continue # Do some processing.
    """
```

### Technique 6: Implement Pagination

#### Before (Bad - No Pagination)

```python
def execute(filters=None):
    columns = get_columns()

    # Returns ALL matching rows
    data = frappe.db.sql("""
        SELECT * FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)  # Could be 500,000 rows!

    return columns, data
```

#### After (Good - With Pagination)

```python
def execute(filters=None):
    columns = get_columns()

    # Get pagination parameters
    page = filters.get("page", 1)
    page_size = filters.get("page_size", 500)
    offset = (page - 1) * page_size

    # Get total count (for pagination info)
    total_count = frappe.db.sql("""
        SELECT COUNT(*) as count
        FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)[0].count

    # Get paginated data
    data = frappe.db.sql("""
        SELECT
            name,
            customer,
            posting_date,
            grand_total
        FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
        ORDER BY posting_date DESC
        LIMIT %(page_size)s OFFSET %(offset)s
    """, {**filters, "page_size": page_size, "offset": offset}, as_dict=True)

    # Add pagination info to message
    message = f"Showing {offset + 1} to {offset + len(data)} of {total_count} records"

    return columns, data, message
```

**Improvements:**
- **LIMIT and OFFSET** - only fetch one page
- **User controls** page size
- **Shows total count** for context
- **Consistent memory** usage

**Result:**
- From 500,000 rows → 500 rows per page
- less memory
- Much faster loading

### Technique 7: Cache Expensive Calculations

#### Before (Bad - Recalculate Every Time)

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    orders = frappe.get_all("Sales Order",
        filters={"posting_date": ["between", [filters.from_date, filters.to_date]]},
        fields=["name", "customer"]
    )

    for order in orders:
        # Expensive calculation - runs for EVERY order
        customer_lifetime_value = calculate_customer_ltv(order.customer)

        data.append({
            "order": order.name,
            "customer": order.customer,
            "ltv": customer_lifetime_value
        })

    return columns, data

def calculate_customer_ltv(customer):
    # Expensive query
    return frappe.db.sql("""
        SELECT SUM(grand_total)
        FROM `tabSales Order`
        WHERE customer = %s AND docstatus = 1
    """, customer)[0][0] or 0
```

**Problem:**
- Calculates LTV for **same customer multiple times**
- 10,000 orders from 1,000 customers = **10,000 calculations**
- Should be **1,000 calculations**

#### After (Good - With Caching)

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    orders = frappe.get_all("Sales Order",
        filters={"posting_date": ["between", [filters.from_date, filters.to_date]]},
        fields=["name", "customer"]
    )

    # Cache for customer LTV
    ltv_cache = {}

    for order in orders:
        # Check cache first
        if order.customer not in ltv_cache:
            # Calculate only once per customer
            ltv_cache[order.customer] = calculate_customer_ltv(order.customer)

        data.append({
            "order": order.name,
            "customer": order.customer,
            "ltv": ltv_cache[order.customer]
        })

    return columns, data

def calculate_customer_ltv(customer):
    return frappe.db.sql("""
        SELECT SUM(grand_total)
        FROM `tabSales Order`
        WHERE customer = %s AND docstatus = 1
    """, customer)[0][0] or 0
```

**Even Better - Pre-calculate All:**

```python
def execute(filters=None):
    columns = get_columns()

    # Single query with JOIN and aggregation
    data = frappe.db.sql("""
        SELECT
            so.name as order,
            so.customer,
            customer_totals.ltv
        FROM `tabSales Order` so
        INNER JOIN (
            SELECT
                customer,
                SUM(grand_total) as ltv
            FROM `tabSales Order`
            WHERE docstatus = 1
            GROUP BY customer
        ) customer_totals ON so.customer = customer_totals.customer
        WHERE so.posting_date BETWEEN %(from_date)s AND %(to_date)s
        ORDER BY so.posting_date DESC
        LIMIT 10000
    """, filters, as_dict=True)

    return columns, data
```

**Result:**
- From 10,000 queries → 1 query
- faster
- Much less memory

---

## Prepared Reports

### What Are Prepared Reports?

**Prepared Reports** are reports that run in the **background** and store results for later viewing.

**From `frappe/frappe/core/doctype/prepared_report/prepared_report.py`:**

```python
# If prepared report runs for longer than this time it's automatically considered as failed
FAILURE_THRESHOLD = 6 * 60 * 60  # 6 hours
REPORT_TIMEOUT = 25 * 60  # 25 minutes
```

### When to Use Prepared Reports

Use Prepared Reports when:
- Report takes **> 15 seconds** to execute
- Report processes **large datasets** (100,000+ rows)
- Report has **complex calculations**
- Report is run **frequently** with same filters
- Users can wait for results

### How Prepared Reports Work

```
User clicks "Generate Report"
        ↓
Create Prepared Report document
        ↓
Enqueue to "long" queue
        ↓
Background worker picks up job
        ↓
Execute report (up to 25 minutes)
        ↓
Compress results (gzip)
        ↓
Save as attachment
        ↓
Mark as "Completed"
        ↓
User downloads/views results
```

### Enabling Prepared Reports

#### Method 1: Automatic (After 15 Seconds)

Frappe **automatically suggests** Prepared Reports if execution > 15 seconds.

**From source code:**
```python
def execute_script_report(self, filters):
    threshold = 15  # seconds

    # Start timer
    prepared_report_watcher = threading.Timer(
        interval=threshold,
        function=enable_prepared_report,
        kwargs={"report": self.name, "site": frappe.local.site},
    )
    prepared_report_watcher.start()
```

#### Method 2: Manual (Report Settings)

1. Go to **Report** DocType
2. Open your report
3. Check **"Enable Prepared Report"**
4. Set **Timeout** (default: 25 minutes)
5. Save

#### Method 3: Programmatic

```python
# Enable prepared report for a report
report = frappe.get_doc("Report", "My Heavy Report")
report.prepared_report = 1
report.timeout = 1800  # 30 minutes
report.save()
```

### Prepared Report Implementation

**From `frappe/frappe/core/doctype/prepared_report/prepared_report.py`:**

```python
def generate_report(prepared_report):
    """Generate report in background"""
    instance = frappe.get_doc("Prepared Report", prepared_report)
    report = frappe.get_doc("Report", instance.report_name)

    try:
        # Execute report
        result = generate_report_result(
            report=report,
            filters=instance.filters,
            user=instance.owner
        )

        # Compress and save
        create_json_gz_file(result, instance.doctype, instance.name, instance.report_name)

        instance.status = "Completed"
    except Exception:
        instance.status = "Error"
        instance.error_message = frappe.get_traceback(with_context=True)

    # Track memory usage
    instance.report_end_time = frappe.utils.now()
    instance.peak_memory_usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    instance.save(ignore_permissions=True)

    # Notify user
    frappe.publish_realtime(
        "report_generated",
        {"report_name": instance.report_name, "name": instance.name},
        user=frappe.session.user,
    )
```

**Key Features:**
- Runs in **background queue** ("long")
- **Timeout**: 25 minutes (configurable)
- **Compresses** results (gzip)
- **Tracks memory** usage
- **Error handling** with traceback
- **Real-time notification** when done

### Memory Tracking

**From source code:**
```python
import resource

# Track peak memory usage
instance.peak_memory_usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
```

**`ru_maxrss`** returns:
- **Linux**: Maximum resident set size in **kilobytes**
- **macOS**: Maximum resident set size in **bytes**

**View memory usage:**
1. Go to **Prepared Report** list
2. Open a completed report
3. See **Peak Memory Usage** field

### Example: Converting to Prepared Report

#### Before (Regular Report)

```python
# my_report.py
def execute(filters=None):
    columns = get_columns()

    # This might take 2 minutes
    data = frappe.db.sql("""
        SELECT * FROM `tabGL Entry`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)  # 500,000 rows

    return columns, data
```

**Problem:**
- User waits **2 minutes** staring at loading spinner
- Blocks web request for 2 minutes
- Might timeout
- Bad user experience

#### After (Prepared Report)

**1. Enable in Report settings:**
```
Report: GL Entry Report
Enable Prepared Report
Timeout: 300 (5 minutes)
```

**2. No code changes needed!**

The same `execute()` function runs in background.

**3. User experience:**
```
User clicks "Generate Report"
    ↓
"Report is being generated in background..."
    ↓
User can close tab and come back later
    ↓
Notification: "Report generated"
    ↓
User views/downloads results
```

**Benefits:**
- **Non-blocking** - user can do other work
- **No timeout** - can run for 25 minutes
- **Cached** - results stored for reuse
- **Better UX** - clear expectations

---

## Query Optimization

### Understanding Query Performance

**Query execution steps:**
1. **Parse** - SQL syntax check
2. **Plan** - Query optimizer creates execution plan
3. **Execute** - Database executes plan
4. **Fetch** - Results returned to Python

**Slow queries usually caused by:**
- **Full table scans** - no indexes
- **Large JOINs** - joining huge tables
- **Complex subqueries** - nested queries
- **No WHERE clause** - scanning all rows

### Using EXPLAIN to Analyze Queries

```python
# Add EXPLAIN to see query plan
query = """
    SELECT
        so.name,
        so.customer,
        so.grand_total
    FROM `tabSales Order` so
    WHERE so.posting_date BETWEEN '2024-01-01' AND '2024-12-31'
"""

# Run with EXPLAIN
explain_result = frappe.db.sql(f"EXPLAIN {query}", as_dict=True)

for row in explain_result:
    print(f"Table: {row.table}")
    print(f"Type: {row.type}")  # ALL = full scan (bad), ref = index (good)
    print(f"Rows: {row.rows}")  # Estimated rows scanned
    print(f"Extra: {row.Extra}")
```

**Key indicators:**

| Type | Meaning | Performance |
|------|---------|-------------|
| **ALL** | Full table scan | Very slow |
| **index** | Full index scan | Slow |
| **range** | Index range scan | Good |
| **ref** | Index lookup | Very good |
| **const** | Constant lookup | Excellent |

### Optimization Example

#### Before (Slow Query)

```python
# Slow query - no index on posting_date
data = frappe.db.sql("""
    SELECT
        name,
        customer,
        posting_date,
        grand_total
    FROM `tabSales Order`
    WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
        AND status = 'Draft'
    ORDER BY posting_date DESC
""", filters, as_dict=True)
```

**EXPLAIN shows:**
```
type: ALL
rows: 500000
Extra: Using where; Using filesort
```

**Problems:**
- Full table scan (ALL)
- Scans 500,000 rows
- Uses filesort (slow sorting)

#### After (Fast Query with Index)

**1. Add index:**
```sql
ALTER TABLE `tabSales Order`
ADD INDEX idx_posting_date_status (posting_date, status);
```

**2. Same query now uses index:**
```python
data = frappe.db.sql("""
    SELECT
        name,
        customer,
        posting_date,
        grand_total
    FROM `tabSales Order`
    WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
        AND status = 'Draft'
    ORDER BY posting_date DESC
    LIMIT 10000
""", filters, as_dict=True)
```

**EXPLAIN shows:**
```
type: range
rows: 1000
Extra: Using index condition
```

**Improvements:**
- Uses index (range)
- Scans only 1,000 rows
- No filesort needed
- **500x faster!**

### Query Optimization Checklist

#### 1. Add WHERE Clause

**Always filter data:**
```python
# Good - filters data
WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    AND company = %(company)s
```

**Never query all data:**
```python
# Bad - no filters
SELECT * FROM `tabSales Order`
```

#### 2. Use Indexes

**Index filter columns:**
```sql
-- Index columns used in WHERE
CREATE INDEX idx_posting_date ON `tabSales Order` (posting_date);
CREATE INDEX idx_customer ON `tabSales Order` (customer);

-- Composite index for multiple columns
CREATE INDEX idx_date_status ON `tabSales Order` (posting_date, status);
```

#### 3. Limit Results

**Always use LIMIT:**
```python
# Good - limits results
SELECT * FROM `tabSales Order`
WHERE posting_date >= %(from_date)s
LIMIT 10000
```

#### 4. Select Only Needed Fields

**Specify fields:**
```python
# Good - only needed fields
SELECT name, customer, grand_total
FROM `tabSales Order`
```

**Avoid SELECT *:**
```python
# Bad - loads all 50+ columns
SELECT * FROM `tabSales Order`
```

#### 5. Use JOINs Instead of Loops

**Single query with JOIN:**
```python
SELECT
    so.name,
    c.customer_name,
    c.territory
FROM `tabSales Order` so
INNER JOIN `tabCustomer` c ON so.customer = c.name
```

**Loop with queries:**
```python
for order in orders:
    customer = frappe.db.get_value("Customer", order.customer, "customer_name")
```

#### 6. Use Aggregation in Database

**Database aggregation:**
```python
SELECT
    customer,
    SUM(grand_total) as total,
    COUNT(*) as count
FROM `tabSales Order`
GROUP BY customer
```

**Python aggregation:**
```python
# Load all rows then aggregate in Python
```

---

## Memory Management

### Understanding Memory Usage

**Memory consumed by report:**

```
Total Memory = Query Result + Python Objects + Processing Overhead
```

**Example calculation:**
```
100,000 rows × 10 columns × 100 bytes = 100MB (raw data)
Python dict overhead: 3x = 300MB
Processing: 2x = 600MB
Total: ~600MB RAM
```

### Memory Optimization Techniques

#### 1. Process in Batches

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    batch_size = 1000
    offset = 0

    while True:
        # Fetch batch
        batch = frappe.db.sql("""
            SELECT
                name,
                customer,
                grand_total
            FROM `tabSales Order`
            WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
            ORDER BY posting_date DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """, {**filters, "limit": batch_size, "offset": offset}, as_dict=True)

        if not batch:
            break

        # Process batch
        for row in batch:
            processed = process_row(row)
            data.append(processed)

        offset += batch_size

        # Optional: limit total results
        if len(data) >= 10000:
            break

    return columns, data
```

**Benefits:**
- Processes 1,000 rows at a time
- Constant memory usage
- Can stop early if needed

#### 2. Use Generators

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    # Generator - yields one row at a time
    def get_orders():
        with frappe.db.unbuffered_cursor():
            for row in frappe.db.sql("""
                SELECT name, customer, grand_total
                FROM `tabSales Order`
                WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
            """, filters, as_iterator=True):
                yield row

    # Process one at a time
    for order_name, customer, total in get_orders():
        data.append({
            "order": order_name,
            "customer": customer,
            "total": total
        })

        if len(data) >= 10000:
            break

    return columns, data
```

**Benefits:**
- O(1) memory - one row at a time
- Can process millions of rows
- No memory spikes

#### 3. Delete Temporary Data

```python
def execute(filters=None):
    columns = get_columns()

    # Get raw data
    raw_data = frappe.db.sql("""
        SELECT * FROM `tabSales Order`
        WHERE posting_date BETWEEN %(from_date)s AND %(to_date)s
    """, filters, as_dict=True)

    # Process data
    processed_data = []
    for row in raw_data:
        processed = {
            "order": row.name,
            "customer": row.customer,
            "total": row.grand_total
        }
        processed_data.append(processed)

    # Delete raw data to free memory
    del raw_data

    return columns, processed_data
```

#### 4. Avoid Loading Full Documents

**Bad - Loads full document:**
```python
for order_name in order_names:
    order = frappe.get_doc("Sales Order", order_name)  # Loads everything
    data.append({"name": order.name, "total": order.grand_total})
```

**Good - Query only needed fields:**
```python
data = frappe.db.sql("""
    SELECT name, grand_total
    FROM `tabSales Order`
    WHERE name IN %(order_names)s
""", {"order_names": order_names}, as_dict=True)
```

#### 5. Limit Child Table Loading

**Bad - Loads all child tables:**
```python
orders = frappe.get_all("Sales Order", pluck="name")
for order_name in orders:
    order = frappe.get_doc("Sales Order", order_name)  # Loads items table
    # ...
```

**Good - Query child table directly:**
```python
items = frappe.db.sql("""
    SELECT
        parent,
        item_code,
        qty,
        amount
    FROM `tabSales Order Item`
    WHERE parent IN %(order_names)s
""", {"order_names": order_names}, as_dict=True)
```

### Memory Monitoring

#### Check Memory Usage in Code

```python
import resource

def execute(filters=None):
    # Get memory at start
    start_memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    columns = get_columns()
    data = get_data(filters)

    # Get memory at end
    end_memory = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    # Calculate usage (in KB on Linux, bytes on macOS)
    memory_used = end_memory - start_memory

    message = f"Memory used: {memory_used / 1024:.2f} MB"

    return columns, data, message
```

#### Monitor System Memory

```bash
# Check available memory
free -h

# Monitor memory in real-time
watch -n 1 free -h

# Check process memory
ps aux | grep frappe

# Top memory consumers
top -o %MEM
```

---

## Database Indexing

### What Are Indexes?

**Indexes** are like a book's index - they help find data quickly without scanning every page.

**Without index:**
```
Database scans ALL rows to find matches
500,000 rows × 1ms = 500 seconds
```

**With index:**
```
Database uses index to jump to matches
Uses B-tree: log2(500,000) = 19 lookups
19 × 0.1ms = 0.002 seconds
```

**Speed improvement: 250,000x faster!**

### When to Add Indexes

Add indexes on columns used in:
- **WHERE** clauses
- **JOIN** conditions
- **ORDER BY** clauses
- **GROUP BY** clauses

### How to Add Indexes

#### Method 1: Via SQL

```sql
-- Single column index
ALTER TABLE `tabSales Order`
ADD INDEX idx_posting_date (posting_date);

-- Composite index (multiple columns)
ALTER TABLE `tabSales Order`
ADD INDEX idx_date_customer (posting_date, customer);

-- Unique index
ALTER TABLE `tabCustomer`
ADD UNIQUE INDEX idx_email (email_id);
```

#### Method 2: Via DocType JSON or Desk

Edit the DocType JSON file:

```json
{
 "doctype": "DocType",
 "name": "Sales Order",
 "fields": [
  {
   "fieldname": "posting_date",
   "fieldtype": "Date",
   "label": "Posting Date",
   "search_index": 1
  }
 ],
}
```

Then run:
```bash
bench migrate
```

> or in the Desk, go to the doctype, choose the field, check the index checkbox.

#### Method 3: Via Python Migration

Create migration file:
```python
# my_app/patches/v1_0/add_sales_order_indexes.py

import frappe

def execute():
    """Add indexes to Sales Order"""

    # Check if index exists
    if not frappe.db.sql("""
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE()
            AND table_name = 'tabSales Order'
            AND index_name = 'idx_posting_date'
    """):
        # Add index
        frappe.db.sql("""
            ALTER TABLE `tabSales Order`
            ADD INDEX idx_posting_date (posting_date)
        """)

        frappe.db.commit()
        print("Added index: idx_posting_date")
```

Add to `patches.txt`:
```
my_app.patches.v1_0.add_sales_order_indexes
```

Run:
```bash
bench migrate
```

### Index Best Practices

#### 1. Index Selectivity

**High selectivity (good):**
```sql
-- email_id: unique values
CREATE INDEX idx_email ON `tabCustomer` (email_id);
```

**Low selectivity (bad):**
```sql
-- status: only 3-4 values (Draft, Submitted, Cancelled)
-- Index not very useful
CREATE INDEX idx_status ON `tabSales Order` (status);
```

#### 2. Composite Index Order

**Order matters!**

**Good order:**
```sql
-- Most selective column first
CREATE INDEX idx_date_status ON `tabSales Order` (posting_date, status);

-- Query can use this index:
WHERE posting_date = '2024-01-01' AND status = 'Draft'
WHERE posting_date = '2024-01-01'  -- Uses partial index
```

**Bad order:**
```sql
-- Less selective column first
CREATE INDEX idx_status_date ON `tabSales Order` (status, posting_date);

-- Query CANNOT use this index efficiently:
WHERE posting_date = '2024-01-01'  -- Doesn't match index prefix
```

#### 3. Don't Over-Index

**Too many indexes:**
- Slow down INSERT/UPDATE/DELETE
- Waste disk space
- Confuse query optimizer

**Rule of thumb:**
- 3-5 indexes per table
- Only index frequently queried columns
- Remove unused indexes

#### 4. Monitor Index Usage

```sql
-- Check index usage (MySQL)
SELECT
    table_name,
    index_name,
    cardinality,
    index_type
FROM information_schema.statistics
WHERE table_schema = DATABASE()
    AND table_name = 'tabSales Order'
ORDER BY table_name, index_name;
```

### Common Indexes for Reports

```sql
-- Date range queries
CREATE INDEX idx_posting_date ON `tabSales Order` (posting_date);
CREATE INDEX idx_creation ON `tabSales Order` (creation);

-- Foreign keys
CREATE INDEX idx_customer ON `tabSales Order` (customer);
CREATE INDEX idx_company ON `tabSales Order` (company);

-- Status filters
CREATE INDEX idx_docstatus ON `tabSales Order` (docstatus);

-- Composite for common queries
CREATE INDEX idx_date_company ON `tabSales Order` (posting_date, company);
CREATE INDEX idx_customer_date ON `tabSales Order` (customer, posting_date);
```

---

## Real-World Examples

### Example 1: Sales Report Optimization

#### Before (Slow - 2 minutes, 500MB RAM)

```python
# my_app/report/sales_report/sales_report.py

def execute(filters=None):
    columns = [
        {"fieldname": "customer", "label": "Customer", "fieldtype": "Link", "options": "Customer"},
        {"fieldname": "total_orders", "label": "Total Orders", "fieldtype": "Int"},
        {"fieldname": "total_amount", "label": "Total Amount", "fieldtype": "Currency"},
    ]

    # Get all customers
    customers = frappe.get_all("Customer", pluck="name")

    data = []
    for customer in customers:  # 10,000 customers
        # Separate query for each customer (N+1 problem)
        orders = frappe.get_all("Sales Order",
            filters={"customer": customer, "docstatus": 1},
            fields=["grand_total"]
        )

        total_orders = len(orders)
        total_amount = sum(o.grand_total for o in orders)

        data.append({
            "customer": customer,
            "total_orders": total_orders,
            "total_amount": total_amount
        })

    return columns, data
```

**Problems:**
- 10,000 customers × 2 queries each = **20,000 queries**
- Loads all orders into memory
- No date filter
- Takes 2 minutes
- Uses 500MB RAM

#### After (Fast - 2 seconds, 10MB RAM)

```python
def execute(filters=None):
    # Validate filters
    if not filters.get("from_date") or not filters.get("to_date"):
        frappe.throw("From Date and To Date are required")

    columns = [
        {"fieldname": "customer", "label": "Customer", "fieldtype": "Link", "options": "Customer"},
        {"fieldname": "customer_name", "label": "Customer Name", "fieldtype": "Data"},
        {"fieldname": "total_orders", "label": "Total Orders", "fieldtype": "Int"},
        {"fieldname": "total_amount", "label": "Total Amount", "fieldtype": "Currency"},
    ]

    # Single query with aggregation
    data = frappe.db.sql("""
        SELECT
            so.customer,
            c.customer_name,
            COUNT(so.name) as total_orders,
            SUM(so.grand_total) as total_amount
        FROM `tabSales Order` so
        INNER JOIN `tabCustomer` c ON so.customer = c.name
        WHERE so.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND so.docstatus = 1
        GROUP BY so.customer
        ORDER BY total_amount DESC
        LIMIT 1000
    """, filters, as_dict=True)

    return columns, data
```

**Improvements:**
- **1 query** instead of 20,000
- **Database aggregation** (SUM, COUNT)
- **Date filter** required
- **LIMIT 1000** rows
- **2 seconds** execution
- **10MB** RAM usage

**Result: 60x faster, 50x less memory!**

### Example 2: Inventory Report with Child Tables

#### Before (Crashes - 100% RAM)

```python
def execute(filters=None):
    columns = get_columns()
    data = []

    # Get all stock entries
    entries = frappe.get_all("Stock Entry", pluck="name")

    for entry_name in entries:  # 50,000 entries
        # Loads full document + all items (child table)
        entry = frappe.get_doc("Stock Entry", entry_name)

        for item in entry.items:  # 10 items per entry = 500,000 rows
            data.append({
                "entry": entry.name,
                "item": item.item_code,
                "qty": item.qty,
                "warehouse": item.warehouse
            })

    return columns, data
```

**Problems:**
- Loads 50,000 full documents
- Loads 500,000 child table rows
- **Consumes 2GB+ RAM**
- **Site crashes**

#### After (Works - 50MB RAM)

```python
def execute(filters=None):
    # Require date filter
    if not filters.get("from_date") or not filters.get("to_date"):
        frappe.throw("From Date and To Date are required")

    columns = get_columns()

    # Query child table directly with JOIN
    data = frappe.db.sql("""
        SELECT
            se.name as entry,
            se.posting_date,
            sei.item_code as item,
            sei.qty,
            sei.s_warehouse as source_warehouse,
            sei.t_warehouse as target_warehouse
        FROM `tabStock Entry` se
        INNER JOIN `tabStock Entry Detail` sei ON sei.parent = se.name
        WHERE se.posting_date BETWEEN %(from_date)s AND %(to_date)s
            AND se.docstatus = 1
        ORDER BY se.posting_date DESC
        LIMIT 10000
    """, filters, as_dict=True)

    return columns, data
```

**Improvements:**
- **Direct child table query** - no document loading
- **Date filter** required
- **LIMIT 10,000** rows
- **50MB RAM** instead of 2GB
- **No crashes**

**Result: 40x less memory, site stable!**

### Example 3: GL Entry Report (From ERPNext)

**Real example from `erpnext/accounts/report/general_ledger/general_ledger.py`:**

```python
def get_gl_entries(filters, accounting_dimensions):
    """Optimized GL Entry query"""

    # Build dynamic fields
    select_fields = """, debit, credit, debit_in_account_currency,
        credit_in_account_currency """

    # Optional remarks field with length limit
    if filters.get("show_remarks"):
        if remarks_length := frappe.db.get_single_value(
            "Accounts Settings", "general_ledger_remarks_length"
        ):
            # Use SUBSTR to limit field size
            select_fields += f",substr(remarks, 1, {remarks_length}) as 'remarks'"
        else:
            select_fields += """,remarks"""

    # Optimized ordering
    order_by_statement = "order by posting_date, account, creation"

    # Execute query
    gl_entries = frappe.db.sql(f"""
        select
            name as gl_entry, posting_date, account, party_type, party,
            voucher_type, voucher_subtype, voucher_no,
            cost_center, project,
            against_voucher_type, against_voucher, account_currency,
            against, is_opening, creation {select_fields}
        from `tabGL Entry`
        where company=%(company)s {get_conditions(filters)}
        {order_by_statement}
    """, filters, as_dict=1)

    return gl_entries
```

**Optimization techniques used:**
- **Dynamic field selection** - only load needed fields
- **SUBSTR for large text** - limit remarks field size
- **Parameterized conditions** - flexible filtering
- **Efficient ordering** - indexed columns
- **No child table loading** - direct query

### Example 4: Project Summary (From ERPNext)

**Real example from `erpnext/projects/report/project_summary/project_summary.py`:**

```python
def execute(filters=None):
    columns = get_columns()

    # Get projects efficiently
    data = frappe.get_all(
        "Project",
        filters=filters,
        fields=[
            "name",
            "project_name",
            "status",
            "percent_complete",
            "expected_start_date",
            "expected_end_date",
            "project_type",
        ],
        order_by="expected_end_date",
    )

    # Add aggregated task counts
    for project in data:
        project["total_tasks"] = frappe.db.count(
            "Task", filters={"project": project.name}
        )
        project["completed_tasks"] = frappe.db.count(
            "Task", filters={"project": project.name, "status": "Completed"}
        )
        project["overdue_tasks"] = frappe.db.count(
            "Task", filters={"project": project.name, "status": "Overdue"}
        )

    chart = get_chart_data(data)
    report_summary = get_report_summary(data)

    return columns, data, None, chart, report_summary
```

**Optimization techniques:**
- **get_all with specific fields** - not full documents
- **db.count()** - efficient counting
- **Separate queries for counts** - only when needed
- **Chart and summary** - enhanced UX

### Example 5: First Response Time (From ERPNext)

**Real example from `erpnext/support/report/first_response_time_for_issues/first_response_time_for_issues.py`:**

```python
def execute(filters=None):
    columns = [
        {"fieldname": "creation_date", "label": _("Date"), "fieldtype": "Date", "width": 300},
        {
            "fieldname": "first_response_time",
            "fieldtype": "Duration",
            "label": _("First Response Time"),
            "width": 300,
        },
    ]

    # Efficient aggregation query
    data = frappe.db.sql("""
        SELECT
            date(creation) as creation_date,
            avg(first_response_time) as avg_response_time
        FROM tabIssue
        WHERE
            date(creation) between %s and %s
            and first_response_time > 0
        GROUP BY creation_date
        ORDER BY creation_date desc
    """, (filters.from_date, filters.to_date))

    return columns, data
```

**Optimization techniques:**
- **Database aggregation** - AVG, GROUP BY
- **Date filtering** - required parameters
- **Simple and fast** - minimal overhead
- **Tuple parameters** - clean syntax

---

## Testing and Monitoring

### Performance Testing

#### 1. Measure Execution Time

```python
import time

def execute(filters=None):
    start_time = time.time()

    columns = get_columns()
    data = get_data(filters)

    end_time = time.time()
    execution_time = end_time - start_time

    message = f"Execution time: {execution_time:.2f} seconds"

    return columns, data, message
```

#### 2. Measure Memory Usage

```python
import resource

def execute(filters=None):
    # Memory at start
    start_mem = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    columns = get_columns()
    data = get_data(filters)

    # Memory at end
    end_mem = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    memory_mb = (end_mem - start_mem) / 1024  # KB to MB

    message = f"Memory used: {memory_mb:.2f} MB, Rows: {len(data)}"

    return columns, data, message
```

#### 3. Test with Different Data Sizes

```python
# Test scenarios
test_cases = [
    {"from_date": "2024-12-01", "to_date": "2024-12-01"},  # 1 day
    {"from_date": "2024-12-01", "to_date": "2024-12-07"},  # 1 week
    {"from_date": "2024-12-01", "to_date": "2024-12-31"},  # 1 month
    {"from_date": "2024-01-01", "to_date": "2024-12-31"},  # 1 year
]

for filters in test_cases:
    start = time.time()
    columns, data = execute(filters)
    duration = time.time() - start

    print(f"Date range: {filters['from_date']} to {filters['to_date']}")
    print(f"Rows: {len(data)}, Time: {duration:.2f}s")
```

### Monitoring in Production

#### 1. Check Prepared Report Analytics

Frappe has a built-in report: **Prepared Report Analytics**

**From `frappe/core/report/prepared_report_analytics/prepared_report_analytics.py`:**

```python
def get_data(filters) -> list[list]:
    """Return data for the report."""

    pr = qb.DocType("Prepared Report")

    conditions = [
        pr.status.eq("Completed"),
        pr.creation.gte(add_months(nowdate(), -2))
    ]

    if filters.report:
        conditions.append(pr.report_name.like(f"%{filters.report}%"))

    divisor = 1
    if filters.in_minutes:
        divisor = 60

    query = (
        qb.from_(pr)
        .select(
            pr.name,
            pr.report_name,
            pr.creation,
            pr.report_end_time,
            (pr.peak_memory_usage / 1024).as_("peak_memory_usage"),  # KB to MB
        )
        .select(((pr.report_end_time - pr.creation) / divisor).as_("runtime"))
        .where(Criterion.all(conditions))
        .orderby(qb.Field("runtime"), order=Order.desc)
    )

    if filters.top_10:
        query = query.limit(10)

    return query.run()
```

**View this report:**
1. Go to **Report List**
2. Search for **"Prepared Report Analytics"**
3. See:
   - Report execution time
   - Peak memory usage
   - Slowest reports
   - Most memory-intensive reports

#### 2. Monitor Slow Queries

**Enable slow query log in MariaDB:**

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;  -- Log queries > 2 seconds
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

**Analyze slow queries:**
```bash
# View slow query log
sudo tail -f /var/log/mysql/slow-query.log

# Analyze with pt-query-digest
pt-query-digest /var/log/mysql/slow-query.log
```

#### 3. Monitor System Resources

```bash
# Monitor memory usage
watch -n 1 'free -h && echo && ps aux | grep frappe | head -5'

# Monitor database connections
watch -n 1 'mysql -e "SHOW PROCESSLIST"'

# Check table sizes
mysql -e "
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'your_database'
ORDER BY (data_length + index_length) DESC
LIMIT 20;
"
```

---

## Troubleshooting

### Problem 1: Report Consumes 100% RAM

**Symptoms:**
- Site becomes unresponsive
- Server runs out of memory
- Report never completes

**Diagnosis:**
```python
# Add memory tracking
import resource

def execute(filters=None):
    mem_start = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    # Your code here
    data = get_data(filters)

    mem_end = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    print(f"Memory used: {(mem_end - mem_start) / 1024} MB")
    print(f"Rows returned: {len(data)}")
```

**Solutions:**

1. **Add date filters:**
```python
if not filters.get("from_date") or not filters.get("to_date"):
    frappe.throw("Date range is required")
```

2. **Add LIMIT:**
```python
LIMIT 10000
```

3. **Use pagination:**
```python
page_size = 500
LIMIT %(page_size)s OFFSET %(offset)s
```

4. **Enable Prepared Report:**
```python
# In Report settings
prepared_report = 1
```

5. **Use generators:**
```python
with frappe.db.unbuffered_cursor():
    for row in frappe.db.sql(query, as_iterator=True):
        # Process one at a time
```

### Problem 2: Report Takes Too Long

**Symptoms:**
- Report runs for minutes
- Users complain about slowness
- Timeout errors

**Diagnosis:**
```python
# Add timing
import time

def execute(filters=None):
    start = time.time()

    # Time each section
    t1 = time.time()
    data = get_data(filters)
    print(f"Query time: {time.time() - t1:.2f}s")

    t2 = time.time()
    processed = process_data(data)
    print(f"Processing time: {time.time() - t2:.2f}s")

    print(f"Total time: {time.time() - start:.2f}s")
```

**Solutions:**

1. **Add indexes:**
```sql
CREATE INDEX idx_posting_date ON `tabSales Order` (posting_date);
```

2. **Optimize query:**
```python
# Use JOIN instead of loops
# Use aggregation in database
# Select only needed fields
```

3. **Use EXPLAIN:**
```python
explain = frappe.db.sql(f"EXPLAIN {query}", as_dict=True)
# Check for "type: ALL" (full table scan)
```

4. **Enable Prepared Report:**
```python
# Runs in background, no timeout
```

### Problem 3: N+1 Query Problem

**Symptoms:**
- Report makes thousands of queries
- Very slow execution
- Database CPU at 100%

**Diagnosis:**
```python
# Count queries
query_count = 0

original_sql = frappe.db.sql
def counting_sql(*args, **kwargs):
    global query_count
    query_count += 1
    return original_sql(*args, **kwargs)

frappe.db.sql = counting_sql

# Run report
execute(filters)

print(f"Total queries: {query_count}")
```

**Solution:**
```python
# Before (N+1)
for order in orders:
    customer = frappe.db.get_value("Customer", order.customer, "customer_name")

# After (Single JOIN)
data = frappe.db.sql("""
    SELECT so.name, c.customer_name
    FROM `tabSales Order` so
    INNER JOIN `tabCustomer` c ON so.customer = c.name
""")
```

### Problem 4: Frontend Won't Render

**Symptoms:**
- Warning: "Report contains X rows and is too big to display"
- Report data loads but doesn't show

**Cause:**
- More than 100,000 rows (default limit)

**Solutions:**

1. **Add LIMIT in query:**
```python
LIMIT 10000
```

2. **Implement pagination:**
```python
page_size = 500
LIMIT %(page_size)s OFFSET %(offset)s
```

3. **Increase frontend limit (not recommended):**
```python
# In site_config.json
{
    "max_report_rows": 200000
}
```

4. **Use Prepared Report:**
```python
# Users can export instead of viewing
```

### Problem 5: Database Locks

**Symptoms:**
- "Lock wait timeout exceeded"
- Report hangs
- Other operations blocked

**Cause:**
- Long-running query locks tables
- Prevents other operations

**Solutions:**

1. **Use READ ONLY queries:**
```python
@frappe.read_only()
def execute(filters=None):
    # This won't lock tables
```

2. **Avoid transactions in reports:**
```python
# Don't use frappe.db.begin() in reports
```

3. **Use Prepared Report:**
```python
# Runs in background, doesn't block
```

---

## Best Practices

### Do's

1. **Always require date filters:**
```python
if not filters.get("from_date") or not filters.get("to_date"):
    frappe.throw("Date range is required")
```

2. **Always use LIMIT:**
```python
LIMIT 10000
```

3. **Use database aggregation:**
```python
SELECT SUM(amount), COUNT(*) FROM ...
GROUP BY customer
```

4. **Use JOINs instead of loops:**
```python
SELECT so.name, c.customer_name
FROM `tabSales Order` so
INNER JOIN `tabCustomer` c ON so.customer = c.name
```

5. **Select only needed fields:**
```python
SELECT name, customer, grand_total  -- Not SELECT *
```

6. **Add indexes on filter columns:**
```sql
CREATE INDEX idx_posting_date ON `tabSales Order` (posting_date);
```

7. **Use Prepared Reports for heavy operations:**
```python
# Enable in Report settings
prepared_report = 1
```

8. **Monitor performance:**
```python
# Track execution time and memory
```

9. **Use parameterized queries:**
```python
WHERE posting_date = %(date)s  -- Not f"WHERE posting_date = '{date}'"
```

10. **Test with production data:**
```python
# Test with realistic data volumes
```

### Don'ts 

1. **Don't query without filters:**
```python
# Bad
SELECT * FROM `tabSales Order`
```

2. **Don't use SELECT *:**
```python
# Bad
SELECT * FROM ...
```

3. **Don't load full documents in loops:**
```python
# Bad
for name in names:
    doc = frappe.get_doc("Sales Order", name)
```

4. **Don't aggregate in Python:**
```python
# Bad
total = sum(row.amount for row in all_rows)
```

5. **Don't use N+1 queries:**
```python
# Bad
for order in orders:
    customer = frappe.db.get_value("Customer", order.customer, ...)
```

6. **Don't load child tables unnecessarily:**
```python
# Bad
doc = frappe.get_doc("Sales Order", name)  # Loads all items
```

7. **Don't forget LIMIT:**
```python
# Bad - no limit
SELECT * FROM `tabSales Order` WHERE ...
```

8. **Don't ignore indexes:**
```python
# Bad - no index on posting_date
WHERE posting_date BETWEEN ...
```

9. **Don't use string concatenation in SQL:**
```python
# Bad - SQL injection risk
f"WHERE customer = '{customer}'"
```

10. **Don't test only with small data:**
```python
# Bad - test with 100 rows
# Good - test with 100,000 rows
```

---

## Quick Reference

### Performance Checklist

- [ ] **Date filters required**
- [ ] **LIMIT clause added**
- [ ] **Only needed fields selected**
- [ ] **JOINs instead of loops**
- [ ] **Database aggregation used**
- [ ] **Indexes on filter columns**
- [ ] **Parameterized queries**
- [ ] **No N+1 queries**
- [ ] **No full document loading**
- [ ] **Tested with production data**
- [ ] **Memory usage monitored**
- [ ] **Execution time tracked**
- [ ] **Prepared Report for heavy operations**

### Common Optimizations

| Problem | Solution |
|---------|----------|
| 100% RAM usage | Add LIMIT, use pagination, enable Prepared Report |
| Slow execution | Add indexes, optimize query, use aggregation |
| N+1 queries | Use JOINs, single query with aggregation |
| Too many rows | Add date filter, use LIMIT, implement pagination |
| Full table scan | Add indexes on WHERE columns |
| Loading child tables | Query child table directly with JOIN |
| Frontend won't render | Limit to < 100,000 rows or use Prepared Report |

### Query Optimization Patterns

```python
# Optimized query template
data = frappe.db.sql("""
    SELECT
        -- Only needed fields
        t1.field1,
        t2.field2,
        SUM(t1.amount) as total  -- Database aggregation
    FROM `tabDocType1` t1
    INNER JOIN `tabDocType2` t2 ON t1.ref = t2.name  -- JOIN not loop
    WHERE
        t1.date BETWEEN %(from_date)s AND %(to_date)s  -- Required filter
        AND t1.company = %(company)s  -- Parameterized
    GROUP BY t1.field1  -- Aggregate in database
    ORDER BY total DESC  -- Indexed column
    LIMIT 10000  -- Always limit
""", filters, as_dict=True)
```

### Memory Management Patterns

```python
# Memory-efficient pattern
def execute(filters=None):
    # Validate filters
    if not filters.get("from_date"):
        frappe.throw("Date required")

    # Use generator for large datasets
    with frappe.db.unbuffered_cursor():
        rows = frappe.db.sql(query, filters, as_iterator=True)

        data = []
        for row in rows:
            data.append(process_row(row))

            # Limit results
            if len(data) >= 10000:
                break

    return columns, data
```

### Index Creation Template

```sql
-- Single column index
CREATE INDEX idx_column_name
ON `tabDocType` (column_name);

-- Composite index (order matters!)
CREATE INDEX idx_date_status
ON `tabDocType` (posting_date, status);

-- Check if index exists first
SELECT 1 FROM information_schema.statistics
WHERE table_schema = DATABASE()
    AND table_name = 'tabDocType'
    AND index_name = 'idx_column_name';
```

---

## Summary

### Key Takeaways

1. **Always filter data** - require date ranges
2. **Always limit results** - use LIMIT clause
3. **Use database efficiently** - JOINs, aggregation, indexes
4. **Monitor performance** - track time and memory
5. **Use Prepared Reports** - for heavy operations
6. **Test with real data** - production-like volumes

### Next Steps

1. **Audit your reports** - find slow ones
2. **Add filters and limits** - quick wins
3. **Optimize queries** - use JOINs and aggregation
4. **Add indexes** - on filter columns
5. **Enable Prepared Reports** - for heavy reports
6. **Monitor** - track improvements

**Remember:** The best optimization is **not loading data you don't need**!