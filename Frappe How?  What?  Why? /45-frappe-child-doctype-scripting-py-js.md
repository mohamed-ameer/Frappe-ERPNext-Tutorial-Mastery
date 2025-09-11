# Frappe Child DocTypes: Complete Guide

## Table of Contents
- **1. Overview**
- **2. Understanding Child DocTypes**
- **3. Python Operations**
- **4. JavaScript Operations**
- **5. JavaScript Client Scripts for Child Tables**
- **6. Real-World Examples**
- **7. Advanced Scenarios**
- **8. Best Practices**
- **9. Troubleshooting**

## Overview

Child DocTypes in Frappe are special DocTypes that represent child tables within parent documents. They are essential for creating one-to-many relationships and are widely used throughout ERPNext for items, taxes, addresses, and other repeating data.

### Key Characteristics
- **`istable = 1`**: Marks a DocType as a child table
- **Parent Fields**: Automatically includes `parent`, `parenttype`, `parentfield`, `idx`
- **No Direct Access**: Cannot be accessed independently, only through parent documents
- **Automatic Indexing**: Rows are automatically numbered with `idx` field

## Understanding Child DocTypes

### Database Structure

Child tables have these mandatory fields:
```sql
-- Standard child table fields
parent VARCHAR(140)        -- Parent document name
parenttype VARCHAR(140)    -- Parent DocType
parentfield VARCHAR(140)   -- Field name in parent
idx INT(8)                 -- Row index
name VARCHAR(140)          -- Unique identifier
```

### DocType Definition

```python
# Creating a child DocType
child_doctype = frappe.get_doc({
    "doctype": "DocType",
    "name": "Child Table Name",
    "istable": 1,  # This makes it a child table
    "module": "Custom",
    "fields": [
        {"label": "Item Code", "fieldname": "item_code", "fieldtype": "Link", "options": "Item"},
        {"label": "Quantity", "fieldname": "qty", "fieldtype": "Float"},
        {"label": "Rate", "fieldname": "rate", "fieldtype": "Currency"},
    ]
})
```

## Python Operations

### 1. Creating Child Table Rows

#### Basic Append
```python
# Get parent document
parent_doc = frappe.get_doc("Sales Order", "SO-001")

# Append a new child row
parent_doc.append("items", {
    "item_code": "ITEM-001",
    "qty": 10,
    "rate": 100.0,
    "description": "Test Item"
})

# Save the parent document
parent_doc.save()
```

#### Multiple Rows at Once
```python
# Using extend method
items_data = [
    {"item_code": "ITEM-001", "qty": 10, "rate": 100.0},
    {"item_code": "ITEM-002", "qty": 5, "rate": 200.0},
    {"item_code": "ITEM-003", "qty": 3, "rate": 150.0}
]

parent_doc.extend("items", items_data)
parent_doc.save()
```

#### Insert at Specific Position
```python
# Insert at position 2 (0-indexed)
parent_doc.append("items", {
    "item_code": "ITEM-004",
    "qty": 1,
    "rate": 50.0
}, position=1)  # This will be the second row

parent_doc.save()
```

### 2. Reading Child Table Data

#### Get All Child Rows
```python
parent_doc = frappe.get_doc("Sales Order", "SO-001")

# Get all items
items = parent_doc.get("items")
for item in items:
    print(f"Item: {item.item_code}, Qty: {item.qty}, Rate: {item.rate}")

# Alternative method
items = parent_doc.items
```

#### Filter Child Rows
```python
# Get items with quantity > 5
high_qty_items = [item for item in parent_doc.items if item.qty > 5]

# Get specific item
specific_item = next((item for item in parent_doc.items if item.item_code == "ITEM-001"), None)
```

#### Query Child Table Directly
```python
# Query child table directly (use with caution)
child_items = frappe.get_all("Sales Order Item", 
    filters={
        "parent": "SO-001",
        "parenttype": "Sales Order",
        "parentfield": "items"
    },
    fields=["item_code", "qty", "rate", "idx"],
    order_by="idx"
)
```

### 3. Updating Child Table Rows

#### Update Existing Row
```python
parent_doc = frappe.get_doc("Sales Order", "SO-001")

# Find and update specific row
for item in parent_doc.items:
    if item.item_code == "ITEM-001":
        item.qty = 15
        item.rate = 120.0
        break

parent_doc.save()
```

