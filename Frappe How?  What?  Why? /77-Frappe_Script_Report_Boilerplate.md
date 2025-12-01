# Frappe Script Report Boilerplate

This document provides a comprehensive, generic boilerplate for creating script reports in Frappe/ERPNext. Use this as a starting point for any custom report you need to build.

## Overview

A Frappe script report consists of 3 files:
1. **Python file** (`report_name.py`): Contains the `execute()` function that returns columns and data
2. **JavaScript file** (`report_name.js`): Defines the filter configuration for the report UI
3. **JSON file** (`report_name.json`): Metadata for the report (auto-generated)

#### Why Report is important?
Reports are the most important part of any financial system.

The result of any financial department in any company is generating reports for the Internal parties (Higher Management of the company) and the External parties To help them taking the right decisions.


**NOTE** as a software engineer POV, report is nothing but querying data from the database and showing it in a table or chart THAT'S IT.

---

## Quick Simplified Boilerplate Without Comments

We will make only 4 functions: `execute`, `get_columns`, `get_data`, `get_conditions` THAT'S IT.

```python
import frappe
from frappe import _


def execute(filters=None):
    if not filters:
        return [], []
    columns, data = get_columns(filters), get_data(filters)
    return columns, data


def get_data(filters):
    conditions = get_conditions(filters)
    data = frappe.db.sql(
        """SELECT * FROM `tabDoc A` AS da WHERE {0} )""".format(conditions),
        as_dict=1,
    )
    return data


def get_columns(filters):
	# no.of.columns should equal no.of.columns of data from get_data()
    # to make it simple, think of the one column as a field in your doctype
    columns = [
        {
            "fieldname": "field1",
            "fieldtype": "Link",
            "label": "Field One",
            "options": "Doc B",
        },
    ]
    return columns


def get_conditions(filters):
    conditions = ""
    conditions += "da.date BETWEEN '{0}' and '{1}' ".format(
        filters.get("from_date"), filters.get("to_date")
    )
    if filters.get("company"):
        conditions += " and da.company = '{0}'".format(filters.get("company"))
    if filters.get("filtername"):
        conditions += " and da.related_field = '{0}'".format(filters.get("filtername"))
    return conditions
```

---

## More Detailed Explanation 

## Python Report File Structure

