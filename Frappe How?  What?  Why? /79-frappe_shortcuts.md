# Frappe Keyboard Shortcuts Reference

This document lists all keyboard shortcuts available in Frappe framework, organized by category with detailed explanations.

Search with the `frappe.ui.keys.add_shortcut` to find all shortcuts in the codebase.

## Table of Contents
- [Global Shortcuts](#global-shortcuts)
- [Form Shortcuts](#form-shortcuts)
- [Grid/Child Table Shortcuts](#gridchild-table-shortcuts)
- [List View Shortcuts](#list-view-shortcuts)
- [Report View Shortcuts](#report-view-shortcuts)
- [Workspace Shortcuts](#workspace-shortcuts)
- [System Console Shortcuts](#system-console-shortcuts)
- [Alt Key Shortcuts](#alt-key-shortcuts)

---

## Global Shortcuts

These shortcuts work throughout the Frappe application, regardless of the current page.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Ctrl+S` (⌘+S on Mac) | Trigger Primary Action | Global | Triggers the primary action button (usually Save) on the current page. Works even when input fields are focused. |
| `Ctrl+G` (⌘+G on Mac) | Open Awesomebar | Global | Focuses the navbar search (Awesomebar) to quickly search for documents, reports, or pages. |
| `Ctrl+H` (⌘+H on Mac) | Navigate Home | Global | Clicks the home icon in the navbar to navigate to the home workspace. |
| `Alt+S` (⌥+S on Mac) | Open Settings | Global | Opens the user settings dropdown menu from the navbar. |
| `Alt+H` (⌥+H on Mac) | Open Help | Global | Opens the help dropdown menu from the navbar. |
| `Shift+/` (⇧+/) | Show Keyboard Shortcuts | Global | Opens a dialog displaying all available keyboard shortcuts for the current context (Global, Page, and Grid shortcuts). |
| `Shift+Ctrl+R` (⇧+⌘+R on Mac) | Clear Cache and Reload | Global | Clears the browser cache and reloads the page. Useful for developers when making code changes. |
| `Shift+Ctrl+G` (⇧+⌘+G on Mac) | Switch Theme | Global | Opens/closes the theme switcher dialog to change between light and dark themes. |
| `Escape` / `Esc` | Close Dialogs/Grids | Global | Closes open dialogs, grid row forms, or cancels current operations. Also blurs the currently focused element. |
| `Enter` | Confirm Dialog | Global | When a confirmation dialog is open, triggers the primary (confirm) button. |
| `Ctrl+Up` | Navigate Grid Row Up | Global | When a grid row form is open, closes it and opens the previous row's form. |
| `Ctrl+Down` | Navigate Grid Row Down | Global | When a grid row form is open, closes it and opens the next row's form. |

**File Location**: `apps/frappe/frappe/public/js/frappe/ui/keyboard.js` (lines 187-279)

---

## Form Shortcuts

These shortcuts are available when viewing or editing a document form.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Shift+Ctrl+>` | Go to Next Record | Form View | Navigates to the next record in the same DocType. Only works when not editing a new document. |
| `Shift+Ctrl+<` | Go to Previous Record | Form View | Navigates to the previous record in the same DocType. Only works when not editing a new document. |
| `Ctrl+P` (⌘+P on Mac) | Print Document | Form View | Opens the print dialog for the current document. Only available if the user has print permissions and the DocType is not a Single DocType. |
| `Ctrl+Z` (⌘+Z on Mac) | Undo Last Action | Form View | Undoes the last change made in the form. Not available in Form Builder mode. |
| `Ctrl+Y` (⌘+Y on Mac) | Redo Last Action | Form View | Redoes the last undone action in the form. Not available in Form Builder mode. |
| `Shift+Ctrl+Z` (⇧+⌘+Z on Mac) | Redo Last Action (Alternate) | Form View | Alternative shortcut for redo. Same as Ctrl+Y. Not available in Form Builder mode. |
| `Ctrl+E` (⌘+E on Mac) | Email Document | Form View | Opens the email dialog to send the current document via email. Only available for existing (saved) documents. |
| `Ctrl+J` (⌘+J on Mac) | Jump to Field | Form View | Opens a dialog to quickly search and jump to any field in the form. |
| `Shift+D` (⇧+D) | Duplicate Document | Form View | Creates a duplicate copy of the current document. Only available if the user has create permissions and the DocType allows copying. |
| `Shift+Ctrl+D` (⇧+⌘+D on Mac) | Delete Document | Form View | Moves the current document to trash. Only available for existing documents that are not submitted. |
| `Shift+R` (⇧+R) | Remind Me | Form View | Opens the reminder manager dialog to set reminders for the current document. Only available for existing documents. |
| `Ctrl+B` (⌘+B on Mac) | New Document | Form View | Creates a new document of the same DocType. Only available when viewing an existing document (not when creating a new one). |
| `Alt+Hover` | Show Fieldname | Form View | When holding Alt and hovering over a field, displays the fieldname. Clicking copies the fieldname to clipboard. Useful for developers and customizations. |

**File Locations**: 
- `apps/frappe/frappe/public/js/frappe/form/form.js` (lines 137-221)
- `apps/frappe/frappe/public/js/frappe/form/toolbar.js` (lines 370-527)
- `apps/frappe/frappe/public/js/frappe/form/layout.js` (lines 567-571)

---

## Grid/Child Table Shortcuts

These shortcuts work when editing child table rows (like Items in Sales Invoice, Items in Purchase Order, etc.).

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Up Arrow` | Move Cursor Up | Grid/Child Table | Moves the cursor to the row above the current row in the child table. |
| `Down Arrow` | Move Cursor Down | Grid/Child Table | Moves the cursor to the row below the current row in the child table. |
| `Tab` | Move to Next Column | Grid/Child Table | Moves the cursor to the next column (field) in the current row. |
| `Shift+Tab` (⇧+Tab) | Move to Previous Column | Grid/Child Table | Moves the cursor to the previous column (field) in the current row. |
| `Ctrl+Up` (⌘+Up on Mac) | Add Row Above | Grid/Child Table | Inserts a new row above the currently selected row. |
| `Ctrl+Down` (⌘+Down on Mac) | Add Row Below | Grid/Child Table | Inserts a new row below the currently selected row. |
| `Ctrl+Shift+Up` (⌘+⇧+Up on Mac) | Add Row at Top | Grid/Child Table | Inserts a new row at the top of the child table. |
| `Ctrl+Shift+Down` (⌘+⇧+Down on Mac) | Add Row at Bottom | Grid/Child Table | Inserts a new row at the bottom of the child table. |
| `Shift+Alt+Down` (⇧+⌥+Down on Mac) | Duplicate Current Row | Grid/Child Table | Creates a duplicate copy of the currently selected row with all its field values. |

**File Location**: `apps/frappe/frappe/public/js/frappe/form/form.js` (lines 173-220)

**Note**: These shortcuts only work when the form is not in "new" mode (i.e., when editing an existing document).

---

## List View Shortcuts

These shortcuts are available when viewing a list of documents (List View).

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Down Arrow` | Navigate List Down | List View | Moves focus to the next row in the list. If no row is focused, focuses the first row. |
| `Up Arrow` | Navigate List Up | List View | Moves focus to the previous row in the list. |
| `Shift+Down` (⇧+Down) | Select Multiple Items (Down) | List View | Selects the current row and moves focus down. Used for multi-selection. |
| `Shift+Up` (⇧+Up) | Select Multiple Items (Up) | List View | Selects the current row and moves focus up. Used for multi-selection. |
| `Enter` | Open List Item | List View | Opens the focused list item in form view. Equivalent to clicking on the document name. |
| `Space` | Select List Item | List View | Toggles the checkbox selection of the currently focused list item. |

**File Location**: `apps/frappe/frappe/public/js/frappe/list/list_view.js` (lines 1181-1253)

**Note**: These shortcuts don't work when input fields (search, filters) are focused.

---

## Report View Shortcuts

These shortcuts are available when viewing reports.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Ctrl+K` (⌘+K on Mac) | Toggle Sidebar | Report View | Shows or hides the sidebar in the report view. |
| `Shift+Ctrl+D` (⇧+⌘+D on Mac) | Delete Report | Report View | Deletes the current report. Only available if the user has delete permissions and the report is not a standard report. |

**File Location**: `apps/frappe/frappe/public/js/frappe/views/reports/report_view.js` (lines 1579, 1747)

---

## Workspace Shortcuts

These shortcuts are available in Workspace pages.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `a-z` (any letter) | Focus Awesomebar | Workspace | Focuses the navbar search (Awesomebar) and allows typing the letter. |
| `Shift+a-z` (⇧+any letter) | Focus Awesomebar | Workspace | Same as above, but with Shift modifier. |

**File Location**: `apps/frappe/frappe/public/js/frappe/views/workspace/workspace.js` (lines 1590-1602)

**Note**: These shortcuts are registered for all 26 letters (a-z) and their Shift variants, allowing quick access to the Awesomebar from any workspace page.

---

## System Console Shortcuts

These shortcuts are available in the System Console DocType.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Shift+Enter` (⇧+Enter) | Execute Console Script | System Console | Executes the Python or SQL script in the System Console. Works even when the input field is focused. |

**File Location**: `apps/frappe/frappe/desk/doctype/system_console/system_console.js` (lines 6-12)

---

## Alt Key Shortcuts

Frappe supports Alt key shortcuts for menu items and sidebar buttons. These are dynamically generated based on the first letter of menu/button labels.

| Shortcut | Description | Where Used | What It Does |
|----------|-------------|------------|--------------|
| `Alt + [Letter]` | Trigger Menu/Button | Global | Pressing Alt highlights all menu items and buttons that have shortcuts. Pressing Alt + a letter triggers the first menu item or button whose label starts with that letter. |

**How It Works**:
1. Press and hold `Alt` - all shortcuts are highlighted
2. Press a letter key (e.g., `S` for Save, `N` for New)
3. The corresponding menu item or button is clicked

**File Location**: `apps/frappe/frappe/public/js/frappe/ui/alt_keyboard_shortcuts.js`

**Note**: Alt shortcuts work for:
- Page menu items (Actions menu)
- Sidebar navigation items
- Any button with a text label

---

## Mac Keyboard Equivalents

On macOS, Frappe automatically converts keyboard shortcuts:
- `Ctrl` → `⌘` (Command key)
- `Alt` → `⌥` (Option key)
- `Shift` → `⇧` (Shift key)

The shortcuts are automatically adjusted when running on macOS, so `Ctrl+S` becomes `⌘+S`, etc.

---

## Implementation Details

### Shortcut Registration
Shortcuts are registered using `frappe.ui.keys.add_shortcut()` with the following parameters:
- `shortcut`: The key combination (e.g., "ctrl+s")
- `action`: Function to execute when shortcut is pressed
- `description`: Human-readable description (shown in shortcuts dialog)
- `page`: Optional page object to scope the shortcut
- `condition`: Optional function that returns true/false to enable/disable shortcut
- `ignore_inputs`: If true, shortcut works even when input fields are focused

### Shortcut Scope
- **Global shortcuts**: Available everywhere (no `page` parameter)
- **Page shortcuts**: Available only on specific pages (e.g., forms, lists)
- **Grid shortcuts**: Available only when editing child tables

### Viewing All Shortcuts
Press `Shift+/` (or `⇧+/`) to open a dialog showing all available shortcuts for the current context, organized into:
- Global Shortcuts
- Page Shortcuts
- Grid Shortcuts

---

## Notes

1. **Input Field Focus**: Most shortcuts don't work when typing in input fields (unless `ignore_inputs: true` is set)
2. **Conditional Shortcuts**: Some shortcuts only appear based on permissions or document state (e.g., Delete only shows for non-submitted documents)
3. **Browser Conflicts**: Some shortcuts may conflict with browser shortcuts (e.g., Ctrl+P for print). Frappe handles these appropriately.
4. **Custom Shortcuts**: Developers can add custom shortcuts using `frappe.ui.keys.add_shortcut()` in their custom scripts.

---

## References

- Keyboard shortcuts system: `apps/frappe/frappe/public/js/frappe/ui/keyboard.js`
- Form shortcuts: `apps/frappe/frappe/public/js/frappe/form/form.js`
- Toolbar shortcuts: `apps/frappe/frappe/public/js/frappe/form/toolbar.js`
- List view shortcuts: `apps/frappe/frappe/public/js/frappe/list/list_view.js`
- Alt shortcuts: `apps/frappe/frappe/public/js/frappe/ui/alt_keyboard_shortcuts.js`

Search with the `frappe.ui.keys.add_shortcut` to find all shortcuts in the codebase.
