import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(true);

  const fetchLowStock = async () => {
    setIsLoadingLowStock(true);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/low-stock`);
      const result = await response.json();
      if (result.success) {
        setLowStockItems(result.data);
      }
    } catch (err) {
      console.error("Error fetching low stock items:", err);
    } finally {
      setIsLoadingLowStock(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchLowStock);
    return () => window.removeEventListener('app-refresh', fetchLowStock);
  }, []);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader 
          title="Dashboard Overview" 
          subtitle="WELCOME BACK, ADMINISTRATOR" 
        />
        
        <div className="px-6 flex flex-col gap-6 w-full">
          {/* Main Content Area: Side-by-Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Side: Placeholder for main dashboard content (Charts, Recent Activity etc) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
               <div className="h-64 border-2 border-dashed border-border-soft rounded-2xl flex items-center justify-center bg-bg-main/20">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">Main Modules Placeholder</span>
                  </div>
               </div>
            </div>

            {/* Right Side: Low Stock Alert Table */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-red-500 rounded-full"></div>
                  <h2 className="text-[12px] font-bold text-text-primary uppercase tracking-tight">Low Stock Alerts</h2>
                </div>
                {lowStockItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-black rounded uppercase tracking-tighter animate-pulse">
                    Action Required
                  </span>
                )}
              </div>

              <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header text-white">
                      <th className="px-4 py-2 text-left text-[10px] uppercase font-bold tracking-wider border-r border-white/10">Item Name</th>
                      <th className="px-4 py-2 text-right text-[10px] uppercase font-bold tracking-wider">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {isLoadingLowStock ? (
                      <tr>
                        <td colSpan="2" className="px-4 py-8 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[11px] font-medium text-text-primary/50 uppercase">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : lowStockItems.length > 0 ? (
                      lowStockItems.map((item) => (
                        <tr 
                          key={item.item_id}
                          onClick={() => navigate(`/item-stock-details/${item.item_id}`)}
                          className="hover:bg-red-50/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-4 py-2 border-r border-border-soft">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded bg-bg-main flex items-center justify-center text-[8px] font-black text-text-primary/40 group-hover:bg-red-100 group-hover:text-red-500 transition-colors uppercase">
                                {item.item_name.substring(0, 2)}
                              </div>
                              <span className="text-[12px] font-bold text-text-primary uppercase tracking-tight truncate max-w-[100px]">
                                {item.item_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex flex-col items-end leading-none">
                              <span className={`text-[12.5px] font-black ${parseFloat(item.stock) === 0 ? 'text-red-600' : 'text-red-500'} tracking-tighter`}>
                                {parseFloat(item.stock) === 0 ? '0' : item.stock} <span className="text-[8px] uppercase opacity-50 ml-0.5">{item.unit}</span>
                              </span>
                              {parseFloat(item.stock) === 0 && (
                                <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter mt-0.5">Out of Stock</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                             </div>
                             <p className="text-[11px] font-bold text-text-primary/40 uppercase tracking-tight leading-tight">
                               All items are<br />sufficiently stocked
                             </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {lowStockItems.length > 5 && (
                <div className="px-1 text-right">
                  <button 
                    onClick={() => navigate('/stock-summary')}
                    className="text-[10px] font-bold text-brand-blue uppercase hover:underline tracking-tight"
                  >
                    View All Stock →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
