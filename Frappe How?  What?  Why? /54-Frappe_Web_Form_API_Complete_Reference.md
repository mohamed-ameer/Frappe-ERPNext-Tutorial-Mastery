# Frappe Web Form API - Complete Reference

## What is this document?

This document covers everything you need to know about the `frappe.web_form` object in Frappe. It's the main tool for working with web forms using JavaScript. Whether you're building custom forms, adding interactivity, or handling form data, this guide document has you covered.

### What is frappe.web_form?

The `frappe.web_form` object is your main tool for controlling web forms in Frappe. It lets you:
- Read and set field values
- Listen for user interactions
- Validate form data
- Save or delete forms
- Handle multi-step forms

### How it works

When a web form loads, Frappe automatically creates a `frappe.web_form` object. You can use this object right away in your JavaScript code.

```javascript
// This runs when the page is ready
frappe.ready(function() {
    // frappe.web_form is now available
    console.log('Form name:', frappe.web_form.name);
});
```

### The three main parts
```
WebForm extends FieldGroup extends Layout
```
The `frappe.web_form` object is built from three main classes:
1. **Layout** - Handles how the form looks and renders
2. **FieldGroup** - Manages field values and interactions  
3. **WebForm** - Adds special web form features like multi-step forms

## Basic Form Operations

### 1. `prepare(web_form_doc, doc)`

**What it does**: Sets up the form with its configuration and data.

**When to use**: Usually called automatically when the form loads. You might use it if you need to reload the form with new data.

**Parameters**:
- `web_form_doc` - The form configuration
- `doc` - The data to put in the form

**Example**:
```javascript
// This is usually called automatically, but you can use it to reload
frappe.web_form.prepare(webFormConfig, documentData);
```

### 2. `make()`

**What it does**: Creates and displays the form on the page.

**When to use**: Called automatically when the form loads. You might use it if you rebuild the form after making changes.

**Example**:
```javascript
// Show the form
frappe.web_form.make();

// Check how many fields were created
console.log('Form has', frappe.web_form.fields_list.length, 'fields');
```

### 3. `on(fieldname, handler)`

**What it does**: Runs a function whenever a field changes.

**When to use**: Perfect for making fields react to each other, like auto-filling one field when another changes.

**Parameters**:
- `fieldname` - The name of the field to watch
- `handler` - The function to run when the field changes

**Example**:
```javascript
// When customer field changes, update customer name
frappe.web_form.on('customer', function(field, value) {
    console.log('Customer changed to:', value);
    
    if (value) {
        frappe.web_form.set_value('customer_name', 'Loading...');
        // Get customer details from server
        fetchCustomerDetails(value);
    } else {
        frappe.web_form.set_value('customer_name', '');
    }
});

// Auto-calculate tax when amount changes
frappe.web_form.on('amount', function(field, value) {
    let tax = value * 0.1;
    frappe.web_form.set_value('tax_amount', tax);
});
```

### 4. `save()`

**What it does**: Saves the form data to the server.

**When to use**: When the user clicks save or you want to save programmatically.

**Returns**: `false` if save fails, otherwise saves the form

**Example**:
```javascript
// Save the form
frappe.web_form.save();

// Save with custom validation
frappe.web_form.on('submit', function() {
    if (!validateCustomRules()) {
        frappe.msgprint('Please fix the errors');
        return false;
    }
    
    frappe.web_form.save();
});
```

### 5. `delete_form()`

**What it does**: Deletes the current document after asking for confirmation.

**When to use**: When you want to delete the current record.

**Example**:
```javascript
// Delete the current document
frappe.web_form.delete_form();

// Custom delete with extra steps
function customDelete() {
    frappe.confirm('Are you sure you want to delete this?', function() {
        // Do any cleanup first
        cleanupRelatedData();
        
        // Then delete
        frappe.web_form.delete_form();
    });
}
```

### 6. `discard_form()`

**What it does**: Throws away unsaved changes and leaves the form.

**When to use**: When the user wants to cancel without saving.

**Example**:
```javascript
// Discard changes and leave
frappe.web_form.discard_form();

// Check for unsaved changes first
function customDiscard() {
    if (hasUnsavedChanges()) {
        frappe.confirm('You have unsaved changes. Discard them?', function() {
            frappe.web_form.discard_form();
        });
    } else {
        frappe.web_form.discard_form();
    }
}
```

