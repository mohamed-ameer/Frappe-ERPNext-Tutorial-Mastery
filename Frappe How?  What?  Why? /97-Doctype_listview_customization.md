# DocType List View Customization (`doctype_list.js`) in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding List Views](#understanding-list-views)
3. [File Structure and Location](#file-structure-and-location)
4. [List View Settings Object](#list-view-settings-object)
5. [Core Properties](#core-properties)
6. [Event Handlers](#event-handlers)
7. [Customization Methods](#customization-methods)
8. [Complete Examples](#complete-examples)
9. [Advanced Patterns](#advanced-patterns)
10. [Best Practices](#best-practices)
11. [Common Use Cases](#common-use-cases)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

`doctype_list.js` files are JavaScript files that customize the list view behavior for DocTypes in Frappe. They allow you to add custom functionality, modify appearance, add bulk actions, and enhance the user experience in list views.

### What is a List View?

A list view is the page that displays multiple documents of a DocType in a table format. It shows:
- Document names
- Key fields (as columns)
- Status indicators
- Action buttons
- Filters and search

### What Can You Customize?

- **Indicators**: Status badges with colors
- **Additional Fields**: Load extra fields not in list view
- **Default Filters**: Pre-filter the list
- **Bulk Actions**: Actions on multiple selected documents
- **Menu Items**: Custom menu options
- **Row Formatting**: Customize how rows appear
- **Gantt Chart**: Customize Gantt view popups

---

## Understanding List Views

### List View Components

```
┌─────────────────────────────────────────────────┐
│  List View Page                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Toolbar (Filters, Search, Actions)        │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  List Rows                                  │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │ [✓] Document Name | Field1 | Field2  │ │  │
│  │  │      [Status Badge]        [Amount]  │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │ [✓] Document Name | Field1 | Field2  │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  Pagination                                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### List View Lifecycle

```
Page Loads
    ↓
List View Initialized
    ↓
onload() Event (if defined)
    ↓
Data Fetched
    ↓
Rows Rendered
    ↓
get_indicator() Called (for each row)
    ↓
refresh() Event (if defined)
    ↓
User Interactions
```

---

## File Structure and Location

### File Naming Convention

The file must be named: `<doctype_name>_list.js`

**Examples**:
- `sales_invoice_list.js` for "Sales Invoice" DocType
- `task_list.js` for "Task" DocType
- `employee_list.js` for "Employee" DocType

### File Location

Place the file in the DocType's directory:

```
app_name/
└── app_name/
    └── doctype/
        └── doctype_name/
            ├── doctype_name.py
            ├── doctype_name.js
            ├── doctype_name.json
            └── doctype_name_list.js  ← Here
```

### Basic File Structure

```javascript
frappe.listview_settings["DocType Name"] = {
    // Settings object
};
```

**Important**: The DocType name in the settings object must match exactly (case-sensitive).

---

## List View Settings Object

### Basic Structure

```javascript
frappe.listview_settings["DocType Name"] = {
    // Properties and methods
    add_fields: [...],
    filters: [...],
    get_indicator: function(doc) {},
    onload: function(listview) {},
    refresh: function(listview) {},
    // ... more properties
};
```

### Settings Object Properties

The settings object can contain:

1. **`add_fields`**: Array of field names to load
2. **`filters`**: Default filters for the list
3. **`get_indicator`**: Function to return status indicator
4. **`onload`**: Function called when list view loads
5. **`refresh`**: Function called when list refreshes
6. **`get_list_row`**: Function to customize row HTML
7. **`right_column`**: Field to show in right column
8. **`button`**: Custom button configuration
9. **`formatters`**: Custom formatters for fields
10. **`gantt_custom_popup_html`**: Custom Gantt popup HTML

---

## Complete List of Properties

The following table contains **all available properties** that can be set in `frappe.listview_settings[doctype]`:

| Property | Type | Default | Effect | Description |
|----------|------|---------|--------|-------------|
| **`add_fields`** | `Array<string>` | `[]` | Data Loading | Specifies additional fields to fetch from the database that aren't displayed in columns but are needed for indicators, calculations, or conditional logic. These fields are loaded with each row but not shown in the list view columns. |
| **`filters`** | `Array<Array>` | `[]` | Filtering | Sets default filters applied when the list view loads. Each filter is an array: `["fieldname", "operator", "value"]`. Filters are applied automatically unless user has saved custom filters. |
| **`get_indicator`** | `Function(doc)` | `undefined` | Status Display | Function that returns a status indicator (badge) for each row. Must return `[label, color, filter_string]` or `undefined`. The indicator appears as a colored badge next to each row. |
| **`onload`** | `Function(listview)` | `undefined` | Initialization | Function called **once** when the list view is first loaded. Use this to add action items, menu items, or perform one-time setup. Receives the `listview` instance as parameter. |
| **`refresh`** | `Function(listview)` | `undefined` | Refresh Handler | Function called **every time** the list view refreshes (data reload, filter change, etc.). Use this for dynamic updates that need to happen on each refresh. Receives the `listview` instance as parameter. |
| **`before_render`** | `Function()` | `undefined` | Pre-render Hook | Function called before the list rows are rendered. Use this to perform actions or save state before rendering. No parameters passed. |
| **`primary_action`** | `Function()` | `undefined` | Button Override | Function that overrides the default "Add" button behavior. When defined, clicking the primary "Add" button calls this function instead of creating a new document. If not defined, default behavior (create new doc) is used. |
| **`hide_name_column`** | `Boolean` | `false` | Column Visibility | When `true`, hides the "ID" (name) column in the list view. Only applies when the DocType has a `title_field` that is different from `name`. When `false` (default), the name column is shown as the last column. |
| **`right_column`** | `String` | `undefined` | Column Display | Specifies a field name to display in the right column of each row (next to metadata like comments, likes). This field appears on the right side of each list row, separate from the main columns. |
| **`button`** | `Object` | `undefined` | Custom Button | Object with methods to add a custom button to each row: `show(doc)`, `get_label(doc)`, `get_description(doc)`, `action(doc)`. The button appears in each row when `show()` returns truthy. |
| **`formatters`** | `Object<Function>` | `{}` | Field Formatting | Object where keys are field names and values are formatting functions. Each function receives `(value, df, doc)` and returns formatted HTML/string. Used to customize how specific fields are displayed in the list. |
| **`get_form_link`** | `Function(doc)` | `undefined` | Link Override | Function that returns a custom URL for the row link. Receives the document object and should return a URL string. If not defined, default form link is used (`/app/doctype/docname`). |
| **`empty_state_image`** | `String` | Default image | Empty State | URL or path to a custom image shown when the list is empty. Overrides the default empty state image. Should be a valid image path or URL. |
| **`has_indicator_for_draft`** | `Boolean` | `false` | Indicator Control | When `true`, shows a status indicator for draft documents (docstatus = 0) in submittable DocTypes. When `false` (default), draft documents don't show indicators unless explicitly defined in `get_indicator`. |
| **`has_indicator_for_cancelled`** | `Boolean` | `false` | Indicator Control | When `true`, shows a status indicator for cancelled documents (docstatus = 2) in submittable DocTypes. When `false` (default), cancelled documents don't show indicators unless explicitly defined in `get_indicator`. |
| **`gantt_custom_popup_html`** | `Function(ganttobj, task)` | `undefined` | Gantt Chart | Function that returns custom HTML for Gantt chart popups. Receives `ganttobj` (Gantt object) and `task` (document data). Should return HTML string. Only used when viewing the DocType in Gantt view. |
| **`required_libs`** | `Array<string>` | `[]` | Library Loading | Array of JavaScript library paths that must be loaded before the list view initializes. Libraries are loaded using `frappe.require()`. Use this when your list view code depends on external libraries. |

**Note**: While `can_create` is not a direct settings property, you can override the `listview.can_create` property in the `onload` handler to programmatically control the create button visibility. See the "Controlling Create Button" section below for details.

### Property Categories

**Data & Filtering Properties:**
- `add_fields`: Load additional data
- `filters`: Set default filters

**UI Display Properties:**
- `get_indicator`: Status badges
- `hide_name_column`: Column visibility
- `right_column`: Right column field
- `formatters`: Field formatting
- `empty_state_image`: Empty state image
- `button`: Custom row buttons

**Behavior Control Properties:**
- `primary_action`: Override create button
- `get_form_link`: Custom row links
- `has_indicator_for_draft`: Draft indicator control
- `has_indicator_for_cancelled`: Cancelled indicator control

**Event Handler Properties:**
- `onload`: Initial load handler
- `refresh`: Refresh handler
- `before_render`: Pre-render hook

**View-Specific Properties:**
- `gantt_custom_popup_html`: Gantt view customization
- `required_libs`: Library dependencies

### Important Notes

1. **`can_create` can be overridden in `onload`**: While `can_create` is not a direct settings property, you can override it in the `onload` handler by setting `listview.can_create = false` or `listview.can_create = true`. This allows you to programmatically hide or show the create button based on custom logic, even if the user has permissions. After setting it, you may need to call `listview.set_primary_action()` to update the button immediately.

2. **Property Priority**: User-saved filters take priority over `filters` in settings. If a user has saved filters, those are used instead of the default filters.

3. **Function Context**: All function properties (`onload`, `refresh`, `get_indicator`, etc.) receive the appropriate context (listview instance, document object, etc.) as parameters.

4. **Return Values**: Functions that return values (`get_indicator`, `get_form_link`, `formatters`) must return the correct type or `undefined` to avoid errors.

---

## Core Properties

### 1. `add_fields`

**Purpose**: Load additional fields that aren't in the list view columns but needed for indicators or logic.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    add_fields: ["field1", "field2", "field3"]
};
```

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    add_fields: [
        "customer",
        "customer_name",
        "grand_total",
        "outstanding_amount",
        "due_date",
        "status"
    ]
};
```

**Why Use It?**:
- Fields needed for `get_indicator()` but not displayed
- Fields needed for calculations
- Fields needed for conditional logic

**Best Practice**: Only add fields you actually need to avoid unnecessary data loading.

### 2. `hide_name_column`

**Purpose**: Control visibility of the "ID" (name) column in the list view.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    hide_name_column: true  // or false
};
```

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    hide_name_column: true  // Hides the "ID" column
};
```

**When to Use**:
- When the DocType has a meaningful `title_field` and showing the name column is redundant
- To reduce clutter in the list view
- When the name is not important for users

**Note**: This only has an effect when the DocType has a `title_field` that is different from `name`. If `title_field` is `name`, this property has no effect.

### 3. `primary_action`

**Purpose**: Override the default behavior of the "Add" (create) button in the list view.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    primary_action: function() {
        // Custom action
    }
};
```

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    primary_action: function() {
        // Show a dialog to select invoice type before creating
        frappe.prompt([
            {
                fieldname: "invoice_type",
                label: __("Invoice Type"),
                fieldtype: "Select",
                options: "Sales\nPurchase",
                reqd: 1
            }
        ], function(data) {
            frappe.new_doc("Invoice", {
                invoice_type: data.invoice_type
            });
        });
    }
};
```

**Important Notes**:
- **`can_create` is NOT a settings property**: The create button's visibility is controlled by user permissions, not by list view settings. The button automatically hides if the user doesn't have "Create" permission.
- **`primary_action` overrides default behavior**: When defined, clicking the "Add" button calls this function instead of directly creating a new document.
- **If `primary_action` is not defined**: The default behavior (create new document) is used.

**When to Use**:
- When you need to show a dialog before creating a document
- When you need to set default values based on filters
- When you need custom logic before document creation

### 4. `filters`

**Purpose**: Set default filters that apply when the list view loads.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    filters: [
        ["fieldname", "operator", "value"],
        ["fieldname2", "operator", "value2"]
    ]
};
```

**Example**:
```javascript
frappe.listview_settings["Task"] = {
    filters: [["status", "=", "Open"]]
};
```

**Operators**:
- `=`: Equals
- `!=`: Not equals
- `>`: Greater than
- `<`: Less than
- `>=`: Greater than or equal
- `<=`: Less than or equal
- `like`: Contains
- `in`: In list
- `not in`: Not in list

**Example with Multiple Filters**:
```javascript
frappe.listview_settings["Document"] = {
    filters: [
        ["status", "=", "Active"],
        ["docstatus", "=", 1],
        ["company", "=", frappe.defaults.get_default("company")]
    ]
};
```

### 5. `get_indicator`

**Purpose**: Return a status indicator (badge) for each row based on document data.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    get_indicator: function(doc) {
        return [label, color, filter_string];
    }
};
```

**Return Value**: Array with 3 elements:
1. **Label**: Text to display (translated)
2. **Color**: Color of the indicator (green, red, orange, yellow, blue, gray, etc.)
3. **Filter String**: Filter to apply when clicking the indicator

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    get_indicator: function(doc) {
        if (doc.status === "Paid") {
            return [__("Paid"), "green", "status,=,Paid"];
        } else if (doc.status === "Unpaid") {
            return [__("Unpaid"), "orange", "status,=,Unpaid"];
        } else if (doc.status === "Overdue") {
            return [__("Overdue"), "red", "status,=,Overdue"];
        }
    }
};
```

**Color Options**:
- `green`: Success/Complete
- `red`: Error/Urgent
- `orange`: Warning/Pending
- `yellow`: Caution/Partial
- `blue`: Info/Active
- `gray` or `grey`: Inactive/Neutral
- `darkgrey`: Disabled

**Complex Example**:
```javascript
frappe.listview_settings["Order"] = {
    add_fields: ["status", "delivery_date", "per_delivered"],
    get_indicator: function(doc) {
        if (doc.status === "Closed") {
            return [__("Closed"), "green", "status,=,Closed"];
        } else if (doc.status === "On Hold") {
            return [__("On Hold"), "orange", "status,=,On Hold"];
        } else if (doc.per_delivered < 100) {
            // Check if overdue
            if (frappe.datetime.get_diff(doc.delivery_date) < 0) {
                return [__("Overdue"), "red", "per_delivered,<,100|delivery_date,<,Today"];
            } else {
                return [__("To Deliver"), "orange", "per_delivered,<,100"];
            }
        } else if (doc.per_delivered === 100) {
            return [__("Delivered"), "green", "per_delivered,=,100"];
        }
    }
};
```

### 6. `right_column`

**Purpose**: Specify which field to display in the right column of the list row.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    right_column: "fieldname"
};
```

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    right_column: "grand_total"
};
```

**Use Case**: Display important numeric values (amounts, quantities) prominently.

### 7. `has_indicator_for_draft`

**Purpose**: Show indicator even for draft (unsaved) documents.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    has_indicator_for_draft: 1
};
```

**Example**:
```javascript
frappe.listview_settings["Asset"] = {
    has_indicator_for_draft: 1,
    get_indicator: function(doc) {
        if (doc.docstatus === 0) {
            return [__("Draft"), "red", "docstatus,=,0"];
        }
        // ... other indicators
    }
};
```

---

## Event Handlers

### 1. `onload`

**Purpose**: Called once when the list view is first loaded. Use for setup, adding buttons, configuring filters, or overriding listview properties like `can_create`.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    onload: function(listview) {
        // listview is the ListView instance
        // Setup code here
    }
};
```

**Controlling Create Button Visibility**:

You can override the `can_create` property in the `onload` handler to programmatically hide or show the create button:

```javascript
frappe.listview_settings["Document"] = {
    onload: function(listview) {
        // Hide create button even if user has permissions
        listview.can_create = false;
        
        // Or show it conditionally
        if (some_condition) {
            listview.can_create = false;
        } else {
            listview.can_create = true;
        }
        
        // Update the button immediately
        listview.set_primary_action();
    }
};
```

**Real Example from Codebase**:
```javascript
frappe.listview_settings["Loan"] = {
    onload: function(listview) {
        // Hide create button - documents should be created through a different process
        listview.can_create = false;
    }
};
```

**Important Notes**:
- `can_create` is initially set based on user permissions (`frappe.model.can_create()`)
- Overriding it in `onload` allows you to hide/show the button based on custom business logic
- After setting `listview.can_create`, call `listview.set_primary_action()` to update the button immediately
- If you don't call `set_primary_action()`, the change will take effect on the next refresh

**Available on `listview`**:
- `listview.page`: Page object
- `listview.doctype`: DocType name
- `listview.can_create`: Boolean - can be overridden to control create button
- `listview.set_primary_action()`: Method to update/create the primary action button
- `listview.get_checked_items()`: Get selected documents
- `listview.call_for_selected_items()`: Call method for selected items
- `listview.refresh()`: Refresh the list

**Example**:
```javascript
frappe.listview_settings["Order"] = {
    onload: function(listview) {
        // Add action button
        if (frappe.model.can_create("Invoice")) {
            listview.page.add_action_item(__("Create Invoice"), function() {
                // Create invoice from selected orders
                let selected = listview.get_checked_items();
                // Process selected items
            });
        }
        
        // Add menu item
        listview.page.add_menu_item(__("Close Orders"), function() {
            listview.call_for_selected_items(
                "app.module.doctype.order.order.close_orders",
                { status: "Closed" }
            );
        });
    }
};
```

### 2. `refresh`

**Purpose**: Called every time the list view refreshes (after data loads, after filters change, etc.).

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    refresh: function(listview) {
        // Called on every refresh
    }
};
```

**When It's Called**:
- After initial load
- After applying filters
- After search
- After bulk operations
- After manual refresh

**Example**:
```javascript
frappe.listview_settings["Document"] = {
    refresh: function(listview) {
        // Update UI based on current state
        let checked = listview.get_checked_items();
        if (checked.length > 0) {
            // Show additional options when items are selected
        }
    }
};
```

**Difference from `onload`**:
- `onload`: Called once on initial load
- `refresh`: Called every time list refreshes

---

## Customization Methods

### 1. Adding Action Items

**Purpose**: Add buttons in the toolbar that perform actions on selected documents.

**Syntax**:
```javascript
listview.page.add_action_item(label, callback, group);
```

**Example**:
```javascript
frappe.listview_settings["Order"] = {
    onload: function(listview) {
        listview.page.add_action_item(__("Create Invoice"), function() {
            let selected = listview.get_checked_items();
            if (selected.length === 0) {
                frappe.msgprint(__("Please select at least one order"));
                return;
            }
            // Create invoice logic
        });
    }
};
```

**Multiple Action Items**:
```javascript
frappe.listview_settings["Order"] = {
    onload: function(listview) {
        // Group 1: Create actions
        listview.page.add_action_item(__("Invoice"), createInvoice, __("Create"));
        listview.page.add_action_item(__("Delivery Note"), createDelivery, __("Create"));
        
        // Group 2: Other actions
        listview.page.add_action_item(__("Print"), printDocuments);
    }
};
```

### 2. Adding Menu Items

**Purpose**: Add items to the "Actions" menu (three-dot menu).

**Syntax**:
```javascript
listview.page.add_menu_item(label, callback);
```

**Example**:
```javascript
frappe.listview_settings["Task"] = {
    onload: function(listview) {
        listview.page.add_menu_item(__("Set as Open"), function() {
            listview.call_for_selected_items(
                "app.module.doctype.task.task.set_status",
                { status: "Open" }
            );
        });
        
        listview.page.add_menu_item(__("Set as Completed"), function() {
            listview.call_for_selected_items(
                "app.module.doctype.task.task.set_status",
                { status: "Completed" }
            );
        });
    }
};
```

### 3. Working with Selected Items

**Get Selected Items**:
```javascript
let selected = listview.get_checked_items();
// Returns array of document names: ["DOC-001", "DOC-002"]

let selectedWithData = listview.get_checked_items(false);
// Returns array of document objects with data
```

**Call Method for Selected Items**:
```javascript
listview.call_for_selected_items(method, args);
```

**Example**:
```javascript
listview.page.add_menu_item(__("Close"), function() {
    listview.call_for_selected_items(
        "app.module.doctype.order.order.close_orders",
        { status: "Closed" }
    );
});
```

**Custom Processing**:
```javascript
listview.page.add_action_item(__("Process"), function() {
    let selected = listview.get_checked_items();
    
    frappe.call({
        method: "app.module.doctype.document.document.process",
        args: {
            names: selected
        },
        callback: function(r) {
            if (!r.exc) {
                frappe.msgprint(__("Processed {0} documents", [selected.length]));
                listview.refresh();
            }
        }
    });
});
```

### 4. Custom Row HTML

**Purpose**: Customize how each row appears in the list.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    get_list_row: function(doc) {
        // Return custom HTML for the row
        return `<div>Custom HTML</div>`;
    }
};
```

**Example**:
```javascript
frappe.listview_settings["Document"] = {
    get_list_row: function(doc) {
        return `
            <div class="list-row-container">
                <div class="list-row">
                    <div class="list-subject">
                        <span class="ellipsis" title="${doc.name}">
                            ${doc.name}
                        </span>
                    </div>
                    <div class="list-row-right">
                        <span class="indicator ${doc.status_color}">
                            ${doc.status}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
};
```

**Note**: This is advanced and rarely needed. Use only if default rendering doesn't meet your needs.

### 5. Custom Button

**Purpose**: Add a custom button to each row.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    button: {
        show: function(doc) {
            // Return truthy value to show button
            return doc.status === "Active";
        },
        get_label: function() {
            // Return button label/icon
            return frappe.utils.icon("workflow", "sm");
        },
        get_description: function(doc) {
            // Return tooltip text
            return __("Open {0}", [doc.name]);
        },
        action: function(doc) {
            // Action when button clicked
            frappe.set_route("custom-route", doc.name);
        }
    }
};
```

**Example**:
```javascript
frappe.listview_settings["Workflow"] = {
    button: {
        show: function(doc) {
            return doc.name; // Show for all
        },
        get_label: function() {
            return frappe.utils.icon("workflow", "sm");
        },
        get_description: function(doc) {
            return __("Build {0}", [doc.name]);
        },
        action: function(doc) {
            frappe.set_route("workflow-builder", doc.name);
        }
    }
};
```

### 6. Custom Formatters

**Purpose**: Customize how field values are displayed.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    formatters: {
        fieldname: function(value, doc, column, listview) {
            // Return formatted HTML
            return `<span class="custom-format">${value}</span>`;
        }
    }
};
```

**Example**:
```javascript
frappe.listview_settings["Invoice"] = {
    formatters: {
        grand_total: function(value, doc) {
            if (doc.currency === "USD") {
                return `<strong>$${value}</strong>`;
            } else {
                return `<strong>${value} ${doc.currency}</strong>`;
            }
        }
    }
};
```

### 7. Gantt Chart Customization

**Purpose**: Customize the popup HTML in Gantt chart view.

**Syntax**:
```javascript
frappe.listview_settings["DocType Name"] = {
    gantt_custom_popup_html: function(ganttobj, task) {
        // Return custom HTML for Gantt popup
        return `<div>Custom popup content</div>`;
    }
};
```

**Example**:
```javascript
frappe.listview_settings["Task"] = {
    gantt_custom_popup_html: function(ganttobj, task) {
        let html = `
            <a class="text-white mb-2 inline-block cursor-pointer"
               href="/app/task/${ganttobj.id}">
                ${ganttobj.name}
            </a>
        `;
        
        if (task.project) {
            html += `
                <p class="mb-1">${__("Project")}:
                    <a class="text-white inline-block"
                       href="/app/project/${task.project}">
                        ${task.project}
                    </a>
                </p>
            `;
        }
        
        html += `
            <p class="mb-1">
                ${__("Progress")}:
                <span class="text-white">${ganttobj.progress}%</span>
            </p>
        `;
        
        return `<div class="p-3" style="min-width: 220px">${html}</div>`;
    }
};
```

---

## Complete Examples

### Example 1: Simple Status Indicators

```javascript
frappe.listview_settings["Document"] = {
    add_fields: ["status"],
    get_indicator: function(doc) {
        const status_colors = {
            "Draft": "red",
            "Active": "green",
            "Inactive": "gray",
            "Cancelled": "red"
        };
        return [
            __(doc.status),
            status_colors[doc.status] || "gray",
            "status,=," + doc.status
        ];
    }
};
```

**Explanation**:
- Adds `status` field to loaded data
- Returns indicator with label, color, and filter
- Uses color mapping for different statuses

### Example 2: Conditional Indicators with Logic

```javascript
frappe.listview_settings["Order"] = {
    add_fields: ["status", "delivery_date", "per_delivered", "per_billed"],
    get_indicator: function(doc) {
        if (doc.status === "Closed") {
            return [__("Closed"), "green", "status,=,Closed"];
        } else if (doc.status === "On Hold") {
            return [__("On Hold"), "orange", "status,=,On Hold"];
        } else if (doc.per_delivered < 100) {
            // Check if overdue
            if (frappe.datetime.get_diff(doc.delivery_date) < 0) {
                return [
                    __("Overdue"),
                    "red",
                    "per_delivered,<,100|delivery_date,<,Today"
                ];
            } else {
                return [__("To Deliver"), "orange", "per_delivered,<,100"];
            }
        } else if (doc.per_delivered === 100 && doc.per_billed < 100) {
            return [__("To Bill"), "orange", "per_billed,<,100"];
        }
    }
};
```

**Explanation**:
- Complex logic based on multiple fields
- Checks delivery status and dates
- Returns different indicators based on conditions

### Example 3: Default Filters

```javascript
frappe.listview_settings["Employee"] = {
    add_fields: ["status", "branch", "department"],
    filters: [["status", "=", "Active"]],
    get_indicator: function(doc) {
        return [
            __(doc.status),
            { Active: "green", Inactive: "red", Left: "gray" }[doc.status],
            "status,=," + doc.status
        ];
    }
};
```

**Explanation**:
- Shows only active employees by default
- User can still change filters
- Indicator shows status with appropriate color

### Example 4: Bulk Actions

```javascript
frappe.listview_settings["Task"] = {
    add_fields: ["status", "project"],
    filters: [["status", "=", "Open"]],
    onload: function(listview) {
        var method = "app.module.doctype.task.task.set_multiple_status";
        
        listview.page.add_menu_item(__("Set as Open"), function() {
            listview.call_for_selected_items(method, { status: "Open" });
        });
        
        listview.page.add_menu_item(__("Set as Completed"), function() {
            listview.call_for_selected_items(method, { status: "Completed" });
        });
        
        listview.page.add_menu_item(__("Set as Cancelled"), function() {
            listview.call_for_selected_items(method, { status: "Cancelled" });
        });
    },
    get_indicator: function(doc) {
        var colors = {
            Open: "orange",
            Completed: "green",
            Cancelled: "red"
        };
        return [__(doc.status), colors[doc.status], "status,=," + doc.status];
    }
};
```

**Explanation**:
- Adds menu items for bulk status changes
- Uses `call_for_selected_items` to process multiple documents
- Server method receives array of document names

### Example 5: Creating Related Documents

```javascript
frappe.listview_settings["Lead"] = {
    get_indicator: function(doc) {
        return [
            __(doc.status),
            frappe.utils.guess_colour(doc.status),
            "status,=," + doc.status
        ];
    },
    onload: function(listview) {
        if (frappe.boot.user.can_create.includes("Prospect")) {
            listview.page.add_action_item(__("Create Prospect"), function() {
                frappe.model.with_doctype("Prospect", function() {
                    let prospect = frappe.model.get_new_doc("Prospect");
                    let leads = listview.get_checked_items();
                    
                    // Get data from first lead
                    frappe.db.get_value(
                        "Lead",
                        leads[0],
                        ["company_name", "industry", "territory"],
                        function(r) {
                            prospect.company_name = r.company_name;
                            prospect.industry = r.industry;
                            prospect.territory = r.territory;
                            
                            // Add all selected leads as child rows
                            leads.forEach(function(lead) {
                                let row = frappe.model.add_child(prospect, "leads");
                                row.lead = lead;
                            });
                            
                            frappe.set_route("Form", "Prospect", prospect.name);
                        }
                    );
                });
            });
        }
    }
};
```

**Explanation**:
- Creates new document from selected items
- Gets data from first selected item
- Adds all selected items as child table rows
- Navigates to new document

### Example 6: Custom Button per Row

```javascript
frappe.listview_settings["Workflow"] = {
    add_fields: ["is_active"],
    get_indicator: function(doc) {
        if (doc.is_active) {
            return [__("Active"), "green", "is_active,=,Yes"];
        } else {
            return [__("Not active"), "gray", "is_active,=,No"];
        }
    },
    button: {
        show: function(doc) {
            return doc.name; // Show for all
        },
        get_label: function() {
            return frappe.utils.icon("workflow", "sm");
        },
        get_description: function(doc) {
            return __("Build {0}", [doc.name]);
        },
        action: function(doc) {
            frappe.set_route("workflow-builder", doc.name);
        }
    }
};
```

**Explanation**:
- Shows custom button on each row
- Button has icon, tooltip, and action
- Navigates to custom route

### Example 7: Complex Bulk Processing

```javascript
frappe.listview_settings["Invoice"] = {
    add_fields: ["customer", "grand_total", "outstanding_amount", "status"],
    onload: function(listview) {
        if (frappe.model.can_create("Payment Entry")) {
            listview.page.add_action_item(__("Create Payment"), function() {
                let selected = listview.get_checked_items();
                
                if (selected.length === 0) {
                    frappe.msgprint(__("Please select at least one invoice"));
                    return;
                }
                
                frappe.call({
                    method: "app.module.doctype.invoice.invoice.create_payment_entries",
                    args: {
                        invoices: selected
                    },
                    freeze: true,
                    callback: function(r) {
                        if (!r.exc && r.message) {
                            frappe.msgprint({
                                message: __("Created {0} payment entries", [r.message.length]),
                                indicator: "green"
                            });
                            listview.refresh();
                        }
                    }
                });
            });
        }
    },
    get_indicator: function(doc) {
        const status_colors = {
            Draft: "red",
            Unpaid: "orange",
            Paid: "green",
            Overdue: "red",
            "Partly Paid": "yellow"
        };
        return [
            __(doc.status),
            status_colors[doc.status] || "gray",
            "status,=," + doc.status
        ];
    }
};
```

**Explanation**:
- Checks permissions before showing button
- Validates selection
- Calls server method with selected items
- Shows success message and refreshes

---

## Advanced Patterns

### Pattern 1: Dynamic Filters Based on User

```javascript
frappe.listview_settings["Document"] = {
    onload: function(listview) {
        // Set filter based on user role
        if (frappe.user.has_role("Sales User")) {
            listview.filter_area.add([
                ["assigned_to", "=", frappe.session.user]
            ]);
        }
    }
};
```

### Pattern 2: Conditional Action Items

```javascript
frappe.listview_settings["Order"] = {
    onload: function(listview) {
        // Only show if user has permission
        if (frappe.model.can_create("Invoice")) {
            listview.page.add_action_item(__("Invoice"), function() {
                // Action logic
            });
        }
        
        // Only show for specific status
        listview.page.add_action_item(__("Close"), function() {
            let selected = listview.get_checked_items();
            // Check if all selected are in correct status
            frappe.db.get_value("Order", selected[0], "status", function(r) {
                if (r.status === "Draft") {
                    // Close logic
                } else {
                    frappe.msgprint(__("Can only close draft orders"));
                }
            });
        });
    }
};
```

### Pattern 3: Custom Row Styling

```javascript
frappe.listview_settings["Document"] = {
    refresh: function(listview) {
        // Add custom styling to rows
        listview.$result.on("list-row-render", function(e, $row, doc) {
            if (doc.priority === "High") {
                $row.css("border-left", "4px solid red");
            } else if (doc.priority === "Medium") {
                $row.css("border-left", "4px solid orange");
            }
        });
    }
};
```

### Pattern 4: Custom Filter Configuration

```javascript
frappe.listview_settings["Document"] = {
    onload: function(listview) {
        // Configure filter field query
        if (listview.page.fields_dict.category) {
            listview.page.fields_dict.category.get_query = function() {
                return {
                    filters: {
                        is_active: 1
                    }
                };
            };
        }
    }
};
```

### Pattern 5: Refresh After Actions

```javascript
frappe.listview_settings["Document"] = {
    onload: function(listview) {
        listview.page.add_action_item(__("Process"), function() {
            let selected = listview.get_checked_items();
            
            frappe.call({
                method: "process_documents",
                args: { names: selected },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.show_alert({
                            message: __("Processed successfully"),
                            indicator: "green"
                        });
                        listview.refresh(); // Refresh list
                    }
                }
            });
        });
    }
};
```

---

## Best Practices

### 1. Always Use Translation

```javascript
//  Good
get_indicator: function(doc) {
    return [__(doc.status), "green", "status,=," + doc.status];
}

