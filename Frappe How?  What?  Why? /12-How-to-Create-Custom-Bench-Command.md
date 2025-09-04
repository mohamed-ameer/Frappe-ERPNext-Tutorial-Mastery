# **Custom Bench Commands - Complete Story**

## **Table of Contents**
#### 1. Introduction & Theory
#### 2. Understanding Bench Command Architecture
#### 3. Command Discovery System
#### 4. Creating Your First Custom Command
#### 5. Advanced Command Patterns
#### 6. Command Registration Deep Dive
#### 7. Best Practices & Patterns
#### 8. Troubleshooting & Debugging
#### 9. Q&A Section

---

## **Introduction & Theory**

### **What Are Custom Bench Commands?**

Custom bench commands are your own CLI (command-line) tools built on top of Frappe's bench. Instead of only using the built-in commands (like `bench start` or `bench migrate`), you can create new ones that match your project's needs—like clearing a specific cache, generating reports, or listing all sites. They're great for automating repetitive tasks, simplifying long console queries, and giving your team handy shortcuts directly inside the familiar bench command.

### **Why Use Custom Commands?**

Custom bench commands are super useful because they let you automate and extend Bench with actions that fit your own workflow instead of relying only on the defaults. Instead of typing long console queries or repeating the same steps every time, you can wrap that logic in a simple command and run it with one line, like `bench clear-admin-lang-cache` or `bench list-sites`.

This keeps your work faster, reduces human error, and makes your tooling feel tailored to your team or project. They’re also easy to share—if you add them inside your app, anyone who installs your app automatically gets those extra commands, turning repetitive fixes or checks into reliable tools.

### **How Bench Commands Work**

#### **Command Processing Flow:**
```
User Input → Click Framework → Frappe Context → Command Execution → Output
```
- **User Input** → You type something like `bench list-sites`.
- **Click Framework** → Bench uses the **Click** Python library to parse your command, check options/flags (like `--site`), and map it to the correct function.
- **Frappe Context** → Before running your code, Bench sets up the Frappe environment:
    - Loads the current site (if applicable)
    - Connects to Redis and the database
    - Initializes the `frappe` object so you can use `frappe.db`, `frappe.get_doc`, etc.
- **Command Execution** → Your custom Python function runs (e.g., listing sites, clearing cache, or migrating).
- **Output** → The result is printed back in your terminal.

#### **Key Components:**
1. **Click Framework**: Handles command-line argument parsing and execution
    - Think of it as the command-line engine.
    - It takes care of parsing your command, reading arguments (--site), and calling the right Python function.
2. **Frappe Context**: Provides site context, database connections, and Frappe utilities
    - Makes sure your function runs inside a Frappe site.
    - Sets up things like database connection, Redis cache, and user session.
    - Without this, your function wouldn’t know which site’s data to use.
3. **Command Discovery**: Automatic discovery and registration of custom commands
    - You don’t have to manually register each new command with Bench.
    - As long as you add them to `commands = []` under `<your-app>/commands.py`, Bench will automatically find and load them.
4. **Site Context**: Access to current site configuration and data
    - This is the active site you’re working on (e.g., site1.local).
    - It defines which database, apps, and configs your command should use.

---

## **Understanding Bench Command Architecture**

### **Command Structure Overview**

#### **Basic Command Components:**
```python
import click
from frappe.commands import pass_context

@click.command('command-name')  # Command decorator
@pass_context                  # Context decorator
def command_function(context): # Command function
    """Command description"""   # Help text
    # Command logic here
```

#### **Command Decorators Explained:**

**1. `@click.command()`**
- **Purpose**: Defines a CLI command
- **Parameters**: Command name, help text, options
- **Example**: `@click.command('my-command')`

**2. `@pass_context`**
- **Purpose**: Passes Frappe context to the command
- **Provides**: Site information, database connections, configuration
- **Required**: For most Frappe-related operations

**3. `@get_site_context`**
- **Purpose**: Ensures site context is properly initialized
- **Provides**: Active site connection, database access
- **Use**: When working with site-specific data

