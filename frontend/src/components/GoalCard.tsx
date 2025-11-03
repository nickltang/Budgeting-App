import type { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const current = parseFloat(goal.currentAmount || '0');
  const target = parseFloat(goal.targetAmount || '0');
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const remaining = target - current;
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const monthlyNeeded = daysRemaining > 0 ? remaining / (daysRemaining / 30) : 0;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2">{goal.name}</h3>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(current)}
          </span>
          <span className="text-gray-600">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(target)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-emerald-500 h-3 rounded-full"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% complete</p>
      </div>
      <div className="text-sm space-y-1">
        <p className="text-gray-600">
          Target Date: {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p className="text-gray-600">
          {daysRemaining > 0
            ? `${daysRemaining} days remaining`
            : daysRemaining === 0
            ? 'Due today'
            : `${Math.abs(daysRemaining)} days overdue`}
        </p>
        {daysRemaining > 0 && (
          <p className="text-emerald-600 font-medium">
            ${monthlyNeeded.toFixed(2)}/month needed
          </p>
        )}
      </div>
    </div>
  );
}

