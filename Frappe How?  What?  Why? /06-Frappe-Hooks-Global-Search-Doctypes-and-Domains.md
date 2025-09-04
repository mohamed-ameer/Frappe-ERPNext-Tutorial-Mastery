# Frappe Hooks: Global Search Doctypes and Domains

### How to Understand Any Hook in Frappe?
> To understand any hook in Frappe, I search with `frappe.get_hooks("hook_name")` (or `frappe.get_hooks(hook="hook_name` ) in VS Code to find where it’s used in the framework. Then I trace the code to see how the values are consumed, and finally experiment by adding the hook in my own hooks.py to observe the behavior. This simple process helps me quickly grasp what each hook does.

## Introduction

Frappe Framework uses a sophisticated hook system to extend and customize functionality across different applications. Two of the most important hooks are `global_search_doctypes` and `domains`, which control how the system behaves in terms of search functionality and business domain activation.

## Global Search Doctypes Hook

### What is Global Search?

Global Search (also called the "Awesomebar") is Frappe's unified search interface that allows users to search across multiple DocTypes from a single search bar. It's located at the top of the Frappe desk interface and provides quick access to documents, records, and information. (finally i know why they call it Awesome 😂😂😂😂 it is really Awesome)

### Purpose of `global_search_doctypes` Hook

The `global_search_doctypes` hook defines which DocTypes are included in the global search functionality and in what order results should appear.

### Hook Structure

```python
# In your app's hooks.py file
global_search_doctypes = {
    "Default": [
        {"doctype": "Customer", "index": 0},
        {"doctype": "Supplier", "index": 1},
        {"doctype": "Item", "index": 2},
        # ... more doctypes
    ],
    "Hospitality": [
        {"doctype": "Hotel Room", "index": 0},
        {"doctype": "Hotel Room Reservation", "index": 1},
        {"doctype": "Hotel Room Pricing", "index": 2},
        {"doctype": "Hotel Room Package", "index": 3},
        {"doctype": "Hotel Room Type", "index": 4}
    ],
    "Education": [
        {"doctype": "Student", "index": 0},
        {"doctype": "Course", "index": 1},
        {"doctype": "Enrollment", "index": 2}
    ]
}
```

### Key Components

1. **Domain Keys**: Each key represents a business domain (e.g., "Default", "Hospitality", "Education")
2. **DocType Objects**: Each object contains:
   - `doctype`: The name of the DocType to include in search
   - `index`: Priority order (lower numbers = higher priority)

### How It Works

1. **Hook Collection**: Frappe collects all `global_search_doctypes` hooks from installed apps
2. **Domain Filtering**: Only DocTypes from active domains are included
3. **Index Sorting**: DocTypes are sorted by their index values
4. **Database Storage**: The configuration is stored in the `Global Search Settings` DocType
5. **Search Execution**: When users search, only configured DocTypes are queried

### Implementation in Frappe Core

The hook is processed by the `update_global_search_doctypes()` function in `frappe/desk/doctype/global_search_settings/global_search_settings.py`:

https://github.com/frappe/frappe/blob/94393385dcca0005fc30d4905214b8905dfc9e91/frappe/desk/doctype/global_search_settings/global_search_settings.py#L59

## Domains Hook

### What are Domains?

Domains in Frappe are like switches for industries. They turn on the features, modules, and settings needed for a specific business sector. This way, the same ERP system can adapt to different industries. For example, you can enable only Hospitality, Healthcare, or Education features for a client, without showing them unrelated modules.

### Purpose of `domains` Hook

The `domains` hook defines business domains and their associated configuration data. This hook enables:

- **Feature Modularity**: Activate/deactivate features based on business domain
- **Custom Fields**: Add domain-specific fields to existing DocTypes
- **Role Management**: Create and manage domain-specific user roles
- **Module Restrictions**: Control which modules are available for each domain
- **Desktop Icons**: Customize the desktop interface per domain

### Hook Structure

```python
# In your app's hooks.py file
domains = {
    "Hospitality": "hospitality.hospitality.hospitality",
    "Education": "education.education.education",
    "Healthcare": "healthcare.healthcare.healthcare"
}
```

### Domain Data Structure

Each domain must have a corresponding data file that defines its configuration:

