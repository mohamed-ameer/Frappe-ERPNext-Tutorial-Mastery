# Roles and Permissions in Frappe: A Comprehensive Guide

## Overview

Roles and permissions form the foundation of Frappe's access control system. They determine what users can see, create, modify, and delete within the application. Understanding how these components work together is essential for implementing proper security and data access control.

### Core Concepts

**Permission**: A specific right to perform an action on a document or DocType. In Frappe's architecture, permissions are stored as **DocPerm** records (or **Custom DocPerm** for custom DocTypes) that define what actions a role can perform. Each permission rule specifies:
- The **Role** that has the permission
- The **DocType** (or parent DocType) it applies to
- The **Permission Level (permlevel)** - determines field-level access (0-9)
- The **Permission Types** - what actions are allowed (read, write, create, etc.)
- **If Owner** flag - whether the permission only applies when the user is the document owner

Common permission types include:
- **Read**: View documents and fields. This is the most fundamental permission - without read access, users cannot see documents at all. Read permission is checked when loading documents, displaying lists, and accessing reports.
- **Write**: Modify documents and fields. Write permission allows users to change field values, but only for fields at permission levels they have write access to. Write permission is validated both on the client-side (JavaScript) and server-side (Python) when saving documents.
- **Create**: Create new documents. This permission is required to create new document records. Note that create permission is always checked at level 0, regardless of field permlevels.
- **Delete**: Remove documents. Delete permission allows users to permanently remove documents from the system. This is a destructive operation and should be granted carefully.
- **Submit**: Submit documents (for submittable DocTypes). Submit permission allows users to change a document's status from "Draft" to "Submitted". Once submitted, documents become read-only unless "Allow on Submit" is enabled for specific fields.
- **Cancel**: Cancel submitted documents. Cancel permission allows users to cancel submitted documents, changing their status from "Submitted" to "Cancelled".
- **Amend**: Create amended versions of cancelled documents. Amend permission allows users to create new documents based on cancelled documents, preserving the original document's data.
- **Report**: Access reports. Report permission allows users to run and view reports for the DocType. This is separate from read permission - a user might have report access without read access to individual documents.
- **Export**: Export data. Export permission allows users to export document data to CSV, Excel, or other formats.
- **Import**: Import data. Import permission allows users to bulk import data into the DocType using data import tools.
- **Print**: Print documents. Print permission allows users to generate PDF print formats for documents.
- **Email**: Email documents. Email permission allows users to send documents via email directly from Frappe.
- **Share**: Share documents with other users. Share permission allows users to grant temporary access to specific documents to other users, bypassing role-based permissions.

**Role**: A collection of permissions grouped together. Roles represent job functions or responsibilities within an organization. In Frappe, roles are stored in the **Role** DocType and can be either system roles (built into Frappe/ERPNext) or custom roles (created by users). Users are assigned roles through the **User** DocType's "Roles" child table, and they inherit all permissions associated with those roles. 

**Important**: Permissions are additive across roles. If a user has multiple roles, they get the union (combination) of all permissions from all their roles. For example, if Role A grants Read permission and Role B grants Write permission, a user with both roles will have both Read and Write permissions.

**Example:**
- **Role**: Sales User
- **Permissions**: Create, Read, Write, Delete on Sales Order; Read on Customer; Read on Item

**Role Profile**: A collection of roles that can be assigned to users as a group. This simplifies user management by allowing you to assign multiple related roles at once. When a role profile is assigned to a user, all roles within that profile are automatically assigned. Role profiles are particularly useful when you have standard sets of roles that are commonly assigned together (e.g., "Sales Manager" might always include "Sales User", "Sales Manager", and "Report Manager" roles).

**Example:**
- **Role Profile**: Sales Manager
- **Roles**: Sales User, Sales Manager, Report Manager

### Permission Hierarchy

The permission system operates at three distinct levels, each serving a different purpose in the access control mechanism:

1. **DocType Level**: Controls what actions users can perform on documents of a specific DocType (e.g., can a user create Sales Orders?). This is the foundation level - without DocType-level permissions, users cannot access the DocType at all. DocType-level permissions are defined through **DocPerm** records and specify:
   - Which roles can access the DocType
   - What actions they can perform (read, write, create, delete, submit, etc.)
   - Whether these permissions apply only when the user is the document owner ("If Owner" flag)
   - The permission level (permlevel) - typically 0 for DocType-level access

2. **Field Level**: Controls which fields users can see and edit within documents (e.g., can a user see the profit margin field?). Field-level permissions are controlled through **permission levels (permlevels)** - each field has a permlevel (0-9), and users can only access fields at permlevels where their roles have permissions. This allows fine-grained control over sensitive data within documents. For example, a Sales User might see customer and order date (level 0) but not profit margin (level 2).

3. **Document Level (User Permissions)**: Controls which specific documents a user can access based on document data (e.g., can a user see only their own Sales Orders?). User Permissions are implemented through the **User Permission** DocType and allow you to restrict users to specific document records based on linked document values. For example, you can restrict a user to only see Sales Orders where the Customer field matches specific customers they have permission for. User Permissions work by filtering database queries - when a user queries a DocType, the system automatically adds WHERE conditions based on their User Permissions.

