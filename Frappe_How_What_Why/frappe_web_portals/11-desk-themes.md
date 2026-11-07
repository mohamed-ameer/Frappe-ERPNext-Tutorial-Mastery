# Chapter 11: Adding Custom Themes to the Frappe Desk

## 11.1 Understanding the Desk Theme System

The Frappe Desk has its own theme system that is completely separate from the Website Theme system covered in Chapter 9. While Website Themes control the look of portal pages (the `www/` directory), the **Desk theme system** controls the look of the Frappe Desk interface — the back-office SPA that administrators and system users work with daily.

The Desk theme system is built on three layers:

1. **CSS Custom Properties** — The entire Desk UI is styled using CSS variables scoped to `[data-theme="light"]` and `[data-theme="dark"]` selectors on the `<html>` element
2. **JavaScript Theme Switcher** — A UI dialog (`frappe.ui.ThemeSwitcher`) that lets users pick from available themes, stored in the `theme_switcher.js` file
3. **Server-side Persistence** — The user's choice is saved to the `desk_theme` field on the User doctype and loaded on every page boot

The system currently ships with three modes:
- **Light** (labeled "Frappe Light") — the default light theme
- **Dark** (labeled "Timeless Night") — the dark theme
- **Automatic** — follows the operating system's `prefers-color-scheme` media query

In this chapter, you will learn how to add a completely new custom theme — let us call it **"Forest Night"** — that appears as a fourth option in the theme switcher dialog, alongside Frappe Light, Timeless Night, and Automatic. You will understand every file that needs to change and exactly why.

## 11.2 Architecture of the Desk Theme System

### 11.2.1 The Two HTML Attributes

The entire theme system is driven by two attributes on the `<html>` element:

- **`data-theme-mode`** — Stores the user's selected preference: `"light"`, `"dark"`, or `"automatic"`. This is set from the `desk_theme` field in the User doctype, passed through `app.py` into the `app.html` template.

- **`data-theme`** — Stores the resolved theme after accounting for the `"automatic"` mode. If the user selected `"automatic"`, this is resolved to `"light"` or `"dark"` based on `window.matchMedia("(prefers-color-scheme: dark)")`. If the user selected `"light"` or `"dark"` directly, both attributes have the same value.

In the HTML template (`www/app.html`), both attributes start with the same value from the server:

```html
<html data-theme-mode="{{ desk_theme.lower() }}" data-theme="{{ desk_theme.lower() }}" ...>
```

Then, in `desk.js`, during application startup:

```javascript
frappe.ui.set_theme();  // Resolves "automatic" to actual OS preference
```

And a `MutationObserver` watches for changes to `data-theme-mode`:

```javascript
const observer = new MutationObserver(() => frappe.ui.set_theme());
observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme-mode"],
});
```

### 11.2.2 The CSS Variable System

The Desk is styled entirely through CSS custom properties (variables). There is no hardcoded color anywhere in the Desk UI components — every color references a variable like `var(--text-color)`, `var(--bg-color)`, `var(--border-color)`, etc.

The variables are defined in three layers:

**Layer 1: Base Color Palette** (`espresso/_colors.scss`)

Under plain `:root`, the base color scales are defined:

```scss
:root {
    --neutral-white: #ffffff;
    --neutral-black: #000000;
    --gray-50: #f8f8f8;
    --gray-100: #f3f3f3;
    ...
    --gray-900: #171717;
    --blue-50: #f7fbfd;
    --blue-100: #edf6fd;
    ...
    --blue-900: #004880;
    // and so on for green, red, orange, yellow, cyan, teal, violet, pink, purple
}
```

These are the raw building blocks. Every other variable references these.

**Layer 2: Light Theme** (`common/css_variables.scss` and `desk/css_variables.scss`)

Both files scope their variables under `:root, [data-theme="light"]`:

