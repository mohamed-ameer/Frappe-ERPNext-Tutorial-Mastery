# What is Frappe? 
It’s not just a framework — it’s also a set of applications.

Many people think of Frappe only as the framework behind ERPNext.  
But it’s more accurate to say:  
**Frappe is both a full-stack development framework and a platform with built-in applications.**

---

## Frappe Framework
A modern, open-source framework built with Python (backend) and JavaScript (frontend).  
It gives developers everything needed to build web apps fast:

- ORM, REST APIs, user authentication  
- Role-based permissions  
- Background jobs  
- Admin UI (called "Desk")  
- Web portal & form builder  

But unlike barebones frameworks, Frappe doesn’t leave you starting from zero.

---

## Frappe Comes with Core Apps
When you install Frappe, you don’t get an empty shell.  
You get ready-to-use modules out of the box:

- **Desk** – the powerful admin interface  
- **User & Role Management**  
- **Website & Blog Engine**  
- **File Storage, Scheduler, Logging, etc.**  

So yes — **Frappe is not just a framework. It’s a framework plus core applications that make it instantly usable.**

---

## ERPNext is the flagship app built on Frappe
ERPNext is a full business management system (accounting, inventory, HR, CRM, etc.) — built entirely on top of Frappe.  
It depends on both the framework and the core Frappe apps.

Think of it like this:

```
ERPNext (Business Application)
──────────────────────────────
Frappe Core Apps (Desk, Website, Users, etc.)
──────────────────────────────
Frappe Framework (Code, APIs, Security, ORM)
```

---

## A little history
Frappe wasn’t always called Frappe.  
It was called **"Web Notes"** and the company behind it was also named **"Web Notes Technologies Pvt. Ltd."**

As the platform evolved into a full framework, the team rebranded:  
**"Web Notes" became "Frappe".**

Today, thousands use Frappe to build not just ERPs, but custom business apps across industries.

---

## Bottom line
Frappe gives you the power to build.  
ERPNext is just one (very successful) example of what you can build with it.

---

## Why you see `apps/frappe` in your bench?
Is frappe an app?!  

When you install Frappe + ERPNext using Bench, you’ll see:

```
~/frappe-bench/apps/frappe     # the framework
~/frappe-bench/apps/erpnext    # the ERP app
```

The **frappe** folder here is literally the framework’s source code cloned into your bench environment.  
It’s called an "app" because in the Bench ecosystem, everything (frameworks and apps) is treated as an installable *app*.  
Even though Frappe is technically a framework, Bench installs it as if it’s an app.

So:

- **frappe** = framework core  
- **erpnext** = ERP application built on frappe  

---

## Why ERPNext is Considered the "WordPress of ERPs"

If you’ve ever built a website, you know how hard it used to be — custom code, expensive developers, months of work.

Then came **WordPress**. It didn’t just simplify website creation — it *democratized* it. Suddenly, anyone could launch a powerful site with just a few clicks. No coding. No consultants. Just tools that worked out of the box.

Now, imagine that same revolution — but for **business management software**.

That’s exactly what **ERPNext** is doing in the world of ERP systems.

Most ERPs are complex, expensive, and built for big companies with deep pockets and IT teams. They require consultants, long implementations, and years of commitment. For small and medium businesses? They’re often out of reach — both financially and technically.

ERPNext changes that.

Like WordPress, it’s:

- **Easy to install and use** – You can set it up quickly, even without a tech background.
- **Open source** – The code is free, transparent, and community-driven.
- **Self-implementable** – No need to hire a third party to get started.
- **Modular and extensible** – Need CRM, inventory, HR, or accounting? It comes with all of them built in. Add more as you grow.
- **Built on a modern framework (Frappe)** – Making customization fast and developer-friendly.

ERPNext isn’t just another ERP. It’s a shift in mindset:  
*Enterprise software should be accessible, not exclusive.*

It’s designed so that a small manufacturer, a startup, or a local service business can set up a full-featured management system — without going into debt or depending on consultants.

Just like WordPress gave everyone the power to publish online,  
**ERPNext gives every business the power to run efficiently, scale smarter, and take control of their operations.**

That’s why ERPNext is called the **"WordPress of ERPs"** —  
Because it’s not just software.  
It’s freedom.

