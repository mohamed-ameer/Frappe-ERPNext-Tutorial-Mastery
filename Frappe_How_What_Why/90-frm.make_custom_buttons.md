# Understanding `frm.custom_make_buttons` in Frappe

## Overview

`frm.custom_make_buttons` is a Frappe Framework feature that allows you to customize the "Make" button labels in the form toolbar. When users click the "Make" button to create a new document from the current form, you can control what button text appears for each doctype.

## What It Does

`custom_make_buttons` is an object that maps doctype names to custom button labels. When a user tries to create a new document from the current form using the "Make" button, Frappe will:

1. Check if `custom_make_buttons` exists and has an entry for the target doctype
2. If found, use the custom button label instead of the default doctype name
3. When clicked, trigger the corresponding custom button's click handler (if it exists)

## How It Works

### Internal Mechanism

When `frm.make_new(doctype)` is called:

1. **First Priority**: Checks if `frm.make_methods[doctype]` exists - if so, calls that method
2. **Second Priority**: Checks if `frm.custom_make_buttons[doctype]` exists - if so, triggers the click event on the custom button with that label
3. **Default**: Creates a new document and matches link fields automatically

The relevant code from `frappe/public/js/frappe/form/form.js`:
```
make_new(doctype) {
    if (this.make_methods && this.make_methods[doctype]) {
        return this.make_methods[doctype](this);
    } else if (this.custom_make_buttons && this.custom_make_buttons[doctype]) {
        // Triggers the custom button click
        this.custom_buttons[__(this.custom_make_buttons[doctype])].trigger("click");
    } else {
        // Default: create new doc and match link fields
        frappe.model.with_doctype(doctype, function () {
            let new_doc = frappe.model.get_new_doc(doctype, null, null, true);
            me.set_link_field(doctype, new_doc);
            frappe.ui.form.make_quick_entry(doctype, null, null, new_doc);
        });
    }
}
```
### Permission Check

The `can_create()` method also checks `custom_make_buttons`:
```
can_create(doctype) {
    if (this.custom_make_buttons && this.custom_make_buttons[doctype]) {
        const key = __(this.custom_make_buttons[doctype]);
        // Only show "Make" if the custom button exists
        return !!this.custom_buttons[key];
    }
    // ... other checks
}
```

## How to Use

### Basic Syntax

Set `custom_make_buttons` in the `setup` event handler:
```
frappe.ui.form.on("Your DocType", {
    setup: function(frm) {
        frm.custom_make_buttons = {
            "Target DocType 1": "Custom Button Label 1",
            "Target DocType 2": "Custom Button Label 2",
            // ... more mappings
        };
    }
});
```

### Complete Example

Here's a real-world example from Material Request:
```
frappe.ui.form.on("Material Request", {
    setup: function (frm) {
        frm.custom_make_buttons = {
            "Stock Entry": "Issue Material",
            "Pick List": "Pick List",
            "Purchase Order": "Purchase Order",
            "Request for Quotation": "Request for Quotation",
            "Supplier Quotation": "Supplier Quotation",
            "Work Order": "Work Order",
            "Purchase Receipt": "Purchase Receipt",
        };
    },
    
    refresh: function(frm) {
        // Add custom buttons with click handlers
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__("Issue Material"), function() {
                // Custom logic to create Stock Entry
                frm.events.make_stock_entry(frm);
            }, __("Create"));
            
            frm.add_custom_button(__("Purchase Order"), function() {
                // Custom logic to create Purchase Order
                frm.events.make_purchase_order(frm);
            }, __("Create"));
        }
    },
    
    make_stock_entry: function(frm) {
        // Custom implementation
        frappe.model.open_mapped_doc({
            method: "erpnext.stock.doctype.material_request.material_request.make_stock_entry",
            frm: frm
        });
    },
    
    make_purchase_order: function(frm) {
        // Custom implementation
        frappe.model.open_mapped_doc({
            method: "erpnext.buying.doctype.material_request.material_request.make_purchase_order",
            frm: frm
        });
    }
});
```