## Working with Fields

### 1. `get_field(fieldname)`

**What it does**: Gets the field object so you can work with it directly.

**When to use**: When you need to do advanced things with a field, like change its properties or call its methods.

**Returns**: The field object, or `undefined` if the field doesn't exist

**Example**:
```javascript
// Get a field object
let customerField = frappe.web_form.get_field('customer');

if (customerField) {
    console.log('Field type:', customerField.df.fieldtype);
    console.log('Field value:', customerField.get_value());
    console.log('Is required:', customerField.df.reqd);
    
    // Use field methods
    customerField.set_focus();
    customerField.refresh();
}

// Check if it's a currency field
let field = frappe.web_form.get_field('amount');
if (field && field.df.fieldtype === 'Currency') {
    field.set_value(1000.50);
}
```

### 2. `get_input(fieldname)`

**What it does**: Gets the actual input element (the text box, dropdown, etc.) for a field.

**When to use**: When you need to style the input or add custom events directly to it.

**Returns**: A jQuery object with the input element

**Example**:
```javascript
// Get the input element
let input = frappe.web_form.get_input('customer_name');

if (input.length) {
    // Style the input
    input.addClass('highlight');
    input.attr('placeholder', 'Enter customer name');
    
    // Add custom keyboard shortcut
    input.on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            frappe.web_form.save();
        }
    });
}

// Style amount field
let amountInput = frappe.web_form.get_input('amount');
amountInput.css({
    'font-weight': 'bold',
    'color': '#2e7d32'
});
```

### 3. `has_field(fieldname)`

**What it does**: Checks if a field exists in the form.

**When to use**: Before trying to use a field, to avoid errors.

**Returns**: `true` if field exists, `false` if not

**Example**:
```javascript
// Check if field exists before using it
if (frappe.web_form.has_field('customer')) {
    frappe.web_form.on('customer', function(field, value) {
        updateCustomerDetails(value);
    });
}

// Different logic based on what fields exist
if (frappe.web_form.has_field('payment_method')) {
    setupPaymentHandling();
} else {
    setupStandardHandling();
}

// Safe way to get field value
function safeFieldAccess(fieldname) {
    if (frappe.web_form.has_field(fieldname)) {
        return frappe.web_form.get_value(fieldname);
    } else {
        console.warn(`Field '${fieldname}' does not exist`);
        return null;
    }
}
```

### 4. `set_df_property(fieldname, prop, value)`

**What it does**: Changes field properties like whether it's required, hidden, or what its label is.

**When to use**: When you want to show/hide fields, make them required, or change their appearance based on other field values.

**Parameters**:
- `fieldname` - The field to change
- `prop` - The property to change (like 'hidden', 'reqd', 'label')
- `value` - The new value

**Example**:
```javascript
// Show or hide fields
function toggleOptionalFields(show) {
    frappe.web_form.set_df_property('notes', 'hidden', !show);
    frappe.web_form.set_df_property('comments', 'hidden', !show);
}

// Make a field required or not
function makeFieldRequired(fieldname, required) {
    frappe.web_form.set_df_property(fieldname, 'reqd', required);
}

// Change field label
frappe.web_form.set_df_property('amount', 'label', 'Total Amount (USD)');

// Disable a field
frappe.web_form.set_df_property('customer', 'read_only', 1);

// Change dropdown options
frappe.web_form.set_df_property('status', 'options', 'Draft\nSubmitted\nApproved');
```

## Managing Form Values

### 1. `get_value(fieldname)`

**What it does**: Gets the current value of a field.

**When to use**: When you need to read what the user has entered or check field values for calculations.

**Returns**: The field's value, or `null` if the field doesn't exist

**Example**:
```javascript
// Get a field value
let customerName = frappe.web_form.get_value('customer_name');
console.log('Customer:', customerName);

// Use in validation
function validateForm() {
    let email = frappe.web_form.get_value('email');
    if (email && !isValidEmail(email)) {
        frappe.msgprint('Please enter a valid email address');
        return false;
    }
    return true;
}

// Use in calculations
function calculateTotal() {
    let quantity = parseFloat(frappe.web_form.get_value('quantity') || 0);
    let rate = parseFloat(frappe.web_form.get_value('rate') || 0);
    let total = quantity * rate;
    
    frappe.web_form.set_value('total', total);
}

// Use in conditional logic
let status = frappe.web_form.get_value('status');
if (status === 'Draft') {
    enableEditing();
} else {
    disableEditing();
}
```