```scss
:root,
[data-theme="light"] {
    --bg-color: white;
    --fg-color: white;
    --navbar-bg: white;
    --text-color: var(--gray-900);
    --border-color: var(--gray-200);
    --control-bg: var(--gray-100);
    --btn-primary: var(--gray-900);
    ...
}
```

**Layer 3: Dark Theme** (`desk/dark.scss`)

Scoped under `[data-theme="dark"]`:

```scss
[data-theme="dark"] {
    --bg-color: var(--gray-900);
    --fg-color: var(--gray-900);
    --navbar-bg: var(--gray-900);
    --text-color: var(--gray-50);
    --border-color: var(--gray-800);
    --control-bg: var(--gray-800);
    --btn-primary: var(--gray-300);
    ...
}
```

Because both themes are scoped to different `[data-theme="..."]` selectors, changing the attribute on `<html>` instantly switches all variables. This is the core mechanism.

### 11.2.3 The SCSS Import Chain

The import chain that loads these files is:

```
desk.bundle.scss
    └── desk/index.scss
            └── desk/variables.scss
                    ├── espresso/_colors.scss        → :root (base palette)
                    ├── espresso/_shadows.scss        → :root (shadow vars)
                    ├── desk/css_variables.scss
                    │       └── common/css_variables.scss  → :root, [data-theme="light"]
                    └── desk/dark.scss                     → [data-theme="dark"]
```

The key file is `desk/variables.scss` — its last two imports are `css_variables` and `dark`. Any new theme SCSS file should be imported alongside `dark.scss` here.

### 11.2.4 The Theme Switcher JavaScript

The theme switcher is defined in `frappe/public/js/frappe/ui/theme_switcher.js`. The `ThemeSwitcher` class:

1. Opens a dialog with a grid of theme preview cards
2. Each card is rendered from a hardcoded `this.themes` array
3. On click, it sets `data-theme-mode` on `<html>`, shows an alert, and calls the server

The themes array is the critical piece:

```javascript
this.themes = [
    {
        name: "light",
        label: __("Frappe Light"),
        info: __("Light Theme"),
    },
    {
        name: "dark",
        label: __("Timeless Night"),
        info: __("Dark Theme"),
    },
    {
        name: "automatic",
        label: __("Automatic"),
        info: __("Uses system's theme to switch between light and dark mode"),
    },
];
```

### 11.2.5 Server-side Persistence

Three components work together to persist the user's choice:

**User doctype field** (`user.json`):
```json
{
    "fieldname": "desk_theme",
    "fieldtype": "Select",
    "label": "Desk Theme",
    "options": "Light\nDark\nAutomatic"
}
```

**switch_theme server method** (`user.py`):
```python
@frappe.whitelist()
def switch_theme(theme):
    if theme in ["Dark", "Light", "Automatic"]:
        frappe.db.set_value("User", frappe.session.user, "desk_theme", theme)
```

**Boot info** (`sessions.py`):
```python
bootinfo["desk_theme"] = frappe.db.get_value("User", frappe.session.user, "desk_theme") or "Light"
```

The boot info is passed to the `app.html` template via `app.py`, which sets `data-theme-mode` on the `<html>` element.

## 11.3 Adding a New Theme: "Forest Night"

Now we will add a completely new theme called **"Forest Night"** — a dark theme with green/forest-toned accents. This will appear as a fourth option in the theme switcher.

Here is the complete plan of what we need to modify:

| File | Change |
|------|--------|
| `theme_switcher.js` | Add fourth entry to `this.themes` array |
| `desk/dark.scss` (or new `desk/forest_night.scss`) | Add `[data-theme="forest_night"]` CSS variable block |
| `desk/variables.scss` | Import the new SCSS file |
| `user.py` | Add "Forest Night" to the allowed themes list |
| `user.json` | Add "Forest Night" to the Select options |
| Theme switcher SCSS | Optionally add preview styling for new theme |

### Step 1: Add the Theme to the JavaScript Theme Switcher

**File:** `frappe/public/js/frappe/ui/theme_switcher.js`

Modify the `fetch_themes()` method to add a fourth entry:

