# Quick Entry Custom Filters in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Quick Entry](#understanding-quick-entry)
3. [The Problem](#the-problem)
4. [The Solution](#the-solution)
5. [Architecture Overview](#architecture-overview)
6. [Step-by-Step Implementation](#step-by-step-implementation)
7. [Code Explanation](#code-explanation)
8. [Usage Examples](#usage-examples)
9. [Advanced Features](#advanced-features)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)
13. [Summary](#summary)

---

## Introduction

This guide explains how to add **custom filters and dynamic queries** to Quick Entry forms in Frappe, solving the limitation that Quick Entry doesn't support custom scripts.

**What you'll build:**
- A global system to add `get_query` filters to Quick Entry link fields
- Dynamic filters that react to other field changes
- Cascading dropdowns in Quick Entry forms
- A reusable pattern for all DocTypes

**Result:**
- Link fields in Quick Entry have proper filters
- Fields update dynamically based on other field values
- Better UX with filtered, relevant options
- No need to open full form for simple creates

---

## Understanding Quick Entry

### What is Quick Entry?

**Quick Entry** is a Frappe feature that allows users to quickly create documents with only mandatory fields, without opening the full form.

**Source:** `frappe/frappe/public/js/frappe/form/quick_entry.js` (lines 1-20)

```javascript
frappe.provide("frappe.ui.form");

frappe.ui.form.make_quick_entry = (doctype, after_insert, init_callback, doc, force) => {
    var trimmed_doctype = doctype.replace(/ /g, "");
    var controller_name = "QuickEntryForm";

    if (frappe.ui.form[trimmed_doctype + "QuickEntryForm"]) {
        controller_name = trimmed_doctype + "QuickEntryForm";
    }

    frappe.quick_entry = new frappe.ui.form[controller_name](
        doctype,
        after_insert,
        init_callback,
        doc,
        force
    );
    return frappe.quick_entry.setup();
};
```

### How Quick Entry Works

**Source:** `frappe/frappe/public/js/frappe/form/quick_entry.js` (lines 22-100)

```javascript
frappe.ui.form.QuickEntryForm = class QuickEntryForm {
    constructor(doctype, after_insert, init_callback, doc, force) {
        this.doctype = doctype;
        this.after_insert = after_insert;
        this.init_callback = init_callback;
        this.doc = doc;
        this.force = force;
    }

    setup() {
        return new Promise((resolve) => {
            frappe.model.with_doctype(this.doctype, () => {
                this.set_meta_and_mandatory_fields();
                this.init_post_render_triggers();
                if (this.is_quick_entry()) {
                    this.render_dialog();
                    resolve(this);
                } else {
                    // Open full form
                    this.open_form();
                }
            });
        });
    }

    set_meta_and_mandatory_fields() {
        this.meta = frappe.get_meta(this.doctype);
        let fields = this.meta.fields;

        // Get mandatory fields (excluding virtual fields)
        this.mandatory = fields.filter((df) => {
            return (
                (df.reqd || df.allow_in_quick_entry) &&
                !df.read_only &&
                !df.is_virtual &&
                df.fieldtype !== "Tab Break"
            );
        });
    }

    render_dialog() {
        this.dialog = new frappe.ui.Dialog({
            title: this.get_title(),
            fields: this.get_fields(),
            doc: this.doc,
            primary_action_label: __("Save"),
            primary_action: () => {
                // ... save logic
            },
        });

        this.dialog.show();
        // ... more setup
    }
};
```

### Key Characteristics

**What Quick Entry includes:**
- ✅ Mandatory fields (`reqd: 1`)
- ✅ Fields with `allow_in_quick_entry: 1`
- ✅ Basic field validation
- ✅ Primary action (Save button)

**What Quick Entry does NOT include:**
- ❌ Custom scripts from DocType
- ❌ Form scripts (`.js` files)
- ❌ `get_query` filters defined in scripts
- ❌ Custom field behaviors
- ❌ Dynamic field updates
- ❌ Fetch from logic

### When Quick Entry is Used

**Source:** `frappe/frappe/public/js/frappe/form/quick_entry.js` (lines 102-115)

```javascript
is_quick_entry() {
    if (this.force) {
        return true;
    }

    if (this.meta.quick_entry != 1) {
        return false;
    }

    this.validate_for_prompt_autoname();

    if (this.has_child_table() || !this.mandatory.length) {
        return false;
    }

    return true;
}
```

**Quick Entry is shown when:**
1. DocType has `quick_entry: 1` enabled
2. No child tables in mandatory fields
3. Has at least one mandatory field
4. Autoname is not "Prompt"

**Common triggers:**
- Clicking "+" next to Link field
- Creating new document from List View (if enabled)
- `frappe.new_doc()` with quick entry enabled

---

## The Problem

### Limitation: No Custom Scripts

Quick Entry forms **do not execute**:
- DocType custom scripts
- Form `.js` files
- `get_query` filters
- `onchange` handlers
- Fetch from logic

**Example scenario:**

```javascript
// File: sales_order.js (DOES NOT RUN in Quick Entry!)

frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        // This won't run in Quick Entry
        frm.set_query("contact", function() {
            return {
                filters: {
                    customer: frm.doc.customer
                }
            };
        });
    }
});
```

### Real-World Problem

**Scenario:** Creating a Sales Order via Quick Entry

**Without filters:**
1. User selects Customer: "ABC Corp"
2. User clicks on Contact field
3. Sees **ALL contacts** in the system (thousands!)
4. Has to manually search for contacts belonging to "ABC Corp"
5. Poor UX, slow, error-prone

**With filters (desired):**
1. User selects Customer: "ABC Corp"
2. User clicks on Contact field
3. Sees **only contacts for "ABC Corp"** (5-10 contacts)
4. Quick selection, better UX

**The challenge:** How to add these filters when custom scripts don't run?

---

## The Solution

### Overview

The solution **monkey-patches** `frappe.ui.form.make_quick_entry` to:
1. Intercept Quick Entry creation
2. Add custom `get_query` filters to link fields
3. Make filters reactive to other field changes
4. Apply rules defined in a global configuration object

### Solution Architecture

```
window.quick_entry_query_rules (Configuration)
    ↓
Monkey-patch frappe.ui.form.make_quick_entry
    ↓
Original Quick Entry created
    ↓
Apply custom get_query filters
    ↓
Wrap onchange handlers for reactivity
    ↓
Return enhanced Quick Entry
```

### Key Innovation

**Reactive Values System:**
- Stores field values in `qe.values` object
- Wraps `onchange` handlers to update values
- Filters can access current values via `dialog.get_value()`
- Creates cascading dropdown effect

---

## Architecture Overview

### File Structure

```
my_app/
├── public/
│   └── js/
│       └── my_app.bundle.js         # Quick Entry enhancement
└── my_app/
    └── hooks.py                      # Register bundle
```

### Data Flow

```
1. User clicks "+" on Link field
    ↓
2. frappe.ui.form.make_quick_entry() called
    ↓
3. Our monkey-patch intercepts
    ↓
4. Original Quick Entry created
    ↓
5. Check if rules exist for this DocType
    ↓
6. Apply get_query filters to specified fields
    ↓
7. Wrap onchange handlers for reactivity
    ↓
8. Return enhanced Quick Entry
    ↓
9. User sees filtered options in link fields
```

---

## Step-by-Step Implementation

### Step 1: Create the Bundle File

Create the file: `my_app/public/js/my_app.bundle.js`

**Purpose:** Contains the Quick Entry enhancement and configuration.

```javascript
// File: my_app/public/js/my_app.bundle.js

/**
 * Quick Entry Query Rules Configuration
 *
 * Define get_query filters for Quick Entry forms
 *
 * Structure:
 * {
 *   "DocType Name": {
 *     "field_name": (dialog) => ({ filters: {...} }),
 *     "another_field": (dialog) => ({ filters: {...} })
 *   }
 * }
 */
window.quick_entry_query_rules = {
	// Example: Sales Order Quick Entry
	"Sales Order": {
		// Filter contacts by selected customer
		contact: (dialog) => ({
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),

		// Filter addresses by selected customer
		customer_address: (dialog) => ({
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),
	},

	// Example: Purchase Order Quick Entry
	"Purchase Order": {
		// Filter contacts by selected supplier
		contact: (dialog) => ({
			filters: {
				supplier: dialog.get_value("supplier"),
			},
		}),
	},

	// Add more DocTypes as needed...
};

/**
 * Quick Entry Enhancement
 *
 * Monkey-patches frappe.ui.form.make_quick_entry to add:
 * 1. Custom get_query filters
 * 2. Reactive field values
 * 3. Dynamic filter updates
 */
(function () {
	// Store reference to original function
	const original = frappe.ui.form.make_quick_entry;

	// Override with enhanced version
	frappe.ui.form.make_quick_entry = function (...args) {
		// Call original function
		return original.apply(this, args).then((qe) => {
			// Get rules for this DocType
			const rules = window.quick_entry_query_rules?.[qe.doctype];

			// If no rules or no dialog, return unchanged
			if (!rules || !qe.dialog?.fields_dict) return qe;

			const dialog = qe.dialog;

			// Create reactive values storage
			qe.values = {};

			// Initialize values and wrap onchange handlers
			Object.keys(dialog.fields_dict).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				// Initialize value
				qe.values[fname] = dialog.get_value(fname);

				// Wrap onchange to update values
				const orig = f.df.onchange;
				f.df.onchange = () => {
					// Call original onchange if exists
					orig && orig();

					// Update reactive value
					qe.values[fname] = dialog.get_value(fname);
				};
			});

			// Attach get_query rules dynamically
			Object.keys(rules).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				const rule = rules[fname];

				// If rule is a function, call it with dialog
				if (typeof rule === "function") {
					f.get_query = () => rule(dialog);
				} else {
					// If rule is an object, use it directly
					f.get_query = rule;
				}
			});

			return qe;
		});
	};
})();
```

### Step 2: Register the Bundle

Edit the file: `my_app/my_app/hooks.py`

**Purpose:** Tell Frappe to load your bundle on every page.

```python
# File: my_app/my_app/hooks.py

# ... existing code ...

# ------------------
# JavaScript Bundles
# ------------------

app_include_js = [
    "/assets/my_app/js/my_app.bundle.js"
]

# ... rest of hooks.py ...
```

### Step 3: Build the Bundle

Run the build command:

```bash
# From bench directory
cd ~/frappe-bench

# Build assets
bench build --app my_app

# Or build all
bench build
```

### Step 4: Clear Cache and Test

```bash
# Clear cache
bench clear-cache

# Restart bench (if needed)
bench restart
```

**Then test in browser:**
1. Hard reload (Ctrl+Shift+R)
2. Open a DocType with Quick Entry enabled
3. Click "+" on a link field
4. Verify filters are applied

---

## Code Explanation

### Part 1: Configuration Object

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => ({
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),
	},
};
```

**Breakdown:**

| Element | Explanation |
|---------|-------------|
| `window.quick_entry_query_rules` | Global object storing all rules |
| `"Sales Order"` | DocType name (key) |
| `contact` | Field name to apply filter to |
| `(dialog) => (...)` | Function receiving dialog instance |
| `dialog.get_value("customer")` | Get current value of customer field |
| `{ filters: {...} }` | Return object with filters |

**Why a function?**
- Allows **dynamic** filters based on current field values
- Receives `dialog` instance to access other fields
- Evaluated **every time** the link field is clicked

### Part 2: Monkey Patch

```javascript
(function () {
	const original = frappe.ui.form.make_quick_entry;

	frappe.ui.form.make_quick_entry = function (...args) {
		return original.apply(this, args).then((qe) => {
			// Enhancement logic here
			return qe;
		});
	};
})();
```

**Breakdown:**

| Line | Explanation |
|------|-------------|
| `(function () { ... })()` | IIFE (Immediately Invoked Function Expression) |
| `const original = ...` | Store reference to original function |
| `frappe.ui.form.make_quick_entry = ...` | Override the function |
| `original.apply(this, args)` | Call original with same arguments |
| `.then((qe) => ...)` | Wait for Quick Entry to be created |
| `return qe` | Return enhanced Quick Entry |

**Why monkey-patch?**
- Frappe doesn't provide hooks for Quick Entry
- Need to intercept creation process
- Non-invasive (doesn't modify Frappe core)
- Can be disabled by removing bundle

### Part 3: Reactive Values System

```javascript
// Create reactive values storage
qe.values = {};

// Initialize values and wrap onchange handlers
Object.keys(dialog.fields_dict).forEach((fname) => {
	const f = dialog.fields_dict[fname];
	if (!f) return;

	// Initialize value
	qe.values[fname] = dialog.get_value(fname);

	// Wrap onchange to update values
	const orig = f.df.onchange;
	f.df.onchange = () => {
		orig && orig();
		qe.values[fname] = dialog.get_value(fname);
	};
});
```

**Breakdown:**

1. **Create storage**: `qe.values = {}`
   - Object to store current field values
   - Accessible from anywhere in Quick Entry

2. **Loop through fields**: `Object.keys(dialog.fields_dict).forEach(...)`
   - Iterate over all fields in dialog
   - Get field instance

3. **Initialize value**: `qe.values[fname] = dialog.get_value(fname)`
   - Store initial value
   - Syncs with dialog state

4. **Wrap onchange**: `const orig = f.df.onchange`
   - Store original onchange handler
   - Preserve existing behavior

5. **New onchange**: `f.df.onchange = () => { ... }`
   - Call original handler first
   - Update reactive value
   - Triggers filter re-evaluation

**Why reactive values?**
- Filters need current field values
- `dialog.get_value()` is called when link field opens
- Ensures filters always use latest values
- Creates cascading dropdown effect

### Part 4: Apply get_query Rules

```javascript
// Attach get_query rules dynamically
Object.keys(rules).forEach((fname) => {
	const f = dialog.fields_dict[fname];
	if (!f) return;

	const rule = rules[fname];

	if (typeof rule === "function") {
		f.get_query = () => rule(dialog);
	} else {
		f.get_query = rule;
	}
});
```

**Breakdown:**

1. **Loop through rules**: `Object.keys(rules).forEach(...)`
   - Get all field names with rules
   - For this DocType only

2. **Get field instance**: `const f = dialog.fields_dict[fname]`
   - Access the actual field object
   - Skip if field doesn't exist

3. **Check rule type**: `typeof rule === "function"`
   - Rules can be functions or objects
   - Functions are more flexible

4. **Apply function rule**: `f.get_query = () => rule(dialog)`
   - Wrap in arrow function
   - Pass dialog instance
   - Called when link field opens

5. **Apply object rule**: `f.get_query = rule`
   - Use static object directly
   - For non-dynamic filters

**Why check field existence?**
- Rules might reference fields not in Quick Entry
- Fields might be hidden or removed
- Prevents errors

---

## Usage Examples

### Example 1: Simple Filter (Customer → Contact)

**Scenario:** Filter contacts by selected customer in Sales Order Quick Entry.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => ({
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),
	},
};
```

**How it works:**
1. User selects Customer: "ABC Corp"
2. User clicks on Contact field
3. `get_query` is called
4. `dialog.get_value("customer")` returns "ABC Corp"
5. Filter applied: `{ customer: "ABC Corp" }`
6. Only contacts for ABC Corp are shown

### Example 2: Cascading Filters (Customer → Address → City)

**Scenario:** Three-level cascading dropdowns.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		// Level 1: Filter addresses by customer
		customer_address: (dialog) => ({
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),

		// Level 2: Filter cities by selected address
		city: (dialog) => {
			const address = dialog.get_value("customer_address");
			if (!address) {
				return { filters: {} };
			}

			// Get city from selected address
			const city = frappe.db.get_value("Address", address, "city");

			return {
				filters: {
					name: city,
				},
			};
		},
	},
};
```

### Example 3: Multiple Conditions

**Scenario:** Filter items by customer group and item group.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		item_code: (dialog) => {
			const customer = dialog.get_value("customer");
			const item_group = dialog.get_value("item_group");

			let filters = {};

			// Add customer-specific filter
			if (customer) {
				const customer_group = frappe.db.get_value("Customer", customer, "customer_group");
				filters.customer_group = customer_group;
			}

			// Add item group filter
			if (item_group) {
				filters.item_group = item_group;
			}

			return { filters };
		},
	},
};
```

### Example 4: Static Filter (No Dynamic Values)

**Scenario:** Always filter to show only active items.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		item_code: {
			filters: {
				disabled: 0,
				is_stock_item: 1,
			},
		},
	},
};
```

**Note:** Static filters can be objects instead of functions.

### Example 5: Query with Custom Method

**Scenario:** Use custom server-side method for complex filtering.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		item_code: (dialog) => ({
			query: "my_app.api.get_customer_items",
			filters: {
				customer: dialog.get_value("customer"),
			},
		}),
	},
};
```

**Server-side method:**

```python
# File: my_app/my_app/api.py

import frappe

@frappe.whitelist()
def get_customer_items(doctype, txt, searchfield, start, page_len, filters):
    """
    Custom query to get items for a specific customer

    Args:
        doctype: "Item"
        txt: Search text
        searchfield: "name" or "item_name"
        start: Pagination start
        page_len: Page length
        filters: {"customer": "CUST-001"}

    Returns:
        List of tuples: [(item_code, item_name), ...]
    """
    customer = filters.get("customer")

    if not customer:
        return []

    # Get customer group
    customer_group = frappe.db.get_value("Customer", customer, "customer_group")

    # Query items
    return frappe.db.sql("""
        SELECT item_code, item_name
        FROM `tabItem`
        WHERE disabled = 0
            AND customer_group = %(customer_group)s
            AND (item_code LIKE %(txt)s OR item_name LIKE %(txt)s)
        ORDER BY item_name
        LIMIT %(start)s, %(page_len)s
    """, {
        "customer_group": customer_group,
        "txt": f"%{txt}%",
        "start": start,
        "page_len": page_len,
    })
```

### Example 6: Conditional Rules

**Scenario:** Apply different filters based on field values.

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		warehouse: (dialog) => {
			const order_type = dialog.get_value("order_type");

			// Different filters for different order types
			if (order_type === "Sales") {
				return {
					filters: {
						warehouse_type: "Sales",
						is_group: 0,
					},
				};
			} else if (order_type === "Maintenance") {
				return {
					filters: {
						warehouse_type: "Maintenance",
						is_group: 0,
					},
				};
			}

			// Default: all warehouses
			return {
				filters: {
					is_group: 0,
				},
			};
		},
	},
};
```

### Example 7: Multiple DocTypes

**Scenario:** Configure rules for multiple DocTypes.

```javascript
window.quick_entry_query_rules = {
	// Sales Order
	"Sales Order": {
		contact: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
		customer_address: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
	},

	// Purchase Order
	"Purchase Order": {
		contact: (dialog) => ({
			filters: { supplier: dialog.get_value("supplier") },
		}),
		supplier_address: (dialog) => ({
			filters: { supplier: dialog.get_value("supplier") },
		}),
	},

	// Delivery Note
	"Delivery Note": {
		contact: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
		shipping_address: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
	},

	// Task
	"Task": {
		project: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
	},
};
```

---

## Advanced Features

### Feature 1: Debugging Helper

Add logging to see what's happening:

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Debug logging
			console.log("Quick Entry - contact filter:", {
				customer: customer,
				dialog: dialog,
				all_values: dialog.get_values(),
			});

			return {
				filters: { customer: customer },
			};
		},
	},
};
```

### Feature 2: Validation Before Filter

Validate field values before applying filters:

```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Validate customer is selected
			if (!customer) {
				frappe.msgprint(__("Please select a customer first"));
				return { filters: {} };
			}

			// Validate customer exists
			frappe.db.get_value("Customer", customer, "name").then((r) => {
				if (!r.message) {
					frappe.msgprint(__("Invalid customer"));
				}
			});

			return {
				filters: { customer: customer },
			};
		},
	},
};
```

### Feature 3: Caching for Performance

Cache expensive lookups:

```javascript
// Cache storage
window._quick_entry_cache = {};

window.quick_entry_query_rules = {
	"Sales Order": {
		item_code: (dialog) => {
			const customer = dialog.get_value("customer");

			if (!customer) {
				return { filters: {} };
			}

			// Check cache
			const cache_key = `customer_group_${customer}`;
			if (window._quick_entry_cache[cache_key]) {
				return {
					filters: {
						customer_group: window._quick_entry_cache[cache_key],
					},
				};
			}

			// Fetch and cache
			frappe.db.get_value("Customer", customer, "customer_group").then((r) => {
				if (r.message) {
					window._quick_entry_cache[cache_key] = r.message.customer_group;
				}
			});

			return { filters: {} };
		},
	},
};
```

### Feature 4: Field Dependencies

Make fields dependent on others:

```javascript
(function () {
	const original = frappe.ui.form.make_quick_entry;

	frappe.ui.form.make_quick_entry = function (...args) {
		return original.apply(this, args).then((qe) => {
			const rules = window.quick_entry_query_rules?.[qe.doctype];
			if (!rules || !qe.dialog?.fields_dict) return qe;

			const dialog = qe.dialog;

			// Create reactive values storage
			qe.values = {};

			Object.keys(dialog.fields_dict).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				qe.values[fname] = dialog.get_value(fname);

				const orig = f.df.onchange;
				f.df.onchange = () => {
					orig && orig();
					qe.values[fname] = dialog.get_value(fname);

					// Clear dependent fields
					if (fname === "customer") {
						dialog.set_value("contact", "");
						dialog.set_value("customer_address", "");
					}
				};
			});

			// Attach get_query rules
			Object.keys(rules).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				const rule = rules[fname];
				if (typeof rule === "function") {
					f.get_query = () => rule(dialog);
				} else {
					f.get_query = rule;
				}
			});

			return qe;
		});
	};
})();
```

### Feature 5: Custom Field Behavior

Add custom behaviors to specific fields:

```javascript
window.quick_entry_field_behaviors = {
	"Sales Order": {
		customer: {
			onchange: (dialog) => {
				const customer = dialog.get_value("customer");

				// Auto-fill customer details
				if (customer) {
					frappe.db.get_value("Customer", customer, [
						"customer_name",
						"customer_group",
						"territory",
					]).then((r) => {
						if (r.message) {
							// Set values if fields exist
							dialog.set_value("customer_name", r.message.customer_name);
							dialog.set_value("territory", r.message.territory);
						}
					});
				}
			},
		},
	},
};

// Enhanced monkey-patch
(function () {
	const original = frappe.ui.form.make_quick_entry;

	frappe.ui.form.make_quick_entry = function (...args) {
		return original.apply(this, args).then((qe) => {
			const rules = window.quick_entry_query_rules?.[qe.doctype];
			const behaviors = window.quick_entry_field_behaviors?.[qe.doctype];

			if (!qe.dialog?.fields_dict) return qe;

			const dialog = qe.dialog;

			// Apply query rules
			if (rules) {
				Object.keys(rules).forEach((fname) => {
					const f = dialog.fields_dict[fname];
					if (!f) return;

					const rule = rules[fname];
					if (typeof rule === "function") {
						f.get_query = () => rule(dialog);
					} else {
						f.get_query = rule;
					}
				});
			}

			// Apply custom behaviors
			if (behaviors) {
				Object.keys(behaviors).forEach((fname) => {
					const f = dialog.fields_dict[fname];
					if (!f) return;

					const behavior = behaviors[fname];

					if (behavior.onchange) {
						const orig = f.df.onchange;
						f.df.onchange = () => {
							orig && orig();
							behavior.onchange(dialog);
						};
					}
				});
			}

			return qe;
		});
	};
})();
```

### Feature 6: Global Configuration File

Organize rules in a separate file:

```javascript
// File: my_app/public/js/quick_entry_rules.js

frappe.provide("my_app.quick_entry");

my_app.quick_entry.rules = {
	"Sales Order": {
		contact: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
		customer_address: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
	},

	"Purchase Order": {
		contact: (dialog) => ({
			filters: { supplier: dialog.get_value("supplier") },
		}),
	},
};

// Use in bundle
window.quick_entry_query_rules = my_app.quick_entry.rules;
```

Then include in `hooks.py`:

```python
app_include_js = [
    "/assets/my_app/js/quick_entry_rules.js",
    "/assets/my_app/js/my_app.bundle.js",
]
```

---

## Testing

### Test 1: Verify Bundle is Loaded

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `window.quick_entry_query_rules`
4. Press Enter

**Expected result:**
```javascript
{
  "Sales Order": {
    contact: ƒ (dialog),
    customer_address: ƒ (dialog)
  },
  // ... more DocTypes
}
```

**If undefined:**
- Bundle not loaded
- Check `hooks.py`
- Run `bench build --app my_app`
- Clear cache

### Test 2: Test Quick Entry Creation

**Steps:**
1. Go to Sales Order List
2. Click "+ New"
3. Quick Entry dialog should open

**Expected result:**
- Dialog opens with mandatory fields
- No errors in console

**If errors:**
- Check console for JavaScript errors
- Verify monkey-patch syntax
- Check if original function exists

### Test 3: Test Filter Application

**Steps:**
1. Open Sales Order Quick Entry
2. Select a Customer
3. Click on Contact field

**Expected result:**
- Only contacts for selected customer appear
- No "All" contacts shown

**Debug:**
```javascript
// In console while Quick Entry is open
frappe.quick_entry.dialog.fields_dict.contact.get_query()
// Should return: { filters: { customer: "CUST-001" } }
```

### Test 4: Test Cascading Filters

**Steps:**
1. Open Quick Entry
2. Select Customer
3. Select Contact (should be filtered)
4. Change Customer
5. Contact should clear or update

**Expected result:**
- Contact field updates when Customer changes
- Filters are re-applied

### Test 5: Test Multiple DocTypes

**Steps:**
1. Test Sales Order Quick Entry
2. Test Purchase Order Quick Entry
3. Test other configured DocTypes

**Expected result:**
- Each DocType has its own rules
- No cross-contamination
- Rules apply correctly

---

## Troubleshooting

### Issue 1: Filters Not Applied

**Symptoms:**
- Link field shows all records
- No filtering happening

**Solutions:**

```javascript
// 1. Check if rules exist
console.log(window.quick_entry_query_rules);

// 2. Check if field name is correct
console.log(frappe.quick_entry.dialog.fields_dict);

// 3. Check if get_query is set
console.log(frappe.quick_entry.dialog.fields_dict.contact.get_query);

// 4. Test get_query manually
console.log(frappe.quick_entry.dialog.fields_dict.contact.get_query());
```

### Issue 2: Monkey-Patch Not Working

**Symptoms:**
- Original Quick Entry behavior
- No enhancement applied

**Solutions:**

```bash
# 1. Verify bundle is loaded
bench build --app my_app
bench clear-cache

# 2. Check hooks.py
cat apps/my_app/my_app/hooks.py | grep app_include_js

# 3. Check build output
ls -la sites/assets/my_app/js/my_app.bundle.js

# 4. Hard reload browser
# Ctrl+Shift+R
```

### Issue 3: Dialog.get_value() Returns Undefined

**Symptoms:**
- Filters don't work
- Console shows undefined values

**Solutions:**

```javascript
// Check field exists in Quick Entry
console.log(frappe.quick_entry.dialog.fields_dict);

// Check if field is in mandatory list
console.log(frappe.quick_entry.mandatory);

// Use safe access
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Safe check
			if (!customer) {
				console.warn("Customer not selected");
				return { filters: {} };
			}

			return {
				filters: { customer: customer },
			};
		},
	},
};
```

### Issue 4: Cascading Not Working

**Symptoms:**
- First field filters correctly
- Dependent fields don't update

**Solutions:**

```javascript
// Ensure onchange wrapper is working
Object.keys(dialog.fields_dict).forEach((fname) => {
	const f = dialog.fields_dict[fname];
	if (!f) return;

	const orig = f.df.onchange;
	f.df.onchange = () => {
		// Call original
		orig && orig();

		// Log for debugging
		console.log(`Field ${fname} changed to:`, dialog.get_value(fname));

		// Update reactive value
		qe.values[fname] = dialog.get_value(fname);

		// Refresh dependent fields
		dialog.refresh();
	};
});
```

### Issue 5: Performance Issues

**Symptoms:**
- Slow Quick Entry opening
- Lag when changing fields

**Solutions:**

```javascript
// 1. Use caching
window._qe_cache = {};

window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Return cached result if available
			const cache_key = `contact_${customer}`;
			if (window._qe_cache[cache_key]) {
				return window._qe_cache[cache_key];
			}

			const result = {
				filters: { customer: customer },
			};

			// Cache result
			window._qe_cache[cache_key] = result;

			return result;
		},
	},
};

// 2. Debounce expensive operations
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

// 3. Avoid unnecessary database calls
// Use frappe.boot data when possible
```

### Issue 6: Rules Not Applied to Specific Field

**Symptoms:**
- Some fields work, others don't
- Specific field always shows all records

**Solutions:**

```javascript
// 1. Check if field is in Quick Entry
frappe.model.with_doctype("Sales Order", () => {
	const meta = frappe.get_meta("Sales Order");
	const fields = meta.fields;

	const mandatory = fields.filter((df) => {
		return (
			(df.reqd || df.allow_in_quick_entry) &&
			!df.read_only &&
			!df.is_virtual &&
			df.fieldtype !== "Tab Break"
		);
	});

	console.log("Quick Entry fields:", mandatory.map(f => f.fieldname));
});

// 2. Enable field in Quick Entry
// Go to: Customize Form > Sales Order
// Find the field
// Check "Allow in Quick Entry"
// Save

// 3. Verify field type is Link
// Only Link fields support get_query
```

---

## Best Practices

### 1. Always Check Field Values

✅ **Do:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Always validate
			if (!customer) {
				return { filters: {} };
			}

			return {
				filters: { customer: customer },
			};
		},
	},
};
```

❌ **Don't:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => ({
			// No validation - will fail if customer is empty!
			filters: { customer: dialog.get_value("customer") },
		}),
	},
};
```