**Important**: Everything in Frappe is a document. Permissions can be applied to DocTypes, fields within documents, and individual document records. The permission system checks all three levels when determining access:
- First, it checks if the user has DocType-level permission (can they access this DocType at all?)
- Then, it checks field-level permissions (which fields can they see/edit?)
- Finally, it applies User Permissions (which specific document records can they access?)

## Permission Levels (Permlevel)

Permission levels are a powerful mechanism for controlling field-level access within documents. They allow you to create granular permission rules where different roles can access different sets of fields. This system enables scenarios like allowing sales staff to see customer information but hiding profit margins from them.

### Understanding Permission Levels

**Permission Level (permlevel)** is a numeric value from 0 to 9 that determines field access. Each field in a DocType has a `permlevel` property that specifies which permission level controls access to that field. Similarly, each permission rule (DocPerm) has a `permlevel` property that specifies which level of fields it controls.

- **Level 0**: Document-level permissions (primary access to the document). Level 0 is special - it controls basic document access. Without level 0 permissions, users cannot access the document at all, regardless of permissions at higher levels. All fields default to permlevel 0 unless explicitly set otherwise. Level 0 permissions are checked separately in `get_role_permissions()` - the Python function `get_role_permissions()` only considers `permlevel == 0` when determining document-level access. This is why level 0 is fundamental - it's the gateway to the document.

- **Levels 1-9**: Field-level permissions (access to specific fields). These levels allow you to create hierarchical permission structures where different roles can access different sets of fields. For example:
  - Level 1: Standard editable fields (e.g., discount percentage)
  - Level 2: Sensitive fields (e.g., profit margin, internal notes)
  - Level 3+: Highly restricted/admin-only fields

**Important Distinction**: Permission levels are **NOT** cumulative. Having permission at level 2 does NOT automatically grant access to level 0 or 1 fields. Each level must be explicitly granted. This is a critical concept that many developers misunderstand - the system uses exact matching (`field.permlevel in allowed_permlevels`), not hierarchical inheritance.

### How Permission Levels Work

Understanding the internal mechanics helps clarify why permission levels behave the way they do:

1. **Level 0 is Fundamental**: 
   - Level 0 permissions control basic document access. This is checked first and is a prerequisite for all other permissions.
   - If a role does not have access at Level 0, higher level permissions are meaningless because the user cannot even load or view the document.
   - All fields default to permlevel 0 unless explicitly set otherwise in the field definition.
   - Level 0 is checked separately in `get_role_permissions()` which only considers `permlevel == 0` for document-level access. This function (`frappe.permissions.get_role_permissions()`) filters permission rules to only those with `permlevel == 0` when determining if a user can access a DocType at all.
   - The Python code explicitly filters: `cint(perm.permlevel) == 0` - this ensures level 0 is treated as document-level access, distinct from field-level access.

2. **Field-Level Access (Exact Match)**:
   - Each field in a DocType has a `permlevel` property stored in the **DocField** record (default: 0 if not specified).
   - Permission rules (DocPerm records) specify a `permlevel` (0-9) that determines which fields they control.
   - **Critical**: Permission levels are NOT cumulative by default. This is a fundamental design decision in Frappe's permission system.
   - A user can access a field **only if** their role has permission at that field's exact permlevel. The system performs an exact match check: `field.permlevel in user_allowed_permlevels`.
   - The system first collects all permlevels where the user has the required permission type (read/write), then checks if each field's permlevel is in that list.

3. **Access Logic (Based on Code Implementation)**:

   **JavaScript Side (`frappe.model.perm.js`)**:
   - The system builds a sparse array of permission objects: `perm[0]`, `perm[1]`, `perm[2]`, etc.
   - Each `perm[level]` is an object containing the permission types (read, write, create, etc.) granted at that level.
   - The array is built by iterating through all permission rules (`meta.permissions`) and grouping them by permlevel.
   - When checking field access, the system looks up `perm[field.permlevel]` - a direct array lookup, not a range check.
   - If `perm[field.permlevel]` exists and has the required permission type (e.g., `perm[2].read === 1`), access is granted.
   - **Important**: Having permission at level 2 does NOT automatically grant access to level 0 or 1 fields because the lookup is exact: `perm[df.permlevel]` - if `df.permlevel` is 0, it looks at `perm[0]`, not `perm[2]`.

   **Python Side (`frappe.model.meta.py`)**:
   - The `get_permlevel_access()` method collects all permlevels where the user has the specified permission type.
   - It iterates through all permission rules, checks if the user's roles match, and collects unique permlevels.
   - Returns a list like `[0, 1, 2]` - all permlevels where the user has access.
   - Field access is then checked with: `df.permlevel in allowed_permlevels` - an exact membership test.
   - This means a field with `permlevel=1` is only accessible if `1` is in the `allowed_permlevels` list - having `2` in the list doesn't help.

   **Key Takeaway**: The implementation uses exact matching (`field.permlevel in allowed_permlevels`), not cumulative access. You must explicitly grant permissions at each level you want users to access. This design provides maximum security and control but requires careful planning when setting up permissions.

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
3. Select the field you want to restrict
4. Set the **Permission Level** field (0-9) - this determines which permission level controls access to this field
5. Save the customization

