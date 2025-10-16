# Build Custom Frappe App + Custom Frontend (VueJS)

## What is Doppio?

**Doppio** is a Frappe app that provides CLI commands to automatically scaffold and set up Single Page Applications (SPAs) inside your custom Frappe apps. It handles all the configuration, file creation, and setup automatically.

## Two Approaches

### 1. Doppio Way (Automated Setup)
- **Doppio handles everything** - scaffolding, configuration, routing
- Frontend lives inside Frappe app automatically
- Built assets go to `app/public/frontend/`
- HTML entry point goes to `app/www/`
- Frappe serves everything

### 2. Raw Way (Manual Setup)
- **You handle everything** manually
- Frontend is completely separate
- Built assets go anywhere you want
- Frappe only serves API endpoints
- Frontend can be deployed anywhere

## NOTE:

Doppio creates SPAs (Vue or React) that live INSIDE your Frappe apps, but here's something many developers miss => React and Vue allow CDN connections. This means you can use them for specific parts of your app without needing a full SPA setup.

When you need a full SPA: Building complete custom dashboards, entire application sections, or when you need full routing and state management.

When CDN is perfect: Adding interactive components to existing Frappe forms, enhancing specific form fields with modern UI, or quick prototyping without full setup.

Example: You can add Vue.js to a Frappe form with just a CDN script tag and create interactive components instantly, no build process, no complex setup, just modern UI where you need it.

This gives you the flexibility to choose the right approach for your specific needs. Sometimes a full SPA is overkill when a simple CDN component does the job perfectly.

---

## Doppio Way (Automated) - Step by Step

### Step 1: Install Doppio
```bash
cd /path/to/frappe-bench
bench get-app https://github.com/NagariaHussain/doppio
```

### Step 2: Create Your Custom Frappe App
```bash
bench new-app myapp
bench --site your-site.com install-app myapp
```

### Step 3: Use Doppio to Create SPA
```bash
# Interactive mode - answer prompts
bench add-spa

# Or specify options directly
bench add-spa --app myapp --tailwindcss --typescript

cd apps/myapp/dashboard  # or whatever name you chose

```

### Step 4: Configure proxyOptions
**`dashboard/proxyOptions.js`**
```javascript
// Frappe development server is running on http://127.0.0.1:8000
const frappeTargetPort = 8000;

// This router function attempts to preserve the hostname from the original request
// and forwards it to the Frappe backend on the specified frappeTargetPort.
// This is important if your Frappe bench serves multiple sites or relies on the Host header.
// For example, if you access your Vite app via http://my-frappe-site.localhost:8080,
// this will proxy API requests to http://my-frappe-site.localhost:8000.
// If you access Vite via http://localhost:8080, it proxies to http://localhost:8000.
const router = (req) => {
	const hostHeader = req.headers.host || ''; // e.g., 'my-frappe-site.localhost:8080' or 'localhost:8080'
	const siteName = hostHeader.split(':')[0]; // e.g., 'my-frappe-site.localhost' or 'localhost'

	const targetUrl = `http://${siteName}:${frappeTargetPort}`;
	console.log(`[Proxy] Routing API request for host ${req.headers.host} to ${targetUrl}${req.url}`);
	return targetUrl;
};

export default {
	// Proxy requests for paths starting with /app, /api, /assets, /files, /private
	// This matches common Frappe URL structures.
	'^/(app|api|assets|files|private)': {
		// The 'target' here is a base. The 'router' will determine the actual host and port.
		// For Vite's proxy, providing a base target like 127.0.0.1 and then having the router
		// return the full path including protocol, hostname and port is a common pattern.
		target: `http://127.0.0.1:${frappeTargetPort}`, // Base target, router provides specifics
		ws: true, // Enable WebSocket proxying
		changeOrigin: true, // Important: changes the origin of the host header to the target URL specified by router
		router: router,
	}
};
```

#### What This Configuration Does:

**Purpose:** This proxy configuration acts as a "traffic director" between your Vue.js frontend (running on port 8080) and your Frappe backend (running on port 8000).

**How It Works:**
1. **Request Interception:** When your frontend makes API calls to `/api/method/something`, the proxy catches these requests
2. **Host Preservation:** It keeps the original hostname (like `my-site.localhost`) so Frappe knows which site to serve
3. **Port Forwarding:** It forwards the request to your Frappe server on port 8000
4. **Response Routing:** It sends the Frappe response back to your frontend

**Multi-Site Support:** 
- If you access `http://site1.localhost:8080` → proxies to `http://site1.localhost:8000`
- If you access `http://site2.localhost:8080` → proxies to `http://site2.localhost:8000`
- This is crucial for Frappe benches with multiple sites

**What Gets Proxied:**
- `/api/*` - All API calls to Frappe methods
- `/app/*` - Frappe desk application routes  
- `/assets/*` - Static assets (CSS, JS, images)
- `/files/*` - File uploads and downloads
- `/private/*` - Private file access

**Key Settings:**
- `ws: true` - Enables WebSocket support for real-time features
- `changeOrigin: true` - Ensures proper host header forwarding
- `router: router` - Uses custom logic to determine target URL

### Step 5: Configure Vite
**`dashboard/vite.config.js`**
```javascript
import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import proxyOptions from './proxyOptions';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: '0.0.0.0',
    proxy: proxyOptions
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: '../myapp/public/dashboard',  // Replace 'myapp' with your actual app name
    emptyOutDir: true,
    target: 'es2015',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  // Ensure service worker is available in dev mode
  publicDir: 'public'
});

```

### Step 6: Configure Build Scripts
**`dashboard/package.json`**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build --base=/assets/myapp/dashboard/ && yarn copy-html-entry",  // Replace 'myapp' with your actual app name
    "preview": "vite preview",
    "copy-html-entry": "mkdir -p ../myapp/www && cp ../myapp/public/dashboard/index.html ../myapp/www/dashboard.html"  // Replace 'myapp' with your actual app name
  },
}
```

### Step 7: Configure Frappe Routes
**`myapp/hooks.py`**
```python
# Website Route Rules to bypass Frappe routing for our SPA routes
website_route_rules = [
	{"from_route": "/dashboard/login", "to_route": "dashboard"},  # Match your frontend name
	{"from_route": "/dashboard/<path:app_path>", "to_route": "dashboard"},
	{"from_route": "/dashboard", "to_route": "dashboard"},
	{"from_route": "/app", "to_route": "/app"},  # Keep ERPNext desk routing
]
```
> “Replace `frontend-name` with the name you provided in `bench add-spa` (e.g., if you used `dashboard`, then paths become `/public/dashboard` and `/www/dashboard.html`).”


### Step 8: Build for Production
```bash
cd apps/myapp/dashboard  # or whatever name you chose
yarn build
```

**What happens:**
- Assets built to `myapp/public/dashboard/`
- HTML copied to `myapp/www/dashboard.html`
- Frappe serves everything automatically

### Step 9: Start Development
```bash
cd apps/myapp/frontend  # or whatever name you chose
yarn dev
```

**Access your app:**
- Development: `http://your-site:8080`
- Production: `http://your-site.com:8000/dashboard`


---

**Project Structure**
```
myapp/
├── frontend/                 # Your SPA
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── proxyOptions.js
├── public/dashboard/         # Built assets (auto-created)
└── www/dashboard.html       # HTML entry point (auto-created)
```

---

### Build Custom Frappe App + Custom Frontend (React):

[Frappe React SDK - The Explainer](https://www.youtube.com/playlist?list=PLHoO_SHGRUVCLT_PrOnFd9NZaqSLfoxLA)