```javascript
fetch_themes() {
    return new Promise((resolve) => {
        this.themes = [
            {
                name: "light",
                label: __("Frappe Light"),
                info: __("Light Theme"),
            },
            {
                name: "dark",
                label: __("Timeless Night"),
                info: __("Dark Theme"),
            },
            // NEW: Add Forest Night as a fourth theme
            {
                name: "forest_night",
                label: __("Forest Night"),
                info: __("A dark theme with forest-green accents"),
            },
            {
                name: "automatic",
                label: __("Automatic"),
                info: __("Uses system's theme to switch between light and dark mode"),
            },
        ];
        resolve(this.themes);
    });
}
```

The `name` field (`"forest_night"`) becomes the value of `data-theme-mode` and `data-theme` attributes on `<html>`. The `label` is what the user sees in the switcher dialog. The `info` appears as a tooltip.

### Step 2: Understand How the Theme Name Flows

When the user clicks "Forest Night" in the theme switcher:

1. `toggle_theme("forest_night")` is called
2. This sets `document.documentElement.setAttribute("data-theme-mode", "forest_night")`
3. `frappe.ui.set_theme()` is called, which sets `document.documentElement.setAttribute("data-theme", "forest_night")`
4. An xcall is made to `frappe.core.doctype.user.user.switch_theme` with `theme = "Forest Night"` (title-cased)
5. The server saves `"Forest Night"` to the user's `desk_theme` field
6. On next page load, `app.html` sets `data-theme-mode="forest_night" data-theme="forest_night"`

The lowercase `"forest_night"` is used for the HTML attribute. The title-cased `"Forest Night"` is stored in the database.

### Step 3: Create the CSS Variables for Forest Night

Now we need to define the CSS variables for our new theme. We have two approaches:

**Approach A: Add to existing `dark.scss`** — Add a second block for `[data-theme="forest_night"]` in `desk/dark.scss`. This is simpler but mixes themes in one file.

**Approach B: Create a new SCSS file** — Create `desk/forest_night.scss` and import it from `variables.scss`. This is cleaner and more maintainable.

We will use **Approach B**, which is the professional approach.

**Create:** `frappe/public/scss/desk/forest_night.scss`

