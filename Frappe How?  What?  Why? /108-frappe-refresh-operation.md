# Frappe Refresh Operations - Complete Story

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding Form Lifecycle](#understanding-form-lifecycle)
3. [Core Refresh Methods](#core-refresh-methods)
4. [Method Comparison](#method-comparison)
5. [How Each Method Works Internally](#how-each-method-works-internally)
6. [Real-World Examples](#real-world-examples)
7. [Common Patterns and Use Cases](#common-patterns-and-use-cases)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Quick Reference](#quick-reference)

---

## Introduction

### What Are Refresh Operations?

In Frappe, **refresh operations** are methods that update the user interface (UI) to reflect changes in data, permissions, or field properties. They are essential for keeping the form synchronized with the underlying document state.

### Why Do Refresh Operations Matter?

When you:
- Change a field value programmatically
- Update permissions
- Modify field properties (read-only, hidden, mandatory)
- Load new data from the server
- Switch between documents

...the UI needs to be **refreshed** to show these changes to the user.

### What You'll Learn

This guide covers:
- **All refresh methods** in Frappe (`frm.refresh()`, `frm.reload_doc()`, `frm.refresh_field()`, etc.)
- **When to use each method** (with practical examples)
- **How they work internally** (verified from Frappe source code)
- **Performance considerations** (avoiding unnecessary refreshes)
- **Common pitfalls** (infinite loops, stale data)

---

## Understanding Form Lifecycle

Before diving into refresh methods, let's understand **how forms work** in Frappe.

### The Form Object (`frm`)

The `frm` object is an instance of `frappe.ui.form.Form` class. It represents the currently opened form and provides APIs to control form behavior.

**Key Properties:**
```javascript
frm.doctype          // DocType name (e.g., "Sales Order")
frm.docname          // Document name (e.g., "SO-00001")
frm.doc              // Current document object (data)
frm.fields_dict      // Dictionary of all fields
frm.layout           // Layout manager
frm.toolbar          // Toolbar with buttons
frm.dashboard        // Dashboard
frm.opendocs         // Tracks opened documents
frm.refresh_if_stale_for  // Auto-refresh threshold (120 seconds)
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 24-44)

### Form Lifecycle Stages

When you open a form, Frappe goes through these stages:

```
1. Constructor → Initialize form object
2. setup() → Create layout, toolbar, fields
3. refresh(docname) → Load and display document
4. render_form() → Render UI (serial execution)
   ├─ refresh_header()
   ├─ refresh_fields()
   ├─ trigger("refresh")
   └─ onload_post_render()
5. User Interactions → Field changes, button clicks
6. save() → Validate and save to server
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 73-630)

### The `locals` Object

Frappe stores all loaded documents in a global object called `locals`:

```javascript
// Structure
locals = {
    "Sales Order": {
        "SO-00001": { /* document data */ },
        "SO-00002": { /* document data */ }
    },
    "Customer": {
        "CUST-001": { /* document data */ }
    }
}

// Access document
let doc = frappe.get_doc("Sales Order", "SO-00001");
// Same as: locals["Sales Order"]["SO-00001"]
```

This is important because:
- `frm.refresh()` reads from `locals`
- `frm.reload_doc()` clears `locals` and fetches fresh data

---

## Core Refresh Methods

Frappe provides several refresh methods, each serving a different purpose.

### 1. `frm.refresh(docname)`

**Purpose:** Main refresh method that updates the entire form UI.

**When to Use:**
- After loading a document
- When switching between documents
- After major changes that affect multiple fields

**What It Does:**
1. Switches to a different document (if `docname` provided)
2. Sets `frm.doc` from `locals`
3. Checks permissions
4. Updates grids with new permissions
5. Checks workflow read-only status
6. Triggers form rendering
7. Calls all `refresh` event handlers

**Syntax:**
```javascript
// Refresh current document
frm.refresh();

// Switch to another document and refresh
frm.refresh("SO-00002");
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 380-455)

---

### 2. `frm.reload_doc()`

**Purpose:** Reload document from server with fresh data.

**When to Use:**
- After server-side changes (background jobs, webhooks)
- When you suspect data is stale
- After another user modified the document
- To discard local unsaved changes

**What It Does:**
1. Checks for document conflicts
2. Removes document from `locals` (clears cache)
3. Fetches fresh data from server via `frappe.model.with_doc()`
4. Calls `frm.refresh()` after loading

**Syntax:**
```javascript
frm.reload_doc();
```

**Important:** Only works for saved documents (not new/unsaved documents).

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 1305-1314)

---

### 3. `frm.refresh_field(fieldname)`

**Purpose:** Refresh a single field.

**When to Use:**
- After changing a field value programmatically
- After modifying field properties (hidden, read_only, options)
- When you want to update just one field (performance optimization)

**What It Does:**
1. Calls the field's `refresh()` method
2. Refreshes dependencies (fields that depend on this field)
3. Refreshes sections (show/hide sections based on field values)

**Syntax:**
```javascript
// Refresh single field
frm.refresh_field("customer");

// Refresh child table field
frm.refresh_field("items");
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 1316-1322)

---

### 4. `frm.refresh_fields()`

**Purpose:** Refresh all fields in the form.

**When to Use:**
- After bulk changes to multiple fields
- After changing permissions
- After modifying multiple field properties

**What It Does:**
1. Calls `layout.refresh(this.doc)`
2. Updates primary button reference
3. Runs cleanup activities

**Syntax:**
```javascript
frm.refresh_fields();
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 660-666)

---

### 5. `layout.refresh(doc)`

**Purpose:** Layout-level refresh (called by `frm.refresh_fields()`).

**When to Use:**
- Usually called internally by `frm.refresh_fields()`
- Rarely called directly

**What It Does:**
1. Attaches document to all fields
2. Triggers `refresh-fields` event
3. Refreshes dependencies (`depends_on` logic)
4. Refreshes sections (show/hide empty sections)
5. Refreshes collapsible sections

**Syntax:**
```javascript
frm.layout.refresh(frm.doc);
```

**Source:** `frappe/frappe/public/js/frappe/form/layout.js` (Lines 351-381)

---

### 6. `field.refresh()`

**Purpose:** Individual field control refresh.

**When to Use:**
- Usually called internally by `frm.refresh_field()`
- Rarely called directly

**What It Does:**
1. Gets field status (Read/Write/None) based on permissions
2. Shows/hides field based on status
3. Calls `refresh_input()` to update the input element
4. Shows translatable button if applicable

**Syntax:**
```javascript
frm.fields_dict["customer"].refresh();
```

**Source:** `frappe/frappe/public/js/frappe/form/controls/base_control.js` (Lines 135-145)

---

### 7. `refresh_field()` Global Helper

**Purpose:** Global function to refresh fields (works in any context).

**When to Use:**
- In server scripts (when `frm` might not be available)
- In child table rows
- In custom scripts

**What It Does:**
- Refreshes parent form fields
- Refreshes child table fields
- Handles both single fields and arrays of fields

**Syntax:**
```javascript
// Refresh parent field
refresh_field("customer");

// Refresh child table field
refresh_field("rate", "row-name", "items");

// Refresh multiple fields
refresh_field(["customer", "territory", "sales_person"]);
```

**Source:** `frappe/frappe/public/js/frappe/form/script_helpers.js` (Lines 11-33)

---

### 8. Auto-Refresh Mechanism

Frappe automatically refreshes forms when they become stale.

**How It Works:**
- Every document has `__last_sync_on` timestamp
- If form is idle for more than `refresh_if_stale_for` seconds (default: 120)
- Frappe calls `debounced_reload_doc()` automatically

**Configuration:**
```javascript
// Change auto-refresh threshold
frm.refresh_if_stale_for = 300; // 5 minutes
```

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 32, 44, 527-537)

---

## Method Comparison

### Quick Comparison Table

| Method | Scope | Server Call | Use Case | Performance |
|--------|-------|-------------|----------|-------------|
| `frm.refresh()` | Entire form | No | Switch documents, major changes | Medium |
| `frm.reload_doc()` | Entire form | **Yes** | Get fresh data from server | Slow |
| `frm.refresh_field()` | Single field | No | Update one field | Fast |
| `frm.refresh_fields()` | All fields | No | Update all fields | Medium |
| `layout.refresh()` | Layout | No | Internal use | Medium |
| `field.refresh()` | Single field | No | Internal use | Fast |
| `refresh_field()` | Single/Multiple | No | Global helper | Fast |

### When to Use Which Method?

#### Use `frm.refresh()` when:
- ✅ Switching between documents
- ✅ After loading a document for the first time
- ✅ After major permission changes
- ✅ After workflow state changes
- ❌ NOT for simple field value changes (too heavy)

#### Use `frm.reload_doc()` when:
- ✅ You need fresh data from the server
- ✅ After background job completion
- ✅ After webhook/API updates
- ✅ To discard unsaved changes
- ❌ NOT frequently (causes server load)
- ❌ NOT for new/unsaved documents

#### Use `frm.refresh_field()` when:
- ✅ After changing a single field value
- ✅ After modifying field properties
- ✅ After changing field options
- ✅ Most common use case (best performance)

#### Use `frm.refresh_fields()` when:
- ✅ After bulk field changes
- ✅ After permission updates
- ✅ After modifying multiple field properties
- ❌ NOT when only one field changed (use `refresh_field` instead)

---

## How Each Method Works Internally

Let's dive deep into the source code to understand exactly what happens.

### `frm.refresh(docname)` - Internal Flow

**Source Code:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 380-455)

```javascript
refresh(docname) {
    var switched = docname ? true : false;

    // Remove beforeunload listener
    removeEventListener("beforeunload", this.beforeUnloadListener, { capture: true });

    // Switch to different document if docname provided
    if (docname) {
        this.switch_doc(docname);
    }

    // Set global cur_frm
    cur_frm = this;

    // Clear undo history
    this.undo_manager.erase_history();

    if (this.docname) {
        // 1. Get document from locals
        this.doc = frappe.get_doc(this.doctype, this.docname);

        // 2. Check permissions
        this.fetch_permissions();
        if (!this.has_read_permission()) {
            frappe.show_not_permitted(__(this.doctype) + " " + __(cstr(this.docname)));
            return;
        }

        // 3. Update grids with new permissions
        this.grids.forEach((table) => {
            table.grid.refresh();
        });

        // 4. Check workflow read-only status
        this.read_only = frappe.workflow.is_read_only(this.doctype, this.docname);
        if (this.read_only) {
            this.set_read_only();
        }

        // 5. Check if document already open
        if (!this.opendocs[this.docname]) {
            this.check_doctype_conflict(this.docname);
        } else {
            // Auto-reload if stale
            if (this.check_reload()) {
                return;
            }
        }

        // 6. Setup form (first time only)
        if (!this.setup_done) {
            this.setup();
        }

        // 7. Trigger onload or render_form
        this.trigger_onload(switched);

        // ... more code
    }
}
```

**Key Points:**
1. **No server call** - reads from `locals`
2. **Permission check** - ensures user can view document
3. **Grid refresh** - updates child tables
4. **Workflow check** - applies read-only if needed
5. **Triggers events** - calls `refresh` event handlers

---

### `frm.reload_doc()` - Internal Flow

**Source Code:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 1305-1314)

```javascript
reload_doc() {
    // Check for conflicts
    this.check_doctype_conflict(this.docname);

    // Only reload saved documents
    if (!this.doc.__islocal) {
        // 1. Remove from locals (clear cache)
        frappe.model.remove_from_locals(this.doctype, this.docname);

        // 2. Fetch from server
        return frappe.model.with_doc(this.doctype, this.docname, () => {
            // 3. Refresh form with new data
            this.refresh();
        });
    }
}
```

**What `frappe.model.remove_from_locals()` does:**

**Source:** `frappe/frappe/public/js/frappe/model/model.js` (Lines 659-664)

```javascript
remove_from_locals: function(doctype, name) {
    this.clear_doc(doctype, name);
    if (frappe.views.formview[doctype]) {
        delete frappe.views.formview[doctype].frm.opendocs[name];
    }
}
```

**What `frappe.model.with_doc()` does:**

**Source:** `frappe/frappe/public/js/frappe/model/model.js` (Lines 308-318)

```javascript
with_doc: function(doctype, name, callback) {
    return new Promise((resolve) => {
        if (!name) name = doctype; // single type

        // Check if already in locals
        if (locals[doctype] && locals[doctype][name] &&
            frappe.model.get_docinfo(doctype, name)) {
            callback && callback(name);
            resolve(frappe.get_doc(doctype, name));
        } else {
            // Fetch from server
            frappe.call({
                method: "frappe.desk.form.load.getdoc",
                args: { doctype: doctype, name: name },
                callback: function(r) {
                    callback && callback(name);
                    resolve(frappe.get_doc(doctype, name));
                }
            });
        }
    });
}
```

**Key Points:**
1. **Server call** - fetches fresh data via `frappe.call()`
2. **Clears cache** - removes old data from `locals`
3. **Async operation** - returns a Promise
4. **Calls refresh** - updates UI after loading

---

### `frm.refresh_field(fieldname)` - Internal Flow

**Source Code:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 1316-1322)

```javascript
refresh_field(fname) {
    // Check if field exists and has refresh method
    if (this.fields_dict[fname] && this.fields_dict[fname].refresh) {
        // 1. Refresh the field
        this.fields_dict[fname].refresh();

        // 2. Refresh dependencies
        this.layout.refresh_dependency();

        // 3. Refresh sections
        this.layout.refresh_sections();
    }
}
```

**What `field.refresh()` does:**

**Source:** `frappe/frappe/public/js/frappe/form/controls/base_control.js` (Lines 135-145)

```javascript
refresh() {
    // 1. Get field status (Read/Write/None)
    this.disp_status = this.get_status();

    // 2. Show/hide field based on status
    this.$wrapper &&
        this.$wrapper.toggleClass("hide-control", this.disp_status == "None") &&
        this.refresh_input &&
        this.refresh_input();

    // 3. Get current value
    var value = this.get_value();

    // 4. Show translatable button if applicable
    this.show_translatable_button(value);
}
```

**What `get_status()` does:**

**Source:** `frappe/frappe/public/js/frappe/form/controls/base_control.js` (Lines 48-134)

Returns one of three values:
- **"Write"** - Field is editable
- **"Read"** - Field is read-only
- **"None"** - Field is hidden

Based on:
- Field properties (`hidden`, `read_only`, `hidden_due_to_dependency`)
- Permissions (user's role permissions)
- Document status (`docstatus`)
- Workflow state
- Parent grid status (for child table fields)
- Field value (hide read-only fields with no value)

**Key Points:**
1. **No server call** - pure UI update
2. **Fast** - only updates one field
3. **Cascading** - also refreshes dependencies and sections
4. **Smart hiding** - hides read-only fields with no value

---

### `frm.refresh_fields()` - Internal Flow

**Source Code:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 660-666)

```javascript
refresh_fields() {
    // 1. Refresh layout (all fields)
    this.layout.refresh(this.doc);

    // 2. Update primary button reference
    this.layout.primary_button = this.$wrapper.find(".btn-primary");

    // 3. Cleanup activities
    this.cleanup_refresh(this);
}
```

**What `layout.refresh(doc)` does:**

**Source:** `frappe/frappe/public/js/frappe/form/layout.js` (Lines 351-381)

```javascript
refresh(doc) {
    if (doc) this.doc = doc;

    // Remove empty form alert
    if (this.frm) {
        this.wrapper.find(".empty-form-alert").remove();
    }

    // 1. Attach document to all fields
    this.attach_doc_and_docfields(true);

    // 2. Trigger refresh-fields event
    if (this.frm && this.frm.wrapper) {
        $(this.frm.wrapper).trigger("refresh-fields");
    }

    // 3. Refresh dependencies (depends_on logic)
    this.refresh_dependency();

    // 4. Refresh sections (show/hide empty sections)
    this.refresh_sections();

    // 5. Refresh collapsible sections
    if (this.frm) {
        this.refresh_section_collapse();
    }

    // 6. Select numeric field value if active
    if (document.activeElement) {
        if (document.activeElement.tagName == "INPUT" &&
            this.is_numeric_field_active()) {
            document.activeElement.select();
        }
    }
}
```

**What `attach_doc_and_docfields(refresh)` does:**

**Source:** `frappe/frappe/public/js/frappe/form/layout.js` (Lines 485-499)

```javascript
attach_doc_and_docfields(refresh) {
    let me = this;
    for (let i = 0, l = this.fields_list.length; i < l; i++) {
        let fieldobj = this.fields_list[i];
        if (me.doc) {
            // Attach document to field
            fieldobj.doc = me.doc;
            fieldobj.doctype = me.doc.doctype;
            fieldobj.docname = me.doc.name;

            // Get latest docfield definition
            fieldobj.df = frappe.meta.get_docfield(
                me.doc.doctype,
                fieldobj.df.fieldname,
                me.doc.name
            ) || fieldobj.df;
        }

        // Refresh field if requested
        refresh && fieldobj.df && fieldobj.refresh && fieldobj.refresh();
    }
}
```

**Key Points:**
1. **No server call** - pure UI update
2. **Updates all fields** - loops through all fields
3. **Handles dependencies** - shows/hides based on `depends_on`
4. **Manages sections** - hides empty sections
5. **Slower than refresh_field** - but still fast (no network)

---

### Serial Execution in `render_form()`

When a form is rendered, Frappe executes tasks **serially** (one after another) using `frappe.run_serially()`.

**Source:** `frappe/frappe/public/js/frappe/form/form.js` (Lines 597-618)

```javascript
frappe.run_serially([
    // 1. Refresh header (toolbar, buttons, title)
    () => this.refresh_header(switched),

    // 2. Trigger global form-refresh event
    () => $(document).trigger("form-refresh", [this]),

    // 3. Refresh all fields
    () => this.refresh_fields(),

    // 4. Trigger custom "refresh" event
    () => this.script_manager.trigger("refresh"),

    // 5. Call onload_post_render (first time only)
    () => {
        if (this.cscript.is_onload) {
            this.onload_post_render();
            return this.script_manager.trigger("onload_post_render");
        }
    },

    // 6. Focus on first input (new documents)
    () => this.cscript.is_onload && this.is_new() && this.focus_on_first_input(),

    // 7. Run after_load hook
    () => this.run_after_load_hook(),

    // 8. Dashboard after_refresh
    () => this.dashboard.after_refresh(),
]);
```

**Why Serial Execution?**
- **Order matters** - header must be refreshed before custom buttons can be added
- **Event sequence** - `refresh` event must fire after fields are ready
- **Predictable** - developers can rely on execution order

---

## Real-World Examples

Let's see how refresh methods are used in real Frappe/ERPNext code.

### Example 1: Change Field Value and Refresh

**Scenario:** When customer changes, update territory and refresh the field.

```javascript
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        if (frm.doc.customer) {
            // Get customer's territory
            frappe.db.get_value("Customer", frm.doc.customer, "territory", (r) => {
                // Set territory value
                frm.set_value("territory", r.territory);

                // Refresh territory field to show new value
                frm.refresh_field("territory");
            });
        }
    }
});
```

**Why `refresh_field()`?**
- Only one field changed
- Fast and efficient
- Updates UI immediately

---

### Example 2: Make Field Read-Only and Refresh

**Scenario:** Make "delivery_date" read-only after submission.

```javascript
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            // Set field as read-only
            frm.set_df_property("delivery_date", "read_only", 1);

            // Refresh field to apply read-only state
            frm.refresh_field("delivery_date");
        }
    }
});
```

**Note:** `set_df_property()` automatically calls `refresh_field()`, so explicit refresh is optional here.

---

### Example 3: Reload After Background Job

**Scenario:** After a background job completes, reload the document.

```javascript
frappe.ui.form.on("Sales Order", {
    create_delivery_note: function(frm) {
        frappe.call({
            method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
            args: { source_name: frm.doc.name },
            callback: function(r) {
                if (!r.exc) {
                    frappe.msgprint(__("Delivery Note created"));

                    // Reload to get updated status
                    frm.reload_doc();
                }
            }
        });
    }
});
```

**Why `reload_doc()`?**
- Server-side changes were made
- Need fresh data from database
- Status fields might have changed

---

### Example 4: Refresh Multiple Fields After Calculation

**Scenario:** Recalculate totals and refresh all amount fields.

```javascript
frappe.ui.form.on("Sales Order", {
    calculate_totals: function(frm) {
        let total = 0;
        let tax = 0;

        // Calculate totals
        frm.doc.items.forEach(row => {
            total += row.amount;
        });

        tax = total * 0.18; // 18% tax

        // Set values
        frm.doc.total = total;
        frm.doc.tax = tax;
        frm.doc.grand_total = total + tax;

        // Refresh all amount fields
        frm.refresh_fields();
    }
});
```

**Why `refresh_fields()`?**
- Multiple fields changed
- All need to be updated
- More efficient than calling `refresh_field()` multiple times

---

### Example 5: Conditional Field Visibility

**Scenario:** Show/hide fields based on another field's value.

```javascript
frappe.ui.form.on("Sales Order", {
    order_type: function(frm) {
        if (frm.doc.order_type === "Maintenance") {
            // Show maintenance fields
            frm.set_df_property("maintenance_schedule", "hidden", 0);
            frm.set_df_property("maintenance_type", "hidden", 0);
        } else {
            // Hide maintenance fields
            frm.set_df_property("maintenance_schedule", "hidden", 1);
            frm.set_df_property("maintenance_type", "hidden", 1);
        }

        // Refresh to apply visibility changes
        frm.refresh_fields();
    }
});
```

**Better Approach:** Use `depends_on` in DocType definition:
```json
{
    "fieldname": "maintenance_schedule",
    "depends_on": "eval:doc.order_type=='Maintenance'"
}
```

Then Frappe automatically handles show/hide without manual refresh!

---

### Example 6: Refresh Child Table

**Scenario:** After adding items, refresh the items table.

```javascript
frappe.ui.form.on("Sales Order", {
    add_items: function(frm) {
        // Add multiple items
        ["Item A", "Item B", "Item C"].forEach(item => {
            let row = frm.add_child("items");
            row.item_code = item;
            row.qty = 1;
        });

        // Refresh items table
        frm.refresh_field("items");
    }
});
```

**Why `refresh_field("items")`?**
- Refreshes the entire child table grid
- Shows newly added rows
- Recalculates grid totals

---

### Example 7: Real Example from ERPNext

**Source:** ERPNext Sales Order

```javascript
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // Add custom buttons based on status
        if (frm.doc.docstatus === 1 && frm.doc.status !== "Closed") {
            // Add "Create Delivery Note" button
            frm.add_custom_button(__("Delivery Note"), function() {
                // Create delivery note
                frappe.model.open_mapped_doc({
                    method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
                    frm: frm
                });
            }, __("Create"));

            // Add "Create Sales Invoice" button
            frm.add_custom_button(__("Sales Invoice"), function() {
                // Create sales invoice
                frappe.model.open_mapped_doc({
                    method: "erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice",
                    frm: frm
                });
            }, __("Create"));
        }
    }
});
```

**Key Point:** Custom buttons are added in `refresh` event because:
- `refresh` fires every time form is displayed
- Buttons need to be recreated each time
- Conditions (status, permissions) might have changed

---

## Common Patterns and Use Cases

### Pattern 1: Set Value and Refresh

**Most Common Pattern:**
```javascript
// Set value
frm.set_value("fieldname", value);