#### Update Multiple Rows
```python
# Update all items with specific condition
for item in parent_doc.items:
    if item.qty > 10:
        item.rate = item.rate * 1.1  # 10% increase

parent_doc.save()
```

### 4. Deleting Child Table Rows

#### Remove Specific Row
```python
parent_doc = frappe.get_doc("Sales Order", "SO-001")

# Find and remove specific row
for item in parent_doc.items:
    if item.item_code == "ITEM-001":
        parent_doc.remove(item)
        break

parent_doc.save()
```

#### Remove Multiple Rows
```python
# Remove all items with qty = 0
items_to_remove = [item for item in parent_doc.items if item.qty == 0]
for item in items_to_remove:
    parent_doc.remove(item)

parent_doc.save()
```

#### Clear All Child Rows
```python
# Clear all items
parent_doc.set("items", [])
parent_doc.save()
```

### 5. Child Table Validation

#### Custom Validation
```python
def validate(self):
    # Validate child table
    for item in self.items:
        if item.qty <= 0:
            frappe.throw(f"Quantity must be greater than 0 for item {item.item_code}")
        
        if item.rate <= 0:
            frappe.throw(f"Rate must be greater than 0 for item {item.item_code}")
        
        # Check for duplicate items
        duplicate_items = [i for i in self.items if i.item_code == item.item_code]
        if len(duplicate_items) > 1:
            frappe.throw(f"Duplicate item {item.item_code} found")
```

#### Validate on Child Table Events
```python
# In the child DocType controller
def validate(self):
    if self.parenttype == "Sales Order":
        # Custom validation for Sales Order items
        if self.qty < 0:
            frappe.throw("Quantity cannot be negative")
```

### 6. Business Logic Examples

#### Calculate Totals
```python
def calculate_totals(self):
    total_qty = 0
    total_amount = 0
    
    for item in self.items:
        total_qty += item.qty
        total_amount += item.qty * item.rate
    
    self.total_qty = total_qty
    self.grand_total = total_amount
```

#### Auto-fill Child Table
```python
def auto_fill_items(self):
    if self.customer:
        # Get standard items for this customer
        standard_items = frappe.get_all("Customer Item", 
            filters={"parent": self.customer},
            fields=["item_code", "qty", "rate"]
        )
        
        for item in standard_items:
            self.append("items", {
                "item_code": item.item_code,
                "qty": item.qty,
                "rate": item.rate
            })
```

## JavaScript Operations

### 1. Adding Child Table Rows

#### Basic Add Row
```javascript
// Add a new row to child table
frappe.model.add_child(frm.doc, "items", "items");
frm.refresh_field("items");
```

#### Add Row with Data
```javascript
// Add row with specific data
let new_item = frappe.model.add_child(frm.doc, "items", "items");
new_item.item_code = "ITEM-001";
new_item.qty = 10;
new_item.rate = 100.0;

frm.refresh_field("items");
```

#### Add Multiple Rows
```javascript
// Add multiple rows
let items_data = [
    {item_code: "ITEM-001", qty: 10, rate: 100.0},
    {item_code: "ITEM-002", qty: 5, rate: 200.0}
];

items_data.forEach(function(item_data) {
    let new_item = frappe.model.add_child(frm.doc, "items", "items");
    Object.assign(new_item, item_data);
});

frm.refresh_field("items");
```

### 2. Reading Child Table Data

#### Get All Rows
```javascript
// Get all items
let items = frm.doc.items || [];

items.forEach(function(item) {
    console.log(item.item_code, item.qty, item.rate);
});
```

#### Filter Rows
```javascript
// Filter items with qty > 5
let high_qty_items = frm.doc.items.filter(function(item) {
    return item.qty > 5;
});

// Find specific item
let specific_item = frm.doc.items.find(function(item) {
    return item.item_code === "ITEM-001";
});
```

### 3. Updating Child Table Rows

#### Update Specific Row
```javascript
// Update specific item
frm.doc.items.forEach(function(item) {
    if (item.item_code === "ITEM-001") {
        item.qty = 15;
        item.rate = 120.0;
    }
});

frm.refresh_field("items");
```

