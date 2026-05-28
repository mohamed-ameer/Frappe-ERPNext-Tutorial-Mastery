# Chapter 9: Building Custom Themes

This chapter is a complete guide to creating custom themes in Frappe. By the end, you will be able to create your own "My Dark" theme, customize fonts, change colors, and understand exactly how Frappe's theme system works from top to bottom.

## 9.1 Understanding Frappe's Theme System

Frappe themes are built on top of Bootstrap 4's SCSS variable system. A theme in Frappe is a single configuration record stored in the **Website Theme** doctype. This record contains:

- **Basic settings**: Theme name, module, whether it is custom
- **Typography**: Google Font selection, font size, font properties (weights)
- **Colors**: Primary, text, light, dark, background colors (links to the Color doctype)
- **Button styles**: Rounded corners, shadows, gradients (Bootstrap toggles)
- **SCSS overrides**: Custom variables, custom SCSS code
- **JavaScript**: Custom JS injected on every portal page
- **Ignored Apps**: Which apps' SCSS to exclude from compilation

When a Website Theme is saved, Frappe:

1. Renders the `website_theme_template.scss` Jinja template with the theme's configuration
2. Runs `node generate_bootstrap_theme.js` to compile the SCSS to CSS
3. Stores the compiled CSS file in the site's `public/files/website_theme/` directory
4. Sets `theme_url` to the path of the compiled CSS file
5. In `head.html`, all portal pages include this CSS file (if a non-Standard theme is active)

## 9.2 The Standard Theme

Frappe ships with a built-in "Standard" theme. When no custom theme is selected, the standard theme's CSS (`website.bundle.css`) is used for all portal pages.

The Standard theme is defined in `frappe/website/website_theme/standard/standard.json`:

```json
{
    "theme": "Standard",
    "custom": 0,
    "button_rounded_corners": 1,
    "button_shadows": 0,
    "button_gradients": 0,
    "theme_scss": "$enable-shadows: false;\n$enable-gradients: false;\n$enable-rounded: true;\n\n@import \"frappe/public/scss/website\";\n\n\n// Custom Theme\n",
    "theme_url": "/assets/css/standard_style.css"
}
```

The Standard theme is special because:
- It is not stored in the database by default (it is a JSON file on disk)
- It cannot be edited from the UI
- It serves as the fallback when no theme is selected in Website Settings

## 9.3 The Theme Configuration Flow

Let us trace the complete flow of how a theme is applied:

### Step 1: Website Settings

In the `Website Settings` doctype, there is a field called `website_theme`. This stores the name of the active Website Theme for the site.

### Step 2: Loading the Active Theme

When a portal page is rendered, `get_website_settings()` is called. Inside this function:

```python
from frappe.website.doctype.website_theme.website_theme import get_active_theme
context.theme = get_active_theme() or frappe._dict()
```

The `get_active_theme()` function looks up the theme name from Website Settings and loads the corresponding Website Theme document:

```python
def get_active_theme() -> Optional["WebsiteTheme"]:
    if website_theme := frappe.get_website_settings("website_theme"):
        try:
            return frappe.get_cached_doc("Website Theme", website_theme)
        except frappe.DoesNotExistError:
            frappe.clear_last_message()
            pass
```

If no theme is set, or if the theme document does not exist, an empty dict is returned and the default `website.bundle.css` is used.

### Step 3: Including the Theme CSS

In `templates/includes/head.html`:

```jinja
{%- if theme and theme.name != 'Standard' -%}
<link type="text/css" rel="stylesheet" href="{{ theme.theme_url }}">
{%- else -%}
{{ include_style('website.bundle.css') }}
{%- endif -%}
```

If a custom theme is active, its compiled CSS file is linked. Otherwise, the default bundle is used.

### Step 4: Theme JavaScript

The theme's JavaScript (if any) is included via the website script mechanism in `website_script.py`. The theme's JS field is appended to the website script that runs on every portal page.

