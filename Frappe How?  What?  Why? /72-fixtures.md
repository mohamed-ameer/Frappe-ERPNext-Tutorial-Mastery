# Fixtures in Frappe Framework

## Overview

In Frappe, fixtures are JSON files that store essential, reusable data—like roles, custom fields, reports, print formats, workflows, and scripts—so your app starts with the same correct setup every time you install or update it across development, testing, or production environments. 

Instead of manually re-inserting this data each time, you either write the JSON by hand or automatically export it from a working site using a hook defined in hooks.py (e.g., “export only the ‘Invoice’ print format”), and Frappe loads these files during installation or migration. 

Fixtures are ideal for static, non-changing data that your app depends on, but should never include user-generated content, transactions, or large datasets, as this can cause duplicates, slow performance, or accidental overwrites. 

When used correctly—with specific filters, version control, and careful testing—fixtures ensure consistent, reliable, and shareable app configurations while keeping your deployments smooth and predictable.

## Definition and Core Concepts

A fixture in Frappe is a JSON file that saves a snapshot of important database records—like custom forms (DocTypes), reports, print layouts, user roles, added fields (Custom Fields), design or behavior tweaks (Property Setters), frontend scripts (Client Scripts), backend logic (Server Scripts), approval flows (Workflows), and app structure settings (Module Definitions)—so this configuration can be reliably reused, shared, or restored across different sites or environments.

### Key Characteristics

1. **Serialization Format**: Fixtures are stored as JSON files, making them human-readable and version-controllable
2. **Automatic Loading**: Fixtures are automatically loaded during application installation or migration processes
3. **Environment Consistency**: They ensure that all environments (development, staging, production) start with identical baseline data
4. **Data Portability**: Fixtures enable the transfer of configuration and metadata between different Frappe sites and environments

In short: Fixture is nothing but initial data(records) that we want to load into specific table in the database when the application is installed or migrated.

A fixture is simply a mechanism for initializing predefined data into specific database tables—it’s technically just a JSON file, where each file corresponds to one table (DocType), and contains an array of records, with each JSON object in the array representing a single row to be inserted.

## Structure and Organization

Fixtures are organized within the `fixtures` directory of a Frappe application. Each fixture file corresponds to a specific DocType and follows a naming convention based on the document type it represents.

### Directory Structure

```
your_app/
└── fixtures/
    ├── User.json
    ├── Role.json
    ├── Custom Field.json
    └── ...
```

### File Format

Each fixture file contains a JSON array of document objects. Each object represents a complete document record with all its fields and child table entries.

## Creating Fixtures

There are two primary methods for creating fixtures in Frappe: manual creation and automated export.

### Method 1: Manual Creation

Manually create a JSON file in the `fixtures` directory of your application. The file should be named after the DocType it represents (e.g., `User.json` for User documents).

**Example: User Fixture**

```json
[
  {
    "doctype": "User",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "enabled": 1,
    "roles": [
      {
        "doctype": "Has Role",
        "parentfield": "roles",
        "role": "System Manager"
      }
    ]
  }
]
```

**Key Points:**
- The root element is always a JSON array
- Each array element represents one document
- Child table entries (like `roles` in the example) are included as nested arrays
- All required fields must be present for the document to be created successfully

### Method 2: Automated Export via Hooks

Define fixture specifications in your application's `hooks.py` file, then export them using Frappe's command-line interface.

**Step 1: Define Fixtures in `hooks.py`**

```python
fixtures = [
    {"dt": "DocType", "filters": [["name", "=", "User"]]},
    {"dt": "Print Format", "filters": [["name", "=", "My Print Format"]]},
    {"dt": "Report", "filters": [["name", "=", "My Report"]]},
    {"dt": "Role", "filters": [["name", "=", "My Role"]]},
    {"dt": "Custom Field", "filters": [["name", "=", "My Custom Field"]]},
    {"dt": "Property Setter", "filters": [["name", "=", "My Property Setter"]]},
    {"dt": "Client Script", "filters": [["name", "=", "My Client Script"]]},
    {"dt": "Server Script", "filters": [["name", "=", "My Server Script"]]},
    {"dt": "Workflow", "filters": [["name", "=", "My Workflow"]]},
    {"dt": "Module Def", "filters": [["name", "=", "My Module"]]}
]
```

