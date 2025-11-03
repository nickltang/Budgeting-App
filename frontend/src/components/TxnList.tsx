import type { Transaction } from '../types';
import { TransactionRow } from './TransactionRow';

interface TxnListProps {
  transactions: Transaction[];
}

export function TxnList({ transactions }: TxnListProps) {
  if (transactions.length === 0) {
    return <div className="text-gray-400 text-center mt-10">No transactions found</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden max-h-[600px] overflow-y-auto">
      {transactions.map((txn) => (
        <TransactionRow key={txn.id} txn={txn} />
      ))}
    </div>
  );
}

