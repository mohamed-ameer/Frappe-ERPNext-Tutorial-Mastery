# Adding Language Toggle to Frappe Navbar

---

## Table of Contents

1. [Introduction](#introduction)
2. [Concept and Theory](#concept-and-theory)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [File Structure](#file-structure)
6. [Code Explanation](#code-explanation)
7. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Summary](#summary)

---

## Introduction

This guide explains how to add a **language toggle button** to the Frappe navbar that allows users to switch between languages (e.g., English and Arabic) with a single click.

**What you'll build:**
- A JavaScript class to handle language switching
- A navbar button that toggles between languages
- An automatic installation script that runs after migration
- Proper bundling and hooks configuration

**Result:**
- Users can click "Toggle Language" / "تبديل اللغة" in the navbar
- Language switches instantly and page reloads
- User's language preference is saved

---

## Concept and Theory

### Understanding the Components

#### 1. Navbar Settings

**What is it?**
- Frappe's **Navbar Settings** is a Single DocType that controls the navbar items
- It has a child table called `settings_dropdown` that contains dropdown menu items
- You can add custom actions to this dropdown

**Why use it?**
- Centralized navbar management
- Persistent across sessions
- Accessible from any page

#### 2. JavaScript Bundles

**What is it?**
- Frappe uses **Rollup** to bundle JavaScript files
- Bundles are loaded on every page
- Files ending in `.bundle.js` are automatically bundled

**Why use it?**
- Code organization
- Namespace management (`my_app.ui.LanguageSwitcher`)
- Automatic loading

#### 3. After Migrate Hook

**What is it?**
- A hook that runs **after `bench migrate`** completes
- Used for one-time setup tasks
- Ensures navbar item is added automatically

**Why use it?**
- Automatic installation
- No manual setup required
- Idempotent (safe to run multiple times)

### How Language Switching Works

```
User clicks "Toggle Language"
    ↓
JavaScript calls LanguageSwitcher.toggle()
    ↓
Determines next language (en → ar or ar → en)
    ↓
Calls frappe.client.set_value() to update User.language
    ↓
Page reloads with new language
    ↓
All UI text is translated
```

---

## Architecture Overview

```
my_app/
├── hooks.py                          # Register bundles and hooks
├── public/
│   └── js/
│       └── my_app.bundle.js         # Language switcher class
└── utils/
    └── install.py                    # After migrate hook
```

**Data Flow:**

1. **Bundle Loading**: `my_app.bundle.js` → Loaded on every page → Creates `my_app.ui.LanguageSwitcher`
2. **Navbar Item**: Stored in `Navbar Settings` → Rendered in navbar → Calls `new my_app.ui.LanguageSwitcher().toggle()`
3. **Installation**: `bench migrate` → Runs `after_migrate` hook → Adds navbar item automatically

---

## Step-by-Step Implementation

### Step 1: Create the File Structure

Create the necessary folders in your app:

```bash
cd apps/my_app

# Create public/js folder
mkdir -p public/js

# Create utils folder
mkdir -p my_app/utils
```

### Step 2: Create the JavaScript Bundle

Create the file: `my_app/public/js/my_app.bundle.js`

**Purpose:** Contains the language switcher class that will be available globally.

```javascript
// File: my_app/public/js/my_app.bundle.js

// Create namespace for your app
frappe.provide("my_app.ui");

/**
 * Language Switcher Class
 * Handles toggling between languages in the navbar
 */
my_app.ui.LanguageSwitcher = class LanguageSwitcher {
    constructor() {
        // Define supported languages
        this.languages = ["en", "ar"];
        
        // Get current language from frappe.boot
        this.current_language = frappe.boot.lang || "en";
    }

    /**
     * Toggle between languages
     * Switches from current language to the next one
     */
    toggle() {
        // Determine next language
        const next_language = this.current_language === "en" ? "ar" : "en";
        this.set_language(next_language);
    }

    /**
     * Set language for current user
     * @param {string} lang - Language code (e.g., "en", "ar")
     */
    set_language(lang) {
        frappe.call({
            method: "frappe.client.set_value",
            args: {
                doctype: "User",
                name: frappe.session.user,
                fieldname: "language",
                value: lang,
            },
            callback: () => {
                frappe.msgprint(__("Refreshing..."));
                window.location.reload();
            },
        });
    }
};
```

**Key Points:**
- `frappe.provide("my_app.ui")` creates the namespace
- Class is attached to `my_app.ui` for global access
- `frappe.boot.lang` contains the current user's language
- `frappe.client.set_value()` updates the User document
- Page reloads to apply the new language

### Step 3: Create the Installation Script

Create the file: `my_app/my_app/utils/install.py`

**Purpose:** Automatically adds the navbar item after migration.

```python
# File: my_app/my_app/utils/install.py

import frappe

def after_migrate():
    """
    Hook that runs after bench migrate
    Adds language toggle to navbar settings
    """
    print("Running my_app After Migrate Hook")
    add_switch_language_to_navbar_settings()


def add_switch_language_to_navbar_settings():
    """
    Add 'Toggle Language' item to Navbar Settings dropdown

    This function:
    1. Gets the Navbar Settings single
    2. Checks if item already exists (idempotent)
    3. Shifts existing items down by 1 position
    4. Inserts the new item at position 9
    5. Saves the settings
    """
    # Get Navbar Settings (Single DocType)
    navbar_settings = frappe.get_single("Navbar Settings")

    # Check if already exists (make it idempotent)
    if frappe.db.exists("Navbar Item", {"item_label": "Toggle Language"}):
        print("Toggle Language already exists in navbar")
        return

    # Shift items after position 8 down by 1
    # This makes room for our new item at position 9
    for navbar_item in navbar_settings.settings_dropdown[8:]:
        navbar_item.idx = navbar_item.idx + 1

    # Add the new navbar item
    navbar_settings.append(
        "settings_dropdown",
        {
            "item_label": "Toggle Language",  # Label shown in navbar
            "item_type": "Action",            # Type: Action (runs JavaScript)
            "action": "new my_app.ui.LanguageSwitcher().toggle()",  # JavaScript to execute
            "is_standard": 0,                 # Not a standard Frappe item
            "idx": 9,                         # Position in dropdown (after "Set Desktop Background")
        },
    )

    # Save the settings
    navbar_settings.save()
    print("Toggle Language added to navbar at position 9")
```

**Key Points:**
- **Idempotent**: Checks if item exists before adding
- **Position 9**: Inserts after "Set Desktop Background" (position 8)
- **Shifts items**: Moves existing items down to make room
- **Action**: Calls the JavaScript class we created
- **is_standard=0**: Marks as custom (not part of Frappe core)

### Step 4: Create `__init__.py` for utils Module

Create the file: `my_app/my_app/utils/__init__.py`

**Purpose:** Makes `utils` a Python module.

```python
# File: my_app/my_app/utils/__init__.py

# This file makes utils a Python package
# It can be empty or contain imports

from .install import after_migrate

__all__ = ["after_migrate"]
```

### Step 5: Register the Bundle in hooks.py

Edit the file: `my_app/my_app/hooks.py`

**Purpose:** Tell Frappe to load your JavaScript bundle and run the after_migrate hook.

```python
# File: my_app/my_app/hooks.py

# ... existing code ...

# Application name
app_name = "my_app"

# ... existing hooks ...

# ------------------
# JavaScript Bundles
# ------------------

# Include js files in the build
# These files will be bundled and loaded on every page
app_include_js = [
    "/assets/my_app/js/my_app.bundle.js"
]

# or directly file name (but it must be in the '/my_app/public/' folder)
app_include_js = ["my_app.bundle.js"]


# ------------------
# After Migrate Hook
# ------------------

# Runs after bench migrate
after_migrate = [
    "my_app.utils.install.after_migrate"
]

# ... rest of hooks.py ...
```

**Key Points:**
- **app_include_js**: Loads your bundle on every page
- **Path format**: `/assets/{app_name}/js/{filename}`
- **after_migrate**: Runs your installation function after migration

### Step 6: Build the Bundle (Optional)

Run the build command to compile your JavaScript:

```bash
# From bench directory
cd ~/frappe-bench

# Build assets for your app
bench build --app my_app

# Or build all apps
bench build
```

**What happens:**
1. Frappe finds `my_app.bundle.js`
2. Rollup bundles it
3. Output goes to `sites/assets/my_app/js/my_app.bundle.js`
4. File is loaded on every page

### Step 7: Run Migration

Run the migration to execute the after_migrate hook:

```bash
# From bench directory
bench migrate

# Or for specific site
bench --site your-site.local migrate
```

**What happens:**
1. Migration runs
2. `after_migrate` hook is called
3. `add_switch_language_to_navbar_settings()` executes
4. "Toggle Language" item is added to navbar

### Step 8: Clear Cache and Reload (Optional)

Clear cache to ensure changes are loaded:

```bash
# Clear cache
bench clear-cache

# Or restart bench
bench restart
```

**Then reload your browser:**
- Press `Ctrl+Shift+R` (hard reload)
- Check the navbar dropdown (click your profile picture)
- You should see "Toggle Language" / "تبديل اللغة"

---

## File Structure

After completing all steps, your app structure should look like this:

```
my_app/
├── my_app/
│   ├── hooks.py                      # ✅ Updated with bundle and hook
│   ├── utils/
│   │   ├── __init__.py              # ✅ Created (makes it a module)
│   │   └── install.py               # ✅ Created (after_migrate hook)
│   └── ...
├── public/
│   └── js/
│       └── my_app.bundle.js         # ✅ Created (language switcher)
└── ...
```

**Generated files (after build):**
```
sites/
└── assets/
    └── my_app/
        └── js/
            └── my_app.bundle.js     # ✅ Bundled JavaScript
```

---

## Code Explanation

### JavaScript Bundle Breakdown

```javascript
// 1. Create namespace
frappe.provide("my_app.ui");
// Creates: window.my_app = { ui: {} }

// 2. Define class
my_app.ui.LanguageSwitcher = class LanguageSwitcher {
    // Now accessible globally as: my_app.ui.LanguageSwitcher

    constructor() {
        // 3. Initialize with supported languages
        this.languages = ["en", "ar"];

        // 4. Get current language from frappe.boot
        // frappe.boot is loaded on every page with user data
        this.current_language = frappe.boot.lang || "en";
    }

    toggle() {
        // 5. Determine next language (simple toggle)
        const next_language = this.current_language === "en" ? "ar" : "en";

        // 6. Call set_language to update
        this.set_language(next_language);
    }

    set_language(lang) {
        // 7. Update User document via API
        frappe.call({
            method: "frappe.client.set_value",  // Built-in Frappe method
            args: {
                doctype: "User",
                name: frappe.session.user,      // Current user
                fieldname: "language",
                value: lang,                     // New language
            },
            callback: () => {
                // 8. Show message and reload
                frappe.msgprint(__("Refreshing..."));
                window.location.reload();        // Reload to apply language
            },
        });
    }
};
```

### Installation Script Breakdown

```python
def add_switch_language_to_navbar_settings():
    # 1. Get Navbar Settings (Single DocType)
    navbar_settings = frappe.get_single("Navbar Settings")
    # Returns: Document object for Navbar Settings

    # 2. Check if already exists (idempotent)
    if frappe.db.exists("Navbar Item", {"item_label": "Toggle Language"}):
        return
    # Prevents duplicate entries

    # 3. Shift existing items down
    for navbar_item in navbar_settings.settings_dropdown[8:]:
        navbar_item.idx = navbar_item.idx + 1
    # Items at position 9+ move to 10+

    # 4. Add new item at position 9
    navbar_settings.append(
        "settings_dropdown",  # Child table name
        {
            "item_label": "Toggle Language",
            "item_type": "Action",
            "action": "new my_app.ui.LanguageSwitcher().toggle()",
            "is_standard": 0,
            "idx": 9,
        },
    )

    # 5. Save the document
    navbar_settings.save()
    # Commits changes to database
```

### Navbar Item Fields Explained

| Field | Value | Explanation |
|-------|-------|-------------|
| `item_label` | "Toggle Language" | Text shown in dropdown |
| `item_type` | "Action" | Type of item (Action runs JavaScript) |
| `action` | `new my_app.ui.LanguageSwitcher().toggle()` | JavaScript code to execute |
| `is_standard` | 0 | Not a standard Frappe item (custom) |
| `idx` | 9 | Position in dropdown (1-based index) |

**Other item_type options:**
- `Route`: Navigate to a route
- `Action`: Execute JavaScript
- `Separator`: Visual separator line

---

## Testing

### Test 1: Verify Bundle is Loaded

1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `my_app.ui.LanguageSwitcher`
4. Press Enter

**Expected result:**
```javascript
class LanguageSwitcher { ... }
```

**If undefined:**
- Bundle not loaded
- Check `hooks.py` → `app_include_js`
- Run `bench build --app my_app`
- Clear cache: `bench clear-cache`

### Test 2: Verify Navbar Item Exists

1. Click your profile picture in navbar
2. Look for "Toggle Language" in dropdown

**Expected result:**
- Item appears at position 9 (after "Set Desktop Background")

**If not visible:**
- Check database: `select * from 'tabNavbar Item' where item_label='Toggle Language'`
- Run migration again: `bench migrate`
- Check `install.py` for errors

### Test 3: Test Language Toggle

1. Click "Toggle Language"
2. Wait for page reload

**Expected result:**
- If English → switches to Arabic (RTL layout)
- If Arabic → switches to English (LTR layout)
- All UI text is translated

**If not working:**
- Check browser console for JavaScript errors
- Verify User.language field is updated
- Check if translations exist for your language

---

## Best Practices

### 1. Namespace Management

✅ **Do:**
```javascript
// Use frappe.provide() to create namespace
frappe.provide("my_app.ui");

// Attach classes to namespace
my_app.ui.LanguageSwitcher = class LanguageSwitcher { ... };
```

❌ **Don't:**
```javascript
// Don't pollute global namespace
class LanguageSwitcher { ... }  // Bad!
window.LanguageSwitcher = ...   // Bad!
```

### 2. Idempotent Installation

✅ **Do:**
```python
def add_switch_language_to_navbar_settings():
    # Check if exists first
    if frappe.db.exists("Navbar Item", {"item_label": "Toggle Language"}):
        return

    # Add item
    # ...
```

❌ **Don't:**
```python
def add_switch_language_to_navbar_settings():
    # Always adds, creates duplicates!
    navbar_settings.append(...)
```

### 3. Error Handling

✅ **Do:**
```javascript
set_language(lang) {
    frappe.call({
        method: "frappe.client.set_value",
        args: { ... },
        callback: (r) => {
            if (!r.exc) {
                frappe.msgprint(__("Refreshing..."));
                window.location.reload();
            }
        },
        error: (r) => {
            frappe.msgprint(__("Failed to change language"));
        }
    });
}
```

❌ **Don't:**
```javascript
set_language(lang) {
    frappe.call({
        method: "frappe.client.set_value",
        args: { ... },
        callback: () => {
            window.location.reload();  // Reloads even on error!
        }
    });
}
```

### 4. Supporting More Languages

✅ **Do:**
```javascript
my_app.ui.LanguageSwitcher = class LanguageSwitcher {
    constructor() {
        // Get all enabled languages from system
        this.languages = frappe.boot.lang_dict || ["en", "ar"];
        this.current_language = frappe.boot.lang || "en";
    }

    toggle() {
        // Cycle through all languages
        const current_index = this.languages.indexOf(this.current_language);
        const next_index = (current_index + 1) % this.languages.length;
        const next_language = this.languages[next_index];
        this.set_language(next_language);
    }
};
```

### 5. Custom Language List

For specific language pairs:

```javascript
my_app.ui.LanguageSwitcher = class LanguageSwitcher {
    constructor() {
        // Define your specific languages
        this.languages = ["en", "ar", "fr", "es"];
        this.current_language = frappe.boot.lang || "en";
    }

    toggle() {
        // Cycle through your languages
        const current_index = this.languages.indexOf(this.current_language);
        const next_index = (current_index + 1) % this.languages.length;
        this.set_language(this.languages[next_index]);
    }
};
```

### 6. Language Selector Dialog

For better UX with many languages:

```javascript
my_app.ui.LanguageSwitcher = class LanguageSwitcher {
    show_dialog() {
        const languages = [
            { label: "English", value: "en" },
            { label: "العربية", value: "ar" },
            { label: "Français", value: "fr" },
            { label: "Español", value: "es" },
        ];

        const d = new frappe.ui.Dialog({
            title: __("Select Language"),
            fields: [
                {
                    fieldtype: "Select",
                    fieldname: "language",
                    label: __("Language"),
                    options: languages.map(l => l.label).join("\n"),
                    default: frappe.boot.lang,
                }
            ],
            primary_action_label: __("Change"),
            primary_action: (values) => {
                const selected = languages.find(l => l.label === values.language);
                this.set_language(selected.value);
                d.hide();
            }
        });

        d.show();
    }
};
```

Then update navbar action:
```python
"action": "new my_app.ui.LanguageSwitcher().show_dialog()",
```

### 7. Logging and Debugging

Add logging to installation script:

```python
def add_switch_language_to_navbar_settings():
    """Add language toggle with detailed logging"""

    frappe.logger().info("Starting navbar language toggle installation")

    navbar_settings = frappe.get_single("Navbar Settings")

    if frappe.db.exists("Navbar Item", {"item_label": "Toggle Language"}):
        frappe.logger().info("Toggle Language already exists, skipping")
        return

    # Log current state
    frappe.logger().info(f"Current dropdown items: {len(navbar_settings.settings_dropdown)}")

    # Shift items
    for navbar_item in navbar_settings.settings_dropdown[8:]:
        navbar_item.idx = navbar_item.idx + 1

    # Add item
    navbar_settings.append("settings_dropdown", {
        "item_label": "Toggle Language",
        "item_type": "Action",
        "action": "new my_app.ui.LanguageSwitcher().toggle()",
        "is_standard": 0,
        "idx": 9,
    })

    navbar_settings.save()
    frappe.logger().info("Toggle Language added successfully at position 9")
```

---

## Summary

### What We Built

1. **JavaScript Bundle** (`my_app.bundle.js`)
   - Language switcher class
   - Global namespace (`my_app.ui`)
   - Toggle and set_language methods

2. **Installation Script** (`utils/install.py`)
   - After migrate hook
   - Automatic navbar item addition
   - Idempotent implementation

3. **Hooks Configuration** (`hooks.py`)
   - Bundle registration
   - After migrate hook registration

### Key Concepts

| Concept | Explanation |
|---------|-------------|
| **Navbar Settings** | Single DocType controlling navbar items |
| **JavaScript Bundles** | `.bundle.js` files loaded on every page |
| **After Migrate Hook** | Runs after `bench migrate` completes |
| **frappe.provide()** | Creates JavaScript namespaces |
| **frappe.boot** | Object loaded on every page with user data |
| **frappe.client.set_value()** | Built-in method to update document fields |

### Quick Reference

**File locations:**
```
my_app/public/js/my_app.bundle.js          # JavaScript class
my_app/my_app/utils/install.py             # Installation script
my_app/my_app/utils/__init__.py            # Module init
my_app/my_app/hooks.py                     # Hooks configuration
```

**Commands:**
```bash
bench build --app my_app                   # Build bundle
bench migrate                              # Run after_migrate hook
bench clear-cache                          # Clear cache
```

**Testing:**
```javascript
// Console test
my_app.ui.LanguageSwitcher                 // Should show class
new my_app.ui.LanguageSwitcher().toggle()  // Should switch language
```

### Next Steps (Enhancement)

1. **Add More Languages**: Extend `this.languages` array
2. **Custom UI**: Create language selector dialog
3. **Translations**: Add translations for your app
4. **Permissions**: Add permission checks if needed
5. **Analytics**: Track language switches
6. **Translation**: Add translation for the "Toggle Language" label itself

---