### 2. Use Descriptive Rule Names

✅ **Do:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		// Clear what this filters
		contact: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),

		// Clear relationship
		customer_address: (dialog) => ({
			filters: { customer: dialog.get_value("customer") },
		}),
	},
};
```

❌ **Don't:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		// Unclear what f1, f2 mean
		f1: (d) => ({ filters: { c: d.get_value("f2") } }),
	},
};
```

### 3. Handle Edge Cases

✅ **Do:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			// Handle empty value
			if (!customer) {
				return { filters: {} };
			}

			// Handle special cases
			if (customer === "Guest") {
				return {
					filters: {
						is_guest: 1,
					},
				};
			}

			// Normal case
			return {
				filters: { customer: customer },
			};
		},
	},
};
```

### 4. Organize Rules by Module

✅ **Do:**
```javascript
// File: my_app/public/js/quick_entry/sales_rules.js
frappe.provide("my_app.quick_entry.sales");

my_app.quick_entry.sales = {
	"Sales Order": { /* rules */ },
	"Sales Invoice": { /* rules */ },
	"Delivery Note": { /* rules */ },
};

// File: my_app/public/js/quick_entry/purchase_rules.js
frappe.provide("my_app.quick_entry.purchase");

my_app.quick_entry.purchase = {
	"Purchase Order": { /* rules */ },
	"Purchase Invoice": { /* rules */ },
};