```scss
[data-theme="forest_night"] {
    // Invert neutral for dark theme
    --neutral: var(--neutral-black);
    --invert-neutral: var(--neutral-white);

    // Override gray palette for darker feel
    --gray-700: #2a3a2a;
    --gray-800: #1a2a1a;

    // Text colors
    --text-neutral: var(--gray-50);
    --text-dark: var(--gray-900);
    --text-muted: #9aaa9a;
    --text-light: #bccabc;
    --text-color: #d0e0d0;
    --heading-color: #e0f0e0;

    // SVG stroke
    --icon-fill: transparent;
    --icon-stroke: #bccabc;

    // Error colors
    --error-bg: #5a2a2a;
    --error-border: #d47a7a;

    // Layout Colors — deep forest green
    --bg-color: #0d1f0d;
    --fg-color: #0d1f0d;
    --subtle-accent: #1a3a1a;
    --subtle-fg: #142814;
    --navbar-bg: #0a180a;
    --fg-hover-color: #1a3a1a;
    --card-bg: #0d1f0d;
    --disabled-text-color: #6a8a6a;
    --disabled-control-bg: #1a3a1a;
    --control-bg: #1a3a1a;
    --control-bg-on-gray: #1a3a1a;
    --awesomebar-focus-bg: var(--control-bg);
    --awesomplete-hover-bg: #1a3a1a;
    --modal-bg: #0f240f;
    --toast-bg: var(--modal-bg);
    --popover-bg: var(--bg-color);

    // Button Colors
    --btn-default-bg: #1a3a1a;
    --btn-default-hover-bg: #2a5a2a;
    --btn-primary: #b0dab0;

    // Border Colors
    --border-primary: #b0dab0;

    // Background Text Color Pairs
    --bg-blue: #1a3a5a;
    --bg-light-blue: #1a3a5a;
    --bg-dark-blue: #0a2a4a;
    --bg-green: #1a4a2a;
    --bg-yellow: #5a4a1a;
    --bg-orange: #5a3a1a;
    --bg-red: #5a1a1a;
    --bg-gray: #2a3a2a;
    --bg-grey: #2a3a2a;
    --bg-darkgrey: #2a3a2a;
    --bg-dark-gray: #3a5a3a;
    --bg-light-gray: #1a3a1a;
    --bg-purple: #3a2a5a;
    --bg-pink: #4a2a3a;
    --bg-cyan: #1a3a4a;

    --text-on-blue: #8abce0;
    --text-on-light-blue: #8abce0;
    --text-on-dark-blue: #5a9abc;
    --text-on-green: #7abc8a;
    --text-on-yellow: #d0ba5a;
    --text-on-orange: #d09a5a;
    --text-on-red: #e08a7a;
    --text-on-gray: #b0c0b0;
    --text-on-grey: #b0c0b0;
    --text-on-darkgrey: #c0d0c0;
    --text-on-dark-gray: #c0d0c0;
    --text-on-light-gray: #b0c0b0;
    --text-on-purple: #b08ad0;
    --text-on-pink: #d08ab0;
    --text-on-cyan: #7ab0c0;

    // Alert colors
    --alert-text-danger: #e08a7a;
    --alert-text-warning: #d0ba5a;
    --alert-text-info: #8abce0;
    --alert-text-success: #7abc8a;
    --alert-bg-danger: #3a1a1a;
    --alert-bg-warning: #3a2a0a;
    --alert-bg-info: #1a2a3a;
    --alert-bg-success: #1a2a1a;

    // Sidebar
    --sidebar-select-color: #1a3a1a;

    // Scrollbar
    --scrollbar-thumb-color: #3a5a3a;
    --scrollbar-track-color: #1a3a1a;

    // Timeline
    --timeline-badge-color: #5a7a5a;
    --timeline-badge-bg: #0d1f0d;

    // Shadows
    --shadow-inset: var(--fg-color);
    --border-color: #1a3a1a;
    --dark-border-color: #3a5a3a;
    --table-border-color: var(--border-color);
    --highlight-color: #1a3a1a;
    --yellow-highlight-color: #3a3a0a;

    --btn-group-border-color: #2a4a2a;
    --placeholder-color: #2a4a2a;

    --highlight-shadow: 1px 1px 10px rgba(0, 100, 0, 0.3), 0px 0px 4px rgba(0, 150, 0, 0.5);

    --shadow-base: 0px 4px 8px rgba(0, 80, 0, 0.1), 0px 0px 4px rgba(0, 60, 0, 0.15);

    // Diff colors
    --diff-added: #1a4a2a;
    --diff-removed: #4a1a1a;
    --diff-changed: #1a2a4a;

    // Input
    --input-disabled-bg: none;

    // Checkbox
    --checkbox-color: var(--neutral-white);
    --checkbox-gradient: linear-gradient(180deg, var(--neutral-white) -124.51%, var(--neutral-white) 100%);
    --checkbox-disabled-gradient: linear-gradient(180deg, #4a6a4a -124.51%, #4a6a4a 100%);
    --checkbox-focus-shadow: 0 0 0 2px #3a6a3a;

    // Switch
    --switch-bg: #4a6a4a;

    // Date picker
    --date-active-text: #e0f0e0;
    --date-active-bg: #2a5a2a;
    --date-range-bg: var(--subtle-fg);

    // Grid
    --skeleton-bg: #1a3a1a;

    // Arrow SVGs (white strokes)
    --right-arrow-svg: url("data:image/svg+xml;utf8,<svg width='6' height='8' viewBox='0 0 6 8' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1.25 7.5L4.75 4L1.25 0.5' stroke='white' stroke-linecap='round' stroke-linejoin='round'/></svg>");
    --left-arrow-svg: url("data:image/svg+xml;utf8,<svg width='6' height='8' viewBox='0 0 6 8' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M7.5 9.5L4 6l3.5-3.5' stroke='white' stroke-linecap='round' stroke-linejoin='round'></path></svg>");

    // Selection
    ::selection {
        color: var(--text-color);
        background: #3a6a3a;
    }

    // Color scheme
    color-scheme: dark;

    // Specific component overrides
    .frappe-card .btn-default {
        background-color: var(--control-bg);
        &:hover {
            background-color: var(--fg-hover-color);
        }
    }

    .modal,
    .form-in-grid {
        --control-bg: #1a3a1a;
        --border-color: #1a3a1a;
    }

    .print-format {
        --text-color: #171717;
        --border-color: #e2e2e2;
    }

    .ql-editor {
        color: var(--text-on-gray);
        &.read-mode span:not(.mention),
        &.read-mode p,
        &.read-mode u,
        &.read-mode strong {
            background-color: inherit !important;
            color: inherit !important;
        }
    }

    .comment-input-wrapper .ql-editor.ql-blank::before {
        color: var(--text-color);
    }

    // Frappe Charts overrides
    .chart-container {
        --charts-label-color: #9aaa9a;
        --charts-axis-line-color: var(--subtle-fg);
        --charts-stroke-width: 5px;
        --charts-dataset-circle-stroke: #ffffff;
        --charts-dataset-circle-stroke-width: var(--charts-stroke-width);
        --charts-tooltip-title: var(--charts-label-color);
        --charts-tooltip-label: var(--charts-label-color);
        --charts-tooltip-value: white;
        --charts-tooltip-bg: #0d1f0d;
        --charts-legend-label: var(--charts-label-color);
    }

    // Heat map
    .heatmap-chart g > rect[fill="#ebedf0"] {
        fill: #1a3a1a;
    }

    // Rating
    .rating {
        --star-fill: #4a6a4a;
        .star-hover {
            --star-fill: #6a8a6a;
        }
    }

    // Indicator colors
    $indicator-colors: green, cyan, blue, orange, yellow, gray, grey, red, pink, darkgrey, purple, light-blue;
    @each $color in $indicator-colors {
        .indicator {
            --indicator-dot-#{"" + $color}: var(--bg-#{$color});
        }
    }
}
```

