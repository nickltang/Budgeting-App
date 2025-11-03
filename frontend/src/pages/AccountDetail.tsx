import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../stores/dataStore';
import { TxnList } from '../components/TxnList';
import { ErrorToast } from '../components/ErrorToast';

export function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { accounts, transactions, loadAccounts, loadTransactions } = useDataStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadAccounts();
        // Load all transactions, we'll filter by account client-side
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 2, 1); // Last 3 months
        await loadTransactions({
          from: firstDay.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account data');
      } finally {
        setLoading(false);
      }
    };
    if (accountId) {
      loadData();
    }
  }, [accountId, loadAccounts, loadTransactions]);

  const account = useMemo(() => {
    return accounts.find((acc) => acc.id === accountId);
  }, [accounts, accountId]);

  const accountTransactions = useMemo(() => {
    if (!accountId) return [];
    return transactions.filter((txn) => txn.accountId === accountId);
  }, [transactions, accountId]);

  const summary = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTxns = accountTransactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return txnDate >= firstDay && txnDate <= today;
    });

    const income = monthTxns
      .filter((txn) => txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);

    const expenses = monthTxns
      .filter((txn) => !txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);

    return { income, expenses };
  }, [accountTransactions]);

  const getAccountTypeIcon = (type?: string) => {
    switch (type) {
      case 'checking':
        return '💳';
      case 'savings':
        return '💰';
      case 'brokerage':
        return '📈';
      default:
        return '🏦';
    }
  };

  if (loading) {
    return (
      <main className="p-4 pb-24 md:pb-4">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-2xl h-32"></div>
          <div className="bg-gray-200 rounded-2xl h-64"></div>
        </div>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="p-4 pb-24 md:pb-4">
        <h1 className="text-2xl font-bold mb-4">Account Not Found</h1>
        <button
          onClick={() => navigate('/')}
          className="text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Dashboard
        </button>
      </main>
    );
  }

  return (
    <main className="p-4 pb-24 md:pb-4">
      <button
        onClick={() => navigate('/')}
        className="text-emerald-600 hover:text-emerald-700 mb-4 text-sm font-medium"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{getAccountTypeIcon(account.type)}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
            <p className="text-gray-500">{account.institution} • •••• {account.mask}</p>
            <p className="text-sm text-gray-400 capitalize">{account.type}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(parseFloat(account.balance))}
            </p>
            <p className="text-sm text-gray-500">Current Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Income This Month</p>
            <p className="text-lg font-semibold text-emerald-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(summary.income)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Spending This Month</p>
            <p className="text-lg font-semibold text-red-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(summary.expenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Net This Month</p>
            <p
              className={`text-lg font-semibold ${
                summary.income - summary.expenses >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(summary.income - summary.expenses)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
        <p className="text-sm text-gray-500">
          Showing {accountTransactions.length} transaction{accountTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <TxnList transactions={accountTransactions} />

      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </main>
  );
}

