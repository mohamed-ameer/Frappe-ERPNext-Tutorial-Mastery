# Accessing Child Table Data in Parent DocType (client-side scripting) – Frappe/ERPNext

how to **fetch and manipulate child table data** in a parent DocType in **Frappe/ERPNext** using client-side scripting.

---

## Why This Matters

as you know,child DocType doesn't have js file, hence how can we provide client-side script from it's parent script?!

---

## Concepts Overview

| Term | Description |
|------|-------------|
| **frm** | Reference to the parent form. |
| **cdt** | Child DocType name (e.g., 'Loan Board Members'). |
| **cdn** | Child Document Name (unique ID for a row in the child table).   in short: ID of instance in the table|
| **locals** | Global registry storing all documents in the current session. |

---

## 1. Get Data From Currently Edited Child Field

This is useful when you want to fetch or manipulate data in real-time when a user edits a field in a child table.

```js
frappe.ui.form.on("CHILD_TABLE_DOCTYPE", "child_table_field", function (frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    console.log(row.child_table_field); // Access value
    frm.set_value("parent_field", row.child_table_field); // Set value in parent doc
});
```

### Explanation:
- `frappe.ui.form.on` is used to hook into field-level triggers inside the child table.
- This must be outside the main `frappe.ui.form.on("ParentDoc", { ... })` block.
- `row` gives access to all fields of the current row being edited.

---

## 2. Button Trigger in Child Table

This use case is common when triggering server logic based on user actions in child table rows.

```js
frappe.ui.form.on('Loan Board Members', {
    button_name: function (frm, cdt, cdn) {
        const row = locals[cdt][cdn];
        frm.call({
            method: 'method_name',
            args: {
                row_index: row.idx
            },
            callback: function(r) {
                if (r.message) {
                    frappe.msgprint(r.message);
                }
            }
        });
    }
});
```

### 🔍 Explanation:
- `button_name` is a Button field inside the child table.
- `row.idx` passes the row number to the server-side method.
- `frm.call()` simplifies server communication, binding it to the current document context.

---

## 3. Extract Full Child Table (All Rows)

Use this to loop through all rows in the child table.

```js
let rows = frm.doc.child_table_fieldname;

rows.forEach(row => {
    console.log(row.fieldname);  // Replace 'fieldname' with actual child field
});
```

> This is the **preferred method** to fetch all rows of a child table.

---

## 4. Access All Child Rows via `locals`

Alternatively, access all rows as objects from `locals`:

```js
let allDocs = locals["CHILD_DOCTYPE_NAME"];
let allRows = Object.values(allDocs); // Now it's an array
```

Use this only when you need low-level access to all rows regardless of placement.

---

## 5. Set Field Value in a Specific Child Row

```js
// in js file
frappe.model.set_value(cdt, cdn, 'fieldname', 'new value');
```

```py
# in py file (controller logic) use frappe.db.set_value, 
# it will not hit the save process (before_validate, validate, ....etc)

for row in self.child_table_fieldname:
    frappe.db.set_value(row.doctype, row.name, {
        "field_name": "new_value",
    })
```


---

## Summary

| Action | Code |
|--------|------|
| Get current child row | `locals[cdt][cdn]` |
| Get all rows | `frm.doc.child_table_fieldname` |
| Set parent field | `frm.set_value('fieldname', value)` |
| Set child field | `frappe.model.set_value(cdt, cdn, 'fieldname', 'new value');` |
| Trigger server call | `frm.call({ method: ..., args: {...} })` |

---

## Resources

[How to fetch data from Child Table in Parent Doc-Type in Frappe ERP-Next](https://medium.com/@subhashsoni403/how-to-fetch-data-from-child-table-in-parent-doc-type-in-frappe-erp-next-b9b775146a8b)
