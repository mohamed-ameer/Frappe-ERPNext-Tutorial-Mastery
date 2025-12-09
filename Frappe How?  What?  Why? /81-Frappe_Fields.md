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
-  Reduces data entry time
-  Ensures data consistency (always uses source document's value)
-  Prevents typos and errors
-  Automatically updates if source document changes (on save)
-  Improves user experience

**Limitations:**
-  Only works with Link fields (not Dynamic Link directly)
-  Source field must exist in linked DocType
-  Fetches on save, not real-time (unless using client-side script)
-  Cannot fetch computed/virtual fields from linked document

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
-  Ensures data completeness
-  Prevents incomplete records
-  Enforces business rules
-  Improves data quality

**Best Practices:**
-  Only mark truly essential fields as required
-  Use `mandatory_depends_on` for conditional requirements
-  Provide clear error messages
-  Consider user workflow (don't require fields users can't fill yet)

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
-  Email addresses (one email per user)
-  Identification numbers (SSN, Tax ID)
-  Usernames (unique login names)
-  Product codes (unique SKUs)
-  Account numbers (unique identifiers)

**Why use unique fields:**
-  Prevents duplicate data
-  Ensures data integrity
-  Enables efficient lookups
-  Enforces business rules

**Best Practices:**
-  Use for truly unique identifiers
-  Consider case sensitivity requirements
-  Clean up existing duplicates before enabling
-  Use in combination with `reqd: 1` for identifiers
-  Document why field must be unique

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

---

###  **IMPORTANT NOTES: Hidden Field Constraints**

#### Constraint: Hidden + Mandatory Requires Default

**Rule:** A field **cannot be both hidden (`hidden: 1`) and mandatory (`reqd: 1`) without a default value**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_hidden_and_mandatory(docname, d):
    if d.hidden and d.reqd and not d.default and not frappe.flags.in_migrate:
        frappe.throw(
            _("{0}: Field {1} in row {2} cannot be hidden and mandatory without default").format(
                docname, d.label, d.idx
            ),
            HiddenAndMandatoryWithoutDefaultError,
        )
```

**Error Message:**
```
"{doctype}: Field {label} in row {idx} cannot be hidden and mandatory without default"
```

**Why this constraint exists:**
- If field is hidden, users can't see it to fill it
- If field is mandatory, it must have a value
- Without default, field would be impossible to fill
- This would cause save failures

**Example -  Wrong:**
```json
{
  "fieldname": "system_field",
  "fieldtype": "Data",
  "hidden": 1,
  "reqd": 1
  // ERROR: Hidden + mandatory without default!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "system_field",
  "fieldtype": "Data",
  "hidden": 1,
  "reqd": 1,
  "default": "system_value"  // Provides default value
}
```

**Alternative Solutions:**

**Option 1: Remove mandatory requirement**
```json
{
  "fieldname": "system_field",
  "fieldtype": "Data",
  "hidden": 1,
  "reqd": 0  // Not mandatory
}
```

**Option 2: Set default value**
```json
{
  "fieldname": "system_field",
  "fieldtype": "Data",
  "hidden": 1,
  "reqd": 1,
  "default": "auto_value"  // Auto-filled
}
```

**Option 3: Set in code instead**
```python
# In DocType Python file
def before_save(self):
    if not self.system_field:
        self.system_field = "calculated_value"
```

**Use Cases for Hidden Fields:**
- System-calculated values
- Internal tracking fields
- Fields populated by scripts
- Fields used in formulas but not user-editable

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
-  Creates dynamic, context-aware forms
-  Reduces form clutter (only shows relevant fields)
-  Improves user experience
-  Prevents errors (hides irrelevant fields)
-  Guides users through workflows

**Best Practices:**
-  Keep expressions simple and readable
-  Test expressions thoroughly
-  Use helper functions for complex logic
-  Document complex expressions
-  Consider performance (avoid heavy computations)

**Common Mistakes:**
-  Forgetting `"eval:"` prefix
-  Using Python syntax instead of JavaScript
-  Not handling null/undefined values
-  Complex expressions that are hard to maintain
-  Circular dependencies (field A depends on B, B depends on A)

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

---

###  **IMPORTANT NOTES: Search Index Constraints**

#### Constraint: Cannot Index Text Fields

**Rule:** Fields of type Text, Long Text, Small Text, Code, or Text Editor **cannot be indexed**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
if d.search_index and d.fieldtype in ("Text", "Long Text", "Small Text", "Code", "Text Editor"):
    frappe.throw(
        _("{0}:Fieldtype {1} for {2} cannot be indexed").format(docname, d.fieldtype, d.label),
        CannotIndexedError,
    )
```

**Error Message:**
```
"{doctype}:Fieldtype {fieldtype} for {label} cannot be indexed"
```

**Why this constraint exists:**
- Text fields can store very large amounts of data
- Database indexes on large text fields are inefficient
- MySQL/MariaDB have limitations on indexing TEXT columns
- Full-text search is used instead for text fields

**Example -  Wrong:**
```json
{
  "fieldname": "description",
  "fieldtype": "Long Text",
  "search_index": 1  // ERROR: Text fields can't be indexed!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "item_code",
  "fieldtype": "Data",
  "search_index": 1  // Data fields can be indexed
}
```

**Fields That CAN Be Indexed:**
- Data (with length limit)
- Link
- Int
- Float
- Currency
- Date
- Datetime
- Check

**Fields That CANNOT Be Indexed:**
- Text
- Long Text
- Small Text
- Code
- Text Editor
- HTML Editor
- Markdown Editor
- Virtual fields

**How Indexes Work:**

**Database Level:**
```sql
-- When search_index: 1, Frappe creates:
CREATE INDEX idx_item_code ON `tabItem` (`item_code`);
```

**Performance Impact:**
-  **Faster queries**: `WHERE item_code = 'ABC'` uses index
-  **Faster sorting**: `ORDER BY item_code` uses index
-  **Faster joins**: Joins on indexed fields are faster
-  **Slower inserts**: Indexes must be updated on insert
-  **More storage**: Indexes take additional disk space

**When to Use Search Index:**
- Fields frequently used in WHERE clauses
- Fields used for sorting
- Fields used in joins
- Fields with many unique values

**When NOT to Use Search Index:**
- Fields rarely queried
- Fields with few unique values (like status fields with 3-4 options)
- Text fields (use full-text search instead)

#### `is_virtual` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field doesn't exist in database, computed on-the-fly
- **Usage**: For calculated fields that don't need storage
- **Example**: `{"is_virtual": 1}` - Virtual field

---

###  **IMPORTANT NOTES: Virtual Field Constraints**

#### Constraint 1: Cannot Appear in List View

**Rule:** Virtual fields **cannot be included in list view** (`in_list_view: 1`).

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
not_allowed_in_list_view = list(copy.copy(no_value_fields))
# ... includes virtual fields

def check_in_list_view(is_table, d):
    if d.in_list_view and (d.fieldtype in not_allowed_in_list_view):
        property_label = "In Grid View" if is_table else "In List View"
        frappe.throw(
            _("'{0}' not allowed for type {1} in row {2}").format(property_label, d.fieldtype, d.idx)
        )
```

**Error Message:**
```
"'In List View' not allowed for type {fieldtype} in row {idx}"
```

**Why this constraint exists:**
- Virtual fields are computed on-the-fly
- List views query database directly
- Virtual fields don't exist in database
- Computing virtual fields for many rows would be slow

**Example -  Wrong:**
```json
{
  "fieldname": "full_name",
  "fieldtype": "Data",
  "is_virtual": 1,
  "in_list_view": 1  // ERROR: Virtual fields can't be in list view!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "full_name",
  "fieldtype": "Data",
  "is_virtual": 1,
  "in_list_view": 0  // Virtual fields only in forms
}
```

#### Constraint 2: Cannot Be Indexed

**Rule:** Virtual fields **cannot have search index** (`search_index: 1`).

**Why this constraint exists:**
- Indexes are database structures
- Virtual fields don't exist in database
- Cannot create index on non-existent column

**Example -  Wrong:**
```json
{
  "fieldname": "computed_value",
  "fieldtype": "Data",
  "is_virtual": 1,
  "search_index": 1  // ERROR: Cannot index virtual fields!
}
```

#### How Virtual Fields Work

**Computation:**
Virtual fields are computed in Python when document is loaded:

```python
# In DocType Python file (e.g., customer.py)
class Customer(Document):
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    # Virtual field is accessed like regular field
    # doc.full_name calls get_full_name() method
```

**When Computed:**
- When document is loaded: `doc = frappe.get_doc("Customer", "CUST-00001")`
- When accessed: `doc.full_name` triggers computation
- Not stored in database
- Re-computed each time document is accessed

**Use Cases:**
- Computed values (totals, concatenations)
- Formatted displays
- Values derived from other fields
- Complex calculations

**Performance Considerations:**
- Virtual fields are computed every time document loads
- Avoid heavy computations in virtual fields
- Consider caching if computation is expensive

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

**What it is:** Data field is the most basic text input field. It stores single-line text strings. Can be enhanced with special validation types through the `options` property.

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

---

###  **IMPORTANT NOTES: Data Field Constraints**

#### Constraint: Options Must Be Valid Data Field Type

**Rule:** If `options` is specified, it **must be one of the allowed special types**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def validate_data_field_type(docfield):
    if docfield.fieldtype == "Data" and not (docfield.oldfieldtype and docfield.oldfieldtype != "Data"):
        if docfield.options and (docfield.options not in data_field_options):
            df_str = frappe.bold(_(docfield.label, context=docfield.parent))
            text_str = (
                _("{0} is an invalid Data field.").format(df_str)
                + "<br>" * 2
                + _("Only Options allowed for Data field are:")
                + "<br>"
            )
            df_options_str = "<ul><li>" + "</li><li>".join(_(x) for x in data_field_options) + "</ul>"
            
            frappe.msgprint(text_str + df_options_str, title="Invalid Data Field", alert=True)
```

**Allowed Options:**
- `"Email"` - Email format validation
- `"Name"` - Name format (alphanumeric, spaces, hyphens)
- `"Phone"` - Phone number format
- `"URL"` - URL format validation
- `"Barcode"` - Barcode scanner support
- `"IBAN"` - IBAN bank account format

**Error Message:**
```
"{field_label} is an invalid Data field.
Only Options allowed for Data field are:
• Email
• Name
• Phone
• URL
• Barcode
• IBAN"
```

**Why this constraint exists:**
- Data field `options` is reserved for special validation types
- Prevents confusion with other fieldtypes (like Select)
- Ensures consistent validation behavior

**Example -  Wrong:**
```json
{
  "fieldname": "status",
  "fieldtype": "Data",
  "options": "Draft\nSubmitted\nCancelled"  // ERROR: Use Select fieldtype instead!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "email",
  "fieldtype": "Data",
  "options": "Email"  // Valid: Enables email validation
}
```

**Special Option Behaviors:**

**Email (`options: "Email"`):**
- Validates email format (contains @, valid domain)
- Shows email icon in forms
- Can trigger email-related features

**Name (`options: "Name"`):**
- Validates name format (alphanumeric, spaces, hyphens allowed)
- Prevents special characters
- Useful for person/company names

**Phone (`options: "Phone"`):**
- Validates phone number format
- Can include country codes
- Format: +1234567890 or (123) 456-7890

**URL (`options: "URL"`):**
- Validates URL format (http://, https://)
- Shows clickable link icon when valid
- Opens URL in new tab on click

**Barcode (`options: "Barcode"`):**
- Shows barcode scanner button
- Validates barcode format
- Can display barcode image

**IBAN (`options: "IBAN"`):**
- Validates IBAN bank account format
- Automatically formats with spaces
- Length: up to 34 characters

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

**What it is:** Float field stores decimal numbers (numbers with fractional parts). Useful for prices, rates, percentages, measurements, etc.

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

###  **IMPORTANT NOTES: Float Field Constraints**

#### Constraint: Precision Must Be Between 1 and 6

**Rule:** `precision` for Float, Currency, and Percent fields **must be between 1 and 6**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_precision(d):
    if (
        d.fieldtype in ("Currency", "Float", "Percent")
        and d.precision is not None
        and not (1 <= cint(d.precision) <= 6)
    ):
        frappe.throw(_("Precision should be between 1 and 6"))
```

**Error Message:**
```
"Precision should be between 1 and 6"
```

**Why this constraint exists:**
- Precision 0 means no decimals (use Int instead)
- Precision > 6 becomes impractical for most use cases
- Database storage considerations (DECIMAL(18,6) is standard)

**Example -  Wrong:**
```json
{
  "fieldname": "rate",
  "fieldtype": "Float",
  "precision": "0"  // ERROR: Use Int fieldtype instead!
}
```

```json
{
  "fieldname": "rate",
  "fieldtype": "Float",
  "precision": "10"  // ERROR: Must be 1-6!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "rate",
  "fieldtype": "Float",
  "precision": "2"  // Shows 2 decimal places: 100.50
}
```

**Database Storage:**
- Float fields stored as `DECIMAL(18, precision)`
- Example: `precision: "2"` → `DECIMAL(18,2)` → Stores up to 18 digits total, 2 after decimal
- Maximum value: 999,999,999,999,999.99 (with precision 2)

**Common Precision Values:**
- **Precision 1**: Simple decimals (10.5)
- **Precision 2**: Currency, percentages (100.50)
- **Precision 3**: Detailed measurements (100.500)
- **Precision 4-6**: Scientific/technical calculations

---

#### 8. Currency
**Purpose**: Currency amount with formatting

**What it is:** Currency field stores monetary amounts with automatic currency symbol formatting. It's similar to Float but with currency-specific formatting and validation.

**Properties**:
- `precision`: Decimal places (default: 2, must be 1-6)
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

###  **IMPORTANT NOTES: Currency Field Constraints**

#### Constraint 1: Precision Must Be 1-6

**Rule:** `precision` **must be between 1 and 6** (same as Float field).

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_precision(d):
    if (
        d.fieldtype in ("Currency", "Float", "Percent")
        and d.precision is not None
        and not (1 <= cint(d.precision) <= 6)
    ):
        frappe.throw(_("Precision should be between 1 and 6"))
```

**Error Message:**
```
"Precision should be between 1 and 6"
```

**Why this constraint exists:**
- Currency precision determines decimal places (cents, etc.)
- Standard is 2 decimal places (dollars and cents)
- Precision > 6 becomes impractical for currency
- Database storage considerations

**Example -  Wrong:**
```json
{
  "fieldname": "amount",
  "fieldtype": "Currency",
  "precision": "10"  // ERROR: Must be 1-6!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "amount",
  "fieldtype": "Currency",
  "precision": "2"  // Standard: dollars and cents
}
```

#### Constraint 2: Width Limitation

**Rule:** Currency fields have a **maximum width of 100px**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_width(d):
    if d.fieldtype == "Currency" and cint(d.width) < 100:
        frappe.throw(_("Max width for type Currency is 100px in row {0}").format(d.idx))
```

**Error Message:**
```
"Max width for type Currency is 100px in row {idx}"
```

**Why this constraint exists:**
- Currency values need space for currency symbol, formatting, and numbers
- Too narrow fields truncate currency display
- Ensures proper formatting visibility

**Example -  Wrong:**
```json
{
  "fieldname": "amount",
  "fieldtype": "Currency",
  "width": "50px"  // ERROR: Too narrow! Minimum 100px
}
```

**Example -  Correct:**
```json
{
  "fieldname": "amount",
  "fieldtype": "Currency",
  "width": "150px"  // Adequate width for currency display
}
```

#### Currency Formatting

**How Currency is Displayed:**

Currency fields automatically format based on:
1. **Company currency**: From Company DocType
2. **System currency**: From System Settings
3. **User preferences**: User's preferred currency

**Format Examples:**
- USD: `$1,234.56`
- EUR: `€1.234,56` (European format)
- INR: `₹1,234.56`
- GBP: `£1,234.56`

**Database Storage:**
- Stored as `DECIMAL(18, precision)`
- Example: `precision: "2"` → `DECIMAL(18,2)`
- Stores numeric value only (no currency symbol)
- Currency symbol added during display

**Currency Conversion:**
- Currency fields can be converted using Currency Exchange rates
- Multi-currency transactions supported
- Base currency vs transaction currency

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

**What it is:** Check field is a boolean field that stores either 0 (unchecked/false) or 1 (checked/true). It displays as a checkbox in forms.

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

###  **IMPORTANT NOTES: Check Field Constraints**

#### Constraint 1: Default Must Be 0 or 1

**Rule:** Check field `default` value **must be exactly `"0"` or `"1"`** (as strings).

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_illegal_default(d):
    if d.fieldtype == "Check" and not d.default:
        d.default = "0"  # Auto-set to "0" if not provided
    if d.fieldtype == "Check" and cint(d.default) not in (0, 1):
        frappe.throw(
            _("Default for 'Check' type of field {0} must be either '0' or '1'").format(
                frappe.bold(d.fieldname)
            )
        )
```

**Error Message:**
```
"Default for 'Check' type of field {fieldname} must be either '0' or '1'"
```

**Why this constraint exists:**
- Check fields only store boolean values (0 or 1)
- Database column is INT(1) which only accepts 0 or 1
- Prevents invalid default values

**Example -  Wrong:**
```json
{
  "fieldname": "is_active",
  "fieldtype": "Check",
  "default": "true"  // ERROR: Must be "0" or "1"
}
```

**Example -  Correct:**
```json
{
  "fieldname": "is_active",
  "fieldtype": "Check",
  "default": "1"  // Checked by default
}
```

#### Constraint 2: Auto-Default to 0

**Rule:** If no default is specified, Frappe **automatically sets default to `"0"`**.

**Behavior:**
- If `default` is not provided → Set to `"0"` (unchecked)
- If `default` is empty string → Set to `"0"`
- If `default` is `null` → Set to `"0"`

**Database Storage:**
- Check fields are stored as `INT(1)` in database
- `0` = unchecked/false
- `1` = checked/true
- Default database constraint: `NOT NULL DEFAULT 0`

**Usage in Code:**
```python
# Check if checkbox is checked
if doc.is_active:  # True if value is 1
    # Do something

# Set checkbox
doc.is_active = 1  # Check
doc.is_active = 0  # Uncheck

# Toggle
doc.is_active = 1 - doc.is_active  # Toggle value
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

---

###  **IMPORTANT NOTES: Link Field Constraints**

#### Constraint 1: Options Must Be Valid DocType

**Rule:** `options` **must be a valid DocType name** that exists in the system.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_link_table_options(docname, d):
    if d.fieldtype in ("Link", *table_fields):
        if not d.options:
            frappe.throw(
                _("{0}: Options required for Link or Table type field {1} in row {2}").format(
                    docname, d.label, d.idx
                ),
                DoctypeLinkError,
            )
        if d.options == "[Select]" or d.options == d.parent:
            return
        if d.options != d.parent:
            options = frappe.db.get_value("DocType", d.options, "name")
            if not options:
                frappe.throw(
                    _("{0}: Options must be a valid DocType for field {1} in row {2}").format(
                        docname, d.label, d.idx
                    ),
                    WrongOptionsDoctypeLinkError,
                )
```

**Error Messages:**
1. If options not provided: `"{doctype}: Options required for Link or Table type field {label} in row {idx}"`
2. If DocType doesn't exist: `"{doctype}: Options must be a valid DocType for field {label} in row {idx}"`

**Why this constraint exists:**
- Link fields need to know which DocType to link to
- Invalid DocType names would cause runtime errors
- Ensures referential integrity

**Example -  Wrong:**
```json
{
  "fieldname": "customer",
  "fieldtype": "Link"
  // ERROR: options missing!
}
```

```json
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "options": "NonExistentDocType"  // ERROR: DocType doesn't exist!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "options": "Customer"  // Valid DocType name
}
```

#### Constraint 2: Self-Reference Allowed

**Rule:** Link fields **can link to the same DocType** (`options` can equal `parent`).

**Special Case:**
```python
if d.options == d.parent:
    return  # Self-reference is allowed
```

**Use Case:** DocTypes that reference themselves (tree structures):
- Employee → Manager (Employee)
- Account → Parent Account (Account)
- Company → Parent Company (Company)

**Example:**
```json
{
  "doctype": "Employee",
  "fields": [
    {
      "fieldname": "manager",
      "fieldtype": "Link",
      "options": "Employee"  // Self-reference allowed!
    }
  ]
}
```

#### Constraint 3: Case Sensitivity

**Rule:** DocType names are **case-sensitive**. `"Customer"` ≠ `"customer"`.

**Validation:**
```python
elif not (options == d.options):
    frappe.throw(
        _("{0}: Options {1} must be the same as doctype name {2} for the field {3}").format(
            docname, d.options, options, d.label
        ),
        DoctypeLinkError,
    )
```

**Example:**
```json
// If DocType is "Customer" (capital C)
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "options": "customer"  // ERROR: Case mismatch!
}

// Correct:
{
  "fieldname": "customer",
  "fieldtype": "Link",
  "options": "Customer"  // Matches exact case
}
```

#### How Link Fields Validate Documents

**Validation Process:**

1. **On Save**: Frappe checks if linked document exists
2. **If not exists**: Throws validation error
3. **If exists**: Saves the link

**Code:**
```python
# In frappe/model/document.py
def validate_link(self, df, value):
    if value and df.fieldtype == "Link":
        if not frappe.db.exists(df.options, value):
            frappe.throw(
                _("Invalid Link: {0}").format(value),
                frappe.LinkValidationError
            )
```

**Error Message:**
```
"Invalid Link: {document_name}"
```

**Why This Matters:**
- Prevents broken references
- Ensures data integrity
- Catches typos and invalid selections

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

**What it is:** Dynamic Link is a special Link field that can link to different DocTypes based on the value in another field. Unlike regular Link fields that link to a fixed DocType, Dynamic Link changes its target DocType dynamically.

**Properties**:
- `options`: **Required** - Fieldname that contains the DocType name (not the DocType name itself!)
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

###  **IMPORTANT NOTES: Dynamic Link Constraints**

#### Constraint 1: Options Must Point to Another Field

**Rule:** `options` must be a **fieldname** (not a DocType name) that contains the DocType name.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_dynamic_link_options(d):
    if d.fieldtype == "Dynamic Link":
        doctype_pointer = list(filter(lambda df: df.fieldname == d.options, fields))
        if (
            not doctype_pointer
            or (doctype_pointer[0].fieldtype not in ("Link", "Select"))
            or (doctype_pointer[0].fieldtype == "Link" and doctype_pointer[0].options != "DocType")
        ):
            frappe.throw(
                _(
                    "Options 'Dynamic Link' type of field must point to another Link Field with options as 'DocType'"
                )
            )
```

**Error Message:**
```
"Options 'Dynamic Link' type of field must point to another Link Field with options as 'DocType'"
```

**Why this constraint exists:**
- Dynamic Link needs to know which DocType to link to
- It reads this from another field's value
- That field must exist and contain valid DocType names

**Example -  Wrong:**
```json
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "Sales Order"  // ERROR: Should be a fieldname, not DocType name!
}
```

**Example -  Correct:**
```json
// Step 1: Create the "pointer" field
{
  "fieldname": "reference_type",
  "fieldtype": "Select",  // Or Link with options: "DocType"
  "options": "Sales Order\nPurchase Order\nDelivery Note"
}

// Step 2: Create Dynamic Link field pointing to the pointer field
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "reference_type"  // Points to fieldname, not DocType!
}
```

#### Constraint 2: Pointer Field Must Be Link or Select

**Rule:** The field specified in `options` must be either:
- **Link field** with `options: "DocType"` (links to DocType DocType)
- **Select field** with DocType names as options

**Why Each Approach:**

**Approach 1: Link to DocType DocType**
```json
{
  "fieldname": "reference_type",
  "fieldtype": "Link",
  "options": "DocType",  // Links to DocType DocType
  "label": "Reference Type"
}