// File: my_app/public/js/my_app.bundle.js
window.quick_entry_query_rules = {
	...my_app.quick_entry.sales,
	...my_app.quick_entry.purchase,
};
```

### 5. Document Your Rules

✅ **Do:**
```javascript
window.quick_entry_query_rules = {
	"Sales Order": {
		/**
		 * Filter contacts by selected customer
		 *
		 * Dependency: customer field must be filled first
		 * Behavior: Shows only contacts linked to selected customer
		 * Fallback: Shows no contacts if customer is empty
		 */
		contact: (dialog) => {
			const customer = dialog.get_value("customer");

			if (!customer) {
				return { filters: {} };
			}

			return {
				filters: { customer: customer },
			};
		},
	},
};
```

### 6. Use Constants for Field Names

✅ **Do:**
```javascript
// Define constants
const FIELDS = {
	SALES_ORDER: {
		CUSTOMER: "customer",
		CONTACT: "contact",
		ADDRESS: "customer_address",
	},
};

window.quick_entry_query_rules = {
	"Sales Order": {
		[FIELDS.SALES_ORDER.CONTACT]: (dialog) => ({
			filters: {
				[FIELDS.SALES_ORDER.CUSTOMER]: dialog.get_value(FIELDS.SALES_ORDER.CUSTOMER),
			},
		}),
	},
};
```

### 7. Test Thoroughly

✅ **Do:**
```javascript
// Add test helper
window.test_quick_entry_rules = function(doctype, field, test_values) {
	console.log(`Testing ${doctype}.${field}`);

	const rules = window.quick_entry_query_rules[doctype];
	if (!rules || !rules[field]) {
		console.error("No rules found");
		return;
	}

	// Mock dialog
	const mock_dialog = {
		get_value: (fname) => test_values[fname],
	};

	const rule = rules[field];
	const result = typeof rule === "function" ? rule(mock_dialog) : rule;

	console.log("Result:", result);
	return result;
};

