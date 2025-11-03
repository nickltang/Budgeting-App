import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Dashboard } from './pages/Dashboard';
import { LinkPage } from './pages/Link';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Settings } from './pages/Settings';
import { Household } from './pages/Household';
import { AccountDetail } from './pages/AccountDetail';
import { useSessionStore } from './stores/sessionStore';
import { useEffect } from 'react';

function App() {
  const loadMe = useSessionStore((state) => state.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex">
        <NavBar />
        <main className="flex-1 md:ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/link" element={<LinkPage />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/household" element={<Household />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/accounts/:accountId" element={<AccountDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
