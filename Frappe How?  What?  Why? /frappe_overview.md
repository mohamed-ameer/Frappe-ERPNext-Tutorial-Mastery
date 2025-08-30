# Frappe: The Complete Overview Guide

## What is Frappe?

**Frappe is not just a framework — it's also a set of applications.**

Many people think of Frappe only as the framework behind ERPNext. But it's more accurate to say: **Frappe is both a full-stack development framework and a platform with built-in applications.**

### The Name Explained
```
[Frappe = Framework + applications] => (FRAPPE = FRamework + APPs)
```
Frappe = **FR**amework + **APP**s  
It’s a clever name that tells you exactly what it is: a powerful **development framework** + a set of **ready-to-use applications**.

Frappe is a comprehensive platform that combines:
- **Framework**: Modern, open-source development framework
- **Applications**: Ready-to-use modules and tools
- **Platform**: Complete ecosystem for building business applications

---

## Frappe Framework

A modern, open-source framework built with **Python (backend)** and **JavaScript (frontend)**. It gives developers everything needed to build web apps fast:

### Core Framework Features
- **ORM** - Object-Relational Mapping for database operations
- **REST APIs** - Built-in API endpoints
- **User Authentication** - Secure user management system
- **Role-based Permissions** - Granular access control
- **Background Jobs** - Asynchronous task processing
- **Admin UI** - Powerful "Desk" interface
- **Web Portal & Form Builder** - No-code form creation

### Key Advantage
**Unlike barebones frameworks, Frappe doesn't leave you starting from zero.**

---

## Frappe Core Applications

When you install Frappe, you don't get an empty shell. You get ready-to-use modules out of the box:

### Built-in Applications
- **Desk** – The powerful admin interface
- **User & Role Management** – Complete user administration
- **Website & Blog Engine** – Content management system
- **File Storage** – Document and media management
- **Scheduler** – Task automation and scheduling
- **Logging** – Comprehensive system logging
- **And much more...**

**So yes — Frappe is not just a framework. It's a framework plus core applications that make it instantly usable.**
```
[Frappe = Framework + applications]
```
---

## The Story of Frappe Framework

### Historical Timeline

#### 2005 - The Beginning
- Frappe wasn't always called "Frappe"
- Originally named "Web Notes"
- Company: "Web Notes Technologies Pvt. Ltd."
- Founded when one founder needed to build an ERP system for his family business

#### 2008 - The Rebrand
- "Web Notes" became "Frappe"
- Platform evolved into a full framework
- Focus shifted from just building a product to creating a development platform

#### 2010 - SaaS Transformation
- Frappe decided to offer their flagship product (ERPNext) as Software-as-a-Service (SaaS)
- Platform became more accessible to businesses

#### Today 
**Thousands** use Frappe to build not just ERPs, but also Custom business apps across industries, with Global community and ecosystem.

### The Semantic Web Inspiration

The Frappe Framework began in 2005 inspired by the **Semantic Web** with one big idea:

> **"What if software didn't just show information, but also understood what that information meant?"**

#### Example of Semantic Understanding

**For example:**

A **normal website** might see "Mohamed" as just text.
But in **Frappe**, the system knows that "Mohamed" is a name. (IT KNOWS)

This way of working, called **semantic design**, makes applications much more organized, consistent, and easier to expand.

The first major app built on **Frappe** was **ERPNext**, a complete business management system that handles hundreds of different kinds of information — from customers and invoices to projects and inventory.

---

## Why Choose Frappe?

### The Traditional Development Problem

Most software development involves:
1. **Capturing data**
2. **Processing it**
3. **Showing it back as reports or dashboards**

But developers usually spend huge amounts of time rebuilding the same things:
- Choosing a front-end
- Selecting middleware
- Building a back-end
- Stitching everything together

**Every time something changes, the whole stack has to be updated.**

### The Frappe Solution

Frappe solves this problem with a **low-code, all-in-one platform**. Think of it as a **Swiss Army knife for application development** — it already comes with everything you need to build powerful software:

#### Built-in Tools
- **Drag-and-drop form builder** - Create complex forms without coding
- **Multiple views** - Lists, calendars, kanban boards, tree structures
- **Role-based permissions** - Built-in user management
- **Powerful API** - Connect with other systems
- **Reporting tools** - Dashboards, reports, and workload management

#### The Heart: DocType System
At the heart of it all is the **DocType**, the basic building block of Frappe. A DocType is like a smart container that acts as:

- **A form** you can interact with
- **A database table** to store the data
- **Business logic** — all rolled into one

---

## Frappe vs ERPNext: Understanding the Relationship

### ERPNext is the Flagship App

**ERPNext is a full business management system** (accounting, inventory, HR, CRM, etc.) — built entirely on top of Frappe. It depends on both the framework and the core Frappe apps.

