# Release Process Documentation

## Step 1 – Merge Approved Changes into Release Branch
- After finishing all requirements (features + bug fixes) and receiving **final approval** from:
  - The **QA/Test team**.
  - The **Client**.
- Create a **Pull Request (PR)** to merge changes from the **staging branch** into the **release branch**.  

Why?  
The staging branch is the pre-production environment, and the release branch represents the final code that goes to production.

---

## Step 2 – Update Version Information
- On your local machine:
  1. Pull the latest changes:
     ```bash
     git pull
     ```
  2. Checkout the release branch:
     ```bash
     git checkout release
     ```
  3. Open the `CHANGELOG.md` file and add:
     - New release version number.
     - Release date.
     - Summary of changes.

Example:
```md
## [0.4.0] - 2025-09-06
- Added user login feature
- Fixed dashboard bug
```

---

## Step 3 – Commit with Bump Message
- Add and commit the changelog update:
  ```bash
  git add CHANGELOG.md
  git commit -m "chore(release): bump version to 0.4.0"
  ```

**What is a bump message?**  
- “Bump” = increasing or raising something.  
- A **bump commit** means: “I updated the version number for a new release.”  
- We use the format `chore(release): bump version` following **Conventional Commits**:
  - `feat`: new feature.
  - `fix`: bug fix.
  - `chore`: administrative/internal change.  
  - `chore(release)`: a release-specific commit.  

This makes release commits easy to find in the history.

---

## Step 4 – Push the Release Branch
```bash
git push upstream release
```

---

## Step 5 – Sync Staging with Release (Rebase)
- Checkout the staging branch and rebase it onto release:
  ```bash
  git checkout staging
  git rebase release
  git push upstream staging
  ```

**What is rebase and why do we need it?**  
- Rebase = “replaying” your commits on top of another branch.  
- It keeps history **linear (a straight line)** instead of adding merge commits.  
- This ensures **staging is perfectly aligned with release**, making staging an accurate copy of production-ready code.  

---

## Step 6 – Sync Dev with Staging (NOT Release!)
- Checkout the dev branch and rebase from staging:
  ```bash
  git checkout dev
  git rebase staging
  git push upstream dev
  ```

**Why not rebase dev from release?**  
- The dev branch may contain ongoing work not yet approved.  
- Staging already represents the latest tested and merged code.  
- Correct workflow: **dev ← staging ← release**.

---

## Step 7 – Create a GitHub Release
1. Go to **GitHub → Releases → Draft a new release**.  
2. Add a tag matching the new version (e.g., `v0.4.0`).  
3. Copy the changelog content into the release description.  
4. Publish the release.

---

## Step 8 – Build and Push Docker Images
## Docker Installation

### Install Docker on Ubuntu

