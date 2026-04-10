import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import PurchaseTable from '../components/PurchaseTable';
import DeleteModal from '../components/UI/DeleteModal';
import MonthFilterFooter from '../components/MonthFilterFooter';

const API_BASE_URL = 'http://localhost:5000/api';

const Purchase = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Filter State ---
  const [searchChallan, setSearchChallan] = useState('');
  const [searchJobber, setSearchJobber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/purchase`);
      const result = await response.json();
      if (result.success) {
        setPurchases(result.data);
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRow = async (id, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        fetchPurchases();
        return true;
      } else {
        alert(result.message || 'Deletion failed');
        return false;
      }
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesChallan = (p.id?.toString() || '').includes(searchChallan);
      const matchesJobber = (p.jobber_name?.toLowerCase() || '').includes(searchJobber.toLowerCase());
      
      const pDateStr = p.date ? p.date.split('T')[0] : '';
      const matchesStart = !startDate || (pDateStr && pDateStr >= startDate);
      const matchesEnd = !endDate || (pDateStr && pDateStr <= endDate);

      // Extract month and year for filtering
      if (!pDateStr) return false;
      const bDate = new Date(pDateStr);
      const matchesMonth = bDate.getMonth() === selectedMonth;
      const matchesYear = bDate.getFullYear() === selectedYear;

      return matchesChallan && matchesJobber && matchesStart && matchesEnd && matchesMonth && matchesYear;
    });
  }, [purchases, searchChallan, searchJobber, startDate, endDate, selectedMonth, selectedYear]);

  const purchaseActions = [
    {
      label: 'Create Purchase',
      onClick: () => navigate('/create-purchase'),
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      )
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Purchase" 
          subtitle="MANAGE AND TRACK ALL PURCHASE CONTRACTS & JOB REQUISITIONS" 
          actions={purchaseActions}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          <FilterBar 
            searchPlaceholder2="Search by Jobber Name" 
            onSearch1={setSearchChallan}
            onSearch2={setSearchJobber}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
          />
          <PurchaseTable 
            data={filteredPurchases} 
            loading={loading}
            onDelete={handleDeleteRow}
          />
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredPurchases.length}
        />
      </div>
    </Layout>
  );
};

export default Purchase;