{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "reference_type"  // Reads DocType name from reference_type
}
```
- **Pros**: User can select from all DocTypes in system
- **Cons**: Less control, can select invalid DocTypes

**Approach 2: Select with Specific Options**
```json
{
  "fieldname": "reference_type",
  "fieldtype": "Select",
  "options": "Sales Order\nPurchase Order\nDelivery Note",
  "label": "Reference Type"
}

{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "reference_type"  // Reads DocType name from reference_type
}
```
- **Pros**: Controlled list, only valid DocTypes
- **Cons**: Must update options if new DocTypes added

#### How Dynamic Link Works

**Step-by-Step Process:**

1. **User selects reference type:**
   ```python
   doc.reference_type = "Sales Order"  # Selected from Select field
   ```

2. **Dynamic Link field reads the value:**
   ```python
   # Frappe internally does:
   target_doctype = doc.reference_type  # "Sales Order"
   ```

3. **Dynamic Link changes its target:**
   ```python
   # Now reference_name links to Sales Order DocType
   doc.reference_name = "SO-00001"  # Valid Sales Order name
   ```

4. **If reference_type changes:**
   ```python
   doc.reference_type = "Purchase Order"  # Changed
   # reference_name now links to Purchase Order DocType
   doc.reference_name = "PO-00001"  # Valid Purchase Order name
   ```

**Real-World Use Case:**

**Payment Entry** can reference multiple DocTypes:
```json
{
  "fieldname": "reference_type",
  "fieldtype": "Select",
  "options": "Sales Invoice\nPurchase Invoice\nJournal Entry",
  "label": "Reference Type"
},
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "reference_type",
  "label": "Reference Name"
}
```

**How It Works:**
- If `reference_type = "Sales Invoice"` → `reference_name` links to Sales Invoice
- If `reference_type = "Purchase Invoice"` → `reference_name` links to Purchase Invoice
- One field handles multiple DocTypes dynamically!

**Common Mistakes:**

 **Mistake 1: Using DocType name instead of fieldname**
```json
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "Sales Order"  // WRONG: Should be fieldname
}
```

 **Mistake 2: Pointer field doesn't exist**
```json
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "non_existent_field"  // WRONG: Field doesn't exist
}
```

 **Mistake 3: Pointer field is wrong type**
```json
{
  "fieldname": "reference_type",
  "fieldtype": "Data",  // WRONG: Should be Link or Select
  "options": "Sales Order"
}
```

 **Correct Setup:**
```json
// 1. Create pointer field first
{
  "fieldname": "reference_type",
  "fieldtype": "Select",
  "options": "Sales Order\nPurchase Order"
}

