# Frappe Encryption Key System (secure sensitive information NOT User Passwords)

## Overview

The `encryption_key` in Frappe is a **32-character base64-encoded key** that serves as the master key for encrypting and decrypting sensitive data. It's stored in `site_config.json` and is essential for:

- **Data Protection**: 
    - Encrypting sensitive information like API keys and service credentials
    - Frappe uses the encryption_key to protect sensitive values stored in the database.
    - These are not hashed (like login passwords) but encrypted because the system needs to decrypt and use them later (e.g., connect to email servers, payment gateways, APIs).
    > This ensures that if someone gains database access, they cannot read API secrets without also having the site’s encryption_key.
- **Backup Security**: Encrypting backup files.
    - Database and file backups may contain sensitive information (emails, service credentials, tokens, financial data).
    - Frappe lets you encrypt backups using the same site-level encryption_key.
    - **Scenario**
        - **With key:** Admin restores backup and all data (including API secrets, email passwords) is intact.
        - **Without key:** Admin restores backup, but Frappe throws "Encryption key is invalid!" errors when trying to read sensitive values.
    
        > This prevents attackers from downloading backups and using your sensitive information.
- **Data Integrity**: Ensuring encrypted data can only be accessed with the correct key.
    - Frappe uses Fernet encryption (AES + HMAC). This not only encrypts the data but also ensures that the data cannot be modified or decrypted with the wrong key.

        - If the wrong key is used, decryption fails with an `InvalidToken` error.
        - If the data is tampered (e.g., attacker edits the ciphertext), the integrity check fails, and the system rejects it.
    - This Prevents silent corruption: You’ll know immediately if the ciphertext or key is wrong.

    - and Prevents brute-force decryption: Attackers can’t just guess keys and get meaningful results, because Fernet enforces integrity checks.

        > This guarantees that only the correct site key can unlock your sensitive data.

### Key Characteristics
- **Length**: 32 characters (base64-encoded)
> The key is not exactly "32 characters" in the sense of raw text length. It’s a 32-byte key that gets base64-encoded, resulting in a 44-character string (e.g., B2lCdnY...=).
- **Format**: Generated using `Fernet.generate_key().decode()`
- **Location**: Stored in `sites/{site_name}/site_config.json`
- **Algorithm**: Uses Fernet (AES-128 in CBC mode with PKCS7 padding)

---

## How Encryption Key Works

### 1. Key Generation
```python
# When a new site is created, Frappe automatically generates an encryption key
from cryptography.fernet import Fernet

def get_encryption_key():
    if "encryption_key" not in frappe.local.conf:
        encryption_key = Fernet.generate_key().decode()  # 32-char base64
        update_site_config("encryption_key", encryption_key)
        frappe.local.conf.encryption_key = encryption_key
    
    return frappe.local.conf.encryption_key
```

### 2. Encryption Process
```python
def encrypt(txt, encryption_key=None):
    # Uses Fernet (AES-128) for encryption
    cipher_suite = Fernet(encode(encryption_key or get_encryption_key()))
    return cstr(cipher_suite.encrypt(encode(txt)))
```

### 3. Decryption Process
```python
def decrypt(txt, encryption_key=None, key=None):
    try:
        cipher_suite = Fernet(encode(encryption_key or get_encryption_key()))
        return cstr(cipher_suite.decrypt(encode(txt)))
    except InvalidToken:
        # Key mismatch - data cannot be decrypted
        frappe.throw("Encryption key is invalid!")
```

---

## What Gets Encrypted

### 1. **API Keys and Secrets**
```python
# API secrets stored in __Auth table with encrypted=1
api_secret = get_decrypted_password("User", "admin", "api_secret")
```

### 2. **Service Credentials**
```python
# Email passwords, payment gateway keys, etc.
email_password = get_decrypted_password("Email Account", "gmail", "password")
```

### 3. **Backup Files**
```python
# Encrypted backups use the same key
if frappe.get_system_settings("encrypt_backup"):
    backup_encryption_key = get_or_generate_backup_encryption_key()
```

### 4. **Custom Encrypted Data**
```python
# Any data that needs to be retrieved later
encrypted_data = encrypt("sensitive_information", get_encryption_key())
decrypted_data = decrypt(encrypted_data, get_encryption_key())
```

