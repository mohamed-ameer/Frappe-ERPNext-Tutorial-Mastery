# Frappe Quick Testing Tips (Verify Your Features)

This document provides comprehensive instructions for testing various features and functionalities in your Frappe application.

## Table of Contents

1. Testing Translations
2. Testing Patches
3. Displaying Background Server
4. Displaying Email Messages
5. Testing Schedule Events
6. Doctype Unit Testing

---

## Testing Translations

Translation testing allows you to verify that your app correctly displays content in different languages.

### Steps

1. **Open the Frappe console:**
   ```bash
   bench --site my_site console
   ```
   Replace `my_site` with your actual site name.

2. **Set the language to Arabic:**
   ```python
   frappe.lang = "ar"
   frappe.local.lang = "ar"
   ```

3. **Test the translation:**
   ```python
   frappe._("hello")
   ```
   This will return the translated version of "hello" in Arabic if the translation exists.

### Additional Notes

- Replace "ar" with any supported language code (e.g., "en", "es", "fr", etc.)
- Ensure your app has the necessary translation files (`.csv` files in the app's `translations` folder)
- The `frappe._()` function is used to mark strings as translatable

---

## Testing Patches

Patches are Python files that modify your database structure or data. Testing them before deployment ensures they work correctly.

### Executing a Patch

1. **Run the execute command:**
   ```bash
   bench execute path.to.mypatch.execute
   ```
   
2. **Finding the patch path:**
   - The `path.to.mypatch` is the same path you added to `patches.txt` in your app
   - You can copy-paste the exact path from the patches.txt file

### Example

If your patches.txt contains:
```
my_app.patches.v1_0
```

Execute it with:
```bash
bench execute my_app.patches.v1_0.execute
```

---

## Displaying Background Server

The background server handles long-running tasks and scheduled jobs.

### Viewing Background Worker

Run the following command to display background server activity for the long queue:

```bash
bench worker --queue long
```

### Queue Options

- `short`: For quick tasks
- `long`: For time-consuming operations
- `default`: For regular background tasks

---

## Render Email HTML Messages in Email Queue

Email testing allows you to render and display the full content of queued emails, including the body and attachments.

### Steps

1. **Open the Frappe console:**
   ```bash
   bench console
   ```

2. **Run the email inspection script:**
   ```python
   import email
   from email import policy
   from email.parser import BytesParser

   # Replace 'your-email-queue-name' with the actual email queue document name
   raw_message = frappe.db.get_value("Email Queue", "your-email-queue-name", "message")

   # Parse the email message
   msg = email.message_from_string(raw_message, policy=policy.default)

   # Extract and print the subject
   print("Subject:", msg["subject"])

   # Extract plain text and HTML parts
   for part in msg.walk():
       if part.get_content_type() == "text/plain":
           print("Plain text:\n", part.get_content())
       elif part.get_content_type() == "text/html":
           html = part.get_content()
           print("HTML content:\n", html)
   ```



---

## Testing Schedule Events

Schedule events are automated tasks that run at specified intervals or times.

### Triggering a Schedule Event

Use the following command to manually trigger a scheduled event:

```bash
bench trigger-scheduler-event <path>
```

Replace `<path>` with the path to your schedule event handler.

### Example

If your schedule event is defined in:
```
my_app.scheduler.tasks.daily_backup
```

Trigger it with:
```bash
bench trigger-scheduler-event my_app.scheduler.tasks.daily_backup
```

### Schedule Event Definition

Schedule events are typically defined in your `hooks.py` file:

```python
scheduler_events = {
    "daily": [
        "my_app.scheduler.tasks.daily_backup"
    ],
    "hourly": [
        "my_app.scheduler.tasks.hourly_cleanup"
    ],
    "weekly": [
        "my_app.scheduler.tasks.weekly_report"
    ]
}
```

---

## Doctype Unit Testing

**To run tests for a specific Doctype, use the following command:**

```bash
bench --site <site> run-tests --doctype <doctype> --skip-test-records
```

**To test specific methods within a Doctype's test file, you can use the `--test` flag:**

```bash
bench --site <site> run-tests --doctype <doctype> --test <method_name> --skip-test-records
```

- Replace `<site>` with your site name, `<doctype>` with the Doctype you want to test, and `<method_name>` with the specific method you want to test.
- `--skip-test-records` is used to skip the automatic creation of test records because we are not creating.

---

## Command Reference

| Command | Purpose |
|---------|---------|
| `bench --site <site> console` | Open interactive Python console |
| `bench execute <path>` | Run a patch or function |
| `bench worker --queue <queue>` | Start background worker for specific queue |
| `bench trigger-scheduler-event <path>` | Manually trigger a scheduled event |

---