### 2. `set_value(fieldname, value)`

**What it does**: Sets a field's value and triggers any change events.

**When to use**: When you want to programmatically fill in a field or update it based on other field changes.

**Returns**: A Promise that resolves when the value is set

**Example**:
```javascript
// Set a field value
frappe.web_form.set_value('customer_name', 'John Doe');

// Set multiple values one by one
async function populateCustomerData(customerId) {
    try {
        let customerData = await fetchCustomerFromAPI(customerId);
        
        await frappe.web_form.set_value('customer_name', customerData.name);
        await frappe.web_form.set_value('email', customerData.email);
        await frappe.web_form.set_value('phone', customerData.phone);
        
        console.log('Customer data loaded');
    } catch (error) {
        console.error('Error loading customer data:', error);
    }
}

// Update based on other field values
function updateStatus() {
    let amount = frappe.web_form.get_value('amount');
    if (amount > 1000) {
        frappe.web_form.set_value('status', 'High Value');
    } else {
        frappe.web_form.set_value('status', 'Standard');
    }
}

// Set dates
frappe.web_form.set_value('date', frappe.datetime.get_today());
frappe.web_form.set_value('due_date', frappe.datetime.add_days(frappe.datetime.get_today(), 30));
```

### 3. `get_values(ignore_errors, check_invalid)`

**What it does**: Gets all field values at once as an object.

**When to use**: When you need all the form data, like when saving or exporting.

**Parameters**:
- `ignore_errors` - Set to `true` to skip validation errors
- `check_invalid` - Set to `true` to check for invalid values

**Returns**: An object with all field values, or `null` if validation fails

**Example**:
```javascript
// Get all form values
let formData = frappe.web_form.get_values();
console.log('Form data:', formData);

// Get values with validation
let validatedData = frappe.web_form.get_values(false, true);
if (validatedData) {
    console.log('Valid form data:', validatedData);
} else {
    console.log('Form has validation errors');
}

// Export form data
function exportFormData() {
    let data = frappe.web_form.get_values();
    if (data) {
        let jsonData = JSON.stringify(data, null, 2);
        downloadFile(jsonData, 'form-data.json');
    }
}

// Check before saving
function validateBeforeSubmit() {
    let data = frappe.web_form.get_values();
    if (!data) {
        frappe.msgprint('Please fix the validation errors');
        return false;
    }
    
    // Custom validation
    if (data.amount && data.amount < 0) {
        frappe.msgprint('Amount cannot be negative');
        return false;
    }
    
    return true;
}
```

### 4. `set_values(dict)`

**What it does**: Sets multiple field values at once.

**When to use**: When you want to fill in several fields at the same time, like loading data from a template.

**Returns**: A Promise that resolves when all values are set

**Example**:
```javascript
// Set multiple values at once
frappe.web_form.set_values({
    'customer_name': 'John Doe',
    'email': 'john@example.com',
    'phone': '+1234567890',
    'address': '123 Main St'
});

// Load from a template
async function populateFromTemplate(templateId) {
    try {
        let template = await fetchTemplate(templateId);
        await frappe.web_form.set_values(template.data);
        console.log('Template loaded');
    } catch (error) {
        console.error('Error loading template:', error);
    }
}

// Reset form to default values
function resetForm() {
    frappe.web_form.set_values({
        'customer_name': '',
        'email': '',
        'phone': '',
        'amount': 0,
        'status': 'Draft'
    });
}

// Sync with external system
async function syncWithExternalSystem() {
    let externalData = await fetchExternalData();
    await frappe.web_form.set_values(externalData);
}
```

### 5. `clear()`

**What it does**: Clears all fields (sets them to empty or default values).

**When to use**: When you want to reset the entire form.

**Example**:
```javascript
// Clear all fields
frappe.web_form.clear();

// Clear with confirmation
function clearFormWithConfirmation() {
    frappe.confirm('Are you sure you want to clear all fields?', function() {
        frappe.web_form.clear();
        frappe.msgprint('Form cleared');
    });
}

// Clear only sensitive fields
function clearSensitiveFields() {
    frappe.web_form.set_value('password', '');
    frappe.web_form.set_value('ssn', '');
    frappe.web_form.set_value('credit_card', '');
}
```