---

## Password Fields vs Encryption

### **Important Distinction**

| Aspect | User Passwords | Encrypted Passwords |
|--------|----------------|-------------------|
| **Storage Method** | Hashed (bcrypt/pbkdf2) | Encrypted (AES) |
| **Retrieval** | Cannot be retrieved | Can be decrypted |
| **Purpose** | Authentication only | Service connections |
| **Table** | `__Auth` with `encrypted=0` | `__Auth` with `encrypted=1` |
| **Uses encryption_key** | No | Yes |

> not all fields marked as "Password" in DocTypes are encrypted by default. Developers must explicitly use set_encrypted_password() or mark fields with fieldtype = "Password" and encrypt=1.

### **User Passwords (Hashed)**
```python
# User login passwords are HASHED, not encrypted
def update_password(user, pwd):
    hashPwd = passlibctx.hash(pwd)  # bcrypt/pbkdf2
    # Stored in __Auth with encrypted=0
    query.insert(doctype, user, "password", hashPwd, 0)
```

### **Service Passwords (Encrypted)**
```python
# Service passwords are ENCRYPTED for retrieval
def set_encrypted_password(doctype, name, pwd):
    encrypted_pwd = encrypt(pwd)  # Uses encryption_key
    # Stored in __Auth with encrypted=1
    query.insert(doctype, name, "password", encrypted_pwd, 1)
```

---

## Database Storage

### **__Auth Table Structure**
```sql
CREATE TABLE `__Auth` (
    `doctype` VARCHAR(140) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `fieldname` VARCHAR(140) NOT NULL,
    `password` TEXT NOT NULL,
    `encrypted` INT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`doctype`, `name`, `fieldname`)
);
```

### **How Data is Stored**

#### **Hashed Passwords (encrypted=0)**
```sql
-- User passwords (hashed, not encrypted)
INSERT INTO __Auth VALUES ('User', 'admin', 'password', 'pbkdf2:sha256:600000$salt$hash', 0);
```

#### **Encrypted Passwords (encrypted=1)**
```sql
-- Service passwords (encrypted)
INSERT INTO __Auth VALUES ('Email Account', 'gmail', 'password', 'gAAAAABk...encrypted_data...', 1);
```

### **Retrieval Logic**
```python
def get_decrypted_password(doctype, name, fieldname="password"):
    # Only retrieves encrypted passwords (encrypted=1)
    result = frappe.qb.from_(Auth).select(Auth.password).where(
        (Auth.doctype == doctype) &
        (Auth.name == name) &
        (Auth.fieldname == fieldname) &
        (Auth.encrypted == 1)  # Only encrypted data
    ).run()
    
    if result:
        return decrypt(result[0][0], key=f"{doctype}.{name}.{fieldname}")
```

---

## Site Configuration

### **site_config.json Structure**
```json
{
  "db_name": "_05sgddsfsmdfmkj8",
  "db_password": "bkhfbvjhbdfhjdfkhbv",
  "db_type": "mariadb",
  "encryption_key": "bhbhjhjdfjhjfbvjhfvbkfdsbkbsbdfhksbkbd=",
}
```

### **Key Components**
- **`encryption_key`**: Master key for encryption/decryption
- **`db_password`**: Database password (not encrypted)

---

## Backup and Migration

### **What “Migration” Means in Frappe?**

When we say migration in Frappe/ERPNext, we usually mean:
- Moving a site from one server to another
- Restoring from a backup (bench restore)

During migration, Frappe tries to read encrypted data (API keys, email passwords, payment gateway credentials, etc.) from the database.
### **Critical Importance for Migration**

When migrating a Frappe site, the `encryption_key` is **absolutely critical**:

#### **What Happens Without the Key**
```python
# If encryption_key is missing or changed:
try:
    decrypted_data = decrypt(encrypted_data, new_encryption_key)
except InvalidToken:
    frappe.throw(
        "Encryption key is invalid! Please check site_config.json\n"
        "If you have recently restored the site you may need to copy the site config containing original Encryption Key."
    )
```

#### **Migration Scenarios**

