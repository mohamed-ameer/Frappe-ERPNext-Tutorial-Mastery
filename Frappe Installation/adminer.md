# Complete Guide: Installing and Running Adminer for Frappe on macOS

This guide provides a step-by-step walkthrough for setting up **Adminer** on macOS to manage your local **Frappe / ERPNext** MariaDB database. It uses a lightweight native PHP setup that avoids heavy server dependencies (like Apache/`httpd`) and includes background shortcuts to start and stop the server easily.

---

## 1. Install Native PHP via Homebrew

To avoid compilation errors associated with building Apache (`httpd`) from source on Intel macOS, we use the pre-built standalone PHP distribution provided by Shivam Mathur's Homebrew tap.

Run the following commands in your terminal:

```zsh
# Tap the PHP repository
brew tap shivammathur/php

# Install standalone PHP
brew install shivammathur/php/php
```

To verify that PHP installed correctly, check its version:

```zsh
php -v
```

---

## 2. Create the Adminer Directory and Download the Script

Adminer is a lightweight, single-file database management tool. We will create a dedicated folder in your home directory and download the latest version as `index.php`.

```zsh
# Create the adminer directory and navigate into it
mkdir -p ~/adminer && cd ~/adminer

# Download the latest Adminer release
curl -Lo index.php https://www.adminer.org/latest.php
```

---

## 3. Configure Start & Stop Shortcuts in Shell

To avoid manually navigating to the folder and keeping a terminal tab locked every time you run Adminer, you can create convenient aliases in your Zsh configuration file (`~/.zshrc`).

1. Open your Zsh configuration file:
   ```zsh
   nano ~/.zshrc
   ```

2. Add the following lines at the bottom of the file:
   ```zsh
   # Adminer Control Shortcuts
   alias adminer-start="cd ~/adminer && php -S localhost:8080 &"
   alias adminer-stop="kill \$(lsof -t -i:8080)"
   ```

   * **`adminer-start`**: Switches to `~/adminer` and launches PHP's built-in web server on port `8080` in the background (using `&`).
   * **`adminer-stop`**: Finds the process currently running on port `8080` via `lsof` and terminates it cleanly.

3. Save and exit `nano` (`Ctrl + O`, press `Enter`, then `Ctrl + X`).

4. Reload your Zsh configuration to activate the new shortcuts:
   ```zsh
   source ~/.zshrc
   ```

---

## 4. Retrieve Your Frappe Database Credentials

To log into your specific Frappe site database, you need to know its database name (`db_name`).

1. Navigate to your Frappe bench directory:
   ```zsh
   cd ~/frappe-bench
   ```

2. Inspect your site's configuration file:
   ```zsh
   cat sites/[your-site-name]/site_config.json
   ```

3. Note down the string value assigned to `"db_name"` (for example: `_1234567890abcdef`).

---

## 5. Start and Log In to Adminer

1. Start the Adminer background server from any terminal window:
   ```zsh
   adminer-start
   ```

2. Open your web browser and go to:
   **[http://localhost:8080/](http://localhost:8080/)**

3. Fill in the login details:

   | Field | Value | Notes |
   | :--- | :--- | :--- |
   | **System** | `MySQL` | MariaDB uses the MySQL driver |
   | **Server** | `127.0.0.1` | Local host address |
   | **Username** | `root` | Root database user |
   | **Password** | `root` | Default root password |
   | **Database** | `_1234567890abcdef` | The `db_name` value from your `site_config.json` |

---

## 6. Stop the Adminer Server

When you are done using Adminer, stop the background server process by running:

```zsh
adminer-stop
```
