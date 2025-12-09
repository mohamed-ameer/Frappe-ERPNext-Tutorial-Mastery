# Frappe Fields - Complete Documentation

## Table of Contents
1. [Glossary: Key Terms Explained](#glossary-key-terms-explained)
2. [What are Fields?](#what-are-fields)
3. [Where are Fields Stored?](#where-are-fields-stored)
4. [Are Fields DocTypes?](#are-fields-doctypes)
5. [Complete List of Field Types](#complete-list-of-field-types)
6. [Common Field Properties](#common-field-properties)
7. [Field Type Details](#field-type-details)
8. [How Fields Work Behind the Scenes](#how-fields-work-behind-the-scenes)

---

## Glossary: Key Terms Explained

Before diving deep into fields, let's understand the fundamental technical terms used throughout this guide:

### **Field**
**What it is:** A field is a single piece of data definition within a DocType. Think of it as a column definition in a database table, but with much more functionality. Each field defines:
- What type of data it stores (text, number, date, etc.)
- How it appears in forms
- What validations apply
- How it relates to other data

**Why it matters:** Fields are the building blocks of all data structures in Frappe. Without fields, DocTypes would have no structure or data storage capability.

**Example:** In a Customer DocType, `customer_name` is a field that stores the customer's name as text.

### **DocType**
**What it is:** A DocType is Frappe's fundamental data structure - essentially a database table definition with enhanced features. Every document (like a Customer record, Sales Invoice, etc.) is based on a DocType.

**Why it matters:** Fields belong to DocTypes. You can't have a field without a DocType. DocTypes define the overall structure, and fields define the individual pieces of data within that structure.

**Example:** "Customer" is a DocType that contains fields like `customer_name`, `email`, `phone`, etc.

### **DocField**
**What it is:** DocField is a special DocType in Frappe that stores field definitions. Each field you create in a DocType becomes a document in the DocField DocType. This is meta-programming - a DocType (DocField) that stores definitions of fields for other DocTypes.

**Why it matters:** This is how Frappe stores field metadata. When you create a field in a DocType, Frappe creates a DocField document that contains all the field's properties (fieldtype, label, options, etc.).

**Storage:** DocField documents are stored in the `tabDocField` database table.

**Example:** When you add a `customer_name` field to Customer DocType, Frappe creates a DocField document with:
- `parent`: "Customer"
- `fieldname`: "customer_name"
- `fieldtype`: "Data"
- `label`: "Customer Name"
- etc.

### **Fieldtype**
**What it is:** Fieldtype is the data type of a field - it determines what kind of data the field can store and how it behaves. Frappe supports 47 different fieldtypes.

**Why it matters:** Fieldtype determines:
- Database column type (varchar, int, datetime, etc.)
- Form input widget (text box, date picker, dropdown, etc.)
- Validation rules
- How data is stored and retrieved

**Example:** A field with `fieldtype: "Date"` stores dates, shows a date picker in forms, and validates that the value is a valid date.

### **Metadata (Meta)**
**What it is:** Metadata is "data about data" - information that describes other data. In Frappe, Meta refers to the complete definition of a DocType, including all its fields, permissions, workflows, etc.

**Why it matters:** Frappe uses Meta objects to understand DocType structure at runtime. When you call `frappe.get_meta("Customer")`, you get a Meta object containing all field definitions, validations, and other metadata.

**How it works:** Meta objects are cached for performance and loaded from DocField records in the database.

**Example:**
```python
meta = frappe.get_meta("Customer")
# meta now contains all Customer DocType information:
# - All fields and their properties
# - Permissions
# - Validations
# - Workflows
# etc.
```

### **Child Table**
**What it is:** A child table is a special field type (`fieldtype: "Table"`) that allows a document to have multiple related rows. It's like a one-to-many relationship in databases.

**Why it matters:** Child tables enable complex data structures. For example, a Sales Invoice can have multiple line items (each item is a row in the child table).

**How it works:** Child tables are stored as separate documents in their own DocType, linked to the parent through `parent`, `parenttype`, and `parentfield` fields.

**Example:** Sales Invoice has a child table `items` (fieldtype: "Table", options: "Sales Invoice Item"). Each row in `items` is a separate Sales Invoice Item document.

### **Link Field**
**What it is:** A Link field (`fieldtype: "Link"`) creates a relationship between two DocTypes. It stores a reference (the name/ID) to another document.

**Why it matters:** Link fields enable relationships between documents. They're essential for building complex data models and maintaining referential integrity.

**How it works:** Link fields store the document name (ID) of the linked document. Frappe validates that the linked document exists and can filter options based on `link_filters`.

**Example:** Sales Invoice has `customer` field (Link to Customer DocType). It stores the Customer document's name (like "_Test Customer"), not the full customer data.

### **Database Schema**
**What it is:** Database schema refers to the structure of database tables - what columns exist, their types, constraints, indexes, etc.

**Why it matters:** Frappe automatically creates database tables based on DocType field definitions. Each field (except virtual fields) becomes a database column.

**How it works:** When you create or modify a DocType, Frappe:
1. Reads field definitions from DocField records
2. Determines appropriate database column types
3. Creates or alters database tables accordingly

**Example:** A Customer DocType with `customer_name` (Data field) creates a `tabCustomer` table with a `customer_name` VARCHAR column.

### **Virtual Field**
**What it is:** A virtual field (`is_virtual: 1`) is a field that doesn't exist in the database. Its value is computed on-the-fly when accessed.

**Why it matters:** Virtual fields allow computed values without storing them. They're useful for calculated fields, formatted displays, or values derived from other fields.

**How it works:** Virtual fields are defined in DocType but don't create database columns. Their values are computed in Python code when the document is loaded.

**Example:** A `full_name` virtual field that concatenates `first_name` and `last_name` fields.

### **Field Validation**
**What it is:** Field validation ensures data integrity by checking that field values meet certain criteria before saving.

**Why it matters:** Validation prevents invalid data from being stored, ensuring data quality and application reliability.

**Types of validation:**
- **Type validation**: Ensures data matches fieldtype (e.g., date fields only accept dates)
- **Required validation**: Ensures mandatory fields have values
- **Unique validation**: Ensures no duplicate values
- **Custom validation**: Python/JavaScript code that checks business rules

**Example:** A `email` field validates that the value matches email format before saving.

### **Fetch From**
**What it is:** `fetch_from` is a field property that automatically copies a value from a linked document when the link field changes.

**Why it matters:** Reduces data entry and ensures consistency. Instead of manually entering customer details, you can fetch them from the linked Customer document.

**How it works:** When a Link field value changes, Frappe reads the specified field from the linked document and populates the current field.

**Example:** `fetch_from: "customer.customer_name"` automatically fills the customer name when a customer is selected.

### **Depends On**
**What it is:** `depends_on` is a JavaScript expression that controls field visibility. Fields are shown or hidden based on other field values.

**Why it matters:** Creates dynamic, context-aware forms. Fields appear only when relevant, improving user experience.

**How it works:** Frappe evaluates the JavaScript expression. If it returns `true`, the field is shown; if `false`, it's hidden.

**Example:** `depends_on: "eval:doc.status=='Active'"` shows the field only when status is "Active".

### **Permission Level (permlevel)**
**What it is:** Permission level is a number (0-9) that controls field-level access permissions. Higher numbers mean more restricted access.

**Why it matters:** Enables fine-grained access control. Different user roles can see/edit different sets of fields.

**How it works:** Permissions are defined in DocPerm records. Fields with higher permlevel require higher permission levels to access.

**Example:** `permlevel: 1` means only users with permission level 1 or higher can see/edit this field.

### **Custom Field**
**What it is:** A custom field is a field added to an existing DocType by users (not defined in the DocType's original JSON file).

**Why it matters:** Allows extending DocTypes without modifying core code. Custom fields are stored separately from standard fields.

**How it works:** Custom fields are stored in the `Custom Field` DocType and merged with standard fields when Meta is loaded.

**Example:** Adding a `custom_notes` field to the Customer DocType creates a Custom Field document.

### **Property Setter**
**What it is:** A Property Setter allows modifying field properties (like making a field mandatory, changing its label, etc.) without editing the DocType JSON file.

**Why it matters:** Enables customization without code changes. Useful for modifying core DocTypes.

**How it works:** Property Setters override field properties when Meta is loaded. They're stored in the `Property Setter` DocType.

**Example:** A Property Setter can make the `customer_name` field bold or change its default value.

### **Naming Series**
**What it is:** Naming series is a pattern used to automatically generate document names/IDs (like "SINV-00001", "SINV-00002").

**Why it matters:** Provides consistent, readable document IDs instead of random hashes.

**How it works:** Frappe maintains counters for each naming series pattern and increments them when creating new documents.

**Example:** `naming_series: "SINV-"` generates names like "SINV-00001", "SINV-00002".

### **Database Column**
**What it is:** A database column is a single data storage location in a database table. Each field (except virtual fields) creates a database column.

**Why it matters:** Fields map directly to database columns. Understanding this helps you understand how data is stored.

**How it works:** Frappe's schema system creates appropriate column types based on fieldtype:
- Data → VARCHAR
- Int → INT or BIGINT
- Date → DATE
- Datetime → DATETIME
- etc.

**Example:** `customer_name` field (Data type, length 140) creates `customer_name VARCHAR(140)` column.

### **Form**
**What it is:** A form is the user interface for creating and editing documents. Forms are automatically generated from DocType field definitions.

**Why it matters:** Fields determine how forms look and behave. Field properties control form layout, validation, and interactivity.

**How it works:** Frappe's form builder reads field definitions and generates HTML forms with appropriate input widgets.

**Example:** A Date field shows a date picker, a Link field shows a searchable dropdown, a Table field shows an editable grid.

### **List View**
**What it is:** List view is the table/grid view showing multiple documents. Fields with `in_list_view: 1` appear as columns.

**Why it matters:** Controls what information users see when browsing documents. Too many columns can slow down list views.

**How it works:** Frappe queries documents and displays selected fields as columns. Only fields marked `in_list_view: 1` appear.

**Example:** Customer list view might show: Name, Email, Phone, City columns.

### **Global Search**
**What it is:** Global search allows searching across all documents. Fields with `in_global_search: 1` are included in search results.

**Why it matters:** Makes documents discoverable. Users can find documents by searching for values in searchable fields.

**How it works:** Frappe indexes fields marked for global search and searches them when users perform global searches.

**Example:** Searching for "John" finds customers, contacts, or any document with "John" in a globally searchable field.

### **Cache**
**What it is:** Cache is temporary storage for frequently accessed data. Frappe caches Meta objects (DocType definitions) for performance.

**Why it matters:** Loading Meta from database every time would be slow. Caching makes DocType access fast.

**How it works:** When you call `frappe.get_meta()`, Frappe checks cache first. If not found, loads from database and caches the result.

**Example:** First call to `frappe.get_meta("Customer")` loads from database, subsequent calls use cache.

### **JSON (JavaScript Object Notation)**
**What it is:** JSON is a lightweight data format used to store and exchange data. Frappe uses JSON files to define DocTypes and fields.

**Why it matters:** DocType definitions are stored as JSON files. Understanding JSON helps you understand how DocTypes are structured.

**Format:** JSON uses `{}` for objects, `[]` for arrays, and key-value pairs.

**Example:**
```json
{
  "fieldname": "customer_name",
  "fieldtype": "Data",
  "label": "Customer Name"
}
```

---

## What are Fields?

Fields are the fundamental building blocks of DocTypes in Frappe. Every DocType consists of fields, and each field represents a piece of data with its own properties and behavior.

**In Simple Terms:** Think of a DocType as a form or table structure, and fields as the individual questions/columns in that form. Each field defines one piece of information you want to collect or store.

**Analogy:** If a DocType is like a paper form, fields are the individual questions on that form. Each question (field) has:
- A label (what it asks)
- A type (how to answer - text, number, date, etc.)
- Rules (is it required? can it be empty? etc.)

Fields define five critical aspects:

### 1. **Data Structure**: What type of data can be stored

Fields determine what kind of data you can store:
- **Text fields** store strings (names, descriptions, etc.)
- **Number fields** store numeric values (quantities, prices, etc.)
- **Date fields** store dates and times
- **Link fields** store references to other documents
- **Table fields** store multiple related rows

**Why this matters:** The fieldtype determines:
- What values are valid (a Date field won't accept "hello")
- How data is stored in the database (VARCHAR, INT, DATE, etc.)
- What input widget appears in forms (text box, date picker, dropdown, etc.)

**Example:** A `customer_name` field with `fieldtype: "Data"` stores text strings like "Acme Corporation", while a `quantity` field with `fieldtype: "Int"` stores whole numbers like 10, 25, 100.

### 2. **Validation Rules**: Constraints and validations applied to the data

Fields enforce data quality through validation:
- **Required fields** (`reqd: 1`) must have values before saving
- **Unique fields** (`unique: 1`) prevent duplicate values
- **Type validation** ensures data matches fieldtype
- **Custom validation** can enforce business rules

**Why this matters:** Validation prevents invalid or incomplete data from being saved, ensuring data integrity and application reliability.

**Example:** An `email` field validates that the value matches email format (contains @, valid domain, etc.). A `quantity` field with `non_negative: 1` prevents negative numbers.

### 3. **User Interface**: How the field appears and behaves in forms

Fields control form appearance and behavior:
- **Input widgets**: Text boxes, date pickers, dropdowns, checkboxes, etc.
- **Layout**: Field width, position, grouping in sections/tabs
- **Interactivity**: Show/hide based on other fields, auto-fill values, etc.
- **Styling**: Bold labels, colors, icons, etc.

**Why this matters:** Good UI/UX makes applications user-friendly. Fields determine how users interact with data.

**Example:** A Date field shows a calendar picker, a Link field shows a searchable dropdown, a Table field shows an editable grid.

### 4. **Database Schema**: How data is stored in the database

Fields map directly to database columns:
- Each field (except virtual fields) creates a database column
- Fieldtype determines column type (VARCHAR, INT, DATE, etc.)
- Field properties determine column constraints (NOT NULL, UNIQUE, etc.)

**Why this matters:** Understanding database mapping helps with:
- Performance optimization (indexes, column types)
- Data migration
- Query optimization
- Understanding data storage

**Example:** A `customer_name` field (Data type, length 140) creates `customer_name VARCHAR(140)` column. An `amount` field (Currency type, precision 2) creates `amount DECIMAL(18,2)` column.

### 5. **Business Logic**: Relationships, dependencies, and computed values

Fields enable business logic:
- **Link fields** create relationships between documents
- **Fetch from** automatically copies values from linked documents
- **Depends on** shows/hides fields based on conditions
- **Virtual fields** compute values dynamically
- **Default values** pre-fill fields

**Why this matters:** Business logic automates workflows, reduces data entry, and ensures consistency.

**Example:** When you select a Customer in Sales Invoice, `fetch_from: "customer.email"` automatically fills the customer's email. `depends_on: "eval:doc.status=='Active'"` shows fields only for active documents.

### How Fields Control Everything

Fields are central to Frappe's architecture:

1. **Form Generation**: Frappe reads field definitions and generates forms automatically
2. **Database Creation**: Frappe creates database tables based on field definitions
3. **Validation**: Field properties determine what validations run
4. **Permissions**: Fields can have permission levels controlling access
5. **Reports**: Fields determine what data appears in reports
6. **API**: Fields define API response structure

**The Complete Flow:**

```
Field Definition (DocField)
    ↓
Meta Object (cached)
    ↓
    ├─→ Form Generation (UI)
    ├─→ Database Schema (Storage)
    ├─→ Validation Rules (Data Quality)
    ├─→ Permissions (Access Control)
    └─→ Business Logic (Automation)
```

Fields are defined in the DocType's metadata (stored as DocField documents) and control everything from form layout to data validation to database column creation. Understanding fields is essential for effective Frappe development.

---

## Where are Fields Stored?

Fields are stored in the **`DocField`** DocType, which is a core Frappe DocType. Each field definition is a document in the `DocField` table.

**What is DocField?** DocField is a meta-DocType - a DocType that stores definitions of fields for other DocTypes. This is Frappe's way of storing field metadata in the database.

**Why store fields as documents?** This approach enables:
- Dynamic field creation/modification without code changes
- Custom fields that extend existing DocTypes
- Field property modifications through Property Setters
- Version control and audit trails of field changes

### Storage Structure

#### Database Level

- **Database Table**: `tabDocField`
  - This is the actual database table where field definitions are stored
  - Located in your Frappe database (MariaDB/PostgreSQL)
  - Contains all fields from all DocTypes

- **DocType Name**: `DocField`
  - This is the Frappe DocType name
  - Used when accessing fields programmatically: `frappe.get_doc("DocField", field_name)`

- **File Location**: `apps/frappe/frappe/core/doctype/docfield/`
  - Contains the DocField DocType definition files:
    - `docfield.json` - DocType definition
    - `docfield.py` - Python controller (if any)
    - `docfield.js` - JavaScript client-side code (if any)

#### Parent-Child Relationship

Fields belong to DocTypes through a parent-child relationship:

- **`parent`**: Stores the DocType name this field belongs to
  - Example: `parent: "Customer"` means this field belongs to Customer DocType
  - This links the field to its DocType

- **`parenttype`**: Always `"DocType"`
  - Indicates that the parent is a DocType (not another document type)
  - This is consistent for all DocField records

- **`parentfield`**: Always `"fields"`
  - Indicates this field is part of the "fields" child table in the DocType
  - DocType has a child table field called "fields" that contains all DocField records

**Understanding the Relationship:**

```
DocType (Customer)
    │
    ├─→ Child Table: "fields"
            │
            ├─→ DocField 1: customer_name
            ├─→ DocField 2: email
            ├─→ DocField 3: phone
            └─→ DocField 4: address
```

### Field Storage Details

When you create a DocType, Frappe performs these steps:

#### Step 1: Create DocType Record

Frappe creates a record in the `tabDocType` table:
```sql
INSERT INTO tabDocType (name, module, custom, ...)
VALUES ('Customer', 'Selling', 0, ...);
```

This record stores DocType-level information:
- DocType name
- Module it belongs to
- Whether it's custom or standard
- Permissions, workflows, etc.

#### Step 2: Create DocField Records

For each field in the DocType, Frappe creates a record in `tabDocField`:

```sql
-- Example: customer_name field
INSERT INTO tabDocField (
    name,                    -- Unique ID (hash)
    parent,                  -- "Customer"
    parenttype,              -- "DocType"
    parentfield,             -- "fields"
    fieldname,               -- "customer_name"
    fieldtype,               -- "Data"
    label,                   -- "Customer Name"
    reqd,                    -- 0 or 1
    length,                  -- 140
    -- ... all other field properties
)
VALUES (
    'abc123...',             -- Generated hash
    'Customer',
    'DocType',
    'fields',
    'customer_name',
    'Data',
    'Customer Name',
    1,                       -- Required
    140,
    -- ... other values
);
```

#### Step 3: Field Properties Storage

Each `DocField` record stores all field properties:

**Basic Properties:**
- `fieldname`: Internal name (e.g., "customer_name")
- `label`: Display label (e.g., "Customer Name")
- `fieldtype`: Data type (e.g., "Data", "Link", "Date")
- `options`: Fieldtype-specific options (DocType name for Link, options list for Select, etc.)

**Validation Properties:**
- `reqd`: Required (0 or 1)
- `unique`: Unique constraint (0 or 1)
- `non_negative`: Prevent negative numbers (0 or 1)
- `length`: Maximum length for text fields
- `precision`: Decimal places for numeric fields

**Display Properties:**
- `hidden`: Hide in forms (0 or 1)
- `read_only`: Read-only field (0 or 1)
- `bold`: Bold label (0 or 1)
- `width`: Field width
- `depends_on`: Conditional display expression

**And many more...** (See Common Field Properties section for complete list)

### How Fields are Loaded

When Frappe needs field information, it:

1. **Loads DocField Records**: Queries `tabDocField` table filtering by `parent = "DocTypeName"`
2. **Creates Meta Object**: Builds a Meta object containing all field definitions
3. **Caches Meta**: Stores Meta in cache for performance
4. **Merges Custom Fields**: Adds any Custom Field records
5. **Applies Property Setters**: Applies any property overrides

**Code Flow:**
```python
# When you call:
meta = frappe.get_meta("Customer")

# Frappe internally:
# 1. Checks cache first
# 2. If not cached, queries:
frappe.db.get_all("DocField", 
    filters={"parent": "Customer", "parenttype": "DocType", "parentfield": "fields"},
    order_by="idx"
)
# 3. Builds Meta object from results
# 4. Caches Meta object
# 5. Returns Meta object
```

### Standard vs Custom Fields

**Standard Fields:**
- Defined in DocType JSON files (`doctype_name.json`)
- Stored in `tabDocField` table
- Part of the application code
- Version controlled in git

**Custom Fields:**
- Created by users through UI or code
- Stored in `tabCustom Field` table (separate DocType)
- Merged with standard fields when Meta is loaded
- Can be added to any DocType without code changes

**How They're Merged:**
```python
# In Meta class (frappe/model/meta.py)
def add_custom_fields(self):
    # Loads Custom Field records
    custom_fields = frappe.get_all("Custom Field", 
        filters={"dt": self.name}
    )
    # Merges them with standard fields
    self.fields.extend(custom_fields)
```

### Field Index (idx)

Each DocField has an `idx` property that determines field order:

- **Purpose**: Controls the order fields appear in forms
- **Format**: Integer starting from 1
- **Usage**: Lower idx values appear first
- **Auto-increment**: Frappe automatically assigns idx when creating fields

**Example:**
```
idx: 1  → customer_name (appears first)
idx: 2  → email (appears second)
idx: 3  → phone (appears third)
```

This ensures consistent field ordering across forms and list views.

### Accessing Fields Programmatically

```python
# Get all fields for a DocType
meta = frappe.get_meta("Sales Invoice")
fields = meta.fields

# Get a specific field
field = meta.get_field("customer")

# Access field properties
print(field.fieldtype)  # "Link"
print(field.options)    # "Customer"
print(field.reqd)       # 1 (mandatory)
```

---

## Are Fields DocTypes?

**Yes, fields are stored as DocType records**, but they are **child table records**, not standalone DocTypes.

(remember that in frappe everything is a document of certain type, everything is a `Doctype` even the Fields)

### Understanding the Relationship

1. **DocType** is a DocType (meta-doctype)
2. **DocField** is a DocType (meta-doctype for fields)
3. Fields are **child table records** of DocType:
   - The `DocType` DocType has a child table field called `fields`
   - Each field is a record in the `DocField` DocType
   - These records are linked to their parent DocType via `parent`, `parenttype`, and `parentfield`

### DocField Structure

```json
{
  "doctype": "DocField",
  "parent": "Sales Invoice",
  "parenttype": "DocType",
  "parentfield": "fields",
  "fieldname": "customer",
  "fieldtype": "Link",
  "label": "Customer",
  "options": "Customer",
  "reqd": 1,
  ...
}
```

### Custom Fields

Custom fields are stored in the **`Custom Field`** DocType, which is similar to `DocField` but for user-created custom fields added to existing DocTypes.

---

## Complete List of Field Types

Frappe supports **47 field types** organized into categories:

### Data Field Types (Store Values)
1. **Autocomplete** - Text input with autocomplete suggestions
2. **Attach** - File attachment field
3. **Attach Image** - Image attachment field with preview
4. **Barcode** - Barcode scanner and display
5. **Check** - Boolean checkbox (0/1)
6. **Code** - Code editor with syntax highlighting
7. **Color** - Color picker
8. **Currency** - Currency amount with precision
9. **Data** - Single-line text input
10. **Date** - Date picker
11. **Datetime** - Date and time picker
12. **Duration** - Time duration (hours, minutes, seconds)
13. **Dynamic Link** - Link to any DocType based on another field
14. **Float** - Decimal number
15. **Geolocation** - GPS coordinates (latitude/longitude)
16. **HTML Editor** - Rich text editor with HTML support
17. **Icon** - Icon picker
18. **Int** - Integer number
19. **JSON** - JSON data storage
20. **Link** - Link to another DocType
21. **Long Text** - Multi-line text area
22. **Markdown Editor** - Markdown editor
23. **Password** - Password input (masked)
24. **Percent** - Percentage value
25. **Phone** - Phone number input
26. **Rating** - Star rating (1-5)
27. **Read Only** - Display-only field
28. **Select** - Dropdown selection
29. **Signature** - Digital signature capture
30. **Small Text** - Short text (up to 140 characters)
31. **Text** - Multi-line text
32. **Text Editor** - Rich text editor
33. **Time** - Time picker

### Layout Field Types (No Data Storage)
34. **Section Break** - Visual section divider
35. **Column Break** - Column divider for multi-column layouts
36. **Tab Break** - Tab divider
37. **Fold** - Collapsible section
38. **Heading** - Section heading

### Display Field Types (No Data Storage)
39. **HTML** - HTML content display
40. **Button** - Action button
41. **Image** - Image display

### Table Field Types (Child Tables)
42. **Table** - Child table (one-to-many relationship)
43. **Table MultiSelect** - Multi-select child table

### Special Field Types
44. **JSON** - Structured JSON data
45. **Geolocation** - Geographic coordinates

---

## Common Field Properties

All fields share a common set of properties. Below is a comprehensive list with detailed explanations:

### Basic Properties

#### `fieldname` (Data)
- **Type**: String
- **Required**: Yes (except for layout fields)
- **Description**: The internal name of the field (database column name)
- **Rules**:
  - Must be unique within a DocType
  - Must follow Python variable naming conventions
  - Cannot be reserved keywords
  - Cannot contain spaces or special characters (except underscore)
- **Example**: `customer_name`, `posting_date`, `total_amount`

#### `label` (Data)
- **Type**: String
- **Required**: Yes
- **Description**: The display label shown to users
- **Special**: Can contain HTML for formatting
- **Examples**:
  - `"Customer Name"`
  - `"Posting Date"`
  - `"<b>Important</b> Field"` (HTML allowed)
  - `"Total Amount <span class='text-muted'>(in USD)</span>"`

#### `fieldtype` (Select)
- **Type**: String (one of 47 field types)
- **Required**: Yes
- **Description**: Determines the field's data type and behavior
- **Options**: See [Complete List of Field Types](#complete-list-of-field-types)

#### `options` (Small Text)
- **Type**: String (varies by fieldtype)
- **Required**: Depends on fieldtype
- **Description**: Fieldtype-specific configuration
- **Usage by Field Type**:
  - **Link**: DocType name (e.g., `"Customer"`, `"Item"`)
  - **Select**: Options separated by newlines
  ```
  Option 1
  Option 2
  Option 3
  ```
  - **Dynamic Link**: Fieldname that contains the DocType name
  - **Data**: Special options: `Email`, `Name`, `Phone`, `URL`, `Barcode`, `IBAN`
  - **Table/Table MultiSelect**: Child DocType name
  - **Read Only**: Python expression or field reference
  - **HTML**: HTML content

### Default Values

#### `default` (Small Text)
- **Type**: String or expression
- **Required**: No
- **Description**: Default value when creating new documents
- **Special Values**:
  - `"Today"` - Current date (for Date fields)
  - `"now"` or `"Now"` - Current datetime (for Datetime fields)
  - `"__user"` or `"user"` - Current logged-in user
  - `"user_fullname"` - Current user's full name
  - `":fieldname"` - Value from another field (e.g., `":customer.company"`)
  - Static values: `"0"`, `"1"`, `"Active"`, etc.
- **Examples**:
  ```json
  {"default": "Today"}           // Date field
  {"default": "now"}              // Datetime field
  {"default": "__user"}           // User field
  {"default": ":customer.name"}   // Fetch from customer field
  {"default": "0"}                // Numeric field
  {"default": "Draft"}            // Select field
  ```

#### `fetch_from` (Small Text)
- **Type**: String (field reference)
- **Required**: No
- **Description**: Automatically fetch value from a linked document

**What it does:** When a Link field value changes, `fetch_from` automatically copies a value from the linked document to the current field. This eliminates manual data entry and ensures consistency.

**Format:** `"link_fieldname.source_fieldname"`
- `link_fieldname`: The name of the Link field in the current DocType
- `source_fieldname`: The field name in the linked DocType to fetch from
- Separated by a dot (`.`)

**Example:** 
```json
{
  "fieldname": "customer_email",
  "fieldtype": "Data",
  "fetch_from": "customer.email"
}
```
- When `customer` Link field changes, fetches `email` field from the Customer document
- Automatically fills `customer_email` field with the customer's email

**How it works:**
1. User selects a customer in the `customer` Link field
2. Frappe detects the Link field value changed
3. Loads the Customer document
4. Reads the `email` field from Customer
5. Automatically sets `customer_email` field in current document

**Behavior:**
- **Only works with Link fields**: The source must be a Link fieldtype
- **Fetches when link changes**: Triggered when Link field value is set or changed
- **Can fetch nested fields**: For child tables, use `"items.item_code"` format
- **Can be combined with `fetch_if_empty`**: Only fetches if field is empty (when `fetch_if_empty: 1`)

**Advanced Examples:**

**Fetch from child table:**
```json
{
  "fieldname": "item_name",
  "fieldtype": "Data",
  "fetch_from": "items.item_name"  // Fetches from items child table
}
```

**Multiple fetch_from fields:**
```json
// When customer changes, fetch multiple fields
{
  "fieldname": "customer_email",
  "fetch_from": "customer.email"
},
{
  "fieldname": "customer_phone",
  "fetch_from": "customer.mobile_no"
},
{
  "fieldname": "billing_address",
  "fetch_from": "customer.billing_address"
}
```

**Why use fetch_from:**
- Reduces data entry time
- Ensures data consistency (always uses source document's value)
- Prevents typos and errors
- Automatically updates if source document changes (on save)
- Improves user experience

**Limitations:**
- Only works with Link fields (not Dynamic Link directly)
- Source field must exist in linked DocType
- Fetches on save, not real-time (unless using client-side script)
- Cannot fetch computed/virtual fields from linked document

#### `fetch_if_empty` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Only fetch value if field is empty
- **Usage**: When `1`, fetch only occurs if the field has no value; when `0`, fetch always occurs on save

### Validation Properties

#### `reqd` (Check) - Mandatory
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field must have a value before saving

**What it does:** When `reqd: 1`, the field becomes mandatory - users cannot save the document without providing a value for this field.

**How it works:**
1. **Client-side validation**: Form shows error immediately if required field is empty
2. **Server-side validation**: Frappe validates on save and throws error if missing
3. **Visual indicator**: Required fields show asterisk (*) or red border in forms
4. **Database constraint**: Can create NOT NULL constraint (if `not_nullable: 1`)

**Validation Flow:**
```python
# In frappe/model/document.py
def validate(self):
    for field in self.meta.get("fields", {"reqd": 1}):
        value = self.get(field.fieldname)
        if not value or (isinstance(value, str) and value.strip() == ""):
            frappe.throw(
                _("{0} is mandatory").format(field.label),
                frappe.MandatoryError
            )
```

**Restrictions:**
- **Cannot be mandatory for layout fields**: Section Break, Column Break, Tab Break, Heading, HTML, Button, Image, Fold
  - These fields don't store data, so requiring them makes no sense
- **Cannot be hidden and mandatory**: A field cannot be both `hidden: 1` and `reqd: 1`
  - Users can't see it, so they can't fill it
- **Virtual fields**: Can be required, but validation must be handled in code

**Example:**
```json
{
  "fieldname": "customer_name",
  "fieldtype": "Data",
  "label": "Customer Name",
  "reqd": 1  // Required field
}
```

**Conditional Mandatory (`mandatory_depends_on`):**
Fields can be conditionally mandatory:
```json
{
  "fieldname": "approval_reason",
  "fieldtype": "Text",
  "mandatory_depends_on": "eval:doc.amount > 10000"
}
```
- Field is only required when amount > 10000
- Otherwise, field is optional

**Why use required fields:**
- Ensures data completeness
- Prevents incomplete records
- Enforces business rules
- Improves data quality

**Best Practices:**
- Only mark truly essential fields as required
- Use `mandatory_depends_on` for conditional requirements
- Provide clear error messages
- Consider user workflow (don't require fields users can't fill yet)

#### `unique` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field value must be unique across all documents

**What it does:** When `unique: 1`, no two documents in the DocType can have the same value for this field. Frappe enforces uniqueness at the database level and application level.

**How it works:**
1. **Database constraint**: Creates UNIQUE constraint on database column
2. **Application validation**: Checks uniqueness before saving
3. **Error on duplicate**: Throws error if duplicate value detected
4. **Index creation**: Automatically creates database index for performance

**Database Implementation:**
```sql
-- When unique: 1, Frappe creates:
ALTER TABLE `tabCustomer` ADD UNIQUE (`email`);
-- Or
CREATE UNIQUE INDEX idx_email ON `tabCustomer` (`email`);
```

**Validation Code:**
```python
# In frappe/model/document.py
if field.unique:
    # Check if value already exists
    existing = frappe.db.get_value(
        doctype,
        {field.fieldname: value},
        "name"
    )
    if existing and existing != self.name:
        frappe.throw(
            _("{0} must be unique").format(field.label),
            frappe.UniqueValidationError
        )
```

**Restrictions:**
- **Only valid for specific fieldtypes**: Data, Link, and Read Only
  - These fieldtypes store single, comparable values
  - Table, Text, Long Text fields cannot be unique (too complex)
  - Layout fields (Section Break, etc.) cannot be unique (no data)

**Example:**
```json
{
  "fieldname": "email",
  "fieldtype": "Data",
  "label": "Email",
  "unique": 1  // No two customers can have same email
}
```

**Important Considerations:**

**1. Existing Data:**
- Cannot set `unique: 1` if existing documents have duplicate values
- Must clean up duplicates first
- Frappe validates this when enabling uniqueness

**2. NULL Values:**
- NULL values are considered unique (multiple NULLs allowed)
- Only non-NULL values must be unique
- If field is also required (`reqd: 1`), this doesn't matter

**3. Case Sensitivity:**
- Uniqueness is case-sensitive by default
- "Email@example.com" and "email@example.com" are considered different
- Use application-level validation for case-insensitive uniqueness if needed

**4. Performance:**
- Unique fields automatically get database indexes
- Speeds up lookups and uniqueness checks
- But slows down inserts slightly (index maintenance)

**Use Cases:**
- Email addresses (one email per user)
- Identification numbers (SSN, Tax ID)
- Usernames (unique login names)
- Product codes (unique SKUs)
- Account numbers (unique identifiers)

**Why use unique fields:**
- Prevents duplicate data
- Ensures data integrity
- Enables efficient lookups
- Enforces business rules

**Best Practices:**
- Use for truly unique identifiers
- Consider case sensitivity requirements
- Clean up existing duplicates before enabling
- Use in combination with `reqd: 1` for identifiers
- Document why field must be unique

#### `non_negative` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Numeric value cannot be negative
- **Applicable**: Int, Float, Currency fieldtypes
- **Example**: `{"non_negative": 1}` - Prevents negative numbers

#### `length` (Int)
- **Type**: Integer
- **Default**: Varies by fieldtype
- **Description**: Maximum character length for text fields
- **Applicable**: Data, Link, Dynamic Link, Password, Select, Read Only, Attach, Attach Image, Int
- **Default Values**:
  - Data: 140 characters
  - Link: 140 characters
  - Small Text: 140 characters
  - Long Text: Unlimited
- **Example**: `{"length": 255}` - Maximum 255 characters

#### `precision` (Select)
- **Type**: String (0-9)
- **Default**: System default (usually 2)
- **Description**: Decimal places for numeric fields
- **Applicable**: Float, Currency, Percent
- **Options**: `"0"`, `"1"`, `"2"`, `"3"`, `"4"`, `"5"`, `"6"`, `"7"`, `"8"`, `"9"`
- **Example**: `{"precision": "2"}` - Show 2 decimal places (e.g., 123.45)

### Display Properties

#### `hidden` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide field in forms (but still stored in database)
- **Usage**: Hide fields used for calculations or system purposes
- **Example**: `{"hidden": 1}` - Field is hidden

#### `read_only` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field cannot be edited by users
- **Usage**: Display computed values or fetched data
- **Example**: `{"read_only": 1}` - Field is read-only

#### `bold` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Display label in bold font
- **Example**: `{"bold": 1}` - Label appears bold

#### `width` (Data)
- **Type**: String (CSS width value)
- **Description**: Field width in forms
- **Format**: CSS width (e.g., `"100px"`, `"50%"`, `"200px"`)
- **Example**: `{"width": "200px"}` - Field is 200 pixels wide

#### `columns` (Int)
- **Type**: Integer
- **Default**: 1
- **Description**: Number of columns in list view (1-10)
- **Usage**: Controls how many columns the field spans in list views
- **Example**: `{"columns": 2}` - Field spans 2 columns

#### `max_height` (Data)
- **Type**: String (CSS height value)
- **Description**: Maximum height for text areas
- **Format**: CSS height (e.g., `"100px"`, `"5rem"`)
- **Example**: `{"max_height": "200px"}` - Maximum height 200 pixels

#### `placeholder` (Data)
- **Type**: String
- **Description**: Placeholder text shown in empty input fields
- **Example**: `{"placeholder": "Enter customer name..."}`

#### `description` (Small Text)
- **Type**: String
- **Description**: Help text shown below the field
- **Special**: Can contain HTML
- **Example**: `{"description": "Enter the customer's full legal name"}`

#### `documentation_url` (Data)
- **Type**: String (URL)
- **Description**: Link to documentation for this field
- **Format**: Valid URL
- **Example**: `{"documentation_url": "https://docs.example.com/field-help"}`

### Conditional Display

#### `depends_on` (Code)
- **Type**: JavaScript expression
- **Description**: Show/hide field based on other field values

**What it does:** `depends_on` creates conditional field visibility. Fields appear or disappear based on values in other fields, creating dynamic, context-aware forms.

**Format:** JavaScript expression prefixed with `"eval:"`
- Expression must start with `"eval:"`
- Has access to `doc` object (current document)
- Returns `true` to show field, `false` to hide it
- Evaluated in browser (client-side) for instant updates

**How it works:**
1. Frappe evaluates the JavaScript expression
2. Expression has access to `doc` (document object with all field values)
3. If expression returns `true` (or truthy), field is shown
4. If expression returns `false` (or falsy), field is hidden
5. Expression re-evaluates whenever dependent fields change

**Basic Examples:**

**Simple condition:**
```json
{
  "fieldname": "discount_amount",
  "fieldtype": "Currency",
  "depends_on": "eval:doc.apply_discount==1"
}
```
- Shows `discount_amount` field only when `apply_discount` checkbox is checked

**Comparison:**
```json
{
  "fieldname": "approval_required",
  "fieldtype": "Check",
  "depends_on": "eval:doc.amount > 1000"
}
```
- Shows field only when `amount` is greater than 1000

**Multiple conditions (AND):**
```json
{
  "fieldname": "special_notes",
  "fieldtype": "Text",
  "depends_on": "eval:doc.status=='Active' && doc.amount > 5000"
}
```
- Shows field only when status is "Active" AND amount > 5000

**Multiple conditions (OR):**
```json
{
  "fieldname": "urgent_flag",
  "fieldtype": "Check",
  "depends_on": "eval:doc.priority=='High' || doc.priority=='Critical'"
}
```
- Shows field when priority is "High" OR "Critical"

**Check if field has value:**
```json
{
  "fieldname": "customer_details",
  "fieldtype": "Section Break",
  "depends_on": "eval:doc.customer && doc.customer!=''"
}
```
- Shows section only when customer field has a value

**Using in_list helper:**
```json
{
  "fieldname": "special_field",
  "fieldtype": "Data",
  "depends_on": "eval:in_list(['Option1', 'Option2', 'Option3'], doc.type)"
}
```
- Shows field only when `type` is one of the specified options

**Advanced Examples:**

**Nested field access:**
```json
{
  "fieldname": "item_details",
  "depends_on": "eval:doc.items && doc.items.length > 0"
}
```
- Shows field only when items child table has rows

**Complex logic:**
```json
{
  "fieldname": "approval_section",
  "fieldtype": "Section Break",
  "depends_on": "eval:(doc.amount > 10000 && doc.status=='Draft') || doc.requires_approval==1"
}
```
- Shows section when: (amount > 10000 AND status is Draft) OR requires_approval is checked

**Date comparison:**
```json
{
  "fieldname": "expiry_notice",
  "depends_on": "eval:doc.expiry_date && frappe.datetime.get_diff(doc.expiry_date, frappe.datetime.get_today()) < 30"
}
```
- Shows field when expiry_date is within 30 days

**Available Helpers:**
- `in_list(array, value)`: Check if value is in array
- `frappe.datetime.get_diff(date1, date2)`: Get difference between dates
- `frappe.datetime.get_today()`: Get today's date
- `frappe.utils.is_json(value)`: Check if value is valid JSON

**Why use depends_on:**
- Creates dynamic, context-aware forms
- Reduces form clutter (only shows relevant fields)
- Improves user experience
- Prevents errors (hides irrelevant fields)
- Guides users through workflows

**Best Practices:**
- Keep expressions simple and readable
- Test expressions thoroughly
- Use helper functions for complex logic
- Document complex expressions
- Consider performance (avoid heavy computations)

**Common Mistakes:**
- Forgetting `"eval:"` prefix
- Using Python syntax instead of JavaScript
- Not handling null/undefined values
- Complex expressions that are hard to maintain
- Circular dependencies (field A depends on B, B depends on A)

#### `mandatory_depends_on` (Code)
- **Type**: JavaScript expression
- **Description**: Make field mandatory conditionally
- **Format**: JavaScript expression
- **Example**: `{"mandatory_depends_on": "eval:doc.amount > 1000"}` - Required only if amount > 1000

#### `read_only_depends_on` (Code)
- **Type**: JavaScript expression
- **Description**: Make field read-only conditionally
- **Format**: JavaScript expression
- **Example**: `{"read_only_depends_on": "eval:doc.docstatus==1"}` - Read-only when submitted

#### `collapsible` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Make Section Break collapsible
- **Applicable**: Section Break only
- **Example**: `{"collapsible": 1}` - Section can be collapsed

#### `collapsible_depends_on` (Code)
- **Type**: JavaScript expression
- **Description**: Control when section is collapsed by default
- **Applicable**: Section Break with `collapsible=1`
- **Format**: JavaScript expression
- **Example**: `{"collapsible_depends_on": "eval:doc.status=='Draft'"}` - Collapsed when draft

### List View Properties

#### `in_list_view` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Show field in list view
- **Restrictions**: Not available for virtual fields
- **Example**: `{"in_list_view": 1}` - Field appears in list

#### `in_standard_filter` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Include in standard filter dropdown
- **Example**: `{"in_standard_filter": 1}` - Appears in filters

#### `in_global_search` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Include field in global search
- **Applicable**: Data, Select, Table, Text, Text Editor, Link, Small Text, Long Text, Read Only, Heading, Dynamic Link
- **Example**: `{"in_global_search": 1}` - Searchable globally

#### `in_preview` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Show in preview sidebar
- **Restrictions**: Not available for Table fields
- **Example**: `{"in_preview": 1}` - Shown in preview

#### `in_filter` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Include in filter options
- **Example**: `{"in_filter": 1}` - Available for filtering

### Print Properties

#### `print_hide` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide field in print formats
- **Example**: `{"print_hide": 1}` - Hidden when printing

#### `print_hide_if_no_value` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide in print if field is empty
- **Applicable**: Int, Float, Currency, Percent
- **Example**: `{"print_hide_if_no_value": 1}` - Hidden if empty

#### `print_width` (Data)
- **Type**: String (CSS width value)
- **Description**: Field width in print formats
- **Format**: CSS width
- **Example**: `{"print_width": "100px"}` - Print width 100 pixels

#### `report_hide` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide field in reports
- **Example**: `{"report_hide": 1}` - Hidden in reports

### Permissions

#### `permlevel` (Int)
- **Type**: Integer (0-9)
- **Default**: 0
- **Description**: Permission level for field access
- **Usage**: Higher numbers = more restricted access
- **Example**: `{"permlevel": 1}` - Permission level 1

#### `ignore_user_permissions` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Ignore user permission restrictions for Link fields
- **Usage**: Allow access to linked documents user doesn't have permission for
- **Example**: `{"ignore_user_permissions": 1}` - Bypass permissions

#### `allow_on_submit` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Allow editing field after document submission
- **Applicable**: Submittable DocTypes only
- **Example**: `{"allow_on_submit": 1}` - Editable after submit

### Link Field Properties

#### `link_filters` (JSON)
- **Type**: JSON string
- **Description**: Filter options for Link field dropdown
- **Format**: JSON array of filter conditions
- **Example**:
  ```json
  {
    "link_filters": "[{\"fieldname\": \"status\", \"condition\": \"=\", \"value\": \"Active\"}]"
  }
  ```
  Filters the linked DocType to show only documents where `status='Active'`

#### `remember_last_selected_value` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Remember last selected value for Link fields
- **Applicable**: Link fields only
- **Example**: `{"remember_last_selected_value": 1}` - Remembers selection

### Table Field Properties

#### `allow_bulk_edit` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Allow bulk editing of child table rows
- **Applicable**: Table fields only
- **Example**: `{"allow_bulk_edit": 1}` - Enable bulk edit

### Other Properties

#### `no_copy` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Don't copy field value when duplicating document
- **Example**: `{"no_copy": 1}` - Not copied on duplicate

#### `set_only_once` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field can only be set once, cannot be changed later
- **Example**: `{"set_only_once": 1}` - Immutable after first set

#### `translatable` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field content can be translated
- **Applicable**: Data, Select, Text, Small Text, Text Editor
- **Example**: `{"translatable": 1}` - Enable translation

#### `sort_options` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Sort Select field options alphabetically
- **Applicable**: Select fields only
- **Example**: `{"sort_options": 1}` - Sort options

#### `search_index` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Create database index for faster searching
- **Example**: `{"search_index": 1}` - Add database index

#### `is_virtual` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field doesn't exist in database, computed on-the-fly
- **Usage**: For calculated fields that don't need storage
- **Example**: `{"is_virtual": 1}` - Virtual field

#### `ignore_xss_filter` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Don't filter HTML/XSS in field content
- **Usage**: Allow HTML content without sanitization
- **Example**: `{"ignore_xss_filter": 1}` - Allow HTML

#### `allow_in_quick_entry` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Include field in quick entry form
- **Example**: `{"allow_in_quick_entry": 1}` - Show in quick entry

#### `hide_border` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide border around Section Break
- **Applicable**: Section Break only
- **Example**: `{"hide_border": 1}` - No border

#### `hide_days` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide days in Duration field
- **Applicable**: Duration fields only
- **Example**: `{"hide_days": 1}` - Show only hours/minutes/seconds

#### `hide_seconds` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Hide seconds in Duration field
- **Applicable**: Duration fields only
- **Example**: `{"hide_seconds": 1}` - Show only days/hours/minutes

#### `make_attachment_public` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Make attachments public by default (accessible without login)
- **Applicable**: Attach, Attach Image fields only
- **Example**: `{"make_attachment_public": 1}` - Public attachments

#### `show_dashboard` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Show dashboard for Tab Break
- **Applicable**: Tab Break only
- **Example**: `{"show_dashboard": 1}` - Show dashboard

#### `show_on_timeline` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Show field on document timeline
- **Usage**: Only works when field is hidden
- **Example**: `{"hidden": 1, "show_on_timeline": 1}` - Hidden but on timeline

### Internal Properties (System Use)

#### `oldfieldname` (Data)
- **Type**: String
- **Description**: Previous fieldname (for renaming tracking)
- **Usage**: Internal system use

#### `oldfieldtype` (Data)
- **Type**: String
- **Description**: Previous fieldtype (for type change tracking)
- **Usage**: Internal system use

---

## Field Type Details

### Data Field Types

#### 1. Data
**Purpose**: Single-line text input field

**Properties**:
- `length`: Maximum characters (default: 140)
- `options`: Special validation types:
  - `"Email"` - Email validation
  - `"Name"` - Name validation (alphanumeric, spaces, hyphens)
  - `"Phone"` - Phone number validation
  - `"URL"` - URL validation
  - `"Barcode"` - Barcode scanner support
  - `"IBAN"` - IBAN bank account validation
- `default`: Default value
- `placeholder`: Placeholder text
- `translatable`: Enable translation

**Examples**:
```json
{
  "fieldname": "email",
  "fieldtype": "Data",
  "label": "Email",
  "options": "Email",
  "reqd": 1
}

{
  "fieldname": "website",
  "fieldtype": "Data",
  "label": "Website",
  "options": "URL",
  "placeholder": "https://example.com"
}

{
  "fieldname": "iban",
  "fieldtype": "Data",
  "label": "IBAN",
  "options": "IBAN",
  "length": 34
}
```

**Special Behaviors**:
- URL option: Shows clickable link icon when valid URL entered
- Barcode option: Shows barcode scanner button
- IBAN option: Formats IBAN with spaces automatically

---

#### 2. Text
**Purpose**: Multi-line text area

**Properties**:
- `default`: Default text
- `translatable`: Enable translation
- `max_height`: Maximum height (CSS value)
- `ignore_xss_filter`: Allow HTML without filtering

**Example**:
```json
{
  "fieldname": "description",
  "fieldtype": "Text",
  "label": "Description",
  "max_height": "200px"
}
```

---

#### 3. Small Text
**Purpose**: Short text field (up to 140 characters)

**Properties**:
- `length`: Maximum characters (default: 140)
- `translatable`: Enable translation
- `default`: Default value

**Example**:
```json
{
  "fieldname": "short_note",
  "fieldtype": "Small Text",
  "label": "Short Note",
  "length": 100
}
```

---

#### 4. Long Text
**Purpose**: Large multi-line text area

**Properties**:
- `default`: Default text
- `max_height`: Maximum height
- `translatable`: Enable translation

**Example**:
```json
{
  "fieldname": "notes",
  "fieldtype": "Long Text",
  "label": "Notes",
  "max_height": "300px"
}
```

---

#### 5. Code
**Purpose**: Code editor with syntax highlighting

**Properties**:
- `options`: Language for syntax highlighting (e.g., `"Python"`, `"JavaScript"`, `"SQL"`, `"JSON"`)
- `default`: Default code
- `max_height`: Editor height

**Example**:
```json
{
  "fieldname": "custom_script",
  "fieldtype": "Code",
  "label": "Custom Script",
  "options": "Python",
  "max_height": "400px"
}
```

**Supported Languages**: Python, JavaScript, SQL, JSON, HTML, CSS, and more

---

#### 6. Int (Integer)
**Purpose**: Whole number input

**Properties**:
- `default`: Default integer value
- `non_negative`: Prevent negative values
- `length`: Not applicable

**Example**:
```json
{
  "fieldname": "quantity",
  "fieldtype": "Int",
  "label": "Quantity",
  "default": "0",
  "non_negative": 1
}
```

---

#### 7. Float
**Purpose**: Decimal number input

**Properties**:
- `precision`: Decimal places (0-9)
- `default`: Default decimal value
- `non_negative`: Prevent negative values

**Example**:
```json
{
  "fieldname": "rate",
  "fieldtype": "Float",
  "label": "Rate",
  "precision": "2",
  "default": "0.00"
}
```

---

#### 8. Currency
**Purpose**: Currency amount with formatting

**Properties**:
- `precision`: Decimal places (default: 2)
- `default`: Default amount
- `non_negative`: Prevent negative values

**Example**:
```json
{
  "fieldname": "amount",
  "fieldtype": "Currency",
  "label": "Amount",
  "precision": "2",
  "default": "0.00"
}
```

**Behavior**: Automatically formats with currency symbol based on company settings

---

#### 9. Percent
**Purpose**: Percentage value (0-100)

**Properties**:
- `precision`: Decimal places
- `default`: Default percentage
- `non_negative`: Usually set to 1

**Example**:
```json
{
  "fieldname": "discount_percent",
  "fieldtype": "Percent",
  "label": "Discount %",
  "precision": "2",
  "default": "0.00",
  "non_negative": 1
}
```

---

#### 10. Check
**Purpose**: Boolean checkbox (True/False, 1/0)

**Properties**:
- `default`: Default value (`"0"` or `"1"`)
- Must be 0 or 1

**Example**:
```json
{
  "fieldname": "is_active",
  "fieldtype": "Check",
  "label": "Is Active",
  "default": "1"
}
```

---

#### 11. Date
**Purpose**: Date picker (no time)

**Properties**:
- `default`: Special values:
  - `"Today"` - Current date
  - `":fieldname"` - Date from another field
  - Specific date: `"2024-01-01"`

**Example**:
```json
{
  "fieldname": "posting_date",
  "fieldtype": "Date",
  "label": "Posting Date",
  "default": "Today",
  "reqd": 1
}
```

**Special Default Values**:
- `"Today"` - Sets to current date
- `":customer.creation"` - Fetches date from customer field

---

#### 12. Datetime
**Purpose**: Date and time picker

**Properties**:
- `default`: Special values:
  - `"now"` or `"Now"` - Current datetime
  - `":fieldname"` - Datetime from another field

**Example**:
```json
{
  "fieldname": "timestamp",
  "fieldtype": "Datetime",
  "label": "Timestamp",
  "default": "now"
}
```

**Behavior**: Stores in system timezone, displays in user timezone

---

#### 13. Time
**Purpose**: Time picker (no date)

**Properties**:
- `default`: Time value (HH:MM:SS format)
- Defaults to current time if not specified

**Example**:
```json
{
  "fieldname": "start_time",
  "fieldtype": "Time",
  "label": "Start Time",
  "default": "09:00:00"
}
```

---

#### 14. Duration
**Purpose**: Time duration (days, hours, minutes, seconds)

**Properties**:
- `hide_days`: Hide days component
- `hide_seconds`: Hide seconds component
- `default`: Duration in seconds or formatted string

**Example**:
```json
{
  "fieldname": "duration",
  "fieldtype": "Duration",
  "label": "Duration",
  "hide_days": 0,
  "hide_seconds": 1
}
```

**Format**: Stored as seconds, displayed as "DD HH:MM:SS"

---

#### 15. Link
**Purpose**: Link to another DocType

**What it is:** A Link field creates a relationship between two DocTypes. It stores a reference (the document name/ID) to another document, enabling you to connect documents together.

**How it works:**
- **Stores reference**: Link fields store the document name (ID) of the linked document, not the full document data
- **Validates existence**: Frappe ensures the linked document exists before saving
- **Shows dropdown**: In forms, Link fields show a searchable dropdown with available documents
- **Creates relationship**: Enables querying related documents and maintaining referential integrity

**Database Storage:**
- Link fields are stored as `VARCHAR(140)` columns
- Stores the document name (e.g., "_Test Customer", "CUST-00001")
- No foreign key constraint (Frappe handles relationships in application layer)

**Properties**:
- `options`: **Required** - DocType name to link to
  - Must be a valid DocType name
  - Example: `"options": "Customer"` links to Customer DocType
  - Case-sensitive: Must match exact DocType name

- `link_filters`: JSON filters for dropdown
  - Filters which documents appear in the dropdown
  - Format: JSON array of filter conditions
  - Example: Only show active customers: `[{"fieldname": "status", "condition": "=", "value": "Active"}]`
  - Applied when loading dropdown options

- `ignore_user_permissions`: Bypass user permissions
  - When `1`, shows all documents regardless of user permissions
  - When `0` (default), respects user permission restrictions
  - Use carefully - can expose data users shouldn't see

- `remember_last_selected_value`: Remember selection
  - When `1`, remembers last selected value for this field
  - Pre-fills field with last selection when creating new document
  - Improves data entry speed for frequently used values

- `fetch_from`: Fetch fields from linked document
  - Automatically copies values from linked document
  - Format: `"link_fieldname.source_fieldname"`
  - Example: `"fetch_from": "customer.email"` copies email from Customer

**Example**:
```json
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "label": "Customer",
  "options": "Customer",
  "reqd": 1,
  "link_filters": "[{\"fieldname\": \"status\", \"condition\": \"=\", \"value\": \"Active\"}]"
}
```

**Link Filters Format**:
```json
{
  "link_filters": "[{\"fieldname\": \"status\", \"condition\": \"=\", \"value\": \"Active\"}, {\"fieldname\": \"customer_group\", \"condition\": \"=\", \"value\": \"Retail\"}]"
}
```

**Fetch From Example**:
```json
{
  "fieldname": "customer_name",
  "fieldtype": "Data",
  "label": "Customer Name",
  "fetch_from": "customer.customer_name",
  "fetch_if_empty": 1
}
```

---

#### 16. Dynamic Link
**Purpose**: Link to any DocType based on another field value

**Properties**:
- `options`: **Required** - Fieldname that contains the DocType name
- `link_filters`: JSON filters (same as Link)

**Example**:
```json
{
  "fieldname": "reference_type",
  "fieldtype": "Select",
  "label": "Reference Type",
  "options": "Sales Order\nPurchase Order\nDelivery Note"
}

{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "label": "Reference Name",
  "options": "reference_type",
  "reqd": 1
}
```

**Behavior**: The `reference_type` field determines which DocType `reference_name` links to

---

#### 17. Select
**Purpose**: Dropdown selection from predefined options

**Properties**:
- `options`: **Required** - Options separated by newlines
- `default`: Default selected option
- `sort_options`: Sort options alphabetically
- `translatable`: Enable translation

**Example**:
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "label": "Status",
  "options": "Draft\nSubmitted\nCancelled",
  "default": "Draft",
  "sort_options": 0
}
```

**Options Format**:
```
Option 1
Option 2
Option 3
```

---

#### 18. Read Only
**Purpose**: Display-only field (cannot be edited)

**Properties**:
- `options`: Can contain Python expression or field reference
- `default`: Default value
- `fetch_from`: Fetch from linked document
- `read_only_depends_on`: Conditional read-only

**Example**:
```json
{
  "fieldname": "total_amount",
  "fieldtype": "Read Only",
  "label": "Total Amount",
  "options": "",
  "read_only": 1
}
```

**Usage**: Often used with `fetch_from` to display values from linked documents

---

#### 19. Password
**Purpose**: Password input (masked characters)

**Properties**:
- `length`: Maximum length
- `default`: Not recommended for security

**Example**:
```json
{
  "fieldname": "password",
  "fieldtype": "Password",
  "label": "Password",
  "length": 255
}
```

**Behavior**: Characters are masked (shown as dots) when typing

---

#### 20. Attach
**Purpose**: File attachment field

**Properties**:
- `length`: Not applicable
- `make_attachment_public`: Make public by default
- `default`: Not applicable

**Example**:
```json
{
  "fieldname": "document",
  "fieldtype": "Attach",
  "label": "Document",
  "make_attachment_public": 0
}
```

**Behavior**: Opens file browser, stores file path, shows download link

---

#### 21. Attach Image
**Purpose**: Image attachment with preview

**Properties**:
- `make_attachment_public`: Make public by default
- Same as Attach but with image preview

**Example**:
```json
{
  "fieldname": "photo",
  "fieldtype": "Attach Image",
  "label": "Photo",
  "make_attachment_public": 0
}
```

**Behavior**: Shows image preview, validates image format

---

#### 22. Signature
**Purpose**: Digital signature capture

**Properties**:
- `default`: Not applicable

**Example**:
```json
{
  "fieldname": "signature",
  "fieldtype": "Signature",
  "label": "Signature"
}
```

**Behavior**: Provides canvas for drawing signature, stores as image

---

#### 23. Color
**Purpose**: Color picker

**Properties**:
- `default`: Hex color code (e.g., `"#FF0000"`)

**Example**:
```json
{
  "fieldname": "theme_color",
  "fieldtype": "Color",
  "label": "Theme Color",
  "default": "#0078D4"
}
```

**Behavior**: Opens color picker dialog, stores hex color code

---

#### 24. Icon
**Purpose**: Icon picker

**Properties**:
- `default`: Icon name (e.g., `"star"`, `"user"`)

**Example**:
```json
{
  "fieldname": "icon",
  "fieldtype": "Icon",
  "label": "Icon",
  "default": "star"
}
```

**Behavior**: Opens icon selector, shows icon preview

---

#### 25. Barcode
**Purpose**: Barcode scanner and display

**Properties**:
- `options`: Set to `"Barcode"` (for Data field) or use Barcode fieldtype
- `default`: Barcode value

**Example**:
```json
{
  "fieldname": "barcode",
  "fieldtype": "Barcode",
  "label": "Barcode"
}
```

**Behavior**: Shows scanner button, validates barcode format, displays barcode image

---

#### 26. Phone
**Purpose**: Phone number input with validation

**Properties**:
- `length`: Maximum length
- `default`: Phone number

**Example**:
```json
{
  "fieldname": "phone",
  "fieldtype": "Phone",
  "label": "Phone Number",
  "length": 20
}
```

**Behavior**: Validates phone number format, can include country code

---

#### 27. Autocomplete
**Purpose**: Text input with autocomplete suggestions

**Properties**:
- `options`: Source for autocomplete (can be DocType or custom)
- `length`: Maximum length

**Example**:
```json
{
  "fieldname": "search_term",
  "fieldtype": "Autocomplete",
  "label": "Search Term",
  "length": 255
}
```

**Behavior**: Shows suggestions as user types, filters based on input

---

#### 28. Rating
**Purpose**: Star rating (1-5 stars)

**Properties**:
- `default`: Default rating (1-5)
- `options`: Maximum rating (default: 5)

**Example**:
```json
{
  "fieldname": "rating",
  "fieldtype": "Rating",
  "label": "Rating",
  "default": "0",
  "options": "5"
}
```

**Behavior**: Interactive star rating, stores numeric value (1-5)

---

#### 29. Geolocation
**Purpose**: GPS coordinates (latitude/longitude)

**Properties**:
- `default`: Coordinates (lat, lng format)

**Example**:
```json
{
  "fieldname": "location",
  "fieldtype": "Geolocation",
  "label": "Location"
}
```

**Behavior**: Opens map picker, stores coordinates, shows on map

---

#### 30. JSON
**Purpose**: Structured JSON data storage

**Properties**:
- `default`: JSON string
- `options`: Not applicable

**Example**:
```json
{
  "fieldname": "metadata",
  "fieldtype": "JSON",
  "label": "Metadata",
  "default": "{}"
}
```

**Behavior**: Stores JSON data, validates JSON format, can be edited as code

---

#### 31. Text Editor
**Purpose**: Rich text editor (WYSIWYG)

**Properties**:
- `default`: HTML content
- `translatable`: Enable translation
- `ignore_xss_filter`: Allow HTML without filtering

**Example**:
```json
{
  "fieldname": "description",
  "fieldtype": "Text Editor",
  "label": "Description",
  "translatable": 1
}
```

**Behavior**: Rich text editing toolbar, stores HTML content

---

#### 32. HTML Editor
**Purpose**: HTML code editor

**Properties**:
- `default`: HTML code
- `max_height`: Editor height

**Example**:
```json
{
  "fieldname": "custom_html",
  "fieldtype": "HTML Editor",
  "label": "Custom HTML",
  "max_height": "400px"
}
```

**Behavior**: HTML code editor with syntax highlighting

---

#### 33. Markdown Editor
**Purpose**: Markdown editor

**Properties**:
- `default`: Markdown content
- `translatable`: Enable translation

**Example**:
```json
{
  "fieldname": "content",
  "fieldtype": "Markdown Editor",
  "label": "Content",
  "translatable": 1
}
```

**Behavior**: Markdown editing with preview, stores markdown text

---

### Layout Field Types

#### 34. Section Break
**Purpose**: Visual section divider

**Properties**:
- `label`: Section title
- `collapsible`: Make collapsible
- `collapsible_depends_on`: Control collapse state
- `hide_border`: Hide border
- `bold`: Bold label

**Example**:
```json
{
  "fieldname": "customer_section",
  "fieldtype": "Section Break",
  "label": "Customer Details",
  "collapsible": 1,
  "hide_border": 0
}
```

**Behavior**: Creates visual section, can be collapsed, groups fields

---

#### 35. Column Break
**Purpose**: Column divider for multi-column layouts

**Properties**:
- No special properties

**Example**:
```json
{
  "fieldname": "column_break_1",
  "fieldtype": "Column Break"
}
```

**Behavior**: Splits form into columns, fields after break appear in next column

---

#### 36. Tab Break
**Purpose**: Tab divider

**Properties**:
- `label`: Tab title
- `show_dashboard`: Show dashboard for tab

**Example**:
```json
{
  "fieldname": "details_tab",
  "fieldtype": "Tab Break",
  "label": "Details",
  "show_dashboard": 0
}
```

**Behavior**: Creates tab, fields after break appear in tab

---

#### 37. Fold
**Purpose**: Collapsible section (similar to Section Break)

**Properties**:
- `label`: Section title

**Example**:
```json
{
  "fieldname": "advanced_section",
  "fieldtype": "Fold",
  "label": "Advanced Settings"
}
```

**Behavior**: Collapsible section, collapsed by default

---

#### 38. Heading
**Purpose**: Section heading

**Properties**:
- `label`: Heading text
- `bold`: Bold text

**Example**:
```json
{
  "fieldname": "section_heading",
  "fieldtype": "Heading",
  "label": "Important Information",
  "bold": 1
}
```

**Behavior**: Displays as heading text, no data storage

---

### Display Field Types

#### 39. HTML
**Purpose**: HTML content display

**Properties**:
- `options`: **Required** - HTML content
- `label`: Optional label

**Example**:
```json
{
  "fieldname": "custom_html",
  "fieldtype": "HTML",
  "label": "Custom Content",
  "options": "<div class='alert alert-info'>Important Notice</div>"
}
```

**Behavior**: Renders HTML content, no data storage, can contain any HTML

---

#### 40. Button
**Purpose**: Action button

**Properties**:
- `label`: Button text
- `options`: JavaScript function to call on click

**Example**:
```json
{
  "fieldname": "action_button",
  "fieldtype": "Button",
  "label": "Process",
  "options": "process_document"
}
```

**Behavior**: Renders button, calls JavaScript function on click

---

#### 41. Image
**Purpose**: Image display

**Properties**:
- `options`: Image URL or file path
- `label`: Optional label

**Example**:
```json
{
  "fieldname": "logo",
  "fieldtype": "Image",
  "label": "Logo",
  "options": "/files/logo.png"
}
```

**Behavior**: Displays image, can be URL or file path

---

### Table Field Types

#### 42. Table
**Purpose**: Child table (one-to-many relationship)

**Properties**:
- `options`: **Required** - Child DocType name
- `allow_bulk_edit`: Enable bulk editing

**Example**:
```json
{
  "fieldname": "items",
  "fieldtype": "Table",
  "label": "Items",
  "options": "Sales Invoice Item",
  "allow_bulk_edit": 1
}
```

**Behavior**: Creates child table, allows multiple rows, each row is a document in child DocType

**Child Table Structure**:
- Child tables automatically have: `parent`, `parenttype`, `parentfield` fields
- These link child rows to parent document

---

#### 43. Table MultiSelect
**Purpose**: Multi-select child table

**Properties**:
- `options`: **Required** - Child DocType name and this child doctype must have a Link field that links to the Doctype that we will multiselect from.
- Similar to Table but allows selecting existing documents

**Example**:
```json
{
  "fieldname": "related_items",
  "fieldtype": "Table MultiSelect",
  "label": "Related Items",
  "options": "Item"
}
```

**Behavior**: Allows selecting multiple existing documents, creates links

---

## Field Property Combinations and Examples

### Example 1: Conditional Field Display
```json
{
  "fieldname": "discount_amount",
  "fieldtype": "Currency",
  "label": "Discount Amount",
  "depends_on": "eval:doc.apply_discount==1",
  "mandatory_depends_on": "eval:doc.apply_discount==1 && doc.amount > 1000",
  "precision": "2"
}
```
Shows discount field only when `apply_discount` is checked, and makes it mandatory if amount > 1000.

### Example 2: Link with Filters and Fetch
```json
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "label": "Customer",
  "options": "Customer",
  "reqd": 1,
  "link_filters": "[{\"fieldname\": \"status\", \"condition\": \"=\", \"value\": \"Active\"}]",
  "remember_last_selected_value": 1
}

{
  "fieldname": "customer_name",
  "fieldtype": "Data",
  "label": "Customer Name",
  "fetch_from": "customer.customer_name",
  "fetch_if_empty": 1,
  "read_only": 1
}
```
Customer link filters to active customers, and customer_name is automatically fetched.

### Example 3: Date Field with Today Default
```json
{
  "fieldname": "posting_date",
  "fieldtype": "Date",
  "label": "Posting Date",
  "default": "Today",
  "reqd": 1,
  "in_list_view": 1,
  "in_standard_filter": 1
}
```
Date field defaults to today, appears in list view and filters.

### Example 4: Select with Sort and Translation
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "label": "Status",
  "options": "Draft\nSubmitted\nCancelled\nApproved",
  "default": "Draft",
  "sort_options": 1,
  "translatable": 1,
  "in_list_view": 1
}
```
Select field with sorted options, translatable, shown in list view.

### Example 5: Data Field with URL Option
```json
{
  "fieldname": "website",
  "fieldtype": "Data",
  "label": "Website",
  "options": "URL",
  "placeholder": "https://example.com",
  "description": "Enter the company website URL"
}
```
Data field validates as URL and shows clickable link icon.

### Example 6: Read Only with Fetch
```json
{
  "fieldname": "total_amount",
  "fieldtype": "Read Only",
  "label": "Total Amount",
  "fetch_from": "customer.credit_limit",
  "read_only": 1,
  "bold": 1
}
```
Read-only field that fetches and displays credit limit from customer.

### Example 7: Section Break with Collapse
```json
{
  "fieldname": "advanced_section",
  "fieldtype": "Section Break",
  "label": "Advanced Settings",
  "collapsible": 1,
  "collapsible_depends_on": "eval:doc.status=='Draft'",
  "hide_border": 0
}
```
Collapsible section that is collapsed by default when status is Draft.

### Example 8: Table Field with Bulk Edit
```json
{
  "fieldname": "items",
  "fieldtype": "Table",
  "label": "Items",
  "options": "Sales Invoice Item",
  "allow_bulk_edit": 1,
  "reqd": 1
}
```
Required child table with bulk editing enabled.

---

## Field Validation Rules

### General Rules
1. **Fieldname Uniqueness**: Fieldnames must be unique within a DocType
2. **Reserved Keywords**: Cannot use Python reserved keywords as fieldnames
3. **Mandatory Restrictions**: Layout fields (Section Break, Column Break, etc.) cannot be mandatory
4. **Unique Restrictions**: Only Data, Link, and Read Only fields can be unique
5. **Hidden + Mandatory**: A field cannot be both hidden and mandatory
6. **Virtual Fields**: Virtual fields cannot appear in list view

### Fieldtype-Specific Rules
1. **Link Fields**: Must have `options` set to valid DocType name
2. **Dynamic Link**: Must have `options` pointing to another field that contains DocType name
3. **Select Fields**: Must have `options` with at least one option
4. **Table Fields**: Must have `options` set to valid child DocType name
5. **Check Fields**: Default must be `"0"` or `"1"`
6. **Date Fields**: Default `"Today"` only works for Date fieldtype
7. **Datetime Fields**: Default `"now"` only works for Datetime fieldtype

---

## Best Practices

1. **Field Naming**: Use descriptive, lowercase fieldnames with underscores (snake_case)
2. **Labels**: Use clear, user-friendly labels
3. **Defaults**: Set sensible defaults for commonly used values
4. **Validation**: Use appropriate fieldtypes and options for data validation
5. **Fetch From**: Use fetch_from to reduce data entry and ensure consistency
6. **Dependencies**: Use depends_on to show/hide fields based on context
7. **Permissions**: Set appropriate permlevel for sensitive fields
8. **List Views**: Only include essential fields in list views for performance
9. **Translation**: Mark translatable fields appropriately
10. **Documentation**: Add descriptions to help users understand field purpose

---

## How Fields Work Behind the Scenes

Understanding how fields work internally helps you use them more effectively and troubleshoot issues. This section explains the technical implementation details.

### The Field Lifecycle

#### 1. **Field Definition**

Fields start as definitions in JSON files or database records:

**Standard Fields (JSON):**
```json
// apps/erpnext/erpnext/selling/doctype/customer/customer.json
{
  "fields": [
    {
      "fieldname": "customer_name",
      "fieldtype": "Data",
      "label": "Customer Name",
      "reqd": 1
    }
  ]
}
```

**Custom Fields (Database):**
```python
# Created via UI or code
frappe.get_doc({
    "doctype": "Custom Field",
    "dt": "Customer",
    "fieldname": "custom_notes",
    "fieldtype": "Text",
    "label": "Custom Notes"
}).insert()
```

#### 2. **Meta Object Creation**

When Frappe needs field information, it creates a Meta object:

```python
# In frappe/model/meta.py
class Meta(Document):
    def __init__(self, doctype):
        # Loads DocType definition
        self.load_from_db()
        # Processes fields
        self.process()
    
    def process(self):
        # Adds custom fields
        self.add_custom_fields()
        # Applies property setters
        self.apply_property_setters()
        # Initializes field caches
        self.init_field_caches()
        # Sorts fields by idx
        self.sort_fields()
```

**What Meta Contains:**
- All field definitions (standard + custom)
- Field properties and validations
- Permissions and workflows
- Relationships and links

#### 3. **Database Schema Creation**

Frappe creates database columns based on field definitions:

```python
# In frappe/database/schema.py
class DBTable:
    def get_columns_from_docfields(self):
        fields = self.meta.get_fieldnames_with_value(with_field_meta=True)
        
        for field in fields:
            if field.get("is_virtual"):
                continue  # Skip virtual fields
            
            # Creates DbColumn object
            self.columns[field.get("fieldname")] = DbColumn(
                fieldname=field.get("fieldname"),
                fieldtype=field.get("fieldtype"),
                length=field.get("length"),
                precision=field.get("precision"),
                # ... other properties
            )
```

**Database Column Mapping:**

| Fieldtype | Database Type | Example |
|-----------|--------------|---------|
| Data | VARCHAR(length) | `customer_name VARCHAR(140)` |
| Int | INT or BIGINT | `quantity INT` |
| Float | DECIMAL(18, precision) | `rate DECIMAL(18,2)` |
| Currency | DECIMAL(18, precision) | `amount DECIMAL(18,2)` |
| Date | DATE | `posting_date DATE` |
| Datetime | DATETIME | `creation DATETIME(6)` |
| Text | TEXT | `description TEXT` |
| Long Text | LONGTEXT | `notes LONGTEXT` |
| Check | INT(1) | `is_active INT(1)` |
| Link | VARCHAR(140) | `customer VARCHAR(140)` |
| Table | (No column) | Stored as separate documents |

#### 4. **Form Generation**

Frappe generates forms from field definitions:

**Frontend Process:**
1. Loads Meta object (cached)
2. Reads field definitions
3. Generates HTML form elements based on fieldtype
4. Applies field properties (width, depends_on, etc.)
5. Adds validation rules

**Fieldtype → Widget Mapping:**

| Fieldtype | Form Widget |
|-----------|-------------|
| Data | `<input type="text">` |
| Int/Float/Currency | `<input type="number">` |
| Date | Date picker component |
| Datetime | Date-time picker component |
| Link | Searchable dropdown |
| Select | Dropdown select |
| Check | Checkbox |
| Table | Editable grid |
| Text/Long Text | Textarea |
| Attach | File upload button |

#### 5. **Validation Execution**

When saving a document, Frappe validates fields:

**Validation Order:**
1. **Type Validation**: Ensures value matches fieldtype
2. **Required Validation**: Checks mandatory fields have values
3. **Unique Validation**: Verifies uniqueness (if `unique: 1`)
4. **Custom Validation**: Runs Python/JavaScript validators
5. **Link Validation**: Verifies linked documents exist

**Code Example:**
```python
# In frappe/model/document.py
def validate(self):
    # Type validation
    for field in self.meta.fields:
        value = self.get(field.fieldname)
        if value:
            # Validate based on fieldtype
            self.validate_fieldtype(field, value)
    
    # Required validation
    for field in self.meta.get("fields", {"reqd": 1}):
        if not self.get(field.fieldname):
            frappe.throw(f"{field.label} is mandatory")
    
    # Custom validation
    self.run_method("validate")
```

### Field Property Processing

#### Default Values

Default values are processed when creating new documents:

**Special Default Values:**
- `"Today"` → Current date (for Date fields)
- `"now"` → Current datetime (for Datetime fields)
- `"__user"` → Current logged-in user
- `":fieldname"` → Value from another field

**Processing:**
```python
# In frappe/model/document.py
def set_default_values(self):
    for field in self.meta.fields:
        if field.default:
            if field.default == "Today":
                self.set(field.fieldname, today())
            elif field.default == "__user":
                self.set(field.fieldname, frappe.session.user)
            elif field.default.startswith(":"):
                # Fetch from another field
                source_field = field.default[1:]
                self.set(field.fieldname, self.get(source_field))
```

#### Fetch From

Fetch from automatically copies values from linked documents:

**How It Works:**
1. User selects a value in Link field
2. Frappe detects Link field change
3. Reads `fetch_from` property (e.g., `"customer.email"`)
4. Loads linked document
5. Copies specified field value
6. Updates current document

**Code Flow:**
```python
# When customer field changes
if self.has_value_changed("customer"):
    # Get fetch_from fields
    fetch_fields = [f for f in self.meta.fields 
                   if f.fetch_from and f.fetch_from.startswith("customer.")]
    
    # Load customer document
    customer = frappe.get_doc("Customer", self.customer)
    
    # Copy values
    for field in fetch_fields:
        source_field = field.fetch_from.split(".")[1]
        self.set(field.fieldname, customer.get(source_field))
```

#### Depends On

Depends on controls field visibility using JavaScript expressions:

**How It Works:**
1. Frappe evaluates JavaScript expression
2. Expression has access to `doc` object (current document)
3. If expression returns `true`, field is shown
4. If `false`, field is hidden
5. Re-evaluates when dependent fields change

**Example Expression:**
```javascript
// depends_on: "eval:doc.status=='Active'"
// Evaluates to true if status equals "Active"
if (doc.status == 'Active') {
    show_field();
} else {
    hide_field();
}
```

**Frontend Implementation:**
- Frappe watches dependent fields
- Re-evaluates expression on change
- Shows/hides field dynamically
- Updates form layout

### Field Caching

Frappe caches Meta objects for performance:

**Cache Structure:**
```python
# Cache key: "doctype_meta:{doctype_name}"
frappe.cache.hset("doctype_meta", "Customer", meta_object)
```

**Cache Invalidation:**
- When DocType is updated
- When Custom Field is added/modified
- When Property Setter is applied
- Manual cache clear: `frappe.clear_cache(doctype="Customer")`

**Why Caching Matters:**
- Loading Meta from database is expensive
- Forms load faster with cached Meta
- Reduces database queries
- Improves overall application performance

### Virtual Fields

Virtual fields don't create database columns:

**How They Work:**
1. Defined in DocType but `is_virtual: 1`
2. No database column created
3. Value computed in Python when document loads
4. Can access other fields, linked documents, etc.

**Example:**
```python
# In Customer DocType Python file
def get_full_name(self):
    return f"{self.first_name} {self.last_name}"

# Virtual field definition
{
    "fieldname": "full_name",
    "fieldtype": "Data",
    "is_virtual": 1,
    "read_only": 1
}

# Value computed when accessed
doc.full_name  # Calls get_full_name() method
```

**Use Cases:**
- Computed values (totals, concatenations)
- Formatted displays
- Values derived from linked documents
- Complex calculations

### Field Permissions

Fields can have permission levels (`permlevel`):

**How It Works:**
1. Fields have `permlevel` property (0-9)
2. DocPerm records define user role permissions
3. Users only see/edit fields they have permission for
4. Higher permlevel = more restricted

**Example:**
```python
# Field definition
{
    "fieldname": "salary",
    "fieldtype": "Currency",
    "permlevel": 1  # Restricted access
}

# Permission definition
{
    "role": "Employee",
    "permlevel": 0,  # Can only access permlevel 0 fields
    "read": 1
}
# Employee role cannot see salary field (permlevel 1)

{
    "role": "HR Manager",
    "permlevel": 1,  # Can access permlevel 0 and 1
    "read": 1,
    "write": 1
}
# HR Manager can see and edit salary field
```

### Field Indexing

Fields can have database indexes for faster searching:

**Search Index (`search_index: 1`):**
- Creates database index on field
- Speeds up WHERE clause queries
- Useful for frequently searched fields
- Only for certain fieldtypes (Data, Link, etc.)

**Unique Index (`unique: 1`):**
- Creates unique constraint
- Prevents duplicate values
- Automatically creates index
- Only for Data, Link, Read Only fields

**Code:**
```python
# In frappe/database/schema.py
if field.search_index:
    # Creates index
    frappe.db.sql(f"CREATE INDEX idx_{fieldname} ON `tab{doctype}` (`{fieldname}`)")

if field.unique:
    # Creates unique constraint
    frappe.db.sql(f"ALTER TABLE `tab{doctype}` ADD UNIQUE (`{fieldname}`)")
```

---

## Conclusion

Fields are the core building blocks of Frappe DocTypes, defining data structure, validation, user interface, and business logic. Understanding field types and properties is essential for effective Frappe development. This documentation covers all 47 field types and their properties, providing a comprehensive reference for working with Frappe fields.

### Key Takeaways

1. **Fields define everything**: Data structure, validation, UI, database schema, and business logic
2. **Fields are stored as DocField documents**: Enabling dynamic creation and modification
3. **Fields map to database columns**: Understanding this helps with performance and data management
4. **Fields control form generation**: Frappe automatically creates forms from field definitions
5. **Fields enable relationships**: Link fields create connections between documents
6. **Fields support business logic**: Fetch from, depends on, virtual fields enable automation
7. **Fields have permissions**: Fine-grained access control through permission levels
8. **Fields are cached**: Meta objects are cached for performance

### Next Steps

- Practice creating DocTypes with different field types
- Experiment with field properties (depends_on, fetch_from, etc.)
- Understand how fields map to database columns
- Learn about Custom Fields and Property Setters
- Explore field validation and business logic
- Study how fields work in forms and list views

This comprehensive guide provides everything you need to understand and work with Frappe fields effectively.
