import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const CreateInvoice = () => {
  const navigate = useNavigate();

  // --- Header Form State ---
  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    transporter: '',
    clientName: '',
    address1: '',
    address2: '',
    remarks: '',
    transport: '',
    packing: '',
    extraDiscountPercent: '',
    extraDiscountAmount: '',
    roundOff: ''
  });

  // --- Current Entry State (Single Row - Restored) ---
  const [currentItem, setCurrentItem] = useState({
    item: '',
    stock: '0',
    qty: '',
    unit: 'PCS',
    rate: '',
    dPercent: '',
    discount: '0.00',
    total: '0.00'
  });

  // --- Invoice Summary State (The items appended to this invoice) ---
  const [addedItems, setAddedItems] = useState([]);
  
  // --- In-place Editing State ---
  const [editingId, setEditingId] = useState(null);

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSummaryFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      const itemsSub = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
      const transport = parseFloat(name === 'transport' ? value : prev.transport) || 0;
      const packing = parseFloat(name === 'packing' ? value : prev.packing) || 0;
      const totalBeforeDisc = itemsSub + transport + packing;

      if (name === 'extraDiscountPercent') {
        const percent = parseFloat(value) || 0;
        updated.extraDiscountAmount = ((totalBeforeDisc * percent) / 100).toFixed(2);
      } else if (name === 'extraDiscountAmount') {
        const amount = parseFloat(value) || 0;
        updated.extraDiscountPercent = totalBeforeDisc > 0 ? ((amount / totalBeforeDisc) * 100).toFixed(2) : '0';
      } else if (name === 'transport' || name === 'packing') {
        const percent = parseFloat(prev.extraDiscountPercent) || 0;
        updated.extraDiscountAmount = ((totalBeforeDisc * percent) / 100).toFixed(2);
      }
      
      return updated;
    });
  };

  const calculateRowValues = (qty, rate, dPercent) => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const dp = parseFloat(dPercent) || 0;
    const subtotal = q * r;
    const dAmt = (subtotal * dp) / 100;
    return {
      discount: dAmt.toFixed(2),
      total: (subtotal - dAmt).toFixed(2)
    };
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => {
      const updated = { ...prev, [name]: value };
      if (['qty', 'rate', 'dPercent'].includes(name)) {
        const { discount, total } = calculateRowValues(updated.qty, updated.rate, updated.dPercent);
        updated.discount = discount;
        updated.total = total;
      }
      return updated;
    });
  };

  const handleAppendItem = () => {
    if (!currentItem.item || !currentItem.qty) return;
    const newItem = {
      ...currentItem,
      id: Date.now()
    };
    setAddedItems([...addedItems, newItem]);
    handleRedoCurrent();
  };

  const handleRedoCurrent = () => {
    setCurrentItem({ item: '', stock: '0', qty: '', unit: 'PCS', rate: '', dPercent: '', discount: '0.00', total: '0.00' });
  };

  const handleDeleteItem = (id) => {
    setAddedItems(addedItems.filter(item => item.id !== id));
  };

  const handleToggleEdit = (id) => {
    if (editingId === id) {
      setEditingId(null);
    } else {
      setEditingId(id);
    }
  };

  const handleSummaryRowChange = (id, field, value) => {
    setAddedItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (['qty', 'rate', 'dPercent'].includes(field)) {
          const { discount, total } = calculateRowValues(updated.qty, updated.rate, updated.dPercent);
          updated.discount = discount;
          updated.total = total;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleFinalSave = () => {
    if (addedItems.length === 0) return;
    
    const itemsSubtotal = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
    const transport = parseFloat(formData.transport) || 0;
    const packing = parseFloat(formData.packing) || 0;
    const totalBeforeDisc = itemsSubtotal + transport + packing;
    const discountAmount = parseFloat(formData.extraDiscountAmount) || 0;
    const totalAmount = totalBeforeDisc - discountAmount;
    const roundOff = parseFloat(formData.roundOff) || 0;
    const grandTotal = (totalAmount + roundOff).toFixed(2);

    console.log("Final Save Invoice:", { 
      ...formData, 
      items: addedItems, 
      itemsSubtotal: itemsSubtotal.toFixed(2),
      totalBeforeDisc: totalBeforeDisc.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      grandTotal: grandTotal,
      transport: transport.toFixed(2),
      packing: packing.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      roundOff: roundOff.toFixed(2)
    });
    navigate('/billing-entries');
  };

  // --- Derived Summary Values for UI ---
  const itemsSubtotal = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  const transport = parseFloat(formData.transport) || 0;
  const packing = parseFloat(formData.packing) || 0;
  const totalBeforeDisc = itemsSubtotal + transport + packing;
  const discountAmount = parseFloat(formData.extraDiscountAmount) || 0;
  const totalAmount = totalBeforeDisc - discountAmount;
  const roundOff = parseFloat(formData.roundOff) || 0;
  const grandTotal = (totalAmount + roundOff).toFixed(2);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title="Create Invoice" 
          subtitle="GENERATE SALES INVOICE AND MANAGE CLIENT BILLING" 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Top Identification Card */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-border-soft/60">
            <div className="flex flex-col gap-4">
              {/* Row 1: Core Identification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Challan No / Invoice No</label>
                  <input 
                    type="text"
                    name="challanNo"
                    value={formData.challanNo}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                    placeholder="Enter Invoice No."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Date</label>
                  <input 
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Transporter Name</label>
                  <input 
                    type="text"
                    name="transporter"
                    value={formData.transporter}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                    placeholder="Courier or Transport Co."
                  />
                </div>
              </div>

              {/* Row 2: Client & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1 text-left relative col-span-2">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Client Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleFormChange}
                      className="flex-1 h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                      placeholder="Search Client Database..."
                    />
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="whitespace-nowrap h-9 px-5 text-[11px] font-bold uppercase tracking-wide rounded-lg shadow-sm"
                      onClick={() => navigate('/master/clients')}
                    >
                      New Client
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Address Line 1</label>
                  <input 
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-20 shadow-sm"
                    placeholder="Building/Street"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Address Line 2</label>
                  <input 
                    type="text"
                    name="address2"
                    value={formData.address2}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-20 shadow-sm"
                    placeholder="Area/City"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* New Data Entry Section - Single Row Batch Entry */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-table-header h-9 px-4 flex items-center">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">New Item Entry</h3>
            </div>
            
            <div className="p-4 bg-bg-main/20 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                <div className="flex flex-col gap-1 col-span-2 text-left relative">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Item Name</label>
                  <input 
                    type="text" 
                    name="item"
                    value={currentItem.item}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-20 shadow-sm" 
                    placeholder="Start typing item..."
                  />
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest opacity-70">Stock</label>
                  <div className="w-full h-9 flex items-center justify-center bg-bg-main border border-border-soft rounded-lg text-[13px] font-bold text-text-light opacity-60 shadow-inner">
                    {currentItem.stock}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest ml-0.5 opacity-70">Qty / Unit</label>
                  <div className="flex gap-1">
                    <input 
                      type="number" 
                      name="qty"
                      value={currentItem.qty}
                      onChange={handleEntryChange}
                      className="w-full h-9 px-3 bg-white border border-brand-blue/30 rounded-lg text-[13px] font-bold text-brand-blue text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                      placeholder="0"
                    />
                    <select 
                      name="unit"
                      value={currentItem.unit}
                      onChange={handleEntryChange}
                      className="w-20 h-9 px-2 bg-white border border-border-soft rounded-lg text-[11px] font-bold text-text-secondary outline-none focus:border-brand-blue cursor-pointer shadow-sm appearance-none"
                    >
                      <option value="PCS">PCS</option>
                      <option value="KGS">KGS</option>
                      <option value="DOZEN">DOZEN</option>
                      <option value="MTR">MTR</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest opacity-70">Rate (₹)</label>
                  <input 
                    type="number" 
                    name="rate"
                    value={currentItem.rate}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-bold text-text-primary text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest opacity-70">Disc %</label>
                  <input 
                    type="number" 
                    name="dPercent"
                    value={currentItem.dPercent}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-bold text-text-light text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-widest opacity-70 mr-1">Total Amount</label>
                  <div className="w-full h-9 flex items-center justify-end px-3 bg-bg-main border border-brand-blue/10 rounded-lg text-[14px] font-black text-brand-blue">
                    ₹{currentItem.total}
                  </div>
                </div>
              </div>

              {/* Action Buttons below inputs */}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-border-soft/50">
                <button 
                  onClick={() => navigate('/master/items')}
                  className="flex items-center gap-2 px-3.5 h-8 bg-white border border-border-soft rounded-lg text-[11.5px] font-bold text-text-primary hover:bg-bg-main transition shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  New Item
                </button>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleRedoCurrent}
                    className="flex items-center gap-2 px-3.5 h-8 bg-white border border-border-soft rounded-lg text-[11px] font-bold text-text-secondary hover:text-text-primary transition shadow-sm uppercase tracking-wider"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Redo
                  </button>
                  <button 
                    onClick={handleAppendItem}
                    className="bg-brand-blue text-white px-5 h-8 rounded-lg text-[12px] font-bold flex items-center gap-2 hover:bg-brand-blue-hover transition transform active:scale-95 shadow-sm uppercase tracking-widest"
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

          {/* Invoice Summary Section - With Far Left Actions and In-place Edits */}
          {addedItems.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand-blue rounded-full"></div>
                  <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest">Invoice Summary</h3>
                </div>
                <div className="text-[10px] font-bold text-text-light opacity-50 uppercase tracking-widest bg-bg-main px-2 py-0.5 rounded border border-border-soft">
                  {addedItems.length} {addedItems.length === 1 ? 'Item' : 'Items'} Ready to Bill
                </div>
              </div>
              
              <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header h-9 text-white text-[10px] uppercase font-bold tracking-[0.15em]">
                      <th className="px-4 text-center border-r border-white/10 w-24">Actions</th>
                      <th className="px-5 text-left border-r border-white/10">Item Detail</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Quantity</th>
                      <th className="px-5 text-center border-r border-white/10 w-24">Unit</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Rate</th>
                      <th className="px-5 text-center border-r border-white/10 w-20">Disc %</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Disc (₹)</th>
                      <th className="px-5 text-right w-36">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/50">
                    {addedItems.map((item, idx) => (
                      <tr key={item.id} className={`hover:bg-bg-main/30 group transition-colors duration-75 ${editingId === item.id ? 'bg-brand-blue/[0.03]' : ''}`}>
                        <td className="px-4 py-2 border-r border-border-soft/50 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleToggleEdit(item.id)}
                              className={`p-1.5 rounded-md transition-all ${editingId === item.id ? 'bg-green-100 text-green-600' : 'text-brand-blue hover:bg-brand-blue/10'}`}
                              title={editingId === item.id ? "Save Row" : "Edit Row"}
                            >
                              {editingId === item.id ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                              title="Delete Row"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-2 border-r border-border-soft/50">
                          {editingId === item.id ? (
                            <input 
                              type="text"
                              value={item.item}
                              onChange={(e) => handleSummaryRowChange(item.id, 'item', e.target.value)}
                              className="w-full bg-white border border-brand-blue/20 rounded px-2 py-0.5 text-[12.5px] font-bold outline-none focus:border-brand-blue"
                            />
                          ) : (
                            <span className="font-bold text-[12.5px] text-text-primary uppercase tracking-tight">{item.item}</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50">
                          {editingId === item.id ? (
                            <input 
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleSummaryRowChange(item.id, 'qty', e.target.value)}
                              className="w-20 bg-white border border-brand-blue/20 rounded px-2 py-0.5 text-[13px] font-bold text-center text-brand-blue outline-none"
                            />
                          ) : (
                            <span className="font-bold text-brand-blue text-[13px]">{item.qty}</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50">
                           {editingId === item.id ? (
                            <select 
                              value={item.unit}
                              onChange={(e) => handleSummaryRowChange(item.id, 'unit', e.target.value)}
                              className="bg-white border border-brand-blue/20 rounded px-1 py-0.5 text-[11px] font-bold text-text-secondary outline-none"
                            >
                              <option>PCS</option>
                              <option>KGS</option>
                              <option>MTR</option>
                              <option>DOZEN</option>
                            </select>
                          ) : (
                            <span className="text-text-secondary font-bold text-[11px]">{item.unit}</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50">
                           {editingId === item.id ? (
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleSummaryRowChange(item.id, 'rate', e.target.value)}
                              className="w-20 bg-white border border-brand-blue/20 rounded px-2 py-0.5 text-[12.5px] font-bold text-center outline-none"
                            />
                          ) : (
                            <span className="text-text-secondary text-[12.5px] font-medium">₹{item.rate}</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50">
                           {editingId === item.id ? (
                            <input 
                              type="number"
                              value={item.dPercent}
                              onChange={(e) => handleSummaryRowChange(item.id, 'dPercent', e.target.value)}
                              className="w-16 bg-white border border-brand-blue/20 rounded px-2 py-0.5 text-[11px] font-bold text-center outline-none"
                            />
                          ) : (
                            <span className="text-text-light text-[11px] font-bold">{item.dPercent}%</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50 bg-bg-main/5 font-bold text-text-light text-[11px]">
                          ₹{item.discount}
                        </td>
                        <td className="px-5 py-2 text-right bg-bg-main/10 font-black text-text-primary text-[13px]">
                          ₹{item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Extra Charges, Discounts & Totals Section */}
              <div className="bg-bg-main/20 border border-border-soft/40 rounded-xl p-3 flex flex-col gap-3 shadow-sm mt-1">
                {/* Row 1: Transport, Packing, Discount, Total Amount */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-text-light uppercase tracking-widest ml-0.5 opacity-80">Transport (₹)</label>
                    <input 
                      type="number"
                      name="transport"
                      value={formData.transport}
                      onChange={handleSummaryFieldChange}
                      className="w-full h-8 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary text-center outline-none focus:border-brand-blue shadow-sm transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-text-light uppercase tracking-widest ml-0.5 opacity-80">Packing (₹)</label>
                    <input 
                      type="number"
                      name="packing"
                      value={formData.packing}
                      onChange={handleSummaryFieldChange}
                      className="w-full h-8 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary text-center outline-none focus:border-brand-blue shadow-sm transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-text-light uppercase tracking-widest ml-0.5 opacity-80">Disc (%)</label>
                    <input 
                      type="number"
                      name="extraDiscountPercent"
                      value={formData.extraDiscountPercent}
                      onChange={handleSummaryFieldChange}
                      className="w-full h-8 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-bold text-text-light text-center outline-none focus:border-brand-blue shadow-sm transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-text-light uppercase tracking-widest ml-0.5 opacity-80">Disc (₹)</label>
                    <input 
                      type="number"
                      name="extraDiscountAmount"
                      value={formData.extraDiscountAmount}
                      onChange={handleSummaryFieldChange}
                      className="w-full h-8 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-bold text-text-light text-center outline-none focus:border-brand-blue shadow-sm transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-brand-blue/70 uppercase tracking-widest ml-0.5">Total Amount (₹)</label>
                    <div className="w-full h-8 flex items-center justify-center bg-brand-blue/5 border border-brand-blue/10 rounded-lg text-[13.5px] font-bold text-brand-blue shadow-sm">
                      ₹{totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Sub-section: Round Off & Grand Total */}
                <div className="flex justify-end pt-1.5 border-t border-border-soft/30">
                  <div className="flex flex-col gap-2.5 w-full md:w-60">
                    <div className="flex items-center justify-between gap-6 px-1">
                      <label className="text-[10px] font-medium text-text-light uppercase tracking-widest">Round Off</label>
                      <input 
                        type="number"
                        name="roundOff"
                        value={formData.roundOff}
                        onChange={handleFormChange}
                        className="w-24 h-7 px-2 bg-white border border-border-soft rounded text-[12px] font-bold text-text-primary text-right outline-none focus:border-brand-blue shadow-sm transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-6 px-3 py-1.5 bg-brand-blue text-white rounded-lg shadow-sm">
                      <label className="text-[10px] font-bold uppercase tracking-[0.1em]">Grand Total</label>
                      <div className="text-[16px] font-bold">
                        ₹{grandTotal}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks/Final Save Section */}
              <div className="flex flex-col gap-2 mt-4 pb-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest block opacity-70">Invoice Remarks</label>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate('/billing-entries')}
                      className="flex items-center justify-center px-5 h-8 bg-white border border-border-soft rounded-lg text-[11.5px] font-bold text-text-secondary hover:text-red-500 hover:bg-bg-main transition uppercase tracking-widest shadow-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleFinalSave}
                      className="flex items-center justify-center px-6 h-8 bg-brand-blue rounded-lg text-[12px] font-bold text-white hover:bg-brand-blue-hover transition transform active:scale-95 uppercase tracking-widest shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save Invoice
                    </button>
                  </div>
                </div>
                
                <textarea 
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  className="w-full h-16 px-4 py-2.5 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none"
                  placeholder="Enter any customer notes or internal billing details..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateInvoice;