This SCSS file defines ALL the CSS custom properties that the Desk UI components reference, but with forest-green color values. The indigo accent colors from the standard dark theme are replaced with greens and earth tones.

### Step 4: Import the New SCSS File

**File:** `frappe/public/scss/desk/variables.scss`

Add the import for `forest_night` after `dark`:

```scss
@import "../espresso/colors";
@import "../espresso/spacing";
@import "../espresso/typography";
@import "../espresso/shadows";
@import "../espresso/borders";

// ... existing SCSS code ...

@import "css_variables";
@import "dark";
@import "forest_night";   // ← Add this line
```

The order matters. `forest_night.scss` must come after `dark.scss` so that if both define the same variable, the later one wins (for the case where `data-theme="forest_night"` is set, its values take precedence).

### Step 5: Extend Server-Side Validation

**File:** `frappe/core/doctype/user/user.py`

Modify the `switch_theme` method to accept the new theme:

```python
@frappe.whitelist()
def switch_theme(theme):
    if theme in ["Dark", "Light", "Automatic", "Forest Night"]:
        frappe.db.set_value("User", frappe.session.user, "desk_theme", theme)
```

The value `"Forest Night"` (title-cased) must match what JavaScript sends. In the theme switcher, `toggle_theme()` calls:

```javascript
frappe.xcall("frappe.core.doctype.user.user.switch_theme", {
    theme: toTitle(theme),  // "forest_night" → "Forest Night"
});
```

So the server receives `"Forest Night"`, and we add it to the allowed list.

### Step 6: Update the User Doctype Field Options

**File:** `frappe/core/doctype/user/user.json`