**Successful Migration**
```bash
# 1. Backup with original encryption_key
bench --site old-site backup

# 2. Copy site_config.json with original encryption_key
cp sites/old-site/site_config.json sites/new-site/

# 3. Restore with same encryption_key
bench --site new-site restore backup.sql
```

**Failed Migration (Lost Key)**
```bash
# 1. Backup with original encryption_key
bench --site old-site backup

# 2. Create new site (generates new encryption_key)
bench new-site new-site

# 3. Restore fails - cannot decrypt data
bench --site new-site restore backup.sql
# Error: Encryption key is invalid!
```

### **Backup Encryption**
```python
# Frappe can encrypt backup files using the same key
if frappe.get_system_settings("encrypt_backup"):
    backup_encryption_key = get_or_generate_backup_encryption_key()
    # Uses the same encryption_key from site_config.json
```

### **Why Migration Fails Without the Original Key?**

All encrypted values in the database are tied to the original encryption_key stored in site_config.json.
If that key is missing or replaced, Frappe can no longer decrypt them.

**What That Means in Practice:**
- The migration itself (DB restore) succeeds: tables, data, and files are restored.But whenever you try to use encrypted values, Frappe breaks. Examples:
    - Sending an email (needs stored password) → error.
    - Calling an external API (needs API secret) → error.
    - Using payment gateway (needs merchant key) → error.

So the site may “look migrated,” but critical functionality fails.

### **When the Encryption Key Matters?**

The encryption_key is only required at runtime when Frappe needs to decrypt and use data stored with encrypted=1 in the __Auth table (or backups).

**Examples:**

- Sending an email → needs to decrypt stored SMTP password.
- Using an API integration → needs to decrypt API secret.
- Restoring an encrypted backup → needs the original key.

If the key is wrong, these actions fail with InvalidToken: Encryption key is invalid!.

### **Does `bench migrate` relate to Site Migration?**
**No.**  
`bench migrate` only applies database schema changes and runs patches.  
It does **not** validate encrypted values in your database.

- `bench migrate` will succeed even if the encryption key is missing or incorrect.  
- Problems occur later at **runtime**, when the system tries to use encrypted values (e.g., email passwords, API secrets, backups).  
- Without the original `encryption_key`, these operations will fail with an "Encryption key is invalid!" error.

So while `bench migrate` itself doesn’t fail, your **site functionality becomes partially broken** if the original key is missing.

### **Common Issues**

#### **1. "Encryption key is invalid!" Error**
```python
# Cause: encryption_key changed or missing
# Solution: Restore original site_config.json
cp backup/site_config.json sites/your-site/site_config.json
```

#### **2. Backup Restoration Fails**
```bash
# Cause: Backup encrypted with different key
# Solution: Provide correct encryption_key
bench --site new-site restore backup.sql --encryption-key "original_key"
```

### **Recovery Procedures**

#### **Lost Encryption Key**
```python
# If encryption_key is lost, encrypted data cannot be recovered
# Only option: Re-create encrypted data
# User passwords (hashed) are still accessible
```

#### **Corrupted site_config.json**
```bash
# Restore from backup
cp backup/site_config.json sites/your-site/site_config.json
```

---

## Summary

The `encryption_key` in Frappe is a **critical security component** that:

1. **Encrypts sensitive data** that needs to be retrieved later
2. **Protects backup files** from unauthorized access
3. **Must be preserved** during site migrations
4. **Cannot be recovered** if lost
5. **Is different from password hashing** (which doesn't use encryption)

### **Key Takeaways**
- **Always backup `site_config.json`** with your database
- **Never change `encryption_key`** without proper migration procedures
- **User passwords are hashed, not encrypted** (don't use encryption_key)
- **Service credentials are encrypted** (use encryption_key)
- **Migration requires the original encryption_key**

### **Critical Commands**
```bash
# Backup with encryption
bench --site your-site backup --with-files

# Restore with encryption key
bench --site new-site restore backup.sql --encryption-key "original_key"

# Check encryption status
bench --site your-site get-config encryption_key
```

**Remember**: The `encryption_key` is the master key to your encrypted data. Protect it like you would protect your most valuable asset

**Think of `encryption_key` as the master key to a safe:**
- You moved the safe (database) to a new house (server).
- If you don’t bring the original key, the safe (encrypted data) is still there — but useless.
