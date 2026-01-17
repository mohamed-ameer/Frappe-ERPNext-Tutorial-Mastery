# Improving Test Coverage Reports in Frappe

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Test Coverage](#understanding-test-coverage)
3. [Why Coverage Reports Can Be Misleading](#why-coverage-reports-can-be-misleading)
4. [How Frappe's Coverage System Works](#how-frappes-coverage-system-works)
5. [Files That Should Be Excluded](#files-that-should-be-excluded)
6. [Understanding `pragma: no cover` - The Most Important Exclusion](#understanding-pragma-no-cover---the-most-important-exclusion)
7. [Configuration Methods](#configuration-methods)
8. [Step-by-Step Implementation](#step-by-step-implementation)
9. [Advanced Configuration](#advanced-configuration)
10. [Verification and Testing](#verification-and-testing)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

Test coverage is a metric that measures how much of your codebase is executed during test runs. While high coverage is desirable, raw coverage percentages can be misleading when they include files that shouldn't be tested or are auto-generated. This guide explains how to configure coverage exclusions in Frappe to get more accurate and meaningful coverage reports.

### What You'll Learn

- How Frappe's coverage system works behind the scenes
- Which files should be excluded from coverage reports
- How to configure coverage exclusions using `.coveragerc` files
- How to create custom coverage configurations
- Best practices for maintaining accurate coverage metrics

---

## Understanding Test Coverage

### What is Test Coverage?

Test coverage is a measurement used to describe the degree to which the source code of a program is executed when a particular test suite runs. It's expressed as a percentage:

```
Coverage % = (Lines Executed / Total Lines) × 100
```

### Types of Coverage

1. **Line Coverage**: Measures which lines of code were executed
2. **Branch Coverage**: Measures which branches (if/else, loops) were executed
3. **Function Coverage**: Measures which functions were called
4. **Statement Coverage**: Measures which statements were executed

Frappe primarily uses **line coverage** for its reports.

### Why Coverage Matters

- **Quality Assurance**: Identifies untested code paths
- **Risk Management**: Highlights areas that need more testing
- **CI/CD Requirements**: Many projects require minimum coverage thresholds
- **Code Maintenance**: Helps identify dead or unused code

---

## Why Coverage Reports Can Be Misleading

### Common Issues

1. **Auto-Generated Code**: Frappe generates many files automatically (child doctypes, dashboard files)
2. **Boilerplate Code**: `__init__.py` files often contain minimal or no testable logic
3. **Test Files Themselves**: Test files are counted but shouldn't be
4. **Configuration Files**: Setup and configuration code that doesn't need unit testing
5. **Legacy/Unused Code**: Old code that's no longer actively maintained

### Impact on Coverage Percentage

When these files are included:
- **Before Exclusion**: Coverage might be 45% (misleadingly low)
- **After Exclusion**: Coverage might be 85% (more accurate)

The goal is to measure coverage of **meaningful, testable code**, not boilerplate or auto-generated files.

---

## How Frappe's Coverage System Works

### Architecture Overview

Frappe uses the Python `coverage` library (version ~6.5.0) with a custom wrapper class that integrates with the test runner. The system works in three layers:

```
┌─────────────────────────────────────┐
│   Bench Command (CLI)                │
│   bench run-tests --coverage         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Frappe Test Runner                 │
│   frappe.test_runner                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   CodeCoverage Context Manager       │
│   frappe.coverage.CodeCoverage       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Coverage Library                   │
│   coverage.Coverage                  │
└─────────────────────────────────────┘
```

### The CodeCoverage Class

Frappe's coverage system is implemented in `frappe/frappe/coverage.py`. Let's examine how it works:

#### 1. Context Manager Pattern

The `CodeCoverage` class uses Python's context manager protocol (`__enter__` and `__exit__`):

```python
class CodeCoverage:
    def __init__(self, with_coverage, app):
        self.with_coverage = with_coverage
        self.app = app or "frappe"

    def __enter__(self):
        # Called when entering 'with' block
        if self.with_coverage:
            # Initialize coverage tracking
            self.coverage = Coverage(...)
            self.coverage.start()  # Begin tracking

    def __exit__(self, exc_type, exc_value, traceback):
        # Called when exiting 'with' block
        if self.with_coverage:
            self.coverage.stop()   # Stop tracking
            self.coverage.save()   # Save data to .coverage file
            self.coverage.xml_report()  # Generate XML report
```

#### 2. How It's Used

In `frappe/commands/utils.py`, the coverage is activated like this:

```python
@click.command("run-tests")
@click.option("--coverage", is_flag=True, default=False)
def run_tests(context, app=None, coverage=False, ...):
    with CodeCoverage(coverage, app):
        # All test execution happens here
        frappe.test_runner.main(...)
```

#### 3. Source Path Configuration

The coverage system automatically determines which app to track:

```python
from frappe.utils import get_bench_path

# Get the bench path (e.g., /home/user/frappe-bench)
bench_path = get_bench_path()

# Build source path for the app being tested
source_path = os.path.join(bench_path, "apps", self.app)
# Example: /home/user/frappe-bench/apps/<app_name>
```

#### 4. Exclusion Lists

Frappe maintains three levels of exclusions:

**STANDARD_EXCLUSIONS** (applied to all apps):
```python
STANDARD_EXCLUSIONS = [
    "*.js",           # JavaScript files
    "*.xml",          # XML files
    "*.pyc",          # Compiled Python
    "*.css",          # Stylesheets
    "*/test_*",       # Test files
    "*/node_modules/*",
    "*/doctype/*/*_dashboard.py",  # Dashboard files
    "*/patches/*",    # Patch files
]
```

**FRAPPE_EXCLUSIONS** (only for frappe app):
```python
FRAPPE_EXCLUSIONS = [
    "*/tests/*",
    "*/commands/*",
    "*/frappe/change_log/*",
    "*/frappe/exceptions*",
    "*/frappe/coverage.py",
    "*/doctype/*/*_dashboard.py",
    "*/patches/*",
    *TESTED_VIA_CLI,  # Files tested via CLI commands
]
```

#### 5. Coverage Initialization

When coverage starts, it's configured with:

```python
self.coverage = Coverage(
    source=[source_path],           # Only track this app
    omit=omit,                      # Files to exclude
    include=STANDARD_INCLUSIONS     # Only include .py files
)
```

#### 6. Data Collection

During test execution:
1. **Start**: Coverage begins tracking all Python file executions
2. **Execution**: As tests run, coverage records which lines are executed
3. **Stop**: Coverage stops tracking
4. **Save**: Data is saved to `.coverage` file in the site directory
5. **Report**: XML report is generated for CI/CD tools

### Behind the Scenes: How Coverage Tracking Works

1. **Instrumentation**: The coverage library instruments Python bytecode to track execution
2. **Line Tracking**: Each line execution is recorded in memory
3. **File Filtering**: Only files matching `source` and `include` patterns are tracked
4. **Exclusion Filtering**: Files matching `omit` patterns are completely ignored
5. **Data Persistence**: Execution data is saved to `.coverage` file (SQLite database)

---

## Files That Should Be Excluded

### 1. `__init__.py` Files

**Why Exclude?**
- Often contain only imports or minimal initialization code
- Rarely contain testable business logic
- Can significantly lower coverage percentage

**Pattern**: `**/__init__.py`

**Example Structure**:
```
<app_name>/
├── __init__.py              ← Exclude
├── api/
│   ├── __init__.py          ← Exclude
│   └── order_request.py      ← Include
└── utils/
    ├── __init__.py          ← Exclude
    └── order.py              ← Include
```

### 2. Child DocType Files

**Why Exclude?**
- Auto-generated by Frappe framework
- Contain boilerplate code (getter/setter methods)
- Business logic is in parent DocType or custom methods
- Regenerated on every sync, so manual changes are lost

**Pattern**: `**/doctype/*/*.py`

**Example Structure**:
```
<app_name>/<app_name>/doctype/
├── order_request/
│   ├── order_request.py           ← Exclude (auto-generated)
│   ├── order_request.json
│   └── test_order_request.py      ← Include (your tests)
└── order_request_item/            ← Child table
    ├── order_request_item.py      ← Exclude (auto-generated)
    └── order_request_item.json
```

**What Gets Generated**:
```python
# order_request_item.py (auto-generated)
class OrderRequestItem(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.
    from typing import TYPE_CHECKING
    
    if TYPE_CHECKING:
        from frappe.types import DF
        # ... type hints ...
    # end: auto-generated types
    
    pass  # No testable logic here
```

### 3. Dashboard Files

**Why Exclude?**
- Auto-generated dashboard visualization code
- Contains only configuration, not business logic
- Tested through UI tests, not unit tests

**Pattern**: `**/doctype/*/*_dashboard.py`

**Example**: `<app_name>/<app_name>/doctype/order_request/order_request_dashboard.py`

### 4. Patch Files

**Why Exclude?**
- One-time migration scripts
- Run during app updates, not during normal operation
- Tested separately via migration tests

**Pattern**: `**/patches/*`

**Example**: `<app_name>/<app_name>/patches/v1_0/set_mobile_no_search.py`

### 5. Test Files Themselves

**Why Exclude?**
- Test files test other code, not themselves
- Including them inflates the denominator without adding value

**Pattern**: `**/test_*.py` or `tests/*`

### 6. Command Files

**Why Exclude?**
- CLI command handlers
- Tested via integration tests, not unit tests

**Pattern**: `**/commands/*`

### 7. Configuration and Setup Files

**Why Exclude?**
- Setup code that runs once
- Configuration that doesn't contain business logic

**Examples**:
- `setup.py`
- `hooks.py` (usually)
- `desktop.py`
- `docs.py`

---

## Understanding `pragma: no cover` - The Most Important Exclusion

### What is `pragma: no cover`?

`pragma: no cover` is a **special comment directive** that tells the coverage tool to exclude specific lines from coverage reports. Unlike file-level exclusions (which exclude entire files), `pragma: no cover` allows you to exclude individual lines or blocks of code that shouldn't be counted toward coverage.

### Why is it So Important?

`pragma: no cover` is **critical** for accurate coverage reporting because:

1. **Granular Control**: You can exclude specific lines without excluding entire files
2. **Precision**: Targets exactly the code that shouldn't be tested
3. **Flexibility**: Works on a line-by-line basis
4. **Documentation**: Serves as inline documentation explaining why code isn't tested
5. **Accuracy**: Prevents artificially low coverage from untestable or unreachable code

### How It Works

When coverage.py encounters a line with `# pragma: no cover`, it:
1. **Marks the line as excluded** from coverage calculations
2. **Doesn't count it** in the total lines metric
3. **Shows it as excluded** in HTML reports (usually in gray)
4. **Doesn't affect** the coverage percentage calculation

### Syntax and Usage

#### Basic Syntax

```python
# Single line exclusion
some_code()  # pragma: no cover

# Block exclusion (applies to entire block)
if condition:  # pragma: no cover
    do_something()
    do_another_thing()
```

#### Common Patterns

**1. Type Checking Blocks**

These blocks are never executed at runtime - they're only for static type checkers:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from frappe.types import DF
    from typing import Optional

# This block is never executed - it's only for type hints
```

**Real Example from Frappe**:
```python
# frappe/__init__.py
if TYPE_CHECKING:  # pragma: no cover
    from werkzeug.wrappers import Request
    from frappe.database.mariadb.database import MariaDBDatabase
    # ... more type-only imports
```

**2. Debug/Development Code**

Code that only runs in development or debug mode:

```python
def process_data(data):
    result = calculate(data)
    
    if settings.DEBUG:  # pragma: no cover
        print(f"Debug: Processed {len(result)} items")
        log_debug_info(result)
    
    return result
```

**3. CLI-Only Code**

Code that only executes when running from command line:

```python
def main_function():
    # Main logic here
    pass

if __name__ == "__main__":  # pragma: no cover
    # This only runs when script is executed directly
    # Not when imported as a module
    main_function()
```

**4. Unreachable Code**

Code that's logically unreachable but kept for safety:

```python
def validate_input(value):
    if value is None:
        raise ValueError("Value cannot be None")
    
    if value < 0:  # pragma: no cover
        # This should never happen due to business logic
        # But kept as a safety check
        raise ValueError("Unexpected negative value")
    
    return value
```

**5. Exception Handlers for Rare Cases**

Exception handlers for cases that are hard to test:

```python
def connect_to_database():
    try:
        return create_connection()
    except NetworkTimeoutError:  # pragma: no cover
        # Extremely rare network timeout
        # Difficult to simulate in tests
        return create_fallback_connection()
```

**6. Platform-Specific Code**

Code that only runs on specific platforms:

```python
import sys

def get_system_info():
    if sys.platform == "win32":  # pragma: no cover
        return get_windows_info()
    else:
        return get_unix_info()
```

**7. Conditional CLI Execution**

Code that checks if running in CLI context:

```python
# Real example from Frappe
if not getattr(frappe.local, "request", None) or is_cli():  # pragma: no cover
    # This code only runs in CLI context, not in web requests
    # Difficult to test in unit tests
    handle_cli_specific_logic()
```

**8. Abstract Methods and Protocols**

Abstract methods that must be implemented by subclasses:

```python
from abc import ABC, abstractmethod

class BaseProcessor(ABC):
    @abstractmethod
    def process(self, data):  # pragma: no cover
        # Abstract method - never called directly
        # Only implemented by subclasses
        pass
```

**9. String Representations**

`__repr__` and `__str__` methods that are rarely called in tests:

```python
class Document:
    def __repr__(self):  # pragma: no cover
        return f"<Document {self.name}>"
    
    def __str__(self):  # pragma: no cover
        return self.name
```

**10. Deprecated Code**

Code that's being phased out but still exists:

```python
def old_function():  # pragma: no cover
    # Deprecated - will be removed in next version
    # Not worth testing
    warnings.warn("This function is deprecated", DeprecationWarning)
    return legacy_logic()
```

### Configuration in `.coveragerc`

The `pragma: no cover` directive works automatically, but you need to configure coverage to recognize it:

```ini
[report]
exclude_lines =
    pragma: no cover
```

This tells coverage.py to look for and respect `# pragma: no cover` comments in your code.

### Advanced Usage Patterns

#### Excluding Multiple Lines

You can exclude a range of lines:

```python
def complex_function():
    # ... testable code ...
    
    # pragma: no cover start
    # This entire block is excluded
    if rare_condition:
        do_something()
        do_another_thing()
    # pragma: no cover stop
```

**Note**: Coverage.py doesn't support `start`/`stop` markers by default. Instead, place the pragma on each line or use block-level exclusion.

#### Conditional Exclusion

You can make exclusions conditional:

```python
# Only exclude in specific conditions
if DEBUG_MODE:  # pragma: no cover
    expensive_debug_operation()
```

#### Excluding Function Definitions

Exclude entire function definitions:

```python
def helper_function():  # pragma: no cover
    # This function is only called from excluded code
    # or is a utility that doesn't need direct testing
    return some_utility()
```

### Best Practices for `pragma: no cover`

#### ✅ DO Use `pragma: no cover` For:

1. **Type checking blocks** (`if TYPE_CHECKING:`)
2. **Debug/development code** that doesn't run in production
3. **CLI entry points** (`if __name__ == "__main__":`)
4. **Abstract methods** that are never called directly
5. **Unreachable code** that's kept for safety
6. **Platform-specific code** that's hard to test
7. **Exception handlers** for extremely rare cases
8. **Deprecated code** that's being phased out
9. **String representations** (`__repr__`, `__str__`)
10. **Code that's tested via integration tests** but not unit tests

#### ❌ DON'T Use `pragma: no cover` For:

1. **Code that's simply not tested yet** - Write tests instead!
2. **Complex business logic** - This should be tested
3. **Code that's "hard to test"** - Refactor to make it testable
4. **Large blocks of code** - Consider excluding the entire file instead
5. **Code you're unsure about** - When in doubt, test it

### Real-World Examples from Frappe

#### Example 1: Type Checking

```python
# frappe/__init__.py
if TYPE_CHECKING:  # pragma: no cover
    from werkzeug.wrappers import Request
    from frappe.database.mariadb.database import MariaDBDatabase
    from frappe.database.postgres.database import PostgresDatabase
```

**Why excluded?**: This code is never executed - it's only for static type checkers like mypy.

#### Example 2: CLI Context Check

```python
# frappe/utils/__init__.py
if not getattr(frappe.local, "request", None) or is_cli():  # pragma: no cover
    # CLI-specific logic that's hard to test in unit tests
    sys.stdout.flush()
    return
```

**Why excluded?**: This code only runs in CLI context, which is difficult to simulate in unit tests. It's tested via integration tests instead.

#### Example 3: Function Signature

```python
# frappe/utils/background_jobs.py
def enqueue(
    method: str,
    queue: str = "default",
    timeout: int | None = None,
    event: str | None = None,
    is_async: bool = True,
    job_name: str | None = None,
    now: bool = False,
    enqueue_after_commit: bool = False,
) -> None:  # pragma: no cover
    # Function implementation
```

**Why excluded?**: The function signature line itself might be excluded if it's a type-only definition or if the function is tested via integration tests.

### Impact on Coverage Reports

#### Before Using `pragma: no cover`

```
Name                    Stmts   Miss  Cover
-------------------------------------------
my_module.py              100     25    75%
```

#### After Using `pragma: no cover`

```
Name                    Stmts   Miss  Cover
-------------------------------------------
my_module.py               85     10    88%
```

The 15 excluded lines (type checks, debug code, etc.) are no longer counted, giving you a more accurate coverage percentage.

### How Coverage.py Processes Pragmas

1. **Parsing**: Coverage.py parses your Python files and looks for `# pragma: no cover` comments
2. **Marking**: Lines with the pragma are marked as excluded
3. **Calculation**: Excluded lines are removed from both numerator (executed) and denominator (total)
4. **Reporting**: Excluded lines appear in gray in HTML reports with a note explaining why

### Troubleshooting `pragma: no cover`

#### Issue: Pragmas Not Working

**Symptoms**: Lines with `# pragma: no cover` still appear in coverage reports.

**Solutions**:
1. Verify `.coveragerc` includes `pragma: no cover` in `exclude_lines`
2. Check comment syntax (must be `# pragma: no cover`, not `#pragma: no cover`)
3. Ensure the comment is on the same line as the code
4. Clear coverage cache: `rm .coverage`

#### Issue: Too Many Pragmas

**Symptoms**: Coverage report shows many excluded lines.

**Solution**: Review if you're overusing pragmas. Consider:
- Refactoring code to be more testable
- Writing integration tests instead
- Excluding entire files if most code is untestable

### Summary: Why `pragma: no cover` is Essential

1. **Accuracy**: Gives you true coverage of testable code
2. **Flexibility**: Fine-grained control over what's excluded
3. **Documentation**: Inline explanation of why code isn't tested
4. **Maintainability**: Easy to update as code changes
5. **Industry Standard**: Widely used and understood pattern

**Remember**: `pragma: no cover` is not a way to avoid writing tests - it's a tool to accurately measure coverage of code that genuinely shouldn't or can't be unit tested.

---

## Configuration Methods

Frappe supports two methods for configuring coverage exclusions:

### Method 1: `.coveragerc` File (Recommended)

A configuration file that coverage.py automatically discovers.

**Advantages**:
- Simple, declarative configuration
- Version controlled with your code
- Works with all coverage tools
- No code changes required

**Location**: Root of your app directory

### Method 2: Programmatic Configuration

Modifying Frappe's coverage.py or creating custom coverage logic.

**Advantages**:
- Dynamic configuration
- App-specific logic
- Integration with Frappe's system

**Disadvantages**:
- Requires code changes
- More complex
- Harder to maintain

---

## Step-by-Step Implementation

### Step 1: Create `.coveragerc` File

Navigate to your app directory and create the file:

```bash
cd /home/ameer/frappe-bench/apps/<app_name>
touch .coveragerc
```

### Step 2: Basic Configuration

Start with a basic configuration:

```ini
[run]
omit =
    tests/*
    **/test_*.py
    **/__init__.py
```

### Step 3: Add DocType Exclusions

Add patterns to exclude child doctypes and dashboard files:

```ini
[run]
omit =
    tests/*
    **/test_*.py
    **/__init__.py
    **/doctype/*/*.py
    **/doctype/*/*_dashboard.py
```

**Important**: The pattern `**/doctype/*/*.py` matches:
- `<app_name>/<app_name>/doctype/order_request/order_request.py` ✓
- `<app_name>/<app_name>/doctype/order_request_item/order_request_item.py` ✓
- But NOT `<app_name>/<app_name>/doctype/order_request/test_order_request.py` (test files are excluded separately)

### Step 4: Add Additional Exclusions

Add more patterns based on your app structure:

```ini
[run]
omit =
    # Test files
    tests/*
    **/test_*.py
    
    # Init files
    **/__init__.py
    
    # DocType files (auto-generated)
    **/doctype/*/*.py
    **/doctype/*/*_dashboard.py
    
    # Patch files
    **/patches/*
    
    # Commands
    **/commands/*
    
    # Configuration files
    setup.py
    **/hooks.py
    
    # Other
    **/node_modules/*
    **/.github/*
    **/migrations/*
    **/fixtures/*
```

### Step 5: Configure Report Exclusions

Add report-level exclusions for lines that shouldn't count:

```ini
[run]
omit =
    tests/*
    **/test_*.py
    **/__init__.py
    **/doctype/*/*.py
    **/doctype/*/*_dashboard.py
    **/patches/*
    **/commands/*

[report]
exclude_lines =
    pragma: no cover
    if TYPE_CHECKING:
    def __repr__
    if self.debug:
    if settings.DEBUG
    raise AssertionError
    raise NotImplementedError
    if 0:
    if __name__ == .__main__.:
    class .*\bProtocol\):
    @(abc\.)?abstractmethod
```

### Step 6: Complete Example Configuration

Here's a complete `.coveragerc` file for a typical Frappe app:

```ini
[run]
# Files and directories to omit from coverage tracking
omit =
    # Test directories and files
    tests/*
    **/test_*.py
    
    # Python package init files
    **/__init__.py
    
    # Auto-generated DocType files
    **/doctype/*/*.py
    **/doctype/*/*_dashboard.py
    
    # Migration and patch files
    **/patches/*
    **/migrations/*
    
    # Command-line interface files
    **/commands/*
    
    # Configuration and setup files
    setup.py
    **/hooks.py
    **/desktop.py
    **/docs.py
    
    # Build and dependency directories
    **/node_modules/*
    **/.github/*
    **/fixtures/*
    
    # Other non-source files
    **/*.pyc
    **/__pycache__/*

[report]
# Lines to exclude from coverage reports
exclude_lines =
    # Pragmas
    pragma: no cover
    
    # Type checking blocks (not executed at runtime)
    if TYPE_CHECKING:
    
    # Debug code
    if self.debug:
    if settings.DEBUG
    
    # Exception handling (tested separately)
    raise AssertionError
    raise NotImplementedError
    
    # Unreachable code
    if 0:
    if __name__ == .__main__.:
    
    # Protocol definitions
    class .*\bProtocol\):
    @(abc\.)?abstractmethod
    
    # String representations
    def __repr__

[html]
# Directory for HTML report (optional)
directory = htmlcov
```

### Step 7: Verify Configuration

Test your configuration by running tests with coverage:

```bash
bench --site test_site run-tests --app <app_name> --coverage
```

Check the output for coverage percentage. It should be higher than before.

### Step 8: Generate HTML Report

Generate a detailed HTML report to see what's being excluded:

```bash
cd /home/ameer/frappe-bench/sites/test_site
coverage html
```

Open `htmlcov/index.html` in your browser to see:
- Which files are included/excluded
- Line-by-line coverage
- Coverage percentages per file

---

## Advanced Configuration

### Custom Exclusion Patterns

You can create app-specific exclusion patterns:

```ini
[run]
omit =
    # Standard exclusions
    tests/*
    **/test_*.py
    **/__init__.py
    **/doctype/*/*.py
    
    # App-specific exclusions
    **/legacy/*
    **/deprecated/*
    **/experimental/*
```

### Pattern Matching Rules

Coverage uses glob patterns. Key rules:

- `*` matches any characters except `/`
- `**` matches any characters including `/`
- `?` matches a single character
- `[abc]` matches any character in the set

**Examples**:
```
**/__init__.py          # All __init__.py files
**/doctype/*/*.py       # All .py files in doctype subdirectories
**/test_*.py           # All files starting with test_
tests/*                # All files in tests directory (not recursive)
**/patches/**/*.py     # All .py files in any patches subdirectory
```

### Multiple Configuration Files

Coverage looks for configuration in this order:
1. `.coveragerc` in current directory
2. `setup.cfg` with `[coverage:run]` section
3. `pyproject.toml` with `[tool.coverage.run]` section
4. Command-line arguments

### Integration with Frappe's System

If you need to modify Frappe's coverage system programmatically, you can:

1. **Override in your app**: Create `<app_name>/coverage_config.py`:

```python
# <app_name>/coverage_config.py
STANDARD_EXCLUSIONS = [
    "*.js",
    "*.xml",
    "*.pyc",
    "*/test_*",
    "*/node_modules/*",
    "*/doctype/*/*_dashboard.py",
    "*/patches/*",
    "**/__init__.py",  # Your custom exclusion
    "**/doctype/*/*.py",  # Your custom exclusion
]

APP_EXCLUSIONS = [
    "*/tests/*",
    "*/commands/*",
    "*/patches/*",
    "**/legacy/*",  # App-specific
]
```

2. **Modify test runner**: Override the coverage initialization (advanced, not recommended)

---

## Verification and Testing

### Step 1: Run Tests with Coverage

```bash
bench --site test_site run-tests --app <app_name> --coverage
```

Expected output:
```
Running tests...
...
Saved Coverage
```

### Step 2: Check Coverage Data

Coverage data is saved in:
```
/home/ameer/frappe-bench/sites/test_site/.coverage
```

### Step 3: Generate Reports

**Terminal Report**:
```bash
cd /home/ameer/frappe-bench/sites/test_site
coverage report
```

**HTML Report**:
```bash
coverage html
open htmlcov/index.html
```

**XML Report** (for CI/CD):
```bash
coverage xml
# Generates coverage.xml
```

### Step 4: Verify Exclusions

In the HTML report, check that:
- `__init__.py` files show 0% or are not listed
- Child doctype files are not listed
- Test files are not listed
- Only meaningful source files are included

### Step 5: Compare Before/After

**Before exclusion**:
```
Name                                    Stmts   Miss  Cover
------------------------------------------------------------
<app_name>/__init__.py                            2      2     0%
<app_name>/api/__init__.py                         1      1     0%
<app_name>/<app_name>/doctype/order_request/order_request.py  150    150     0%
<app_name>/<app_name>/doctype/order_request_item/order_request_item.py  80     80     0%
<app_name>/api/order_request.py                     50     10    80%
------------------------------------------------------------
TOTAL                                      283    243    14%
```

**After exclusion**:
```
Name                                    Stmts   Miss  Cover
------------------------------------------------------------
<app_name>/api/order_request.py                     50     10    80%
<app_name>/utils/order.py                          100     20    80%
------------------------------------------------------------
TOTAL                                      150     30    80%
```

---

## Best Practices

### 1. Start Conservative

Begin with minimal exclusions and add more as needed:

```ini
[run]
omit =
    tests/*
    **/test_*.py
    **/__init__.py
```

### 2. Document Your Exclusions

Add comments explaining why files are excluded:

```ini
[run]
omit =
    # Auto-generated DocType files - no business logic to test
    **/doctype/*/*.py
    
    # One-time migration scripts - tested via migration tests
    **/patches/*
```

### 3. Review Regularly

Periodically review excluded files:
- Some might now contain testable code
- New file types might need exclusion
- Dead code can be removed entirely

### 4. Balance Coverage and Accuracy

- **Too many exclusions**: Coverage becomes meaningless
- **Too few exclusions**: Coverage is artificially low
- **Goal**: Measure coverage of meaningful, maintainable code

### 5. CI/CD Integration

Configure your CI/CD to use the same exclusions:

```yaml
# .github/workflows/tests.yml
- name: Run tests with coverage
  run: |
    bench --site test_site run-tests --app <app_name> --coverage
    
- name: Upload coverage
  uses: codecov/codecov-action@v2
  with:
    files: ./sites/test_site/coverage.xml
```

### 6. Team Alignment

Ensure your team understands:
- Which files are excluded and why
- What the coverage percentage represents
- How to interpret coverage reports

---

## Troubleshooting

### Issue: Coverage Still Includes Excluded Files

**Symptoms**: Files matching exclusion patterns still appear in reports.

**Solutions**:
1. Verify pattern syntax (use `**` for recursive matching)
2. Check file paths (patterns are relative to source directory)
3. Clear coverage cache: `rm .coverage`
4. Regenerate report: `coverage html --force`

**Example Fix**:
```ini
# Wrong - doesn't match subdirectories
omit = doctype/*/*.py

# Correct - matches all subdirectories
omit = **/doctype/*/*.py
```

### Issue: Coverage Percentage Didn't Increase

**Symptoms**: After adding exclusions, coverage % is the same or lower.

**Possible Causes**:
1. Excluded files weren't being counted before (already 0% coverage)
2. Pattern doesn't match actual file paths
3. Coverage data is stale

**Solution**:
```bash
# Clear old coverage data
rm .coverage
rm -rf htmlcov

# Run tests again
bench --site test_site run-tests --app <app_name> --coverage

# Generate fresh report
coverage html
```

### Issue: Important Files Are Excluded

**Symptoms**: Files you want to test are being excluded.

**Solution**: Refine exclusion patterns to be more specific:

```ini
# Too broad - excludes all doctype files
omit = **/doctype/*/*.py

# Better - only exclude child tables, keep main doctypes
omit = **/doctype/*/*_item.py
omit = **/doctype/*/*_detail.py
```

Or use negative patterns (if supported) or programmatic configuration.

### Issue: Coverage Tool Not Found

**Symptoms**: `coverage: command not found`

**Solution**:
```bash
# Install coverage tool
pip install coverage

# Or use bench's Python
bench --site test_site console
>>> import coverage
```

### Issue: `.coveragerc` Not Being Read

**Symptoms**: Exclusions not applied.

**Solutions**:
1. Verify file location (should be in app root)
2. Check file name (exactly `.coveragerc`, not `.coverage.rc`)
3. Verify file permissions
4. Check for syntax errors in the file

**Verification**:
```bash
cd /home/ameer/frappe-bench/apps/<app_name>
ls -la .coveragerc
cat .coveragerc  # Check for syntax errors
```

### Issue: Conflicting Configurations

**Symptoms**: Different exclusions than expected.

**Solution**: Coverage reads configs in this order (later overrides earlier):
1. `.coveragerc`
2. `setup.cfg` `[coverage:run]` section
3. `pyproject.toml` `[tool.coverage.run]` section
4. Command-line arguments

Check all locations for conflicting settings.

---

## Understanding Coverage Patterns in Detail

### Pattern: `**/doctype/*/*.py`

This pattern matches all Python files in doctype subdirectories. Let's break it down:

```
**/doctype/*/*.py
│  │        │ │ │
│  │        │ │ └─ File extension (.py)
│  │        │ └─── Any filename
│  │        └───── One directory level (doctype name)
│  └────────────── Literal "doctype" directory
└───────────────── Any path prefix (recursive)
```

**Matches**:
- `<app_name>/<app_name>/doctype/order_request/order_request.py` ✓
- `<app_name>/<app_name>/doctype/order_request/order_request_dashboard.py` ✓
- `<app_name>/<app_name>/doctype/order_request_item/order_request_item.py` ✓

**Doesn't Match**:
- `<app_name>/<app_name>/doctype/order_request/test_order_request.py` (excluded by `**/test_*.py`)
- `<app_name>/api/order_request.py` (not in doctype directory)

### Pattern: `**/__init__.py`

Matches all `__init__.py` files at any depth:

```
**/__init__.py
│  │
│  └─ Literal filename "__init__.py"
└─── Any path prefix (recursive)
```

**Matches**:
- `<app_name>/__init__.py` ✓
- `<app_name>/api/__init__.py` ✓
- `<app_name>/utils/validate/__init__.py` ✓

### Pattern: `tests/*`

Matches files directly in tests directory (not recursive):

```
tests/*
│     │
│     └─ Any filename
└─────── Literal "tests" directory
```

**Matches**:
- `tests/test_example.py` ✓
- `tests/base.py` ✓

**Doesn't Match**:
- `tests/utils/journal_entry.py` (needs `tests/**/*`)

Use `tests/**/*` for recursive matching.

---

## Real-World Example: <app_name> App

Let's see how this applies to a real Frappe app structure:

### App Structure

```
<app_name>/
├── .coveragerc                    ← Configuration file
├── <app_name>/
│   ├── __init__.py                ← Exclude
│   ├── api/
│   │   ├── __init__.py            ← Exclude
│   │   ├── order_request.py        ← Include (test this)
│   │   └── utilities.py           ← Include (test this)
│   ├── <app_name>/
│   │   └── doctype/
│   │       ├── order_request/
│   │       │   ├── order_request.py           ← Exclude (auto-generated)
│   │       │   ├── order_request.json
│   │       │   └── test_order_request.py      ← Exclude (test file)
│   │       └── order_request_item/
│   │           ├── order_request_item.py     ← Exclude (auto-generated)
│   │           └── order_request_item.json
│   ├── utils/
│   │   ├── __init__.py            ← Exclude
│   │   ├── order.py                ← Include (test this)
│   │   └── validate/
│   │       ├── __init__.py        ← Exclude
│   │       └── national_id.py     ← Include (test this)
│   └── patches/
│       └── v1_0/
│           └── set_mobile_no_search.py  ← Exclude (patch file)
└── tests/
    ├── __init__.py                ← Exclude
    ├── base.py                     ← Exclude (test infrastructure)
    └── test_example.py             ← Exclude (test file)
```

### Configuration File

```ini
[run]
omit =
    # Test infrastructure
    tests/*
    **/test_*.py
    
    # Package initialization
    **/__init__.py
    
    # Auto-generated DocType code
    **/doctype/*/*.py
    
    # Migration scripts
    **/patches/*
    
    # Configuration (if minimal logic)
    **/hooks.py
```

### Expected Coverage Report

After configuration, your coverage report should show:

```
Name                              Stmts   Miss  Cover
-----------------------------------------------------
<app_name>/api/order_request.py              45      5    89%
<app_name>/api/utilities.py                 30      2    93%
<app_name>/utils/order.py                   120     15    88%
<app_name>/utils/validate/national_id.py    25      3    88%
-----------------------------------------------------
TOTAL                               220     25    89%
```

Only meaningful, testable code is included!

---

## Conclusion

Configuring coverage exclusions is essential for getting accurate and meaningful test coverage metrics in Frappe applications. By excluding auto-generated files, boilerplate code, and test infrastructure, you can focus on measuring coverage of your actual business logic.

### Key Takeaways

1. **Use `.coveragerc`** for simple, maintainable configuration
2. **Exclude auto-generated code** (child doctypes, dashboards)
3. **Exclude boilerplate** (`__init__.py` files)
4. **Exclude test infrastructure** (test files themselves)
5. **Review regularly** to ensure exclusions remain appropriate
6. **Document exclusions** so your team understands the rationale

### Next Steps

1. Create your `.coveragerc` file
2. Run tests with coverage to establish baseline
3. Review HTML report to verify exclusions
4. Adjust patterns as needed
5. Integrate with CI/CD pipeline

Remember: The goal isn't to achieve 100% coverage by excluding everything, but to get an accurate measure of how well your meaningful, maintainable code is tested.

---

## Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 2: Test Commands and Execution](./64-Frappe_Unit_Testing_Guide_Part_2_Test_Commands.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 7: Assertions](./69-Frappe_Unit_Testing_Guide_Part_7_Assertions.md)
- [Part 8: Reports](./80-Frappe_Unit_Testing_Guide_Part_8_Reports.md)
- [Part 9: Test Records](./82-Frappe_Unit_Testing_Guide_Part_9_Test_Records.md)