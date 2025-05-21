# How to Add and Manage Translations in Your Custom Frappe App: A Step-by-Step Guide

---

## 1. Create the `translations` Folder

**Step:**  
In your custom app directory, create a folder named `translations` at:

```
apps/your-app/your-app/translations/
```

**Why?**  
Frappe automatically detects this folder during the build process. It follows a convention-over-configuration approach, so placing your translation files here ensures they're recognized without extra setup.

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

**Step:**  
Run the build command:

```bash
bench --site your-site build
```

**Why?**

- Converts CSV files into optimized `.json` or `.mo` files.
- Updates static assets and makes translations available in the app.
- Without rebuilding, changes won’t take effect.

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

4. Build:  
   ```bash
   bench --site my-site build
   ```

5. Test in Arabic interface.

---

By following these steps, you ensure that Frappe can detect, process, and serve translations efficiently.