// 2. Create Dynamic Link pointing to pointer field
{
  "fieldname": "reference_name",
  "fieldtype": "Dynamic Link",
  "options": "reference_type"  // Points to fieldname
}
```

---

#### 17. Select
**Purpose**: Dropdown selection from predefined options

**What it is:** Select field provides a dropdown list of predefined options. Users can only select from the provided options, ensuring data consistency.

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

###  **IMPORTANT NOTES: Select Field Constraints**

#### Constraint 1: Options Must Be Set Before Default

**Rule:** If `default` is specified, `options` **must be set first** and default value **must exist in options**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_illegal_default(d):
    if d.fieldtype == "Select" and d.default:
        if not d.options:
            frappe.throw(
                _("Options for {0} must be set before setting the default value.").format(
                    frappe.bold(d.fieldname)
                )
            )
        elif d.default not in d.options.split("\n"):
            frappe.throw(
                _("Default value for {0} must be in the list of options.").format(
                    frappe.bold(d.fieldname)
                )
            )
```

**Error Messages:**
1. If options not set: `"Options for {fieldname} must be set before setting the default value."`
2. If default not in options: `"Default value for {fieldname} must be in the list of options."`

**Why this constraint exists:**
- Default value must be a valid option
- Prevents invalid defaults that don't exist in dropdown
- Ensures data consistency

