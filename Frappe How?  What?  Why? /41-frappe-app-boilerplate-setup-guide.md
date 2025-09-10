# Frappe App Initialization Guide: Professional Setup Process (boilerplate)

## Overview

This guide provides a comprehensive, professional approach to initializing a new Frappe application. The process outlined here ensures proper project structure, maintainability, and follows industry best practices for Frappe development.

## Prerequisites

- Frappe Bench installed and configured
- Git repository access
- Basic understanding of Python and Frappe framework
- Development environment set up

## Step-by-Step Initialization Process

### Step 1: Create New App and Basic Configuration

```bash
bench new-app your-app-name
```

**Configuration Details:**
- **App Title**: Human-readable name for your application
- **App Description**: Comprehensive description explaining the app's purpose and functionality
- **App Publisher**: Your organization or individual name
- **App Email**: Contact email for the application
- **App License**: Choose appropriate license (MIT recommended for most projects)
- **GitHub Workflow**: Set to 'N' for initial setup (can be added later)

### Step 2: Create Changelog File

Create `CHANGELOG.md` in the root directory:

```markdown
# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased] - YYYY-MM-DD

### Added
- Initial app structure
- Basic configuration files

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A
```

**Why This Step Matters:**

This step matters because it provides a **human-readable, chronological history** of all significant changes made to your application, serving as the **single source of truth** for users and developers to understand what's new, what's been fixed, and how the project has evolved, which is essential for transparency, troubleshooting, and effective release management.

### Step 3: Configure setup.py File

Ensure your `setup.py` follows this structure:

```python
from setuptools import setup, find_packages

# get version from __version__ variable in your_app/__init__.py
from your_app import __version__ as version

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

setup(
	name="your_app_name",
	version=version,
	description="Your comprehensive app description",
	author="Your Organization",
	author_email="your-email@domain.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
```

**Why This Step Matters:**

In every Frappe app, the `setup.py` file acts like the identity card of your app. It tells Frappe and Python what your app is called, which version it is, what extra Python libraries it needs, and which files should be included when installing it. Without it, Bench may still link your app in development, but important things will break: your dependencies won’t install automatically, version tracking for patches may fail, and deployment on another server or Docker won’t work properly. With a proper `setup.py`, your app becomes a clean Python package that can be installed anywhere, updated safely, and shared with others. In short, this file is what makes your app reliable, portable, and production-ready.

### Step 4: Initialize Version in __init__.py

Set initial version to `0.1.0` instead of `0.0.1`:

```python
from .constants import *

__version__ = "0.1.0"
```

**Why start with `0.1.0` instead of `0.0.1`?**

The choice between **`0.0.1`** and **`0.1.0`** is about **semantic versioning (SemVer) conventions** and how you communicate the maturity of your app.

- **`0.0.x` means “barely started”**  
  Versions starting with `0.0.` usually suggest an experimental state where the app might not even run properly.  
  It communicates: *don’t expect stability or usable features yet.*

- **`0.1.0` means “early but usable”**  
  The jump to `0.1.0` implies the app is still in development but already has some basic functionality that others can try out.  
  It signals: *this is not production-ready, but it’s installable and useful for testing.*

- **Professional versioning**  
  Many open-source projects (including Frappe itself in early stages) use `0.1.0` as the starting point.  
  It looks more intentional and avoids the impression that the app is just a stub.

- **Clarity for upgrades**  
  With `0.1.0`, future changes like `0.1.1` (patch), `0.2.0` (minor features), and eventually `1.0.0` (stable release) follow the natural flow of semantic versioning.

**In short:**

- `0.0.1` → prototype, almost nothing works  
- `0.1.0` → first usable release with minimal features

---

### Step 5: Add requirements.txt File

Create `requirements.txt` with essential dependencies:

```txt
# frappe -- https://github.com/frappe/frappe is installed via 'bench init'
```

**Why This Step Matters:**

While Frappe itself is installed by Bench, the `requirements.txt` file is critically important for your custom app's specific dependencies. It explicitly declares any additional Python libraries your app needs to function (e.g., `requests`, `pandas`, a special API client). This ensures those specific packages and their correct versions are automatically installed in your Frappe environment, guaranteeing a consistent, reproducible, and conflict-free setup across all deployments—from development to production—preventing the "it works on my machine" problem.

