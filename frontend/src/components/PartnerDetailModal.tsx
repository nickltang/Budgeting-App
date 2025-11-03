import { useMemo } from 'react';
import type { Partner, Transaction, Budget, Goal } from '../types';
import { TxnList } from './TxnList';

interface PartnerDetailModalProps {
  partner: Partner;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  onClose: () => void;
}

export function PartnerDetailModal({
  partner,
  transactions,
  budgets,
  goals,
  onClose,
}: PartnerDetailModalProps) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  // Filter transactions for current month (in a real app, these would be filtered by partner/userId)
  const partnerTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= firstDay && txnDate <= today;
    });
  }, [transactions, firstDay, today]);

  // Calculate partner's finances
  const partnerFinances = useMemo(() => {
    const income = partnerTransactions
      .filter((txn) => txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
    const expenses = partnerTransactions
      .filter((txn) => !txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
    const net = income - expenses;

    // Budget summary (shared budgets, but show spending from this partner's transactions)
    let totalBudgetSpent = 0;
    budgets.forEach((budget) => {
      const spent = partnerTransactions
        .filter(
          (txn) =>
            !txn.isIncome &&
            txn.category === budget.category &&
            txn.date.startsWith(budget.month)
        )
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
      totalBudgetSpent += spent;
    });

    // Goals (shared, so show the same progress)
    const totalGoalCurrent = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.currentAmount || '0'),
      0
    );
    const totalGoalTarget = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.targetAmount || '0'),
      0
    );

    return {
      income,
      expenses,
      net,
      totalBudgetSpent,
      totalGoalCurrent,
      totalGoalTarget,
      transactionCount: partnerTransactions.length,
    };
  }, [partnerTransactions, budgets, goals]);

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{partner.email}</h2>
              <p className="text-sm text-gray-500 mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    partner.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : partner.status === 'accepted'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {partner.status === 'active'
                    ? 'Active'
                    : partner.status === 'accepted'
                    ? 'Accepted'
                    : 'Pending'}
                </span>
                {' • '}
                Partner since {new Date(partner.invitedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">This Month Income</p>
              <p className="text-xl font-bold text-emerald-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(partnerFinances.income)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">This Month Expenses</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(partnerFinances.expenses)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Net</p>
              <p
                className={`text-xl font-bold ${
                  partnerFinances.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {partnerFinances.net >= 0 ? '+' : ''}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(partnerFinances.net)}
              </p>
            </div>
          </div>

          {/* Shared Budgets Contribution */}
          {budgets.length > 0 && (
            <div className="mt-4 bg-emerald-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Contribution to Shared Budgets
              </p>
              <p className="text-lg font-bold text-gray-900">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(partnerFinances.totalBudgetSpent)}
              </p>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold mb-4">
            Transactions ({partnerFinances.transactionCount})
          </h3>
          {partnerTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No transactions this month</p>
            </div>
          ) : (
            <TxnList transactions={partnerTransactions} />
          )}
        </div>
      </div>
    </div>
  );
}

