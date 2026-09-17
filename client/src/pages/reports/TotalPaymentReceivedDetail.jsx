import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import { useReportState } from '../../hooks/useReportState';
import { API_BASE_URL } from '../../config';

const TotalPaymentReceivedDetail = () => {
  const navigate = useNavigate();
  const { partyType, partyId } = useParams();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialFrom = queryParams.get('from') || '';
  const initialTo = queryParams.get('to') || '';

  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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

  const selectedPartyId = filters.party_id;
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

  // No dropdown options needed here since party is fixed

  const fetchData = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {

      const response = await fetch(
        `${API_BASE_URL}/reports/total-payment-received?from=${startDate}&to=${endDate}&party_id=${partyId}&party_type=${partyType}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching total payment received report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch report data on mount and filter changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const reportTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [data]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Payment Details" 
          subtitle="DETAILED TRANSACTION HISTORY FOR SELECTED PARTY" 
          backAction={() => navigate('/reports/total-payment-received')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter Report</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Date Filters */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">From Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setFilter('from', e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11.5px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">To Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setFilter('to', e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11.5px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>



              {/* Action Button */}
              <div className="flex items-end h-full pt-4 md:pt-0">
                <button 
                  onClick={fetchData}
                  disabled={isLoading}
                  className="w-full md:w-auto bg-brand-blue hover:bg-brand-blue-hover text-white text-[11.5px] font-black uppercase tracking-widest px-5 h-8 rounded transition shadow-lg flex items-center justify-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 active:scale-95 cursor-pointer ml-auto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                  </svg>
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-32">Challan No.</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-32">Date</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10 w-64">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light uppercase tracking-widest">Loading payments...</span>
                                </div>
                            </td>
                          </tr>
                        ) : data.length > 0 ? (
                           data.map((row, idx) => (
                             <tr 
                               key={idx} 
                               className="hover:bg-bg-main/10 transition-colors"
                             >
                                <td 
                                  className="px-5 py-1.5 text-[12.5px] font-bold text-brand-blue border-r border-border-soft uppercase tracking-tight cursor-pointer hover:underline"
                                  onClick={() => setSelectedTransaction(row)}
                                >
                                   {row.challan_no || 'N/A'}
                                </td>
                                <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight whitespace-nowrap">
                                   {new Date(row.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                   {row.party_name} <span className="text-[10px] text-text-light">({row.party_type})</span>
                                </td>
                                <td className="px-5 py-1.5 text-right text-[13.5px] font-black text-brand-blue px-10">
                                   ₹{parseFloat(row.amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                             </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="4" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                                 No payments found matching the selected filters.
                              </td>
                           </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                      <tfoot>
                        <tr className="bg-bg-main/50 border-t-2 border-border-soft">
                          <td colSpan="3" className="px-5 py-3 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-70 border-r border-border-soft">
                             Payment Received:
                          </td>
                          <td className="px-5 py-3 text-right text-[15px] font-black text-brand-blue px-10">
                             ₹{reportTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                </table>
             </div>
          </div>
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          recordCount={data.length}
        />
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-brand-blue px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-bold text-[15px] uppercase tracking-wider">Payment Details</h3>
              </div>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-white/70 hover:text-white hover:rotate-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Challan No.</span>
                  <span className="text-[13px] font-bold text-text-primary">{selectedTransaction.challan_no || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Date</span>
                  <span className="text-[13px] font-bold text-text-primary">{new Date(selectedTransaction.date).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Party</span>
                  <span className="text-[14px] font-bold text-brand-blue">{selectedTransaction.party_name} <span className="text-[11px] text-text-light">({selectedTransaction.party_type})</span></span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Mode</span>
                  <span className="text-[13px] font-bold text-text-primary">{selectedTransaction.payment_mode || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Amount</span>
                  <span className="text-[15px] font-black text-emerald-600">₹{parseFloat(selectedTransaction.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex flex-col gap-1 col-span-2 bg-bg-main/50 p-3 rounded-lg border border-border-soft">
                  <span className="text-[10px] font-black text-text-light uppercase tracking-widest">Remark / Ref</span>
                  <span className="text-[12px] font-medium text-text-primary mt-1">{selectedTransaction.remark || 'No remark provided.'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-bg-main/50 px-6 py-4 border-t border-border-soft flex justify-end">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="bg-white border border-border-soft hover:bg-bg-main text-text-primary text-[11px] font-black uppercase tracking-widest px-5 h-8 rounded transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TotalPaymentReceivedDetail;