### **Command Types**

#### **1. Simple Commands**
```python
@click.command('hello')
@pass_context
def hello(context):
    """Simple hello command"""
    click.echo("Hello from custom command!")
```

#### **2. Commands with Options**
```python
@click.command('process')
@click.option('--input', '-i', required=True, help='Input file')
@click.option('--output', '-o', help='Output file')
@pass_context
def process(context, input, output):
    """Process files with options"""
    click.echo(f"Processing {input} to {output}")
```

#### **3. Command Groups**
```python
@click.group()
def my_app():
    """My App commands"""
    pass

@my_app.command('subcommand')
@pass_context
def subcommand(context):
    """Subcommand description"""
    click.echo("Subcommand executed!")
```

---

## **Command Discovery System**

### **How Frappe Actually Discovers Commands**

#### **Real Discovery Process (Based on Actual Frappe Code):**
```python
# From apps/frappe/frappe/utils/bench_helper.py
def get_app_commands(app: str) -> dict:
    ret = {}
    try:
        # Frappe looks for: app_name.commands (NOT app_name.frappe.commands.commands)
        app_command_module = importlib.import_module(f"{app}.commands")
    except ModuleNotFoundError as e:
        if e.name == f"{app}.commands":
            return ret
        traceback.print_exc()
        return ret
    except Exception:
        traceback.print_exc()
        return ret
    
    # Extract commands from the module
    for command in getattr(app_command_module, "commands", []):
        ret[command.name] = command
    return ret
```

#### **Discovery Requirements:**
1. **App must be installed**: `bench install-app your_app`
2. **Correct file structure**: `apps/your_app/your_app/commands.py`
3. **Commands list**: Must have `commands = [...]` variable
4. **Proper imports**: Must import Click and Frappe decorators

### **File Structure Requirements**

#### **Correct Directory Structure:**
```
apps/your_app/
├── your_app/
│   ├── __init__.py
│   ├── commands.py          ← Commands go here (NOT in frappe/commands/)
│   └── config/
├── setup.py
└── pyproject.toml
```

#### **Why This Structure:**
- **Modular**: Each app manages its own commands
- **Discoverable**: Frappe automatically finds commands
- **Organized**: Clear separation of concerns
- **Scalable**: Easy to add new commands

---

## **Creating Your First Custom Command**

### **Remember:**
Custom bench commands are nothing but **Python functions** that:
- Use **Click decorators** (like `@click.command()` and `@click.pass_context`)
- Are added to a list named `commands`
- Are defined in a file called `commands.py` inside your app directory

When you install your app, **Frappe automatically scans** for this file, reads the `commands` list, and registers each function as a CLI command available via `bench`.

#### **Step 1: Create App Structure**
```bash
# Create the required directory structure
mkdir -p apps/my_app/my_app
touch apps/my_app/my_app/commands.py
touch apps/my_app/my_app/__init__.py
```

#### **Step 2: Create Basic Command**
```python
# apps/my_app/my_app/commands.py

import click
from frappe.commands import pass_context

@click.command('hello')
@pass_context
def hello(context):
    """Say hello from My App"""
    click.echo("Hello from My Custom App!")

# Register the command
commands = [hello]
```

#### **Step 3: Install Your App**
```bash
# Install your app to make commands available
bench install-app my_app
```

#### **Step 4: Test Your Command**
```bash
# Test your custom command
bench hello
# Output: Hello from My Custom App!
```
> BTW you don't need to start the server, bench will load it immediately after you create the `commands.py` file and add the `commands= []`

### **Advanced First Command**

#### **Command with Options and Site Context:**
```python
# apps/my_app/my_app/commands.py

import click
from frappe.commands import pass_context, get_site_context

@click.command('user-info')
@click.option('--user', '-u', default='Administrator', help='Username to get info for')
@pass_context
@get_site_context
def user_info(context, user):
    """Get user information"""
    import frappe
    
    try:
        user_doc = frappe.get_doc('User', user)
        click.echo(f"User: {user_doc.full_name}")
        click.echo(f"Email: {user_doc.email}")
        click.echo(f"Enabled: {user_doc.enabled}")
    except frappe.DoesNotExistError:
        click.echo(f"User '{user}' not found")

# Register the command
commands = [user_info]
```