### Step 6: Create Constants File and Import in __init__.py

Create `constants.py`:

```python
# Your App Constants

# App Information
APP_NAME = "Your App Name"
APP_VERSION = "0.1.0"

# Error Messages
ERRORS = {
    "no_permission": "Insufficient permissions"
}

# Configuration Constants
DEFAULT_PAGE_SIZE = 20
MAX_UPLOAD_SIZE = 10485760  # 10MB

# API Constants
API_VERSION = "v1"
DEFAULT_TIMEOUT = 30
```

Import in `__init__.py`:

```python
from .constants import *

__version__ = "0.1.0"
```

**Why This Step Matters:**

This step matters because it centralizes configuration and magic values that are used across multiple files in your app, drastically improving maintainability by ensuring you only need to update a value like `DEFAULT_PAGE_SIZE` in one single place instead of hunting for it throughout your codebase, which reduces errors and enforces consistency.

we import it in `your_app/__init__.py` file, so you can call it directly by your_app name.
```
import my_app, frappe

frappe.throw(_(my_app.ERRORS.get("no_permission")))
```

### Step 7: Add Translation Support

Create `translations/ar.csv` (and other language files as needed):

```csv
"source","translated"
"Welcome","مرحباً"
"Login","تسجيل الدخول"
"Logout","تسجيل الخروج"
```

**Why This Step Matters:**

This step matters because it future-proofs your application for global use by separating user-facing text from the application's code, enabling the translation of the entire interface into different languages (like Arabic) and providing a seamless experience for non-English speakers, which is essential for reaching a wider market and serving diverse user bases.

- Enables internationalization
- Supports multiple languages
- Essential for global applications
- Improves user experience

### Step 8: Set Up Branding Assets

Create directory structure:
```
public/
└── images/
    └── branding/
        ├── favicon.png
        └── logo.png
```

**Asset Requirements:**
- **favicon.png**: 32x32 or 16x16 pixels, ICO format recommended
- **logo.png**: High resolution, transparent background preferred

### Step 9: Configure Logo and Favicon in hooks.py

Add branding configuration to `hooks.py`:

```python
# Website Context & Branding
# ----------

app_logo_url = "/assets/your_app/images/branding/logo.png"

website_context = {
    "favicon": "/assets/your_app/images/branding/favicon.png",
    "splash_image": "/assets/your_app/images/branding/logo.png"
}
```

**Why This Step Matters:**

This step matters because it replaces Frappe's default branding with your own visual identity directly within the website and desktop interfaces, ensuring a consistent, professional appearance that enhances user trust and experience by displaying your custom logo and favicon on browser tabs, login pages, and other key areas.

### Step 10: Create Utils and Install Files

Create `utils/install.py`:

```python
import frappe

def after_install():
    """Runs after app installation"""
    print("Running Your App After Install Hook")
    set_app_logo()
    set_system_settings()
    set_navbar_settings()
    set_website_settings()

def before_migrate():
    """Runs before database migration"""
    print("Running Your App Before Migrate Hook")

def after_migrate():
    """Runs after database migration"""
    print("Running Your App After Migrate Hook")
    set_app_logo()
    set_system_settings()
    set_navbar_settings()
    set_website_settings()

def set_app_logo():
    """Sets app logo in navbar"""
    print("Setting App Logo")
    app_logo = frappe.get_hooks("app_logo_url")[-1]
    frappe.db.set_single_value("Navbar Settings", "app_logo", app_logo)

def set_system_settings():
    """Sets default system settings"""
    print("Setting Default System Settings")
    settings = frappe.get_doc("System Settings")
    settings.session_expiry = "12:00"
    settings.login_with_email_link = False
    settings.store_attached_pdf_document = False
    settings.allow_guests_to_upload_files = True
    settings.link_field_results_limit = 10
    settings.save()

def set_navbar_settings():
    """Sets default navbar settings"""
    print("Setting Default Navbar Settings")
    settings = frappe.get_doc("Navbar Settings")
    settings.logo_width = "35"
    for help_item in settings.help_dropdown:
        if not help_item.item_label == "Keyboard Shortcuts":
            help_item.hidden = True
    settings.save()

def set_website_settings():
    """Sets default website settings"""
    print("Setting Default Website Settings")
    settings = frappe.get_doc("Website Settings")
    settings.app_name = "Your App Name"
    settings.home_page = "login"
    settings.hide_footer_signup = True
    settings.save()
```

