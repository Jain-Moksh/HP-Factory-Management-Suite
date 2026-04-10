import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import BillingTable from '../components/BillingTable';
import { API_BASE_URL } from '../config';

const OrderSummary = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Filter State ---
  const [searchChallan, setSearchChallan] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/billing`);
      const result = await response.json();
      if (result.success) {
        setBills(result.data);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleDelete = async (id, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        fetchBills();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting bill:", err);
      return false;
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const matchesChallan = bill.challan_no.toString().includes(searchChallan);
      const matchesClient = bill.client_name.toLowerCase().includes(searchClient.toLowerCase());
      
      const billDate = bill.date.split('T')[0];
      const matchesStart = !startDate || billDate >= startDate;
      const matchesEnd = !endDate || billDate <= endDate;

      return matchesChallan && matchesClient && matchesStart && matchesEnd;
    });
  }, [bills, searchChallan, searchClient, startDate, endDate]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Order Summary" 
          subtitle="MANAGE AND TRACK ALL BILLING RECORDS" 
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          <FilterBar 
            onSearch1={setSearchChallan}
            onSearch2={setSearchClient}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
          />
          <BillingTable 
            data={filteredBills} 
            isLoading={isLoading} 
            onDelete={handleDelete}
          />
        </div>

        {/* Sticky Footer for Months/Year - Positioned at end of screen */}
        <footer className="fixed bottom-0 right-0 left-[210px] bg-white border-t border-border-soft px-6 py-2.5 flex justify-between items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] font-inter">
          <div className="flex items-center gap-4 text-[10.5px] font-bold text-text-secondary uppercase tracking-tighter">
            <span className="opacity-50">Months: <span className="text-brand-blue opacity-100">9 Records</span></span>
            <div className="flex gap-2.5 ml-2">
              <span className="hover:text-brand-blue cursor-pointer transition">January</span>
              <span className="hover:text-brand-blue cursor-pointer transition">February</span>
              <span className="bg-brand-blue text-white px-3.5 rounded-md py-1 -my-1 shadow-md shadow-brand-blue/20">March</span>
            </div>
          </div>
          
          <div className="flex gap-2 items-center text-[10.5px] font-bold text-text-secondary">
            <span className="opacity-50 uppercase tracking-tighter">Year:</span>
            <select className="bg-bg-main border border-divider-soft rounded-md px-2 py-0.5 outline-none hover:border-brand-blue transition text-[11px]">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default OrderSummary;