```python
# Copyright (c) [Year], [Your Company] and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    """
    Main entry point for the report.
    
    This function is called by Frappe framework every time the report is refreshed
    or filters are updated. It must return a tuple of (columns, data).
    
    Args:
        filters (dict, optional): Dictionary containing filter values from the UI.
                                  Keys match the 'fieldname' in the JavaScript filters.
    
    Returns:
        tuple: (columns, data) where:
            - columns: List of column definitions (dicts)
            - data: List of row dictionaries or list of lists
    
    Note:
        - If filters is None or empty, you can return empty columns and data
        - The number of columns must match the number of fields in each data row
        - Data can be returned as list of dicts (as_dict=True) or list of lists
    """
    if not filters:
        return [], []
    
    # Get column definitions
    columns = get_columns(filters)
    
    # Get report data based on filters
    data = get_data(filters)
    
    return columns, data


def get_data(filters):
    """
    Execute the database query and return the report data.
    
    Args:
        filters (dict): Filter values from the UI
    
    Returns:
        list: List of dictionaries (rows) containing report data
    
    Best Practices:
        - Always use frappe.db.sql() with parameterized queries to prevent SQL injection
        - Use table aliases for readability (e.g., 'sd' for SourceDocType)
        - Always filter by docstatus if working with transactional documents
        - Use as_dict=True to get results as dictionaries (easier to work with)
    """
    # Build WHERE conditions dynamically based on filters
    conditions = get_conditions(filters)
    
    # Execute SQL query
    # Note: Using .format() is acceptable here since we're building conditions carefully
    # For production, consider using frappe.db.sql() with %s placeholders for better security
    data = frappe.db.sql(
        """
            SELECT 
                sd.name,
                sd.field_one,
                sd.field_two,
                sd.date_field,
                sd.status,
                rd.related_field_name
            FROM `tabSourceDocType` AS sd
            LEFT JOIN `tabRelatedDocType` AS rd ON sd.link_field = rd.name
            WHERE {conditions}
        """.format(conditions=conditions),
        as_dict=True,  # Returns list of dicts instead of list of tuples
    )
    
    return data


def get_columns(filters):
    """
    Define the columns that will be displayed in the report.
    
    Args:
        filters (dict): Filter values (can be used to conditionally show/hide columns)
    
    Returns:
        list: List of column definition dictionaries
    
    Important:
        - The number of columns MUST match the number of fields selected in get_data()
        - Field names in columns must match keys in data dictionaries (if using as_dict=True)
        - Column order should match the SELECT order in your query
    
    Column Fieldtypes Available:
        - "Link": Links to another DocType (requires 'options' field)
        - "Dynamic Link": Dynamic link based on another field (requires 'options' pointing to fieldname)
        - "Data": Text/String data
        - "Currency": Currency values (automatically formatted)
        - "Float": Decimal numbers
        - "Int": Integer numbers
        - "Date": Date values
        - "Datetime": Date and time values
        - "Time": Time values
        - "Check": Boolean/checkbox
        - "Percent": Percentage values
        - "Duration": Duration values
        - "HTML": HTML content
        - "Button": Clickable button (requires 'options' with action)
    """
    columns = [
        {
            "fieldname": "name",
            "fieldtype": "Link",
            "label": _("Document Name"),
            "options": "SourceDocType",
            "width": 200,
        },
        {
            "fieldname": "field_one",
            "fieldtype": "Link",
            "label": _("Related Document"),
            "options": "RelatedDocType",
            "width": 150,
        },
        {
            "fieldname": "field_two",
            "fieldtype": "Data",
            "label": _("Text Field"),
            "width": 200,
        },
        {
            "fieldname": "date_field",
            "fieldtype": "Date",
            "label": _("Date"),
            "width": 100,
        },
        {
            "fieldname": "status",
            "fieldtype": "Data",
            "label": _("Status"),
            "width": 100,
        },
        {
            "fieldname": "related_field_name",
            "fieldtype": "Data",
            "label": _("Related Field"),
            "width": 150,
        },
    ]
    
    return columns


def get_conditions(filters):
    """
    Build SQL WHERE conditions dynamically based on filter values.
    
    Args:
        filters (dict): Filter values from the UI
    
    Returns:
        str: SQL WHERE clause (without the WHERE keyword)
    
    Security Note:
        - Always validate and sanitize filter values before using in SQL
        - Use frappe.db.escape() for string values to prevent SQL injection
        - For dates, ensure they're properly formatted
        - Consider using frappe's query builder for complex queries
    
    Best Practices:
        - Start with mandatory conditions (dates, company, etc.)
        - Add optional conditions only if filter value exists
        - Use proper SQL operators (BETWEEN, IN, LIKE, etc.)
        - Always filter by docstatus for transactional documents
    """
    conditions = []
    
    # Mandatory date range filter
    # Note: Always validate date format in production
    if filters.get("from_date") and filters.get("to_date"):
        conditions.append(
            "sd.date_field BETWEEN '{from_date}' AND '{to_date}'".format(
                from_date=filters.get("from_date"),
                to_date=filters.get("to_date")
            )
        )
    
    # Optional: Filter by company (if applicable)
    if filters.get("company"):
        # Use frappe.db.escape() for security
        company = frappe.db.escape(filters.get("company"))
        conditions.append("sd.company = {company}".format(company=company))
    
    # Optional: Filter by status
    if filters.get("status"):
        status = frappe.db.escape(filters.get("status"))
        conditions.append("sd.status = {status}".format(status=status))
    
    # Optional: Filter by related document
    if filters.get("related_document"):
        related_doc = frappe.db.escape(filters.get("related_document"))
        conditions.append("sd.field_one = {related_doc}".format(related_doc=related_doc))
    
    # Optional: Filter by multiple values (IN clause)
    if filters.get("status_list"):
        # Assuming status_list is a list or comma-separated string
        status_list = filters.get("status_list")
        if isinstance(status_list, str):
            status_list = [s.strip() for s in status_list.split(",")]
        escaped_statuses = [frappe.db.escape(s) for s in status_list]
        conditions.append("sd.status IN ({statuses})".format(
            statuses=", ".join(escaped_statuses)
        ))
    
    # Always filter by docstatus for transactional documents (if applicable)
    # Uncomment if your DocType has docstatus field
    # conditions.append("sd.docstatus = 1")  # 1 = Submitted, 0 = Draft, 2 = Cancelled
    
    # Join conditions with AND
    return " AND ".join(conditions) if conditions else "1=1"  # 1=1 allows query to work if no conditions
```

---

## JavaScript Filter Configuration

