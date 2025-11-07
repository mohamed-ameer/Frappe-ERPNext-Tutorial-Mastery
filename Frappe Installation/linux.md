# Step-by-step Frappe dev setup for **Linux**

> 🚨 **Important:** Make sure to install the exact version of `python`, `node`, `mariadb`, and `frappe-bench` that your team uses to prevent any future conflicts or overlaps.

#### 1. **Update and Upgrade Packages**

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

#### 2. **Reboot Server (Optional)**

```bash
reboot
```

#### 3. **Create a New User with Sudo Privileges (Optional)**

```
sudo adduser [frappe-user]
usermod -aG sudo [frappe-user]
su [frappe-user]
cd /home/[frappe-user]
```

> Ensure you have replaced **[frappe-user]** with your username. e.g. sudo adduser frappe

#### 4. **Install GIT**

```bash
sudo apt-get install git
```

#### 5. **Install Python**

```bash
sudo apt-get install python3-dev python3.10-dev python3-setuptools python3-pip python3-distutils
```

#### 6. **Install Python Virtual Environment**

```bash
sudo apt-get install python3.10-venv
```

#### 7. **Install Software Properties Common**

```bash
sudo apt-get install software-properties-common
```

#### 8. **Install MariaDB**

```bash
sudo apt install mariadb-server mariadb-client
```

#### 9. **Configure MySQL Server**

```bash
sudo mysql_secure_installation
```
> Follow these prompts:
> * Enter current password for root: (Enter your root user password or leave empty if don't have one)
> * Switch to unix_socket authentication [Y/n]: Y
> * Change the root password? [Y/n]: Y
> * Remove anonymous users? [Y/n]: Y
> * Disallow root login remotely? [Y/n]: N
> * Remove test database and access to it? [Y/n]: Y
> * Reload privilege tables now? [Y/n]: Y

#### 10. **Edit MySQL default config file**

```bash
sudo nano /etc/mysql/my.cnf
```

Add the following block at the end of the file:

```bash
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```

#### 11. **Restart MySQL Server**

   ```bash
   sudo service mysql restart
   ```

#### 12. **Install Redis Server**

   ```bash
   sudo apt-get install redis-server
   ```

#### 13. **Install Other Packages**

   ```bash
   sudo apt-get install xvfb libfontconfig wkhtmltopdf
   sudo apt-get install libmysqlclient-dev
   ```

#### 14. **Install curl**

   ```bash
   sudo apt install curl
   ```

#### 15. **Install Node.js**

   ```bash
   curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
   source ~/.profile
   nvm install 18
   ```

#### 16. **Install NPM**

   ```bash
   sudo apt-get install npm
   ```

#### 17. **Install Yarn**

   ```bash
   sudo npm install -g yarn
   ```

#### 18. **Install Frappe Bench**

   ```bash
   sudo pip3 install frappe-bench
   ```

   >**If you face problem then use pipx instead of pip3:**

   **pipx** lets you install and run Python applications in isolated environments. This is the recommended way to install PyPI packages that represent command-line applications.

   To install pipx, run:
   ```bash
   sudo apt install pipx
   ```
   pipx needs `~/.local/bin/` to be in your PATH. You can automatically modify your shell configuration (such as `~/.bashrc`) to modify PATH appropriately by running:
   ```bash
   pipx ensurepath
   ```
   (You may need to close your terminal application and open it again (or run `source ~/.bashrc`) for the changes to take effect.)

   **Install Frappe Bench using `pipx`:**

   ```bash
   pipx install frappe-bench
   ```

#### 19. **Initialize Frappe Bench**

   ```bash
   bench init --frappe-branch [version-branch] [bench-folder]
   ```
>*Ensure you have replaced **[version-branch]** with your desired Frappe version branch name and **[bench-folder]** with your desired folder name. e.g. `bench init --frappe-branch version-15 frappe-bench`*

#### 20. **Switch to the Frappe Bench Folder**

   ```bash
   cd /home/[frappe-user]/[bench-folder]
   ```

#### 21. **Create a New Site**

   ```bash
   bench new-site [site-name]
   ```

#### 22. **Enable Scheduler for The New Site**

   ```bash
   bench --site [site-name] enable-scheduler
   ```

#### 23. **Disable Maintenance Mode for The New Site**

   ```bash
   bench --site [site-name] set-maintenance-mode off
   ```

#### 24. **Enable Server Scripts**

   ```bash
   bench --site [site-name] set-config server_script_enabled true
   ```

#### 25. **Enable Developer Mode**

   ```bash
   bench set-config -g developer_mode true
   ```

#### 26. **Setting Up The Site**

   1. **Local Development Server**

      1. Remove Default Site

         ```bash
         rm sites/currentsite.txt
         ```
      2. Add The Site to Hosts

         ```bash
         bench --site [site-name] add-to-hosts
         ```

#### 27. **Start Server**

   ```bash
   bench start
   ```
> If there are no other instances of Frappe running on your server or machine, it will automatically start on port 8000.
> To access the site, visit either `[Your Server IP Address:8000]` for a live server or `[site-name:8000]` for a local development server.