#### Update All Rows
```javascript
// Update all items
frm.doc.items.forEach(function(item) {
    if (item.qty > 10) {
        item.rate = item.rate * 1.1; // 10% increase
    }
});

frm.refresh_field("items");
```

### 4. Deleting Child Table Rows

#### Remove Specific Row
```javascript
// Remove specific item
let items_to_keep = frm.doc.items.filter(function(item) {
    return item.item_code !== "ITEM-001";
});

frm.doc.items = items_to_keep;
frm.refresh_field("items");
```

#### Remove Multiple Rows
```javascript
// Remove items with qty = 0
frm.doc.items = frm.doc.items.filter(function(item) {
    return item.qty > 0;
});

frm.refresh_field("items");
```

### 5. Child Table Events

#### Row Add Event
```javascript
frm.set_query("item_code", "items", function() {
    return {
        filters: {
            "is_sales_item": 1
        }
    };
});
```

#### Field Change Event
```javascript
frm.fields_dict.items.grid.get_field("item_code").get_query = function() {
    return {
        filters: {
            "is_sales_item": 1
        }
    };
};
```

#### Row Validation
```javascript
frm.cscript.custom_validate = function(doc) {
    // Validate child table
    doc.items.forEach(function(item) {
        if (item.qty <= 0) {
            frappe.msgprint("Quantity must be greater than 0");
            frappe.validated = false;
        }
    });
};
```

### 6. Advanced JavaScript Operations

#### Bulk Update
```javascript
// Update multiple fields in all rows
frm.doc.items.forEach(function(item) {
    item.warehouse = frm.doc.warehouse;
    item.delivery_date = frm.doc.delivery_date;
});

frm.refresh_field("items");
```

#### Calculate Totals
```javascript
function calculate_totals() {
    let total_qty = 0;
    let total_amount = 0;
    
    frm.doc.items.forEach(function(item) {
        total_qty += item.qty || 0;
        total_amount += (item.qty || 0) * (item.rate || 0);
    });
    
    frm.set_value("total_qty", total_qty);
    frm.set_value("grand_total", total_amount);
}

// Call on items change
frm.fields_dict.items.grid.wrapper.on("change", calculate_totals);
```

## JavaScript Client Scripts for Child Tables

### 1. Child Table Field Events

#### Field Change Events
```javascript
// For Sales Order Item child table
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Clear dependent fields
        item.description = "";
        item.rate = 0;
        item.amount = 0;
        
        // Fetch item details
        if (item.item_code) {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Item",
                    name: item.item_code
                },
                callback: function(r) {
                    if (r.message) {
                        item.description = r.message.description || "";
                        item.rate = r.message.standard_rate || 0;
                        item.uom = r.message.stock_uom || "";
                        item.conversion_factor = 1;
                        
                        // Calculate amount
                        item.amount = item.qty * item.rate;
                        
                        frm.refresh_field("items");
                        calculate_totals(frm);
                    }
                }
            });
        }
    },
    
    qty: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Calculate amount when qty changes
        if (item.qty && item.rate) {
            item.amount = item.qty * item.rate;
            frm.refresh_field("items");
            calculate_totals(frm);
        }
    },
    
    rate: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Calculate amount when rate changes
        if (item.qty && item.rate) {
            item.amount = item.qty * item.rate;
            frm.refresh_field("items");
            calculate_totals(frm);
        }
    },
    
    uom: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Get conversion factor for UOM
        if (item.item_code && item.uom) {
            frappe.call({
                method: "erpnext.stock.get_item_details.get_conversion_factor",
                args: {
                    item_code: item.item_code,
                    uom: item.uom
                },
                callback: function(r) {
                    if (r.message) {
                        item.conversion_factor = r.message.conversion_factor || 1;
                        frm.refresh_field("items");
                    }
                }
            });
        }
    }
});
```

#### Row Add/Remove Events
```javascript
frappe.ui.form.on("Sales Order Item", {
    items_add: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Set default values for new row
        item.warehouse = frm.doc.warehouse || "";
        item.delivery_date = frm.doc.delivery_date || "";
        item.conversion_factor = 1;
        
        frm.refresh_field("items");
    },
    
    items_remove: function(frm, cdt, cdn) {
        // Recalculate totals when row is removed
        calculate_totals(frm);
    }
});
```

