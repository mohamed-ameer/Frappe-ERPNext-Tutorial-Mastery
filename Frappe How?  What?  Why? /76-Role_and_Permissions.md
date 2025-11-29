# Roles and Permissions in Frappe: A Comprehensive Guide

## Overview

Roles and permissions form the foundation of Frappe's access control system. They determine what users can see, create, modify, and delete within the application. Understanding how these components work together is essential for implementing proper security and data access control.

### Core Concepts

**Permission**: A specific right to perform an action on a document or DocType. Common permission types include:
- **Read**: View documents and fields
- **Write**: Modify documents and fields
- **Create**: Create new documents
- **Delete**: Remove documents
- **Submit**: Submit documents (for submittable DocTypes)
- **Cancel**: Cancel submitted documents
- **Amend**: Create amended versions of cancelled documents
- **Report**: Access reports
- **Export**: Export data
- **Import**: Import data
- **Print**: Print documents
- **Email**: Email documents
- **Share**: Share documents with other users

**Role**: A collection of permissions grouped together. Roles represent job functions or responsibilities within an organization. Users are assigned roles, and they inherit all permissions associated with those roles.

**Example:**
- **Role**: Sales User
- **Permissions**: Create, Read, Write, Delete on Sales Order; Read on Customer; Read on Item

**Role Profile**: A collection of roles that can be assigned to users as a group. This simplifies user management by allowing you to assign multiple related roles at once.

**Example:**
- **Role Profile**: Sales Manager
- **Roles**: Sales User, Sales Manager, Report Manager

### Permission Hierarchy

The permission system operates at three distinct levels:

1. **DocType Level**: Controls what actions users can perform on documents of a specific DocType (e.g., can a user create Sales Orders?)
2. **Field Level**: Controls which fields users can see and edit within documents (e.g., can a user see the profit margin field?)
3. **Document Level (User Permissions)**: Controls which specific documents a user can access based on document data (e.g., can a user see only their own Sales Orders?)

**Important**: Everything in Frappe is a document. Permissions can be applied to DocTypes, fields within documents, and individual document records.

## Permission Levels (Permlevel)

Permission levels are a powerful mechanism for controlling field-level access within documents. They allow you to create granular permission rules where different roles can access different sets of fields.

### Understanding Permission Levels

**Permission Level (permlevel)** is a numeric value from 0 to 9 that determines field access:

- **Level 0**: Document-level permissions (primary access to the document)
- **Levels 1-9**: Field-level permissions (access to specific fields)

### How Permission Levels Work

1. **Level 0 is Fundamental**: 
   - Level 0 permissions control basic document access
   - If a role does not have access at Level 0, higher level permissions are meaningless
   - All fields default to permlevel 0 unless explicitly set otherwise
   - Level 0 is checked separately in `get_role_permissions()` which only considers `permlevel == 0` for document-level access

2. **Field-Level Access (Exact Match)**:
   - Each field in a DocType has a `permlevel` property (default: 0)
   - Permission rules specify a `permlevel` (0-9)
   - **Critical**: Permission levels are NOT cumulative by default
   - A user can access a field **only if** their role has permission at that field's exact permlevel
   - The system checks: `field.permlevel in user_allowed_permlevels` (exact match)

3. **Access Logic (Based on Code Implementation)**:
   - The system builds an array of permission objects: `perm[0]`, `perm[1]`, `perm[2]`, etc.
   - Each `perm[level]` contains the permission types (read, write, etc.) granted at that level
   - When checking field access, the system looks up `perm[field.permlevel]`
   - If `perm[field.permlevel]` exists and has the required permission type, access is granted
   - **Important**: Having permission at level 2 does NOT automatically grant access to level 0 or 1 fields
   - You must explicitly grant permissions at each level you want users to access

### Practical Example

Consider a Sales Order DocType with the following fields and permission levels:

**Fields:**
- `customer` (permlevel: 0)
- `order_date` (permlevel: 0)
- `grand_total` (permlevel: 0)
- `discount_percentage` (permlevel: 1)
- `profit_margin` (permlevel: 2)
- `internal_notes` (permlevel: 2)

**Permission Rules:**

1. **Sales User Role**:
   - Level 0: Read, Write, Create
   - Level 1: Read, Write
   - Level 2: Read only

   **Result**: Sales User can:
   - Read and write: `customer`, `order_date`, `grand_total` (level 0)
   - Read and write: `discount_percentage` (level 1)
   - Read only: `profit_margin`, `internal_notes` (level 2)
   - Cannot write to level 2 fields

