interface KPIsProps {
  income: string;
  spending: string;
  net: string;
}

export function KPIs({ income, spending, net }: KPIsProps) {
  const formatCurrency = (value: string) => {
    const num = parseFloat(value || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const netValue = parseFloat(net || '0');
  const netColor = netValue >= 0 ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-gray-500 text-sm">Income This Month</p>
        <h2 className="text-lg font-semibold text-emerald-600">{formatCurrency(income)}</h2>
      </div>
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-gray-500 text-sm">Spending This Month</p>
        <h2 className="text-lg font-semibold text-red-600">{formatCurrency(spending)}</h2>
      </div>
      <div className="bg-white rounded-2xl shadow p-4">
        <p className="text-gray-500 text-sm">Net This Month</p>
        <h2 className={`text-lg font-semibold ${netColor}`}>{formatCurrency(net)}</h2>
      </div>
    </div>
  );
}

