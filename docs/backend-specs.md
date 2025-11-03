# Backend Specification (Go + Gin) — Complete Guide

Project: Couple Budget  
Owner: Nick Tang  
Goal: Implement a secure REST API and Plaid integration in Go. Store data in Postgres (Neon recommended for dev). Provide endpoints required by the frontend spec.

---

## 1. Tech Choices

- Language: Go 1.22+
- Web framework: Gin
- Database: PostgreSQL (Neon/Supabase/RDS)
- SQL access: choose one
  - GORM (quick to start) or
  - sqlc + pgx (type-safe, explicit SQL)
- Migrations: golang-migrate or goose
- Plaid SDK: github.com/plaid/plaid-go/v28/plaid
- Config: 12-factor via environment variables
- Containerization: Docker

---

## 2. Environment Variables

Use a .env for local dev; set the same keys in your hosting provider.

    PORT=8080
    DATABASE_URL=postgresql://user:pass@host:5432/budget?sslmode=require
    APP_SECRET=changeme32bytes
    CORS_ORIGIN=http://localhost:5173

    PLAID_ENV=sandbox
    PLAID_CLIENT_ID=xxxx
    PLAID_SECRET=xxxx
    PLAID_PRODUCTS=transactions,investments

Notes:
- APP_SECRET is used to sign cookies and optionally to encrypt Plaid access tokens (AES-GCM with a KMS or locally derived key).
- CORS_ORIGIN should be your frontend origin (local and prod).

---

## 3. Directory Layout

    backend/
      cmd/api/main.go
      internal/
        http/
          server.go            (gin engine, middleware, route registration)
          middleware/
            cors.go
            auth.go
            requestid.go
            recover.go
          handlers/
            health.go
            me.go
            plaid.go
            transactions.go
            budgets.go
            goals.go
            partners.go
        core/
          auth/
            session.go         (cookie or JWT helpers)
          plaid/
            client.go          (SDK init)
            sync.go            (transactions sync logic)
          db/
            db.go              (connect pool)
            repo.go            (repositories)
            models.go          (GORM) or queries.sql (sqlc)
        migrate/
          0001_init.sql
          0002_indexes.sql
      go.mod
      go.sum
      Dockerfile
      .env.example
      Makefile (optional)

---

## 4. Data Model (DDL Sketch)

Tables:

- users
  - id (uuid pk), email unique, password_hash, household_id (fk), created_at timestamptz
- households
  - id (uuid pk), name text, created_at
- institutions
  - id (uuid pk), name text, aggregator text default 'plaid', item_id text, household_id fk, created_at
- links
  - id (uuid pk), institution_id fk, access_token_encrypted bytea, cursor text, created_at, updated_at
- accounts
  - id (text pk: composite idea "linkId-accountId" or uuid), household_id fk, institution_id fk, type text, name text,
    mask text, currency text default 'USD', current_balance numeric, available_balance numeric, created_at, updated_at
- transactions
  - id (text pk: plaid transaction_id), account_id fk, date date, amount numeric, merchant text,
    category text, is_income boolean, status text, original_json jsonb, created_at
- budgets
  - id (uuid pk), household_id fk, month char(7), category text, limit_amount numeric, created_at
- goals
  - id (uuid pk), household_id fk, name text, target_amount numeric, current_amount numeric default 0,
    target_date date, created_at
- partner_invites
  - id (uuid pk), household_id fk, email text, invited_by uuid (fk to users), status text,
    invited_at timestamptz, accepted_at timestamptz, created_at

Recommended Indexes:

- transactions(account_id, date desc)
- budgets(household_id, month)
- goals(household_id)
- links(institution_id)
- partner_invites(household_id, email)

Notes:
- Store Plaid amounts as decimal strings in the API layer, numeric in DB.
- For accounts.id, using "linkID-accountID" avoids a separate map table.

---

## 5. Security

- HTTPS at the edge (Render/App Runner/Caddy on EC2).
- Never expose Plaid access tokens to the client.
- Encrypt access_token at rest (AES-GCM). Key management:
  - Dev: derive from APP_SECRET using HKDF with a static salt.
  - Prod: prefer KMS (AWS KMS) and store ciphertext + key id/alias reference.
