import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import { API_BASE_URL } from '../../config';

const PartyBillingDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract date range from URL if present
  const queryParams = new URLSearchParams(location.search);
  const initialFrom = queryParams.get('from') || '';
  const initialTo = queryParams.get('to') || '';

  const [data, setData] = useState(null);
  const [startDate, setStartDate] = useState(initialFrom);
  const [endDate, setEndDate] = useState(initialTo);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/party-billing-detail?client_id=${clientId}&from=${startDate}&to=${endDate}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error fetching billing details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId, startDate, endDate]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Party Billing Details" 
          subtitle="COMPLETE TRANSACTION HISTORY FOR SELECTED PARTY"
          backAction={() => navigate(-1)}
        />

        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Party Header & Filters */}
          <div className="bg-white border border-border-soft rounded-lg p-4 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-blue/10 rounded flex items-center justify-center text-brand-blue font-bold text-sm">
                {data?.client_name ? data.client_name.substring(0, 2).toUpperCase() : '??'}
              </div>
              <div>
                <h2 className="text-[16px] font-black text-text-primary uppercase tracking-tight leading-tight">
                  {data?.client_name || 'Loading Party...'}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-bold text-white bg-brand-navy px-1.5 py-0.5 rounded uppercase tracking-wider">Client</span>
                  <span className="text-[12px] font-bold text-brand-blue uppercase">Sales History</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">From:</span>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">To:</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Billing Ledger Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Challan No</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Date</th>
                    <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {isLoading ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-brand-blue animate-pulse font-bold text-[13px]">
                          <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                          <span>FETCHING BILLING DATA...</span>
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
                        <td className="px-5 py-1.5 text-right text-[14px] font-bold text-brand-blue px-10 tracking-tight">
                          ₹{parseFloat(t.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center italic text-text-light text-[12px]">
                        No billing transactions found for this party in selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data && data.transactions.length > 0 && (
                  <tfoot>
                    <tr className="bg-bg-main/50 font-bold border-t-2 border-border-soft">
                      <td colSpan="2" className="px-5 py-3 text-right text-[10px] text-text-light uppercase tracking-widest font-black italic opacity-70">Total Party Billing:</td>
                      <td className="px-5 py-3 text-right text-[16px] font-black text-brand-blue px-10 tracking-tight">
                        ₹{parseFloat(data.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
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
              Values shown above represent the net grand total of each invoice generated for this client. 
              The totals include all taxes, charges, and discounts applied at the time of billing.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartyBillingDetail;
