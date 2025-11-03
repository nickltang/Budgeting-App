import { useMemo } from 'react';
import type { Budget, Transaction } from '../types';
import { TransactionRow } from './TransactionRow';

interface BudgetDetailModalProps {
  budget: Budget;
  transactions: Transaction[];
  onClose: () => void;
}

export function BudgetDetailModal({ budget, transactions, onClose }: BudgetDetailModalProps) {
  const budgetTransactions = useMemo(() => {
    return transactions.filter(
      (txn) =>
        !txn.isIncome &&
        txn.category === budget.category &&
        txn.date.startsWith(budget.month)
    );
  }, [transactions, budget]);

  const totalSpent = useMemo(() => {
    return budgetTransactions.reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
  }, [budgetTransactions]);

  const limit = parseFloat(budget.limitAmount || '0');
  const percentage = limit > 0 ? (totalSpent / limit) * 100 : 0;
  const isOver = totalSpent > limit;

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{budget.category} Budget</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(budget.month + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Budget Progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Spent</span>
              <span className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(totalSpent)}{' '}
                /{' '}
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(limit)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className={`text-xs ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                {percentage.toFixed(1)}% used
              </p>
              {isOver && (
                <p className="text-xs text-red-600 font-medium">
                  Over by{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(totalSpent - limit)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold mb-4">
            Transactions ({budgetTransactions.length})
          </h3>
          {budgetTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No transactions in this category for this month</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              {budgetTransactions.map((txn) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