```python
# hospitality/hospitality/hospitality.py
data = {
    "desktop_icons": [
      "Restaurant",
      "Hotels", 
      "Accounts", 
      "Buying", 
      "Stock", 
      "HR", 
      "Project", 
      "ToDo"
    ],
    "restricted_roles": [
        "Hotel Manager",
        "Receptionist",
        "Housekeeping Staff"
    ],
    "custom_fields": {
        "Customer": [
            {
                "fieldname": "preferred_room_type",
                "label": "Preferred Room Type",
                "fieldtype": "Link",
                "options": "Hotel Room Type"
            }
        ]
    },
    "modules": [
        "Hospitality Management",
        "Room Booking",
        "Revenue Management"
    ],
    "properties": [
        {
            "doctype": "Customer",
            "doctype_or_field": "DocField",
            "fieldname": "customer_type",
            "property": "default",
            "value": "Hotel Guest"
        }
    ],
    "set_value": [
        ["System Settings", None, "allow_guest_to_view", 1]
    ],
    "default_portal_role": "Hotel Guest"
}
```

### How Each Configuration Reflects in the System

### 1. Desktop Icons Configuration

**What it does:**
```python
"desktop_icons": [
    "Restaurant",
    "Hotels", 
    "Accounts", 
    "Buying", 
    "Stock", 
    "HR", 
    "Project", 
    "ToDo"
]
```

**System Impact:**

1. **Desktop Interface Changes:**
   - Only these 8 modules appear as desktop icons
   - Other modules are hidden from the desktop
   - Icons are displayed in the specified order

2. **Database Changes:**
   ```sql
   -- All existing desktop icons are hidden
   UPDATE `tabDesktop Icon` SET hidden=1 WHERE standard=1;
   
   -- Only specified icons are made visible
   UPDATE `tabDesktop Icon` SET hidden=0 WHERE module_name IN ('Restaurant', 'Hotels', 'Accounts', 'Buying', 'Stock', 'HR', 'Project', 'ToDo');
   ```

3. **User Experience:**
   - Users see a clean, hospitality-focused interface
   - Navigation is streamlined for hotel operations
   - Irrelevant modules are hidden to reduce confusion

### 2. Restricted Roles Configuration

**What it does:**
```python
"restricted_roles": [
    "Hotel Manager",
    "Receptionist", 
    "Housekeeping Staff"
]
```

**System Impact:**

1. **Role Creation:**
   ```python
   # For each role in the list:
   for role_name in self.data.restricted_roles:
       # Create role if it doesn't exist
       if not frappe.db.get_value("Role", role_name):
           frappe.get_doc(dict(doctype="Role", role_name=role_name)).insert()
       
       # Enable the role
       role = frappe.get_doc("Role", role_name)
       role.disabled = 0
       role.save()
   ```

2. **User Role Assignment:**
   ```python
   # Add roles to current user
   user = frappe.get_doc("User", frappe.session.user)
   for role_name in self.data.restricted_roles:
       user.append("roles", {"role": role_name})
   user.save()
   ```

3. **Database Changes:**
   - New roles are created in the `tabRole` table
   - Roles are enabled (`disabled = 0`)
   - Current user gets these roles assigned

### 3. Custom Fields Configuration

**What it does:**
```python
"custom_fields": {
    "Customer": [
        {
            "fieldname": "preferred_room_type",
            "label": "Preferred Room Type",
            "fieldtype": "Link",
            "options": "Hotel Room Type"
        }
    ]
}
```

**System Impact:**

1. **Custom Field Creation:**
   ```python
   # Creates a custom field in the Customer DocType
   create_custom_fields({
       "Customer": [
           {
               "fieldname": "preferred_room_type",
               "label": "Preferred Room Type", 
               "fieldtype": "Link",
               "options": "Hotel Room Type"
           }
       ]
   })
   ```

2. **Database Changes:**
   - New record in `tabCustom Field` table
   - Field appears in Customer forms
   - Field is linked to "Hotel Room Type" DocType

3. **User Interface:**
   - Customer forms now have a "Preferred Room Type" field
   - Users can select from available room types
   - Field integrates seamlessly with existing Customer functionality

### 4. Modules Configuration

**What it does:**
```python
"modules": [
    "Hospitality Management",
    "Room Booking", 
    "Revenue Management"
]
```

**System Impact:**

1. **Module Restrictions:**
   ```python
   # For each module in the list:
   for module in data.get("modules"):
       frappe.db.set_value("Module Def", module, "restrict_to_domain", "Hospitality")
   ```

2. **Database Changes:**
   ```sql
   UPDATE `tabModule Def` 
   SET restrict_to_domain = 'Hospitality' 
   WHERE name IN ('Hospitality Management', 'Room Booking', 'Revenue Management');
   ```

3. **Access Control:**
   - These modules are only available when Hospitality domain is active
   - Modules are hidden when domain is deactivated
   - Ensures domain-specific functionality