### The Architecture Stack

```
ERPNext (Business Application)
──────────────────────────────
Frappe Core Apps (Desk, Website, Users, etc.)
──────────────────────────────
Frappe Framework (Code, APIs, Security, ORM)
```

### Why You See `apps/frappe` in Your Bench

When you install Frappe + ERPNext using Bench, you'll see:

```bash
~/frappe-bench/apps/frappe     # the framework
~/frappe-bench/apps/erpnext    # the ERP app
```

#### Important Note
The `frappe` folder here is literally the framework's source code cloned into your bench environment. It's called an "app" because in the Bench ecosystem, **everything (frameworks and apps) is treated as an installable app**.

**So:**
- `frappe` = framework core
- `erpnext` = ERP application built on frappe

---

## Why ERPNext is the "WordPress of ERPs"

### The WordPress Analogy

If you've ever built a website, you know how hard it used to be:
- Custom code
- Expensive developers
- Months of work

Then came **WordPress**. It didn't just simplify website creation — it **democratized it**. Suddenly, anyone could launch a powerful site with just a few clicks.

**No coding. No consultants. Just tools that worked out of the box.**

### The ERP Revolution

Now, imagine that same revolution — but for **business management software**.

That's exactly what ERPNext is doing in the world of ERP systems.

### The Traditional ERP Problem

Most ERPs are:
- **Complex** and difficult to use
- **Expensive** with high licensing costs
- **Built for big companies** with deep pockets and IT teams
- **Require consultants** and long implementations
- **Years of commitment** needed
- **Out of reach** for small and medium businesses

### ERPNext Changes Everything

Like WordPress, ERPNext is:

- **Easy to Install and Use:** Set up quickly, even without a tech background
- **Open Source:** Code is free, transparent, and community-driven
- **Self-Implementable:** No need to hire a third party to get started
- **Modular and Extensible**
    - CRM, inventory, HR, accounting - all built-in
    - Add more modules as you grow
- **Built on Modern Framework (Frappe):** Customization is fast and developer-friendly

### The Mindset Shift

**ERPNext isn't just another ERP. It's a shift in mindset: Enterprise software should be accessible, not exclusive.**

It's designed so that a:
- Small manufacturer
- Startup
- Local service business
- Even Enterprise

Can set up a **full-featured management system** — without going into debt or depending on consultants.

### The Bottom Line

**Just like WordPress gave everyone the power to publish online, ERPNext gives every business the power to:**
- Run efficiently
- Scale smarter
- Take control of their operations

**That's why ERPNext is called the "WordPress of ERPs" — Because it's not just software. It's freedom.**

---

## Getting Started with Frappe Development

### Learning Path

For those interested in becoming Frappe developers, there's a comprehensive learning path available:

**LinkedIn Post:** [How to Become a Frappe Developer - My Learning Journey](https://www.linkedin.com/posts/mohamadamir_how-to-become-a-frappe-developer-my-learning-activity-7359176976936370179-OWxw?utm_source=share&utm_medium=member_desktop&rcm=ACoAADDD5IQBJAbESK6DNV4DLSAHOhljB-dLbsk)

---

## Frappe Ecosystem and Marketplace

### Open Source Applications

**70+ open source applications** are built on top of Frappe, available in the marketplace:

**Marketplace:** [https://cloud.frappe.io/marketplace/search](https://cloud.frappe.io/marketplace/search)

### Popular Categories
- **Business Management**
- **E-commerce**
- **Healthcare**
- **Education**
- **Manufacturing**
- **Retail**
- **And many more...**

---

## Resources
- [https://frappe.io/](https://frappe.io/)
- [https://frappe.io/welcome](https://frappe.io/welcome)
- [https://frappe.io/framework](https://frappe.io/framework)
- [https://frappe.io/story](https://frappe.io/story)

- [https://frappe.io/blog/meet-the-team/how-i-landed-at-webnotes](https://frappe.io/blog/meet-the-team/how-i-landed-at-webnotes)
- [https://frappe.io/blog/announcements/introducing-frappe-incubator](https://frappe.io/blog/announcements/introducing-frappe-incubator)

---

## Bottom Line

### What Frappe Gives You

**Frappe gives you the power to build. ERPNext is just one (very successful) example of what you can build with it.**

### The 90% Rule

**Frappe takes away 90% of the repetitive work needed to build applications.** Instead of worrying about:
- Layouts
- Permissions
- Integrations

You can focus directly on your **business logic and ideas**.

### Who It's For

**It's not just for beginners — it's built for anyone serious about creating real-world, large-scale applications.** With its structured design and no-code flexibility, Frappe gives you the foundation to build software that grows with you.

### The Freedom

**Frappe isn't just a framework. It's freedom to build what you need, when you need it, without the traditional barriers of enterprise software development.**