### 6. `set_default_values()`

**What it does**: Applies default values to all fields based on their configuration.

**When to use**: When the form loads and you want to set initial values.

**Example**:
```javascript
// Apply default values
frappe.web_form.set_default_values();

// Apply defaults plus custom ones
function applySmartDefaults() {
    // Apply system defaults first
    frappe.web_form.set_default_values();
    
    // Add custom defaults
    frappe.web_form.set_value('date', frappe.datetime.get_today());
    frappe.web_form.set_value('status', 'Draft');
    frappe.web_form.set_value('created_by', frappe.session.user);
}

// Apply defaults based on conditions
function applyConditionalDefaults() {
    frappe.web_form.set_default_values();
    
    // User-specific defaults
    if (frappe.session.user !== 'Guest') {
        frappe.web_form.set_value('created_by', frappe.session.user);
    }
    
    // Time-based defaults
    let currentHour = new Date().getHours();
    if (currentHour < 12) {
        frappe.web_form.set_value('shift', 'Morning');
    } else {
        frappe.web_form.set_value('shift', 'Afternoon');
    }
}
```

## Form Lifecycle

### 1. `setup_listeners()`

**What it does**: Sets up event listeners for all form fields.

**When to use**: Usually called automatically when the form loads. You might use it if you rebuild the form.

**Example**:
```javascript
// Setup listeners (usually called automatically)
frappe.web_form.setup_listeners();

// Add custom listeners after setup
function setupCustomListeners() {
    frappe.web_form.setup_listeners();
    
    // Add your custom listeners
    frappe.web_form.on('customer', handleCustomerChange);
    frappe.web_form.on('amount', handleAmountChange);
}

function handleCustomerChange(field, value) {
    if (value) {
        fetchCustomerDetails(value);
    }
}
```

### 2. `make_form_dirty()`

**What it does**: Marks the form as having unsaved changes.

**When to use**: When a field changes and you want to show that there are unsaved changes.

**Example**:
```javascript
// Mark form as having changes
frappe.web_form.make_form_dirty();

// Track changes automatically
function trackChanges() {
    frappe.web_form.on('customer', function() {
        frappe.web_form.make_form_dirty();
        updateChangeIndicator();
    });
}

function updateChangeIndicator() {
    $('.change-indicator').show();
    $('.save-button').removeClass('disabled');
}
```

### 3. `validate_section()`

**What it does**: Checks if the current section of a multi-step form is valid.

**When to use**: Before moving to the next section of a multi-step form.

**Returns**: `true` if valid, `false` if there are errors

**Example**:
```javascript
// Check if current section is valid
if (frappe.web_form.validate_section()) {
    // Move to next section
    frappe.web_form.toggle_section();
} else {
    frappe.msgprint('Please complete all required fields');
}

// Custom validation with highlighting
function validateCurrentSection() {
    let isValid = frappe.web_form.validate_section();
    
    if (!isValid) {
        highlightInvalidFields();
        return false;
    }
    
    return true;
}

function highlightInvalidFields() {
    $('.form-control:invalid').addClass('error');
}
```

### 4. `focus_on_first_input()`

**What it does**: Puts the cursor in the first input field of the form.

**When to use**: When the form loads or when you want to help users start typing.

**Example**:
```javascript
// Focus on first input
frappe.web_form.focus_on_first_input();

// Focus on a specific field instead
function setupFocusManagement() {
    frappe.web_form.focus_on_first_input();
    
    // Focus on customer field after a delay
    setTimeout(function() {
        let customerField = frappe.web_form.get_input('customer');
        if (customerField.length) {
            customerField.focus();
        }
    }, 1000);
}
```

## Multi-Step Forms

### 1. `set_page_breaks()`

**What it does**: Sets up the page breaks for multi-step forms.

**When to use**: Usually called automatically when a multi-step form loads.

**Example**:
```javascript
// Setup page breaks
frappe.web_form.set_page_breaks();

// Check if it's a multi-step form
if (frappe.web_form.is_multi_step_form) {
    console.log('Multi-step form with', frappe.web_form.page_breaks.length, 'pages');
}
```

### 2. `setup_previous_next_button()`

**What it does**: Creates the Previous and Next buttons for multi-step forms.

**When to use**: Usually called automatically, but you can use it to recreate the buttons.