### 2. Child Table Validation

#### Real-time Validation
```javascript
frappe.ui.form.on("Sales Order Item", {
    qty: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Validate quantity
        if (item.qty && item.qty <= 0) {
            frappe.msgprint("Quantity must be greater than 0");
            item.qty = 1;
            frm.refresh_field("items");
        }
        
        // Check stock availability
        if (item.item_code && item.qty && item.warehouse) {
            frappe.call({
                method: "erpnext.stock.utils.get_stock_balance",
                args: {
                    item_code: item.item_code,
                    warehouse: item.warehouse
                },
                callback: function(r) {
                    if (r.message && r.message < item.qty) {
                        frappe.msgprint(`Insufficient stock. Available: ${r.message}`);
                    }
                }
            });
        }
    },
    
    rate: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Validate rate
        if (item.rate && item.rate < 0) {
            frappe.msgprint("Rate cannot be negative");
            item.rate = 0;
            frm.refresh_field("items");
        }
    }
});
```

#### Duplicate Item Check
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        if (item.item_code) {
            // Check for duplicate items
            let duplicate_items = frm.doc.items.filter(function(i) {
                return i.item_code === item.item_code && i.name !== item.name;
            });
            
            if (duplicate_items.length > 0) {
                frappe.msgprint("Duplicate item found. Please remove duplicate entries.");
                item.item_code = "";
                frm.refresh_field("items");
            }
        }
    }
});
```

### 3. Child Table Queries and Filters

#### Dynamic Query Filters
```javascript
frappe.ui.form.on("Sales Order", {
    customer: function(frm) {
        // Update item query based on customer
        frm.set_query("item_code", "items", function() {
            return {
                filters: {
                    "is_sales_item": 1,
                    "disabled": 0
                }
            };
        });
    },
    
    warehouse: function(frm) {
        // Update warehouse for all items
        frm.doc.items.forEach(function(item) {
            if (!item.warehouse) {
                item.warehouse = frm.doc.warehouse;
            }
        });
        frm.refresh_field("items");
    }
});
```

#### Conditional Field Visibility
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Show/hide fields based on item type
        if (item.item_code) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Item",
                    name: item.item_code,
                    fieldname: "is_stock_item"
                },
                callback: function(r) {
                    if (r.message) {
                        // Show warehouse field for stock items
                        frm.fields_dict.items.grid.toggle_display("warehouse", r.message.is_stock_item);
                    }
                }
            });
        }
    }
});
```

### 4. Child Table Calculations

#### Auto-calculate Fields
```javascript
function calculate_item_totals(frm, cdt, cdn) {
    let item = locals[cdt][cdn];
    
    if (item.qty && item.rate) {
        // Calculate basic amount
        item.amount = item.qty * item.rate;
        
        // Calculate with conversion factor
        if (item.conversion_factor) {
            item.stock_qty = item.qty * item.conversion_factor;
        }
        
        // Calculate tax amount
        if (item.tax_rate) {
            item.tax_amount = item.amount * (item.tax_rate / 100);
            item.total_amount = item.amount + item.tax_amount;
        } else {
            item.total_amount = item.amount;
        }
        
        frm.refresh_field("items");
        calculate_grand_total(frm);
    }
}

// Apply to multiple fields
frappe.ui.form.on("Sales Order Item", {
    qty: calculate_item_totals,
    rate: calculate_item_totals,
    conversion_factor: calculate_item_totals,
    tax_rate: calculate_item_totals
});
```

#### Grand Total Calculation
```javascript
function calculate_grand_total(frm) {
    let total_amount = 0;
    let total_qty = 0;
    
    frm.doc.items.forEach(function(item) {
        if (item.total_amount) {
            total_amount += item.total_amount;
        }
        if (item.qty) {
            total_qty += item.qty;
        }
    });
    
    frm.set_value("total_amount", total_amount);
    frm.set_value("total_qty", total_qty);
    
    // Calculate tax totals
    calculate_tax_totals(frm);
}
```

### 5. Child Table Custom Buttons

