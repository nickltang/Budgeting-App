import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { KPIs } from '../components/KPIs';
import { TrendChart } from '../components/TrendChart';
import { EmptyState } from '../components/EmptyState';
import { AccountSummary } from '../components/AccountSummary';
import { PartnerSummary } from '../components/PartnerSummary';
import { useDataStore } from '../stores/dataStore';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const {
    transactions,
    summary,
    loadTransactions,
    loadAccounts,
    accounts,
    partners,
    loadPartners,
    budgets,
    loadBudgets,
    goals,
    loadGoals,
  } = useDataStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await loadAccounts();
        await loadPartners();
        
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        await Promise.all([
          loadTransactions({
            from: firstDay.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
          }),
          loadBudgets(currentMonth),
          loadGoals(),
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // Reload when navigating to this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Reload when pathname changes to '/'

  const net = useMemo(() => {
    const income = parseFloat(summary?.income || '0');
    const expenses = parseFloat(summary?.expenses || '0');
    return (income - expenses).toFixed(2);
  }, [summary]);

  const hasTransactions = transactions.length > 0;
  const hasAccounts = accounts.length > 0;

  if (loading) {
    return (
      <main className="p-4 pb-24 md:pb-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-2xl h-24"></div>
          <div className="bg-gray-200 rounded-2xl h-64"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {partners.length > 0 && (
        <PartnerSummary budgets={budgets} goals={goals} transactions={transactions} />
      )}

      {hasAccounts && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Accounts</h2>
          <div className="space-y-4">
            {accounts.map((account) => (
              <AccountSummary
                key={account.id}
                account={account}
                transactions={transactions}
              />
            ))}
          </div>
        </div>
      )}

      {hasTransactions ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-4">This Month's Overview</h2>
            <KPIs
              income={summary?.income || '0'}
              spending={summary?.expenses || '0'}
              net={net}
            />
          </div>
          <TrendChart />
        </>
      ) : hasAccounts ? (
        <EmptyState
          title="No transactions this month"
          message="Your accounts are linked, but there are no transactions for the current month yet."
        />
      ) : (
        <EmptyState
          title="No transactions yet"
          message="Link your bank account to get started"
          action={{
            label: 'Link Bank Account',
            onClick: () => navigate('/link'),
          }}
        />
      )}
    </main>
  );
}

