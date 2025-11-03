import { useEffect } from 'react';
import { FiltersBar } from '../components/FiltersBar';
import { TxnList } from '../components/TxnList';
import { useDataStore } from '../stores/dataStore';
import { ErrorToast } from '../components/ErrorToast';
import { useState } from 'react';

export function Transactions() {
  const { transactions, summary, loadTransactions, loadAccounts } = useDataStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    loadTransactions().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    });
  }, [loadTransactions, loadAccounts]);

  const handleFilter = async (filters: {
    from?: string;
    to?: string;
    category?: string;
    q?: string;
    accountId?: string;
  }) => {
    try {
      setError(null);
      await loadTransactions(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter transactions');
    }
  };

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      {summary && (
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-lg font-semibold text-emerald-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(parseFloat(summary.income || '0'))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-lg font-semibold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(parseFloat(summary.expenses || '0'))}
              </p>
            </div>
          </div>
        </div>
      )}

      <FiltersBar onFilter={handleFilter} />

      <TxnList transactions={transactions} />

      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </main>
  );
}