---

## **Advanced Command Patterns**

### **1. Database Operations Commands**

#### **Custom Migration Command:**
```python
@click.command('custom-migrate')
@click.option('--doctype', help='Specific DocType to migrate')
@click.option('--force', is_flag=True, help='Force migration')
@pass_context
@get_site_context
def custom_migrate(context, doctype, force):
    """Custom migration command"""
    import frappe
    
    if doctype:
        click.echo(f"Migrating DocType: {doctype}")
        # Custom migration logic for specific DocType
        frappe.db.commit()
    else:
        click.echo("Running full migration")
        # Full migration logic
    
    click.echo("Migration completed!")

commands = [custom_migrate]
```

#### **Database Query Command:**
```python
@click.command('custom-query')
@click.option('--query', required=True, help='SQL query to execute')
@click.option('--limit', default=10, help='Limit results')
@pass_context
@get_site_context
def custom_query(context, query, limit):
    """Execute custom database query"""
    import frappe
    
    try:
        result = frappe.db.sql(query, as_dict=True)
        click.echo(f"Query executed successfully. Found {len(result)} records.")
        
        # Display results with limit
        for i, row in enumerate(result[:limit]):
            click.echo(f"Row {i+1}: {row}")
        
        if len(result) > limit:
            click.echo(f"... and {len(result) - limit} more records")
    
    except Exception as e:
        click.echo(f"Error executing query: {str(e)}")

commands = [custom_query]
```

### **2. File Processing Commands**

#### **File Processing with Progress:**
```python
@click.command('process-files')
@click.option('--source', required=True, help='Source directory')
@click.option('--destination', required=True, help='Destination directory')
@click.option('--pattern', default='*.txt', help='File pattern')
@pass_context
def process_files(context, source, destination, pattern):
    """Process files with progress bar"""
    import os
    import glob
    import shutil
    
    # Find files matching pattern
    files = glob.glob(os.path.join(source, pattern))
    
    if not files:
        click.echo("No files found matching pattern")
        return
    
    # Process files with progress bar
    with click.progressbar(files, label='Processing files') as bar:
        for file in bar:
            filename = os.path.basename(file)
            dest_file = os.path.join(destination, filename)
            shutil.copy2(file, dest_file)
    
    click.echo(f"Processed {len(files)} files")

commands = [process_files]
```

### **3. Background Job Commands**

#### **Background Job Command:**
```python
@click.command('run-background-job')
@click.option('--job-type', required=True, help='Type of job to run')
@click.option('--queue', default='default', help='Queue to use')
@pass_context
@get_site_context
def run_background_job(context, job_type, queue):
    """Run background job"""
    import frappe
    from frappe.utils.background_jobs import enqueue
    
    def job_function():
        click.echo(f"Running {job_type} job...")
        # Your job logic here
        click.echo("Job completed!")
    
    # Enqueue the job
    job = enqueue(
        job_function,
        job_name=f"custom_{job_type}_job",
        queue=queue
    )
    
    click.echo(f"Job enqueued with ID: {job.id}")

commands = [run_background_job]
```

### **4. Configuration Commands**

#### **Configuration Management:**
```python
@click.command('set-custom-config')
@click.option('--key', required=True, help='Configuration key')
@click.option('--value', required=True, help='Configuration value')
@pass_context
@get_site_context
def set_custom_config(context, key, value):
    """Set custom configuration"""
    import frappe
    
    # Set configuration
    frappe.db.set_value('System Settings', 'System Settings', key, value)
    frappe.db.commit()
    
    click.echo(f"Configuration {key} set to {value}")

@click.command('get-custom-config')
@click.option('--key', required=True, help='Configuration key')
@pass_context
@get_site_context
def get_custom_config(context, key):
    """Get custom configuration"""
    import frappe
    
    value = frappe.db.get_value('System Settings', 'System Settings', key)
    click.echo(f"{key}: {value}")

commands = [set_custom_config, get_custom_config]
```

