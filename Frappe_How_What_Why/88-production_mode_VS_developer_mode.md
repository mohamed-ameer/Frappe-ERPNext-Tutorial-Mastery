# Frappe Framework: Developer Mode vs Production Mode

## Overview

Frappe Framework operates in two distinct modes: **Developer Mode** and **Production Mode**. Each mode is optimized for different use cases and has significant impacts on system behavior, performance, security, and debugging capabilities.

## Configuration

### Developer Mode Configuration

Developer mode is enabled by setting `developer_mode: 1` in the configuration files:

**Common Site Config** (`sites/common_site_config.json`):
```json
{
  "developer_mode": 1,
  "live_reload": true
}
```

**Site-Specific Config** (`sites/[site-name]/site_config.json`):
```json
{
  "developer_mode": 1
}
```

### Production Mode Configuration

Production mode is the default when `developer_mode` is not set or set to `0`:

```json
{
  "developer_mode": 0
}
```

## System Behavior Differences

### 1. Asset Building & Compilation

#### Developer Mode
- **Build Mode**: Development build (unminified)
- **Minification**: Disabled for faster builds
- **Source Maps**: Enabled for debugging
- **File Watching**: Enabled - automatically rebuilds assets when files change
- **Live Reload**: Can be enabled to automatically refresh browser
- **Build Speed**: Faster (no minification overhead)
- **File Size**: Larger (unminified code)

**Code Reference** (`frappe/build.py` lines 55-56):
```python
development = frappe.local.conf.developer_mode or frappe.local.dev_server
build_mode = "development" if development else "production"
```

**Code Reference** (`frappe/commands/utils.py` lines 71-75):
```python
# don't minify in developer_mode for faster builds
development = frappe.local.conf.developer_mode or frappe.local.dev_server
mode = "development" if development else "production"
if production:
    mode = "production"
```

**Code Reference** (`esbuild/esbuild.js` lines 260-263):
```javascript
minify: PRODUCTION,
define: {
    "process.env.NODE_ENV": JSON.stringify(PRODUCTION ? "production" : "development"),
}
```

#### Production Mode
- **Build Mode**: Production build (minified)
- **Minification**: Enabled for optimal performance
- **Source Maps**: Enabled but optimized
- **File Watching**: Disabled
- **Live Reload**: Disabled
- **Build Speed**: Slower (minification takes time)
- **File Size**: Smaller (minified and optimized)

### 2. Error Handling & Debugging

#### Developer Mode
- **Error Tracebacks**: Full stack traces displayed in browser and console
- **Error Details**: Detailed error messages with file paths and line numbers
- **Console Output**: Errors printed to terminal/console
- **Error Pages**: Show full traceback in HTML error pages

**Code Reference** (`frappe/app.py` lines 398-400):
```python
if frappe.conf.get("developer_mode") and not respond_as_json:
    # don't fail silently for non-json response errors
    print(frappe.get_traceback())
```

**Code Reference** (`frappe/app.py` lines 378-381):
```python
traceback = "<pre>" + escape_html(frappe.get_traceback()) + "</pre>"
# disable traceback in production if flag is set
if frappe.local.flags.disable_traceback or not allow_traceback and not frappe.local.dev_server:
    traceback = ""
```

#### Production Mode
- **Error Tracebacks**: Hidden from users (security)
- **Error Details**: Generic error messages only
- **Console Output**: Minimal error logging
- **Error Pages**: Clean error pages without technical details
- **Security**: Prevents exposure of sensitive system information

**Code Reference** (`frappe/utils/response.py` lines 60-65):
```python
def is_traceback_allowed():
    return (
        frappe.db
        and frappe.get_system_settings("allow_error_traceback")
        and (not frappe.local.flags.disable_traceback or frappe._dev_server)
    )
```

### 3. DocType & Standard Document Editing

