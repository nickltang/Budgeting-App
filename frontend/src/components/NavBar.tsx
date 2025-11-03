import { Link, useLocation } from 'react-router-dom';

export function NavBar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/transactions', label: 'Transactions', icon: '💳' },
    { path: '/budgets', label: 'Budgets', icon: '💰' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/household', label: 'Household', icon: '👥' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      {/* Mobile: Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t flex justify-around py-3 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Show: Home, Transactions, Budgets, Household */}
        {navItems.filter((item) => ['/', '/transactions', '/budgets', '/household'].includes(item.path)).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center text-xs font-medium ${
              location.pathname === item.path
                ? 'text-emerald-600'
                : 'text-gray-600'
            }`}
            aria-label={item.label}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop: Sidebar Navigation */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r flex-col z-40">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Household Budget</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

