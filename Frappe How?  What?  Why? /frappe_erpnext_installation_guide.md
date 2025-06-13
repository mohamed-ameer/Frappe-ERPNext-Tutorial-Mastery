# Frappe Installation Guide

## 1. **Update and Upgrade Packages**
```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

## 2. Reboot Server
```bash
reboot
```

## 3. **Install GIT**
```bash
sudo apt-get install git
```

## 4. **Install Python**
```bash
sudo apt-get install python3-dev python3.10-dev python3-setuptools python3-pip python3-distutils
```

## 5. **Install Python Virtual Environment**
```bash
sudo apt-get install python3.10-venv
```

## 6. **Install Software Properties Common**
```bash
sudo apt-get install software-properties-common
```

## 7. **Install MariaDB**
```bash
sudo apt install mariadb-server mariadb-client
```

## 8. **Configure MySQL Server**
```bash
sudo mysql_secure_installation
```
you should see:
```
Enter current password for root: (Enter your root user password or leave empty if don't have one)
Switch to unix_socket authentication [Y/n]: Y
Change the root password? [Y/n]: Y
Remove anonymous users? [Y/n]: Y
Disallow root login remotely? [Y/n]: N
Remove test database and access to it? [Y/n]: Y
Reload privilege tables now? [Y/n]: Y
```

## 9. **Edit MySQL default config file**
```bash
sudo nano /etc/mysql/my.cnf
```

Add the following block of code at the end of the file exactly as it is:

```bash
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```

## 10. **Restart MySQL Server**
```bash
sudo service mysql restart
```

## 11. **Install Redis Server**
```bash
sudo apt-get install redis-server
```

## 12. **Install Other Packages**
```bash
sudo apt-get install xvfb libfontconfig wkhtmltopdf
sudo apt-get install libmysqlclient-dev
```

## 13. **Install curl**
```bash
sudo apt install curl
```

## 14. **Install Node.js**
```bash
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install 18
```

## 15. **Install NPM**
```bash
sudo apt-get install npm
```

## 16. **Install Yarn**
```bash
sudo npm install -g yarn
```

## 17. **Install Frappe Bench**
```bash
sudo pip3 install frappe-bench
```

## 18. **Initialize Frappe Bench**
```bash
bench init --frappe-branch [version-branch] [bench-folder]
```
> Ensure you have replaced [version-branch] with your desired Frappe version branch name and [bench-folder] with your desired folder name. e.g. bench init --frappe-branch version-15 frappe-bench
## 19. **Switch to the Frappe Bench Folder**
```bash
cd /home/[frappe-user]/[bench-folder]
```

## 20. **Create a New Site**
```bash
bench new-site [site-name]
```

## 21. **Enable Scheduler for The New Site**
```bash
bench --site [site-name] enable-scheduler
```

## 22. **Disable Maintenance Mode for The New Site**
```bash
bench --site [site-name] set-maintenance-mode off
```

## 23. **Enable Server Scripts**
```bash
bench --site [site-name] set-config server_script_enabled true
```

## 24. **Enable Developer Mode**
```bash
bench set-config -g developer_mode true
```
> Perform this step only on the machine where you want to enable DocTypes editing

## 25. **Setting Up The Site**
### 1. Local Development Server
#### 1. Remove Default Site
```bash
rm sites/currentsite.txt
```

#### 2. Add The Site to the Hosts
```bash
bench --site [site-name] add-to-hosts
```

## 26. **Start Server**
```bash
bench start
```
> If there are no other instances of Frappe running on your server or machine, it will automatically start on port 8000. To access the site, you can visit either [Your Server IP Address:8000] for a live server or [site-name:8000] for a local development server.