import React from 'react';

const FilterBar = ({ 
  searchPlaceholder1 = "Search by Challan No.", 
  searchPlaceholder2 = "Search by Party Name",
  onSearch1,
  onSearch2,
  onStartDate,
  onEndDate
}) => {
  return (
    <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm mb-4 w-full flex items-center gap-4 group">
      <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
        <svg className="w-3.5 h-3.5 text-brand-blue animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter History</span>
      </div>
      
      <div className="flex-1 flex gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-text-light opacity-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder1}
            onChange={(e) => onSearch1?.(e.target.value)}
            className="w-full h-8 pl-9 pr-3 bg-bg-main/50 border border-divider-soft rounded text-[12px] outline-none focus:border-brand-blue transition-all"
          />
        </div>

        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-text-light opacity-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder2}
            onChange={(e) => onSearch2?.(e.target.value)}
            className="w-full h-8 pl-9 pr-3 bg-bg-main/50 border border-divider-soft rounded text-[12px] outline-none focus:border-brand-blue transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-40">
            <input
              type="date"
              onChange={(e) => onStartDate?.(e.target.value)}
              className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] outline-none focus:border-brand-blue transition-all font-bold text-text-primary uppercase"
            />
          </div>

          <div className="flex items-center text-text-secondary opacity-40 font-bold">to</div>
                
          <div className="relative w-40">
            <input
              type="date"
              onChange={(e) => onEndDate?.(e.target.value)}
              className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] outline-none focus:border-brand-blue transition-all font-bold text-text-primary uppercase"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
