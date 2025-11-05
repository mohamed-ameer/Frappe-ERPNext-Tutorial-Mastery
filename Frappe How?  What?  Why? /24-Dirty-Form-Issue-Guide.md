# Dealing with Unexpected Unsaved Changes (Dirty Forms) Issue

## My Case

I faced an issue where every time I opened a document, the form was marked as **unsaved (dirty)**, even though I hadn’t changed anything manually.  

After some debugging, I discovered the cause:  
I was setting a value in a field **after the form loaded**, which automatically made the form dirty.  

### The Fix  
The solution was simple — **only set the value if the field is empty** (or different from what I want to set).  
This way, the form doesn’t get marked as dirty unnecessarily.

---

## What is a Dirty Form?

In **Frappe**, a *Dirty Form* means that a document (Doc) opened in the Desk has unsaved changes.  
Whenever a field value is modified, Frappe marks the form as "dirty" until it is saved.

This is why:
- The **Save** button lights up as soon as you change a field.  
- You may see a warning when trying to leave the page:  
  *"You have unsaved changes. Do you want to leave without saving?"*

---

## When Does the Dirty Form Issue Happen?

Sometimes, the form becomes dirty even if the user hasn’t changed anything manually.  
This often happens because of **custom scripts** or **automated updates** to fields.

Mostly 99% of time, the form be dirty because of **Custom Scripts** that set values using `frm.set_value()`.  

---

## Solutions to Dirty Form Issues

### 1. Ignore Dirty Status (Not Recommended for Real Data)
If the change is **only UI-related** and doesn’t need saving:
```js
frm.dirty = false;
```
This tells Frappe: *“ignore this change”*.  
Use this carefully, only for **visual/UI changes**.

---

### 2. Auto-Save After Changes
If the value **must be stored**, you can auto-save programmatically:
```js
frm.save();
```

---

### 3. Best Practice for My Case

When you need to set a value programmatically:

- Use `frm.set_value()` **only if the field is empty** (or if the new value is different from the existing one).  
  This avoids marking the form dirty unnecessarily.

```js
if (!frm.doc.my_field) {
    frm.set_value("my_field", "Default Value");
}

// or safer comparison
if (frm.doc.my_field !== "New Value") {
    frm.set_value("my_field", "New Value");
}

```

> **Note:** Technically, `frm.set_value()` already checks for equality internally  
> (it only updates if `value != old_value`).  
> However, in practice, adding an explicit check (e.g., `if (!frm.doc.fieldname)` or comparing old/new values) often works better. idk why!!!! but here we go

---

### 4. Use `frm.doc.field = value; frm.refresh_field(field);`

```js
frm.doc.field = value;
frm.refresh_field(field);
```

When you use `frm.doc.field = value; frm.refresh_field(field);`, you’re changing the field value directly inside the document, like editing it behind the scenes. It will show the new value only after you refresh the field manually, but it won’t trigger any Frappe events such as onchange or depends_on. So if other fields or scripts depend on this value, they won’t react. This method is fine if you just want to silently update data without affecting anything else in the form.

On the other hand, `frm.set_value(field, value)` is the recommended and safer way to change a field. It automatically updates the field, refreshes the UI, and triggers all related events. That means any logic, calculations, or field dependencies connected to that field will run as expected. You can think of it as if the user themselves changed the field, making it ideal for most normal cases in Frappe scripting.
