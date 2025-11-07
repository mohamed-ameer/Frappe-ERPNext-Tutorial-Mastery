# Step-by-step Frappe Dev Setup for **Intel Mac**

> 🚨 Make sure to install the exact version of `python`, `node`, `mariadb`, and `frappe-bench` that your team uses to prevent conflicts.

Before you start: open Terminal. This guide assumes `zsh` (default on recent macOS). Run one section at a time and watch the output.

### 1. **Install Xcode & Homebrew (if not already)**

```bash
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After install, follow the brew post-install message about adding brew to PATH. On Intel it'll be under `/usr/local`.

### 2. **Install essential native packages**
*(Intel paths shown below — if Apple Silicon replace `/usr/local` with `/opt/homebrew`)*

```bash
# core tools
brew update
brew install git
brew install python@3.11 pyenv        # optional: use pyenv to manage python versions
brew install node@18                   # required by many frontend builds
brew install yarn                      # or `npm i -g yarn`
brew install redis@6.2
brew install mariadb@10.6              # (preferred for Frappe v15)
brew install mysql-client               # optional if you need client libs only
brew install mariadb-connector-c
brew install pkg-config
brew install swig
brew install fontconfig
```

### 3. **PATH / env vars (Intel example)**

```bash
# add pipx bin location
export PATH="$HOME/.local/bin:$PATH"

# Brew + mysql-client/mariadb on Intel
export PATH="/usr/local/opt/python@3.11/bin:$PATH"
export PATH="/usr/local/opt/mysql-client/bin:$PATH"
export PKG_CONFIG_PATH="/usr/local/opt/mysql-client/lib/pkgconfig:$PKG_CONFIG_PATH"

# if using mariadb@10.6
export PATH="/usr/local/opt/mariadb@10.6/bin:$PATH"
export PKG_CONFIG_PATH="/usr/local/opt/mariadb@10.6/lib/pkgconfig:$PKG_CONFIG_PATH"

# swig flags
export SWIG_FEATURES="-cpperraswarn"
```

Then run:

```bash
source ~/.zshrc
```

### 4. **Install pipx and bench CLI with Python 3.11**

(ensure `Python 3.11` exists — if not installed, `brew install python@3.11` or use pyenv)
```bash
python3.11 -m pip install --upgrade pip
python3.11 -m pip install --user pipx
python3.11 -m pipx ensurepath
# restart terminal or `source ~/.zshrc`

# Install bench and honcho with explicit Python
pipx install frappe-bench --python python3.11
pipx install honcho --python python3.11
pip install --upgrade pip setuptools wheel
```

Confirm `bench` is installed:

```bash
which bench
bench --version
```

### 5. **Install Node via nvm (optional)**

```bash
# install nvm (or use brew-installed node)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
source ~/.zshrc
nvm install 18
nvm use 18
npm i -g yarn
```

### 6. **Install wkhtmltopdf (official mac pkg — required for PDFs)**

```bash
# download (use Safari if this fails)
curl -L --http1.1 -O "https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-2/wkhtmltox-0.12.6-2.macos-cocoa.pkg"
# make sure if it completely installed (like pkg is 48 MB but you see 40 MB only)
ls -lh wkhtmltox-0.12.6-2.macos-cocoa.pkg
# if fail to complete the use -C to resume:
curl -L --http1.1 -C - -O "https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-2/wkhtmltox-0.12.6-2.macos-cocoa.pkg"

# after file finishes:
sudo installer -pkg wkhtmltox-0.12.6-2.macos-cocoa.pkg -target /

# verify
which wkhtmltopdf
wkhtmltopdf --version
```
>If macOS blocks on "unidentified developer": System Settings → Privacy & Security → Open Anyway for that pkg.

### 7. **Start services (Redis, MariaDB)**

```bash
brew services start redis@6.2
brew services start mariadb@10.6
# For mysql-client only you may not start mariadb, but Frappe needs a DB running.
```

### 8. **Secure MariaDB (optional)**

```bash
sudo /usr/local/opt/mariadb@10.6/bin/mysqladmin -u root password $NEW_PASSWORD
```

or

```bash
sudo mysql_secure_installation
```

>Follow these prompts:
>
>* Enter current password for root: (Enter your root user password or leave >empty if none)
>* Switch to unix_socket authentication [Y/n]: Y
>* Change the root password? [Y/n]: Y
>* Remove anonymous users? [Y/n]: Y
>* Disallow root login remotely? [Y/n]: N
>* Remove test database and access to it? [Y/n]: Y
>* Reload privilege tables now? [Y/n]: Y

### 9. **Edit MariaDB config file**

```bash
nano /usr/local/etc/my.cnf
```

Add the following block of code at the end of the file exactly as it is:

```ini
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
bind-address = 127.0.0.1

[mysql]
default-character-set = utf8mb4
```

### 10. **Restart MariaDB**

   ```bash
   brew services restart mariadb@10.6
   ```

### 11. **Initialize Frappe Bench**

   ```bash
   bench init --frappe-branch [version-branch] [bench-folder]
   ```
   > Ensure you have replaced **[version-branch]** with your desired Frappe version branch name and **[bench-folder]** with your desired folder name. e.g. `bench init --frappe-branch version-15 frappe-bench`

### 12. **Switch to the Bench Folder**

   ```bash
   cd /home/[frappe-user]/[bench-folder]
   ```

### 13. **Create a New Site**

   ```bash
   bench new-site [site-name]
   ```

### 14. **Enable Scheduler**

   ```bash
   bench --site [site-name] enable-scheduler
   ```

### 15. **Disable Maintenance Mode**

   ```bash
   bench --site [site-name] set-maintenance-mode off
   ```

### 16. **Enable Server Scripts**

   ```bash
   bench --site [site-name] set-config server_script_enabled true
   ```

### 17. **Enable Developer Mode**

   ```bash
   bench set-config -g developer_mode true
   ```

### 18. **Local Development Setup**

   1. Remove Default Site

      ```bash
      rm sites/currentsite.txt
      ```
   2. Add Site to Hosts

      ```bash
      bench --site [site-name] add-to-hosts
      ```

### 19. **Start Server**

   ```bash
   bench start
   ```

### 20. **Adminer for GUI DB Management**

#### **Step 1: Download Docker Desktop**

1. Go to [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/)
2. Click "Download for Mac"
3. Choose the correct chip version:
   - **Apple Silicon** (M1/M2/M3 Macs) - Download Apple Chip version
   - **Intel Macs** - Download Intel Chip version

#### **Step 2: Install Docker Desktop**

1. Double-click the downloaded `.dmg` file
2. Drag the Docker icon to the Applications folder
3. Open Docker from your Applications folder
4. Follow the installation prompts (may require your password)

#### **Step 3: Start Docker**

1. Open Docker from Applications or Spotlight Search
2. Wait for initialization (can take a few minutes first time)
3. You'll see the Docker whale icon in your menu bar when it's running

#### **Step 4: Run Adminer with host gateway (to connect with your local mariadb service)**

```
docker run -p 8080:8080 --add-host=host.docker.internal:host-gateway adminer
```

#### **Step 5: Connect in Adminer**

Open `http://localhost:8080` and use these settings:

**For MySQL on your Mac:**

- **System**: MySQL
- **Server**: `host.docker.internal`
- **Username**: Your MySQL username (often `root`)
- **Password**: Your MySQL password
- **Database**: (optional)

**Then:**

docker ps

`docker container start <container-id>`

`docker container stop <container-id>`