**Important Notes**:
- Fields without an explicit permlevel default to 0, meaning they're controlled by level 0 permissions.
- Changing a field's permlevel affects all users - make sure you've set up permission rules at the new level for roles that should access the field.
- You can set different permlevels for different fields - for example, customer (0), discount (1), profit margin (2).
- After changing permlevels, you may need to clear cache or wait for cache expiration for changes to take effect.

**Best Practice**: Plan your permlevel structure before customizing fields. A common pattern is:
- Level 0: Basic fields everyone needs (customer, date, total)
- Level 1: Standard editable fields (discount, notes)
- Level 2: Sensitive fields (profit margin, cost)
- Level 3+: Admin-only fields (internal flags, system fields)

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
- When saving a document, the system validates higher permlevel fields in `validate_higher_perm_levels()`
- This method is called during document save/update operations
- It collects all permlevels the user has write access to: `has_access_to = self.get_permlevel_access("write")`
- It identifies fields with high permlevels: `high_permlevel_fields = self.meta.get_high_permlevel_fields()`
- For each high permlevel field that the user doesn't have access to, it resets the value:
  - If the document is new, it sets the default value from `frappe.new_doc()`
  - If the document exists, it resets to the original value from `self.get_latest()`
- This prevents users from bypassing permission checks by manipulating form data or making direct API calls
- The validation happens server-side, so it cannot be bypassed by client-side manipulation

**Key Takeaway**: The implementation uses exact matching (`field.permlevel in allowed_permlevels`), not cumulative access. You must explicitly grant permissions at each level you want users to access. This design provides maximum security and granular control but requires careful planning when setting up permissions.

### Permission Checking Flow

Understanding the complete permission checking flow helps clarify how all components work together:

**1. Document Load/Query Flow**:
```
User requests document/list
    ↓
Check if user is Administrator → Yes → Grant all access
    ↓ No
Get role permissions (get_role_permissions) → Check permlevel 0
    ↓
If no level 0 access → Check share permissions
    ↓
Apply "if owner" restrictions if applicable
    ↓
Apply User Permissions filtering (document-level)
    ↓
Filter fields by permlevel access (field-level)
    ↓
Return permitted documents/fields
```

**2. Field Access Check Flow** (JavaScript):
```
User interacts with field
    ↓
Get permission array (get_perm) → Build perm[0], perm[1], perm[2], etc.
    ↓
Get field's permlevel (default: 0)
    ↓
Look up perm[field.permlevel] → Exact match lookup
    ↓
Check if perm[field.permlevel].read/write exists
    ↓
Apply additional checks (hidden, read_only, docstatus, workflow)
    ↓
Return field display status: "Read", "Write", or "None"
```

**3. Document Save Flow**:
```
User saves document
    ↓
Validate role permissions → Check write permission at level 0
    ↓
Validate field-level permissions → Check write permission at each field's permlevel
    ↓
Validate higher permlevel fields → Reset values user cannot modify
    ↓
Apply User Permissions check → Ensure user can modify this document
    ↓
Save document
```

**4. User Permission Filtering Flow** (Database Query):
```
User queries DocType
    ↓
Get User Permissions for user → Cached in frappe.cache
    ↓
Identify link fields in DocType that match User Permission "Allow" DocTypes
    ↓
Build WHERE conditions based on User Permissions
    ↓
Add conditions to SQL query: WHERE customer IN ("ABC Corp", "XYZ Ltd")
    ↓
Execute query with filters
    ↓
Return filtered results
```

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
- **If user is the owner**: When checked, the permission rule only applies if the user is the document owner. This is a powerful feature for implementing owner-based access control. When enabled:
  - The permission only applies when `doc.owner == user` (case-insensitive comparison)
  - If the user is NOT the owner, the permission is effectively denied
  - This is tracked through `rights_without_if_owner` in JavaScript - permissions without "if_owner" are added to this set
  - In Python, this is handled through the `if_owner` parameter in `get_role_permissions()` and affects the returned permission dictionary
  - **Important**: "If owner" permissions work differently for "create" - create permission cannot be owner-based because documents don't have owners until they're created
- **Level**: The permission level (0-9) for this rule. This determines which fields this permission rule controls.
- **Permission Types**: Checkboxes for Read, Write, Create, Delete, Submit, Cancel, Amend, etc. You can grant different permission types at different levels - for example, Read at level 0, Write at level 1, Read-only at level 2.

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

A mechanism for restricting users to specific document records based on linked document values. User Permissions provide document-level filtering that works alongside role-based permissions.

**Location**: `/app/user-permission`

**What it does**:
- Limits users to specific records/document of a DocType
- Applies document-level filtering by automatically adding WHERE conditions to database queries
- Works by checking link fields in documents - if a document has a link field that matches a User Permission, the user can access that document
- Supports nested set (tree) DocTypes - if a user has permission for a parent node, they can access child nodes (unless `hide_descendants` is enabled)

**When to use**:
- Restricting users to specific customers, companies, territories, etc.
- Multi-tenant scenarios where users should only see their organization's data
- Department-based access control
- Any scenario requiring document-level filtering based on linked document values