**Example -  Wrong:**
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "default": "Draft",  // ERROR: Options not set yet!
  "options": "Draft\nSubmitted"
}
```

**Example -  Wrong:**
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "options": "Draft\nSubmitted",
  "default": "Active"  // ERROR: "Active" not in options!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "options": "Draft\nSubmitted\nCancelled",
  "default": "Draft"  // "Draft" exists in options
}
```

#### Constraint 2: Options Are Trimmed

**Rule:** Frappe automatically **strips whitespace** from options.

**Validation Code:**
```python
def scrub_options_in_select(field):
    if field.fieldtype == "Select" and field.options is not None:
        options_list = []
        for i, option in enumerate(field.options.split("\n")):
            _option = option.strip()  # Strips whitespace
            if i == 0 or _option:
                options_list.append(_option)
        field.options = "\n".join(options_list)
```

**Behavior:**
- Leading/trailing spaces are removed
- Empty lines are removed (except first line)
- `"Option 1\n  Option 2  \nOption 3"` becomes `"Option 1\nOption 2\nOption 3"`

**Why this matters:**
- Prevents issues with spaces in option values
- Ensures consistent matching
- `"Draft"` and `"Draft "` would be treated as different without trimming

#### Constraint 3: Options Format

**Rule:** Options must be separated by **newlines** (`\n`), not commas or other separators.

**Correct Format:**
```
Option 1
Option 2
Option 3
```