#### Developer Mode
- **Standard DocTypes**: Can be edited and modified
- **Standard Web Forms**: Can be edited
- **Standard Reports**: Can be edited
- **Export to Files**: Automatically exports changes to JSON files in app directory
- **File System Sync**: Changes are written to source code files
- **Controller Deletion**: Deleting DocTypes also deletes controller files

**Code Reference** (`frappe/core/doctype/doctype/doctype.js` lines 75-84):
```javascript
} else if (frappe.boot.developer_mode) {
    frm.dashboard.clear_comment();
    let msg = __(
        "This site is running in developer mode. Any change made here will be updated in code."
    );
    msg += "<br>";
    msg += __("If you just want to customize for your site, use {0} instead.", [
        customize_form_link,
    ]);
    frm.dashboard.add_comment(msg, "yellow", true);
}
```

**Code Reference** (`frappe/website/doctype/web_form/web_form.py` lines 85-92):
```python
if in_user_env and self.is_standard and not frappe.conf.developer_mode:
    # only published can be changed for standard web forms
    if self.has_value_changed("published"):
        published_value = self.published
        self.reload()
        self.published = published_value
    else:
        frappe.throw(_("You need to be in developer mode to edit a Standard Web Form"))
```

**Code Reference** (`frappe/model/delete_doc.py` lines 92-105):
```python
if (
    frappe.conf.developer_mode
    and not doc.custom
    and not (
        for_reload
        or frappe.flags.in_migrate
        or frappe.flags.in_install
        or frappe.flags.in_uninstall
    )
):
    try:
        delete_controllers(name, doc.module)
    except (OSError, KeyError):
        # in case a doctype doesnt have any controller code  nor any app and module
        pass
```

#### Production Mode
- **Standard DocTypes**: Read-only (cannot be edited)
- **Standard Web Forms**: Only 'published' field can be changed
- **Standard Reports**: Read-only
- **Export to Files**: Disabled
- **File System Sync**: No changes written to source code
- **Customization**: Must use "Customize Form" instead

**Code Reference** (`frappe/core/doctype/doctype/doctype.js` lines 66-74):
```javascript
if (!frappe.boot.developer_mode && !frm.doc.custom) {
    // make the document read-only
    frm.set_read_only();
    frm.dashboard.clear_comment();
    frm.dashboard.add_comment(
        __("DocTypes can not be modified, please use {0} instead", [customize_form_link]),
        "blue",
        true
    );
}
```

### 4. File Watching & Auto-Reload

#### Developer Mode
- **File Watcher**: Enabled - monitors JS/CSS file changes
- **Auto-Rebuild**: Automatically rebuilds assets when files change
- **Live Reload**: Browser can auto-refresh when assets rebuild
- **Redis Notifications**: Sends build events via Redis to browser
- **Port**: File watcher runs on configured port (default: 6787)

**Code Reference** (`frappe/build.py` lines 261-276):
```python
def watch(apps=None):
    """watch and rebuild if necessary"""
    setup()

    command = "yarn run watch"
    if apps:
        command += f" --apps {apps}"

    live_reload = frappe.utils.cint(os.environ.get("LIVE_RELOAD", frappe.conf.live_reload))

    if live_reload:
        command += " --live-reload"

    check_node_executable()
    frappe_app_path = frappe.get_app_source_path("frappe")
    frappe.commands.popen(command, cwd=frappe_app_path, env=get_node_env())
```

**Code Reference** (`esbuild/esbuild.js` lines 272-302):
```javascript
function get_watch_config() {
    if (WATCH_MODE) {
        return {
            async onRebuild(error, result) {
                if (error) {
                    log_error("There was an error during rebuilding changes.");
                    log();
                    log(chalk.dim(error.stack));
                    notify_redis({ error });
                } else {
                    let { new_assets_json, prev_assets_json } = await write_assets_json(
                        result.metafile
                    );

                    let changed_files;
                    if (prev_assets_json) {
                        changed_files = get_rebuilt_assets(prev_assets_json, new_assets_json);

                        let timestamp = new Date().toLocaleTimeString();
                        let message = `${timestamp}: Compiled ${changed_files.length} files...`;
                        log(chalk.yellow(message));
                        for (let filepath of changed_files) {
                            let filename = path.basename(filepath);
                            log("    " + filename);
                        }
                        log();
                    }
                    notify_redis({ success: true, changed_files });
                }
            },
        };
    }
}
```

