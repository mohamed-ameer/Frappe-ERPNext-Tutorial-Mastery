# Step-by-step Frappe Dev Setup with Docker

## Overview

This setup gives you everything you need to start building apps with **Frappe** immediately —  
without the pain of installing and configuring Python, Node, Redis, and MariaDB on your computer.  

Using **Docker**, you get:  

- **Start fast** – just clone, open, and code. No messy dependencies.  
- **Safe & clean** – your computer stays untouched.  
- **Same setup for everyone** – no more “works on my machine” problems.  
- **Easy reset** – if something breaks, reset in one command.  
- **Team-friendly** – your teammates use the exact same environment.  

👉 Think of this as a **fast road for developers**:  
you skip the boring setup and jump straight into building apps, testing ideas, and shipping features.  



## Quick Start Summary

## Prerequisites
- Docker Desktop installed and running https://docs.docker.com/desktop/setup/install/windows-install/
- Visual Studio Code with Remote Containers extension https://code.visualstudio.com/docs/remote/remote-overview
- Git installed https://git-scm.com/install/windows

## Setup Steps

### **Step 1: Clone and Setup**
```bash
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker
cp -R devcontainer-example .devcontainer
cp -R development/vscode-example development/.vscode
code .
```

### **Step 2: Install VS Code Extension**
- Press `Ctrl+Shift+X`
- Install: `ms-vscode-remote.remote-containers`

### **Step 3: Open in Container**
- Press `Ctrl+Shift+P`
- Select: `Dev Containers: Reopen in Container`
- Wait for container to build (5-10 minutes first time)

### **Step 4: Initialize Frappe Bench**
```bash
bench init --skip-redis-config-generation frappe-bench
cd frappe-bench
```

### **Step 5: Configure Database & Redis**
```bash
bench set-config -g db_host mariadb
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6379
bench set-config -g redis_socketio redis://redis-queue:6379
```

### **Step 6: Create Your Site**
```bash
bench new-site --db-root-password 123 --admin-password admin --mariadb-user-host-login-scope=% your_site_name.localhost
```

### **Step 7: Start Development Server**
```bash
bench start
```

### **Step 8: Access Your Site**
- Open browser: `http://development.localhost:8000`
- Login with admin/admin

---

## Daily Workflow

### **Starting Development Session:**
1. Open VS Code
2. Navigate to `frappe_docker` folder
3. Press `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`
4. Wait for container to start
5. Open terminal and run `bench start`

### **Stopping Development Session:**
1. Press `Ctrl+Shift+P` → `Dev Containers: Reopen Folder Locally`
2. This closes the container and returns you to your local system

---

## Detailed Setup Process

## Prerequisites

Before starting, ensure you have:
- **Docker Desktop** installed and running
- **Visual Studio Code** with Remote Containers extension
- **Git** for cloning repositories
- **Basic knowledge** of Frappe framework

### Step 1: Clone and Setup Frappe Docker

```bash
# Clone the frappe_docker repository
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker

# Copy development container configuration
cp -R devcontainer-example .devcontainer
cp -R development/vscode-example development/.vscode

# Open in Visual Studio Code
code .
```

### Step 2: Install Required Extensions

1. Press `Ctrl+Shift+X` to open Extensions
2. Search for and install: `ms-vscode-remote.remote-containers`
3. Wait for installation to complete

### Step 3: Open in Container

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type and select: `Dev Containers: Reopen in Container`
3. Wait for container to build and start (first time may take 5-10 minutes)

### Step 1,2,3 (as a one step): Container Environment Setup

#### Why This Step?
The development container provides a pre-configured environment with all necessary tools and dependencies for Frappe development.

#### What Happens?
- Docker builds a container with Python, Node.js, MariaDB, Redis, and other dependencies
- VS Code connects to the container, giving you a full development environment
- All your code runs inside the container, isolated from your host system

### Step 4: Initialize Frappe Bench

Once inside the container, open the terminal and run:

```bash
# Initialize a new Frappe bench (skip Redis config as it's handled by Docker)
bench init --skip-redis-config-generation frappe-bench

# Navigate to the bench directory
cd frappe-bench
```

#### Why `--skip-redis-config-generation`?
Docker handles Redis configuration automatically, so we skip the default Redis setup to avoid conflicts.

### Step 5: Configure Database and Redis Connections

```bash
# Configure database connection to use Docker MariaDB
bench set-config -g db_host mariadb

# Configure Redis connections for different purposes
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6379
bench set-config -g redis_socketio redis://redis-queue:6379
```

