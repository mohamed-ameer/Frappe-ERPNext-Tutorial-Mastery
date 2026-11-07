## Why migration take many time?

in our case the reason was: there was a Doctype that contains arround 250,000 records and it’s fixture contains the same count.

**Solution:**

1- open the site console
```
bench --site your-site console
```
2- truncate the huzzle doctype from it’s data, and don’t forget to commit the action else it won’t reflect in the database why? because you are in the console screen not the database screen.

```
In [1]: frappe.db.truncate("Has Role")
In [2]: frappe.db.commit()
In [3]: exit
```

3- now migration will be faster.
```
bench --site your-site migrate
```

if the migration take so long time, 90% the reason will be the fixture

WHY???

The large number of duplicate records in the "Has Role" doctype likely happened because fixtures or scripts repeatedly assigned the same roles to users during each migration, without checking if the role was already assigned. Since Frappe doesn't enforce a unique constraint on user-role combinations by default, duplicates pile up over time. This slows down migrations significantly.

In short:
Every migration re-added roles from fixtures without checks, creating duplicates. Without database rules to block this, the records kept growing. The solution is to clean duplicates, add uniqueness checks, and fix the scripts or fixtures.

---
**Recommended Solution**

you can use the `before_migrate` hook to handle these scenarios automatically with your desired logic and filters,
using hooks like `before_migrate` can make handling such cases way more efficient and automated than manually doing it for similar issues in the future.

1- in the `hooks.py` file, add the following code:

```
# Installation
# ------------

before_migrate = "your_app.utils.install.before_migrate"
```

2- in the `install.py` file, add the following code:

```
def before_migrate():
    remove_duplicate_roles()

def remove_duplicate_roles():
    frappe.db.truncate("Has Role")
    frappe.db.commit()
```

3- now the migration will be faster and the solution will be automatic and able to be expanded to handle the same kind of issues in the future.

```
bench --site your-site migrate
```

[Thanks to Mr.Abdullah Korraim for this suggestion](https://www.linkedin.com/in/abdallahkorraim)