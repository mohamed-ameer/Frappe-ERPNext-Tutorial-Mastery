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