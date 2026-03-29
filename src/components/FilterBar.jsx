import React from 'react';

const FilterBar = () => {
  return (
    <div className="bg-white border border-border-soft rounded-lg p-5 shadow-sm mb-6 w-full">
      <div className="flex items-center gap-4 mb-4">
        <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="text-section-title font-semibold text-text-primary uppercase tracking-wider">Quick Filters</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search by Challan No."
            className="w-full h-9 pl-10 pr-4 bg-bg-main border border-divider-soft rounded-md text-body-text outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
          />
          <svg className="w-4 h-4 text-text-light absolute left-3.5 top-2.5 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder="Search by Customer Name"
            className="w-full h-9 pl-10 pr-4 bg-bg-main border border-divider-soft rounded-md text-body-text outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
          />
          <svg className="w-4 h-4 text-text-light absolute left-3.5 top-2.5 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        <div className="relative group">
          <input
            type="date"
            className="w-full h-9 pl-10 pr-4 bg-bg-main border border-divider-soft rounded-md text-body-text outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
          />
          <span className="text-[10px] absolute -top-2 left-3 bg-white px-1 text-text-light font-medium uppercase tracking-tighter">Date From</span>
          <svg className="w-4 h-4 text-text-light absolute left-3.5 top-2.5 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div className="relative group">
          <input
            type="date"
            className="w-full h-9 pl-10 pr-4 bg-bg-main border border-divider-soft rounded-md text-body-text outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all duration-200"
          />
          <span className="text-[10px] absolute -top-2 left-3 bg-white px-1 text-text-light font-medium uppercase tracking-tighter">Date To</span>
          <svg className="w-4 h-4 text-text-light absolute left-3.5 top-2.5 group-focus-within:text-brand-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
