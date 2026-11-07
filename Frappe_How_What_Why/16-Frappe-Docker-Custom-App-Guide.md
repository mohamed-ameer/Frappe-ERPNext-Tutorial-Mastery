# Frappe Docker Custom App Guide (Create Docker Image For Your Custom Frappe App)

## Table of Contents

- [Introduction](#introduction)

- [Step 1: Create apps.json File](#step-1-create-appsjson-file)

- [Step 2: Generate Base64-Encoded apps.json](#step-2-generate-base64-encoded-appsjson)

- [Step 3: Build Custom Docker Image](#step-3-build-custom-docker-image)

- [Step 4: Push Image to Docker Hub](#step-4-push-image-to-docker-hub)

- [Step 5: Run Your Custom Image](#step-5-run-your-custom-image)

---

## Introduction

This guide walks you through the complete process of:

- Adding your custom app via an `apps.json` file

- Generating a Base64-encoded version of that file

- Building a custom Docker image using `frappe_docker`

- Pushing the image to Docker Hub

- Running the image with a custom docker-compose setup

All steps follow the official frappe/frappe_docker documentation.

---

## Step 1: Create apps.json File

Frappe Docker allows you to install additional apps (like ERPNext and your own custom app) during the image build process by providing an `apps.json` configuration file.

This file tells the builder which Git repositories and branches to clone and install.

### Create the apps.json File

```bash
nano apps.json
```

Paste this JSON structure into the file:

```json
[
  {
    "url": "https://github.com/frappe/erpnext",
    "branch": "version-15"
  },
  {
    "url": "https://{{ PAT }}@git.example.com/project/repository.git",
    "branch": "main"
  },
  {
    "url": "https://github.com/<github-username>/<your-public-repo-name>",
    "branch": "main"
  }
]
```

> **Notes**:
> - The first entry installs ERPNext from the version-15 branch
> - The second entry is your private custom app hosted on a Git server
> - Replace {{ PAT }} with a valid Personal Access Token (PAT) that has read access
> - Replace the URL with your actual Git repository URL
> - The third entry is for any public GitHub repositories you want to include
> - Ensure you specify the correct branch name that exists in the repository
> - Remove any trailing spaces in URLs (they can cause build failures)
> - Verify your JSON is valid using a tool like JSONLint (optional)

---

## Step 2: Generate Base64-Encoded apps.json

Frappe expects the contents of `apps.json` to be passed as a Base64-encoded string via the `APPS_JSON_BASE64` argument.

### Generate Base64 String

```bash
export APPS_JSON_BASE64=$(base64 -w 0 apps.json)
echo ${APPS_JSON_BASE64}
```

### Verify Encoding

To ensure the encoding was successful, decode it back and check if it matches the original:

```bash
echo -n ${APPS_JSON_BASE64} | base64 -d > apps-test-output.json
cat apps-test-output.json
```

Compare the output with your original apps.json file. If they match, the encoding is correct.

---

## Step 3: Build Custom Docker Image

### Clone frappe_docker

```bash
git clone https://github.com/frappe/frappe_docker
cd frappe_docker
```

### Build Your Image

```bash
docker build \
  --no-cache \
  --progress=plain \
  --build-arg FRAPPE_BRANCH=version-15 \
  --build-arg APPS_JSON_BASE64=$APPS_JSON_BASE64 \
  --file images/layered/Containerfile \
  --tag <your-dockerhub-username>/<your-image-name>:latest \
  .
```

> "Explanation of Flags: "
> - `--no-cache`: Ensures a fresh build (recommended for first-time builds)
> - `--progress=plain`: Shows detailed output during build (useful for debugging)
> - `--build-arg FRAPPE_BRANCH=version-15`: Specifies the Frappe framework branch
> - `--build-arg APPS_JSON_BASE64=$APPS_JSON_BASE64`: Injects your app list securely
> - `--file images/layered/Containerfile`: Points to the correct Dockerfile
> - `--tag <your-dockerhub-username>/<your-image-name>:latest`: Tags your image for easy reference

### Verify Image

After the build completes, list your images:

```bash
docker images
```

You should see your newly built image in the list:

```bash
<your-dockerhub-username>/<your-image-name> latest <image_id> ... Created XX minutes ago
```

---

## Step 4: Push Image to Docker Hub

### Setup Credentials (First Time)

Docker doesn't store your Docker Hub password in plain text by default. You need to set up a credential helper:

```bash
sudo apt update && sudo apt install pass gnupg2 -y
gpg --full-generate-key
```

Follow the prompts:

- Key type: RSA and RSA (default)
- Key size: 4096
- Expiration: 0 (never)
- Real name: Your Name
- Email: your-email@example.com (can be anything)
- Leave passphrase empty (or set one and remember it)

Then initialize pass:

```bash
pass init your-email@example.com
```

### Login to Docker Hub

```bash
docker login -u <your-dockerhub-username>
```

> "Important: When prompted for password, use a Personal Access Token (PAT), not your account password." How to create a PAT:
> 1. Go to [Docker Account Settings](https://app.docker.com/settings)
> 2. Sign in
> 3. Go to Security → New Access Token
> 4. Give it a descriptive name (e.g., "frappe-docker-deployment")
> 5. Select appropriate permissions (at minimum: "Read, Write, Delete")
> 6. Copy the token immediately (you won't see it again)
> 7. Use this token as your password when running docker login

### Push Image

```bash
docker push <your-dockerhub-username>/<your-image-name>:latest
```

> Because The tag to be pushed must follow this format:
`<your-dockerhub-username>/<repository-name>:<tag>`
>
> Note: If you need to retag your image:
> ```bash
> docker tag <local-image-name> <your-dockerhub-username>/> <your-image-name>:latest
> ```

---

## Step 5: Run Your Custom Image

### Create Compose File

```bash
cd frappe_docker
nano pwd.yml
```

### Modify the Configuration:

Replace all instances of `frappe/erpnext:v15.60.1` in the `pwd.yml` with your custom image:`<your-dockerhub-username>/<your-image-name>:latest`

```yaml
image: <your-dockerhub-username>/<your-image-name>:latest
```

Update the site initialization command to include your custom app:

```yaml
command: >-
--install-app erpnext --install-app <your-app-name>
```
>Note: The app name should match the folder name of your app.

### Start Containers

```bash
docker compose -f pwd.yml up -d
```

### Monitor Site Creation

```bash
docker logs frappe_container-create-site-1 -f
```