**Step 2: Export Fixtures**

Execute the following command to generate fixture files:

```bash
bench --site your-site-name export-fixtures
```

This command will:
- Read the fixture specifications from `hooks.py`
- Query the database for documents matching the specified filters
- Generate corresponding JSON files in the `fixtures` directory
- Create one file per DocType specified in the fixtures list

**Filter Syntax**

Filters follow Frappe's standard filter format:
- `["field_name", "operator", "value"]` for simple conditions
- Supported operators: `=`, `!=`, `<`, `>`, `<=`, `>=`, `like`, `not like`, `in`, `not in`, `is`, `is not`

**Example with Multiple Filters:**

```python
fixtures = [
    {
        "dt": "User",
        "filters": [
            ["enabled", "=", 1],
            ["user_type", "=", "System User"]
        ]
    }
]
```

## Use Cases and Benefits

### Primary Use Cases

1. **Default Configuration**: Establish default settings, roles, and permissions required for application functionality
2. **Metadata Distribution**: Share custom DocTypes, reports, print formats, and other metadata across environments
3. **Reference Data**: Initialize lookup tables, master data, and configuration records
4. **Development Consistency**: Ensure all developers work with the same baseline data
5. **Deployment Standardization**: Maintain consistency between development, staging, and production environments

### Benefits

1. **Reproducibility**: Guarantees that every installation starts with identical initial data
2. **Version Control**: Fixture files can be tracked in version control systems, enabling change tracking and rollback capabilities
3. **Collaboration**: Facilitates sharing of configuration and metadata among team members
4. **Environment Synchronization**: Simplifies the process of aligning data across multiple environments
5. **Documentation**: Fixture files serve as documentation of the application's required initial state

## Limitations and Considerations

While fixtures provide significant benefits, developers should be aware of their limitations:

### Potential Issues

1. **Duplicate Data Risk**: Fixtures are loaded during every installation or migration. Without proper duplicate prevention mechanisms, this can result in duplicate records if the same fixture is processed multiple times.

2. **Performance Impact**: Large fixture files or numerous fixtures can slow down the installation and migration processes, particularly in production environments.

3. **Data Override Risk**: Fixtures may overwrite existing data in the database if not carefully managed. This is particularly critical when fixtures contain data that users may have modified in production environments.

4. **Dependency Management**: Fixtures may have implicit dependencies on other fixtures or data. The loading order matters, and missing dependencies can cause fixture loading to fail.

5. **Maintenance Overhead**: As applications evolve, fixtures must be updated to reflect changes in DocType structures, potentially requiring manual updates to fixture files.

### Best Practices to Mitigate Limitations

1. **Use Filters Wisely**: Employ specific filters in `hooks.py` to export only necessary records, avoiding unnecessary data inclusion
2. **Test Fixtures**: Always test fixture loading in development environments before deploying to production
3. **Document Dependencies**: Clearly document any dependencies between fixtures or required data prerequisites
4. **Version Control**: Maintain fixtures in version control to track changes and enable rollback if needed

## When to Use Fixtures

Fixtures are most appropriate for:

- **Static Configuration Data**: Settings that rarely change and are consistent across environments
- **Metadata**: DocTypes, reports, print formats, and other structural definitions
- **Reference Data**: Lookup tables, master data, and standardized reference information
- **Default Roles and Permissions**: Initial security configurations
- **Application-Specific Customizations**: Custom fields, property setters, and scripts specific to your application

Fixtures are **not recommended** for:

- **User-Generated Content**: Data created by end users during normal application usage
- **Transactional Data**: Business transactions, invoices, orders, and similar operational data
- **Frequently Changing Data**: Data that is modified regularly and varies between environments
- **Large Datasets**: Extensive data collections that would significantly impact installation performance

## Conclusion

Fixtures in Frappe are a powerful way to manage and share essential setup data—like roles, custom fields, reports, and workflows—across development, testing, and production environments by storing them as simple JSON files. 

When used correctly, they make deployments faster, keep teams in sync, and ensure every site starts with the same reliable configuration. However, care is needed to avoid problems like duplicate records, slow installs, or overwriting user changes—so always use fixtures only for stable, non-user data and follow best practices. For any Frappe developer building reusable apps or managing multi-site deployments, understanding fixtures is not just helpful—it’s essential.