#### Production Mode
- **File Watcher**: Disabled
- **Auto-Rebuild**: Disabled
- **Live Reload**: Disabled
- **Manual Rebuild**: Requires manual `bench build` command
- **Performance**: Lower resource usage (no file monitoring)

### 5. Network Connectivity Check

#### Developer Mode
- **Online Status**: Always considered online
- **Network Checks**: Bypassed for development convenience
- **Offline Features**: Not enforced

**Code Reference** (`frappe/public/js/frappe/dom.js` lines 364-373):
```javascript
frappe.is_online = function () {
    if (frappe.boot.developer_mode == 1) {
        // always online in developer_mode
        return true;
    }
    if ("onLine" in navigator) {
        return navigator.onLine;
    }
    return true;
};
```

#### Production Mode
- **Online Status**: Checks actual network connectivity
- **Network Checks**: Uses browser's navigator.onLine API
- **Offline Features**: Properly enforced based on connectivity

### 6. Scheduler & Background Jobs

#### Developer Mode
- **Dormant Check**: Disabled - site never considered dormant
- **Scheduler**: Can be disabled for testing
- **Background Jobs**: Full debugging capabilities

**Code Reference** (`frappe/utils/scheduler.py` lines 197-216):
```python
@redis_cache(ttl=60 * 60)
def is_dormant(check_time=None):
    from frappe.utils.frappecloud import on_frappecloud

    if frappe.conf.developer_mode or not on_frappecloud():
        return False

    threshold = cint(frappe.get_system_settings("dormant_days")) * 86400
    if not threshold:
        return False

    last_activity = frappe.db.get_value(
        "User", filters={}, fieldname="last_active", order_by="last_active desc"
    )

    if not last_activity:
        return True
    if ((check_time or now_datetime()) - last_activity).total_seconds() >= threshold:
        return True
    return False
```

#### Production Mode
- **Dormant Check**: Enabled - monitors site activity
- **Scheduler**: Runs as configured
- **Background Jobs**: Optimized for performance

### 7. UI Field Visibility

#### Developer Mode
- **Standard Fields**: "Is Standard" checkbox visible in DocTypes
- **Developer Fields**: Additional fields shown for development
- **Export Options**: "Export Customizations" button available

**Code Reference** (`frappe/core/doctype/user_type/user_type.json` lines 25-29):
```json
{
   "default": "0",
   "depends_on": "eval: frappe.boot.developer_mode",
   "fieldname": "is_standard",
   "fieldtype": "Check",
   "label": "Is Standard",
   "read_only_depends_on": "eval: !frappe.boot.developer_mode"
}
```

**Code Reference** (`frappe/printing/doctype/print_format/print_format.js` line 21):
```javascript
frm.toggle_display("standard", frappe.boot.developer_mode);
```

**Code Reference** (`frappe/custom/doctype/customize_form/customize_form.js` lines 240-268):
```javascript
if (frappe.boot.developer_mode) {
    frm.add_custom_button(
        __("Export Customizations"),
        function () {
            frappe.prompt(
                [
                    {
                        fieldtype: "Link",
                        fieldname: "module",
                        options: "Module Def",
                        label: __("Module to Export"),
                        reqd: 1,
                    },
                    {
                        fieldtype: "Check",
                        fieldname: "sync_on_migrate",
                        label: __("Sync on Migrate"),
                        default: 1,
                    },
                    {
                        fieldtype: "Check",
                        fieldname: "with_permissions",
                        label: __("Export Custom Permissions"),
                        description: __(
                            "Exported permissions will be force-synced on every migrate overriding any other customization."
                        ),
                        default: 0,
                    },
                ],
```

