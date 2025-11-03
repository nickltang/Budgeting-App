import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../stores/dataStore';
import { useMemo } from 'react';

export function TrendChart() {
  const { transactions } = useDataStore();

  const chartData = useMemo(() => {
    // Group transactions by date for last 90 days
    const today = new Date();
    const days: Record<string, number> = {};
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      days[key] = 0;
    }

    transactions.forEach((txn) => {
      const date = txn.date.split('T')[0];
      if (days[date] !== undefined) {
        const amount = parseFloat(txn.amount || '0');
        days[date] += txn.isIncome ? amount : -amount;
      }
    });

    // Calculate cumulative net
    const sortedDates = Object.keys(days).sort();
    let cumulative = 0;
    const data = sortedDates.map((date) => {
      cumulative += days[date];
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        net: cumulative,
      };
    });

    return data.reverse();
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <p className="text-gray-400 text-center">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">90-Day Trend</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value),
              'Net',
            ]}
          />
          <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

