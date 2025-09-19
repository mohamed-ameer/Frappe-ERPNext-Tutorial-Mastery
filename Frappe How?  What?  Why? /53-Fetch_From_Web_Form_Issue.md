# Fetch From Field Issue in Web Forms

### The Issue
When you have a DocType with a Child Table containing:
- A **Link Field** (e.g., `item_code` linking to `Item`)
- A **Fetch From Field** (e.g., `item_name` that fetches from `item_code.item_name`)

The Fetch From functionality works perfectly in the **Desk UI** but **fails to work in Web Forms**.

### Why This Happens
The core issue is that Web Forms use a different form control system (`frappe.ui.FieldGroup`) compared to the Desk UI (`frappe.ui.form.Form`). The Fetch From functionality relies on specific form management features that are not fully implemented in the Web Form system.

### BTW
This is actually normal behavior for Web Forms in client portals because:

### Security & Permission Reasons:

- **Guest User Limitations**: Web Forms often run as "Guest" users or with limited permissions.
- **No API Access**: Guest users typically don't have permission to call `frappe.client.get_value`.
- **Data Protection**: Fetch From functionality requires read access to the linked DocType, which is usually restricted for public web forms.

## Understanding Web Forms

### What is a Web Form?
A **Web Form** in Frappe is a public-facing form that allows users to create, view, edit, and delete documents without accessing the main Desk interface. It's designed for:

- **Public Access**: Can be accessed by guests or authenticated users
- **Simplified Interface**: Clean, user-friendly forms
- **Custom Styling**: Can be customized with CSS and JavaScript
- **Client Scripts**: Supports custom JavaScript for enhanced functionality

### Web Form Architecture
```javascript
// apps/frappe/frappe/public/js/frappe/web_form/web_form.js
// Web Form uses frappe.ui.FieldGroup instead of frappe.ui.form.Form
export default class WebForm extends frappe.ui.FieldGroup {
    constructor(opts) {
        super();
        // Web Form specific initialization
    }
}
```

### Key Differences from Desk UI
1. **Form Control**: Uses `FieldGroup` instead of `Form`
2. **Field Management**: Simplified field handling
3. **Event System**: Different event handling mechanism
4. **Fetch Dictionary**: Missing `fetch_dict` initialization

## Understanding Fetch From Functionality

### What is Fetch From?
**Fetch From** is a Frappe feature that automatically populates field values based on linked document data. When you select a value in a Link field, it can automatically fetch related data from the linked document.

### How Fetch From Works Behind the Scenes

#### 1. Field Definition
```json
{
    "fieldname": "item_name",
    "fieldtype": "Data",
    "fetch_from": "item_code.item_name",
    "read_only": 1
}
```

#### 2. Fetch Map Creation
The system creates a `fetch_map` that maps:
- **Source Field**: `item_code` (Link field)
- **Target Field**: `item_name` (Data field)
- **Source Property**: `item_name` (from linked document)

#### 3. Validation and Fetch Process
```javascript
// apps/frappe/frappe/public/js/frappe/form/controls/link.js
validate_link_and_fetch(value) {
    const columns_to_fetch = Object.values(this.fetch_map);
    
    if (value) {
        return frappe.xcall("frappe.client.validate_link", {
            doctype: options,
            docname: value,
            fields: columns_to_fetch,
        }).then((response) => {
            update_dependant_fields(response);
            return response.name;
        });
    }
}
```

### Fetch Dictionary Structure
```javascript
// In Desk UI (frappe.ui.form.Form)
// apps/frappe/frappe/public/js/frappe/form/form.js
this.fetch_dict.setDefault(target_doctype, {}).setDefault(link_field, {})[target_field] =
			source_field;
// imagine it as:
this.fetch_dict = {
    "*": {
        "item_code": {
            "item_name": "item_name"
        }
    },
    "Child Table DocType": {
        "item_code": {
            "item_name": "item_name"
        }
    }
}
```

## Root Cause Analysis

### The Core Problem
Web Forms don't properly initialize the `fetch_dict` and `fetch_map` system that's required for Fetch From functionality to work.

### Missing Components in Web Forms

#### 1. Fetch Dictionary Initialization
```javascript
// Desk UI has this:
this.fetch_dict = {};

// Web Forms are missing this initialization
```

#### 2. Setup Add Fetch Function
```javascript
// Desk UI calls this for all fields:
function setup_add_fetch(df) {
    if (is_read_only_field && df.fetch_from && df.fetch_from.indexOf(".") != -1) {
        var parts = df.fetch_from.split(".");
        me.frm.add_fetch(parts[0], parts[1], df.fieldname, df.parent);
    }
}
```

