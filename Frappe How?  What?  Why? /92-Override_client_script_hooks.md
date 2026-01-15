# Overriding Client Script Hook Methods in Frappe Framework

## Table of Contents
1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [JavaScript OOP Fundamentals](#javascript-oop-fundamentals)
4. [Frappe Architecture Overview](#frappe-architecture-overview)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Conclusion](#Summary)

---

## Introduction

### What is Method Overriding?

Method overriding is a fundamental Object-Oriented Programming (OOP) concept where a child class (or in JavaScript's case, a prototype) provides a specific implementation of a method that is already defined in its parent class/prototype. This allows you to extend or modify the behavior of existing methods without modifying the original source code.

### Why Override Form Methods in Frappe?

In Frappe Framework, you might need to override form methods when:

- **Extending functionality**: Add custom behavior to existing form methods
- **Fixing issues**: Patch bugs without modifying core Frappe code
- **Custom business logic**: Implement app-specific requirements
- **Integration**: Hook into form lifecycle events for third-party integrations
- **Global customizations**: Apply changes to all forms across the application

### The Problem with Direct Modification

Modifying Frappe's core files directly is **not recommended** because:
- Updates will overwrite your changes
- Makes maintenance difficult
- Violates separation of concerns
- Can break other apps
- Makes code review and debugging harder

---

## Core Concepts

### 1. Prototype Chain in JavaScript

JavaScript uses **prototypal inheritance**. Every object has a prototype, and methods/properties are looked up through the prototype chain.

```javascript
// Example: Understanding Prototype Chain
function Form() {
    this.doctype = null;
    this.docname = null;
}

// Adding method to prototype
Form.prototype.refresh = function() {
    console.log("Original refresh");
}

// Create instance
let form = new Form();
form.refresh(); // Output: "Original refresh"

// Access prototype
console.log(form.__proto__ === Form.prototype); // true
console.log(Object.getPrototypeOf(form) === Form.prototype); // true

// Prototype chain lookup
// When you call form.refresh():
// 1. JavaScript looks for 'refresh' in form object
// 2. Not found, looks in Form.prototype
// 3. Found! Executes Form.prototype.refresh
```

### 2. Method Overriding Pattern

The standard pattern for overriding methods:

```javascript
// 1. Store reference to original method
const originalMethod = Form.prototype.refresh;

// 2. Replace with new implementation
Form.prototype.refresh = function() {
    // Call original method first (optional but recommended)
    originalMethod.apply(this, arguments);
    
    // Add custom logic
    console.log("Custom refresh logic");
}

// Now all Form instances will use the new refresh method
const form = new Form();
form.refresh(); 
// Output: 
// "Original refresh"
// "Custom refresh logic"
```

### 3. The `app_ready` Event

Frappe triggers the `app_ready` event after the application has fully loaded. This ensures:
- All core JavaScript is loaded
- Frappe objects are available
- Form classes are initialized
- Safe to override methods
- DOM is ready

```javascript
// Frappe's internal code (simplified from frappe/desk.js)
// After all initialization:
$(document).trigger("app_ready");
```

**Why wait for `app_ready`?**
- If you try to override before Frappe loads, `frappe.ui.form.Form` might not exist
- Ensures all dependencies are loaded
- Prevents race conditions

---

## JavaScript OOP Fundamentals

### Prototypes Explained

In JavaScript, **prototypes** are the mechanism for inheritance. Every function has a `prototype` property that becomes the prototype of objects created with that function as a constructor.

```javascript
// Constructor Function
function Form(doctype) {
    this.doctype = doctype;
    this.docname = null;
}

// Adding method to prototype
Form.prototype.refresh = function() {
    console.log(`Refreshing ${this.doctype}`);
}

// Creating instances
const salesOrder = new Form("Sales Order");
const purchaseOrder = new Form("Purchase Order");

salesOrder.refresh(); // "Refreshing Sales Order"
purchaseOrder.refresh(); // "Refreshing Purchase Order"

// Prototype chain lookup
// salesOrder.refresh() → Form.prototype.refresh()
// purchaseOrder.refresh() → Form.prototype.refresh()
// Both share the SAME function from prototype
```

### The `prototype` Property

```javascript
// Understanding prototype property
function MyClass() {
    this.instanceProperty = "Instance";
}

// Methods added to prototype are shared across all instances
MyClass.prototype.sharedMethod = function() {
    return "Shared Method";
}

// Instance properties are unique to each instance
MyClass.prototype.sharedProperty = "Shared";

const instance1 = new MyClass();
const instance2 = new MyClass();

// Same function reference (shared)
console.log(instance1.sharedMethod === instance2.sharedMethod); // true

// Same property value (shared)
console.log(instance1.sharedProperty === instance2.sharedProperty); // true

// Different instance properties
console.log(instance1.instanceProperty === instance2.instanceProperty); // true (same value)
console.log(instance1.instanceProperty); // "Instance"
```

### Method Overriding Mechanics

```javascript
// Base class
function Animal() {}
Animal.prototype.speak = function() {
    return "Some sound";
}

// Override the method
const originalSpeak = Animal.prototype.speak;

Animal.prototype.speak = function() {
    // Option 1: Call original then add new behavior
    const originalSound = originalSpeak.call(this);
    return `${originalSound} - Overridden!`;
    
    // Option 2: Completely replace
    // return "Completely new sound";
}

const dog = new Animal();
console.log(dog.speak()); // "Some sound - Overridden!"
```

### Understanding `this` Context

```javascript
function Form() {
    this.doctype = "Sales Order";
    this.name = "SO-001";
}

Form.prototype.showInfo = function() {
    console.log(`Form: ${this.doctype} - ${this.name}`);
}

const form = new Form();
form.showInfo(); // "Form: Sales Order - SO-001"
// 'this' refers to the 'form' instance

// But if we extract the method:
const extractedMethod = form.showInfo;
extractedMethod(); // Error: Cannot read property 'doctype' of undefined
// 'this' is now undefined (or window in non-strict mode)
```

### `apply()`, `call()`, and `bind()` Methods

These methods allow you to call a function with a specific `this` context:

#### `call()` - Arguments as comma-separated values

```javascript
function greet(greeting, punctuation) {
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const person = { name: "John" };

greet.call(person, "Hello", "!"); 
// Output: "Hello, John!"
// 'this' inside greet() now refers to 'person'
```

#### `apply()` - Arguments as array

```javascript
function greet(greeting, punctuation) {
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const person = { name: "John" };

greet.apply(person, ["Hi", "."]); 
// Output: "Hi, John."
// Same as call(), but arguments are in an array
```

#### `bind()` - Creates new function with bound context

```javascript
function greet(greeting, punctuation) {
    console.log(`${greeting}, ${this.name}${punctuation}`);
}

const person = { name: "John" };

const boundGreet = greet.bind(person);
boundGreet("Hey", "?"); // "Hey, John?"

// Useful for event handlers
button.addEventListener("click", greet.bind(person));
```

**Why use `apply()` in overrides?**

```javascript
// Original method signature
Form.prototype.refresh = function(docname, callback) {
    // ... implementation
}

// When overriding, we don't know how many arguments will be passed
Form.prototype.refresh = function() {
    // ❌ Wrong: Only passes first argument
    originalRefresh.call(this, arguments[0]);
    
    // ✅ Correct: Passes ALL arguments
    originalRefresh.apply(this, arguments);
    
    // ✅ Also correct (ES6)
    originalRefresh.apply(this, [...arguments]);
}
```

### Optional Chaining (`?.`)

Introduced in ES2020, optional chaining safely accesses nested properties:

```javascript
// Without optional chaining
if (frappe && frappe.ui && frappe.ui.form && frappe.ui.form.Form) {
    const FormProto = frappe.ui.form.Form.prototype;
}

// With optional chaining
const FormProto = frappe.ui.form?.Form?.prototype;
// Returns undefined if any part of the chain is null/undefined
// Instead of throwing an error
```

---

## Frappe Architecture Overview

### Form Class Structure

Frappe's Form class is defined in `frappe/public/js/frappe/form/form.js`:

```javascript
// Simplified structure
class Form {
    constructor(doctype, docname) {
        this.doctype = doctype;
        this.docname = docname;
        this.doc = null;
        this.meta = null;
        this.fields = {};
        this.grids = [];
        // ... more properties
    }
    
    refresh(docname) {
        // Original refresh implementation:
        // 1. Loads document from server
        // 2. Sets up form structure
        // 3. Triggers events
        // 4. Renders fields
        // 5. Calls client scripts
    }
    
    setup() {
        // One-time setup when form is first loaded
    }
    
    validate() {
        // Validates form data
    }
    
    save() {
        // Saves form data
    }
    
    // ... more methods
}
```

### Form Lifecycle

```
1. Form Creation
   ↓
2. setup() - One-time setup (called once)
   ↓
3. refresh() - Load document (called every time form loads)
   ↓
4. render_form() - Render UI elements
   ↓
5. refresh_fields() - Update field values
   ↓
6. trigger("refresh") - Execute client scripts
   ↓
7. User interactions trigger field events
   ↓
8. save() / submit() / cancel()
```

### Client Script Hooks

Frappe provides multiple ways to hook into form events:

#### 1. Client Scripts (per-doctype) - Standard Approach

```javascript
// Runs only for Sales Order doctype
frappe.ui.form.on("Sales Order", {
    refresh: function(frm) {
        // This runs every time a Sales Order form refreshes
        frm.add_custom_button("Custom Action", function() {
            // Action code
        });
    },
    
    setup: function(frm) {
        // Runs once when form is first set up
    }
});
```

#### 2. Prototype Override (global) - Advanced Approach

```javascript
// Affects ALL forms globally
$(document).on("app_ready", function() {
    const FormProto = frappe.ui.form?.Form?.prototype;
    const originalRefresh = FormProto.refresh;
    
    FormProto.refresh = function() {
        // This runs for EVERY form refresh
        if (originalRefresh) {
            originalRefresh.apply(this, arguments);
        }
        // Global custom logic
    };
});
```

**When to use each approach:**
- **Client Scripts**: When you need doctype-specific behavior
- **Prototype Override**: When you need global behavior for all forms

---

## Step-by-Step Implementation

### Step 1: Create Bundle File Structure

Create the following directory structure in your app:

```
your_app/
├── your_app/
│   ├── public/
│   │   └── js/
│   │       ├── your_app.bundle.js      # Entry point (bundle file)
│   │       └── form_overrides.js       # Your logic file
│   └── hooks.py                        # Hook registration
```

### Step 2: Create the Logic File

**File: `your_app/public/js/form_overrides.js`**

```javascript
/**
 * Form Override Logic
 * 
 * This file contains custom logic to override Frappe form methods.
 * This file will be executed in the bundle.
 */

function overrideFormRefresh() {
    // Get reference to Form prototype using optional chaining
    const FormProto = frappe.ui.form?.Form?.prototype;
    
    // Safety check: Ensure Form class exists
    if (!FormProto) {
        console.warn("Form prototype not found. Override skipped.");
        return;
    }
    
    // Store reference to original refresh method
    // This preserves the original functionality
    const originalRefresh = FormProto.refresh;
    
    // Override the refresh method
    FormProto.refresh = function(docname) {
        // Call original method first (preserves original behavior)
        try {
            if (originalRefresh) {
                // Use apply() to pass all arguments and maintain 'this' context
                originalRefresh.apply(this, arguments);
            }
        } catch (e) {
            console.error("Form refresh failed:", e);
            // Optionally re-throw or handle error
            // throw e; // Uncomment to re-throw
        }
        
        // YOUR CUSTOM LOGIC HERE
        // This runs after the original refresh completes
        
        // Example 1: Add custom button for all submitted forms
        if (this.doc && this.doc.docstatus === 1) {
            this.add_custom_button(__("Custom Action"), function() {
                frappe.msgprint("Custom action triggered!");
            });
        }
        
        // Example 2: Log refresh for debugging
        if (frappe.boot.developer_mode) {
            console.log(`Form refreshed: ${this.doctype} - ${this.docname}`);
        }
        
        // Example 3: Conditional logic based on doctype
        if (this.doctype === "Sales Order") {
            // Sales Order specific logic
        }
    };
}

function overrideFormSetup() {
    const FormProto = frappe.ui.form?.Form?.prototype;
    if (!FormProto) return;
    
    const originalSetup = FormProto.setup;
    
    FormProto.setup = function() {
        // Call original setup
        if (originalSetup) {
            originalSetup.apply(this, arguments);
        }
        
        // Custom setup logic
        console.log("Custom setup executed for:", this.doctype);
    };
}

// Wait for app_ready event
// This ensures Frappe is fully loaded before we try to override methods
$(document).on("app_ready", function() {
    console.log("App ready - initializing form overrides");
    
    // Execute overrides
    overrideFormRefresh();
    overrideFormSetup();
    
    // You can add more overrides here
    // overrideFormValidate();
    // overrideFormSave();
    
    console.log("Form overrides initialized successfully");
});
```

### Step 3: Create Bundle Entry Point

**File: `your_app/public/js/your_app.bundle.js`**

```javascript
/**
 * Main Bundle Entry Point
 * 
 * This file is the entry point for your app's JavaScript bundle.
 * It will be execute when the app is ready.
 * All imported js files will execute once this file execute.
 * Frappe's build system will bundle this file along with its imports.
 */

import "./form_overrides.js";


```

### Step 4: Register Bundle in Hooks

**File: `your_app/hooks.py`**

```python
# Assets
# ------------------------------

# Include your bundle file
# This tells Frappe to load this JavaScript file on every page
app_include_js = ["your_app.bundle.js"]

# If you have multiple bundles:
# app_include_js = [
#     "your_app.bundle.js",
#     "another_bundle.bundle.js"
# ]
```

### Step 5: Build Assets

After creating your files, you may need to build the assets so Frappe can bundle them:

```bash
# Build for development (faster, includes source maps)
bench build --app your_app
```

### Step 6: Test Your Override

1. Clear browser cache or do hard refresh (Ctrl+Shift+R)
2. Open any form in Frappe
3. Open browser console (F12)
4. Check for your console logs
5. Verify custom behavior is working

---

## Best Practices

### 1. Always Call Original Method

```javascript
// ✅ Good: Preserves original behavior
FormProto.refresh = function() {
    originalRefresh.apply(this, arguments);
    // Your custom logic
};

// ❌ Bad: Breaks original functionality
FormProto.refresh = function() {
    // Only custom logic - original behavior lost!
    // Form won't load documents, won't trigger events, etc.
};
```

### 2. Use Try-Catch Blocks

```javascript
// ✅ Good: Error handling prevents breaking forms
FormProto.refresh = function() {
    try {
        if (originalRefresh) {
            originalRefresh.apply(this, arguments);
        }
    } catch (e) {
        console.error("Error in original refresh:", e);
        // Decide: re-throw or handle gracefully
    }
    
    try {
        // Your custom logic
    } catch (e) {
        console.error("Error in custom logic:", e);
        // Don't break original functionality
    }
};

// ❌ Bad: One error breaks everything
FormProto.refresh = function() {
    originalRefresh.apply(this, arguments);
    // If this throws, entire refresh fails
    yourCustomLogic();
};
```

### 3. Check for Existence

```javascript
// ✅ Good: Safety checks
const FormProto = frappe.ui.form?.Form?.prototype;
if (!FormProto || !FormProto.refresh) {
    console.warn("Cannot override: Form or refresh method not found");
    return;
}

// ❌ Bad: Assumes existence
const FormProto = frappe.ui.form.Form.prototype; 
// May throw: Cannot read property 'Form' of undefined
```

### 4. Use Optional Chaining

```javascript
// ✅ Good: Safe property access
const FormProto = frappe.ui.form?.Form?.prototype;
const originalRefresh = FormProto?.refresh;

// ❌ Bad: May throw errors
const FormProto = frappe.ui.form.Form.prototype;
const originalRefresh = FormProto.refresh;
```

### 5. Document Your Overrides

```javascript
/**
 * Override Form.refresh to add custom functionality
 * 
 * @description Adds custom export button to all submitted forms
 * @author Your Name
 * @date 2024-01-01
 * @requires frappe.ui.form.Form
 * @modifies Form.prototype.refresh
 * 
 * @example
 * // This override adds a custom button to all forms
 * // when the document is submitted (docstatus === 1)
 */
export function overrideFormRefresh() {
    // Implementation
}
```

### 6. Avoid Overriding Multiple Times

```javascript
// ✅ Good: Check if already overridden
if (!FormProto._customRefreshOverridden) {
    const originalRefresh = FormProto.refresh;
    FormProto.refresh = function() {
        if (originalRefresh) {
            originalRefresh.apply(this, arguments);
        }
        // Custom logic
    };
    FormProto._customRefreshOverridden = true; // Mark as overridden
}

// ❌ Bad: May override multiple times
FormProto.refresh = function() { /* ... */ };
// Later in code...
FormProto.refresh = function() { /* ... */ }; // Overwrites previous override
```

### 7. Use Developer Mode Checks

```javascript
// Only run expensive operations in development
if (frappe.boot.developer_mode) {
    console.log("Override applied:", this.doctype);
    console.trace("Call stack for override");
}

// Or disable in production
if (!frappe.boot.developer_mode) {
    // Production-only logic
}
```

---

## Troubleshooting

### Issue 1: Override Not Working

**Symptoms**: Custom logic not executing, no errors in console

**Debugging Steps**:

```javascript
$(document).on("app_ready", function() {
    console.log("1. App ready fired"); // Check if this logs
    
    // Check Form prototype exists
    console.log("2. Form prototype:", frappe.ui.form?.Form?.prototype);
    
    // Check original method exists
    const FormProto = frappe.ui.form?.Form?.prototype;
    console.log("3. Original refresh:", FormProto?.refresh);
    
    // Apply override
    overrideFormRefresh();
    
    // Verify override was applied
    console.log("4. New refresh:", FormProto?.refresh);
    console.log("5. Override successful:", FormProto?.refresh !== originalRefresh);
});
```

**Common Causes**:
- Bundle not included in `hooks.py`
- Assets not built (`bench build --app your_app`)
- Browser cache (clear cache or hard refresh)
- Import/export syntax errors
- `app_ready` not firing

### Issue 2: Original Method Not Called

**Symptoms**: Form breaks, original functionality lost, form doesn't load

**Solutions**:

```javascript
// ✅ Always call original
const originalRefresh = FormProto.refresh;
FormProto.refresh = function() {
    // Must call original
    if (originalRefresh) {
        originalRefresh.apply(this, arguments);
    }
    // Then custom logic
};

// ❌ Missing original call
FormProto.refresh = function() {
    // Only custom logic - breaks form!
};
```

### Issue 3: Bundle Not Loading

**Symptoms**: No errors, but override doesn't apply

**Checklist**:
1. ✅ `hooks.py` has `app_include_js = ["your_app.bundle.js"]`
2. ✅ File exists at `your_app/public/js/your_app.bundle.js`
3. ✅ Rebuild assets: `bench build --app your_app`
4. ✅ Clear browser cache (Ctrl+Shift+Delete)
5. ✅ Check browser console for import errors
6. ✅ Check Network tab - is bundle.js loading?

**Verify in Browser Console**:
```javascript
// Check if bundle loaded
console.log(frappe.boot.assets_json.js); // Should include your bundle

// Check if override function exists
console.log(typeof overrideFormRefresh); // Should be "function"
```

### Issue 4: Multiple Overrides Conflict

**Symptoms**: Only one override works, others are ignored

**Solutions**:

```javascript
// Use composition pattern
function composeOverrides() {
    const FormProto = frappe.ui.form?.Form?.prototype;
    const original = FormProto.refresh;
    
    FormProto.refresh = function() {
        // Call original
        if (original) original.apply(this, arguments);
        
        // Call override 1
        override1Logic(this);
        
        // Call override 2
        override2Logic(this);
        
        // Call override 3
        override3Logic(this);
    };
}

// Or use chaining pattern (see Pattern 6 above)
```

### Issue 5: `this` Context Lost

**Symptoms**: `this` is undefined or refers to wrong object, errors like "Cannot read property 'doctype' of undefined"

**Solutions**:

```javascript
// ✅ Correct: Use apply/call to maintain context
originalRefresh.apply(this, arguments);

// ❌ Wrong: Direct call loses context
originalRefresh(); // this is undefined

// ❌ Wrong: Arrow function changes context
FormProto.refresh = () => {
    // Arrow functions don't have their own 'this'
    // 'this' refers to outer scope, not form instance
    originalRefresh.apply(this, arguments); // Wrong 'this'
};

// ✅ Correct: Regular function
FormProto.refresh = function() {
    // Regular function has correct 'this'
    originalRefresh.apply(this, arguments); // Correct 'this'
};
```

---

## Summary

### Key Takeaways

1. **Prototype Override**: Modify `Form.prototype.methodName` to override methods globally
2. **Preserve Original**: Always call original method using `apply()` to maintain functionality
3. **Timing**: Use `app_ready` event to ensure Frappe is fully loaded
4. **Bundle Structure**: Create bundle file, import logic, register in hooks
5. **Error Handling**: Wrap in try-catch to prevent breaking forms
6. **Safety Checks**: Verify objects exist before accessing (use optional chaining)
7. **Context Preservation**: Use `apply()`/`call()` to maintain correct `this` context

### Quick Reference Template

```javascript
// Standard Override Pattern
$(document).on("app_ready", function() {
    // 1. Get prototype with safety check
    const FormProto = frappe.ui.form?.Form?.prototype;
    if (!FormProto) {
        console.warn("Form prototype not found");
        return;
    }
    
    // 2. Store original method
    const originalMethod = FormProto.methodName;
    
    // 3. Override method
    FormProto.methodName = function() {
        try {
            // 4. Call original first
            if (originalMethod) {
                originalMethod.apply(this, arguments);
            }
        } catch (e) {
            console.error("Original method error:", e);
            throw e; // Re-throw if critical
        }
        
        try {
            // 5. Your custom logic here
            yourCustomLogic(this);
        } catch (e) {
            console.error("Custom logic error:", e);
            // Don't break original functionality
        }
    };
});
```

### File Structure Checklist

- [ ] Create `public/js/your_app.bundle.js` (entry point)
- [ ] Create `public/js/form_overrides.js` (logic file)
- [ ] Import logic file in bundle: `import "./form_overrides.js";`
- [ ] Add `app_include_js = ["your_app.bundle.js"]` in `hooks.py`
- [ ] Build assets: `bench build --app your_app`
- [ ] Test in browser console
- [ ] Document your overrides
- [ ] Add error handling
- [ ] Test with different doctypes
- [ ] Verify original functionality still works