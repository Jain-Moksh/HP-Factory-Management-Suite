import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import PrintDetailJobReport from '../../components/PrintDetailJobReport';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import { API_BASE_URL } from '../../config';

const DetailJobReport = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
  const navigate = useNavigate();

  // Print lifecycle: trigger window.print() after component mounts
  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => {
        setIsPrinting(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
      }, 1500); // 1.5s is usually the sweet spot for portal mounting

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting]);

  const fetchData = async () => {
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

  const handlePrintRequest = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    setShowPrintModal(false);
    setIsPrinting(true);
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 text-text-primary">
        <PageHeader 
          title="Detail Job Report" 
          subtitle="DETAILED INWARD STOCK MOVEMENT FROM JOB WORK ENTRIES" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filter Bar - Hidden on Print */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center justify-between group print:hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
                <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filters</span>
              </div>

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
                  className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 active:scale-95 disabled:opacity-50"
                >
                  <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? 'Wait...' : 'Apply Filter'}
                </button>
              </div>
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

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-32">Date</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider w-40">Inward Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                           <tr>
                             <td colSpan="3" className="px-6 py-20 text-center">
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                   <span className="text-[13px] font-medium text-text-light uppercase tracking-widest">Fetching details...</span>
                                 </div>
                             </td>
                           </tr>
                        ) : data.length > 0 ? (
                           data.map((row, index) => {
                             const isFirstOfDate = index === 0 || new Date(row.date).toLocaleDateString('en-GB') !== new Date(data[index - 1].date).toLocaleDateString('en-GB');
                             return (
                               <tr key={row.purchase_item_id} className="hover:bg-bg-main/30 transition-colors">
                                  <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                     {isFirstOfDate ? new Date(row.date).toLocaleDateString('en-GB') : ''}
                                  </td>
                                  <td className="px-5 py-1.5 text-[13px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                     {row.item_name}
                                  </td>
                                  <td className="px-5 py-1.5 text-right text-[14px] font-black text-brand-blue">
                                     {parseFloat(row.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                                  </td>
                               </tr>
                             );
                           })
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-6 py-20 text-center italic text-text-light text-[12px] opacity-60 uppercase tracking-widest">
                                 No inward stock records found
                              </td>
                           </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
          
          {/* Legend - Hidden on Print */}
          <div className="bg-bg-main/30 border border-border-soft rounded-lg p-3 flex items-start gap-3 print:hidden">
            <svg className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-text-light leading-snug font-medium italic">
              This report displays all item-wise inward movements from Job Work entries. 
              Rows are grouped by purchase entry date for better readability.
            </p>
          </div>
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