**Example**:
```javascript
// Setup navigation buttons
frappe.web_form.setup_previous_next_button();

// Customize button styling
function customizeNavigationButtons() {
    frappe.web_form.setup_previous_next_button();
    
    // Add custom styling
    $('.btn-previous').addClass('btn-secondary');
    $('.btn-next').addClass('btn-primary');
}
```

### 3. `toggle_section()`

**What it does**: Shows or hides form sections and updates the display.

**When to use**: When moving between sections of a multi-step form.

**Example**:
```javascript
// Move to next section
frappe.web_form.toggle_section();

// Go to a specific section
function navigateToSection(sectionIndex) {
    frappe.web_form.current_section = sectionIndex;
    frappe.web_form.toggle_section();
}

// Move to next section with validation
function goToNextSection() {
    if (frappe.web_form.validate_section()) {
        frappe.web_form.current_section++;
        frappe.web_form.toggle_section();
    }
}
```

### 4. `render_progress_dots()`

**What it does**: Creates the progress indicators (dots) for multi-step forms.

**When to use**: Usually called automatically, but you can use it to recreate the progress indicators.

**Example**:
```javascript
// Render progress indicators
frappe.web_form.render_progress_dots();

// Customize progress styling
function customizeProgressIndicators() {
    frappe.web_form.render_progress_dots();
    
    // Add custom styling
    $('.slide-step').addClass('custom-progress-step');
    $('.slide-step.active').addClass('current-step');
}
```

### 5. `is_next_section_empty(section)`

**What it does**: Checks if the next section has any visible fields.

**When to use**: When you want to skip empty sections automatically.

**Parameters**:
- `section` - The section number to check

**Returns**: `true` if the section is empty

**Example**:
```javascript
// Check if next section is empty
if (frappe.web_form.is_next_section_empty(1)) {
    console.log('Next section is empty, skipping...');
}

// Skip empty sections automatically
function smartNavigate() {
    let currentSection = frappe.web_form.current_section;
    
    // Skip empty sections
    while (frappe.web_form.is_next_section_empty(currentSection + 1)) {
        currentSection++;
    }
    
    frappe.web_form.current_section = currentSection;
    frappe.web_form.toggle_section();
}
```

### 6. `is_previous_section_empty(section)`

**What it does**: Checks if the previous section has any visible fields.

**When to use**: When going backwards and you want to skip empty sections.

**Parameters**:
- `section` - The section number to check

**Returns**: `true` if the section is empty

**Example**:
```javascript
// Check if previous section is empty
if (frappe.web_form.is_previous_section_empty(0)) {
    console.log('Previous section is empty');
}

// Skip empty sections when going back
function smartBackwardNavigate() {
    let currentSection = frappe.web_form.current_section;
    
    // Skip empty sections when going back
    while (currentSection > 0 && frappe.web_form.is_previous_section_empty(currentSection - 1)) {
        currentSection--;
    }
    
    frappe.web_form.current_section = currentSection;
    frappe.web_form.toggle_section();
}
```

## Events and Interactions

### 1. `events.on(event, handler)`

**What it does**: Lets you listen for form events like when it loads or saves.

**When to use**: When you want to run code at specific times in the form's life.

**Parameters**:
- `event` - The event name to listen for
- `handler` - The function to run when the event happens

**Example**:
```javascript
// Run code when form loads
frappe.web_form.events.on('after_load', function() {
    console.log('Form loaded successfully');
    initializeCustomFeatures();
});

// Run code when form saves
frappe.web_form.events.on('after_save', function() {
    console.log('Form saved successfully');
    showSuccessMessage();
});

// Setup custom features
function initializeCustomFeatures() {
    setupAutoComplete();
    setupValidation();
    setupCustomStyling();
}
```

### 2. `events.trigger(event, ...args)`

**What it does**: Triggers your own custom events.

**When to use**: When you want to notify other parts of your code that something happened.

**Parameters**:
- `event` - The event name to trigger
- `...args` - Any data you want to pass with the event

**Example**:
```javascript
// Trigger a custom event
frappe.web_form.events.trigger('custom_event', 'data1', 'data2');

// Setup custom event system
function setupCustomEvents() {
    frappe.web_form.events.on('data_loaded', function(data) {
        console.log('Data loaded:', data);
    });
    
    frappe.web_form.events.on('validation_complete', function(isValid) {
        if (isValid) {
            enableSubmitButton();
        } else {
            disableSubmitButton();
        }
    });
}

// Trigger the data loaded event
function triggerDataLoaded(data) {
    frappe.web_form.events.trigger('data_loaded', data);
}
```

