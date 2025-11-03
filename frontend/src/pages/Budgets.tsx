import { useEffect, useState } from 'react';
import { BudgetProgress } from '../components/BudgetProgress';
import { useDataStore } from '../stores/dataStore';
import { ErrorToast } from '../components/ErrorToast';
import { EmptyState } from '../components/EmptyState';

export function Budgets() {
  const { budgets, loadBudgets, createBudget, loadTransactions, partners, loadPartners } = useDataStore();
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudgets(month).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    });
    loadPartners().catch((err) => {
      console.error('Failed to load partners:', err);
    });
    
    // Load transactions for the selected month so the modal can display them
    const [year, monthNum] = month.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    loadTransactions({
      from: firstDay.toISOString().split('T')[0],
      to: lastDay.toISOString().split('T')[0],
    }).catch((err) => {
      console.error('Failed to load transactions:', err);
    });
  }, [month, loadBudgets, loadTransactions, loadPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      await createBudget({ month, category, limitAmount });
      setCategory('');
      setLimitAmount('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Budgets</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 mb-4"
        >
          Add Budget
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Food, Rent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
            <input
              type="number"
              step="0.01"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.00"
            />
          </div>
          
          {/* Sharing Info */}
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 text-lg">👥</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-900 mb-1">
                  Shared Budget
                </p>
                <p className="text-xs text-emerald-700">
                  This budget will be automatically shared with{' '}
                  {partners.length === 0 ? (
                    'all household members'
                  ) : (
                    <>
                      {partners.length} household member{partners.length !== 1 ? 's' : ''} (
                      {partners.map((p) => p.email).join(', ')})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setCategory('');
                setLimitAmount('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {budgets.length === 0 && !showForm ? (
        <EmptyState
          title="No budgets yet"
          message="Create a budget to track your spending by category"
        />
      ) : (
        <BudgetProgress budgets={budgets} month={month} />
      )}

      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </main>
  );
}

