# Frappe Form Guard Implementation Guide
## Prevent Data Loss with Unsaved Changes Warning

---

## Table of Contents
- **1. Overview**
- **2. What This Solution Does**
- **3. Step-by-Step Implementation**
- **4. Testing Your Implementation**
- **5. Customization Options**
- **6. Troubleshooting**
- **7. Q&A**

---

## Overview

This guide shows you how to implement a **form guard system** in Frappe that warns users when they try to leave a form with unsaved changes. It also adds logout confirmation to prevent accidental logouts.

**Key Features:**
- **Unsaved changes warning** when closing tab/reloading page
- **Logout confirmation** when clicking logout button
- **Automatic cleanup** after save/submit/cancel
- **Works on all DocTypes** automatically
- **Zero performance impact**

---

## What This Solution Does

### **Unsaved Changes Protection**
- Detects when a form has unsaved changes
- Shows browser warning when user tries to close tab or reload
- Automatically clears warning after saving

### **Logout Confirmation**
- Overrides the default logout action
- Shows confirmation dialog before logout
- Prevents accidental logouts

### **Smart Event Handling**
- Works with Frappe's form event system
- Doesn't interfere with your existing DocType scripts
- Automatically manages event handlers

---

## Step-by-Step Implementation

### **Step 1: Create Your App Structure**

First, ensure you have a custom app. If not, create one:

```bash
# Navigate to your bench directory
cd /path/to/your/frappe-bench

# Create a new app (if you don't have one)
bench new-app my_form_guard_app

# Install the app
bench --site your-site.com install-app my_form_guard_app
```

### **Step 2: Create the Form Guard JavaScript File**

Create the file: `my_form_guard_app/public/js/form_guard.js`

```javascript
// --- Form Guard System for Frappe ---
// Prevents data loss by warning users about unsaved changes
// and confirming logout actions

(function() {
    'use strict';
    
    // --- Unsaved Changes Guard ---
    
    /**
     * Attaches the beforeunload event handler to warn about unsaved changes
     * @param {Object} frm - Frappe form object
     */
    function attachUnloadGuard(frm) {
        // Remove any existing handler first
        clearUnloadGuard();
        
        // Set the beforeunload handler
        window.onbeforeunload = function(e) {
            try {
                // Check if form exists and has unsaved changes
                if (frm && frm.is_dirty && frm.is_dirty()) {
                    // Prevent navigation and show browser warning
                    e.preventDefault();
                    e.returnValue = ""; // Required for Chrome/Edge/Firefox
                    return ""; // Required for older browsers
                }
            } catch (err) {
                // Log error but don't block navigation
                console.warn("Form guard error:", err);
            }
        };
    }
    
    /**
     * Removes the beforeunload event handler
     */
    function clearUnloadGuard() {
        if (window.onbeforeunload) {
            window.onbeforeunload = null;
        }
    }
    
    // --- Form Event Handlers ---
    
    // Apply to ALL DocTypes using wildcard
    frappe.ui.form.on('*', {
        /**
         * Called when a form is first loaded
         */
        onload(frm) {
            // Clear any existing guard from previous forms
            clearUnloadGuard();
        },
        
        /**
         * Called when a form is refreshed/displayed
         */
        refresh(frm) {
            // Attach the guard for the current form
            attachUnloadGuard(frm);
        },
        
        /**
         * Called after a form is successfully saved
         */
        after_save(frm) {
            // Form is saved, no need to warn
            clearUnloadGuard();
        },
        
        /**
         * Called when a form is submitted
         */
        on_submit(frm) {
            // Form is submitted, no need to warn
            clearUnloadGuard();
        },
        
        /**
         * Called when a form is cancelled
         */
        on_cancel(frm) {
            // Form is cancelled, no need to warn
            clearUnloadGuard();
        },
        
        /**
         * Called after a form is deleted (optional)
         */
        after_delete(frm) {
            // Form is deleted, no need to warn
            clearUnloadGuard();
        }
    });
    
    // --- Logout Confirmation ---
    
    /**
     * Override the default logout action to add confirmation
     */
    function setupLogoutConfirmation() {
        // Store the original logout function
        const originalLogout = frappe.ui.toolbar.logout;
        
        // Override with our custom logout
        frappe.ui.toolbar.logout = function() {
            frappe.confirm(
                __('Are you sure you want to logout?'),
                () => {
                    // User confirmed - proceed with logout
                    window.location.href = '/?cmd=logout';
                },
                () => {
                    // User cancelled - show message
                    frappe.show_alert(__('Logout cancelled'), 'info');
                }
            );
        };
    }
    
    // --- Initialize the System ---
    
    // Wait for Frappe to be ready
    if (frappe && frappe.ui && frappe.ui.toolbar) {
        setupLogoutConfirmation();
    } else {
        // If not ready, wait for it
        frappe.ready(() => {
            setupLogoutConfirmation();
        });
    }
    
})();
```

### **Step 3: Configure Your App Hooks**

Edit your app's `hooks.py` file: `my_form_guard_app/hooks.py`

```python
# Add this to your existing hooks.py
app_include_js = [
    "/assets/my_form_guard_app/js/form_guard.js"
]

# If you already have app_include_js, append to it:
# app_include_js = [
#     "existing.bundle.js",
#     "/assets/my_form_guard_app/js/form_guard.js"
# ]
```

### **Step 4: Build and Deploy**

```bash
# Build your app's assets
bench build --app my_form_guard_app

# Clear cache to ensure new assets are loaded
bench clear-cache

# Restart if you run background services
bench restart
```

---

## Testing Your Implementation

### **Test 1: Unsaved Changes Warning**

