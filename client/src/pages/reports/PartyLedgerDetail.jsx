import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import PrintPartyLedgerDetail from '../../components/PrintPartyLedgerDetail';
import ClickableChallan from '../../components/UI/ClickableChallan';
import { useReportState } from '../../hooks/useReportState';
import { API_BASE_URL } from '../../config';

const PartyLedgerDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract date range from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialFrom = queryParams.get('from') || '';
  const initialTo = queryParams.get('to') || '';

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTx, setSelectedTx] = useState(null);

  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');

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
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/reports/party-ledger-detail?client_id=${clientId}&from=${startDate}&to=${endDate}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching party ledger detail:', err);
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

  const filteredLedger = useMemo(() => {
    if (!data || !data.ledger) return [];
    if (typeFilter === 'all') return data.ledger;
    if (typeFilter === 'credit') {
      return data.ledger.filter((row) => row.transaction_type === 'OPENING BALANCE' || row.credit > 0);
    }
    if (typeFilter === 'debit') {
      return data.ledger.filter((row) => row.transaction_type === 'OPENING BALANCE' || row.debit > 0);
    }
    return data.ledger;
  }, [data, typeFilter]);

  // Compute Ledger Totals for the visible rows
  const ledgerTotals = useMemo(() => {
    if (!filteredLedger) return { credit: 0, debit: 0 };
    return filteredLedger.reduce(
      (sums, row) => {
        sums.credit += parseFloat(row.credit) || 0;
        sums.debit += parseFloat(row.debit) || 0;
        return sums;
      },
      { credit: 0, debit: 0 }
    );
  }, [filteredLedger]);

  const actions = [
    {
      label: 'Print Ledger',
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
          title="Party Ledger Statement" 
          subtitle={data?.client_name ? `DETAILED LEDGER STATEMENT FOR ${data.client_name}` : 'DETAILED LEDGER STATEMENT'}
          actions={actions}
          backAction={() => navigate('/reports/party-ledger')}
        />

        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6 print:hidden">
            <div className="flex items-center gap-3 pr-6 border-r border-border-soft">
               <div className="w-1.5 h-6 bg-brand-blue rounded-full"></div>
               <span className="text-[11px] font-bold text-text-primary uppercase tracking-widest">Movement Log</span>
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Type:</span>
              <div className="flex bg-bg-main p-1 rounded-lg border border-border-soft">
                {['all', 'credit', 'debit'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      typeFilter === type 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-text-light hover:text-text-primary'
                    }`}
                  >
                    {type === 'credit' ? 'Credit' : type === 'debit' ? 'Debit' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Fields */}
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider whitespace-nowrap">Date Range:</span>
              <div className="flex items-center gap-2 bg-bg-main/30 px-3 py-1.5 rounded-lg border border-divider-soft/50 flex-1">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setFilter('from', e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-text-primary uppercase outline-none w-full"
                />
                <span className="text-[10px] font-bold text-text-light uppercase">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setFilter('to', e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-text-primary uppercase outline-none w-full"
                />
              </div>
            </div>

            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition shadow-lg shadow-brand-blue/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {isLoading ? 'Wait...' : 'Set Filter'}
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-[24%]">Challan No</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-[16%]">Challan Type</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-[18%]">Date</th>
                    <th className="px-5 py-2 text-right border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-[14%]">Credit</th>
                    <th className="px-5 py-2 text-right border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-[14%]">Debit</th>
                    <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider w-[14%]">Closing Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span className="uppercase tracking-widest">LOADING LEDGER TRANSACTIONS...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data && filteredLedger.length > 0 ? (
                    filteredLedger.map((row) => (
                      <tr key={row.id} className="hover:bg-bg-main/30 transition-colors duration-75">
                        <td className="px-5 py-1.5 font-bold text-[12px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                          {row.transaction_type === 'BILLING' ? (
                            <ClickableChallan challanNo={row.challan_no} type="billing" />
                          ) : row.transaction_type !== 'OPENING BALANCE' && row.challan_no && row.challan_no !== '—' ? (
                            <span
                              onClick={() => setSelectedTx(row)}
                              className="text-brand-blue hover:text-brand-blue-hover hover:underline cursor-pointer font-bold tracking-tight uppercase select-none transition-colors"
                            >
                              {row.challan_no}
                            </span>
                          ) : (
                            row.challan_no
                          )}
                        </td>
                        <td className="px-5 py-1.5 text-center border-r border-border-soft">
                          <span className={`px-2 py-0.5 rounded text-[9px] tracking-wider font-extrabold uppercase ${
                            row.transaction_type === 'OPENING BALANCE' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            row.transaction_type === 'BILLING' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            row.transaction_type === 'PAYMENT' ? 'bg-red-50 text-red-700 border border-red-200' :
                            row.transaction_type === 'REPLACE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            row.transaction_type === 'DISCOUNT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {row.transaction_type === 'BILLING' ? 'SALES' : row.transaction_type}
                          </span>
                        </td>
                        <td className="px-5 py-1.5 text-center text-[12px] font-bold text-text-primary border-r border-border-soft">
                          {row.date && row.date !== '—' && row.transaction_type !== 'OPENING BALANCE' ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : row.date}
                        </td>
                        <td className="px-5 py-1.5 text-right text-[13.5px] font-black text-emerald-600 border-r border-border-soft">
                          {row.credit > 0 ? `₹${parseFloat(row.credit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-1.5 text-right text-[13.5px] font-black text-red-500 border-r border-border-soft">
                          {row.debit > 0 ? `₹${parseFloat(row.debit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="px-5 py-1.5 text-right text-[13.5px] font-black text-brand-blue">
                          ₹{parseFloat(row.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                        No transactions found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data && data.ledger.length > 0 && (
                  <tfoot>
                    <tr className="bg-bg-main/50 border-t-2 border-border-soft">
                      <td colSpan="3" className="px-5 py-3 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-70 border-r border-border-soft">
                        Totals / Closing Bal:
                      </td>
                      <td className="px-5 py-3 text-right text-[14px] font-black text-emerald-600 border-r border-border-soft">
                        ₹{ledgerTotals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right text-[14px] font-black text-red-500 border-r border-border-soft">
                        ₹{ledgerTotals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right text-[15px] font-black text-brand-blue">
                        ₹{data.closing_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              This statement lists all billing credits, payment debits, replaces, and discount items chronologically. 
              Clicking a billing challan number displays its complete itemized outwards layout details in a modal view.
            </p>
          </div>
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          recordCount={data?.ledger?.length || 0}
        />
      </div>

      {isPrinting && data && (
        <PrintPartyLedgerDetail 
          data={filteredLedger} 
          clientName={data.client_name} 
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

      {/* View Transaction Detail Modal Portal */}
      {selectedTx && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] cursor-pointer" 
            onClick={() => setSelectedTx(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                  selectedTx.transaction_type === 'PAYMENT' ? 'bg-red-100 text-red-700' :
                  selectedTx.transaction_type === 'REPLACE' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-brand-blue'
                }`}>
                  {selectedTx.transaction_type === 'PAYMENT' ? 'PY' : selectedTx.transaction_type === 'REPLACE' ? 'RP' : 'DS'}
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                    {selectedTx.transaction_type} Entry details
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Challan No: {selectedTx.challan_no}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4 text-[12px] text-slate-600">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedTx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="font-bold text-brand-blue">
                    ₹{(selectedTx.debit || selectedTx.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedTx.transaction_type === 'PAYMENT' && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</span>
                    <span className="px-2 py-0.5 bg-slate-200 border border-slate-300 rounded font-black text-slate-800 text-[10px] uppercase tracking-wider inline-block w-fit mt-1">
                      {selectedTx.payment_mode || 'CASH'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remarks Log</span>
                <p className="font-bold text-slate-700 italic">
                  {selectedTx.remark ? `"${selectedTx.remark}"` : 'No remarks recorded'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedTx(null)}
                className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-lg active:scale-95 transition-all text-[11px] tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default PartyLedgerDetail;