// Refresh field (optional - set_value auto-refreshes)
frm.refresh_field("fieldname");
```

**Note:** `frm.set_value()` automatically refreshes the field, so explicit `refresh_field()` is usually not needed.

---

### Pattern 2: Modify Property and Refresh

**Common Pattern:**
```javascript
// Modify field property
frm.set_df_property("fieldname", "read_only", 1);

// Refresh field (optional - set_df_property auto-refreshes)
frm.refresh_field("fieldname");
```

**Note:** `frm.set_df_property()` automatically refreshes the field.

---

### Pattern 3: Bulk Changes and Refresh

**Efficient Pattern:**
```javascript
// Make multiple changes
frm.doc.field1 = value1;
frm.doc.field2 = value2;
frm.doc.field3 = value3;

// Refresh all fields once
frm.refresh_fields();
```

**Inefficient Pattern (avoid):**
```javascript
// ❌ Don't do this
frm.set_value("field1", value1);
frm.refresh_field("field1");
frm.set_value("field2", value2);
frm.refresh_field("field2");
frm.set_value("field3", value3);
frm.refresh_field("field3");
```

---

### Pattern 4: Server Call and Reload

**Standard Pattern:**
```javascript
frappe.call({
    method: "my_app.api.update_document",
    args: { name: frm.doc.name },
    callback: function(r) {
        if (!r.exc) {
            // Reload to get server changes
            frm.reload_doc();
        }
    }
});
```

---

### Pattern 5: Conditional Refresh

**Smart Pattern:**
```javascript
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        // Only refresh if customer is set
        if (frm.doc.customer) {
            // Fetch and update
            frappe.db.get_value("Customer", frm.doc.customer, "territory", (r) => {
                if (r.territory !== frm.doc.territory) {
                    // Only refresh if value actually changed
                    frm.set_value("territory", r.territory);
                }
            });
        }
    }
});
```

---

### Pattern 6: Debounced Refresh

**For Frequent Updates:**
```javascript
// Create debounced refresh function
frm.debounced_refresh = frappe.utils.debounce(function() {
    frm.refresh_fields();
}, 300); // Wait 300ms after last call

