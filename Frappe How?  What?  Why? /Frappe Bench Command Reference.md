# **Frappe Bench Command Reference - Complete Guide**

## **Table of Contents**
1. [What is Bench?](#what-is-bench)
2. [Why Unix Family Only?](#why-unix-family-only)
3. [How Bench Works](#how-bench-works)
4. [Site Management Commands](#site-management-commands)
5. [App Management Commands](#app-management-commands)
6. [Development Commands](#development-commands)
7. [Database Commands](#database-commands)
8. [Cache & Performance Commands](#cache--performance-commands)
9. [User Management Commands](#user-management-commands)
10. [Backup & Restore Commands](#backup--restore-commands)
11. [Testing Commands](#testing-commands)
12. [Utility Commands](#utility-commands)
13. [Configuration Commands](#configuration-commands)
14. [Advanced Commands](#advanced-commands)

---

## **What is Bench?**

**Bench** is Frappe's command-line interface (CLI) tool that provides a unified way to manage Frappe applications, sites, and development workflows. It's essentially a wrapper around multiple tools and services that power the Frappe ecosystem.

### **Key Features:**
- **Site Management**: Create, backup, restore, and manage multiple sites
- **App Management**: Install, update, and manage Frappe applications
- **Development Tools**: Build assets, watch files, run servers
- **Database Operations**: Direct database access and management
- **Testing Framework**: Run unit tests and UI tests
- **Deployment**: Production deployment and maintenance

---

## **Why Unix Family Only?**

Bench is designed exclusively for **Unix-like operating systems** (Linux, macOS, FreeBSD) for several technical reasons:

### **1. Process Management**
```bash
# Bench uses Unix process management
bench start  # Uses honcho/foreman for process orchestration
```

**Why Unix Only:**
- **Process Forking**: Unix's efficient process creation model
- **Signal Handling**: Proper process lifecycle management
- **Process Groups**: Coordinated process startup/shutdown

### **2. File System Features**
```bash
# Unix file system features used by Bench
ln -s  # Symbolic links for asset management
chmod  # File permissions
```

**Unix Dependencies:**
- **Symbolic Links**: For asset linking and sharing
- **File Permissions**: Proper security model
- **Path Separators**: Forward slashes (`/`) vs Windows backslashes (`\`)

### **3. Shell Environment**
```bash
# Unix shell features
export PATH=...     # Environment variables
source venv/bin/activate  # Virtual environment activation
```

**Shell Requirements:**
- **Bash/Zsh**: Unix shell scripting
- **Environment Variables**: Unix-style env var handling
- **Command Chaining**: Unix pipe and redirection operators

### **4. Package Management**
```bash
# Unix package managers
apt-get install python3  # Debian/Ubuntu
brew install python3     # macOS
yum install python3      # RHEL/CentOS
```

**Why Not Windows:**
- **Different Package Managers**: Windows uses different systems
- **Path Handling**: Windows path limitations
- **Process Model**: Windows process management differs significantly

---

## **How Bench Works**

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────┐
│                    BENCH ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bench CLI     │    │   Frappe Core   │    │   Applications  │
│                 │    │                 │    │                 │
│ • Command       │◄──►│ • Site Manager  │◄──►│ • ERPNext       │
│   Processing    │    │ • App Manager   │    │ • Custom Apps   │
│ • Process       │    │ • Database      │    │ • Themes        │
│   Orchestration │    │   Management    │    │ • Integrations  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Honcho        │    │   Redis         │    │   Database      │
│   (Process      │    │   (Cache &      │    │   (MariaDB/     │
│   Manager)      │    │    Queue)       │    │    PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Command Processing Flow**
```python
# Simplified bench command flow
1. bench [command] [options]
2. Click framework processes arguments
3. Frappe initializes site context
4. Command executes with site context
5. Results returned to user
```

### **Site Context Management**
```python
# Every bench command runs in site context
@pass_context
def command_function(context):
    site = get_site(context)  # Get current site
    frappe.init(site=site)    # Initialize Frappe
    frappe.connect()          # Connect to database
    # ... command logic ...
    frappe.destroy()          # Cleanup
```

---

## **Site Management Commands**

### **1. `bench new-site`**
**Purpose**: Create a new Frappe site

**Syntax:**
```bash
bench new-site [SITE_NAME] [OPTIONS]
```

**Options:**
- `--db-name`: Database name
- `--db-password`: Database password
- `--db-type`: Database type (mariadb/postgres)
- `--db-host`: Database host
- `--db-port`: Database port
- `--admin-password`: Administrator password
- `--install-app`: Install app after creation
- `--set-default`: Set as default site

**Examples:**
```bash
# Basic site creation
bench new-site mysite.local

# With custom database
bench new-site mysite.local --db-name mysite_db --db-password mypass

# With app installation
bench new-site mysite.local --install-app erpnext

# Set as default
bench new-site mysite.local --set-default
```

### **2. `bench use`**
**Purpose**: Set default site for bench commands

**Syntax:**
```bash
bench use [SITE_NAME]
```

**Examples:**
```bash
bench use mysite.local
bench use production.com
```

### **3. `bench drop-site`**
**Purpose**: Remove a site completely

**Syntax:**
```bash
bench drop-site [SITE_NAME] [OPTIONS]
```

**Options:**
- `--db-root-username`: Database root username
- `--db-root-password`: Database root password
- `--no-backup`: Skip backup before deletion
- `--force`: Force deletion even if errors occur

**Examples:**
```bash
# Safe deletion with backup
bench drop-site oldsite.local

# Force deletion without backup
bench drop-site oldsite.local --no-backup --force
```

### **4. `bench reinstall`**
**Purpose**: Wipe site data and reinstall

**Syntax:**
```bash
bench reinstall [OPTIONS]
```

**Options:**
- `--admin-password`: New admin password
- `--yes`: Skip confirmation prompt

**Examples:**
```bash
bench reinstall --admin-password newpass123
bench reinstall --yes
```

### **5. `bench migrate`**
**Purpose**: Run database migrations and patches

**Syntax:**
```bash
bench migrate [OPTIONS]
```

**Options:**
- `--skip-failing`: Skip patches that fail
- `--skip-search-index`: Skip search indexing

**Examples:**
```bash
bench migrate
bench migrate --skip-failing
```

### **6. `bench add-to-hosts`**
**Purpose**: Add site to system hosts file

**Syntax:**
```bash
bench add-to-hosts
```

**Example:**
```bash
bench add-to-hosts
# Adds: 127.0.0.1    mysite.local
```

---

## **App Management Commands**

### **1. `bench get-app`**
**Purpose**: Download and install an app

**Syntax:**
```bash
bench get-app [APP_NAME] [OPTIONS]
```

**Options:**
- `--branch`: Git branch to use
- `--overwrite`: Overwrite existing app

**Examples:**
```bash
# Install from GitHub
bench get-app https://github.com/frappe/erpnext

# Install specific branch
bench get-app erpnext --branch version-14

# Install with overwrite
bench get-app custom-app --overwrite
```

### **2. `bench install-app`**
**Purpose**: Install app to a site

**Syntax:**
```bash
bench install-app [APP_NAME] [OPTIONS]
```

**Options:**
- `--force`: Force installation

**Examples:**
```bash
bench install-app erpnext
bench install-app custom-app --force
```

### **3. `bench uninstall-app`**
**Purpose**: Remove app from site

**Syntax:**
```bash
bench uninstall-app [APP_NAME] [OPTIONS]
```

**Options:**
- `--yes`: Skip confirmation
- `--dry-run`: Show what would be deleted
- `--no-backup`: Skip backup
- `--force`: Force removal

**Examples:**
```bash
bench uninstall-app custom-app
bench uninstall-app old-app --yes --no-backup
```

### **4. `bench list-apps`**
**Purpose**: List installed apps

**Syntax:**
```bash
bench list-apps [OPTIONS]
```

**Options:**
- `--format`: Output format (text/json)

**Examples:**
```bash
bench list-apps
bench list-apps --format json
```

### **5. `bench remove-from-installed-apps`**
**Purpose**: Remove app from installed apps list

**Syntax:**
```bash
bench remove-from-installed-apps [APP_NAME]
```

**Example:**
```bash
bench remove-from-installed-apps old-app
```

---

## **Development Commands**

### **1. `bench start`**
**Purpose**: Start all Frappe services

**Syntax:**
```bash
bench start
```

**What it starts:**
- Web server (Werkzeug/Gunicorn)
- Redis cache and queue
- Background workers
- Scheduler
- SocketIO server
- File watcher (development)

**Example:**
```bash
bench start
# Starts all services defined in Procfile
```

### **2. `bench serve`**
**Purpose**: Start development web server

**Syntax:**
```bash
bench serve [OPTIONS]
```

**Options:**
- `--port`: Port number (default: 8000)
- `--profile`: Enable profiling
- `--proxy`: Run behind proxy
- `--noreload`: Disable auto-reload
- `--nothreading`: Disable threading
- `--with-coverage`: Enable code coverage

**Examples:**
```bash
bench serve
bench serve --port 8001
bench serve --profile --with-coverage
```

### **3. `bench watch`**
**Purpose**: Watch and compile assets automatically

**Syntax:**
```bash
bench watch [OPTIONS]
```

**Options:**
- `--apps`: Watch specific apps

**Examples:**
```bash
bench watch
bench watch --apps erpnext
```

### **4. `bench build`**
**Purpose**: Compile JS and CSS assets

**Syntax:**
```bash
bench build [OPTIONS]
```

**Options:**
- `--app`: Build specific app
- `--apps`: Build specific apps
- `--production`: Production build
- `--hard-link`: Copy instead of symlink
- `--force`: Force build
- `--save-metafiles`: Save build metadata

**Examples:**
```bash
bench build
bench build --app erpnext --production
bench build --apps erpnext,custom-app --force
```

### **5. `bench console`**
**Purpose**: Start interactive Python console

**Syntax:**
```bash
bench console [OPTIONS]
```

**Options:**
- `--autoreload`: Auto-reload code changes

**Examples:**
```bash
bench console
bench console --autoreload
```

### **6. `bench jupyter`**
**Purpose**: Start Jupyter notebook

**Syntax:**
```bash
bench jupyter
```

**Example:**
```bash
bench jupyter
# Opens Jupyter with Frappe context
```

---

## **Database Commands**

### **1. `bench mariadb`**
**Purpose**: Access MariaDB console

**Syntax:**
```bash
bench mariadb [EXTRA_ARGS]
```

**Examples:**
```bash
bench mariadb
bench mariadb -e "SHOW DATABASES;"
```

### **2. `bench postgres`**
**Purpose**: Access PostgreSQL console

**Syntax:**
```bash
bench postgres [EXTRA_ARGS]
```

**Examples:**
```bash
bench postgres
bench postgres -c "\\l"
```

### **3. `bench db-console`**
**Purpose**: Access database console (auto-detects type)

**Syntax:**
```bash
bench db-console [EXTRA_ARGS]
```

**Example:**
```bash
bench db-console
```

### **4. `bench add-database-index`**
**Purpose**: Add database index

**Syntax:**
```bash
bench add-database-index --doctype [DOCTYPE] --column [COLUMN]
```

**Examples:**
```bash
bench add-database-index --doctype "User" --column "email"
bench add-database-index --doctype "Sales Invoice" --column "customer" --column "posting_date"
```

### **5. `bench describe-database-table`**
**Purpose**: Get table statistics

**Syntax:**
```bash
bench describe-database-table --doctype [DOCTYPE] [OPTIONS]
```

**Options:**
- `--column`: Get column statistics

**Examples:**
```bash
bench describe-database-table --doctype "User"
bench describe-database-table --doctype "User" --column "email"
```

### **6. `bench transform-database`**
**Purpose**: Transform database tables

**Syntax:**
```bash
bench transform-database --table [TABLE] [OPTIONS]
```

**Options:**
- `--engine`: Storage engine (InnoDB/MyISAM)
- `--row_format`: Row format (DYNAMIC/COMPACT/REDUNDANT/COMPRESSED)
- `--failfast`: Exit on first failure

**Examples:**
```bash
bench transform-database --table "tabUser" --engine "InnoDB"
bench transform-database --table "all" --row_format "DYNAMIC"
```

---

## **Cache & Performance Commands**

### **1. `bench clear-cache`**
**Purpose**: Clear all caches

**Syntax:**
```bash
bench clear-cache
```

**What it clears:**
- Redis cache
- User cache
- DocType cache
- Website cache

**Example:**
```bash
bench clear-cache
```

### **2. `bench clear-website-cache`**
**Purpose**: Clear website cache only

**Syntax:**
```bash
bench clear-website-cache
```

**Example:**
```bash
bench clear-website-cache
```

### **3. `bench destroy-all-sessions`**
**Purpose**: Log out all users

**Syntax:**
```bash
bench destroy-all-sessions [OPTIONS]
```

**Options:**
- `--reason`: Reason for logout

**Examples:**
```bash
bench destroy-all-sessions
bench destroy-all-sessions --reason "Maintenance"
```

---

## **User Management Commands**

### **1. `bench add-user`**
**Purpose**: Add new user to site

**Syntax:**
```bash
bench add-user [EMAIL] [OPTIONS]
```

**Options:**
- `--first-name`: First name
- `--last-name`: Last name
- `--password`: Password
- `--user-type`: User type
- `--add-role`: Add roles
- `--send-welcome-email`: Send welcome email

**Examples:**
```bash
bench add-user user@example.com --first-name "John" --last-name "Doe"
bench add-user admin@example.com --add-role "System Manager" --send-welcome-email
```

### **2. `bench add-system-manager`**
**Purpose**: Add system manager user

**Syntax:**
```bash
bench add-system-manager [EMAIL] [OPTIONS]
```

**Options:**
- `--first-name`: First name
- `--last-name`: Last name
- `--password`: Password
- `--send-welcome-email`: Send welcome email

**Examples:**
```bash
bench add-system-manager admin@example.com --first-name "Admin"
```

### **3. `bench disable-user`**
**Purpose**: Disable user account

**Syntax:**
```bash
bench disable-user [EMAIL]
```

**Example:**
```bash
bench disable-user user@example.com
```

### **4. `bench set-password`**
**Purpose**: Set user password

**Syntax:**
```bash
bench set-password [USER] [PASSWORD] [OPTIONS]
```

**Options:**
- `--logout-all-sessions`: Log out from all sessions

**Examples:**
```bash
bench set-password user@example.com newpassword123
bench set-password Administrator adminpass --logout-all-sessions
```

### **5. `bench set-admin-password`**
**Purpose**: Set Administrator password

**Syntax:**
```bash
bench set-admin-password [PASSWORD] [OPTIONS]
```

**Options:**
- `--logout-all-sessions`: Log out from all sessions

**Examples:**
```bash
bench set-admin-password newadminpass
bench set-admin-password newadminpass --logout-all-sessions
```

---

## **Backup & Restore Commands**

### **1. `bench backup`**
**Purpose**: Create site backup

**Syntax:**
```bash
bench backup [OPTIONS]
```

**Options:**
- `--with-files`: Include files in backup
- `--include`: Include specific DocTypes
- `--exclude`: Exclude specific DocTypes
- `--backup-path`: Custom backup path
- `--compress`: Compress files
- `--verbose`: Verbose output

**Examples:**
```bash
bench backup
bench backup --with-files --compress
bench backup --include "User,Sales Invoice" --backup-path /backups/
```

### **2. `bench restore`**
**Purpose**: Restore site from backup

**Syntax:**
```bash
bench restore [SQL_FILE_PATH] [OPTIONS]
```

**Options:**
- `--db-root-username`: Database root username
- `--db-root-password`: Database root password
- `--admin-password`: Admin password
- `--install-app`: Install app after restore
- `--with-public-files`: Restore public files
- `--with-private-files`: Restore private files
- `--force`: Force restore
- `--encryption-key`: Backup encryption key

**Examples:**
```bash
bench restore backup.sql
bench restore backup.sql --with-public-files public.tar --with-private-files private.tar
bench restore backup.sql --admin-password newpass --force
```

### **3. `bench partial-restore`**
**Purpose**: Restore partial backup

**Syntax:**
```bash
bench partial-restore [SQL_FILE_PATH] [OPTIONS]
```

**Options:**
- `--verbose`: Verbose output
- `--encryption-key`: Backup encryption key

**Examples:**
```bash
bench partial-restore partial_backup.sql
bench partial-restore partial_backup.sql --encryption-key mykey
```

---

## **Testing Commands**

### **1. `bench run-tests`**
**Purpose**: Run unit tests

**Syntax:**
```bash
bench run-tests [OPTIONS]
```

**Options:**
- `--app`: Test specific app
- `--doctype`: Test specific DocType
- `--module`: Test specific module
- `--test`: Run specific test
- `--profile`: Enable profiling
- `--coverage`: Generate coverage report
- `--junit-xml-output`: Generate JUnit XML
- `--failfast`: Stop on first failure

**Examples:**
```bash
bench run-tests
bench run-tests --app erpnext
bench run-tests --doctype "User" --coverage
bench run-tests --test "test_user_creation" --failfast
```

### **2. `bench run-ui-tests`**
**Purpose**: Run UI tests with Cypress

**Syntax:**
```bash
bench run-ui-tests [APP] [OPTIONS]
```

**Options:**
- `--headless`: Run in headless mode
- `--parallel`: Run in parallel
- `--with-coverage`: Generate coverage
- `--browser`: Browser to use (chrome/firefox)
- `--ci-build-id`: CI build ID

**Examples:**
```bash
bench run-ui-tests erpnext
bench run-ui-tests erpnext --headless --parallel
bench run-ui-tests erpnext --browser firefox --with-coverage
```

### **3. `bench run-parallel-tests`**
**Purpose**: Run tests in parallel

**Syntax:**
```bash
bench run-parallel-tests [OPTIONS]
```

**Options:**
- `--app`: App to test
- `--build-number`: Build number
- `--total-builds`: Total builds
- `--with-coverage`: Generate coverage
- `--use-orchestrator`: Use orchestrator
- `--dry-run`: Don't actually run tests

**Examples:**
```bash
bench run-parallel-tests --app erpnext --total-builds 4 --build-number 1
bench run-parallel-tests --app frappe --with-coverage
```

---

## **Utility Commands**

### **1. `bench execute`**
**Purpose**: Execute Python function

**Syntax:**
```bash
bench execute [METHOD] [OPTIONS]
```

**Options:**
- `--args`: Function arguments
- `--kwargs`: Function keyword arguments
- `--profile`: Enable profiling

**Examples:**
```bash
bench execute "frappe.get_doc('User', 'Administrator')"
bench execute "myapp.utils.send_email" --args "['user@example.com', 'Hello']"
bench execute "myapp.utils.process_data" --kwargs "{'param1': 'value1'}"
```

### **2. `bench request`**
**Purpose**: Make HTTP request to site

**Syntax:**
```bash
bench request [OPTIONS]
```

**Options:**
- `--args`: Request arguments
- `--path`: Path to request JSON

**Examples:**
```bash
bench request --args "?cmd=test&key=value"
bench request --path request.json
```

### **3. `bench browse`**
**Purpose**: Open site in browser

**Syntax:**
```bash
bench browse [SITE] [OPTIONS]
```

**Options:**
- `--user`: Login as user
- `--session-end`: Session end time
- `--user-for-audit`: User for audit trail

**Examples:**
```bash
bench browse
bench browse --user Administrator
bench browse mysite.local --user user@example.com
```

### **4. `bench make-app`**
**Purpose**: Create new app boilerplate

**Syntax:**
```bash
bench make-app [DESTINATION] [APP_NAME] [OPTIONS]
```

**Options:**
- `--no-git`: Don't initialize git

**Examples:**
```bash
bench make-app /path/to/apps myapp
bench make-app /path/to/apps myapp --no-git
```

### **5. `bench create-patch`**
**Purpose**: Create new patch interactively

**Syntax:**
```bash
bench create-patch
```

**Example:**
```bash
bench create-patch
# Interactive patch creation
```

---

## **Configuration Commands**

### **1. `bench set-config`**
**Purpose**: Set site configuration

**Syntax:**
```bash
bench set-config [KEY] [VALUE] [OPTIONS]
```

**Options:**
- `--global`: Set in bench configuration (not site-specific)

**Examples:**
```bash
# Set database configuration
bench set-config db_host localhost
bench set-config db_port 3306
bench set-config db_name mysite_db

# Set Redis configuration
bench set-config redis_cache localhost:13000
bench set-config redis_queue localhost:11000

# Set email configuration
bench set-config smtp_server smtp.gmail.com
bench set-config smtp_port 587
bench set-config smtp_login your-email@gmail.com
bench set-config smtp_password your-password

# Set global bench configuration
bench set-config --global bench_branch version-14
```

### **2. `bench show-config`**
**Purpose**: Display current site configuration

**Syntax:**
```bash
bench show-config [OPTIONS]
```

**Options:**
- `--format`: Output format (text/json)

**Examples:**
```bash
bench show-config
bench show-config --format json
```

**What it shows:**
- Database settings
- Redis settings
- Site settings
- Email settings
- File storage settings
- Custom configurations

---

## **Advanced Commands**

### **1. `bench setup production`**
**Purpose**: Configure production environment

**Syntax:**
```bash
bench setup production [OPTIONS]
```

**What it sets up:**
- Nginx configuration
- Supervisor configuration
- Systemd services
- Production settings
- Log rotation
- Security configurations

**Examples:**
```bash
bench setup production
```

### **2. `bench setup supervisor`**
**Purpose**: Setup Supervisor for process management

**Syntax:**
```bash
bench setup supervisor [OPTIONS]
```

**What it creates:**
- Supervisor configuration files
- Process group definitions
- Log configurations
- Auto-restart policies

**Examples:**
```bash
bench setup supervisor
```

### **3. `bench setup nginx`**
**Purpose**: Setup Nginx web server configuration

**Syntax:**
```bash
bench setup nginx [OPTIONS]
```

**What it configures:**
- Nginx server blocks
- SSL certificates (if available)
- Proxy settings
- Static file serving
- Gzip compression

**Examples:**
```bash
bench setup nginx
```

### **4. `bench setup redis`**
**Purpose**: Setup Redis configuration

**Syntax:**
```bash
bench setup redis [OPTIONS]
```

**What it configures:**
- Redis cache configuration
- Redis queue configuration
- Memory settings
- Persistence options
- Security settings

**Examples:**
```bash
bench setup redis
```

### **5. `bench setup procfile`**
**Purpose**: Create Procfile for process management

**Syntax:**
```bash
bench setup procfile [OPTIONS]
```

**What it creates:**
- Procfile with all services
- Process definitions
- Port configurations
- Environment variables

**Examples:**
```bash
bench setup procfile
```

---

## **System & Maintenance Commands**

### **1. `bench doctor`**
**Purpose**: Diagnose system issues

**Syntax:**
```bash
bench doctor [OPTIONS]
```

**What it checks:**
- Python version compatibility
- Node.js version
- Database connectivity
- Redis connectivity
- File permissions
- Dependencies
- System requirements

**Examples:**
```bash
bench doctor
```

### **2. `bench version`**
**Purpose**: Show Frappe and Bench versions

**Syntax:**
```bash
bench version [OPTIONS]
```

**Examples:**
```bash
bench version
# Output:
# Frappe Framework: 14.x.x
# ERPNext: 14.x.x
# Bench: x.x.x
```

### **3. `bench update`**
**Purpose**: Update all apps to latest versions

**Syntax:**
```bash
bench update [OPTIONS]
```

**Options:**
- `--app`: Update specific app
- `--branch`: Update to specific branch
- `--pull`: Pull latest changes
- `--patch`: Apply patches
- `--build`: Build assets after update

**Examples:**
```bash
# Update all apps
bench update

# Update specific app
bench update --app erpnext

# Update to specific branch
bench update --branch version-14

# Update with build
bench update --build
```

### **4. `bench setup requirements`**
**Purpose**: Install/update Python dependencies

**Syntax:**
```bash
bench setup requirements [OPTIONS]
```

**Examples:**
```bash
bench setup requirements
```

---

## **Common Use Cases & Examples**

### **1. Development Workflow**
```bash
# 1. Start development
bench start

# 2. Make code changes
# 3. Watch for changes (in another terminal)
bench watch

# 4. Install app
bench install-app myapp
```

### **2. Production Deployment**
```bash
# 1. Setup production
bench setup production
```

### **3. Troubleshooting**
```bash
# 1. Check system health
bench doctor

# 2. Clear caches
bench clear-cache

# 3. Check logs
tail -f logs/frappe.log
```

---

## **Environment Variables & Configuration**

### **Important Environment Variables**
```bash
# Site configuration
FRAPPE_SITE=mysite.com

# Database configuration
FRAPPE_DB_HOST=localhost
FRAPPE_DB_PORT=3306
FRAPPE_DB_NAME=mysite_db

# Redis configuration
FRAPPE_REDIS_CACHE=localhost:13000
FRAPPE_REDIS_QUEUE=localhost:11000

# Email configuration
FRAPPE_SMTP_SERVER=smtp.gmail.com
FRAPPE_SMTP_PORT=587
FRAPPE_SMTP_LOGIN=your-email@gmail.com
FRAPPE_SMTP_PASSWORD=your-password
```

### **Configuration Files Location**
```
frappe-bench/
├── sites/
│   └── mysite.com/
│       ├── site_config.json
│       └── common_site_config.json
├── config/
│   ├── redis_cache.conf
│   ├── redis_queue.conf
│   ├── nginx.conf
│   └── supervisor.conf
└── Procfile
```

---

## **Best Practices**

### **1. Development**
- Always use `bench start` for development
- Use `bench watch` for automatic rebuilding
- Test changes before committing
- Keep apps updated regularly
- Use `bench console` for debugging

### **2. Production**
- Use `bench setup production` for deployment
- Monitor logs regularly
- Set up proper backups
- Use supervisor/systemd for process management
- Configure proper firewall rules

### **3. Security**
- Never expose development server to internet
- Use strong passwords for databases
- Keep system updated
- Monitor access logs
- Use HTTPS in production
- Regular security audits

### **4. Performance**
- Monitor Redis memory usage
- Optimize database queries
- Use proper indexing
- Monitor worker processes
- Regular cache clearing

---

## **Quick Reference Cheat Sheet**

```bash
# Site Management
bench new-site <site>          # Create new site
bench use <site>               # Switch to site
bench list-sites               # List all sites
bench drop-site <site>         # Remove site

# Process Management
bench start                     # Start all services
bench stop                      # Stop all services
bench restart                   # Restart all services
bench show-processes           # Show process status

# App Management
bench get-app <app> <url>      # Download app
bench install-app <app>        # Install app
bench uninstall-app <app>      # Remove app
bench new-app <app>            # Create new app

# Development
bench console                   # Python console
bench test                      # Run tests
bench build                     # Build assets
bench watch                     # Watch for changes

# Maintenance
bench migrate                   # Run migrations
bench backup                    # Create backup
bench restore <file>            # Restore from backup
bench clear-cache              # Clear caches

# System
bench doctor                    # System diagnosis
bench version                   # Show versions
bench show-config              # Show configuration
bench setup production          # Setup production
```

---

## **Why This Architecture?**

### **1. Unix Philosophy**
- **Do one thing well**: Each command has a single responsibility
- **Compose with pipes**: Commands can be chained together
- **Text-based interfaces**: Easy to script and automate

### **2. Development Efficiency**
- **Unified interface**: One tool for all operations
- **Environment management**: Automatic virtual environment handling
- **Process coordination**: Manages multiple services together
- **Asset management**: Automatic building and watching

### **3. Production Readiness**
- **Process management**: Reliable service management
- **Configuration management**: Centralized configuration
- **Monitoring**: Built-in health checks and logging
- **Scalability**: Easy to scale horizontally

---

## **Common Use Cases & Examples**

### **1. Development Workflow**
```bash
# 1. Start development
bench start

# 2. Make code changes
# 3. Watch for changes (in another terminal)
bench watch

# 4. Test changes
bench test

# 5. Install app
bench install-app myapp
```

### **2. Production Deployment**
```bash
# 1. Setup production
bench setup production

# 2. Start services
bench start --daemon

# 3. Check status
bench show-processes

# 4. Monitor logs
tail -f logs/frappe.log
```

### **3. Troubleshooting**
```bash
# 1. Check system health
bench doctor

# 2. Clear caches
bench clear-cache

# 3. Check processes
bench show-processes

# 4. Check logs
tail -f logs/frappe.log
```

### **4. Database Management**
```bash
# 1. Create backup
bench backup

# 2. Run migrations
bench migrate

# 3. Check database
bench mariadb
```

---

## **Integration with Other Tools**

### **1. Git Integration**
```bash
# Bench works seamlessly with Git
git pull origin main
bench migrate
bench build
bench restart
```

### **2. CI/CD Integration**
```bash
# Example CI/CD pipeline
bench test
bench build --production
bench backup
bench migrate
bench restart
```

### **3. Docker Integration**
```bash
# Bench can be containerized
docker build -t frappe-bench .
docker run -p 8000:8000 frappe-bench
```

---

## **Monitoring & Logging**

### **1. Log Files**
```bash
# Main application logs
tail -f logs/frappe.log

# Worker logs
tail -f logs/worker.log

# Scheduler logs
tail -f logs/scheduler.log

# Bench logs
tail -f logs/bench.log
```

### **2. Process Monitoring**
```bash
# Check process status
bench show-processes

# Monitor system resources
htop
iotop
```

### **3. Performance Monitoring**
```bash
# Check Redis memory
redis-cli info memory

# Check database performance
bench mariadb -e "SHOW PROCESSLIST;"
```

---
