import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import PaymentTable from '../components/PaymentTable';
import MonthFilterFooter from '../components/MonthFilterFooter';
import { API_BASE_URL } from '../config';

const Payment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 5 Filters States
  const [searchClient, setSearchClient] = useState('');
  const [searchChallan, setSearchChallan] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // MonthFilterFooter States
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchPayments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/party-transactions`);
      const result = await response.json();
      if (result.success) {
        setPayments(result.data);
      } else {
        setError(result.error || 'Failed to fetch transactions.');
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Network error: failed to fetch transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/party-transactions/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        fetchPayments();
      } else {
        alert(result.error || 'Failed to delete transaction.');
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Network error: failed to delete transaction.');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // 1. Party Name Filter
      const matchesClient = !searchClient || (p.party_name || '').toLowerCase().includes(searchClient.toLowerCase());
      
      // 2. Challan No. Filter
      const matchesChallan = !searchChallan || (p.challan_no || '').toLowerCase().includes(searchChallan.toLowerCase());
      
      // 3. Type Filter
      const matchesType = filterType === 'ALL' || p.transaction_type === filterType;
      
      // 4. Date Range Filter
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && (p.date >= dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && (p.date <= dateTo);
      }

      // 5. Month/Year Filter (only respected if Date From/To dates are empty)
      const respectMonthFilter = !dateFrom && !dateTo;
      let matchesMonthYear = true;
      if (respectMonthFilter) {
        const pDate = new Date(p.date);
        const matchesMonth = pDate.getMonth() === selectedMonth;
        const matchesYear = pDate.getFullYear() === selectedYear;
        matchesMonthYear = matchesMonth && matchesYear;
      }

      return matchesClient && matchesChallan && matchesType && matchesDate && matchesMonthYear;
    });
  }, [payments, searchClient, searchChallan, filterType, dateFrom, dateTo, selectedMonth, selectedYear]);

  const paymentActions = [
    {
      label: 'Create Payment',
      onClick: () => navigate('/create-payment'),
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
      )
    }
  ];

  const handleEdit = (id) => {
    navigate(`/create-payment/${id}`);
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Payment & Adjustments" 
          subtitle="MANAGE AND TRACK ALL PARTY PAYMENTS, REPLACES AND DISCOUNTS" 
          actions={paymentActions}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {error && (
            <div className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-left uppercase tracking-tight">
              ⚠️ {error}
            </div>
          )}

          {/* Redesigned Compact Horizontal Filter Box */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2.5 shadow-sm w-full flex flex-col md:flex-row items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4 self-start md:self-center pt-1 md:pt-0">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter History</span>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full">
              {/* Filter 1: Challan Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-text-light opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by Challan No."
                  value={searchChallan}
                  onChange={(e) => setSearchChallan(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 bg-bg-main/50 border border-divider-soft rounded text-[12px] outline-none focus:border-brand-blue transition-all"
                />
              </div>

              {/* Filter 2: Party Name Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-text-light opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by Party Name"
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 bg-bg-main/50 border border-divider-soft rounded text-[12px] outline-none focus:border-brand-blue transition-all font-medium"
                />
              </div>

              {/* Filter 3: Type Selector */}
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                >
                  <option value="ALL">ALL TYPES</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="REPLACE">REPLACE</option>
                  <option value="DISCOUNT">DISCOUNT</option>
                </select>
              </div>

              {/* Filter 4: Date From */}
              <div className="relative">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] outline-none focus:border-brand-blue transition-all font-bold text-text-primary uppercase"
                />
              </div>

              {/* Filter 5: Date To */}
              <div className="relative">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] outline-none focus:border-brand-blue transition-all font-bold text-text-primary uppercase"
                />
              </div>
            </div>
          </div>

          <PaymentTable data={filteredPayments} loading={isLoading} onDelete={handleDelete} onEdit={handleEdit} />
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredPayments.length}
        />
      </div>
    </Layout>
  );
};

export default Payment;