// Use in frequently-called event
frappe.ui.form.on("Sales Order Item", {
    qty: function(frm, cdt, cdn) {
        // Calculate totals
        calculate_totals(frm);

        // Debounced refresh (won't refresh on every keystroke)
        frm.debounced_refresh();
    }
});
```

---

## Troubleshooting

### Issue 1: Field Not Updating After `set_value()`

**Symptoms:**
- Called `frm.set_value()` but field doesn't show new value
- Value is set in `frm.doc` but UI doesn't update

**Causes:**
1. Field is read-only or hidden
2. Field has `depends_on` that evaluates to false
3. JavaScript error preventing refresh

**Solutions:**
```javascript
// ✅ Check field status
console.log(frm.fields_dict["fieldname"].get_status()); // Should be "Write"

// ✅ Check if field is hidden
console.log(frm.fields_dict["fieldname"].df.hidden); // Should be 0

// ✅ Force refresh
frm.set_value("fieldname", value);
frm.refresh_field("fieldname");

// ✅ Check for errors in console
// Open browser DevTools (F12) and check Console tab
```

---

### Issue 2: Infinite Refresh Loop

**Symptoms:**
- Browser freezes or becomes very slow
- Console shows repeated refresh calls
- Form becomes unresponsive

**Causes:**
- Calling `refresh_field()` inside a field's change event
- Circular dependencies between fields

**Example of Problem:**
```javascript
// ❌ BAD - Creates infinite loop
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        frm.set_value("territory", "Default");
    },
    territory: function(frm) {
        frm.set_value("customer", "Default Customer");
    }
});
```

**Solutions:**
```javascript
// ✅ GOOD - Use flag to prevent loop
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        if (!frm.updating_territory) {
            frm.updating_territory = true;
            frm.set_value("territory", "Default");
            frm.updating_territory = false;
        }
    }
});