#### Add Custom Buttons to Child Table
```javascript
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // Add custom button to child table
        frm.fields_dict.items.grid.add_custom_button("Add Standard Items", function() {
            add_standard_items(frm);
        });
        
        frm.fields_dict.items.grid.add_custom_button("Clear All Items", function() {
            clear_all_items(frm);
        });
        
        frm.fields_dict.items.grid.add_custom_button("Copy from Quotation", function() {
            copy_from_quotation(frm);
        });
    }
});

function add_standard_items(frm) {
    frappe.call({
        method: "erpnext.selling.doctype.sales_order.sales_order.get_standard_items",
        args: {
            "customer": frm.doc.customer
        },
        callback: function(r) {
            if (r.message) {
                r.message.forEach(function(item) {
                    let new_item = frappe.model.add_child(frm.doc, "items", "items");
                    Object.assign(new_item, item);
                });
                frm.refresh_field("items");
                calculate_grand_total(frm);
            }
        }
    });
}

function clear_all_items(frm) {
    frappe.confirm("Are you sure you want to clear all items?", function() {
        frm.doc.items = [];
        frm.refresh_field("items");
        calculate_grand_total(frm);
    });
}
```

### 6. Child Table Row Actions

#### Custom Row Actions
```javascript
frappe.ui.form.on("Sales Order Item", {
    items_add: function(frm, cdt, cdn) {
        // Add custom action buttons to each row
        let item = locals[cdt][cdn];
        
        // Add copy button
        frm.fields_dict.items.grid.add_custom_button("Copy", function() {
            copy_item_row(frm, item);
        }, item.name);
        
        // Add duplicate button
        frm.fields_dict.items.grid.add_custom_button("Duplicate", function() {
            duplicate_item_row(frm, item);
        }, item.name);
    }
});

function copy_item_row(frm, source_item) {
    let new_item = frappe.model.add_child(frm.doc, "items", "items");
    Object.assign(new_item, source_item);
    new_item.name = ""; // Clear name for new row
    frm.refresh_field("items");
}

function duplicate_item_row(frm, source_item) {
    let new_item = frappe.model.add_child(frm.doc, "items", "items");
    Object.assign(new_item, source_item);
    new_item.name = ""; // Clear name for new row
    frm.refresh_field("items");
}
```

### 7. Child Table with Dependencies

#### Field Dependencies
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        if (item.item_code) {
            // Fetch item details and set dependent fields
            frappe.call({
                method: "erpnext.stock.get_item_details.get_item_details",
                args: {
                    "item_code": item.item_code,
                    "warehouse": item.warehouse || frm.doc.warehouse,
                    "customer": frm.doc.customer,
                    "selling_price_list": frm.doc.selling_price_list
                },
                callback: function(r) {
                    if (r.message) {
                        // Set all dependent fields
                        item.description = r.message.description || "";
                        item.rate = r.message.rate_list_rate || 0;
                        item.uom = r.message.stock_uom || "";
                        item.conversion_factor = r.message.conversion_factor || 1;
                        item.warehouse = r.message.warehouse || frm.doc.warehouse;
                        
                        // Calculate amount
                        item.amount = item.qty * item.rate;
                        
                        frm.refresh_field("items");
                        calculate_grand_total(frm);
                    }
                }
            });
        }
    }
});
```

### 8. Child Table with Conditional Logic

#### Show/Hide Fields Based on Conditions
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        if (item.item_code) {
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Item",
                    name: item.item_code,
                    fieldname: ["is_stock_item", "is_serialized", "is_batched"]
                },
                callback: function(r) {
                    if (r.message) {
                        // Show/hide fields based on item properties
                        frm.fields_dict.items.grid.toggle_display("warehouse", r.message.is_stock_item);
                        frm.fields_dict.items.grid.toggle_display("serial_no", r.message.is_serialized);
                        frm.fields_dict.items.grid.toggle_display("batch_no", r.message.is_batched);
                    }
                }
            });
        }
    }
});
```

### 9. Child Table with API Integration

