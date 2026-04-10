import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import DeleteModal from '../../components/UI/DeleteModal';
import { API_BASE_URL } from '../../config';

const PartyList = () => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    shortform: '',
    street: '',
    city: '',
    balance: '',
    remark: ''
  });

  // --- List State ---
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Fetch Clients ---
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      const result = await response.json();
      if (result.success) {
        setClients(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shortform: formData.shortform,
          street: formData.street,
          city: formData.city,
          balance: parseFloat(formData.balance) || 0,
          remark: formData.remark
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchClients();
        handleRedo();
      } else {
        alert(result.message || 'Failed to save client');
      }
    } catch (err) {
      alert('Network error while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedo = () => {
    setFormData({
      name: '',
      shortform: '',
      street: '',
      city: '',
      balance: '',
      remark: ''
    });
  };

  const openDeleteModal = (id) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setDeleteError('Password is required');
      return;
    }

    if (deletePassword !== import.meta.env.VITE_DEL_PASS) {
      setDeleteError('Incorrect master password');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/clients/${clientToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      const result = await response.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        fetchClients();
      } else {
        setDeleteError('Fail to delete');
      }
    } catch (err) {
      setDeleteError('Network error while deleting');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader 
          title="Party List" 
          subtitle="MANAGE SYSTEM PARTY MASTER DATA" 
        />

        <div className="px-6 flex flex-col gap-6">
          {/* Data Entry Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="bg-table-header px-4 py-2 border-b border-border-soft">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Party Entry</h3>
            </div>
            
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary">
                    <th className="px-4 py-2 text-left border-r border-border-soft">Party Name</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft">Pet Name</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft">Address 1</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-1/5">Address 2</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-1/5">Opening Balance</th>
                    <th className="px-4 py-2 text-left w-1/5">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50">
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="Enter party name..."
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text"
                        name="shortform"
                        value={formData.shortform}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="Pet name"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="GIDC/Street"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="City/State"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="balance"
                        value={formData.balance}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-bold text-brand-blue"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-0">
                      <input 
                        type="text"
                        name="remark"
                        value={formData.remark}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="Any remarks"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-bg-main/30 flex justify-end gap-3 border-t border-border-soft">
              <button 
                onClick={handleRedo}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[11.5px] font-bold text-text-secondary hover:text-text-primary transition uppercase tracking-tight"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redo
              </button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSave}
                className="px-6 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Party
              </Button>
            </div>
          </div>

          {/* Master Table Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
              <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Existing Parties Master</h2>
            </div>
            
            <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Party Name</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Address 1</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Address 2</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Opening Balance</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Remarks</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-bg-main/30 transition-colors">
                      <td className="px-5 py-1.5 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                        {client.name} {client.shortform && <span className="text-text-secondary font-medium ml-1">({client.shortform})</span>}
                      </td>
                      <td className="px-5 py-1.5 text-[12.5px] text-text-secondary border-r border-border-soft">
                        {client.street}
                      </td>
                      <td className="px-5 py-1.5 text-[12.5px] text-text-light border-r border-border-soft">
                        {client.city}
                      </td>
                      <td className="px-5 py-1.5 text-[12.5px] font-bold text-brand-blue border-r border-border-soft">
                        ₹{parseFloat(client.balance || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-1.5 text-[12.5px] text-text-light border-r border-border-soft italic">
                        {client.remark || '-'}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center justify-center gap-2.5">
                          <button className="text-brand-blue hover:scale-110 transition p-1" title="Edit Party">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openDeleteModal(client.id)}
                            className="text-red-500 hover:scale-110 transition p-1" 
                            title="Delete Party"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-text-light italic text-[13px]">
                        No parties found in master. Add a new party to get started.
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
                        Loading master data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        password={deletePassword}
        setPassword={setDeletePassword}
        error={deleteError}
      />
    </Layout>
  );
};

export default PartyList;
