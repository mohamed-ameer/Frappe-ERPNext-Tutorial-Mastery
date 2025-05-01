# Frappe/ERPNext Mastery

Welcome to **Frappe/ERPNext Mastery**, a community-driven guide designed to take you from beginner to expert in the Frappe Framework and ERPNext. This repository contains a detailed syllabus spanning 18 chapters, complete with hands-on examples and best practices. Feel free to explore, learn, and contribute!

We may also convert this guide into a free book or video course in the future — stay tuned!

NOTE: each chapter will has it's own pdf file, at the end we will group it into a single book

---

## 📚 Table of Contents

1. [Introduction to ERP and Frappe/ERPNext](#1-introduction-to-erp-and-frappeerpnext)
2. [Core Concepts of Frappe Framework](#2-core-concepts-of-frappe-framework)
3. [Automation and Workflows](#3-automation-and-workflows)
4. [User Interface Customization](#4-user-interface-customization-themes-pages-workspacemore)
5. [Internationalization (i18n) and Localization (l10n)](#5-internationalization-i18n-and-localization-l10n)
6. [Customization and Development](#6-customization-and-development)
7. [Advanced Customizations](#7-advanced-customizations)
8. [Reports and Dashboards](#8-reports-and-dashboards)
9. [Integration](#9-integration)
10. [Deployment and Hosting](#10-deployment-and-hosting)
11. [Frappe Cloud](#11-frappe-cloud)
12. [Security](#12-security)
13. [Advanced Topics](#13-advanced-topics)
14. [Upgrades and Version Management](#14-upgrades-and-version-management)
15. [Troubleshooting and Debugging](#15-troubleshooting-and-debugging)
16. [Preparing for Interviews](#16-preparing-for-interviews)
17. [Practical Projects](#17-practical-projects)
18. [Resources and Community](#18-resources-and-community)

---

## Syllabus (18 Chapters + Course Content)

### 1. Introduction to ERP and Frappe/ERPNext

**1.1 What is ERP?**
- Definition, core modules (Accounting, Inventory, HR, etc.)
- Benefits of ERP for businesses

**1.2 Overview of ERPNext**
- What is ERPNext?
- Key Features: Accounting, CRM, HR, Manufacturing, etc.
- Use cases: SMEs, manufacturing, retail, NGOs, etc.

**1.3 Overview of Frappe Framework**
- Open-source, Python-based, full-stack framework
- Relationship with ERPNext
- Key features: Database abstraction, REST API, role-based permissions

**1.4 Setup Types**
- **Local Setup**: Prerequisites (Python, Node.js, MariaDB/MySQL)
  - Step-by-step installation on Windows (WSL2), macOS, and Linux
- **Cloud Setup**: Deploying ERPNext on cloud platforms (AWS, DigitalOcean, etc.)
- **Docker Setup**: Using Docker for quick and isolated environments

**1.5 DocTypes**
- **Types**: Single, Child, Submittable
- Naming conventions and metadata
- Creating custom DocTypes

**1.6 Module Definition**
- Linking DocTypes to modules
- Organizing apps and modules

**1.7 Workflows**
- Creating workflows
- States and transitions
- Use cases: Approval processes, task management

**1.8 Views**
- List View: Filtering, sorting, and bulk actions
- Form View: Editing records and managing fields
- Report View: Generating dynamic reports

**1.9 Scripting**
- Client Scripts: JavaScript for frontend logic
- Server Scripts: Python for backend logic
- Examples: Field validation, auto-fill, conditional visibility

**1.10 Fields**
- Adding fields to DocTypes
- Field types and options (Data, Link, Table, etc.)
- **Field Dependencies**: Conditional fields, dependent dropdowns, dynamic options

---

### 2. Core Concepts of Frappe Framework

**2.1 Architecture**
- MVC pattern
- Client-server communication (Socket.IO, REST API)

**2.2 Key Components**
- Models: Fields, permissions, and validation
- Controllers: Server-side scripting (Python)
- Database Layer: MariaDB/PostgreSQL integration

**2.3 Frappe’s Desk Interface**
- Workspace, forms, lists, dashboards
- User permissions and roles
- **Custom Navigation Menus**: Adding custom menu items and organizing navigation

**2.4 Developer Tools and Resources**
- Frappe Desk: Debugging and error tracking
- Developer Mode: Enabling and using it effectively
- Useful resources: Official docs, forums, GitHub repos

---

### 3. Automation and Workflows

- **What is a Workflow?**: Definition and purpose
- **Creating Workflows**: States, transitions, role assignments
- **Advanced Workflow Features**: Conditional transitions, notifications
- **Examples**: Sales Order, Expense Claim, Purchase Order

---

### 4. User Interface Customization (Themes, Pages, Workspace…)

- **Workspace Customization**: Navigation menus, dashboards, role-based visibility
- **Module Views**: List, form, report customizations
- **Custom UI Components**: Forms, buttons, widgets
- **Custom Themes**: CSS/SCSS, Bootstrap themes, branding
- **Dynamic Content Injection**: Real-time data in templates
- **URL Routing**: Custom routes, dynamic parameters
- **Pagination**: Handling large datasets
- **Examples**: Custom login page, branded dashboards

---

### 5. Internationalization (i18n) and Localization (l10n)

- **Internationalization (i18n)**: Preparing for multiple languages
- **Localization (l10n)**: Regional settings (date formats, currencies)
- **Adding Translations**: Frappe’s translation tools
- **Managing Language Files**: `.json` translation files
- **Switching Languages**: Interface language settings
- **Localization Features**: Currency and format configurations
- **Examples**: Arabic e-commerce store, French HR module

---

### 6. Customization and Development

**6.1 Creating an App**: `bench new-app`, `bench install-app`
**6.2 Managing Sites and Apps**: Multiple sites, dependencies
**6.3 Lifecycle Hooks**: `before_insert`, `validate`, `on_submit`, etc.
**6.4 Custom API Endpoints**: Python scripts, auth
**6.5 ORM (Object Relational Mapping)**: CRUD with Frappe ORM
**6.6 Frontend JS**: Events, auto-population

---

### 7. Advanced Customizations

- **Monkey Patching**: Overriding core methods
- **Custom Web Pages**: Standalone pages, landing pages
- **Alternative Desk**: Custom dashboards, menu replacements
- **Editing Core Methods**: Safe overrides, testing
- **Custom Error Handling**: Standardized API errors, logging

---

### 8. Reports and Dashboards

**8.1 Query Reports**: SQL-based reports
**8.2 Script Reports**: Python-based reports
**8.3 Print Formats**: Jinja templates, PDF/HTML
**8.4 Widgets**: Charts, graphs

---

### 9. Integration

**9.1 Payment Gateways**: Stripe, PayPal, Razorpay
**9.2 Email Services**: Templates, notifications
**9.3 SMS Gateways**: Twilio, Plivo
**9.4 External APIs**: Data consumption
**9.5 Webhooks**: Real-time updates

---

### 10. Deployment and Hosting

**10.1 Bench Setup**: Production with Bench CLI
**10.2 Nginx Configuration**: Reverse proxy
**10.3 Backup & Restore**: Automations
**10.4 Logs**: Monitoring
**10.5 Performance**: Caching, indexing

---

### 11. Frappe Cloud

- **11.1 Overview of Frappe Cloud**: Features, benefits of managed hosting
- **11.2 Getting Started**: Creating an account, adding a new site
- **11.3 App Deployment**: Git integration, custom app deployment workflows
- **11.4 Site Management**: Domains, SSL, environment variables
- **11.5 Monitoring & Backups**: Accessing logs, automatic backups, restores
- **11.6 Advanced Cloud Features**: Auto-upgrades, multi-region support, staging environments
- **11.7 Pricing & Plans**: Free tier, paid tiers, enterprise support options

---

### 12. Security

**12.1 Role-Based Access Control**
**12.2 Encryption**: Data at rest & in transit
**12.3 Audit Logs**
**12.4 OAuth & SSO**

---

### 13. Advanced Topics

- **Background Jobs**
- **Cron Jobs**
- **Worker Management & Monitoring**
- **Multi-tenancy**
- **Frappe Fixtures**
- **Jinja Templating & Custom Filters**
- **URL Routing & Pagination**
- **Biometric Device Integration**

---

### 14. Upgrades and Version Management

- **Versioning**: Major vs. minor
- **Pre-Upgrade Checklist**
- **Upgrade Process**: `bench update`, migrations
- **Post-Upgrade Tasks**
- **Common Issues & Examples**

---

### 15. Troubleshooting and Debugging

- **Common Errors**: Dev, deployment, integration
- **Debugging Tools**: Browser DevTools, logs, Sentry
- **Best Practices & Pitfalls**

---

### 16. Preparing for Interviews

- **Core Concepts**
- **Customization & Dev**
- **Workflows**
- **Security & Permissions**
- **Integration & APIs**
- **Debugging & Scenarios**
- **Advanced Topics**
- **Practical Questions & Tips**

---

### 17. Practical Projects

- Inventory Management
- Library Management
- Ride Booking
- Support Ticket System
- E-Commerce Store
- Custom ORM

---

### 18. Resources and Community

- **Documentation**: Official Frappe/ERPNext docs
- **Forums & Groups**: Community channels
- **GitHub Repositories**: Explore & contribute
- **Contributing**: Reporting issues, PRs, writing docs

---

## 🤝 Contributing

We welcome contributions from everyone! Please follow these steps:

1. Fork this repository.
2. Create a new branch: `git checkout -b feature/my-chapter`
3. Commit your changes: `git commit -m "Add content to Chapter X"`
4. Push to your branch: `git push origin feature/my-chapter`
5. Open a Pull Request and describe your changes.

we suggest that any chapter will has it's own pdf file or md file as you wish.
<!--
Please review our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contribution Guidelines](CONTRIBUTING.md) before submitting.
-->
---

## 📄 License

This project is licensed under the MIT License.