1. **Open any form** (e.g., User, Item, Customer)
2. **Edit a field** (change any value)
3. **Don't save** the form
4. **Try to close the tab** or **reload the page**
5. **Expected result**: Browser shows warning dialog

### **Test 2: No Warning After Save**

1. **Edit a field** in any form
2. **Save the form** (Ctrl+S or Save button)
3. **Try to close the tab** or **reload the page**
4. **Expected result**: No warning dialog

### **Test 3: Logout Confirmation**

1. **Click the Logout button** in the toolbar
2. **Expected result**: Confirmation dialog appears
3. **Click Cancel** - should stay logged in
4. **Click Confirm** - should logout

### **Test 4: Form Switching**

1. **Edit a form** but don't save
2. **Navigate to a different form** (same tab)
3. **Expected result**: No warning (form switching is safe)

---

## Customization Options

### **Option 1: Restrict to Specific DocTypes**

Replace the wildcard `'*'` with specific DocTypes:

```javascript
// Instead of frappe.ui.form.on('*', { ... })
// Use specific DocTypes:

const protectedDoctypes = ['User', 'Item', 'Customer', 'Sales Order'];

protectedDoctypes.forEach(doctype => {
    frappe.ui.form.on(doctype, {
        onload(frm) { clearUnloadGuard(); },
        refresh(frm) { attachUnloadGuard(frm); },
        after_save(frm) { clearUnloadGuard(); },
        on_submit(frm) { clearUnloadGuard(); },
        on_cancel(frm) { clearUnloadGuard(); }
    });
});
```

### **Option 2: Custom Warning Messages**

For logout confirmation, you can customize the message:

```javascript
frappe.confirm(
    __('You have unsaved changes. Are you sure you want to logout?'),
    () => { window.location.href = '/?cmd=logout'; },
    () => { frappe.show_alert(__('Logout cancelled'), 'info'); }
);
```

### **Option 3: Add Route Change Protection**

Protect against navigation within the app:

```javascript
// Add this to your form_guard.js
frappe.router.on('change', () => {
    const curFrm = cur_frm;
    if (curFrm && curFrm.is_dirty && curFrm.is_dirty()) {
        frappe.confirm(
            __('You have unsaved changes. Leave without saving?'),
            () => { 
                // User confirmed - allow navigation
                // The router will continue with the change
            },
            () => { 
                // User cancelled - prevent navigation
                // This will stop the route change
                return false;
            }
        );
        return false; // Prevent navigation
    }
});
```

---

## Troubleshooting

### **Problem: Warning doesn't appear**

**Solution:**
1. Check browser console for errors
2. Verify the file path in hooks.py is correct
3. Ensure you've run `bench build` and `bench clear-cache`
4. Check if the form actually has `is_dirty()` method

### **Problem: Warning appears even after saving**

**Solution:**
1. Verify the `after_save` event is firing
2. Check if your form has custom save logic
3. Ensure `clearUnloadGuard()` is being called

### **Problem: Multiple warnings**

**Solution:**
1. Check for duplicate script inclusions
2. Ensure `clearUnloadGuard()` is called before `attachUnloadGuard()`
3. Verify no other scripts are setting `onbeforeunload`

### **Problem: Logout confirmation doesn't work**

**Solution:**
1. Check if `frappe.ui.toolbar.logout` exists
2. Verify the script loads after Frappe is ready
3. Check browser console for JavaScript errors

---

## Q&A

### **Q: Will this override my existing DocType scripts?**
**A**: No. `frappe.ui.form.on('*', ...)` appends handlers to the event pipeline. Your existing `onload`, `refresh`, `validate`, etc. scripts will still run.

### **Q: What is the "event pipeline"?**
**A**: It's the sequence of all handlers registered for a form event. When an event fires, Frappe calls all registered handlers in order (core first, then custom), allowing multiple apps to cooperate.

### **Q: Why clear the guard in `onload`?**
**A**: To prevent stale warnings. If a previous form set the handler and you open a new form, you don't want a misleading "unsaved" warning.

### **Q: Why put the guard in `refresh`?**
**A**: `refresh` runs whenever the form is shown or re-shown, making it the perfect place to bind the handler for the current form instance.

### **Q: Can I customize the browser warning text?**
**A**: Modern browsers ignore custom text for `beforeunload` and show a generic message. This is a browser security feature, not a limitation of our code.

### **Q: Does this work across multiple browser tabs?**
**A**: Yes. Each tab has its own `window` and handler, so they're isolated. Within a single tab, switching forms is safe thanks to the clear/rebind logic.

### **Q: Any performance impact?**
**A**: Negligible. One lightweight handler and a few simple event hooks. The performance cost is minimal compared to the data protection benefits.

### **Q: Can I disable tab close warnings but keep logout confirmation?**
**A**: Yes. Remove the `beforeunload` logic and keep only the logout confirmation part.

---

## Important Notes

### **Correct Navigation Methods**

- `frappe.set_route('List', 'User')` - Navigate to a list view
- `frappe.set_route('Form', 'Customer', 'CUST-001')` - Navigate to a specific form
- `frappe.set_route('dashboard')` - Navigate to dashboard

### **Understanding `cur_frm`**

The `cur_frm` is a global variable that represents the currently active form. It's automatically set by Frappe when a form is loaded and contains:

- **Form object**: The current form instance
- **Document data**: The form's document data  
- **Methods**: Form methods like `is_dirty()`, `save()`, `refresh()`, etc.

**Usage in our code:**
```javascript
const curFrm = cur_frm;  // Get current form
if (curFrm && curFrm.is_dirty && curFrm.is_dirty()) {
    // Check if form has unsaved changes
}
```

**Note**: Always check if `cur_frm` exists before using it, as it might be `null` when no form is active.