## 9.4 The SCSS Template

The heart of theme generation is `website_theme_template.scss`. This is a Jinja template that generates SCSS, which is then compiled to CSS. Let us examine it in full:

```scss
{% if google_font %}
@import url("https://fonts.googleapis.com/css2?family={{ google_font.replace(' ', '+') }}:{{ font_properties }}&display=swap");

$font-family-sans-serif: "{{ google_font }}", "InterVariable", "Inter", -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
    "Droid Sans", "Helvetica Neue", sans-serif;

:root {
    --font-stack: "{{ google_font }}", "InterVariable", "Inter", -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
    "Droid Sans", "Helvetica Neue", sans-serif !important;
}
{% endif -%}

{% if primary_color %}$primary: {{ frappe.db.get_value('Color', primary_color, 'color') }};{% endif -%}
{% if dark_color %}$dark: {{ frappe.db.get_value('Color', dark_color, 'color') }};{% endif -%}
{% if text_color %}$body-text-color: {{ frappe.db.get_value('Color', text_color, 'color') }};{% endif -%}
{% if background_color %}$body-bg: {{ frappe.db.get_value('Color', background_color, 'color') }};{% endif -%}

$enable-shadows: {{ button_shadows and "true" or "false" }};
$enable-gradients: {{ button_gradients and "true" or "false" }};
$enable-rounded: {{ button_rounded_corners and "true" or "false" }};

// Bootstrap Variable Overrides
{{ custom_overrides or '' }}

// Import themes from installed apps
{%- for import_path in website_theme_scss %}
@import "{{ import_path }}";
{%- endfor %}

{% if font_size -%}
body {
    font-size: {{ font_size }};
}
{%- endif %}

// Custom Theme
{{ custom_scss or '' }}

:root {
    {% if primary_color %}
    --primary: #{$primary};
    --primary-color: #{$primary};
    {% endif -%}
    {% if background_color %}
    --bg-color: #{$body-bg};
    {% endif -%}
    {% if text_color %}
    --text-color: #{$body-text-color};
    --text-light: #{$body-text-color};
    {% endif -%}
    {% if not button_rounded_corners %}
    --border-radius-sm: 0px;
    --border-radius: 0px;
    --border-radius-md: 0px;
    --border-radius-lg: 0px;
    --border-radius-full: 0px;
    {% endif -%}
}
```

This template does the following:

1. **Google Font import**: If a Google Font is specified, it imports it and sets it as the primary font family for the entire site
2. **CSS custom properties**: Sets `--font-stack` as a CSS variable
3. **Bootstrap SCSS variables**: Sets `$primary`, `$dark`, `$body-text-color`, `$body-bg` from the Color doctype references
4. **Bootstrap switches**: Controls shadows, gradients, and rounded corners
5. **Custom overrides**: Any user-defined Bootstrap variable overrides
6. **App SCSS imports**: Imports SCSS from all installed apps (typically `website.scss` or `website.bundle.scss`)
7. **Body font size**: If a custom font size is configured
8. **Custom SCSS**: Any user-defined custom SCSS
9. **CSS custom properties on :root**: Exports `--primary`, `--bg-color`, `--text-color`, and border radius variables

## 9.5 Creating the "My Dark" Theme Step by Step

Let us now create a complete custom "My Dark" theme with custom fonts from start to finish.

### Step 1: Create Color Records

Before creating the theme, we need Color records that the theme will reference. Frappe's Website Theme links colors by name to the Color doctype.

Navigate to the **Color** doctype in the Desk and create these records:

- **Name**: `My Dark Primary` with hex value `#6C5CE7` (purple)
- **Name**: `My Dark Text` with hex value `#E0E0E0` (light gray)
- **Name**: `My Dark Background` with hex value `#1A1A2E` (dark navy)
- **Name**: `My Dark Dark` with hex value `#0F0F23` (darker navy)
- **Name**: `My Dark Light` with hex value `#2D2D44` (medium dark)