**How it works** (Technical Details):

1. **Creating User Permissions**:
   - Create a User Permission record
   - Select the **User** - the user this restriction applies to
   - Select the **"Allow" DocType** - the DocType being restricted (e.g., "Customer")
   - Select the **"For Value"** - the specific document name/record to allow (e.g., "ABC Corp")
   - Optionally select **"Apply To" DocTypes** - where to apply this restriction (e.g., "Sales Order", "Invoice"). If not specified, applies to all DocTypes that have a link field to the "Allow" DocType
   - Optionally set **"Is Default"** - marks this as the default value for the user
   - Optionally set **"Hide Descendants"** - for tree DocTypes, prevents access to child nodes

2. **How User Permissions are Applied**:
   - User Permissions are cached per user for performance (`frappe.cache.hget("user_permissions", user)`)
   - When a user queries a DocType, the system checks if there are User Permissions for linked DocTypes
   - For each link field in the DocType that matches a User Permission's "Allow" DocType, the system builds a filter
   - The filter restricts results to documents where the link field value matches one of the user's allowed values
   - This happens in `DatabaseQuery.build_match_conditions()` - it adds WHERE conditions based on User Permissions

3. **Example**:
   - User Permission: User="john@example.com", Allow="Customer", For Value="ABC Corp", Apply To="Sales Order"
   - When John queries Sales Orders, the system automatically adds: `WHERE customer = "ABC Corp"`
   - John can only see Sales Orders for ABC Corp, even if he has Read permission on Sales Order DocType

4. **Strict User Permissions**:
   - System Setting: "Apply Strict User Permissions"
   - When enabled, User Permissions are enforced more strictly
   - For non-tree DocTypes, users can only access documents that match ALL applicable User Permissions
   - For tree DocTypes, users can access parent nodes and their descendants (unless `hide_descendants` is set)

5. **Interaction with Role Permissions**:
   - User Permissions work **in addition to** role permissions, not instead of
   - A user must have role-based permission (e.g., Read on Sales Order) AND User Permission (e.g., Customer = ABC Corp)
   - If a user has role permission but no User Permission, they can access all documents (subject to role permissions)
   - If a user has User Permission but no role permission, they cannot access any documents
   - User Permissions can further restrict access but cannot grant access beyond role permissions

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

## 6. Share Permission (the Temporary Permission Access)

Share permissions provide a mechanism for granting temporary, document-specific access to users who don't have role-based permissions. This is useful for collaboration scenarios where you need to give someone access to a specific document without modifying their roles or creating User Permissions.

**Location**: Available through the "Share" button on document forms, or programmatically via `frappe.share.add()`

**What it does**:
- Grants temporary access to specific documents, bypassing role-based permissions
- Allows you to give access to a specific document to a specific user without modifying roles
- Supports different permission types: Read, Write, Submit, Share
- Can be revoked at any time
- Works alongside role permissions - if a user has role permission, they don't need share permission

**How it works** (Technical Details):

1. **Creating Shares**:
   - Shares are stored in the **DocShare** DocType
   - Each share record links: User, DocType, Document Name, and Permission Types
   - Shares can be created through the UI (Share button) or programmatically
   - When sharing, you specify which permissions to grant: Read, Write, Submit, Share

2. **Share Permission Checking**:
   - When checking permissions, the system first checks role permissions
   - If role permissions don't grant access, the system checks share permissions
   - Share permissions are checked in `frappe.share.get_shared()` which queries DocShare records
   - If a share exists for the user and document, the specified permissions are granted
   - Share permissions are applied in `get_doc_permissions()` - they override or supplement role permissions

3. **JavaScript Implementation**:
   - In `frappe.model.perm.js`, shares are checked when loading document permissions
   - If `docinfo.shared` contains a share for the current user, permissions are applied
   - Share permissions can grant Read, Write, Submit, and Share rights
   - If share grants Read, Print and Email permissions are also granted (if available globally)

4. **Python Implementation**:
   - `frappe.share.get_shared()` retrieves shared documents for a user
   - Share permissions are checked in `has_permission()` after role permissions
   - If a user has share permission but no role permission, they can still access the document
   - Share permissions work at the document level, not DocType level

5. **Use Cases**:
   - Collaborating on a specific document with someone outside your department
   - Granting temporary access for review/approval
   - Sharing documents with external stakeholders
   - Cross-departmental collaboration on specific projects

6. **Important Notes**:
   - Shares are document-specific - sharing one Sales Order doesn't grant access to other Sales Orders
   - Shares can be revoked at any time by removing the DocShare record
   - Share permissions work alongside User Permissions - both are checked
   - Shares don't grant DocType-level permissions - users still need role permissions for general access
   - Share permissions are cached for performance

**Best Practice**: Use shares for temporary, document-specific access. For permanent access patterns, use role permissions or User Permissions instead.

---

## Permission Manager in DocType

Each DocType has a built-in Permission Manager where you can define permission rules directly. This is the primary interface for managing permissions during development and for custom DocTypes.

**Location**: In any DocType form, go to the "Permissions" section (child table)

