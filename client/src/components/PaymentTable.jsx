import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const PaymentTable = ({ data = [], loading = false, onDelete, onEdit }) => {
  const [selectedTx, setSelectedTx] = useState(null);
  if (loading) {
    return (
      <div className="bg-white border border-border-soft rounded-xl p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-[12px] font-medium text-text-light uppercase tracking-widest">Loading Transactions...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-table-header text-white">
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-40">Challan No.</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-28">Type</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-40">Date</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest">Party Name</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-36">Amount</th>
                <th className="px-3 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-bg-main/50 transition-colors duration-75">
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-text-primary tracking-tight">
                    <span 
                      onClick={() => setSelectedTx(row)}
                      className="text-brand-blue hover:text-brand-blue-hover hover:underline cursor-pointer font-bold tracking-tight uppercase select-none transition-colors"
                    >
                      {row.challan_no}
                    </span>
                  </td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[10px] font-bold uppercase text-center">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] tracking-wider font-extrabold ${
                      row.transaction_type === 'PAYMENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                      row.transaction_type === 'REPLACE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {row.transaction_type}
                    </span>
                  </td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] text-text-primary font-bold">{row.date}</td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-brand-blue uppercase tracking-tight">
                    {row.party_name} <span className="text-[9px] font-bold opacity-50 px-1 bg-bg-main border border-border-soft rounded ml-1 text-text-secondary">{row.party_type}</span>
                  </td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-black text-brand-blue">
                    ₹{(parseFloat(row.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-1.5 border-x border-border-soft">
                    <div className="flex items-center justify-center gap-2.5">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row.id)}
                          className="text-brand-blue hover:scale-110 p-1.5 rounded transition" 
                          title="Edit Transaction"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row.id)}
                          className="text-red-500 hover:scale-110 p-1.5 rounded transition" 
                          title="Delete Transaction"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-text-light italic text-[13px]">
                    No transaction records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Transaction Detail Modal Portal */}
      {selectedTx && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] cursor-pointer" 
            onClick={() => setSelectedTx(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                  selectedTx.transaction_type === 'PAYMENT' ? 'bg-green-100 text-green-700' :
                  selectedTx.transaction_type === 'REPLACE' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-brand-blue'
                }`}>
                  {selectedTx.transaction_type === 'PAYMENT' ? 'PY' : selectedTx.transaction_type === 'REPLACE' ? 'RP' : 'DS'}
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                    {selectedTx.transaction_type} Entry details
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Challan No: {selectedTx.challan_no}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4 text-[12px] text-slate-600">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedTx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="font-bold text-brand-blue">
                    ₹{parseFloat(selectedTx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Name</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {selectedTx.party_name} ({selectedTx.party_type})
                  </span>
                </div>
                {selectedTx.transaction_type === 'PAYMENT' && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</span>
                    <span className="px-2 py-0.5 bg-slate-200 border border-slate-300 rounded font-black text-slate-800 text-[10px] uppercase tracking-wider inline-block w-fit mt-1">
                      {selectedTx.payment_mode || 'CASH'}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remarks Log</span>
                <p className="font-bold text-slate-700 italic">
                  {selectedTx.remark ? `"${selectedTx.remark}"` : 'No remarks recorded'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedTx(null)}
                className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-lg active:scale-95 transition-all text-[11px] tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PaymentTable;
