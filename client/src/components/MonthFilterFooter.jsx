import React from 'react';

const MonthFilterFooter = ({ 
  selectedMonth, 
  selectedYear, 
  onMonthChange, 
  onYearChange, 
  recordCount 
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

  const years = [currentYear, currentYear - 1, 2024]; // Extendable list of years

  return (
    <footer className="fixed bottom-0 right-0 left-[210px] bg-white border-t border-border-soft px-6 py-2.5 flex justify-between items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] font-inter">
      <div className="flex items-center gap-4 text-[10.5px] font-bold text-text-secondary uppercase tracking-tighter">
        <span className="opacity-50">Records for {months[selectedMonth]}: <span className="text-brand-blue opacity-100">{recordCount} Entries</span></span>
        <div className="flex gap-2.5 ml-2">
          {availableMonths.map((month, index) => (
            <span 
              key={month}
              onClick={() => onMonthChange(index)}
              className={`cursor-pointer transition px-3.5 py-1 rounded-md ${
                selectedMonth === index 
                  ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" 
                  : "hover:text-brand-blue opacity-70 hover:opacity-100"
              }`}
            >
              {month}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2 items-center text-[10.5px] font-bold text-text-secondary">
        <span className="opacity-50 uppercase tracking-tighter">Year:</span>
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
    </footer>
  );
};

export default MonthFilterFooter;
