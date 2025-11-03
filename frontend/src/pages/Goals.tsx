import { useEffect, useState } from 'react';
import { GoalCard } from '../components/GoalCard';
import { useDataStore } from '../stores/dataStore';
import { ErrorToast } from '../components/ErrorToast';
import { EmptyState } from '../components/EmptyState';

export function Goals() {
  const { goals, loadGoals, createGoal } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGoals().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    });
  }, [loadGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      await createGoal({ name, targetAmount, targetDate });
      setName('');
      setTargetAmount('');
      setTargetDate('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 pb-24 md:pb-4">
      <h1 className="text-2xl font-bold mb-4">Goals</h1>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 mb-4"
        >
          Add Goal
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Emergency Fund"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.00"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
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
                setName('');
                setTargetAmount('');
                setTargetDate('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 && !showForm ? (
        <EmptyState
          title="No goals yet"
          message="Create a savings goal to track your progress"
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
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