Modify the `desk_theme` field's `options` to include the new theme:

```json
{
    "fieldname": "desk_theme",
    "fieldtype": "Select",
    "label": "Desk Theme",
    "options": "Light\nDark\nForest Night\nAutomatic"
}
```

This ensures that when a user edits their profile in the Desk, they can also select "Forest Night" from the dropdown (though the theme switcher dialog is the primary interface).

### Step 7: Rebuild the Assets

After making all these changes, you need to rebuild the Desk CSS bundle:

```bash
bench build --app frappe
```

Or for development mode with watch:

```bash
bench watch
```

After rebuilding, clear the browser cache and reload. The "Forest Night" theme will appear in the theme switcher dialog.

## 11.4 The Complete File-by-File Summary

Here is every file that changed and what was modified:

```
frappe/public/js/frappe/ui/theme_switcher.js
    → Added fourth entry to themes array: {name: "forest_night", label: "Forest Night", ...}

frappe/public/scss/desk/forest_night.scss          [NEW FILE]
    → All CSS custom properties scoped to [data-theme="forest_night"]

frappe/public/scss/desk/variables.scss
    → Added @import "forest_night";

frappe/core/doctype/user/user.py
    → Added "Forest Night" to switch_theme() allowed list

frappe/core/doctype/user/user.json
    → Added "Forest Night" to desk_theme options
```

No changes are needed to:
- `app.html` or `app.py` — They already handle any theme dynamically via `desk_theme` variable
- `desk.js` — The MutationObserver and `set_theme()` work with any theme name
- `sessions.py` — It just reads whatever `desk_theme` value exists
- `theme_switcher.scss` — The preview looks fine with any theme (it uses the CSS variables)

## 11.5 How It All Connects

Let us trace the complete flow for the new "Forest Night" theme:

```
1. User clicks "Forest Night" in theme switcher dialog
       │
2. theme_switcher.js: toggle_theme("forest_night")
       │
       ├── Sets <html data-theme-mode="forest_night">
       │
       ├── frappe.ui.set_theme() sets <html data-theme="forest_night">
       │   (since mode is not "automatic", data-theme = data-theme-mode)
       │
       └── XCALL to server: switch_theme("Forest Night")
              │
3. user.py: switch_theme("Forest Night")
       │
       ├── Validates "Forest Night" is in allowed list → YES
       └── Saves to User.desk_theme = "Forest Night"
              │
4. CSS engine activates:
       │
       ├── [data-theme="forest_night"] selector matches
       ├── All CSS variables switch to forest-green values
       └── Desk UI instantly updates with new colors 🎨
              │
5. On next page load:
       │
       ├── app.py reads desk_theme from boot info
       ├── app.html sets data-theme-mode="forest_night"
       └── desk.js calls set_theme() to sync data-theme
```

## 11.6 Creating a Light Variant Theme

The same approach works for creating a new LIGHT theme. Instead of overriding the dark theme variables, you override the light theme variables. For example, to create "Ocean Breeze" (a light theme with blue tones):

**Create:** `frappe/public/scss/desk/ocean_breeze.scss`

```scss
:root,
[data-theme="ocean_breeze"] {
    // Override specific variables for a blue-tinted light theme
    --bg-color: #f0f6ff;
    --fg-color: #ffffff;
    --navbar-bg: #e8f0fe;
    --control-bg: #e8f0fe;
    --border-color: #d0ddee;
    --text-color: #1a2a3a;
    --heading-color: #0a1a2a;
    --primary-color: #1a6abc;
    --btn-primary: #1a6abc;
    --card-bg: #ffffff;
}
```

Note the scoping: for a light theme, use `:root, [data-theme="ocean_breeze"]` so that it inherits any unset variables from the base light theme. For a dark theme, use only `[data-theme="forest_night"]` so it completely overrides the defaults.

## 11.7 Creating a Theme That Extends the Dark Theme

