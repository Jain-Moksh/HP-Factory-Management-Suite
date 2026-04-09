import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import PurchaseTable from '../components/PurchaseTable';

const Purchase = () => {
  const navigate = useNavigate();

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
          <FilterBar searchPlaceholder2="Search by Jobber Name" />
          <PurchaseTable />
        </div>

        {/* Sticky Footer for Months/Year - Reused from Billing for UI consistency */}
        <footer className="fixed bottom-0 right-0 left-[210px] bg-white border-t border-border-soft px-6 py-2.5 flex justify-between items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] font-inter">
          <div className="flex items-center gap-4 text-[10.5px] font-bold text-text-secondary uppercase tracking-tighter">
            <span className="opacity-50">Records: <span className="text-brand-blue opacity-100">3 Entries</span></span>
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

export default Purchase;