// ✅ BETTER - Check if value actually changed
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        let new_territory = "Default";
        if (frm.doc.territory !== new_territory) {
            frm.set_value("territory", new_territory);
        }
    }
});
```

---

### Issue 3: `reload_doc()` Not Working

**Symptoms:**
- Called `frm.reload_doc()` but nothing happens
- Document doesn't refresh

**Causes:**
1. Document is new/unsaved (`__islocal` is true)
2. Network error preventing server call
3. Permissions issue

**Solutions:**
```javascript
// ✅ Check if document is saved
if (!frm.doc.__islocal) {
    frm.reload_doc();
} else {
    frappe.msgprint(__("Please save the document first"));
}

// ✅ Check network in browser DevTools
// Open DevTools (F12) → Network tab → Look for errors

// ✅ Use callback to handle errors
frm.reload_doc().then(() => {
    frappe.msgprint(__("Document reloaded"));
}).catch((err) => {
    console.error("Reload failed:", err);
});
```

---

### Issue 4: Child Table Not Refreshing

**Symptoms:**
- Added rows to child table but they don't appear
- Modified child table data but UI doesn't update

**Causes:**
1. Forgot to call `refresh_field()` on table field
2. Grid is in edit mode
3. Grid pagination hiding new rows

**Solutions:**
```javascript
// ✅ Add row and refresh
let row = frm.add_child("items");
row.item_code = "ITEM-001";
row.qty = 1;
frm.refresh_field("items");

