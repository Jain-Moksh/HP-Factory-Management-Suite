import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import PrintJobSummaryReport from '../../components/PrintJobSummaryReport';
import { API_BASE_URL } from '../../config';

const JobSummaryReport = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Monthly Filter State (matching OrderSummary)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
  const navigate = useNavigate();

  // Update dates when month/year changes from footer
  useEffect(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    
    // Format YYYY-MM-DD
    const formatDate = (date) => {
      const d = new Date(date);
      let month = '' + (d.getMonth() + 1);
      let day = '' + d.getDate();
      const year = d.getFullYear();

      if (month.length < 2) month = '0' + month;
      if (day.length < 2) day = '0' + day;

      return [year, month, day].join('-');
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/job-summary?from=${startDate}&to=${endDate}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error fetching report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and fetch on date change
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [startDate, endDate]);

  const handlePrintRequest = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    setShowPrintModal(false);
    setIsPrinting(true);
  };

  // Print lifecycle
  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => {
        setIsPrinting(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
      }, 1000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-24">
        <PageHeader 
          title="Job Summary Report" 
          subtitle="AGGREGATED PRODUCTION QUANTITIES BY JOBBER AND ITEM" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Report Range</span>
            </div>

            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                  />
                  <span className="text-[11px] text-text-light opacity-40 font-bold uppercase">to</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                  />
                </div>

                <button 
                  onClick={fetchData}
                  disabled={isLoading}
                  className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 active:scale-95"
                >
                  <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? 'Set Filter...' : 'Set Filter'}
                </button>
              </div>

              <button 
                onClick={handlePrintRequest}
                disabled={data.length === 0}
                className="border-2 border-brand-blue/20 hover:border-brand-blue/40 text-brand-blue text-[12.5px] font-bold px-4 py-1.5 rounded transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Report
              </button>
            </div>
          </div>

          {/* Table Implementation */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden mb-8">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Jobber Name</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10">Total Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Aggregating job records...</span>
                                </div>
                            </td>
                          </tr>
                        ) : data.length > 0 ? (
                           data.map((row, idx) => {
                             const showJobberName = idx === 0 || row.jobber_name !== data[idx - 1].jobber_name;
                             return (
                               <tr 
                                 key={idx} 
                                 className="hover:bg-bg-main/30 transition-colors"
                               >
                                  <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                     {showJobberName ? row.jobber_name : ''}
                                  </td>
                                  <td className="px-5 py-1.5 text-[13px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                     {row.item_name}
                                  </td>
                                  <td className="px-5 py-1.5 text-right text-[14px] font-black text-brand-blue px-10">
                                     {parseFloat(row.total_quantity).toLocaleString()}
                                  </td>
                               </tr>
                             );
                           })
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                                 No job work records found for the selected period.
                              </td>
                           </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Monthly Filter Footer */}
        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={data.length}
        />
      </div>

      {/* Printing Components */}
      {isPrinting && (
        <PrintJobSummaryReport 
          data={data} 
          startDate={startDate} 
          endDate={endDate} 
          paperSize={selectedPaperSize}
        />
      )}

      <PrintOptionsModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={executePrint}
        selectedSize={selectedPaperSize}
        setSelectedSize={setSelectedPaperSize}
      />
    </Layout>
  );
};

export default JobSummaryReport;
