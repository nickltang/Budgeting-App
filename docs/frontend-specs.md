# Frontend Specification (Cursor-Ready)

Project: Couple Budget — React + Tailwind PWA  
Owner: Nick Tang  
Purpose: Generate a mobile-first PWA that integrates with a Go (Gin) backend via REST. Implements Plaid Link client, transactions browsing, budgets/goals CRUD, dashboard KPIs, and a simple forecast. This document is formatted to be ingested by Cursor as the source of truth for scaffolding and code generation.

---

## 1. Tech and Constraints

- Framework: React (Vite preferred; Next.js acceptable if needed)
- Styling: Tailwind CSS
- Routing: React Router
- State: Zustand (lightweight store), optional React Query for fetch lifecycles
- Charts: Recharts
- HTTP: native fetch via a small wrapper; JSON only
- PWA: public/manifest.json + public/sw.js (offline shell)
- Env: VITE_API_URL (backend base URL), do not hardcode
- Auth: cookie-based session set by backend; API may return 401
- Target devices: mobile-first (iPhone 13 baseline)
- Accessibility: semantic HTML, ARIA labels for buttons and nav
- Language: English only

---

## 2. Routes and Screens

- / — Dashboard  
  - KPIs: MTD Income, MTD Spending, MTD Net  
  - 90-day trend line chart  
  - “Link Bank” CTA if no accounts linked  

- /link — Bank Linking (Plaid Link)  
  - Button to create link token via /api/plaid/create-link-token  
  - Launch Plaid Link; on success, POST /api/plaid/exchange  

- /transactions — Transactions list  
  - Filters: date range (from, to), category, free-text q  
  - Virtualized list; >1000 items smooth  
  - Summary bar: Income, Expenses for current filter  

- /budgets — Budgets  
  - Month selector (YYYY-MM)  
  - Grid/list of categories with progress bars (spent vs limit)  
  - Add new budget (category, limit)  

- /goals — Goals  
  - Cards of goals; progress and ETA (computed client-side)  
  - Add new goal (name, target amount, target date)  

- /settings — Settings  
  - Linked institutions/accounts overview  
  - Budgeting Partners: invite/manage partners, view partner status  
  - Manual "Sync now" button (GET /api/plaid/sync)  
  - Sign-out placeholder  

---

## 3. Data Contracts (shared with backend)

export type Transaction = {
  id: string;
  accountId: string;
  date: string;        // ISO date
  amount: string;      // decimal as string
  merchant?: string;
  category?: string;
  isIncome: boolean;
  status?: "posted" | "pending";
};

export type Budget = {
  id: string;
  householdId: string;
  month: string;       // "YYYY-MM"
  category: string;
  limitAmount: string; // decimal as string
};

export type Goal = {
  id: string;
  householdId: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;  // ISO date
};

export type Partner = {
  id: string;
  email: string;
  householdId: string;
  status: "invited" | "accepted" | "active";
  invitedBy: string;
  invitedAt: string;
  acceptedAt?: string;
};

---

## 4. API Endpoints (JSON, may return 401)

POST /api/plaid/create-link-token  
  req: none  
  res: { link_token: string }

POST /api/plaid/exchange  
  req: { public_token: string, institution_name?: string, item_id?: string }  
  res: { ok: true }

GET /api/transactions?from&to&category?&q?  
  res: { transactions: Transaction[], summary: { income: string, expenses: string } }

GET /api/budgets?month=YYYY-MM  
  res: { month: string, budgets: Budget[] }

POST /api/budgets  
  req: { month: string, category: string, limitAmount: string }  
  res: Budget

GET /api/goals  
  res: Goal[]

POST /api/goals  
  req: { name: string, targetAmount: string, targetDate: string }  
  res: Goal

GET /api/partners  
  res: Partner[]

POST /api/partners/invite  
  req: { email: string }  
  res: Partner

POST /api/partners/:id/accept  
  req: none  
  res: Partner

DELETE /api/partners/:id  
  res: { ok: true }

---

## 5. State Management

Zustand stores:

// Session store
useSessionStore:
- user?: { id: string; householdId: string }
- loadMe(): fetches /api/me if exists