// Test
test_quick_entry_rules("Sales Order", "contact", {
	customer: "CUST-001",
});
```

### 8. Performance Optimization

✅ **Do:**
```javascript
// Cache expensive lookups
const cache = new Map();

window.quick_entry_query_rules = {
	"Sales Order": {
		item_code: (dialog) => {
			const customer = dialog.get_value("customer");

			if (!customer) {
				return { filters: {} };
			}

			// Check cache
			if (cache.has(customer)) {
				return cache.get(customer);
			}

			// Compute result
			const result = {
				filters: { customer_group: get_customer_group(customer) },
			};

			// Cache for 5 minutes
			cache.set(customer, result);
			setTimeout(() => cache.delete(customer), 5 * 60 * 1000);

			return result;
		},
	},
};
```

---

## Summary

### What We Built

1. **Global Configuration System** (`window.quick_entry_query_rules`)
   - Centralized rule definition
   - Per-DocType, per-field rules
   - Function-based dynamic filters

2. **Monkey-Patch Enhancement**
   - Intercepts Quick Entry creation
   - Applies custom `get_query` filters
   - Non-invasive (doesn't modify Frappe core)

3. **Reactive Values System**
   - Tracks field value changes
   - Enables cascading dropdowns
   - Automatic filter updates

### Key Concepts

| Concept | Explanation |
|---------|-------------|
| **Quick Entry** | Fast document creation with mandatory fields only |
| **Monkey-Patching** | Overriding functions to add functionality |
| **get_query** | Link field filter function |
| **Reactive Values** | Values that update automatically on change |
| **Cascading Dropdowns** | Dependent field filtering |
| **IIFE** | Immediately Invoked Function Expression |

### Architecture Summary

```
Configuration (window.quick_entry_query_rules)
    ↓