// ✅ Close grid edit mode first
frappe.ui.form.close_grid_form();
frm.refresh_field("items");

// ✅ Refresh specific row
frm.fields_dict["items"].grid.refresh_row(row.name);
```

---

### Issue 5: Stale Data After Server Changes

**Symptoms:**
- Another user modified the document
- Background job updated the document
- Data in form is outdated

**Causes:**
- Form is reading from `locals` cache
- No auto-refresh triggered

**Solutions:**
```javascript
// ✅ Manual reload
frm.reload_doc();

// ✅ Enable auto-refresh (default: 120 seconds)
frm.refresh_if_stale_for = 60; // Refresh if idle for 60 seconds

// ✅ Listen for realtime updates
frappe.realtime.on("doc_update", (data) => {
    if (data.doctype === frm.doctype && data.name === frm.docname) {
        frappe.show_alert({
            message: __("Document was updated by another user"),
            indicator: "orange"
        });
        frm.reload_doc();
    }
});
```

---

### Issue 6: Performance Issues with Frequent Refreshes

**Symptoms:**
- Form is slow or laggy
- Browser becomes unresponsive
- High CPU usage

**Causes:**
- Calling `refresh_fields()` too frequently
- Refreshing in loops
- Heavy calculations in refresh event

**Solutions:**
```javascript
// ❌ BAD - Refreshes in loop
frm.doc.items.forEach(row => {
    row.amount = row.qty * row.rate;
    frm.refresh_field("items"); // Called multiple times!
});