**What it does**:
- Define permission rules for the DocType through the Permissions child table
- Set roles and permission levels (0-9)
- Configure permission types (Read, Write, Create, Delete, Submit, Cancel, Amend, Report, Import, Export, Print, Email, Share, Set User Permissions)
- Set "If user is the owner" conditions
- Each row in the Permissions table represents one permission rule

**When to use**:
- Managing permissions for custom DocTypes (recommended)
- Setting up new DocTypes during development
- Modifying permissions during development
- Creating permission rules specific to your application

**Best Practice**: Use the DocType Permission Manager for custom DocTypes, and Role Permission Manager (`/app/permission-manager`) for core/system DocTypes. This separation helps maintain clarity between custom and system permissions.

**Understanding DocPerm vs Custom DocPerm**:
- **DocPerm**: System permission rules stored in the `tabDocPerm` table. These are part of the core Frappe/ERPNext system and are typically managed through the Role Permission Manager.
- **Custom DocPerm**: Custom permission rules stored in the `tabCustom DocPerm` table. These are created when you customize permissions for custom DocTypes or modify permissions for system DocTypes. Custom DocPerm records override DocPerm records when both exist.
- When checking permissions, the system first looks for Custom DocPerm records, then falls back to DocPerm records if no custom records exist.
- This allows you to customize permissions without modifying core system files.

## Permission Types Explained

Permission types define what actions users can perform. Each permission type is checked independently, and having one permission type doesn't automatically grant another (with some exceptions noted below).

### Document-Level Permissions

- **Select**: Minimal permission to select a document in a link field (very limited access). This is the most restrictive permission - it only allows selecting documents in dropdown/link fields, not viewing full documents or lists. Select permission is useful when you want users to be able to reference documents but not view their details. When a user only has Select permission, they can see the document name in link fields but cannot open the document form or view its fields.

- **Read**: View documents and their data. Read permission is fundamental - without it, users cannot see documents at all. Read permission allows:
  - Viewing document forms
  - Viewing document lists
  - Accessing document data through APIs
  - Viewing fields (subject to field-level permissions)
  - Read permission is checked first in most permission checks - if a user doesn't have Read, they typically cannot perform other actions

- **Write**: Modify existing documents. Write permission allows users to change field values in existing documents. However, write access is further restricted by:
  - Field-level permissions (permlevels) - users can only write to fields at permlevels they have write access to
  - Document status - submitted documents are typically read-only unless "Allow on Submit" is enabled for specific fields
  - Workflow states - fields controlled by workflows may be read-only in certain states
  - Write permission is validated both client-side (JavaScript) and server-side (Python) when saving

- **Create**: Create new documents. Create permission allows users to create new document records. Create permission is always checked at level 0, regardless of field permlevels. When creating documents:
  - Users can set values for fields at permlevels they have write access to
  - Fields at permlevels without write access use default values or remain empty
  - Create permission is required to access the "New" button and create new records

- **Delete**: Remove documents. Delete permission allows users to permanently remove documents from the system. This is a destructive operation:
  - Deleted documents are moved to the "Deleted" state (soft delete)
  - They can be restored if needed
  - Delete permission is typically restricted to administrators or managers
  - Submitted documents usually cannot be deleted (must be cancelled first)

- **Submit**: Submit documents (for submittable DocTypes). Submit permission allows users to change a document's status from "Draft" (docstatus=0) to "Submitted" (docstatus=1). Once submitted:
  - Documents become read-only by default
  - Fields with "Allow on Submit" enabled can still be edited
  - Submit permission only applies to DocTypes where `is_submittable=1`
  - Submitted documents typically trigger workflows and affect related documents

- **Cancel**: Cancel submitted documents. Cancel permission allows users to change a document's status from "Submitted" (docstatus=1) to "Cancelled" (docstatus=2). Cancelled documents:
  - Are read-only
  - Cannot be modified
  - Can be used as the basis for amended documents
  - Typically reverse the effects of the original document

- **Amend**: Create amended versions of cancelled documents. Amend permission allows users to create new documents based on cancelled documents. This is useful for:
  - Correcting errors in cancelled documents
  - Creating replacement documents
  - Preserving audit trails
  - Amend creates a new document with data from the cancelled document

### Additional Permissions

- **Report**: Access and run reports for this DocType. Report permission is separate from Read permission - a user might have Report access without Read access to individual documents. Report permission allows:
  - Running standard reports
  - Running custom reports
  - Viewing report data (subject to User Permissions filtering)
  - Exporting report data (if Export permission is also granted)

- **Import**: Import data into this DocType. Import permission allows users to bulk import data using:
  - Data Import tool
  - Import via API
  - CSV/Excel import
  - Import permission is typically restricted to administrators or data managers
  - The DocType must have `allow_import=1` for import to work

- **Export**: Export data from this DocType. Export permission allows users to export document data to:
  - CSV format
  - Excel format
  - Other export formats
  - Export respects User Permissions - users can only export documents they have access to
  - Export permission works alongside Read permission

- **Print**: Print documents. Print permission allows users to generate PDF print formats for documents. Print permission:
  - Allows accessing print formats
  - Allows generating PDFs
  - Works with Read permission - users need Read to print
  - Can be granted independently for fine-grained control

