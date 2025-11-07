# Step-by-step Frappe Dev Setup for Windows

In this guide, we’ll walk you through how to install **Frappe Bench** and set up a **Frappe development environment** on **Windows OS** using **WSL (Windows Subsystem for Linux)**. Frappe doesn’t run natively on Windows because its CLI tool, **Bench**, is built for Unix-like systems (Linux and macOS). Bench is the command-line tool that manages Frappe apps, sites, and development workflows—it’s the core that powers the Frappe environment. To make it work on Windows, we’ll use WSL to provide a Linux shell inside Windows, allowing us to run Frappe Bench commands smoothly.

## Step 1: Enable WSL & Install Ubuntu on Windows

### 1. Open **Windows PowerShell as Administrator** and run:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
```
>*both commands are required to fully enable WSL 2. The first one (`Microsoft-Windows-Subsystem-Linux`) installs the core system that allows Windows to run Linux commands, and the second one (`VirtualMachinePlatform`) enables the virtualization layer that WSL 2 depends on. Run both, then restart your computer to complete setup.*

Or run:

```bash
wsl --install
```
>*The `wsl --install` command is the simplest and recommended way to set up the Windows Subsystem for Linux (WSL). It automatically enables all required Windows features, installs the latest WSL 2 kernel, and downloads a default Linux distribution (such as Ubuntu) for you. This single command replaces the need to manually enable components like `Microsoft-Windows-Subsystem-Linux` and `VirtualMachinePlatform`, making the installation process faster, easier, and ready to use immediately after a system restart.*

### 2. Fix `HCS_E_HYPERV_NOT_INSTALLED` error:

```powershell
bcdedit /enum | findstr -i hypervisorlaunchtype
bcdedit /set hypervisorlaunchtype auto
```
>*The first command checks if `hypervisorlaunchtype` is enabled.*
>
>*The second one sets it to auto, ensuring the `Hyper-V` service starts on system boot (required for WSL2 to create Linux VMs properly).*

Restart your computer afterwards.

### 3. Install and set up Ubuntu:

```bash
wsl --list --online
wsl --install -d Ubuntu-24.04
```
>*You’ll be prompted to create a username and password for your new Linux environment. Use any credentials you prefer.*

Useful WSL commands:

```bash
wsl --list --online        # List available Linux distributions
wsl --list --verbose       # List installed distributions with details
wsl --set-default <name>   # Set a default distribution
wsl --status               # View the default distro and WSL version
wsl -d <name>              # Switch to a specific distribution
```

| ERPNext Version | Ubuntu Recommended | Python Version | Node.js Version |
| --------------- | ------------------ | -------------- | --------------- |
| **v13.x**       | 20.04 (Focal)      | 3.8            | 14 or 16        |
| **v14.x**       | 22.04 (Jammy)      | 3.10           | 16 or 18        |
| **v15.x+**      | 24.04 (Noble)      | 3.12           | 18 or 20        |

### 4. Open Ubuntu via PowerShell or Start Menu:

```bash
wsl -d Ubuntu-24.04
```

or

<img width="506" height="637" alt="image" src="https://github.com/user-attachments/assets/e78fab80-9340-4230-9b60-d06d2429481a" />

### 5. Enable Internet Access for WSL2:

If your WSL2 Linux can’t access the internet, create a .wslconfig file in 
your Windows home directory:

Open CMD and run:
```powershell
echo [wsl2]> %USERPROFILE%\.wslconfig
echo dnsTunneling=true>> %USERPROFILE%\.wslconfig
echo networkingMode=mirrored>> %USERPROFILE%\.wslconfig
```
This creates a `.wslconfig` file with the following content:
```
[wsl2]
dnsTunneling=true
networkingMode=mirrored
```
>*This configuration makes WSL2 share the same network and DNS as Windows, resolving most internet, VPN, and localhost access issues by replacing the older NAT setup with a mirrored network mode.*

**To verify the file contents:**
```powershell
type %USERPROFILE%\.wslconfig
```
**Apply the changes:**
```powershell
wsl --shutdown
```
**Then start WSL again:**
```powershell
wsl -d Ubuntu-24.04
```
> Check Ubuntu Version, run: lsb_release -a

🎉 Congratulations! You now have Ubuntu running with full network access on Windows — ready to install Frappe Bench and set up your development environment.
<img width="955" height="445" alt="image" src="https://github.com/user-attachments/assets/6e3c49ef-0915-4e29-b706-f1961d007655" />

---

## Step 2: Set Up the Frappe Bench Environment

> 🚨 Make sure to install the exact version of `python`, `node`, `mariadb`, and `frappe-bench` that your team uses to prevent conflicts.

### 1. Go to your Linux home directory:

```bash
cd ~
```

### 2. Update and upgrade packages:

```bash
sudo apt-get update -y
sudo apt-get upgrade -y
```

### 3. Reboot (optional):

```bash
reboot
```

### 4. Install GIT:

```bash
sudo apt-get install git
```

### 5. Install Python:

```bash
sudo apt-get install python3-dev python3.10-dev python3-setuptools python3-pip python3-distutils
```
>*if you face error like `Unable to locate package python3.10-dev` or `Couldn't find any package by glob 'python3.10-dev'` 
That means your Ubuntu repositories don’t have a package named python3.10-dev. To solve this problem run the following:*
```bash
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.10 python3.10-dev python3.10-distutils
sudo apt install python3-pip python3-setuptools
```
>*if you face error like `Package 'python3-distutils' has no installation candidate` because `distutils` has been deprecated in Python 3.12, the version Ubuntu 24.04 is using, see **PEP 632** for details.
As suggested in the [documentation](https://docs.python.org/3.10/library/distutils.html), you can use `setuptools` as an enhanced alternative.
The recommended pip installer runs all `setup.py` scripts with `setuptools`, even if the script itself only imports `distutils`.*

```bash
sudo apt install python3-pip
sudo apt install python3-setuptools
```

### 6. Install Python virtual environment:

```bash
sudo apt-get install python3.10-venv
```

### 7. Install Software Properties Common

```bash
sudo apt-get install software-properties-common
```

### 8. Install MariaDB:

```bash
sudo apt install mariadb-server mariadb-client
```

### 9. Configure MySQL:

```bash
sudo mysql_secure_installation
```
>Follow these prompts:
>* Enter current password for root: (Enter your root user password or leave >empty if none)
>* Switch to unix_socket authentication [Y/n]: Y
>* Change the root password? [Y/n]: Y
>* Remove anonymous users? [Y/n]: Y
>* Disallow root login remotely? [Y/n]: N
>* Remove test database and access to it? [Y/n]: Y
>* Reload privilege tables now? [Y/n]: Y

### 10. Edit MySQL config:

```bash
sudo nano /etc/mysql/my.cnf
```
Add the following block of code at the end of the file exactly as it is:
```ini
[mysqld]
character-set-client-handshake = FALSE
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

[mysql]
default-character-set = utf8mb4
```
press (Ctrl-X then Y then Press Enter) to exit

### 11. Restart MySQL Server:

```bash
sudo service mysql restart
```

### 12. Install Redis Server:

```bash
sudo apt-get install redis-server
```

### 13. Install other dependencies:

```bash
sudo apt-get install xvfb libfontconfig wkhtmltopdf
sudo apt-get install libmysqlclient-dev
```

### 14. Install curl:

```bash
sudo apt install curl
```

### 15. Install Node.js:

```bash
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install 18
```

### 16. Install npm:

```bash
sudo apt-get install npm
```

### 17. Install yarn:

```bash
sudo npm install -g yarn
```

### 18. Install pipx:
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
```bash
exit
wsl -d Ubuntu-24.04
```

### 19. Install Frappe Bench:

```bash
pipx install frappe-bench
```

### 20. Initialize Frappe Bench:

```bash
cd ~
bench init --frappe-branch [version-branch] [bench-folder]
```
>*Ensure you have replaced **[version-branch]** with your desired Frappe version branch name and **[bench-folder]** with your desired folder name. e.g. `bench init --frappe-branch version-15 frappe-bench`*

### 21. Set up WSL with VS Code:
1. **Install the “Remote – WSL” extension**
    
In VS Code → Extensions → search for `Remote - WSL` → Install.

or in CMD run:

```bash
code --install-extension ms-vscode-remote.remote-wsl
```
2. **Open your project in WSL**
    
In Ubuntu terminal: `wsl -d Ubuntu-24.04`
```bash
cd ~/frappe-bench   # or your project folder
code .
```
3. **Check bottom-left of VS Code**
    
Ensure the bottom left of VS Code shows `WSL: Ubuntu`. It should say:

```
WSL: Ubuntu
```

means you’re connected to Linux.

### 22. Create a new site:

```bash
bench new-site [site-name]
```
>Ensure you have replaced **[site-name]** with your desired site name

### 23. Enable scheduler:

```bash
bench --site [site-name] enable-scheduler
```

### 24. Disable maintenance mode:

```bash
bench --site [site-name] set-maintenance-mode off
```

### 25. Enable server scripts:

```bash
bench --site [site-name] set-config server_script_enabled true
```

### 26. Enable developer mode:

```bash
bench set-config -g developer_mode true
```
>Perform this step only on the machine where you want to enable DocTypes editing

### 27. Local server setup:

**Local Development Server**
1. Remove Default Site
   
   ```bash
   rm sites/currentsite.txt
   ```
   
2. Add The Site to the Hosts
   
   ```bash
   bench --site [site-name] add-to-hosts
   ```

### 28. Install a process manager:
`WSL` doesn’t support `systemctl` or `supervisor` by default, and no alternative process manager was installed.
`bench start`  may fail with `Exception: No process manager found` → meaning Frappe Bench couldn’t find a tool (like **honcho** or **foreman**) to run background processes (web, redis, workers, etc.)
```bash
pipx install honcho
pipx inject frappe-bench honcho
```

### 29. Start the server:

```bash
bench start
```
>*If there are no other instances of Frappe running on your server or machine, it will automatically start on port **8000**. To access the site, you can visit either **[Your Server IP Address:8000]** for a live server or **[site-name:8000]** for a local development server.
If port 8000 is already in use or you prefer another one, you can modify it in the Procfile (e.g web: `bench serve --port 8008`)*
---

### Reconnect VS Code with WSL
<details>
  <summary><h6>first make sure you did the step 21. at most once:</h6></summary>

1. **Install the `Remote – WSL` extension**

In VS Code → Extensions → search for `Remote - WSL` → Install.
or in CMD run:

```bash
code --install-extension ms-vscode-remote.remote-wsl
```

2. **Open your project in WSL**

In Ubuntu terminal: `wsl -d Ubuntu-24.04`

```bash
cd ~/frappe-bench   # or your project folder
code .
```
</details>

Then from now on you can directly connect with VSCode:

1. In Visual Studio Code (VS Code), press **Ctrl+Shift+P** to **open the Command Palette**
2. Search for “Connect to WSL using Distro”
3. Choose the Distro that you want to open (Ubuntu-24.04)
4. Open Folder (choose your frappe-bench)

---

### Find WSL distro files in Windows

1. Open *This PC*.
2. Look for the **Linux** directory in the sidebar — that’s your WSL filesystem.
<img width="1365" height="606" alt="image" src="https://github.com/user-attachments/assets/ddbd01ad-5885-4565-b195-c0ec50f96361" />
