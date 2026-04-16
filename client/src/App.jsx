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