#### Real-time Data Fetching
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        if (item.item_code) {
            // Show loading indicator
            frm.fields_dict.items.grid.set_loading(true);
            
            // Fetch real-time pricing
            frappe.call({
                method: "erpnext.selling.doctype.sales_order.sales_order.get_item_pricing",
                args: {
                    "item_code": item.item_code,
                    "customer": frm.doc.customer,
                    "price_list": frm.doc.selling_price_list,
                    "qty": item.qty || 1
                },
                callback: function(r) {
                    frm.fields_dict.items.grid.set_loading(false);
                    
                    if (r.message) {
                        item.rate = r.message.rate || 0;
                        item.discount_percentage = r.message.discount_percentage || 0;
                        item.amount = item.qty * item.rate;
                        
                        frm.refresh_field("items");
                        calculate_grand_total(frm);
                    }
                }
            });
        }
    }
});
```

### 10. Child Table Validation with User Feedback

#### Comprehensive Validation
```javascript
frappe.ui.form.on("Sales Order Item", {
    item_code: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        if (item.item_code) {
            // Validate item exists and is active
            frappe.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: "Item",
                    name: item.item_code,
                    fieldname: ["disabled", "is_sales_item"]
                },
                callback: function(r) {
                    if (r.message) {
                        if (r.message.disabled) {
                            frappe.msgprint("Item is disabled");
                            item.item_code = "";
                            frm.refresh_field("items");
                        } else if (!r.message.is_sales_item) {
                            frappe.msgprint("Item is not a sales item");
                            item.item_code = "";
                            frm.refresh_field("items");
                        }
                    } else {
                        frappe.msgprint("Item not found");
                        item.item_code = "";
                        frm.refresh_field("items");
                    }
                }
            });
        }
    },
    
    qty: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        
        // Validate quantity
        if (item.qty && item.qty <= 0) {
            frappe.msgprint("Quantity must be greater than 0");
            item.qty = 1;
            frm.refresh_field("items");
        }
        
        // Check stock availability
        if (item.item_code && item.qty && item.warehouse) {
            check_stock_availability(frm, item);
        }
    }
});

function check_stock_availability(frm, item) {
    frappe.call({
        method: "erpnext.stock.utils.get_stock_balance",
        args: {
            item_code: item.item_code,
            warehouse: item.warehouse
        },
        callback: function(r) {
            if (r.message !== null && r.message < item.qty) {
                frappe.msgprint(`Insufficient stock. Available: ${r.message}, Required: ${item.qty}`);
            }
        }
    });
}
```

## Real-World Examples

### 1. Sales Order Items Management

#### Python Example
```python
def create_sales_order_with_items(customer, items_data):
    # Create Sales Order
    so = frappe.get_doc({
        "doctype": "Sales Order",
        "customer": customer,
        "delivery_date": frappe.utils.add_days(frappe.utils.today(), 7)
    })
    
    # Add items
    for item_data in items_data:
        so.append("items", {
            "item_code": item_data["item_code"],
            "qty": item_data["qty"],
            "rate": item_data["rate"],
            "warehouse": item_data.get("warehouse", "Stores - Company")
        })
    
    # Calculate totals
    so.calculate_taxes_and_totals()
    so.save()
    so.submit()
    
    return so.name
```

#### JavaScript Example
```javascript
// Sales Order form script
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // Add custom button to add standard items
        frm.add_custom_button("Add Standard Items", function() {
            add_standard_items(frm);
        });
    },
    
    items_add: function(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        // Auto-fill warehouse
        if (!item.warehouse) {
            item.warehouse = frm.doc.warehouse;
        }
        frm.refresh_field("items");
    }
});

function add_standard_items(frm) {
    frappe.call({
        method: "erpnext.selling.doctype.sales_order.sales_order.get_standard_items",
        args: {
            "customer": frm.doc.customer
        },
        callback: function(r) {
            if (r.message) {
                r.message.forEach(function(item) {
                    let new_item = frappe.model.add_child(frm.doc, "items", "items");
                    Object.assign(new_item, item);
                });
                frm.refresh_field("items");
            }
        }
    });
}
```

### 2. Purchase Order Items Management

#### Python Example
```python
def update_purchase_order_items(po_name, items_data):
    po = frappe.get_doc("Purchase Order", po_name)
    
    # Clear existing items
    po.set("items", [])
    
    # Add new items
    for item_data in items_data:
        po.append("items", {
            "item_code": item_data["item_code"],
            "qty": item_data["qty"],
            "rate": item_data["rate"],
            "schedule_date": item_data.get("schedule_date", po.schedule_date)
        })
    
    # Update totals
    po.calculate_taxes_and_totals()
    po.save()
    
    return po.name