#### 3. Form Reference
Web Forms don't have a proper `frm` reference that the Link control expects for fetch operations.

### Code Analysis

#### Desk UI Implementation
```javascript
// In frappe.ui.form.Form
this.fetch_dict = {};
this.add_fetch = function(link_field, source_field, target_field, target_doctype) {
    this.fetch_dict.setDefault(target_doctype, {}).setDefault(link_field, {})[target_field] = source_field;
};
```

#### Web Form Implementation
```javascript
// In frappe.ui.FieldGroup (Web Form base class)
// Missing fetch_dict initialization and add_fetch method
```

## Technical Deep Dive

### Link Control Fetch Map Logic
```javascript
get fetch_map() {
    const fetch_map = {};
    
    // For quick entry (Web Forms use this path)
    if (!this.frm && this.layout && this.layout.fields) {
        return this.fetch_map_for_quick_entry();
    }
    
    // For regular forms (Desk UI)
    if (!this.frm) return fetch_map;
    
    for (const key of ["*", this.df.parent]) {
        if (this.frm.fetch_dict[key] && this.frm.fetch_dict[key][this.df.fieldname]) {
            Object.assign(fetch_map, this.frm.fetch_dict[key][this.df.fieldname]);
        }
    }
    
    return fetch_map;
}
```

### Web Form Field Setup
```javascript
// In webform_script.js
function setup_fields(web_form_doc, doc_data) {
    web_form_doc.web_form_fields.forEach((df) => {
        df.is_web_form = true;
        df.read_only = df.read_only || (!web_form_doc.is_new && !web_form_doc.in_edit_mode);
        
        if (df.fieldtype === "Table") {
            // Child table setup
            $.each(df.fields || [], function (_i, field) {
                if (field.fieldtype === "Link") {
                    field.only_select = true;
                }
                field.is_web_form = true;
            });
        }
    });
}
```

## Solution Implementation

Add this client script to your Web Form:

