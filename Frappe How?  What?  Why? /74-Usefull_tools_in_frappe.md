# Usefull tools in frappe

## 1. Permission Inspector Tool

a virtual doctype that can run has_permission for
doctype-docname-user-ptype combinations and spit out detailed log for
why/where some permissions are denied or granted.

- location: `http:your-site.com/app/permission-inspector`
- what it does: it shows you the permissions of a specified doctype for a specified user for a specified document with a specific permission type.
- how to use it: just go to the url and choose the user and the doctype
- why to use it: to debug permission issues, and it's useful if i have a user with alot of roles and permissions and i want to know why he can't access a specific document or doctype or why he can access it.
- the output: it will show you the roles that the user has and permissions of the user for the doctype and the document and answer the question of does the user has this permission or not.
- [link to the PR of this feature](https://github.com/frappe/frappe/pull/24239)

**in short:** it's a tool to debug permission issues, it alow you to monitor the permissions of a user for a specific doctype or document and give you the reason why he has this permission or not.

---

## 2. Impersonating User Tool

it is a tool that allow the admin (only admin) to impersonate another user, it's like you to login as another user without knowing his password.
but it doesn't save his session, it's just for testing purposes only which means that may be some changes that you make will be rolled back after you logout (not sure about that but i think it will be rolled back).
and the admin must fill a reason for impersonating the user and this reason will be notified to the user when he login so he will know that he is being impersonated.

- location: `http:your-site.com/app/user/<user-name>` then you will see a button called "Impersonate"
- what it does: it allow the admin to impersonate another user (login as another user without knowing his password).
- how to use it: just go to the url and choose the user that you want to impersonate.
- why to use it: to test the system from the perspective of another user.
- the output: it will login you as the specified user.


