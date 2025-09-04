# How to Add and Manage Translations in Your Custom Frappe App: A Step-by-Step Guide

---

## 1. Create the `translations` Folder

**Step:**  
In your custom app directory, create a folder named `translations` at:

```
apps/your-app/your-app/translations/
```

**Why?**  
Frappe automatically detects this folder. It follows a convention-over-configuration approach, so placing your translation files here ensures they're recognized without extra setup.

---

## 2. Add Translation CSV Files

**Step:**  
Create a CSV file for each language in the `translations` folder. For example:

- `ar.csv` (Arabic)
- `es.csv` (Spanish)

**CSV Structure:**

```csv
"source_string","translated_string","context"
"bl7","بلح",""
"toto","توتو",""
```

**Why?**

- **Column 1 (`source_string`)**: The original string used in your code (e.g., `_("toto")`).
- **Column 2 (`translated_string`)**: The translated version of the string.
- **Column 3 (`context`)**: Optional. Use it to clarify the translation context.

The third column is optional and may be left empty.

---

## 3. Use Translatable Strings in Your Code

**Step:**  
Wrap strings in your Python, HTML, or JavaScript code using `_()`:

```python
from frappe import _

def my_function():
    message = _("toto")  # Will be replaced with "توتو" for Arabic users
```

**Why?**  
The `_()` function marks strings as translatable. During runtime, Frappe replaces them based on the user's language preference.

---

## 4. Build the Site

Only needed if you're using `__()` in custom frontend JS and changed the JS files

**Step:**  
Run the build command:

```bash
bench --site your-site build
```

---

## 5. Verify Translations

**Step:**

- Switch your user’s language to Arabic (or target language) in Frappe.
- Check if `_("toto")` now shows as `"توتو"`.

**Why?**  
This confirms that Frappe correctly maps the source string to its translated counterpart.

---

## Key Notes

### Language Codes
- CSV filenames must match Frappe’s language code (e.g., `ar` for Arabic).
- You can find these codes in **Frappe > Language settings**.

### Folder Location
- The `translations` folder must be at the **root** of your app’s package directory (not inside a submodule).

### Performance
- Translations are **cached** during build.
- **Always rebuild** after editing translation files.

### Fallback Behavior
- If a string isn’t translated, Frappe will use the original (source) string.

---
## Do i need to build or migrate the site?

NO, frappe loads translations **dynamically at runtime** from your `translations/lang.csv` file, based on the logged-in user’s language preference.
you just need to refresh your browser or clear-cashe if necessary.

`bench build` only needed if you’re using `__()` in custom frontend JS and changed the JS files

---

## Example Workflow

1. Create:  
   ```
   apps/my_app/my_app/translations/ar.csv
   ```

2. Add entries:  
   ```csv
   "welcome_message","مرحبا بك!",""
   ```

3. Use in code:  
   ```python
   _("welcome_message")
   ```

4. Clear Cashe:  
- use it if translations don't reflect immediately
   ```bash
   bench --site my-site clear-cache
   ```
5. Build:
 - only needed if you're using `__()` in custom frontend JS and changed the JS files
   ```bash
   bench --site my-site build
   ```
6. Test in Arabic interface.

---
## Explain Context?

context is nothing but a meta-data,
to explain to the one who will use this translation when and where to use it.
because sometimes you have the same word with different meaning

as example:

```
"charge","شحن",""
"charge","رسوم",""
```

here we have same word but different meaning (different context to use)
so, to filter it we have to give it a context

```
"charge","شحن","mobile phone charge"
"charge","رسوم","invoice line"
```

in code:

```
_("charge") # here we don't know which meaning (context to use)
_("charge", context="mobile phone charge") # here we mean شحن
_("charge", context="invoice line") # here we mean رسوم
```