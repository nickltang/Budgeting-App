# Deploying to Netlify

## Option 1: Deploy via Netlify UI (Recommended for first time)

### Step 1: Prepare your code
1. Make sure your code is committed and pushed to GitHub/GitLab/Bitbucket
2. The frontend folder contains all necessary files

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub, GitLab, etc.)
4. Select your repository

### Step 3: Configure Build Settings
Netlify should auto-detect these settings, but verify:

- **Base directory:** `frontend` (if your repo root contains both frontend and backend)
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`

**OR** if deploying from the frontend folder directly:

- **Base directory:** (leave empty)
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Step 4: Set Environment Variables
Click **"Show advanced"** or go to **Site settings** → **Environment variables**, and add:

- **Key:** `VITE_API_URL`
- **Value:** Your backend API URL (e.g., `https://your-backend.herokuapp.com` or `http://localhost:8000` for testing)

⚠️ **Important:** For production, set this to your deployed backend URL, not `localhost`.

### Step 5: Deploy
Click **"Deploy site"** - Netlify will:
1. Install dependencies (`npm install`)
2. Run the build (`npm run build`)
3. Deploy the `dist` folder

## Option 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login
```bash
netlify login
```

### Step 3: Initialize (first time only)
```bash
cd frontend
netlify init
```

Follow the prompts:
- Create & configure a new site
- Set build command: `npm run build`
- Set publish directory: `dist`
- No deploy command needed

### Step 4: Set Environment Variables
```bash
netlify env:set VITE_API_URL "https://your-backend-url.com"
```

### Step 5: Deploy
```bash
netlify deploy --prod
```

For preview deployments (before going live):
```bash
netlify deploy
```

## Configuration Files

The repository includes a `netlify.toml` file in the frontend folder that configures:
- Build command and publish directory
- SPA redirects (for React Router client-side routing)
- Node version

## Important Notes

### 1. Backend URL
Since your frontend uses `VITE_API_URL`, make sure to set this in Netlify:
- For local dev: `http://localhost:8000`
- For production: Your deployed backend URL

### 2. CORS
Ensure your backend allows CORS from your Netlify domain:
```
Access-Control-Allow-Origin: https://your-site.netlify.app
```

### 3. React Router
The `netlify.toml` includes redirects to handle client-side routing. All routes will redirect to `/index.html` so React Router can handle them.

### 4. PWA
Your PWA manifest and service worker will work, but note:
- HTTPS is required for service workers
- Netlify automatically provides HTTPS

### 5. Build Optimization
Netlify automatically:
- Caches `node_modules` between builds
- Runs builds in parallel when possible
- Provides CDN distribution

## Troubleshooting

### Build fails with "Module not found"
- Ensure `package.json` has all dependencies
- Check that `node_modules` is committed (it shouldn't be - Netlify installs it)

### Routes return 404
- Check that `netlify.toml` redirects are configured
- Verify the redirect pattern: `from = "/*"` → `to = "/index.html"`

### API calls fail
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend is accessible from the internet

### Service Worker not working
- Ensure site is served over HTTPS (Netlify does this automatically)
- Check browser console for service worker errors

## Quick Deploy Button

You can also add this to your README for one-click deploy:

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)

## Example Netlify Settings

If deploying from repo root with frontend folder:

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

If deploying from frontend folder:

```
Base directory: (empty)
Build command: npm run build
Publish directory: dist
```

