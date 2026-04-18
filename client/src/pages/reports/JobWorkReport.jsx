import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import { API_BASE_URL } from '../../config';

const JobWorkReport = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/job-work?from=${startDate}&to=${endDate}`);
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
    fetchData();
  }, [startDate, endDate]);

  const filteredData = useMemo(() => {
    return data.filter(row => 
      row.jobber_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const jobberTotals = useMemo(() => {
    const totals = {};
    filteredData.forEach(row => {
        if (!totals[row.jobber_name]) totals[row.jobber_name] = 0;
        totals[row.jobber_name] += parseFloat(row.total_quantity);
    });
    return totals;
  }, [filteredData]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-20">
        <PageHeader 
          title="Job Work Analysis" 
          subtitle="PRODUCTION AND PURCHASE SUMMARY BY JOBBERS" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Standardized Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter Report</span>
            </div>

            <div className="flex-1 flex items-center gap-4">
              <div className="flex-1 relative max-w-[300px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search Jobber or Item..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-8 bg-bg-main/50 border border-divider-soft rounded pl-9 pr-4 text-[12px] font-medium outline-none focus:border-brand-blue transition-all"
                  />
              </div>

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
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {isLoading ? 'Wait...' : 'Set Filter'}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider uppercase">Jobber Name</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider uppercase">Item Processed</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider uppercase px-10 w-64">Total Received Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="3" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Extracting production data...</span>
                                </div>
                            </td>
                          </tr>
                        ) : filteredData.length > 0 ? (
                           filteredData.map((row, idx) => {
                              const isFirstForJobber = idx === 0 || row.jobber_name !== filteredData[idx-1].jobber_name;
                              const isLastForJobber = idx === filteredData.length - 1 || row.jobber_name !== filteredData[idx+1].jobber_name;
                              
                              return (
                                <React.Fragment key={idx}>
                                   <tr className={`hover:bg-bg-main/30 transition-colors ${isFirstForJobber ? 'bg-bg-main/10' : ''}`}>
                                      <td className={`px-5 py-1.5 text-[12.5px] font-black text-brand-navy uppercase tracking-tight border-r border-border-soft ${!isFirstForJobber ? 'opacity-0' : ''}`}>
                                         {row.jobber_name}
                                      </td>
                                      <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary uppercase border-r border-border-soft">
                                         {row.item_name}
                                      </td>
                                      <td className="px-5 py-1.5 text-right text-[13.5px] font-bold text-brand-blue px-10 border-r border-border-soft">
                                         {parseFloat(row.total_quantity).toLocaleString()}
                                      </td>
                                   </tr>
                                   {isLastForJobber && (
                                     <tr className="bg-brand-blue/[0.03] border-b border-brand-blue/10">
                                        <td colSpan="2" className="px-5 py-2 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-60 border-r border-border-soft">
                                           Jobber Accumulative Total:
                                        </td>
                                        <td className="px-5 py-2 text-right text-[13.5px] font-black text-brand-blue px-10 underline decoration-slate-300 underline-offset-4">
                                           {jobberTotals[row.jobber_name].toLocaleString()}
                                        </td>
                                     </tr>
                                   )}
                                </React.Fragment>
                              );
                           })
                        ) : (
                           <tr>
                              <td colSpan="3" className="px-6 py-20 text-center italic text-text-light">
                                 No job work records found.
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
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredData.length}
        />
      </div>
    </Layout>
  );
};

export default JobWorkReport;

