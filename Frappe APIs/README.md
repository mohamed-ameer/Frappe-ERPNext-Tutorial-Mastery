# Frappe API Discovery Guide

If you've ever tried to integrate with the Frappe Framework or ERPNext, you've probably searched far and wide for an official **Postman Collection** or a **Swagger/OpenAPI YAML file**, only to find that Frappe's dynamic nature makes standard documentation tricky.

This repository is the result of that exact search. After digging through community forums, open-source repositories, and ecosystem tools, these are the ultimate resources discovered for unlocking interactive API documentation and Swagger specs for Frappe (especially version 15).

## Quick Reference Links

| Resource / Tool | Description | URL |
| :--- | :--- | :--- |
| **ALYF Swagger UI** | Live Swagger documentation for all Frappe and ERPNext APIs | [Explore APIs](https://api-16.alyf.de/swagger) |
| **Commit App (Frappe v15)** | Deep dive into Frappe version 15 source code via Commit | [View Frappe v15](https://commit.frappe.cloud/commit/project-viewer/frappe-frappe-version-15) |
| **The Commit Company Hub** | Main landing page for exploring GitHub repositories via Commit | [Commit Cloud](https://commit.frappe.cloud/) |
| **Frappe OpenAPI Generator** | ALYF's open-source tool to generate OpenAPI specs for Frappe | [GitHub Repository](https://github.com/alyf-de/frappe_openapi) |
| **Omkar Darves' Swagger** | Community-driven Swagger integration project for Frappe | [GitHub Repository](https://github.com/omkardarves/swagger) |
| **Commit Main Directory** | Direct access to the Commit app projects listing | [Commit Directory](https://commit.frappe.cloud/commit) |
| **Frappe Forum Discussion** | Community thread on utilizing Swagger for Frappe v15 documentation | [Discuss Frappe](https://discuss.frappe.io/t/frappe-framework-15-documentation-using-swagger/129230/8) |
| **Commit Company Repo** | Official open-source repository for the Commit web application | [GitHub Repository](https://github.com/The-Commit-Company/commit) |

---

## Key Resource Breakdowns

### 1. Interactive API Reference (Swagger / OpenAPI)
Frappe does not natively ship with a full Swagger UI out of the box, but the community has bridged this gap excellently:
* **[ALYF Live Swagger UI](https://api-16.alyf.de/swagger):** A production-ready API playground where you can see all endpoints available across standard Frappe and ERPNext installations.
* **[frappe_openapi by ALYF](https://github.com/alyf-de/frappe_openapi):** A Frappe app that automatically generates OpenAPI schemas directly from your DocTypes and Whitelisted methods. Use this to self-host your own documentation.
* **[swagger by Omkar Darves](https://github.com/omkardarves/swagger):** Another great alternative repository providing Swagger integration setups for Frappe-based environments.

### 2. Code Navigation & Exploration via Commit
The **Commit App** is an advanced repository viewer built specifically to make browsing GitHub source code fast and intuitive:
* **[Frappe v15 Source on Commit](https://commit.frappe.cloud/commit/project-viewer/frappe-frappe-version-15):** Instantly navigate the file structure and hooks of Frappe v15 to understand how core REST endpoints are built.
* **[The Commit Company Repo](https://github.com/The-Commit-Company/commit):** If you want to understand how the viewer itself works or self-host it, check out their core repository.

### 3. Community Best Practices
* **[Frappe Forum Discussion Thread](https://discuss.frappe.io/t/frappe-framework-15-documentation-using-swagger/129230/8):** Read through this active thread to learn how core developers use Swagger to document Frappe 15, troubleshoot issues with REST endpoints, and share custom implementation snippets.