```javascript
// Simple Web Form Fetch From Fix
// Focus on child tables and manual fetching

frappe.ready(function() {
    console.log('Web Form Fetch From script loaded');
    
    // Wait a bit for the form to load
    setTimeout(function() {
        setupChildTableFetchFrom();
    }, 2000);
});

function setupChildTableFetchFrom() {
    console.log('Setting up child table fetch from...');
    
    // Find all child tables in the web form
    $('.web-form-wrapper').find('[data-fieldtype="Table"]').each(function() {
        const $table = $(this);
        const tableFieldName = $table.attr('data-fieldname');
        
        if (!tableFieldName) return;
        
        console.log('Found table field:', tableFieldName);
        
        // Get the table field definition
        const tableField = frappe.web_form.fields_dict[tableFieldName];
        if (!tableField || !tableField.df.fields) {
            console.log('Table field definition not found for:', tableFieldName);
            return;
        }
        
        // Find link fields and their fetch fields
        const linkFields = tableField.df.fields.filter(f => f.fieldtype === 'Link');
        
        linkFields.forEach(linkField => {
            const fetchFields = tableField.df.fields.filter(f => 
                f.fetch_from && f.fetch_from.startsWith(linkField.fieldname + '.')
            );
            
            if (fetchFields.length > 0) {
                console.log(`Setting up fetch for ${linkField.fieldname} -> ${fetchFields.map(f => f.fieldname).join(', ')}`);
                setupLinkFieldListener(tableFieldName, linkField, fetchFields);
            }
        });
    });
}

function setupLinkFieldListener(tableFieldName, linkField, fetchFields) {
    // Use event delegation on the table container
    const $tableContainer = $(`.web-form-wrapper [data-fieldname="${tableFieldName}"]`);
    
    if ($tableContainer.length === 0) {
        console.log('Table container not found for:', tableFieldName);
        return;
    }
    
    // Listen for changes on link fields within this table
    $tableContainer.on('change', `input[data-fieldname="${linkField.fieldname}"]`, function() {
        const $linkInput = $(this);
        const linkValue = $linkInput.val();
        const $row = $linkInput.closest('.grid-row, .row, tr');
        
        console.log('Link field changed:', linkField.fieldname, 'Value:', linkValue, 'Row:', $row);
        
        if (!linkValue) {
            // Clear fetch fields
            fetchFields.forEach(fetchField => {
                const $targetField = $row.find(`input[data-fieldname="${fetchField.fieldname}"], select[data-fieldname="${fetchField.fieldname}"]`);
                if ($targetField.length) {
                    $targetField.val('');
                    $targetField.trigger('change');
                    console.log('Cleared field:', fetchField.fieldname);
                }
            });
            return;
        }
        
        // Fetch data manually
        fetchDataForFields(linkField, fetchFields, linkValue, $row);
    });
    
    // Also listen for blur events (when user selects from dropdown)
    $tableContainer.on('blur', `input[data-fieldname="${linkField.fieldname}"]`, function() {
        const $linkInput = $(this);
        const linkValue = $linkInput.val();
        const $row = $linkInput.closest('.grid-row, .row, tr');
        
        if (linkValue && $row.length) {
            console.log('Link field blurred, fetching data...');
            fetchDataForFields(linkField, fetchFields, linkValue, $row);
        }
    });
}

function fetchDataForFields(linkField, fetchFields, linkValue, $row) {
    // Prepare fields to fetch
    const fieldsToFetch = fetchFields.map(f => f.fetch_from.split('.')[1]);
    const uniqueFields = [...new Set(fieldsToFetch)];
    
    console.log('Fetching fields:', uniqueFields, 'from doctype:', linkField.options, 'for value:', linkValue);
    
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: linkField.options,
            fieldname: uniqueFields.join(','),
            filters: { name: linkValue }
        },
        callback: function(r) {
            if (r.message) {
                console.log('Successfully fetched data:', r.message);
                
                fetchFields.forEach(fetchField => {
                    const sourceField = fetchField.fetch_from.split('.')[1];
                    const $targetField = $row.find(`input[data-fieldname="${fetchField.fieldname}"], select[data-fieldname="${fetchField.fieldname}"]`);
                    
                    if ($targetField.length && r.message[sourceField]) {
                        $targetField.val(r.message[sourceField]);
                        $targetField.trigger('change');
                        frappe.web_form.set_value(fetchField.fieldname, r.message[sourceField]);
                        console.log(`Updated ${fetchField.fieldname} with: ${r.message[sourceField]}`);
                    } else {
                        console.log(`Could not update ${fetchField.fieldname}:`, {
                            targetFieldFound: $targetField.length > 0,
                            sourceValue: r.message[sourceField]
                        });
                    }
                });
            } else {
                console.log('No data found for value:', linkValue);
            }
        },
        error: function(r) {
            console.error('Error fetching data:', r);
        }
    });
}

// Also try when page is fully loaded
$(document).ready(function() {
    setTimeout(function() {
        console.log('Document ready, setting up fetch from...');
        setupChildTableFetchFrom();
    }, 3000);
});

```

```
frappe.ready(() => {
    new WebFormFetch();
});
class WebFormFetch {
    constructor() {
        this.timeout = null;
        frappe.ready(() => setTimeout(() => this.init(), 2000));
        $(document).ready(() => setTimeout(() => this.init(), 3000));
    }

    init() {
        $('.web-form-wrapper [data-fieldtype="Table"]').each((i, table) => {
            const fieldName = $(table).attr('data-fieldname');
            const tableDef = frappe.web_form?.fields_dict?.[fieldName]?.df?.fields;
            
            if (!tableDef) return;
            
            const linkFields = tableDef.filter(f => f.fieldtype === 'Link');
            
            linkFields.forEach(link => {
                const fetchFields = tableDef.filter(f => 
                    f.fetch_from?.startsWith(link.fieldname + '.')
                );
                
                if (fetchFields.length) {
                    this.setupListener($(table), link, fetchFields);
                }
            });
        });
    }

    setupListener($table, linkField, fetchFields) {
        const selector = `input[data-fieldname="${linkField.fieldname}"]`;
        
        $table.on('change blur', selector, (e) => {
            const value = $(e.target).val()?.trim();
            const $row = $(e.target).closest('.grid-row, .row, tr');
            
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                value ? this.fetchData(linkField, fetchFields, value, $row) 
                      : this.clearFields(fetchFields, $row);
            }, 300);
        });
    }

    clearFields(fetchFields, $row) {
        fetchFields.forEach(f => {
            $row.find(`[data-fieldname="${f.fieldname}"]`).val('').trigger('change');
        });
    }

    fetchData(linkField, fetchFields, value, $row) {
        const sourceFields = [...new Set(fetchFields.map(f => f.fetch_from.split('.')[1]))];
        
        frappe.call({
            method: 'frappe.client.get_value',
            args: {
                doctype: linkField.options,
                fieldname: sourceFields.join(','),
                filters: { name: value }
            },
            callback: (r) => {
                if (r.message) {
                    fetchFields.forEach(field => {
                        const sourceField = field.fetch_from.split('.')[1];
                        const val = r.message[sourceField];
                        if (val) {
                            const $target = $row.find(`[data-fieldname="${field.fieldname}"]`);
                            $target.val(val).trigger('change');
                            frappe.web_form?.set_value?.(field.fieldname, val);
                        }
                    });
                }
            }
        });
    }
}

new WebFormFetch();
```

