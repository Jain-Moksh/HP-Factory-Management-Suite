import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

const CreatePurchase = () => {
  const navigate = useNavigate();

  // --- Header Form State ---
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
    handleRedo(); // Reset entry row
  };

  const handleRedo = () => {
    setCurrentItem({ item: '', qty: '', unit: 'PCS' });
  };

  const handleDelete = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title="Create Purchase" 
          subtitle="ADD NEW PURCHASE CONTRACT AND ASSIGN JOBBER DETAILS" 
        />

        <div className="px-6 flex flex-col gap-6 w-full">
          {/* Top Info Card */}
          <Card className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              <Input 
                label="Challan No" 
                name="challanNo"
                value={formData.challanNo}
                onChange={handleHeaderChange}
                placeholder="Enter Challan No." 
              />
              <Input 
                label="Date" 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleHeaderChange}
              />
              <div className="flex flex-col gap-1.5 flex-1 text-left relative col-span-2">
                <label className="text-[11px] font-bold text-text-light uppercase tracking-tight ml-0.5">Jobber Name</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    name="jobber"
                    value={formData.jobber}
                    onChange={handleHeaderChange}
                    className="flex-1 h-9 px-3 bg-bg-main/50 border border-divider-soft rounded text-[13px] outline-none focus:border-brand-blue transition-all"
                    placeholder="Select or Search Jobber"
                  />
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="whitespace-nowrap h-9 px-4"
                    onClick={() => navigate('/master/jobber')}
                  >
                    New Jobber
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* New Data Entry Table */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
            <div className="bg-table-header px-4 py-2.5">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Item Entry</h3>
            </div>
            
            <div className="p-0 overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary tracking-widest">
                    <th className="px-4 py-2 text-left border-r border-border-soft">Item Name</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-48">Quantity</th>
                    <th className="px-4 py-2 text-left w-32 border-r border-border-soft">Unit</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50 group h-12">
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text" 
                        name="item"
                        value={currentItem.item}
                        onChange={handleEntryChange}
                        className="w-full h-full px-4 bg-transparent outline-none text-[13px] font-medium placeholder:opacity-30" 
                        placeholder="Select Material..."
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number" 
                        name="qty"
                        value={currentItem.qty}
                        onChange={handleEntryChange}
                        className="w-full h-full px-4 bg-transparent outline-none text-[13px] font-bold text-brand-blue" 
                        placeholder="0"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <select 
                        name="unit"
                        value={currentItem.unit}
                        onChange={handleEntryChange}
                        className="w-full h-full px-4 bg-transparent outline-none text-[12px] font-bold text-text-secondary cursor-pointer"
                      >
                        <option value="PCS">PCS</option>
                        <option value="KGS">KGS</option>
                        <option value="DOZEN">DOZEN</option>
                        <option value="MTR">MTR</option>
                      </select>
                    </td>
                    <td className="p-3 flex justify-end items-center gap-3">
                      <button 
                        onClick={() => navigate('/master/items')}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:text-brand-blue-hover transition uppercase"
                        title="Add New Master Item"
                      >
                         Create New
                      </button>
                      <div className="h-4 w-[1px] bg-border-soft"></div>
                      <button 
                        onClick={handleRedo}
                        className="text-text-light hover:text-text-primary transition p-1"
                        title="Redo Entry"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button 
                        onClick={handleAppend}
                        className="bg-brand-blue text-white px-5 py-1.5 rounded-md text-[11px] font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue-hover transition"
                      >
                        SAVE
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Appended Summary Table */}
          {addedItems.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
                <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Purchase Summary</h2>
              </div>
              
              <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-widest">
                      <th className="px-4 py-2 text-center border-r border-white/10 w-12">#</th>
                      <th className="px-5 py-2 text-left border-r border-white/10">Item Name</th>
                      <th className="px-5 py-2 text-center border-r border-white/10 w-32">Quantity</th>
                      <th className="px-5 py-2 text-center border-r border-white/10 w-24">Unit</th>
                      <th className="px-5 py-2 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {addedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-bg-main/30 transition-colors duration-75">
                        <td className="px-4 py-2 text-center text-text-light font-medium border-r border-border-soft">{idx + 1}</td>
                        <td className="px-5 py-2 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">{item.item}</td>
                        <td className="px-5 py-2 text-center font-bold text-brand-blue border-r border-border-soft">{item.qty}</td>
                        <td className="px-5 py-2 text-center font-bold text-text-secondary border-r border-border-soft uppercase text-[11.5px]">{item.unit}</td>
                        <td className="px-5 py-2 border-border-soft text-center">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:scale-110 transition p-1.5"
                            title="Remove Entry"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bottom Remarks & Final Save */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2 pb-10">
            <div className="w-full md:w-2/3">
              <label className="text-[11px] font-bold text-text-light uppercase tracking-tight ml-0.5 mb-1.5 block">Purchase Remarks</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleHeaderChange}
                className="w-full h-24 px-4 py-3 bg-white border border-border-soft rounded-lg text-[13px] outline-none focus:border-brand-blue transition-all shadow-sm placeholder:opacity-30 resize-none"
                placeholder="Enter any general remarks or internal notes..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto self-end md:self-center">
              <button 
                onClick={() => navigate('/purchase')}
                className="flex items-center justify-center gap-1.5 px-8 py-2.5 text-[12px] font-bold text-text-light hover:text-red-500 transition uppercase tracking-widest bg-white border border-border-soft rounded-lg shadow-sm"
              >
                Cancel
              </button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => navigate('/purchase')}
                className="px-12 h-11 h-auto py-2.5 shadow-brand-blue/30 text-[12.5px]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Final Save Purchase
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePurchase;
