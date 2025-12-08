# Frappe Fields - Complete Documentation

## Table of Contents
1. [What are Fields?](#what-are-fields)
2. [Where are Fields Stored?](#where-are-fields-stored)
3. [Are Fields DocTypes?](#are-fields-doctypes)
4. [Complete List of Field Types](#complete-list-of-field-types)
5. [Common Field Properties](#common-field-properties)
6. [Field Type Details](#field-type-details)

---

## What are Fields?

Fields are the fundamental building blocks of DocTypes in Frappe. Every DocType consists of fields, and each field represents a piece of data with its own properties and behavior. Fields define:

- **Data Structure**: What type of data can be stored (text, number, date, link, etc.)
- **Validation Rules**: Constraints and validations applied to the data
- **User Interface**: How the field appears and behaves in forms
- **Database Schema**: How data is stored in the database
- **Business Logic**: Relationships, dependencies, and computed values

Fields are defined in the DocType's metadata and control everything from form layout to data validation to database column creation.

---

## Where are Fields Stored?

Fields are stored in the **`DocField`** DocType, which is a core Frappe DocType. Each field definition is a document in the `DocField` table.

### Storage Structure

- **Database Table**: `tabDocField`
- **DocType Name**: `DocField`
- **Location**: `apps/frappe/frappe/core/doctype/docfield/`
- **Parent Relationship**: Fields belong to a DocType through the `parent` field (which stores the DocType name)

### Field Storage Details

When you create a DocType, Frappe:
1. Creates a record in the `DocType` table
2. Creates multiple records in the `DocField` table (one for each field)
3. Each `DocField` record has:
   - `parent`: The DocType name this field belongs to
   - `parenttype`: Always "DocType"
   - `parentfield`: Always "fields" (the child table fieldname)
   - All field properties (fieldtype, label, options, etc.)

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
- **Format**: `"link_fieldname.source_fieldname"`
- **Example**: `"customer.company_name"` - Fetches `company_name` from the linked `customer` document
- **Behavior**:
  - Only works with Link fields
  - Fetches when the link field value changes
  - Can be combined with `fetch_if_empty`

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
- **Restrictions**: Cannot be mandatory for layout fields (Section Break, Column Break, etc.)
- **Example**: `{"reqd": 1}` - Field is required

#### `unique` (Check)
- **Type**: Boolean (0 or 1)
- **Default**: 0
- **Description**: Field value must be unique across all documents
- **Restrictions**: Only valid for Data, Link, and Read Only fieldtypes
- **Example**: `{"unique": 1}` - No two documents can have the same value

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
- **Format**: JavaScript expression (e.g., `"eval:doc.status=='Active'"`)
- **Examples**:
  ```json
  {"depends_on": "eval:doc.status=='Active'"}
  {"depends_on": "eval:doc.amount > 1000"}
  {"depends_on": "eval:in_list(['Option1', 'Option2'], doc.type)"}
  {"depends_on": "eval:doc.customer && doc.customer!=''"}
  ```

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

**Properties**:
- `options`: **Required** - DocType name to link to
- `link_filters`: JSON filters for dropdown
- `ignore_user_permissions`: Bypass user permissions
- `remember_last_selected_value`: Remember selection
- `fetch_from`: Fetch fields from linked document

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
- `options`: **Required** - Child DocType name
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

## Conclusion

Fields are the core building blocks of Frappe DocTypes, defining data structure, validation, user interface, and business logic. Understanding field types and properties is essential for effective Frappe development. This documentation covers all 47 field types and their properties, providing a comprehensive reference for working with Frappe fields.