- CORS: allow only your frontend origin; send credentials if using cookie sessions.
- Cookies: HttpOnly, Secure, SameSite=Lax.
- Input validation: use Gin binding + custom validators where needed.
- Logging: avoid logging PII and secrets; redact access_token.

---

## 6. Middleware

- requestid: add X-Request-ID if missing
- recover: protect against panics
- cors: allow only CORS_ORIGIN
- auth: parse signed session cookie (or JWT) and attach user/household to context

---

## 7. Route Contracts (aligned with frontend)

All responses are JSON; on error return {"error": "message"} with appropriate status codes.

Health:
- GET /health
  - 200 { "ok": true, "ts": number }

Me (optional helper):
- GET /api/me
  - 200 { "id": string, "email": string, "householdId": string }

Plaid:
- POST /api/plaid/create-link-token
  - req: none
  - res: { "link_token": string }
- POST /api/plaid/exchange
  - req: { "public_token": string, "institution_name"?: string, "item_id"?: string }
  - server: call item/public_token/exchange, encrypt + store access_token, create institution/link rows
  - res: { "ok": true }
- POST /api/plaid/webhook
  - req: Plaid webhook payload
  - server: respond quickly 200 { "ok": true }, then trigger internal sync
- GET /api/plaid/sync
  - req: none
  - res: { "ok": true } (after running transactions sync for all links in current household; in dev you can sync all links)

Transactions:
- GET /api/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&category?&q?
  - res: { "transactions": Transaction[], "summary": { "income": "string", "expenses": "string" } }

Budgets:
- GET /api/budgets?month=YYYY-MM
  - res: { "month": string, "budgets": Budget[] }
- POST /api/budgets
  - req: { "month": string, "category": string, "limitAmount": string }
  - res: Budget

Goals:
- GET /api/goals
  - res: Goal[]
- POST /api/goals
  - req: { "name": string, "targetAmount": string, "targetDate": string }
  - res: Goal

Partners:
- GET /api/partners
  - res: Partner[]
- POST /api/partners/invite
  - req: { "email": string }
  - res: Partner
- POST /api/partners/:id/accept
  - req: none
  - res: Partner
- DELETE /api/partners/:id
  - res: { "ok": true }

Type shapes (API layer):

- Transaction
  - id: string
  - accountId: string
  - date: string (ISO date)
  - amount: string (decimal)
  - merchant?: string
  - category?: string
  - isIncome: boolean
  - status?: "posted" | "pending"

- Budget
  - id: string
  - householdId: string
  - month: string
  - category: string
  - limitAmount: string

- Goal
  - id: string
  - householdId: string
  - name: string
  - targetAmount: string
  - currentAmount: string
  - targetDate: string

- Partner
  - id: string
  - email: string
  - householdId: string
  - status: "invited" | "accepted" | "active"
  - invitedBy: string
  - invitedAt: string
  - acceptedAt?: string

---

## 8. Plaid Sync Logic (transactions/sync)

Algorithm (per link):

1) Initialize cursor from links.cursor (can be null).
2) Loop:
   - Call transactions/sync with access_token, cursor (if set), count=500.
   - Upsert accounts:
     - id = linkID-account_id
     - name = name or official_name
     - balances: update current/available
   - For each added transaction:
     - id = transaction_id
     - accountId = linkID-account_id
     - amount = absolute value of Plaid amount
     - isIncome = (Plaid amount < 0)
     - status = pending or posted
     - merchant/category mapping
     - store original_json (jsonb)
   - For modified transactions: update pending/posted, merchant/category if changed.
   - For removed: delete by transaction_id.
   - Set cursor = next_cursor; continue if has_more = true.
3) Save links.cursor.

Notes:
- Normalize monetary precision consistently (e.g., 2 dp) in API serialization.
- Consider idempotency by using UPSERT on primary keys (transaction_id).

---

## 9. HTTP Handlers (pseudocode)

Health:

    func Health(c *gin.Context) {
      c.JSON(200, gin.H{"ok": true, "ts": time.Now().UnixMilli()})
    }

