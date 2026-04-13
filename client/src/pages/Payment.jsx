import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import PaymentTable from '../components/PaymentTable';
import MonthFilterFooter from '../components/MonthFilterFooter';

const DUMMY_PAYMENTS = [
  { id: 1, challan: 'PAY-001', date: '2026-04-01', client: 'Ajay Traders', shortform: 'AT', amount: 45000 },
  { id: 2, challan: 'PAY-002', date: '2026-04-02', client: 'Mehta Plastics', shortform: 'MP', amount: 28500 },
  { id: 3, challan: 'PAY-003', date: '2026-04-03', client: 'Suresh Kumar', shortform: '', amount: 12000 },
  { id: 4, challan: 'PAY-004', date: '2026-03-15', client: 'March Trader', shortform: 'MT', amount: 5000 },
];

const Payment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = React.useState(DUMMY_PAYMENTS);
  const [searchClient, setSearchClient] = React.useState('');
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = React.useState(false);

  const filteredPayments = React.useMemo(() => {
    return payments.filter(p => {
      const matchesClient = p.client.toLowerCase().includes(searchClient.toLowerCase());
      
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
          title="Payment" 
          subtitle="MANAGE AND TRACK ALL PARTY PAYMENTS AND TRANSACTIONS" 
          actions={paymentActions}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          <FilterBar 
            searchPlaceholder2="Search by Party Name" 
            onSearch2={setSearchClient}
          />
          <PaymentTable data={filteredPayments} loading={isLoading} />
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