Follow the official Docker installation guide:
- [Docker Engine Installation for Ubuntu](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Custom App Configuration

### Create apps.json File

Create an `apps.json` file to define your custom apps:

```bash
nano apps.json
```

Add the following content structure:

```json
[
  {
    "url": "https://github.com/frappe/erpnext",
    "branch": "version-15"
  },
  {
    "url": "https://{{ PAT }}@git.example.com/your-org/your-repo.git",
    "branch": "main"
  }
]
```

**Configuration Details:**
- Replace `{{ PAT }}` with your Personal Access Token
- Update the repository URL with your actual Git repository
- Set the appropriate branch name
- Add multiple apps as needed

### Generate Base64 String

Convert your JSON configuration to base64:

```bash
export APPS_JSON_BASE64=$(base64 -w 0 apps.json)
echo ${APPS_JSON_BASE64}
```

**Verify the conversion:**
```bash
echo -n ${APPS_JSON_BASE64} | base64 -d > apps-test-output.json
```

## Building Custom Docker Image

### Clone frappe_docker Repository

```bash
git clone https://github.com/frappe/frappe_docker
cd frappe_docker
```

### Build Custom Image

Build your custom Docker image with the following command:

```bash
docker build \
  --no-cache \
  --progress=plain \
  --build-arg FRAPPE_BRANCH=version-15 \
  --build-arg APPS_JSON_BASE64=$APPS_JSON_BASE64 \
  --file images/layered/Containerfile \
  --tag your-dockerhub-username/your-app-name:0.1.0 \
  --tag your-dockerhub-username/your-app-name:latest \
  .
```

**Build Parameters:**
- `--no-cache`: Ensures fresh build without cached layers
- `--progress=plain`: Shows detailed build output
- `--build-arg FRAPPE_BRANCH`: Frappe version to use
- `--build-arg APPS_JSON_BASE64`: Your base64-encoded apps configuration
- `--tag`: Your Docker image tag (replace with your details)

### Verify Image Creation

```bash
docker images
```

You should see your custom image listed. 

---

**To access image bash:**
```
docker run -it --rm your_image_name sh
```
> this will starts a new container from the specified image, opens an interactive shell (sh), and automatically removes the container when you exit.

**Rename your image tag:**
```
docker tag old_name new-name
```

---

## Docker Hub Authentication

### Install Required Tools

```bash
sudo apt update && sudo apt install pass gnupg2 -y
```

### Generate GPG Key

```bash
gpg --full-generate-key
```

**Key Configuration:**
- Type: `(1) RSA and RSA`
- Key size: `4096 bits`
- Expiration: `0 (never)`
- Real name: `Your Name`
- Email: `your-email@example.com`
- Passphrase: Leave empty or set one (remember it)

### Initialize Password Store

```bash
pass init your-email@example.com
```

### Login to Docker Hub

```bash
docker login -u your-dockerhub-username
```

**Authentication:**
- Use your Docker Hub username
- When prompted for password, use a Personal Access Token (PAT)

### Create Personal Access Token

1. Go to [Docker Hub Settings](https://app.docker.com/settings)
2. Sign in to your account
3. Navigate to **Security** → **New Access Token**
4. Copy the generated token
5. Use this token as your password during `docker login`

## Pushing Images to Docker Hub

### Step 1: Tag Your Image Correctly

The tag must follow this format:
```
<your-dockerhub-username>/<repository-name>:<tag>
```
**Rename your image tag:**
```
docker tag old_name new-name
```

**Example:**
```bash
docker tag your-local-image:latest your-dockerhub-username/your-app-name:latest
```

### Step 2: Verify Login Status

Ensure you're logged in to Docker Hub:
```bash
docker login -u your-dockerhub-username
```

### Step 3: Push the Image

```bash
docker push your-dockerhub-username/your-app-name:latest
```

### Step 4: Verify Upload

Visit your Docker Hub repository:
```
https://hub.docker.com/r/your-dockerhub-username/your-app-name
```

### Optional: Create Repository First

For better organization, create the repository on Docker Hub first:

1. Go to [Docker Hub Repositories](https://hub.docker.com/repositories)
2. Click **"Create Repository"**
3. Set name: `your-app-name`
4. Choose visibility: Public or Private
5. Add description if desired

## Running Your Custom Image

### Configure frappe_docker

Navigate to the frappe_docker directory:
```bash
cd frappe_docker
```

### Update pwd.yml Configuration

```bash
nano pwd.yml
```

**Configuration Changes:**
1. Replace `frappe/erpnext:v15.60.1` with your custom image:
   ```yaml
   image: your-dockerhub-username/your-app-name:latest
   ```

2. Add your custom app to the install command:
   ```yaml
   command: >
     bash -c "
     bench new-site --no-mariadb-socket --mariadb-root-password 123 --admin-password admin --install-app erpnext --install-app your-app-name site1.localhost
     "
   ```

### Start the Services

```bash
docker compose -f pwd.yml up -d
```

### Monitor Installation

```bash
docker logs frappe_container-create-site-1 -f
```

---

## Final Result
- **release, staging, and dev branches** share the same aligned history.  
- GitHub release is published and versioned.  
- Docker images for the release are built and pushed.  
