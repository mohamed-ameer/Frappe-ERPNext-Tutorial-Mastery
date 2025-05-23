# What is a Patch in Frappe (ERPNext)?

Let's make it super simple. Imagine you just shipped your ERP app, but you realized there’s a small fix needed—for example, setting some data, adding a unique constraint, or changing field values for existing records.

How to do that? **Frappe Patch**

---

## What exactly is a Frappe Patch?

A patch is nothing but a tiny Python script that:

1. Runs automatically during migrations (using the `bench migrate` command)
2. Fixes or updates database schema or data
3. Gets recorded so it only runs once and never runs again—even if you run `bench migrate` 1000 times (unless you clear its log)

Frappe opens it once, reads it, runs the command, and logs it as "done."

---

## When we should write a patch?

Patches are used for example when you make a change in an existing functionality and want to update instances that are already running ERPNext to make it compatible with that change. Or it can also be used when you need to correct something in a functionality already used in production.

Patches are only meant to be run once on each sites already running ERPNext. They are never run twice and never run in a new site.

For example, one of the latest patch is meant to rename School into Education.
On a new site, the Doctype Education exists from the beginning so you don’t need to do anything, but on an older site, the doctype was named School, so you need to update the database to have it named Education to be compatible with the new code base in ERPNext. Therefore you run a script that renames School to Education when you update your codebase with Education everywhere instead of School.

[thank's to Mr.Chdecultot](https://discuss.frappe.io/t/when-we-should-write-a-patch/31246/2)

---

## Real-life examples where you would use a patch

1. Add a unique constraint to two fields in a DocType
2. Update old customer names to match new rules
3. Remove test data from a live site
4. Migrate values from an old field to a new one
5. Add a missing column or update field types

---

## Best Practices Before Running a Patch

1. Always test your patch on a staging server
2. Always backup your database before production (or you may cry later 🤡)
3. Keep patch files well named and organized (e.g., `v1_0/fix_duplicate_emails.py`)
4. If your patch fails, fix it and re-run after clearing it from the **Patch Log** (since patches are recorded and won’t run again unless deleted)

---

## How to Write a Simple Patch (Example)

1. **Create the patch file**

   ```python
   # File: your_app/patches/v1_0/add_unique_booking_constraint.py
   import frappe

   def execute():
       frappe.db.add_unique("Booking", ["customer", "booking_date"])
   ```

   **Note:**

   * The function must be named `execute`; this is how `bench migrate` detects it.
   * Why `v1_0` in the folder name? Just for clarity and versioning. You can name it anything, but a semantic structure helps with maintenance.

2. **Register the patch** in `your_app/patches.txt` by adding:

   ```text
   your_app.patches.v1_0.add_unique_booking_constraint
   ```

3. **Finally, run**:

   ```bash
   bench --site yoursite migrate
   ```

   This command checks which patches haven’t been applied yet (based on the **Patch Log**) and executes them safely.

---

## How Frappe Knows Not to Re-Run Patches

Once your patch runs, Frappe logs it in the database under the **Patch Log** Doctype. Even if you run `bench migrate` a hundred times, it won’t run again.

---

## Questions

* **How do you handle database schema changes in a live ERPNext system?**

  * Use **Patch Scripts** to apply schema changes.
  * Test changes in a staging environment before deploying to production.

* **What is a patch in Frappe?**
  A patch in Frappe is a Python script used to apply database changes, fix issues, or modify data after an update or deployment. Patches are defined in the `patches.txt` file in an app’s module. Each patch is a Python function that performs a specific task.

* **What are Patch Scripts in Frappe, and when would you use them?**

  * Patch scripts are Python scripts used to update or modify the database schema or data during app updates.
  * They are executed automatically when the app is updated or installed.
  * **Use cases:**

    * Adding new fields to existing DocTypes.
    * Migrating data from one format to another.
    * Fixing data inconsistencies.

* **How do you handle data migrations when upgrading from one version of ERPNext to another?**

  * Use **Patch Scripts**: Write patch scripts to migrate data or update schema changes.
  * **Backup**: Always take a database backup before upgrading.
  * **Test in Staging**: Test the upgrade process in a staging environment before applying it to production.
  * **Follow Release Notes**: Review release notes for breaking changes or required migrations.

* **How do you handle database schema changes in a live ERPNext system?**

  * Use **Patch Scripts** to apply schema changes.
  * Test changes in a staging environment before deploying to production.