```

### 3. Address Management

#### Python Example
```python
def add_customer_address(customer, address_data):
    customer_doc = frappe.get_doc("Customer", customer)
    
    # Check if address already exists
    existing_address = next((addr for addr in customer_doc.addresses 
                           if addr.address_line1 == address_data["address_line1"]), None)
    
    if not existing_address:
        customer_doc.append("addresses", {
            "address_type": address_data.get("address_type", "Billing"),
            "address_line1": address_data["address_line1"],
            "city": address_data["city"],
            "state": address_data["state"],
            "country": address_data["country"],
            "pincode": address_data["pincode"]
        })
        
        customer_doc.save()
        return True
    
    return False
```

## Advanced Scenarios

### 1. Dynamic Child Table Creation

```python
def create_dynamic_child_table(parent_doctype, child_table_name, fields):
    # Create child DocType dynamically
    child_doctype = frappe.get_doc({
        "doctype": "DocType",
        "name": child_table_name,
        "istable": 1,
        "module": "Custom",
        "fields": [
            {"label": "Name", "fieldname": "name", "fieldtype": "Data", "reqd": 1},
            {"label": "Parent", "fieldname": "parent", "fieldtype": "Data", "reqd": 1},
            {"label": "Parent Type", "fieldname": "parenttype", "fieldtype": "Data", "reqd": 1},
            {"label": "Parent Field", "fieldname": "parentfield", "fieldtype": "Data", "reqd": 1},
            {"label": "IDX", "fieldname": "idx", "fieldtype": "Int", "reqd": 1}
        ] + fields
    })
    
    child_doctype.insert()
    
    # Add table field to parent DocType
    parent_meta = frappe.get_meta(parent_doctype)
    parent_meta.append("fields", {
        "label": child_table_name.replace("_", " ").title(),
        "fieldname": child_table_name.lower(),
        "fieldtype": "Table",
        "options": child_table_name
    })
    
    parent_meta.save()
```

### 2. Child Table with Computed Fields

```python
def calculate_child_totals(self):
    for item in self.items:
        # Calculate amount
        item.amount = item.qty * item.rate
        
        # Calculate tax amount
        if item.tax_rate:
            item.tax_amount = item.amount * (item.tax_rate / 100)
        else:
            item.tax_amount = 0
        
        # Calculate total
        item.total = item.amount + item.tax_amount
```

### 3. Child Table with Conditional Logic

```python
def validate_child_conditions(self):
    for item in self.items:
        # Conditional validation based on item type
        if item.item_type == "Service":
            if not item.service_date:
                frappe.throw(f"Service Date is required for service item {item.item_code}")
        
        elif item.item_type == "Product":
            if not item.warehouse:
                frappe.throw(f"Warehouse is required for product item {item.item_code}")
        
        # Conditional field updates
        if item.item_code and not item.description:
            item.description = frappe.get_value("Item", item.item_code, "description")
```

### 4. Child Table with API Integration

```python
def sync_child_table_with_external_api(self):
    for item in self.items:
        if item.sync_with_api:
            # Prepare data for API
            api_data = {
                "item_code": item.item_code,
                "qty": item.qty,
                "rate": item.rate,
                "external_id": item.external_id
            }
            
            # Call external API
            response = frappe.call("your_app.api.external_sync", api_data)
            
            if response.get("success"):
                item.api_synced = 1
                item.api_sync_date = frappe.utils.now()
            else:
                item.api_synced = 0
                item.api_error = response.get("error")
```

## Best Practices

### 1. Performance Optimization

#### Limit Child Table Queries
```python
# Good: Single query with filters
items = frappe.get_all("Sales Order Item",
    filters={"parent": "SO-001", "parenttype": "Sales Order"},
    fields=["item_code", "qty", "rate"]
)

# Bad: Multiple queries in loop
for item in parent_doc.items:
    item_details = frappe.get_doc("Item", item.item_code)  # Avoid this
```

#### Use Bulk Operations
```python
# Good: Bulk update
frappe.db.sql("""
    UPDATE `tabSales Order Item` 
    SET rate = rate * 1.1 
    WHERE parent = %s AND parenttype = 'Sales Order'
""", (parent_name,))

