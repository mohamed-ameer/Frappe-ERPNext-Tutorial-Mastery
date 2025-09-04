
# Frappe Bench Backup and Restore Guide

## Overview
The `bench backup` command in the Frappe Framework is a critical tool for creating backups of a site's database and associated files (both public and private). It ensures data integrity and recoverability in case of system failures, corruption, or migration needs.

## What It Does

### Database Backup
- Creates a dump of the site's database in `.sql.gz` format.
- Includes all tables, records, and database schema necessary to restore the site later.

### Public Files Backup
- Compresses and backs up the `public/files` directory.
- Contains user-uploaded files that are publicly accessible through the application (e.g., images, documents).

### Private Files Backup
- Compresses and backs up the `private/files` directory.
- Includes sensitive files meant for internal use, such as attachments or confidential documents.

## Storage Location
Backups are stored in the `sites/{site-name}/private/backups/` directory by default.

## How to Use It
To run the backup command, navigate to your Frappe Bench directory and execute:

```
bench --site [site-name] backup
```

### Example:
```
bench --site ngo.local backup
```

## Options
- `--with-files`: Includes public and private files in the backup.
- `--compress`: Compresses the database dump (enabled by default).
- `--verbose`: Provides detailed output during the backup process.

## Where to Find the Backup Files
After running the command, the backup files can be found in:

```
sites/[site-name]/private/backups/
```

Typically, the directory contains:
- `database-timestamp.sql.gz`: The database dump.
- `files-timestamp.tar`: The public files backup.
- `private-files-timestamp.tar`: The private files backup.

## When to Use It
- **Before Upgrades**: To ensure you can restore your site if the upgrade fails.
- **Before Migration**: To transfer your site to another server or instance.
- **Periodic Backups**: As part of regular maintenance to safeguard against data loss.
- **Pre-Restoration**: To preserve the current state before restoring an older backup.

---

## Restore Dump Database and Public & Private Files

### Step 1: Obtain the Backup Files

Ensure that you have the following backup files:
- Database dump file (e.g., `database-timestamp.sql.gz`)
- Public files archive (e.g., `files-timestamp.tar.gz`)
- Private files archive (e.g., `private-files-timestamp.tar.gz`)

Ensure that you enable scheduler, maintenance, server_script, and developer mode in your site:

```
bench --site {site_name} set-config enable_scheduler true
bench set-config -g developer_mode 1
bench --site [site-name] set-maintenance-mode off
bench set-config -g server_script_enabled true
bench --site [site-name] set-config server_script_enabled true
```

### Verify After Enabling
Check if the scheduler is now enabled:

```
bench --site {site_name} doctor
```

You should see:

```
{site_name}: Scheduler is enabled
```

### Step 2: Prepare the Environment

Ensure the bench environment is running:
```
bench start
```

Make sure that the backup files are in the correct format:
- Database dump: `.sql.gz`
- Public and private files: `.tar.gz`

### Step 3: Restore the Database and Files

#### 3.1 Restore the Database
```
bench --site {site_name} restore {path_to_database_file}
```
**Example:**
```
bench --site mysite.local restore /path/to/database-timestamp.sql.gz
```

#### 3.2 Restore Public & Private Files
```
bench --site {site_name} restore {path_to_database_file}       --with-public-files {path_to_public_files_archive}       --with-private-files {path_to_private_files_archive}
```

**Example:**
```
bench --site mysite.local restore /path/to/database-timestamp.sql.gz       --with-public-files /path/to/files-timestamp.tar.gz       --with-private-files /path/to/private-files-timestamp.tar.gz
```

#### 3.3 If restore fails, use `--force`:
```
bench --site {site_name} restore {path_to_database_file} --force
```
> The `--force` option will force the restoration and may overwrite existing data. Use it with caution.

### Step 4: Verify the Restoration
- Visit your site in a web browser.
- Check that all data and files have been restored properly.
