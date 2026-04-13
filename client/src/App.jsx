import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OrderSummary from './pages/OrderSummary';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import ItemList from './pages/master/ItemList';
import PartyList from './pages/master/PartyList';
import JobberList from './pages/master/JobberList';
import Purchase from './pages/Purchase';
import CreatePurchase from './pages/CreatePurchase';
import Payment from './pages/Payment';
import CreatePayment from './pages/CreatePayment';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/order-summary" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/order-summary" element={<OrderSummary />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/create-invoice/:id" element={<CreateInvoice />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/create-purchase" element={<CreatePurchase />} />
        <Route path="/create-purchase/:id" element={<CreatePurchase />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/create-payment" element={<CreatePayment />} />
        
        {/* Master Routes */}
        <Route path="/master/items" element={<ItemList />} />
        <Route path="/master/party-list" element={<PartyList />} />
        <Route path="/master/jobber" element={<JobberList />} />
        
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
