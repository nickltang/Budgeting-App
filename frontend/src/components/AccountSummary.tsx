import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Account, Transaction } from '../types';

interface AccountSummaryProps {
  account: Account;
  transactions: Transaction[];
}

export function AccountSummary({ account, transactions }: AccountSummaryProps) {
  const navigate = useNavigate();

  const accountTransactions = useMemo(() => {
    return transactions.filter((txn) => txn.accountId === account.id);
  }, [transactions, account.id]);

  const monthIncome = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return accountTransactions
      .filter((txn) => {
        const txnDate = new Date(txn.date);
        return txn.isIncome && txnDate >= firstDay && txnDate <= today;
      })
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
  }, [accountTransactions]);

  const monthSpending = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return accountTransactions
      .filter((txn) => {
        const txnDate = new Date(txn.date);
        return !txn.isIncome && txnDate >= firstDay && txnDate <= today;
      })
      .reduce((sum, txn) => sum + parseFloat(txn.amount || '0'), 0);
  }, [accountTransactions]);

  const getAccountTypeIcon = (type: string) => {
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

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking':
        return 'Checking';
      case 'savings':
        return 'Savings';
      case 'brokerage':
        return 'Investment';
      default:
        return type;
    }
  };

  return (
    <div
      onClick={() => navigate(`/accounts/${account.id}`)}
      className="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getAccountTypeIcon(account.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{account.name}</h3>
            <p className="text-sm text-gray-500">
              {account.institution} • •••• {account.mask}
            </p>
            <p className="text-xs text-gray-400 capitalize">{getAccountTypeLabel(account.type)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(parseFloat(account.balance))}
          </p>
          <p className="text-xs text-gray-500">Current Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Income This Month</p>
          <p className="text-sm font-semibold text-emerald-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(monthIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Spending This Month</p>
          <p className="text-sm font-semibold text-red-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(monthSpending)}
          </p>
        </div>
      </div>
    </div>
  );
}

