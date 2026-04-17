import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import { API_BASE_URL } from '../../config';

const GroupSalesReport = () => {
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
      const response = await fetch(`${API_BASE_URL}/reports/group-sales?from=${startDate}&to=${endDate}`);
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
      row.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.member_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const groupTotals = useMemo(() => {
    const totals = {};
    filteredData.forEach(row => {
        if (!totals[row.group_name]) totals[row.group_name] = 0;
        totals[row.group_name] += parseFloat(row.total_sales);
    });
    return totals;
  }, [filteredData]);

  const grandTotal = Object.values(groupTotals).reduce((sum, val) => sum + val, 0);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-20">
        <PageHeader 
          title="Group Party Wise Sales" 
          subtitle="AGGREGATED SALES REVENUE BY GROUPS AND MEMBERS" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6">
            <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search Group or Member..." 
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

            <div className="px-4 py-2 bg-brand-navy rounded-lg border border-white/10 text-white shadow-lg">
                <span className="block text-[8px] font-black uppercase opacity-60 tracking-widest">Grand Total Sales</span>
                <span className="text-sm font-black tracking-tight">₹{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider uppercase">Group Name</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider uppercase">Member Name</th>
                        <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider uppercase w-32">Type</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider uppercase px-10 w-64">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light">Processing group analytics...</span>
                                </div>
                            </td>
                          </tr>
                        ) : filteredData.length > 0 ? (
                           filteredData.map((row, idx) => {
                              const isFirstInGroup = idx === 0 || row.group_name !== filteredData[idx-1].group_name;
                              const isLastInGroup = idx === filteredData.length - 1 || row.group_name !== filteredData[idx+1].group_name;
                              
                              return (
                                <React.Fragment key={idx}>
                                   <tr className={`hover:bg-bg-main/30 transition-colors ${isFirstInGroup ? 'border-t-2 border-brand-blue/10' : ''}`}>
                                      <td className={`px-5 py-1.5 text-[12.5px] font-black text-brand-blue uppercase tracking-tight border-r border-border-soft ${!isFirstInGroup ? 'opacity-0' : ''}`}>
                                         {row.group_name}
                                      </td>
                                      <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary uppercase border-r border-border-soft">
                                         {row.member_name}
                                      </td>
                                      <td className="px-5 py-1.5 text-center border-r border-border-soft">
                                         <span className={`text-[9.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                            row.member_type === 'client' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'
                                         }`}>
                                            {row.member_type}
                                         </span>
                                      </td>
                                      <td className="px-5 py-1.5 text-right text-[13px] font-bold text-text-primary px-10">
                                         ₹{parseFloat(row.total_sales).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                      </td>
                                   </tr>
                                   {isLastInGroup && (
                                     <tr className="bg-bg-main/40 border-b border-border-soft/80">
                                        <td colSpan="3" className="px-5 py-2 text-right text-[10px] font-black uppercase text-text-light tracking-widest border-r border-border-soft">
                                           {row.group_name} Total Summary:
                                        </td>
                                        <td className="px-5 py-2 text-right text-[13.5px] font-black text-brand-blue px-10">
                                           ₹{groupTotals[row.group_name].toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                     </tr>
                                   )}
                                </React.Fragment>
                              );
                           })
                        ) : (
                           <tr>
                              <td colSpan="4" className="px-6 py-20 text-center italic text-text-light">
                                 No group data available.
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

export default GroupSalesReport;