```
frappe.web_form.after_load = () => {
    setTimeout(() => {
        setupChildTableFetchFrom();
    }, 1000);
};

function setupChildTableFetchFrom() {
    // Find table fields in the web form
    if (!frappe.web_form.fields_dict) return;
    
    Object.keys(frappe.web_form.fields_dict).forEach(fieldname => {
        const field = frappe.web_form.fields_dict[fieldname];
        
        if (field?.df?.fieldtype === 'Table' && field.df.fields) {
            setupTableFetchHandlers(fieldname, field.df.fields);
        }
    });
}

function setupTableFetchHandlers(tableFieldname, tableFields) {
    const linkFields = tableFields.filter(f => f.fieldtype === 'Link');
    
    linkFields.forEach(linkField => {
        const fetchFields = tableFields.filter(f => 
            f.fetch_from?.startsWith(linkField.fieldname + '.')
        );
        
        if (fetchFields.length > 0) {
            setupChildTableLinkHandler(tableFieldname, linkField, fetchFields);
        }
    });
}

function setupChildTableLinkHandler(tableFieldname, linkField, fetchFields) {
    // Use event delegation since child table rows are dynamic
    const tableSelector = `[data-fieldname="${tableFieldname}"]`;
    const linkSelector = `input[data-fieldname="${linkField.fieldname}"]`;
    
    $(document).on('change blur', `${tableSelector} ${linkSelector}`, function() {
        const value = $(this).val()?.trim();
        const rowIndex = $(this).closest('[data-idx]').attr('data-idx');
        
        if (!value) {
            clearChildTableFetchFields(tableFieldname, rowIndex, fetchFields);
        } else {
            fetchChildTableData(tableFieldname, rowIndex, linkField, fetchFields, value);
        }
    });
}

function clearChildTableFetchFields(tableFieldname, rowIndex, fetchFields) {
    fetchFields.forEach(field => {
        const fieldSelector = `[data-fieldname="${tableFieldname}"] [data-idx="${rowIndex}"] [data-fieldname="${field.fieldname}"]`;
        $(fieldSelector).val('').trigger('change');
    });
}

function fetchChildTableData(tableFieldname, rowIndex, linkField, fetchFields, linkValue) {
    const sourceFields = [...new Set(fetchFields.map(f => f.fetch_from.split('.')[1]))];
    
    frappe.call({
        method: 'frappe.client.get_value',
        args: {
            doctype: linkField.options,
            fieldname: sourceFields.join(','),
            filters: { name: linkValue }
        },
        callback: (r) => {
            if (r.message) {
                fetchFields.forEach(field => {
                    const sourceField = field.fetch_from.split('.')[1];
                    const value = r.message[sourceField];
                    
                    if (value !== undefined && value !== null) {
                        const fieldSelector = `[data-fieldname="${tableFieldname}"] [data-idx="${rowIndex}"] [data-fieldname="${field.fieldname}"]`;
                        $(fieldSelector).val(value).trigger('change');
                    }
                });
            }
        },
        error: (r) => {
            console.error('Error fetching data for', linkValue, ':', r);
        }
    });
}
```

## Conclusion

The Fetch From functionality in Web Forms requires custom implementation because the Web Form system doesn't include the same fetch management features as the Desk UI. The solutions provided above offer different approaches to implement this functionality, from simple client scripts to more sophisticated server-side enhancements.

**Remember:**

This is actually normal behavior for Web Forms in client portals because Security & Permission Reasons:

- **Guest User Limitations**: Web Forms often run as "Guest" users or with limited permissions.
- **No API Access**: Guest users typically don't have permission to call `frappe.client.get_value`.
- **Data Protection**: Fetch From functionality requires read access to the linked DocType, which is usually restricted for public web forms.

**So** this solution above must be for logged_in Users NOT Guests

