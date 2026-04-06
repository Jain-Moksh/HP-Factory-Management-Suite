import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

const CreatePurchase = () => {
  const navigate = useNavigate();

  // --- Jobber Entry Modal State ---
  const [showJobberForm, setShowJobberForm] = useState(false);
  const [newJobberData, setNewJobberData] = useState({
    name: '',
    assignedItems: []
  });
  const [itemSearch, setItemSearch] = useState('');
  const mockAvailableItems = ['Fabric A', 'Zip 20"', 'Button High Gloss', 'Lining Material', 'Thread 40/2', 'Metal Clip'];

  // --- New Item Modal State ---
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemFormData, setNewItemFormData] = useState({
    itemName: '',
    rate: '',
    unit: 'PCS',
    conversion: '1',
    openingStock: '0'
  });

  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    jobber: '',
    remarks: ''
  });

  // --- Current Entry State (Single Row) ---
  const [currentItem, setCurrentItem] = useState({
    item: '',
    qty: '',
    unit: 'PCS'
  });

  // --- Batch Summary State (Appended Items) ---
  const [addedItems, setAddedItems] = useState([]);

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
    const newItem = {
      ...currentItem,
      id: Date.now(),
    };
    setAddedItems([...addedItems, newItem]);
    handleRedo(); 
  };

  const handleRedo = () => {
    setCurrentItem({ item: '', qty: '', unit: 'PCS' });
  };

  const handleDelete = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleEdit = (id) => {
    const itemToEdit = addedItems.find(item => item.id === id);
    if (!itemToEdit) return;
    setCurrentItem({
      item: itemToEdit.item,
      qty: itemToEdit.qty,
      unit: itemToEdit.unit
    });
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleJobberFormChange = (e) => {
    const { name, value } = e.target;
    setNewJobberData(prev => ({ ...prev, [name]: value }));
  };

  const toggleAssignedItem = (itemName) => {
    setNewJobberData(prev => {
      const isSelected = prev.assignedItems.includes(itemName);
      if (isSelected) {
        return { ...prev, assignedItems: prev.assignedItems.filter(i => i !== itemName) };
      } else {
        return { ...prev, assignedItems: [...prev.assignedItems, itemName] };
      }
    });
    setItemSearch('');
  };

  const handleSaveJobber = () => {
    setShowJobberForm(false);
    setNewJobberData({ name: '', assignedItems: [] });
  };

  const handleNewItemFormChange = (e) => {
    const { name, value } = e.target;
    setNewItemFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewItem = () => {
    setShowItemModal(false);
    handleRedoNewItem();
  };

  const handleRedoNewItem = () => {
    setNewItemFormData({ itemName: '', rate: '', unit: 'PCS', conversion: '1', openingStock: '0' });
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title="Create Purchase" 
          subtitle="ADD NEW PURCHASE CONTRACT AND ASSIGN JOBBER DETAILS" 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Top Identification Card - Perfectly Uniform for Hub Rhythm */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-border-soft/60">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Challan No</label>
                <input 
                  type="text"
                  name="challanNo"
                  value={formData.challanNo}
                  onChange={handleHeaderChange}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
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
                <div className="flex gap-2">
                  <input 
                    type="text"
                    name="jobber"
                    value={formData.jobber}
                    onChange={handleHeaderChange}
                    className="flex-1 h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                    placeholder="Select or Search Jobber..."
                  />
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
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-table-header h-9 px-4 flex items-center">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">New Data Entry</h3>
            </div>
            
            <div className="p-4 bg-bg-main/20 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Item Name</label>
                  <input 
                    type="text" 
                    name="item"
                    value={currentItem.item}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-20 shadow-sm" 
                    placeholder="Search or Type Material..."
                  />
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
                    <option value="PCS">PCS</option>
                    <option value="KGS">KGS</option>
                    <option value="DOZEN">DOZEN</option>
                    <option value="MTR">MTR</option>
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
                    className="bg-brand-blue text-white px-5 h-8 rounded-lg text-[12px] font-bold flex items-center gap-2 hover:bg-brand-blue-hover transition transform active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Item
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

                  {/* Multi-Select Assigned Items Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Assigned Item List (Multi-Select)</label>
                    <div className="min-h-[44px] p-2 bg-bg-main border border-border-soft rounded-lg flex flex-wrap gap-2 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue/10 transition-all cursor-text relative group">
                      {newJobberData.assignedItems.map(item => (
                        <div key={item} className="flex items-center gap-1.5 bg-brand-blue text-white px-2 py-1 rounded-md shadow-sm animate-in zoom-in-75 duration-200">
                          <span className="text-[11px] font-bold uppercase tracking-wide">{item}</span>
                          <button onClick={() => toggleAssignedItem(item)} className="hover:bg-white/20 rounded transition-all">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <input 
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none text-[13px] px-2 min-w-[120px] placeholder:text-text-light/30 lowercase italic"
                        placeholder={newJobberData.assignedItems.length === 0 ? "Type to search items..." : "add more..."}
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                      />

                      {/* Dropdown Results (Mock) */}
                      {itemSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-soft rounded-xl shadow-xl z-10 overflow-hidden animate-in slide-in-from-top-1 duration-200">
                          {mockAvailableItems.filter(i => i.toLowerCase().includes(itemSearch.toLowerCase()) && !newJobberData.assignedItems.includes(i)).map(item => (
                            <button 
                              key={item}
                              onClick={() => toggleAssignedItem(item)}
                              className="w-full px-4 py-2.5 text-left text-[12.5px] font-medium hover:bg-bg-main transition-colors flex items-center justify-between group"
                            >
                              <span>{item}</span>
                              <svg className="w-4 h-4 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          ))}
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
                    className="px-10 h-10 shadow-lg shadow-brand-blue/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    Save Jobber
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
                      name="itemName"
                      value={newItemFormData.itemName}
                      onChange={handleNewItemFormChange}
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
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-brand-blue outline-none focus:border-brand-blue transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Selling Unit</label>
                      <select 
                        name="unit"
                        value={newItemFormData.unit}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[12px] font-bold text-text-primary outline-none focus:border-brand-blue cursor-pointer appearance-none shadow-sm"
                      >
                        <option value="PCS">PCS</option>
                        <option value="KGS">KGS</option>
                        <option value="DOZEN">DOZEN</option>
                        <option value="MTR">MTR</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Conversion Factor</label>
                      <input 
                        type="number"
                        name="conversion"
                        value={newItemFormData.conversion}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-medium text-text-primary outline-none focus:border-brand-blue transition-all"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-1">Opening Stock</label>
                      <input 
                        type="number"
                        name="openingStock"
                        value={newItemFormData.openingStock}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-brand-blue outline-none focus:border-brand-blue transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-bg-main/40 flex justify-end items-center gap-4 border-t border-border-soft/60 mt-4">
                  <button 
                    onClick={handleRedoNewItem}
                    className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-text-secondary hover:text-text-primary transition-all uppercase tracking-widest"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    REDO
                  </button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveNewItem}
                    className="px-10 h-10 shadow-lg shadow-brand-blue/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    Save Item
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
                      onClick={() => navigate('/purchase')}
                      className="flex items-center justify-center px-6 h-8 bg-brand-blue rounded-lg text-[12px] font-extrabold text-white hover:bg-brand-blue-hover transition transform active:scale-95 uppercase tracking-widest"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Purchase
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
      </div>
    </Layout>
  );
};

export default CreatePurchase;