Add to `hooks.py`:

```python
# Installation
# ------------

after_migrate = "your_app.utils.install.after_migrate"
```

**Why This Step Matters:**
- Automates post-installation configuration
- Sets up default settings
- Ensures consistent environment
- Reduces manual configuration
- Professional installation process

### Step 11: Create API Structure

Create API directory structure:
```
api/
└── v1/
    ├── __init__.py
    ├── auth.py
    ├── users.py
    └── main.py
```

**Why This Step Matters:**
- Organizes API endpoints
- Enables versioning
- Scalable architecture
- Professional API design
- Facilitates API development

### Step 12: Update README.md

Create comprehensive README:

````markdown
# Your App Name

## Overview

Brief description of your application, its purpose, and key features.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

### Prerequisites

- Frappe Bench installed
- Python 3.8+
- Node.js 14+

### Installation Steps

1. Install the app:
```bash
bench get-app --branch main your_app_name git@github.com:your-org/your-app.git
```

2. Install to site:
```bash
bench --site your-site install-app your_app_name
```

3. Migrate database:
```bash
bench --site your-site migrate
```

4. Build assets:
```bash
bench --site your-site build
```

## Updating the App

1. Update the app:
```bash
bench update --reset --apps your_app_name
```

2. Migrate changes:
```bash
bench --site your-site migrate
```

3. Build assets:
```bash
bench --site your-site build
```

## Uninstalling the App

1. Uninstall from site:
```bash
bench --site your-site uninstall-app your_app_name
```

2. Remove from bench:
```bash
bench remove-app your_app_name
```

## Development

### Running Tests
```bash
bench --site your-site run-tests your_app_name
```

### Building Assets
```bash
bench --site your-site build
```

### Clearing Cache
```bash
bench --site your-site clear-cache
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email your-email@domain.com or create an issue in the repository.
````

### Directory Structure

```
your_app/
├── __init__.py              # Package initialization
├── hooks.py                 # Frappe hooks configuration
├── constants.py             # App constants and configuration
├── modules.txt              # Module definitions
├── patches.txt              # Database patches
├── api/                     # API endpoints
│   └── v1/                  # API version 1
├── config/                  # Configuration files
├── public/                  # Static assets
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   └── images/              # Image assets
│       └── branding/        # Branding assets
├── templates/               # Jinja2 templates
│   ├── includes/            # Template includes
│   └── pages/               # Page templates
├── translations/            # Translation files
│   └── ar.csv              # Arabic translations
├── utils/                   # Utility functions
│   └── install.py          # Installation utilities
└── www/                     # Web pages
```

---

### Step 13: Push to Github

First, commit your initial code and push it to a `dev` branch:

```bash
git add .
git commit -m "feat: initial project setup"
git branch -M dev
git remote add upstream <your-repo-url>
git push upstream dev
```
Then, create a staging branch for QA/testing:
```bash
git checkout -b staging
git push upstream staging
```
#### Why use `upstream` instead of `origin`?

- **`origin`** is the default name that Git gives to the repository you cloned from.  
  It usually refers to *your fork* (if you’re contributing to someone else’s project).  

- **`upstream`** is commonly used to point to the *main shared repository* where the team collaborates.  
  By using `upstream`, you avoid confusion between your personal fork and the central repository.  

**In team workflows:**

- `upstream` = the central, official repo (shared by everyone)  
- `origin` = your own fork or local reference  

This naming convention makes it clear which remote is the **“source of truth”** and prevents accidental pushes to the wrong repo.  

---

#### Why `dev` and not `main`?

- **`main` (or `master`) is for production-ready code**  
  Keep this branch clean and stable. Only tested and approved code should be merged here.  

- **`dev` is for active development**  
  This is where new features and bug fixes are pushed first. It acts as the integration branch for ongoing work.  

- **`staging` is for QA/UAT**  
  Code from `dev` is merged into `staging` for quality assurance and testing. Once verified, it can be promoted to `main`.  
```
Branch Workflow

dev  →  staging  →  main
```
- **`dev`**: development in progress  
- **`staging`**: testing and QA  
- **`main`**: production-ready code  

Some teams prefer to name `main` as **`release`** to make its purpose clearer.