These colors will define the palette for our dark theme.

### Step 2: Create the Website Theme Record

Navigate to **Website > Website Theme** and click **New**.

Fill in:

- **Theme Name**: `My Dark`
- **Module**: `Website`
- **Custom?**: Checked

### Step 3: Configure Typography

In the **Theme Configuration** tab:

- **Google Font**: `Nunito`
- **Font Properties**: `wght@300;400;500;600;700;800`
- **Font Size**: `16px`

The `google_font` field takes the name of any Google Font (without spaces encoded). For fonts with spaces, use the actual name, and the SCSS template will replace spaces with `+` for the URL.

The `font_properties` field specifies which font weights to load from Google Fonts. The format is `wght@300;400;500;...`. These are loaded as part of the Google Fonts URL.

### Step 4: Configure Colors

Still in the **Theme Configuration** tab:

- **Primary Color**: `My Dark Primary`
- **Text Color**: `My Dark Text`
- **Background Color**: `My Dark Background`
- **Dark Color**: `My Dark Dark`
- **Light Color**: `My Dark Light`

### Step 5: Configure Button Styles

- **Button Rounded Corners**: Checked
- **Button Shadows**: Unchecked
- **Button Gradients**: Unchecked

### Step 6: Add Custom SCSS Overrides

In the **Stylesheet** tab, add custom SCSS to fully customize the theme beyond what the basic settings allow.

**Custom Overrides** (Bootstrap variable overrides):

```scss
// Bootstrap overrides for dark theme
$input-bg: #2D2D44;
$input-color: #E0E0E0;
$input-border-color: #3D3D54;
$card-bg: #2D2D44;
$card-border-color: #3D3D54;
$table-bg: #2D2D44;
$table-accent-bg: #33334A;
$table-hover-bg: #3D3D54;
$table-color: #E0E0E0;
$navbar-dark-color: #E0E0E0;
$dropdown-bg: #2D2D44;
$dropdown-color: #E0E0E0;
$dropdown-border-color: #3D3D54;
$dropdown-link-color: #E0E0E0;
$dropdown-link-hover-bg: #3D3D54;
$modal-content-bg: #2D2D44;
$modal-header-border-color: #3D3D54;
$modal-footer-border-color: #3D3D54;
$pagination-bg: #2D2D44;
$pagination-border-color: #3D3D54;
$pagination-hover-bg: #3D3D54;
$pagination-hover-border-color: #4D4D64;
$pagination-color: #E0E0E0;
$link-color: #6C5CE7;
$link-hover-color: #5A4BD1;
```

**Custom SCSS** (additional CSS rules):

```scss
// Additional dark theme customizations
body {
    color: #E0E0E0;
    background-color: #1A1A2E;
}

a {
    color: #6C5CE7;
    &:hover {
        color: #5A4BD1;
    }
}

h1, h2, h3, h4, h5, h6 {
    color: #FFFFFF;
}

.text-muted {
    color: #8888A0 !important;
}

.navbar {
    background-color: #0F0F23 !important;
    border-bottom: 1px solid #2D2D44;
}

.footer {
    background-color: #0F0F23 !important;
    border-top: 1px solid #2D2D44;
}

.card {
    background-color: #2D2D44;
    border: 1px solid #3D3D54;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.table {
    color: #E0E0E0;
    thead th {
        border-bottom-color: #3D3D54;
    }
    td, th {
        border-top-color: #3D3D54;
    }
}

.form-control {
    background-color: #2D2D44;
    color: #E0E0E0;
    border-color: #3D3D54;
    &:focus {
        background-color: #33334A;
        color: #FFFFFF;
        border-color: #6C5CE7;
    }
}

.btn-primary {
    background-color: #6C5CE7;
    border-color: #6C5CE7;
    &:hover {
        background-color: #5A4BD1;
        border-color: #5A4BD1;
    }
}

.page-card {
    background-color: #2D2D44;
    border-color: #3D3D54;
}

.breadcrumb {
    background-color: transparent;
    .breadcrumb-item {
        color: #8888A0;
        a {
            color: #6C5CE7;
        }
        &.active {
            color: #E0E0E0;
        }
    }
}

.badge {
    &.badge-warning { background-color: #F39C12; color: #1A1A2E; }
    &.badge-success { background-color: #27AE60; color: #FFFFFF; }
    &.badge-danger { background-color: #E74C3C; color: #FFFFFF; }
    &.badge-info { background-color: #3498DB; color: #FFFFFF; }
}
```

