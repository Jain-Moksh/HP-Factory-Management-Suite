import React from 'react';

const PaymentTable = ({ data = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white border border-border-soft rounded-xl p-12 text-center">
        <div className="inline-block w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-[12px] font-medium text-text-light uppercase tracking-widest">Loading Payments...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-table-header text-white">
              <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest">Challan No.</th>
              <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-40">Date</th>
              <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest">Party Name</th>
              <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-32">Amount</th>
              <th className="px-3 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-bg-main/50 transition-colors duration-75">
                <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-text-primary tracking-tight">{row.challan}</td>
                <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] text-text-primary font-bold">{row.date}</td>
                <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-brand-blue uppercase tracking-tight">
                  {row.client} {row.shortform && <span className="text-text-primary/50 font-medium ml-1">({row.shortform})</span>}
                </td>
                <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-black text-brand-blue">₹{row.amount.toLocaleString()}</td>
                <td className="px-3 py-1.5 border-x border-border-soft">
                  <div className="flex items-center justify-center gap-2.5">
                    <button className="text-brand-blue hover:scale-110 p-1.5 rounded transition" title="Edit Payment">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="text-red-500 hover:scale-110 p-1.5 rounded transition" title="Delete Payment">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-text-light italic text-[13px]">
                  No payment records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentTable;
