import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import SearchableSelect from '../../components/UI/SearchableSelect';
import { useReportState } from '../../hooks/useReportState';
import { API_BASE_URL } from '../../config';

const PartyStockReport = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronized state hook
  const [filters, setFilter, setFiltersObject] = useReportState({
    client_id: '',
    from: '',
    to: '',
    search: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const selectedClient = filters.client_id;
  const startDate = filters.from;
  const endDate = filters.to;
  const searchTerm = filters.search;
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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/clients`);
      const result = await res.json();
      if (result.success) setClients(result.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchData = async () => {
    if (!selectedClient) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/party-stock-summary?client_id=${selectedClient}&from=${startDate}&to=${endDate}`);
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

  // Fetch report data whenever filters update
  useEffect(() => {
    if (selectedClient && startDate && endDate) {
      fetchData();
    }
  }, [selectedClient, startDate, endDate]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [selectedClient, startDate, endDate]);

  const filteredData = data.filter(row => 
    row.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-24">
        <PageHeader 
          title="Party Wise Stock Report" 
          subtitle="TOTAL QUANTITY OF EACH ITEM BILLED TO SELECTED PARTY" 
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
                options={clients}
                value={selectedClient}
                onChange={(val) => setFilter('client_id', val)}
                placeholder="Select a Party..."
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
                disabled={!selectedClient || isLoading}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 disable:hover:bg-brand-blue active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {isLoading ? 'Wait...' : 'Set Filter'}
              </button>
            </div>
          </div>

          {/* Quick Search Bar */}
          {data.length > 0 && (
            <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light opacity-40">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Instantly filter the items below..." 
                  value={searchTerm}
                  onChange={(e) => setFilter('search', e.target.value)}
                  className="w-full h-8 bg-bg-main/20 border-none pl-9 pr-3 text-[12px] font-medium outline-none focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                    <th className="px-5 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider">Total Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-10 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span>PULLING REPORT DATA...</span>
                        </div>
                      </td>
                    </tr>
                  ) : !selectedClient ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-12 text-center text-text-light italic text-[12px] opacity-60">
                        Please select a party from the filters above to generate the report.
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row) => (
                      <tr 
                        key={row.item_id} 
                        onClick={() => navigate(`/reports/party-stock-detail/${selectedClient}/${row.item_id}?from=${startDate}&to=${endDate}`)}
                        className="hover:bg-bg-main/30 cursor-pointer transition-colors duration-75 group"
                      >
                        <td className="px-5 py-1.5 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                           <div className="flex items-center gap-2">
                             <div className="w-1.5 h-3 bg-brand-blue/30 rounded-full group-hover:bg-brand-blue transition-colors"></div>
                             {row.item_name}
                           </div>
                        </td>
                        <td className="px-5 py-1.5 text-center text-[13px] font-bold text-brand-blue">
                          {row.total_quantity} <span className="text-[10px] font-bold text-text-light uppercase ml-0.5 opacity-60">{row.unit}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-6 py-10 text-center italic text-text-light text-[12px]">
                        No records found for the selected parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          recordCount={filteredData.length}
        />
      </div>
    </Layout>
  );
};

export default PartyStockReport;