2. **Sales Manager Role**:
   - Level 0: Read, Write, Create
   - Level 1: Read, Write
   - Level 2: Read, Write

   **Result**: Sales Manager can:
   - Read and write: `customer`, `order_date`, `grand_total` (level 0 - explicit permission)
   - Read and write: `discount_percentage` (level 1 - explicit permission)
   - Read and write: `profit_margin`, `internal_notes` (level 2 - explicit permission)
   - **Note**: Access to all levels is possible because permissions are explicitly set at each level (0, 1, and 2)

3. **Sales Executive Role**:
   - Level 0: Read only

   **Result**: Sales Executive can:
   - Read only: `customer`, `order_date`, `grand_total` (level 0)
   - Cannot see or access fields at level 1 or 2

### Multiple Permission Rules for Same Role

You can create multiple permission rules for the same role on the same DocType with different levels. The system collects all permlevels where the user has permissions.

**How It Works (Based on Code)**:
- The system iterates through all permission rules for the DocType
- For each rule where the user has the role and the permission type (read/write), it adds that permlevel to the allowed list
- The result is a list like `[0, 1, 2]` if the user has permissions at those levels
- Fields are accessible if `field.permlevel in allowed_permlevels` (exact match)

**Example:**

For Sales User role on Sales Order:
- Rule 1: Level 0, Read, Write, Create
- Rule 2: Level 1, Read, Write
- Rule 3: Level 2, Read only

**System Processing**:
1. Checks user's roles against permission rules
2. Collects permlevels: `[0, 1, 2]` (user has permissions at these levels)
3. For each field, checks if `field.permlevel in [0, 1, 2]`

**User Access**:
- Read, Write, Create at level 0 (fields with permlevel 0)
- Read, Write at level 1 (fields with permlevel 1)
- Read only at level 2 (fields with permlevel 2)

**Important**: If you only set Level 2 permissions without Level 0, the user cannot access the document at all (no Level 0 = no document access), even though they have Level 2 permissions.

### Setting Field Permission Levels

Field permission levels are set using the **Customize Form** tool:

1. Go to **Setup > Customize > Customize Form**
2. Select the DocType
3. Select the field
4. Set the **Permission Level** field (0-9)
5. Save

**Note**: Fields without an explicit permlevel default to 0.

### Technical Implementation Details

Understanding how the system implements permission levels helps clarify the behavior:

**JavaScript Side (`frappe.model.perm.js`)**:
1. **Permission Array Structure**: The system builds a sparse array `perm[]` where:
   - `perm[0]` = permission object for level 0
   - `perm[1]` = permission object for level 1
   - `perm[2]` = permission object for level 2
   - etc.
2. **Building Permissions**: For each permission rule:
   ```javascript
   const permlevel = cint(p.permlevel);
   const current_perm = (perm[permlevel] ??= { permlevel });
   // If user has the role, add permission types to perm[permlevel]
   ```
3. **Field Access Check**: When checking field access:
   ```javascript
   if (!df.permlevel) df.permlevel = 0;  // Default to 0
   let p = perm[df.permlevel];  // Look up permission at field's exact level
   if (p && p.read) { /* grant read access */ }
   if (p && p.write) { /* grant write access */ }
   ```
   **Key**: It looks up `perm[field.permlevel]` - an exact match, not cumulative.

**Python Side (`frappe.model.meta.py` and `frappe.model.document.py`)**:
1. **Collecting Allowed Levels**: 
   ```python
   def get_permlevel_access(self, permission_type="read"):
       allowed_permlevels = []
       for perm in self.get_permissions():
           if perm.role in roles and perm.get(permission_type):
               if perm.permlevel not in allowed_permlevels:
                   allowed_permlevels.append(perm.permlevel)
       return allowed_permlevels
   ```
   Returns a list like `[0, 1, 2]` - all permlevels where user has the permission type.

2. **Field Access Check**:
   ```python
   def has_permlevel_access_to(self, fieldname, permission_type="read"):
       df = self.meta.get_field(fieldname)
       return df.permlevel in self.get_permlevel_access(permission_type)
   ```
   **Key**: Checks if `field.permlevel in allowed_permlevels` - exact match.

