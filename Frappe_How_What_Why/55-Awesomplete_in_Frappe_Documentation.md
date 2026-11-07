# Awesomplete in Frappe - Complete Guide

## What is Awesomplete?

**Awesomplete** is a lightweight, vanilla JavaScript autocomplete library created by Lea Verou. It provides a simple way to add autocomplete functionality to input fields without requiring jQuery or other heavy dependencies.

### Key Features of Awesomplete:
- **Lightweight**: Only ~2KB minified and gzipped
- **No Dependencies**: Pure vanilla JavaScript
- **Accessible**: Built with ARIA attributes for screen readers
- **Customizable**: Highly flexible styling and behavior
- **Mobile-friendly**: Works well on touch devices

## Why Does Frappe Use Awesomplete?

Frappe chose Awesomplete for several important reasons:

### 1. **Performance**
- Lightweight library that doesn't slow down the application
- Minimal memory footprint
- Fast rendering of suggestions

### 2. **User Experience**
- Provides instant feedback as users type
- Reduces typing effort and errors
- Makes data entry faster and more intuitive

### 3. **Flexibility**
- Easy to customize for different field types
- Supports complex data structures
- Can be extended with custom filtering and formatting

### 4. **Accessibility**
- Built-in ARIA support for screen readers
- Keyboard navigation support
- Follows web accessibility standards

## How Frappe Uses Awesomplete

Frappe integrates Awesomplete in several key areas:

### 1. **Link Fields** (`ControlLink`)
The most common use case - for selecting related documents.

```javascript
// From frappe/public/js/frappe/form/controls/link.js
this.awesomplete = new Awesomplete(me.input, {
    tabSelect: true,
    minChars: 0,
    maxItems: 99,
    autoFirst: true,
    list: [],
    replace: function (item) {
        this.input.value = me.get_translated(item.label || item.value);
    },
    data: function (item) {
        return {
            label: me.get_translated(item.label || item.value),
            value: item.value,
        };
    },
    filter: function () {
        return true; // Server-side filtering
    }
});
```

### 2. **Autocomplete Fields** (`ControlAutocomplete`)
For fields with predefined options.

```javascript
// From frappe/public/js/frappe/form/controls/autocomplete.js
this.awesomplete = new Awesomplete(this.input, {
    tabSelect: true,
    minChars: 0,
    maxItems: this.df.max_items || 99,
    autoFirst: true,
    list: this.get_data(),
    filter: function (item, input) {
        let hay = item.label + item.value;
        return Awesomplete.FILTER_CONTAINS(hay, input);
    }
});
```

### 3. **Multi-Select Fields** (`ControlMultiSelect`)
For selecting multiple values.

```javascript
// From frappe/public/js/frappe/form/controls/multiselect.js
get_awesomplete_settings() {
    return {
        filter: function (text, input) {
            return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
        },
        item: function (text, input) {
            return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
        }
    };
}
```

### 4. **Global Search** (`AwesomeBar`)
For the main search functionality.

```javascript
// From frappe/public/js/frappe/ui/toolbar/awesome_bar.js
var awesomplete = new Awesomplete(input, {
    minChars: 0,
    maxItems: 10,
    autoFirst: true,
    list: [],
    filter: function (text, input) {
        return Awesomplete.FILTER_CONTAINS(text, input);
    }
});
```

## Awesomplete Configuration in Frappe

### Common Settings Used by Frappe:

```javascript
{
    tabSelect: true,        // Allow selection with Tab key
    minChars: 0,           // Minimum characters before showing suggestions
    maxItems: 99,          // Maximum number of suggestions to show
    autoFirst: true,       // Automatically select first item
    list: [],              // Array of suggestion items
    filter: function() {}, // Custom filtering function
    item: function() {},   // Custom item rendering function
    data: function() {},   // Data transformation function
    replace: function() {} // Custom replacement function
}
```

### Key Events Handled:

```javascript
// Open event
$input.on("awesomplete-open", function() {
    // Suggestions are shown
});

// Close event
$input.on("awesomplete-close", function() {
    // Suggestions are hidden
});

// Selection event
$input.on("awesomplete-select", function(e) {
    // User selected an item
});

// Selection complete event
$input.on("awesomplete-selectcomplete", function() {
    // Selection is finalized
});
```

## Data Structure

Frappe typically uses this data structure for Awesomplete:

```javascript
[
    {
        label: "Display Text",      // What user sees
        value: "actual_value",      // What gets stored
        description: "Extra info"   // Optional description
    }
]
```

## Server-Side Integration

Frappe uses server-side filtering for better performance:

