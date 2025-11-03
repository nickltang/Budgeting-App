export type Account = {
  id: string;
  institutionId: string;
  name: string;
  type: "checking" | "savings" | "brokerage";
  mask: string;
  balance: string;
  institution: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string;        // ISO date
  amount: string;      // decimal as string
  merchant?: string;
  category?: string;
  isIncome: boolean;
  status?: "posted" | "pending";
  // For editing
  label?: string;      // User-defined label (alias for category)
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