### Step 7: Add Custom JavaScript (Optional)

In the **Script** tab, you can add JavaScript that runs on every portal page when this theme is active:

```javascript
// My Dark Theme custom JavaScript
frappe.ready(function() {
    // Custom behavior for dark theme
    document.body.classList.add('my-dark-theme');
    
    // You could add a theme toggle button here
    // Or any custom JS behavior
});
```

### Step 8: Save the Theme

When you click **Save**, Frappe:

1. Renders the `website_theme_template.scss` Jinja template with your configuration
2. Calls `generate_bootstrap_theme()` which:
   - Creates the folder `[site]/public/files/website_theme/`
   - Generates the SCSS content by rendering the template
   - Runs `node generate_bootstrap_theme.js` to compile SCSS to CSS
   - Stores the compiled CSS at a path like `/files/website_theme/my_dark_abc12345.css`
   - Sets `theme_url` to this path

### Step 9: Activate the Theme

Navigate to **Website > Website Settings** and set the **Website Theme** field to `My Dark`. Save.

Now every portal page on your site will use the "My Dark" theme. The `head.html` template will include the compiled CSS file instead of the default `website.bundle.css`.

## 9.6 Custom Fonts in Detail

Frappe supports any Google Font through the Website Theme configuration. The font is loaded via Google Fonts CDN and set as the primary font family.

### How Font Loading Works

When you set a Google Font in the theme:

1. The SCSS template generates a `@import url()` statement that loads the font from Google Fonts
2. The `$font-family-sans-serif` Bootstrap variable is overridden with your font
3. The CSS custom property `--font-stack` is set to your font family
4. All Bootstrap components that use `$font-family-sans-serif` inherit your font

### Using a Non-Google Font

If you want to use a self-hosted font (not from Google Fonts), you cannot use the built-in Google Font field. Instead, add the font files to your app's `public/` folder and include them via custom SCSS:

In the **Custom SCSS** field:

```scss
@font-face {
    font-family: 'MyCustomFont';
    src: url('/assets/my_app/fonts/MyCustomFont-Regular.woff2') format('woff2'),
         url('/assets/my_app/fonts/MyCustomFont-Regular.woff') format('woff');
    font-weight: 400;
    font-style: normal;
}

@font-face {
    font-family: 'MyCustomFont';
    src: url('/assets/my_app/fonts/MyCustomFont-Bold.woff2') format('woff2'),
         url('/assets/my_app/fonts/MyCustomFont-Bold.woff') format('woff');
    font-weight: 700;
    font-style: normal;
}

// Override Bootstrap's font family
$font-family-sans-serif: 'MyCustomFont', sans-serif;

// Also set CSS custom property
:root {
    --font-stack: 'MyCustomFont', sans-serif;
}
```

Place the font files in your app at `your_app/public/fonts/`. They will be accessible at `/assets/your_app/fonts/filename.woff2`.

### Font Size

The `font_size` field in the Website Theme sets the base font size for the `body` element:

```scss
body {
    font-size: 16px;
}
```

This can be any valid CSS value: `16px`, `1rem`, `100%`, etc.

## 9.7 The SCSS Compilation Process

Let us understand how the SCSS compilation works internally.

### Step 1: Rendering the SCSS Template