```javascript
// Copyright (c) [Year], [Your Company] and contributors
// For license information, please see license.txt

frappe.query_reports["Your Report Name"] = {
    // Filter configuration array
    // Each object defines one filter field in the report UI
    filters: [
        // Date Range Filters (Common Pattern)
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            width: "100px",
            reqd: 1,  // Required field
            default: frappe.datetime.year_start(),  // Default to start of current year
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            width: "100px",
            reqd: 1,  // Required field
            default: frappe.datetime.get_today(),  // Default to today
        },
        
        // Link Field (Dropdown to another DocType)
        {
            fieldname: "company",
            label: __("Company"),
            fieldtype: "Link",
            options: "Company",  // DocType to link to
            width: "150px",
            reqd: 0,  // Optional field
            default: frappe.defaults.get_user_default("Company"),  // User's default company
        },
        {
            fieldname: "related_document",
            label: __("Related Document"),
            fieldtype: "Link",
            options: "RelatedDocType",  // Replace with your DocType
            width: "150px",
            reqd: 0,
        },
        
        // Select Field (Dropdown with predefined options)
        {
            fieldname: "status",
            label: __("Status"),
            fieldtype: "Select",
            options: [
                "",  // Empty option for "All"
                "Draft",
                "Submitted",
                "Cancelled",
                "Rejected"
            ].join("\n"),  // Options separated by newline
            default: "",
            reqd: 0,
            width: "120px",
        },
        
        // Multi-Select (for filtering by multiple values)
        {
            fieldname: "status_list",
            label: __("Status (Multiple)"),
            fieldtype: "MultiSelectList",
            get_data: function(txt) {
                // Return list of options for autocomplete
                return [
                    "Draft",
                    "Submitted",
                    "Cancelled",
                    "Rejected"
                ].filter(d => d.toLowerCase().includes(txt.toLowerCase()));
            },
            reqd: 0,
        },
        
        // Checkbox/Boolean Field
        {
            fieldname: "include_cancelled",
            label: __("Include Cancelled"),
            fieldtype: "Check",
            default: 0,  // 0 = unchecked, 1 = checked
            reqd: 0,
        },
        
        // Integer Field
        {
            fieldname: "min_amount",
            label: __("Minimum Amount"),
            fieldtype: "Int",
            width: "100px",
            reqd: 0,
        },
        
        // Float/Currency Field
        {
            fieldname: "amount",
            label: __("Amount"),
            fieldtype: "Currency",
            width: "120px",
            reqd: 0,
        },
        
        // Data/Text Field
        {
            fieldname: "search_text",
            label: __("Search Text"),
            fieldtype: "Data",
            width: "200px",
            reqd: 0,
        },
        
        // Datetime Field
        {
            fieldname: "datetime_field",
            label: __("Date & Time"),
            fieldtype: "Datetime",
            width: "150px",
            reqd: 0,
        },
        
        // Time Field
        {
            fieldname: "time_field",
            label: __("Time"),
            fieldtype: "Time",
            width: "100px",
            reqd: 0,
        },
        
        // Section Break (Visual separator)
        {
            fieldtype: "Section Break",
            label: __("Advanced Filters"),
        },
        
        // Dynamic Link (Link field that changes based on another field)
        {
            fieldname: "link_doctype",
            label: __("Link DocType"),
            fieldtype: "Link",
            options: "DocType",
            width: "150px",
            reqd: 0,
        },
        {
            fieldname: "link_name",
            label: __("Link Name"),
            fieldtype: "Dynamic Link",
            options: "link_doctype",  // Points to the fieldname above
            width: "150px",
            reqd: 0,
        },
    ],
    
    // Optional: Custom formatter for cells
    formatter: function(value, row, column, data, default_formatter) {
        // Custom formatting logic
        // Return formatted HTML string
        return default_formatter(value, row, column, data);
    },
    
    // Optional: Initialization function
    onload: function(report) {
        // Custom logic when report loads
        // Can set default filters, add custom buttons, etc.
    },
};
```

---

## Filter Fieldtype Reference

### Common Filter Fieldtypes:

| Fieldtype | Description | Use Case | Options Required? |
|-----------|-------------|----------|-------------------|
| `Date` | Date picker | Date ranges, single dates | No |
| `Datetime` | Date and time picker | Timestamp filters | No |
| `Time` | Time picker | Time-based filters | No |
| `Link` | Dropdown to another DocType | Filter by related document | Yes (DocType name) |
| `Dynamic Link` | Link that changes based on another field | Variable document types | Yes (fieldname) |
| `Select` | Dropdown with predefined options | Status, categories | Yes (newline-separated) |
| `MultiSelectList` | Multi-select dropdown | Multiple value filters | Yes (get_data function) |
| `Check` | Checkbox | Boolean filters | No |
| `Data` | Text input | Search text, names | No |
| `Int` | Integer input | Numeric filters | No |
| `Float` | Decimal input | Decimal numeric filters | No |
| `Currency` | Currency input | Amount filters | No |
| `Section Break` | Visual separator | Grouping filters | No |