- **Email**: Email documents. Email permission allows users to send documents via email directly from Frappe. Email permission:
  - Allows using the "Email" button on documents
  - Allows sending documents as PDF attachments
  - Requires Read permission to work
  - Can be restricted to prevent unauthorized document sharing

- **Share**: Share documents with other users. Share permission allows users to grant temporary access to specific documents to other users. Share permission:
  - Allows creating DocShare records
  - Allows sharing documents with specific users
  - Works alongside role permissions
  - Can be restricted to prevent unauthorized sharing

- **Set User Permissions**: Allow users to set User Permissions for others on this DocType. This is a meta-permission that controls who can create User Permission records. This permission:
  - Allows creating User Permission records for the DocType
  - Typically restricted to administrators or HR managers
  - Controls access to the User Permission management interface

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

### Pattern 6: Owner-Based with Field Restrictions
- Level 0: Read, Write, Create (If user is the owner)
- Level 1: Read, Write (If user is the owner)
- Level 2: Read only (for all users)
- Result: Users can only edit their own documents, but everyone can view sensitive fields

### Pattern 7: Department-Based Access with User Permissions
- Role Permissions: Level 0: Read, Write, Create on Sales Order
- User Permissions: Restrict to specific Customers or Territories
- Result: Users can access Sales Orders but only for their assigned customers/territories

### Pattern 8: Read-Only with Selective Write
- Level 0: Read only
- Level 1: Read, Write (for specific editable fields)
- Result: Users can view all documents but only edit specific fields

## Important Notes

1. **Administrator Role**: The Administrator role bypasses all permission checks. When a user has the Administrator role:
   - All permission checks return `True` or grant full access
   - This is checked early in permission functions: `if user == "Administrator": return True`
   - Administrator can access all DocTypes, fields, and documents
   - Use with extreme caution - Administrator access should be limited to system administrators
   - The Administrator role cannot be removed from users who have it

2. **Permission Caching**: Permissions are cached for performance to avoid repeated database queries. Caching happens at multiple levels:
   - **Role Permissions**: Cached in `frappe.local.role_permissions` (Python) and `frappe.perm.doctype_perm` (JavaScript)
   - **User Permissions**: Cached in `frappe.cache.hget("user_permissions", user)`
   - **Document Permissions**: Cached per document in `docinfo.permissions`
   - After modifying permissions, you may need to:
     - Clear browser cache (for JavaScript)
     - Clear server cache: `frappe.clear_cache()` or `bench --site [site] clear-cache`
     - Wait for cache expiration (typically a few minutes)
     - Reload the page or restart the application

3. **Child Table Permissions**: Child table DocTypes inherit permissions from their parent DocType. This is implemented in `get_permissions()`:
   - If `meta.istable` is True and `parenttype` is provided, the system uses the parent DocType's permissions
   - You typically don't set permissions directly on child tables
   - Child table permissions are checked using the parent DocType's permission rules
   - This ensures consistent access control - if a user can access a Sales Order, they can access its Items (child table)

4. **Permission Inheritance**: Users inherit permissions from all their roles. The permission system uses an **OR** logic:
   - If **any** role grants a permission, the user has it
   - Permissions are additive across roles - having multiple roles gives you the union of all permissions
   - Example: If Role A grants Read and Role B grants Write, a user with both roles has both Read and Write
   - This is implemented by checking `perm.role in roles` - if the user has any matching role, the permission applies
   - **Important**: You cannot use roles to deny permissions - if one role grants access, the user has access

5. **Permission Denial**: Permissions are additive. You cannot "deny" a permission - you can only grant or not grant it. This means:
   - There's no "negative" permission that removes access
   - If you want to restrict access, don't grant the permission in the first place
   - Removing a user from a role removes that role's permissions, but other roles' permissions remain
   - This is a fundamental design decision - permissions are whitelist-based, not blacklist-based

6. **Level 0 Requirement**: Always ensure Level 0 permissions exist. Without Level 0 access, users cannot access the document at all, regardless of higher level permissions. This is because:
   - Level 0 is checked first in `get_role_permissions()` - it determines document-level access
   - The Python code filters: `cint(perm.permlevel) == 0` when checking document access
   - Without level 0, users cannot load documents, view lists, or perform any actions
   - Higher level permissions (1-9) only control field access within documents that are already accessible
   - **Best Practice**: Always set level 0 permissions first, then add higher levels as needed

7. **"If Owner" Permissions**: When "If user is the owner" is enabled:
   - The permission only applies when `doc.owner == user` (case-insensitive)
   - This is tracked through `rights_without_if_owner` in JavaScript
   - If a user is NOT the owner, permissions with "if_owner" are effectively denied
   - "If owner" permissions work differently for "create" - create cannot be owner-based
   - This is useful for scenarios where users should only access their own documents

8. **Permission Checking Order**: The system checks permissions in a specific order:
   1. Administrator check (if Administrator, grant all access)
   2. Role permissions (DocType-level and field-level)
   3. "If owner" restrictions (if applicable)
   4. User Permissions (document-level filtering)
   5. Share permissions (document-specific access)
   - Each check can grant or restrict access
   - Later checks can override earlier ones in specific scenarios

