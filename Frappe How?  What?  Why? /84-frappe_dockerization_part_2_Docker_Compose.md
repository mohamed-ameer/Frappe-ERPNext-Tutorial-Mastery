# Writing Docker Compose Files for Frappe Projects

## Table of Contents
1. [Introduction to Docker Compose](#introduction-to-docker-compose)
2. [Understanding Docker Compose Concepts](#understanding-docker-compose-concepts)
3. [Docker Compose File Structure](#docker-compose-file-structure)
4. [YAML Syntax Basics](#yaml-syntax-basics)
5. [Service Configuration - Complete Guide](#service-configuration---complete-guide)
6. [Networks - Complete Guide](#networks---complete-guide)
7. [Volumes - Complete Guide](#volumes---complete-guide)
8. [Environment Variables](#environment-variables)
9. [Dependencies and Startup Order](#dependencies-and-startup-order)
10. [Frappe-Specific Patterns](#frappe-specific-patterns)
11. [Advanced Patterns](#advanced-patterns)
12. [Step-by-Step: Creating Your First Compose File](#step-by-step-creating-your-first-compose-file)
13. [Best Practices](#best-practices)
14. [Troubleshooting](#troubleshooting)

---

## Introduction to Docker Compose

### What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. Instead of running multiple `docker run` commands manually, you use a YAML file to configure all your services, networks, and volumes, then start everything with a single command.

**Real-World Analogy:**

Think of Docker Compose like a restaurant kitchen:
- **Docker**: Individual chef (container) cooking one dish
- **Docker Compose**: Kitchen manager coordinating multiple chefs, ensuring ingredients are ready, timing is right, and everything works together

**Why Docker Compose is Essential for Frappe:**

Frappe requires multiple services working together:
- **Backend**: Gunicorn serving Python application
- **Frontend**: Nginx serving static files and proxying requests
- **Websocket**: Socket.IO for real-time communication
- **Workers**: Background job processors (queue-short, queue-long)
- **Scheduler**: Cron-like task scheduler
- **Database**: MariaDB or PostgreSQL
- **Redis**: Cache and queue storage (2 instances: cache and queue)

Without Docker Compose, you'd need to:
```bash
# Manually start each container (tedious and error-prone)
docker run -d --name db mariadb:10.6
docker run -d --name redis-cache redis:6.2-alpine
docker run -d --name redis-queue redis:6.2-alpine
docker run -d --name backend --link db --link redis-cache frappe/erpnext
# ... and 5 more containers!
```

With Docker Compose:
```bash
# One command starts everything
docker compose up -d
```

### Key Benefits

1. **Single Command**: Start/stop entire application stack
2. **Configuration as Code**: All settings in one file (version controlled)
3. **Service Dependencies**: Automatically handles startup order
4. **Networking**: Services can communicate by name
5. **Volume Management**: Shared data between containers
6. **Environment Variables**: Centralized configuration
7. **Scaling**: Easy to scale services up/down

### Docker Compose vs Docker

| Aspect | Docker | Docker Compose |
|--------|--------|---------------|
| **Scope** | Single container | Multiple containers |
| **Configuration** | Command line flags | YAML file |
| **Networking** | Manual setup | Automatic |
| **Use Case** | Simple apps | Complex multi-service apps |
| **Frappe** | Not practical | Essential |

---

## Understanding Docker Compose Concepts

### Services

A **service** is a container definition in your compose file. Each service represents one container that will be created.

**Key Points:**
- One service = one container (or multiple if scaled)
- Services can communicate using service names as hostnames
- Each service has its own configuration (image, command, environment, etc.)

**Example:**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    # This creates a container named "backend"
  
  frontend:
    image: frappe/erpnext:version-15
    # This creates a container named "frontend"
```

**How Services Work:**

When you define a service, Docker Compose:
1. Creates a container from that service definition
2. Names it using the service name (or project prefix + service name)
3. Connects it to networks defined in the compose file
4. Mounts volumes as specified
5. Sets environment variables
6. Runs the specified command

### Networks

**Networks** allow containers to communicate with each other. Docker Compose automatically creates a network for your project.

**Key Points:**
- Containers on the same network can reach each other by service name
- Default network is created automatically
- You can create custom networks for isolation
- Services can be on multiple networks

**Example:**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    # Can access "db" service by hostname "db"
    environment:
      DB_HOST: db  # "db" resolves to the db service container
  
  db:
    image: mariadb:10.6
    # Can be accessed by other services as "db"
```

**How Networking Works:**

```
┌─────────────────────────────────────┐
│  Default Network (frappe_default)  │
│                                     │
│  ┌──────────┐    ┌──────────┐     │
│  │ backend  │───▶│    db    │     │
│  └──────────┘    └──────────┘     │
│       │                │           │
│       └────────────────┘           │
│            │                        │
│       ┌──────────┐                 │
│       │ frontend │                 │
│       └──────────┘                 │
└─────────────────────────────────────┘
```

**Service Discovery:**

Containers can find each other using service names:
- `backend` service can connect to `db:3306`
- `frontend` service can connect to `backend:8000`
- DNS resolution is automatic

### Volumes

**Volumes** are persistent storage that survives container removal. They allow data to be shared between containers and persist beyond container lifecycle.

**Key Points:**
- Data persists when containers are removed
- Can be shared between multiple containers
- Can be backed up and restored
- Two types: named volumes and bind mounts

**Example:**
```yaml
services:
  backend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      # Mounts "sites" volume to container path

volumes:
  sites:
    # Defines a named volume
```

**Volume Types:**

1. **Named Volumes** (managed by Docker):
   ```yaml
   volumes:
     sites:
   # Docker manages storage location
   # Best for production
   ```

2. **Bind Mounts** (host directory):
   ```yaml
   volumes:
     - /host/path:/container/path
   # Maps host directory to container
   # Useful for development
   ```

### Projects

A **project** is a group of services defined in a compose file. Docker Compose uses the project name to:
- Prefix container names
- Create network names
- Create volume names

**Default Project Name:**
- Uses directory name where `docker-compose.yml` is located
- Can be overridden with `-p` or `--project-name`

**Example:**
```bash
# Directory: /home/user/my-frappe-project
# Project name: my-frappe-project
# Containers: my-frappe-project-backend-1, my-frappe-project-db-1
```

---

## Docker Compose File Structure

### Basic Structure

A Docker Compose file is a YAML file (usually named `docker-compose.yml` or `compose.yaml`) with this structure:

```yaml
version: "3.8"  # Compose file format version (optional in v2)

services:       # Define your containers
  service1:
    # Service configuration
  service2:
    # Service configuration

networks:       # Define custom networks (optional)
  custom-network:
    # Network configuration

volumes:        # Define volumes (optional)
  data-volume:
    # Volume configuration
```

### File Naming

Docker Compose looks for these files (in order):
1. `compose.yaml` (preferred)
2. `compose.yml`
3. `docker-compose.yaml`
4. `docker-compose.yml`

**Best Practice**: Use `compose.yaml` (simpler, recommended by Docker)

### Version Field (Optional)

```yaml
version: "3.8"
```

**Note**: In Docker Compose v2 (current), the `version` field is optional. Docker automatically detects the format.

**When to Include Version:**
- If using Docker Compose v1 (older)
- For compatibility with older tools
- Can be omitted in v2

**Common Versions:**
- `"3.8"` - Latest v3 format (recommended if including version)
- `"3"` - Shorthand for 3.0
- `"2"` - Older format (deprecated)

---

## YAML Syntax Basics

### Understanding YAML

YAML (YAML Ain't Markup Language) is a human-readable data format. Docker Compose files use YAML syntax.

### Key YAML Rules

**1. Indentation Matters:**
```yaml
# Correct: 2 spaces (or consistent spaces)
services:
  backend:
    image: frappe/erpnext:version-15

# Wrong: Mixed indentation
services:
  backend:
  image: frappe/erpnext:version-15  # ERROR!
```

**2. Key-Value Pairs:**
```yaml
key: value
image: frappe/erpnext:version-15
port: 8000
```

**3. Lists (Arrays):**
```yaml
# Using dashes
ports:
  - "8000:8000"
  - "9000:9000"

# Inline format
ports: ["8000:8000", "9000:9000"]
```

**4. Multi-line Strings:**
```yaml
# Using > (folded, single line)
command: >
  bench worker
  --queue short,default

# Using | (literal, preserves newlines)
command: |
  bench worker
  --queue short,default
```

**5. Comments:**
```yaml
# This is a comment
services:
  backend:
    image: frappe/erpnext:version-15  # Inline comment
```

**6. Environment Variable Substitution:**
```yaml
environment:
  DB_HOST: ${DB_HOST:-localhost}  # Uses env var or default
  DB_PORT: ${DB_PORT:-3306}
```

**7. Anchors and Aliases (YAML feature):**
```yaml
# Define anchor
x-common-config: &common_config
  image: frappe/erpnext:version-15
  restart: unless-stopped

# Use anchor
services:
  backend:
    <<: *common_config  # Merges common_config
```

### Common YAML Mistakes

```yaml
# Mistake 1: Wrong indentation
services:
backend:  # ERROR! Should be indented
  image: frappe/erpnext

# Mistake 2: Missing quotes for special values
ports:
  - 8000:8000  # OK
  - "8000:8000"  # Also OK (safer)
  - "8080:8000"  # Required quotes for strings

# Mistake 3: Using tabs instead of spaces
services:
	backend:  # ERROR! Use spaces
    image: frappe/erpnext

# Mistake 4: Wrong list syntax
environment:
  - DB_HOST=db  # Wrong for key-value
environment:
  DB_HOST: db  # Correct
```

---

## Service Configuration - Complete Guide

### Image

**Purpose**: Specifies the Docker image to use for the service.

**Syntax**: `image: <image>[:<tag>]`

**Examples:**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    # Uses frappe/erpnext image with version-15 tag
  
  db:
    image: mariadb:10.6
    # Uses mariadb image with 10.6 tag
  
  redis:
    image: redis:6.2-alpine
    # Uses redis image with 6.2-alpine tag
```

**How Image Works:**

1. Docker Compose checks if image exists locally
2. If not found, pulls from registry (Docker Hub by default)
3. Uses that image to create container

**Using Environment Variables:**
```yaml
services:
  backend:
    image: ${CUSTOM_IMAGE:-frappe/erpnext}:${CUSTOM_TAG:-version-15}
    # Uses CUSTOM_IMAGE env var, defaults to frappe/erpnext
    # Uses CUSTOM_TAG env var, defaults to version-15
```

**Frappe Pattern:**
```yaml
x-customizable-image: &customizable_image
  image: ${CUSTOM_IMAGE:-frappe/erpnext}:${CUSTOM_TAG:-$ERPNEXT_VERSION}
  # Allows overriding image at runtime via .env file
```

### Build

**Purpose**: Builds an image from a Dockerfile instead of using a pre-built image.

**Syntax:**
```yaml
build:
  context: .           # Build context directory
  dockerfile: Dockerfile  # Dockerfile path (optional)
  args:                # Build arguments (optional)
    key: value
```

**Examples:**
```yaml
# Simple build
services:
  backend:
    build: .
    # Builds from Dockerfile in current directory

# With context and dockerfile
services:
  backend:
    build:
      context: ./app
      dockerfile: Dockerfile.prod
      args:
        PYTHON_VERSION: 3.11.6
        FRAPPE_BRANCH: version-15

# Build and tag
services:
  backend:
    build: .
    image: myfrappe:latest
    # Builds image and tags it as myfrappe:latest
```

**When to Use Build vs Image:**

- **Use `image`**: When using pre-built images (production, public images)
- **Use `build`**: When building custom images (development, custom Dockerfiles)

**Frappe Example:**
```yaml
# Production: Use pre-built image
services:
  backend:
    image: frappe/erpnext:version-15

# Development: Build from Dockerfile
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        FRAPPE_BRANCH: version-15
```

### Command

**Purpose**: Overrides the default command (CMD) from the Dockerfile.

**Syntax:**
```yaml
command: ["executable", "param1", "param2"]  # List form
command: executable param1 param2            # String form
```

**Examples:**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    # Uses default CMD from image (gunicorn)
  
  worker:
    image: frappe/erpnext:version-15
    command: bench worker --queue short,default
    # Overrides default command
  
  scheduler:
    image: frappe/erpnext:version-15
    command: bench schedule
    # Runs scheduler instead of gunicorn
```

**List vs String Form:**
```yaml
# List form (recommended)
command:
  - bench
  - worker
  - --queue
  - short,default

# String form
command: bench worker --queue short,default

# Multi-line string
command: >
  bench worker
  --queue short,default
```

**Frappe Patterns:**
```yaml
services:
  queue-short:
    command: bench worker --queue short,default
  
  queue-long:
    command: bench worker --queue long,default,short
  
  scheduler:
    command: bench schedule
  
  websocket:
    command:
      - node
      - /home/frappe/frappe-bench/apps/frappe/socketio.js
```

### Entrypoint

**Purpose**: Overrides the default entrypoint (ENTRYPOINT) from the Dockerfile.

**Syntax:**
```yaml
entrypoint: ["executable", "param"]
entrypoint: executable param
```

**Examples:**
```yaml
services:
  configurator:
    image: frappe/erpnext:version-15
    entrypoint:
      - bash
      - -c
    command: >
      bench set-config -g db_host $$DB_HOST;
      bench set-config -g redis_cache "redis://$$REDIS_CACHE";
```

**Entrypoint vs Command:**

- **Entrypoint**: Base command (harder to override)
- **Command**: Parameters passed to entrypoint

**Frappe Pattern:**
```yaml
services:
  configurator:
    entrypoint: ["bash", "-c"]
    command: >
      ls -1 apps > sites/apps.txt;
      bench set-config -g db_host $$DB_HOST;
      # Entrypoint runs bash -c, command becomes the script
```

### Environment Variables

**Purpose**: Sets environment variables for the container.

**Syntax:**
```yaml
environment:
  KEY: value
  KEY2: ${ENV_VAR:-default}
  
# Or using list format
environment:
  - KEY=value
  - KEY2=${ENV_VAR:-default}
```

**Examples:**
```yaml
services:
  backend:
    environment:
      DB_HOST: db
      DB_PORT: 3306
      REDIS_CACHE: redis-cache:6379
      REDIS_QUEUE: redis-queue:6379
  
  db:
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-admin}
      MARIADB_ROOT_PASSWORD: ${DB_PASSWORD:-admin}
```

**Environment Variable Substitution:**
```yaml
environment:
  # Use environment variable from host
  DB_HOST: ${DB_HOST}
  
  # With default value
  DB_PORT: ${DB_PORT:-3306}
  
  # Required (fails if not set)
  DB_PASSWORD: ${DB_PASSWORD:?No password set}
  
  # Escaping $ in compose (use $$)
  FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
```

**Using .env File:**
```bash
# .env file
DB_PASSWORD=secret123
DB_HOST=db
ERPNEXT_VERSION=version-15
```

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      DB_HOST: ${DB_HOST}  # Reads from .env
```

**Frappe Pattern:**
```yaml
services:
  configurator:
    environment:
      DB_HOST: ${DB_HOST:-}
      DB_PORT: ${DB_PORT:-}
      REDIS_CACHE: ${REDIS_CACHE:-}
      REDIS_QUEUE: ${REDIS_QUEUE:-}
      SOCKETIO_PORT: 9000
  
  frontend:
    environment:
      BACKEND: backend:8000
      SOCKETIO: websocket:9000
      FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
      UPSTREAM_REAL_IP_ADDRESS: ${UPSTREAM_REAL_IP_ADDRESS:-127.0.0.1}
```

### Volumes

**Purpose**: Mounts volumes or bind mounts into the container.

**Syntax:**
```yaml
volumes:
  - volume_name:/container/path        # Named volume
  - /host/path:/container/path         # Bind mount
  - /host/path:/container/path:ro      # Read-only
```

**Examples:**
```yaml
services:
  backend:
    volumes:
      # Named volume
      - sites:/home/frappe/frappe-bench/sites
      
      # Bind mount (development)
      - ./sites:/home/frappe/frappe-bench/sites
      
      # Read-only mount
      - config:/app/config:ro
      
      # Multiple volumes
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

volumes:
  sites:
  logs:
```

**Volume Types Explained:**

**1. Named Volumes (Production):**
```yaml
volumes:
  - sites:/home/frappe/frappe-bench/sites

volumes:
  sites:  # Docker manages this
```
- Managed by Docker
- Portable across systems
- Best for production

**2. Bind Mounts (Development):**
```yaml
volumes:
  - ./sites:/home/frappe/frappe-bench/sites
```
- Maps host directory
- Changes reflect immediately
- Useful for development

**3. Anonymous Volumes:**
```yaml
volumes:
  - /container/path
```
- Temporary, removed with container
- Rarely used

**Frappe Pattern:**
```yaml
services:
  backend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - sites:/home/frappe/frappe-bench/sites/assets
      - logs:/home/frappe/frappe-bench/logs
  
  frontend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      # Shares same volume as backend

volumes:
  sites:    # Shared between backend and frontend
  logs:     # Shared between all services
```

### Ports

**Purpose**: Maps container ports to host ports.

**Syntax:**
```yaml
ports:
  - "host_port:container_port"
  - "host_port:container_port/protocol"
```

**Examples:**
```yaml
services:
  frontend:
    ports:
      - "8080:8080"           # HTTP port
      - "8443:443"             # HTTPS port
      - "9000:9000/udp"        # UDP port
  
  backend:
    ports: []                  # No ports exposed (internal only)
```

**Port Mapping Explained:**
```yaml
ports:
  - "8080:8000"
  # Host:8080 → Container:8000
  # Access from host: http://localhost:8080
  # Reaches container port 8000
```

**Common Patterns:**
```yaml
# Single port
ports:
  - "8000:8000"

# Multiple ports
ports:
  - "8000:8000"
  - "9000:9000"

# Port range
ports:
  - "8000-8005:8000-8005"

# Random host port
ports:
  - "8000"  # Docker assigns random host port
```

**Frappe Pattern:**
```yaml
services:
  frontend:
    ports:
      - "${HTTP_PUBLISH_PORT:-8080}:8080"
      # Uses HTTP_PUBLISH_PORT from .env, defaults to 8080
```

### Networks

**Purpose**: Connects service to networks.

**Syntax:**
```yaml
networks:
  - network_name
  - another_network

# Or with configuration
networks:
  default:
    aliases:
      - alias1
```

**Examples:**
```yaml
services:
  backend:
    networks:
      - frappe_network
      - database_network
  
  frontend:
    networks:
      - frappe_network
      # Can reach backend via "backend" hostname

networks:
  frappe_network:
    driver: bridge
  database_network:
    driver: bridge
```

**Default Network:**
```yaml
services:
  backend:
    # Automatically on default network
    # No networks section needed
```

**Frappe Pattern:**
```yaml
services:
  backend:
    networks:
      - frappe_network
  
  db:
    networks:
      - frappe_network
    # backend can reach db as "db"

networks:
  frappe_network:
    driver: bridge
```

### Depends On

**Purpose**: Defines service dependencies and startup order.

**Syntax:**
```yaml
depends_on:
  - service_name
  - another_service

# With conditions
depends_on:
  service_name:
    condition: service_healthy
  another_service:
    condition: service_started
```

**Examples:**
```yaml
services:
  backend:
    depends_on:
      - db
      - redis-cache
    # Waits for db and redis-cache to start
  
  frontend:
    depends_on:
      - backend
      - websocket
    # Waits for backend and websocket
  
  configurator:
    depends_on:
      db:
        condition: service_healthy
    # Waits for db to be healthy (not just started)
```

**Dependency Conditions:**
- `service_started`: Service container started (default)
- `service_healthy`: Service passed health check
- `service_completed_successfully`: Service completed and exited successfully

**Frappe Pattern:**
```yaml
services:
  configurator:
    depends_on:
      db:
        condition: service_healthy
      redis-cache:
        condition: service_started
  
  backend:
    depends_on:
      configurator:
        condition: service_completed_successfully
    # Waits for configurator to finish before starting
```

### Restart Policy

**Purpose**: Defines when containers should restart.

**Syntax:**
```yaml
restart: always | unless-stopped | on-failure | no
```

**Options Explained:**
- `always`: Always restart (even after manual stop)
- `unless-stopped`: Restart unless manually stopped
- `on-failure`: Restart only on failure
- `no`: Never restart (default)

**Examples:**
```yaml
services:
  backend:
    restart: unless-stopped
    # Restarts automatically, but respects manual stop
  
  configurator:
    restart: on-failure
    # Only restarts if it fails
  
  db:
    restart: always
    # Always restarts (even if manually stopped)
```

**Frappe Pattern:**
```yaml
x-backend-defaults: &backend_defaults
  restart: ${RESTART_POLICY:-unless-stopped}
  # Configurable via .env file

services:
  configurator:
    restart: on-failure
    # Run once, restart only on failure
```

### Healthcheck

**Purpose**: Defines how to check if a service is healthy.

**Syntax:**
```yaml
healthcheck:
  test: ["CMD", "command"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Examples:**
```yaml
services:
  db:
    healthcheck:
      test: mysqladmin ping -h localhost --password=admin
      interval: 1s
      retries: 20
      timeout: 5s
      start_period: 10s
  
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/method/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Healthcheck Options:**
- `test`: Command to run (string or array)
- `interval`: Time between checks (default: 30s)
- `timeout`: Timeout for check (default: 10s)
- `retries`: Consecutive failures before unhealthy (default: 3)
- `start_period`: Grace period before counting failures (default: 0s)

**Frappe Pattern:**
```yaml
services:
  db:
    healthcheck:
      test: mysqladmin ping -h localhost --password=${DB_PASSWORD}
      interval: 1s
      retries: 20
    # Other services can depend on this with condition: service_healthy
```

### Platform

**Purpose**: Specifies the target platform (architecture).

**Syntax:**
```yaml
platform: linux/amd64 | linux/arm64
```

**Examples:**
```yaml
services:
  backend:
    platform: linux/amd64
    # Forces AMD64 architecture
  
  db:
    platform: linux/arm64
    # Forces ARM64 architecture (Apple Silicon)
```

**When to Use:**
- Multi-architecture builds
- Ensuring compatibility
- Development on different architectures

**Frappe Pattern:**
```yaml
services:
  backend:
    platform: linux/amd64
    # Ensures consistent architecture
```

### Working Directory

**Purpose**: Sets the working directory for the service.

**Syntax:**
```yaml
working_dir: /path/to/directory
```

**Examples:**
```yaml
services:
  backend:
    working_dir: /home/frappe/frappe-bench
    command: bench start
```

### User

**Purpose**: Runs the container as a specific user.

**Syntax:**
```yaml
user: "1000:1000"  # UID:GID
user: frappe        # Username
```

**Examples:**
```yaml
services:
  backend:
    user: frappe
    # Runs as frappe user instead of root
```

### Labels

**Purpose**: Adds metadata labels to containers.

**Syntax:**
```yaml
labels:
  - "key=value"
  - "key2=value2"

# Or
labels:
  key: value
  key2: value2
```

**Examples:**
```yaml
services:
  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`example.com`)"
```

**Frappe Pattern (Traefik):**
```yaml
services:
  frontend:
    labels:
      - traefik.enable=true
      - traefik.http.services.frontend.loadbalancer.server.port=8080
      - traefik.http.routers.frontend-http.entrypoints=websecure
      - traefik.http.routers.frontend-http.rule=Host(${SITES})
```

---

## Networks - Complete Guide

### Understanding Networks

Networks allow containers to communicate. Docker Compose automatically creates a default network for your project.

### Default Network

**Automatic Creation:**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    # Automatically on default network
  
  db:
    image: mariadb:10.6
    # Automatically on default network
    # backend can reach db as "db"
```

**Network Name:**
- Format: `<project>_default`
- Example: `myfrappe_default`

### Custom Networks

**Creating Custom Networks:**
```yaml
services:
  backend:
    networks:
      - frappe_network
  
  db:
    networks:
      - frappe_network

networks:
  frappe_network:
    driver: bridge
```

**Network Drivers:**
- `bridge`: Default, containers on same host
- `host`: Uses host network (Linux only)
- `overlay`: Multi-host networking (Swarm)

**Frappe Pattern:**
```yaml
networks:
  frappe_network:
    driver: bridge
    # Simple bridge network for all services
```

### Multiple Networks

**Service on Multiple Networks:**
```yaml
services:
  backend:
    networks:
      - frappe_network
      - database_network
  
  db:
    networks:
      - database_network

networks:
  frappe_network:
  database_network:
```

### Network Aliases

**Purpose**: Provides alternative names for services.

**Syntax:**
```yaml
networks:
  default:
    aliases:
      - alias1
      - alias2
```

**Example:**
```yaml
services:
  db:
    networks:
      default:
        aliases:
          - database
          - mysql
    # Can be reached as "db", "database", or "mysql"
```

---

## Volumes - Complete Guide

### Understanding Volumes

Volumes provide persistent storage that survives container removal.

### Named Volumes

**Definition:**
```yaml
volumes:
  sites:
    # Docker-managed volume
  
  logs:
    # Another volume
```

**Usage:**
```yaml
services:
  backend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
  
  frontend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      # Both share the same volume
```

**Volume Location:**
- Linux: `/var/lib/docker/volumes/<project>_<volume>/_data`
- Managed by Docker, don't access directly

### Bind Mounts

**Purpose**: Maps host directory to container.

**Syntax:**
```yaml
volumes:
  - /host/path:/container/path
  - ./relative/path:/container/path
```

**Examples:**
```yaml
services:
  backend:
    volumes:
      # Absolute path
      - /home/user/sites:/home/frappe/frappe-bench/sites
      
      # Relative path
      - ./sites:/home/frappe/frappe-bench/sites
      
      # Read-only
      - ./config:/app/config:ro
```

**When to Use:**
- **Named volumes**: Production (portable, managed)
- **Bind mounts**: Development (easy access, live changes)

### Volume Options

**Read-Only:**
```yaml
volumes:
  - config:/app/config:ro
```

**Volume Drivers:**
```yaml
volumes:
  data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /host/path
```

### Frappe Volume Pattern

```yaml
services:
  backend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - sites:/home/frappe/frappe-bench/sites/assets
      - logs:/home/frappe/frappe-bench/logs
  
  frontend:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
  
  queue-short:
    volumes:
      - sites:/home/frappe/frappe-bench/sites
      - logs:/home/frappe/frappe-bench/logs

volumes:
  sites:      # Shared site data
  logs:       # Shared logs
```

**Why This Pattern:**
- `sites` volume: Shared between all services (backend, frontend, workers)
- `logs` volume: Shared logs for all services
- Data persists when containers restart

---

## Environment Variables

### Using .env File

**Create .env file:**
```bash
# .env
ERPNEXT_VERSION=version-15
DB_PASSWORD=secret123
DB_HOST=db
DB_PORT=3306
REDIS_CACHE=redis-cache:6379
REDIS_QUEUE=redis-queue:6379
```

**Reference in compose file:**
```yaml
services:
  backend:
    environment:
      DB_HOST: ${DB_HOST}
      DB_PORT: ${DB_PORT:-3306}
      DB_PASSWORD: ${DB_PASSWORD:?No password set}
```

### Variable Substitution Syntax

```yaml
# Basic substitution
${VARIABLE}

# With default
${VARIABLE:-default}

# Required (fails if not set)
${VARIABLE:?Error message}

# Escaping $ (use $$)
FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
```

### Frappe Environment Variables

**Common Variables:**
```bash
# .env
ERPNEXT_VERSION=v15.60.1
DB_PASSWORD=123
DB_HOST=db
DB_PORT=3306
REDIS_CACHE=redis-cache:6379
REDIS_QUEUE=redis-queue:6379
FRAPPE_SITE_NAME_HEADER=frontend
HTTP_PUBLISH_PORT=8080
LETSENCRYPT_EMAIL=admin@example.com
```

---

## Dependencies and Startup Order

### Understanding Depends On

**Basic Dependency:**
```yaml
services:
  backend:
    depends_on:
      - db
    # Waits for db to start before starting backend
```

### Dependency Conditions

**1. service_started (default):**
```yaml
depends_on:
  - db
# Waits for db container to start
```

**2. service_healthy:**
```yaml
depends_on:
  db:
    condition: service_healthy
# Waits for db healthcheck to pass
```

**3. service_completed_successfully:**
```yaml
depends_on:
  configurator:
    condition: service_completed_successfully
# Waits for configurator to finish and exit successfully
```

### Frappe Startup Order

**Typical Order:**
1. `db` - Database starts
2. `redis-cache`, `redis-queue` - Redis starts
3. `configurator` - Configures common_site_config.json (runs once)
4. `backend`, `websocket` - Application services
5. `frontend` - Depends on backend and websocket
6. `queue-short`, `queue-long`, `scheduler` - Background workers

**Example:**
```yaml
services:
  db:
    healthcheck:
      test: mysqladmin ping -h localhost
  
  configurator:
    depends_on:
      db:
        condition: service_healthy
  
  backend:
    depends_on:
      configurator:
        condition: service_completed_successfully
  
  frontend:
    depends_on:
      - backend
      - websocket
```

---

## Frappe-Specific Patterns

### Pattern 1: Configurator Service

**Purpose**: Configures `common_site_config.json` before other services start.

```yaml
services:
  configurator:
    image: frappe/erpnext:version-15
    entrypoint: ["bash", "-c"]
    command: >
      ls -1 apps > sites/apps.txt;
      bench set-config -g db_host $$DB_HOST;
      bench set-config -gp db_port $$DB_PORT;
      bench set-config -g redis_cache "redis://$$REDIS_CACHE";
      bench set-config -g redis_queue "redis://$$REDIS_QUEUE";
      bench set-config -g redis_socketio "redis://$$REDIS_QUEUE";
      bench set-config -gp socketio_port $$SOCKETIO_PORT;
    environment:
      DB_HOST: ${DB_HOST:-db}
      DB_PORT: ${DB_PORT:-3306}
      REDIS_CACHE: ${REDIS_CACHE:-redis-cache:6379}
      REDIS_QUEUE: ${REDIS_QUEUE:-redis-queue:6379}
      SOCKETIO_PORT: 9000
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      db:
        condition: service_healthy
    restart: on-failure
```

**Key Points:**
- Runs once and exits
- Creates `common_site_config.json`
- Other services depend on it completing

### Pattern 2: Backend Service

```yaml
services:
  backend:
    image: frappe/erpnext:version-15
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
    # Uses default CMD from image (gunicorn)
```

### Pattern 3: Frontend Service

```yaml
services:
  frontend:
    image: frappe/erpnext:version-15
    command: nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      SOCKETIO: websocket:9000
      FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
      UPSTREAM_REAL_IP_ADDRESS: ${UPSTREAM_REAL_IP_ADDRESS:-127.0.0.1}
      UPSTREAM_REAL_IP_HEADER: ${UPSTREAM_REAL_IP_HEADER:-X-Forwarded-For}
      PROXY_READ_TIMEOUT: ${PROXY_READ_TIMEOUT:-120}
      CLIENT_MAX_BODY_SIZE: ${CLIENT_MAX_BODY_SIZE:-50m}
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    ports:
      - "${HTTP_PUBLISH_PORT:-8080}:8080"
    depends_on:
      - backend
      - websocket
```

### Pattern 4: Worker Services

```yaml
services:
  queue-short:
    image: frappe/erpnext:version-15
    command: bench worker --queue short,default
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
  
  queue-long:
    image: frappe/erpnext:version-15
    command: bench worker --queue long,default,short
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
  
  scheduler:
    image: frappe/erpnext:version-15
    command: bench schedule
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
```

### Pattern 5: Database Service

```yaml
services:
  db:
    image: mariadb:10.6
    healthcheck:
      test: mysqladmin ping -h localhost --password=${DB_PASSWORD}
      interval: 1s
      retries: 20
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --skip-character-set-client-handshake
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:?No db password set}
      MARIADB_ROOT_PASSWORD: ${DB_PASSWORD:?No db password set}
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db-data:
```

### Pattern 6: Redis Services

```yaml
services:
  redis-cache:
    image: redis:6.2-alpine
    restart: unless-stopped
    # No volumes - cache doesn't need persistence
  
  redis-queue:
    image: redis:6.2-alpine
    restart: unless-stopped
    volumes:
      - redis-queue-data:/data
    # Queue data should persist

volumes:
  redis-queue-data:
```

---

## Advanced Patterns

### YAML Anchors and Aliases

**Purpose**: Reuse configuration blocks.

**Define Anchor:**
```yaml
x-customizable-image: &customizable_image
  image: ${CUSTOM_IMAGE:-frappe/erpnext}:${CUSTOM_TAG:-$ERPNEXT_VERSION}
  pull_policy: ${PULL_POLICY:-always}
  restart: ${RESTART_POLICY:-unless-stopped}
```

**Use Anchor:**
```yaml
services:
  backend:
    <<: *customizable_image
    # Merges all properties from anchor
  
  frontend:
    <<: *customizable_image
    command: nginx-entrypoint.sh
```

**Multiple Anchors:**
```yaml
x-backend-defaults: &backend_defaults
  <<: [*depends_on_configurator, *customizable_image]
  volumes:
    - sites:/home/frappe/frappe-bench/sites

services:
  backend:
    <<: *backend_defaults
    # Gets all properties from backend_defaults
```

### Compose File Overrides

**Purpose**: Override base compose file with additional configurations.

**Base File (compose.yaml):**
```yaml
services:
  backend:
    image: frappe/erpnext:version-15
```

**Override File (overrides/compose.mariadb.yaml):**
```yaml
services:
  db:
    image: mariadb:10.6
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
```

**Usage:**
```bash
docker compose -f compose.yaml -f overrides/compose.mariadb.yaml up
```

**How Overrides Work:**
- Later files override earlier files
- Merges services, adds new ones
- Useful for different environments

### Extending Services

**Purpose**: Reuse service definitions.

**Base Service:**
```yaml
services:
  backend-base:
    image: frappe/erpnext:version-15
    volumes:
      - sites:/home/frappe/frappe-bench/sites
```

**Extended Service:**
```yaml
services:
  backend:
    extends:
      service: backend-base
    command: bench worker --queue short
```

---

## Step-by-Step: Creating Your First Compose File

### Step 1: Basic Structure

```yaml
services:

volumes:

networks:
```

### Step 2: Add Database Service

```yaml
services:
  db:
    image: mariadb:10.6
    healthcheck:
      test: mysqladmin ping -h localhost --password=${DB_PASSWORD}
      interval: 1s
      retries: 20
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-admin}
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

volumes:
  db-data:
```

### Step 3: Add Redis Services

```yaml
services:
  # ... db service ...
  
  redis-cache:
    image: redis:6.2-alpine
    restart: unless-stopped
  
  redis-queue:
    image: redis:6.2-alpine
    restart: unless-stopped
    volumes:
      - redis-queue-data:/data

volumes:
  db-data:
  redis-queue-data:
```

### Step 4: Add Configurator

```yaml
services:
  # ... previous services ...
  
  configurator:
    image: frappe/erpnext:version-15
    entrypoint: ["bash", "-c"]
    command: >
      bench set-config -g db_host $$DB_HOST;
      bench set-config -gp db_port $$DB_PORT;
      bench set-config -g redis_cache "redis://$$REDIS_CACHE";
      bench set-config -g redis_queue "redis://$$REDIS_QUEUE";
    environment:
      DB_HOST: ${DB_HOST:-db}
      DB_PORT: ${DB_PORT:-3306}
      REDIS_CACHE: ${REDIS_CACHE:-redis-cache:6379}
      REDIS_QUEUE: ${REDIS_QUEUE:-redis-queue:6379}
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      db:
        condition: service_healthy
    restart: on-failure

volumes:
  db-data:
  redis-queue-data:
  sites:
```

### Step 5: Add Backend Service

```yaml
services:
  # ... previous services ...
  
  backend:
    image: frappe/erpnext:version-15
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
```

### Step 6: Add Frontend Service

```yaml
services:
  # ... previous services ...
  
  frontend:
    image: frappe/erpnext:version-15
    command: nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      SOCKETIO: websocket:9000
      FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    ports:
      - "${HTTP_PUBLISH_PORT:-8080}:8080"
    depends_on:
      - backend
      - websocket
    restart: unless-stopped
```

### Step 7: Add Workers and Scheduler

```yaml
services:
  # ... previous services ...
  
  queue-short:
    image: frappe/erpnext:version-15
    command: bench worker --queue short,default
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
  
  queue-long:
    image: frappe/erpnext:version-15
    command: bench worker --queue long,default,short
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
  
  scheduler:
    image: frappe/erpnext:version-15
    command: bench schedule
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
  
  websocket:
    image: frappe/erpnext:version-15
    command:
      - node
      - /home/frappe/frappe-bench/apps/frappe/socketio.js
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped
```

### Complete Example

```yaml
services:
  db:
    image: mariadb:10.6
    healthcheck:
      test: mysqladmin ping -h localhost --password=${DB_PASSWORD:-admin}
      interval: 1s
      retries: 20
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-admin}
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

  redis-cache:
    image: redis:6.2-alpine
    restart: unless-stopped

  redis-queue:
    image: redis:6.2-alpine
    restart: unless-stopped
    volumes:
      - redis-queue-data:/data

  configurator:
    image: frappe/erpnext:version-15
    entrypoint: ["bash", "-c"]
    command: >
      bench set-config -g db_host $$DB_HOST;
      bench set-config -gp db_port $$DB_PORT;
      bench set-config -g redis_cache "redis://$$REDIS_CACHE";
      bench set-config -g redis_queue "redis://$$REDIS_QUEUE";
    environment:
      DB_HOST: ${DB_HOST:-db}
      DB_PORT: ${DB_PORT:-3306}
      REDIS_CACHE: ${REDIS_CACHE:-redis-cache:6379}
      REDIS_QUEUE: ${REDIS_QUEUE:-redis-queue:6379}
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      db:
        condition: service_healthy
    restart: on-failure

  backend:
    image: frappe/erpnext:version-15
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped

  frontend:
    image: frappe/erpnext:version-15
    command: nginx-entrypoint.sh
    environment:
      BACKEND: backend:8000
      SOCKETIO: websocket:9000
      FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    ports:
      - "${HTTP_PUBLISH_PORT:-8080}:8080"
    depends_on:
      - backend
      - websocket
    restart: unless-stopped

  websocket:
    image: frappe/erpnext:version-15
    command:
      - node
      - /home/frappe/frappe-bench/apps/frappe/socketio.js
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped

  queue-short:
    image: frappe/erpnext:version-15
    command: bench worker --queue short,default
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped

  queue-long:
    image: frappe/erpnext:version-15
    command: bench worker --queue long,default,short
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped

  scheduler:
    image: frappe/erpnext:version-15
    command: bench schedule
    volumes:
      - sites:/home/frappe/frappe-bench/sites
    depends_on:
      configurator:
        condition: service_completed_successfully
    restart: unless-stopped

volumes:
  db-data:
  redis-queue-data:
  sites:
```

---

## Best Practices

### 1. Use Environment Variables

```yaml
# Good: Configurable
image: ${CUSTOM_IMAGE:-frappe/erpnext}:${CUSTOM_TAG:-version-15}

# Bad: Hard-coded
image: frappe/erpnext:version-15
```

### 2. Use Named Volumes for Production

```yaml
# Good: Named volume
volumes:
  - sites:/home/frappe/frappe-bench/sites

# Development only: Bind mount
volumes:
  - ./sites:/home/frappe/frappe-bench/sites
```

### 3. Set Health Checks

```yaml
services:
  db:
    healthcheck:
      test: mysqladmin ping -h localhost
      interval: 1s
      retries: 20
```

### 4. Use Depends On with Conditions

```yaml
depends_on:
  db:
    condition: service_healthy
  configurator:
    condition: service_completed_successfully
```

### 5. Set Restart Policies

```yaml
restart: unless-stopped  # For long-running services
restart: on-failure      # For one-time tasks
```

### 6. Use YAML Anchors for Reusability

```yaml
x-common-config: &common_config
  image: frappe/erpnext:version-15
  restart: unless-stopped

services:
  backend:
    <<: *common_config
```

### 7. Document with Comments

```yaml
services:
  configurator:
    # Configures common_site_config.json before other services start
    # Runs once and exits
```

### 8. Version Control Your Compose Files

- Keep compose files in git
- Use .env.example (don't commit .env with secrets)
- Document required environment variables

---

## Troubleshooting

### Common Issues

#### Issue 1: Services Can't Connect

**Problem**: Services can't reach each other.

**Solutions:**
```yaml
# Ensure services are on same network
services:
  backend:
    networks:
      - frappe_network
  db:
    networks:
      - frappe_network

# Use service names as hostnames
environment:
  DB_HOST: db  # Not localhost!
```

#### Issue 2: Volume Permissions

**Problem**: Permission denied errors.

**Solutions:**
```yaml
# Set user in service
services:
  backend:
    user: frappe

# Or fix permissions in entrypoint
```

#### Issue 3: Services Start Too Early

**Problem**: Services start before dependencies are ready.

**Solutions:**
```yaml
depends_on:
  db:
    condition: service_healthy  # Wait for health check
  configurator:
    condition: service_completed_successfully
```

#### Issue 4: Environment Variables Not Working

**Problem**: Variables not substituted.

**Solutions:**
```yaml
# Use ${VAR} syntax
environment:
  DB_HOST: ${DB_HOST}

# Check .env file exists
# Use $$ to escape $
FRAPPE_SITE_NAME_HEADER: ${FRAPPE_SITE_NAME_HEADER:-$$host}
```

#### Issue 5: Port Already in Use

**Problem**: Port conflict.

**Solutions:**
```yaml
# Change host port
ports:
  - "8081:8080"  # Use different host port

# Or use environment variable
ports:
  - "${HTTP_PUBLISH_PORT:-8080}:8080"
```

### Debugging Commands

```bash
# View logs
docker compose logs backend
docker compose logs -f backend  # Follow logs

# Check service status
docker compose ps

# Execute command in container
docker compose exec backend bash

# View configuration
docker compose config

# Restart service
docker compose restart backend

# Recreate service
docker compose up -d --force-recreate backend
```

---

## Conclusion

You now have comprehensive knowledge of:
- Docker Compose fundamentals
- Service configuration
- Networks and volumes
- Frappe-specific patterns
- Advanced techniques
- Best practices
- Troubleshooting

### Next Steps

1. **Practice**: Create your own compose file
2. **Experiment**: Try different configurations
3. **Learn More**: Explore Docker Swarm, Kubernetes
4. **Contribute**: Share your compose files

**Remember**: Docker Compose makes managing multi-container applications easy. Start simple, iterate, and gradually add complexity as you become more comfortable!