### Filter Properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `fieldname` | string | **Required.** Name used in Python filters dict | `"company"` |
| `label` | string | **Required.** Display label | `__("Company")` |
| `fieldtype` | string | **Required.** Type of filter field | `"Link"` |
| `options` | string | **Conditional.** DocType name (Link) or options (Select) | `"Company"` or `"Option1\nOption2"` |
| `reqd` | number | Whether field is required (1) or optional (0) | `1` |
| `default` | any | Default value | `frappe.datetime.get_today()` |
| `width` | string | Field width in UI | `"150px"` |
| `mandatory` | boolean | Alternative to reqd | `true` |
| `get_data` | function | For MultiSelectList, returns options | `function(txt) { return [...] }` |

---

## Advanced Patterns

### Using Query Builder (Recommended for Complex Queries)

```python
from frappe.query_builder import functions as fn

def get_data(filters):
    """
    Example using Frappe Query Builder (safer and more readable).
    """
    SourceDocType = frappe.qb.DocType("SourceDocType")
    RelatedDocType = frappe.qb.DocType("RelatedDocType")
    
    query = (
        frappe.qb.from_(SourceDocType)
        .left_join(RelatedDocType)
        .on(SourceDocType.link_field == RelatedDocType.name)
        .select(
            SourceDocType.name,
            SourceDocType.field_one,
            SourceDocType.date_field,
            RelatedDocType.related_field_name
        )
        .where(SourceDocType.date_field[filters.from_date : filters.to_date])
    )
    
    if filters.get("company"):
        query = query.where(SourceDocType.company == filters.company)
    
    if filters.get("status"):
        query = query.where(SourceDocType.status == filters.status)
    
    return query.run(as_dict=True)
```

### Returning Additional Report Data

```python
def execute(filters=None):
    """
    You can return additional data beyond columns and data:
    - message: Status message to display
    - chart: Chart configuration
    - report_summary: Summary cards at the top
    """
    columns = get_columns(filters)
    data = get_data(filters)
    
    # Optional: Status message
    message = _("Report generated successfully")
    
    # Optional: Chart configuration
    chart = {
        "data": {
            "labels": ["Label1", "Label2"],
            "datasets": [{"values": [10, 20]}]
        },
        "type": "bar"
    }
    
    # Optional: Summary cards
    report_summary = [
        {
            "value": len(data),
            "label": _("Total Records"),
            "indicator": "blue"
        }
    ]
    
    return columns, data, message, chart, report_summary
```

### Conditional Columns

```python
def get_columns(filters):
    """
    Show/hide columns based on filters.
    """
    columns = [
        {"fieldname": "name", "label": _("Name"), "fieldtype": "Link", "options": "SourceDocType"},
    ]
    
    # Add column only if specific filter is set
    if filters.get("show_details"):
        columns.append({
            "fieldname": "details",
            "label": _("Details"),
            "fieldtype": "Data"
        })
    
    return columns
```

---

## Best Practices

1. **Security**: Always use `frappe.db.escape()` for string values in SQL queries
2. **Performance**: Add indexes on frequently filtered fields
3. **User Experience**: Provide sensible defaults for date filters
4. **Documentation**: Add docstrings explaining what each function does
5. **Error Handling**: Validate filters before using them in queries
6. **Naming**: Use descriptive table aliases (e.g., `sd` for SourceDocType)
7. **Testing**: Test with various filter combinations, including empty filters
8. **Localization**: Use `_()` function for all user-facing strings

---

## Common Issues & Solutions

### Issue: Column count mismatch
**Solution**: Ensure the number of columns matches the number of fields in your SELECT statement.

### Issue: Filter not working
**Solution**: Check that `fieldname` in JavaScript matches the key used in Python `filters.get()`.

### Issue: SQL injection vulnerability
**Solution**: Use `frappe.db.escape()` for all string values or use Query Builder.

### Issue: Report too slow
**Solution**: Add proper WHERE conditions, use indexes, and limit data with date ranges.

---

## File Location

Place your report files in:
- **Python**: `[your_app]/[your_app]/report/[report_name]/[report_name].py`
- **JavaScript**: `[your_app]/[your_app]/report/[report_name]/[report_name].js`

Example:
```
apps/my_app/
└── my_app/
    └── report/
        └── my_custom_report/
            ├── my_custom_report.py
            └── my_custom_report.js
```

---

## Next Steps

1. Copy the boilerplate code
2. Replace generic names (`SourceDocType`, `RelatedDocType`) with your actual DocTypes
3. Update field names to match your DocType fields
4. Customize filters based on your requirements
5. Test the report with various filter combinations
---

## Additional Resources

- [ERPNext Report Examples](https://github.com/frappe/erpnext/tree/develop/erpnext/accounts/report)
- [How to Create Custom Reports in Frappe](./33-How-to-Create-Custom-Reports.md)