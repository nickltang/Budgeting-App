# Using ngrok for Local Backend Development

## Quick Start

### Step 1: Install ngrok

**macOS (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Or download from:**
https://ngrok.com/download

**Or via npm:**
```bash
npm install -g ngrok
```

### Step 2: Create ngrok Account (Free)

1. Sign up at https://ngrok.com/signup
2. Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
3. Authenticate:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start Your Backend

In one terminal:
```bash
cd backend
go run main.go
# Backend running on http://localhost:8000
```

### Step 4: Start ngrok

In another terminal:
```bash
ngrok http 8000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:8000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

### Step 5: Update Frontend

**Option A: Set environment variable in Netlify**
- Go to Netlify Dashboard → Site Settings → Environment Variables
- Add: `VITE_API_URL` = `https://abc123.ngrok-free.app`
- Redeploy your site

**Option B: Local development**
Create `frontend/.env`:
```bash
VITE_API_URL=https://abc123.ngrok-free.app
```

Restart your frontend dev server:
```bash
cd frontend
npm run dev
```

### Step 6: Update Backend CORS (Important!)

Your backend needs to allow requests from your Netlify domain. Update `backend/main.go`:

Find the CORS middleware and update:
```go
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Allow Netlify domain and localhost
		allowedOrigins := []string{
			"http://localhost:5173",
			"https://your-site.netlify.app",  // Your Netlify domain
			"https://abc123.ngrok-free.app",  // Your ngrok URL
		}
		
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				c.Header("Access-Control-Allow-Origin", origin)
				break
			}
		}
		
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}
```

Or allow all origins (less secure, for development only):
```go
c.Header("Access-Control-Allow-Origin", "*")
```

## ngrok Free Tier Limitations

- **Random URL each time** (unless you pay for static domain)
- **Session timeout** after 2 hours of inactivity (upgrade to avoid)
- **Request rate limits** (some throttling)
- **Bandwidth limits** (adequate for development/testing)

## Making ngrok URL Persistent

### Option 1: Static Domain (ngrok paid plan)
- Costs: ~$8/month
- Get a static domain like: `https://your-app.ngrok.io`
- Never changes

### Option 2: Update on Restart
- Keep ngrok running
- When it restarts and gets new URL, update Netlify env variable

### Option 3: ngrok Agent Config (for static domains)
Create `~/.ngrok2/ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  household-budget:
    proto: http
    addr: 8000
    domain: your-custom-domain.ngrok.io  # Requires paid plan
```

Then run:
```bash
ngrok start household-budget
```

## Running ngrok in Background

**macOS/Linux:**
```bash
nohup ngrok http 8000 > ngrok.log 2>&1 &
```

**Or use screen/tmux:**
```bash
screen -S ngrok
ngrok http 8000
# Press Ctrl+A then D to detach
# Reattach: screen -r ngrok
```

## Checking ngrok Status

Visit: http://localhost:4040 (ngrok web interface)
- See all requests/responses
- Inspect headers
- Replay requests
- Useful for debugging!

## Production Alternative

For production, consider:
- **AWS Lightsail**: $3.50/month (static IP, always on)
- **EC2 t3.micro**: Free tier or $8.50/month
- **Railway/Render**: Free tier available, easy deployment
- **Fly.io**: Generous free tier

ngrok is great for:
- ✅ Quick testing
- ✅ Development
- ✅ Demos
- ✅ Temporary access

Not ideal for:
- ❌ Production (URL changes)
- ❌ Long-term hosting
- ❌ High traffic

## Quick Reference

```bash
# Start backend
cd backend && go run main.go

# Start ngrok (in new terminal)
ngrok http 8000

# Get your URL from ngrok output
# Update Netlify: VITE_API_URL = https://xxxx.ngrok-free.app

# View ngrok dashboard
open http://localhost:4040
```

