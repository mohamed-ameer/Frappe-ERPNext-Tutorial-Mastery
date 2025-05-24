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
You can use any valid HTML + Jinja2 logic. Frappe passes columns and data from your execute() function to this template automatically.

3. How to Use It
    1. Go to your Script Report in the UI.
    2. From the top-right menu (⋮), choose Print.
    3. Frappe will render your custom HTML as the print output.
    4. You can also export as PDF from the same menu.

4. Hot Reload (Optional)
After editing the .html, if your changes don’t show up:
```bash
bench --site your-site build
bench --site your-site clear-cache
bench --site your-site migrate
bench restart
```

5. Note: 
    1. The .html file must match the report name.
    2. The .html file must be in the same directory as the .py file.
    3. The .html file is not a standard Frappe feature. It's a custom solution for specific needs.
    4. The .html file is only used for printing (not the onscreen report).
    5. Make sure your columns list in execute() uses fieldname, label, etc., properly.
    6. You can include custom styles or logic inside the HTML/Jinja template.
    7. It only works for Script Reports (not Query Reports).
    8. It's mainly for PDF/HTML export, not for viewing in the browser.
    9. For complex print formats, consider using standard Print Formats (Setup > Print > Print Format) which are more integrated with Frappe's features.
    Tips