---

## **Command Registration Deep Dive**

### **The Magic Behind `commands = [...]`**

#### **Why It's Not Just a Variable:**
```python
# This line is NOT just a variable assignment
commands = [my_command]

# It's a DISCOVERY MECHANISM that Frappe uses to:
# 1. Find your commands automatically
# 2. Register them with the Click framework
# 3. Make them available to bench
```

#### **How Frappe Actually Processes This:**
```python
# When bench starts, Frappe automatically runs (from bench_helper.py):

def get_app_commands(app: str) -> dict:
    """Load commands from a specific app"""
    ret = {}
    try:
        # Import your commands module: app_name.commands
        app_command_module = importlib.import_module(f"{app}.commands")
        
        # Extract your commands list
        for command in getattr(app_command_module, "commands", []):
            ret[command.name] = command
            # command = your Click command object!
            
    except ModuleNotFoundError:
        # App doesn't have commands.py
        pass
    except Exception:
        # Other errors
        pass
    
    return ret
```

### **Registration Methods**

#### **Method 1: Direct List (Recommended)**
```python
# Simple and direct
commands = [command1, command2, command3]
```

#### **Method 2: Function-Based**
```python
def get_commands():
    """Return commands dynamically"""
    return [command1, command2, command3]

commands = get_commands()
```

#### **Method 3: Conditional Registration**
```python
def get_commands():
    """Register commands based on conditions"""
    commands = []
    
    # Always include basic commands
    commands.append(basic_command)
    
    # Include advanced commands only if conditions are met
    if some_condition:
        commands.append(advanced_command)
    
    return commands

commands = get_commands()
```

### **Why setup.py Doesn't Work**

#### **setup.py Purpose:**
```python
# setup.py is for package management, NOT command registration
from setuptools import setup, find_packages

setup(
    name="my_app",
    version="1.0.0",
    packages=find_packages(),
    install_requires=["frappe>=14.0.0"],
    # Commands are NOT registered here!
)
```

#### **Why Frappe Ignores setup.py:**
- **Different purposes**: setup.py for installation, commands.py for functionality
- **Discovery system**: Frappe only looks in `app_name.commands` module
- **Convention**: The `commands = [...]` list is the established convention
- **Automatic discovery**: Frappe scans installed apps and imports their commands modules

---

## **Best Practices & Patterns**

### **1. Command Design Principles**

#### **Single Responsibility:**
```python
# Good: Each command has one clear purpose
@click.command('backup-database')
def backup_database():
    """Backup database only"""
    pass

@click.command('backup-files')
def backup_files():
    """Backup files only"""
    pass

# Bad: One command doing multiple things
@click.command('backup-everything')
def backup_everything():
    """Backup database and files"""
    pass
```

#### **Clear Naming:**
```python
# Good: Clear, descriptive names
@click.command('export-user-data')
@click.command('import-csv-data')
@click.command('cleanup-old-files')

# Bad: Unclear names
@click.command('do-stuff')
@click.command('process')
@click.command('run')
```

### **2. Error Handling**

#### **Proper Error Handling:**
```python
@click.command('safe-operation')
@pass_context
@get_site_context
def safe_operation(context):
    """Operation with proper error handling"""
    import frappe
    
    try:
        # Your operation here
        result = frappe.db.sql("SELECT * FROM tabUser", as_dict=True)
        click.echo(f"Operation successful: {len(result)} users found")
        
    except frappe.DatabaseError as e:
        click.echo(f"Database error: {str(e)}", err=True)
        raise click.Abort()
        
    except Exception as e:
        click.echo(f"Unexpected error: {str(e)}", err=True)
        raise click.Abort()
```

### **3. User Experience**

