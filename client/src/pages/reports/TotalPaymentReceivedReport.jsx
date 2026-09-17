import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/UI/SearchableSelect';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import { useReportState } from '../../hooks/useReportState';
import { API_BASE_URL } from '../../config';

const TotalPaymentReceivedReport = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States
  const [selectedPartyType, setSelectedPartyType] = useState('all');
  
  // Synchronized state hook
  const [filters, setFilter, setFiltersObject] = useReportState({
    party_id: 'all',
    group_id: 'all',
    from: '',
    to: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  const selectedPartyId = filters.party_id;
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

  // Fetch initial select options
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const [clientsRes, jobbersRes, groupsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/clients`),
          fetch(`${API_BASE_URL}/jobbers`),
          fetch(`${API_BASE_URL}/groups`)
        ]);
        const clientsJson = await clientsRes.json();
        const jobbersJson = await jobbersRes.json();
        const groupsJson = await groupsRes.json();

        let allParties = [];
        if (clientsJson.success) {
          allParties = [...allParties, ...clientsJson.data.map(c => ({...c, _partyType: 'CLIENT'}))];
        }
        if (jobbersJson.success) {
          allParties = [...allParties, ...jobbersJson.data.map(j => ({...j, _partyType: 'JOBBER'}))];
        }

        const allOption = { id: 'all', name: '--- ALL PARTIES ---', _partyType: 'all' };
        setParties([allOption, ...allParties]);

        if (groupsJson.success) {
          const allGroupOption = { id: 'all', name: '--- ALL GROUPS ---' };
          setGroups([allGroupOption, ...groupsJson.data]);
        }
      } catch (err) {
        console.error('Error fetching dropdown options:', err);
      }
    };
    fetchDropdownOptions();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const partyIdParam = selectedPartyId === 'all' ? '' : selectedPartyId;
      const partyTypeParam = selectedPartyType === 'all' ? '' : selectedPartyType;
      const groupIdParam = selectedGroupId === 'all' ? '' : selectedGroupId;

      const response = await fetch(
        `${API_BASE_URL}/reports/total-payment-received-summary?from=${startDate}&to=${endDate}&party_id=${partyIdParam}&party_type=${partyTypeParam}&group_id=${groupIdParam}`
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
  }, [selectedPartyId, selectedPartyType, selectedGroupId, startDate, endDate]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [selectedPartyId, selectedPartyType, selectedGroupId, startDate, endDate]);

  const filteredData = useMemo(() => {
    return data.filter(row => 
      row.party_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const reportTotal = useMemo(() => {
    return filteredData.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0);
  }, [filteredData]);

  const handlePartyChange = (val) => {
    setFilter('party_id', val);
    const selected = parties.find(p => p.id === val || p.id === parseInt(val));
    if (selected && selected._partyType !== 'all') {
      setSelectedPartyType(selected._partyType);
    } else {
      setSelectedPartyType('all');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Payment Received" 
          subtitle="VIEW PAYMENTS RECEIVED FROM CLIENTS AND JOBBERS" 
          backAction={() => navigate('/reports')}
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
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

              {/* Party Filter */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">Party Name</label>
                <SearchableSelect 
                  options={parties}
                  value={selectedPartyId}
                  onChange={handlePartyChange}
                  placeholder="Select Party..."
                  className="w-full"
                />
              </div>

              {/* Group Filter */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">Group Name</label>
                <SearchableSelect 
                  options={groups}
                  value={selectedGroupId}
                  onChange={(val) => setFilter('group_id', val)}
                  placeholder="Select Group..."
                  className="w-full"
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
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden flex flex-col">
             {/* Local Search Bar */}
             <div className="px-4 py-3 border-b border-border-soft bg-bg-main/20 flex items-center gap-3">
               <svg className="w-4 h-4 text-text-light opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
               <input 
                 type="text" 
                 placeholder="Search by party name..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="flex-1 bg-transparent border-none outline-none text-[12px] font-bold text-text-primary placeholder:text-text-light/50 uppercase tracking-tight"
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="text-text-light hover:text-brand-blue transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               )}
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10 w-64">Payment Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="2" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light uppercase tracking-widest">Loading summary...</span>
                                </div>
                            </td>
                          </tr>
                        ) : filteredData.length > 0 ? (
                           filteredData.map((row, idx) => (
                             <tr 
                               key={idx} 
                               className="hover:bg-bg-main/10 transition-colors cursor-pointer group"
                               onClick={() => navigate(`/reports/total-payment-received/${row.party_type}/${row.party_id}?from=${startDate}&to=${endDate}`)}
                             >
                                <td className="px-5 py-2.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight group-hover:text-brand-blue transition-colors">
                                   {row.party_name} <span className="text-[10px] text-text-light group-hover:text-brand-blue/60 transition-colors">({row.party_type})</span>
                                </td>
                                <td className="px-5 py-2.5 text-right text-[13.5px] font-black text-brand-blue px-10 group-hover:text-brand-blue-hover transition-colors">
                                   ₹{parseFloat(row.total_amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                             </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="2" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                                 No payments found matching the selected filters.
                              </td>
                           </tr>
                        )}
                    </tbody>
                    {filteredData.length > 0 && (
                      <tfoot>
                        <tr className="bg-bg-main/50 border-t-2 border-border-soft">
                          <td className="px-5 py-3 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-70 border-r border-border-soft">
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
          recordCount={filteredData.length}
        />
      </div>
    </Layout>
  );
};

export default TotalPaymentReceivedReport;
