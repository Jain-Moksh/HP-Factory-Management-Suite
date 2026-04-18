import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/UI/SearchableSelect';
import { API_BASE_URL } from '../../config';

const PartySalesReport = () => {
  const [parties, setParties] = useState([]);
  const [selectedPartyId, setSelectedPartyId] = useState('all');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate();

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/clients`);
        const result = await response.json();
        if (result.success) {
          // Add "All Parties" option at the top
          const allOption = { id: 'all', name: '--- ALL PARTIES ---' };
          setParties([allOption, ...result.data]);
        }
      } catch (err) {
        console.error("Error fetching clients:", err);
      }
    };
    fetchClients();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const clientIdParam = (selectedPartyId === 'all' || !selectedPartyId) ? '' : selectedPartyId;
      const response = await fetch(`${API_BASE_URL}/reports/party-sales?client_id=${clientIdParam}&from=${startDate}&to=${endDate}`);
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

  // Fetch data when party or dates change
  useEffect(() => {
    fetchData();
  }, [selectedPartyId, startDate, endDate]);

  const reportTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);
  }, [data]);

  const handleRowClick = (clientId) => {
    navigate(`/reports/party-billing-detail/${clientId}?from=${startDate}&to=${endDate}`);
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Party Wise Sales Report" 
          subtitle="AGGREGATED SALES REVENUE PER CLIENT PARTY" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Standardized Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter Report</span>
            </div>

            <div className="flex-1 flex items-center gap-4">
              <SearchableSelect 
                options={parties}
                value={selectedPartyId}
                onChange={setSelectedPartyId}
                placeholder="Select a Party..."
                className="flex-1 max-w-[320px]"
              />

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
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 disable:hover:bg-brand-blue active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {isLoading ? 'Wait...' : 'Refresh Report'}
              </button>
            </div>
          </div>

          {/* Table Implementation */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10 w-64">Total Sales Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="2" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Calculating sales data...</span>
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
                                 No sales records found for this selection. Try adjusting the party filter or date range.
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
                             ₹{reportTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}
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
              This report aggregates total billing amounts for the selected party. 
              Click on any row to view individual challan details for that party.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartySalesReport;