//  Bad
get_indicator: function(doc) {
    return [doc.status, "green", "status,=," + doc.status];
}
```

### 2. Check Permissions

```javascript
//  Good
onload: function(listview) {
    if (frappe.model.can_create("Invoice")) {
        listview.page.add_action_item(__("Invoice"), function() {
            // Action
        });
    }
}

//  Bad
onload: function(listview) {
    listview.page.add_action_item(__("Invoice"), function() {
        // May fail if user doesn't have permission
    });
}
```

### 3. Validate Selections

```javascript
//  Good
listview.page.add_action_item(__("Process"), function() {
    let selected = listview.get_checked_items();
    if (selected.length === 0) {
        frappe.msgprint(__("Please select at least one document"));
        return;
    }
    // Process
});

//  Bad
listview.page.add_action_item(__("Process"), function() {
    let selected = listview.get_checked_items();
    // May fail if nothing selected
    process(selected);
});
```

### 4. Only Add Needed Fields

```javascript
//  Good - Only fields you use
add_fields: ["status", "amount"]

//  Bad - Unnecessary fields
add_fields: ["status", "amount", "field1", "field2", "field3", "field4"]
```

### 5. Use Appropriate Colors

```javascript
//  Good - Meaningful colors
get_indicator: function(doc) {
    if (doc.status === "Active") return [__("Active"), "green", ...];
    if (doc.status === "Error") return [__("Error"), "red", ...];
}

