import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BillingEntries from './pages/BillingEntries';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import ItemList from './pages/master/ItemList';
import ClientList from './pages/master/ClientList';
import JobberList from './pages/master/JobberList';
import Purchase from './pages/Purchase';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/billing-entries" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing-entries" element={<BillingEntries />} />
        <Route path="/create-invoice" element={<CreateInvoice />} />
        <Route path="/purchase" element={<Purchase />} />
        <Route path="/create-purchase" element={<div>Create Purchase Placeholder</div>} />
        
        {/* Master Routes */}
        <Route path="/master/items" element={<ItemList />} />
        <Route path="/master/clients" element={<ClientList />} />
        <Route path="/master/jobber" element={<JobberList />} />
        
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
