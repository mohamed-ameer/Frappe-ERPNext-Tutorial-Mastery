# Frappe Child DocTypes: CDT and CDN

## Table of Contents
- **1. Core Concepts and Terminology**
- **2. Understanding CDT and CDN**
- **3. Child Table Architecture**
- **4. Essential Developer Knowledge**
- **5. Advanced Patterns and Best Practices**
- **6. Performance Considerations**
- **7. Common Pitfalls and Solutions**

## Core Concepts and Terminology

### Key Terms Every Developer Must Know

#### **CDT (Child DocType)**
- **Definition**: The doctype name of a child table (e.g., "Sales Order Item")
- **Purpose**: Defines the structure and behavior of child records
- **Usage**: Referenced in parent doctype's Table field options
- **Example**: `"Sales Order Item"` is the CDT for items in a Sales Order

#### **CDN (Child DocName)**
- **Definition**: The unique identifier/name of a specific child record
- **Format**: Usually `{parent_name}-{child_doctype}-{sequence}` (e.g., "SAL-001-Sales Order Item-1")
- **Purpose**: Uniquely identifies each child record in the database
- **Auto-generation**: Frappe automatically generates CDN when creating child records

#### **Parent-Child Relationship Fields**
```python
# The three mandatory fields in every child doctype
parent = "SAL-001"           # Parent document name
parenttype = "Sales Order"   # Parent doctype name  
parentfield = "items"        # Field name in parent where this child belongs
```

#### **Table Field**
- **Definition**: A field type in parent doctype that references a child doctype
- **Purpose**: Creates the parent-child relationship
- **Configuration**: Specifies which child doctype to use
- **Example**: `items` field in Sales Order with options "Sales Order Item"

## Understanding CDT and CDN

### CDT (Child DocType) Deep Dive

#### **What is a CDT?**
A CDT is essentially a **blueprint** that defines:
- **Structure**: What fields the child records will have
- **Validation**: What rules apply to child records
- **Behavior**: How child records interact with their parent
- **Permissions**: What users can do with child records

#### **CDT Characteristics**
```python
# Every CDT has these properties
istable = 1                    # Marks it as a child table
parent_doctype = "Sales Order" # Which parent it belongs to
parent_field = "items"         # Which field in parent references it
```

#### **CDT Lifecycle**
1. **Creation**: Defined in parent doctype's Table field
2. **Schema Generation**: Frappe creates database table
3. **Field Addition**: Fields are added to the child table
4. **Validation Setup**: Business rules are established
5. **Permission Setup**: Access controls are configured

### CDN (Child DocName) Deep Dive

#### **What is a CDN?**
A CDN is a **unique identifier** for each child record that:
- **Uniquely identifies** the child record
- **Maintains referential integrity** with parent
- **Enables efficient querying** and indexing
- **Supports versioning** and audit trails

#### **CDN Naming Convention**
```python
# Standard CDN format
CDN = f"{parent_name}-{child_doctype}-{sequence}"

# Examples
"SAL-001-Sales Order Item-1"
"SAL-001-Sales Order Item-2" 
"PUR-002-Purchase Order Item-1"
```

#### **CDN Generation Process** (this is pseudo code - just dummy code)
```python
def generate_child_name(parent_name, child_doctype, sequence):
    """How Frappe generates child record names"""
    # Clean the child doctype name
    clean_doctype = frappe.scrub(child_doctype)
    
    # Generate the CDN
    cdn = f"{parent_name}-{clean_doctype}-{sequence}"
    
    # Ensure uniqueness
    if frappe.db.exists(child_doctype, cdn):
        sequence += 1
        cdn = f"{parent_name}-{clean_doctype}-{sequence}"
    
    return cdn
```

## Child Table Architecture

### Database Schema Design

