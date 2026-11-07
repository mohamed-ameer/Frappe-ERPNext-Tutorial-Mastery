## Customization in ERPNext: A Deep Dive

### What is Customization in ERPNext?

Customization in ERPNext refers to the process of modifying the system to meet specific business requirements. This can range from simple changes like adding custom fields to complex modifications involving coding.

Customization in general refers to the process of modifying a product or system to meet specific needs.

Customization could be either editing an existing feature or adding a new one.

### Why Customize ERPNext?

1. **Business Requirements**: Every business is unique, and ERPNext needs to be tailored to meet specific needs.
2. **Competitive Advantage**: Customization can help businesses stand out from competitors by providing unique features and functionalities.
3. **Efficiency**: Tailoring the system to specific workflows can improve efficiency and reduce errors.

### How to Customize ERPNext?

1. **Low-Code Customizations**: These are simple changes that can be made using the built-in tools in ERPNext. Examples include adding custom fields, creating custom print formats, and setting up custom workflows.
2. **High-Code Customizations**: These involve writing code to achieve more complex changes. This can include creating custom scripts, developing custom apps, and modifying the core ERPNext codebase.

**NOTE** 
1. The common rule of any customization is "never touch the core".
2. We always will create a new app to hold our customizations.
3. We will never modify the core ERPNext codebase.
4. the hooks, patches, monkey patching, custom form, property setters, server and client scripts are the best way to customize the core ERPNext codebase or any frappe app.

### Customization vs. Development

Customization refers to modifying an existing system to meet specific needs, while development involves creating new systems from scratch. In the context of ERPNext, customization is about modifying the existing system to meet specific business requirements, while development involves creating new features or modules that don't exist out of the box.

### Customization vs. Configuration

Configuration refers to the process of setting up an existing system with the desired settings and parameters, while customization involves modifying the system to meet specific needs. In ERPNext, configuration is about setting up the system with the desired settings, while customization is about modifying the system to meet specific business requirements.

### Customization vs. Extension

Extension refers to adding new features or functionalities to an existing system, while customization involves modifying the existing system to meet specific needs. In ERPNext, extension is about adding new features or modules that don't exist out of the box, while customization is about modifying the existing system to meet specific business requirements.

---

## Customization Methods in ERPNext

### 1. Custom Fields

Custom fields allow you to add new fields to existing DocTypes. This can be done using the built-in tools in ERPNext.

**Example**: Adding a "Tax ID" field to the "Supplier" DocType.

### 2. Custom Scripts (Client & Server Scripts)

Custom scripts allow you to write JavaScript or Python code to change the behavior of the system. Client scripts are executed on the client-side (browser), while server scripts are executed on the server-side (Python).

**Example**: Writing a client script to hide a field on a form based on a certain condition.

### 3. Custom Print Formats

Custom print formats allow you to create custom layouts for printing documents. This can be done using the built-in tools in ERPNext.   

**Example**: Creating a custom print format for invoices that includes a company logo and custom branding.

### 4. Custom Reports

Custom reports allow you to create new reports based on existing data. This can be done using the built-in tools in ERPNext.

**Example**: Creating a custom report that shows the total sales by product for a specific time period.

### 5. Custom Workflows

Custom workflows allow you to create custom approval processes for documents. This can be done using the built-in tools in ERPNext.

**Example**: Creating a custom workflow for leave applications that requires approval from the HR manager before the leave can be approved.

### 6. Custom Apps

Custom apps allow you to create entirely new applications using the Frappe Framework and link them to ERPNext. This involves writing code and is considered a high-code customization.

**Example**: Creating a custom app for managing employee training and certifications.

---

## Customization Considerations

1. **Performance**: Customizations can impact system performance, especially high-code customizations. Always test your customizations thoroughly before deploying them in a production environment.
2. **Maintenance**: Customizations can make the system harder to maintain, especially high-code customizations. Always document your customizations thoroughly for future reference and maintenance.
3. **Security**: Customizations can introduce security vulnerabilities, especially high-code customizations. Always follow best practices for security when writing custom code.
4. **Upgradeability**: Customizations can make it harder to upgrade the system to newer versions. Always test your customizations thoroughly before upgrading the system.
5. **Support**: Customizations can make it harder to get support from the community or official channels. Always try to use built-in tools and features whenever possible.

---

## Customization Best Practices

1. **Plan Ahead**: Clearly define your requirements before starting any customization.
2. **Keep it Simple**: Start with low-code customizations whenever possible.
3. **Test Thoroughly**: Always test your customizations thoroughly before deploying them in a production environment.
4. **Document Everything**: Keep detailed documentation of your customizations for future reference and maintenance.
5. **Follow Best Practices**: Always follow best practices for security, performance, and maintainability when writing custom code.

---

## hooks.py

The `hooks.py` file is a special file in Frappe that allows you to define customizations and integrations for your app. It's like a contract between your app and the Frappe framework, specifying exactly how and when your app wants to participate in various system events and processes. The framework then uses this configuration to dynamically compose and execute the appropriate functions at runtime, creating a seamless integration between core functionality and custom extensions.

common hooks:

1. `boot_session`: This hook is used to modify the boot session data that is sent to the client-side when a user logs in.
2. `doc_events`: This hook is used to register custom event handlers for document events like `before_insert`, `after_insert`, `before_save`, `on_update`, `before_submit`, `on_submit`, `before_cancel`, `on_cancel`, `on_trash`, `after_delete`, `before_update_after_submit`, `on_update_after_submit`, `before_print`, and `on_payment_authorized`.
3. `scheduler_events`: This hook is used to register custom event handlers for scheduler events like `all`, `hourly`, `daily`, `weekly`, `monthly`, and `cron`.
4. `on_login`: This hook is used to register custom event handlers for the `on_login` event so that you can perform custom actions when a user logs in.
5. `on_logout`: This hook is used to register custom event handlers for the `on_logout` event so that you can perform custom actions when a user logs out.
6. `on_session_creation`: This hook is used to register custom event handlers for the `on_session_creation` event so that you can perform custom actions when a session is created and btw session is nothing but login or it is the same as `on_login` but it is called before `on_login`.
7. `app_include_js`: This hook is used to include custom JavaScript files in the client-side.
8. `app_include_css`: This hook is used to include custom CSS files in the client-side.
9. `doctype_js`: This hook is used to include custom JavaScript files for specific doctypes.
10. `doctype_list_js`: This hook is used to include custom JavaScript files for specific doctype lists.
11. `doctype_tree_js`: This hook is used to include custom JavaScript files for specific doctype trees.
12. `override_whitelisted_methods`: This hook is used to override whitelisted methods.
13. `override_doctype_class`: This hook is used to override doctype classes.
14. `has_permission`: This hook is used to check if a user has permission to access a document.
15. `permission_query_conditions`: This hook is used to add custom conditions to database queries based on user permissions.

and many more...
so hooks are the best way to customize the core ERPNext codebase or any frappe app.
you can imagine hooks as a way to extend the functionality of the core ERPNext codebase or any frappe app.

### How to customize the core ERPNext codebase or any frappe app?

1. Create a new app to hold your customizations.
2. Use hooks to customize the core ERPNext codebase or any frappe app.
3. Use patches to apply customizations to existing records.
4. Use monkey patching to customize the core ERPNext functionality or any frappe app.

### Best Practices for Customization

1. **Plan Ahead**: Clearly define your requirements before starting any customization.
2. **Keep it Simple**: Start with low-code customizations whenever possible.
3. **Test Thoroughly**: Always test your customizations thoroughly before deploying them in a production environment.
4. **Document Everything**: Keep detailed documentation of your customizations for future reference and maintenance.