The `get_scss()` function in `website_theme.py` renders the SCSS template:

```python
def get_scss(website_theme):
    apps_to_ignore = tuple((d.app + "/") for d in website_theme.ignored_apps)
    available_imports = get_scss_paths()
    imports_to_include = [d for d in available_imports if not d.startswith(apps_to_ignore)]
    context = website_theme.as_dict()
    context["website_theme_scss"] = imports_to_include
    return frappe.render_template(
        "frappe/website/doctype/website_theme/website_theme_template.scss", 
        context
    )
```

This function:
1. Determines which apps SCSS to import (excluding ignored apps)
2. Converts the theme document to a dict for context
3. Renders the Jinja SCSS template with this context

### Step 2: Compiling SCSS to CSS

The rendering calls a Node.js script to compile SCSS:

```python
def generate_bootstrap_theme(self):
    folder_path = abspath(frappe.utils.get_files_path("website_theme", is_private=False))
    frappe.create_folder(folder_path)
    
    suffix = frappe.generate_hash(length=8) if self.custom else "style"
    file_name = frappe.scrub(self.name) + "_" + suffix + ".css"
    output_path = join_path(folder_path, file_name)
    
    self.theme_scss = content = get_scss(self)
    content = content.replace("\n", "\\n")
    command = ["node", "generate_bootstrap_theme.js", output_path, content]
    
    process = Popen(command, cwd=frappe.get_app_source_path("frappe"), stdout=PIPE, stderr=PIPE)
    stderr = process.communicate()[1]
    
    if stderr:
        # Error handling
    else:
        self.theme_url = "/files/website_theme/" + file_name
```

Key points:
- The file name includes a random hash (for custom themes) to force cache busting
- The command calls a Node.js script that uses node-sass or Dart Sass to compile
- If compilation fails, the error is shown in the UI
- The `theme_url` is set to the site-relative path of the compiled CSS

### Step 3: SCSS Import Resolution

The `get_scss_paths()` function finds all available SCSS imports:

```python
def get_scss_paths():
    import_path_list = []
    scss_files = ["public/scss/website.scss", "public/scss/website.bundle.scss"]
    for app in frappe.get_installed_apps():
        for scss_file in scss_files:
            full_path = frappe.get_app_path(app, scss_file)
            if path_exists(full_path):
                import_path = splitext(join_path(app, scss_file))[0]
                import_path_list.append(import_path)
    return import_path_list
```

This collects all `website.scss` or `website.bundle.scss` files from every installed app. These are then imported into the theme SCSS, so every app can contribute styles to the portal.

### Step 4: Post-Migration Regeneration

After every `bench migrate`, the active theme is regenerated:

```python
def after_migrate():
    website_theme = frappe.db.get_single_value("Website Settings", "website_theme")
    if not website_theme or website_theme == "Standard":
        return
    doc = frappe.get_doc("Website Theme", website_theme)
    doc.save()  # Just re-saving re-generates the theme.
```

This ensures that after migrations that might change SCSS imports, the theme CSS is recompiled automatically.

## 9.8 The Theme Toggle Mechanism

Frappe's theme toggle (which switches between light and dark themes in the Desk) is a Desk-specific feature and works differently from Website Themes. The Desk theme toggle uses CSS custom properties (variables) and JavaScript to swap between light and dark mode. It does NOT use the Website Theme doctype.

However, you can implement a similar toggle for your portal pages. The approach is:

### Method 1: Using a Custom Theme with JavaScript Toggle

Create two Website Themes — one light, one dark — and provide a switch in the UI that reloads the page with a different theme. This requires setting the active theme in Website Settings via an API call.

### Method 2: Using CSS Custom Properties (Light/Dark within One Theme)

Define both light and dark CSS variables in your theme and use a class on the body to toggle between them:

In the **Custom SCSS** field of your theme:

