# Frappe Web Portals — A Complete Textbook

## About This Book

This book is a deeply detailed, concept-driven guide to understanding Frappe Web Portals. It is written for developers of all levels — from beginners who have never created a portal page to senior developers who want to understand the internal rendering machinery. The goal is simple: after reading this book, you should be able to build, customize, and debug any portal page in Frappe with complete confidence.

The book covers the entire `www/` directory system, the `get_context` mechanism, Jinja templating, the request-to-response lifecycle, and a complete chapter on building custom themes including dark themes and custom fonts.

## Table of Contents

| Chapter | Title |
|---------|-------|
| 1 | [Introduction to Frappe Web Portals](./01-introduction.md) |
| 2 | [The www Directory — Structure and Routing](./02-www-directory.md) |
| 3 | [The Request-to-Response Lifecycle](./03-request-lifecycle.md) |
| 4 | [Jinja Templating in Portal Pages](./04-jinja-templating.md) |
| 5 | [Python Controllers and get_context](./05-get_context.md) |
| 6 | [Standard Context Keys Reference](./06-standard-context-keys.md) |
| 7 | [Behind-the-Scenes Architecture](./07-architecture.md) |
| 8 | [Practical Examples](./08-practical-examples.md) |
| 9 | [Building Custom Themes](./09-custom-themes.md) |
| 10 | [Glossary](./10-glossary.md) |
| 11 | [Adding Custom Themes to the Frappe Desk](./11-desk-themes.md) |

## How to Read This Book

Each chapter builds on the previous one. If you are completely new, start from Chapter 1 and read sequentially. If you already have some experience with Frappe portals, you can skip to the chapters that interest you. However, even experienced developers will find deep insights in Chapters 3 and 7, which explain the internal architecture that is not documented anywhere else.

## Prerequisites

- A working Frappe Bench environment
- Basic understanding of Python and HTML
- Familiarity with the Frappe Framework basics (DocTypes, modules, apps)

---

*"Portal pages are the face of your application to the world. Understanding them is the first step to building great user-facing experiences."*
