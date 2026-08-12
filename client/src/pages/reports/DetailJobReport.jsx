import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import PrintDetailJobReport from '../../components/PrintDetailJobReport';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import { useReportState } from '../../hooks/useReportState';
import ClickableChallan from '../../components/UI/ClickableChallan';
import { API_BASE_URL } from '../../config';

const DetailJobReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');

  // Synchronized state hook
  const [filters, setFilter, setFiltersObject] = useReportState({
    from: '',
    to: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const startDate = filters.from;
  const endDate = filters.to;
  const selectedMonth = filters.month;
  const selectedYear = filters.year;

  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  };

  // Set default dates only on first mount if they don't exist in URL
  useEffect(() => {
    if (!filters.from || !filters.to) {
      const firstDay = new Date(filters.year, filters.month, 1);
      const lastDay = new Date(filters.year, filters.month + 1, 0);
      setFiltersObject({
        from: formatDate(firstDay),
        to: formatDate(lastDay)
      });
    }
  }, []);

  const handleMonthChange = (month) => {
    const firstDay = new Date(filters.year, month, 1);
    const lastDay = new Date(filters.year, month + 1, 0);
    setFiltersObject({
      month,
      from: formatDate(firstDay),
      to: formatDate(lastDay)
    });
  };

  const handleYearChange = (year) => {
    const firstDay = new Date(year, filters.month, 1);
    const lastDay = new Date(year, filters.month + 1, 0);
    setFiltersObject({
      year,
      from: formatDate(firstDay),
      to: formatDate(lastDay)
    });
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
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting]);

  const fetchData = async () => {
    if (!startDate || !endDate) return;
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start Date cannot be greater than End Date");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/detail-job-report?startDate=${startDate}&endDate=${endDate}`);
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

  const actions = [
    {
      label: 'Print Report',
      onClick: handlePrintRequest,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-24 text-text-primary">
        <PageHeader 
          title="Detail Job Report" 
          subtitle="DETAILED INWARD STOCK MOVEMENT FROM JOB WORK ENTRIES" 
          actions={actions}
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center justify-between group print:hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
                <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter History</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setFilter('from', e.target.value)}
                  className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
                <span className="text-[11px] text-text-light opacity-40 font-bold">TO</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setFilter('to', e.target.value)}
                  className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 active:scale-95 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Set Filter
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse print:text-[11px]">
                <thead>
                  <tr className="bg-table-header text-white print:bg-slate-100 print:text-slate-800 print:border-b-2 print:border-slate-300">
                    <th className="px-5 py-2 text-left text-[10.5px] uppercase font-bold tracking-wider">Date</th>
                    <th className="px-5 py-2 text-left text-[10.5px] uppercase font-bold tracking-wider">Challan No.</th>
                    <th className="px-5 py-2 text-left text-[10.5px] uppercase font-bold tracking-wider">Jobber Name</th>
                    <th className="px-5 py-2 text-left text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                    <th className="px-5 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider">Weight (kg)</th>
                    <th className="px-5 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider">Pcs</th>
                    <th className="px-5 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider">Scrap (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft print:divide-y-0 print:divide-slate-200">
                  {isLoading ? (
                    <tr className="print:hidden">
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span>PREPARING LOG REPORT...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data.length > 0 ? (
                    data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/30 print:hover:bg-transparent transition-colors duration-75 print:border-b print:border-slate-100">
                        <td className="px-5 py-1.5 text-[12.5px] text-text-primary print:text-slate-700">{row.date}</td>
                        <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary print:text-slate-800">
                          <ClickableChallan challanNo={row.challan_no} type="purchase" />
                        </td>
                        <td className="px-5 py-1.5 text-[12.5px] font-bold text-brand-blue uppercase print:text-slate-800">{row.jobber_name}</td>
                        <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary uppercase print:text-slate-800">{row.item_name}</td>
                        <td className="px-5 py-1.5 text-center text-[13px] font-bold text-text-primary print:text-slate-700">{row.weight}</td>
                        <td className="px-5 py-1.5 text-center text-[13px] font-bold text-text-primary print:text-slate-700">{row.pcs}</td>
                        <td className="px-5 py-1.5 text-center text-[13px] font-bold text-red-500 print:text-slate-700">{row.scrap}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center italic text-text-light text-[12.5px] opacity-60">
                        No inward records found for the selected dates.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="print:hidden">
          <MonthFilterFooter 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            recordCount={data.length}
          />
        </div>
      </div>

      {isPrinting && (
        <PrintDetailJobReport 
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

export default DetailJobReport;