#### What Each Configuration Does:
- **`db_host mariadb`**: Points to the MariaDB container
- **`redis_cache`**: Used for caching data
- **`redis_queue`**: Used for background job processing
- **`redis_socketio`**: Used for real-time communication

#### Verify Configuration:
```bash
# Check if configuration is correct
cat frappe-bench/sites/common_site_config.json
```

Expected output should show:
```json
{
    "db_host": "mariadb",
    "redis_cache": "redis://redis-cache:6379",
    "redis_queue": "redis://redis-queue:6379",
    "redis_socketio": "redis://redis-queue:6379"
}
```

### Step 6: Create Your First Site

```bash
# Create a new site (replace 'your_site_name' with your preferred name)
bench new-site --db-root-password 123 --admin-password admin --mariadb-user-host-login-scope=% your_site_name.localhost
```

#### Parameters Explained:
- **`--db-root-password 123`**: MariaDB root password (Docker default)
- **`--admin-password admin`**: Frappe admin user password
- **`--mariadb-user-host-login-scope=%`**: Allows connections from any host
- **`your_site_name.localhost`**: Your site name (use `.localhost` for local development)

### Step 7: Start Development Server

```bash
# Start the Frappe development server
bench start
```

#### What Happens:
- Frappe starts the web server
- All services (MariaDB, Redis) are automatically started
- Your site becomes accessible at `http://development.localhost:8000`

## Development Workflow

> we will use `Dev Containers` which is a VS Code extension that allows you to develop in a container.
>
> watch the following video to understand how it works: [Dockerized DEV Environment with DevContainers | Multiple Containers | VSCode](https://www.youtube.com/watch?v=xfeQ6vDuidA)

### Daily Development Routine

#### Starting Your Development Session:
1. Open VS Code
2. Navigate to your `frappe_docker` folder
3. Press `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`
4. Wait for container to start
5. Open terminal and run `bench start`

#### Stopping Your Development Session:
1. Press `Ctrl+Shift+P` → `Dev Containers: Reopen Folder Locally`
2. This closes the container and returns you to your local system

### Working with Multiple Sites

```bash
# Create additional sites
bench new-site --db-root-password 123 --admin-password admin --mariadb-user-host-login-scope=% site2.localhost

# List all sites
bench list-sites

# Switch between sites
bench use site1.localhost
bench use site2.localhost
```

### Installing Apps

```bash
# Install ERPNext
bench get-app erpnext
bench --site your_site_name.localhost install-app erpnext

# Install custom apps
bench get-app https://github.com/your-username/your-app.git
bench --site your_site_name.localhost install-app your_app
```

---

### Errors may happen if you switch from frappe v16 to v15

<details>
  <summary><h4>❌ NameError: name 'null' is not defined</h4></summary>

**Cause:**  
This usually happens due to cached assets or browser issues after switching branches.  

**Solutions:**  
- Run: `bench clear-cache`  
- Or try accessing with a different browser  

🔗 [Reference](https://discuss.frappe.io/t/server-error-at-the-front-of-any-page/120135)  
</details>

<details><summary><h4>❌ bench stop / bench start fails: Missing module (e.g., "Cannot find module 'superagent'")</h4></summary>

**Cause:**  
Node.js dependencies are missing after switching branches.  

**Solution:**  
Re-install required packages:  
```bash
bench setup requirements
```

🔗 [Reference](https://discuss.frappe.io/t/bench-start-with-serveral-errors/40904/13?u=mohamed-ameer)

</details>

<details>
  <summary><h4>❌ ValueError: id must not contain ":"</h4></summary>

**Cause:**
Older Frappe version had a bug in job ID generation (create_job_id in frappe/utils/backgroundjobs.py).

**Solution:**

Best fix: Update to the latest Frappe version.

Manual fix: Update the function to replace : with |:

```python
def create_job_id(job_id: str | None = None) -> str:
	"""
	Generate unique job id for deduplication
	"""
	if not job_id:
		job_id = str(uuid4())
	else:
		job_id = job_id.replace(":", "|")
	return f"{frappe.local.site}||{job_id}"
```

🔗 [Reference](https://discuss.frappe.io/t/migrate-command-error-in/145017/2?u=mohamed-ameer)

</details>

---

#### For More Details => [Read the Official Documentaion](https://github.com/frappe/frappe_docker/blob/main/docs/development.md#bootstrap-containers-for-development)

#### There is a beutiful cli tool called `frappe-manager` that can help you with the above steps automatically and it will be good to try it and have a look at it, you can find it [here](https://github.com/rtCamp/Frappe-Manager) Give it a try.

#### Want to learn Docker Deeply? => [Watch this Docker Course](https://learndocker.online/courses/)