// ✅ GOOD - Refresh once after loop
frm.doc.items.forEach(row => {
    row.amount = row.qty * row.rate;
});
frm.refresh_field("items"); // Called once

// ✅ BETTER - Use debouncing
let debounced_refresh = frappe.utils.debounce(() => {
    frm.refresh_field("items");
}, 300);

frm.doc.items.forEach(row => {
    row.amount = row.qty * row.rate;
});
debounced_refresh();
```

---

## Best Practices

### Do's ✅

1. **Use the most specific refresh method**
   ```javascript
   // ✅ Refresh single field
   frm.refresh_field("customer");

   // ❌ Don't refresh entire form for one field
   frm.refresh_fields();
   ```

2. **Let Frappe auto-refresh when possible**
   ```javascript
   // ✅ set_value auto-refreshes
   frm.set_value("fieldname", value);

   // ❌ Don't manually refresh after set_value
   frm.set_value("fieldname", value);
   frm.refresh_field("fieldname"); // Redundant!
   ```

3. **Use `depends_on` instead of manual show/hide**
   ```javascript
   // ✅ Define in DocType
   {
       "fieldname": "tax_id",
       "depends_on": "eval:doc.country=='USA'"
   }

   // ❌ Don't manually show/hide
   frappe.ui.form.on("Customer", {
       country: function(frm) {
           if (frm.doc.country === "USA") {
               frm.set_df_property("tax_id", "hidden", 0);
           } else {
               frm.set_df_property("tax_id", "hidden", 1);
           }
       }
   });
   ```

4. **Check if value changed before refreshing**
   ```javascript
   // ✅ Avoid unnecessary refreshes
   if (frm.doc.territory !== new_territory) {
       frm.set_value("territory", new_territory);
   }
   ```

5. **Use `reload_doc()` after server-side changes**
   ```javascript
   // ✅ Reload after background job
   frappe.call({
       method: "my_app.api.process_document",
       args: { name: frm.doc.name },
       callback: function(r) {
           if (!r.exc) {
               frm.reload_doc();
           }
       }
   });
   ```

6. **Batch updates and refresh once**
   ```javascript
   // ✅ Update multiple fields, refresh once
   frm.doc.field1 = value1;
   frm.doc.field2 = value2;
   frm.doc.field3 = value3;
   frm.refresh_fields();
   ```

7. **Use debouncing for frequent updates**
   ```javascript
   // ✅ Debounce rapid refreshes
   frm.debounced_refresh = frappe.utils.debounce(() => {
       frm.refresh_fields();
   }, 300);
   ```

8. **Handle errors in reload_doc()**
   ```javascript
   // ✅ Check if document is saved
   if (!frm.doc.__islocal) {
       frm.reload_doc();
   }
   ```

---

### Don'ts ❌

1. **Don't call `refresh()` manually**
   ```javascript
   // ❌ Never call refresh() manually
   frm.refresh();

   // ✅ Use specific methods instead
   frm.refresh_field("fieldname");
   frm.refresh_fields();
   frm.reload_doc();
   ```

2. **Don't refresh in loops**
   ```javascript
   // ❌ Refreshing in loop
   frm.doc.items.forEach(row => {
       row.amount = row.qty * row.rate;
       frm.refresh_field("items");
   });

   // ✅ Refresh once after loop
   frm.doc.items.forEach(row => {
       row.amount = row.qty * row.rate;
   });
   frm.refresh_field("items");
   ```

3. **Don't create infinite loops**
   ```javascript
   // ❌ Infinite loop
   frappe.ui.form.on("Sales Order", {
       customer: function(frm) {
           frm.set_value("territory", "Default");
       },
       territory: function(frm) {
           frm.set_value("customer", "Default");
       }
   });
   ```

4. **Don't use `reload_doc()` for local changes**
   ```javascript
   // ❌ Unnecessary server call
   frm.set_value("customer", "CUST-001");
   frm.reload_doc(); // Wasteful!

   // ✅ Just refresh field
   frm.set_value("customer", "CUST-001");
   ```

5. **Don't refresh after every `set_value()`**
   ```javascript
   // ❌ Redundant refresh
   frm.set_value("fieldname", value);
   frm.refresh_field("fieldname"); // Not needed!

   // ✅ set_value auto-refreshes
   frm.set_value("fieldname", value);
   ```

6. **Don't use `refresh_fields()` when `refresh_field()` is enough**
   ```javascript
   // ❌ Overkill for one field
   frm.doc.customer = "CUST-001";
   frm.refresh_fields();

   // ✅ Refresh only the field that changed
   frm.doc.customer = "CUST-001";
   frm.refresh_field("customer");
   ```

7. **Don't ignore the return value of `reload_doc()`**
   ```javascript
   // ❌ No error handling
   frm.reload_doc();
   do_something(); // Might run before reload completes!

   // ✅ Wait for reload to complete
   frm.reload_doc().then(() => {
       do_something();
   });
   ```

---

## Quick Reference

### Method Cheat Sheet

| Method | Server Call | Speed | Use When |
|--------|-------------|-------|----------|
| `frm.refresh()` | No | Medium | Switching documents |
| `frm.reload_doc()` | **Yes** | Slow | Need fresh server data |
| `frm.refresh_field(fname)` | No | **Fast** | Single field changed |
| `frm.refresh_fields()` | No | Medium | Multiple fields changed |
| `refresh_field(fname)` | No | **Fast** | Global helper |

### Common Scenarios

| Scenario | Method to Use |
|----------|---------------|
| Changed one field value | `frm.refresh_field("fieldname")` |
| Changed multiple field values | `frm.refresh_fields()` |
| Made field read-only | `frm.set_df_property()` (auto-refreshes) |
| Changed field options | `frm.set_df_property()` (auto-refreshes) |
| Added child table rows | `frm.refresh_field("table_fieldname")` |
| Server-side changes | `frm.reload_doc()` |
| Background job completed | `frm.reload_doc()` |
| Another user modified doc | `frm.reload_doc()` |
| Switched to different doc | `frm.refresh(docname)` |
| Bulk field updates | `frm.refresh_fields()` |

### Event Execution Order

When form loads:
```
1. before_load
2. onload (first time only)
3. refresh_header()
4. form-refresh (global event)
5. refresh_fields()
6. refresh (custom event)
7. onload_post_render (first time only)
8. render_complete
```

### Performance Tips

| Tip | Impact |
|-----|--------|
| Use `refresh_field()` instead of `refresh_fields()` | 10x faster |
| Avoid refreshing in loops | 100x faster |
| Use debouncing for rapid updates | Prevents lag |
| Check if value changed before refreshing | Avoids unnecessary work |
| Use `depends_on` instead of manual show/hide | Automatic, no code needed |
| Batch updates and refresh once | Fewer DOM operations |

### Debugging Commands

```javascript
// Check field status
frm.fields_dict["fieldname"].get_status(true); // true = explain