### Example from Sales Order
```
frappe.ui.form.on("Sales Order", {
    setup: function (frm) {
        frm.custom_make_buttons = {
            "Delivery Note": "Delivery Note",
            "Pick List": "Pick List",
            "Sales Invoice": "Sales Invoice",
            "Material Request": "Material Request",
            "Purchase Order": "Purchase Order",
            "Project": "Project",
            "Payment Entry": "Payment",
            "Work Order": "Work Order",
        };
    }
});
```

## When to Use

### Use `custom_make_buttons` when:

1. **You want custom button labels**: The default doctype name doesn't clearly describe the action (e.g., "Stock Entry" → "Issue Material")

2. **You have custom button handlers**: You've added custom buttons using `frm.add_custom_button()` and want the "Make" button to trigger those custom handlers instead of the default behavior

3. **You need conditional logic**: You want to control when the "Make" button appears based on whether custom buttons exist

4. **Better UX**: You want more descriptive button labels that match your business terminology

### Don't use `custom_make_buttons` when:

1. **Simple default behavior is sufficient**: If the default "Make" functionality (auto-matching link fields) works fine, you don't need this

2. **You're using `make_methods`**: If you're using `frm.make_methods` to handle document creation, `custom_make_buttons` won't be checked (make_methods has higher priority)

3. **No custom buttons**: If you're not adding custom buttons with `frm.add_custom_button()`, this won't provide any benefit

## Important Notes

### 1. Button Must Exist

The custom button label specified in `custom_make_buttons` must match a button created with `frm.add_custom_button()`. If the button doesn't exist, the "Make" action won't work.
```
// ❌ Wrong - button label doesn't match
frm.custom_make_buttons = {
    "Stock Entry": "Issue Material"
};
// But you created button with label "Create Stock Entry"
frm.add_custom_button(__("Create Stock Entry"), handler);

// ✅ Correct - labels match
frm.custom_make_buttons = {
    "Stock Entry": "Issue Material"
};
frm.add_custom_button(__("Issue Material"), handler);
```
### 2. Translation

Button labels are automatically translated, so use `__()` when creating buttons:
```
frm.add_custom_button(__("Issue Material"), handler);
```
### 3. Setup vs Refresh

- **Setup**: Define `custom_make_buttons` in the `setup` event (runs once when form loads)
- **Refresh**: Create actual buttons in the `refresh` event (runs every time form refreshes)

### 4. Priority Order

When `make_new()` is called, Frappe checks in this order:
1. `frm.make_methods[doctype]` (highest priority)
2. `frm.custom_make_buttons[doctype]` (medium priority)
3. Default behavior (lowest priority)

## Complete Workflow Example
```
frappe.ui.form.on("Loan", {
    setup: function(frm) {
        // Define custom button labels
        frm.custom_make_buttons = {
            "Loan Disbursement": "Disburse Loan",
            "Loan Repayment": "Record Payment",
            "Loan Write Off": "Write Off",
        };
    },
    
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            // Create the actual buttons
            frm.add_custom_button(__("Disburse Loan"), function() {
                frm.events.create_disbursement(frm);
            }, __("Create"));
            
            frm.add_custom_button(__("Record Payment"), function() {
                frm.events.create_repayment(frm);
            }, __("Create"));
            
            frm.add_custom_button(__("Write Off"), function() {
                frm.events.create_write_off(frm);
            }, __("Create"));
        }
    },
    
    create_disbursement: function(frm) {
        frappe.model.open_mapped_doc({
            method: "ngo.ngo_loan.doctype.loan.loan.create_disbursement",
            frm: frm
        });
    },
    
    create_repayment: function(frm) {
        frappe.model.open_mapped_doc({
            method: "ngo.ngo_loan.doctype.loan.loan.create_repayment",
            frm: frm
        });
    },
    
    create_write_off: function(frm) {
        frappe.model.open_mapped_doc({
            method: "ngo.ngo_loan.doctype.loan.loan.create_write_off",
            frm: frm
        });
    }
});
```

## Summary

- **Purpose**: Customize "Make" button labels and link them to custom button handlers
- **When**: Use when you have custom buttons with specific handlers
- **How**: Define mapping in `setup`, create buttons in `refresh`
- **Priority**: Lower than `make_methods`, higher than default behavior
- **Requirement**: Custom button must exist with matching label

This feature provides a clean way to integrate custom document creation workflows with Frappe's standard "Make" button functionality.