import React, { useState } from 'react';
import DeleteModal from './UI/DeleteModal';

const BillingTable = ({ data = [], isLoading = false, onDelete }) => {
  // --- Deletion State (Modals kept internal for UI cleanliness) ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const openDeleteModal = (id) => {
    setBillToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    const success = await onDelete(billToDelete, deletePassword);
    if (success) {
      setIsDeleteModalOpen(false);
    } else {
      setDeleteError('Incorrect password or server error');
    }
  };

  return (
    <>
      <div className="bg-white border border-border-soft rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-table-header text-white">
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Challan No.</th>
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Date</th>
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Party Name</th>
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider text-right">Amount</th>
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Remarks</th>
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-[#F1F5F9] transition-colors duration-75">
                  <td className="px-3 py-1 border-x border-border-soft text-[12px] font-bold text-text-primary tracking-tight">{row.challan_no}</td>
                  <td className="px-3 py-1 border-x border-border-soft text-[12px] text-text-secondary">
                    {new Date(row.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-3 py-1 border-x border-border-soft text-[12px] font-medium text-brand-blue">{row.client_name}</td>
                  <td className="px-3 py-1 border-x border-border-soft text-[12px] font-bold text-text-primary text-right">
                    ₹{parseFloat(row.grand_total || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-1 border-x border-border-soft text-[12px] text-text-secondary">{row.short_remark || '-'}</td>
                  <td className="px-3 py-1 border-x border-border-soft">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-brand-blue hover:scale-110 p-1 rounded transition" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="text-brand-blue hover:scale-110 p-1 rounded transition" title="Print">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => openDeleteModal(row.id)}
                        className="text-red-500 hover:scale-110 p-1 rounded transition" 
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !isLoading && (
            <div className="px-6 py-10 text-center text-text-light italic text-[13px]">
              No order summary found. Create an invoice to get started.
            </div>
          )}
          {isLoading && (
            <div className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
              Loading order data...
            </div>
          )}
        </div>
      </div>

      {/* Standardized Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        password={deletePassword}
        setPassword={setDeletePassword}
        error={deleteError}
        message="This action is permanent and will revert any stock changes associated with this invoice. Please enter the master deletion password to proceed."
      />
    </>
  );
};

export default BillingTable;