Monkey-Patch (frappe.ui.form.make_quick_entry)
    ↓
Original Quick Entry Created
    ↓
Apply get_query Filters
    ↓
Wrap onchange Handlers
    ↓
Enhanced Quick Entry Returned
```

### Quick Reference

**Define rules:**
```javascript
window.quick_entry_query_rules = {
	"DocType Name": {
		field_name: (dialog) => ({
			filters: { ... },
		}),
	},
};
```

**Access field value:**
```javascript
dialog.get_value("field_name")
```

**Static filter:**
```javascript
field_name: {
	filters: { disabled: 0 },
}
```

**Dynamic filter:**
```javascript
field_name: (dialog) => ({
	filters: {
		parent_field: dialog.get_value("parent_field"),
	},
})
```

**Custom query:**
```javascript
field_name: (dialog) => ({
	query: "my_app.api.custom_query",
	filters: { ... },
})
```

### Benefits

✅ **User Experience:**
- Faster data entry
- Fewer errors
- Relevant options only
- Cascading dropdowns

✅ **Developer Experience:**
- Centralized configuration
- Reusable pattern
- Easy to maintain
- No Frappe core modifications

✅ **Performance:**
- Reduced query results
- Faster link field loading
- Optional caching
- Efficient filtering

### Limitations

⚠️ **Known Limitations:**
1. Only works with Link fields
2. Requires field to be in Quick Entry
3. Monkey-patch may break with Frappe updates
4. No built-in validation
5. Debugging can be challenging

### Next Steps

1. **Add More Rules**: Configure all your DocTypes
2. **Custom Behaviors**: Add field-specific logic
3. **Validation**: Add field validation
4. **Caching**: Implement caching for performance
5. **Testing**: Create comprehensive tests
6. **Documentation**: Document your specific rules

---

### Source Code References
- `frappe/frappe/public/js/frappe/form/quick_entry.js` - Quick Entry implementation
- `frappe/frappe/public/js/frappe/form/controls/link.js` - Link field control
- `frappe/frappe/public/js/frappe/ui/dialog.js` - Dialog implementation

### Community Resources
- [Frappe Forum - Quick Entry](https://discuss.frappe.io/search?q=quick%20entry)


---

## Real-World Example: Complete Implementation

Here's a complete, production-ready implementation for an ERPNext-like system:

```javascript
// File: my_app/public/js/my_app.bundle.js

