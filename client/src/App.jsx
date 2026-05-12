import React, { lazy, Suspense } from 'react';
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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
          
          {/* Add more routes as needed */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
