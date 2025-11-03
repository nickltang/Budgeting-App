import { useState, useEffect, useMemo } from 'react';
import { ErrorToast } from '../components/ErrorToast';
import { useDataStore } from '../stores/dataStore';
import { BudgetProgress } from '../components/BudgetProgress';
import { PartnerDetailModal } from '../components/PartnerDetailModal';
import type { Budget, Goal, Transaction, Partner } from '../types';

export function Household() {
  const {
    partners,
    loadPartners,
    invitePartner,
    removePartner,
    budgets,
    loadBudgets,
    goals,
    loadGoals,
    transactions,
    loadTransactions,
  } = useDataStore();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [combinedPartnerId, setCombinedPartnerId] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadPartners(),
          loadBudgets(currentMonth),
          loadGoals(),
          loadTransactions({
            from: firstDay.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
          }),
        ]);
      } catch (err) {
        console.error('Failed to load partners data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadPartners, loadBudgets, loadGoals, loadTransactions, currentMonth]);

  const handleInvitePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setInviting(true);
      await invitePartner(inviteEmail);
      setInviteEmail('');
      setShowInviteForm(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite partner');
    } finally {
      setInviting(false);
    }
  };

  const handleRemovePartner = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this household member? They will lose access to shared budgets and goals.'
      )
    ) {
      return;
    }
    try {
      setError(null);
      await removePartner(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove partner');
    }
  };

  // Calculate individual partner summaries
  const partnerSummaries = useMemo(() => {
    return partners.map((partner) => {
      // In a real app, transactions would be filtered by userId
      // For now, we'll use all transactions as a demo
      const partnerTransactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        return txnDate >= firstDay && txnDate <= today;
      });

      const income = partnerTransactions
        .filter((txn) => txn.isIncome)
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
      const expenses = partnerTransactions
        .filter((txn) => !txn.isIncome)
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
      const net = income - expenses;

      return {
        partnerId: partner.id,
        income,
        expenses,
        net,
        transactionCount: partnerTransactions.length,
      };
    });
  }, [partners, transactions, firstDay, today]);

  // Calculate combined finances (only if a partner is selected for combining)
  const combinedFinances = useMemo(() => {
    if (!combinedPartnerId) return null;

    // Combined income and expenses (all transactions from both partners)
    const income = transactions
      .filter((txn) => txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
    const expenses = transactions
      .filter((txn) => !txn.isIncome)
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
    const net = income - expenses;

    // Budget summary
    let totalBudgetLimit = 0;
    let totalBudgetSpent = 0;
    budgets.forEach((budget) => {
      const limit = parseFloat(budget.limitAmount || '0');
      totalBudgetLimit += limit;
      const spent = transactions
        .filter(
          (txn) =>
            !txn.isIncome &&
            txn.category === budget.category &&
            txn.date.startsWith(budget.month)
        )
        .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
      totalBudgetSpent += spent;
    });

    // Goals summary
    const totalGoalTarget = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.targetAmount || '0'),
      0
    );
    const totalGoalCurrent = goals.reduce(
      (sum, goal) => sum + parseFloat(goal.currentAmount || '0'),
      0
    );
    const goalProgress = totalGoalTarget > 0 ? (totalGoalCurrent / totalGoalTarget) * 100 : 0;

    return {
      income,
      expenses,
      net,
      totalBudgetLimit,
      totalBudgetSpent,
      budgetUsage: totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0,
      totalGoalTarget,
      totalGoalCurrent,
      goalProgress,
    };
  }, [combinedPartnerId, transactions, budgets, goals]);

  if (loading) {
    return (
      <main className="p-4 pb-24 md:pb-4">
        <h1 className="text-2xl font-bold mb-4">Household</h1>
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 rounded-2xl h-32"></div>
          <div className="bg-gray-200 rounded-2xl h-64"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Household</h1>

      {/* Household Member Management */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Household Members</h2>
          {!showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
            >
              + Invite Member
            </button>
          )}
        </div>

        {showInviteForm ? (
          <form onSubmit={handleInvitePartner} className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="member@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                They'll be able to view and manage shared budgets and goals.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {partners.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No household members yet. Invite someone to share budgets and goals with them.
          </p>
        ) : (
          <div className="space-y-3">
            {partners.map((partner) => {
              const summary = partnerSummaries.find((s) => s.partnerId === partner.id);
              return (
                <div 
                  key={partner.id} 
                  className="bg-gray-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPartner(partner)}
                >
                  <div className="p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{partner.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
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
                          <p className="text-xs text-gray-400">
                            Invited {new Date(partner.invitedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCombinedPartnerId(
                              combinedPartnerId === partner.id ? null : partner.id
                            );
                          }}
                          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                            combinedPartnerId === partner.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {combinedPartnerId === partner.id ? 'Combined ✓' : 'Combine'}
                        </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePartner(partner.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove from Household
                      </button>
                      </div>
                    </div>
                  </div>
                  {/* Partner Summary */}
                  {summary && (
                    <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Income</p>
                          <p className="font-semibold text-emerald-600">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(summary.income)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expenses</p>
                          <p className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(summary.expenses)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Net</p>
                          <p
                            className={`font-semibold ${
                              summary.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {summary.net >= 0 ? '+' : ''}
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            }).format(summary.net)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {summary.transactionCount} transactions this month
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Click anywhere to view details →
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {success && !showInviteForm && (
          <p className="text-emerald-600 text-sm mt-2">Household member invited successfully!</p>
        )}
      </div>

      {/* Combined Finances Overview */}
      {partners.length > 0 && combinedPartnerId && combinedFinances && (() => {
        const combinedPartner = partners.find((p) => p.id === combinedPartnerId);
        return (
          <>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Combined Finances
                  </h2>
                  <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                    You + {combinedPartner?.email}
                  </span>
                </div>
                <button
                  onClick={() => setCombinedPartnerId(null)}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Stop Combining
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Showing combined finances between you and {combinedPartner?.email} this month
              </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Combined Income */}
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Combined Income</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(combinedFinances.income)}
                </p>
              </div>

              {/* Combined Expenses */}
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Combined Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(combinedFinances.expenses)}
                </p>
              </div>

              {/* Combined Net */}
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Net</p>
                <p
                  className={`text-2xl font-bold ${
                    combinedFinances.net >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {combinedFinances.net >= 0 ? '+' : ''}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(combinedFinances.net)}
                </p>
              </div>
            </div>

            {/* Shared Budgets Summary */}
            {budgets.length > 0 && (
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Shared Budgets Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(combinedFinances.totalBudgetSpent)}
                    </span>
                    <span className="text-sm text-gray-500">
                      of{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(combinedFinances.totalBudgetLimit)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        combinedFinances.totalBudgetSpent > combinedFinances.totalBudgetLimit
                          ? 'bg-red-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(combinedFinances.budgetUsage, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {combinedFinances.budgetUsage.toFixed(1)}% of combined budgets used
                  </p>
                </div>
              </div>
            )}

            {/* Shared Goals Summary */}
            {goals.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Shared Goals Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(combinedFinances.totalGoalCurrent)}
                    </span>
                    <span className="text-sm text-gray-500">
                      of{' '}
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      }).format(combinedFinances.totalGoalTarget)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(combinedFinances.goalProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {combinedFinances.goalProgress.toFixed(1)}% progress on {goals.length} shared goal
                    {goals.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Budgets */}
          {budgets.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">Shared Budgets</h2>
              <BudgetProgress budgets={budgets} month={currentMonth} />
            </div>
          )}
          </>
        );
      })()}

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <PartnerDetailModal
          partner={selectedPartner}
          transactions={transactions}
          budgets={budgets}
          goals={goals}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </main>
  );
}