# Bad: Individual updates in loop
for item in parent_doc.items:
    item.rate = item.rate * 1.1
    item.save()  # Avoid this
```

### 2. Data Validation

#### Validate at Multiple Levels
```python
def validate(self):
    # Parent level validation
    if not self.items:
        frappe.throw("At least one item is required")
    
    # Child level validation
    for item in self.items:
        if item.qty <= 0:
            frappe.throw(f"Quantity must be greater than 0 for item {item.item_code}")
```

#### Use Database Constraints
```python
# Add database constraints for child table
def add_child_table_constraints(self):
    frappe.db.sql("""
        ALTER TABLE `tabSales Order Item` 
        ADD CONSTRAINT check_qty_positive 
        CHECK (qty > 0)
    """)
```

### 3. Error Handling

#### Graceful Error Handling
```python
def safe_add_item(self, item_data):
    try:
        new_item = self.append("items", item_data)
        return new_item
    except Exception as e:
        frappe.log_error(f"Error adding item: {str(e)}")
        frappe.throw("Failed to add item. Please check the data and try again.")
```

#### Validation with User Feedback
```python
def validate_items_with_feedback(self):
    errors = []
    
    for idx, item in enumerate(self.items, 1):
        if not item.item_code:
            errors.append(f"Row {idx}: Item Code is required")
        if item.qty <= 0:
            errors.append(f"Row {idx}: Quantity must be greater than 0")
    
    if errors:
        frappe.throw("<br>".join(errors))
```

## Troubleshooting

### Common Issues

#### 1. Child Table Not Saving
```python
# Check if parent document is saved
if parent_doc.is_new():
    parent_doc.save()

# Check if child table field exists
if not hasattr(parent_doc, "items"):
    frappe.throw("Items field not found in parent document")
```

#### 2. Index Issues
```python
# Re-index child table rows
def reindex_child_table(parent_doc, fieldname):
    for idx, child in enumerate(parent_doc.get(fieldname), 1):
        child.idx = idx
    parent_doc.save()
```

#### 3. Permission Issues
```python
# Check child table permissions
def check_child_permissions(parent_doctype, child_doctype, user):
    return frappe.has_permission(
        parent_doctype, 
        "write", 
        user=user
    ) and frappe.has_permission(
        child_doctype, 
        "write", 
        user=user
    )
```

#### 4. Data Integrity Issues
```python
# Validate child table data integrity
def validate_child_integrity(parent_doc):
    for fieldname in parent_doc.meta.get_table_fields():
        child_table = parent_doc.get(fieldname)
        for child in child_table:
            if child.parent != parent_doc.name:
                frappe.throw(f"Child table integrity issue: {fieldname}")
```

### Debugging Tips

#### 1. Enable Debug Mode
```python
# Enable debug mode for child table operations
frappe.flags.debug = True
parent_doc.save()
frappe.flags.debug = False
```

#### 2. Log Child Table Operations
```python
def log_child_operations(parent_doc, operation):
    frappe.logger().info(f"Child table operation: {operation}")
    frappe.logger().info(f"Parent: {parent_doc.doctype} - {parent_doc.name}")
    frappe.logger().info(f"Child count: {len(parent_doc.items)}")
```

#### 3. Validate Child Table Structure
```python
def validate_child_structure(parent_doc):
    for fieldname in parent_doc.meta.get_table_fields():
        child_table = parent_doc.get(fieldname)
        for child in child_table:
            # Check required fields
            if not child.parent:
                frappe.throw(f"Parent field missing in {fieldname}")
            if not child.parenttype:
                frappe.throw(f"Parent type missing in {fieldname}")
            if not child.parentfield:
                frappe.throw(f"Parent field missing in {fieldname}")
```

## Conclusion

Child DocTypes are powerful features in Frappe that enable complex data relationships and business logic. By understanding the concepts and following best practices, you can create robust applications that handle complex data structures efficiently.

Key takeaways:
- Always use the parent document to manage child tables
- Implement proper validation at both parent and child levels
- Use bulk operations for better performance
- Handle errors gracefully with user-friendly messages
- Test thoroughly with various data scenarios
- Use JavaScript client scripts for enhanced user experience