/**
 * Quick Entry Query Rules
 * Production-ready configuration for common DocTypes
 */
window.quick_entry_query_rules = {
	// ==================
	// Sales Module
	// ==================

	"Sales Order": {
		// Filter contacts by customer
		contact_person: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer } }
				: { filters: {} };
		},

		// Filter addresses by customer
		customer_address: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer, address_type: ["in", ["Billing", "Shipping"]] } }
				: { filters: {} };
		},

		// Filter shipping address by customer
		shipping_address_name: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer, address_type: "Shipping" } }
				: { filters: {} };
		},
	},

	"Sales Invoice": {
		contact_person: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer } }
				: { filters: {} };
		},

		customer_address: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer } }
				: { filters: {} };
		},
	},

	// ==================
	// Purchase Module
	// ==================

	"Purchase Order": {
		contact_person: (dialog) => {
			const supplier = dialog.get_value("supplier");
			return supplier
				? { filters: { supplier: supplier } }
				: { filters: {} };
		},

		supplier_address: (dialog) => {
			const supplier = dialog.get_value("supplier");
			return supplier
				? { filters: { supplier: supplier } }
				: { filters: {} };
		},
	},

	"Purchase Invoice": {
		contact_person: (dialog) => {
			const supplier = dialog.get_value("supplier");
			return supplier
				? { filters: { supplier: supplier } }
				: { filters: {} };
		},

		supplier_address: (dialog) => {
			const supplier = dialog.get_value("supplier");
			return supplier
				? { filters: { supplier: supplier } }
				: { filters: {} };
		},
	},

	// ==================
	// Stock Module
	// ==================

	"Delivery Note": {
		contact_person: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer } }
				: { filters: {} };
		},

		shipping_address_name: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer, address_type: "Shipping" } }
				: { filters: {} };
		},
	},

	// ==================
	// Projects Module
	// ==================

	"Task": {
		project: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer, status: "Open" } }
				: { filters: { status: "Open" } };
		},
	},

	"Timesheet": {
		project: (dialog) => {
			const customer = dialog.get_value("customer");
			return customer
				? { filters: { customer: customer, status: "Open" } }
				: { filters: { status: "Open" } };
		},
	},
};

