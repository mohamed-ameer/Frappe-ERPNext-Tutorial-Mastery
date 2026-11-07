# Frappe `get-untranslated` Command - Complete Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Understanding Frappe Translation System](#understanding-frappe-translation-system)
3. [How Translations Work](#how-translations-work)
4. [The `get-untranslated` Command](#the-get-untranslated-command)
5. [Command Syntax and Options](#command-syntax-and-options)
6. [Step-by-Step Usage Guide](#step-by-step-usage-guide)
7. [Translation Workflow](#translation-workflow)
8. [File Format and Structure](#file-format-and-structure)
9. [Real-World Examples](#real-world-examples)
10. [Advanced Usage](#advanced-usage)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)
13. [Quick Reference](#quick-reference)

---

## Introduction

### What is `get-untranslated`?

The `get-untranslated` command is a **bench command** in Frappe that extracts all translatable strings from your application and identifies which ones are missing translations for a specific language.

**Purpose:**
- Extract all translatable strings from code
- Identify untranslated strings for a language
- Export strings to a file for translation
- Support multi-language applications

**Use Cases:**
1. **Adding a new language** - Get all strings that need translation
2. **Updating translations** - Find newly added strings
3. **Translation audit** - Check translation completeness
4. **Translator workflow** - Provide translators with strings to translate

### Why Use This Command?

**Without `get-untranslated`:**
- Manual search through code for translatable strings
- Risk of missing strings
- No way to track translation progress
- Difficult to coordinate with translators

**With `get-untranslated`:**
- Automatic extraction of all translatable strings
- Identifies exactly what needs translation
- Generates file ready for translators
- Tracks translation completeness

---

## Understanding Frappe Translation System

### Core Concepts

#### 1. Translatable Strings

**In Python code:**
```python
from frappe import _

# Simple translation
message = _("Hello World")

# Translation with context
message = _("Save", context="Button in form")

# Translation with placeholders
message = _("Welcome {0}").format(user_name)
```

**In JavaScript code:**
```javascript
// Simple translation
let message = __("Hello World");

// Translation with context
let message = __("Save", null, "Button in form");

// Translation with placeholders
let message = __("Welcome {0}", [user_name]);
```

#### 2. Translation Storage

**Frappe stores translations in multiple formats:**

1. **CSV files** - `[app]/translations/[lang].csv`
   - Human-readable format
   - Easy to edit
   - Version control friendly

2. **PO files** - `[app]/locale/[lang].po`
   - Gettext standard format
   - Used by professional translation tools
   - Contains metadata

3. **MO files** - `sites/assets/locale/[lang]/LC_MESSAGES/[app].mo`
   - Compiled binary format
   - Fast to load
   - Used at runtime

4. **Database** - `Translation` DocType
   - User-created translations
   - Override file translations
   - Editable from UI

#### 3. Translation Functions

**Python: `_()`**

From `frappe/frappe/__init__.py`:
```python
def _(message, context=None):
    """Translate a string

    :param message: String to translate
    :param context: Optional context for disambiguation
    """
    # Returns translated string from cache or database
```

**JavaScript: `__()`**

From `frappe/frappe/public/js/frappe/translate.js`:
```javascript
frappe._ = function (txt, replace, context = null) {
    if (!txt) return txt;
    if (typeof txt != "string") return txt;

    let translated_text = "";

    // Check with context first
    let key = txt;
    if (context) {
        translated_text = frappe._messages[`${key}:${context}`];
    }

    // Fallback to without context
    if (!translated_text) {
        translated_text = frappe._messages[key] || txt;
    }

    // Replace placeholders
    if (replace && typeof replace === "object") {
        translated_text = $.format(translated_text, replace);
    }

    return translated_text;
};
```

**Key points:**
- `_()` in Python, `__()` in JavaScript
- Both support **context** parameter
- Context helps disambiguate same text with different meanings
- Placeholders use `{0}`, `{1}`, etc.

#### 4. Translation Context

**Why context matters:**

```python
# Same word, different meanings
_("Save")  # Could be "Save" (verb) or "Save" (noun)

# With context
_("Save", context="Button")  # "Guardar" in Spanish
_("Save", context="Discount")  # "Ahorro" in Spanish
```

**CSV format with context:**
```csv
source_text,translated_text,context
"Save","Guardar","Button"
"Save","Ahorro","Discount"
```

---

## How Translations Work

### Translation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    TRANSLATION WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

1. DEVELOPMENT
   ├─ Developer writes code with _() or __()
   ├─ Strings marked as translatable
   └─ Code committed to repository

2. EXTRACTION (get-untranslated)
   ├─ Scan all Python, JavaScript, JSON files
   ├─ Extract strings from _() and __() calls
   ├─ Extract from DocType labels, descriptions
   ├─ Extract from Reports, Pages, Workflows
   └─ Generate list of all translatable strings

3. TRANSLATION
   ├─ Export untranslated strings to file
   ├─ Translator translates strings
   └─ Save translated file

4. IMPORT (update-translations)
   ├─ Read untranslated and translated files
   ├─ Match line-by-line
   ├─ Update CSV translation files
   └─ Write to [app]/translations/[lang].csv

5. COMPILATION (bench build)
   ├─ Read CSV files
   ├─ Generate PO files (optional)
   ├─ Compile to MO files
   └─ Deploy to sites/assets/locale/

6. RUNTIME
   ├─ Load translations into memory
   ├─ Cache in frappe._messages (JS)
   ├─ _() and __() lookup translations
   └─ Display translated text to user
```

### Where Translations Are Extracted From

**From `frappe/frappe/translate.py`:**

The `get_messages_for_app()` function extracts strings from:

1. **Python files** (`.py`)
   - `_()` function calls
   - `_lt()` lazy translation calls

2. **JavaScript files** (`.js`, `.vue`, `.html`)
   - `__()` function calls
   - Template strings

3. **DocTypes** (JSON files)
   - Field labels
   - Field descriptions
   - DocType names
   - Select field options

4. **Pages** (JSON + code files)
   - Page titles
   - UI labels

5. **Reports** (JSON + Python)
   - Report names
   - Column labels
   - Filter labels

6. **Workflows** (Database)
   - State names
   - Action labels
   - Transition messages

7. **Custom Fields** (Database)
   - Field labels
   - Field descriptions
   - Select options

8. **Onboarding Steps** (JSON)
   - Step titles
   - Action labels
   - Descriptions

9. **Navbar Items** (Python)
   - Menu item labels

---

## The `get-untranslated` Command

### Command Definition

**From `frappe/frappe/commands/translate.py` (lines 45-61):**

```python
@click.command("get-untranslated")
@click.option("--app", default="_ALL_APPS")
@click.argument("lang")
@click.argument("untranslated_file")
@click.option("--all", default=False, is_flag=True, help="Get all message strings")
@pass_context
def get_untranslated(context, lang, untranslated_file, app="_ALL_APPS", all=None):
    "Get untranslated strings for language"
    import frappe.translate

    site = get_site(context)
    try:
        frappe.init(site=site)
        frappe.connect()
        frappe.translate.get_untranslated(lang, untranslated_file, get_all=all, app=app)
    finally:
        frappe.destroy()
```

### Core Function

**From `frappe/frappe/translate.py` (lines 713-757):**

```python
def get_untranslated(lang, untranslated_file, get_all=False, app="_ALL_APPS"):
    """Return all untranslated strings for a language and write in a file.

    :param lang: Language code.
    :param untranslated_file: Output file path.
    :param get_all: Return all strings, translated or not."""

    # Clear translation cache
    clear_cache()

    # Get list of apps
    apps = frappe.get_all_apps(True)
    if app != "_ALL_APPS":
        if app not in apps:
            print(f"Application {app} not found!")
            return
        apps = [app]

    # Extract messages from all apps
    messages = []
    untranslated = []
    for app_name in apps:
        messages.extend(get_messages_for_app(app_name))

    # Remove duplicates
    messages = deduplicate_messages(messages)

    # Escape newlines for file storage
    def escape_newlines(s):
        return s.replace("\\\n", "|||||").replace("\\n", "||||").replace("\n", "|||")

    if get_all:
        # Export ALL strings (translated or not)
        print(str(len(messages)) + " messages")
        with open(untranslated_file, "wb") as f:
            for m in messages:
                # m is tuple: (file_path, message, context, line_number)
                # Write only the message text
                f.write((escape_newlines(m[1]) + os.linesep).encode("utf-8"))
    else:
        # Export only UNTRANSLATED strings
        full_dict = get_all_translations(lang)

        for m in messages:
            if not full_dict.get(m[1]):
                untranslated.append(m[1])

        if untranslated:
            print(str(len(untranslated)) + " missing translations of " + str(len(messages)))
            with open(untranslated_file, "wb") as f:
                for m in untranslated:
                    f.write((escape_newlines(m) + os.linesep).encode("utf-8"))
        else:
            print("all translated!")
```

### How It Works

**Step-by-step execution:**

1. **Initialize Frappe**
   - Connect to site database
   - Load configuration

2. **Get app list**
   - If `--app` specified: use that app only
   - Otherwise: use all installed apps

3. **Extract messages**
   - For each app, call `get_messages_for_app()`
   - Scan Python, JavaScript, JSON files
   - Extract from database (DocTypes, Workflows, etc.)
   - Returns list of tuples: `(file_path, message, context, line_number)`

4. **Deduplicate**
   - Remove duplicate messages
   - Keep unique strings only

5. **Check translations**
   - If `--all` flag: export all strings
   - Otherwise: check which strings are already translated
   - Load existing translations from CSV files and database

6. **Escape newlines**
   - Replace `\n` with `|||`
   - Replace `\\n` with `||||`
   - Replace `\\\n` with `|||||`
   - This prevents multi-line strings from breaking the file format

7. **Write to file**
   - One string per line
   - UTF-8 encoding
   - Binary mode to preserve encoding

8. **Print summary**
   - "X messages" if `--all`
   - "X missing translations of Y" if untranslated only
   - "all translated!" if nothing to translate

---

## Command Syntax and Options

### Basic Syntax

```bash
bench --site [site-name] get-untranslated [LANG] [OUTPUT_FILE] [OPTIONS]
```

### Parameters

#### Required Parameters

**1. `LANG`** - Language code

```bash
# ISO 639-1 language codes
bench --site mysite.local get-untranslated es output.txt  # Spanish
bench --site mysite.local get-untranslated fr output.txt  # French
bench --site mysite.local get-untranslated de output.txt  # German
bench --site mysite.local get-untranslated ar output.txt  # Arabic
bench --site mysite.local get-untranslated zh output.txt  # Chinese

# Language variants
bench --site mysite.local get-untranslated es-GT output.txt  # Spanish (Guatemala)
bench --site mysite.local get-untranslated pt-BR output.txt  # Portuguese (Brazil)
bench --site mysite.local get-untranslated zh-TW output.txt  # Chinese (Taiwan)
```

**2. `OUTPUT_FILE`** - Path to output file

```bash
# Relative path
bench --site mysite.local get-untranslated es untranslated.txt

# Absolute path
bench --site mysite.local get-untranslated es /tmp/untranslated.txt

# With app name in filename
bench --site mysite.local get-untranslated es myapp_es_untranslated.txt
```

#### Optional Parameters

**1. `--app [APP_NAME]`** - Extract from specific app only

```bash
# All apps (default)
bench --site mysite.local get-untranslated es output.txt

# Specific app only
bench --site mysite.local get-untranslated es output.txt --app erpnext
bench --site mysite.local get-untranslated es output.txt --app myapp
```

**2. `--all`** - Get all strings (not just untranslated)

```bash
# Only untranslated strings (default)
bench --site mysite.local get-untranslated es output.txt

# All strings (translated + untranslated)
bench --site mysite.local get-untranslated es output.txt --all
```

### Complete Examples

```bash
# Example 1: Get untranslated Spanish strings from all apps
bench --site mysite.local get-untranslated es untranslated_es.txt

# Example 2: Get all Spanish strings from ERPNext only
bench --site mysite.local get-untranslated es all_strings_es.txt --app erpnext --all

# Example 3: Get untranslated French strings from custom app
bench --site mysite.local get-untranslated fr untranslated_fr.txt --app myapp

# Example 4: Get all Arabic strings from all apps
bench --site mysite.local get-untranslated ar all_ar.txt --all
```

---

## Step-by-Step Usage Guide

### Scenario 1: Adding a New Language

**Goal:** Add Spanish (es) translation to your custom app.

**Step 1: Extract untranslated strings**

```bash
cd /path/to/frappe-bench
bench --site mysite.local get-untranslated es untranslated_es.txt --app myapp
```

**Output:**
```
245 missing translations of 245
```

**Step 2: Check the output file**

```bash
cat untranslated_es.txt
```

**Content:**
```
Hello World
Welcome to {0}
Save
Cancel
Submit
Customer Name
...
```

**Step 3: Create translated file**

Copy the file and translate each line:

```bash
cp untranslated_es.txt translated_es.txt
nano translated_es.txt
```

**Edit `translated_es.txt`:**
```
Hola Mundo
Bienvenido a {0}
Guardar
Cancelar
Enviar
Nombre del Cliente
...
```

**Important:** Keep the same number of lines and preserve placeholders like `{0}`, `{1}`.

**Step 4: Import translations**

```bash
bench --site mysite.local update-translations es untranslated_es.txt translated_es.txt --app myapp
```

**Output:**
```
Updating translations for myapp
Writing translations file for es
```

**Step 5: Verify CSV file created**

```bash
cat apps/myapp/myapp/translations/es.csv
```

**Content:**
```csv
"Hello World","Hola Mundo",""
"Welcome to {0}","Bienvenido a {0}",""
"Save","Guardar",""
"Cancel","Cancelar",""
"Submit","Enviar",""
"Customer Name","Nombre del Cliente",""
```

**Step 6: Build and compile**

```bash
bench build --app myapp
```

**Output:**
```
Compiling translations for myapp
```

**Step 7: Test translations**

1. Login to your site
2. Go to User Settings
3. Change language to Spanish
4. Verify translations appear

### Scenario 2: Updating Existing Translations

**Goal:** Find and translate new strings added to ERPNext.

**Step 1: Extract untranslated strings**

```bash
bench --site mysite.local get-untranslated es untranslated_new.txt --app erpnext
```

**Output:**
```
12 missing translations of 5847
```

Only 12 new strings need translation!

**Step 2: Translate new strings**

```bash
cp untranslated_new.txt translated_new.txt
nano translated_new.txt
```

**Step 3: Import and build**

```bash
bench --site mysite.local update-translations es untranslated_new.txt translated_new.txt --app erpnext
bench build --app erpnext
```

### Scenario 3: Translation Audit

**Goal:** Check translation completeness for all languages.

**Script: `check_translations.sh`**

```bash
#!/bin/bash

SITE="mysite.local"
APP="myapp"
LANGUAGES=("es" "fr" "de" "ar" "zh")

echo "Translation Completeness Report"
echo "================================"
echo ""

for lang in "${LANGUAGES[@]}"; do
    output_file="/tmp/untranslated_${lang}.txt"

    # Get untranslated strings
    bench --site $SITE get-untranslated $lang $output_file --app $APP 2>&1 | \
        grep "missing translations" > /tmp/result.txt

    if [ -s /tmp/result.txt ]; then
        result=$(cat /tmp/result.txt)
        echo "$lang: $result"
    else
        echo "$lang: All translated!"
    fi

    rm -f $output_file /tmp/result.txt
done
```

**Run:**
```bash
chmod +x check_translations.sh
./check_translations.sh
```

**Output:**
```
Translation Completeness Report
================================

es: 12 missing translations of 245
fr: 45 missing translations of 245
de: 89 missing translations of 245
ar: All translated!
zh: 156 missing translations of 245
```

---

## Translation Workflow

### Complete Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  COMPLETE TRANSLATION WORKFLOW                │
└──────────────────────────────────────────────────────────────┘

DEVELOPER                    TRANSLATOR                   SYSTEM
    │                            │                           │
    │ 1. Write code with _()     │                           │
    │ ─────────────────────────> │                           │
    │                            │                           │
    │ 2. Run get-untranslated    │                           │
    │ ──────────────────────────────────────────────────────> │
    │                            │                           │
    │                            │ <─────────────────────────│
    │                            │   untranslated.txt        │
    │                            │                           │
    │ 3. Send to translator      │                           │
    │ ─────────────────────────> │                           │
    │                            │                           │
    │                            │ 4. Translate strings      │
    │                            │ ────────────────>         │
    │                            │                           │
    │ 5. Receive translated file │                           │
    │ <───────────────────────── │                           │
    │   translated.txt           │                           │
    │                            │                           │
    │ 6. Run update-translations │                           │
    │ ──────────────────────────────────────────────────────> │
    │                            │                           │
    │                            │ <─────────────────────────│
    │                            │   Updates CSV files       │
    │                            │                           │
    │ 7. Run bench build         │                           │
    │ ──────────────────────────────────────────────────────> │
    │                            │                           │
    │                            │ <─────────────────────────│
    │                            │   Compiles to MO files    │
    │                            │                           │
    │ 8. Deploy to production    │                           │
    │ ──────────────────────────────────────────────────────> │
    │                            │                           │
    │                            │         9. Users see      │
    │                            │         translations      │
    │                            │ <─────────────────────────│
```

### Detailed Steps

#### Step 1: Extract Strings

```bash
# For new language
bench --site mysite.local get-untranslated es untranslated_es.txt --app myapp

# For updates
bench --site mysite.local get-untranslated es new_strings.txt --app myapp
```

#### Step 2: Prepare for Translation

**Option A: Simple text file**
- Send `untranslated.txt` to translator
- Translator creates `translated.txt` with same line count
- Each line corresponds to same line in untranslated file

**Option B: Spreadsheet**
```bash
# Convert to CSV for easier editing
paste -d',' untranslated_es.txt untranslated_es.txt > for_translation.csv
```

Open in Excel/Google Sheets:
| Source (English) | Translation (Spanish) |
|------------------|----------------------|
| Hello World      | Hola Mundo          |
| Save             | Guardar             |

Export first column to `untranslated.txt`, second to `translated.txt`.

**Option C: Professional tools**
- Use PO files with tools like Poedit, Lokalize
- See "Advanced Usage" section

#### Step 3: Import Translations

```bash
bench --site mysite.local update-translations es untranslated_es.txt translated_es.txt --app myapp
```

**What happens:**
1. Reads both files line-by-line
2. Matches untranslated[line N] with translated[line N]
3. Updates `apps/myapp/myapp/translations/es.csv`
4. Preserves existing translations
5. Adds new translations

#### Step 4: Compile Translations

```bash
# Compile specific app
bench build --app myapp

# Compile all apps
bench build
```

**What happens:**
1. Reads CSV files from `apps/myapp/myapp/translations/`
2. Generates PO files in `apps/myapp/myapp/locale/`
3. Compiles to MO files in `sites/assets/locale/es/LC_MESSAGES/myapp.mo`
4. MO files loaded at runtime

#### Step 5: Clear Cache and Test

```bash
# Clear cache
bench --site mysite.local clear-cache

# Restart if needed
bench restart
```

**Test:**
1. Login to site
2. User Settings → Language → Spanish
3. Refresh page
4. Verify translations

---

## File Format and Structure

### Output File Format

**File:** `untranslated.txt`

```
Hello World
Welcome to {0}
Save
Cancel
Customer Name
Item Code
Posting Date
```

**Characteristics:**
- One string per line
- UTF-8 encoding
- Newlines escaped as `|||`, `||||`, `|||||`
- No headers or metadata
- Plain text format

### Newline Escaping

**Why escape newlines?**

Multi-line strings would break the one-string-per-line format.

**Escaping rules:**

| Original | Escaped | Meaning |
|----------|---------|---------|
| `\n` | `\|\|\|` | Single newline |
| `\\n` | `\|\|\|\|` | Literal backslash-n |
| `\\\n` | `\|\|\|\|\|` | Backslash + newline |

**Example:**

**Original string in code:**
```python
_("Line 1\nLine 2\nLine 3")
```

**In untranslated.txt:**
```
Line 1|||Line 2|||Line 3
```

**After translation:**
```
Línea 1|||Línea 2|||Línea 3
```

**Restored in CSV:**
```csv
"Line 1
Line 2
Line 3","Línea 1
Línea 2
Línea 3",""
```

### CSV Translation File Format

**File:** `apps/myapp/myapp/translations/es.csv`

**Format:**
```csv
source_text,translated_text,context
```

**Example:**
```csv
"Hello World","Hola Mundo",""
"Welcome to {0}","Bienvenido a {0}",""
"Save","Guardar","Button"
"Save","Ahorro","Discount"
"Customer Name","Nombre del Cliente",""
```

**Rules:**
1. **Three columns:** source, translation, context
2. **Quoted strings:** Use double quotes
3. **Escape quotes:** Use `""` for literal quote
4. **Preserve placeholders:** Keep `{0}`, `{1}`, etc.
5. **Empty context:** Use `""` for no context
6. **UTF-8 encoding:** Required for non-ASCII characters

**Example with special characters:**

```csv
"He said ""Hello""","Él dijo ""Hola""",""
"Price: {0}","Precio: {0}",""
"Line 1
Line 2","Línea 1
Línea 2",""
```

---

## Real-World Examples

### Example 1: Frappe App Translation

**Extract untranslated strings from Frappe:**

```bash
bench --site mysite.local get-untranslated es frappe_es_untranslated.txt --app frappe
```

**Output:**
```
0 missing translations of 2847
all translated!
```

Frappe is fully translated to Spanish!

**Get all strings to verify:**

```bash
bench --site mysite.local get-untranslated es frappe_es_all.txt --app frappe --all
```

**Output:**
```
2847 messages
```

**Sample from `frappe_es_all.txt`:**
```
Home
Desk
Website
Login
Logout
User
Settings
About
Help
...
```

### Example 2: ERPNext Translation

**Check ERPNext French translation status:**

```bash
bench --site mysite.local get-untranslated fr erpnext_fr_untranslated.txt --app erpnext
```

**Output:**
```
23 missing translations of 5847
```

**View untranslated strings:**

```bash
cat erpnext_fr_untranslated.txt
```

**Content:**
```
Loyalty Points Redemption
E-Way Bill
GSTR-3B Report
Tally Migration
Bank Clearance Summary
...
```

These are newer features not yet translated.

### Example 3: Custom App Translation

**Scenario:** You have a custom app "Restaurant Management" with 150 strings.

**Step 1: Extract for Spanish**

```bash
bench --site mysite.local get-untranslated es restaurant_es.txt --app restaurant_management
```

**Output:**
```
150 missing translations of 150
```

**Step 2: View strings**

```bash
head -20 restaurant_es.txt
```

**Content:**
```
Restaurant Management
Table
Table Number
Capacity
Status
Available
Occupied
Reserved
Menu Item
Category
Price
Description
Order
Order Item
Quantity
Waiter
Kitchen
Bill
Payment
Customer
```

**Step 3: Translate**

Create `restaurant_es_translated.txt`:
```
Gestión de Restaurante
Mesa
Número de Mesa
Capacidad
Estado
Disponible
Ocupada
Reservada
Artículo del Menú
Categoría
Precio
Descripción
Pedido
Artículo del Pedido
Cantidad
Mesero
Cocina
Cuenta
Pago
Cliente
```

**Step 4: Import**

```bash
bench --site mysite.local update-translations es restaurant_es.txt restaurant_es_translated.txt --app restaurant_management
```

**Step 5: Build**

```bash
bench build --app restaurant_management
```

**Step 6: Verify CSV**

```bash
cat apps/restaurant_management/restaurant_management/translations/es.csv
```

**Content:**
```csv
"Restaurant Management","Gestión de Restaurante",""
"Table","Mesa",""
"Table Number","Número de Mesa",""
"Capacity","Capacidad",""
"Status","Estado",""
"Available","Disponible",""
"Occupied","Ocupada",""
"Reserved","Reservada",""
...
```

### Example 4: Multi-Language Translation

**Goal:** Translate custom app to 5 languages.

**Script: `translate_all.sh`**

```bash
#!/bin/bash

SITE="mysite.local"
APP="myapp"
LANGUAGES=("es" "fr" "de" "ar" "zh")

echo "Extracting untranslated strings for all languages..."
echo ""

for lang in "${LANGUAGES[@]}"; do
    output_file="untranslated_${lang}.txt"

    echo "Extracting for $lang..."
    bench --site $SITE get-untranslated $lang $output_file --app $APP

    echo "Created: $output_file"
    echo "Please translate and save as: translated_${lang}.txt"
    echo ""
done

echo "After translation, run: ./import_all.sh"
```

**Script: `import_all.sh`**

```bash
#!/bin/bash

SITE="mysite.local"
APP="myapp"
LANGUAGES=("es" "fr" "de" "ar" "zh")

echo "Importing translations for all languages..."
echo ""

for lang in "${LANGUAGES[@]}"; do
    untranslated="untranslated_${lang}.txt"
    translated="translated_${lang}.txt"

    if [ -f "$translated" ]; then
        echo "Importing $lang..."
        bench --site $SITE update-translations $lang $untranslated $translated --app $APP
        echo "✓ $lang imported"
    else
        echo "✗ $translated not found, skipping..."
    fi
    echo ""
done

echo "Building app..."
bench build --app $APP

echo "Done! Clear cache and test translations."
```

**Usage:**

```bash
# 1. Extract
chmod +x translate_all.sh
./translate_all.sh

# 2. Translate files manually
# Create translated_es.txt, translated_fr.txt, etc.

# 3. Import
chmod +x import_all.sh
./import_all.sh
```

### Example 5: Context-Aware Translation

**Problem:** The word "Save" has different meanings.

**In code:**

```python
# In form
_("Save", context="Button")  # Verb: to save data

# In report
_("Save", context="Discount")  # Noun: money saved
```

**Extract:**

```bash
bench --site mysite.local get-untranslated es untranslated.txt --app myapp --all
```

**Output file includes both:**
```
Save
Save
```

**But CSV will have context:**

After running `update-translations`, the CSV file:

```csv
"Save","Guardar","Button"
"Save","Ahorro","Discount"
```

**In UI:**

```python
# Form button shows "Guardar"
button_label = _("Save", context="Button")

# Report shows "Ahorro"
column_label = _("Save", context="Discount")
```

---

## Advanced Usage

### Using with Professional Translation Tools

#### Method 1: PO Files (Recommended)

**Step 1: Generate POT file**

```bash
bench --site mysite.local build-message-files
```

This creates `apps/myapp/myapp/locale/main.pot`.

**Step 2: Create PO file for language**

```bash
bench --site mysite.local new-language es myapp
```

This creates `apps/myapp/myapp/locale/es.po`.

**Step 3: Edit with Poedit**

1. Install Poedit: https://poedit.net/
2. Open `apps/myapp/myapp/locale/es.po`
3. Translate strings in GUI
4. Save file

**Step 4: Update CSV from PO**

```python
# In bench console
bench --site mysite.local console

# In Python console
from frappe.gettext.translate import update_csv_from_po
update_csv_from_po("myapp", "es")
```

**Step 5: Build**

```bash
bench build --app myapp
```

#### Method 2: Automated Translation (Google Translate API)

**Script: `auto_translate.py`**

```python
#!/usr/bin/env python3
import sys
from googletrans import Translator

def translate_file(input_file, output_file, target_lang):
    translator = Translator()

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    translated_lines = []
    total = len(lines)

    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            translated_lines.append("")
            continue

        try:
            # Translate
            result = translator.translate(line, dest=target_lang)
            translated = result.text

            print(f"[{i}/{total}] {line} → {translated}")
            translated_lines.append(translated)

        except Exception as e:
            print(f"Error translating: {line}")
            print(f"Error: {e}")
            translated_lines.append(line)  # Keep original

    with open(output_file, 'w', encoding='utf-8') as f:
        for line in translated_lines:
            f.write(line + '\n')

    print(f"\nTranslation complete! Saved to: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python auto_translate.py <input_file> <output_file> <lang_code>")
        print("Example: python auto_translate.py untranslated.txt translated_es.txt es")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    target_lang = sys.argv[3]

    translate_file(input_file, output_file, target_lang)
```

**Usage:**

```bash
# Install library
pip install googletrans==4.0.0-rc1

# Extract untranslated
bench --site mysite.local get-untranslated es untranslated.txt --app myapp

# Auto-translate
python auto_translate.py untranslated.txt translated_es.txt es

# Review and edit translated_es.txt manually

# Import
bench --site mysite.local update-translations es untranslated.txt translated_es.txt --app myapp

# Build
bench build --app myapp
```

**⚠️ Warning:** Auto-translation is not perfect! Always review and edit.

#### Method 3: Translation Memory (TM)

**Use existing translations as reference:**

```bash
# Extract all strings from Frappe (already translated)
bench --site mysite.local get-untranslated es frappe_all.txt --app frappe --all

# Extract untranslated from your app
bench --site mysite.local get-untranslated es myapp_untranslated.txt --app myapp

# Find matches
comm -12 <(sort frappe_all.txt) <(sort myapp_untranslated.txt) > common.txt

# For common strings, copy translations from Frappe CSV
cat apps/frappe/frappe/translations/es.csv | grep -F -f common.txt
```

### Batch Processing

**Translate multiple apps at once:**

```bash
#!/bin/bash

SITE="mysite.local"
LANG="es"
APPS=("frappe" "erpnext" "myapp1" "myapp2")

for app in "${APPS[@]}"; do
    echo "Processing $app..."

    # Extract
    bench --site $SITE get-untranslated $LANG "${app}_untranslated.txt" --app $app

    # Check if there are untranslated strings
    if [ -s "${app}_untranslated.txt" ]; then
        echo "$app has untranslated strings. Please translate ${app}_untranslated.txt"
    else
        echo "$app is fully translated!"
        rm "${app}_untranslated.txt"
    fi
done
```

### Integration with CI/CD

**GitHub Actions workflow:**

```yaml
name: Check Translations

on:
  pull_request:
    paths:
      - '**.py'
      - '**.js'
      - '**.json'

jobs:
  check-translations:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Bench
        run: |
          # Setup bench and install app

      - name: Check Spanish translations
        run: |
          cd frappe-bench
          bench --site test.local get-untranslated es untranslated.txt --app myapp

          # Count untranslated
          count=$(wc -l < untranslated.txt)

          if [ $count -gt 0 ]; then
            echo "⚠️ Found $count untranslated Spanish strings"
            echo "Please update translations before merging"
            exit 1
          else
            echo "✓ All strings translated!"
          fi
```

---

## Troubleshooting

### Problem 1: "Application not found"

**Error:**
```
Application myapp not found!
```

**Cause:**
- App not installed on the site
- Typo in app name

**Solution:**

```bash
# Check installed apps
bench --site mysite.local list-apps

# Install app if missing
bench --site mysite.local install-app myapp
```

### Problem 2: Empty output file

**Symptom:**
- Command runs successfully
- Output file is empty or very small

**Cause:**
- All strings already translated
- Wrong app name
- No translatable strings in app

**Solution:**

```bash
# Use --all flag to see all strings
bench --site mysite.local get-untranslated es output.txt --app myapp --all

# Check if file has content
wc -l output.txt

# Verify app has translatable strings
grep -r "_(" apps/myapp/myapp/
grep -r "__(" apps/myapp/myapp/public/
```

### Problem 3: Encoding issues

**Error:**
```
UnicodeDecodeError: 'utf-8' codec can't decode byte...
```

**Cause:**
- File not in UTF-8 encoding

**Solution:**

```bash
# Convert file to UTF-8
iconv -f ISO-8859-1 -t UTF-8 input.txt > output.txt

# Or use dos2unix
dos2unix input.txt

# Verify encoding
file input.txt
```

### Problem 4: Line count mismatch

**Error:**
```
Translation file has different number of lines than untranslated file
```

**Cause:**
- Translated file has more/fewer lines than untranslated file
- Empty lines added or removed

**Solution:**

```bash
# Check line counts
wc -l untranslated.txt
wc -l translated.txt

# They must match exactly!

# Fix: ensure same number of lines
# Use a text editor that shows line numbers
```

### Problem 5: Translations not appearing

**Symptom:**
- Imported translations successfully
- Built app successfully
- Translations still not showing

**Solutions:**

**1. Clear cache:**
```bash
bench --site mysite.local clear-cache
bench restart
```

**2. Check language setting:**
```python
# In bench console
bench --site mysite.local console

# Check user language
frappe.db.get_value("User", "user@example.com", "language")

# Check system language
frappe.db.get_single_value("System Settings", "language")
```

**3. Verify CSV file:**
```bash
# Check CSV exists
ls -la apps/myapp/myapp/translations/es.csv

# Check content
head apps/myapp/myapp/translations/es.csv
```

**4. Verify MO file:**
```bash
# Check MO file exists
ls -la sites/assets/locale/es/LC_MESSAGES/myapp.mo

# If missing, rebuild
bench build --app myapp
```

**5. Check browser console:**
```javascript
// In browser console
console.log(frappe._messages);
// Should show translations

console.log(__("Your String"));
// Should show translated version
```

### Problem 6: Special characters broken

**Symptom:**
- Accented characters show as �
- Chinese/Arabic characters broken

**Cause:**
- Wrong encoding

**Solution:**

```bash
# Ensure UTF-8 encoding
file apps/myapp/myapp/translations/es.csv
# Should show: UTF-8 Unicode text

# If not, convert
iconv -f ISO-8859-1 -t UTF-8 es.csv > es_utf8.csv
mv es_utf8.csv es.csv

# Rebuild
bench build --app myapp
```

### Problem 7: Context not working

**Symptom:**
- Same string shows same translation regardless of context

**Cause:**
- Context not specified in code
- CSV doesn't have context column

**Solution:**

**In code:**
```python
# Add context parameter
_("Save", context="Button")
_("Save", context="Discount")
```

**In CSV:**
```csv
"Save","Guardar","Button"
"Save","Ahorro","Discount"
```

**Rebuild:**
```bash
bench build --app myapp
```

---

## Best Practices

### Do's

1. **Always use context for ambiguous strings**
```python
# Good
_("Save", context="Button")
_("Save", context="Discount")

# Bad
_("Save")  # Which meaning?
```

2. **Use placeholders for dynamic content**
```python
# Good
_("Welcome {0}").format(user_name)

# Bad
_("Welcome " + user_name)  # Can't be translated properly
```

3. **Keep strings complete and meaningful**
```python
# Good
_("Are you sure you want to delete this item?")

# Bad
_("Are you sure") + " " + _("you want to delete") + " " + _("this item?")
```

4. **Extract regularly during development**
```bash
# After adding new features
bench --site mysite.local get-untranslated es new_strings.txt --app myapp
```

5. **Version control translation files**
```bash
# Commit CSV files
git add apps/myapp/myapp/translations/*.csv
git commit -m "Updated translations"
```

6. **Test translations before deploying**
```bash
# Build and test locally
bench build --app myapp
bench --site mysite.local clear-cache

# Change language and verify
```

7. **Document translation workflow**
```markdown
# In README.md
## Translation

To add/update translations:
1. Extract: `bench --site site1.local get-untranslated es untranslated.txt --app myapp`
2. Translate: Edit untranslated.txt → translated.txt
3. Import: `bench --site site1.local update-translations es untranslated.txt translated.txt --app myapp`
4. Build: `bench build --app myapp`
```

8. **Use consistent terminology**
- Create a glossary for translators
- Use same translation for same term

9. **Preserve formatting**
```python
# Keep HTML tags
_("<b>Bold</b> text")

# Keep newlines
_("Line 1\nLine 2")

# Keep placeholders
_("Total: {0}")
```

10. **Review auto-translations**
- Never deploy auto-translated content without review
- Have native speakers verify

### Don'ts

1. **Don't concatenate translatable strings**
```python
# Bad
message = _("Hello") + " " + _("World")

# Good
message = _("Hello World")
```

2. **Don't translate variables**
```python
# Bad
_(variable_name)

# Good
_("Fixed String")
```

3. **Don't use f-strings in _() directly**
```python
# Bad
_(f"Welcome {user}")  # Can't extract variable part

# Good
_("Welcome {0}").format(user)
```

4. **Don't forget to build after updating**
```bash
# Bad
bench --site mysite.local update-translations es untranslated.txt translated.txt --app myapp
# Forgot to build!

# Good
bench --site mysite.local update-translations es untranslated.txt translated.txt --app myapp
bench build --app myapp
```

5. **Don't edit MO files directly**
```bash
# Bad
nano sites/assets/locale/es/LC_MESSAGES/myapp.mo  # Binary file!

# Good
nano apps/myapp/myapp/translations/es.csv
bench build --app myapp
```

6. **Don't mix languages in one string**
```python
# Bad
_("Save") + " / Guardar"

# Good
_("Save")  # Let translation system handle it
```

7. **Don't use technical terms in user-facing strings**
```python
# Bad
_("DocType not found")

# Good
_("Document type not found")
```

8. **Don't forget context for common words**
```python
# Bad
_("Open")  # Open what? File? Door? Status?

# Good
_("Open", context="File Menu")
_("Open", context="Status")
```

9. **Don't translate code or technical identifiers**
```python
# Bad
doctype_name = _("Sales Order")  # This is a DocType name!

# Good
doctype_label = _("Sales Order")  # This is for display
doctype_name = "Sales Order"  # This is the identifier
```

10. **Don't skip testing**
```bash
# Bad
# Deploy without testing

# Good
# Test in development first
bench --site dev.local clear-cache
# Verify translations work
# Then deploy to production
```

---

## Quick Reference

### Command Syntax

```bash
# Basic usage
bench --site [SITE] get-untranslated [LANG] [OUTPUT_FILE]

# With options
bench --site [SITE] get-untranslated [LANG] [OUTPUT_FILE] --app [APP] --all
```

### Common Commands

```bash
# Extract untranslated strings
bench --site mysite.local get-untranslated es untranslated.txt --app myapp

# Extract all strings
bench --site mysite.local get-untranslated es all_strings.txt --app myapp --all

# Import translations
bench --site mysite.local update-translations es untranslated.txt translated.txt --app myapp

# Build translations
bench build --app myapp

# Clear cache
bench --site mysite.local clear-cache
```

### File Locations

```
apps/[app]/[app]/translations/[lang].csv     # CSV translation files
apps/[app]/[app]/locale/[lang].po            # PO files (optional)
apps/[app]/[app]/locale/main.pot             # POT template (optional)
sites/assets/locale/[lang]/LC_MESSAGES/[app].mo  # Compiled MO files
```

### Translation Functions

```python
# Python
from frappe import _

_("String")                          # Simple
_("String", context="Context")       # With context
_("Hello {0}").format(name)          # With placeholder
```

```javascript
// JavaScript
__("String")                         // Simple
__("String", null, "Context")        // With context
__("Hello {0}", [name])              // With placeholder
```

### CSV Format

```csv
source_text,translated_text,context
"English","Spanish",""
"Save","Guardar","Button"
"Save","Ahorro","Discount"
```

### Workflow Summary

```
1. Extract    → bench get-untranslated
2. Translate  → Edit files manually
3. Import     → bench update-translations
4. Build      → bench build
5. Test       → Clear cache and verify
```

### Language Codes

| Language | Code | Example |
|----------|------|---------|
| Spanish | es | es, es-GT, es-MX |
| French | fr | fr, fr-CA |
| German | de | de, de-AT |
| Arabic | ar | ar, ar-SA |
| Chinese | zh | zh, zh-TW |
| Portuguese | pt | pt, pt-BR |
| Russian | ru | ru |
| Japanese | ja | ja |
| Korean | ko | ko |
| Hindi | hi | hi |


---

## Summary

### Key Takeaways

1. **`get-untranslated`** extracts translatable strings from your app
2. **Two modes:** untranslated only (default) or all strings (`--all`)
3. **Output format:** One string per line, UTF-8 encoded
4. **Workflow:** Extract → Translate → Import → Build → Test
5. **File locations:** CSV in `translations/`, MO in `sites/assets/locale/`
6. **Functions:** `_()` in Python, `__()` in JavaScript
7. **Context:** Use for disambiguating same text with different meanings
8. **Placeholders:** Use `{0}`, `{1}` for dynamic content

### Complete Example

```bash
# 1. Extract untranslated Spanish strings
bench --site mysite.local get-untranslated es untranslated_es.txt --app myapp

# 2. Translate (manually edit file)
cp untranslated_es.txt translated_es.txt
nano translated_es.txt

# 3. Import translations
bench --site mysite.local update-translations es untranslated_es.txt translated_es.txt --app myapp

# 4. Build
bench build --app myapp

# 5. Clear cache and test
bench --site mysite.local clear-cache
bench restart
```