import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ErrorToast } from '../components/ErrorToast';
import { useDataStore } from '../stores/dataStore';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { accounts, loadAccounts, partners, loadPartners, invitePartner, removePartner } = useDataStore();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadAccounts();
    loadPartners();
  }, [loadAccounts, loadPartners]);

  const handleSync = async () => {
    try {
      setError(null);
      setSuccess(false);
      setSyncing(true);
      await api.get('/api/plaid/sync');
      await loadAccounts();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

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
    if (!confirm('Are you sure you want to remove this household member? They will lose access to shared budgets and goals.')) {
      return;
    }
    try {
      setError(null);
      await removePartner(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove partner');
    }
  };

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Linked Accounts</h2>
          <button
            onClick={() => navigate('/link')}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            + Link Account
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-gray-400 text-sm">No accounts linked yet.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{account.name}</p>
                    <p className="text-sm text-gray-500">
                      {account.institution} • •••• {account.mask}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{account.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(parseFloat(account.balance))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
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
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
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
                <button
                  onClick={() => handleRemovePartner(partner.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {success && !showInviteForm && (
          <p className="text-emerald-600 text-sm mt-2">Household member invited successfully!</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">Sync</h2>
        <p className="text-gray-600 text-sm mb-4">
          Manually trigger a sync to fetch the latest transactions.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
        {success && (
          <p className="text-emerald-600 text-sm mt-2">Sync completed successfully!</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <button className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">
          Sign Out
        </button>
      </div>

      {error && (
        <ErrorToast
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </main>
  );
}

