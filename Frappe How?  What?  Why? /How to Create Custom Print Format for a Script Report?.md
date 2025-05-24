# Create Custom Print Format for a Script Report

Assuming you already created a standard Script Report (Is Standard = Yes), follow these steps:

1. create html file in /apps/your_app/your_app/your_module/report/your_report/your_report.html
```
your_app/
└── your_module/
    └── report/
        └── your_report_name/
            ├── your_report_name.py
            ├── your_report_name.js
            ├── your_report_name.json
            └── your_report_name.html   ← create this!
```
> The .html file must match the report name.

---

2. Inside your_report_name.html, write a Jinja2 template like this:
```html
<h2>{{ report.report_name }}</h2>

<table class="table table-bordered">
  <thead>
    <tr>
      {% for col in columns %}
        <th>{{ col.label }}</th>
      {% endfor %}
    </tr>
  </thead>
  <tbody>
    {% for row in data %}
      <tr>
        {% for col in columns %}
          <td>{{ row[col.fieldname] }}</td>
        {% endfor %}
      </tr>
    {% endfor %}
  </tbody>
</table>
```
Note: 
Frappe uses John Resig’s MicroTemplate engine — not Jinja2 — for HTML files rendered in the Desk app (like Script Reports).
Frappe uses Jinja, but only in server-side contexts like:
- Print Formats (for DocTypes)
- Email Templates
- Web Pages and Website Templates
- Server-side rendering (frappe.render_template())

It does NOT use Jinja in client-side components like:
- Script Report .html files (uses MicroTemplate instead)
- JavaScript-rendered templates in the Desk UI

Use Jinja for backend-rendered templates, and MicroTemplate (<% %>) for  client-side components in Desk.
[check this](https://docs.frappe.io/framework/user/en/guides/app-development/using-html-templates-in-javascript)

---

3. How to Use It
- Go to your Script Report in the UI.
- From the top-right menu (⋮), choose Print.
- Frappe will render your custom HTML as the print output.
- You can also export as PDF from the same menu.

4. Hot Reload (Optional)
After editing the .html, if your changes don’t show up:
```bash
bench --site your-site build
bench --site your-site clear-cache
bench --site your-site migrate
bench restart
```
---

5. Note: 
- The .html file must match the report name.
- The .html file must be in the same directory as the .py file.
- The .html file is not a standard Frappe feature. It's a custom solution for specific needs.
- The .html file is only used for printing (not the onscreen report).
- Make sure your columns list in execute() uses fieldname, label, etc., properly.
- It only works for Script Reports (not Query Reports).
- Frappe uses John Resig’s MicroTemplate engine — not Jinja2 — for HTML files rendered in the Desk app (like Script Reports).
- For complex print formats, consider using standard Print Formats (Setup > Print > Print Format) which are more integrated with Frappe's features.

[for more info check this](https://github.com/frappe/erpnext/blob/develop/erpnext/accounts/report/general_ledger/general_ledger.html)