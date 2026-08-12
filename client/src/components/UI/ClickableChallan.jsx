import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { API_BASE_URL } from '../../config';

export const ClickableChallan = ({ challanNo, type = 'billing' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billData, setBillData] = useState(null);

  // Return non-clickable span if challan number is blank
  if (!challanNo) {
    return <span className="text-text-light opacity-30">—</span>;
  }

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setBillData(null);

    try {
      const endpoint = `${API_BASE_URL}/${type === 'purchase' ? 'purchase' : 'billing'}/by-challan?challanNo=${encodeURIComponent(challanNo)}`;
      const res = await fetch(endpoint);
      const result = await res.json();

      if (result.success && result.data) {
        setBillData(result.data);
      } else {
        setError(result.message || `No associated record found for challan #${challanNo}`);
      }
    } catch (err) {
      console.error('Error fetching challan details:', err);
      setError('Unable to load record. Network/Server error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setBillData(null);
  };

  return (
    <>
      {/* Clickable trigger */}
      <span
        onClick={(e) => {
          e.stopPropagation(); // Avoid triggering row clicks
          handleOpen();
        }}
        className="text-brand-blue hover:text-brand-blue-hover hover:underline cursor-pointer font-bold tracking-tight uppercase select-none transition-colors"
      >
        {challanNo}
      </span>

      {/* View-Only Overlay Portal */}
      {isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" 
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                  type === 'purchase' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {type === 'purchase' ? 'JW' : 'IN'}
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                    {type === 'purchase' ? 'Jobber Inward Entry' : 'Client Outward Invoice'}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Challan No: {challanNo} • VIEW ONLY
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-600">
              {isLoading && (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[12px] font-bold text-text-light uppercase tracking-widest">Fetching document details...</span>
                </div>
              )}

              {error && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 text-red-500">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[12px] font-black uppercase tracking-wider">{error}</p>
                </div>
              )}

              {!isLoading && !error && billData && (
                <div className="flex flex-col gap-6 text-[12px]">
                  {/* Info Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Card: Customer / Jobber Details */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {type === 'purchase' ? 'Jobber Details' : 'Customer / Party Details'}
                      </h4>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">
                          {type === 'purchase' ? billData.jobber_name : billData.client_name}
                        </span>
                        {type !== 'purchase' && (
                          <span className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                            {billData.address1} {billData.address2}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Card: Metadata */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2.5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Metadata Details
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                          <span className="font-bold text-slate-800">
                            {new Date(billData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {type !== 'purchase' && (
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transporter</span>
                            <span className="font-bold text-slate-800 truncate">
                              {billData.transporter_name || 'Direct / None'}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col col-span-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remarks</span>
                          <span className="font-bold text-slate-800 truncate">
                            {billData.remark || billData.short_remark || 'No remarks recorded'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Breakdown Table */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Itemized Breakdown
                    </h4>
                    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                            <th className="px-4 py-2 text-left">Item Name</th>
                            <th className="px-4 py-2 text-center w-24">Quantity</th>
                            <th className="px-4 py-2 text-center w-20">Unit</th>
                            {type !== 'purchase' && (
                              <>
                                <th className="px-4 py-2 text-right w-24">Rate</th>
                                <th className="px-4 py-2 text-right w-28">Discount</th>
                                <th className="px-4 py-2 text-right w-32">Total</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {billData.items && billData.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-bold text-slate-800 uppercase tracking-tight">
                                {item.item_name}
                              </td>
                              <td className="px-4 py-2 text-center font-bold text-slate-800">
                                {parseFloat(item.quantity).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-center font-bold text-slate-500 uppercase">
                                {item.unit || 'DOZ'}
                              </td>
                              {type !== 'purchase' && (
                                <>
                                  <td className="px-4 py-2 text-right font-bold text-slate-800">
                                    ₹{parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-2 text-right font-bold text-slate-500">
                                    {parseFloat(item.discount_percent) > 0 ? (
                                      <span>
                                        {item.discount_percent}% (-₹{parseFloat(item.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td className="px-4 py-2 text-right font-black text-brand-blue">
                                    ₹{parseFloat(item.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary / Totals block for Billing */}
                  {type !== 'purchase' && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 ml-auto w-full md:w-80 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-slate-500 font-bold">
                        <span>Items Subtotal:</span>
                        <span>₹{parseFloat(billData.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      
                      {parseFloat(billData.transport_charge) > 0 && (
                        <div className="flex justify-between items-center text-slate-500 font-bold">
                          <span>Transport Charge:</span>
                          <span>+ ₹{parseFloat(billData.transport_charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(billData.packing_charge) > 0 && (
                        <div className="flex justify-between items-center text-slate-500 font-bold">
                          <span>Packing Charge:</span>
                          <span>+ ₹{parseFloat(billData.packing_charge).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(billData.discount_amount) > 0 && (
                        <div className="flex justify-between items-center text-slate-500 font-bold">
                          <span>Extra Discount ({billData.discount_percent}%):</span>
                          <span className="text-red-500">- ₹{parseFloat(billData.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {parseFloat(billData.adjustment_amount) > 0 && (
                        <div className="flex justify-between items-center text-slate-500 font-bold">
                          <span>Adjustment ({billData.adjustment_percent}%):</span>
                          <span>+ ₹{parseFloat(billData.adjustment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center font-black text-slate-800 text-[13.5px]">
                        <span>Grand Total:</span>
                        <span className="text-brand-blue">
                          ₹{parseFloat(billData.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Long Remark */}
                  {billData.long_remark && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal Remarks Log</span>
                      <p className="font-bold text-slate-700 italic">"{billData.long_remark}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handleClose}
                className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-lg active:scale-95 transition-all text-[11px] tracking-widest"
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

export default ClickableChallan;
