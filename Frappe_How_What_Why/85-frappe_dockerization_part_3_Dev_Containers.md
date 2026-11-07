# Configuring Dev Containers for Frappe Projects

## Table of Contents
1. [Introduction to VS Code and Extensions](#introduction-to-vs-code-and-extensions)
2. [Understanding Dev Containers](#understanding-dev-containers)
3. [Why Use Dev Containers for Frappe?](#why-use-dev-containers-for-frappe)
4. [Prerequisites and Installation](#prerequisites-and-installation)
5. [Dev Container Configuration Files](#dev-container-configuration-files)
6. [devcontainer.json - Complete Reference](#devcontainerjson---complete-reference)
7. [Docker Compose Integration](#docker-compose-integration)
8. [Frappe-Specific Configuration](#frappe-specific-configuration)
9. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
10. [VS Code Settings and Extensions](#vs-code-settings-and-extensions)
11. [Port Forwarding](#port-forwarding)
12. [Volume Mounts and Workspace](#volume-mounts-and-workspace)
13. [Debugging Configuration](#debugging-configuration)
14. [Advanced Patterns](#advanced-patterns)
15. [Best Practices](#best-practices)
16. [Troubleshooting](#troubleshooting)

---

## Introduction to VS Code and Extensions

### What is VS Code?

Visual Studio Code (VS Code) is a free, open-source code editor developed by Microsoft. It's one of the most popular code editors used by developers worldwide.

**Key Features:**
- **Lightweight**: Fast and responsive
- **Extensible**: Thousands of extensions available
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Integrated Terminal**: Built-in terminal for running commands
- **Git Integration**: Built-in version control
- **IntelliSense**: Code completion and suggestions
- **Debugging**: Built-in debugger for multiple languages

**Why Developers Use VS Code:**
- Easy to use, even for beginners
- Powerful features for advanced users
- Large extension ecosystem
- Active community and support
- Free and open-source

### What are VS Code Extensions?

**Extensions** are add-ons that extend VS Code's functionality. Think of them as plugins or apps that add new features to your editor.

**How Extensions Work:**
- Installed from VS Code Marketplace
- Add new features, languages, themes, or tools
- Can be enabled/disabled as needed
- Some run locally, others connect to remote services

**Common Extension Categories:**
1. **Language Support**: Python, JavaScript, Go, etc.
2. **Themes**: Visual appearance customization
3. **Debuggers**: Debugging tools for specific languages
4. **Linters**: Code quality and style checkers
5. **Remote Development**: Connect to containers, SSH, WSL

**Example Extensions:**
- `ms-python.python` - Python language support
- `ms-vscode.live-server` - Live web server
- `mtxr.sqltools` - SQL database tools
- `ms-vscode-remote.remote-containers` - Dev Containers (our focus!)

**How to Install Extensions:**

**Method 1: Through VS Code UI**
1. Click the Extensions icon in the sidebar (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for the extension name
3. Click "Install"

**Method 2: Through Command Line**
```bash
code --install-extension ms-python.python
code --install-extension ms-vscode-remote.remote-containers
```

**Method 3: Through Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Extensions: Install Extensions"
3. Search and install

---

## Understanding Dev Containers

### What are Dev Containers?

**Dev Containers** (Development Containers) is a VS Code feature that allows you to use a Docker container as your development environment. Instead of installing tools and dependencies on your local machine, everything runs inside a container.

**Real-World Analogy:**

Think of Dev Containers like a portable workshop:
- **Your Computer**: The building
- **Dev Container**: A fully-equipped workshop room
- **VS Code**: Your access key to the workshop
- **Docker**: The system that creates and manages the workshop

When you enter the workshop (open Dev Container), you have:
- All tools pre-installed
- Correct versions of everything
- Isolated from your main computer
- Same environment as your teammates

### How Dev Containers Work

**The Flow:**

1. **You open a folder in VS Code** that has a `.devcontainer` directory
2. **VS Code detects** the dev container configuration
3. **VS Code asks** if you want to "Reopen in Container"
4. **Docker builds/start** the container (if needed)
5. **VS Code connects** to the container
6. **You code** as if everything is local, but it's actually in the container

**Visual Representation:**

```
┌─────────────────────────────────────────┐
│  Your Computer (Host)                   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  VS Code (Editor)                │  │
│  │  - UI runs here                  │  │
│  │  - Extensions run here           │  │
│  └──────────────┬───────────────────┘  │
│                 │                       │
│                 │ SSH/API Connection    │
│                 ▼                       │
│  ┌──────────────────────────────────┐  │
│  │  Docker Container                │  │
│  │  - Python, Node.js installed    │  │
│  │  - Your code mounted here       │  │
│  │  - Terminal runs here           │  │
│  │  - Debugger connects here       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Key Concepts:**

1. **Remote Development**: VS Code runs locally, but connects to container remotely
2. **File Sync**: Your code is mounted into the container (not copied)
3. **Extension Host**: Some extensions run in container, some locally
4. **Terminal**: Terminal commands execute inside the container
5. **Debugging**: Debugger connects to processes running in container

### Dev Containers vs Local Development

**Local Development (Traditional):**
```bash
# Install Python
sudo apt install python3.11

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 18.18.2

# Install Frappe dependencies
pip install frappe-bench
bench init frappe-bench

# Problems:
# - Different versions on different machines
# - Conflicts with other projects
# - "Works on my machine" issues
# - Hard to share environment
```

**Dev Containers (Modern):**
```yaml
# .devcontainer/devcontainer.json
{
  "image": "frappe/bench:latest"
  # Everything pre-installed!
}

# Benefits:
# - Same environment for everyone
# - No local installation needed
# - Isolated from host system
# - Easy to share and version control
```

**Comparison Table:**

| Aspect | Local Development | Dev Containers |
|--------|------------------|----------------|
| **Setup Time** | Hours (install everything) | Minutes (pull image) |
| **Consistency** | Varies by machine | Identical for all |
| **Isolation** | None (shared system) | Complete isolation |
| **Portability** | Hard to share | Easy (just config file) |
| **Cleanup** | Manual uninstall | Delete container |
| **Resource Usage** | Direct on host | Isolated in container |

---

## Why Use Dev Containers for Frappe?

### Problems Dev Containers Solve

**1. Environment Consistency**

**Problem**: Different developers have different setups
- Developer A: Python 3.9, Node 16
- Developer B: Python 3.11, Node 18
- Developer C: Python 3.10, Node 14

**Result**: "Works on my machine" bugs, inconsistent behavior

**Dev Container Solution**: Everyone uses the same container with identical versions

**2. Complex Setup Requirements**

Frappe requires:
- Python (specific version)
- Node.js (specific version)
- Bench CLI tool
- MariaDB/PostgreSQL
- Redis (2 instances)
- Various system libraries
- Git configuration

**Problem**: Installing all this manually is:
- Time-consuming (hours)
- Error-prone (miss a step)
- Hard to document
- Different on each OS

**Dev Container Solution**: One container with everything pre-configured

**3. System Pollution**

**Problem**: Installing Frappe dependencies locally:
- Conflicts with other projects
- Pollutes system Python/Node
- Hard to uninstall cleanly
- Version conflicts

**Dev Container Solution**: Everything isolated in container

**4. Onboarding New Developers**

**Problem**: New team member needs to:
- Read setup documentation
- Install 20+ dependencies
- Configure databases
- Set up environment variables
- Debug installation issues

**Time**: 1-2 days

**Dev Container Solution**: 
- Clone repository
- Open in VS Code
- Click "Reopen in Container"
- **Done in 10 minutes!**

### Benefits for Frappe Development

**1. Pre-configured Environment**
```yaml
# Container already has:
# - Python 3.11.6 (via pyenv)
# - Node.js 18.18.2 (via nvm)
# - Bench CLI installed
# - Git configured
# - All system dependencies
```

**2. Database Services Ready**
```yaml
# docker-compose.yml includes:
# - MariaDB container
# - Redis cache container
# - Redis queue container
# All connected and ready!
```

**3. Port Forwarding**
```json
// Ports automatically forwarded:
// - 8000: Frappe web server
// - 9000: Socket.IO
// - 6787: Redis
```

**4. Code Editing**
- Edit code on host (familiar tools)
- Changes reflect immediately in container
- Use VS Code features (IntelliSense, debugging)
- Git works normally

**5. Debugging**
- Set breakpoints in VS Code
- Debug Python code running in container
- Step through Frappe framework code
- Inspect variables

---

## Prerequisites and Installation

### Required Software

**1. Docker**

Dev Containers require Docker to be installed and running.

**Installation:**
- **Windows/Mac**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Install Docker Engine
  ```bash
  # Ubuntu/Debian
  sudo apt update
  sudo apt install docker.io
  sudo systemctl start docker
  sudo systemctl enable docker
  
  # Add user to docker group (to run without sudo)
  sudo usermod -aG docker $USER
  # Log out and back in for changes to take effect
  ```

**Verify Installation:**
```bash
docker --version
# Should show: Docker version 20.x.x or higher

docker ps
# Should show running containers (or empty list if none)
```

**2. Docker Compose**

Usually included with Docker Desktop. Verify:
```bash
docker compose version
# Should show: Docker Compose version v2.x.x
```

**3. VS Code**

Download from [code.visualstudio.com](https://code.visualstudio.com/)

**Verify Installation:**
```bash
code --version
# Should show VS Code version
```

### Installing Dev Containers Extension

**Method 1: Through VS Code Marketplace**

1. Open VS Code
2. Click Extensions icon (or press `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Dev Containers"
4. Find "Dev Containers" by Microsoft
5. Click "Install"

**Method 2: Through Command Line**

```bash
code --install-extension ms-vscode-remote.remote-containers
```

**Method 3: Through Command Palette**

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
2. Type "Extensions: Install Extensions"
3. Search "Dev Containers"
4. Install

**Verify Installation:**
- Look for container icon in bottom-left corner of VS Code
- Or check Extensions panel - should show "Dev Containers" installed

### System Requirements

**Minimum Requirements:**
- **RAM**: 4GB (8GB recommended)
- **Disk Space**: 10GB free (for Docker images)
- **CPU**: 2 cores (4+ recommended)

**Docker Resource Allocation:**

**Windows/Mac (Docker Desktop):**
1. Open Docker Desktop
2. Go to Settings → Resources
3. Allocate:
   - **Memory**: At least 4GB (8GB recommended)
   - **CPUs**: At least 2 (4+ recommended)
   - **Disk**: At least 20GB

**Why This Matters:**
- Containers need resources to run
- Frappe development is resource-intensive
- Insufficient resources cause slow performance

---

## Dev Container Configuration Files

### File Structure

Dev Containers use configuration files to define the development environment:

```
your-project/
├── .devcontainer/              # Dev container configuration directory
│   ├── devcontainer.json       # Main configuration file
│   └── docker-compose.yml      # Docker Compose file (optional)
├── .vscode/                    # VS Code settings (optional)
│   └── launch.json             # Debugging configuration
└── your-code/                  # Your project files
```

### .devcontainer Directory

**Purpose**: Contains all Dev Container configuration files.

**Location**: Must be in the root of your project (or workspace root).

**Files:**
- `devcontainer.json` - Main configuration (required)
- `docker-compose.yml` - Multi-service setup (optional)
- `Dockerfile` - Custom image build (optional)
- `.dockerignore` - Docker build exclusions (optional)

**Naming:**
- Directory name: `.devcontainer` (with dot)
- VS Code automatically detects this directory

### devcontainer.json

**Purpose**: Main configuration file that tells VS Code how to set up your Dev Container.

**Location**: `.devcontainer/devcontainer.json`

**Format**: JSON file

**Basic Structure:**
```json
{
  "name": "My Dev Container",
  "image": "frappe/bench:latest"
}
```

**Key Sections:**
- Container definition (image, Dockerfile, docker-compose)
- VS Code settings
- Extensions to install
- Port forwarding
- Volume mounts
- Environment variables
- Post-create commands

### docker-compose.yml (Optional)

**Purpose**: Defines multiple services (database, Redis, etc.) for your development environment.

**Location**: `.devcontainer/docker-compose.yml`

**When to Use:**
- Need multiple containers (database, Redis, etc.)
- Complex service dependencies
- Shared volumes between services

**Example:**
```yaml
version: "3.7"
services:
  frappe:
    image: frappe/bench:latest
    volumes:
      - ..:/workspace
  
  mariadb:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: 123
```

---

## devcontainer.json - Complete Reference

### Basic Structure

```json
{
  "name": "Container Name",
  "image": "docker-image:tag",
  // ... other configuration
}
```

### Core Properties

#### name

**Purpose**: Display name for your Dev Container (shown in VS Code).

**Syntax**: `"name": "string"`

**Example:**
```json
{
  "name": "Frappe Bench Development"
}
```

**Best Practice**: Use descriptive names that indicate the project/environment.

#### image

**Purpose**: Specifies a pre-built Docker image to use.

**Syntax**: `"image": "repository:tag"`

**Example:**
```json
{
  "image": "frappe/bench:latest"
}
```

**How It Works:**
- VS Code pulls the image from Docker Hub (or configured registry)
- Creates a container from that image
- Connects VS Code to the container

**Common Frappe Images:**
```json
{
  "image": "frappe/bench:latest"           // Latest bench image
}
```

**When to Use `image`:**
- Using pre-built images
- Quick setup
- Standard environments

#### build

**Purpose**: Builds a custom image from a Dockerfile.

**Syntax:**
```json
{
  "build": {
    "context": ".",
    "dockerfile": "Dockerfile"
  }
}
```

**Example:**
```json
{
  "build": {
    "context": ".",
    "dockerfile": ".devcontainer/Dockerfile",
    "args": {
      "PYTHON_VERSION": "3.11.6"
    }
  }
}
```

**Properties:**
- `context`: Build context directory (relative to devcontainer.json)
- `dockerfile`: Path to Dockerfile (relative to context)
- `args`: Build arguments passed to Dockerfile

**When to Use `build`:**
- Custom Dockerfile needed
- Project-specific requirements
- Not using pre-built images

**Frappe Example:**
```json
{
  "build": {
    "context": "..",
    "dockerfile": ".devcontainer/Dockerfile",
    "args": {
      "FRAPPE_BRANCH": "version-15"
    }
  }
}
```

#### dockerComposeFile

**Purpose**: Uses Docker Compose to define multiple services.

**Syntax**: `"dockerComposeFile": "path/to/docker-compose.yml"`

**Example:**
```json
{
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe"
}
```

**How It Works:**
- VS Code reads the docker-compose.yml file
- Starts all services defined in it
- Connects to the specified service

**Frappe Pattern:**
```json
{
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "workspaceFolder": "/workspace/development"
}
```

**When to Use `dockerComposeFile`:**
- Need database, Redis, or other services
- Multiple containers working together
- Complex development environment

#### service

**Purpose**: Specifies which service from docker-compose.yml to use as the Dev Container.

**Syntax**: `"service": "service-name"`

**Example:**
```json
{
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe"
  // VS Code connects to the "frappe" service
}
```

**Important**: Must match a service name in docker-compose.yml.

**Frappe Example:**
```yaml
# docker-compose.yml
services:
  frappe:
    image: frappe/bench:latest
    # This is the service VS Code connects to
```

```json
// devcontainer.json
{
  "service": "frappe"  // Matches service name above
}
```

### Workspace Configuration

#### workspaceFolder

**Purpose**: Sets the default workspace folder inside the container.

**Syntax**: `"workspaceFolder": "/path/in/container"`

**Example:**
```json
{
  "workspaceFolder": "/workspace/development"
}
```

**How It Works:**
- VS Code opens this folder when connecting to container
- Terminal starts in this directory
- Relative paths resolve from here

**Frappe Pattern:**
```json
{
  "workspaceFolder": "/workspace/development"
  // Frappe benches are created in /workspace/development
}
```

**Default**: If not specified, uses `/workspace` or root of mounted volume.

#### workspaceMount

**Purpose**: Custom mount point for workspace (advanced, rarely needed).

**Syntax**: `"workspaceMount": "source=...,target=...,type=..."`

**Example:**
```json
{
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind"
}
```

**When to Use**: Usually not needed - VS Code handles this automatically.

### User Configuration

#### remoteUser

**Purpose**: Sets the user to run commands as inside the container.

**Syntax**: `"remoteUser": "username"`

**Example:**
```json
{
  "remoteUser": "frappe"
}
```

**Why It Matters:**
- File permissions
- Running commands
- Security (don't run as root)

**Frappe Pattern:**
```json
{
  "remoteUser": "frappe"
  // Frappe containers use "frappe" user (UID 1000)
}
```

**Default**: Uses container's default user (often root, which is not ideal).

### Port Forwarding

#### forwardPorts

**Purpose**: Automatically forwards container ports to your local machine.

**Syntax**: `"forwardPorts": [port1, port2, ...]`

**Example:**
```json
{
  "forwardPorts": [8000, 9000, 6787]
}
```

**How It Works:**
- Container port 8000 → localhost:8000
- Container port 9000 → localhost:9000
- Container port 6787 → localhost:6787

**Frappe Pattern:**
```json
{
  "forwardPorts": [8000, 9000, 6787]
  // 8000: Frappe web server
  // 9000: Socket.IO
  // 6787: Redis (if needed)
}
```

**Access from Host:**
- Open browser: `http://localhost:8000`
- Access Frappe application
- No need to manually map ports

#### portsAttributes

**Purpose**: Advanced port configuration (label, protocol, etc.).

**Syntax:**
```json
{
  "portsAttributes": {
    "8000": {
      "label": "Frappe Web Server",
      "onAutoForward": "notify"
    }
  }
}
```

**Options:**
- `label`: Display name in VS Code
- `onAutoForward`: What to do when port is forwarded (`notify`, `openBrowser`, `silent`)

**Frappe Example:**
```json
{
  "forwardPorts": [8000, 9000],
  "portsAttributes": {
    "8000": {
      "label": "Frappe Web Server",
      "onAutoForward": "openBrowser"
    },
    "9000": {
      "label": "Socket.IO",
      "onAutoForward": "notify"
    }
  }
}
```

### Volume Mounts

#### mounts

**Purpose**: Mounts additional volumes into the container.

**Syntax**: `"mounts": ["source=...,target=...,type=..."]`

**Example:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}/.ssh,target=/home/frappe/.ssh,type=bind"
  ]
}
```

**Mount Types:**
- `bind`: Mount host directory
- `volume`: Use Docker volume

**Common Use Cases:**

**1. SSH Keys:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```
- Cross-platform: Works on Linux (`HOME`) and Windows (`USERPROFILE`)
- Mounts SSH keys for Git authentication

**2. Git Credentials:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}/.gitconfig,target=/home/frappe/.gitconfig,type=bind"
  ]
}
```

**3. Custom Directories:**
```json
{
  "mounts": [
    "source=${localWorkspaceFolder}/custom,target=/custom,type=bind"
  ]
}
```

**Frappe Pattern:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```

### VS Code Customizations

#### customizations

**Purpose**: Configures VS Code settings and extensions for the container.

**Syntax:**
```json
{
  "customizations": {
    "vscode": {
      "extensions": [...],
      "settings": {...}
    }
  }
}
```

#### Extensions

**Purpose**: Automatically installs VS Code extensions in the container.

**Syntax:**
```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "extension-id-1",
        "extension-id-2"
      ]
    }
  }
}
```

**How to Find Extension IDs:**
- VS Code Marketplace URL: `https://marketplace.visualstudio.com/items?itemName=ms-python.python`
- Extension ID: `ms-python.python` (the `itemName` parameter)

**Common Frappe Extensions:**
```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",                    // Python support
        "ms-vscode.live-server",              // Live web server
        "grapecity.gc-excelviewer",            // Excel file viewer
        "mtxr.sqltools",                       // SQL database tools
        "visualstudioexptteam.vscodeintellicode" // AI code completion
      ]
    }
  }
}
```

**Extension Categories:**

**1. Language Support:**
- `ms-python.python` - Python language support
- `ms-python.vscode-pylance` - Python language server

**2. Database Tools:**
- `mtxr.sqltools` - SQL database client
- `mtxr.sqltools-driver-mysql` - MySQL/MariaDB driver

**3. Web Development:**
- `ms-vscode.live-server` - Live reload web server

**4. Productivity:**
- `visualstudioexptteam.vscodeintellicode` - AI code completion
- `grapecity.gc-excelviewer` - View Excel files

#### Settings

**Purpose**: Configures VS Code settings for the container.

**Syntax:**
```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "setting.key": "value"
      }
    }
  }
}
```

**Common Settings:**

**1. Terminal Configuration:**
```json
{
  "settings": {
    "terminal.integrated.profiles.linux": {
      "frappe bash": {
        "path": "/bin/bash"
      }
    },
    "terminal.integrated.defaultProfile.linux": "frappe bash"
  }
}
```

**2. Python Configuration:**
```json
{
  "settings": {
    "python.defaultInterpreterPath": "/home/frappe/frappe-bench/env/bin/python",
    "python.analysis.autoImportCompletions": true
  }
}
```

**3. Debugging:**
```json
{
  "settings": {
    "debug.node.autoAttach": "disabled"
  }
}
```

**Frappe Pattern:**
```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.profiles.linux": {
          "frappe bash": {
            "path": "/bin/bash"
          }
        },
        "terminal.integrated.defaultProfile.linux": "frappe bash",
        "debug.node.autoAttach": "disabled"
      }
    }
  }
}
```

### Container Lifecycle

#### postCreateCommand

**Purpose**: Runs a command after the container is created.

**Syntax**: `"postCreateCommand": "command"`

**Example:**
```json
{
  "postCreateCommand": "pip install -r requirements.txt"
}
```

**Use Cases:**
- Install dependencies
- Run setup scripts
- Configure environment

**Frappe Example:**
```json
{
  "postCreateCommand": "bench --version"
}
```

**Multiple Commands:**
```json
{
  "postCreateCommand": "bash -c 'pip install -r requirements.txt && bench --version'"
}
```

#### postStartCommand

**Purpose**: Runs a command every time the container starts.

**Syntax**: `"postStartCommand": "command"`

**Example:**
```json
{
  "postStartCommand": "echo 'Container started'"
}
```

**Use Cases:**
- Start background services
- Initialize databases
- Set up environment variables

#### postAttachCommand

**Purpose**: Runs a command when VS Code attaches to the container.

**Syntax**: `"postAttachCommand": "command"`

**Example:**
```json
{
  "postAttachCommand": "echo 'VS Code attached'"
}
```

### Shutdown Behavior

#### shutdownAction

**Purpose**: Defines what happens when VS Code closes.

**Syntax**: `"shutdownAction": "none" | "stopCompose" | "stopContainer"`

**Options:**
- `none`: Do nothing (containers keep running)
- `stopContainer`: Stop the Dev Container
- `stopCompose`: Stop all Docker Compose services

**Example:**
```json
{
  "shutdownAction": "stopCompose"
}
```

**Frappe Pattern:**
```json
{
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "shutdownAction": "stopCompose"
  // Stops all services (frappe, mariadb, redis) when VS Code closes
}
```

**When to Use:**
- `stopCompose`: Multi-service setup (recommended for Frappe)
- `stopContainer`: Single container
- `none`: Keep containers running for other tools

### Environment Variables

#### containerEnv

**Purpose**: Sets environment variables in the container.

**Syntax**: `"containerEnv": { "KEY": "value" }`

**Example:**
```json
{
  "containerEnv": {
    "PYTHON_VERSION": "3.11.6",
    "NODE_VERSION": "18.18.2"
  }
}
```

**Using Host Environment Variables:**
```json
{
  "containerEnv": {
    "DB_PASSWORD": "${localEnv:DB_PASSWORD}"
  }
}
```

**Frappe Example:**
```json
{
  "containerEnv": {
    "SHELL": "/bin/bash",
    "PYTHONUNBUFFERED": "1"
  }
}
```

### Complete Frappe devcontainer.json Example

```json
{
  "name": "Frappe Bench",
  "forwardPorts": [8000, 9000, 6787],
  "remoteUser": "frappe",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-vscode.live-server",
        "grapecity.gc-excelviewer",
        "mtxr.sqltools",
        "visualstudioexptteam.vscodeintellicode"
      ],
      "settings": {
        "terminal.integrated.profiles.linux": {
          "frappe bash": {
            "path": "/bin/bash"
          }
        },
        "terminal.integrated.defaultProfile.linux": "frappe bash",
        "debug.node.autoAttach": "disabled"
      }
    }
  },
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "workspaceFolder": "/workspace/development",
  "shutdownAction": "stopCompose",
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```

---

## Docker Compose Integration

### Why Use Docker Compose with Dev Containers?

**Single Container Limitation:**
- Dev Container can only connect to one container
- Frappe needs: database, Redis cache, Redis queue
- Need multiple services working together

**Docker Compose Solution:**
- Defines multiple services
- VS Code connects to one service (frappe)
- Other services run alongside

### Basic Docker Compose Setup

**File Structure:**
```
.devcontainer/
├── devcontainer.json
└── docker-compose.yml
```

**docker-compose.yml:**
```yaml
version: "3.7"
services:
  frappe:
    image: frappe/bench:latest
    command: sleep infinity
    volumes:
      - ..:/workspace:cached
    working_dir: /workspace/development
    ports:
      - 8000-8005:8000-8005
      - 9000-9005:9000-9005
  
  mariadb:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - mariadb-data:/var/lib/mysql
  
  redis-cache:
    image: redis:alpine
  
  redis-queue:
    image: redis:alpine

volumes:
  mariadb-data:
```

**devcontainer.json:**
```json
{
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "workspaceFolder": "/workspace/development"
}
```

### Service Communication

**How Services Connect:**
- All services on same Docker network (automatic)
- Use service names as hostnames
- No need for `localhost` or IP addresses

**Example:**
```yaml
# frappe service can access:
# - mariadb (database)
# - redis-cache (cache)
# - redis-queue (queue)
```

**In Frappe Configuration:**
```bash
# Inside frappe container:
bench set-config -g db_host mariadb        # Not localhost!
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6379
```

### Volume Sharing

**Workspace Volume:**
```yaml
services:
  frappe:
    volumes:
      - ..:/workspace:cached
      # Mounts parent directory (project root) to /workspace
```

**How It Works:**
- `..` means parent directory of `.devcontainer`
- Mounts entire project into container
- Changes sync immediately (cached for performance)

**Database Volumes:**
```yaml
services:
  mariadb:
    volumes:
      - mariadb-data:/var/lib/mysql
      # Persistent database storage

volumes:
  mariadb-data:
```

### Port Mapping

**Development Ports:**
```yaml
services:
  frappe:
    ports:
      - 8000-8005:8000-8005  # Frappe web servers
      - 9000-9005:9000-9005  # Socket.IO servers
```

**Why Port Ranges:**
- Frappe can run multiple sites
- Each site uses different port
- Port range allows multiple sites

**Database Ports (Optional):**
```yaml
services:
  mariadb:
    ports:
      - 3306:3306  # Only if you need external access
```

**Note**: Usually not needed - access via service name from frappe container.

### Complete Frappe docker-compose.yml

```yaml
version: "3.7"
services:
  mariadb:
    image: docker.io/mariadb:10.6
    platform: linux/amd64
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --skip-character-set-client-handshake
      - --skip-innodb-read-only-compressed
    environment:
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - mariadb-data:/var/lib/mysql

  redis-cache:
    image: docker.io/redis:alpine
    platform: linux/amd64

  redis-queue:
    image: docker.io/redis:alpine
    platform: linux/amd64

  frappe:
    image: docker.io/frappe/bench:latest
    platform: linux/amd64
    command: sleep infinity
    environment:
      - SHELL=/bin/bash
    volumes:
      - ..:/workspace:cached
    working_dir: /workspace/development
    ports:
      - 8000-8005:8000-8005
      - 9000-9005:9000-9005

volumes:
  mariadb-data:
```

---

## Frappe-Specific Configuration

### Complete Frappe Dev Container Setup

**File Structure:**
```
frappe-project/
├── .devcontainer/
│   ├── devcontainer.json
│   └── docker-compose.yml
├── development/          # Created inside container
│   └── frappe-bench/     # Bench created here
└── your-code/
```

### Step-by-Step Configuration

**1. Create .devcontainer Directory:**
```bash
mkdir -p .devcontainer
```

**2. Create docker-compose.yml:**
```yaml
version: "3.7"
services:
  mariadb:
    image: docker.io/mariadb:10.6
    platform: linux/amd64
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --skip-character-set-client-handshake
    environment:
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - mariadb-data:/var/lib/mysql

  redis-cache:
    image: docker.io/redis:alpine
    platform: linux/amd64

  redis-queue:
    image: docker.io/redis:alpine
    platform: linux/amd64

  frappe:
    image: docker.io/frappe/bench:latest
    platform: linux/amd64
    command: sleep infinity
    environment:
      - SHELL=/bin/bash
    volumes:
      - ..:/workspace:cached
    working_dir: /workspace/development
    ports:
      - 8000-8005:8000-8005
      - 9000-9005:9000-9005

volumes:
  mariadb-data:
```

**3. Create devcontainer.json:**
```json
{
  "name": "Frappe Bench",
  "forwardPorts": [8000, 9000, 6787],
  "remoteUser": "frappe",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-vscode.live-server",
        "grapecity.gc-excelviewer",
        "mtxr.sqltools",
        "visualstudioexptteam.vscodeintellicode"
      ],
      "settings": {
        "terminal.integrated.profiles.linux": {
          "frappe bash": {
            "path": "/bin/bash"
          }
        },
        "terminal.integrated.defaultProfile.linux": "frappe bash",
        "debug.node.autoAttach": "disabled"
      }
    }
  },
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "workspaceFolder": "/workspace/development",
  "shutdownAction": "stopCompose",
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```

### Workspace Setup

**Understanding the Workspace:**
- Project root mounted to `/workspace` in container
- `workspaceFolder` set to `/workspace/development`
- Frappe benches created in `/workspace/development`

**Why `/workspace/development`:**
- Keeps development files separate
- Matches frappe_docker convention
- Easy to find benches

**Creating Your First Bench:**
```bash
# Inside container terminal:
cd /workspace/development
bench init --skip-redis-config-generation frappe-bench
cd frappe-bench
```

### Database Configuration

**Setting Up Database Connection:**
```bash
# Inside frappe container:
bench set-config -g db_host mariadb
bench set-config -gp db_port 3306
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6379
bench set-config -g redis_socketio redis://redis-queue:6379
```

**Why These Values:**
- `db_host: mariadb` - Service name from docker-compose.yml
- `redis-cache:6379` - Service name and port
- Not `localhost` - Services are separate containers!

### Site Creation

**Creating a Development Site:**
```bash
# Inside frappe-bench directory:
bench new-site --mariadb-user-host-login-scope=% development.localhost
```

**Important:**
- Site name must end with `.localhost`
- `--mariadb-user-host-login-scope=%` allows Docker networking
- Default root password: `123` (from docker-compose.yml)

**Installing Apps:**
```bash
bench get-app erpnext
bench --site development.localhost install-app erpnext
```

### Starting Frappe

**Without Debugging:**
```bash
bench start
```

**With Debugging:**
See [Debugging Configuration](#debugging-configuration) section.

---

## Step-by-Step Setup Guide

### Initial Setup

**Step 1: Install Prerequisites**

1. Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
2. Install VS Code
3. Install Dev Containers extension

**Step 2: Create Project Structure**

```bash
mkdir my-frappe-project
cd my-frappe-project
mkdir .devcontainer
```

**Step 3: Create Configuration Files**

Create `.devcontainer/docker-compose.yml`:
```yaml
version: "3.7"
services:
  mariadb:
    image: docker.io/mariadb:10.6
    platform: linux/amd64
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --skip-character-set-client-handshake
    environment:
      MYSQL_ROOT_PASSWORD: 123
    volumes:
      - mariadb-data:/var/lib/mysql

  redis-cache:
    image: docker.io/redis:alpine
    platform: linux/amd64

  redis-queue:
    image: docker.io/redis:alpine
    platform: linux/amd64

  frappe:
    image: docker.io/frappe/bench:latest
    platform: linux/amd64
    command: sleep infinity
    environment:
      - SHELL=/bin/bash
    volumes:
      - ..:/workspace:cached
    working_dir: /workspace/development
    ports:
      - 8000-8005:8000-8005
      - 9000-9005:9000-9005

volumes:
  mariadb-data:
```

Create `.devcontainer/devcontainer.json`:
```json
{
  "name": "Frappe Bench",
  "forwardPorts": [8000, 9000, 6787],
  "remoteUser": "frappe",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-vscode.live-server",
        "grapecity.gc-excelviewer",
        "mtxr.sqltools",
        "visualstudioexptteam.vscodeintellicode"
      ],
      "settings": {
        "terminal.integrated.profiles.linux": {
          "frappe bash": {
            "path": "/bin/bash"
          }
        },
        "terminal.integrated.defaultProfile.linux": "frappe bash",
        "debug.node.autoAttach": "disabled"
      }
    }
  },
  "dockerComposeFile": "./docker-compose.yml",
  "service": "frappe",
  "workspaceFolder": "/workspace/development",
  "shutdownAction": "stopCompose",
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```

**Step 4: Open in VS Code**

```bash
code .
```

**Step 5: Reopen in Container**

1. VS Code will detect `.devcontainer` folder
2. Click notification: "Folder contains a Dev Container configuration file"
3. Click "Reopen in Container"
   - Or: Command Palette → "Dev Containers: Reopen in Container"
   - Or: Click container icon in bottom-left → "Reopen in Container"

**Step 6: Wait for Container Setup**

- VS Code pulls images (first time: 5-10 minutes)
- Starts containers
- Installs extensions
- Connects to container

**Step 7: Verify Setup**

Open terminal in VS Code (`Ctrl+`` or `Cmd+``):
```bash
whoami
# Should show: frappe

pwd
# Should show: /workspace/development

bench --version
# Should show bench version

python --version
# Should show Python version

node --version
# Should show Node.js version
```

### Setting Up Frappe Bench

**Step 1: Initialize Bench**

```bash
cd /workspace/development
bench init --skip-redis-config-generation frappe-bench
cd frappe-bench
```

**Step 2: Configure Database and Redis**

```bash
bench set-config -g db_host mariadb
bench set-config -gp db_port 3306
bench set-config -g redis_cache redis://redis-cache:6379
bench set-config -g redis_queue redis://redis-queue:6379
bench set-config -g redis_socketio redis://redis-queue:6379
```

**Step 3: Create Site**

```bash
bench new-site --mariadb-user-host-login-scope=% --admin-password admin development.localhost
```

**Step 4: Install Apps**

```bash
bench get-app erpnext
bench --site development.localhost install-app erpnext
```

**Step 5: Start Frappe**

```bash
bench start
```

**Step 6: Access Application**

Open browser: `http://localhost:8000`
- Username: `Administrator`
- Password: `admin` (or what you set)

---

## VS Code Settings and Extensions

### Recommended Extensions

**Essential Extensions:**
```json
{
  "extensions": [
    "ms-python.python",                    // Python language support
    "ms-python.vscode-pylance",            // Python language server
    "ms-vscode.live-server"                // Live web server
  ]
}
```

**Frappe-Specific Extensions:**
```json
{
  "extensions": [
    "grapecity.gc-excelviewer",            // View Excel files
    "mtxr.sqltools",                       // SQL database client
    "mtxr.sqltools-driver-mysql",          // MySQL/MariaDB driver
    "visualstudioexptteam.vscodeintellicode" // AI code completion
  ]
}
```

**Productivity Extensions:**
```json
{
  "extensions": [
    "eamodio.gitlens",                     // Git enhancements
    "ms-vscode.vscode-json",               // JSON support
    "redhat.vscode-yaml"                   // YAML support
  ]
}
```

### VS Code Settings

**Python Settings:**
```json
{
  "settings": {
    "python.defaultInterpreterPath": "/home/frappe/frappe-bench/env/bin/python",
    "python.analysis.autoImportCompletions": true,
    "python.linting.enabled": true,
    "python.formatting.provider": "black"
  }
}
```

**Terminal Settings:**
```json
{
  "settings": {
    "terminal.integrated.profiles.linux": {
      "frappe bash": {
        "path": "/bin/bash"
      }
    },
    "terminal.integrated.defaultProfile.linux": "frappe bash"
  }
}
```

**Editor Settings:**
```json
{
  "settings": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    },
    "files.autoSave": "afterDelay"
  }
}
```

---

## Port Forwarding

### How Port Forwarding Works

**Automatic Forwarding:**
```json
{
  "forwardPorts": [8000, 9000, 6787]
}
```

**What Happens:**
- Container port 8000 → Host localhost:8000
- Container port 9000 → Host localhost:9000
- Container port 6787 → Host localhost:6787

**Access from Host:**
- Browser: `http://localhost:8000`
- No need to know container IP
- Works as if service runs locally

### Manual Port Forwarding

**VS Code Ports Panel:**
1. Open Ports panel (bottom panel)
2. See forwarded ports
3. Click port to open in browser
4. Right-click for options (make public, change port, etc.)

### Port Conflicts

**Problem**: Port already in use on host

**Solution 1: Change Host Port**
```json
{
  "forwardPorts": [8000],
  "portsAttributes": {
    "8000": {
      "onAutoForward": "notify"
    }
  }
}
```
Then manually change port in Ports panel.

**Solution 2: Stop Conflicting Service**
```bash
# Find what's using port 8000
# Linux/Mac:
lsof -i :8000

# Windows:
netstat -ano | findstr :8000

# Stop the service
```

---

## Volume Mounts and Workspace

### Understanding Volume Mounts

**Workspace Mount (Automatic):**
- VS Code automatically mounts project folder
- Mounted to `/workspace` (or `workspaceFolder`)
- Changes sync immediately

**Additional Mounts:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}/.ssh,target=/home/frappe/.ssh,type=bind"
  ]
}
```

### Common Mount Patterns

**1. SSH Keys:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}${localEnv:USERPROFILE}/.ssh,target=/home/frappe/.ssh,type=bind,consistency=cached"
  ]
}
```

**2. Git Config:**
```json
{
  "mounts": [
    "source=${localEnv:HOME}/.gitconfig,target=/home/frappe/.gitconfig,type=bind"
  ]
}
```

**3. Custom Directories:**
```json
{
  "mounts": [
    "source=${localWorkspaceFolder}/data,target=/data,type=bind"
  ]
}
```

### Workspace Folder

**Setting Workspace Folder:**
```json
{
  "workspaceFolder": "/workspace/development"
}
```

**Why It Matters:**
- VS Code opens this folder
- Terminal starts here
- Relative paths resolve from here
- Frappe benches created here

---

## Debugging Configuration

### Setting Up Python Debugging

**1. Install Python Extension**

Already included in devcontainer.json:
```json
{
  "extensions": ["ms-python.python"]
}
```

**2. Create Launch Configuration**

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Bench Web",
      "type": "debugpy",
      "request": "launch",
      "program": "${workspaceFolder}/frappe-bench/apps/frappe/frappe/utils/bench_helper.py",
      "args": [
        "frappe",
        "serve",
        "--port",
        "8000",
        "--noreload",
        "--nothreading"
      ],
      "cwd": "${workspaceFolder}/frappe-bench/sites",
      "env": {
        "DEV_SERVER": "1"
      }
    }
  ]
}
```

**3. Start Other Processes**

Before debugging, start other processes:
```bash
honcho start socketio watch schedule worker_short worker_long
```

**4. Start Debugging**

1. Set breakpoints in your code
2. Press F5 or click Debug → Start Debugging
3. Select "Bench Web" configuration
4. Debugger attaches to Frappe web server

### Debugging Workers

**Worker Debug Configuration:**
```json
{
  "name": "Bench Short Worker",
  "type": "debugpy",
  "request": "launch",
  "program": "${workspaceFolder}/frappe-bench/apps/frappe/frappe/utils/bench_helper.py",
  "args": ["frappe", "worker", "--queue", "short"],
  "cwd": "${workspaceFolder}/frappe-bench/sites",
  "env": {
    "DEV_SERVER": "1"
  }
}
```

### Debugging Console

**Console Configuration:**
```json
{
  "name": "Bench Console",
  "type": "python",
  "request": "launch",
  "program": "${workspaceFolder}/frappe-bench/apps/frappe/frappe/utils/bench_helper.py",
  "args": ["frappe", "--site", "development.localhost", "console"],
  "pythonPath": "${workspaceFolder}/frappe-bench/env/bin/python",
  "cwd": "${workspaceFolder}/frappe-bench/sites",
  "env": {
    "DEV_SERVER": "1"
  }
}
```

---

## Advanced Patterns

### Using Custom Dockerfile

**Create Dockerfile:**
```dockerfile
# .devcontainer/Dockerfile
FROM frappe/bench:latest

# Install additional tools
RUN apt-get update && apt-get install -y vim curl

# Install custom Python packages
RUN pip install --user some-package
```

**Update devcontainer.json:**
```json
{
  "build": {
    "context": "..",
    "dockerfile": ".devcontainer/Dockerfile"
  }
}
```

### Environment-Specific Configuration

**Using .env File:**
```bash
# .devcontainer/.env
DB_PASSWORD=secret123
PYTHON_VERSION=3.11.6
```

**Reference in docker-compose.yml:**
```yaml
services:
  mariadb:
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-123}
```

### Post-Create Scripts

**Running Setup Scripts:**
```json
{
  "postCreateCommand": "bash .devcontainer/setup.sh"
}
```

**setup.sh:**
```bash
#!/bin/bash
bench init frappe-bench
bench set-config -g db_host mariadb
```

### Multi-Stage Development

**Different Configurations:**
```
.devcontainer/
├── devcontainer.json          # Default
├── devcontainer.dev.json      # Development
└── devcontainer.prod.json     # Production-like
```

**Switch Configurations:**
- Command Palette → "Dev Containers: Reopen Container Configuration"

---

## Best Practices

### 1. Version Control Configuration

**Commit to Git:**
- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`
- `.devcontainer/Dockerfile` (if custom)

**Don't Commit:**
- `.devcontainer/.env` (if contains secrets)
- Container-specific files

### 2. Use Specific Image Tags

```json
{
  "image": "frappe/bench:latest"  // OK for development
}
```

**Better for Production:**
```json
{
  "image": "frappe/bench:v5.0.0"  // Specific version
}
```

### 3. Document Requirements

**Create README.md:**
```markdown
# Development Setup

## Prerequisites
- Docker Desktop
- VS Code
- Dev Containers extension

## Setup
1. Clone repository
2. Open in VS Code
3. Reopen in Container
```

### 4. Optimize Build Time

**Use Pre-built Images:**
```json
{
  "image": "frappe/bench:latest"  // Fast - just pull
}
```

**Avoid Building:**
```json
{
  "build": { ... }  // Slow - builds every time
}
```

### 5. Keep Configuration Simple

**Start Simple:**
```json
{
  "image": "frappe/bench:latest"
}
```

**Add Complexity Gradually:**
- Add extensions as needed
- Add settings as needed
- Add mounts as needed

---

## Troubleshooting

### Common Issues

#### Issue 1: Container Won't Start

**Symptoms**: Container fails to start, error messages

**Solutions:**
1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check disk space:
   ```bash
   docker system df
   ```

3. Check logs:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml logs
   ```

4. Rebuild container:
   - Command Palette → "Dev Containers: Rebuild Container"

#### Issue 2: Extensions Not Installing

**Symptoms**: Extensions listed but not working

**Solutions:**
1. Check extension compatibility
2. Manually install in container
3. Check VS Code logs: Help → Toggle Developer Tools

#### Issue 3: Port Already in Use

**Symptoms**: Port forwarding fails

**Solutions:**
1. Change port in Ports panel
2. Stop conflicting service
3. Change port in docker-compose.yml

#### Issue 4: Can't Connect to Database

**Symptoms**: Database connection errors

**Solutions:**
1. Check service name matches:
   ```bash
   bench set-config -g db_host mariadb  # Not localhost!
   ```

2. Check database is running:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml ps
   ```

3. Check network:
   ```bash
   docker network ls
   ```

#### Issue 5: File Permissions

**Symptoms**: Permission denied errors

**Solutions:**
1. Check user:
   ```json
   {
     "remoteUser": "frappe"
   }
   ```

2. Fix permissions:
   ```bash
   sudo chown -R frappe:frappe /workspace
   ```

#### Issue 6: Slow Performance

**Symptoms**: Container is slow

**Solutions:**
1. Increase Docker resources (RAM, CPU)
2. Use `:cached` for volumes:
   ```yaml
   volumes:
     - ..:/workspace:cached
   ```
3. Exclude unnecessary files in .dockerignore

### Debugging Commands

**Check Container Status:**
```bash
docker compose -f .devcontainer/docker-compose.yml ps
```

**View Logs:**
```bash
docker compose -f .devcontainer/docker-compose.yml logs frappe
```

**Execute Command in Container:**
```bash
docker compose -f .devcontainer/docker-compose.yml exec frappe bash
```

**Rebuild Container:**
- VS Code: Command Palette → "Dev Containers: Rebuild Container"

**Reset Everything:**
```bash
docker compose -f .devcontainer/docker-compose.yml down -v
# Then reopen in container
```

---

## Conclusion

You now have comprehensive knowledge of:
- VS Code and extensions
- Dev Containers concept and benefits
- devcontainer.json configuration
- Docker Compose integration
- Frappe-specific setup
- Debugging configuration
- Best practices
- Troubleshooting

### Next Steps

1. **Create Your Own**: Set up Dev Container for your Frappe project
2. **Customize**: Add extensions and settings you need
3. **Share**: Commit configuration to help teammates
4. **Experiment**: Try different configurations

**Remember**: Dev Containers make development consistent and easy. Start simple, iterate, and gradually add features as you need them. Happy coding!