#### **Child Table Structure**
```sql
CREATE TABLE `tabSales Order Item` (
    `name` VARCHAR(255) NOT NULL,           -- CDN (Child DocName)
    `creation` DATETIME(6) DEFAULT NULL,
    `modified` DATETIME(6) DEFAULT NULL,
    `modified_by` VARCHAR(255) DEFAULT NULL,
    `owner` VARCHAR(255) DEFAULT NULL,
    `docstatus` SMALLINT NOT NULL DEFAULT 0,
    `parent` VARCHAR(255) DEFAULT NULL,     -- Parent document name
    `parenttype` VARCHAR(255) DEFAULT NULL, -- Parent doctype name
    `parentfield` VARCHAR(255) DEFAULT NULL, -- Parent field name
    `idx` BIGINT NOT NULL DEFAULT 0,        -- Sequence in parent
    -- Business fields
    `item_code` VARCHAR(255) DEFAULT NULL,
    `quantity` DECIMAL(21,9) DEFAULT 0,
    `rate` DECIMAL(21,9) DEFAULT 0,
    `amount` DECIMAL(21,9) DEFAULT 0,
    PRIMARY KEY (`name`),
    INDEX `parent` (`parent`, `parenttype`, `parentfield`),
    INDEX `idx` (`parent`, `parentfield`, `idx`)
);
```

#### **Key Indexes Explained**
```sql
-- Primary key on name (CDN)
PRIMARY KEY (`name`)

-- Composite index for parent-child queries
INDEX `parent` (`parent`, `parenttype`, `parentfield`)

-- Sequence index for ordered retrieval
INDEX `idx` (`parent`, `parentfield`, `idx`)
```

### Memory Representation

#### **In-Memory Structure**
```python
# Parent document in memory
parent_doc = {
    "name": "SAL-001",
    "doctype": "Sales Order",
    "customer": "CUST-001",
    "items": [  # Child table as list
        {
            "name": "SAL-001-Sales Order Item-1",
            "doctype": "Sales Order Item",
            "parent": "SAL-001",
            "parenttype": "Sales Order", 
            "parentfield": "items",
            "idx": 1,
            "item_code": "ITEM-001",
            "quantity": 10,
            "rate": 100
        },
        {
            "name": "SAL-001-Sales Order Item-2", 
            "doctype": "Sales Order Item",
            "parent": "SAL-001",
            "parenttype": "Sales Order",
            "parentfield": "items", 
            "idx": 2,
            "item_code": "ITEM-002",
            "quantity": 5,
            "rate": 200
        }
    ]
}
```

## Essential Developer Knowledge

### 1. **Child Table Field Types**

#### **Table Field (Parent Side)**
```python
# In parent doctype JSON
{
    "fieldname": "items",
    "fieldtype": "Table", 
    "label": "Items",
    "options": "Sales Order Item",  # This is the CDT
    "reqd": 1
}
```

#### **Child Table Fields (Child Side)**
```python
# In child doctype JSON
{
    "fieldname": "item_code",
    "fieldtype": "Link",
    "label": "Item Code", 
    "options": "Item",
    "reqd": 1
},
{
    "fieldname": "quantity",
    "fieldtype": "Float",
    "label": "Quantity",
    "default": 0
}
```

### 2. **Working with Child Tables in Python**

#### **Creating Child Records**
```python
# Method 1: Using append()
doc = frappe.get_doc("Sales Order", "SAL-001")
doc.append("items", {
    "item_code": "ITEM-001",
    "quantity": 10,
    "rate": 100
})
doc.save()

# Method 2: Direct creation
child_doc = frappe.get_doc({
    "doctype": "Sales Order Item",
    "parent": "SAL-001",
    "parenttype": "Sales Order",
    "parentfield": "items",
    "item_code": "ITEM-001",
    "quantity": 10,
    "rate": 100
})
child_doc.insert()
```

