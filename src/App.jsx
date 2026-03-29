import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BillingEntries from './pages/BillingEntries';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/billing-entries" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/billing-entries" element={<BillingEntries />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