```javascript
// Example from link.js
frappe.call({
    method: "frappe.desk.search.search_link",
    args: {
        doctype: doctype,
        txt: term,
        filters: filters
    },
    callback: function(r) {
        if (r.message) {
            me.awesomplete.list = r.message;
        }
    }
});
```

## Styling Awesomplete in Frappe

Frappe provides comprehensive CSS for Awesomplete:

```scss
// From frappe/public/scss/common/awesomeplete.scss
.awesomplete {
    position: relative;
    
    > ul {
        position: absolute;
        left: 0;
        z-index: 1000;
        min-width: 100%;
        box-sizing: border-box;
        list-style: none;
        padding: 0;
        margin: 0;
        background: white;
        border: 1px solid #ccc;
        border-radius: 3px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    > ul > li {
        padding: 8px 12px;
        cursor: pointer;
        
        &:hover,
        &[aria-selected="true"] {
            background-color: var(--awesomplete-hover-bg);
            color: var(--awesomplete-hover-color);
        }
    }
}
```

## Custom Implementation Example

Here's how you might implement Awesomplete in a custom Frappe field:

```javascript
frappe.ui.form.ControlCustomField = class ControlCustomField extends frappe.ui.form.ControlData {
    make_input() {
        super.make_input();
        this.setup_awesomplete();
    }
    
    setup_awesomplete() {
        this.awesomplete = new Awesomplete(this.input, {
            minChars: 2,
            maxItems: 10,
            autoFirst: true,
            list: this.get_suggestions(),
            filter: function(text, input) {
                return Awesomplete.FILTER_CONTAINS(text, input);
            },
            item: function(text, input) {
                return Awesomplete.ITEM(text, input);
            }
        });
        
        // Handle selection
        this.$input.on("awesomplete-selectcomplete", (e) => {
            this.set_value(e.text.value);
        });
    }
    
    get_suggestions() {
        // Return your suggestion data
        return [
            { label: "Option 1", value: "opt1" },
            { label: "Option 2", value: "opt2" }
        ];
    }
};
```

## Performance Considerations

### 1. **Server-Side Filtering**
Frappe uses server-side filtering for large datasets to avoid loading all data client-side.

### 2. **Caching**
Frappe caches search results to avoid repeated server calls:

```javascript
this.$input.cache = {};
if (this.$input.cache[doctype] && this.$input.cache[doctype][term]) {
    me.awesomplete.list = this.$input.cache[doctype][term];
    return;
}
```

### 3. **Debouncing**
For search fields, Frappe implements debouncing to avoid excessive server calls.

## Accessibility Features

ARIA (Accessible Rich Internet Applications) is a set of attributes you can add to HTML elements that define ways to make web content and applications accessible to users with disabilities.

Awesomplete in Frappe includes several accessibility features:

- **ARIA attributes**: Proper `role="listbox"` and `aria-selected` attributes
- **Keyboard navigation**: Arrow keys, Enter, Escape support
- **Screen reader support**: Proper labeling and announcements
- **Focus management**: Maintains focus state correctly

## Common Issues and Solutions

### 1. **Suggestions Not Showing**
```javascript
// Make sure the input is focused and has data
if (this.$input.is(":focus") && this.awesomplete.list.length > 0) {
    this.awesomplete.evaluate();
}
```

### 2. **Custom Filtering**
```javascript
// Override the default filter
this.awesomplete.filter = function(item, input) {
    return item.label.toLowerCase().includes(input.toLowerCase());
};
```

### 3. **Custom Item Rendering**
```javascript
this.awesomplete.item = function(text, input) {
    var item = this.get_item(text.value);
    return $("<li></li>")
        .html("<strong>" + item.label + "</strong>")
        .get(0);
};
```

## Best Practices

### 1. **Always Handle Events**
```javascript
this.$input.on("awesomplete-selectcomplete", () => {
    this.parse_validate_and_set_in_model(this.get_input_value());
});
```

### 2. **Validate Selections**
```javascript
validate(value) {
    let valid_values = this.awesomplete._list.map(d => d.value);
    return valid_values.includes(value) ? value : "";
}
```

### 3. **Clean Up Resources**
```javascript
destroy() {
    if (this.awesomplete) {
        this.awesomplete.destroy();
    }
    super.destroy();
}
```

## Summary

Awesomplete is a crucial part of Frappe's user interface, providing:

- **Enhanced UX**: Makes data entry faster and more intuitive
- **Performance**: Lightweight and efficient
- **Flexibility**: Highly customizable for different use cases
- **Accessibility**: Built-in support for screen readers and keyboard navigation

Frappe's implementation shows how to effectively integrate a third-party library while maintaining consistency with the framework's architecture and design patterns.

The library is used across multiple field types and components, demonstrating its versatility and the value it brings to the Frappe ecosystem.

