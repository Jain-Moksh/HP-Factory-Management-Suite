import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import PaymentTable from '../components/PaymentTable';
import MonthFilterFooter from '../components/MonthFilterFooter';
import { API_BASE_URL } from '../config';

const Payment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [searchClient, setSearchClient] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      const matchesClient = (p.party_name || '').toLowerCase().includes(searchClient.toLowerCase());
      
      const pDate = new Date(p.date);
      const matchesMonth = pDate.getMonth() === selectedMonth;
      const matchesYear = pDate.getFullYear() === selectedYear;

      return matchesClient && matchesMonth && matchesYear;
    });
  }, [payments, searchClient, selectedMonth, selectedYear]);

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

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Payment & Adjustments" 
          subtitle="MANAGE AND TRACK ALL PARTY PAYMENTS, RETURNS AND DISCOUNTS" 
          actions={paymentActions}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {error && (
            <div className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-left uppercase tracking-tight">
              ⚠️ {error}
            </div>
          )}

          <FilterBar 
            searchPlaceholder2="Search by Party Name" 
            onSearch2={setSearchClient}
          />
          <PaymentTable data={filteredPayments} loading={isLoading} onDelete={handleDelete} />
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
