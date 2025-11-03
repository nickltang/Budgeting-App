import { useState } from 'react';
import type { Budget } from '../types';
import { useDataStore } from '../stores/dataStore';
import { useMemo } from 'react';
import { BudgetDetailModal } from './BudgetDetailModal';

interface BudgetProgressProps {
  budgets: Budget[];
  month: string;
}

export function BudgetProgress({ budgets, month }: BudgetProgressProps) {
  const { transactions, partners } = useDataStore();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const budgetWithSpending = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (txn) =>
            !txn.isIncome &&
            txn.category === budget.category &&
            txn.date.startsWith(budget.month)
        )
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);

      return {
        ...budget,
        spent,
        limit: parseFloat(budget.limitAmount || '0'),
      };
    });
  }, [budgets, transactions, month]);

  if (budgetWithSpending.length === 0) {
    return <div className="text-gray-400 text-center mt-10">No budgets for this month</div>;
  }

  return (
    <>
      <div className="space-y-4">
        {budgetWithSpending.map((budget) => {
          const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
          const isOver = budget.spent > budget.limit;

          return (
            <div
              key={budget.id}
              className="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedBudget(budget)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                    {partners.length > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span>👥</span>
                        <span>Shared</span>
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(budget.spent)}{' '}
                  /{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(budget.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className={`text-xs ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                  {percentage.toFixed(1)}% used
                </p>
                <p className="text-xs text-gray-400">Click to view transactions →</p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBudget && (
        <BudgetDetailModal
          budget={selectedBudget}
          transactions={transactions}
          onClose={() => setSelectedBudget(null)}
        />
      )}
    </>
  );
}

