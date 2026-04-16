import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DeleteModal from './UI/DeleteModal';

const JobWorkTable = ({ data = [], loading = false, onDelete }) => {
  const navigate = useNavigate();
  // --- Deletion State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    // Standardize password check for UI consistency
    if (deletePassword !== import.meta.env.VITE_DEL_PASS) {
      setDeleteError('Incorrect master password');
      return;
    }

    const success = await onDelete(itemToDelete, deletePassword);
    if (success !== false) { // Assuming it returns void or success
      setIsDeleteModalOpen(false);
    } else {
      setDeleteError('Failed to delete record');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-border-soft rounded-xl shadow-sm p-12 text-center text-text-light font-medium italic animate-pulse">
        Loading job work records...
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
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest">Challan No.</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest w-40">Date</th>
                <th className="px-5 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest">Jobber Name</th>
                <th className="px-3 py-2 text-[10.5px] font-bold border-x border-white/5 uppercase tracking-widest text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-bg-main/50 transition-colors duration-75">
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-text-primary tracking-tight">{row.challan_no}</td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] text-text-primary font-bold">
                    {new Date(row.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-1.5 border-x border-border-soft text-[12.5px] font-bold text-brand-blue uppercase tracking-tight">{row.jobber_name}</td>
                  <td className="px-3 py-1.5 border-x border-border-soft">
                    <div className="flex items-center justify-center gap-2.5">
                      <button 
                        onClick={() => navigate(`/create-job-work/${row.id}`)}
                        className="text-brand-blue hover:scale-110 p-1.5 rounded transition" 
                        title="Edit Job Work"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        className="text-red-500 hover:scale-110 p-1.5 rounded transition" 
                        title="Delete Job Work"
                        onClick={() => openDeleteModal(row.id)}
                      >
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
                    No job work records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        password={deletePassword}
        setPassword={setDeletePassword}
        error={deleteError}
        message="You are about to delete a job work record. This will also adjust your stock levels by reversing the entry."
      />
    </>
  );
};

export default JobWorkTable;