#### Production Mode
- **Standard Fields**: Hidden from users
- **Developer Fields**: Not displayed
- **Export Options**: Not available

### 8. Export to Files Functionality

#### Developer Mode
- **Auto-Export**: Standard documents automatically export to JSON files
- **Dashboard Export**: Dashboards export to module files
- **Report Export**: Reports export to module files
- **Web Template Export**: Templates export to files
- **File Location**: Exports to `apps/[app-name]/[module]/[doctype]/[name]/`

**Code Reference** (`frappe/desk/doctype/dashboard/dashboard.py` lines 41-44):
```python
if frappe.conf.developer_mode and self.is_standard:
    export_to_files(
        record_list=[["Dashboard", self.name, f"{self.module} Dashboard"]], record_module=self.module
    )
```

**Code Reference** (`frappe/core/doctype/report/report.py` lines 135-136):
```python
if self.is_standard == "Yes" and (frappe.local.conf.get("developer_mode") or 0) == 1:
    export_to_files(record_list=[["Report", self.name]], record_module=self.module, create_init=True)
```

**Code Reference** (`frappe/website/doctype/web_template/web_template.py` lines 40-49):
```python
def before_save(self):
    if frappe.conf.developer_mode:
        # custom to standard
        if self.standard:
            self.export_to_files()

        # standard to custom
        was_standard = (self.get_doc_before_save() or {}).get("standard")
        if was_standard and not self.standard:
            self.import_from_files()
```

#### Production Mode
- **Auto-Export**: Disabled
- **File System**: No writes to app source code
- **Customizations**: Stored in database only
- **Safety**: Prevents accidental code changes

## Why Disable Developer Mode in Production?

### Security Reasons

1. **Information Disclosure**: Developer mode exposes detailed error messages, stack traces, and file paths that could help attackers understand your system architecture.

2. **Source Code Protection**: Prevents exposure of internal code structure and logic through error messages.

3. **Attack Surface**: Reduces information available to potential attackers.

### Performance Reasons

1. **Asset Size**: Production builds are minified, resulting in smaller file sizes and faster page loads.

2. **No File Watching**: Eliminates overhead of monitoring file system for changes.

3. **Optimized Code**: Minified and optimized JavaScript/CSS for better performance.

4. **Reduced Memory Usage**: No file watcher process consuming resources.

### Stability Reasons

1. **Prevents Accidental Changes**: Standard DocTypes cannot be modified, preventing accidental breaking changes.

2. **No Auto-Exports**: Prevents automatic file system writes that could cause conflicts.

3. **Controlled Updates**: All changes must be deliberate and tested.

4. **Database Integrity**: Customizations stay in database, not scattered across file system.

## How to Switch Between Modes

### Enable Developer Mode

**Method 1: Using bench command**
```bash
# For all sites
bench set-config developer_mode 1 -g

# For specific site
bench --site [site-name] set-config developer_mode 1
```

**Method 2: Manual configuration**

Edit `sites/common_site_config.json` or `sites/[site-name]/site_config.json`:
```json
{
  "developer_mode": 1
}
```

Then restart bench:
```bash
bench restart
```

### Disable Developer Mode (Production Setup)

**Method 1: Using bench command**
```bash
# For all sites
bench set-config developer_mode 0 -g

# For specific site
bench --site [site-name] set-config developer_mode 0
```

**Method 2: Manual configuration**

Edit `sites/common_site_config.json` or `sites/[site-name]/site_config.json`:
```json
{
  "developer_mode": 0
}
```

Then restart bench:
```bash
bench restart
```

**Method 3: Full production setup**

For complete production deployment:
```bash
# Setup production environment with supervisor and nginx
sudo bench setup production [frappe-user]

# Build assets in production mode
bench build --production

# Restart services
sudo supervisorctl restart all
```

