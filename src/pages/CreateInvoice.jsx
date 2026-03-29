import React, { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';

const CreateInvoice = () => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    transporter: '',
    clientName: '',
    address1: '',
    address2: '',
    remarks: ''
  });

  // --- Entry Table State ---
  const [entryRows, setEntryRows] = useState([
    { id: 1, item: '', stock: '', qty: '', unit: 'PCS', rate: '', dPercent: '', discount: 0, total: 0 }
  ]);

  // --- Saved Records State ---
  const [savedRecords, setSavedRecords] = useState([]);

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRowChange = (id, field, value) => {
    setEntryRows(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-calculate Discount and Total
        if (['qty', 'rate', 'dPercent'].includes(field)) {
          const qty = parseFloat(updatedRow.qty) || 0;
          const rate = parseFloat(updatedRow.rate) || 0;
          const dPercent = parseFloat(updatedRow.dPercent) || 0;
          
          const subtotal = qty * rate;
          const discountAmt = (subtotal * dPercent) / 100;
          updatedRow.discount = discountAmt.toFixed(2);
          updatedRow.total = (subtotal - discountAmt).toFixed(2);
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const addRow = () => {
    const newId = entryRows.length > 0 ? Math.max(...entryRows.map(r => r.id)) + 1 : 1;
    setEntryRows([...entryRows, { id: newId, item: '', stock: '', qty: '', unit: 'PCS', rate: '', dPercent: '', discount: 0, total: 0 }]);
  };

  const handleSave = () => {
    const newRecord = {
      ...formData,
      items: entryRows,
      timestamp: new Date().toLocaleTimeString()
    };
    setSavedRecords([newRecord, ...savedRecords]);
    // Optional: Reset entry table
    // setEntryRows([{ id: 1, item: '', stock: '', qty: '', unit: 'PCS', rate: '', dPercent: '', discount: 0, total: 0 }]);
  };

  const handleRedo = () => {
    setEntryRows([{ id: 1, item: '', stock: '', qty: '', unit: 'PCS', rate: '', dPercent: '', discount: 0, total: 0 }]);
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-12">
        <PageHeader 
          title="Create Invoice" 
          subtitle="ADD AND MANAGE BILLING INVOICE DETAILS" 
        />

        <div className="px-6 flex flex-col gap-6 w-full">
          {/* Main Form Card */}
          <Card className="p-5">
            <div className="flex flex-col gap-5">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="Challan No" 
                  name="challanNo"
                  value={formData.challanNo}
                  onChange={handleFormChange}
                  placeholder="Enter Challan No." 
                />
                <Input 
                  label="Date" 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                />
                <Input 
                  label="Transporter Name" 
                  name="transporter"
                  value={formData.transporter}
                  onChange={handleFormChange}
                  placeholder="Enter Transporter Name" 
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1.5 flex-1 text-left relative">
                  <label className="text-[11px] font-bold text-text-light uppercase tracking-tight ml-0.5">Client Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleFormChange}
                      className="flex-1 h-9 px-3 bg-bg-main/50 border border-divider-soft rounded text-[13px] outline-none focus:border-brand-blue transition-all"
                      placeholder="Select or Search Client"
                    />
                    <Button variant="primary" size="sm" className="whitespace-nowrap h-9">New Client</Button>
                  </div>
                </div>
                <Input 
                  label="Address Line 1" 
                  name="address1"
                  value={formData.address1}
                  onChange={handleFormChange}
                  placeholder="Building/Street" 
                />
                <Input 
                  label="Address Line 2" 
                  name="address2"
                  value={formData.address2}
                  onChange={handleFormChange}
                  placeholder="Area/City" 
                />
              </div>

              {/* Row 3 */}
              <div className="w-full">
                <Input 
                  label="Remarks" 
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  placeholder="General Remarks" 
                />
              </div>
            </div>
          </Card>

          {/* Entry Table Section */}
          <div className="bg-white border border-border-soft rounded-lg shadow-sm overflow-hidden pb-4">
            <div className="bg-table-header px-4 py-2.5">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Data Entry</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary tracking-tighter">
                    <th className="px-3 py-2 text-left border-r border-border-soft w-12 text-center">#</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft min-w-[150px]">Item</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-24">Stock</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-24">Quantity</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-20">Unit</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-24">Rate</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-20">D%</th>
                    <th className="px-3 py-2 text-left border-r border-border-soft w-28">Discount</th>
                    <th className="px-3 py-2 text-left w-32">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {entryRows.map((row, index) => (
                    <tr key={row.id} className="group hover:bg-bg-main/20">
                      <td className="px-3 py-2 border-r border-border-soft text-[12px] text-text-light font-medium text-center">{index + 1}</td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <input 
                          type="text" 
                          value={row.item}
                          onChange={(e) => handleRowChange(row.id, 'item', e.target.value)}
                          className="w-full bg-transparent outline-none text-[12.5px] font-medium placeholder:opacity-30" 
                          placeholder="Select Material..."
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <input 
                          type="number" 
                          value={row.stock}
                          onChange={(e) => handleRowChange(row.id, 'stock', e.target.value)}
                          className="w-full bg-transparent outline-none text-[12.5px] font-medium" 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <input 
                          type="number" 
                          value={row.qty}
                          onChange={(e) => handleRowChange(row.id, 'qty', e.target.value)}
                          className="w-full bg-transparent outline-none text-[12.5px] font-bold text-brand-blue" 
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <select 
                          value={row.unit}
                          onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                          className="w-full bg-transparent outline-none text-[11px] font-bold text-text-secondary"
                        >
                          <option>PCS</option>
                          <option>KGS</option>
                          <option>MTR</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <input 
                          type="number" 
                          value={row.rate}
                          onChange={(e) => handleRowChange(row.id, 'rate', e.target.value)}
                          className="w-full bg-transparent outline-none text-[12.5px] font-bold" 
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft">
                        <input 
                          type="number" 
                          value={row.dPercent}
                          onChange={(e) => handleRowChange(row.id, 'dPercent', e.target.value)}
                          className="w-full bg-transparent outline-none text-[11px] text-text-light font-bold" 
                          placeholder="%"
                        />
                      </td>
                      <td className="px-3 py-2 border-r border-border-soft text-[12.5px] font-medium text-text-secondary">
                        ₹{row.discount}
                      </td>
                      <td className="px-3 py-2 text-[13px] font-bold text-text-primary bg-bg-main/10">
                        ₹{row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 flex justify-between items-center border-t border-border-soft">
              <Button variant="secondary" size="sm" onClick={addRow} className="gap-1.5 opacity-80 hover:opacity-100">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </Button>
              
              <div className="flex gap-4">
                <button onClick={handleRedo} className="flex items-center gap-1.5 text-[11.5px] font-bold text-text-light hover:text-text-primary transition uppercase tracking-tight">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Redo
                </button>
                <button className="flex items-center gap-1.5 text-[11.5px] font-bold text-text-light hover:text-red-500 transition uppercase tracking-tight">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <Button variant="primary" size="md" onClick={handleSave} className="px-8 shadow-brand-blue/30 h-10">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Record
                </Button>
              </div>
            </div>
          </div>

          {/* Saved Data Table (Appears when there are records) */}
          {savedRecords.length > 0 && (
            <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
                <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Saved Summary</h2>
              </div>
              
              <div className="bg-white border border-border-soft rounded-lg overflow-hidden shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header text-white text-[10.5px] uppercase font-bold tracking-tight">
                      <th className="px-3 py-2.5 text-center border-r border-white/10 w-12">#</th>
                      <th className="px-4 py-2.5 text-left border-r border-white/10">Item Detail</th>
                      <th className="px-4 py-2.5 text-center border-r border-white/10 w-24">Qty</th>
                      <th className="px-4 py-2.5 text-center border-r border-white/10 w-24">Rate</th>
                      <th className="px-4 py-2.5 text-center border-r border-white/10 w-20">D%</th>
                      <th className="px-4 py-2.5 text-right border-r border-white/10 w-32">Total Amount</th>
                      <th className="px-4 py-2.5 text-left w-40">Client Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft text-[12.5px]">
                    {savedRecords.map((record, rIdx) => (
                      record.items.map((item, iIdx) => (
                        <tr key={`${rIdx}-${iIdx}`} className="hover:bg-bg-main/30 transition-colors">
                          <td className="px-3 py-2 text-center text-text-light font-medium border-r border-border-soft">{item.id}</td>
                          <td className="px-4 py-2 font-medium text-text-primary border-r border-border-soft">{item.item || 'Generic Item'}</td>
                          <td className="px-4 py-2 text-center font-bold text-brand-blue border-r border-border-soft">{item.qty} {item.unit}</td>
                          <td className="px-4 py-2 text-center text-text-secondary border-r border-border-soft">₹{item.rate}</td>
                          <td className="px-4 py-2 text-center text-text-light border-r border-border-soft">{item.dPercent}%</td>
                          <td className="px-4 py-2 text-right font-bold text-text-primary border-r border-border-soft">₹{item.total}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-[11.5px]">{record.clientName || 'N/A'}</span>
                              <span className="text-[10px] text-text-light leading-none">{record.challanNo} • {record.date}</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateInvoice;
