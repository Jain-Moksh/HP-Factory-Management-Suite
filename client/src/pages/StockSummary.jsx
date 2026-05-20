import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { API_BASE_URL } from '../config';

const StockSummary = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/items`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchItems);
    return () => window.removeEventListener('app-refresh', fetchItems);
  }, []);

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => parseFloat(b.stock || 0) - parseFloat(a.stock || 0));

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Stock Summary" 
          subtitle="REAL-TIME INVENTORY SNAPSHOT OF ALL ITEMS" 
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Search Bar */}
          <div className="flex bg-white border border-border-soft rounded-xl shadow-sm p-4 items-center gap-3">
             <div className="flex-1 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input 
                  type="text" 
                  placeholder="Search by Item Name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-main/50 border border-border-soft rounded-lg pl-10 pr-4 py-2 text-[13px] font-medium outline-none focus:border-brand-blue/50 focus:bg-white transition-all transition-duration-300"
                />
             </div>
             <div className="px-3 py-1.5 bg-brand-blue/10 rounded-lg">
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider">Total Items: {filteredItems.length}</span>
             </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                    <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider w-64">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[13px] font-medium text-text-light">Loading inventory data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => navigate(`/item-stock-details/${item.id}`)}
                        className="hover:bg-brand-blue/[0.02] cursor-pointer transition-colors group"
                      >
                        <td className="px-5 py-1.5 border-r border-border-soft">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-bg-main flex items-center justify-center text-text-light group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors font-bold text-[9px]">
                              {item.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-[12.5px] font-bold text-text-primary uppercase tracking-tight">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-1.5 text-right">
                          <div className="flex flex-col items-end leading-tight">
                            <span className={`text-[13.5px] font-black ${parseFloat(item.stock) <= parseFloat(item.min_stock || 0) ? 'text-red-500' : 'text-brand-blue'} tracking-tight`}>
                              {item.stock} <span className="text-[9px] uppercase font-bold ml-0.5 opacity-60">{item.unit}</span>
                            </span>
                            {parseFloat(item.stock) <= parseFloat(item.min_stock || 0) && (
                              <span className="text-[8.5px] font-bold text-red-400 uppercase tracking-tighter animate-pulse">Low Stock</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="px-6 py-20 text-center italic text-text-light text-[13px]">
                        No items found matching your search.
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

export default StockSummary;