**Code Reference** (`bench/config/production_setup.py` lines 35-87):
```python
def setup_production(user, bench_path=".", yes=False):
    print("Setting Up prerequisites...")
    setup_production_prerequisites()

    conf = Bench(bench_path).conf

    if conf.get("restart_supervisor_on_update") and conf.get("restart_systemd_on_update"):
        raise Exception(
            "You cannot use supervisor and systemd at the same time. Modify your common_site_config accordingly."
        )

    if conf.get("restart_systemd_on_update"):
        print("Setting Up systemd...")
        generate_systemd_config(bench_path=bench_path, user=user, yes=yes)
    else:
        print("Setting Up supervisor...")
        check_supervisord_config(user=user)
        generate_supervisor_config(bench_path=bench_path, user=user, yes=yes)

    print("Setting Up NGINX...")
    make_nginx_conf(bench_path=bench_path, yes=yes)
    fix_prod_setup_perms(bench_path, frappe_user=user)
    remove_default_nginx_configs()

    # ... setup continues
```

## Recommended Production Configuration

When setting up production, ensure these settings in `common_site_config.json`:

```json
{
  "developer_mode": 0,
  "live_reload": false,
  "disable_website_cache": 0,
  "auto_cache_clear": 0,
  "enable_frappe_logger": 0,
  "restart_supervisor_on_update": true,
  "restart_systemd_on_update": false,
  "serve_default_site": true
}
```

---

## Switching from Production to Development Environment

**Method 1: Using bench command**
```bash
cd frappe-bench
bench disable-production
```

**Method 2: Manual configuration**
```bash
cd frappe-bench
rm config/supervisor.conf
rm config/nginx.conf
sudo service nginx stop
sudo service supervisor stop
bench setup procfile
bench start
```
>Remove `restart_supervisor_on_update` from `sites/common_site_config.json` if it exists

---

## Development Workflow Best Practices

### During Development
1. Enable developer mode
2. Enable live reload for faster development
3. Use `bench watch` for automatic asset rebuilding
4. Make changes to standard DocTypes as needed
5. Changes automatically export to JSON files

### Before Production Deployment
1. Disable developer mode
2. Run `bench build --production` to create optimized assets
3. Test thoroughly in staging environment
4. Clear cache: `bench clear-cache`
5. Restart services

