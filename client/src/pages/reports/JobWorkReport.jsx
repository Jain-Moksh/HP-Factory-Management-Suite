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
          {/* Dashboard Bar */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6">
            <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search Jobber or Item..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 bg-bg-main/50 border border-border-soft rounded-lg pl-10 pr-4 text-[13px] font-medium outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
            </div>

            <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all font-bold"
                />
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 transition-all font-bold"
                />
            </div>

            <button 
                onClick={fetchData}
                className="px-6 py-2 bg-brand-navy text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
            >
                Generate
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-wider">
                        <th className="px-6 py-3 text-left border-r border-white/10 uppercase">Jobber Name</th>
                        <th className="px-6 py-3 text-left border-r border-white/10 uppercase">Item Processed</th>
                        <th className="px-6 py-3 text-right uppercase px-10 w-64">Total Received Quantity</th>
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
                                      <td className={`px-6 py-3 text-[13px] font-black text-brand-navy uppercase tracking-tight ${!isFirstForJobber ? 'opacity-0' : ''}`}>
                                         {row.jobber_name}
                                      </td>
                                      <td className="px-6 py-3 text-[13px] font-bold text-text-primary uppercase border-l border-border-soft/50">
                                         {row.item_name}
                                      </td>
                                      <td className="px-6 py-3 text-right text-[15px] font-black text-brand-blue px-10 border-l border-border-soft/50">
                                         {parseFloat(row.total_quantity).toLocaleString()}
                                      </td>
                                   </tr>
                                   {isLastForJobber && (
                                     <tr className="bg-brand-blue/[0.03] border-b border-brand-blue/10">
                                        <td colSpan="2" className="px-6 py-2 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-60">
                                           Jobber Accumulative Total:
                                        </td>
                                        <td className="px-6 py-2 text-right text-[13px] font-black text-brand-blue px-10 underline decoration-slate-300 underline-offset-4">
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