A simpler approach than defining every variable (as we did for Forest Night) is to extend the existing `[data-theme="dark"]` values and only override what you want to change. Sass/SCSS does not support extending CSS custom property blocks, but you can use CSS's `@import` or rely on the cascade.

Actually, the cleanest approach for extending a dark theme is to use CSS's native fallback mechanism. Define only the variables you want to change, and the rest will cascade from `[data-theme="dark"]` if we restructure our selectors.

But since the dark theme variables are scoped strictly to `[data-theme="dark"]`, they will not cascade to `[data-theme="forest_night"]`. The most maintainable approach is:

1. Extract the common dark variables into a `_dark_common.scss` partial
2. Import it from both `[data-theme="dark"]` and `[data-theme="forest_night"]`
3. Override specific variables for each variant

However, this is a refactoring of Frappe core that may not be desirable. The simpler approach for a custom app is to copy the relevant variables from `dark.scss` and modify what you need, as we did above.

## 11.8 Adding Theme Preview to the Switcher Dialog

The theme switcher dialog renders a mini-preview of each theme using actual CSS variables from the theme. The preview elements use:

- `.background` — uses `--bg-color`
- `.navbar` — uses `--navbar-bg`
- `.foreground` — uses `--card-bg`  
- `.primary` — uses `--primary-color`

Since our new theme defines all these variables, the preview card will automatically reflect the Forest Night colors — no changes needed to the theme switcher SCSS.

However, if you want to customize the preview appearance specifically for your theme (e.g., a split preview like Automatic), you can add styles to `theme_switcher.scss`:

```scss
// In frappe/public/scss/desk/theme_switcher.scss

[data-theme="forest_night"] .background {
    // Custom preview styling for Forest Night
    border: 2px solid #3a6a3a;
}
```

## 11.9 Handling the "Automatic" Mode with Multiple Themes

The current "Automatic" mode only toggles between `"light"` and `"dark"`. If you add a third dark variant like Forest Night, the automatic mode will not know about it. There are two approaches:

**Approach 1: Keep Automatic as light/dark only.** The user picks "Forest Night" manually, and "Automatic" continues to toggle between the standard light and dark themes.

**Approach 2: Enhance Automatic to support your theme.** Modify `frappe.ui.set_theme()` to check a user preference for which dark theme to use when the OS is in dark mode:

```javascript
frappe.ui.set_theme = (theme) => {
    const root = document.documentElement;
    let theme_mode = root.getAttribute("data-theme-mode");
    
    if (!theme) {
        if (theme_mode === "automatic") {
            const prefersDark = frappe.ui.dark_theme_media_query.matches;
            // Check if user has a preferred dark variant stored
            const darkVariant = localStorage.getItem("preferred_dark_theme") || "dark";
            theme = prefersDark ? darkVariant : "light";
        }
    }
    root.setAttribute("data-theme", theme || theme_mode);
};
```

This is an advanced customization and is not needed for the basic case.

## 11.10 Reverting or Removing a Theme

To remove a custom theme, reverse the steps:

1. Remove the entry from `theme_switcher.js` themes array
2. Remove or comment out the `@import "forest_night"` in `variables.scss`
3. Remove `"Forest Night"` from the `switch_theme` allowed list in `user.py`
4. Remove `"Forest Night"` from the `desk_theme` options in `user.json`
5. Rebuild assets with `bench build --app frappe`
6. Update any users who had the theme selected (via a migration script)

To handle existing users who had the theme selected, create a patch:

```python
def change_forest_night_to_dark():
    users = frappe.get_all("User", filters={"desk_theme": "Forest Night"})
    for user in users:
        frappe.db.set_value("User", user.name, "desk_theme", "Dark")
```

## 11.11 Creating the Theme via a Custom App (Best Practice)

Instead of modifying Frappe core files directly, you can (and should) create a custom app that extends the Desk theme system. This involves using Frappe's hooks and asset overriding mechanism.

### Step 11.11.1: Create the Custom App

```bash
bench new-app my_desk_theme
```

