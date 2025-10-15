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
const frappeTargetPort = 8000;
const router = (req) => {
	const hostHeader = req.headers.host || '';
	const siteName = hostHeader.split(':')[0];
	const targetUrl = `http://${siteName}:${frappeTargetPort}`;
	console.log(`[Proxy] Routing API request for host ${req.headers.host} to ${targetUrl}${req.url}`);
	return targetUrl;
};
export default {
	'^/(app|api|assets|files|private)': {
		target: `http://127.0.0.1:${frappeTargetPort}`,
		ws: true,
		changeOrigin: true,
		router: router,
	}
};
```
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