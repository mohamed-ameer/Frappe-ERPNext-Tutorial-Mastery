## What is Multitenant Mode?
**Multitenant mode** allows you to manage **multiple independent sites** within a single Frappe bench. Each site operates as a separate instance with its own database, configuration, and assets

In **multitenant mode** , you can manage **more than one site** at the same time.
Each site has its own database, settings, and files.

You must explicitly tell Frappe which site to use every time you run a command, using the `--site <sitename>` flag, like this:

```bash
bench --site your-site.local migrate
```
---
## What is Default Mode?
**Default mode** lets you set a **single default site** that bench will use automatically for all commands unless otherwise specified. This simplifies workflows when working primarily on one site — you no longer need to append `--site` every time.

In **default mode** , you pick **one main site** that Frappe will use automatically for all commands.

You set it like this:

```bash
bench use your-site.local
```
Now, any bench commands like `bench migrate` will always apply to that site.

---
## How to define default site?
In Frappe, there are **two ways** to define a default site:

### 1. `sites/currentsite.txt`

* A file that contains just the name of the default site.
* Created by: `bench use <sitename>`
* If missing, it doesn’t force a default.

### 2. `"default_site"` in `common_site_config.json`

* JSON config file shared across all sites.
* Overrides `currentsite.txt`.

---
## How to **disable the default site behavior** in Frappe and restore **multitenant mode**?

1. remove the `"default_site"` key from `common_site_config.json`
or
2. remove the `"currentsite.txt"` file inside `sites` folder
