# Buttons and Dialogs in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Buttons](#understanding-buttons)
3. [Understanding Dialogs](#understanding-dialogs)
4. [Button Concepts](#button-concepts)
5. [Dialog Concepts](#dialog-concepts)
6. [Button Implementation](#button-implementation)
7. [Dialog Implementation](#dialog-implementation)
8. [Complete Examples from ERPNext](#complete-examples-from-erpnext)
9. [Advanced Patterns](#advanced-patterns)
10. [Best Practices](#best-practices)
11. [Common Patterns](#common-patterns)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

Buttons and dialogs are essential UI components in Frappe that enable interactive user experiences. Buttons trigger actions, while dialogs collect user input before performing those actions.

### What You'll Learn

- How to add custom buttons to forms
- How to create and manage dialogs
- When to use buttons vs dialogs
- How to handle user interactions
- Best practices from ERPNext

### Overview

**Buttons**: Custom action buttons added to forms that trigger functions when clicked.

**Dialogs**: Modal windows that collect user input before performing actions.

---

## Understanding Buttons

### What are Custom Buttons?

Custom buttons are action buttons you add to Frappe forms that aren't part of the standard form fields. They appear in the form's button area and trigger custom JavaScript functions when clicked.

### Why Use Custom Buttons?

1. **Workflow Actions**: Create related documents or perform workflow steps
2. **Quick Actions**: Common tasks that need quick access
3. **Custom Functionality**: App-specific features not in standard forms
4. **User Experience**: Make important actions easily accessible

### Where Buttons Appear

Buttons appear in the form's button area, typically:
- **Top toolbar**: Next to standard buttons (Save, Submit, etc.)
- **Grouped by label**: Buttons can be grouped under labels like "Create", "Actions", "View"

### Button Lifecycle

```
Form Loads
    ↓
refresh() event fires
    ↓
add_custom_button() called
    ↓
Button appears in UI
    ↓
User clicks button
    ↓
Callback function executes
    ↓
Action performed
```

---

## Understanding Dialogs

### What are Dialogs?

Dialogs are modal windows that appear over the current form to collect user input. They're used when you need additional information before performing an action.

### Why Use Dialogs?

1. **User Input**: Collect data before performing actions
2. **Confirmation**: Get user confirmation for important actions
3. **Selection**: Let users choose from options
4. **Complex Input**: Multiple fields or tables
5. **Validation**: Ensure required data is provided

### Dialog Characteristics

- **Modal**: Blocks interaction with the form until closed
- **Centered**: Appears in the center of the screen
- **Overlay**: Dark background overlay
- **Dismissible**: Can be closed by clicking outside or pressing ESC

### Dialog Lifecycle

```
User Action Triggers Dialog
    ↓
Dialog Created
    ↓
Dialog Shown
    ↓
User Fills Fields
    ↓
User Clicks Primary Action
    ↓
Values Collected
    ↓
Action Performed
    ↓
Dialog Hidden
```

---

## Button Concepts

### 1. Button Placement

Buttons are added to forms using `frm.add_custom_button()`. They can be:

- **Standalone**: Single button
- **Grouped**: Multiple buttons under a label
- **Conditional**: Only shown under certain conditions

### 2. Button Types

**Action Buttons**: Perform actions directly
```javascript
frm.add_custom_button("Create Customer", function() {
    // Action code
});
```

**Navigation Buttons**: Navigate to other pages
```javascript
frm.add_custom_button("View Tasks", function() {
    frappe.set_route("List", "Task");
});
```

**Dialog Triggers**: Open dialogs for input
```javascript
frm.add_custom_button("Set Status", function() {
    show_dialog();
});
```

### 3. Button Grouping

Buttons can be grouped under labels:

```javascript
// Group 1: Create actions
frm.add_custom_button("Customer", fn, __("Create"));
frm.add_custom_button("Opportunity", fn, __("Create"));

// Group 2: View actions
frm.add_custom_button("Gantt Chart", fn, __("View"));
frm.add_custom_button("Kanban Board", fn, __("View"));
```

### 4. Conditional Buttons

Buttons should only appear when relevant:

```javascript
if (!frm.is_new() && frm.doc.status === "Draft") {
    frm.add_custom_button("Submit", function() {
        frm.save();
    });
}
```

---

## Dialog Concepts

### 1. Dialog Structure

A dialog consists of:

- **Title**: Dialog heading
- **Fields**: Input fields for user data
- **Primary Action**: Main button (e.g., "Save", "Create")
- **Secondary Action**: Optional secondary button
- **Size**: Small, medium, or large

### 2. Field Types in Dialogs

Dialogs support all Frappe field types:

- **Data**: Text input
- **Link**: Link to another DocType
- **Select**: Dropdown selection
- **Date**: Date picker
- **Table**: Child table
- **HTML**: Custom HTML content
- **Section Break**: Visual separator
- **Column Break**: Multi-column layout

### 3. Dialog Actions

**Primary Action**: Main action button (required)
```javascript
primary_action: function(values) {
    // Handle primary action
}
```

**Secondary Action**: Optional secondary button
```javascript
secondary_action: function() {
    // Handle secondary action
}
```

### 4. Dialog States

- **Visible**: Dialog is shown
- **Hidden**: Dialog is hidden but exists
- **Destroyed**: Dialog is removed from DOM

---

## Button Implementation

### Basic Syntax

```javascript
frm.add_custom_button(label, callback, group);
```

**Parameters**:
- `label` (string): Button text
- `callback` (function): Function to execute on click
- `group` (string, optional): Group label (e.g., "Create", "Actions")

### Basic Example

```javascript
frappe.ui.form.on("Lead", {
    refresh: function(frm) {
        frm.add_custom_button("Create Customer", function() {
            // Create customer logic
        });
    }
});
```

### Button with Group

```javascript
frappe.ui.form.on("Lead", {
    refresh: function(frm) {
        frm.add_custom_button("Customer", function() {
            // Create customer
        }, __("Create"));
        
        frm.add_custom_button("Opportunity", function() {
            // Create opportunity
        }, __("Create"));
    }
});
```

### Conditional Button

```javascript
frappe.ui.form.on("Lead", {
    refresh: function(frm) {
        if (!frm.is_new() && !frm.doc.is_customer) {
            frm.add_custom_button("Customer", function() {
                // Create customer
            }, __("Create"));
        }
    }
});
```

### Button with Confirmation

```javascript
frm.add_custom_button("Delete", function() {
    frappe.confirm(__("Are you sure?"), function() {
        // Delete logic
    });
});
```

### Button with Navigation

```javascript
frm.add_custom_button("View Tasks", function() {
    frappe.set_route("List", "Task", "Gantt");
}, __("View"));
```

---

## Dialog Implementation

### Basic Syntax

```javascript
const dialog = new frappe.ui.Dialog({
    title: "Dialog Title",
    fields: [
        // Field definitions
    ],
    primary_action: function(values) {
        // Handle primary action
    },
    primary_action_label: "Save"
});

dialog.show();
```

### Basic Example

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Select Customer"),
    fields: [
        {
            fieldtype: "Link",
            label: __("Customer"),
            options: "Customer",
            fieldname: "customer",
            reqd: 1
        }
    ],
    primary_action: function({ customer }) {
        // Use customer value
        dialog.hide();
    },
    primary_action_label: __("Select")
});

dialog.show();
```

### Dialog with Multiple Fields

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Create Link"),
    fields: [
        {
            fieldtype: "Link",
            label: __("Customer"),
            options: "Customer",
            fieldname: "customer",
            reqd: 1
        },
        {
            fieldtype: "Column Break"
        },
        {
            fieldtype: "Date",
            label: __("Date"),
            fieldname: "date",
            default: frappe.datetime.get_today()
        }
    ],
    primary_action: function(values) {
        frappe.call({
            method: "create_link",
            args: values,
            callback: function() {
                dialog.hide();
            }
        });
    }
});

dialog.show();
```

### Dialog with Section Breaks

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Set Project Status"),
    fields: [
        {
            fieldtype: "Section Break",
            label: __("Status Information")
        },
        {
            fieldtype: "Select",
            label: __("Status"),
            fieldname: "status",
            options: "Completed\nCancelled",
            reqd: 1
        }
    ],
    primary_action: function(values) {
        // Handle status update
        dialog.hide();
    }
});

dialog.show();
```

### Dialog with Table

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Select Items"),
    fields: [
        {
            fieldname: "items",
            fieldtype: "Table",
            fields: [
                {
                    fieldtype: "Link",
                    fieldname: "item_code",
                    options: "Item",
                    in_list_view: 1
                },
                {
                    fieldtype: "Float",
                    fieldname: "qty",
                    in_list_view: 1
                }
            ],
            data: existing_items
        }
    ],
    primary_action: function(values) {
        // Process selected items
        dialog.hide();
    }
});

dialog.show();
```

### Dialog with HTML Content

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Information"),
    fields: [
        {
            fieldname: "info",
            fieldtype: "HTML",
            read_only: 1
        }
    ]
});

dialog.fields_dict.info.$wrapper.html(
    `<p class="text-muted">${__("Some information here")}</p>`
);

dialog.show();
```

---

## Complete Examples from ERPNext

### Example 1: Simple Button (Lead to Customer)

**File**: `erpnext/erpnext/crm/doctype/lead/lead.js`

```javascript
frappe.ui.form.on("Lead", {
    refresh: function(frm) {
        if (!frm.is_new() && !frm.doc.is_customer) {
            frm.add_custom_button(__("Customer"), function() {
                frm.events.make_customer(frm);
            }, __("Create"));
        }
    },
    
    make_customer: function(frm) {
        frappe.model.open_mapped_doc({
            method: "erpnext.crm.doctype.lead.lead.make_customer",
            frm: frm
        });
    }
});
```

**Explanation**:
- Button appears only for existing leads that aren't customers
- Button is grouped under "Create" label
- Clicking button creates a Customer from the Lead

### Example 2: Multiple Buttons with Groups (Lead Form)

**File**: `erpnext/erpnext/crm/doctype/lead/lead.js`

```javascript
refresh: function(frm) {
    var me = this;
    let doc = this.frm.doc;
    
    if (!this.frm.is_new() && doc.__onload && !doc.__onload.is_customer) {
        // Create group
        this.frm.add_custom_button(__("Customer"), this.make_customer.bind(this), __("Create"));
        this.frm.add_custom_button(__("Opportunity"), this.make_opportunity.bind(this), __("Create"));
        this.frm.add_custom_button(__("Quotation"), this.make_quotation.bind(this), __("Create"));
        
        // Action group
        if (!doc.__onload.linked_prospects.length) {
            this.frm.add_custom_button(__("Prospect"), this.make_prospect.bind(this), __("Create"));
            this.frm.add_custom_button(
                __("Add to Prospect"),
                () => {
                    this.add_lead_to_prospect(this.frm);
                },
                __("Action")
            );
        }
    }
}
```

**Explanation**:
- Multiple buttons grouped under "Create"
- Conditional button for "Add to Prospect"
- Different groups for different action types

### Example 3: Simple Dialog (Supplier Link)

**File**: `erpnext/erpnext/buying/doctype/supplier/supplier.js`

```javascript
show_party_link_dialog: function (frm) {
    const dialog = new frappe.ui.Dialog({
        title: __("Select a Customer"),
        fields: [
            {
                fieldtype: "Link",
                label: __("Customer"),
                options: "Customer",
                fieldname: "customer",
                reqd: 1,
            },
        ],
        primary_action: function ({ customer }) {
            frappe.call({
                method: "erpnext.accounts.doctype.party_link.party_link.create_party_link",
                args: {
                    primary_role: "Supplier",
                    primary_party: frm.doc.name,
                    secondary_party: customer,
                },
                freeze: true,
                callback: function () {
                    dialog.hide();
                    frappe.msgprint({
                        message: __("Successfully linked to Customer"),
                        alert: true,
                    });
                },
                error: function () {
                    dialog.hide();
                    frappe.msgprint({
                        message: __("Linking to Customer Failed. Please try again."),
                        title: __("Linking Failed"),
                        indicator: "red",
                    });
                },
            });
        },
        primary_action_label: __("Create Link"),
    });
    dialog.show();
}
```

**Explanation**:
- Simple dialog with one Link field
- Required field validation
- Error handling in callback
- Success/error messages

### Example 4: Dialog with Table (Alternative Items)

**File**: `erpnext/erpnext/selling/doctype/quotation/quotation.js`

```javascript
show_alternative_items_dialog() {
    let me = this;
    
    const dialog = new frappe.ui.Dialog({
        title: __("Select Alternative Items for Sales Order"),
        fields: [
            {
                fieldname: "info",
                fieldtype: "HTML",
                read_only: 1,
            },
            {
                fieldname: "alternative_items",
                fieldtype: "Table",
                cannot_add_rows: true,
                cannot_delete_rows: true,
                in_place_edit: true,
                reqd: 1,
                data: this.data,
                description: __("Select an item from each set to be used in the Sales Order."),
                get_data: () => {
                    return this.data;
                },
                fields: table_fields,
            },
        ],
        primary_action: function () {
            frappe.model.open_mapped_doc({
                method: "erpnext.selling.doctype.quotation.quotation.make_sales_order",
                frm: me.frm,
                args: {
                    selected_items: dialog.fields_dict.alternative_items.grid.get_selected_children(),
                },
            });
            dialog.hide();
        },
        primary_action_label: __("Continue"),
    });

    dialog.fields_dict.info.$wrapper.html(
        `<p class="small text-muted">
            <span class="indicator yellow"></span>
            ${__("Alternative Items")}
        </p>`
    );
    dialog.show();
}
```

**Explanation**:
- Dialog with HTML field for information
- Table field with restrictions (cannot add/delete rows)
- In-place editing enabled
- Gets selected items from table grid
- Custom HTML content in info field

### Example 5: Dialog with Status Selection (Project)

**File**: `erpnext/erpnext/projects/doctype/project/project.js`

```javascript
set_project_status_button: function (frm) {
    frm.add_custom_button(
        __("Set Project Status"),
        () => frm.events.get_project_status_dialog(frm).show(),
        __("Actions")
    );
},

get_project_status_dialog: function (frm) {
    const dialog = new frappe.ui.Dialog({
        title: __("Set Project Status"),
        fields: [
            {
                fieldname: "status",
                fieldtype: "Select",
                label: "Status",
                reqd: 1,
                options: "Completed\nCancelled",
            },
        ],
        primary_action: function () {
            frm.events.set_status(frm, dialog.get_values().status);
            dialog.hide();
        },
        primary_action_label: __("Set Project Status"),
    });
    return dialog;
},
```

**Explanation**:
- Button triggers dialog
- Dialog returns itself for reuse
- Simple Select field
- Gets value using `get_values()`

### Example 6: Complex Dialog (Bank Reconciliation)

**File**: `erpnext/erpnext/public/js/bank_reconciliation_tool/dialog_manager.js`

```javascript
make_dialog() {
    const me = this;
    me.selected_payment = null;

    const fields = [
        {
            label: __("Action"),
            fieldname: "action",
            fieldtype: "Select",
            options: `Match Against Voucher\nCreate Voucher\nUpdate Bank Transaction`,
            default: "Match Against Voucher",
        },
        {
            fieldname: "column_break_4",
            fieldtype: "Column Break",
        },
        {
            label: __("Document Type"),
            fieldname: "document_type",
            fieldtype: "Select",
            options: `Payment Entry\nJournal Entry`,
            default: "Payment Entry",
            depends_on: "eval:doc.action=='Create Voucher'",
        },
        {
            fieldtype: "Section Break",
            fieldname: "section_break_1",
            label: __("Filters"),
            depends_on: "eval:doc.action=='Match Against Voucher'",
        },
    ];

    frappe.call({
        method: "erpnext.accounts.doctype.bank_transaction.bank_transaction.get_doctypes_for_bank_reconciliation",
        callback: (r) => {
            $.each(r.message, (_i, entry) => {
                if (_i % 3 == 0) {
                    fields.push({
                        fieldtype: "Column Break",
                    });
                }
                fields.push({
                    fieldtype: "Check",
                    label: entry,
                    fieldname: frappe.scrub(entry),
                    onchange: () => this.update_options(),
                });
            });

            fields.push(...this.get_voucher_fields());

            me.dialog = new frappe.ui.Dialog({
                title: __("Reconcile the Bank Transaction"),
                fields: fields,
                size: "large",
                primary_action: (values) => this.reconciliation_dialog_primary_action(values),
            });
        },
    });
}
```

**Explanation**:
- Dynamic field creation based on server response
- Conditional fields using `depends_on`
- Multiple column breaks for layout
- Section breaks for organization
- Large dialog size
- Fields added dynamically

---

## Advanced Patterns

### Pattern 1: Button Opens Dialog

```javascript
frappe.ui.form.on("DocType", {
    refresh: function(frm) {
        frm.add_custom_button(__("Set Status"), function() {
            show_status_dialog(frm);
        });
    }
});

function show_status_dialog(frm) {
    const dialog = new frappe.ui.Dialog({
        title: __("Set Status"),
        fields: [
            {
                fieldtype: "Select",
                fieldname: "status",
                options: "Active\nInactive",
                reqd: 1
            }
        ],
        primary_action: function(values) {
            frappe.call({
                method: "set_status",
                args: { status: values.status },
                callback: function() {
                    dialog.hide();
                    frm.reload_doc();
                }
            });
        }
    });
    dialog.show();
}
```

### Pattern 2: Dialog with Dynamic Fields

```javascript
function create_dynamic_dialog(fields_data) {
    const fields = [];
    
    fields_data.forEach((item, index) => {
        if (index > 0 && index % 2 === 0) {
            fields.push({ fieldtype: "Column Break" });
        }
        fields.push({
            fieldtype: "Link",
            fieldname: item.fieldname,
            options: item.options,
            label: item.label
        });
    });
    
    const dialog = new frappe.ui.Dialog({
        title: __("Select Options"),
        fields: fields,
        primary_action: function(values) {
            // Process values
            dialog.hide();
        }
    });
    
    return dialog;
}
```

### Pattern 3: Reusable Dialog

```javascript
let status_dialog = null;

function get_status_dialog(frm) {
    if (!status_dialog) {
        status_dialog = new frappe.ui.Dialog({
            title: __("Set Status"),
            fields: [
                {
                    fieldtype: "Select",
                    fieldname: "status",
                    options: "Active\nInactive"
                }
            ],
            primary_action: function(values) {
                // Update status
                status_dialog.hide();
            }
        });
    }
    return status_dialog;
}

// Use it
frm.add_custom_button(__("Set Status"), function() {
    get_status_dialog(frm).show();
});
```

### Pattern 4: Dialog with Validation

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Create Document"),
    fields: [
        {
            fieldtype: "Data",
            fieldname: "name",
            label: __("Name"),
            reqd: 1
        },
        {
            fieldtype: "Date",
            fieldname: "date",
            label: __("Date"),
            reqd: 1
        }
    ],
    primary_action: function(values) {
        // Validate
        if (!values.name || values.name.length < 3) {
            frappe.msgprint(__("Name must be at least 3 characters"));
            return;
        }
        
        if (values.date < frappe.datetime.get_today()) {
            frappe.msgprint(__("Date cannot be in the past"));
            return;
        }
        
        // Proceed
        frappe.call({
            method: "create_document",
            args: values,
            callback: function() {
                dialog.hide();
            }
        });
    }
});

dialog.show();
```

### Pattern 5: Dialog with Secondary Action

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Select Item"),
    fields: [
        {
            fieldtype: "Link",
            fieldname: "item",
            options: "Item",
            reqd: 1
        }
    ],
    primary_action: function(values) {
        // Primary action
        dialog.hide();
    },
    primary_action_label: __("Add"),
    secondary_action: function() {
        // Secondary action (e.g., Cancel, Clear)
        dialog.clear();
    },
    secondary_action_label: __("Clear")
});

dialog.show();
```

### Pattern 6: Dialog with Table and Selection

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Select Items"),
    fields: [
        {
            fieldname: "items",
            fieldtype: "Table",
            fields: [
                { fieldtype: "Check", fieldname: "select", in_list_view: 1 },
                { fieldtype: "Link", fieldname: "item_code", options: "Item", in_list_view: 1 },
                { fieldtype: "Float", fieldname: "qty", in_list_view: 1 }
            ],
            data: items_data
        }
    ],
    primary_action: function(values) {
        const selected = values.items.filter(item => item.select);
        // Process selected items
        dialog.hide();
    }
});

dialog.show();
```

---

## Best Practices

### Buttons

#### 1. Use Appropriate Groups

```javascript
//  Good - Clear grouping
frm.add_custom_button("Customer", fn, __("Create"));
frm.add_custom_button("Opportunity", fn, __("Create"));
frm.add_custom_button("Gantt Chart", fn, __("View"));

//  Bad - No grouping
frm.add_custom_button("Customer", fn);
frm.add_custom_button("Opportunity", fn);
frm.add_custom_button("Gantt Chart", fn);
```

#### 2. Conditional Display

```javascript
//  Good - Only show when relevant
if (!frm.is_new() && frm.doc.status === "Draft") {
    frm.add_custom_button("Submit", function() {
        frm.save();
    });
}

//  Bad - Always shows
frm.add_custom_button("Submit", function() {
    frm.save();
});
```

#### 3. Use Translation

```javascript
//  Good - Translated
frm.add_custom_button(__("Create Customer"), function() {});

//  Bad - Hard-coded
frm.add_custom_button("Create Customer", function() {});
```

#### 4. Clear Labels

```javascript
//  Good - Clear action
frm.add_custom_button(__("Create Customer"), function() {});

//  Bad - Unclear
frm.add_custom_button(__("Customer"), function() {});
```

### Dialogs

#### 1. Required Fields

```javascript
//  Good - Mark required fields
{
    fieldtype: "Link",
    fieldname: "customer",
    options: "Customer",
    reqd: 1  // Required
}

//  Bad - No validation
{
    fieldtype: "Link",
    fieldname: "customer",
    options: "Customer"
}
```

#### 2. Default Values

```javascript
//  Good - Provide defaults
{
    fieldtype: "Date",
    fieldname: "date",
    default: frappe.datetime.get_today()
}

//  Bad - No defaults
{
    fieldtype: "Date",
    fieldname: "date"
}
```

#### 3. Error Handling

```javascript
//  Good - Handle errors
primary_action: function(values) {
    frappe.call({
        method: "create_document",
        args: values,
        callback: function() {
            dialog.hide();
        },
        error: function() {
            frappe.msgprint(__("Error creating document"));
        }
    });
}

//  Bad - No error handling
primary_action: function(values) {
    frappe.call({
        method: "create_document",
        args: values
    });
}
```

#### 4. Hide Dialog After Action

```javascript
//  Good - Hide after success
primary_action: function(values) {
    frappe.call({
        method: "create_document",
        args: values,
        callback: function() {
            dialog.hide();  // Hide dialog
        }
    });
}

//  Bad - Dialog stays open
primary_action: function(values) {
    frappe.call({
        method: "create_document",
        args: values
    });
}
```

#### 5. Clear Dialog Values

```javascript
//  Good - Clear for reuse
dialog.clear();
dialog.show();

// Or reset specific fields
dialog.set_value("fieldname", "");
```

---

## Common Patterns

### Pattern 1: Simple Confirmation Dialog

```javascript
frm.add_custom_button(__("Delete"), function() {
    frappe.confirm(__("Are you sure you want to delete?"), function() {
        frappe.call({
            method: "delete_document",
            args: { name: frm.doc.name },
            callback: function() {
                frappe.set_route("List", "DocType");
            }
        });
    });
});
```

### Pattern 2: Input Dialog with frappe.prompt

```javascript
frm.add_custom_button(__("Rename"), function() {
    frappe.prompt([
        {
            fieldname: "new_name",
            label: __("New Name"),
            fieldtype: "Data",
            reqd: 1
        }
    ], function(values) {
        frappe.call({
            method: "rename_document",
            args: {
                old_name: frm.doc.name,
                new_name: values.new_name
            },
            callback: function() {
                frm.reload_doc();
            }
        });
    }, __("Rename Document"), __("Rename"));
});
```

### Pattern 3: Dialog with Server Data

```javascript
function show_dialog_with_data(frm) {
    frappe.call({
        method: "get_options",
        callback: function(r) {
            const dialog = new frappe.ui.Dialog({
                title: __("Select Option"),
                fields: [
                    {
                        fieldtype: "Select",
                        fieldname: "option",
                        options: r.message.join("\n"),
                        reqd: 1
                    }
                ],
                primary_action: function(values) {
                    // Use selected option
                    dialog.hide();
                }
            });
            dialog.show();
        }
    });
}
```

### Pattern 4: Dialog with Dynamic Content

```javascript
const dialog = new frappe.ui.Dialog({
    title: __("Information"),
    fields: [
        {
            fieldname: "content",
            fieldtype: "HTML"
        }
    ]
});

// Update content dynamically
frappe.call({
    method: "get_content",
    callback: function(r) {
        dialog.fields_dict.content.$wrapper.html(r.message);
        dialog.show();
    }
});
```

### Pattern 5: Multi-Step Dialog

```javascript
let current_step = 1;

function show_multi_step_dialog() {
    const dialog = new frappe.ui.Dialog({
        title: __("Step {0}", [current_step]),
        fields: get_fields_for_step(current_step),
        primary_action: function(values) {
            if (current_step < 3) {
                current_step++;
                dialog.hide();
                show_multi_step_dialog();
            } else {
                // Final step - process all values
                dialog.hide();
            }
        }
    });
    dialog.show();
}
```

---

## Troubleshooting

### Issue: Button Not Appearing

**Symptoms**: Button doesn't show on form

**Causes**:
1. `refresh` event not firing
2. Condition preventing button creation
3. Wrong form context

**Solutions**:
```javascript
//  Check refresh event
frappe.ui.form.on("DocType", {
    refresh: function(frm) {
        console.log("Refresh fired"); // Debug
        frm.add_custom_button("Test", function() {});
    }
});

//  Check conditions
if (!frm.is_new()) {
    frm.add_custom_button("Action", function() {});
}
```

### Issue: Dialog Not Showing

**Symptoms**: Dialog created but not visible

**Causes**:
1. Forgot to call `dialog.show()`
2. Dialog hidden immediately
3. Z-index issues

**Solutions**:
```javascript
//  Always call show()
const dialog = new frappe.ui.Dialog({...});
dialog.show(); // Don't forget this!

//  Check if hidden immediately
primary_action: function() {
    // Don't hide before processing
    dialog.hide(); // Only after success
}
```

### Issue: Dialog Values Not Available

**Symptoms**: `get_values()` returns empty or undefined

**Causes**:
1. Field names don't match
2. Values not set
3. Dialog cleared

**Solutions**:
```javascript
//  Use correct field names
primary_action: function(values) {
    const customer = values.customer; // Match fieldname
}

//  Set values before getting
dialog.set_value("fieldname", "value");
const values = dialog.get_values();
```

### Issue: Button Click Not Working

**Symptoms**: Button visible but nothing happens on click

**Causes**:
1. Callback function error
2. Function not defined
3. Context issues

**Solutions**:
```javascript
//  Check callback
frm.add_custom_button("Action", function() {
    console.log("Button clicked"); // Debug
    // Your code here
});

//  Use bind for context
frm.add_custom_button("Action", this.method.bind(this));
```

### Issue: Dialog Fields Not Updating

**Symptoms**: Field values don't change

**Causes**:
1. Field is read-only
2. Wrong field reference
3. Event not triggered

**Solutions**:
```javascript
//  Check read_only
{
    fieldtype: "Data",
    fieldname: "field",
    read_only: 0  // Not read-only
}

//  Use set_value correctly
dialog.set_value("fieldname", "new_value");
```

### Issue: Dialog Stays Open

**Symptoms**: Dialog doesn't close after action

**Causes**:
1. Forgot to call `hide()`
2. Error preventing hide
3. Multiple dialogs

**Solutions**:
```javascript
//  Always hide
primary_action: function() {
    // Process
    dialog.hide(); // Always hide
}

//  Hide in callback
frappe.call({
    method: "action",
    callback: function() {
        dialog.hide(); // Hide after success
    }
});
```

---

## Summary

### Key Takeaways

1. **Buttons**: Use `frm.add_custom_button()` in `refresh` event
2. **Dialogs**: Create with `new frappe.ui.Dialog()` and call `show()`
3. **Grouping**: Organize buttons with group labels
4. **Conditional**: Show buttons/dialogs only when relevant
5. **Validation**: Use `reqd: 1` for required fields
6. **Error Handling**: Always handle errors in callbacks
7. **Cleanup**: Hide dialogs after actions complete

### When to Use Buttons

-  Direct actions (create, delete, submit)
-  Navigation (view related documents)
-  Quick operations
-  No additional input needed

### When to Use Dialogs

-  Need user input before action
-  Confirmation required
-  Multiple fields needed
-  Complex selection (tables, options)

### Common Flow

```
User Action
    ↓
Button Clicked / Dialog Triggered
    ↓
Dialog Shown (if needed)
    ↓
User Provides Input
    ↓
Primary Action Clicked
    ↓
Values Collected
    ↓
Server Call / Action Performed
    ↓
Dialog Hidden
    ↓
Form Updated / Reloaded
```