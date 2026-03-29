import React from 'react';

const BillingHeader = () => {
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      <div className="flex flex-col">
        <h1 className="text-page-title font-semibold text-text-primary tracking-tight">Billing Entries</h1>
        <p className="text-small-text text-text-secondary mt-1 font-medium italic">Manage and track all billing records</p>
      </div>
      
      <button className="bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-medium px-5 py-2.5 rounded-md transition-all duration-200 shadow-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        Create Invoice
      </button>
    </div>
  );
};

export default BillingHeader;