#### **Helpful Output:**
```python
@click.command('process-data')
@click.option('--input', required=True, help='Input file path')
@pass_context
def process_data(context, input):
    """Process data with helpful feedback"""
    import os
    
    # Validate input
    if not os.path.exists(input):
        click.echo(f"Error: File '{input}' not found", err=True)
        raise click.Abort()
    
    # Show progress
    click.echo(f"Processing file: {input}")
    
    # Process with feedback
    with click.progressbar(range(100), label='Processing') as bar:
        for i in bar:
            # Your processing logic here
            pass
    
    click.echo("Processing completed successfully!")
```

### **4. Configuration Management**

#### **Environment-Aware Commands:**
```python
@click.command('environment-info')
@pass_context
@get_site_context
def environment_info(context):
    """Show environment information"""
    import frappe
    
    click.echo("Environment Information:")
    click.echo(f"Site: {frappe.local.site}")
    click.echo(f"Database: {frappe.conf.db_name}")
    click.echo(f"Redis Cache: {frappe.conf.redis_cache}")
    click.echo(f"Redis Queue: {frappe.conf.redis_queue}")
```

---

## **Troubleshooting & Debugging**

### **Common Issues and Solutions**

#### **1. Commands Not Found**

**Problem**: `bench my-command` returns "command not found"

**Solutions**:
```bash
# Check if app is installed
bench list-apps

# Check file structure
ls -la apps/my_app/my_app/

# Check if commands.py exists
cat apps/my_app/my_app/commands.py

# Reinstall app
bench uninstall-app my_app
bench install-app my_app
```

#### **2. Import Errors**

**Problem**: Import errors when running commands

**Solutions**:
```python
# Check imports in commands.py
import click
from frappe.commands import pass_context, get_site_context

# Test imports manually
python -c "import my_app.commands; print('Import successful')"
```

#### **3. Site Context Issues**

**Problem**: Commands fail with site context errors

**Solutions**:
```python
# Use proper decorators
@pass_context
@get_site_context
def my_command(context):
    import frappe
    # frappe.local.site is now available
```

#### **4. Permission Issues**

**Problem**: Permission denied errors

**Solutions**:
```bash
# Fix file permissions
chmod 644 apps/my_app/my_app/commands.py

# Fix directory permissions
chmod 755 apps/my_app/my_app/
```

### **Debugging Techniques**

#### **1. Enable Verbose Output:**
```python
@click.command('debug-command')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@pass_context
def debug_command(context, verbose):
    """Command with debug output"""
    if verbose:
        click.echo("Debug mode enabled")
        click.echo(f"Context: {context}")
        click.echo(f"Site: {frappe.local.site}")
```

#### **2. Test Commands Manually:**
```python
# Test your command function directly
from my_app.commands import my_command
from click.testing import CliRunner

runner = CliRunner()
result = runner.invoke(my_command, ['--option', 'value'])
print(result.output)
```

---

## **Q&A Section**

### **Q1: Where exactly should I put my commands.py file?**

**A:** Based on the actual Frappe code in `bench_helper.py`, your commands should go in:
```
apps/your_app/your_app/commands.py
```

**NOT** in:
```
apps/your_app/your_app/frappe/commands/commands.py
```

The Frappe discovery system looks for `app_name.commands` module, which translates to `your_app/commands.py`.

### **Q2: Why does `commands = [my_command]` work? It looks like just a variable assignment.**

**A:** You're right to question this! It's not just a variable assignment. Here's what actually happens:

1. **Frappe imports** your `commands.py` module using `importlib.import_module(f"{app}.commands")`
2. **Python executes** your file and creates the `commands` variable
3. **Frappe extracts** the list using `getattr(app_command_module, "commands", [])`
4. **Frappe registers** each command by name in a dictionary: `ret[command.name] = command`
5. **Your commands** become available through bench

So while it looks like a simple variable, it's actually a **discovery mechanism** that Frappe uses to automatically find and register your commands.

### **Q3: Can I register commands in setup.py instead?**

**A:** No, you cannot register Frappe commands in `setup.py`. Here's why:

- **setup.py** is for package installation, dependencies, and metadata
- **Frappe only looks** in `app_name.commands` modules for commands
- **The discovery system** specifically imports `app_name.commands`, not setup.py
- **No alternative methods** exist - the `commands = [...]` list is the only way