## Form Properties

### Basic Properties

#### `fields_dict` (Object)
Contains all the form fields, organized by field name.

```javascript
// See all available fields
console.log('Available fields:', Object.keys(frappe.web_form.fields_dict));

// Loop through all fields
Object.keys(frappe.web_form.fields_dict).forEach(function(fieldname) {
    let field = frappe.web_form.fields_dict[fieldname];
    console.log(fieldname, ':', field.get_value());
});
```

#### `fields_list` (Array)
Array of all field objects in the order they appear on the form.

```javascript
// Loop through fields in order
frappe.web_form.fields_list.forEach(function(field) {
    console.log('Field:', field.df.label, 'Type:', field.df.fieldtype);
});
```

#### `doc` (Object)
The current document data.

```javascript
// Get document information
console.log('Document name:', frappe.web_form.doc.name);
console.log('Document type:', frappe.web_form.doc.doctype);
console.log('Document status:', frappe.web_form.doc.docstatus);
```

#### `name` (String)
The name of the web form.

```javascript
// Get web form name
console.log('Web form name:', frappe.web_form.name);
```

#### `doc_type` (String)
The DocType this form is for.

```javascript
// Get DocType
console.log('Target DocType:', frappe.web_form.doc_type);
```

### Form State Properties

#### `is_new` (Boolean)
Whether you're creating a new document or editing an existing one.

```javascript
if (frappe.web_form.is_new) {
    console.log('Creating new document');
    frappe.web_form.set_value('status', 'Draft');
} else {
    console.log('Editing existing document');
}
```

#### `in_edit_mode` (Boolean)
Whether the form is in edit mode.

```javascript
if (frappe.web_form.in_edit_mode) {
    console.log('Form is in edit mode');
    enableEditing();
} else {
    console.log('Form is in view mode');
    disableEditing();
}
```

#### `in_view_mode` (Boolean)
Whether the form is in view-only mode.

```javascript
if (frappe.web_form.in_view_mode) {
    console.log('Form is read-only');
    makeFormReadOnly();
}
```

### Multi-Step Form Properties

#### `current_section` (Number)
Which section you're currently on in a multi-step form.

```javascript
// Get current section
console.log('Current section:', frappe.web_form.current_section);

// Go to a specific section
frappe.web_form.current_section = 2;
frappe.web_form.toggle_section();
```

#### `is_multi_step_form` (Boolean)
Whether this is a multi-step form.

```javascript
if (frappe.web_form.is_multi_step_form) {
    console.log('Multi-step form with', frappe.web_form.page_breaks.length, 'pages');
    setupMultiStepFeatures();
} else {
    console.log('Single-step form');
    setupSingleStepFeatures();
}
```

#### `page_breaks` (jQuery)
The page break elements for multi-step forms.

```javascript
// Loop through page breaks
frappe.web_form.page_breaks.each(function(index, element) {
    console.log('Page break', index, ':', element);
});
```

## Common Patterns

### 1. Dynamic Field Management

```javascript
// Show or hide fields based on other field values
function toggleFieldVisibility(fieldname, show) {
    frappe.web_form.set_df_property(fieldname, 'hidden', !show);
}

// Make fields required based on conditions
function makeFieldRequired(fieldname, required) {
    frappe.web_form.set_df_property(fieldname, 'reqd', required);
}

// Example: Show notes field only if status is "Rejected"
frappe.web_form.on('status', function(field, value) {
    if (value === 'Rejected') {
        toggleFieldVisibility('notes', true);
        makeFieldRequired('notes', true);
    } else {
        toggleFieldVisibility('notes', false);
        makeFieldRequired('notes', false);
    }
});
```

### 2. Form Validation

```javascript
// Check all required fields
function validateForm() {
    let errors = [];
    
    // Check required fields
    frappe.web_form.fields_list.forEach(function(field) {
        if (field.df.reqd && !field.get_value()) {
            errors.push(field.df.label + ' is required');
        }
    });
    
    // Custom validation
    let email = frappe.web_form.get_value('email');
    if (email && !isValidEmail(email)) {
        errors.push('Please enter a valid email address');
    }
    
    let amount = frappe.web_form.get_value('amount');
    if (amount && amount < 0) {
        errors.push('Amount cannot be negative');
    }
    
    if (errors.length > 0) {
        frappe.msgprint(errors.join('<br>'));
        return false;
    }
    
    return true;
}
```