Create link token:

    func (h *PlaidHandler) CreateLinkToken(c *gin.Context) {
      user := c.MustGet("user").(User) // from auth middleware
      req := plaid.LinkTokenCreateRequest{
        User: plaid.LinkTokenCreateRequestUser{ClientUserId: user.ID},
        ClientName: "Couple Budget",
        Products: toProducts(os.Getenv("PLAID_PRODUCTS")),
        CountryCodes: []plaid.CountryCode{plaid.COUNTRYCODE_US},
        Language: "en",
        Webhook: h.WebhookURL, // e.g. https://host/api/plaid/webhook
      }
      resp, _, err := h.Client.PlaidApi.LinkTokenCreate(c,).LinkTokenCreateRequest(req).Execute()
      if err != nil { c.JSON(500, errJSON(err)); return }
      c.JSON(200, gin.H{"link_token": resp.GetLinkToken()})
    }

Exchange public token:

    func (h *PlaidHandler) Exchange(c *gin.Context) {
      var body struct {
        PublicToken     string `json:"public_token" binding:"required"`
        InstitutionName string `json:"institution_name"`
        ItemID          string `json:"item_id"`
      }
      if err := c.ShouldBindJSON(&body); err != nil { c.JSON(400, errJSON(err)); return }

      ex, _, err := h.Client.PlaidApi.ItemPublicTokenExchange(c,).ItemPublicTokenExchangeRequest(
        plaid.ItemPublicTokenExchangeRequest{PublicToken: body.PublicToken},
      ).Execute()
      if err != nil { c.JSON(500, errJSON(err)); return }

      // create institution and link rows
      inst := Institution{ Name: orDefault(body.InstitutionName, "Plaid Institution"), Aggregator: "plaid",
                           ItemID: orPtrString(body.ItemID), HouseholdID: user.HouseholdID }
      if err := h.DB.Create(&inst).Error; err != nil { c.JSON(500, errJSON(err)); return }

      ct, err := h.Crypto.Encrypt([]byte(ex.GetAccessToken()))
      if err != nil { c.JSON(500, errJSON(err)); return }
      link := Link{ InstitutionID: inst.ID, AccessTokenEncrypted: ct }
      if err := h.DB.Create(&link).Error; err != nil { c.JSON(500, errJSON(err)); return }

      c.JSON(200, gin.H{"ok": true})
    }

Sync:

    func (h *PlaidHandler) Sync(c *gin.Context) {
      // get current user's household links
      links := h.Repo.ListLinks(c, householdID)
      for _, lk := range links {
        if err := h.SyncLink(c, lk); err != nil {
          // log and continue
        }
      }
      c.JSON(200, gin.H{"ok": true})
    }

Webhook:

    func (h *PlaidHandler) Webhook(c *gin.Context) {
      // Optionally verify signatures if enabled in Plaid settings
      // Schedule or trigger sync for the associated item/link
      go h.TriggerSyncForItem(c, itemID)
      c.JSON(200, gin.H{"ok": true})
    }

---

## 10. HTTP Server and Middleware Wiring

Gin server:

    func NewServer(deps Deps) *gin.Engine {
      r := gin.New()
      r.Use(RequestID(), Recover(), Logger(), CORS(deps.Config.CORSOrigin))

      r.GET("/health", Health)

      api := r.Group("/api")
      {
        api.GET("/me", deps.Auth.Require, Me)
        plaid := api.Group("/plaid", deps.Auth.Require)
        {
          plaid.POST("/create-link-token", deps.Plaid.CreateLinkToken)
          plaid.POST("/exchange", deps.Plaid.Exchange)
          plaid.POST("/webhook", deps.Plaid.Webhook) // usually open or signed
          plaid.GET("/sync", deps.Plaid.Sync)
        }
        api.GET("/transactions", deps.Auth.Require, deps.Txns.List)
        budgets := api.Group("/budgets", deps.Auth.Require)
        {
          budgets.GET("", deps.Budgets.List)
          budgets.POST("", deps.Budgets.Create)
        }
        goals := api.Group("/goals", deps.Auth.Require)
        {
          goals.GET("", deps.Goals.List)
          goals.POST("", deps.Goals.Create)
        }
        partners := api.Group("/partners", deps.Auth.Require)
        {
          partners.GET("", deps.Partners.List)
          partners.POST("/invite", deps.Partners.Invite)
          partners.POST("/:id/accept", deps.Partners.Accept)
          partners.DELETE("/:id", deps.Partners.Remove)
        }
      }
      return r
    }

---

## 11. Database Access