9. **Field-Level Permission Validation**: When saving documents:
   - The system validates that users haven't modified fields at permlevels they don't have write access to
   - This happens in `validate_higher_perm_levels()` in `frappe.model.document.py`
   - If a user tries to modify a restricted field, the value is reset to the original/default value
   - This prevents users from bypassing permission checks by manipulating form data
   - Validation happens server-side, so it cannot be bypassed by client-side manipulation

## Conclusion

Understanding roles and permissions in Frappe is crucial for building secure and well-organized applications. The permission level system provides powerful field-level access control, while User Permissions enable document-level filtering. By combining these mechanisms, you can create sophisticated access control scenarios that match your organizational needs.

### Key Concepts Summary

- **Roles** = Groups of permissions that represent job functions or responsibilities. Users can have multiple roles, and permissions are additive across roles.

- **Permission Levels (Permlevels)** = Field access control mechanism (0 = document access, 1-9 = field access). Permission levels use exact matching, not cumulative access.

- **User Permissions** = Document-level filtering that restricts users to specific document records based on linked document values. Works by adding WHERE conditions to database queries.

- **Level 0** = Foundation level - must have this to access the document at all. Without level 0, higher level permissions are meaningless.

- **Higher Levels (1-9)** = Additional field access that requires explicit permissions at each level. Having permission at level 2 does NOT grant access to level 0 or 1 fields.

- **Exact Match**: Fields are accessible only if the user has permission at that field's exact permlevel. The system checks `field.permlevel in allowed_permlevels`, not ranges.

- **Not Cumulative**: Permission levels are NOT cumulative. You must explicitly grant permissions at each level you want users to access.

- **"If Owner"**: Permissions that only apply when the user is the document owner. Useful for owner-based access control scenarios.

- **Share Permissions**: Temporary, document-specific access that bypasses role-based permissions. Useful for collaboration without modifying roles.

### Best Practices Recap

1. **Always set Level 0 first** - Without it, users cannot access documents
2. **Grant permissions at each level needed** - Levels are not cumulative
3. **Use consistent level schemes** - Establish patterns across your application
4. **Test thoroughly** - Verify access with different roles and scenarios
5. **Use appropriate tools** - Permission Inspector for debugging, Role Permission Manager for bulk management
6. **Plan your structure** - Design permlevel schemes before customizing fields
7. **Clear cache after changes** - Permissions are cached for performance
8. **Document your patterns** - Keep track of permission schemes for maintainability

### Common Pitfalls to Avoid

1. **Setting only higher level permissions** - Always include level 0
2. **Assuming cumulative access** - Each level must be explicitly granted
3. **Forgetting User Permissions** - They work alongside role permissions
4. **Not clearing cache** - Changes may not appear immediately
5. **Over-complicating** - Most use cases work with levels 0, 1, and 2
6. **Ignoring "if owner"** - Understand how owner-based permissions work
7. **Not testing** - Always verify permissions with actual users and roles

### Further Learning

- Use the **Permission Inspector** (`/app/permission-inspector`) to debug permission issues
- Review the **Role Permission Manager** (`/app/permission-manager`) for bulk permission management
- Check **Permitted Documents For User** report to verify document access
- Study the source code in `frappe/permissions.py` and `frappe/model/perm.js` for deep understanding
- Experiment with different permission scenarios in a development environment

Use the available tools (Permission Inspector, Role Permission Manager, etc.) to manage and debug your permission configurations effectively. Remember that permissions are a critical security feature - take time to understand and test your configurations thoroughly.

## Common Scenarios and Solutions

### Scenario 1: User Cannot See Documents They Should Have Access To

**Symptoms**: User has the correct role and permissions, but cannot see documents in lists or forms.

**Possible Causes & Solutions**:
1. **Missing Level 0 Permission**: User doesn't have level 0 read permission
   - **Solution**: Add level 0 Read permission for the user's role
   - **Check**: Use Permission Inspector to verify level 0 access

2. **User Permissions Restricting Access**: User Permissions are filtering out documents
   - **Solution**: Check User Permissions for the user - ensure they have permission for the required linked documents
   - **Check**: Use "Permitted Documents For User" report to see what the user can access

3. **"If Owner" Restriction**: Permission has "If user is the owner" enabled, but user is not the owner
   - **Solution**: Either remove "If owner" restriction or ensure user is the document owner
   - **Check**: Verify document owner matches user

4. **Cache Issues**: Permissions were changed but cache wasn't cleared
   - **Solution**: Clear cache (`bench --site [site] clear-cache`) and reload page
   - **Check**: Verify permissions in Permission Inspector after clearing cache

### Scenario 2: User Cannot Edit Fields They Should Be Able To Edit

**Symptoms**: User can see documents but cannot edit certain fields.

**Possible Causes & Solutions**:
1. **Missing Write Permission at Field's Permlevel**: Field is at permlevel 1, but user only has write at level 0
   - **Solution**: Grant write permission at the field's permlevel (check field's permlevel in Customize Form)
   - **Check**: Use Permission Inspector to verify write permission at the specific permlevel