### **Q4: What if I want to organize my commands into multiple files?**

**A:** You can organize commands in multiple ways:

#### **Method 1: Multiple files with imports**
```python
# apps/my_app/my_app/commands.py
from .db_commands import db_commands
from .file_commands import file_commands
from .utils_commands import utils_commands

# Combine all commands
commands = db_commands + file_commands + utils_commands
```

#### **Method 2: Command groups**
```python
# apps/my_app/my_app/commands.py
@click.group()
def my_app():
    """My App commands"""
    pass

@my_app.group()
def db():
    """Database commands"""
    pass

@my_app.group()
def files():
    """File commands"""
    pass

commands = [my_app]
```

### **Q5: How do I test my custom commands?**

**A:** You can test commands in several ways:

#### **Method 1: Direct testing**
```bash
# Test if command is available
bench --help | grep my-command

# Test command execution
bench my-command --option value
```

#### **Method 2: Python testing**
```python
# Test command function directly
from my_app.commands import my_command
from click.testing import CliRunner

runner = CliRunner()
result = runner.invoke(my_command, ['--option', 'value'])
assert result.exit_code == 0
```

#### **Method 3: Import testing**
```bash
# Test if module can be imported
python -c "import my_app.commands; print('Import successful')"
```

### **Q6: Why do my commands not appear after installing my app?**

**A:** Common reasons and solutions:

1. **Wrong file location**: Commands must be in `apps/your_app/your_app/commands.py`
2. **App not installed**: Run `bench install-app your_app`
3. **Import errors**: Check that your commands.py can be imported
4. **Missing commands list**: Must have `commands = [...]` variable
5. **Syntax errors**: Check for Python syntax errors in commands.py

### **Q7: Can I create commands that work across multiple sites?**

**A:** Yes, but you need to be careful about site context:

#### **Site-agnostic commands:**
```python
@click.command('global-info')
@pass_context
def global_info(context):
    """Command that works without site context"""
    click.echo("This works without a specific site")
```

#### **Site-specific commands:**
```python
@click.command('site-info')
@pass_context
@get_site_context
def site_info(context):
    """Command that requires site context"""
    import frappe
    click.echo(f"Current site: {frappe.local.site}")
```

### **Q8: How do I handle errors gracefully in my commands?**

**A:** Use proper error handling patterns:

```python
@click.command('safe-command')
@pass_context
@get_site_context
def safe_command(context):
    """Command with proper error handling"""
    import frappe
    
    try:
        # Your operation here
        result = frappe.db.sql("SELECT * FROM tabUser", as_dict=True)
        click.echo(f"Success: {len(result)} users found")
        
    except frappe.DatabaseError as e:
        click.echo(f"Database error: {str(e)}", err=True)
        raise click.Abort()
        
    except Exception as e:
        click.echo(f"Unexpected error: {str(e)}", err=True)
        raise click.Abort()
```

### **Q9: Can I create interactive commands?**

**A:** Yes, Click supports interactive features:

```python
@click.command('interactive-setup')
@pass_context
def interactive_setup(context):
    """Interactive command setup"""
    name = click.prompt('Enter your name')
    email = click.prompt('Enter your email')
    confirm = click.confirm('Is this correct?')
    
    if confirm:
        click.echo(f"Setup complete for {name} ({email})")
    else:
        click.echo("Setup cancelled")
```

### **Q10: How do I create commands with subcommands?**

**A:** Use Click groups to create command hierarchies:

```python
@click.group()
def my_app():
    """My App management commands"""
    pass

@my_app.command('create')
@click.option('--name', required=True)
def create(name):
    """Create something"""
    click.echo(f"Creating {name}")

@my_app.command('delete')
@click.option('--name', required=True)
def delete(name):
    """Delete something"""
    click.echo(f"Deleting {name}")

@my_app.command('list')
def list_items():
    """List items"""
    click.echo("Listing items")

commands = [my_app]
```

Usage:
```bash
bench my-app create --name test
bench my-app delete --name test
bench my-app list
```