**In JSON:**
```json
{
  "options": "Option 1\nOption 2\nOption 3"
}
```

**Common Mistakes:**

 **Wrong - Using commas:**
```json
{
  "options": "Draft, Submitted, Cancelled"  // WRONG!
}
```

 **Wrong - Using semicolons:**
```json
{
  "options": "Draft; Submitted; Cancelled"  // WRONG!
}
```

 **Correct - Using newlines:**
```json
{
  "options": "Draft\nSubmitted\nCancelled"  // CORRECT!
}
```

#### Best Practices for Select Fields

**1. Use Clear, Consistent Option Names:**
 **Good:**
```
Draft
Submitted
Cancelled
```

 **Bad:**
```
draft
SUBMITTED
Cancelled
Draft (old)
```

**2. Order Options Logically:**
- Most common first
- Or alphabetical (if `sort_options: 1`)
- Or workflow order (Draft → Submitted → Cancelled)

**3. Keep Options Stable:**
- Avoid changing option names (breaks existing data)
- Add new options at end
- Mark deprecated options clearly

**4. Use Translatable for User-Facing Options:**
```json
{
  "fieldname": "status",
  "fieldtype": "Select",
  "options": "Draft\nSubmitted\nCancelled",
  "translatable": 1  // Allows translation
}
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

**What it is:** Rating field displays an interactive star rating widget. Users click stars to set a rating value.

**Properties**:
- `default`: Default rating (0-5, where 0 means no rating)
- `options`: Maximum rating (default: 5, must be between 3 and 10)

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

###  **IMPORTANT NOTES: Rating Field Constraints**

#### Constraint: Options Must Be Between 3 and 10

**Rule:** `options` (maximum rating) **must be between 3 and 10**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_no_of_ratings(docfield):
    if docfield.fieldtype == "Rating":
        if docfield.options and (int(docfield.options) > 10 or int(docfield.options) < 3):
            frappe.throw(_("Options for Rating field can range from 3 to 10"))
```

**Error Message:**
```
"Options for Rating field can range from 3 to 10"
```

**Why this constraint exists:**
- Too few stars (1-2) doesn't provide enough granularity
- Too many stars (11+) becomes cluttered and hard to use
- 3-10 range provides good UX balance

**Example -  Wrong:**
```json
{
  "fieldname": "rating",
  "fieldtype": "Rating",
  "options": "2"  // ERROR: Must be 3-10!
}
```

```json
{
  "fieldname": "rating",
  "fieldtype": "Rating",
  "options": "15"  // ERROR: Must be 3-10!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "rating",
  "fieldtype": "Rating",
  "options": "5"  // Standard 5-star rating
}
```

```json
{
  "fieldname": "rating",
  "fieldtype": "Rating",
  "options": "10"  // 10-star rating (maximum allowed)
}
```

**Common Rating Scales:**
- **3 stars**: Simple (Good/Bad/Neutral)
- **5 stars**: Standard (Most common)
- **10 stars**: Detailed (More granular)

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

**What it is:** Fold is a layout field that creates a collapsible section in forms. It's similar to Section Break but with stricter constraints. Fields after a Fold field are grouped together and can be collapsed/expanded.

**Properties**:
- `label`: Section title (displayed when collapsed/expanded)

**Example**:
```json
{
  "fieldname": "advanced_section",
  "fieldtype": "Fold",
  "label": "Advanced Settings"
}
```

**Behavior**: Collapsible section, collapsed by default. All fields after Fold until the next Section Break are grouped together.

---

###  **CRITICAL CONSTRAINTS: Fold Field**

Fold fields have **strict validation rules** that developers must follow. Violating these rules will cause `frappe.throw()` errors when saving the DocType.

#### Constraint 1: Only One Fold Per Form

**Rule:** A DocType can have **maximum one Fold field**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_fold(fields):
    fold_exists = False
    for i, f in enumerate(fields):
        if f.fieldtype == "Fold":
            if fold_exists:
                frappe.throw(_("There can be only one Fold in a form"))
            fold_exists = True
```

**Error Message:**
```
"There can be only one Fold in a form"
```

**Why this constraint exists:**
- Fold is designed to hide "advanced" or "optional" fields
- Having multiple Folds would create confusing UI
- One Fold is sufficient for organizing form sections

**What happens if violated:**
- DocType save fails with validation error
- Must remove extra Fold fields before saving

**Example -  Wrong:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"},
    {"fieldname": "advanced1", "fieldtype": "Data"},
    {"fieldname": "fold2", "fieldtype": "Fold", "label": "More Advanced"},  // ERROR!
    {"fieldname": "advanced2", "fieldtype": "Data"}
  ]
}
```

**Example -  Correct:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"},
    {"fieldname": "advanced1", "fieldtype": "Data"},
    {"fieldname": "advanced2", "fieldtype": "Data"}
  ]
}
```

#### Constraint 2: Fold Must Come Before a Section Break

**Rule:** Fold field **must be immediately followed by a Section Break**.

**Validation Code:**
```python
if i < len(fields) - 1:
    nxt = fields[i + 1]
    if nxt.fieldtype != "Section Break":
        frappe.throw(_("Fold must come before a Section Break"))
```

**Error Message:**
```
"Fold must come before a Section Break"
```

**Why this constraint exists:**
- Fold groups fields until the next Section Break
- Section Break marks the end of the Fold section
- Without Section Break, Fold wouldn't know where to end

**What happens if violated:**
- DocType save fails
- Must add Section Break immediately after Fold

**Example -  Wrong:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"},
    {"fieldname": "advanced1", "fieldtype": "Data"},  // ERROR: No Section Break after Fold!
    {"fieldname": "advanced2", "fieldtype": "Data"}
  ]
}
```

**Example -  Correct:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"},
    {"fieldname": "section_break_1", "fieldtype": "Section Break", "label": "Advanced Fields"},
    {"fieldname": "advanced1", "fieldtype": "Data"},
    {"fieldname": "advanced2", "fieldtype": "Data"}
  ]
}
```

#### Constraint 3: Fold Cannot Be at the End of Form

**Rule:** Fold field **cannot be the last field** in the DocType.

**Validation Code:**
```python
if i < len(fields) - 1:
    # Check next field
else:
    frappe.throw(_("Fold can not be at the end of the form"))
```

**Error Message:**
```
"Fold can not be at the end of the form"
```

**Why this constraint exists:**
- Fold needs fields after it to group together
- If Fold is last, there's nothing to collapse
- Fold must have content to organize

**What happens if violated:**
- DocType save fails
- Must add fields after Fold or remove Fold

**Example -  Wrong:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"}  // ERROR: Last field!
  ]
}
```

**Example -  Correct:**
```json
{
  "fields": [
    {"fieldname": "basic_field", "fieldtype": "Data"},
    {"fieldname": "fold1", "fieldtype": "Fold", "label": "Advanced"},
    {"fieldname": "section_break_1", "fieldtype": "Section Break"},
    {"fieldname": "advanced1", "fieldtype": "Data"}  // Fields after Fold
  ]
}
```

#### Complete Valid Fold Example

