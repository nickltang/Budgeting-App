# Household Budget App

A React + Tailwind PWA for budget tracking with a Go (Gin) backend.

## Project Structure

```
Budgeting-App/
├── frontend/          # React + Vite + TypeScript + Tailwind PWA
├── backend/           # Go (Gin) dummy backend for local dev
└── docs/              # Specifications
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Go 1.23+

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to http://localhost:8000):
```bash
VITE_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Set environment variable (optional, defaults to 8000):
```bash
export PORT=8000
```

3. Run the server:
```bash
go run main.go
```

The backend will be available at `http://localhost:8000`

## Features

### Frontend

- **Dashboard** (`/`): MTD KPIs, 90-day trend chart
- **Link Bank** (`/link`): Connect bank account via Plaid (stubbed)
- **Transactions** (`/transactions`): View and filter transactions
- **Budgets** (`/budgets`): Create and track monthly budgets by category
- **Goals** (`/goals`): Create and track savings goals
- **Settings** (`/settings`): Manage linked accounts and sync

### Backend

The dummy backend provides:
- Health check endpoint
- Plaid endpoints (stubbed)
- Transactions API with filtering
- Budgets CRUD
- Goals CRUD
- CORS configured for `http://localhost:5173`
- In-memory data storage (no database)

## API Endpoints

- `GET /health` - Health check
- `GET /api/me` - Current user (stub)
- `POST /api/plaid/create-link-token` - Create Plaid link token (stub)
- `POST /api/plaid/exchange` - Exchange public token (stub)
- `GET /api/plaid/sync` - Sync transactions (stub)
- `GET /api/transactions` - List transactions with filters
- `GET /api/budgets?month=YYYY-MM` - List budgets for month
- `POST /api/budgets` - Create budget
- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal

## Development Notes

- The backend uses in-memory storage and will reset on restart
- Sample data is seeded on backend startup (25 transactions, 3 budgets, 2 goals)
- CORS is configured to allow credentials from `http://localhost:5173`
- The PWA manifest and service worker are configured for installation

## Building for Production

### Frontend

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Backend

```bash
cd backend
go build -o server main.go
./server
```

## Deployment

### Deploy Frontend to Netlify

1. **Via Netlify UI:**
   - Push your code to GitHub/GitLab
   - Go to [netlify.com](https://netlify.com) and import your project
   - Set build settings:
     - Base directory: `frontend` (if deploying from repo root)
     - Build command: `npm run build`
     - Publish directory: `frontend/dist` or `dist`
   - Add environment variable: `VITE_API_URL` = your backend URL
   - Deploy!

2. **Via Netlify CLI:**
   ```bash
   cd frontend
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify env:set VITE_API_URL "https://your-backend-url.com"
   netlify deploy --prod
   ```

See `DEPLOYMENT.md` for detailed deployment instructions.

## Next Steps

- Replace dummy backend with real Plaid integration
- Add database persistence (PostgreSQL)
- Implement authentication
- Add real-time sync
- Enhance error handling and validation

