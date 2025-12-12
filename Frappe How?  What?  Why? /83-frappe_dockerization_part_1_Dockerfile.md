# Writing Dockerfiles for Frappe Projects

## Table of Contents
1. [Introduction to Docker](#introduction-to-docker)
2. [Understanding Docker Concepts](#understanding-docker-concepts)
3. [Dockerfile Basics](#dockerfile-basics)
4. [Dockerfile Instructions Explained](#dockerfile-instructions-explained)
5. [Multi-Stage Builds](#multi-stage-builds)
6. [Frappe-Specific Requirements](#frappe-specific-requirements)
7. [Step-by-Step: Creating Your First Frappe Dockerfile](#step-by-step-creating-your-first-frappe-dockerfile)
8. [Advanced Patterns](#advanced-patterns)
9. [Best Practices](#best-practices)
10. [Common Patterns from frappe_docker](#common-patterns-from-frappe_docker)
11. [Troubleshooting](#troubleshooting)

---

## Introduction to Docker

### What is Docker?

Docker is a platform that allows you to package applications and their dependencies into lightweight, portable containers. Think of a container as a lightweight, standalone package that includes everything needed to run an application: code, runtime, system tools, libraries, and settings.

Docker uses containerization technology, which is different from traditional virtualization. Here's how it works:

1. **Traditional Virtualization**: Each virtual machine (VM) runs a complete operating system (OS) with its own kernel. This is heavy and resource-intensive.
   - Example: If you have 3 VMs, you're running 3 complete OS instances
   - Each VM might use 1-2GB of RAM just for the OS

2. **Containerization**: Containers share the host OS kernel but have isolated user spaces. This makes them much lighter.
   - Example: You can run 10 containers on the same OS kernel
   - Each container might use only 50-100MB of RAM

**Real-World Analogy:**
- **VM**: Like having separate apartments, each with its own kitchen, bathroom, and utilities
- **Container**: Like having separate rooms in a shared apartment - each room is isolated, but they share common utilities (the host OS kernel)

**What Docker Actually Does:**
- Creates isolated environments using Linux namespaces (process isolation, network isolation, filesystem isolation)
- Uses cgroups (control groups) to limit resource usage (CPU, memory, disk I/O)
- Provides a consistent filesystem layer on top of the host filesystem
- Manages networking between containers and the host

### Why Use Docker for Frappe Projects?

1. **Consistency**: Your application runs the same way in development, testing, and production
   - **Problem Solved**: "It works on my machine" - different developers have different Python versions, Node versions, system libraries
   - **Docker Solution**: Everyone uses the exact same environment defined in the Dockerfile
   - **Example**: Developer A has Python 3.9, Developer B has Python 3.11. Without Docker, they might encounter different bugs. With Docker, both use Python 3.11.6 as specified in the Dockerfile.

2. **Isolation**: Each container is isolated from others, preventing conflicts
   - **Problem Solved**: Multiple projects requiring different versions of the same dependency
   - **Docker Solution**: Each container has its own isolated environment
   - **Example**: You can run Frappe v14 in one container and Frappe v15 in another on the same machine without conflicts

3. **Portability**: Run your application anywhere Docker is installed
   - **Problem Solved**: Deployment complexity - different servers have different configurations
   - **Docker Solution**: Build once, run anywhere (Linux, Windows, Mac, cloud)
   - **Example**: Build your image on your laptop, push to Docker Hub, pull and run on AWS, Azure, or your own server

4. **Scalability**: Easily scale your application by running multiple containers
   - **Problem Solved**: Handling increased traffic requires complex server configuration
   - **Docker Solution**: Simply run more containers (horizontal scaling)
   - **Example**: Start with 1 container, scale to 5 containers behind a load balancer when traffic increases

5. **Dependency Management**: All dependencies are bundled, eliminating "works on my machine" issues
   - **Problem Solved**: Missing system libraries, wrong versions, configuration drift
   - **Docker Solution**: Everything is defined in the Dockerfile and baked into the image
   - **Example**: Your Frappe app needs `wkhtmltopdf`, `libpq-dev`, and specific Python packages - all are included in the image

### Key Docker Concepts

#### Container vs Image - Deep Dive

**Image:**
- A read-only template used to create containers
- Think of it as a blueprint or a snapshot
- **Technical Details**: An image is composed of multiple read-only layers stacked on top of each other
- **Storage**: Images are stored in a Docker registry (like Docker Hub) or locally
- **Size**: Typically 100MB to 2GB depending on what's included
- **Example**: `frappe/erpnext:version-15` is an image name

**How Images Work Internally:**
```
Image Layers (read-only):
┌─────────────────────────┐
│ Layer 5: Your app code  │ ← Top layer (changes most)
├─────────────────────────┤
│ Layer 4: Python deps   │
├─────────────────────────┤
│ Layer 3: System tools  │
├─────────────────────────┤
│ Layer 2: Base OS        │
├─────────────────────────┤
│ Layer 1: Base image     │ ← Bottom layer (changes least)
└─────────────────────────┘
```

**Container:**
- A running instance of an image
- **Technical Details**: When you run an image, Docker creates a writable layer (container layer) on top of the image layers
- **Lifecycle**: Created → Running → Stopped → Removed
- **Isolation**: Each container has its own filesystem, network, and process space
- **Example**: Running `docker run frappe/erpnext:version-15` creates a container

**How Containers Work Internally:**
```
Container (running):
┌─────────────────────────┐
│ Container Layer (R/W)   │ ← Your changes go here
├─────────────────────────┤
│ Image Layers (R/O)      │ ← From the image
│   ...                   │
└─────────────────────────┘
```

**Key Differences:**

| Aspect | Image | Container |
|--------|-------|-----------|
| **State** | Read-only | Read-write (has writable layer) |
| **Purpose** | Template/Blueprint | Running instance |
| **Storage** | Registry or local | Created at runtime |
| **Lifecycle** | Persistent | Ephemeral (can be removed) |
| **Count** | One image | Many containers from one image |
| **Changes** | Changes create new image | Changes lost when container removed |

**Real-World Example:**
```bash
# Image (template) - stored on disk
docker images
# REPOSITORY          TAG           IMAGE ID       SIZE
# frappe/erpnext      version-15    abc123def456   1.2GB

# Container (running instance) - created from image
docker ps
# CONTAINER ID   IMAGE                    STATUS
# def456ghi789   frappe/erpnext:v15       Up 2 hours

# You can create multiple containers from the same image
docker run frappe/erpnext:version-15  # Container 1
docker run frappe/erpnext:version-15  # Container 2
docker run frappe/erpnext:version-15  # Container 3
# All three containers run independently from the same image
```

#### Dockerfile

A Dockerfile is a text file containing instructions for building a Docker image. It's like a recipe that tells Docker how to create your application environment.

**What Happens When You Build:**
1. Docker reads the Dockerfile line by line
2. Each instruction creates a new layer
3. Layers are cached for faster rebuilds
4. Final result is an image you can run

**Dockerfile Location:**
- Must be named `Dockerfile` (or specified with `-f` flag)
- Usually placed in the root of your project
- Example project structure:
```
my-frappe-project/
├── Dockerfile          ← Docker reads this
├── requirements.txt
├── app.py
└── ...
```

**Dockerfile Execution Flow:**
```
1. FROM python:3.11-slim    → Download base image (if not cached)
2. RUN apt-get update       → Execute command, create layer
3. COPY requirements.txt    → Copy file, create layer
4. RUN pip install          → Install packages, create layer
5. COPY . .                 → Copy code, create layer
6. CMD ["python", "app.py"] → Set default command
```

**Important Notes:**
- Dockerfile instructions are executed sequentially
- Each instruction runs in a new shell/environment
- Changes in one instruction don't persist unless committed to a layer
- The final image contains all layers stacked together

---

## Understanding Docker Concepts

### Layers and Caching

Docker images are built in layers. Each instruction in a Dockerfile creates a new layer. Docker caches these layers, so if you change one instruction, only that layer and subsequent layers need to be rebuilt. This makes builds faster.

**What is a Layer?**

A layer is a filesystem change (addition, modification, or deletion of files). Each Dockerfile instruction that modifies the filesystem creates a new layer.

**How Layers Work:**

```dockerfile
FROM python:3.11-slim          # Layer 1: Base image (downloaded if not cached)
RUN apt-get update              # Layer 2: Updates package lists
RUN apt-get install -y git      # Layer 3: Installs git
COPY requirements.txt /app/     # Layer 4: Copies requirements file
RUN pip install -r requirements.txt  # Layer 5: Installs Python packages
COPY . /app/                    # Layer 6: Copies application code
CMD ["python", "app.py"]        # Layer 7: Sets default command (metadata, no filesystem change)
```

**Layer Caching Mechanism:**

Docker uses content-addressable storage. Each layer has a unique hash based on its content. When building:

1. **First Build**: All layers are created and cached
   ```
   Build 1:
   Layer 1: abc123 (FROM python:3.11-slim)
   Layer 2: def456 (RUN apt-get update)
   Layer 3: ghi789 (RUN apt-get install -y git)
   Layer 4: jkl012 (COPY requirements.txt)
   Layer 5: mno345 (RUN pip install)
   Layer 6: pqr678 (COPY . /app/)
   ```

2. **Second Build (no changes)**: All layers are reused from cache
   ```
   Build 2:
   Layer 1: Using cache abc123 ✓
   Layer 2: Using cache def456 ✓
   Layer 3: Using cache ghi789 ✓
   Layer 4: Using cache jkl012 ✓
   Layer 5: Using cache mno345 ✓
   Layer 6: Using cache pqr678 ✓
   ```

3. **Third Build (changed app.py)**: Only changed layer and subsequent layers rebuild
   ```
   Build 3:
   Layer 1: Using cache abc123 ✓
   Layer 2: Using cache def456 ✓
   Layer 3: Using cache ghi789 ✓
   Layer 4: Using cache jkl012 ✓
   Layer 5: Using cache mno345 ✓
   Layer 6: Rebuilding (app.py changed) → new hash: stu901
   ```

**Why This Matters:**

**Bad Example (Inefficient):**
```dockerfile
FROM python:3.11-slim
COPY . /app/                    # Layer 1: Copies everything
RUN pip install -r requirements.txt  # Layer 2: Installs packages
```

**Problem**: Every time you change ANY file in your project, Layer 1 changes, which invalidates Layer 2 cache, causing pip install to run again (slow!).

**Good Example (Efficient):**
```dockerfile
FROM python:3.11-slim
COPY requirements.txt /app/     # Layer 1: Copies only requirements
RUN pip install -r requirements.txt  # Layer 2: Installs packages
COPY . /app/                    # Layer 3: Copies application code
```

**Benefit**: Changing application code (Layer 3) doesn't invalidate Layer 1 or 2, so pip install is cached and fast!

**Layer Size Impact:**

Each layer adds to the final image size. Here's why combining commands matters:

**Bad (Creates 3 layers, larger size):**
```dockerfile
RUN apt-get update              # Layer 1: ~5MB (package lists)
RUN apt-get install -y python3 # Layer 2: ~50MB (python3)
RUN rm -rf /var/lib/apt/lists/* # Layer 3: ~-5MB (removes lists)
# Total: ~50MB
```

**Good (Creates 1 layer, smaller size):**
```dockerfile
RUN apt-get update \
    && apt-get install -y python3 \
    && rm -rf /var/lib/apt/lists/*
# Total: ~45MB (package lists removed in same layer)
```

**Inspecting Layers:**

You can see layers in your image:
```bash
# View layer history
docker history frappe/erpnext:version-15

# Output shows:
# IMAGE          CREATED         CREATED BY                                      SIZE
# abc123         2 hours ago     CMD ["gunicorn" "app:application"]             0B
# def456         2 hours ago     COPY --from=builder /home/frappe/frappe-bench  500MB
# ghi789         2 hours ago     USER frappe                                     0B
# jkl012         3 hours ago     RUN apt-get install ...                         200MB
```

### Base Images - 

A base image is the foundation of your Docker image. It typically contains an operating system and basic tools.

**How Base Images Work:**

When you write `FROM python:3.11-slim`, Docker:
1. Looks for the image locally
2. If not found, downloads it from Docker Hub (or configured registry)
3. Uses it as the starting point for your image

**Base Image Types Explained:**

**1. Official Python Images:**
```
python:3.11-slim
├── Full tag breakdown:
│   ├── python        → Repository name (official Python images)
│   ├── 3.11          → Python version
│   └── slim          → Variant (minimal Debian)
│
└── Available variants:
    ├── python:3.11          → Full Debian with many tools (~900MB)
    ├── python:3.11-slim     → Minimal Debian (~120MB) ← Recommended
    ├── python:3.11-alpine   → Alpine Linux (~45MB, but compatibility issues)
    └── python:3.11-bullseye → Specific Debian version
```

**2. Debian Base Images:**
```
debian:bookworm-slim
├── debian           → Official Debian images
├── bookworm         → Debian 12 codename
└── slim             → Minimal installation

Why use Debian?
- Stable and well-tested
- Good package availability
- Smaller than Ubuntu
- Used by Python official images
```

**3. Ubuntu Base Images:**
```
ubuntu:22.04
├── ubuntu    → Official Ubuntu images
└── 22.04     → Ubuntu version (LTS - Long Term Support)

When to use Ubuntu:
- Your team is familiar with Ubuntu
- Need Ubuntu-specific packages
- Larger image size is acceptable
```

**Choosing the Right Base Image:**

**For Frappe Projects - Recommended:**
```dockerfile
FROM python:3.11.6-slim-bookworm AS base
```

**Why:**
- `python:3.11.6` - Specific Python version (reproducible builds)
- `slim` - Smaller image size (~120MB vs ~900MB)
- `bookworm` - Debian 12, stable and well-supported
- Pre-installed Python means less setup

**Comparison Table:**

| Base Image | Size | Python Pre-installed | Use Case |
|------------|------|---------------------|----------|
| `python:3.11-slim` | ~120MB | Yes | **Recommended for Frappe** |
| `python:3.11` | ~900MB | Yes | When you need many tools |
| `debian:bookworm-slim` | ~80MB | No | When you want full control |
| `ubuntu:22.04` | ~200MB | No | When team prefers Ubuntu |
| `alpine:latest` | ~5MB | No | When size is critical (not recommended for Frappe) |

**Important Notes:**

1. **Tag Specificity**: Always use specific tags, not `latest`
   ```dockerfile
   # Bad: Can break when Python updates
   FROM python:latest
   
   # Good: Reproducible builds
   FROM python:3.11.6-slim-bookworm
   ```

2. **Architecture Support**: Most images support multiple architectures
   - `linux/amd64` (Intel/AMD 64-bit)
   - `linux/arm64` (ARM 64-bit, like Apple Silicon)
   - Docker automatically selects the right one

3. **Security**: Official images are regularly updated with security patches
   - Check for updates periodically
   - Use specific versions for production

### Build Context

The build context is the directory containing files you want to include in your image. When you run `docker build`, Docker sends the entire build context to the Docker daemon.

**How Build Context Works:**

```bash
# When you run this command:
docker build -t myimage .

# Docker does this:
# 1. Takes current directory (.) as build context
# 2. Sends ALL files in that directory to Docker daemon
# 3. Dockerfile instructions can only access files in the build context
```

**Build Context Example:**

```
my-project/
├── Dockerfile
├── app.py
├── requirements.txt
├── README.md
├── .git/
│   └── (many files)
├── node_modules/
│   └── (thousands of files)
└── .env

# When you run: docker build .
# Docker sends EVERYTHING to the daemon:
# - app.py ✓
# - requirements.txt ✓
# - README.md ✓ (probably don't need this)
# - .git/ ✗ (definitely don't need this)
# - node_modules/ ✗ (definitely don't need this)
# - .env ✗ (security risk!)
```

**Problem**: Sending unnecessary files:
- Slows down build (more data to transfer)
- Increases build context size
- Can expose sensitive files (.env, secrets)
- Includes files that change frequently (.git) breaking cache

**Solution: Use .dockerignore**

Create a `.dockerignore` file (similar to `.gitignore`):

```
# .dockerignore file
.git
.gitignore
*.md
README.md
.env
.env.*
node_modules
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info
dist/
build/
.vscode/
.idea/
*.log
.DS_Store
```

**How .dockerignore Works:**

```
my-project/
├── .dockerignore    ← Docker reads this first
├── Dockerfile
├── app.py
├── .git/            ← Excluded by .dockerignore
├── node_modules/   ← Excluded by .dockerignore
└── .env            ← Excluded by .dockerignore

# When you run: docker build .
# Docker sends ONLY:
# - app.py ✓
# - requirements.txt ✓
# - Dockerfile ✓
# Everything else is excluded!
```

**Build Context Size Impact:**

```bash
# Check build context size before building
du -sh .

# Without .dockerignore:
# Total: 500MB (includes .git, node_modules, etc.)

# With .dockerignore:
# Total: 5MB (only source code)
```

**Important Rules:**

1. **Build context path matters:**
   ```bash
   # These are different:
   docker build .                    # Current directory
   docker build ./subdirectory       # Subdirectory
   docker build /path/to/project     # Absolute path
   ```

2. **Dockerfile location:**
   ```bash
   # Dockerfile in build context root:
   docker build .
   
   # Dockerfile elsewhere:
   docker build -f /path/to/Dockerfile .
   # Still uses . as build context, but Dockerfile is at different path
   ```

3. **COPY paths are relative to build context:**
   ```dockerfile
   # If build context is /home/user/project/
   COPY app.py /app/           # Copies /home/user/project/app.py
   COPY src/main.py /app/      # Copies /home/user/project/src/main.py
   COPY ../other.py /app/      # ERROR! Can't go outside build context
   ```

**Best Practices:**

1. **Always use .dockerignore** - Exclude unnecessary files
2. **Keep build context small** - Only include what's needed
3. **Don't include secrets** - Use environment variables or secrets management
4. **Exclude version control** - .git directories are large and change frequently
5. **Exclude dependencies** - Install them in the image, don't copy them

---

## Dockerfile Basics

### Structure of a Dockerfile

A Dockerfile is a series of instructions, each on a new line. Instructions are executed in order from top to bottom.

### Basic Example

```dockerfile
# Start from a base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "app.py"]
```

---

## Dockerfile Instructions Explained

### FROM

**Purpose**: Specifies the base image to start from. This is the foundation of your Docker image.

**Syntax**: `FROM <image>[:<tag>] [AS <name>]`

**Detailed Breakdown:**
- `<image>`: The image name (e.g., `python`, `debian`, `ubuntu`)
- `[:<tag>]`: Optional version/tag (e.g., `3.11`, `bookworm`, `latest`)
- `[AS <name>]`: Optional stage name for multi-stage builds

**Examples with Explanations:**

```dockerfile
# Example 1: Basic usage
FROM python:3.11-slim
# Downloads python:3.11-slim from Docker Hub
# This image has Python 3.11 pre-installed on Debian slim

# Example 2: Specific version
FROM python:3.11.6-slim-bookworm
# Uses Python 3.11.6 specifically on Debian 12 (bookworm)
# More reproducible - same version every time

# Example 3: Named stage (for multi-stage builds)
FROM python:3.11-slim-bookworm AS base
# Creates a stage named "base" that can be referenced later
# Useful when you have multiple FROM statements

# Example 4: Using ARG for flexibility
ARG PYTHON_VERSION=3.11.6
ARG DEBIAN_BASE=bookworm
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base
# Allows overriding versions at build time:
# docker build --build-arg PYTHON_VERSION=3.12.0 .
```

**Important Rules:**

1. **FROM must be first** (except ARG statements before it):
   ```dockerfile
   # Valid:
   ARG PYTHON_VERSION=3.11.6
   FROM python:${PYTHON_VERSION}-slim
   
   # Invalid:
   RUN echo "test"
   FROM python:3.11-slim  # ERROR! FROM must come first
   ```

2. **Multiple FROM statements** create multi-stage builds:
   ```dockerfile
   FROM python:3.11-slim AS base
   # ... some instructions ...
   
   FROM base AS build
   # ... build instructions ...
   
   FROM base AS production
   # ... production instructions ...
   ```

3. **Tag behavior:**
   ```dockerfile
   FROM python:3.11-slim      # Uses 3.11-slim tag
   FROM python:latest          # Uses latest tag (not recommended)
   FROM python                # Also uses latest tag
   FROM python@sha256:abc123   # Uses specific digest (most specific)
   ```

**What Happens When FROM Executes:**

1. Docker checks if image exists locally
2. If not found, downloads from registry (Docker Hub by default)
3. Sets up the filesystem with that image's layers
4. Subsequent instructions build on top of this base

**Common Mistakes:**

```dockerfile
# Mistake 1: Using latest tag
FROM python:latest
# Problem: Version can change, breaking your builds
# Fix: Use specific version
FROM python:3.11.6-slim-bookworm

# Mistake 2: Wrong base for your needs
FROM alpine:latest
# Problem: Alpine uses musl libc, many Python packages don't work
# Fix: Use Debian-based image
FROM python:3.11-slim

# Mistake 3: Not specifying architecture
FROM python:3.11-slim
# Usually fine, but for multi-arch builds, specify:
FROM --platform=linux/amd64 python:3.11-slim
```

**Frappe-Specific FROM Examples:**

```dockerfile
# Recommended for Frappe projects:
ARG PYTHON_VERSION=3.11.6
ARG DEBIAN_BASE=bookworm
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base

# Why this is good:
# - Specific Python version (reproducible)
# - Debian bookworm (stable, well-supported)
# - Slim variant (smaller image size)
# - Named stage (can reference later)
# - Uses ARG (flexible for different versions)
```

### ARG - Build Arguments 

**Purpose**: Defines build-time variables that can be passed when building the image. These are only available during the build process, not in the running container.

**Syntax**: `ARG <name>[=<default>]`

**How ARG Works:**

ARG variables are available:
- During Dockerfile execution (build time)
- Can be used in RUN, COPY, and other instructions
- **NOT** available when container runs (runtime)

**Examples with Detailed Explanations:**

```dockerfile
# Example 1: Basic ARG with default value
ARG PYTHON_VERSION=3.11.6
FROM python:${PYTHON_VERSION}-slim
# If not specified at build time, uses 3.11.6
# Can override: docker build --build-arg PYTHON_VERSION=3.12.0 .

# Example 2: ARG without default (must be provided)
ARG FRAPPE_BRANCH
RUN bench init --frappe-branch=${FRAPPE_BRANCH} ...
# Must provide: docker build --build-arg FRAPPE_BRANCH=version-15 .

# Example 3: Multiple ARGs
ARG PYTHON_VERSION=3.11.6
ARG NODE_VERSION=18.18.2
ARG FRAPPE_BRANCH=version-15
# All can be overridden independently

# Example 4: ARG scope (important!)
ARG VERSION=1.0
FROM python:3.11-slim AS base
# VERSION is available here

FROM base AS build
ARG VERSION=1.0  # Must redeclare in new stage!
# VERSION from previous stage is NOT available here
# Each FROM starts a new scope
```

**ARG Scope Rules:**

```dockerfile
# Stage 1
ARG PYTHON_VERSION=3.11.6
FROM python:${PYTHON_VERSION}-slim AS base
RUN echo ${PYTHON_VERSION}  # Works: 3.11.6

# Stage 2
FROM base AS build
RUN echo ${PYTHON_VERSION}  # ERROR! PYTHON_VERSION not available
# Must redeclare:
ARG PYTHON_VERSION=3.11.6
RUN echo ${PYTHON_VERSION}  # Works: 3.11.6
```

**Using ARG in Build Commands:**

```bash
# Single ARG
docker build --build-arg PYTHON_VERSION=3.12.0 .

# Multiple ARGs
docker build \
    --build-arg PYTHON_VERSION=3.11.6 \
    --build-arg NODE_VERSION=18.20.0 \
    --build-arg FRAPPE_BRANCH=version-14 \
    .

# Using environment variable
export FRAPPE_BRANCH=version-15
docker build --build-arg FRAPPE_BRANCH=$FRAPPE_BRANCH .
```

**Common ARG Patterns for Frappe:**

```dockerfile
# Pattern 1: Version management
ARG PYTHON_VERSION=3.11.6
ARG NODE_VERSION=18.18.2
ARG FRAPPE_BRANCH=version-15
ARG FRAPPE_PATH=https://github.com/frappe/frappe

# Pattern 2: Conditional builds
ARG BUILD_TYPE=production
RUN if [ "$BUILD_TYPE" = "development" ]; then \
        apt-get install -y vim curl; \
    fi

# Pattern 3: Base64 encoded data (for custom apps)
ARG APPS_JSON_BASE64
RUN if [ -n "${APPS_JSON_BASE64}" ]; then \
        echo "${APPS_JSON_BASE64}" | base64 -d > /opt/apps.json; \
    fi
```

**ARG vs Environment Variables:**

```dockerfile
# ARG: Build-time only
ARG BUILD_DATE
RUN echo "Built on: ${BUILD_DATE}"

# When container runs, BUILD_DATE is NOT available
# docker run myimage env | grep BUILD_DATE  # Nothing!

# ENV: Available at runtime
ENV APP_VERSION=1.0.0
RUN echo "Version: ${APP_VERSION}"

# When container runs, APP_VERSION IS available
# docker run myimage env | grep APP_VERSION  # APP_VERSION=1.0.0
```

**Important Notes:**

1. **ARG values are not secrets** - They appear in image history
   ```bash
   docker history myimage
   # Shows: ARG DB_PASSWORD=secret123  ← Visible!
   ```

2. **ARG can be used before FROM** (only for FROM itself):
   ```dockerfile
   ARG PYTHON_VERSION=3.11.6
   FROM python:${PYTHON_VERSION}-slim
   # PYTHON_VERSION can be used in FROM
   ```

3. **ARG defaults are used if not provided**:
   ```dockerfile
   ARG VERSION=1.0
   # If you don't provide --build-arg VERSION=..., it uses 1.0
   ```

### ENV - Environment Variables 

**Purpose**: Sets environment variables that persist in the container at runtime. These are available both during build AND when the container runs.

**Syntax**: 
- `ENV <key>=<value>` (recommended)
- `ENV <key> <value>` (space-separated, less clear)

**How ENV Works:**

ENV variables are available:
- During Dockerfile execution (build time)
- When container runs (runtime)
- To all processes in the container
- Can be overridden at runtime with `-e` flag

**Examples with Detailed Explanations:**

```dockerfile
# Example 1: Single variable
ENV PYTHON_VERSION=3.11.6
# Sets PYTHON_VERSION=3.11.6
# Available in RUN commands and running container

# Example 2: Multiple variables (space-separated syntax)
ENV PYTHON_VERSION=3.11.6 NODE_VERSION=18.18.2
# Sets both variables

# Example 3: PATH modification (common pattern)
ENV PATH=/home/frappe/.local/bin:$PATH
# Prepends /home/frappe/.local/bin to existing PATH
# Now commands in that directory are found automatically

# Example 4: Using variables in other ENV statements
ENV NVM_DIR=/home/frappe/.nvm
ENV PATH=${NVM_DIR}/versions/node/v18.18.2/bin/:${PATH}
# Uses NVM_DIR variable in PATH definition
```

**ENV Scope:**

Unlike ARG, ENV persists across stages (unless overridden):

```dockerfile
# Stage 1
ENV APP_VERSION=1.0.0
FROM python:3.11-slim AS base
ENV APP_VERSION=1.0.0
RUN echo ${APP_VERSION}  # 1.0.0

# Stage 2
FROM base AS build
RUN echo ${APP_VERSION}  # Still 1.0.0 (inherited from base)
ENV APP_VERSION=2.0.0   # Can override
RUN echo ${APP_VERSION}  # 2.0.0
```

**ENV vs ARG - Complete Comparison:**

| Aspect | ARG | ENV |
|--------|-----|-----|
| **Available at build time** | Yes | Yes |
| **Available at runtime** | No | Yes |
| **Can override at build** | Yes (`--build-arg`) | Yes (`--build-arg`) |
| **Can override at runtime** | No | Yes (`-e` flag) |
| **Visible in image history** | Yes | Yes |
| **Persists across stages** | No (must redeclare) | Yes (inherited) |
| **Use case** | Build configuration | Runtime configuration |

**Practical Examples:**

```dockerfile
# Example 1: Build-time configuration (use ARG)
ARG FRAPPE_BRANCH=version-15
RUN bench init --frappe-branch=${FRAPPE_BRANCH} ...
# FRAPPE_BRANCH only needed during build

# Example 2: Runtime configuration (use ENV)
ENV DB_HOST=localhost
ENV DB_PORT=3306
# These are needed when container runs

# Example 3: Both (common pattern)
ARG BUILD_DATE
ENV BUILD_DATE=${BUILD_DATE}
# Pass build date as ARG, make it available at runtime as ENV
```

**Common ENV Patterns for Frappe:**

```dockerfile
# Pattern 1: PATH modifications
ENV PATH=/home/frappe/.local/bin:$PATH
ENV PATH=/home/frappe/frappe-bench/env/bin:$PATH
# Makes bench and Python commands available

# Pattern 2: Node.js/NVM setup
ENV NVM_DIR=/home/frappe/.nvm
ENV NODE_VERSION=18.18.2
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}
# Makes node and npm available

# Pattern 3: Application configuration
ENV FRAPPE_SITE_NAME_HEADER=$host
ENV UPSTREAM_REAL_IP_ADDRESS=127.0.0.1
# Runtime configuration for Frappe

# Pattern 4: Python environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# Python best practices
```

**Overriding ENV at Runtime:**

```bash
# Override single variable
docker run -e DB_HOST=db.example.com myimage

# Override multiple variables
docker run \
    -e DB_HOST=db.example.com \
    -e DB_PORT=5432 \
    myimage

# Use .env file
docker run --env-file .env myimage

# Override in docker-compose.yml
services:
  backend:
    environment:
      DB_HOST: db.example.com
      DB_PORT: 5432
```

**Best Practices:**

1. **Use ARG for build-time only**:
   ```dockerfile
   ARG FRAPPE_BRANCH=version-15  # Only needed during build
   ```

2. **Use ENV for runtime configuration**:
   ```dockerfile
   ENV DB_HOST=localhost  # Needed when container runs
   ```

3. **Don't put secrets in ENV** (they're visible):
   ```dockerfile
   # Bad:
   ENV DB_PASSWORD=secret123
   
   # Good: Use secrets management or -e flag
   docker run -e DB_PASSWORD=secret123 myimage
   ```

4. **Use specific syntax**:
   ```dockerfile
   # Good: Clear and explicit
   ENV PATH=/app/bin:$PATH
   
   # Avoid: Less clear
   ENV PATH /app/bin:$PATH
   ```

### RUN - Complete Command Execution Guide

**Purpose**: Executes commands in a new layer and commits the results. This is where you install packages, run scripts, and configure your environment.

**Syntax**: 
- Shell form: `RUN <command>` (uses `/bin/sh -c`)
- Exec form: `RUN ["executable", "param1", "param2"]` (direct execution)

**How RUN Works:**

1. Docker creates a new layer
2. Executes the command in that layer
3. Commits the changes (filesystem modifications)
4. Result becomes part of the image

**Shell Form vs Exec Form - Detailed Comparison:**

**Shell Form:**
```dockerfile
RUN apt-get update && apt-get install -y python3
```

**What happens:**
- Docker runs: `/bin/sh -c "apt-get update && apt-get install -y python3"`
- Shell processes the command (variable expansion, pipes, etc.)
- Can use shell features (&&, ||, $VARIABLE, etc.)

**Pros:**
- Can use shell features (variables, pipes, redirects)
- Easier to write complex commands
- Can chain commands with `&&`

**Cons:**
- Adds `/bin/sh` process (slight overhead)
- Shell might not be `/bin/sh` (could be `/bin/bash` or other)

**Exec Form:**
```dockerfile
RUN ["apt-get", "update"]
RUN ["apt-get", "install", "-y", "python3"]
```

**What happens:**
- Docker directly executes: `apt-get update` (no shell)
- No shell processing
- Each argument must be separate string

**Pros:**
- No shell overhead
- More explicit
- Avoids shell interpretation issues

**Cons:**
- Cannot use shell features (variables, pipes, etc.)
- More verbose
- Each RUN creates separate layer

**When to Use Which:**

```dockerfile
# Use Shell Form when:
# 1. You need shell features
RUN apt-get update && apt-get install -y python3

# 2. Using variables
RUN echo "Python version: ${PYTHON_VERSION}"

# 3. Chaining commands
RUN cd /app && python setup.py install

# 4. Using pipes or redirects
RUN cat file.txt | grep "pattern" > output.txt

# Use Exec Form when:
# 1. Simple, single command
RUN ["apt-get", "update"]

# 2. Want to avoid shell interpretation
RUN ["python", "script.py"]  # No shell variable expansion

# 3. Need specific executable path
RUN ["/usr/bin/python3", "script.py"]
```

**Multi-Line RUN Commands:**

For readability and layer optimization:

```dockerfile
# Single line (hard to read)
RUN apt-get update && apt-get install -y python3 git curl && rm -rf /var/lib/apt/lists/*

# Multi-line (much better!)
RUN apt-get update \
    && apt-get install -y \
        python3 \
        git \
        curl \
    && rm -rf /var/lib/apt/lists/*
```

**How Multi-Line Works:**
- `\` at end of line continues the command
- Indentation is optional but improves readability
- All commands run in same layer (one RUN = one layer)

**Common RUN Patterns for Frappe:**

**Pattern 1: Installing System Packages**
```dockerfile
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
        curl \
        git \
        nginx \
        mariadb-client \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*
```

**Explanation:**
- `apt-get update`: Updates package lists
- `DEBIAN_FRONTEND=noninteractive`: Prevents interactive prompts
- `--no-install-recommends`: Skips recommended packages (smaller image)
- `-y`: Auto-confirms installation
- `rm -rf /var/lib/apt/lists/*`: Removes package lists (saves ~50MB)
- All in one RUN = one layer

**Pattern 2: Installing Python Packages**
```dockerfile
RUN pip install --no-cache-dir frappe-bench
```

**Explanation:**
- `--no-cache-dir`: Doesn't store pip cache (saves space)
- Installs frappe-bench globally

**Pattern 3: Installing Node.js via NVM**
```dockerfile
RUN mkdir -p ${NVM_DIR} \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && nvm use v${NODE_VERSION} \
    && npm install -g yarn \
    && nvm alias default v${NODE_VERSION} \
    && rm -rf ${NVM_DIR}/.cache
```

**Explanation:**
- Creates NVM directory
- Downloads and installs NVM
- Sources NVM script (makes nvm command available)
- Installs specific Node.js version
- Switches to that version
- Installs yarn globally
- Sets default Node version
- Cleans cache

**Pattern 4: Conditional Installation**
```dockerfile
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        export ARCH=arm64; \
    fi \
    && if [ "$(uname -m)" = "x86_64" ]; then \
        export ARCH=amd64; \
    fi \
    && downloaded_file=wkhtmltox_${VERSION}.${DISTRO}_${ARCH}.deb \
    && curl -sLO https://.../$downloaded_file \
    && apt-get install -y ./$downloaded_file \
    && rm $downloaded_file
```

**Explanation:**
- Detects architecture (ARM64 or x86_64)
- Sets ARCH variable accordingly
- Downloads appropriate package
- Installs it
- Removes downloaded file

**Pattern 5: User and Permission Setup**
```dockerfile
RUN useradd -ms /bin/bash frappe \
    && echo "frappe ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers \
    && chown -R frappe:frappe /home/frappe
```

**Explanation:**
- `useradd -ms /bin/bash frappe`: Creates user with home directory and bash shell
- Adds sudo access without password
- Sets ownership of home directory

**Best Practices:**

1. **Combine related commands** (reduces layers):
   ```dockerfile
   # Bad: 3 layers
   RUN apt-get update
   RUN apt-get install -y python3
   RUN rm -rf /var/lib/apt/lists/*
   
   # Good: 1 layer
   RUN apt-get update \
       && apt-get install -y python3 \
       && rm -rf /var/lib/apt/lists/*
   ```

2. **Clean up in same RUN** (keeps image small):
   ```dockerfile
   RUN apt-get install -y package \
       && rm -rf /var/lib/apt/lists/* \
       && apt-get clean
   ```

3. **Use `--no-install-recommends`** (reduces size):
   ```dockerfile
   RUN apt-get install --no-install-recommends -y package
   ```

4. **Use `DEBIAN_FRONTEND=noninteractive`** (prevents prompts):
   ```dockerfile
   RUN DEBIAN_FRONTEND=noninteractive apt-get install -y package
   ```

5. **Order commands logically**:
   ```dockerfile
   RUN apt-get update \           # 1. Update first
       && apt-get install -y \   # 2. Install packages
           package1 \
           package2 \
       && rm -rf /var/lib/apt/lists/* \  # 3. Clean up
       && apt-get clean           # 4. Final cleanup
   ```

**Common Mistakes:**

```dockerfile
# Mistake 1: Not cleaning up apt cache
RUN apt-get install -y python3
# Problem: Leaves ~50MB of package lists
# Fix: Add rm -rf /var/lib/apt/lists/*

# Mistake 2: Multiple RUNs instead of one
RUN apt-get update
RUN apt-get install -y python3
# Problem: Creates 2 layers, slower builds
# Fix: Combine with &&

# Mistake 3: Not using --no-install-recommends
RUN apt-get install -y python3
# Problem: Installs unnecessary recommended packages
# Fix: Add --no-install-recommends

# Mistake 4: Variables not available
RUN echo $VARIABLE
# Problem: If VARIABLE is ARG, might not be in scope
# Fix: Ensure ARG is declared in same stage
```

**Debugging RUN Commands:**

```dockerfile
# Add debug output
RUN echo "Installing Python ${PYTHON_VERSION}" \
    && apt-get install -y python${PYTHON_VERSION}

# Test command separately
RUN apt-get update && apt-get install -y python3 || echo "Install failed"

# Check what's installed
RUN apt-get install -y python3 \
    && python3 --version \
    && which python3
```

### COPY - File Copying 

**Purpose**: Copies files or directories from the build context (or another stage) into the image. This is how you add your application code and files to the image.

**Syntax**: 
- `COPY <src> <dest>`
- `COPY ["<src>", "<dest>"]` (for paths with spaces)
- `COPY --chown=<user>:<group> <src> <dest>` (set ownership)
- `COPY --from=<stage> <src> <dest>` (copy from another stage)

**How COPY Works:**

1. Docker looks for `<src>` in the build context
2. Copies files/directories to `<dest>` in the image
3. Creates a new layer with these files
4. If files change, this layer and subsequent layers rebuild

**Basic Examples:**

```dockerfile
# Example 1: Copy single file
COPY requirements.txt /app/requirements.txt
# Copies requirements.txt from build context to /app/requirements.txt in image

# Example 2: Copy to current directory (if WORKDIR is set)
WORKDIR /app
COPY requirements.txt .
# Copies to /app/requirements.txt (WORKDIR is /app)

# Example 3: Copy entire directory
COPY . /app/
# Copies everything from build context to /app/ in image
# WARNING: Respects .dockerignore

# Example 4: Copy with wildcards
COPY *.py /app/
# Copies all .py files to /app/

# Example 5: Copy multiple files
COPY file1.txt file2.txt /app/
# Copies both files to /app/
```

**COPY Options Explained:**

**1. --chown (Set Ownership):**

```dockerfile
# Without --chown (owned by root)
COPY app.py /app/app.py
# File owned by root:root

# With --chown (owned by frappe user)
COPY --chown=frappe:frappe app.py /app/app.py
# File owned by frappe:frappe

# Using numeric IDs
COPY --chown=1000:1000 app.py /app/app.py
# File owned by UID 1000:GID 1000
```

**Why --chown matters:**
- If you switch to non-root user later, files might not be accessible
- Better to set ownership during copy
- Prevents permission issues

**2. --from (Multi-Stage Copy):**

```dockerfile
# Stage 1: Build
FROM python:3.11-slim AS builder
RUN pip install --user frappe-bench
# frappe-bench installed in /root/.local/bin

# Stage 2: Production
FROM python:3.11-slim
COPY --from=builder /root/.local/bin/bench /usr/local/bin/bench
# Copies bench from builder stage to production stage
```

**Common Multi-Stage COPY Pattern:**

```dockerfile
FROM python:3.11-slim AS build
# ... install build tools ...
RUN pip install frappe-bench
RUN bench init frappe-bench
# Bench created in /home/frappe/frappe-bench

FROM python:3.11-slim AS production
USER frappe
COPY --from=build --chown=frappe:frappe \
    /home/frappe/frappe-bench /home/frappe/frappe-bench
# Copies entire bench from build stage
```

**3. COPY vs ADD:**

```dockerfile
# COPY: Simple file copy (recommended)
COPY app.py /app/app.py
COPY requirements.txt /app/

# ADD: Can download URLs and extract archives
ADD https://example.com/file.tar.gz /tmp/
ADD file.tar.gz /tmp/  # Automatically extracts

# Recommendation: Use COPY unless you need ADD's features
```

**Path Rules:**

```dockerfile
# Paths are relative to build context
# If build context is /home/user/project/

COPY app.py /app/           # Copies /home/user/project/app.py
COPY src/main.py /app/      # Copies /home/user/project/src/main.py
COPY ../other.py /app/      # ERROR! Can't go outside build context

# Absolute paths in image
COPY app.py /app/app.py     # Destination is absolute
COPY app.py ./app.py        # Destination relative to WORKDIR
```

**COPY Best Practices:**

**1. Copy dependencies before code** (for better caching):

```dockerfile
# Good: Dependencies change less frequently
COPY requirements.txt /app/
RUN pip install -r requirements.txt
COPY . /app/  # Code changes don't invalidate pip install cache

# Bad: Code changes invalidate pip install
COPY . /app/
RUN pip install -r requirements.txt
```

**2. Use .dockerignore** (exclude unnecessary files):

```
# .dockerignore
.git
node_modules
*.pyc
.env
```

**3. Be specific** (copy only what you need):

```dockerfile
# Good: Specific files
COPY requirements.txt /app/
COPY app.py /app/

# Less ideal: Everything (but respects .dockerignore)
COPY . /app/
```

**4. Set ownership** (prevent permission issues):

```dockerfile
# Good: Set ownership during copy
COPY --chown=frappe:frappe app.py /app/

# Less ideal: Fix permissions later
COPY app.py /app/
RUN chown frappe:frappe /app/app.py
```

**Common COPY Patterns for Frappe:**

**Pattern 1: Copying Resources**
```dockerfile
COPY resources/nginx-template.conf /templates/nginx/frappe.conf.template
COPY resources/nginx-entrypoint.sh /usr/local/bin/nginx-entrypoint.sh
RUN chmod 755 /usr/local/bin/nginx-entrypoint.sh
```

**Pattern 2: Copying from Builder Stage**
```dockerfile
FROM build AS builder
RUN bench init frappe-bench
# ... bench created ...

FROM base AS backend
COPY --from=builder --chown=frappe:frappe \
    /home/frappe/frappe-bench /home/frappe/frappe-bench
```

**Pattern 3: Conditional Copy**
```dockerfile
# Copy different files based on build arg
ARG ENV=production
COPY config/${ENV}.conf /app/config.conf
```

**Troubleshooting COPY:**

```dockerfile
# Problem: File not found
COPY nonexistent.txt /app/
# Error: COPY failed: file not found in build context

# Solution: Check file exists in build context
# Use ls to verify:
RUN ls -la  # See what's available

# Problem: Permission denied
COPY app.py /app/
USER frappe
RUN python /app/app.py
# Error: Permission denied

# Solution: Set ownership during copy
COPY --chown=frappe:frappe app.py /app/
USER frappe
RUN python /app/app.py  # Works!
```

### ADD

**Purpose**: Similar to COPY but can also:
- Download files from URLs
- Extract tar files automatically

**Recommendation**: Prefer COPY unless you need ADD's special features.

### WORKDIR - Working Directory Guide

**Purpose**: Sets the working directory for subsequent instructions. All relative paths in RUN, CMD, ENTRYPOINT, COPY, and ADD will be relative to this directory.

**Syntax**: `WORKDIR <path>`

**How WORKDIR Works:**

```dockerfile
WORKDIR /app
# Now all subsequent commands run from /app

RUN pwd  # Output: /app
COPY file.txt .  # Copies to /app/file.txt
CMD ["python", "app.py"]  # Runs /app/app.py
```

**Key Features:**

1. **Creates directory if it doesn't exist:**
   ```dockerfile
   WORKDIR /nonexistent/directory
   # Docker automatically creates /nonexistent/directory
   ```

2. **Can be set multiple times:**
   ```dockerfile
   WORKDIR /home/frappe
   RUN pwd  # /home/frappe
   
   WORKDIR frappe-bench
   RUN pwd  # /home/frappe/frappe-bench (relative to previous WORKDIR)
   ```

3. **Affects all subsequent instructions:**
   ```dockerfile
   WORKDIR /app
   COPY file.txt .        # Copies to /app/file.txt
   RUN ls                 # Lists /app/
   CMD ["python", "app.py"]  # Runs /app/app.py
   ```

**Common Patterns:**

```dockerfile
# Pattern 1: Set once at the beginning
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "app.py"]

# Pattern 2: Change directory for different operations
WORKDIR /tmp
RUN download-file.sh
WORKDIR /app
COPY . .
```

**Frappe-Specific Example:**

```dockerfile
FROM base AS backend
USER frappe
COPY --from=builder /home/frappe/frappe-bench /home/frappe/frappe-bench

WORKDIR /home/frappe/frappe-bench
# Now all commands run from the bench directory

CMD ["/home/frappe/frappe-bench/env/bin/gunicorn", \
     "--chdir=/home/frappe/frappe-bench/sites", \
     "frappe.app:application"]
```

**Important Notes:**

- Always use absolute paths for WORKDIR (more predictable)
- WORKDIR doesn't change user (use USER for that)
- Relative paths in COPY are relative to build context, not WORKDIR
- WORKDIR affects where CMD/ENTRYPOINT run from

### USER - User and Security Guide

**Purpose**: Sets the user (and optionally group) to use for subsequent instructions. Critical for security - containers should not run as root.

**Syntax**: 
- `USER <user>[:<group>]` (username)
- `USER <UID>[:<GID>]` (numeric ID)

**Why USER Matters:**

Running as root is a security risk:
- If container is compromised, attacker has root access
- Can modify system files
- Can access host resources

**Creating a User:**

```dockerfile
# Method 1: useradd (most common)
RUN useradd -ms /bin/bash frappe
# -m: Create home directory
# -s /bin/bash: Set shell to bash
# frappe: Username

# Method 2: With specific UID/GID (for volume permissions)
RUN groupadd -g 1000 frappe \
    && useradd -u 1000 -g 1000 -ms /bin/bash frappe
# UID 1000 matches common host user IDs

# Method 3: With sudo access
RUN useradd -ms /bin/bash frappe \
    && echo "frappe ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
```

**Using USER:**

```dockerfile
# Switch to non-root user
USER frappe
# All subsequent commands run as frappe user

WORKDIR /home/frappe
RUN whoami  # Output: frappe
```

**Common Patterns:**

**Pattern 1: Create user, then switch**
```dockerfile
RUN useradd -ms /bin/bash frappe
USER frappe
WORKDIR /home/frappe
```

**Pattern 2: Switch between users**
```dockerfile
# Install as root
USER root
RUN apt-get install -y package

# Switch to app user
USER frappe
RUN app-command
```

**Pattern 3: Using numeric IDs**
```dockerfile
USER 1000:1000
# Uses UID 1000, GID 1000
# Useful when you know the host user's ID
```

**Frappe-Specific Example:**

```dockerfile
# Create frappe user
RUN useradd -ms /bin/bash frappe

# Do root operations
USER root
RUN apt-get install -y nginx
RUN chown -R frappe:frappe /etc/nginx

# Switch to frappe user
USER frappe
WORKDIR /home/frappe
COPY --chown=frappe:frappe frappe-bench /home/frappe/frappe-bench
```

**Important Notes:**

- USER affects all subsequent RUN, CMD, ENTRYPOINT instructions
- Files created before USER are owned by root (use --chown in COPY)
- USER doesn't change WORKDIR
- Use numeric IDs for consistency across systems

### EXPOSE - Port Documentation

**Purpose**: Documents which ports the container listens on. This is documentation only - it doesn't actually publish ports.

**Syntax**: `EXPOSE <port>[/<protocol>]`

**How EXPOSE Works:**

```dockerfile
EXPOSE 8000
# Documents that container listens on port 8000
# Does NOT make port accessible from host
```

**Examples:**

```dockerfile
# Single port
EXPOSE 8000

# Port with protocol (default is TCP)
EXPOSE 8000/tcp
EXPOSE 8000/udp

# Multiple ports
EXPOSE 8000 9000

# Port range
EXPOSE 8000-8005
```

**Important:** EXPOSE is documentation only!

```dockerfile
EXPOSE 8000
# This does NOT make port 8000 accessible
# You still need: docker run -p 8000:8000
```

**When to Use EXPOSE:**

1. **Documentation**: Shows which ports your app uses
2. **Docker Compose**: Can automatically map exposed ports
3. **Best Practice**: Document all ports your app listens on

**Frappe Example:**

```dockerfile
EXPOSE 8000-8005 9000-9005 6787
# Frappe uses:
# - 8000-8005: HTTP ports for different sites
# - 9000-9005: Socket.IO ports
# - 6787: Redis port (if included)
```

**Publishing Ports:**

```bash
# Map host port to container port
docker run -p 8000:8000 myimage
# Host:8000 → Container:8000

# Map different ports
docker run -p 8080:8000 myimage
# Host:8080 → Container:8000

# Map all exposed ports
docker run -P myimage
# Maps all EXPOSE ports to random host ports
```

### VOLUME - Persistent Data

**Purpose**: Creates a mount point for persistent data. Data in volumes persists even if the container is removed.

**Syntax**: `VOLUME ["/path/to/volume"]`

**How VOLUMES Work:**

```dockerfile
VOLUME ["/data"]
# Creates a mount point at /data
# Data written here persists beyond container lifetime
```

**Examples:**

```dockerfile
# Single volume
VOLUME ["/home/frappe/frappe-bench/sites"]

# Multiple volumes
VOLUME ["/data", "/logs"]

# Frappe-specific volumes
VOLUME [ \
    "/home/frappe/frappe-bench/sites", \
    "/home/frappe/frappe-bench/sites/assets", \
    "/home/frappe/frappe-bench/logs" \
]
```

**Why Use VOLUMES:**

1. **Data Persistence**: Data survives container removal
2. **Sharing**: Multiple containers can share volumes
3. **Backup**: Easier to backup volumes than container filesystem

**Volume Types:**

```bash
# Named volume (managed by Docker)
docker run -v mydata:/data myimage

# Bind mount (host directory)
docker run -v /host/path:/data myimage

# Anonymous volume (auto-created)
docker run -v /data myimage
```

**Frappe Volume Pattern:**

```dockerfile
VOLUME [ \
    "/home/frappe/frappe-bench/sites",        # Site data
    "/home/frappe/frappe-bench/sites/assets",  # Assets
    "/home/frappe/frappe-bench/logs"           # Logs
]
# These directories persist and can be shared between containers
```

**Important Notes:**

- VOLUME creates the directory if it doesn't exist
- Files copied before VOLUME are copied into the volume
- Volumes are independent of container lifecycle
- Use volumes for data that should persist

### CMD - Default Command

**Purpose**: Provides the default command to run when the container starts. This is the main process of your container.

**Syntax**: 
- Exec form: `CMD ["executable", "param1", "param2"]` (preferred)
- Shell form: `CMD command param1 param2`

**How CMD Works:**

```dockerfile
CMD ["python", "app.py"]
# When container starts: python app.py runs
# This becomes PID 1 (main process)
```

**Exec Form (Recommended):**

```dockerfile
CMD ["/home/frappe/frappe-bench/env/bin/gunicorn", \
     "--bind", "0.0.0.0:8000", \
     "frappe.app:application"]
```

**Why Exec Form:**
- No shell process (more efficient)
- Proper signal handling (SIGTERM works correctly)
- More explicit

**Shell Form:**

```dockerfile
CMD python app.py
# Docker runs: /bin/sh -c "python app.py"
```

**Why Shell Form:**
- Can use shell features (variables, pipes)
- Less efficient (adds shell process)
- Signal handling issues

**Important Rules:**

1. **Only one CMD per Dockerfile** (last one wins)
2. **Can be overridden at runtime:**
   ```bash
   docker run myimage /bin/bash  # Overrides CMD
   ```

3. **CMD sets default, ENTRYPOINT sets base command**

**Frappe CMD Example:**

```dockerfile
CMD [ \
    "/home/frappe/frappe-bench/env/bin/gunicorn", \
    "--chdir=/home/frappe/frappe-bench/sites", \
    "--bind=0.0.0.0:8000", \
    "--threads=4", \
    "--workers=2", \
    "--worker-class=gthread", \
    "--worker-tmp-dir=/dev/shm", \
    "--timeout=120", \
    "--preload", \
    "frappe.app:application" \
]
```

**Gunicorn Flags Explained:**
- `--chdir`: Change to sites directory
- `--bind`: Listen on all interfaces, port 8000
- `--threads`: 4 threads per worker
- `--workers`: 2 worker processes
- `--worker-class=gthread`: Use thread-based workers
- `--worker-tmp-dir=/dev/shm`: Use shared memory (faster)
- `--timeout`: Request timeout (120 seconds)
- `--preload`: Load app before forking workers
- `frappe.app:application`: WSGI application

### ENTRYPOINT - Base Command

**Purpose**: Similar to CMD but the command cannot be easily overridden. Parameters from CMD are appended to ENTRYPOINT.

**Syntax**: `ENTRYPOINT ["executable", "param1"]`

**How ENTRYPOINT + CMD Work Together:**

```dockerfile
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
# Final command: nginx -g daemon off;
```

**ENTRYPOINT vs CMD:**

| Aspect | ENTRYPOINT | CMD |
|--------|------------|-----|
| **Override** | Hard (need --entrypoint flag) | Easy (just provide command) |
| **Purpose** | Base command | Default parameters |
| **Combined** | ENTRYPOINT + CMD parameters | Parameters appended to ENTRYPOINT |

**Examples:**

```dockerfile
# ENTRYPOINT only
ENTRYPOINT ["python"]
# docker run myimage app.py → python app.py

# ENTRYPOINT + CMD
ENTRYPOINT ["python"]
CMD ["app.py"]
# docker run myimage → python app.py
# docker run myimage other.py → python other.py (CMD overridden)

# CMD only
CMD ["python", "app.py"]
# docker run myimage → python app.py
# docker run myimage /bin/bash → /bin/bash (CMD overridden)
```

**Common Pattern:**

```dockerfile
ENTRYPOINT ["/entrypoint.sh"]
CMD ["start"]
# entrypoint.sh handles start/stop/other commands
```

**When to Use ENTRYPOINT:**

- When you want a fixed base command
- When building wrapper scripts
- When you need consistent command structure

**Frappe Example:**

```dockerfile
# Entrypoint script that handles different commands
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["gunicorn"]
# entrypoint.sh can handle: gunicorn, worker, scheduler, etc.
```

### LABEL

**Purpose**: Adds metadata to the image.

**Syntax**: `LABEL <key>=<value>`

**Examples**:
```dockerfile
LABEL author=frappé
LABEL version="1.0"
LABEL maintainer="your@email.com"
```

---

## Multi-Stage Builds

### What are Multi-Stage Builds?

Multi-stage builds allow you to use multiple `FROM` statements in one Dockerfile. Each `FROM` starts a new build stage. You can copy files from previous stages.

### Why Use Multi-Stage Builds?

1. **Smaller Final Image**: Build tools and dependencies don't need to be in the final image
2. **Security**: Fewer attack surfaces in production image
3. **Efficiency**: Separate build and runtime environments

### Example Structure

```dockerfile
# Stage 1: Base image with runtime dependencies
FROM python:3.11-slim AS base
RUN apt-get update && apt-get install -y nginx

# Stage 2: Build stage with build tools
FROM base AS build
RUN apt-get install -y gcc build-essential
RUN pip install --user frappe-bench

# Stage 3: Builder stage - installs apps
FROM build AS builder
USER frappe
RUN bench init frappe-bench

# Stage 4: Final production image
FROM base AS backend
USER frappe
COPY --from=builder /home/frappe/frappe-bench /home/frappe/frappe-bench
CMD ["gunicorn", "app:application"]
```

### How It Works

1. Each `FROM` starts a new stage
2. `AS <name>` names the stage
3. `COPY --from=<stage>` copies from a previous stage
4. Only the final stage becomes the image (unless you specify a target)

### Building Specific Stages

```bash
# Build only the 'base' stage
docker build --target base -t myimage:base .

# Build the 'backend' stage (includes all previous stages)
docker build --target backend -t myimage:backend .
```

---

## Frappe-Specific Requirements

### Understanding Frappe Architecture

Frappe is a Python web framework that requires:
- **Python**: Runtime environment (typically 3.10+ or 3.11+)
- **Node.js**: For frontend assets and Socket.IO
- **Bench**: CLI tool for managing Frappe installations
- **Database**: MariaDB or PostgreSQL
- **Redis**: For caching and queues
- **Nginx**: Web server (optional, can use Gunicorn directly)

### Key Frappe Components

#### Bench
Bench is the CLI tool that manages Frappe installations. It handles:
- Creating benches (installations)
- Installing apps
- Managing sites
- Running workers and schedulers

#### Frappe Bench Structure
```
frappe-bench/
├── apps/              # Installed apps (frappe, erpnext, etc.)
├── sites/             # Site-specific data
│   ├── site1.local/
│   └── common_site_config.json
├── env/               # Python virtual environment
├── logs/              # Application logs
└── config/            # Bench configuration
```

### Frappe Dependencies

#### System Packages
- `git` - For cloning repositories
- `mariadb-client` or `postgresql-client` - Database clients
- `nginx` - Web server
- `wkhtmltopdf` - PDF generation
- `build-essential` - For compiling Python packages
- Various libraries for Python packages (libpq-dev, libmariadb-dev, etc.)

#### Python Packages
- `frappe-bench` - Bench CLI tool
- Frappe framework and apps installed via bench

#### Node.js Packages
- Installed via `yarn` or `npm` during bench setup
- Required for frontend assets

### Common Frappe Dockerfile Patterns

#### Pattern 1: Base Image Setup
```dockerfile
FROM python:3.11-slim-bookworm AS base

# Install system dependencies
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        git \
        nginx \
        mariadb-client \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install frappe-bench
RUN pip3 install frappe-bench
```

#### Pattern 2: Node.js Installation
```dockerfile
ENV NVM_DIR=/home/frappe/.nvm
ENV NODE_VERSION=18.18.2
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && nvm use v${NODE_VERSION} \
    && npm install -g yarn
```

#### Pattern 3: User Creation
```dockerfile
RUN useradd -ms /bin/bash frappe
USER frappe
WORKDIR /home/frappe
```

#### Pattern 4: Bench Initialization
```dockerfile
RUN bench init \
    --frappe-branch=version-15 \
    --frappe-path=https://github.com/frappe/frappe \
    --no-procfile \
    --no-backups \
    --skip-redis-config-generation \
    --verbose \
    /home/frappe/frappe-bench
```

---

## Step-by-Step: Creating Your First Frappe Dockerfile

### Step 1: Choose Your Base Image

For Frappe projects, start with a Python base image:

```dockerfile
ARG PYTHON_VERSION=3.11.6
ARG DEBIAN_BASE=bookworm
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base
```

**Why**: 
- Python is pre-installed
- `-slim` keeps image small
- `bookworm` is Debian 12 (stable and well-supported)

### Step 2: Define Build Arguments

```dockerfile
ARG WKHTMLTOPDF_VERSION=0.12.6.1-3
ARG WKHTMLTOPDF_DISTRO=bookworm
ARG NODE_VERSION=18.18.2
ARG FRAPPE_BRANCH=version-15
ARG FRAPPE_PATH=https://github.com/frappe/frappe
```

**Why**: Makes your Dockerfile flexible and reusable.

### Step 3: Set Environment Variables

```dockerfile
ENV NVM_DIR=/home/frappe/.nvm
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}
```

**Why**: Makes Node.js available system-wide.

### Step 4: Install System Dependencies

```dockerfile
RUN useradd -ms /bin/bash frappe \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        git \
        vim \
        nginx \
        gettext-base \
        file \
        # weasyprint dependencies
        libpango-1.0-0 \
        libharfbuzz0b \
        libpangoft2-1.0-0 \
        libpangocairo-1.0-0 \
        # Database clients
        mariadb-client \
        postgresql-client \
        libpq-dev \
        # Other tools
        wait-for-it \
        jq \
    && rm -rf /var/lib/apt/lists/*
```

**Why**:
- `--no-install-recommends`: Reduces image size
- `rm -rf /var/lib/apt/lists/*`: Removes package lists to save space
- All dependencies needed for Frappe

### Step 5: Install Node.js via NVM

```dockerfile
RUN mkdir -p ${NVM_DIR} \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && nvm use v${NODE_VERSION} \
    && npm install -g yarn \
    && nvm alias default v${NODE_VERSION} \
    && rm -rf ${NVM_DIR}/.cache \
    && echo 'export NVM_DIR="/home/frappe/.nvm"' >>/home/frappe/.bashrc \
    && echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >>/home/frappe/.bashrc
```

**Why**: Frappe requires Node.js for frontend assets and Socket.IO.

### Step 6: Install wkhtmltopdf

```dockerfile
RUN if [ "$(uname -m)" = "aarch64" ]; then export ARCH=arm64; fi \
    && if [ "$(uname -m)" = "x86_64" ]; then export ARCH=amd64; fi \
    && downloaded_file=wkhtmltox_${WKHTMLTOPDF_VERSION}.${WKHTMLTOPDF_DISTRO}_${ARCH}.deb \
    && curl -sLO https://github.com/wkhtmltopdf/packaging/releases/download/$WKHTMLTOPDF_VERSION/$downloaded_file \
    && apt-get install -y ./$downloaded_file \
    && rm $downloaded_file
```

**Why**: Required for PDF generation in Frappe.

### Step 7: Install Frappe Bench

```dockerfile
RUN pip3 install frappe-bench
```

**Why**: Bench is the CLI tool for managing Frappe.

### Step 8: Configure Nginx (if needed)

```dockerfile
RUN rm -fr /etc/nginx/sites-enabled/default \
    && sed -i '/user www-data/d' /etc/nginx/nginx.conf \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && touch /run/nginx.pid \
    && chown -R frappe:frappe /etc/nginx/conf.d \
    && chown -R frappe:frappe /etc/nginx/nginx.conf \
    && chown -R frappe:frappe /var/log/nginx \
    && chown -R frappe:frappe /var/lib/nginx \
    && chown -R frappe:frappe /run/nginx.pid
```

**Why**: Allows Nginx to run as non-root user (frappe).

### Step 9: Create Build Stage

```dockerfile
FROM base AS build

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
        wget \
        libpq-dev \
        libffi-dev \
        libmariadb-dev \
        gcc \
        build-essential \
        libbz2-dev \
    && rm -rf /var/lib/apt/lists/*

USER frappe
```

**Why**: Separates build dependencies from runtime dependencies.

### Step 10: Initialize Bench (Builder Stage)

```dockerfile
FROM build AS builder

ARG FRAPPE_BRANCH=version-15
ARG FRAPPE_PATH=https://github.com/frappe/frappe
ARG APPS_JSON_BASE64

# Handle custom apps if provided
RUN if [ -n "${APPS_JSON_BASE64}" ]; then \
        mkdir /opt/frappe && echo "${APPS_JSON_BASE64}" | base64 -d > /opt/frappe/apps.json; \
    fi

USER frappe

RUN export APP_INSTALL_ARGS="" && \
    if [ -n "${APPS_JSON_BASE64}" ]; then \
        export APP_INSTALL_ARGS="--apps_path=/opt/frappe/apps.json"; \
    fi && \
    bench init ${APP_INSTALL_ARGS} \
        --frappe-branch=${FRAPPE_BRANCH} \
        --frappe-path=${FRAPPE_PATH} \
        --no-procfile \
        --no-backups \
        --skip-redis-config-generation \
        --verbose \
        /home/frappe/frappe-bench && \
    cd /home/frappe/frappe-bench && \
    echo "{}" > sites/common_site_config.json && \
    find apps -mindepth 1 -path "*/.git" | xargs rm -fr
```

**Why**:
- `--no-procfile`: Don't create Procfile (we'll use CMD)
- `--no-backups`: Don't configure backups in image
- `--skip-redis-config-generation`: Configure at runtime
- Removes `.git` directories to reduce image size

### Step 11: Create Final Production Stage

```dockerfile
FROM base AS backend

USER frappe

# Copy bench from builder stage
COPY --from=builder --chown=frappe:frappe /home/frappe/frappe-bench /home/frappe/frappe-bench

WORKDIR /home/frappe/frappe-bench

# Define volumes for persistent data
VOLUME [ \
    "/home/frappe/frappe-bench/sites", \
    "/home/frappe/frappe-bench/sites/assets", \
    "/home/frappe/frappe-bench/logs" \
]

# Default command
CMD [ \
    "/home/frappe/frappe-bench/env/bin/gunicorn", \
    "--chdir=/home/frappe/frappe-bench/sites", \
    "--bind=0.0.0.0:8000", \
    "--threads=4", \
    "--workers=2", \
    "--worker-class=gthread", \
    "--worker-tmp-dir=/dev/shm", \
    "--timeout=120", \
    "--preload", \
    "frappe.app:application" \
]
```

**Why**:
- Only includes runtime dependencies
- Uses Gunicorn as WSGI server
- Volumes allow data persistence
- `--preload`: Loads application before forking workers

### Complete Example Dockerfile

```dockerfile
ARG PYTHON_VERSION=3.11.6
ARG DEBIAN_BASE=bookworm
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base

ARG WKHTMLTOPDF_VERSION=0.12.6.1-3
ARG WKHTMLTOPDF_DISTRO=bookworm
ARG NODE_VERSION=18.18.2
ENV NVM_DIR=/home/frappe/.nvm
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}

RUN useradd -ms /bin/bash frappe \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        git \
        vim \
        nginx \
        gettext-base \
        file \
        libpango-1.0-0 \
        libharfbuzz0b \
        libpangoft2-1.0-0 \
        libpangocairo-1.0-0 \
        mariadb-client \
        postgresql-client \
        libpq-dev \
        wait-for-it \
        jq \
    && mkdir -p ${NVM_DIR} \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && nvm use v${NODE_VERSION} \
    && npm install -g yarn \
    && nvm alias default v${NODE_VERSION} \
    && rm -rf ${NVM_DIR}/.cache \
    && echo 'export NVM_DIR="/home/frappe/.nvm"' >>/home/frappe/.bashrc \
    && echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >>/home/frappe/.bashrc \
    && if [ "$(uname -m)" = "aarch64" ]; then export ARCH=arm64; fi \
    && if [ "$(uname -m)" = "x86_64" ]; then export ARCH=amd64; fi \
    && downloaded_file=wkhtmltox_${WKHTMLTOPDF_VERSION}.${WKHTMLTOPDF_DISTRO}_${ARCH}.deb \
    && curl -sLO https://github.com/wkhtmltopdf/packaging/releases/download/$WKHTMLTOPDF_VERSION/$downloaded_file \
    && apt-get install -y ./$downloaded_file \
    && rm $downloaded_file \
    && rm -rf /var/lib/apt/lists/* \
    && rm -fr /etc/nginx/sites-enabled/default \
    && pip3 install frappe-bench \
    && sed -i '/user www-data/d' /etc/nginx/nginx.conf \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && touch /run/nginx.pid \
    && chown -R frappe:frappe /etc/nginx/conf.d \
    && chown -R frappe:frappe /etc/nginx/nginx.conf \
    && chown -R frappe:frappe /var/log/nginx \
    && chown -R frappe:frappe /var/lib/nginx \
    && chown -R frappe:frappe /run/nginx.pid

FROM base AS build

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
        wget \
        libpq-dev \
        libffi-dev \
        libmariadb-dev \
        gcc \
        build-essential \
        libbz2-dev \
    && rm -rf /var/lib/apt/lists/*

USER frappe

FROM build AS builder

ARG FRAPPE_BRANCH=version-15
ARG FRAPPE_PATH=https://github.com/frappe/frappe
ARG APPS_JSON_BASE64

RUN if [ -n "${APPS_JSON_BASE64}" ]; then \
        mkdir /opt/frappe && echo "${APPS_JSON_BASE64}" | base64 -d > /opt/frappe/apps.json; \
    fi

USER frappe

RUN export APP_INSTALL_ARGS="" && \
    if [ -n "${APPS_JSON_BASE64}" ]; then \
        export APP_INSTALL_ARGS="--apps_path=/opt/frappe/apps.json"; \
    fi && \
    bench init ${APP_INSTALL_ARGS} \
        --frappe-branch=${FRAPPE_BRANCH} \
        --frappe-path=${FRAPPE_PATH} \
        --no-procfile \
        --no-backups \
        --skip-redis-config-generation \
        --verbose \
        /home/frappe/frappe-bench && \
    cd /home/frappe/frappe-bench && \
    echo "{}" > sites/common_site_config.json && \
    find apps -mindepth 1 -path "*/.git" | xargs rm -fr

FROM base AS backend

USER frappe

COPY --from=builder --chown=frappe:frappe /home/frappe/frappe-bench /home/frappe/frappe-bench

WORKDIR /home/frappe/frappe-bench

VOLUME [ \
    "/home/frappe/frappe-bench/sites", \
    "/home/frappe/frappe-bench/sites/assets", \
    "/home/frappe/frappe-bench/logs" \
]

CMD [ \
    "/home/frappe/frappe-bench/env/bin/gunicorn", \
    "--chdir=/home/frappe/frappe-bench/sites", \
    "--bind=0.0.0.0:8000", \
    "--threads=4", \
    "--workers=2", \
    "--worker-class=gthread", \
    "--worker-tmp-dir=/dev/shm", \
    "--timeout=120", \
    "--preload", \
    "frappe.app:application" \
]
```

---

## Advanced Patterns

### Pattern 1: Custom Apps Installation

To install custom apps during build:

```dockerfile
ARG APPS_JSON_BASE64

RUN if [ -n "${APPS_JSON_BASE64}" ]; then \
        mkdir /opt/frappe && \
        echo "${APPS_JSON_BASE64}" | base64 -d > /opt/frappe/apps.json; \
    fi

RUN export APP_INSTALL_ARGS="" && \
    if [ -n "${APPS_JSON_BASE64}" ]; then \
        export APP_INSTALL_ARGS="--apps_path=/opt/frappe/apps.json"; \
    fi && \
    bench init ${APP_INSTALL_ARGS} ...
```

**Usage**:
```bash
# Create apps.json
cat > apps.json <<EOF
[
  {
    "url": "https://github.com/frappe/erpnext",
    "branch": "version-15"
  },
  {
    "url": "https://github.com/your-org/your-app",
    "branch": "main"
  }
]
EOF

# Base64 encode
export APPS_JSON_BASE64=$(base64 -w 0 apps.json)

# Build
docker build --build-arg APPS_JSON_BASE64=$APPS_JSON_BASE64 .
```

### Pattern 2: Copying Resources

```dockerfile
COPY resources/nginx-template.conf /templates/nginx/frappe.conf.template
COPY resources/nginx-entrypoint.sh /usr/local/bin/nginx-entrypoint.sh
RUN chmod 755 /usr/local/bin/nginx-entrypoint.sh
```

### Pattern 3: Conditional Installation

```dockerfile
ARG INSTALL_DEV_TOOLS=false

RUN if [ "$INSTALL_DEV_TOOLS" = "true" ]; then \
        apt-get install -y vim curl wget; \
    fi
```

### Pattern 4: Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/method/ping || exit 1
```

---

## Best Practices

### 1. Layer Ordering

Order instructions from least to most frequently changing:

```dockerfile
# 1. Base image (rarely changes)
FROM python:3.11-slim

# 2. System dependencies (changes occasionally)
RUN apt-get update && apt-get install -y ...

# 3. Python dependencies (changes more often)
COPY requirements.txt .
RUN pip install -r requirements.txt

# 4. Application code (changes most frequently)
COPY . .
```

### 2. Minimize Layers

Combine related commands:

```dockerfile
# Bad: Creates 3 layers
RUN apt-get update
RUN apt-get install -y python3
RUN rm -rf /var/lib/apt/lists/*

# Good: Creates 1 layer
RUN apt-get update \
    && apt-get install -y python3 \
    && rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore

Create `.dockerignore` to exclude unnecessary files:

```
.git
.gitignore
*.md
.env
node_modules
__pycache__
*.pyc
```

### 4. Don't Store Secrets

Never put secrets in Dockerfiles:

```dockerfile
# Bad
ENV DB_PASSWORD=secret123

# Good: Use environment variables at runtime
# docker run -e DB_PASSWORD=secret123 ...
```

### 5. Use Specific Tags

```dockerfile
# Bad: Can break when 'latest' changes
FROM python:latest

# Good: Specific version
FROM python:3.11.6-slim-bookworm
```

### 6. Run as Non-Root

```dockerfile
RUN useradd -ms /bin/bash frappe
USER frappe
```

### 7. Clean Up

Remove unnecessary files:

```dockerfile
RUN apt-get update \
    && apt-get install -y package \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean
```

### 8. Use Multi-Stage Builds

Separate build and runtime environments:

```dockerfile
FROM base AS build
# Build tools here

FROM base AS runtime
COPY --from=build /app/dist /app
# Only runtime dependencies
```

### 9. Document Ports

```dockerfile
EXPOSE 8000
EXPOSE 9000
```

### 10. Use Exec Form for CMD

```dockerfile
# Good: Exec form
CMD ["gunicorn", "app:application"]

# Avoid: Shell form (adds extra shell process)
CMD gunicorn app:application
```

---

## Common Patterns from frappe_docker

### Pattern 1: Base Image with Runtime Dependencies

From `images/production/Containerfile`:

```dockerfile
FROM python:3.11-slim-bookworm AS base

# Install runtime dependencies
RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        curl git nginx mariadb-client postgresql-client \
    && pip3 install frappe-bench \
    && rm -rf /var/lib/apt/lists/*
```

**Key Points**:
- Uses `-slim` variant for smaller size
- Installs only runtime dependencies
- Cleans up apt cache

### Pattern 2: Build Stage with Compilation Tools

```dockerfile
FROM base AS build

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        gcc build-essential libpq-dev libmariadb-dev \
    && rm -rf /var/lib/apt/lists/*
```

**Key Points**:
- Separate stage for build tools
- Only needed during build, not runtime

### Pattern 3: Builder Stage for Bench Initialization

```dockerfile
FROM build AS builder

USER frappe

RUN bench init \
    --frappe-branch=${FRAPPE_BRANCH} \
    --frappe-path=${FRAPPE_PATH} \
    --no-procfile \
    --no-backups \
    --skip-redis-config-generation \
    /home/frappe/frappe-bench
```

**Key Points**:
- Runs as non-root user
- Uses build args for flexibility
- Skips runtime configuration

### Pattern 4: Final Production Stage

```dockerfile
FROM base AS backend

USER frappe

COPY --from=builder --chown=frappe:frappe \
    /home/frappe/frappe-bench /home/frappe/frappe-bench

WORKDIR /home/frappe/frappe-bench

VOLUME ["/home/frappe/frappe-bench/sites"]

CMD ["/home/frappe/frappe-bench/env/bin/gunicorn", \
     "--bind=0.0.0.0:8000", \
     "frappe.app:application"]
```

**Key Points**:
- Only copies built bench
- Defines volumes for persistence
- Uses Gunicorn as WSGI server

### Pattern 5: Node.js Installation via NVM

```dockerfile
ENV NVM_DIR=/home/frappe/.nvm
ENV NODE_VERSION=18.18.2
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . ${NVM_DIR}/nvm.sh \
    && nvm install ${NODE_VERSION} \
    && npm install -g yarn
```

**Key Points**:
- Uses NVM for Node.js version management
- Updates PATH for Node.js
- Installs yarn globally

### Pattern 6: Architecture-Specific Installation

```dockerfile
RUN if [ "$(uname -m)" = "aarch64" ]; then export ARCH=arm64; fi \
    && if [ "$(uname -m)" = "x86_64" ]; then export ARCH=amd64; fi \
    && downloaded_file=wkhtmltox_${VERSION}.${DISTRO}_${ARCH}.deb \
    && curl -sLO https://.../$downloaded_file \
    && apt-get install -y ./$downloaded_file
```

**Key Points**:
- Detects architecture
- Downloads appropriate package
- Supports multiple architectures

### Pattern 7: Nginx Configuration for Non-Root

```dockerfile
RUN sed -i '/user www-data/d' /etc/nginx/nginx.conf \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && chown -R frappe:frappe /etc/nginx \
    && chown -R frappe:frappe /var/log/nginx
```

**Key Points**:
- Removes root user requirement
- Redirects logs to stdout/stderr
- Sets proper ownership

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Build Fails with "Permission Denied"

**Problem**: Trying to write to directories owned by root.

**Solution**: Switch to non-root user before operations:
```dockerfile
USER frappe
RUN bench init ...
```

#### Issue 2: Image Too Large

**Problem**: Image size is excessive.

**Solutions**:
- Use multi-stage builds
- Remove `.git` directories: `find apps -path "*/.git" | xargs rm -fr`
- Clean apt cache: `rm -rf /var/lib/apt/lists/*`
- Use `--no-install-recommends` with apt-get

#### Issue 3: Build Takes Too Long

**Problem**: Every build takes full time.

**Solutions**:
- Order instructions from least to most changing
- Use build cache effectively
- Consider using pre-built base images

#### Issue 4: Node.js Not Found

**Problem**: Node.js commands fail.

**Solution**: Ensure PATH is set correctly:
```dockerfile
ENV PATH=${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}
```

#### Issue 5: Bench Command Not Found

**Problem**: `bench` command not available.

**Solution**: Install frappe-bench:
```dockerfile
RUN pip3 install frappe-bench
```

#### Issue 6: Port Already in Use

**Problem**: Port conflict when running container.

**Solution**: Use `-p` flag to map ports:
```bash
docker run -p 8080:8000 myimage
```

#### Issue 7: Volume Permissions

**Problem**: Cannot write to volumes.

**Solution**: Set correct ownership:
```dockerfile
COPY --chown=frappe:frappe /source /dest
```

#### Issue 8: Build Args Not Working

**Problem**: ARG values not being used.

**Solution**: Pass build args correctly:
```bash
docker build --build-arg FRAPPE_BRANCH=version-14 .
```

### Debugging Tips

1. **Build with verbose output**:
   ```bash
   docker build --progress=plain .
   ```

2. **Run interactive shell**:
   ```bash
   docker run -it --entrypoint /bin/bash myimage
   ```

3. **Check image layers**:
   ```bash
   docker history myimage
   ```

4. **Inspect image**:
   ```bash
   docker inspect myimage
   ```

5. **Test specific stage**:
   ```bash
   docker build --target build -t test:build .
   docker run -it test:build /bin/bash
   ```

---

## Building and Using Your Dockerfile

### Building the Image

```bash
# Basic build
docker build -t myfrappe:latest .

# With build arguments
docker build \
    --build-arg PYTHON_VERSION=3.11.6 \
    --build-arg FRAPPE_BRANCH=version-15 \
    --build-arg APPS_JSON_BASE64=$APPS_JSON_BASE64 \
    -t myfrappe:1.0.0 \
    .

# Build specific stage
docker build --target backend -t myfrappe:backend .
```

### Running the Container

```bash
# Basic run
docker run -p 8000:8000 myfrappe:latest

# With environment variables
docker run \
    -p 8000:8000 \
    -e DB_HOST=db \
    -e DB_PORT=3306 \
    -v frappe-sites:/home/frappe/frappe-bench/sites \
    myfrappe:latest

# Interactive mode
docker run -it --entrypoint /bin/bash myfrappe:latest
```

### Using Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FRAPPE_BRANCH: version-15
        PYTHON_VERSION: 3.11.6
    image: myfrappe:latest
    ports:
      - "8000:8000"
    environment:
      DB_HOST: mariadb
      DB_PORT: 3306
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      - mariadb

  mariadb:
    image: mariadb:10.11
    environment:
      MYSQL_ROOT_PASSWORD: rootpass

volumes:
  sites:
```

---

## Conclusion

You now have a comprehensive understanding of:
- Docker fundamentals and concepts
- Dockerfile instructions and their usage
- Multi-stage builds and their benefits
- Frappe-specific requirements and patterns
- Best practices for writing efficient Dockerfiles
- Common patterns from the frappe_docker project
- Troubleshooting common issues

### Next Steps

1. **Practice**: Create your own Dockerfile for a Frappe project
2. **Experiment**: Try different base images and configurations
3. **Optimize**: Measure image sizes and build times
4. **Learn More**: Explore Docker Compose for multi-container setups
5. **Contribute**: Share your Dockerfiles and patterns with the community

### Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [frappe_docker Repository](https://github.com/frappe/frappe_docker)

---

**Remember**: Docker is a powerful tool, but it requires practice. Start simple, iterate, and gradually add complexity as you become more comfortable. Good luck with your Frappe Docker journey!