** Correct Structure:**
```json
{
  "fields": [
    {
      "fieldname": "customer_name",
      "fieldtype": "Data",
      "label": "Customer Name"
    },
    {
      "fieldname": "email",
      "fieldtype": "Data",
      "label": "Email"
    },
    {
      "fieldname": "advanced_fold",
      "fieldtype": "Fold",
      "label": "Advanced Settings"
    },
    {
      "fieldname": "advanced_section",
      "fieldtype": "Section Break",
      "label": "Advanced Options"
    },
    {
      "fieldname": "custom_field1",
      "fieldtype": "Data",
      "label": "Custom Field 1"
    },
    {
      "fieldname": "custom_field2",
      "fieldtype": "Data",
      "label": "Custom Field 2"
    }
  ]
}
```

**Field Order Explanation:**
1. Regular fields (customer_name, email) - always visible
2. **Fold field** - marks start of collapsible section
3. **Section Break** - required immediately after Fold
4. Fields after Section Break - grouped in Fold section (collapsible)

#### Summary of Fold Constraints

| Constraint | Rule | Error Message |
|------------|------|---------------|
| **Only One Fold** | Maximum one Fold per DocType | "There can be only one Fold in a form" |
| **Must Have Section Break** | Fold must be followed by Section Break | "Fold must come before a Section Break" |
| **Cannot Be Last** | Fold cannot be the last field | "Fold can not be at the end of the form" |

#### Best Practices for Fold

 **Do:**
- Use Fold for optional/advanced fields
- Place Fold after main/required fields
- Always add Section Break immediately after Fold
- Add descriptive label to Fold

 **Don't:**
- Create multiple Fold fields
- Place Fold at the end of form
- Forget Section Break after Fold
- Use Fold for required fields (they should be visible)

#### Troubleshooting Fold Errors

**Error: "There can be only one Fold in a form"**
- **Solution**: Remove extra Fold fields, keep only one

**Error: "Fold must come before a Section Break"**
- **Solution**: Add Section Break field immediately after Fold field

**Error: "Fold can not be at the end of the form"**
- **Solution**: Add fields after Fold, or remove Fold if not needed

**Visual Structure:**
```
Form Layout:
┌─────────────────────────┐
│ Basic Fields (visible)  │
├─────────────────────────┤
│ ▼ Advanced Settings     │ ← Fold (collapsed)
│   └─ Advanced Fields    │ ← Section Break + Fields
└─────────────────────────┘
```

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

**What it is:** Table field creates a one-to-many relationship where one parent document can have multiple child records. Each row in the table is a separate document in the child DocType.

**Properties**:
- `options`: **Required** - Child DocType name (must be a table DocType with `istable: 1`)
- `allow_bulk_edit`: Enable bulk editing of multiple rows at once

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

###  **IMPORTANT NOTES: Table Field Constraints**

#### Constraint 1: Child DocType Must Be a Table

**Rule:** The DocType specified in `options` **must have `istable: 1`**.

**Validation Code:**
```python
# In frappe/core/doctype/doctype/doctype.py
def check_child_table_option(docfield):
    if docfield.fieldtype not in ["Table MultiSelect", "Table"]:
        return
    
    doctype = docfield.options
    child_doctype_meta = frappe.get_meta(doctype)
    
    if not child_doctype_meta.istable:
        frappe.throw(
            _("Option {0} for field {1} is not a child table").format(
                frappe.bold(doctype), frappe.bold(docfield.fieldname)
            ),
            title=_("Invalid Option"),
        )
```

**Error Message:**
```
"Option {doctype} for field {fieldname} is not a child table"
```

**Why this constraint exists:**
- Only table DocTypes can be child tables
- Table DocTypes have special structure for parent-child relationships
- Regular DocTypes don't have `parent`, `parenttype`, `parentfield` fields

**Example -  Wrong:**
```json
{
  "fieldname": "customer",
  "fieldtype": "Table",
  "options": "Customer"  // ERROR: Customer is not a table DocType!
}
```

**Example -  Correct:**
```json
{
  "fieldname": "items",
  "fieldtype": "Table",
  "options": "Sales Invoice Item"  // Sales Invoice Item has istable: 1
}
```

#### Constraint 2: Virtual DocType Compatibility

**Rule:** If parent DocType is virtual (`is_virtual: 1`), child DocType **must also be virtual**. If parent is not virtual, child **cannot be virtual**.

**Validation Code:**
```python
if not (meta.is_virtual == child_doctype_meta.is_virtual):
    error_msg = " should be virtual." if meta.is_virtual else " cannot be virtual."
    frappe.throw(
        _("Child Table {0} for field {1}" + error_msg).format(
            frappe.bold(doctype), frappe.bold(docfield.fieldname)
        ),
        title=_("Invalid Option"),
    )
```

**Error Messages:**
- If parent is virtual: `"Child Table {doctype} for field {fieldname} should be virtual."`
- If parent is not virtual: `"Child Table {doctype} for field {fieldname} cannot be virtual."`

**Why this constraint exists:**
- Virtual DocTypes don't have database tables
- Child tables of virtual DocTypes also shouldn't have database tables
- Ensures consistency in data storage approach

**Example:**
```json
// Parent DocType
{
  "doctype": "Virtual Parent",
  "is_virtual": 1,
  "fields": [
    {
      "fieldname": "child_table",
      "fieldtype": "Table",
      "options": "Virtual Child"  // Must also be virtual
    }
  ]
}

// Child DocType
{
  "doctype": "Virtual Child",
  "istable": 1,
  "is_virtual": 1  // Must match parent
}
```

#### How Child Tables Work

**Automatic Fields:**
When you create a child table DocType, Frappe automatically adds these fields:

1. **`parent`**: Stores parent document name
2. **`parenttype`**: Stores parent DocType name
3. **`parentfield`**: Stores the fieldname of the Table field in parent

**Example:**
```json
// Parent: Sales Invoice
{
  "fieldname": "items",
  "fieldtype": "Table",
  "options": "Sales Invoice Item"
}

// Child: Sales Invoice Item (automatically has)
{
  "fieldname": "parent",      // Auto: "SINV-00001"
  "fieldname": "parenttype",  // Auto: "Sales Invoice"
  "fieldname": "parentfield", // Auto: "items"
  "fieldname": "item_code",   // Your custom field
  "fieldname": "qty"          // Your custom field
}
```

**Why These Fields Exist:**
- **`parent`**: Links child row to specific parent document
- **`parenttype`**: Ensures child belongs to correct DocType
- **`parentfield`**: Allows one parent to have multiple child tables

**Querying Child Tables:**
```python
# Get all items for a Sales Invoice
items = frappe.get_all("Sales Invoice Item", 
    filters={"parent": "SINV-00001", "parenttype": "Sales Invoice"}
)

# Or simpler (Frappe handles parent/parenttype automatically)
items = frappe.get_doc("Sales Invoice", "SINV-00001").items
```

---

#### 43. Table MultiSelect
**Purpose**: Multi-select child table

**What it is:** Table MultiSelect is a special type of child table that allows you to select multiple existing documents from another DocType and link them to the current document. Unlike regular Table fields where you create new child records, Table MultiSelect references existing documents.

**Properties**:
- `options`: **Required** - Child DocType name (must be a table DocType with `istable: 1`)
- Similar to Table but allows selecting existing documents instead of creating new ones

**Example**:
```json
{
  "fieldname": "related_items",
  "fieldtype": "Table MultiSelect",
  "label": "Related Items",
  "options": "Related Item Link"
}
```

**Behavior**: Allows selecting multiple existing documents, creates links through child table rows

---

###  **IMPORTANT NOTES: Table MultiSelect Architecture**

#### Why Table MultiSelect Requires a Child Table with Link Field