### 3. Loading Data from Server

```javascript
// Load data from multiple sources
async function loadFormData() {
    try {
        showLoadingIndicator();
        
        // Load data from different sources
        let [customerData, productData, settings] = await Promise.all([
            loadCustomerData(),
            loadProductData(),
            loadFormSettings()
        ]);
        
        // Fill in the form
        await frappe.web_form.set_values(customerData);
        await frappe.web_form.set_values(productData);
        await frappe.web_form.set_values(settings);
        
        hideLoadingIndicator();
        
    } catch (error) {
        console.error('Error loading form data:', error);
        frappe.msgprint('Error loading form data');
    }
}
```

### 4. Auto-filling Fields

```javascript
// Auto-fill fields when customer changes
function setupFieldSynchronization() {
    frappe.web_form.on('customer', function(field, value) {
        if (value) {
            loadCustomerDetails(value);
        } else {
            clearCustomerFields();
        }
    });
    
    frappe.web_form.on('amount', function(field, value) {
        calculateTax(value);
        calculateTotal();
    });
}

async function loadCustomerDetails(customerId) {
    try {
        let customer = await fetchCustomer(customerId);
        await frappe.web_form.set_values({
            'customer_name': customer.name,
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address
        });
    } catch (error) {
        console.error('Error loading customer details:', error);
    }
}
```

## Tips and Best Practices

### 1. Performance Tips

```javascript
// Use set_values for multiple updates (faster)
frappe.web_form.set_values({
    'field1': 'value1',
    'field2': 'value2',
    'field3': 'value3'
});

// Instead of multiple set_value calls (slower)
frappe.web_form.set_value('field1', 'value1');
frappe.web_form.set_value('field2', 'value2');
frappe.web_form.set_value('field3', 'value3');
```

### 2. Event Handling

```javascript
// Use debouncing for search fields
let debounceTimer;
frappe.web_form.on('search_field', function(field, value) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function() {
        performSearch(value);
    }, 300);
});
```

### 3. Error Handling

```javascript
// Always wrap form operations in try-catch
function safeFormOperation(operation) {
    try {
        return operation();
    } catch (error) {
        console.error('Form operation failed:', error);
        frappe.msgprint('An error occurred. Please try again.');
        return false;
    }
}
```

### 4. User Experience

```javascript
// Show loading indicators
function showLoadingIndicator() {
    $('.form-container').addClass('loading');
}

function hideLoadingIndicator() {
    $('.form-container').removeClass('loading');
}

// Auto-save functionality
setInterval(function() {
    if (hasUnsavedChanges()) {
        autoSave();
    }
}, 30000);
```

### 5. Security

```javascript
// Always validate input
function validateInput(fieldname, value) {
    // Clean the input
    let sanitized = frappe.utils.escape_html(value);
    
    // Check format
    if (fieldname === 'email' && !isValidEmail(sanitized)) {
        throw new Error('Invalid email format');
    }
    
    return sanitized;
}

// Check permissions
function checkPermission() {
    if (frappe.web_form.login_required && frappe.session.user === 'Guest') {
        throw new Error('Login required');
    }
}
```

## Summary

This guide covers all the main methods and properties of the `frappe.web_form` object. Here's a quick reference:

**Basic Operations:**
- `save()` - Save the form
- `delete_form()` - Delete the document
- `discard_form()` - Cancel changes

**Working with Fields:**
- `get_field(fieldname)` - Get field object
- `get_input(fieldname)` - Get input element
- `has_field(fieldname)` - Check if field exists
- `set_df_property(fieldname, prop, value)` - Change field properties

**Managing Values:**
- `get_value(fieldname)` - Get field value
- `set_value(fieldname, value)` - Set field value
- `get_values()` - Get all values
- `set_values(dict)` - Set multiple values
- `clear()` - Clear all fields

**Events:**
- `on(fieldname, handler)` - Listen for field changes
- `events.on(event, handler)` - Listen for form events

**Multi-Step Forms:**
- `toggle_section()` - Move between sections
- `validate_section()` - Check current section
- `current_section` - Current section number

Remember to always test your code and handle errors properly!