// Data store
useDataStore:
- transactions: Transaction[]
- budgets: Budget[]
- goals: Goal[]
- partners: Partner[]
- summary?: { income: string; expenses: string }
- loadTransactions(params)
- loadBudgets(month)
- createBudget(input)
- loadGoals()
- createGoal(input)
- loadPartners()
- invitePartner(email)
- acceptPartnerInvite(id)
- removePartner(id)

All fetch requests include credentials: "include".

---

## 6. Components Overview

| Component | Purpose |
|------------|----------|
| NavBar.tsx | Fixed bottom navigation with 4 tabs (desktop: sidebar with 5) |
| KPIs.tsx | Tiles showing Income, Spending, and Net for current month |
| TrendChart.tsx | 90-day line chart of net values |
| TxnList.tsx | List of transactions (scrollable) |
| TransactionRow.tsx | Individual transaction row with editable category/label |
| FiltersBar.tsx | Date picker, account select, category select, and search input |
| BudgetProgress.tsx | Displays category budgets and progress bars |
| GoalCard.tsx | Displays savings goal progress and ETA |
| AccountSummary.tsx | Account card with balance and month summary |
| PlaidConnectButton.tsx | Wraps Plaid Link flow |
| EmptyState.tsx | Displayed when no data is available |
| ErrorToast.tsx | Displays error notifications |

---

## 7. Styling and Layout

- TailwindCSS, light theme only  
- Page structure:
  - Header h1
  - Content cards: rounded-2xl shadow p-4
  - Bottom nav: fixed, safe-area padding
- Typography:
  - Title: text-2xl font-bold
  - Subtitle: text-lg font-semibold
  - Body: text-base
- Colors:
  - Grayscale for text, emerald/sky for highlights, red for errors

Example layout:

<main class="p-4">
  <h1 class="text-2xl font-bold mb-4">Dashboard</h1>

  <section class="bg-white rounded-2xl shadow p-4 mb-4">
    <p class="text-gray-500 text-sm">Monthly Spending</p>
    <h2 class="text-lg font-semibold">$1,245</h2>
  </section>

  <nav class="fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-3 [padding-bottom:env(safe-area-inset-bottom)]">
    <button class="text-sm font-medium">Home</button>
    <button class="text-sm font-medium">Transactions</button>
    <button class="text-sm font-medium">Budgets</button>
    <button class="text-sm font-medium">Goals</button>
  </nav>
</main>

---

## 8. PWA Configuration

Requirements:
- public/manifest.json
- public/sw.js
- Service worker registration in app entrypoint

Example registration:
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

Example manifest.json:
{
  "name": "Couple Budget",
  "short_name": "Budget",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}

Example sw.js:
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("cb-v1").then((cache) => cache.addAll(["/", "/manifest.json"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});

---

## 9. Error and Loading States

- Skeleton loaders for first load
- Toast notifications for errors
- Empty states for no data

Example:
{loading ? (
  <div className="animate-pulse bg-gray-100 rounded-xl h-24 w-full" />
) : error ? (
  <div className="bg-red-100 text-red-600 p-3 rounded-xl">
    Failed to load data
  </div>
) : transactions.length === 0 ? (
  <p className="text-gray-400 text-center mt-10">No transactions found</p>
) : (
  <TransactionList data={transactions} />
)}

---

## 10. Acceptance Criteria

### PWA Installation
- App is installable on iOS and Android (manifest and service worker validated)
- Opens in standalone mode

### Bank Link Flow
- “Link Bank” opens Plaid Link modal
- On success, Plaid returns public_token, POSTs to /api/plaid/exchange

### Dashboard
- Displays Month-to-Date (MTD) income, spending, and net
- Shows 90-day trend chart

### Transactions
- Filter by date range and text
- Render smoothly for 1000+ items

### Budgets
- Create new category budgets
- Show progress bar (spent vs limit)
- Update in real-time after transactions sync

### Goals
- Create savings goals (name, target amount, target date)
- Display progress and ETA

### Budgeting Partners
- Invite partner via email from Settings
- View partner status (pending, accepted, active)
- Remove partner (with confirmation)
- Partners share access to budgets and goals via household_id
- Budgets and goals are automatically shared within the same household

---

## 11. Summary

This document defines:
- The data contracts shared with the backend  
- Frontend architecture for a mobile-first PWA  
- API contracts, routes, components, styling, PWA setup, and acceptance tests  

Cursor should use this as the single source for code generation and UI scaffolding of the Couple Budget app.
