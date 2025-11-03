import { PlaidConnectButton } from '../components/PlaidConnectButton';

export function LinkPage() {
  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Link Bank Account</h1>
      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-600 mb-6">
          Connect your bank account securely through Plaid to automatically import your transactions.
        </p>
        <PlaidConnectButton />
      </div>
    </main>
  );
}

