import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import SearchableSelect from '../../components/UI/SearchableSelect';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import PrintGroupPartySalesReport from '../../components/PrintGroupPartySalesReport';
import PrintGroupPartySalesSummary from '../../components/PrintGroupPartySalesSummary';
import { useReportState } from '../../hooks/useReportState';
import { API_BASE_URL } from '../../config';

const GroupSalesReport = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A5');
  const [isFetchingPrintData, setIsFetchingPrintData] = useState(false);
  const [printMode, setPrintMode] = useState(null); // 'detail' or 'summary'

  // Synchronized state hook
  const [filters, setFilter, setFiltersObject] = useReportState({
    group_id: '',
    from: '',
    to: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const selectedGroupId = filters.group_id;
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
        setPrintMode(null);
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

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups`);
        const result = await response.json();
        if (result.success) {
          setGroups(result.data);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
      }
    };
    fetchGroups();
  }, []);

  const fetchData = async () => {
    if (!selectedGroupId || !startDate || !endDate) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/group-sales-summary?group_id=${selectedGroupId}&from=${startDate}&to=${endDate}`);
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

  // Fetch data when group or dates change
  useEffect(() => {
    if (selectedGroupId && startDate && endDate) {
      fetchData();
    }
  }, [selectedGroupId, startDate, endDate]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [selectedGroupId, startDate, endDate]);

  const groupTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
  }, [data]);

  const handleRowClick = (clientId) => {
    navigate(`/reports/party-billing-detail/${clientId}?from=${startDate}&to=${endDate}`);
  };

  const handlePrintRequest = () => {
    setPrintMode('detail');
    setShowPrintModal(true);
  };

  const handlePrintSummaryRequest = () => {
    setPrintMode('summary');
    setShowPrintModal(true);
  };

  const executePrint = async () => {
    setShowPrintModal(false);
    setIsFetchingPrintData(true);
    try {
      let endpoint = '';
      if (printMode === 'detail') {
        endpoint = `${API_BASE_URL}/reports/group-sales-detail?group_id=${selectedGroupId}&from=${startDate}&to=${endDate}`;
      } else {
        endpoint = `${API_BASE_URL}/reports/group-sales-summary?group_id=${selectedGroupId}&from=${startDate}&to=${endDate}`;
      }
      
      const response = await fetch(endpoint);
      const result = await response.json();
      if (result.success) {
        setPrintData(result.data);
        setIsPrinting(true);
      } else {
        alert("Failed to fetch print data");
      }
    } catch (err) {
      console.error("Print fetch failed:", err);
      alert("Network error: failed to fetch print data");
    } finally {
      setIsFetchingPrintData(false);
    }
  };

  const groupName = useMemo(() => {
    const selected = groups.find(g => String(g.id) === String(selectedGroupId));
    return selected ? selected.name : '';
  }, [selectedGroupId, groups]);

  const actions = [
    {
      label: 'Print Summary',
      onClick: handlePrintSummaryRequest,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-6 0h6" />
        </svg>
      ),
      variant: 'secondary'
    },
    {
      label: 'Print Details',
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
          title="Group Sales Report" 
          subtitle="TOTAL REVENUE GENERATED PER PRODUCT CATEGORY" 
          actions={selectedGroupId ? actions : null}
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter Report</span>
            </div>

            <div className="flex-1 flex items-center gap-4">
              <SearchableSelect 
                options={groups}
                value={selectedGroupId}
                onChange={(val) => setFilter('group_id', val)}
                placeholder="Select a Group..."
                className="flex-1 max-w-[320px]"
              />

              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setFilter('from', e.target.value)}
                  className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
                <span className="text-[11px] text-text-light opacity-40 font-bold uppercase">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setFilter('to', e.target.value)}
                  className="h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>

              <button 
                onClick={fetchData}
                disabled={!selectedGroupId || isLoading}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 disable:hover:bg-brand-blue active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {isLoading ? 'Wait...' : 'Set Filter'}
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10 w-64">Total Billing Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isFetchingPrintData ? (
                          <tr>
                            <td colSpan="2" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Preparing printable document...</span>
                                </div>
                            </td>
                          </tr>
                        ) : isLoading ? (
                          <tr>
                            <td colSpan="2" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Calculating sales records...</span>
                                </div>
                            </td>
                          </tr>
                        ) : data.length > 0 ? (
                           data.map((row) => (
                             <tr 
                               key={row.client_id} 
                               onClick={() => handleRowClick(row.client_id)}
                               className="hover:bg-bg-main/30 cursor-pointer transition-colors"
                             >
                                <td className="px-5 py-1.5 text-[13px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                   {row.client_name}
                                </td>
                                <td className="px-5 py-1.5 text-right text-[14px] font-bold text-brand-blue px-10">
                                   ₹{parseFloat(row.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </td>
                             </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="2" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                                 {selectedGroupId ? 'No sales records found for this selection.' : 'Please select a product category from the filters above to generate the report.'}
                              </td>
                           </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                      <tfoot>
                        <tr className="bg-bg-main/50 border-t-2 border-border-soft">
                          <td className="px-5 py-3 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-70">
                             Report Total:
                          </td>
                          <td className="px-5 py-3 text-right text-[16px] font-black text-brand-blue px-10">
                             ₹{groupTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
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

      {isPrinting && printMode === 'detail' && (
        <PrintGroupPartySalesReport 
          data={printData} 
          startDate={startDate} 
          endDate={endDate} 
          groupName={groupName}
          paperSize={selectedPaperSize}
        />
      )}

      {isPrinting && printMode === 'summary' && (
        <PrintGroupPartySalesSummary 
          data={printData} 
          startDate={startDate} 
          endDate={endDate} 
          groupName={groupName}
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

export default GroupSalesReport;
