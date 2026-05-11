import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import DeleteModal from '../../components/UI/DeleteModal';
import { API_BASE_URL } from '../../config';

const JobberList = () => {
  // --- Master Items ---
  const [availableItems, setAvailableItems] = useState([]);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    selectedItems: [] // Stores item objects {id, name}
  });

  // --- List State ---
  const [jobbers, setJobbers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobberToDelete, setJobberToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Multi-Select State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- Inline Edit State ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', selectedItems: [] });
  const [editSearchTerm, setEditSearchTerm] = useState('');
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const editDropdownRef = useRef(null);
  const editRowRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setIsEditDropdownOpen(false);
      }
      // Click outside the editing row to cancel
      if (editRowRef.current && !editRowRef.current.contains(event.target)) {
        handleEditCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Fetch Data ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, jobbersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/items`),
        fetch(`${API_BASE_URL}/jobbers`)
      ]);
      
      const itemsData = await itemsRes.json();
      const jobbersData = await jobbersRes.json();
      
      if (itemsData.success) setAvailableItems(itemsData.data);
      if (jobbersData.success) setJobbers(jobbersData.data);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, []);

  const filteredItems = availableItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !formData.selectedItems.some(si => si.id === item.id)
  );

  // --- Handlers ---
  const handleToggleItem = (item) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.some(si => si.id === item.id)
        ? prev.selectedItems.filter(i => i.id !== item.id)
        : [...prev.selectedItems, item]
    }));
    setSearchTerm('');
  };

  const removeItem = (item) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => i.id !== item.id)
    }));
  };

  const handleSave = async () => {
    if (!formData.name) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          item_ids: formData.selectedItems.map(item => item.id)
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchData();
        handleRedo();
      } else {
        alert(result.message || 'Failed to save jobber');
      }
    } catch (err) {
      alert('Network error while saving');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Inline Edit Handlers ---
  const handleEditClick = (jobber) => {
    setEditingId(jobber.id);
    setEditFormData({
      name: jobber.name,
      selectedItems: jobber.items || []
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({ name: '', selectedItems: [] });
    setEditSearchTerm('');
  };

  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobbers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          item_ids: editFormData.selectedItems.map(item => item.id)
        })
      });

      const result = await response.json();
      if (result.success) {
        setJobbers(prev => prev.map(j => j.id === id ? { ...j, name: editFormData.name, items: editFormData.selectedItems } : j));
        setEditingId(null);
      } else {
        alert(result.message || 'Failed to update jobber');
      }
    } catch (err) {
      alert('Network error while updating');
    }
  };

  const handleToggleEditItem = (item) => {
    setEditFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.some(si => si.id === item.id)
        ? prev.selectedItems.filter(i => i.id !== item.id)
        : [...prev.selectedItems, item]
    }));
    setEditSearchTerm('');
  };

  const removeEditItem = (item) => {
    setEditFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => i.id !== item.id)
    }));
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter' && !isEditDropdownOpen) {
      handleEditSave(id);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleRedo = () => {
    setFormData({ name: '', selectedItems: [] });
    setSearchTerm('');
  };

  const openDeleteModal = (id) => {
    setJobberToDelete(id);
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
      const response = await fetch(`${API_BASE_URL}/jobbers/${jobberToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      const result = await response.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        setDeletePassword(''); // Clear password
        fetchData();
      } else {
        setDeleteError(result.message || 'Fail to delete');
      }
    } catch (err) {
      setDeleteError('Network error while deleting');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader 
          title="Jobber List" 
          subtitle="MANAGE SYSTEM JOBBER MASTER DATA & ITEM ASSIGNMENTS" 
        />

        <div className="px-6 flex flex-col gap-6">
          {/* Data Entry Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-visible">
            <div className="bg-table-header px-4 py-2 border-b border-border-soft rounded-t-xl">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Jobber Entry</h3>
            </div>
            
            <div className="p-0 overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-primary">
                    <th className="px-4 py-2 text-left border-r border-border-soft w-1/3">Jobber Name</th>
                    <th className="px-4 py-2 text-left">Assigned Item List (Multi-Select)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50">
                    <td className="p-0 border-r border-border-soft h-12">
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full h-full px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-primary/50"
                        placeholder="Enter jobber name..."
                      />
                    </td>
                    <td className="p-0 h-12">
                      <div className="relative w-full h-full flex items-center px-4" ref={dropdownRef}>
                        <div className="flex flex-wrap gap-1.5 flex-1 items-center overflow-hidden">
                          {formData.selectedItems.map(item => (
                            <span key={item.id} className="bg-brand-blue/10 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-blue/20">
                              {item.name}
                              <button onClick={() => removeItem(item)} className="hover:text-red-500">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="flex-1 min-w-[120px] bg-transparent outline-none text-[12px] placeholder:text-text-primary/50 h-8"
                            placeholder={formData.selectedItems.length === 0 ? "Type to filter items..." : "Add more..."}
                          />
                        </div>

                        {isDropdownOpen && (filteredItems.length > 0 || searchTerm) && (
                          <div className="absolute top-full left-0 w-full bg-white border border-border-soft shadow-2xl rounded-b-lg z-[200] max-h-72 overflow-y-auto mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {filteredItems.map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleToggleItem(item)}
                                className="w-full text-left px-4 py-2 text-[12px] hover:bg-bg-main/50 text-text-primary hover:text-brand-blue font-medium transition-colors border-b last:border-none border-border-soft/30"
                              >
                                {item.name}
                              </button>
                            ))}
                            {filteredItems.length === 0 && (
                              <div className="px-4 py-3 text-[12px] text-text-primary italic">
                                No matching items found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-bg-main/30 flex justify-end gap-16 border-t border-border-soft">
              <button 
                onClick={handleRedo}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[11.5px] font-bold text-text-primary hover:text-text-primary transition uppercase tracking-tight border border-brand-navy rounded-lg"
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
                Save Jobber
              </Button>
            </div>
          </div>

          {/* Master Table Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
              <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Jobber Master List</h2>
            </div>
            
            <div className="bg-white border border-border-soft rounded-xl shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-1/3">Jobber Name</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Assigned Items</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                   {jobbers.map((jobber) => (
                      <tr 
                        key={jobber.id} 
                        ref={editingId === jobber.id ? editRowRef : null}
                        className={`transition-colors ${editingId === jobber.id ? 'bg-brand-blue/[0.04] relative z-[100]' : 'hover:bg-bg-main/30'}`}
                      >
                      <td className="px-5 py-2 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                        {editingId === jobber.id ? (
                          <input 
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                            onKeyDown={(e) => handleEditKeyDown(e, jobber.id)}
                            autoFocus
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue"
                          />
                        ) : jobber.name}
                      </td>
                      <td className="px-5 py-2 border-r border-border-soft relative" ref={editingId === jobber.id ? editDropdownRef : null}>
                        {editingId === jobber.id ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {editFormData.selectedItems.map(item => (
                              <span key={item.id} className="bg-brand-blue/10 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-blue/20">
                                {item.name}
                                <button onClick={() => removeEditItem(item)} className="hover:text-red-500">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </span>
                            ))}
                            <input 
                              type="text"
                              value={editSearchTerm}
                              onChange={(e) => {
                                setEditSearchTerm(e.target.value);
                                setIsEditDropdownOpen(true);
                              }}
                              onFocus={() => setIsEditDropdownOpen(true)}
                              onKeyDown={(e) => handleEditKeyDown(e, jobber.id)}
                              className="flex-1 min-w-[100px] bg-white border border-brand-blue/20 rounded px-2 py-0.5 outline-none text-[12px]"
                              placeholder="Add items..."
                            />
                            {isEditDropdownOpen && (availableItems.filter(i => i.name.toLowerCase().includes(editSearchTerm.toLowerCase()) && !editFormData.selectedItems.some(si => si.id === i.id)).length > 0) && (
                              <div className="absolute top-full left-0 w-full bg-white border border-border-soft shadow-2xl rounded-lg z-[200] max-h-72 overflow-y-auto mt-1">
                                {availableItems
                                  .filter(i => i.name.toLowerCase().includes(editSearchTerm.toLowerCase()) && !editFormData.selectedItems.some(si => si.id === i.id))
                                  .map(item => (
                                    <button
                                      key={item.id}
                                      onClick={() => handleToggleEditItem(item)}
                                      className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-bg-main/50 text-text-primary hover:text-brand-blue font-medium transition-colors"
                                    >
                                      {item.name}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {jobber.items?.map(item => (
                              <span key={item?.id || Math.random()} className="text-[10px] font-bold text-text-primary bg-bg-main px-2 py-0.5 rounded border border-divider-soft">
                                {item?.name || 'Unknown Item'}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center justify-center gap-2.5">
                          {editingId === jobber.id ? (
                            <>
                              <button 
                                onClick={() => handleEditSave(jobber.id)}
                                className="text-green-600 hover:scale-110 transition p-1" 
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={handleEditCancel}
                                className="text-red-500 hover:scale-110 transition p-1" 
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditClick(jobber)}
                                className="text-brand-blue hover:scale-110 transition p-1" 
                                title="Edit Jobber"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openDeleteModal(jobber.id)}
                                className="text-red-500 hover:scale-110 transition p-1" 
                                title="Delete Jobber"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobbers.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-text-primary italic text-[13px]">
                        No jobbers found in master. Add a new jobber to get started.
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
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

export default JobberList;
