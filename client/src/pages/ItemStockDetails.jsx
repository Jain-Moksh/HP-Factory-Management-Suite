import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import MonthFilterFooter from '../components/MonthFilterFooter';
import ClickableChallan from '../components/UI/ClickableChallan';
import { API_BASE_URL } from '../config';

const ItemStockDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Filter State ---
  const [typeFilter, setTypeFilter] = useState('all'); // all, purchase, billing
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch item details
      const itemRes = await fetch(`${API_BASE_URL}/items/${id}`);
      const itemResult = await itemRes.json();
      if (itemResult.success) setItem(itemResult.data);

      // 2. Fetch transactions
      const transRes = await fetch(`${API_BASE_URL}/items/${id}/transactions`);
      const transResult = await transRes.json();
      if (transResult.success) setTransactions(transResult.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [id]);

  const transactionsWithBalance = useMemo(() => {
    if (!item) return [];
    let currentBalance = Number(item.stock) || 0;
    return transactions.map(t => {
      const closing_balance = currentBalance;
      if (t.type === 'purchase') {
        currentBalance -= (Number(t.inward) || 0);
      } else if (t.type === 'billing') {
        currentBalance += (Number(t.outward) || 0);
      }
      return { ...t, closing_balance };
    });
  }, [transactions, item]);

  const filteredTransactions = useMemo(() => {
    return transactionsWithBalance.filter(t => {
      // Type Filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Date Filters
      const tDateStr = t.date.split('T')[0];
      const matchesStart = !startDate || tDateStr >= startDate;
      const matchesEnd = !endDate || tDateStr <= endDate;

      // Month/Year Filter (From Footer)
      const date = new Date(tDateStr);
      const matchesMonth = date.getMonth() === selectedMonth;
      const matchesYear = date.getFullYear() === selectedYear;

      return matchesStart && matchesEnd && matchesMonth && matchesYear;
    });
  }, [transactionsWithBalance, typeFilter, startDate, endDate, selectedMonth, selectedYear]);

  const calculatedOpeningStock = useMemo(() => {
    if (!item) return 0;
    let balance = Number(item.stock) || 0;
    transactions.forEach(t => {
      if (t.type === 'purchase') {
        balance -= (Number(t.inward) || 0);
      } else if (t.type === 'billing') {
        balance += (Number(t.outward) || 0);
      }
    });
    return balance;
  }, [transactions, item]);

  const periodOpeningStock = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return calculatedOpeningStock;
    }
    const oldestTx = filteredTransactions[filteredTransactions.length - 1];
    return oldestTx.type === 'purchase'
      ? (Number(oldestTx.closing_balance) || 0) - (Number(oldestTx.inward) || 0)
      : (Number(oldestTx.closing_balance) || 0) + (Number(oldestTx.outward) || 0);
  }, [filteredTransactions, calculatedOpeningStock]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-20">
        <PageHeader 
          title="Stock Details" 
          subtitle={item ? `MOVEMENT HISTORY FOR ${item.name}` : "LOADING ITEM DETAILS..."}
          backAction={() => navigate('/stock-summary')}
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-border-soft">
               <div className="w-1.5 h-6 bg-brand-blue rounded-full"></div>
               <span className="text-[11px] font-bold text-text-primary uppercase tracking-widest">Movement Log</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">Type:</span>
              <div className="flex bg-bg-main p-1 rounded-lg border border-border-soft">
                {['all', 'purchase', 'billing'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                      typeFilter === type 
                        ? 'bg-brand-blue text-white shadow-md' 
                        : 'text-text-light hover:text-text-primary'
                    }`}
                  >
                    {type === 'purchase' ? 'Inward' : type === 'billing' ? 'Outward' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <span className="text-[10px] font-bold text-text-light uppercase tracking-wider whitespace-nowrap">Date Range:</span>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50"
                />
                <span className="text-[10px] font-bold text-text-light uppercase">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-main/50 border border-border-soft rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue/50"
                />
              </div>
            </div>

            {item && (
              <div className="flex items-center gap-4 pl-6 border-l border-border-soft">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-text-light uppercase tracking-wider">Current Stock</span>
                  <span className="text-[16px] font-black text-brand-blue tracking-tight leading-none mt-0.5">
                    {item.stock} <span className="text-[10px] font-bold opacity-60 uppercase">{item.unit}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-wider">
                  <th className="px-6 py-3 text-left border-r border-white/10">Challan No</th>
                  <th className="px-6 py-3 text-left border-r border-white/10">Date</th>
                  <th className="px-6 py-3 text-left border-r border-white/10">Name</th>
                  <th className="px-6 py-3 text-center border-r border-white/10">Inward Qty</th>
                  <th className="px-6 py-3 text-center border-r border-white/10">Outward Qty</th>
                  <th className="px-6 py-3 text-center border-r border-white/10">Closing Balance</th>
                  <th className="px-6 py-3 text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft text-[12.5px] font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[13px] font-medium text-text-light">Loading movement logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  <>
                    {filteredTransactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-bg-main/40 transition-colors">
                        <td className="px-6 py-3 font-bold text-text-primary uppercase tracking-tight">
                          <ClickableChallan challanNo={t.challan_no} type={t.type} />
                        </td>
                        <td className="px-6 py-3 text-text-light font-bold">
                          {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}
                        </td>
                        <td className="px-6 py-3 font-bold text-text-primary">{t.name}</td>
                        <td className="px-6 py-3 text-center font-black">
                          {t.inward > 0 ? (
                            <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-100">+ {t.inward}</span>
                          ) : (
                            <span className="opacity-20">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center font-black">
                          {t.outward > 0 ? (
                            <span className="text-red-500 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">- {t.outward}</span>
                          ) : (
                            <span className="opacity-20">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-center font-black text-brand-blue">
                          {t.closing_balance?.toLocaleString()} <span className="text-[9px] font-bold opacity-60 uppercase">{item?.unit}</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            t.type === 'purchase' ? 'bg-green-100 text-green-700' : 'bg-brand-blue/10 text-brand-blue'
                          }`}>
                            {t.type === 'purchase' ? 'Purchase' : 'Billing'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-bg-main/20 font-semibold text-text-light border-t border-border-soft">
                      <td className="px-6 py-3 font-bold text-text-primary uppercase tracking-tight opacity-40">-</td>
                      <td className="px-6 py-3 opacity-40">-</td>
                      <td className="px-6 py-3 font-bold text-text-primary uppercase tracking-wider">Opening Stock</td>
                      <td className="px-6 py-3 text-center opacity-40">-</td>
                      <td className="px-6 py-3 text-center opacity-40">-</td>
                      <td className="px-6 py-3 text-center font-black text-brand-blue">
                        {periodOpeningStock.toLocaleString()} <span className="text-[9px] font-bold opacity-60 uppercase">{item?.unit}</span>
                      </td>
                      <td className="px-6 py-3 text-center opacity-40">-</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center italic text-text-light">
                      No transactions found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredTransactions.length}
        />
      </div>
    </Layout>
  );
};

export default ItemStockDetails;
