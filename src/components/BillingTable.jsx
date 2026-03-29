import React from 'react';

const BillingTable = () => {
  const data = [
    { id: 1, challan: 'CH-001', date: '25/03/2026', client: 'Ajay Traders', city: 'Mumbai', amount: 12000, remarks: 'Urgent Delivery' },
    { id: 2, challan: 'CH-002', date: '01/03/2026', client: 'Rahul Enterprises', city: 'Surat', amount: 25000, remarks: '-' },
    { id: 3, challan: 'CH-003', date: '01/03/2026', client: 'Keshav & Sons', city: 'Ahmedabad', amount: 10500, remarks: 'Partial Paid' },
    { id: 4, challan: 'CH-004', date: '01/03/2026', client: 'Rahul Enterprises', city: 'Surat', amount: 3000, remarks: '-' },
    { id: 5, challan: 'CH-005', date: '12/03/2026', client: 'Mehta Plastics', city: 'Surat', amount: 94400, remarks: 'Bulk Order' },
  ];

  return (
    <div className="bg-white border border-border-soft rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-table-header text-white">
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider text-center">Actions</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Challan No.</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Date</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Client Name</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">City</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider text-right">Amount</th>
              <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-[#F1F5F9] transition-colors duration-75">
                <td className="px-3 py-1 border-x border-border-soft">
                  <div className="flex items-center justify-center gap-2">
                    <button className="text-brand-blue hover:scale-110 p-1 rounded transition" title="Edit">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="text-red-500 hover:scale-110 p-1 rounded transition" title="Delete">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] font-bold text-text-primary tracking-tight">{row.challan}</td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] text-text-secondary">{row.date}</td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] font-medium text-brand-blue">{row.client}</td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] text-text-secondary">{row.city}</td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] font-bold text-text-primary text-right">
                  ₹{row.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-1 border-x border-border-soft text-[12px] text-text-secondary">{row.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingTable;
