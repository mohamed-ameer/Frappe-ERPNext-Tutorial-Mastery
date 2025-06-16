# Incorrect Password Reset Link in Frappe (Production)

## What is the Problem?

In a Frappe production environment, password reset emails may contain incorrect links like:

```
http://your-site-folder-name/update-password?key=abc123...
```

Instead of the expected:

```
https://your-production-domain.com/update-password?key=abc123...
```

This causes the reset link to break or direct users to an invalid or inaccessible address.

---

## Why Does This Happen?

Frappe tries to generate URLs based on the request's host header. 
In **non-request contexts** =>( such as background jobs, scheduled tasks, or email triggers ) there is no incoming HTTP request. In such cases, Frappe falls back to the following logic:

1. If `"host_name"` or `"hostname"` is set in `site_config.json`, it uses that.
2. If neither is set, and no HTTP request is available, it constructs the URL using:
   - `frappe.local.site` (the **site folder name**).
   - Protocol based on presence of `ssl_certificate` or `wildcard`.

This fallback logic is what leads to incorrect links like:
```
http://your-site-folder-name/update-password?key=...
```
> This is the core logic behind generating the link:
https://github.com/frappe/frappe/blob/2a81365adb4ec24bafcd4472600c0f1f26e6c720/frappe/utils/data.py#L1543-L1597

---

## What is the Solution?

There are **two solutions** to ensure Frappe generates correct URLs in production:

---

### Option 1: Rename the Site Folder

Rename the site folder under the `sites/` directory to match your production domain:

```bash
mv sites/your_site_name sites/your-production-domain.com
```

This ensures that even fallback behavior generates the correct domain in the absence of a request.

> Don’t forget to update your NGINX configuration and any internal references to reflect the new site folder name.

---

### Option 2: Add `host_name` to `site_config.json`

If renaming the site folder isn’t an option, explicitly define the correct domain by adding a `host_name` field in the `site_config.json` file:

```json
{
  ...
  "host_name": "https://your-production-domain.com"
}
```

Make sure to include the correct scheme (`http://` or `https://`) and delete any development-specific ports.

Then restart your bench:

```bash
bench restart
```

---

## (Optional) Remove `webserver_port` from `common_site_config.json`

If your `common_site_config.json` includes this key:

```json
"webserver_port": 8000
```

Frappe may append `:8000` to generated links. This is only appropriate for local development using `bench start`, so in production, it’s best to remove this setting to avoid incorrect URL formatting.

see more: https://github.com/pipech/erpnext-docker-debian/issues/38

---

## Final Outcome

Once one of the above solutions is applied, Frappe will correctly generate password reset links using your actual production domain, such as:

```
https://your-production-domain.com/update-password?key=abc123...
```
