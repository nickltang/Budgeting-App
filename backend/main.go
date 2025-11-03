package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Types matching frontend contracts
type Account struct {
	ID            string `json:"id"`
	InstitutionID string `json:"institutionId"`
	Name          string `json:"name"`
	Type          string `json:"type"` // checking, savings, brokerage
	Mask          string `json:"mask"`
	Balance       string `json:"balance"`
	Institution   string `json:"institution"`
}

type Transaction struct {
	ID        string  `json:"id"`
	AccountID string  `json:"accountId"`
	Date      string  `json:"date"`
	Amount    string  `json:"amount"`
	Merchant  *string `json:"merchant,omitempty"`
	Category  *string `json:"category,omitempty"`
	IsIncome  bool    `json:"isIncome"`
	Status    *string `json:"status,omitempty"`
}

type Budget struct {
	ID          string `json:"id"`
	HouseholdID string `json:"householdId"`
	Month       string `json:"month"`
	Category    string `json:"category"`
	LimitAmount string `json:"limitAmount"`
}

type Goal struct {
	ID            string `json:"id"`
	HouseholdID   string `json:"householdId"`
	Name          string `json:"name"`
	TargetAmount  string `json:"targetAmount"`
	CurrentAmount string `json:"currentAmount"`
	TargetDate    string `json:"targetDate"`
}

type Partner struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	HouseholdID string `json:"householdId"`
	Status      string `json:"status"` // "invited", "accepted", "active"
	InvitedBy   string `json:"invitedBy"`
	InvitedAt   string `json:"invitedAt"`
	AcceptedAt  string `json:"acceptedAt,omitempty"`
}

type PartnerInvite struct {
	Email string `json:"email" binding:"required"`
}

type TransactionsResponse struct {
	Transactions []Transaction `json:"transactions"`
	Summary      struct {
		Income   string `json:"income"`
		Expenses string `json:"expenses"`
	} `json:"summary"`
}

type BudgetsResponse struct {
	Month   string   `json:"month"`
	Budgets []Budget `json:"budgets"`
}

// In-memory data stores
type DataStore struct {
	mu           sync.RWMutex
	accounts     []Account
	transactions []Transaction
	budgets      []Budget
	goals        []Goal
	partners     []Partner
	nextID       int
}

func NewDataStore() *DataStore {
	store := &DataStore{
		accounts:     make([]Account, 0),
		transactions: make([]Transaction, 0),
		budgets:      make([]Budget, 0),
		goals:        make([]Goal, 0),
		partners:     make([]Partner, 0),
		nextID:       1,
	}
	store.seedData()
	return store
}

