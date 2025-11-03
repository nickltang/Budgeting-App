import { useState } from 'react';
import { api } from '../lib/api';
import { useDataStore } from '../stores/dataStore';
import { useNavigate } from 'react-router-dom';

// This is a simplified version - in production, you'd use the actual Plaid Link SDK
export function PlaidConnectButton() {
  const [loading, setLoading] = useState(false);
  const { loadTransactions, loadAccounts } = useDataStore();
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      setLoading(true);
      // Step 1: Create link token
      await api.post<{ link_token: string }>('/api/plaid/create-link-token');
      
      // Step 2: In production, launch Plaid Link with this token
      // For now, we'll simulate the exchange
      alert('Plaid Link would open here. For demo, simulating connection...');
      
      // Step 3: Exchange public token (simulated)
      await api.post('/api/plaid/exchange', {
        public_token: 'demo-public-token',
        institution_name: 'Demo Bank',
      });

      // Step 4: Sync transactions and reload accounts
      await api.get('/api/plaid/sync');
      await loadAccounts();
      // Load transactions for current month (Dashboard shows month-to-date)
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      await loadTransactions({
        from: firstDay.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      });
      
      alert('Bank connected successfully!');
      navigate('/settings');
    } catch (error) {
      console.error('Bank connection error:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect bank';
      alert(`Error: ${message}\n\nMake sure the backend is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? 'Connecting...' : 'Link Bank Account'}
    </button>
  );
}

