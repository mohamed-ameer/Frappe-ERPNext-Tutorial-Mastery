# Making Forms Read-Only in Frappe

This guide explains different methods to control form editability in Frappe Framework, based on real-world examples from Frappe and ERPNext codebases.

---

## Table of Contents
1. [Understanding the `frm` Object](#understanding-the-frm-object)
2. [Methods Overview](#methods-overview)
3. [Method 1: `frm.set_read_only()`](#method-1-frmset_read_only)
4. [Method 2: `frm.disable_form()`](#method-2-frmdisable_form)
5. [Method 3: `frm.disable_save()`](#method-3-frmdisable_save)
6. [Method 4: Field-Level Read-Only](#method-4-field-level-read-only)
7. [Automatic Read-Only Scenarios](#automatic-read-only-scenarios)
8. [User Feedback Methods](#user-feedback-methods)
9. [Real-World Examples](#real-world-examples)
10. [Best Practices](#best-practices)

---

## Understanding the `frm` Object

The `frm` object represents the **currently opened form** in Frappe. It provides APIs to control form behavior, field properties, and user interactions.

```js
// frm is available in all form events
frappe.ui.form.on('DocType Name', {
    refresh: function(frm) {
        // frm object is available here
    }
});
```

---

## Methods Overview

Frappe provides multiple methods to control form editability, each serving different purposes:

| Method | Scope | Removes Save Button | Makes Fields Read-Only | Use Case |
|--------|-------|---------------------|------------------------|----------|
| `frm.set_read_only()` | Permission-based | ❌ No | ❌ No | Restricts permissions only |
| `frm.disable_form()` | Entire form | ✅ Yes | ✅ Yes | Complete form lockdown |
| `frm.disable_save()` | Save action | ✅ Yes | ❌ No | Prevent saving only |
| `frm.set_df_property()` | Single field | ❌ No | ✅ Yes (specific field) | Field-level control |

---

## Method 1: `frm.set_read_only()`

### What It Does

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (lines 1740-1751)

```js
set_read_only() {
    const docperms = frappe.perm.get_perm(this.doc.doctype);
    this.perm = docperms.map((p) => {
        return {
            read: p.read,
            cancel: p.cancel,
            share: p.share,
            print: p.print,
            email: p.email,
        };
    });
}
```

This method **restricts form permissions** to read-only operations (read, cancel, share, print, email). It does **NOT** make fields visually read-only or remove the save button.

### When to Use

- Workflow-based read-only states
- Permission-based restrictions
- Root/system records that shouldn't be edited

### Real-World Example from ERPNext

**Territory DocType** (`erpnext/erpnext/setup/doctype/territory/territory.js`):

```js
frappe.ui.form.on("Territory", {
    refresh: function (frm) {
        frm.trigger("set_root_readonly");
    },
    set_root_readonly: function (frm) {
        // read-only for root territory
        if (!frm.doc.parent_territory && !frm.doc.__islocal) {
            frm.set_read_only();
            frm.set_intro(__("This is a root territory and cannot be edited."));
        } else {
            frm.set_intro(null);
        }
    },
});
```

**Explanation:**
- Root territories (without parent) cannot be edited
- Uses `!frm.doc.__islocal` to check if document is saved
- Combines with `frm.set_intro()` for user feedback

### Other ERPNext Examples

1. **Department** (`erpnext/erpnext/setup/doctype/department/department.js`):
```js
refresh: function (frm) {
    // read-only for root department
    if (!frm.doc.parent_department && !frm.is_new()) {
        frm.set_read_only();
        frm.set_intro(__("This is a root department and cannot be edited."));
    }
}
```

2. **Customer Group** (`erpnext/erpnext/setup/doctype/customer_group/customer_group.js`):
```js
set_root_readonly: function (frm) {
    // read-only for root customer group
    if (!frm.doc.parent_customer_group && !frm.doc.__islocal) {
        frm.set_read_only();
        frm.set_intro(__("This is a root customer group and cannot be edited."));
    } else {
        frm.set_intro(null);
    }
}
```

3. **Item Group** (`erpnext/erpnext/setup/doctype/item_group/item_group.js`):
```js
set_root_readonly: function (frm) {
    // read-only for root item group
    frm.set_intro("");
    if (!frm.doc.parent_item_group && !frm.doc.__islocal) {
        frm.set_read_only();
        frm.set_intro(__("This is a root item group and cannot be edited."), true);
    }
}
```

---

## Method 2: `frm.disable_form()`

### What It Does

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (lines 1088-1094)

```js
disable_form() {
    this.set_read_only();
    this.fields.forEach((field) => {
        this.set_df_property(field.df.fieldname, "read_only", "1");
    });
    this.disable_save();
}
```

This is the **most comprehensive** method that:
1. Calls `set_read_only()` to restrict permissions
2. Makes **all fields** visually read-only
3. Calls `disable_save()` to remove the save button

### When to Use

- Complete form lockdown
- Processed/completed documents
- System-generated records that should never be edited

### Real-World Example from ERPNext

**Import Supplier Invoice** (`erpnext/erpnext/regional/doctype/import_supplier_invoice/import_supplier_invoice.js`):

```js
toggle_read_only_fields: function (frm) {
    if (["File Import Completed", "Processing File Data"].includes(frm.doc.status)) {
        cur_frm.set_read_only();
        frm.set_df_property("import_invoices", "hidden", 1);
    } else {
        frm.set_df_property("import_invoices", "hidden", 0);
    }
}
```

**Explanation:**
- When import is completed or processing, form becomes read-only
- Hides action buttons that are no longer relevant
- Prevents any modifications to processed imports

---

## Method 3: `frm.disable_save()`

### What It Does

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (lines 1079-1086)

```js
disable_save(set_dirty = false) {
    // IMPORTANT: this function should be called in refresh event
    this.save_disabled = true;
    this.toolbar.current_status = null;
    // field changes should make form dirty
    this.set_dirty = set_dirty;
    this.page.clear_primary_action();
}
```

This method:
- Removes the **Save button** from the toolbar
- Sets `save_disabled` flag to `true`
- Optionally allows form to become dirty (track changes)

### When to Use

- Prevent saving while allowing field edits (for validation)
- Custom save workflows
- Conditional save restrictions

### Important Note

**Must be called in the `refresh` event** as noted in the source code comment.

### Enabling Save Again

```js
enable_save() {
    this.save_disabled = false;
    this.toolbar.set_primary_action();
}
```

---

## Method 4: Field-Level Read-Only

### Using `frm.set_df_property()`

Makes **specific fields** read-only without affecting the entire form.

**Syntax:**
```js
frm.set_df_property(fieldname, property, value);
```

### Real-World Examples

**1. Make Field Read-Only After Saving** (from Frappe documentation):

```js
frappe.ui.form.on('Task', {
    refresh: function(frm) {
        // use the __islocal value of doc, to check if the doc is saved or not
        frm.set_df_property('myfield', 'read_only', frm.doc.__islocal ? 0 : 1);
    }
});
```

**2. Conditional Read-Only Based on Status** (from ERPNext HRMS):

**Expense Claim** (`hrms/hrms/hr/doctype/expense_claim/expense_claim.js`):

```js
set_form_buttons: async function (frm) {
    let self_approval_not_allowed = frm.doc.__onload
        ? frm.doc.__onload.self_expense_approval_not_allowed
        : 0;
    let current_employee = await hrms.get_current_employee();
    if (
        frm.doc.docstatus === 0 &&
        !frm.is_dirty() &&
        !frappe.model.has_workflow(frm.doctype)
    ) {
        if (self_approval_not_allowed && current_employee == frm.doc.employee) {
            frm.set_df_property("status", "read_only", 1);
            frm.trigger("show_save_button");
        }
    }
}
```

**3. Child Table Field Read-Only:**

```js
// Make a field in child table read-only
frm.set_df_property(
    'parent_field',      // Parent table fieldname
    'read_only',         // Property to set
    1,                   // Value
    frm.doc.name,        // Parent document name
    'child_fieldname',   // Child table field
    row.name             // Child row name
);
```

### Multiple Fields at Once

```js
// Using toggle_enable for multiple fields
frm.toggle_enable(['field1', 'field2', 'field3'], false); // false = read-only
```

---

## Automatic Read-Only Scenarios

Frappe **automatically** makes forms read-only in certain situations:

### 1. Document Status (docstatus)

**Source:** Frappe Framework

Documents have three states:
- `docstatus = 0`: **Draft** (editable)
- `docstatus = 1`: **Submitted** (read-only)
- `docstatus = 2`: **Cancelled** (read-only)

**Submitted and cancelled documents are automatically read-only.**

```js
// Check document status
if (frm.doc.docstatus === 1) {
    // Document is submitted and read-only
}
```

### 2. Workflow-Based Read-Only

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (lines 411-415)

```js
// read only (workflow)
this.read_only = frappe.workflow.is_read_only(this.doctype, this.docname);
if (this.read_only) {
    this.set_read_only();
}
```

When a workflow is active, forms become read-only based on:
- Current workflow state
- User's role permissions for that state

**Example:** Leave Application workflow where only Leave Approver can edit in "Pending Approval" state.

### 3. Developer Mode vs Production Mode

**Source:** `frappe/frappe/core/doctype/doctype/doctype.js` (lines 66-74)

```js
if (!frappe.boot.developer_mode && !frm.doc.custom) {
    // make the document read-only
    frm.set_read_only();
    frm.dashboard.clear_comment();
    frm.dashboard.add_comment(
        __("DocTypes can not be modified, please use {0} instead", [customize_form_link]),
        "blue",
        true
    );
}
```

**In Production Mode:**
- Standard DocTypes are read-only
- Must use "Customize Form" for modifications

### 4. Permission-Based Read-Only

Forms automatically become read-only if user lacks write permission:

```js
// Frappe checks permissions automatically
if (!frm.perm[0].write) {
    // Form is read-only
}
```

---

## User Feedback Methods

Always inform users **why** a form is read-only to reduce confusion.

### 1. `frm.set_intro()`

Displays a colored message banner at the top of the form.

**Syntax:**
```js
frm.set_intro(message, color);
```

**Colors:** `'blue'`, `'red'`, `'green'`, `'yellow'`, `'orange'`

**Example:**
```js
frm.set_intro(__("This is a root territory and cannot be edited."), "red");
```

**Clear intro:**
```js
frm.set_intro(null); // Remove intro message
```

### 2. `frm.dashboard.add_comment()`

Adds a comment to the form dashboard (below the title).

**Syntax:**
```js
frm.dashboard.add_comment(message, color, permanent);
```

**Parameters:**
- `message`: Text to display
- `color`: Color of the comment (`'blue'`, `'red'`, `'green'`, etc.)
- `permanent`: `true` = stays until manually cleared, `false` = temporary

**Example:**
```js
frm.dashboard.add_comment(
    __("This document cannot be edited."),
    "blue",
    true
);
```

**Clear comments:**
```js
frm.dashboard.clear_comment();
```

### 3. Comparison

| Method | Location | Persistent | Use Case |
|--------|----------|------------|----------|
| `set_intro()` | Top of form (banner) | Until cleared | Important warnings/info |
| `dashboard.add_comment()` | Dashboard area | Can be permanent | Contextual messages |

---

## Real-World Examples

### Example 1: Root Node Protection (ERPNext Pattern)

**Used in:** Department, Territory, Customer Group, Item Group

```js
frappe.ui.form.on("Department", {
    refresh: function (frm) {
        // Protect root departments from editing
        if (!frm.doc.parent_department && !frm.is_new()) {
            frm.set_read_only();
            frm.set_intro(__("This is a root department and cannot be edited."));
        }
    },
    validate: function (frm) {
        // Additional validation to prevent editing root node
        if (frm.doc.name == "All Departments") {
            frappe.throw(__("You cannot edit root node."));
        }
    }
});
```

### Example 2: Status-Based Read-Only

**Pattern:** Make form read-only based on document status

```js
frappe.ui.form.on("Custom DocType", {
    refresh: function(frm) {
        if (["Completed", "Cancelled", "Closed"].includes(frm.doc.status)) {
            frm.disable_form();
            frm.set_intro(
                __("This document is {0} and cannot be edited.", [frm.doc.status]),
                "blue"
            );
        }
    }
});
```

### Example 3: Developer Mode Protection (Frappe Core Pattern)

**Used in:** DocType, Page, Report

```js
frappe.ui.form.on("Page", {
    refresh: function (frm) {
        if (!frappe.boot.developer_mode && frappe.session.user != "Administrator") {
            // make the document read-only
            frm.set_read_only();
        }
    }
});
```

### Example 4: Conditional Field Read-Only

**Pattern:** Make specific fields read-only based on conditions

```js
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // Make customer field read-only after submission
        if (frm.doc.docstatus === 1) {
            frm.set_df_property("customer", "read_only", 1);
        }

        // Make price fields read-only for specific users
        if (!frappe.user.has_role("Accounts Manager")) {
            frm.set_df_property("discount_amount", "read_only", 1);
            frm.set_df_property("total", "read_only", 1);
        }
    }
});
```

### Example 5: Time-Based Read-Only

**Pattern:** Lock form after a certain date

```js
frappe.ui.form.on("Attendance", {
    refresh: function(frm) {
        if (frm.doc.attendance_date) {
            let days_old = frappe.datetime.get_day_diff(
                frappe.datetime.get_today(),
                frm.doc.attendance_date
            );

            // Lock attendance older than 7 days
            if (days_old > 7 && frm.doc.docstatus === 0) {
                frm.disable_save();
                frm.set_intro(
                    __("Attendance older than 7 days cannot be modified."),
                    "red"
                );
            }
        }
    }
});
```

### Example 6: Self-Approval Prevention (HRMS Pattern)

**Leave Application** (`hrms/hrms/hr/doctype/leave_application/leave_application.js`):

```js
set_form_buttons: async function (frm) {
    let self_approval_not_allowed = frm.doc.__onload
        ? frm.doc.__onload.self_leave_approval_not_allowed
        : 0;
    let current_employee = await hrms.get_current_employee();

    if (
        frm.doc.docstatus === 0 &&
        !frm.is_dirty() &&
        !frappe.model.has_workflow(frm.doctype)
    ) {
        if (self_approval_not_allowed && current_employee == frm.doc.employee) {
            frm.set_df_property("status", "read_only", 1);
            frm.trigger("show_save_button");
        }
    }
},
show_save_button: function (frm) {
    frm.page.set_primary_action("Save", () => {
        frm.save();
    });
    $(".form-message").prop("hidden", true);
}
```

---

## Best Practices

### 1. Always Provide User Feedback

❌ **Bad:**
```js
frm.set_read_only();
```

✅ **Good:**
```js
frm.set_read_only();
frm.set_intro(__("This is a root territory and cannot be edited."), "red");
```

### 2. Use Appropriate Method for Your Use Case

| Scenario | Recommended Method |
|----------|-------------------|
| Root/system records | `frm.set_read_only()` + `frm.set_intro()` |
| Completed/processed documents | `frm.disable_form()` |
| Prevent saving only | `frm.disable_save()` |
| Specific fields | `frm.set_df_property()` |

### 3. Check Document State

Always check if document is new before applying read-only:

```js
if (!frm.doc.__islocal) {
    // Document is saved, safe to make read-only
}

// Or use
if (!frm.is_new()) {
    // Document is saved
}
```

### 4. Use Translation Function

Always wrap user-facing messages in `__()` for translation:

```js
frm.set_intro(__("This document cannot be edited."), "red");
```

### 5. Clear Messages When Conditions Change

```js
if (condition_for_readonly) {
    frm.set_read_only();
    frm.set_intro(__("Cannot edit."), "red");
} else {
    frm.set_intro(null); // Clear the message
}
```

### 6. Combine with Validation

Add server-side validation to prevent bypassing client-side restrictions:

```python
# In your DocType's Python file
def validate(self):
    if not self.parent_department and not self.is_new():
        frappe.throw(_("Root department cannot be edited"))
```

### 7. Consider Workflow Integration

If using workflows, check workflow state:

```js
if (frappe.workflow.is_read_only(frm.doctype, frm.docname)) {
    frm.set_intro(__("Document is read-only due to workflow state."), "blue");
}
```

---

## Summary Table

| Method | Permission | Fields | Save Button | Use Case |
|--------|-----------|--------|-------------|----------|
| `frm.set_read_only()` | ✅ Restricts | ❌ No change | ❌ Remains | Permission-based restrictions |
| `frm.disable_form()` | ✅ Restricts | ✅ All read-only | ✅ Removed | Complete lockdown |
| `frm.disable_save()` | ❌ No change | ❌ No change | ✅ Removed | Prevent saving only |
| `frm.set_df_property()` | ❌ No change | ✅ Specific field | ❌ Remains | Field-level control |

---

## Quick Reference

```js
// Complete form lockdown
frm.disable_form();

// Permission-based read-only
frm.set_read_only();
frm.set_intro(__("Cannot edit this record."), "red");

// Disable save button only
frm.disable_save();

// Single field read-only
frm.set_df_property("fieldname", "read_only", 1);

// Multiple fields read-only
frm.toggle_enable(['field1', 'field2'], false);

// Check if document is new
if (!frm.doc.__islocal || !frm.is_new()) {
    // Document is saved
}

// Check document status
if (frm.doc.docstatus === 1) {
    // Submitted
}

// Clear messages
frm.set_intro(null);
frm.dashboard.clear_comment();
```

---

## References

All examples and code snippets are verified from:
- **Frappe Framework:** `/frappe/frappe/public/js/frappe/form/form.js`
- **ERPNext:** Various DocTypes (Department, Territory, Customer Group, Item Group)
- **HRMS:** Leave Application, Expense Claim
- **Frappe Core:** DocType, Page, Workspace
