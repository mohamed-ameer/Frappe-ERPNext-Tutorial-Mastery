# Installing & Managing RabbitMQ on macOS (Intel)

This guide is for setting up and managing **RabbitMQ** on an Intel-based Mac.

RabbitMQ is a popular **message broker**—software that enables different applications or services to communicate with each other by sending and receiving messages asynchronously.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Installation Guide](#step-by-step-installation-guide)
3. [Accessing the Management Web Dashboard](#accessing-the-management-web-dashboard)
4. [Essential RabbitMQ CLI Cheat Sheet](#essential-rabbitmq-cli-cheat-sheet)
5. [Understanding Core Executables: rabbitmq vs rabbitmqctl vs rabbitmq-plugins](#understanding-core-executables-rabbitmq-vs-rabbitmqctl-vs-rabbitmq-plugins)
6. [Common Troubleshooting & Tips](#common-troubleshooting--tips)

## Prerequisites

Before starting, make sure you have **Homebrew** installed. Homebrew is the standard package manager for macOS that allows you to install developer tools easily from the terminal.

*To check if Homebrew is installed, open your Terminal and run:*

```
brew --version
```

*If not installed, visit [brew.sh](https://brew.sh) and follow the installation instructions.*

## Step-by-Step Installation Guide

### Step 1: Update Homebrew

```
brew update
```

* Homebrew maintains a local index of available software versions ("formulae"). Running `brew update` ensures your system downloads the latest list, guaranteeing you install the newest stable version of RabbitMQ and its dependencies (such as Erlang).

### Step 2: Install RabbitMQ

```
brew install rabbitmq
```

* This command downloads and installs the RabbitMQ package along with Erlang (the programming language RabbitMQ is built on).

### Step 3: Verify Installation Path & Information

```
brew info rabbitmq
```

* This displays details about where Homebrew installed RabbitMQ on your computer, which scripts were placed where, and important instructions regarding PATH configuration.

> 💡 **Intel vs. Apple Silicon (M1/M2/M3) Path Differences:**
>
> * **Intel Macs (Default):** `/usr/local/opt/rabbitmq/sbin`
> * **Apple Silicon Macs:** `/opt/homebrew/opt/rabbitmq/sbin`

### Step 4: Add RabbitMQ Binaries to Your PATH

```
nano ~/.zshrc
```

Add the following line at the end of the file:

```
export PATH=$PATH:/usr/local/opt/rabbitmq/sbin
```

*(Save and exit in `nano`: Press `Ctrl + O`, then `Enter` to save, and `Ctrl + X` to exit.)*

* By default, your macOS command line doesn't know where the `rabbitmqctl` or `rabbitmq-plugins` commands are stored. Updating your PATH in `~/.zshrc` tells your terminal where to look for RabbitMQ executables so you can run them from anywhere.

### Step 5: Reload Your Terminal Configuration

```
source ~/.zshrc
```

* Editing `~/.zshrc` saves the file, but doesn't instantly apply changes to your active terminal session. Running `source` reloads the configuration immediately without requiring you to restart Terminal.

### Step 6: Start RabbitMQ as a Background Service

```
brew services start rabbitmq
```

* This starts the RabbitMQ server as a background service (daemon). It also ensures RabbitMQ automatically restarts whenever you reboot your Mac.

### Step 7: Enable the Management Plugin

```
rabbitmq-plugins enable rabbitmq_management
```

* RabbitMQ comes with a built-in web-based user interface (UI) to view queues, connections, channels, and exchanges visually. This command activates that web plugin.

### Step 8: Enable Feature Flags

```
rabbitmqctl enable_feature_flag all
```

* Feature flags enable experimental or newer functionality in modern RabbitMQ releases. Enabling `all` turns on all stable feature flags supported by your current version, preventing version-compatibility warnings.

## Accessing the Management Web Dashboard

Once all steps are complete, open your web browser and navigate to:

```
http://localhost:15672/
```

### Default Credentials:

* **Username:** `guest`
* **Password:** `guest`

> **Note:** The default `guest` account can only connect via `localhost` for security reasons.

## Essential RabbitMQ CLI Cheat Sheet

Here are the most common commands developers use daily:

### 1. Managing the Service (Homebrew)

| Command | Description | 
| ----- | ----- | 
| `brew services start rabbitmq` | Start RabbitMQ in the background. | 
| `brew services stop rabbitmq` | Stop the RabbitMQ service. | 
| `brew services restart rabbitmq` | Restart the service (useful after config changes). | 
| `brew services list` | Check running state of all Homebrew services. | 

### 2. Monitoring & Server Status

| Command | Description | 
| ----- | ----- | 
| `rabbitmqctl status` | View detailed server diagnostics (version, memory usage, uptime). | 
| `rabbitmqctl cluster_status` | Display cluster details and node state. | 

### 3. Managing Queues, Exchanges, and Connections

| Command | Description | 
| ----- | ----- | 
| `rabbitmqctl list_queues` | List all queues and message counts. | 
| `rabbitmqctl list_queues name messages consumers` | Detailed queue analysis showing pending messages and connected consumers. | 
| `rabbitmqctl list_exchanges` | List all available message exchanges. | 
| `rabbitmqctl list_bindings` | List bindings between exchanges and queues. | 
| `rabbitmqctl list_connections` | View current open TCP connections. | 
| `rabbitmqctl list_channels` | View active communication channels. | 
| `rabbitmqctl purge_queue <queue_name>` | Delete all messages inside a specific queue without deleting the queue. | 
| `rabbitmqctl delete_queue <queue_name>` | Delete a queue entirely. | 

### 4. User & Permission Management

| Command | Description | 
| ----- | ----- | 
| `rabbitmqctl list_users` | List all registered administrative and application users. | 
| `rabbitmqctl add_user <username> <password>` | Create a new user account. | 
| `rabbitmqctl set_user_tags <username> administrator` | Grant administrator privileges to a user. | 
| `rabbitmqctl set_permissions -p / <username> ".*" ".*" ".*"` | Grant full read, write, and configure permissions on the default vhost (`/`). | 
| `rabbitmqctl change_password <username> <newpassword>` | Update password for an existing user. | 

### 5. Plugin Management

| Command | Description | 
| ----- | ----- | 
| `rabbitmq-plugins list` | List all installed plugins and their active states. | 
| `rabbitmq-plugins enable <plugin_name>` | Enable a specific plugin. | 
| `rabbitmq-plugins disable <plugin_name>` | Disable a specific plugin. | 

## Understanding Core Executables: `rabbitmq`, `rabbitmqctl`, vs `rabbitmq-plugins`

It's common for beginners to confuse these three commands. Here is a breakdown of what each tool does and when to use it:

```
+-------------------------------------------------------------------+
|                        RABBITMQ ECOSYSTEM                         |
|                                                                   |
|  +-------------------+  +-------------------+  +----------------+ |
|  |  rabbitmq-server  |  |    rabbitmqctl    |  |rabbitmq-plugins| |
|  |    (The Engine)   |  | (The Remote Control) | (The Extension | |
|  |                   |  |                   |  |    Manager)    | |
|  +-------------------+  +-------------------+  +----------------+ |
+-------------------------------------------------------------------+
```

### 1. `rabbitmq` / `rabbitmq-server` (The Engine / Service)
* **What it is:** The actual RabbitMQ message broker service process running in the background.
* **Role:** It handles network communication, routes messages between producers and consumers, manages queue storage in memory/disk, and processes messaging logic.
* **When to use:** You rarely run `rabbitmq-server` directly when using Homebrew; instead, Homebrew manages it via `brew services start rabbitmq`.

### 2. `rabbitmqctl` (The Remote Control / Admin Tool)
* **What it is:** `ctl` stands for **Control**. It is a command-line interface (CLI) administration tool.
* **Role:** It interacts with a running RabbitMQ server node to inspect runtime statistics, manage users, set permissions, delete queues, or view active connections.
* **When to use:** Use `rabbitmqctl` whenever you need to check broker status, debug messaging issues, or modify user permissions while the server is running.

### 3. `rabbitmq-plugins` (The Extension Manager)
* **What it is:** A specialized configuration tool used specifically to extend or modify RabbitMQ's functionality.
* **Role:** It enables, disables, and lists add-ons (plugins) available to the broker—such as the Web Management Dashboard, MQTT protocol support, STOMP protocol support, or Prometheus monitoring.
* **When to use:** Use `rabbitmq-plugins` when you need to enable built-in optional modules like `rabbitmq_management`.

---

### Quick Comparison Summary

| Tool | Primary Purpose | Analogy | Key Command Example |
| :--- | :--- | :--- | :--- |
| **`rabbitmq` (`rabbitmq-server`)** | Runs the message broker background engine | The Car Engine | `brew services start rabbitmq` |
| **`rabbitmqctl`** | Manages runtime operations, queues, & users | The Dashboard / Steering Wheel | `rabbitmqctl list_queues` |
| **`rabbitmq-plugins`** | Enables or disables optional features/plugins | Installing Upgrades or Accessories | `rabbitmq-plugins enable rabbitmq_management` |

## Common Troubleshooting & Tips

* **Command not found error (`rabbitmqctl: command not found`):**
  Ensure you ran `source ~/.zshrc` and that the PATH line in `~/.zshrc` correctly matches your CPU architecture (`/usr/local/opt/rabbitmq/sbin` for Intel).

* **Cannot log in to Management UI:**
  Verify the service is running using `brew services list` and ensure the management plugin is enabled.