**The Architecture Problem:**

Table MultiSelect cannot directly link to a DocType. It needs an intermediate child table because:

1. **Table MultiSelect stores multiple relationships**: You want to link multiple documents (e.g., multiple Items to a Product Bundle)
2. **Child tables are required for "many" relationships**: To store multiple links, you need a child table (one-to-many relationship)
3. **The child table needs a Link field**: The child table must have a Link field that points to the DocType you want to multiselect from

**Why Not Direct Linking?**

If Table MultiSelect could link directly to a DocType (like `options: "Item"`), it would face these problems:

 **No way to store multiple values**: A single field can only store one value. To store multiple Items, you need multiple rows.

 **No additional metadata**: With direct linking, you can't store additional information about each relationship (like quantity, rate, notes, etc.)

 **No relationship tracking**: Child tables automatically track parent-child relationships through `parent`, `parenttype`, `parentfield` fields.

**The Correct Architecture:**

```
Parent DocType (Product Bundle)
    │
    └─→ Table MultiSelect Field: "items"
            │
            └─→ Child DocType: "Product Bundle Item" (istable: 1)
                    │
                    ├─→ Link Field: "item_code" → Links to "Item" DocType
                    ├─→ Other fields: "qty", "rate", "description", etc.
                    └─→ Auto fields: "parent", "parenttype", "parentfield"
```

**Step-by-Step Setup:**

1. **Create the Child DocType** (must be a table):
```json
{
  "doctype": "Product Bundle Item",
  "istable": 1,  // MUST be a table DocType
  "fields": [
    {
      "fieldname": "item_code",
      "fieldtype": "Link",
      "options": "Item",  // Links to Item DocType
      "reqd": 1
    },
    {
      "fieldname": "qty",
      "fieldtype": "Float"
    }
  ]
}
```

2. **Create Table MultiSelect Field** in Parent DocType:
```json
{
  "fieldname": "items",
  "fieldtype": "Table MultiSelect",
  "options": "Product Bundle Item"  // Points to child table, NOT Item directly
}
```

**How It Works:**

1. User selects multiple Items in the Table MultiSelect field
2. Frappe creates child table rows in "Product Bundle Item"
3. Each row has `item_code` Link field pointing to selected Item
4. Parent document links to child rows through `parent`/`parentfield` relationship

**Validation Rules:**

Frappe validates Table MultiSelect fields with these rules:

1. **Child DocType must be a table** (`istable: 1`):
   ```python
   # Error if not table:
   frappe.throw("Option {0} for field {1} is not a child table")
   ```

2. **Child DocType must have at least one Link field**:
   ```python
   # Error if no Link field:
   frappe.throw("DocType <b>{0}</b> provided for the field <b>{1}</b> must have atleast one Link field")
   ```

3. **Virtual DocType compatibility**: If parent is virtual, child must also be virtual (and vice versa)

**Real-World Example:**

**Product Bundle** DocType wants to link multiple Items:

```json
// Child DocType: Product Bundle Item
{
  "doctype": "Product Bundle Item",
  "istable": 1,
  "fields": [
    {
      "fieldname": "item_code",
      "fieldtype": "Link",
      "options": "Item",  // This is the Link field Table MultiSelect needs
      "reqd": 1
    },
    {
      "fieldname": "qty",
      "fieldtype": "Float",
      "default": 1
    }
  ]
}

// Parent DocType: Product Bundle
{
  "doctype": "Product Bundle",
  "fields": [
    {
      "fieldname": "items",
      "fieldtype": "Table MultiSelect",
      "options": "Product Bundle Item"  // Points to child table
    }
  ]
}
```

**Why This Architecture?**

 **Flexibility**: Can add additional fields to child table (qty, rate, notes, etc.)
 **Data Integrity**: Child table structure ensures proper relationships
 **Query Performance**: Can efficiently query related items
 **Extensibility**: Easy to add more fields to the relationship later

**Common Mistake:**

 **Wrong:**
```json
{
  "fieldname": "items",
  "fieldtype": "Table MultiSelect",
  "options": "Item"  // ERROR: Item is not a table DocType!
}
```

 **Correct:**
```json
{
  "fieldname": "items",
  "fieldtype": "Table MultiSelect",
  "options": "Product Bundle Item"  // Child table that has Link to Item
}
```

**Summary:**

Table MultiSelect requires a child table because:
1. It needs to store multiple relationships (one-to-many)
2. The child table provides the structure for multiple rows
3. The Link field in the child table creates the actual link to target DocType
4. This architecture allows storing additional metadata about each relationship
5. It maintains proper parent-child relationships automatically

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

This section summarizes all validation rules and constraints that Frappe enforces on fields. Violating these rules will cause `frappe.throw()` errors when saving DocTypes.

### General Rules

#### 1. **Fieldname Uniqueness**
**Rule:** Fieldnames must be unique within a DocType.

**Validation Code:**
```python
def check_unique_fieldname(docname, fieldname):
    duplicates = list(
        filter(None, map(lambda df: df.fieldname == fieldname and str(df.idx) or None, fields))
    )
    if len(duplicates) > 1:
        frappe.throw(
            _("{0}: Fieldname {1} appears multiple times in rows {2}").format(
                docname, fieldname, ", ".join(duplicates)
            ),
            UniqueFieldnameError,
        )
```

**Error Message:**
```
"{doctype}: Fieldname {fieldname} appears multiple times in rows {row_numbers}"
```

**Why:** Prevents confusion and ensures each field has a unique identifier.

#### 2. **Reserved Keywords**
**Rule:** Cannot use Python reserved keywords as fieldnames.

**Validation Code:**
```python
if fieldname in Document._reserved_keywords:
    frappe.throw(
        _("{0}: fieldname cannot be set to reserved keyword {1}").format(
            frappe.bold(docname), frappe.bold(fieldname)
        ),
        title=_("Invalid Fieldname"),
    )
```

**Error Message:**
```
"{doctype}: fieldname cannot be set to reserved keyword {keyword}"
```

**Reserved Keywords:** `name`, `doctype`, `docstatus`, `parent`, `parenttype`, `parentfield`, `idx`, `owner`, `creation`, `modified`, `modified_by`, etc.

#### 3. **Mandatory Restrictions**
**Rule:** Layout fields (Section Break, Column Break, Tab Break, Heading, HTML, Button, Image, Fold) cannot be mandatory.

**Validation Code:**
```python
if (d.fieldtype in no_value_fields) and d.fieldtype not in table_fields and d.reqd:
    frappe.throw(
        _("{0}: Field {1} of type {2} cannot be mandatory").format(docname, d.label, d.fieldtype),
        IllegalMandatoryError,
    )
```

**Error Message:**
```
"{doctype}: Field {label} of type {fieldtype} cannot be mandatory"
```

**Why:** Layout fields don't store data, so requiring them makes no sense.

#### 4. **Unique Restrictions**
**Rule:** Only Data, Link, Read Only, and Int fieldtypes can be unique.

**Validation Code:**
```python
if getattr(d, "unique", False):
    if d.fieldtype not in ("Data", "Link", "Read Only", "Int"):
        frappe.throw(
            _("{0}: Fieldtype {1} for {2} cannot be unique").format(docname, d.fieldtype, d.label),
            NonUniqueError,
        )
```

**Error Message:**
```
"{doctype}: Fieldtype {fieldtype} for {label} cannot be unique"
```

**Why:** Database unique constraints only work on simple, comparable values.

