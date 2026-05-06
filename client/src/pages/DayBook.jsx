import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import PrintInvoice from '../components/PrintInvoice';
import { API_BASE_URL } from '../config';

const DayBook = () => {
  const [selectedDate, setSelectedDate] = useState(new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(new Date().toISOString().split('T')[0]) ? new Date().toISOString().split('T')[0] : '');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Deletion State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Printing State ---
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printItems, setPrintItems] = useState([]);

  const navigate = useNavigate();

  const fetchData = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/day-book?date=${selectedDate}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error("Error fetching day book:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchData();
    }
  }, [selectedDate]);

  const handleEdit = (item) => {
    if (item.type === 'billing') {
      navigate(`/create-invoice/${item.id}`);
    } else {
      navigate(`/create-job-work/${item.id}`);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
    setDeletePassword('');
  };

  const confirmDelete = async () => {
    if (!deletePassword) return;
    setIsDeleting(true);
    try {
      const endpoint = itemToDelete.type === 'billing' ? `/billing/${itemToDelete.id}` : `/purchase/${itemToDelete.id}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });
      const result = await response.json();
      if (result.success) {
        setShowDeleteModal(false);
        fetchData();
      } else {
        alert(result.message || 'Failed to delete');
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Printing Logic ---
  const handlePrint = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/${id}`);
      const result = await response.json();
      if (result.success) {
        const bill = result.data;
        
        const summaryData = {
          challanNo: bill.challan_no,
          date: bill.date.split('T')[0],
          clientName: bill.client_name,
          clientRawName: bill.client_name,
          client_shortform: bill.client_shortform,
          address1: bill.address1 || '',
          address2: bill.address2 || '',
          transporterName: bill.transporter_name,
          short_remark: bill.short_remark || '',
          long_remark: bill.long_remark || '',
          itemsSubtotal: parseFloat(bill.total_amount),
          transport: bill.transport_charge || 0,
          packing: bill.packing_charge || 0,
          extraDiscountPercent: bill.discount_percent || 0,
          extraDiscountAmount: bill.discount_amount || 0,
          grandTotal: parseFloat(bill.grand_total)
        };

        const subtotalBeforeRound = summaryData.itemsSubtotal + parseFloat(summaryData.transport) + parseFloat(summaryData.packing) - parseFloat(summaryData.extraDiscountAmount);
        const calculatedRoundOff = Math.round(subtotalBeforeRound) - subtotalBeforeRound;
        summaryData.roundOffDisplay = calculatedRoundOff === 0 ? "0.00" : (calculatedRoundOff > 0 ? "+" : "-") + Math.abs(calculatedRoundOff).toFixed(2);

        const mappedItems = bill.items.map(item => ({
          item: item.item_name,
          qty: item.quantity,
          unit: item.unit,
          rate: item.rate,
          dAmount: item.discount_amount,
          conversion: item.conversion,
          total: item.total_amount
        }));

        setPrintData(summaryData);
        setPrintItems(mappedItems);
        setIsPrinting(true);
      }
    } catch (err) {
      console.error("Error fetching print data:", err);
      alert("Failed to fetch invoice details for printing");
    }
  };

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16 text-text-primary">
        <PageHeader 
          title="Day Book" 
          subtitle="COMBINED DAILY TRANSACTION LEDGER" 
          backAction={() => navigate('/dashboard')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filter Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
                <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Daily Ledger</span>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 px-3 bg-bg-main/50 border border-divider-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>
            </div>

            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20 active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Wait...' : 'Refresh'}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden min-h-[400px]">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-32">Challan No</th>
                        <th className="px-5 py-2 text-center border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-24">Type</th>
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party/Jobber Name</th>
                        <th className="px-5 py-2 text-right border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-40">Amount</th>
                        <th className="px-5 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                           <tr>
                             <td colSpan="5" className="px-6 py-20 text-center">
                                 <div className="flex flex-col items-center gap-3">
                                   <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                   <span className="text-[13px] font-medium text-text-light uppercase tracking-widest">Loading transactions...</span>
                                 </div>
                             </td>
                           </tr>
                        ) : data.length > 0 ? (
                           data.map((item) => (
                             <tr key={`${item.type}-${item.id}`} className="hover:bg-bg-main/30 transition-colors group/row">
                                <td className="px-5 py-1 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight tracking-tight">
                                   {item.type === 'billing' ? item.challan_no : `${item.challan_no}`}
                                </td>
                                <td className="px-5 py-1 text-center border-r border-border-soft">
                                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                     item.type === 'billing' 
                                       ? 'bg-emerald-100 text-emerald-700' 
                                       : 'bg-amber-100 text-amber-700'
                                   }`}>
                                      {item.type}
                                   </span>
                                </td>
                                <td className="px-5 py-1 text-[13px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                   {item.name}
                                </td>
                                <td className={`px-5 py-1 text-right font-bold border-r border-border-soft ${item.type === 'billing' ? 'text-brand-blue text-[14px]' : 'text-text-light opacity-30 text-[12px]'}`}>
                                   {item.type === 'billing' ? `₹${parseFloat(item.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}` : '—'}
                                </td>
                                <td className="px-5 py-1 text-center flex items-center justify-center gap-1">
                                   <button 
                                      onClick={() => handleEdit(item)}
                                      className="text-brand-blue hover:scale-110 p-1.5 rounded transition"
                                      title="Edit"
                                   >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                   </button>
                                   {item.type === 'billing' && (
                                     <button 
                                        onClick={() => handlePrint(item.id)}
                                        className="text-brand-blue hover:scale-110 p-1.5 rounded transition"
                                        title="Print"
                                     >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                     </button>
                                   )}
                                   <button 
                                      onClick={() => handleDeleteClick(item)}
                                      className="text-red-500 hover:scale-110 p-1.5 rounded transition"
                                      title="Delete"
                                   >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                   </button>
                                </td>
                             </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="5" className="px-6 py-20 text-center italic text-text-light text-[12px] opacity-60">
                                 No transactions recorded for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : 'this date'}.
                              </td>
                           </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>
        </div>

        {isPrinting && printData && (
          <PrintInvoice data={printData} items={printItems} />
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.743-2.98L12.93 4.852a1.745 1.745 0 00-3.06 0L3.314 16.02c-.76 1.313.203 2.98 1.743 2.98z" />
                    </svg>
                 </div>
                 <h3 className="text-center text-[16px] font-bold text-text-primary uppercase tracking-tight mb-2">Confirm Deletion</h3>
                 <p className="text-center text-[12px] text-text-light leading-relaxed mb-6">
                    You are about to delete <span className="font-bold text-text-primary capitalize">{itemToDelete?.type}</span> record <span className="font-bold text-text-primary">#{itemToDelete?.challan_no}</span>. This action is permanent.
                 </p>
                 
                 <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-black text-text-light uppercase tracking-widest ml-1">Admin Password</label>
                       <input 
                         type="password"
                         autoFocus
                         value={deletePassword}
                         onChange={(e) => setDeletePassword(e.target.value)}
                         placeholder="••••••••"
                         onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                         className="w-full h-10 px-4 bg-bg-main border border-divider-soft rounded-lg text-center font-bold text-brand-blue outline-none focus:border-red-500 transition-all"
                       />
                    </div>
                    
                    <div className="flex gap-3">
                       <button 
                         onClick={() => setShowDeleteModal(false)}
                         className="flex-1 h-10 rounded-lg text-[12px] font-bold text-text-light bg-bg-main hover:bg-divider-soft transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         onClick={confirmDelete}
                         disabled={!deletePassword || isDeleting}
                         className="flex-1 h-10 rounded-lg text-[12px] font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95 disabled:opacity-50"
                       >
                         {isDeleting ? 'Deleting...' : 'Delete Now'}
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DayBook;
