# Difference Between "Standard" and "Custom" in Frappe

The difference between **standard** and **custom** in Frappe depends entirely on your perspective.

- **Standard** refers to the **core** – the original source code that everyone pulls from.  
  → "Is standard" means: Put it in the code (source files), so **everyone** can see it.

- **Custom** means something specific to a particular client, a particular site, stored only in that client's database, or specific to a particular app.

## From the Apps Perspective

- **Frappe** is the **standard** – the core that all apps are built on top of.
- When you run `bench new-app`, you create a **custom app**.  
  → The code in this app belongs only to itself and **does not** affect the core (standard) or any other custom app.

**Is ERPNext standard or custom?** 😂  
It depends on the perspective:

- From Frappe's view → ERPNext is **custom** (just like any app created with `bench new-app`).
- From your custom app's view (if it depends on ERPNext) → ERPNext is **standard** (just like Frappe itself).  
  *Don't get confused!*

## From the Sites Perspective

Each **site** is treated as a separate client with its own dedicated database (think of a site as an instance of the application).

Frappe is built on **low-code/no-code** principles and makes customization extremely easy.

Therefore, anything you customize on a site is **custom** by default:
- New DocType
- New Report
- Web Form
- Web Page
- New field in an existing DocType
- etc.

These customizations are stored **only in that site's database** → other sites won't see them.

### How to Make Something Standard (i.e., in the Source Code)

To make a customization visible to **all sites** (put it in the core/source code):

1. Enable **Developer Mode**  
2. Log in as **Administrator** (regular standard users cannot do this)  
3. Depending on the object:

   - **DocType** → Uncheck the **"Custom?"** checkbox  
   - **Report** → Set **"Is Standard?"** to **Yes**  
   - **Web Form** → Same logic as reports (set "Is Standard?" to Yes)

   → **Standard** means: It will be stored in the source code (core), so every site will see it.

### Special Cases: Web Pages & Custom Fields

- **Web Pages** and **Custom Fields** cannot be directly set to standard in the UI.  
  → Export them as **fixtures** (a JSON file containing the data).  
  → When you run `bench migrate`, the data will be inserted into the client's database during migration.

In short:
- **Standard** → Core / Source code → Visible to all sites / apps  
- **Custom** → Per-site or per-app → Stored only in the database of that specific site