```scss
:root {
    --bg-primary: #FFFFFF;
    --bg-secondary: #F8F9FA;
    --text-primary: #212529;
    --text-secondary: #6C757D;
    --border-color: #DEE2E6;
    --card-bg: #FFFFFF;
    --input-bg: #FFFFFF;
}

[data-theme="dark"] {
    --bg-primary: #1A1A2E;
    --bg-secondary: #2D2D44;
    --text-primary: #E0E0E0;
    --text-secondary: #8888A0;
    --border-color: #3D3D54;
    --card-bg: #2D2D44;
    --input-bg: #2D2D44;
}

body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.card {
    background-color: var(--card-bg);
    border-color: var(--border-color);
}
```

Then provide a JavaScript toggle:

```javascript
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portal-theme', newTheme);
}

// On page load, restore the saved theme
frappe.ready(function() {
    const savedTheme = localStorage.getItem('portal-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
});
```

### Method 3: Server-Side Theme Switching

You can create a `get_context` override that selects a different base template or different CSS based on a user preference stored in the User doctype:

```python
def get_context(context):
    user = frappe.get_doc("User", frappe.session.user)
    preferred_theme = user.get("preferred_theme", "light")
    
    if preferred_theme == "dark":
        context.theme_css = "/assets/my_app/css/dark-theme.css"
    else:
        context.theme_css = "/assets/my_app/css/light-theme.css"
```

## 9.9 Full Theme Replacement Strategy

If you want to completely replace the default dark/light theme with your own custom themes, follow this comprehensive strategy:

### Step 1: Define Your Brand Colors

Create Color doctype records for each color in your palette:

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| `Brand Primary` | `#6C5CE7` | Primary buttons, links, accents |
| `Brand Secondary` | `#00B894` | Success states, secondary accents |
| `Brand Dark` | `#0F0F23` | Navbar, footer backgrounds |
| `Brand Light` | `#F8F9FA` | Light section backgrounds |
| `Brand Text` | `#2D3436` | Body text |
| `Brand Background` | `#FFFFFF` | Page background |
| `Brand Dark Text` | `#E0E0E0` | Dark mode text |
| `Brand Dark BG` | `#1A1A2E` | Dark mode background |

### Step 2: Create Theme Variants

Create separate Website Theme records for each variant:

- `My Brand Light` — for the light theme
- `My Brand Dark` — for the dark theme

Each points to a different set of Color records and has appropriate Custom SCSS.

### Step 3: Create the SCSS Foundation

In your custom app, create `your_app/public/scss/website.bundle.scss` with your brand foundation:

```scss
// Your app's website SCSS
// This is automatically imported by the theme compilation

@import "variables";  // Your custom variables
@import "typography"; // Your custom typography
@import "components"; // Your custom components
```

### Step 4: Add Custom Font Files

Place your font files in `your_app/public/fonts/` and reference them in your theme's Custom SCSS:

```scss
@font-face {
    font-family: 'BrandFont';
    src: url('/assets/your_app/fonts/BrandFont-Regular.woff2') format('woff2');
    font-weight: 400;
}

@font-face {
    font-family: 'BrandFont';
    src: url('/assets/your_app/fonts/BrandFont-Bold.woff2') format('woff2');
    font-weight: 700;
}

:root {
    --font-stack: 'BrandFont', 'Inter', sans-serif;
}
```

### Step 5: Activate the Theme

In Website Settings, set the desired theme as active. All portal pages will now use your custom theme.

### Step 6: Override Specific Templates (if needed)

If your theme requires structural HTML changes beyond what CSS can provide, you can override templates by placing them in your app's `templates/` or `www/` folders. For example, to customize the navbar structure:

1. Copy `frappe/templates/includes/navbar/` to `your_app/templates/includes/navbar/`
2. Modify the HTML and CSS classes as needed
3. The navigation system uses `navbar_template` context variable which defaults to `Standard Navbar`

## 9.10 Theme SCSS for Navbar and Footer

