import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import Modal from './UI/Modal';
import Button from './UI/Button';

const BillingTable = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Deletion State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/billing`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch billing data');
      }
    } catch (err) {
      setError('Network error while fetching billing');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openDeleteModal = (id) => {
    setBillToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/billing/${billToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      const result = await response.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        fetchBills();
      } else {
        setDeleteError(result.message || 'Fail to delete');
      }
    } catch (err) {
      setDeleteError('Network error while deleting');
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
                <th className="px-3 py-1.5 text-[11px] font-semibold border-x border-white/5 uppercase tracking-wider">Client Name</th>
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
              No billing entries found. Create an invoice to get started.
            </div>
          )}
          {isLoading && (
            <div className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
              Loading billing data...
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Security Verification"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 border-red-500">
              Confirm Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-slate-600 font-medium whitespace-normal">
            This action is permanent and will revert any stock changes associated with this invoice. Please enter the master deletion password to proceed.
          </p>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Enter Password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-blue transition-colors text-[14px]"
              autoFocus
            />
            {deleteError && (
              <p className="text-red-500 text-[12px] font-bold flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {deleteError}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BillingTable;
