# Frappe Unit Testing Guide - Part 2: Test Commands and Execution

## Table of Contents
1. [Enabling Tests](#enabling-tests)
2. [Basic Test Commands](#basic-test-commands)
3. [Running Tests by Scope](#running-tests-by-scope)
4. [Advanced Test Options](#advanced-test-options)
5. [Parallel Test Execution](#parallel-test-execution)
6. [Test Coverage](#test-coverage)
7. [Troubleshooting](#troubleshooting)

---

## Enabling Tests

Before running tests, you must enable them for your site:

```bash
bench --site [site-name] set-config allow_tests true
```

**Important**: Tests are disabled by default for security reasons. This prevents accidental test execution in production environments.

### Verify Tests Are Enabled

```bash
bench --site [site-name] get-config allow_tests
# Should return: true
```

### Disable Tests (if needed)

```bash
bench --site [site-name] set-config allow_tests false
```

---

## Basic Test Commands

### Command Structure

All test commands follow this basic structure:

```bash
bench --site [site-name] run-tests [options]
```

### Run All Tests

Run all tests in all installed apps:

```bash
bench --site [site-name] run-tests
```

**What it does**:
- Discovers all test files in all installed apps
- Runs tests in alphabetical order
- Creates test records automatically
- Rolls back all database changes after completion

**When to use**:
- Before committing code
- In CI/CD pipelines
- When you want to verify the entire system

**Example Output**:
```
Running tests...
test_create_document ... ok
test_update_document ... ok
test_delete_document ... ok

----------------------------------------------------------------------
Ran 3 tests in 0.123s

OK
```

---

## Running Tests by Scope

### Run Tests for a Specific App

```bash
bench --site [site-name] run-tests --app [app-name]
```

**Examples**:
```bash
# Run all Frappe tests
bench --site test_site run-tests --app frappe

# Run all ERPNext tests
bench --site test_site run-tests --app erpnext

# Run all tests for your custom app
bench --site test_site run-tests --app my_custom_app
```

**When to use**:
- Testing changes in a specific app
- Faster execution when you only need to test one app
- Isolating issues to a particular app

### Run Tests for a Specific DocType

```bash
bench --site [site-name] run-tests --doctype [DocType]
```

**Examples**:
```bash
# Run tests for Item DocType
bench --site test_site run-tests --doctype Item

# Run tests for Sales Invoice
bench --site test_site run-tests --doctype "Sales Invoice"

# Run tests for custom DocType
bench --site test_site run-tests --doctype "Custom DocType"
```

**What it does**:
- Finds the test file for the specified DocType
- Creates test records for the DocType and all dependencies
- Runs all test methods in the test class

**When to use**:
- Testing a specific DocType
- Quick iteration during development
- Debugging DocType-specific issues

**Note**: The DocType name is case-sensitive and must match exactly.

### Run Tests for a Specific Module

```bash
bench --site [site-name] run-tests --module [module-path]
```

**Examples**:
```bash
# Run tests for frappe.tests module
bench --site test_site run-tests --module frappe.tests

# Run tests for erpnext.accounts module
bench --site test_site run-tests --module erpnext.accounts

# Run tests for custom module
bench --site test_site run-tests --module my_app.my_module
```

**Module Path Format**:
- Use dot notation: `app.module`
- Must be a valid Python module path
- Module must contain test files

**When to use**:
- Testing a specific module
- Module-level integration tests
- Testing module-specific functionality

### Run Tests for All DocTypes in a Module Definition

```bash
bench --site [site-name] run-tests --module-def [Module Def Name]
```

**Examples**:
```bash
# Run tests for all DocTypes in "Accounts" module
bench --site test_site run-tests --module-def Accounts

# Run tests for all DocTypes in "Stock" module
bench --site test_site run-tests --module-def Stock
```

**What it does**:
- Queries the database for all DocTypes in the specified module
- Runs tests for each DocType found
- Creates test records for all DocTypes

**When to use**:
- Testing all DocTypes in a module
- Module-wide test coverage
- Bulk testing after module changes

### Run Tests from a DocType List File

```bash
bench --site [site-name] run-tests --doctype-list-path [path-to-file]
```

**File Format**: Plain text file with one DocType name per line

**Example file** (`erpnext/tests/server/agriculture.txt`):
```
Crop
Fertilizer
Soil Analysis
```

**Command**:
```bash
bench --site test_site run-tests --doctype-list-path erpnext/tests/server/agriculture.txt
```

**When to use**:
- Running tests for a curated list of DocTypes
- Testing related DocTypes together
- CI/CD pipelines with specific test suites

### Run a Specific Test Case Class

```bash
bench --site [site-name] run-tests --case [TestCaseClassName]
```

**Examples**:
```bash
# Run only TestItem class
bench --site test_site run-tests --case TestItem

# Run only TestSalesInvoice class
bench --site test_site run-tests --case TestSalesInvoice
```

**When to use**:
- Testing a specific test class
- Debugging a particular test class
- Running related tests together

### Run Specific Test Methods

```bash
bench --site [site-name] run-tests --test [test-method-name] [--test another-test]
```

**Examples**:
```bash
# Run a single test method
bench --site test_site run-tests --test test_create_document

# Run multiple specific test methods
bench --site test_site run-tests --test test_create_document --test test_update_document

# Combine with app/doctype
bench --site test_site run-tests --app erpnext --doctype Item --test test_item_creation
```

**Test Method Naming**:
- Use the exact method name (without `test_` prefix in some cases)
- Case-sensitive
- Can specify multiple methods with multiple `--test` flags

**When to use**:
- Quick testing of a specific feature
- Debugging a failing test
- Testing a single method during development

---

## Advanced Test Options

### Verbose Output

Get detailed output including print statements and debug information:

```bash
bench --site [site-name] run-tests --verbose
```

**What it shows**:
- Print statements from test code
- Detailed error messages
- Test execution flow
- Database operations (if enabled)

**When to use**:
- Debugging failing tests
- Understanding test execution flow
- Development and troubleshooting

### Fail Fast

Stop test execution on the first failure:

```bash
bench --site [site-name] run-tests --failfast
```

**Behavior**:
- Stops immediately when a test fails
- Does not run remaining tests
- Useful for quick feedback during development

**When to use**:
- Quick iteration during development
- When you want immediate feedback
- CI/CD pipelines where early failure is preferred

**Example**:
```bash
bench --site test_site run-tests --app my_app --failfast
```

### Skip Test Records

Skip automatic creation of test records:

```bash
bench --site [site-name] run-tests --skip-test-records
```

**What it does**:
- Does not create test records from `test_records.json`
- Does not create dependency records
- Tests must create their own data

**When to use**:
- When test records already exist
- Testing record creation logic
- Faster execution when records aren't needed

### Skip Before Tests Hook

Skip the `before_tests` hook execution:

```bash
bench --site [site-name] run-tests --skip-before-tests
```

**What it does**:
- Skips execution of functions registered in `before_tests` hook
- Useful when hooks are causing issues
- Faster execution in some cases

**When to use**:
- Debugging hook-related issues
- When hooks are not needed for specific tests
- Performance optimization

### Profile Tests

Generate performance profiling information:

```bash
bench --site [site-name] run-tests --profile
```

**Output**:
- Shows function call statistics
- Execution time per function
- Cumulative time analysis
- Helps identify performance bottlenecks

**When to use**:
- Performance analysis
- Identifying slow tests
- Optimizing test execution time

**Example Output**:
```
         1234 function calls in 0.123 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000    0.123    0.123 test_my_doctype.py:10(test_create)
```

### Generate JUnit XML Report

Generate JUnit XML format test report:

```bash
bench --site [site-name] run-tests --junit-xml-output [path/to/report.xml]
```

**Examples**:
```bash
# Generate XML report
bench --site test_site run-tests --junit-xml-output test-results.xml

# With app filter
bench --site test_site run-tests --app erpnext --junit-xml-output erpnext-results.xml
```

**Use Cases**:
- CI/CD integration (Jenkins, GitLab CI, etc.)
- Test reporting tools
- Test result analysis
- Historical test tracking

**XML Format**: Standard JUnit XML format compatible with most CI/CD tools

### Complete Command Examples

```bash
# Run all ERPNext tests with verbose output and fail fast
bench --site test_site run-tests --app erpnext --verbose --failfast

# Run Item tests with coverage
bench --site test_site run-tests --doctype Item --coverage

# Run specific test with profiling
bench --site test_site run-tests --app my_app --test test_complex_calculation --profile

# Run tests and generate XML report for CI
bench --site test_site run-tests --app my_app --junit-xml-output results.xml
```

---

## Parallel Test Execution

Frappe supports running tests in parallel across multiple processes/builds for faster execution.

### Basic Parallel Execution

```bash
bench --site [site-name] run-parallel-tests --app [app-name] --build-number [N] --total-builds [M]
```

**Parameters**:
- `--app`: App to test (default: `frappe`)
- `--build-number`: Current build number (1 to total-builds)
- `--total-builds`: Total number of parallel builds

**Examples**:
```bash
# Run build 1 of 4 parallel builds
bench --site test_site run-parallel-tests --app erpnext --build-number 1 --total-builds 4

# Run build 2 of 4 parallel builds
bench --site test_site run-parallel-tests --app erpnext --build-number 2 --total-builds 4
```

**How it works**:
- Splits test files across builds based on test count
- Each build runs a subset of tests
- Tests are load-balanced by approximate test count

**When to use**:
- CI/CD pipelines with multiple runners
- Large test suites
- Faster overall test execution

### Dry Run (List Tests)

See which tests would run without actually executing them:

```bash
bench --site [site-name] run-parallel-tests --app [app-name] --build-number [N] --total-builds [M] --dry-run
```

**Output**: Lists all test files that would be executed

**When to use**:
- Verifying test distribution
- Planning test execution
- Debugging parallel test configuration

### With Coverage

Generate coverage reports for parallel tests:

```bash
bench --site [site-name] run-parallel-tests --app [app-name] --with-coverage --build-number [N] --total-builds [M]
```

**Note**: Coverage files from multiple builds need to be merged separately

### Using Orchestrator

Use an external orchestrator to balance test execution:

```bash
bench --site [site-name] run-parallel-tests --app [app-name] --use-orchestrator
```

**Requirements**:
- `ORCHESTRATOR_URL` environment variable
- `CI_BUILD_ID` environment variable
- External orchestrator service running

**When to use**:
- Dynamic test distribution
- Better load balancing
- Advanced CI/CD setups

---

## Test Coverage

### Generate Coverage Report

```bash
bench --site [site-name] run-tests --coverage
```

**What it does**:
- Tracks which code is executed during tests
- Generates coverage report
- Shows percentage of code covered

**Output Location**: Coverage files are generated in the site directory

**When to use**:
- Measuring test coverage
- Identifying untested code
- Coverage requirements in CI/CD

### Coverage with Specific Scope

```bash
# Coverage for specific app
bench --site test_site run-tests --app my_app --coverage

# Coverage for specific DocType
bench --site test_site run-tests --doctype Item --coverage

# Coverage for specific test
bench --site test_site run-tests --test test_create_document --coverage
```

### Viewing Coverage Reports

After running with `--coverage`, coverage files are generated. Use coverage tools to view:

```bash
# Install coverage tools (if not already installed)
pip install coverage

# Generate HTML report
coverage html

# View in browser
# Open htmlcov/index.html
```

---

## Troubleshooting

### Tests Are Disabled

**Error**: `Testing is disabled for the site!`

**Solution**:
```bash
bench --site [site-name] set-config allow_tests true
```

### Test File Not Found

**Error**: Test file not discovered

**Check**:
1. File name starts with `test_`
2. File is in correct location
3. File is not in excluded directories
4. Python syntax is correct

### Test Records Not Created

**Symptoms**: Tests fail with "Record not found" errors

**Solutions**:
1. Check `test_records.json` exists and is valid JSON
2. Verify `test_dependencies` is correctly set
3. Run without `--skip-test-records` flag
4. Check for errors in test record creation

### Import Errors

**Error**: `ImportError` or `ModuleNotFoundError`

**Solutions**:
1. Ensure app is installed: `bench install-app [app-name]`
2. Check Python path and imports
3. Verify module structure is correct
4. Clear Python cache: `find . -type d -name __pycache__ -exec rm -r {} +`

### Database Connection Issues

**Error**: Database connection errors

**Solutions**:
1. Verify site is properly configured
2. Check database credentials in `site_config.json`
3. Ensure database server is running
4. Verify site exists: `bench --site [site-name] list-apps`

### Permission Errors

**Error**: Permission denied errors

**Solutions**:
1. Run tests as the correct user
2. Check user permissions in test setup
3. Use `frappe.set_user()` appropriately
4. Verify role assignments

### Slow Test Execution

**Solutions**:
1. Use `--skip-test-records` if records already exist
2. Run tests in parallel
3. Use `--failfast` to stop on first error
4. Profile tests with `--profile` to identify bottlenecks
5. Optimize test data creation

### Tests Pass Locally But Fail in CI

**Common Causes**:
1. Different database state
2. Missing test records
3. Environment variables not set
4. Different Python/Frappe versions
5. Race conditions in parallel execution

**Solutions**:
1. Ensure CI runs `before_tests` hooks
2. Create test records explicitly
3. Set required environment variables
4. Use same Frappe version
5. Add proper test isolation

---

## Command Reference Summary

### Basic Commands

| Command | Description |
|---------|-------------|
| `bench --site [site] run-tests` | Run all tests |
| `bench --site [site] run-tests --app [app]` | Run tests for app |
| `bench --site [site] run-tests --doctype [DocType]` | Run tests for DocType |
| `bench --site [site] run-tests --module [module]` | Run tests for module |

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | Detailed output |
| `--failfast` | Stop on first failure |
| `--coverage` | Generate coverage report |
| `--profile` | Performance profiling |
| `--skip-test-records` | Skip test record creation |
| `--skip-before-tests` | Skip before_tests hooks |
| `--junit-xml-output [path]` | Generate JUnit XML report |
| `--test [method]` | Run specific test method |
| `--case [class]` | Run specific test class |

### Parallel Execution

| Command | Description |
|---------|-------------|
| `bench --site [site] run-parallel-tests --app [app] --build-number [N] --total-builds [M]` | Run parallel tests |
| `--dry-run` | List tests without running |
| `--with-coverage` | Generate coverage |
| `--use-orchestrator` | Use external orchestrator |

---

## Next Steps

Continue to:
- [Part 1: Fundamentals](./63-Frappe_Unit_Testing_Guide_Part_1_Fundamentals.md)
- [Part 3: Test Patterns and Best Practices](./65-Frappe_Unit_Testing_Guide_Part_3_Patterns.md)
- [Part 4: Advanced Testing Techniques](./66-Frappe_Unit_Testing_Guide_Part_4_Advanced.md)
- [Part 5: Test Data Management](./67-Frappe_Unit_Testing_Guide_Part_5_Test_Data.md)
- [Part 6: Test Utilities and Techniques](./68-Frappe_Unit_Testing_Guide_Part_6_Utilities.md)
- [Part 7: Assertions](./69-Frappe_Unit_Testing_Guide_Part_7_Assertions.md)