#### **Accessing Child Records**
```python
# Get parent with children
doc = frappe.get_doc("Sales Order", "SAL-001")

# Access child table
items = doc.items  # Returns list of child documents

# Iterate through children
for item in doc.items:
    print(f"Item: {item.item_code}, Qty: {item.quantity}")

# Access specific child by index
first_item = doc.items[0]

# Access specific child by name (CDN)
specific_item = frappe.get_doc("Sales Order Item", "SAL-001-Sales Order Item-1")
```

#### **Modifying Child Records**
```python
# Modify existing child
doc = frappe.get_doc("Sales Order", "SAL-001")
doc.items[0].quantity = 20
doc.save()

# Add new child
doc.append("items", {"item_code": "ITEM-002", "quantity": 5})
doc.save()

# Remove child
doc.remove(doc.items[0])  # Remove first item
doc.save()
```

### 3. **Working with Child Tables in JavaScript**

#### **Client Script Patterns**
```javascript
// On form load
frappe.ui.form.on('Sales Order', {
    refresh: function(frm) {
        // Access child table
        frm.fields_dict.items.grid.refresh();
    }
});

// Child table events
frappe.ui.form.on('Sales Order Item', {
    // When child row is added
    items_add: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // Set default values
        row.quantity = 1;
        frm.refresh_field('items');
    },
    
    // When child field changes
    quantity: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        // Calculate amount
        row.amount = row.quantity * row.rate;
        frm.refresh_field('items');
    },
    
    // When child row is removed
    items_remove: function(frm, cdt, cdn) {
        // Cleanup logic
        console.log('Item removed:', cdn);
    }
});
```

#### **Grid Operations**
```javascript
// Add new row
frm.add_child('items');
frm.refresh_field('items');

// Remove row
frm.remove_child('items', cdn);
frm.refresh_field('items');

// Get all child rows
let items = frm.doc.items || [];
items.forEach(function(item) {
    console.log(item.item_code, item.quantity);
});
```

### 4. **Querying Child Tables**

#### **Direct Queries**
```python
# Query child records directly
items = frappe.get_all("Sales Order Item", 
    filters={
        "parent": "SAL-001",
        "parenttype": "Sales Order"
    },
    fields=["name", "item_code", "quantity", "rate"]
)

# Query with parent context
items = frappe.get_all("Sales Order Item",
    filters={
        "parent": "SAL-001",
        "parenttype": "Sales Order", 
        "parentfield": "items"
    }
)
```

#### **Using ChildQuery Class**
```python
from frappe.database.query import ChildQuery

# Create child query
child_query = ChildQuery(
    fieldname="items",
    fields=["item_code", "quantity", "rate"],
    parent_doctype="Sales Order"
)

# Execute query
query = child_query.get_query(parent_names=["SAL-001"])
items = query.run(as_dict=True)
```

### 5. **Validation and Business Logic**

#### **Child Table Validation**
```python
# In child doctype Python file
def validate(self):
    # Validate child-specific rules
    if self.quantity <= 0:
        frappe.throw("Quantity must be greater than 0")
    
    # Access parent document
    parent = self.get_parent()
    if parent.customer == "CUST-001" and self.rate < 100:
        frappe.throw("Rate too low for this customer")

def get_parent(self):
    """Get parent document"""
    return frappe.get_doc(self.parenttype, self.parent)
```

#### **Parent Document Validation**
```python
# In parent doctype Python file
def validate(self):
    # Validate child table
    if not self.items:
        frappe.throw("At least one item is required")
    
    # Calculate totals
    total_amount = 0
    for item in self.items:
        item.amount = item.quantity * item.rate
        total_amount += item.amount
    
    self.total_amount = total_amount
```

## Advanced Patterns and Best Practices

### 1. **Child Table Inheritance**

#### **Base Child DocType**
```python
# Base Item DocType
class BaseItem(Document):
    def calculate_amount(self):
        return self.quantity * self.rate
    
    def validate_item(self):
        if not self.item_code:
            frappe.throw("Item Code is required")
```

