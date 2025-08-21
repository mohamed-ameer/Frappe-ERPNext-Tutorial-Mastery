# Custom Jinja Filters in Frappe Framework

## Overview

Jinja filters are powerful tools in Frappe that allow you to transform and format data directly in templates. This guide explains how to create and implement custom Jinja filters in your Frappe applications.

## What are Jinja Filters?

Jinja filters are functions that transform data values. They can be used in:
- Print formats
- Web templates
- Email templates
- Report templates
- Any Jinja template context

**Example Usage:**
```jinja
{{ 1234.56 | english_to_arabic_numbers }}
<!-- Output: ١٢٣٤.٥٦ -->

{{ 1500.75 | currency_to_arabic_words }}
<!-- Output: ألف وخمسمائة جنيه وخمسة وسبعون قرشاً -->
```

## Creating Custom Jinja Filters

### Step 1: Create the Filter Function

Create a Python file in your app's utils directory:

```python
# apps/your_app/your_app/utils/custom_jinja_filters/your_filter.py

def your_custom_filter(value, *args, **kwargs):
    """
    Custom Jinja filter function
    
    Args:
        value: The input value to be processed
        *args: Additional positional arguments
        **kwargs: Additional keyword arguments
    
    Returns:
        Transformed value
    """
    if value is None:
        return ""
    
    # Your transformation logic here
    result = process_value(value, *args, **kwargs)
    
    return result

def process_value(value, *args, **kwargs):
    """Helper function for processing the value"""
    # Implement your transformation logic
    return str(value).upper()  # Example transformation
```

### Step 2: Register the Filter in hooks.py

Add your filter to the `jinja` configuration in your app's `hooks.py`:

```python
# apps/your_app/your_app/hooks.py

jinja = {
    "filters": [
        "your_app.utils.custom_jinja_filters.your_filter.your_custom_filter",
        # Add more filters here
    ]
}
```

### Step 3: Restart Frappe

After adding the filter, restart your Frappe bench:

```bash
bench restart

or if you not enabled supervisor
then stop the bench by `Ctrl + c` then `bench start` again
```

## Real-World Examples

### Example 1: Number Formatting Filter

```python
# apps/your_app/your_app/utils/custom_jinja_filters/number_formatter.py

def format_currency(value, currency="USD", locale="en_US"):
    """
    Format number as currency
    
    Args:
        value: Numeric value to format
        currency: Currency code (default: USD)
        locale: Locale for formatting (default: en_US)
    
    Returns:
        Formatted currency string
    """
    if value is None:
        return ""
    
    try:
        import locale as locale_module
        locale_module.setlocale(locale_module.LC_ALL, locale)
        return locale_module.currency(float(value), grouping=True, symbol=currency)
    except:
        return f"{currency} {value:,.2f}"
```

**Usage:**
```jinja
{{ 1234.56 | format_currency("USD") }}
<!-- Output: $1,234.56 -->

{{ 1234.56 | format_currency("EUR", "de_DE") }}
<!-- Output: 1.234,56 € -->
```

### Example 2: Text Processing Filter

```python
# apps/your_app/your_app/utils/custom_jinja_filters/text_processor.py

import re

def truncate_text(value, length=100, suffix="..."):
    """
    Truncate text to specified length
    
    Args:
        value: Text to truncate
        length: Maximum length (default: 100)
        suffix: Suffix to add when truncated (default: "...")
    
    Returns:
        Truncated text
    """
    if not value:
        return ""
    
    text = str(value)
    if len(text) <= length:
        return text
    
    return text[:length - len(suffix)] + suffix

def slugify(value):
    """
    Convert text to URL-friendly slug
    
    Args:
        value: Text to convert
    
    Returns:
        URL-friendly slug
    """
    if not value:
        return ""
    
    # Convert to lowercase and replace spaces with hyphens
    slug = re.sub(r'[^\w\s-]', '', str(value).lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')
```

**Usage:**
```jinja
{{ "This is a very long text that needs to be truncated" | truncate_text(20) }}
<!-- Output: This is a very long... -->

{{ "Hello World! This is a test." | slugify }}
<!-- Output: hello-world-this-is-a-test -->
```

## Common Use Cases

### 1. Print Formats
```jinja
<!-- In print format template -->
<div class="amount">
    Amount: {{ doc.amount | format_currency("USD") }}
</div>
```

### 2. Email Templates
```jinja
<!-- In email template -->
<p>Your order total is: {{ doc.total | format_currency }}</p>
<p>Order date: {{ doc.creation | format_date("%B %d, %Y") }}</p>
```

### 3. Web Templates
```jinja
<!-- In web template -->
<span class="price">{{ item.price | format_currency }}</span>
<span class="date">{{ item.date | time_ago }}</span>
```

### 4. Report Templates
```jinja
<!-- In report template -->
<td>{{ row.amount | format_currency }}</td>
<td>{{ row.date | format_date("%d/%m/%Y") }}</td>
``` 

---

# Jinja Filters Quick Reference

## How the Hook Works

The `jinja` configuration in `hooks.py` registers custom filters with Frappe's Jinja environment:

```python
# hooks.py
jinja = {
    "filters": [
        "app.utils.custom_jinja_filters.filter_name.function_name"
    ]
}
```

**Path Format:** `app_name.utils.custom_jinja_filters.file_name.function_name`

## Filter Function Structure

```python
def your_filter(value, *args, **kwargs):
    """
    Filter description
    
    Args:
        value: Input value to transform
        *args: Additional positional arguments
        **kwargs: Additional keyword arguments
    
    Returns:
        Transformed value
    """
    if value is None:
        return ""
    
    # Your transformation logic
    return transformed_value
```

## Usage in Templates

```jinja
<!-- Basic usage -->
{{ value | filter_name }}

<!-- With arguments -->
{{ value | filter_name("arg1", "arg2") }}

<!-- With keyword arguments -->
{{ value | filter_name(param1="value1", param2="value2") }}

<!-- Chaining filters -->
{{ value | filter1 | filter2 | filter3 }}
```

## Error Handling Template

```python
def safe_filter(value):
    try:
        if value is None:
            return ""
        
        # Your logic here
        return result
    except Exception:
        return str(value)  # Fallback
```

## Registration Checklist

- [ ] Create filter function in `utils/custom_jinja_filters/`
- [ ] Add to `jinja.filters` in `hooks.py`
- [ ] Restart Frappe bench
- [ ] Test in template

## Common Issues

| Issue | Solution |
|-------|----------|
| Filter not found | Check import path in hooks.py |
| Import error | Verify function exists in module |
| No output | Check for None values and errors |
| Wrong format | Verify input type handling |
