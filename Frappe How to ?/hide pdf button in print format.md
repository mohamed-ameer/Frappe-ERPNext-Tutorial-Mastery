# hide pdf button in print format

i made a dummy solution but work 100% fine

step1: 
Create a CSS file named `desk.css` at the following location in your app:
```
apps/your-custom-app/your-custom-app/public/css/desk.css
```

This file will contain the custom styles to hide the buttons on the print page.

---
step2: 
Open your app's `hooks.py` file and add the following line to include your CSS globally in the Desk UI:

```
app_include_css = ["assets/your-custom-app/css/desk.css"]
```
---
step3: 
Add the following CSS rules to your `desk.css` file to hide specific buttons and messages in the print format:

```
/* Remove the "Try the new Print Designer" message in the Print*/
#page-print .custom-actions .inner-page-message {
    display: none !important;
}

/* Remove the Full Page and PDF buttons in the Print */
#page-print .custom-actions button:nth-of-type(1),
#page-print .custom-actions button:nth-of-type(2) {
    display: none !important;
}

/* Remove Full Page and PDF from the dropdown (in small screens) in the Print*/
#page-print .dropdown-menu .user-action:has([data-label="Full%20Page"]),
#page-print .dropdown-menu .user-action:has([data-label="PDF"]) {
    display: none !important;
}
```