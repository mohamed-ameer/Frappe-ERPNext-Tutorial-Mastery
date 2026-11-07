# How to Rename a Module in Frappe (Safely)

Renaming a module in Frappe requires updates in both the UI and the source code to maintain consistency across your app. Follow these steps carefully:

---

## Step 1: Rename the Module from the Desk (UI)

1. Go to the **Module Def (Module Definition)** from the Desk.
2. Click the **Rename** option.
3. If prompted, select **"Merge with existing"** if a module with the new name already exists.
4. Confirm the change.

---

## Step 2: Rename the Module Folder in the Source Code

1. Navigate to your app’s module folder:
   ```
   apps/[your_app]/[your_app]/[module_name]
   ```
2. Rename the folder to the new module name using `snake_case`.  
   Example:
   ```
   attachments → parent_attachments
   ```

---

## Step 3: Update Doctype Definitions

1. For each Doctype that was under the old module, navigate to:
   ```
   apps/[your_app]/[your_app]/[new_module_name]/doctype/[doctype_name]/[doctype_name].json
   ```
2. Open the `.json` file and locate the `"module"` field.
3. Update the value to the new module name in **Title Case**.  
   Example:
   ```json
   "module": "Attachments" → "module": "Parent Attachments"
   ```

---

## Step 4: Update `modules.txt`

1. Open the `modules.txt` file located at:
   ```
   apps/[your_app]/[your_app]/modules.txt
   ```
2. Add the new module name (**Title Case**).
3. Remove the old module name to avoid errors like:
   ```
   Module not found
   ```

---

## Notes

After completing the above steps, run the following commands:

```bash
bench build
bench clear-cache
bench migrate
```

If needed, restart your bench:

```bash
bench restart
```

---

## Common Mistakes

- ❌ Mismatch between folder name (`snake_case`) and `"module"` field (`Title Case`)
- ❌ Forgetting to update `modules.txt`
- ❌ Not updating all DocTypes under the renamed module

---