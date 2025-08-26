# How to Disable JS Console Logging in Production for Frappe Apps

### In My Case:
My project had millions of `console.log` statements . Removing them manually wasn't practical and I still wanted to keep them for local development and debugging.

## Why Disable Console in Production?

In production environments, it's crucial to disable console logging to prevent sensitive information leakage and improve performance. This guide explains how to implement console security using Frappe's hook system.

#### Security Risks
- **Information Leakage**: Console logs may expose sensitive data, API keys, or internal system information
- **Debug Information**: Stack traces and error details can reveal system architecture
- **User Data**: Personal information might be accidentally logged

#### Performance Benefits
- **Reduced Memory Usage**: Console objects consume memory even when not used
- **Faster Execution**: No overhead from logging operations
- **Cleaner Network**: No console data transmitted in production builds (some browser extentions may catch it)

> Goal: Keep logs during development, but hide them in production.

---

## How to Disable Console in Production (Using Frappe Hooks)

Frappe allows you to inject custom JavaScript into pages using `hooks`. We can use this to disable console.log in production.

Frappe provides hooks to include custom JS and CSS files in different parts of your app.

- **`app_include_js`**: This will load the script in the Frappe Desk (admin interface).
- **`web_include_js`**: This will load the script on public web pages. (but not the palin www/ html pages)

> #### NOTE:
> The `frappe` object is only available when Frappe is properly loaded in the browser context, typically through the Frappe desk or web forms. On plain HTML pages in the www folder, Frappe isn't loaded, so `frappe.boot` doesn't exist.
> - **Frappe Desk Pages:** Full Frappe environment with frappe.boot available
> - **Web Form Pages:** Frappe web context with limited Frappe objects
> - **Plain HTML Pages:** No Frappe context - need alternative approaches

---

## Implementation

### Step 1: Create the Console Disable Script

Create a JavaScript file that will handle console disabling,

**The followin code will:**
1. Checks if Frappe is loaded (frappe.boot exists)
2. Makes sure the user is not in developer mode
3. Overrides all console methods to do nothing

```javascript
// apps/your_app/public/js/disable_console.js

// Check if we're in a Frappe context
function isFrappeContext() {
    return (
        typeof frappe !== "undefined" && 
        frappe.boot && 
        frappe.boot.developer_mode !== undefined
    );
}

// Check if we're in developer mode
function isDeveloperMode() {
    // First try Frappe context
    if (isFrappeContext()) {
        return frappe.boot.developer_mode;
    }

    // Fallback: Check environment indicators
    const isDev =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes(".local") ||
        window.location.hostname.includes("dev") ||
        window.location.hostname.includes("staging") ||
        window.location.search.includes("dev=true") ||
        window.location.search.includes("debug=true") ||
        window.location.hash.includes("dev=true");

    return isDev;
}

// Disable console methods if in production mode
if (!isDeveloperMode()) {
    console.log("Production mode detected - console methods disabled");

    const methods = [
        "log", "info", "warn", "error", "debug", "trace",
        "dir", "dirxml", "group", "groupEnd", "time", "timeEnd",
        "count", "assert", "clear", "profile", "profileEnd",
        "timeStamp", "context", "groupCollapsed"
    ];

    methods.forEach((method) => {
        if (console[method]) {
            console[method] = function () {};
        }
    });
} else {
    console.log("Development mode detected - console methods enabled");
}
```

### Step 2: Configure Hooks

Add the script to your app's `hooks.py` file:

```python
# apps/your_app/hooks.py

# Include console disable script in both app and web contexts
app_include_js = [
    "/assets/your_app/js/disable_console.js"
]

web_include_js = [
    "/assets/your_app/js/disable_console.js"
]
```
### Step 3: If You Are Using Plain HTML Pages in the `www` folder

The Frappe hooks (`app_include_js`, `web_include_js`) do not work on plain HTML files inside the www folder, because Frappe is not loaded on these pages.

To disable console logging on such pages, you must manually include the script in the <head> section of your HTML file.

**Example:** `www/your-page/index.html`
```html
<head>
    <!-- Meta Information -->
    ...
    ...
    <script src="/assets/your_app/js/disable_console.js"></script>
</head>
```
>If you have many plain HTML pages, consider using a base template or build process to avoid repeating the same `<script>` tag. 

### Step 4: Restart the Bench (No Build Required for JS Hooks)
After adding the hooks, you don't need to run bench build — just restart the bench to apply the changes.

Frappe automatically loads JS/CSS files defined in app_include_js and web_include_js without requiring a full asset build.
A simple restart is enough to refresh the app context and load your new script.

## Troubleshooting

### Console Still Working in Production

1. **Check Hook Configuration**:
   ```bash
   bench --site your-site show-config
   ```

2. **Verify Asset Building**:
   ```bash
   bench build --app your_app --force
   ```

3. **Check Browser Cache**: Clear browser cache and reload

### Development Mode Not Detected

1. **Enable Frappe Developer Mode**:
   ```bash
   bench --site your-site set-config developer_mode 1
   ```

2. **Check Environment Variables**:
   ```bash
   bench --site your-site show-config
   ```

3. **Verify Hostname**: Ensure your development hostname matches the detection logic


## Questions to Validate Understanding
**Why does frappe.boot.developer_mode fail on plain HTML pages?**
- Frappe isn't loaded in the browser context for static pages
- The frappe object doesn't exist until Frappe is properly initialized

**What's the difference between Frappe desk pages and plain HTML pages?**
- Desk pages: Full Frappe environment with `frappe.boot available`
- Plain HTML: No Frappe context - need utility functions for safe access

**What's the benefit of this approach?**
- Pages work both with and without Frappe
- Consistent user experience across different contexts
- No JavaScript errors when Frappe isn't loaded

**what is `frappe.boot` object?**

The `frappe.boot` object is a global JavaScript object in Frappe that contains essential runtime information about the current site, user, and system settings. It is automatically loaded when a Frappe page (like the Desk or a Web Form) is rendered.
```
// Check if Frappe is available and boot data exists
if (typeof frappe !== "undefined" && frappe.boot) {
    console.log("Developer Mode:", frappe.boot.developer_mode);  // Boolean
    console.log("Site Name:", frappe.boot.sitename);            // String
    console.log("Current User:", frappe.boot.user);             // Object
}
```

> Note: `frappe.boot` is not available on plain HTML pages in the /www folder unless Frappe is explicitly loaded.