#### **Specific Child DocTypes**
```python
# Sales Order Item
class SalesOrderItem(BaseItem):
    def calculate_amount(self):
        # Sales-specific calculation
        base_amount = super().calculate_amount()
        if self.discount_percentage:
            base_amount *= (1 - self.discount_percentage / 100)
        return base_amount

# Purchase Order Item  
class PurchaseOrderItem(BaseItem):
    def calculate_amount(self):
        # Purchase-specific calculation
        base_amount = super().calculate_amount()
        if self.tax_rate:
            base_amount *= (1 + self.tax_rate / 100)
        return base_amount
```

### 2. **Child Table Events**

#### **Event Hooks**
```python
# In hooks.py
doc_events = {
    "Sales Order Item": {
        "before_insert": "my_app.utils.sales_order_item.before_insert",
        "after_insert": "my_app.utils.sales_order_item.after_insert",
        "on_update": "my_app.utils.sales_order_item.on_update",
        "on_cancel": "my_app.utils.sales_order_item.on_cancel",
        "on_trash": "my_app.utils.sales_order_item.on_trash"
    }
}
```

#### **Event Handlers**
```python
def before_insert(doc, method):
    """Called before child record is inserted"""
    # Set default values
    if not doc.rate:
        doc.rate = frappe.get_value("Item", doc.item_code, "standard_rate")

def after_insert(doc, method):
    """Called after child record is inserted"""
    # Update parent totals
    parent = doc.get_parent()
    parent.calculate_totals()
    parent.save()

def on_update(doc, method):
    """Called when child record is updated"""
    # Recalculate parent
    parent = doc.get_parent()
    parent.calculate_totals()
    parent.save()
```

### 3. **Performance Optimization**

#### **Bulk Operations**
```python
# Efficient bulk insert
def create_multiple_items(parent_name, items_data):
    """Create multiple child records efficiently"""
    child_records = []
    for i, item_data in enumerate(items_data):
        child_records.append({
            "doctype": "Sales Order Item",
            "parent": parent_name,
            "parenttype": "Sales Order",
            "parentfield": "items",
            "idx": i + 1,
            **item_data
        })
    
    # Bulk insert
    frappe.db.bulk_insert("Sales Order Item", child_records)
```

#### **Lazy Loading**
```python
# Load parent without children
doc = frappe.get_doc("Sales Order", "SAL-001")

# Load children only when needed
if not hasattr(doc, 'items') or not doc.items:
    doc.load_children()
```

### 4. **Custom Child Table Fields**

#### **Dynamic Fields**
```python
# Add fields dynamically to child table
def add_custom_field_to_child():
    """Add custom field to existing child table"""
    custom_field = frappe.get_doc({
        "doctype": "Custom Field",
        "dt": "Sales Order Item",
        "fieldname": "custom_discount",
        "fieldtype": "Percent",
        "label": "Custom Discount",
        "insert_after": "rate"
    })
    custom_field.insert()
```

#### **Conditional Fields**
```python
# Show/hide fields based on conditions
def setup_conditional_fields():
    """Setup conditional field visibility"""
    frappe.db.set_value("Custom Field", "custom_discount", 
        "depends_on", "eval:doc.item_code")
```

## Performance Considerations

### 1. **Database Indexing**

#### **Essential Indexes**
```sql
-- Parent-child relationship index
CREATE INDEX idx_parent_child ON `tabSales Order Item` 
(parent, parenttype, parentfield);

-- Sequence index for ordered retrieval
CREATE INDEX idx_sequence ON `tabSales Order Item`
(parent, parentfield, idx);

-- Business field indexes
CREATE INDEX idx_item_code ON `tabSales Order Item` (item_code);
```

### 2. **Query Optimization**

