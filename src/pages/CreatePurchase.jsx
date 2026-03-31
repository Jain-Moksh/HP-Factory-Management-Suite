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
    handleRedo(); 
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
                    onClick={() => navigate('/master/jobber')}
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
                  onClick={() => navigate('/master/items')}
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
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-400 hover:text-red-600 hover:scale-110 transition p-1 rounded-full hover:bg-red-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
