
# Fixing the "encryption key is invalid" Error in Frappe / ERPNext  

---

## What is it?

In Frappe/ERPNext, encryption is used to secure sensitive information such as email account passwords, API secrets, and social login credentials. When the encryption key is missing or incorrect, Frappe will fail to decrypt these values and show an error.

### Common Error Message

```
Failed to decrypt key Email Account.
Encryption key is invalid! Please check site_config.json
```

This error means that Frappe cannot decrypt encrypted data because the `encryption_key` in `site_config.json` is missing or does not match the original one used.

---

## Why This Happens

The encryption key is a unique 32-character string stored in each site’s `site_config.json` file. It’s essential for decrypting any sensitive values that Frappe encrypts.

### Common Causes

1. Restoring a site from a backup without copying the original `site_config.json`.
2. Migrating to a new server without transferring the correct key.
3. Accidentally deleting or modifying the `encryption_key`.
4. Performing a fresh install or site reset and not restoring the original encryption key.

Once this key is missing or incorrect, previously encrypted data becomes unreadable to Frappe.

---

## How to Fix It?

This issue **usually occurs after restoring a database** from an older installation.

**Two possible solutions:**

1. **Preferred:** Go to the original installation and copy the `encryption_key` from the old `site_config.json` to your new one.

2. **Manual Fix:** Re-enter passwords for each email account manually in the system.

---

## Notes

- Always keep a **copy of your original `site_config.json`** when backing up or migrating.
- Do not **manually modify** or delete the `encryption_key`.
- It must be **exactly 32 characters long** to work correctly with AES encryption.
- Frappe encrypts data to protect your users and your business, reducing the risk of stolen passwords or tokens and aligning with modern web security standards.
- **AES encryption** is a way to protect your information by scrambling it so only people with the right "key" can read it. It's like a secret code that makes data unreadable to those who don't have the key. This process ensures sensitive information remains secure during transmission or storage. 
- **why frappe use encryption?**

    Instead of saving these values as plain text, Frappe encrypts them before storing in the database and decrypts them only when needed during runtime.

    This ensures that even if someone gains access to your database, they can't read sensitive data unless they have the encryption key.


---