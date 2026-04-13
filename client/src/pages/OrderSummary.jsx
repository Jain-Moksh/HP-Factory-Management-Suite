import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import BillingTable from '../components/BillingTable';
import MonthFilterFooter from '../components/MonthFilterFooter';
import { API_BASE_URL } from '../config';

const OrderSummary = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Filter State ---
  const [searchChallan, setSearchChallan] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    if (password !== import.meta.env.VITE_DEL_PASS) {
      return false;
    }
    
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
      
      const billDateStr = bill.date.split('T')[0];
      const matchesStart = !startDate || billDateStr >= startDate;
      const matchesEnd = !endDate || billDateStr <= endDate;

      // Extract month and year for filtering
      const bDate = new Date(billDateStr);
      const matchesMonth = bDate.getMonth() === selectedMonth;
      const matchesYear = bDate.getFullYear() === selectedYear;

      return matchesChallan && matchesClient && matchesStart && matchesEnd && matchesMonth && matchesYear;
    });
  }, [bills, searchChallan, searchClient, startDate, endDate, selectedMonth, selectedYear]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Order Summary" 
          subtitle="MANAGE AND TRACK ALL PARTY BILLING RECORDS" 
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

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredBills.length}
        />
      </div>
    </Layout>
  );
};

export default OrderSummary;
