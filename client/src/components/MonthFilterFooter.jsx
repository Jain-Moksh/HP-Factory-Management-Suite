import React from 'react';

const MonthFilterFooter = ({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange, 
  recordCount,
  allMonths = false // true while a search or date range is active and the month is ignored
}) => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // Generate available months for the selected year
  // If selected year is current year, only show up to current month
  // If it's a past year, show all 12
  const availableMonths = selectedYear < currentYear 
    ? months 
    : months.slice(0, currentMonthIdx + 1);

  // Dynamic years list: includes current year down to past years up to currentYear - 3
  const years = Array.from(new Set([currentYear, currentYear - 1, currentYear - 2, 2024])).sort((a, b) => b - a);

  return (
    <footer className="fixed bottom-0 right-0 left-0 md:left-[210px] bg-white border-t border-border-soft px-4 sm:px-6 py-2 flex flex-col gap-1.5 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] font-inter">
      {/* Top Row: Records Summary & Year Selector */}
      <div className="flex justify-between items-center text-[10.5px] font-bold text-text-secondary uppercase tracking-tight">
        <span className="opacity-70">
          {allMonths ? 'Searching all months' : `Records for ${months[selectedMonth]}`}:{' '}
          <span className="text-brand-blue opacity-100 font-extrabold">{recordCount} Entries</span>
        </span>

        <div className="flex items-center gap-2">
          <span className="opacity-60 uppercase tracking-tighter">Year:</span>
          <select 
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="bg-bg-main border border-divider-soft rounded-md px-2 py-0.5 outline-none hover:border-brand-blue transition text-[11px] font-bold cursor-pointer"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Row: Month Buttons wrapping cleanly without scrollbar */}
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10.5px] font-bold text-text-secondary uppercase">
        {availableMonths.map((month, index) => (
          <span 
            key={month}
            onClick={() => onMonthChange(index)}
            className={`cursor-pointer transition px-2 sm:px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold ${
              selectedMonth === index 
                ? "bg-brand-blue text-white shadow-sm shadow-brand-blue/30" 
                : "hover:text-brand-blue opacity-70 hover:opacity-100 bg-bg-main/60 hover:bg-bg-main border border-transparent hover:border-divider-soft"
            }`}
          >
            {month}
          </span>
        ))}
      </div>
    </footer>
  );
};

export default MonthFilterFooter;
