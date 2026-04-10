import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import DeleteModal from '../components/UI/DeleteModal';
import WarningModal from '../components/UI/WarningModal';

const API_BASE_URL = 'http://localhost:5000/api';

const CreatePurchase = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // --- Master Data State ---
  const [jobbers, setJobbers] = useState([]);
  const [items, setItems] = useState([]);
  const [isMastersLoading, setIsMastersLoading] = useState(true);

  // --- Dropdown States ---
  const [showJobberDropdown, setShowJobberDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [jobberSearch, setJobberSearch] = useState('');
  const [itemEntrySearch, setItemEntrySearch] = useState('');

  // --- Refs for Click Outside ---
  const jobberRef = useRef(null);
  const itemRef = useRef(null);
  const modalDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (jobberRef.current && !jobberRef.current.contains(event.target)) {
        setShowJobberDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
      if (modalDropdownRef.current && !modalDropdownRef.current.contains(event.target)) {
        setIsModalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // --- Jobber Entry Modal State ---
  const [showJobberForm, setShowJobberForm] = useState(false);
  const [isSavingNewJobber, setIsSavingNewJobber] = useState(false);
  const [newJobberData, setNewJobberData] = useState({
    name: '',
    selectedItems: [] // Stores item objects {id, name}
  });
  const [modalItemSearch, setModalItemSearch] = useState('');
  const [isModalDropdownOpen, setIsModalDropdownOpen] = useState(false);

  // --- New Item Modal State ---
  const [showItemModal, setShowItemModal] = useState(false);
  const [isSavingNewItem, setIsSavingNewItem] = useState(false);
  const [newItemFormData, setNewItemFormData] = useState({
    name: '',
    rate: '',
    unit: 'DOZ',
    conversion: '1',
    stock: '0'
  });

  const [formData, setFormData] = useState({
    challanNo: 'AUTO',
    date: new Date().toISOString().split('T')[0],
    jobber_id: '',
    jobberName: '',
    remarks: ''
  });

  // --- Current Entry State (Single Row) ---
  const [currentItem, setCurrentItem] = useState({
    item_id: '',
    item: '',
    qty: '',
    unit: 'DOZ'
  });

  // --- Batch Summary State (Appended Items) ---
  const [addedItems, setAddedItems] = useState([]);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Warning Modal State ---
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [jobberItems, setJobberItems] = useState([]); // Master list of items assigned to current jobber

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [jobbersRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/jobbers`),
          fetch(`${API_BASE_URL}/items`)
        ]);

        const [jobbersData, itemsData] = await Promise.all([
          jobbersRes.json(),
          itemsRes.json()
        ]);

        if (jobbersData.success) setJobbers(jobbersData.data);
        if (itemsData.success) setItems(itemsData.data);

      } catch (err) {
        console.error("Error fetching masters:", err);
      } finally {
        setIsMastersLoading(false);
      }
    };
    fetchMasters();
  }, []);
  const fetchNextChallan = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase/next-id?date=${formData.date}`);
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, challanNo: data.nextId }));
      }
    } catch (err) {
      console.error("Error fetching next ID:", err);
    }
  };

  useEffect(() => {
    if (formData.date && !isEditMode) {
      fetchNextChallan();
    }
  }, [formData.date, isEditMode]);

  // --- Fetch Purchase Data for Edit Mode ---
  useEffect(() => {
    if (isEditMode) {
      const fetchPurchaseData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/purchase/${id}`);
          const result = await response.json();
          if (result.success) {
            const purchase = result.data;
            setFormData({
              challanNo: purchase.challan_no, 
              date: purchase.date.split('T')[0],
              jobber_id: purchase.jobber_id,
              jobberName: purchase.jobber_name,
              remarks: purchase.remark || ''
            });
            setJobberSearch(purchase.jobber_name);

            // Fetch jobber items for validation
            const resJ = await fetch(`${API_BASE_URL}/jobbers/${purchase.jobber_id}/items`);
            const dataJ = await resJ.json();
            if (dataJ.success) {
              setJobberItems(dataJ.data);
            }

            // Map purchase items
            const mappedItems = purchase.items.map(item => ({
              id: item.id,
              item_id: item.item_id,
              item: item.item_name,
              qty: item.quantity,
              unit: item.unit
            }));
            setAddedItems(mappedItems);
          }
        } catch (err) {
          console.error("Error fetching purchase data:", err);
        }
      };
      fetchPurchaseData();
    }
  }, [isEditMode, id]);

  // --- Handlers ---
  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAppend = () => {
    if (!currentItem.item || !currentItem.qty) return;

    // --- Validation: Check if item is assigned to jobber ---
    const isAssigned = jobberItems.some(ji => ji.id === parseInt(currentItem.item_id));
    
    if (formData.jobber_id && !isAssigned) {
      setWarningMessage(`The item "${currentItem.item}" is NOT currently assigned to "${formData.jobberName}" in the Master Database. Do you want to proceed anyway?`);
      setIsWarningOpen(true);
      return;
    }

    proceedAppend();
  };

  const proceedAppend = () => {
    const newItem = {
      ...currentItem,
      id: Date.now(),
    };
    setAddedItems([...addedItems, newItem]);
    handleRedo(); 
    setIsWarningOpen(false);
  };

  const handleRedo = () => {
    setCurrentItem({ item_id: '', item: '', qty: '', unit: 'DOZ' });
    setItemEntrySearch('');
  };

  const handleDelete = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleEdit = (id) => {
    const itemToEdit = addedItems.find(item => item.id === id);
    if (!itemToEdit) return;
    setCurrentItem({
      item_id: itemToEdit.item_id,
      item: itemToEdit.item,
      qty: itemToEdit.qty,
      unit: itemToEdit.unit
    });
    setItemEntrySearch(itemToEdit.item);
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleJobberFormChange = (e) => {
    const { name, value } = e.target;
    setNewJobberData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleModalItem = (item) => {
    setNewJobberData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.some(si => si.id === item.id)
        ? prev.selectedItems.filter(i => i.id !== item.id)
        : [...prev.selectedItems, item]
    }));
    setModalItemSearch('');
  };

  const removeModalItem = (item) => {
    setNewJobberData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => i.id !== item.id)
    }));
  };

  const handleSelectJobber = async (jobber) => {
    setFormData(prev => ({
      ...prev,
      jobber_id: jobber.id,
      jobberName: jobber.name
    }));
    setJobberSearch(jobber.name);
    setShowJobberDropdown(false);

    // Fetch assigned items for validation
    try {
      const res = await fetch(`${API_BASE_URL}/jobbers/${jobber.id}/items`);
      const data = await res.json();
      if (data.success) {
        setJobberItems(data.data);
      }
    } catch (err) {
      console.error("Error fetching jobber items:", err);
    }
  };

  const handleSelectItem = (item) => {
    setCurrentItem(prev => ({
      ...prev,
      item_id: item.id,
      item: item.name,
      unit: item.unit || 'DOZ'
    }));
    setItemEntrySearch(item.name);
    setShowItemDropdown(false);
  };

  const handleSaveJobber = async () => {
    if (!newJobberData.name) return;
    setIsSavingNewJobber(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newJobberData.name,
          item_ids: newJobberData.selectedItems.map(item => item.id)
        })
      });
      const result = await response.json();
      if (result.success) {
        setJobbers(prev => [...prev, result.data]);
        handleSelectJobber(result.data);
        setShowJobberForm(false);
        setNewJobberData({ name: '', selectedItems: [] });
        setModalItemSearch('');
      }
    } catch (err) {
      console.error("Error saving jobber:", err);
    } finally {
      setIsSavingNewJobber(false);
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItemFormData.name) return;
    setIsSavingNewItem(true);
    const sanitizedData = {
      ...newItemFormData,
      rate: newItemFormData.rate === '' ? null : newItemFormData.rate,
      stock: newItemFormData.stock === '' ? null : newItemFormData.stock,
      conversion: newItemFormData.conversion === '' ? null : newItemFormData.conversion
    };

    try {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });
      const result = await response.json();
      if (result.success) {
        setItems(prev => [...prev, result.data]);
        handleSelectItem(result.data);
        setShowItemModal(false);
        setNewItemFormData({ name: '', rate: '', unit: 'DOZ', conversion: '1', stock: '0' });
      }
    } catch (err) {
      console.error("Error saving item:", err);
    } finally {
      setIsSavingNewItem(false);
    }
  };

  const handleFinalSave = async () => {
    if (!formData.jobber_id || addedItems.length === 0) {
      alert("Please select a jobber and add at least one item.");
      return;
    }

    const payload = {
      jobber_id: formData.jobber_id,
      date: formData.date,
      remark: formData.remarks,
      items: addedItems.map(i => ({
        item_id: i.item_id,
        quantity: i.qty,
        unit: i.unit
      }))
    };

    try {
      const url = isEditMode ? `${API_BASE_URL}/purchase/${id}` : `${API_BASE_URL}/purchase`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (!isEditMode) {
          // --- Form Reset and Prepare for Next Entry (Only if Creating) ---
          setAddedItems([]);
          setFormData(prev => ({
            ...prev,
            remarks: '',
          }));
          setJobberSearch('');
          setCurrentItem({ item_id: '', item: '', qty: '', unit: 'DOZ' });
          setItemEntrySearch('');
          
          // Fetch next ID for the next entry
          const nextIdRes = await fetch(`${API_BASE_URL}/purchase/next-id?date=${formData.date}`);
          const nextIdData = await nextIdRes.json();
          if (nextIdData.success) {
            setFormData(prev => ({ ...prev, challanNo: nextIdData.nextId }));
          }
        }

        navigate('/purchase');
      } else {
        alert(result.message || `Failed to ${isEditMode ? 'update' : 'save'} purchase record`);
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} purchase:`, err);
      alert(`Network error occurred while ${isEditMode ? 'updating' : 'saving'}.`);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title={isEditMode ? "Edit Purchase" : "Create Purchase"} 
          subtitle={isEditMode ? "MODIFY EXISTING PURCHASE CONTRACT AND JOBBER DETAILS" : "ADD NEW PURCHASE CONTRACT AND ASSIGN JOBBER DETAILS"} 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Top Identification Card - Perfectly Uniform for Hub Rhythm */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-border-soft/60 relative z-[100] overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Challan No</label>
                <input 
                  type="text"
                  name="challanNo"
                  value={formData.challanNo}
                  readOnly={isEditMode}
                  onChange={handleHeaderChange}
                  className={`w-full h-9 px-3 ${isEditMode ? 'bg-bg-main cursor-not-allowed font-bold text-brand-blue' : 'bg-white'} border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm`}
                  placeholder="Enter Challan No."
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Date</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleHeaderChange}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-1 text-left relative col-span-2">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Jobber Name</label>
                <div className="flex gap-2 relative" ref={jobberRef}>
                  <div className="relative flex-1 group">
                    <input 
                      type="text"
                      name="jobberName"
                      value={jobberSearch}
                      onChange={(e) => {
                        setJobberSearch(e.target.value);
                        setShowJobberDropdown(true);
                        if (!e.target.value) setFormData(prev => ({ ...prev, jobber_id: '', jobberName: '' }));
                      }}
                      onFocus={() => setShowJobberDropdown(true)}
                      className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                      placeholder="Select or Search Jobber..."
                      autoComplete="off"
                    />
                    {showJobberDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-soft rounded-xl shadow-xl z-[9999] max-h-60 overflow-y-auto animate-in slide-in-from-top-1 duration-200">
                        {jobbers.filter(j => j.name.toLowerCase().includes(jobberSearch.toLowerCase())).length > 0 ? (
                          jobbers.filter(j => j.name.toLowerCase().includes(jobberSearch.toLowerCase())).map(jobber => (
                            <button 
                              key={jobber.id}
                              onClick={() => handleSelectJobber(jobber)}
                              className="w-full px-4 py-2.5 text-left text-[12.5px] font-medium hover:bg-bg-main transition-colors flex items-center justify-between group"
                            >
                              <span className="group-hover:text-brand-blue transition-colors font-bold uppercase tracking-tight">{jobber.name}</span>
                              <span className="text-[10px] text-text-light opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest bg-brand-blue/5 px-2 py-0.5 rounded">Select</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-[11px] text-text-light italic text-center">No jobbers found for "{jobberSearch}"</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="whitespace-nowrap h-9 px-5 text-[11px] font-bold uppercase tracking-wide rounded-lg shadow-sm"
                    onClick={() => setShowJobberForm(true)}
                  >
                    New Jobber
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* New Data Entry Section - Grid based, clean stacking */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-visible flex flex-col relative z-[50]">
            <div className="bg-table-header h-9 px-4 flex items-center">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">New Data Entry</h3>
            </div>
            
            <div className="p-4 bg-bg-main/20 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 col-span-2 relative" ref={itemRef}>
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Item Name</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      name="item"
                      value={itemEntrySearch}
                      onChange={(e) => {
                        setItemEntrySearch(e.target.value);
                        setShowItemDropdown(true);
                      }}
                      onFocus={() => setShowItemDropdown(true)}
                      className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-20 shadow-sm" 
                      placeholder="Search or Type Material..."
                      autoComplete="off"
                    />
                    {showItemDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-soft rounded-xl shadow-xl z-[9999] max-h-60 overflow-y-auto animate-in slide-in-from-top-1 duration-200">
                        {items.filter(i => i.name.toLowerCase().includes(itemEntrySearch.toLowerCase())).length > 0 ? (
                          items.filter(i => i.name.toLowerCase().includes(itemEntrySearch.toLowerCase())).map(item => (
                            <button 
                              key={item.id}
                              onClick={() => handleSelectItem(item)}
                              className="w-full px-4 py-2.5 text-left text-[12.5px] font-medium hover:bg-bg-main transition-colors flex items-center justify-between group"
                            >
                              <div className="flex flex-col">
                                <span className="group-hover:text-brand-blue transition-colors font-bold uppercase tracking-tight">{item.name}</span>
                                <span className="text-[10px] text-text-light font-bold">Stock: {item.stock} {item.unit}</span>
                              </div>
                              <span className="text-[10px] text-text-light opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest bg-brand-blue/5 px-2 py-0.5 rounded">Select</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-[11px] text-text-light italic text-center">No items found for "{itemEntrySearch}"</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Quantity</label>
                  <input 
                    type="number" 
                    name="qty"
                    value={currentItem.qty}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-brand-blue/30 rounded-lg text-[13px] font-bold text-brand-blue text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Unit</label>
                  <select 
                    name="unit"
                    value={currentItem.unit}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12px] font-bold text-text-secondary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 cursor-pointer shadow-sm appearance-none"
                  >
                    <option value="GMS">GMS</option>
                    <option value="BUNDLE">BUNDLE</option>
                    <option value="GROSS">GROSS</option>
                    <option value="SET">SET</option>
                    <option value="PCS">PCS</option>
                    <option value="DOZ">DOZ</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons below inputs */}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-border-soft/50">
                <button 
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-2 px-3.5 h-8 bg-white border border-border-soft rounded-lg text-[11.5px] font-bold text-text-primary hover:bg-bg-main transition shadow-sm"
                  title="Add New Master Item"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Item
                </button>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRedo}
                    className="flex items-center gap-2 px-3.5 h-8 bg-white border border-border-soft rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary hover:bg-bg-main transition shadow-sm uppercase tracking-wider"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Redo
                  </button>
                  <button 
                    onClick={handleAppend}
                    className="bg-brand-blue text-white px-5 h-8 rounded-lg text-[12px] font-bold flex items-center gap-2 hover:bg-brand-blue-hover transition transform active:scale-95 shadow-lg shadow-brand-blue/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Add to Summary
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* New Jobber Entry Modal - Focused Experience */}
          {showJobberForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowJobberForm(false)}></div>
              
              <Card className="relative w-full max-w-xl bg-white border border-border-soft rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 overflow-visible">
                <div className="bg-table-header px-6 py-3 flex justify-between items-center relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-white/30 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">New Jobber Entry</h3>
                  </div>
                  <button onClick={() => setShowJobberForm(false)} className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                 <div className="p-6 flex flex-col gap-6">
                  {/* Jobber Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Jobber Name</label>
                    <input 
                      type="text"
                      name="name"
                      value={newJobberData.name}
                      onChange={handleJobberFormChange}
                      className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-light/30"
                      placeholder="Enter provider or contractor name..."
                      autoFocus
                    />
                  </div>

                  {/* Assigned Items Multi-Select */}
                  <div className="flex flex-col gap-1.5 overflow-visible">
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Assign Items to Jobber</label>
                    <div className="relative w-full border border-border-soft rounded-xl bg-bg-main p-3" ref={modalDropdownRef}>
                      <div className="flex flex-wrap gap-2 items-center">
                        {newJobberData.selectedItems.map(item => (
                          <span key={item.id} className="bg-brand-blue/10 text-brand-blue text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-2 border border-brand-blue/20 animate-in zoom-in-95 duration-200">
                            {item.name}
                            <button onClick={() => removeModalItem(item)} className="hover:text-red-600 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                        <input 
                          type="text"
                          value={modalItemSearch}
                          onChange={(e) => {
                            setModalItemSearch(e.target.value);
                            setIsModalDropdownOpen(true);
                          }}
                          onFocus={() => setIsModalDropdownOpen(true)}
                          className="flex-1 min-w-[150px] bg-transparent outline-none text-[13px] placeholder:text-text-light/40 font-medium h-7"
                          placeholder={newJobberData.selectedItems.length === 0 ? "Search brands or items..." : "Assign more..."}
                        />
                      </div>

                      {isModalDropdownOpen && (items.filter(i => i.name.toLowerCase().includes(modalItemSearch.toLowerCase()) && !newJobberData.selectedItems.some(si => si.id === i.id)).length > 0 || modalItemSearch) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-soft shadow-2xl rounded-xl z-[9999] max-h-56 overflow-y-auto animate-in slide-in-from-top-2 duration-300">
                          {items
                            .filter(i => i.name.toLowerCase().includes(modalItemSearch.toLowerCase()) && !newJobberData.selectedItems.some(si => si.id === i.id))
                            .map(item => (
                              <button
                                key={item.id}
                                onClick={() => handleToggleModalItem(item)}
                                className="w-full text-left px-5 py-3 text-[13px] hover:bg-bg-main text-text-primary hover:text-brand-blue font-bold transition-all border-b border-border-soft/30 last:border-none flex items-center justify-between group"
                              >
                                <span>{item.name}</span>
                                <span className="text-[10px] text-text-light opacity-0 group-hover:opacity-100 uppercase tracking-widest font-black bg-brand-blue/5 px-2 py-0.5 rounded transition-opacity">Assign</span>
                              </button>
                            ))}
                          {items.filter(i => i.name.toLowerCase().includes(modalItemSearch.toLowerCase()) && !newJobberData.selectedItems.some(si => si.id === i.id)).length === 0 && (
                            <div className="px-5 py-4 text-[12px] text-text-light italic text-center">No matching brands found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-bg-main/40 flex justify-end items-center gap-4 border-t border-border-soft/60 mt-4">
                  <button 
                    onClick={() => setShowJobberForm(false)}
                    className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-black text-text-secondary hover:text-red-500 transition-all uppercase tracking-[0.2em]"
                  >
                    Cancel
                  </button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveJobber}
                    disabled={isSavingNewJobber}
                    className="px-10 h-10 shadow-lg shadow-brand-blue/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    {isSavingNewJobber ? "Saving..." : "Save Jobber"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* New Item Entry Modal - Integrated Focused Card */}
          {showItemModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowItemModal(false)}></div>
              
              <Card className="relative w-full max-w-4xl bg-white border border-border-soft rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 overflow-visible">
                <div className="bg-table-header px-6 py-3 flex justify-between items-center relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-white/30 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">New Item Entry</h3>
                  </div>
                  <button onClick={() => setShowItemModal(false)} className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="p-6 flex flex-col gap-6">
                  {/* Item Name Main Row */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Item Name</label>
                    <input 
                      type="text"
                      name="name"
                      value={newItemFormData.name}
                      onChange={(e) => setNewItemFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-light/30"
                      placeholder="Enter new item name..."
                      autoFocus
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Base Rate (₹)</label>
                      <input 
                        type="number"
                        name="rate"
                        value={newItemFormData.rate}
                        onChange={(e) => setNewItemFormData(prev => ({ ...prev, rate: e.target.value }))}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-brand-blue outline-none focus:border-brand-blue transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Selling Unit</label>
                      <select 
                        name="unit"
                        value={newItemFormData.unit}
                        onChange={(e) => setNewItemFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[12px] font-bold text-text-primary outline-none focus:border-brand-blue cursor-pointer appearance-none shadow-sm"
                      >
                        <option value="GMS">GMS</option>
                        <option value="BUNDLE">BUNDLE</option>
                        <option value="GROSS">GROSS</option>
                        <option value="SET">SET</option>
                        <option value="PCS">PCS</option>
                        <option value="DOZ">DOZ</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Conversion Factor</label>
                      <input 
                        type="number"
                        name="conversion"
                        value={newItemFormData.conversion}
                        onChange={(e) => setNewItemFormData(prev => ({ ...prev, conversion: e.target.value }))}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-medium text-text-primary outline-none focus:border-brand-blue transition-all"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Opening Stock</label>
                      <input 
                        type="number"
                        name="stock"
                        value={newItemFormData.stock}
                        onChange={(e) => setNewItemFormData(prev => ({ ...prev, stock: e.target.value }))}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-brand-blue outline-none focus:border-brand-blue transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-bg-main/40 flex justify-end items-center gap-4 border-t border-border-soft/60 mt-4">
                  <button 
                    onClick={() => {
                        setNewItemFormData({ name: '', rate: '', unit: 'DOZ', conversion: '1', stock: '0' });
                        setShowItemModal(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-text-secondary hover:text-red-500 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveNewItem}
                    disabled={isSavingNewItem}
                    className="px-10 h-10 shadow-lg shadow-brand-blue/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    {isSavingNewItem ? "Saving..." : "Save Item"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Table Summary - Conditional Visibility */}
          {addedItems.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand-blue rounded-full"></div>
                  <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest">Purchase Summary</h3>
                </div>
                <div className="text-[10px] font-bold text-text-light opacity-50 uppercase tracking-widest bg-bg-main px-2 py-0.5 rounded border border-border-soft">
                  {addedItems.length} {addedItems.length === 1 ? 'Item' : 'Items'} Added
                </div>
              </div>
              
              <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header h-9 text-white text-[10px] uppercase font-bold tracking-[0.15em]">
                      <th className="px-4 text-center border-r border-white/10 w-12">#</th>
                      <th className="px-5 text-left border-r border-white/10">Item Detail</th>
                      <th className="px-5 text-center border-r border-white/10 w-32">Qty</th>
                      <th className="px-5 text-center border-r border-white/10 w-24">Unit</th>
                      <th className="px-5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/50">
                    {addedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-bg-main/30 group transition-colors duration-75">
                        <td className="px-4 py-2 text-center text-[11px] text-text-light font-bold border-r border-border-soft/50">{idx + 1}</td>
                        <td className="px-5 py-2 font-bold text-[12.5px] text-text-primary border-r border-border-soft/50 uppercase tracking-tight">{item.item}</td>
                        <td className="px-5 py-2 text-center font-bold text-brand-blue border-r border-border-soft/50 text-[13px]">{item.qty}</td>
                        <td className="px-5 py-2 text-center font-bold text-text-secondary border-r border-border-soft/50 uppercase text-[11px] tracking-wide">{item.unit}</td>
                        <td className="px-5 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleEdit(item.id)}
                              className="text-brand-blue hover:text-brand-blue-hover hover:scale-110 transition p-1 rounded-full hover:bg-brand-blue/5"
                              title="Edit Item"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-red-400 hover:text-red-600 hover:scale-110 transition p-1 rounded-full hover:bg-red-50"
                              title="Delete Item"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Section - Perfectly Aligned Actions with Label */}
              <div className="flex flex-col gap-2 mt-4 pb-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block opacity-70">Purchase Remarks</label>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate('/purchase')}
                      className="flex items-center justify-center px-5 h-8 bg-white border border-border-soft rounded-lg text-[11.5px] font-extrabold text-text-secondary hover:text-red-500 hover:bg-bg-main transition uppercase tracking-widest shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleFinalSave}
                      className="flex items-center justify-center px-6 h-8 bg-brand-blue rounded-lg text-[12px] font-extrabold text-white hover:bg-brand-blue-hover transition transform active:scale-95 uppercase tracking-widest shadow-lg shadow-brand-blue/20"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isEditMode ? "Update Purchase" : "Save Purchase"}
                    </button>
                  </div>
                </div>
                
                <textarea 
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleHeaderChange}
                  className="w-full h-20 px-4 py-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none"
                  placeholder="Enter any general remarks or internal procurement notes..."
                />
              </div>
            </div>
          )}
        </div>
        {/* Reusable Warning Modal */}
        <WarningModal 
          isOpen={isWarningOpen}
          onClose={() => setIsWarningOpen(false)}
          onConfirm={proceedAppend}
          message={warningMessage}
        />
      </div>
    </Layout>
  );
};

export default CreatePurchase;
