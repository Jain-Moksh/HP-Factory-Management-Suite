import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../config';

const PartyStockDetail = () => {
  const { clientId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract date range from URL if present
  const queryParams = new URLSearchParams(location.search);
  const fromDate = queryParams.get('from') || '';
  const toDate = queryParams.get('to') || '';

  const [data, setData] = useState(null);
  const [client, setClient] = useState(null);
  const [item, setItem] = useState(null);
  const [startDate, setStartDate] = useState(fromDate);
  const [endDate, setEndDate] = useState(toDate);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Client Details
      const clientRes = await fetch(`${API_BASE_URL}/clients/${clientId}`);
      const clientResult = await clientRes.json();
      if (clientResult.success) setClient(clientResult.data);

      // 2. Fetch Item Details
      const itemRes = await fetch(`${API_BASE_URL}/items/${itemId}`);
      const itemResult = await itemRes.json();
      if (itemResult.success) setItem(itemResult.data);

      // 3. Fetch Transaction Detail
      const transRes = await fetch(`${API_BASE_URL}/reports/party-stock-detail?client_id=${clientId}&item_id=${itemId}&from=${startDate}&to=${endDate}`);
      const transResult = await transRes.json();
      if (transResult.success) setData(transResult.data);
      
    } catch (err) {
      console.error("Error fetching detail report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId, itemId, startDate, endDate]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Item Detail Report" 
          subtitle="TRANSACTION LEDGER FOR SELECTED PARTY AND ITEM"
          backAction={() => navigate(-1)}
        />

        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Standardized Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center gap-4 group">
            <div className="flex items-center gap-4 shrink-0 border-r border-border-soft pr-4">
              <div className="w-8 h-8 bg-brand-blue/10 rounded flex items-center justify-center text-brand-blue font-bold text-[10px]">
                {item ? item.name.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-text-primary uppercase tracking-tight leading-none mb-1">
                  {item ? item.name : 'Loading...'}
                </span>
                <span className="text-[9px] font-bold text-brand-blue uppercase tracking-widest opacity-70">
                   Stock at: {client ? client.name : '...'}
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-6">
              <div className="flex items-center gap-2 bg-bg-main/30 px-3 py-1 rounded-lg border border-divider-soft/50">
                <svg className="w-3 h-3 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-6 bg-transparent text-[11px] font-bold text-text-primary uppercase outline-none"
                  />
                  <span className="text-[10px] text-text-light opacity-40 font-bold uppercase">to</span>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-6 bg-transparent text-[11px] font-bold text-text-primary uppercase outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={fetchData}
                disabled={isLoading}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg transition shadow-lg shadow-brand-blue/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {isLoading ? 'Wait...' : 'Set Filter'}
              </button>
            </div>
          </div>

          {/* Ledger Table - Matches BillingTable style */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Challan No</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Date</th>
                    <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span>LOADING LEDGER...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data && data.transactions.length > 0 ? (
                    data.transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/30 transition-colors duration-75">
                        <td className="px-5 py-1.5 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                          {t.challan_no}
                        </td>
                        <td className="px-5 py-1.5 text-center text-[12px] font-bold text-text-primary border-r border-border-soft">
                          {new Date(t.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-5 py-1.5 text-right text-[13px] font-bold text-brand-blue tracking-tight">
                          {parseFloat(t.quantity).toLocaleString()} 
                          <span className="ml-1 text-[9px] font-bold text-text-light uppercase opacity-60 tracking-tighter">{item?.unit}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center italic text-text-light text-[12px]">
                        No sales records found for this client-item combination.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data && data.transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-bg-main/50 font-bold border-t-2 border-border-soft">
                      <td colSpan="2" className="px-5 py-2 text-right text-[10px] text-text-light uppercase tracking-widest font-black">Total Quantity Multiplied:</td>
                      <td className="px-5 py-2 text-right text-[15px] font-black text-brand-blue tracking-tight">
                        {parseFloat(data.total_quantity).toLocaleString()}
                        <span className="ml-1 text-[10px] font-bold uppercase">{item?.unit}</span>
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
              These records reflect items sold to this party. For total inventory levels, visit the Stock Summary page.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartyStockDetail;