### **Q11: Can I use environment variables in my commands?**

**A:** Yes, you can access environment variables:

```python
@click.command('env-info')
@pass_context
def env_info(context):
    """Show environment information"""
    import os
    
    click.echo(f"Python path: {os.environ.get('PYTHONPATH', 'Not set')}")
    click.echo(f"Site: {os.environ.get('FRAPPE_SITE', 'Not set')}")
    click.echo(f"Database: {os.environ.get('FRAPPE_DB_NAME', 'Not set')}")
```

### **Q12: How do I create commands that run in the background?**

**A:** Use Frappe's background job system:

```python
@click.command('background-task')
@click.option('--task-type', required=True)
@pass_context
@get_site_context
def background_task(context, task_type):
    """Run background task"""
    import frappe
    from frappe.utils.background_jobs import enqueue
    
    def task_function():
        click.echo(f"Running {task_type} task...")
        # Your task logic here
        click.echo("Task completed!")
    
    job = enqueue(
        task_function,
        job_name=f"custom_{task_type}_task",
        queue="default"
    )
    
    click.echo(f"Task enqueued with ID: {job.id}")
```

### **Q13: Can I create commands that work with files?**

**A:** Yes, you can create file processing commands:

```python
@click.command('process-files')
@click.option('--input-dir', required=True, help='Input directory')
@click.option('--output-dir', required=True, help='Output directory')
@click.option('--pattern', default='*.txt', help='File pattern')
@pass_context
def process_files(context, input_dir, output_dir, pattern):
    """Process files with pattern matching"""
    import os
    import glob
    import shutil
    
    # Find files
    files = glob.glob(os.path.join(input_dir, pattern))
    
    if not files:
        click.echo("No files found")
        return
    
    # Process with progress bar
    with click.progressbar(files, label='Processing') as bar:
        for file in bar:
            filename = os.path.basename(file)
            dest = os.path.join(output_dir, filename)
            shutil.copy2(file, dest)
    
    click.echo(f"Processed {len(files)} files")
```

### **Q14: How do I debug my custom commands?**

**A:** Use these debugging techniques:

#### **Enable verbose output:**
```python
@click.command('debug-command')
@click.option('--verbose', '-v', is_flag=True, help='Verbose output')
@pass_context
def debug_command(context, verbose):
    """Command with debug output"""
    if verbose:
        import frappe
        click.echo(f"Site: {frappe.local.site}")
        click.echo(f"Database: {frappe.conf.db_name}")
        click.echo(f"Context: {context}")
```

#### **Check command availability:**
```bash
# List all available commands
bench --help

# Check if your command appears
bench --help | grep your-command
```

#### **Test imports:**
```bash
# Test if your module can be imported
python -c "import your_app.commands; print('Import successful')"
```

### **Q15: What's the difference between @pass_context and @get_site_context?**

**A:** Here's the difference:

#### **@pass_context:**
- **Purpose**: Passes basic Frappe context to the command
- **Provides**: General context information
- **Use**: For commands that don't need database access

#### **@get_site_context:**
- **Purpose**: Ensures site context is properly initialized
- **Provides**: Active site connection, database access, site configuration
- **Use**: For commands that need to access site data

#### **Example:**
```python
# Basic context only
@click.command('basic-info')
@pass_context
def basic_info(context):
    click.echo("Basic command without site access")

# Full site context
@click.command('site-data')
@pass_context
@get_site_context
def site_data(context):
    import frappe
    users = frappe.db.count('User')
    click.echo(f"Total users: {users}")
```

---

## **Summary**

Custom bench commands are a powerful way to extend Frappe's functionality. The key points to remember:

1. **File location**: `apps/your_app/your_app/commands.py`
2. **Registration**: `commands = [your_command]` list
3. **Discovery**: Frappe automatically finds and registers commands
4. **Context**: Use `@pass_context` and `@get_site_context` as needed
5. **Testing**: Test commands thoroughly before deployment

This system allows you to create powerful, custom tools that integrate seamlessly with the Frappe ecosystem while maintaining clean, organized code structure.

