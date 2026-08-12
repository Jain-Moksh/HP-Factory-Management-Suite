import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageLoader from './components/UI/PageLoader';

// Lazy load all pages
const OrderSummary = lazy(() => import('./pages/OrderSummary'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateInvoice = lazy(() => import('./pages/CreateInvoice'));
const ItemList = lazy(() => import('./pages/master/ItemList'));
const PartyList = lazy(() => import('./pages/master/PartyList'));
const JobberList = lazy(() => import('./pages/master/JobberList'));
const GroupList = lazy(() => import('./pages/master/GroupList'));
const JobWork = lazy(() => import('./pages/JobWork'));
const CreateJobWork = lazy(() => import('./pages/CreateJobWork'));
const Payment = lazy(() => import('./pages/Payment'));
const CreatePayment = lazy(() => import('./pages/CreatePayment'));
const ItemStockDetails = lazy(() => import('./pages/ItemStockDetails'));
const StockSummary = lazy(() => import('./pages/StockSummary'));
const TransporterList = lazy(() => import('./pages/master/TransporterList'));
const PriceList = lazy(() => import('./pages/master/PriceList'));

import { API_BASE_URL } from './config';

// Reports
const ReportsDashboard = lazy(() => import('./pages/reports/ReportsDashboard'));
const PartyStockReport = lazy(() => import('./pages/reports/PartyStockReport'));
const PartySalesReport = lazy(() => import('./pages/reports/PartySalesReport'));
const GroupSalesReport = lazy(() => import('./pages/reports/GroupSalesReport'));
const JobWorkReport = lazy(() => import('./pages/reports/JobWorkReport'));
const PartyStockDetail = lazy(() => import('./pages/reports/PartyStockDetail'));
const PartyBillingDetail = lazy(() => import('./pages/reports/PartyBillingDetail'));
const JobWorkDetail = lazy(() => import('./pages/reports/JobWorkDetail'));
const DetailJobReport = lazy(() => import('./pages/reports/DetailJobReport'));
const JobSummaryReport = lazy(() => import('./pages/reports/JobSummaryReport'));
const ItemSoldSummary = lazy(() => import('./pages/reports/ItemSoldSummary'));
const DayBook = lazy(() => import('./pages/DayBook'));
const Utility = lazy(() => import('./pages/Utility'));
const BackupManager = lazy(() => import('./pages/utility/BackupManager'));
const RestoreManager = lazy(() => import('./pages/utility/RestoreManager'));

function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('isLoggedIn') === 'true'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    setIsChecking(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/verify-login-pass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        sessionStorage.setItem('isLoggedIn', 'true');
        setIsAuthenticated(true);
      } else {
        setError('Incorrect password. Access Denied!');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-[0.25em] text-center mt-2">
            Secure Entry Gate
          </h2>
          <p className="text-[11px] text-slate-400 text-center uppercase tracking-wider font-bold">
            Please enter your login password to access the platform
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Login Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-[20px] tracking-[0.4em] font-black outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 text-red-600">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-wide">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isChecking}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isChecking ? 'Verifying...' : 'Unlock System'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AuthGuard>
          <Routes>
            <Route path="/" element={<Navigate to="/order-summary" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/stock-summary" element={<StockSummary />} />
          <Route path="/item-stock-details/:id" element={<ItemStockDetails />} />
          <Route path="/create-invoice" element={<CreateInvoice />} />
          <Route path="/create-invoice/:id" element={<CreateInvoice />} />
          <Route path="/job-work" element={<JobWork />} />
          <Route path="/create-job-work" element={<CreateJobWork />} />
          <Route path="/create-job-work/:id" element={<CreateJobWork />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/create-payment" element={<CreatePayment />} />
          
          {/* Reports Routes */}
          <Route path="/reports" element={<ReportsDashboard />} />
          <Route path="/reports/party-stock" element={<PartyStockReport />} />
          <Route path="/reports/party-stock-detail/:clientId/:itemId" element={<PartyStockDetail />} />
          <Route path="/reports/party-sales" element={<PartySalesReport />} />
          <Route path="/reports/group-sales" element={<GroupSalesReport />} />
          <Route path="/reports/party-billing-detail/:clientId" element={<PartyBillingDetail />} />
          <Route path="/reports/job-work" element={<JobWorkReport />} />
          <Route path="/reports/job-work-detail/:jobberId/:itemId" element={<JobWorkDetail />} />
          <Route path="/reports/detail-job-report" element={<DetailJobReport />} />
          <Route path="/reports/job-summary" element={<JobSummaryReport />} />
          <Route path="/reports/item-sold-summary" element={<ItemSoldSummary />} />
          <Route path="/day-book" element={<DayBook />} />
          <Route path="/utility" element={<Utility />} />
          <Route path="/utility/backup" element={<BackupManager />} />
          <Route path="/utility/restore" element={<RestoreManager />} />
          
          {/* Master Routes */}
          <Route path="/master/items" element={<ItemList />} />
          <Route path="/master/party-list" element={<PartyList />} />
          <Route path="/master/jobber" element={<JobberList />} />
          <Route path="/master/groups" element={<GroupList />} />
          <Route path="/master/transporters" element={<TransporterList />} />
          <Route path="/master/price-list" element={<PriceList />} />
          
          {/* Add more routes as needed */}
          </Routes>
        </AuthGuard>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