Option A: GORM quick start (models.go):

    type Transaction struct {
      ID          string    `gorm:"primaryKey"`
      AccountID   string    `gorm:"index"`
      Date        time.Time `gorm:"index"`
      Amount      decimal.Decimal
      Merchant    *string
      Category    *string
      IsIncome    bool
      Status      *string
      OriginalJSON datatypes.JSON
      CreatedAt   time.Time
    }

    func (r *Repo) UpsertTransaction(ctx context.Context, t *Transaction) error {
      return r.DB.WithContext(ctx).Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "id"}},
        DoUpdates: clause.AssignmentColumns([]string{"status", "merchant", "category", "original_json"}),
      }).Create(t).Error
    }

Option B: sqlc (queries.sql):

    -- name: UpsertTransaction :exec
    INSERT INTO transactions (id, account_id, date, amount, merchant, category, is_income, status, original_json, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
    ON CONFLICT (id) DO UPDATE
      SET status = EXCLUDED.status,
          merchant = EXCLUDED.merchant,
          category = EXCLUDED.category,
          original_json = EXCLUDED.original_json;

Pick one approach and stick with it.

---

## 12. Migrations

Write SQL migrations for the tables and indexes. Example flow:

    golang-migrate -path internal/migrate -database "$DATABASE_URL" up

Seed (optional):
- One household
- Two users in same household
- Example budgets/goals

---

## 13. Error Handling and Responses

- Always return structured JSON errors:
  - status code 4xx/5xx with body: {"error":"message"}
- Map known Plaid errors to 400/401/409 appropriately; log error types and request ids.

Helper:

    func errJSON(err error) gin.H { return gin.H{"error": err.Error()} }

---

## 14. Dockerfile

Multi-stage build:

    FROM golang:1.23-alpine AS builder
    WORKDIR /app
    COPY go.mod go.sum ./
    RUN go mod download
    COPY . .
    RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/api

    FROM gcr.io/distroless/base-debian12
    WORKDIR /
    COPY --from=builder /app/server /server
    EXPOSE 8080
    USER nonroot:nonroot
    ENTRYPOINT ["/server"]

For Arm targets, adjust GOARCH=arm64 or build on target.

---

## 15. Local Development

Prereqs:
- Go 1.22+
- Postgres (local docker or Neon URL)
- Plaid Sandbox keys

Steps:

    cp .env.example .env
    go mod tidy
    # run migrations
    # start server
    go run ./cmd/api

Optional Docker Compose for local db:

    services:
      db:
        image: postgres:16
        environment:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: budget
        ports: ["5432:5432"]
        volumes:
          - pgdata:/var/lib/postgresql/data
    volumes:
      pgdata:

---

## 16. Deployment

Option A: Render (simplest)
- Create a Web Service from the repo with the Dockerfile.
- Add environment variables.
- Attach free Postgres for dev and set DATABASE_URL.

Option B: AWS dev-tier (EC2 + RDS)
- Use Terraform templates (t4g.nano + db.t4g.micro).
- Reverse proxy with Caddy for HTTPS.
- Plaid webhook: https://your-host/api/plaid/webhook
- Cron:
  - Easiest: crontab on EC2 calling curl http://localhost:8080/api/plaid/sync
  - Managed: EventBridge + API destination

---

## 17. Testing

Unit tests:
- Plaid mapping: convert Plaid transaction into internal Transaction
- Encryption: round-trip encrypt/decrypt

Integration tests:
- Use a test database (Docker) and run handler tests via httptest + Gin
- Verify budgets/goals CRUD and transactions summary

Smoke tests:
- Health endpoint 200
- Create link token returns token in sandbox
- Sync populates accounts and transactions

---

## 18. Milestones

1) Skeleton server: health, DB connect, migrations  
2) Plaid link flow: create-link-token, exchange  
3) Sync endpoint + first ingestion of accounts/transactions  
4) Transactions GET with summary  
5) Budgets/Goals CRUD  
6) Partner invitation system: invite, accept, manage  
7) Harden security (CORS, cookie, token encryption) and deploy

---

## 19. Operational Notes

- Rotate APP_SECRET and Plaid secrets periodically; re-encrypt tokens when rotating keys.
- Monitor webhook failures and item errors; provide a manual resync button and error surface in Settings.
- Keep Plaid products minimal (transactions first). Add investments later if needed.
- For performance: paginate transactions, add simple full-text search on merchant/name.

---