#### **Efficient Queries**
```python
# Good: Use proper filters
items = frappe.get_all("Sales Order Item",
    filters={
        "parent": "SAL-001",
        "parenttype": "Sales Order"
    },
    fields=["item_code", "quantity", "rate"]
)

# Bad: Don't query all records
all_items = frappe.get_all("Sales Order Item")  # Expensive!
```

#### **Batch Processing**
```python
# Process child records in batches
def process_items_in_batches(parent_name, batch_size=100):
    """Process child items in batches for better performance"""
    offset = 0
    while True:
        items = frappe.get_all("Sales Order Item",
            filters={"parent": parent_name},
            limit=batch_size,
            start=offset
        )
        
        if not items:
            break
            
        # Process batch
        for item in items:
            process_item(item)
        
        offset += batch_size
```

### 3. **Memory Management**

#### **Efficient Memory Usage**
```python
# Load only required fields
items = frappe.get_all("Sales Order Item",
    filters={"parent": "SAL-001"},
    fields=["name", "item_code", "quantity"]  # Only required fields
)

# Use generators for large datasets
def get_items_generator(parent_name):
    """Generator for processing large child tables"""
    offset = 0
    while True:
        items = frappe.get_all("Sales Order Item",
            filters={"parent": parent_name},
            limit=1000,
            start=offset
        )
        
        if not items:
            break
            
        for item in items:
            yield item
        
        offset += 1000
```

## Common Pitfalls and Solutions

### 1. **Orphaned Records**

#### **Problem**
```python
# Creating child without proper parent context
child = frappe.get_doc({
    "doctype": "Sales Order Item",
    "item_code": "ITEM-001"
    # Missing parent, parenttype, parentfield
})
child.insert()  # This creates an orphaned record!
```

#### **Solution**
```python
# Always create child through parent
parent = frappe.get_doc("Sales Order", "SAL-001")
parent.append("items", {"item_code": "ITEM-001"})
parent.save()
```

### 2. **Inconsistent Data**

#### **Problem**
```python
# Direct modification without validation
frappe.db.set_value("Sales Order Item", "SAL-001-ITEM-1", "quantity", -10)
# This bypasses validation and can create inconsistent data
```

#### **Solution**
```python
# Always use document methods
item = frappe.get_doc("Sales Order Item", "SAL-001-ITEM-1")
item.quantity = 10  # This triggers validation
item.save()
```

### 3. **Performance Issues**

#### **Problem**
```python
# N+1 query problem
for item in parent.items:
    item_details = frappe.get_doc("Item", item.item_code)  # N+1 queries!
    print(item_details.item_name)
```

#### **Solution**
```python
# Batch query
item_codes = [item.item_code for item in parent.items]
items_data = frappe.get_all("Item",
    filters={"name": ["in", item_codes]},
    fields=["name", "item_name"]
)
items_dict = {item.name: item.item_name for item in items_data}

for item in parent.items:
    print(items_dict.get(item.item_code))
```

### 4. **Transaction Issues**

#### **Problem**
```python
# Child operations outside parent transaction
parent = frappe.get_doc("Sales Order", "SAL-001")
parent.save()

# This happens in separate transaction
child = frappe.get_doc("Sales Order Item", "SAL-001-ITEM-1")
child.quantity = 20
child.save()  # Separate transaction!
```

#### **Solution**
```python
# All operations in same transaction
parent = frappe.get_doc("Sales Order", "SAL-001")
parent.items[0].quantity = 20
parent.save()  # Single transaction for parent and children
```

## Conclusion

Understanding child doctypes, CDT, CDN, and the underlying architecture is crucial for any Frappe developer. These concepts form the foundation of Frappe's data modeling approach and are essential for:

- **Building robust applications** with proper data relationships
- **Optimizing performance** through efficient queries and indexing
- **Maintaining data integrity** through proper validation and business logic
- **Creating scalable solutions** that can grow with business needs

Master these concepts, and you'll be able to build sophisticated, maintainable Frappe applications that leverage the full power of the framework's data modeling capabilities.
