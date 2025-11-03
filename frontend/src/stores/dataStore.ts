import { create } from 'zustand';
import type { Account, Transaction, Budget, Goal, Partner } from '../types';
import { api } from '../lib/api';

interface Summary {
  income: string;
  expenses: string;
}

interface DataStore {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  partners: Partner[];
  summary?: Summary;
  loadAccounts: () => Promise<void>;
  loadTransactions: (params?: {
    from?: string;
    to?: string;
    category?: string;
    q?: string;
    accountId?: string;
  }) => Promise<void>;
  updateTransaction: (id: string, category: string) => Promise<void>;
  loadBudgets: (month: string) => Promise<void>;
  createBudget: (input: { month: string; category: string; limitAmount: string }) => Promise<void>;
  loadGoals: () => Promise<void>;
  createGoal: (input: { name: string; targetAmount: string; targetDate: string }) => Promise<void>;
  loadPartners: () => Promise<void>;
  invitePartner: (email: string) => Promise<void>;
  acceptPartnerInvite: (id: string) => Promise<void>;
  removePartner: (id: string) => Promise<void>;
}

export const useDataStore = create<DataStore>((set, get) => ({
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  partners: [],
  summary: undefined,
  loadAccounts: async () => {
    const accounts = await api.get<Account[]>('/api/accounts');
    set({ accounts });
  },
  loadTransactions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.category) query.set('category', params.category);
    if (params.q) query.set('q', params.q);
    if (params.accountId) query.set('accountId', params.accountId);

    const data = await api.get<{ transactions: Transaction[]; summary: Summary }>(
      `/api/transactions?${query.toString()}`
    );
    set({ transactions: data.transactions, summary: data.summary });
  },
  updateTransaction: async (id: string, category: string) => {
    try {
      const updated = await api.patch<Transaction>(`/api/transactions/${id}`, { category });
      const transactions = get().transactions;
      const index = transactions.findIndex((t) => t.id === id);
      if (index !== -1) {
        transactions[index] = updated;
        set({ transactions: [...transactions] });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },
  loadBudgets: async (month: string) => {
    const data = await api.get<{ month: string; budgets: Budget[] }>(
      `/api/budgets?month=${month}`
    );
    set({ budgets: data.budgets });
  },
  createBudget: async (input) => {
    const budget = await api.post<Budget>('/api/budgets', input);
    const budgets = get().budgets;
    set({ budgets: [...budgets, budget] });
  },
  loadGoals: async () => {
    const goals = await api.get<Goal[]>('/api/goals');
    set({ goals });
  },
  createGoal: async (input) => {
    const goal = await api.post<Goal>('/api/goals', input);
    const goals = get().goals;
    set({ goals: [...goals, goal] });
  },
  loadPartners: async () => {
    const partners = await api.get<Partner[]>('/api/partners');
    set({ partners });
  },
  invitePartner: async (email: string) => {
    const partner = await api.post<Partner>('/api/partners/invite', { email });
    const partners = get().partners;
    set({ partners: [...partners, partner] });
  },
  acceptPartnerInvite: async (id: string) => {
    const partner = await api.post<Partner>(`/api/partners/${id}/accept`, {});
    const partners = get().partners;
    const index = partners.findIndex((p) => p.id === id);
    if (index !== -1) {
      partners[index] = partner;
      set({ partners: [...partners] });
    }
  },
  removePartner: async (id: string) => {
    await api.delete(`/api/partners/${id}`);
    const partners = get().partners;
    set({ partners: partners.filter((p) => p.id !== id) });
  },
}));

