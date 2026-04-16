import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import MonthFilterFooter from '../../components/MonthFilterFooter';
import { API_BASE_URL } from '../../config';

const PartySalesReport = () => {
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
      const response = await fetch(`${API_BASE_URL}/reports/party-sales?from=${startDate}&to=${endDate}`);
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
        row.client_name.toLowerCase().includes(searchTerm.toLowerCase())
     );
  }, [data, searchTerm]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      quantity: acc.quantity + parseFloat(curr.total_quantity),
      amount: acc.amount + parseFloat(curr.total_amount)
    }), { quantity: 0, amount: 0 });
  }, [filteredData]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-20">
        <PageHeader 
          title="Party Wise Sales Report" 
          subtitle="TOTAL SALES REVENUE AND QUANTITIES PER CLIENT" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6">
            <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search Client Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 bg-bg-main/50 border border-border-soft rounded-lg pl-10 pr-4 text-[13px] font-medium outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
            </div>

            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Date:</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
            </div>

            <div className="flex gap-4">
                <div className="px-4 py-2 bg-brand-blue/5 rounded-lg border border-brand-blue/10">
                    <span className="block text-[9px] font-black text-brand-blue uppercase opacity-60">Total Qty</span>
                    <span className="text-sm font-black text-brand-blue tracking-tight">{totals.quantity.toLocaleString()}</span>
                </div>
                <div className="px-4 py-2 bg-green-500/5 rounded-lg border border-green-500/10">
                    <span className="block text-[9px] font-black text-green-600 uppercase opacity-60">Grand Total</span>
                    <span className="text-sm font-black text-green-600 tracking-tight">₹{totals.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-3 text-left border-r border-white/10 uppercase">Client Name</th>
                    <th className="px-6 py-3 text-center border-r border-white/10 w-48 uppercase">Total Quantity</th>
                    <th className="px-6 py-3 text-right w-64 uppercase tracking-widest px-10">Sales Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[13px] font-medium text-text-light">Crunching sales data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/30 transition-colors">
                        <td className="px-6 py-3 text-[13.5px] font-bold text-text-primary uppercase tracking-tight">{row.client_name}</td>
                        <td className="px-6 py-3 text-center text-[14px] font-bold text-text-secondary">{parseFloat(row.total_quantity).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-[15px] font-black text-brand-blue px-10">
                           ₹{parseFloat(row.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-20 text-center italic text-text-light text-[13px]">
                        No sales data found for the selected criteria.
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

export default PartySalesReport;