func (ds *DataStore) seedData() {
	now := time.Now()

	// Seed accounts
	ds.accounts = []Account{
		{
			ID:            "acc-checking-1",
			InstitutionID: "inst-chase",
			Name:          "Chase Total Checking",
			Type:          "checking",
			Mask:          "1234",
			Balance:       "5420.50",
			Institution:   "Chase",
		},
		{
			ID:            "acc-savings-1",
			InstitutionID: "inst-chase",
			Name:          "Chase Savings",
			Type:          "savings",
			Mask:          "5678",
			Balance:       "15230.00",
			Institution:   "Chase",
		},
		{
			ID:            "acc-brokerage-1",
			InstitutionID: "inst-fidelity",
			Name:          "Fidelity Brokerage",
			Type:          "brokerage",
			Mask:          "9012",
			Balance:       "45678.90",
			Institution:   "Fidelity",
		},
	}

	// Seed sample transactions distributed across accounts
	categories := []string{"Food", "Rent", "Groceries", "Utilities", "Entertainment", "Investment", "Dividend", "Transfer"}
	merchants := []string{"Whole Foods", "Starbucks", "Amazon", "Electric Company", "Netflix", "Target", "Shell", "Apple Store", "Dividend Payment", "Stock Purchase"}
	accountIDs := []string{"acc-checking-1", "acc-savings-1", "acc-brokerage-1"}

	// Generate transactions across the last 90 days, with emphasis on current month
	// Get first day of current month
	firstDayOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	daysSinceMonthStart := now.Day()

	for i := 0; i < 40; i++ {
		var date time.Time
		// First 20 transactions are in the current month, rest are spread over last 90 days
		if i < 20 {
			// Current month transactions - spread across days since month start
			daysAgo := daysSinceMonthStart - 1 - (i % daysSinceMonthStart)
			if daysAgo < 0 {
				daysAgo = 0
			}
			date = now.AddDate(0, 0, -daysAgo)
			// Ensure it's within current month
			if date.Before(firstDayOfMonth) {
				date = firstDayOfMonth.AddDate(0, 0, i%daysSinceMonthStart)
			}
		} else {
			// Older transactions
			daysAgo := 30 + (i-20)*4
			date = now.AddDate(0, 0, -daysAgo)
		}

		isIncome := i%10 == 0 || i%11 == 0 // Every 10th or 11th transaction is income

		// Brokerage accounts have different transaction types
		accountIdx := i % len(accountIDs)
		accountID := accountIDs[accountIdx]
		isBrokerage := accountID == "acc-brokerage-1"

		var amount float64
		var category, merchant string

		if isIncome {
			if isBrokerage {
				amount = 500.0 + float64(i*10)
				category = "Dividend"
				merchant = "Dividend Payment"
			} else {
				amount = 2000.0 + float64(i*50)
				category = "Income"
				merchant = "Salary"
			}
		} else {
			if isBrokerage {
				amount = 100.0 + float64(i*5)
				category = "Investment"
				merchant = "Stock Purchase"
			} else {
				amount = 10.0 + float64(i*5)
				categoryIdx := i % len(categories)
				merchantIdx := i % len(merchants)
				category = categories[categoryIdx]
				merchant = merchants[merchantIdx]
			}
		}

		status := "posted"
		if i%5 == 0 {
			status = "pending"
		}

		txn := Transaction{
			ID:        fmt.Sprintf("txn-%d", i+1),
			AccountID: accountID,
			Date:      date.Format(time.RFC3339),
			Amount:    fmt.Sprintf("%.2f", amount),
			Merchant:  &merchant,
			Category:  &category,
			IsIncome:  isIncome,
			Status:    &status,
		}
		ds.transactions = append(ds.transactions, txn)
	}

	// Seed sample budgets for current month
	currentMonth := now.Format("2006-01")
	ds.budgets = []Budget{
		{
			ID:          "budget-1",
			HouseholdID: "household-1",
			Month:       currentMonth,
			Category:    "Food",
			LimitAmount: "500.00",
		},
		{
			ID:          "budget-2",
			HouseholdID: "household-1",
			Month:       currentMonth,
			Category:    "Utilities",
			LimitAmount: "200.00",
		},
		{
			ID:          "budget-3",
			HouseholdID: "household-1",
			Month:       currentMonth,
			Category:    "Entertainment",
			LimitAmount: "100.00",
		},
	}

	// Seed sample goals
	targetDate := now.AddDate(0, 6, 0) // 6 months from now
	ds.goals = []Goal{
		{
			ID:            "goal-1",
			HouseholdID:   "household-1",
			Name:          "Emergency Fund",
			TargetAmount:  "10000.00",
			CurrentAmount: "3500.00",
			TargetDate:    targetDate.Format(time.RFC3339),
		},
		{
			ID:            "goal-2",
			HouseholdID:   "household-1",
			Name:          "Vacation Fund",
			TargetAmount:  "3000.00",
			CurrentAmount: "800.00",
			TargetDate:    targetDate.AddDate(0, 2, 0).Format(time.RFC3339),
		},
	}

	// Seed sample partners
	ds.partners = []Partner{
		{
			ID:          "partner-1",
			Email:       "partner@example.com",
			HouseholdID: "household-1",
			Status:      "active",
			InvitedBy:   "user-1",
			InvitedAt:   now.AddDate(0, 0, -10).Format(time.RFC3339),
			AcceptedAt:  now.AddDate(0, 0, -9).Format(time.RFC3339),
		},
		{
			ID:          "partner-2",
			Email:       "pending@example.com",
			HouseholdID: "household-1",
			Status:      "invited",
			InvitedBy:   "user-1",
			InvitedAt:   now.AddDate(0, 0, -2).Format(time.RFC3339),
		},
	}
}

func (ds *DataStore) getNextID() string {
	ds.mu.Lock()
	defer ds.mu.Unlock()
	id := fmt.Sprintf("id-%d", ds.nextID)
	ds.nextID++
	return id
}