#### 5. **Hidden + Mandatory**
**Rule:** A field cannot be both hidden (`hidden: 1`) and mandatory (`reqd: 1`) without a default value.

**Validation Code:**
```python
if d.hidden and d.reqd and not d.default and not frappe.flags.in_migrate:
    frappe.throw(
        _("{0}: Field {1} in row {2} cannot be hidden and mandatory without default").format(
            docname, d.label, d.idx
        ),
        HiddenAndMandatoryWithoutDefaultError,
    )
```

**Error Message:**
```
"{doctype}: Field {label} in row {idx} cannot be hidden and mandatory without default"
```

**Why:** Users can't see hidden fields, so they can't fill mandatory fields without defaults.

#### 6. **Virtual Fields**
**Rule:** Virtual fields cannot appear in list view.

**Validation Code:**
```python
if d.in_list_view and (d.fieldtype in not_allowed_in_list_view):
    frappe.throw(
        _("'{0}' not allowed for type {1} in row {2}").format(property_label, d.fieldtype, d.idx)
    )
```

**Error Message:**
```
"'In List View' not allowed for type {fieldtype} in row {idx}"
```

**Why:** Virtual fields are computed on-the-fly, not stored in database. List views query database directly.

### Fieldtype-Specific Rules

#### 1. **Link Fields**
**Rule:** Must have `options` set to valid DocType name.

**Error Messages:**
- If missing: `"{doctype}: Options required for Link or Table type field {label} in row {idx}"`
- If invalid: `"{doctype}: Options must be a valid DocType for field {label} in row {idx}"`

**Why:** Link fields need to know which DocType to link to.

#### 2. **Dynamic Link**
**Rule:** Must have `options` pointing to another Link or Select field that contains DocType name.

**Error Message:**
```
"Options 'Dynamic Link' type of field must point to another Link Field with options as 'DocType'"
```

**Why:** Dynamic Link reads target DocType from another field's value.

#### 3. **Select Fields**
**Rules:**
- Must have `options` with at least one option
- Default value must exist in options list

**Error Messages:**
- If options not set: `"Options for {fieldname} must be set before setting the default value."`
- If default not in options: `"Default value for {fieldname} must be in the list of options."`

**Why:** Ensures default value is valid and options are defined.

#### 4. **Table Fields**
**Rules:**
- Must have `options` set to valid child DocType name
- Child DocType must have `istable: 1`
- If parent is virtual, child must also be virtual (and vice versa)

**Error Messages:**
- If not table: `"Option {doctype} for field {fieldname} is not a child table"`
- If virtual mismatch: `"Child Table {doctype} for field {fieldname} should be virtual."` or `"cannot be virtual."`

**Why:** Only table DocTypes can be child tables, and virtual compatibility ensures consistency.

#### 5. **Table MultiSelect**
**Rules:**
- Must have `options` set to valid child DocType name
- Child DocType must have `istable: 1`
- Child DocType must have at least one Link field

**Error Messages:**
- If no Link field: `"DocType <b>{doctype}</b> provided for the field <b>{fieldname}</b> must have atleast one Link field"`
- Same as Table field for other constraints

**Why:** Table MultiSelect needs Link field in child table to create links to target documents.

#### 6. **Check Fields**
**Rule:** Default must be `"0"` or `"1"`.

**Error Message:**
```
"Default for 'Check' type of field {fieldname} must be either '0' or '1'"
```

**Why:** Check fields only store boolean values (0 or 1).

#### 7. **Date Fields**
**Rule:** Default `"Today"` only works for Date fieldtype.

**Why:** Special default values are fieldtype-specific.

#### 8. **Datetime Fields**
**Rule:** Default `"now"` only works for Datetime fieldtype.

**Why:** Special default values are fieldtype-specific.

#### 9. **Float/Currency/Percent Fields**
**Rule:** Precision must be between 1 and 6.

**Error Message:**
```
"Precision should be between 1 and 6"
```

**Why:** Database and practical limitations on decimal precision.

#### 10. **Rating Fields**
**Rule:** Options (maximum rating) must be between 3 and 10.

**Error Message:**
```
"Options for Rating field can range from 3 to 10"
```

**Why:** UX considerations - too few or too many stars are impractical.

#### 11. **Fold Fields**
**Rules:**
- Only one Fold per DocType
- Must be followed by Section Break
- Cannot be last field in form

**Error Messages:**
- Multiple Folds: `"There can be only one Fold in a form"`
- No Section Break: `"Fold must come before a Section Break"`
- At end: `"Fold can not be at the end of the form"`

**Why:** Fold has specific UI requirements for proper form layout.

#### 12. **Data Fields**
**Rule:** If `options` is specified, must be one of: Email, Name, Phone, URL, Barcode, IBAN.

**Error Message:**
```
"{field_label} is an invalid Data field.
Only Options allowed for Data field are:
• Email
• Name
• Phone
• URL
• Barcode
• IBAN"
```

**Why:** Data field options are reserved for special validation types.

#### 13. **Search Index**
**Rule:** Cannot index Text, Long Text, Small Text, Code, or Text Editor fields.

**Error Message:**
```
"{doctype}:Fieldtype {fieldtype} for {label} cannot be indexed"
```

**Why:** Database limitations on indexing large text columns.

#### 14. **Unique Constraint**
**Rule:** Cannot set unique if existing documents have duplicate values.

**Error Message:**
```
"{doctype}: Field '{label}' cannot be set as Unique as it has non-unique values"
```

**Why:** Prevents breaking existing data integrity.

### Complete Constraint Summary Table

| Field Type | Constraint | Error Trigger |
|------------|------------|---------------|
| **All Fields** | Fieldname must be unique | Duplicate fieldnames |
| **All Fields** | Cannot use reserved keywords | Reserved keyword as fieldname |
| **Layout Fields** | Cannot be mandatory | `reqd: 1` on layout field |
| **Hidden Fields** | Cannot be mandatory without default | `hidden: 1` + `reqd: 1` + no default |
| **Virtual Fields** | Cannot be in list view | `is_virtual: 1` + `in_list_view: 1` |
| **Virtual Fields** | Cannot be indexed | `is_virtual: 1` + `search_index: 1` |
| **Link** | Options required | Missing `options` |
| **Link** | Options must be valid DocType | Invalid DocType name |
| **Dynamic Link** | Options must point to Link/Select field | Invalid pointer field |
| **Select** | Options required before default | Default without options |
| **Select** | Default must be in options | Default not in options list |
| **Table** | Options must be table DocType | Non-table DocType |
| **Table** | Virtual compatibility | Parent/child virtual mismatch |
| **Table MultiSelect** | Child must have Link field | No Link field in child |
| **Check** | Default must be 0 or 1 | Invalid default value |
| **Float/Currency/Percent** | Precision 1-6 | Precision outside range |
| **Currency** | Width minimum 100px | Width < 100px |
| **Rating** | Options 3-10 | Options outside range |
| **Fold** | Only one per form | Multiple Fold fields |
| **Fold** | Must have Section Break after | No Section Break after Fold |
| **Fold** | Cannot be last field | Fold at end of form |
| **Data** | Options must be valid type | Invalid options value |
| **Text Fields** | Cannot be indexed | `search_index: 1` on text field |
| **Unique** | Only Data/Link/Read Only/Int | Unique on invalid fieldtype |
| **Unique** | No duplicate values exist | Duplicates in existing data |

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
