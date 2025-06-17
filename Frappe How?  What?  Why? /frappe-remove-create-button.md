# How to Remove the "Add" or "Create" Button from a Doctype List View in Frappe

In my case, i want to prevent users from creating new records directly from a Doctype's list view, but i will create it indirectly from another doctype.

In Frappe, this can be done by disabling the "Add" or "Create" button using a simple client-side script.

---

### Step 1: Create the List View JS File

To customize the List View, Frappe looks for a JavaScript file named `{doctype}_list.js` in the Doctype's folder.

**Example File Path:**

```
apps/your_app/your_app/doctype/your_doctype/your_doctype_list.js
```

> If this file doesn't exist yet, create it.

---

### Step 2: Add the List View Configuration

Inside the `your_doctype_list.js` file, add the following code:

```js
frappe.listview_settings['Your Doctype'] = {
    onload(listview) {
        listview.can_create = false;
    }
}
```

- Replace `'Your Doctype'` with the actual name of your Doctype (case-sensitive).
- This configuration runs when the list view loads and sets `can_create` to `false`, which removes the "Add" button from the UI.
- After saving the file and reloading the page (or running `bench build && bench restart`), users will no longer see the "Add" or "New" button on the list view of that Doctype.
---

## Notes

- This only affects the UI. It does **not** restrict users from creating records through other means (e.g., APIs or scripts).
- If you want to **fully restrict creation**, you should also update the Doctype’s **permissions** from Role Permissions Manager or add server-side validations.

---

For more ways to customize the List View, check out the official documentation:
https://docs.frappe.io/framework/user/en/api/list

or you can discover by yourself, just print the listview object:
```js
frappe.listview_settings['Your Doctype'] = {
    onload(listview) {
        console.log(listview)
    }
}
```

If you know any useful tips or customizations not covered in the official docs, feel free to share them here to help the community