2. **Field is Read-Only**: Field has `read_only=1` or fieldtype is "Read Only"
   - **Solution**: Remove read_only flag or change fieldtype (if appropriate)
   - **Check**: Review field definition in Customize Form

3. **Document is Submitted**: Document has `docstatus=1` (submitted), making it read-only
   - **Solution**: Cancel document first, or enable "Allow on Submit" for the field
   - **Check**: Verify document status

4. **Workflow Restriction**: Field is controlled by workflow and is read-only in current state
   - **Solution**: Transition workflow state or modify workflow permissions
   - **Check**: Review workflow state and update fields

### Scenario 3: User Can See Fields They Shouldn't See

**Symptoms**: User can see sensitive fields (e.g., profit margin) that should be hidden.

**Possible Causes & Solutions**:
1. **Field Has Wrong Permlevel**: Field is at permlevel 0 but should be at higher level
   - **Solution**: Change field's permlevel to appropriate level (e.g., 2 for sensitive fields)
   - **Check**: Review field permlevels in Customize Form

2. **User Has Permission at Higher Level**: User has read permission at the field's permlevel
   - **Solution**: Remove read permission at that permlevel for the user's role
   - **Check**: Review permission rules for the role

3. **Administrator Role**: User has Administrator role which bypasses all checks
   - **Solution**: Remove Administrator role if not needed, or create separate role
   - **Check**: Verify user's roles

### Scenario 4: User Permissions Not Working

**Symptoms**: User Permissions are set but not filtering documents correctly.

**Possible Causes & Solutions**:
1. **Missing Link Field**: DocType doesn't have a link field to the User Permission's "Allow" DocType
   - **Solution**: Ensure DocType has a link field (e.g., Customer field) that matches User Permission
   - **Check**: Review DocType fields and User Permission "Allow" DocType

2. **"Apply To" Not Set**: User Permission's "Apply To" doesn't include the DocType being queried
   - **Solution**: Add DocType to "Apply To" field in User Permission, or leave empty to apply to all
   - **Check**: Review User Permission "Apply To" field

3. **Cache Issues**: User Permissions are cached and changes aren't reflected
   - **Solution**: Clear cache and wait for cache expiration
   - **Check**: User Permissions are cached in `frappe.cache.hget("user_permissions", user)`

4. **Strict User Permissions**: System setting "Apply Strict User Permissions" affects behavior
   - **Solution**: Understand how strict mode works - it enforces User Permissions more strictly
   - **Check**: Review system settings

### Scenario 5: Share Permission Not Working

**Symptoms**: Document is shared but user still cannot access it.

**Possible Causes & Solutions**:
1. **Share Record Not Created**: DocShare record doesn't exist
   - **Solution**: Verify share was created - check DocShare DocType
   - **Check**: Query DocShare records for the user and document

2. **Wrong Permission Type**: Share grants Read but user needs Write
   - **Solution**: Update share to grant appropriate permission types
   - **Check**: Review DocShare record's permission fields

3. **User Permissions Blocking**: User Permissions are filtering out the shared document
   - **Solution**: User Permissions work alongside shares - ensure User Permissions allow access
   - **Check**: Review User Permissions for the user

### Scenario 6: Permission Changes Not Taking Effect

**Symptoms**: Permissions are modified but changes aren't reflected.

**Possible Causes & Solutions**:
1. **Cache Not Cleared**: Permissions are cached for performance
   - **Solution**: Clear cache (`bench --site [site] clear-cache`) and reload page
   - **Check**: Permissions are cached in multiple places (Python and JavaScript)

2. **Wrong DocType**: Permissions were set on wrong DocType
   - **Solution**: Verify permissions are set on correct DocType
   - **Check**: Review permission rules in DocType's Permissions table

3. **Custom vs System Permissions**: Custom DocPerm vs DocPerm confusion
   - **Solution**: Understand which permission records are being used
   - **Check**: System checks Custom DocPerm first, then DocPerm

4. **Role Not Assigned**: User doesn't have the role with the permission
   - **Solution**: Ensure user has the role assigned
   - **Check**: Review user's roles in User DocType

## Troubleshooting Checklist

When debugging permission issues, follow this checklist:

1. Verify user has the correct role assigned
2. Check level 0 permissions exist for the role
3. Verify permission levels match field permlevels
4. Check "If owner" restrictions if applicable
5. Review User Permissions for document-level filtering
6. Check share permissions if document-specific access
7. Verify document status (draft/submitted/cancelled)
8. Review workflow state restrictions
9. Check field-level restrictions (read_only, hidden, etc.)
10. Clear cache and reload
11. Use Permission Inspector to debug specific scenarios
12. Check Administrator role (bypasses all checks)

## Additional Resources

- **Frappe Documentation**: [Official Frappe Documentation on Permissions](https://frappeframework.com/docs)
- **Source Code**: Study `frappe/permissions.py` and `frappe/public/js/frappe/model/perm.js` for implementation details
- **Permission Inspector**: Use `/app/permission-inspector` for interactive debugging
- **Role Permission Manager**: Use `/app/permission-manager` for bulk permission management
- **Community Forums**: Frappe Community Forum for permission-related questions