### In Production
1. Keep developer mode disabled
2. Use "Customize Form" for customizations
3. Monitor error logs (errors won't show to users)
4. Use proper logging and monitoring tools
5. Never edit standard DocTypes directly

## Summary Comparison Table

| Feature | Developer Mode | Production Mode |
|---------|---------------|-----------------|
| **Asset Minification** | ❌ Disabled | ✅ Enabled |
| **Source Maps** | ✅ Full | ✅ Optimized |
| **File Watching** | ✅ Enabled | ❌ Disabled |
| **Live Reload** | ✅ Available | ❌ Disabled |
| **Error Tracebacks** | ✅ Full Details | ❌ Hidden |
| **Console Errors** | ✅ Printed | ❌ Minimal |
| **Edit Standard DocTypes** | ✅ Allowed | ❌ Read-Only |
| **Export to Files** | ✅ Automatic | ❌ Disabled |
| **Build Speed** | ⚡ Fast | 🐌 Slower |
| **Asset Size** | 📦 Large | 📦 Small |
| **Performance** | 🐌 Slower | ⚡ Fast |
| **Security** | ⚠️ Low | 🔒 High |
| **File System Writes** | ✅ Enabled | ❌ Disabled |
| **Dormant Check** | ❌ Disabled | ✅ Enabled |
| **Network Check** | ❌ Always Online | ✅ Real Check |
| **Developer Fields** | ✅ Visible | ❌ Hidden |
| **Export Customizations** | ✅ Available | ❌ Not Available |

**Production Mode:**

- Users cannot edit standard DocTypes (e.g., User, Sales Invoice).
- Users can create and edit custom DocTypes.
- All customizations should be done via Customize Form or fixtures, not direct edits to standard objects.

**Developer Mode:**

- Users can edit standard DocTypes, and changes are auto-exported to JSON files in the app directory.
- Intended for app development, not site customization.

---

### What Is developer_mode?
developer_mode is a setting in your Frappe site’s configuration file—either in:

- `sites/[your-site]/site_config.json`, or
- `sites/common_site_config.json`

If you set "developer_mode": 1, your site runs in developer mode. 

If it’s 0 (or not set), it runs in production mode.

**This setting controls things like:**

- Whether you can edit built-in DocTypes (like User or Sales Invoice)
- Whether error messages show full technical details
- Whether code changes are automatically saved to files
- Whether JavaScript and CSS files are minified

> Important: developer_mode has nothing to do with how you run Frappe (like using bench start or nginx). It’s only about the setting in the config file.

**How Do You Run Frappe? Two Main Ways**
1. `bench start` — For Development

- Used when you’re writing or testing code on your own computer or a development server.
- Starts all Frappe services (web, background jobs, etc.) in your terminal.
- Easy to stop (Ctrl+C) and restart.
- Works well with developer_mode = 1 because it supports features like live reloading.
2. `nginx` + `supervisor` — For Production

- Used on live servers where your app needs to run 24/7.
- nginx handles web traffic.
- supervisor keeps Frappe processes running in the background.
- More stable and efficient for real users.
- Not designed for frequent code changes—you must manually rebuild and restart services.
- You can run a site with developer_mode = 1 using nginx + supervisor, but you shouldn’t do this on a real production site because it’s less secure and slower.

**A Practical Tip: Mixed Setup (For Advanced Users)**

Some developers use a mix of both methods when working on a remote server (like a VM):

- Run background jobs and Redis with supervisor (so they stay alive).
- But run the web server using bench serve instead of supervisor.
- Why? Because it’s faster to restart just the web part when testing changes, without touching the rest of the system.

To do this:

1. Remove the frappe-web entry from config/supervisor.conf.
2. Use a simple Procfile that only runs the web process.
3. Start the web server with bench serve.

>This is optional and mostly useful for developers working remotely.


**Key Takeaways**

- developer_mode is a config setting, not a way of running Frappe.
- Use bench start when developing.
- Use nginx + supervisor when deploying to production.
- Never enable developer_mode on a live public site.
- You don’t need to stop using nginx or supervisor just to develop—you can mix tools if it helps your workflow.

**Keep it simple:**

- → Develop locally with bench start and developer_mode = 1.
- → Deploy live with nginx/supervisor and developer_mode = 0.

---

## Code References Summary

All information in this document is based on actual code from the Frappe Framework repository:

- **Asset Building**: `frappe/build.py`, `frappe/commands/utils.py`, `esbuild/esbuild.js`
- **Error Handling**: `frappe/app.py`, `frappe/utils/response.py`, `frappe/www/error.py`
- **DocType Editing**: `frappe/core/doctype/doctype/doctype.js`, `frappe/website/doctype/web_form/web_form.py`
- **File Watching**: `frappe/build.py`, `esbuild/esbuild.js`
- **Export Functionality**: `frappe/modules/export_file.py`, `frappe/desk/doctype/dashboard/dashboard.py`
- **Production Setup**: `bench/config/production_setup.py`
- **Configuration**: `bench/config/common_site_config.py`

## Conclusion

Developer mode and production mode serve fundamentally different purposes:

- **Developer Mode** is designed for **development and testing**, prioritizing:
  - Fast iteration and debugging
  - Detailed error information
  - Automatic file exports
  - Flexibility to modify standard documents

- **Production Mode** is designed for **live deployments**, prioritizing:
  - Performance and optimization
  - Security and stability
  - Minimal resource usage
  - Protection against accidental changes

**Always disable developer mode in production environments** to ensure optimal performance, security, and stability of your Frappe application.

---
