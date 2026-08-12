import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import PrintGroupPartySalesReport from '../../components/PrintGroupPartySalesReport';
import { useReportState } from '../../hooks/useReportState';
import ClickableChallan from '../../components/UI/ClickableChallan';
import { API_BASE_URL } from '../../config';

const PartyBillingDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract date range from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialFrom = queryParams.get('from') || '';
  const initialTo = queryParams.get('to') || '';

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A5');

  // Parse custom month/year initial state from fromDate URL parameter
  const getInitialMonthYear = () => {
    if (initialFrom) {
      const fromD = new Date(initialFrom);
      if (!isNaN(fromD.getTime())) {
        return { month: fromD.getMonth(), year: fromD.getFullYear() };
      }
    }
    return { month: new Date().getMonth(), year: new Date().getFullYear() };
  };

  const initialMonthYear = getInitialMonthYear();

  // Synchronized state hook
  const [filters, setFilter, setFiltersObject] = useReportState({
    from: initialFrom,
    to: initialTo,
    month: initialMonthYear.month,
    year: initialMonthYear.year
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
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting]);

  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/party-billing-detail?client_id=${clientId}&from=${startDate}&to=${endDate}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error fetching billing details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && startDate && endDate) {
      fetchData();
    }
  }, [clientId, startDate, endDate]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [clientId, startDate, endDate]);

  const handlePrintRequest = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    setShowPrintModal(false);
    setIsPrinting(true);
  };

  const actions = [
    {
      label: 'Print Bill list',
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
      <div className="flex flex-col min-h-screen relative pb-24">
        <PageHeader 
          title="Party Billing Details" 
          subtitle="COMPLETE TRANSACTION HISTORY FOR SELECTED PARTY"
          actions={actions}
          backAction={() => navigate(-1)}
        />

        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
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

          {/* Ledger Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Challan No</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Date</th>
                    <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING BILL LIST...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data && data.transactions.length > 0 ? (
                    data.transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/30 transition-colors duration-75">
                        <td className="px-5 py-1.5 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                          <ClickableChallan challanNo={t.challan_no} type="billing" />
                        </td>
                        <td className="px-5 py-1.5 text-center text-[12px] font-bold text-text-primary border-r border-border-soft">
                          {new Date(t.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-5 py-1.5 text-right text-[14px] font-bold text-brand-blue px-10 tracking-tight">
                          ₹{parseFloat(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(parseFloat(t.amount || 0)) ? 0 : 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center italic text-text-light text-[12px]">
                        No billing transactions found for this party in selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data && data.transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-bg-main/50 font-bold border-t-2 border-border-soft">
                      <td colSpan="2" className="px-5 py-3 text-right text-[10px] text-text-light uppercase tracking-widest font-black italic opacity-70">Total Party Billing:</td>
                      <td className="px-5 py-3 text-right text-[16px] font-black text-brand-blue px-10 tracking-tight">
                        ₹{parseFloat(data.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(parseFloat(data.total_amount || 0)) ? 0 : 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="bg-bg-main/30 border border-border-soft rounded-lg p-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-text-light leading-snug font-medium italic">
              Values shown above represent the net grand total of each invoice generated for this client. 
              The totals include all taxes, charges, and discounts applied at the time of billing.
            </p>
          </div>
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          recordCount={data?.transactions?.length || 0}
        />
      </div>

      {isPrinting && data && (
        <PrintGroupPartySalesReport 
          data={[
            {
              client_id: clientId,
              client_name: data.client_name,
              transactions: data.transactions,
              party_total: data.total_amount
            }
          ]} 
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

export default PartyBillingDetail;
