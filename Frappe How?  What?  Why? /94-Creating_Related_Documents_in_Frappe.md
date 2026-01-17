# Creating Related Documents in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding the Concept](#understanding-the-concept)
3. [Architecture Overview](#architecture-overview)
4. [Client-Side Implementation](#client-side-implementation)
5. [Server-Side Implementation](#server-side-implementation)
6. [Complete Example: Creating Asset Maintenance from Asset](#complete-example-creating-asset-maintenance-from-asset)
7. [Complete Example: Creating Asset Repair from Asset](#complete-example-creating-asset-repair-from-asset)
8. [Complete Example: Creating User from Employee](#complete-example-creating-user-from-employee)
9. [Key Components Explained](#key-components-explained)
10. [Best Practices](#best-practices)
11. [Common Patterns and Variations](#common-patterns-and-variations)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

In Frappe, creating a new document from an existing document is a common pattern. This allows users to quickly create related documents (like creating a Payment Entry from a Sales Invoice, or creating an Asset Maintenance from an Asset) with pre-filled data from the source document.

This pattern involves:
1. **Client-side JavaScript** that triggers the creation
2. **Server-side Python** that creates the document
3. **Navigation** to the newly created document

---

## Understanding the Concept

### What is "Creating Related Documents"?

Creating related documents means generating a new document based on data from an existing document. This is useful for:

- **Workflow Continuity**: Creating the next step in a business process
- **Data Consistency**: Pre-filling fields with related data
- **User Experience**: Reducing manual data entry
- **Business Logic**: Applying rules and validations during creation

### Real-World Use Cases

1. **Creating Asset Maintenance from Asset**: When viewing an Asset, create a maintenance record
2. **Creating User from Employee**: When viewing an Employee, create a User account
3. **Creating Payment Entry from Invoice**: Create payment from a sales invoice
4. **Creating Delivery Note from Sales Order**: Generate delivery from an order

### The Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Create <Related DocType>" button on Form       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Client-Side JavaScript Function                             │
│  - Collects data from current form (frm.doc)                │
│  - Calls server-side method via frappe.call()                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Server-Side Python Method                                   │
│  - Decorated with @frappe.whitelist()                        │
│  - Creates new document with frappe.new_doc()                │
│  - Sets fields from source document                          │
│  - Returns document as dictionary                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Client-Side Callback                                         │
│  - Receives new document data                                │
│  - Syncs document to local model (frappe.model.sync)          │
│  - Navigates to new document (frappe.set_route)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### Components

1. **Client-Side (JavaScript)**
   - Form controller method
   - `frappe.call()` API call
   - Callback handler
   - Navigation logic

2. **Server-Side (Python)**
   - `@frappe.whitelist()` decorator
   - Document creation logic
   - Data mapping
   - Return value

3. **Frappe Framework**
   - Request handling
   - Permission checking
   - Document model
   - Routing system

### Data Flow

```
Source Document (Asset)
    │
    ├─> Extract fields (asset, company, item_code, etc.)
    │
    ├─> Send to server via frappe.call()
    │
    ├─> Server creates new document (Asset Maintenance)
    │
    ├─> Server returns document as dictionary
    │
    └─> Client navigates to new document
```

---

## Client-Side Implementation

### Basic Structure

The client-side implementation follows this pattern:

```javascript
create_<doctype_name>: function (frm) {
    frappe.call({
        doc: frm.doc,  // Current document
        method: "create_<doctype_name>",  // Server-side method
        callback: function (r) {
            // Handle response
            var doc = frappe.model.sync(r.message)[0];
            frappe.set_route("Form", doc.doctype, doc.name);
        },
    });
}
```

### Component Breakdown

#### 1. Function Definition

```javascript
create_<doctype_name>: function (frm) {
    // frm is the current form object
    // Contains frm.doc (current document data)
}
```

**Purpose**: Defines a method that can be called from the form (usually via a button).

#### 2. frappe.call()

```javascript
frappe.call({
    doc: frm.doc,           // Current document
    method: "method_name",   // Server-side method to call
    args: {},               // Optional: additional arguments
    callback: function() {}, // What to do when response arrives
})
```

**Purpose**: Makes an AJAX call to the server-side method.

**Parameters**:
- `doc`: The current document (automatically sent to server)
- `method`: The server-side method name (must be whitelisted)
- `args`: Optional additional arguments
- `callback`: Function to execute when server responds

#### 3. Callback Function

```javascript
callback: function (r) {
    var doc = frappe.model.sync(r.message)[0];
    frappe.set_route("Form", doc.doctype, doc.name);
}
```

**Purpose**: Handles the server response and navigates to the new document.

**Steps**:
1. `r.message` contains the document dictionary returned from server
2. `frappe.model.sync()` syncs the document to the local model
3. `frappe.set_route()` navigates to the new document form

---

## Server-Side Implementation

### Basic Structure

The server-side implementation follows this pattern:

```python
@frappe.whitelist()
def create_<doctype_name>(self):
    new_doc = frappe.new_doc("<doctype_name>")
    new_doc.field1 = value1
    new_doc.field2 = value2
    # ... set more fields
    return new_doc.as_dict()
```

### Component Breakdown

#### 1. @frappe.whitelist() Decorator

```python
@frappe.whitelist()
def create_<doctype_name>(self):
    # Method implementation
```

**Purpose**: Makes the method accessible from client-side JavaScript.

**Important**: Without this decorator, the method cannot be called from `frappe.call()`.

#### 2. frappe.new_doc()

```python
new_doc = frappe.new_doc("<doctype_name>")
```

**Purpose**: Creates a new, unsaved document instance.

**Note**: The document is not saved to the database yet. It exists only in memory.

#### 3. Setting Fields

```python
new_doc.field1 = value1
new_doc.field2 = value2
```

**Purpose**: Populates the new document with data from the source document.

**Methods**:
- Direct assignment: `new_doc.field = value`
- Using `update()`: `new_doc.update({"field1": value1, "field2": value2})`

#### 4. Returning the Document

```python
return new_doc.as_dict()
```

**Purpose**: Returns the document as a dictionary so it can be used on the client side.

**Why `as_dict()`?**: 
- Converts the Document object to a plain dictionary
- Can be serialized to JSON
- Can be used by `frappe.model.sync()` on the client

---

## Complete Example: Creating Asset Maintenance from Asset

This is a real example from ERPNext. When viewing an Asset, you can create an Asset Maintenance record.

### Client-Side Code

**File**: `erpnext/erpnext/assets/doctype/asset/asset.js`

```javascript
create_asset_maintenance: function (frm) {
    frappe.call({
        args: {
            asset: frm.doc.name,
            item_code: frm.doc.item_code,
            item_name: frm.doc.item_name,
            asset_category: frm.doc.asset_category,
            company: frm.doc.company,
        },
        method: "erpnext.assets.doctype.asset.asset.create_asset_maintenance",
        callback: function (r) {
            var doclist = frappe.model.sync(r.message);
            frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        },
    });
}
```

### Server-Side Code

**File**: `erpnext/erpnext/assets/doctype/asset/asset.py`

```python
def create_asset_maintenance(asset, item_code, item_name, asset_category, company):
    asset_maintenance = frappe.new_doc("Asset Maintenance")
    asset_maintenance.update(
        {
            "asset_name": asset,
            "company": company,
            "item_code": item_code,
            "item_name": item_name,
            "asset_category": asset_category,
        }
    )
    return asset_maintenance
```

### Step-by-Step Explanation

#### Client-Side Flow

1. **User Action**: User clicks "Create Asset Maintenance" button on Asset form
2. **Function Called**: `create_asset_maintenance(frm)` is executed
3. **Data Collection**: Extracts relevant fields from `frm.doc`:
   - `asset`: The asset name
   - `item_code`: Item code from asset
   - `item_name`: Item name from asset
   - `asset_category`: Category from asset
   - `company`: Company from asset
4. **API Call**: `frappe.call()` sends data to server
5. **Response Handling**: When server responds:
   - `frappe.model.sync(r.message)` syncs the document
   - `frappe.set_route()` navigates to the new Asset Maintenance form

#### Server-Side Flow

1. **Method Receives Data**: Parameters from client-side call
2. **Document Creation**: `frappe.new_doc("Asset Maintenance")` creates new document
3. **Field Population**: `update()` method sets all fields at once
4. **Return**: Document is returned as dictionary (via `as_dict()`)

**Note**: The document is **not saved** in this example. It's returned as a draft for the user to review and save.

---

## Complete Example: Creating Asset Repair from Asset

This example shows a similar pattern with `@frappe.whitelist()` decorator.

### Client-Side Code

**File**: `erpnext/erpnext/assets/doctype/asset/asset.js`

```javascript
create_asset_repair: function (frm) {
    frappe.call({
        args: {
            company: frm.doc.company,
            asset: frm.doc.name,
            asset_name: frm.doc.asset_name,
        },
        method: "erpnext.assets.doctype.asset.asset.create_asset_repair",
        callback: function (r) {
            var doclist = frappe.model.sync(r.message);
            frappe.set_route("Form", doclist[0].doctype, doclist[0].name);
        },
    });
}
```

### Server-Side Code

**File**: `erpnext/erpnext/assets/doctype/asset/asset.py`

```python
@frappe.whitelist()
def create_asset_repair(company, asset, asset_name):
    asset_repair = frappe.new_doc("Asset Repair")
    asset_repair.update({
        "company": company,
        "asset": asset,
        "asset_name": asset_name
    })
    return asset_repair
```

### Key Differences from Previous Example

1. **Decorator**: This method has `@frappe.whitelist()` decorator
2. **Simpler Update**: Uses dictionary directly in `update()`
3. **Return**: Returns document directly (Python automatically converts to dict)

---

## Complete Example: Creating User from Employee

This example shows a more complex scenario with additional logic.

### Client-Side Code

**File**: `erpnext/erpnext/setup/doctype/employee/employee.js`

```javascript
create_user: function (frm) {
    if (!frm.doc.prefered_email) {
        frappe.throw(__("Please enter Preferred Contact Email"));
    }
    frappe.call({
        method: "erpnext.setup.doctype.employee.employee.create_user",
        args: {
            employee: frm.doc.name,
            email: frm.doc.prefered_email,
        },
        freeze: true,
        freeze_message: __("Creating User..."),
        callback: function (r) {
            frm.reload_doc();
        },
    });
}
```

### Server-Side Code

**File**: `erpnext/erpnext/setup/doctype/employee/employee.py`

```python
def create_user(employee, user=None, email=None):
    emp = frappe.get_doc("Employee", employee)

    # Parse employee name
    employee_name = emp.employee_name.split(" ")
    middle_name = last_name = ""

    if len(employee_name) >= 3:
        last_name = " ".join(employee_name[2:])
        middle_name = employee_name[1]
    elif len(employee_name) == 2:
        last_name = employee_name[1]

    first_name = employee_name[0]

    if email:
        emp.prefered_email = email

    # Create new User document
    user = frappe.new_doc("User")
    user.update({
        "name": emp.employee_name,
        "email": emp.prefered_email,
        "enabled": 1,
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "gender": emp.gender,
        "birth_date": emp.date_of_birth,
        "phone": emp.cell_number,
        "bio": emp.bio,
    })
    
    # Save the user
    user.insert()
    
    # Update employee with user_id
    emp.user_id = user.name
    emp.save()
    
    return user.name
```

### Key Differences

1. **Validation**: Client-side validates email before calling server
2. **Freeze UI**: Shows loading message during operation
3. **Complex Logic**: Server-side parses name and maps multiple fields
4. **Document Saved**: User document is actually saved (`user.insert()`)
5. **Parent Updated**: Employee document is updated with user_id
6. **Different Return**: Returns user name instead of document dict
7. **Reload Instead of Navigate**: Reloads current form instead of navigating

---

## Key Components Explained

### 1. frappe.call()

**Purpose**: Makes an asynchronous HTTP request to a server-side method.

**Syntax**:
```javascript
frappe.call({
    method: "module.path.to.method",
    args: { key: value },
    doc: frm.doc,
    callback: function(r) {},
    error: function(r) {},
    freeze: true,
    freeze_message: "Loading...",
})
```

**Parameters**:
- `method` (required): Full path to server-side method
- `args` (optional): Additional arguments as dictionary
- `doc` (optional): Current document (automatically sent)
- `callback` (optional): Function to execute on success
- `error` (optional): Function to execute on error
- `freeze` (optional): Freeze UI during call
- `freeze_message` (optional): Message to show when frozen

**Response Object (`r`)**:
- `r.message`: Data returned from server
- `r.exc`: Error message if any
- `r._server_messages`: Server messages

### 2. frappe.model.sync()

**Purpose**: Syncs a document dictionary to the local Frappe model.

**Syntax**:
```javascript
var doclist = frappe.model.sync(doc_dict);
// Returns array of synced documents
var doc = doclist[0];  // First document
```

**Why Use It?**:
- Makes document available in local model
- Enables navigation to the document
- Prepares document for form view

#### Detailed Explanation: What Does "Sync to Local Model" Mean?

**The Concept**:

Frappe maintains an in-memory store of documents on the client-side. `frappe.model.sync()` takes a plain JavaScript object (dictionary) from the server and adds it to this store, making it available for navigation, form loading, and other client-side operations.

**Breaking It Down**:

1. **Document Dictionary (from server)**: A plain JavaScript object with document data:
   ```javascript
   {
       doctype: "Asset Maintenance",
       name: "AMT-00001",
       asset_name: "ASSET-001",
       company: "Test Company",
       // ... other fields
   }
   ```

2. **Local Frappe Model (`locals`)**: A global JavaScript object that stores documents in memory:
   ```javascript
   locals = {
       "Asset Maintenance": {
           "AMT-00001": { /* document data */ },
           "AMT-00002": { /* another document */ }
       },
       "Asset": {
           "ASSET-001": { /* document data */ }
       },
       // ... other doctypes
   }
   ```

3. **What `sync()` Does**: Takes the dictionary and stores it in `locals`:
   ```javascript
   // Before sync
   locals["Asset Maintenance"] = {};  // Empty

   // Server returns document dictionary
   var doc_dict = {
       doctype: "Asset Maintenance",
       name: "AMT-00001",
       asset_name: "ASSET-001"
   };

   // After sync
   frappe.model.sync(doc_dict);

   // Now locals contains:
   locals["Asset Maintenance"]["AMT-00001"] = {
       doctype: "Asset Maintenance",
       name: "AMT-00001",
       asset_name: "ASSET-001"
   };
   ```

**Why This Matters**:

After syncing, the document becomes part of Frappe's client-side model, which enables:

1. **Navigation**: `frappe.set_route()` can open the document because it exists in `locals`
2. **Form Loading**: The form can load the document from `locals` instead of making another server call
3. **References**: Other code can access it via `locals[doctype][name]`
4. **Child Tables**: Child table rows are also synced recursively

**How It Works (Behind the Scenes)**:

The `sync()` function:
1. Normalizes input (handles single doc or array of docs)
2. Checks if document already exists in `locals`
   - If exists: Updates the existing document (`update_in_locals`)
   - If new: Adds to `locals` (`add_to_locals`)
3. Recursively processes child tables
4. Syncs metadata if it's a DocType
5. Returns the synced documents

**Real Example**:

```javascript
// Server returns this dictionary:
r.message = {
    doctype: "Asset Maintenance",
    name: "AMT-00001",
    asset_name: "ASSET-001",
    company: "Test Company"
};

// Sync it
var doclist = frappe.model.sync(r.message);
// Now locals["Asset Maintenance"]["AMT-00001"] exists

// Navigate to it
frappe.set_route("Form", "Asset Maintenance", "AMT-00001");
// Frappe can now load this document from locals!
```

**Visual Representation**:

```
┌─────────────────────────────────────────┐
│  Server Response (Dictionary)           │
│  {                                      │
│    doctype: "Asset Maintenance",        │
│    name: "AMT-00001",                   │
│    asset_name: "ASSET-001"              │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               │ frappe.model.sync()
               ▼
┌─────────────────────────────────────────┐
│  Local Frappe Model (locals)             │
│  locals = {                             │
│    "Asset Maintenance": {               │
│      "AMT-00001": {                     │
│        doctype: "Asset Maintenance",   │
│        name: "AMT-00001",               │
│        asset_name: "ASSET-001"          │
│      }                                  │
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘
```

**Summary**:

"Syncs a document dictionary to the local Frappe model" means:
- Taking a plain JavaScript object (dictionary) from the server
- Storing it in the `locals` global object
- Making it available for navigation, form loading, and other client-side operations
- Handling child tables and metadata automatically

Without syncing, the document dictionary is just data. After syncing, it becomes part of Frappe's client-side model and can be used throughout the application.

**In Your Code**:

```javascript
callback: function (r) {
    // r.message is just a dictionary at this point
    var doc = frappe.model.sync(r.message)[0];
    // Now it's in locals and can be navigated to
    frappe.set_route("Form", doc.doctype, doc.name);
}
```

The `sync()` call is what makes navigation possible. Without it, `frappe.set_route()` wouldn't know about the document.

### 3. frappe.set_route()

**Purpose**: Navigates to a specific route in the application.

**Syntax**:
```javascript
frappe.set_route("Form", doctype, docname);
frappe.set_route("List", doctype);
frappe.set_route("Form", doctype, docname, { field: value });
```

**Parameters**:
- Route type: "Form", "List", "Report", etc.
- DocType name
- Document name (for Form)
- Query parameters (optional)

### 4. @frappe.whitelist()

**Purpose**: Decorator that makes a Python function callable from client-side JavaScript.

**Syntax**:
```python
@frappe.whitelist()
def my_method(param1, param2):
    return result
```

**Important Notes**:
- Without this decorator, method cannot be called from `frappe.call()`
- Method must accept parameters that match what's sent from client
- Can use `self` if it's a method in a DocType class
- Can be a standalone function

### 5. frappe.new_doc()

**Purpose**: Creates a new, unsaved document instance.

**Syntax**:
```python
new_doc = frappe.new_doc("DocType Name")
```

**Returns**: Document object (not saved to database)

**Common Operations**:
```python
# Set fields individually
new_doc.field1 = value1
new_doc.field2 = value2

# Set multiple fields at once
new_doc.update({
    "field1": value1,
    "field2": value2,
})

# Add child table rows
new_doc.append("child_table", {
    "field1": value1,
    "field2": value2,
})
```

### 6. as_dict()

**Purpose**: Converts a Document object to a dictionary.

**Syntax**:
```python
doc_dict = doc.as_dict()
```

**Why Needed?**:
- Documents cannot be directly serialized to JSON
- Dictionary can be sent over HTTP
- Client-side can use dictionary data

**What It Includes**:
- All document fields
- Child table data
- Metadata (doctype, name, etc.)

---

## Best Practices

### 1. Always Use @frappe.whitelist()

```python
#  Good
@frappe.whitelist()
def create_related_doc(self):
    pass

#  Bad - won't work from client-side
def create_related_doc(self):
    pass
```

### 2. Validate Input on Client-Side

```javascript
//  Good - validate before calling server
create_user: function (frm) {
    if (!frm.doc.email) {
        frappe.throw(__("Email is required"));
        return;
    }
    frappe.call({...});
}

//  Bad - no validation
create_user: function (frm) {
    frappe.call({...});
}
```

### 3. Use Meaningful Method Names

```python
#  Good - clear and descriptive
@frappe.whitelist()
def create_asset_maintenance(asset, company):
    pass

#  Bad - unclear purpose
@frappe.whitelist()
def make_doc(asset, company):
    pass
```

### 4. Handle Errors Gracefully

```javascript
//  Good - handle errors
frappe.call({
    method: "create_doc",
    callback: function(r) {
        if (!r.exc) {
            // Success handling
        }
    },
    error: function(r) {
        frappe.msgprint(__("Error creating document"));
    }
});
```

### 5. Use freeze for Long Operations

```javascript
//  Good - show loading indicator
frappe.call({
    method: "create_doc",
    freeze: true,
    freeze_message: __("Creating document..."),
    callback: function(r) {}
});
```

### 6. Return Document for Navigation

```python
#  Good - return document for navigation
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = value
    return new_doc  # or new_doc.as_dict()

#  Bad - returns only name, can't navigate
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.insert()
    return new_doc.name  # Can't navigate to this
```

### 7. Use update() for Multiple Fields

```python
#  Good - clean and readable
new_doc.update({
    "field1": value1,
    "field2": value2,
    "field3": value3,
})

#  Bad - verbose
new_doc.field1 = value1
new_doc.field2 = value2
new_doc.field3 = value3
```

### 8. Don't Save Unless Necessary

```python
#  Good - return draft for user to review
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = value
    return new_doc  # User can review before saving

# ⚠️ Use with caution - auto-saves
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = value
    new_doc.insert()  # Saves immediately
    return new_doc
```

---

## Common Patterns and Variations

### Pattern 1: Simple Creation (No Save)

**Use Case**: Create draft document for user to review

```javascript
// Client
create_doc: function(frm) {
    frappe.call({
        method: "create_doc",
        callback: function(r) {
            var doc = frappe.model.sync(r.message)[0];
            frappe.set_route("Form", doc.doctype, doc.name);
        }
    });
}
```

```python
# Server
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = self.field
    return new_doc
```

### Pattern 2: Creation with Save

**Use Case**: Create and save document immediately

```javascript
// Client
create_doc: function(frm) {
    frappe.call({
        method: "create_doc",
        callback: function(r) {
            frappe.msgprint(__("Document created: {0}", [r.message]));
            frm.reload_doc();
        }
    });
}
```

```python
# Server
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = self.field
    new_doc.insert()
    return new_doc.name
```

### Pattern 3: Creation with Child Tables

**Use Case**: Create document with child table rows

```python
# Server
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    new_doc.field = self.field
    
    # Add child table rows
    for item in self.items:
        new_doc.append("items", {
            "item_code": item.item_code,
            "qty": item.qty,
        })
    
    return new_doc
```

### Pattern 4: Conditional Creation

**Use Case**: Create document only if certain conditions are met

```javascript
// Client
create_doc: function(frm) {
    if (frm.doc.status !== "Approved") {
        frappe.msgprint(__("Document must be approved first"));
        return;
    }
    
    frappe.call({
        method: "create_doc",
        callback: function(r) {
            var doc = frappe.model.sync(r.message)[0];
            frappe.set_route("Form", doc.doctype, doc.name);
        }
    });
}
```

### Pattern 5: Creation with Dialog

**Use Case**: Get additional input from user before creating

```javascript
// Client
create_doc: function(frm) {
    let d = new frappe.ui.Dialog({
        title: __("Create Document"),
        fields: [
            {
                label: "Additional Field",
                fieldname: "additional_field",
                fieldtype: "Data"
            }
        ],
        primary_action: function(values) {
            frappe.call({
                method: "create_doc",
                args: {
                    additional_field: values.additional_field
                },
                callback: function(r) {
                    var doc = frappe.model.sync(r.message)[0];
                    frappe.set_route("Form", doc.doctype, doc.name);
                    d.hide();
                }
            });
        }
    });
    d.show();
}
```

### Pattern 6: Using doc Parameter

**Use Case**: Access entire current document on server

```javascript
// Client
create_doc: function(frm) {
    frappe.call({
        doc: frm.doc,  // Sends entire document
        method: "create_doc",
        callback: function(r) {
            var doc = frappe.model.sync(r.message)[0];
            frappe.set_route("Form", doc.doctype, doc.name);
        }
    });
}
```

```python
# Server - receives document as 'doc' parameter
@frappe.whitelist()
def create_doc(doc):
    source_doc = frappe.get_doc(json.loads(doc))
    new_doc = frappe.new_doc("DocType")
    new_doc.field = source_doc.field
    return new_doc
```

---

## Troubleshooting

### Issue: Method Not Found

**Error**: `Method not found` or `404 Not Found`

**Causes**:
1. Missing `@frappe.whitelist()` decorator
2. Incorrect method path
3. Method not accessible

**Solutions**:
```python
#  Ensure decorator is present
@frappe.whitelist()
def create_doc(self):
    pass

#  Check method path matches
# Client: "app.module.doctype.doctype.create_doc"
# Server: @frappe.whitelist() def create_doc(self):
```

### Issue: Document Not Navigating

**Error**: Document created but doesn't navigate

**Causes**:
1. Not returning document from server
2. Not using `frappe.model.sync()`
3. Incorrect route parameters

**Solutions**:
```javascript
//  Correct pattern
callback: function(r) {
    var doc = frappe.model.sync(r.message)[0];
    frappe.set_route("Form", doc.doctype, doc.name);
}

//  Wrong - missing sync
callback: function(r) {
    frappe.set_route("Form", r.message.doctype, r.message.name);
}
```

### Issue: Fields Not Set

**Error**: New document created but fields are empty

**Causes**:
1. Field names don't match
2. Values not passed correctly
3. Document not updated

**Solutions**:
```python
#  Verify field names match DocType
new_doc.update({
    "correct_field_name": value,  # Check fieldname in DocType
})

#  Verify values are passed
@frappe.whitelist()
def create_doc(field_value):  # Parameter name matches
    new_doc = frappe.new_doc("DocType")
    new_doc.field = field_value
    return new_doc
```

### Issue: Permission Denied

**Error**: `Permission denied` or `403 Forbidden`

**Causes**:
1. User doesn't have permission to create document
2. Method not whitelisted properly

**Solutions**:
- Check user permissions for target DocType
- Ensure `@frappe.whitelist()` is present
- Check if method needs additional permission checks

### Issue: Document Already Exists

**Error**: Document with same name already exists

**Solutions**:
```python
#  Check before creating
@frappe.whitelist()
def create_doc(self):
    if frappe.db.exists("DocType", {"field": self.field}):
        frappe.throw(__("Document already exists"))
    
    new_doc = frappe.new_doc("DocType")
    new_doc.field = self.field
    return new_doc
```

### Issue: Child Table Not Populated

**Error**: Document created but child table is empty

**Solutions**:
```python
#  Use append() for child tables
@frappe.whitelist()
def create_doc(self):
    new_doc = frappe.new_doc("DocType")
    
    for item in self.items:
        new_doc.append("items", {
            "item_code": item.item_code,
            "qty": item.qty,
        })
    
    return new_doc
```

---

## Summary

### Key Takeaways

1. **Two-Part Pattern**: Client-side JavaScript + Server-side Python
2. **Communication**: `frappe.call()` connects client and server
3. **Document Creation**: `frappe.new_doc()` creates new documents
4. **Navigation**: `frappe.set_route()` navigates to new document
5. **Whitelisting**: `@frappe.whitelist()` makes methods accessible

### Common Flow

```
User Action
    ↓
Client Function (JavaScript)
    ↓
frappe.call() → Server Method (Python)
    ↓
frappe.new_doc() → Create Document
    ↓
Return Document
    ↓
frappe.model.sync() → Sync to Model
    ↓
frappe.set_route() → Navigate
```

### When to Use This Pattern

-  Creating related documents from current document
-  Pre-filling forms with related data
-  Implementing workflow actions
-  Reducing manual data entry
-  Maintaining data consistency