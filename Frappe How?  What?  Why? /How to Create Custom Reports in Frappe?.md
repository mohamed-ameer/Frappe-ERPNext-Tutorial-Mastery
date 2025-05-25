# How to Create Custom Reports in Frappe

This comprehensive guide explains how to create custom reports in Frappe Framework, based on analysis of real-world examples from my experience. Frappe supports three main types of reports: **Script Reports** , **Query Reports** and **Report Builder**.


Frappe lets you build **custom reports** to display data from your system. Two common types are **Script Reports** and **Query Reports**. Script Reports use Python code to prepare data, while Query Reports use a raw SQL query. This guide explains how to create each type, what files are involved, and includes simple code examples. It assumes you have **Developer Mode** enabled and basic knowledge of Frappe/App structure.

## Table of Contents
1. [Report Types Overview](#report-types-overview)
2. [File Structure](#file-structure)
3. [Script Report: Step-by-Step](#script-report-step-by-step)
4. [Query Report: Step-by-Step](#query-report-step-by-step)
5. [Key Files and Their Roles](#key-files-and-their-roles)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Column Format Specifications](#column-format-specifications)
9. [Create Custom Print Format for a Script Report](#create-custom-print-format-for-a-script-report)

---

## 1. Report Types Overview

### Script Report
- **Most flexible and powerful**
- Uses Python for data processing and complex logic
- Supports dynamic columns, custom calculations, and data aggregation
- Requires Python (.py) file for backend logic
- Optional JavaScript (.js) file for frontend filters and interactions

### Query Report
- **Simple and direct**
- Uses raw SQL queries defined in JSON configuration
- Best for straightforward data extraction
- No Python file needed
- Optional JavaScript (.js) file for filters

### Report Builder
- **Visual/GUI-based**
- Created through Frappe's web interface
- Uses JSON configuration with visual settings
- Limited customization but user-friendly
- No coding required

---

## 2. File Structure

Every custom report follows this directory structure:
```
apps/[app_name]/[app_name]/[module]/report/[report_name]/
├── __init__.py                    # Required Python package file
├── [report_name].json            # Report configuration (required)
├── [report_name].py              # Python logic (Script Reports only)
└── [report_name].js              # Frontend filters/logic (optional)
```

---

## 3. Script Report: Step-by-Step

**Script Reports** are reports written in Python. They give you full flexibility (you can run complex logic, multiple queries, charts, etc.), but require Administrator rights and Developer Mode.

It basically depends on: [python Dict datatype + SQL Query] that's it, literally that's it

### Step 1: Create Report via UI
1. **Enable Developer Mode** and log in as an Administrator.
2. Go to **Report List** in your app
3. Click **New Report**
4. Fill basic details:
   - **Report Name**: "My Custom Report"
   - **Module**: Select your target module
   - **Report Type**: "Script Report"
   - **Reference DocType**: Base doctype for the report (that we will Query data from)
   - Set **Is Standard = Yes**
3. Save the report. Frappe will create a folder in your app with boilerplate files.
4. **`report_name.py`**: implement `execute(filters=None)` function.
5. **`report_name.js`**: (Optional) define any filters.

### Key files for a Script Report

- `report_name.py` – Contains the Python logic.
- `report_name.js` – (Optional) Defines filters.
- `report_name.json` – Metadata (auto-generated).

### Quick Example – Simple Script Report

```python
def execute(filters=None):
    columns = [
        {"fieldname": "account", "label": "Account", "fieldtype": "Link", "options": "Account"},
        {"fieldname": "balance", "label": "Balance", "fieldtype": "Currency"}
    ]
    data = [
        {"account": "Cash", "balance": 100},
        {"account": "Bank", "balance": 250}
    ]
    return columns, data
```

### Quick Example Filter (JS)

```javascript
frappe.query_reports["My Report"] = {
    filters: [
        {
            fieldname: "start_date",
            label: __("Start Date"),
            fieldtype: "Date"
        },
        {
            fieldname: "end_date",
            label: __("End Date"),
            fieldtype: "Date"
        }
    ]
};
```

### Step 2: Create Python Logic
**File**: `[report_name].py`
```python
# Copyright (c) 2024, Your Company and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    """Main entry point for the report"""
    filters = frappe._dict(filters or {})
    columns = get_columns(filters)
    data = get_data(filters)
    return columns, data

def get_columns(filters):
    """Define report columns"""
    return [
        {
            "label": _("ID"),
            "fieldtype": "Link",
            "fieldname": "name",
            "options": "Your DocType",
            "width": 120,
        },
        {
            "label": _("Status"),
            "fieldtype": "Data",
            "fieldname": "status",
            "width": 100,
        },
        {
            "label": _("Amount"),
            "fieldtype": "Currency",
            "fieldname": "amount",
            "width": 120,
        }
    ]

def get_data(filters):
    """Fetch and process data"""
    conditions = []
    values = {}

    if filters.get("organization"):
        conditions.append("organization = %(organization)s")
        values["organization"] = filters.organization

    where_clause = " AND ".join(conditions)
    if where_clause:
        where_clause = "WHERE " + where_clause

    query = f"""
        SELECT
            name,
            status,
            amount
        FROM `tabYour DocType`
        {where_clause}
        ORDER BY creation DESC
    """

    return frappe.db.sql(query, values=values, as_dict=True)
```

### Step 4: Create JavaScript Filters (Optional)
**File**: `[report_name].js`
```javascript
// Copyright (c) 2024, Your Company and contributors
// For license information, please see license.txt

frappe.query_reports["My Custom Report"] = {
    "filters": [
        {
            fieldname: "organization",
            label: __("organization"),
            fieldtype: "Link",
            options: "organization",
            default: frappe.defaults.get_user_default("organization"),
            reqd: 1,
        },
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: frappe.datetime.year_start(),
            reqd: 1,
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: frappe.datetime.year_end(),
            reqd: 1,
        }
    ]
};
```

---

## 4. Query Report: Step-by-Step
**Query Reports** use SQL queries to generate reports.

### Steps to create a Query Report
Same as Script Report, but select **"Query Report"** as Report Type.
1. Go to “New Report” and choose:
   - **Report Type = “Query Report”**
   - **Reference DocType**
   - **Module**
2. Enter SQL in the “Query” field.
3. (Optional) Add filters via `report_name.js`
4. Use `%(filter)s` syntax to inject filter values in SQL.

### Example – Simple Query Report

```sql
SELECT
  name AS "Name:Link/Item:200",
  stock_uom AS "UOM:Data:100",
  ifnull(sum(bin.actual_qty),0) AS "Stock:Float:100"
FROM `tabItem`
LEFT JOIN `tabBin` bin ON bin.item_code = `tabItem`.name
GROUP BY `tabItem`.name, `tabItem`.stock_uom;
```

### Example Filter (JS)

```javascript
frappe.query_reports["My Query Report"] = {
    filters: [
        {
            fieldname: "item_code",
            label: __("Item Code"),
            fieldtype: "Link",
            options: "Item"
        },
        {
            fieldname: "status",
            label: __("Status"),
            fieldtype: "Select",
            options: ["Open", "Closed"],
            default: "Open"
        }
    ]
};
```

---

## 5. Key Files and Their Roles

### JSON Configuration File (.json)
- **Purpose**: Defines report metadata and configuration
- **Required for**: All report types
- **Key fields**:
  - `report_type`: "Script Report", "Query Report", or "Report Builder"
  - `ref_doctype`: Base DocType for the report
  - `query`: SQL query (Query Reports only)
  - `roles`: User roles that can access the report
  - `add_total_row`: Whether to add totals row

### Python Logic File (.py)
- **Purpose**: Contains backend logic for data processing
- **Required for**: Script Reports only
- **Key functions**:
  - `execute(filters)`: Main entry point, returns (columns, data)
  - `get_columns(filters)`: Defines report columns
  - `get_data(filters)`: Fetches and processes data

### JavaScript File (.js)
- **Purpose**: Defines frontend filters and interactions
- **Required for**: Optional for all report types
- **Key features**:
  - Filter definitions
  - Dynamic filter behavior
  - Custom formatting
  - Event handlers

### Package File (__init__.py)
- **Purpose**: Makes directory a Python package
- **Required for**: All reports
- **Content**: Usually empty

---

## 6. Advanced Features

### Dynamic Columns
```python
def get_columns(filters, project_types):
    columns = [
        {"label": _("Product"), "fieldtype": "Data", "fieldname": "product"}
    ]

    # Add dynamic columns based on data
    for project_type in project_types:
        columns.append({
            "label": _(project_type["title"]),
            "fieldtype": "Int",
            "fieldname": project_type["id"],
        })

    return columns
```

### Complex Filters with Dependencies
```javascript
{
    fieldname: "field_name",
    label: __("Field Name"),
    fieldtype: "Link",
    options: "DocType",
    get_query: function() {
        return {
            filters: {
                "field_name": frappe.query_report.get_filter_value("field_name")
            }
        };
    }
}
```

### Conditional Logic in Filters
```javascript
{
    fieldname: "time_window",
    label: __("Time Window"),
    fieldtype: "Select",
    options: ['Annual', 'Quarterly', 'Monthly'],
    on_change: function(report) {
        const value = this.get_value();
        if (value == "Annual") {
            report.set_filter_value('from_date', frappe.datetime.year_start());
            report.set_filter_value('to_date', frappe.datetime.year_end());
        }
        report.refresh();
    }
}
```

### Multi-Select Filters
```javascript
{
    fieldname: "account",
    label: __("Account"),
    fieldtype: "MultiSelectList",
    options: "Account",
    get_data: function (txt) {
        return frappe.db.get_link_options("Account", txt, {
            company: frappe.query_report.get_filter_value("organization"),
        });
    },
}
```

### Data Aggregation and Processing
```python
def get_dynamic_aggregation(filters, group_by_field, dynamic_field, dynamic_items, aggregation_field, base_tables):
    """
    Generate and execute a dynamic SQL aggregation query.

    Args:
        filters (dict): Dictionary of filter values to pass to SQL (used in WHERE clause).
        group_by_field (str): Field to group results by (e.g., 'product_name').
        dynamic_field (str): Field used to create dynamic aggregation columns (e.g., 'project_type').
        dynamic_items (list): List of objects with 'id' and 'title' to define dynamic columns.
        aggregation_field (str): Field to sum in each dynamic column (e.g., 'amount').
        base_tables (str): Inner SQL query string to be used as the base table for aggregation.

    Returns:
        list: Query result as list of dictionaries.
    """
    # Start SELECT statement
    query = f"SELECT {group_by_field},"

    # Add dynamic columns safely
    query += "\n" + ",\n".join([
        f"SUM(CASE WHEN {dynamic_field} = %(val_{i})s THEN {aggregation_field} ELSE 0 END) AS \"{item.title}\""
        for i, item in enumerate(dynamic_items)
    ])

    # Add total aggregation and FROM
    query += f",\nSUM({aggregation_field}) AS total\nFROM (\n{base_tables}\n) AS inner_query\n"
    query += f"GROUP BY {group_by_field}"

    # Add dynamic values to filters
    for i, item in enumerate(dynamic_items):
        filters[f"val_{i}"] = item.id

    return frappe.db.sql(query, values=filters, as_dict=True)

# Inputs
filters = {"organization": "Org001"}
project_types = [{"id": "TypeA", "title": "Agriculture"}, {"id": "TypeB", "title": "Technology"}]

group_by = "product_name"
dynamic_field = "project_type"
aggregation_field = "total_amount"
base_sql = """
    SELECT
        A.group_label_field AS group_by_value,
        B.dynamic_category_field AS dynamic_value,
        SUM(C.aggregation_metric_field) AS aggregated_total
    FROM `tabMainTable` C
    JOIN `tabJoinTable1` B ON B.foreign_key_1 = C.primary_key
    JOIN `tabJoinTable2` A ON B.foreign_key_2 = A.primary_key
    WHERE C.filter_field = %(filter_param)s
    GROUP BY A.group_label_field, B.dynamic_category_field
"""

# Call the generalized function
result = get_dynamic_aggregation(filters, group_by, dynamic_field, project_types, aggregation_field, base_sql)
```

---

## 7. Best Practices

### Performance
- Use parameterized queries to prevent SQL injection
- Add appropriate WHERE clauses to limit data
- Use indexes on filtered columns
- Consider pagination for large datasets

### Security
- Always validate and sanitize filter inputs
- Use `frappe.db.sql()` with `values` parameter
- Set appropriate role permissions
- Avoid exposing sensitive data

### Code Organization
- Keep functions small and focused
- Use meaningful variable names
- Add proper error handling
- Include comprehensive comments

### User Experience
- Provide sensible default filter values
- Use appropriate field types for filters
- Add helpful labels and descriptions
- Consider mobile responsiveness

---

## 8. Column Format Specifications

### Column Definition Formats
```python
# Method 1: Dictionary format (recommended)
{
    "label": _("Amount"),
    "fieldtype": "Currency",
    "fieldname": "amount",
    "width": 120,
    "options": "default_currency"  # For currency fields
}

# Method 2: String format (shorthand)
"Amount:Currency:120"
"ID:Link/DocType:90"
"Status::80"  # Auto-width
```

### Common Field Types
- `Data`: Plain text
- `Link`: Reference to another DocType
- `Currency`: Monetary values
- `Int`: Integer numbers
- `Float`: Decimal numbers
- `Date`: Date values
- `Datetime`: Date and time values
- `Check`: Boolean checkbox

---

## 9. Create Custom Print Format for a Script Report

[check this](./How to Create Custom Print Format for a Script Report?.md)

---

## Script vs Query Reports

| Feature            | Script Report     | Query Report     |
|--------------------|-------------------|------------------|
| Language           | Python            | SQL              |
| Role Needed        | Administrator     | System Manager   |
| File Types         | .py, .js, .json   | .json, .js       |
| Flexibility        | High              | Moderate         |
| Filters Support    | Yes (via JS)      | Yes (via JS + SQL)|

## Typical File Structure

```
/apps/your_app/your_app/your_module/report/your_report/
    ├── your_report.py
    ├── your_report.js
    └── your_report.json
```

## Conclusion

Script Reports offer the most control and customization but require developer access. Query Reports are easier to write and ideal for simpler tabular views using SQL. Use the type that best fits your use case.

---
## More Usefull Resources
https://discuss.frappe.io/t/tutorial-script-report-chart/79873
https://discuss.frappe.io/t/tutorial-script-reports-in-erpnext-a-step-by-step-guide/110969
https://cloud.erpgulf.com/blog/blogs/script-and-query-report-creation-walkthrough-with-examples

---
This comprehensive documentation provides everything needed to create custom reports in Frappe, from basic examples to advanced features used in production applications.