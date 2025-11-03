import { useMemo } from 'react';
import type { Budget, Goal, Transaction } from '../types';

interface PartnerSummaryProps {
  budgets: Budget[];
  goals: Goal[];
  transactions: Transaction[];
}

export function PartnerSummary({ budgets, goals, transactions }: PartnerSummaryProps) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  // Filter budgets for current month
  const currentBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === currentMonth);
  }, [budgets, currentMonth]);

  // Calculate total budget limits and spent
  const budgetSummary = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;

    currentBudgets.forEach((budget) => {
      const limit = parseFloat(budget.limitAmount || '0');
      totalLimit += limit;

      const spent = transactions
        .filter(
          (txn) =>
            !txn.isIncome &&
            txn.category === budget.category &&
            txn.date.startsWith(budget.month)
        )
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
      totalSpent += spent;
    });

    return { totalLimit, totalSpent };
  }, [currentBudgets, transactions]);

  // Calculate goals progress
  const goalsSummary = useMemo(() => {
    const totalTarget = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.targetAmount || '0'),
      0
    );
    const totalCurrent = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.currentAmount || '0'),
      0
    );
    const progress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    return { totalTarget, totalCurrent, progress };
  }, [goals]);

  if (currentBudgets.length === 0 && goals.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Shared Finances</h2>
        <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
          Together
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shared Budgets */}
        {currentBudgets.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Shared Budgets This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(budgetSummary.totalSpent)}
                </span>
                <span className="text-sm text-gray-500">
                  of{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(budgetSummary.totalLimit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    budgetSummary.totalSpent > budgetSummary.totalLimit
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      (budgetSummary.totalSpent / budgetSummary.totalLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {currentBudgets.length} budget{currentBudgets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Shared Goals */}
        {goals.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Shared Goals</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(goalsSummary.totalCurrent)}
                </span>
                <span className="text-sm text-gray-500">
                  of{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(goalsSummary.totalTarget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(goalsSummary.progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {goalsSummary.progress.toFixed(1)}% progress • {goals.length} goal{goals.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