// Check if field is hidden
frm.fields_dict["fieldname"].df.hidden;

// Check field value
frm.doc.fieldname;

// Check if document is in locals
frappe.get_doc(frm.doctype, frm.docname);

// Check if document is saved
frm.doc.__islocal; // true = new/unsaved

// Check if document is stale
frm.doc.__last_sync_on;
new Date() - frm.doc.__last_sync_on; // milliseconds since last sync

// Force refresh (for debugging only)
frm.refresh_fields();

// Check refresh threshold
frm.refresh_if_stale_for; // seconds (default: 120)
```

---

## Summary

### Key Takeaways

1. **`frm.refresh()`** - Main refresh method, switches documents, triggers events
2. **`frm.reload_doc()`** - Fetches fresh data from server (only method with server call)
3. **`frm.refresh_field()`** - Fastest, refreshes single field (most commonly used)
4. **`frm.refresh_fields()`** - Refreshes all fields (use for bulk changes)
5. **Auto-refresh** - Frappe automatically refreshes stale forms after 120 seconds
6. **`set_value()` auto-refreshes** - No need to manually refresh after `set_value()`
7. **`set_df_property()` auto-refreshes** - No need to manually refresh after property changes
8. **Use `depends_on`** - Better than manual show/hide logic
9. **Avoid loops** - Never refresh inside loops, refresh once after loop
10. **Debounce rapid updates** - Use `frappe.utils.debounce()` for frequent refreshes

### Decision Tree

```
Need to update UI?
├─ Server-side changes?
│  └─ YES → Use frm.reload_doc()
│
├─ Single field changed?
│  └─ YES → Use frm.refresh_field("fieldname")
│
├─ Multiple fields changed?
│  └─ YES → Use frm.refresh_fields()
│
├─ Switching documents?
│  └─ YES → Use frm.refresh(docname)
│
└─ Just set a value?
   └─ Use frm.set_value() (auto-refreshes)