### 5. Properties Configuration

**What it does:**
```python
"properties": [
    {
        "doctype": "Customer",
        "doctype_or_field": "DocField", 
        "fieldname": "customer_type",
        "property": "default",
        "value": "Hotel Guest"
    }
]
```

**System Impact:**

1. **Property Setter Creation:**
   ```python
   # Creates a property setter
   frappe.make_property_setter({
       "doctype": "Customer",
       "doctype_or_field": "DocField",
       "fieldname": "customer_type", 
       "property": "default",
       "value": "Hotel Guest"
   })
   ```

2. **Database Changes:**
   - New record in `tabProperty Setter` table
   - Customer Type field defaults to "Hotel Guest"
   - Affects all new Customer records

3. **User Experience:**
   - When creating new customers, "Customer Type" defaults to "Hotel Guest"
   - Reduces data entry time
   - Ensures consistency in customer categorization

### 6. Set Value Configuration

**What it does:**
```python
"set_value": [
    ["System Settings", None, "allow_guest_to_view", 1]
]
```
This setting, when enabled, allowed guest users (those not logged into the system) to view specific doctypes

**System Impact:**

1. **System Setting Update:**
   ```python
   # Updates System Settings
   for args in self.data.set_value:
       doc = frappe.get_doc(args[0], args[1] or args[0])  # System Settings
       doc.set(args[2], args[3])  # allow_guest_to_view = 1
       doc.save()
   ```

2. **Database Changes:**
   ```sql
   UPDATE `tabSystem Settings` SET allow_guest_to_view = 1;
   ```

3. **System Behavior:**
   - Guest users can view certain content
   - Enables public access to hospitality features
   - Supports guest booking functionality

### 7. Default Portal Role Configuration

**What it does:**
```python
"default_portal_role": "Hotel Guest"
```

**System Impact:**

1. **Portal Settings Update:**
   ```python
   # Updates Portal Settings
   frappe.db.set_single_value(
       "Portal Settings", 
       "default_role", 
       "Hotel Guest"
   )
   ```

2. **Database Changes:**
   ```sql
   UPDATE `tabPortal Settings` SET default_role = 'Hotel Guest';
   ```

3. **Portal Behavior:**
   - New portal users get "Hotel Guest" role by default
   - Determines what guests can see and do
   - Controls portal access permissions

## Complete System Flow

When the Hospitality domain is activated:

1. **Domain Setup Triggered:**
   ```python
   domain = frappe.get_doc("Domain", "Hospitality")
   domain.setup_domain()
   ```

2. **Sequential Processing:**
   - Desktop icons are configured
   - Roles are created and enabled
   - Custom fields are added
   - Modules are restricted
   - Properties are set
   - System values are updated
   - Portal role is configured

3. **Cache Clearing:**
   ```python
   frappe.clear_cache()  # Ensures changes are reflected immediately
   ```

4. **User Interface Updates:**
   - Desktop shows only hospitality-relevant modules
   - Customer forms include room type preferences
   - New customers default to "Hotel Guest" type
   - Portal users get appropriate permissions

## Verification Steps

To verify the configuration is working:

1. **Check Desktop Icons:**
   ```python
   # Should return only the specified modules
   desktop_icons = frappe.get_all("Desktop Icon", filters={"hidden": 0})
   ```

2. **Check Custom Fields:**
   ```python
   # Should show the new field
   custom_fields = frappe.get_all("Custom Field", filters={"dt": "Customer"})
   ```

3. **Check Roles:**
   ```python
   # Should show the new roles
   roles = frappe.get_all("Role", filters={"role_name": ["in", ["Hotel Manager", "Receptionist", "Housekeeping Staff"]]})
   ```

4. **Check System Settings:**
   ```python
   # Should be set to 1
   allow_guest = frappe.db.get_single_value("System Settings", "allow_guest_to_view")
   ```

## Benefits of This Configuration

1. **Focused Interface:** Users see only relevant modules
2. **Role-Based Access:** Proper permissions for different staff types
3. **Customized Data:** Hotel-specific fields and defaults
4. **Guest Access:** Public portal functionality for bookings
5. **Consistency:** Standardized customer categorization
6. **Efficiency:** Reduced training time and data entry errors

This configuration transforms a generic ERP system into a specialized hospitality management system, providing all the tools and workflows needed for hotel operations. 

### Implementation in Frappe Core

Domains are processed by the `Domain` DocType controller in `frappe/core/doctype/domain/domain.py`:

https://github.com/frappe/frappe/blob/develop/frappe/core/doctype/domain/domain.py
