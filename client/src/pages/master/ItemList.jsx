import React, { useState, useEffect, useRef, useMemo } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import DeleteModal from '../../components/UI/DeleteModal';
import { API_BASE_URL } from '../../config';
import FilterBar from '../../components/FilterBar';

const ItemList = () => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    unit: 'DOZ',
    conversion: '1',
    open_stock: '',
    min_stock: ''
  });

  // --- List State ---
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // --- Inline Edit State ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const editRowRef = useRef(null);

  // Close editing on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRowRef.current && !editRowRef.current.contains(event.target)) {
        handleEditCancel();
      }
    };
    if (editingId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingId]);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Fetch Items ---
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/items`);
      const result = await response.json();
      if (result.success) {
        setItems(result.data);
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
    fetchItems();
  }, []);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchItems);
    return () => window.removeEventListener('app-refresh', fetchItems);
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
      const openingStockVal = parseFloat(formData.open_stock) || 0;
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rate: parseFloat(formData.rate) || 0,
          stock: openingStockVal, // Use opening stock as initial live stock
          open_stock: openingStockVal,
          conversion: parseFloat(formData.conversion) || 1,
          unit: formData.unit,
          min_stock: parseFloat(formData.min_stock) || 0
        })
      });

      const result = await response.json();
      if (result.success) {
        await fetchItems();
        handleRedo();
      } else {
        alert(result.message || 'Failed to save item');
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
      rate: '',
      unit: 'DOZ',
      conversion: '1',
      open_stock: '',
      min_stock: ''
    });
  };

  // --- Inline Edit Handlers ---
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditFormData({
      name: item.name,
      rate: item.rate,
      unit: item.unit,
      conversion: item.conversion,
      stock: item.stock,
      open_stock: item.open_stock,
      min_stock: item.min_stock
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          rate: parseFloat(editFormData.rate) || 0,
          stock: parseFloat(editFormData.stock) || 0,
          open_stock: parseFloat(editFormData.open_stock) || 0,
          conversion: parseFloat(editFormData.conversion) || 1,
          unit: editFormData.unit,
          min_stock: parseFloat(editFormData.min_stock) || 0
        })
      });

      const result = await response.json();
      if (result.success) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...result.data } : item));
        setEditingId(null);
      } else {
        alert(result.message || 'Failed to update item');
      }
    } catch (err) {
      alert('Network error while updating');
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleEditSave(id);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const openDeleteModal = (id) => {
    setItemToDelete(id);
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
      const response = await fetch(`${API_BASE_URL}/items/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword })
      });

      const result = await response.json();
      if (result.success) {
        setIsDeleteModalOpen(false);
        setDeletePassword(''); // Clear password
        fetchItems();
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
          title="Item List" 
          subtitle="MANAGE SYSTEM ITEM MASTER DATA" 
        />

        <div className="px-6 flex flex-col gap-6">
          {/* Data Entry Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="bg-table-header px-4 py-2 border-b border-border-soft">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Item Entry</h3>
            </div>
            
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-primary text-center">
                    <th className="px-4 py-2 text-left border-r border-border-soft">Item Name</th>
                    <th className="px-4 py-2 border-r border-border-soft w-32 text-center uppercase tracking-tight">Rate</th>
                    <th className="px-4 py-2 border-r border-border-soft w-32 text-center uppercase tracking-tight">Unit</th>
                    <th className="px-4 py-2 border-r border-border-soft w-32 text-center uppercase tracking-tight">Conv.</th>
                    <th className="px-4 py-2 border-r border-border-soft w-32 text-center uppercase tracking-tight leading-tight">Opening <br /> Stock</th>
                    <th className="px-4 py-2 w-32 text-center uppercase tracking-tight leading-tight">Min <br /> Stock</th>
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
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-primary/50"
                        placeholder="Enter item name..."
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 bg-transparent outline-none text-[13px] font-bold text-brand-blue text-center"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft text-center">
                      <select 
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 bg-transparent outline-none text-[11px] font-bold text-text-primary cursor-pointer text-center"
                      >
                        <option value="POUCH">POUCH</option>
                        <option value="BUNDLE">BUNDLE</option>
                        <option value="GROSS">GROSS</option>
                        <option value="SET">SET</option>
                        <option value="PCS">PCS</option>
                        <option value="DOZ">DOZ</option>
                      </select>
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="conversion"
                        value={formData.conversion}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 bg-transparent outline-none text-[13px] font-medium text-center"
                        placeholder="1"
                      />
                    </td>
                    {/* Opening Stock */}
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="open_stock"
                        value={formData.open_stock}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 bg-transparent outline-none text-[13px] font-medium text-center italic"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-0">
                      <input 
                        type="number"
                        name="min_stock"
                        value={formData.min_stock}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 bg-transparent outline-none text-[13px] font-medium text-center"
                        placeholder="0"
                      />
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
                Save Item
              </Button>
            </div>
          </div>

          {/* Master Table Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
              <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Existing Items Master</h2>
            </div>
            
            <FilterBar 
              searchPlaceholder1="Search by Item Name"
              onSearch1={setSearchTerm}
            />

            <div className="bg-white border border-border-soft rounded-xl shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-28 text-[10.5px] uppercase font-bold tracking-wider">Rate</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-20 text-[10.5px] uppercase font-bold tracking-wider">Unit</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-24 text-[10.5px] uppercase font-bold tracking-wider">Conv.</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-28 text-[10.5px] uppercase font-bold tracking-wider leading-tight">Live <br /> Stock</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-28 text-[10.5px] uppercase font-bold tracking-wider leading-tight">Opening <br /> Stock</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-28 text-[10.5px] uppercase font-bold tracking-wider leading-tight">Min <br /> Stock</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft text-text-primary">
                   {filteredItems.map((item) => (
                    <tr 
                      key={item.id} 
                      ref={editingId === item.id ? editRowRef : null}
                      className={`transition-colors ${editingId === item.id ? 'bg-brand-blue/[0.04] relative z-10' : 'hover:bg-bg-main/30'}`}
                    >
                      <td className="px-5 py-1.5 font-bold text-[12.5px] border-r border-border-soft uppercase tracking-tight">
                        {editingId === item.id ? (
                          <input 
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            autoFocus
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue"
                          />
                        ) : item.name}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[13px] font-bold text-brand-blue border-r border-border-soft">
                        {editingId === item.id ? (
                          <input 
                            type="number"
                            name="rate"
                            value={editFormData.rate}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-center font-bold"
                          />
                        ) : `₹${parseFloat(item.rate).toFixed(2)}`}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[11px] font-bold border-r border-border-soft uppercase">
                        {editingId === item.id ? (
                          <select 
                            name="unit"
                            value={editFormData.unit}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="bg-white border border-brand-blue/30 rounded px-1 py-1 outline-none focus:border-brand-blue text-[11px] font-bold"
                          >
                            <option value="POUCH">POUCH</option>
                            <option value="BUNDLE">BUNDLE</option>
                            <option value="GROSS">GROSS</option>
                            <option value="SET">SET</option>
                            <option value="PCS">PCS</option>
                            <option value="DOZ">DOZ</option>
                          </select>
                        ) : item.unit}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[12px] font-medium border-r border-border-soft">
                        {editingId === item.id ? (
                          <input 
                            type="number"
                            name="conversion"
                            value={editFormData.conversion}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-center"
                          />
                        ) : item.conversion}
                      </td>
                      {/* Live Stock Cell */}
                      <td className={`px-5 py-1.5 text-center text-[13px] font-black border-r border-border-soft ${parseFloat(item.stock) <= parseFloat(item.min_stock) ? 'text-red-500' : 'text-brand-blue'}`}>
                        {editingId === item.id ? (
                          <input 
                            type="number"
                            name="stock"
                            value={editFormData.stock}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-center font-black"
                          />
                        ) : (item.stock || 0)}
                      </td>
                       {/* Opening Stock Cell */}
                       <td className="px-5 py-1.5 text-center text-[13px] font-bold text-text-primary/60 italic border-r border-border-soft">
                        {editingId === item.id ? (
                          <input 
                            type="number"
                            name="open_stock"
                            value={editFormData.open_stock}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-center font-bold"
                          />
                        ) : (item.open_stock || 0)}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[13px] font-bold text-text-primary border-r border-border-soft">
                        {editingId === item.id ? (
                          <input 
                            type="number"
                            name="min_stock"
                            value={editFormData.min_stock}
                            onChange={handleEditChange}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            className="w-full bg-white border border-brand-blue/30 rounded px-2 py-1 outline-none focus:border-brand-blue text-center font-bold"
                          />
                        ) : (item.min_stock || 0)}
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {editingId === item.id ? (
                            <>
                              <button 
                                onClick={() => handleEditSave(item.id)}
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
                                onClick={() => handleEditClick(item)}
                                className="text-brand-blue hover:scale-110 transition p-1" 
                                title="Edit Item"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openDeleteModal(item.id)}
                                className="text-red-500 hover:scale-110 transition p-1" 
                                title="Delete Item"
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
                  {filteredItems.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-text-primary italic text-[13px]">
                        {items.length === 0 ? "No items found in master. Add a new item to get started." : "No items match your search."}
                      </td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-brand-blue animate-pulse font-bold text-[13px]">
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

export default ItemList;