//  Bad - Random colors
get_indicator: function(doc) {
    return [doc.status, "purple", ...]; // Purple doesn't convey meaning
}
```

### 6. Handle Errors Gracefully

```javascript
//  Good
listview.page.add_action_item(__("Process"), function() {
    frappe.call({
        method: "process",
        args: { names: listview.get_checked_items() },
        callback: function(r) {
            if (!r.exc) {
                listview.refresh();
            }
        },
        error: function(r) {
            frappe.msgprint(__("Error processing documents"));
        }
    });
});
```

---

## Common Use Cases

### Use Case 1: Status-Based Indicators

**Scenario**: Show different colored indicators based on document status.

```javascript
frappe.listview_settings["Document"] = {
    add_fields: ["status"],
    get_indicator: function(doc) {
        const colors = {
            "Draft": "red",
            "Active": "green",
            "Inactive": "gray"
        };
        return [
            __(doc.status),
            colors[doc.status] || "gray",
            "status,=," + doc.status
        ];
    }
};
```

### Use Case 2: Default Active Records

**Scenario**: Show only active records by default.

```javascript
frappe.listview_settings["Employee"] = {
    filters: [["status", "=", "Active"]],
    get_indicator: function(doc) {
        return [
            __(doc.status),
            doc.status === "Active" ? "green" : "red",
            "status,=," + doc.status
        ];
    }
};
```

### Use Case 3: Bulk Status Updates

**Scenario**: Allow bulk updating status of multiple documents.

```javascript
frappe.listview_settings["Task"] = {
    onload: function(listview) {
        listview.page.add_menu_item(__("Mark Complete"), function() {
            listview.call_for_selected_items(
                "app.module.doctype.task.task.update_status",
                { status: "Completed" }
            );
        });
    }
};
```

### Use Case 4: Creating Related Documents

**Scenario**: Create child documents from parent list.

```javascript
frappe.listview_settings["Order"] = {
    onload: function(listview) {
        listview.page.add_action_item(__("Create Invoice"), function() {
            let selected = listview.get_checked_items();
            // Create invoice logic
        });
    }
};
```

### Use Case 5: Complex Status Logic

**Scenario**: Status depends on multiple fields and calculations.

```javascript
frappe.listview_settings["Order"] = {
    add_fields: ["status", "delivery_date", "per_delivered"],
    get_indicator: function(doc) {
        if (doc.status === "Closed") {
            return [__("Closed"), "green", "status,=,Closed"];
        } else if (doc.per_delivered < 100) {
            if (frappe.datetime.get_diff(doc.delivery_date) < 0) {
                return [__("Overdue"), "red", "per_delivered,<,100"];
            }
            return [__("To Deliver"), "orange", "per_delivered,<,100"];
        }
    }
};
```

---

## Troubleshooting

### Issue: Settings Not Applied

**Symptoms**: List view doesn't show customizations.

**Causes**:
1. Wrong file name
2. Wrong DocType name in settings
3. File not in correct location
4. Cache issues

**Solutions**:
```javascript
//  Check file name matches: doctype_name_list.js
//  Check DocType name matches exactly (case-sensitive)
frappe.listview_settings["DocType Name"] = { // Must match exactly

//  Clear browser cache
//  Restart bench
bench restart
```

### Issue: Indicator Not Showing

**Symptoms**: `get_indicator` returns value but indicator doesn't appear.

**Causes**:
1. Field not in `add_fields`
2. Wrong return format
3. Function returns undefined

**Solutions**:
```javascript
//  Ensure field is loaded
add_fields: ["status"], // Add field needed for indicator

//  Check return format
get_indicator: function(doc) {
    // Must return [label, color, filter] or undefined
    if (doc.status) {
        return [__(doc.status), "green", "status,=," + doc.status];
    }
    // Don't return null or empty array
}
```

### Issue: Action Items Not Appearing

**Symptoms**: Buttons don't show in toolbar.

**Causes**:
1. `onload` not defined
2. Permission checks failing
3. Wrong method name

**Solutions**:
```javascript
//  Ensure onload is defined
onload: function(listview) {
    // Code here
}

//  Check permissions
if (frappe.model.can_create("DocType")) {
    listview.page.add_action_item(...);
}

//  Verify method exists
listview.page.add_action_item(__("Action"), function() {
    // Action code
});
```

### Issue: Filters Not Working

**Symptoms**: Default filters don't apply.

**Causes**:
1. Wrong filter format
2. Field doesn't exist
3. Filter syntax error

**Solutions**:
```javascript
//  Correct format
filters: [
    ["fieldname", "=", "value"],
    ["fieldname2", "!=", "value2"]
]

//  Check field exists in DocType
//  Use correct operators
```

### Issue: Selected Items Empty

**Symptoms**: `get_checked_items()` returns empty array.

**Causes**:
1. No items selected
2. Called at wrong time
3. Checkbox not rendered

**Solutions**:
```javascript
//  Check selection before using
let selected = listview.get_checked_items();
if (selected.length === 0) {
    frappe.msgprint(__("Please select items"));
    return;
}

//  Use in callback/event handler
listview.page.add_action_item(__("Process"), function() {
    // This is called when user clicks, items should be selected
    let selected = listview.get_checked_items();
});
```

---

## Summary

### Key Takeaways

1. **File Naming**: Must be `<doctype_name>_list.js`
2. **Location**: In DocType directory
3. **Settings Object**: `frappe.listview_settings["DocType Name"]`
4. **Common Properties**: `add_fields`, `filters`, `get_indicator`, `onload`
5. **Event Handlers**: `onload` (once), `refresh` (every refresh)
6. **Bulk Actions**: Use `add_action_item` and `add_menu_item`
7. **Selected Items**: Use `get_checked_items()` and `call_for_selected_items()`

### Common Patterns

- **Status Indicators**: Use `get_indicator` with color mapping
- **Default Filters**: Use `filters` array
- **Bulk Operations**: Use `onload` with `add_action_item`
- **Conditional Logic**: Check fields in `get_indicator`
- **Related Documents**: Create from selected items in `onload`

### When to Use

-  Custom status indicators
-  Default filters
-  Bulk actions
-  Creating related documents
-  Custom row formatting
-  Gantt chart customization