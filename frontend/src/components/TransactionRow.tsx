import { useState } from 'react';
import type { Transaction } from '../types';
import { useDataStore } from '../stores/dataStore';

interface TransactionRowProps {
  txn: Transaction;
  accountName?: string;
}

const commonCategories = [
  'Food',
  'Groceries',
  'Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Utilities',
  'Rent',
  'Income',
  'Transfer',
  'Investment',
  'Health',
  'Travel',
  'Other',
];

export function TransactionRow({ txn, accountName }: TransactionRowProps) {
  const { accounts, updateTransaction } = useDataStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState(txn.category || '');
  const [isSaving, setIsSaving] = useState(false);

  const account = accountName || accounts.find((acc) => acc.id === txn.accountId)?.name;

  const amount = parseFloat(txn.amount || '0');
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateTransaction(txn.id, editCategory.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction label';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditCategory(txn.category || '');
    setIsEditing(false);
  };

  return (
    <div className="border-b border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{txn.merchant || 'Transaction'}</p>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  list="categories"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="text-sm px-2 py-1 border border-gray-300 rounded flex-1 max-w-[200px]"
                  placeholder="Enter category"
                  autoFocus
                />
                <datalist id="categories">
                  {commonCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-500 hover:text-emerald-600 hover:underline"
                >
                  {txn.category || 'Uncategorized'}
                </button>
                {account && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {account}
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{new Date(txn.date).toLocaleDateString()}</p>
        </div>
        <div className={`font-semibold ${txn.isIncome ? 'text-emerald-600' : 'text-gray-900'}`}>
          {txn.isIncome ? '+' : '-'}{formattedAmount}
        </div>
      </div>
    </div>
  );
}