/**
 * Quick Entry Enhancement
 * Applies custom filters and reactive behaviors
 */
(function () {
	// Store original function
	const original = frappe.ui.form.make_quick_entry;

	// Override with enhanced version
	frappe.ui.form.make_quick_entry = function (...args) {
		// Call original
		return original.apply(this, args).then((qe) => {
			// Get rules for this DocType
			const rules = window.quick_entry_query_rules?.[qe.doctype];

			// If no rules or no dialog, return unchanged
			if (!rules || !qe.dialog?.fields_dict) return qe;

			const dialog = qe.dialog;

			// Create reactive values storage
			qe.values = {};

			// Initialize values and wrap onchange handlers
			Object.keys(dialog.fields_dict).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				// Initialize value
				qe.values[fname] = dialog.get_value(fname);

				// Wrap onchange to update values
				const orig = f.df.onchange;
				f.df.onchange = () => {
					// Call original onchange if exists
					orig && orig();

					// Update reactive value
					qe.values[fname] = dialog.get_value(fname);
				};
			});

			// Attach get_query rules dynamically
			Object.keys(rules).forEach((fname) => {
				const f = dialog.fields_dict[fname];
				if (!f) return;

				const rule = rules[fname];

				// If rule is a function, call it with dialog
				if (typeof rule === "function") {
					f.get_query = () => rule(dialog);
				} else {
					// If rule is an object, use it directly
					f.get_query = rule;
				}
			});

			return qe;
		});
	};
})();

// Log successful loading
console.log("Quick Entry enhancements loaded");
```

---

This implementation solves the fundamental limitation that Quick Entry forms don't execute custom scripts. The monkey-patch approach is non-invasive and can be easily disabled. The reactive values system enables cascading dropdowns and dynamic filtering, significantly improving the user experience for Quick Entry forms.