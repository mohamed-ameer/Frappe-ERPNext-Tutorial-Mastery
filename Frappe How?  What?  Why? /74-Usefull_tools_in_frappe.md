# Usefull tools in frappe

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

---

## 6. Impersonating User Tool

it is a tool that allow the admin (only admin) to impersonate another user, it's like you to login as another user without knowing his password.
but it doesn't save his session, it's just for testing purposes only which means that may be some changes that you make will be rolled back after you logout (not sure about that but i think it will be rolled back).
and the admin must fill a reason for impersonating the user and this reason will be notified to the user when he login so he will know that he is being impersonated.

- location: `http:your-site.com/app/user/<user-name>` then you will see a button called "Impersonate"
- what it does: it allow the admin to impersonate another user (login as another user without knowing his password).
- how to use it: just go to the url and choose the user that you want to impersonate.
- why to use it: to test the system from the perspective of another user.
- the output: it will login you as the specified user.

---

## 7. System Console

it is a tool that allow you to run python code or sql queries directly from the browser, it's like you have a python console or sql console in the browser.

- location: `http:your-site.com/app/system-console`
- what it does: it allow you to run python code or sql queries directly from the browser.
- how to use it: just go to the url and write your python code or sql query and press execute button or ctrl+s.
- why to use it: to test your python code or sql queries directly from the browser without the need to create a python file and run it from the terminal.
- the output: it will print the output of your code or query in the browser.

there is a checkbox called "Commit" that you can check it if you want to commit your changes to the database (frappe.db.commit()), if you didn't check it, it will rollback your changes.

---

## 8. Important Doctypes

BEST 3 steps you do to make your development life easier :

1. get commit app in your bench
```bash
bench get-app --branch main The-commit-company/commit 
```
(btw as i remember frappe bench get-app will add https ://github.com/
then it will be "https ://github. com/The-commit-company/commit")

2. install it in your site:
```bash
bench --site {site_name} install-app commit 
```

3. route to /commit 
`http://localhost:8000/commit `

and congratulations 🎉 
you have the best frappe development tool that will make your life easier 


commit is nothing but a frappe app that provide two major functionality:

1. it list for you every single api in your system and you can documents and test it immediately 

2. it draw ERD for your system database 

as well as

3. it list all bench commands for you as cheat sheet.