3. **Field Filtering**:
   ```python
   permitted_fieldnames.extend(
       df.fieldname
       for df in self.get_fieldnames_with_value()
       if df.permlevel in permlevel_access  # Exact match check
   )
   ```

**Validation on Save** (`frappe.model.document.py`):
- When saving a document, the system validates higher permlevel fields
- If a user tries to modify a field at a permlevel they don't have access to, the value is reset to the original/default value
- This prevents users from bypassing permission checks by manipulating the form

**Key Takeaway**: The implementation uses exact matching (`field.permlevel in allowed_permlevels`), not cumulative access. You must explicitly grant permissions at each level you want users to access.

### Best Practices for Permission Levels

1. **Always Set Level 0 First**: Level 0 is mandatory for document access. Without it, users cannot access the document regardless of higher level permissions.

2. **Grant Permissions at Each Level Needed**: Since permission levels are not cumulative, you must explicitly grant permissions at each level you want users to access. For example:
   - If you want users to access level 0, 1, and 2 fields, create permission rules at all three levels
   - Simply granting level 2 does NOT grant access to level 0 or 1

3. **Use Consistent Level Scheme**: Establish a consistent level scheme across your application:
   - Level 0: Standard document fields (default)
   - Level 1: Standard editable fields
   - Level 2: Sensitive/restricted fields
   - Level 3+: Admin-only or highly restricted fields

4. **Common Pattern**: Most implementations grant permissions at multiple levels for the same role:
   ```
   Role: Sales User
   - Level 0: Read, Write, Create (for basic fields)
   - Level 1: Read, Write (for standard editable fields)
   - Level 2: Read only (for sensitive fields)
   ```
   This pattern gives the appearance of cumulative access, but it's actually explicit permissions at each level.

5. **Test Field Access**: After setting permission levels, test with different roles to verify:
   - Fields at each level are accessible as intended
   - Users without specific level permissions cannot access those fields
   - Level 0 access is working (without it, nothing works)

6. **Avoid Over-Complication**: Most use cases can be handled with levels 0, 1, and 2. Only use higher levels (3-9) if you have complex permission requirements.

## Permission Management Tools

Frappe provides several tools to help you manage and debug permissions:

### 1. Permission Inspector

A powerful debugging tool that helps you understand why a user has or doesn't have a specific permission.

**Location**: `/app/permission-inspector`

**What it does**:
- Tests permission for a specific combination of: DocType, Document, User, and Permission Type
- Provides detailed logs explaining why permissions are granted or denied
- Shows all roles the user has
- Shows all permission rules that apply
- Identifies which rules are matching and which are not

**When to use**:
- Debugging permission issues
- Understanding complex permission scenarios
- Verifying permission configurations
- Troubleshooting access problems