```

### Most Common Mistakes

1. ❌ Calling `frm.refresh()` manually (use specific methods instead)
2. ❌ Refreshing after `set_value()` (it auto-refreshes)
3. ❌ Using `reload_doc()` for local changes (wasteful server call)
4. ❌ Refreshing in loops (causes performance issues)
5. ❌ Creating infinite refresh loops (check if value changed first)
6. ❌ Using `refresh_fields()` when `refresh_field()` is enough (slower)
7. ❌ Not handling `reload_doc()` Promise (code runs before reload completes)

---

## Source Code References

All information in this guide is verified from Frappe source code:

- **Form class:** `frappe/frappe/public/js/frappe/form/form.js`
- **Layout class:** `frappe/frappe/public/js/frappe/form/layout.js`
- **Field control:** `frappe/frappe/public/js/frappe/form/controls/base_control.js`
- **Model methods:** `frappe/frappe/public/js/frappe/model/model.js`
- **Script helpers:** `frappe/frappe/public/js/frappe/form/script_helpers.js`
- **Grid class:** `frappe/frappe/public/js/frappe/form/grid.js`

---

## Conclusion

Understanding refresh operations is crucial for building responsive and efficient Frappe applications. By using the right refresh method for each scenario, you can:

- **Improve performance** - Avoid unnecessary refreshes and server calls
- **Prevent bugs** - Avoid infinite loops and stale data
- **Write cleaner code** - Use built-in auto-refresh features
- **Better user experience** - Fast, responsive forms

Remember:
- **Most of the time**, you'll use `frm.refresh_field("fieldname")`
- **For server changes**, use `frm.reload_doc()`
- **Let Frappe auto-refresh** when possible (via `set_value`, `set_df_property`, `depends_on`)
- **Avoid manual `frm.refresh()`** - it's called automatically by Frappe