### Step 11.11.2: Add the SCSS File

Create `my_desk_theme/public/scss/forest_night.scss` with the CSS variable definitions (same content as above).

### Step 11.11.3: Hook into the SCSS Bundle

In `my_desk_theme/__init__.py` or `hooks.py`, you cannot directly modify the desk bundle import chain. Instead, you have two options:

**Option A: Override `variables.scss`** — Place a file at `my_desk_theme/public/scss/desk/variables.scss` that replaces Frappe's version. This requires copying the original content and adding your import.

**Option B: Use JavaScript to inject CSS at runtime** — Use `frappe.ready()` to inject CSS variables:

```javascript
// my_desk_theme/public/js/forest_night.js
frappe.ready(function() {
    // Watch for theme changes
    const observer = new MutationObserver(() => {
        if (document.documentElement.getAttribute('data-theme') === 'forest_night') {
            // Any runtime JS adjustments for the theme
        }
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
});
```

**Option C: Override the theme_switcher.js** — Place a file at `my_desk_theme/public/js/frappe/ui/theme_switcher.js` that completely replaces Frappe's version. You must copy the entire original content and add your modifications. This is the most straightforward approach for a custom app.

### Step 11.11.4: Override the User Doctype

In your custom app, extend the User doctype to add "Forest Night" to the desk_theme options and extend the `switch_theme` method.

For the `switch_theme` method, you can use the `doc_events` hook in `hooks.py`:

```python
doc_events = {
    "User": {
        "validate": "my_desk_theme.user.set_desk_theme_options"
    }
}
```

For the JS theme switcher, override the file completely by placing it at the same path in your app.

## 11.12 Troubleshooting

### Theme Does Not Appear in Switcher
- Verify the entry in `theme_switcher.js` has the correct `name` field
- Rebuild assets and hard-reload the browser (`Cmd+Shift+R`)
- Check browser console for JavaScript errors

### Theme Selects but No Visual Change
- Verify the SCSS file is imported in `variables.scss`
- Check that the selector matches: `[data-theme="forest_night"]`
- Inspect the `<html>` element to confirm `data-theme="forest_night"` is set
- Verify a CSS variable is actually different (e.g., check `--bg-color` computed value)

### SCSS Compilation Errors
- Ensure all parentheses, braces, and semicolons are correctly placed
- Check that color values are valid hex codes
- Verify that Sass `$indicator-colors` loop uses valid color names that exist in the file
- Run `bench build --app frappe` to see compilation errors

### Server Rejects the Theme
- Verify `switch_theme()` in `user.py` includes "Forest Night" in the allowed list
- Check that the case matches exactly: `"Forest Night"` (title-cased)
- The JavaScript sends `toTitle(theme)` which converts `forest_night` → `Forest Night`

### Theme Resets After Page Reload
- Verify `user.json` includes "Forest Night" in the `desk_theme` options
- Check that `sessions.py` is not filtering or sanitizing the value
- Run `bench migrate` after modifying `user.json` to apply doctype changes

## 11.13 Summary

Adding a custom theme to the Frappe Desk theme switcher requires changes in exactly five places:

1. **JavaScript** (`theme_switcher.js`) — Add the theme entry to the themes array
2. **SCSS** (new file, e.g., `forest_night.scss`) — Define CSS variables scoped to `[data-theme="forest_night"]`
3. **SCSS import** (`variables.scss`) — Import the new SCSS file
4. **Python validation** (`user.py`) — Add the theme name to the allowed list
5. **Doctype options** (`user.json`) — Add the theme to the desk_theme Select field options

The underlying mechanism is elegant: the entire Desk UI references CSS custom properties, and switching themes is simply a matter of changing the `data-theme` attribute on the `<html>` element. By defining your own set of variables under a new `[data-theme="..."]` selector, your theme instantly works across the entire Desk interface — no component code changes needed.

This is the power of a CSS custom property-based design system, and Frappe's Desk is a textbook example of how to implement one.