**Reference**: [GitHub PR #24239](https://github.com/frappe/frappe/pull/24239)

### 2. Role Permission Manager

A tool for reviewing and managing permissions for a specific role on a specific DocType.

**Location**: `/app/permission-manager`

**What it does**:
- Shows all permission rules for a role on a DocType
- Allows adding new permission rules
- Allows modifying existing permission rules
- Allows removing permission rules
- Shows permission levels and all permission types

**When to use**:
- Managing permissions for core/system DocTypes
- Reviewing all permissions for a role at once
- Bulk permission management

**Note**: For custom DocTypes, it's generally better to manage permissions directly in the DocType's Permission Manager.

**Key Features**:
- **If user is the owner**: When checked, the permission rule only applies if the user is the document owner
- **Level**: The permission level (0-9) for this rule
- **Permission Types**: Checkboxes for Read, Write, Create, Delete, Submit, Cancel, Amend, etc.

### 3. Role Permission for Page and Report

A tool for managing which roles can access specific pages and reports.

**Location**: `/app/role-permission-for-page-and-report`

**What it does**:
- Controls access to custom pages
- Controls access to reports
- Allows setting permissions per role

**When to use**:
- Restricting report access
- Restricting page access
- Managing visibility of custom pages

### 4. User Permissions

A mechanism for restricting users to specific document records based on linked document values.

**Location**: `/app/user-permission`

**What it does**:
- Limits users to specific records/document of a DocType
- Applies document-level filtering

**When to use**:
- Any scenario requiring document-level filtering

**How it works**:
1. Create a User Permission record
2. Select the User
3. Select the "Allow" DocType (what to restrict)
4. Select the "For Value" (specific record to allow)
5. Optionally select "Apply To" DocTypes (where to apply this restriction)

### 5. Permitted Documents For User

A search tool that shows only the documents a specific user can access.

**Location**: **Report > Permitted Documents For User**

**What it does**:
- Acts as a search tool filtered by user permissions
- Shows only documents the selected user can see
- Useful for testing and verification

**When to use**:
- Testing user access
- Verifying permission configurations
- Debugging document visibility issues
- Understanding what a user can see

**How to use**:
1. Select a User
2. Select a DocType
3. View the list of documents the user can access
4. Compare with expected results

## Permission Manager in DocType

Each DocType has a built-in Permission Manager where you can define permission rules directly.

**Location**: In any DocType form, go to the "Permissions" section

**What it does**:
- Define permission rules for the DocType
- Set roles and permission levels
- Configure permission types (Read, Write, Create, etc.)
- Set "If user is the owner" conditions

**When to use**:
- Managing permissions for custom DocTypes
- Setting up new DocTypes
- Modifying permissions during development

**Best Practice**: Use the DocType Permission Manager for custom DocTypes, and Role Permission Manager for core/system DocTypes.

## Permission Types Explained

### Document-Level Permissions

- **Select**: Minimal permission to select a document in a link field (very limited access)
- **Read**: View documents and their data
- **Write**: Modify existing documents
- **Create**: Create new documents
- **Delete**: Remove documents
- **Submit**: Submit documents (for submittable DocTypes)
- **Cancel**: Cancel submitted documents
- **Amend**: Create amended versions of cancelled documents

### Additional Permissions

- **Report**: Access and run reports for this DocType
- **Import**: Import data into this DocType
- **Export**: Export data from this DocType
- **Print**: Print documents
- **Email**: Email documents
- **Share**: Share documents with other users
- **Set User Permissions**: Allow users to set User Permissions for others on this DocType

## Common Permission Patterns

### Pattern 1: Basic User Access
- Level 0: Read, Write, Create
- Result: User can access all standard fields and perform basic operations

### Pattern 2: Read-Only User
- Level 0: Read only
- Result: User can view documents but cannot modify them

### Pattern 3: Field-Level Restrictions
- Level 0: Read, Write, Create
- Level 1: Read, Write (for standard editable fields)
- Level 2: Read only (for sensitive fields)
- Result: User can edit standard fields but only view sensitive fields

### Pattern 4: Owner-Based Access
- Level 0: Read, Write, Create (If user is the owner)
- Result: User can only access documents they created

### Pattern 5: Multi-Level Access
- Level 0: Read, Write, Create
- Level 1: Read, Write
- Level 2: Read only
- Level 3: Read, Write (for admin fields)
- Result: Granular control over different field groups

## Important Notes

1. **Administrator Role**: The Administrator role bypasses all permission checks. Use with caution.

2. **Permission Caching**: Permissions are cached for performance. After modifying permissions, you may need to clear cache or wait for cache expiration.

3. **Child Table Permissions**: Child table DocTypes inherit permissions from their parent DocType. You typically don't set permissions directly on child tables.

4. **Permission Inheritance**: Users inherit permissions from all their roles. If any role grants a permission, the user has it.

5. **Permission Denial**: Permissions are additive. You cannot "deny" a permission - you can only grant or not grant it.

6. **Level 0 Requirement**: Always ensure Level 0 permissions exist. Without Level 0 access, users cannot access the document at all, regardless of higher level permissions.

## Conclusion

Understanding roles and permissions in Frappe is crucial for building secure and well-organized applications. The permission level system provides powerful field-level access control, while User Permissions enable document-level filtering. By combining these mechanisms, you can create sophisticated access control scenarios that match your organizational needs.

Remember:
- **Roles** = Groups of permissions
- **Permission Levels** = Field access control (0 = document, 1-9 = fields)
- **User Permissions** = Document-level filtering
- **Level 0** = Foundation (must have this to access the document)
- **Higher Levels** = Additional field access (requires explicit permissions at each level)
- **Exact Match**: Fields are accessible only if the user has permission at that field's exact permlevel
- **Not Cumulative**: Having permission at level 2 does NOT automatically grant access to level 0 or 1 fields

Use the available tools (Permission Inspector, Role Permission Manager, etc.) to manage and debug your permission configurations effectively.
