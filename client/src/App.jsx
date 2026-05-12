import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OrderSummary from './pages/OrderSummary';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import ItemList from './pages/master/ItemList';
import PartyList from './pages/master/PartyList';
import JobberList from './pages/master/JobberList';
import GroupList from './pages/master/GroupList';
import JobWork from './pages/JobWork';
import CreateJobWork from './pages/CreateJobWork';
import Payment from './pages/Payment';
import CreatePayment from './pages/CreatePayment';

import ItemStockDetails from './pages/ItemStockDetails';
import StockSummary from './pages/StockSummary';
import TransporterList from './pages/master/TransporterList';

// Reports
import ReportsDashboard from './pages/reports/ReportsDashboard';
import PartyStockReport from './pages/reports/PartyStockReport';
import PartySalesReport from './pages/reports/PartySalesReport';
import GroupSalesReport from './pages/reports/GroupSalesReport';
import JobWorkReport from './pages/reports/JobWorkReport';
import PartyStockDetail from './pages/reports/PartyStockDetail';
import PartyBillingDetail from './pages/reports/PartyBillingDetail';
import JobWorkDetail from './pages/reports/JobWorkDetail';
import DetailJobReport from './pages/reports/DetailJobReport';
import JobSummaryReport from './pages/reports/JobSummaryReport';
import ItemSoldSummary from './pages/reports/ItemSoldSummary';
import DayBook from './pages/DayBook';
import Utility from './pages/Utility';
import BackupManager from './pages/utility/BackupManager';
import RestoreManager from './pages/utility/RestoreManager';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
