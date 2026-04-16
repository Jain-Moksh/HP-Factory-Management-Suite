import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../config';

const PartyStockReport = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/party-stock`);
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
  }, []);

  const filteredData = data.filter(row => 
    row.party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Party Wise Stock Report" 
          subtitle="INVENTORY HELD BY DIFFERENT JOBBERS AND PARTIES" 
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Search Bar */}
          <div className="flex bg-white border border-border-soft rounded-xl shadow-sm p-4 items-center gap-4">
             <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search by Party or Item Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-main/50 border border-border-soft rounded-lg pl-10 pr-4 py-2 text-[13px] font-medium outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
             </div>
             <button 
                onClick={fetchData}
                className="px-4 py-2 bg-brand-blue text-white rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all"
              >
                Refresh
              </button>
          </div>

          {/* Table Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-wider">
                    <th className="px-6 py-3 text-left border-r border-white/10 uppercase">Party Name</th>
                    <th className="px-6 py-3 text-left border-r border-white/10 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-center w-32 uppercase">Stock</th>
                    <th className="px-6 py-3 text-center w-32 uppercase border-l border-white/10">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[13px] font-medium text-text-light">Generating party stock report...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/30 transition-colors">
                        <td className="px-6 py-3 text-[13px] font-bold text-text-primary uppercase tracking-tight">{row.party_name}</td>
                        <td className="px-6 py-3 text-[13px] font-medium text-text-primary uppercase">{row.item_name}</td>
                        <td className="px-6 py-3 text-center text-[14px] font-bold text-brand-blue">{row.stock}</td>
                        <td className="px-6 py-3 text-center text-[11px] font-bold text-text-light uppercase border-l border-border-soft">{row.unit}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-20 text-center italic text-text-light text-[13px]">
                        No report data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartyStockReport;