// CORS middleware
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "http://localhost:5173" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	store := NewDataStore()

	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(corsMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"ok": true,
			"ts": time.Now().UnixMilli(),
		})
	})

	// Optional /api/me endpoint (stub)
	r.GET("/api/me", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"id":          "user-1",
			"email":       "demo@example.com",
			"householdId": "household-1",
		})
	})

	// Plaid endpoints
	api := r.Group("/api")
	{
		plaid := api.Group("/plaid")
		{
			plaid.POST("/create-link-token", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"link_token": "demo-link-token",
				})
			})

			plaid.POST("/exchange", func(c *gin.Context) {
				var body map[string]interface{}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				// Simulate adding accounts when linking
				// In a real app, this would come from Plaid's API
				// For demo, we'll just return success since accounts are already seeded
				c.JSON(http.StatusOK, gin.H{"ok": true})
			})

			plaid.GET("/sync", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{"ok": true})
			})
		}

		// Accounts
		api.GET("/accounts", func(c *gin.Context) {
			store.mu.RLock()
			defer store.mu.RUnlock()

			// Return a copy
			result := make([]Account, len(store.accounts))
			copy(result, store.accounts)
			c.JSON(http.StatusOK, result)
		})

		// Update transaction label/category
		api.PATCH("/transactions/:id", func(c *gin.Context) {
			txnID := c.Param("id")
			var input struct {
				Category string `json:"category"`
			}

			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			store.mu.Lock()
			defer store.mu.Unlock()

			// Find and update transaction
			for i := range store.transactions {
				if store.transactions[i].ID == txnID {
					// Set category - allow empty string
					category := input.Category
					store.transactions[i].Category = &category
					c.JSON(http.StatusOK, store.transactions[i])
					return
				}
			}

			c.JSON(http.StatusNotFound, gin.H{"error": "Transaction not found"})
		})

		// Transactions
		api.GET("/transactions", func(c *gin.Context) {
			store.mu.RLock()
			defer store.mu.RUnlock()

			transactions := store.transactions

			// Filter by date range if provided
			from := c.Query("from")
			to := c.Query("to")
			if from != "" || to != "" {
				filtered := make([]Transaction, 0)
				for _, txn := range transactions {
					txnDate := txn.Date[:10] // Extract date part
					if from != "" && txnDate < from {
						continue
					}
					if to != "" && txnDate > to {
						continue
					}
					filtered = append(filtered, txn)
				}
				transactions = filtered
			}

			// Filter by account if provided
			if accountID := c.Query("accountId"); accountID != "" {
				filtered := make([]Transaction, 0)
				for _, txn := range transactions {
					if txn.AccountID == accountID {
						filtered = append(filtered, txn)
					}
				}
				transactions = filtered
			}

			// Filter by category if provided
			if category := c.Query("category"); category != "" {
				filtered := make([]Transaction, 0)
				for _, txn := range transactions {
					if txn.Category != nil && *txn.Category == category {
						filtered = append(filtered, txn)
					}
				}
				transactions = filtered
			}

			// Filter by search query if provided
			if q := c.Query("q"); q != "" {
				filtered := make([]Transaction, 0)
				qLower := strings.ToLower(q)
				for _, txn := range transactions {
					match := false
					if txn.Merchant != nil {
						match = strings.Contains(strings.ToLower(*txn.Merchant), qLower)
					}
					if !match && txn.Category != nil {
						match = strings.Contains(strings.ToLower(*txn.Category), qLower)
					}
					if match {
						filtered = append(filtered, txn)
					}
				}
				transactions = filtered
			}

			// Calculate summary
			var income, expenses float64
			for _, txn := range transactions {
				amt, _ := strconv.ParseFloat(txn.Amount, 64)
				if txn.IsIncome {
					income += amt
				} else {
					expenses += amt
				}
			}

			c.JSON(http.StatusOK, TransactionsResponse{
				Transactions: transactions,
				Summary: struct {
					Income   string `json:"income"`
					Expenses string `json:"expenses"`
				}{
					Income:   fmt.Sprintf("%.2f", income),
					Expenses: fmt.Sprintf("%.2f", expenses),
				},
			})
		})

		// Budgets
		budgets := api.Group("/budgets")
		{
			budgets.GET("", func(c *gin.Context) {
				month := c.Query("month")
				if month == "" {
					month = time.Now().Format("2006-01")
				}

				store.mu.RLock()
				defer store.mu.RUnlock()

				filtered := make([]Budget, 0)
				for _, budget := range store.budgets {
					if budget.Month == month {
						filtered = append(filtered, budget)
					}
				}

				c.JSON(http.StatusOK, BudgetsResponse{
					Month:   month,
					Budgets: filtered,
				})
			})

			budgets.POST("", func(c *gin.Context) {
				var input struct {
					Month       string `json:"month" binding:"required"`
					Category    string `json:"category" binding:"required"`
					LimitAmount string `json:"limitAmount" binding:"required"`
				}

				if err := c.ShouldBindJSON(&input); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				budget := Budget{
					ID:          store.getNextID(),
					HouseholdID: "household-1",
					Month:       input.Month,
					Category:    input.Category,
					LimitAmount: input.LimitAmount,
				}

				store.mu.Lock()
				store.budgets = append(store.budgets, budget)
				store.mu.Unlock()

				c.JSON(http.StatusOK, budget)
			})
		}

		// Goals
		goals := api.Group("/goals")
		{
			goals.GET("", func(c *gin.Context) {
				store.mu.RLock()
				defer store.mu.RUnlock()

				// Return a copy
				result := make([]Goal, len(store.goals))
				copy(result, store.goals)
				c.JSON(http.StatusOK, result)
			})

			goals.POST("", func(c *gin.Context) {
				var input struct {
					Name         string `json:"name" binding:"required"`
					TargetAmount string `json:"targetAmount" binding:"required"`
					TargetDate   string `json:"targetDate" binding:"required"`
				}

				if err := c.ShouldBindJSON(&input); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				goal := Goal{
					ID:            store.getNextID(),
					HouseholdID:   "household-1",
					Name:          input.Name,
					TargetAmount:  input.TargetAmount,
					CurrentAmount: "0.00",
					TargetDate:    input.TargetDate,
				}

				store.mu.Lock()
				store.goals = append(store.goals, goal)
				store.mu.Unlock()

				c.JSON(http.StatusOK, goal)
			})
		}

		// Partners
		partners := api.Group("/partners")
		{
			partners.GET("", func(c *gin.Context) {
				store.mu.RLock()
				defer store.mu.RUnlock()

				// Return partners for current household (household-1)
				filtered := make([]Partner, 0)
				for _, partner := range store.partners {
					if partner.HouseholdID == "household-1" {
						filtered = append(filtered, partner)
					}
				}
				c.JSON(http.StatusOK, filtered)
			})

			partners.POST("/invite", func(c *gin.Context) {
				var input PartnerInvite
				if err := c.ShouldBindJSON(&input); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}

				// Check if partner already exists
				store.mu.RLock()
				for _, p := range store.partners {
					if p.Email == input.Email && p.HouseholdID == "household-1" {
						store.mu.RUnlock()
						c.JSON(http.StatusConflict, gin.H{"error": "Partner already invited"})
						return
					}
				}
				store.mu.RUnlock()

				partner := Partner{
					ID:          store.getNextID(),
					Email:       input.Email,
					HouseholdID: "household-1",
					Status:      "invited",
					InvitedBy:   "user-1",
					InvitedAt:   time.Now().Format(time.RFC3339),
				}

				store.mu.Lock()
				store.partners = append(store.partners, partner)
				store.mu.Unlock()

				c.JSON(http.StatusOK, partner)
			})

			partners.POST("/:id/accept", func(c *gin.Context) {
				partnerID := c.Param("id")

				store.mu.Lock()
				defer store.mu.Unlock()

				for i := range store.partners {
					if store.partners[i].ID == partnerID {
						store.partners[i].Status = "active"
						store.partners[i].AcceptedAt = time.Now().Format(time.RFC3339)
						c.JSON(http.StatusOK, store.partners[i])
						return
					}
				}

				c.JSON(http.StatusNotFound, gin.H{"error": "Partner not found"})
			})

			partners.DELETE("/:id", func(c *gin.Context) {
				partnerID := c.Param("id")

				store.mu.Lock()
				defer store.mu.Unlock()

				for i, partner := range store.partners {
					if partner.ID == partnerID {
						store.partners = append(store.partners[:i], store.partners[i+1:]...)
						c.JSON(http.StatusOK, gin.H{"ok": true})
						return
					}
				}

				c.JSON(http.StatusNotFound, gin.H{"error": "Partner not found"})
			})
		}
	}

	log.Printf("Server starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