Frappe provides theme-specific CSS for navbar and footer components in `templates/includes/website_theme/`:

**navbar.css** — styles the navbar based on `theme.top_bar_color` and `theme.top_bar_text_color`
**footer.css** — styles the footer based on `theme.footer_color`, `theme.footer_text_color`, `theme.footer_border_color`

These are legacy features. In modern Frappe, the Bootstrap SCSS variables in your theme are sufficient to style the navbar and footer.

## 9.11 Theme Caching and Cache Busting

When you modify and save a custom theme, Frappe:

1. Generates a new CSS file with a new random hash in the filename
2. Updates the `theme_url` field
3. Clears the website settings cache
4. All subsequent page loads will fetch the new CSS file

The random hash ensures browsers do not serve stale cached CSS. This is automatic — you do not need to manually bump version numbers or clear caches.

## 9.12 Troubleshooting Theme Issues

### Theme Changes Not Reflecting

If your theme changes are not visible:

1. **Hard refresh the browser**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Clear Frappe cache**: `bench clear-cache`
3. **Verify the theme is active**: Check Website Settings
4. **Check the CSS file URL**: Open browser DevTools, check if `theme.theme_url` returns a 200
5. **Re-save the theme**: This regenerates the CSS file

### SCSS Compilation Errors

If Frappe shows an SCSS compilation error:

- Check your Custom SCSS for syntax errors
- Verify all Color doctype references exist
- Check the Custom Overrides for valid Bootstrap variable names
- Look at the error message in the Frappe UI — it shows the SCSS compilation error

### Theme Not Applied to All Pages

If some pages do not use your theme:

- Check if any page sets `disable_website_theme = True` in its context
- Check if a custom base template bypasses `head.html`
- Verify the `theme` context variable is available in the page

## 9.13 Creating a Theme Programmatically

You can also create themes via code. This is useful for importing themes across sites or automating theme setup.

```python
import frappe

def create_my_dark_theme():
    # Ensure color records exist first
    colors = {
        "My Dark Primary": "#6C5CE7",
        "My Dark Text": "#E0E0E0",
        "My Dark Background": "#1A1A2E",
        "My Dark Dark": "#0F0F23",
        "My Dark Light": "#2D2D44",
    }
    
    for color_name, hex_value in colors.items():
        if not frappe.db.exists("Color", color_name):
            doc = frappe.get_doc({"doctype": "Color", "color": hex_value, "__newname": color_name})
            doc.insert()
    
    # Create the theme
    theme = frappe.get_doc({
        "doctype": "Website Theme",
        "theme": "My Dark",
        "module": "Website",
        "custom": 1,
        "google_font": "Nunito",
        "font_properties": "wght@300;400;500;600;700;800",
        "font_size": "16px",
        "primary_color": "My Dark Primary",
        "text_color": "My Dark Text",
        "background_color": "My Dark Background",
        "dark_color": "My Dark Dark",
        "light_color": "My Dark Light",
        "button_rounded_corners": 1,
        "button_shadows": 0,
        "button_gradients": 0,
        "custom_scss": """body { background-color: #1A1A2E; color: #E0E0E0; }"""
    })
    theme.insert()
    
    # Activate the theme
    settings = frappe.get_doc("Website Settings")
    settings.website_theme = "My Dark"
    settings.save()
    
    return theme
```

## 9.14 Summary

Frappe's theme system is built on Bootstrap SCSS variable overrides. A Website Theme record stores configuration for fonts, colors, and custom SCSS. When saved, Frappe renders a Jinja SCSS template, compiles it with Node.js, and stores the resulting CSS file. The active theme is loaded on every portal page via head.html. You can create multiple themes and switch between them, override every aspect of the visual design, and include custom fonts from Google Fonts or self-hosted sources. The theme toggle for dark/light mode in the Desk is separate from Website Themes, but you can implement a similar mechanism for portal pages using CSS custom properties and JavaScript.
