import React, { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const ItemList = () => {
  // --- Form State ---
  const [formData, setFormData] = useState({
    itemName: '',
    rate: '',
    unit: 'PCS',
    conversion: '',
    opening: ''
  });

  // --- List State (Local Mock) ---
  const [items, setItems] = useState([
    { id: 1, name: 'PVC Resin', rate: 85, unit: 'KGS', conversion: 1, opening: 500 },
    { id: 2, name: 'Master Batch Red', rate: 120, unit: 'PCS', conversion: 100, opening: 50 },
  ]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.itemName) return;
    const newItem = {
      id: Date.now(),
      name: formData.itemName,
      rate: formData.rate,
      unit: formData.unit,
      conversion: formData.conversion,
      opening: formData.opening
    };
    setItems([...items, newItem]);
    handleRedo();
  };

  const handleRedo = () => {
    setFormData({
      itemName: '',
      rate: '',
      unit: 'PCS',
      conversion: '',
      opening: ''
    });
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
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
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary">
                    <th className="px-4 py-2 text-left border-r border-border-soft">Item Name</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-32">Rate</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-32">Unit</th>
                    <th className="px-4 py-2 text-left border-r border-border-soft w-32">Conversion</th>
                    <th className="px-4 py-2 text-left w-32 leading-tight">Opening <br /> Stock</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50">
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="text"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="Enter item name..."
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="rate"
                        value={formData.rate}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-bold text-brand-blue"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <select 
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full h-10 px-3 bg-transparent outline-none text-[12px] font-bold text-text-secondary cursor-pointer"
                      >
                        <option value="PCS">PCS</option>
                        <option value="DOZEN">DOZEN</option>
                      </select>
                    </td>
                    <td className="p-0 border-r border-border-soft">
                      <input 
                        type="number"
                        name="conversion"
                        value={formData.conversion}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium"
                        placeholder="1"
                      />
                    </td>
                    <td className="p-0">
                      <input 
                        type="number"
                        name="opening"
                        value={formData.opening}
                        onChange={handleInputChange}
                        className="w-full h-10 px-4 bg-transparent outline-none text-[13px] font-medium"
                        placeholder="0"
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
            
            <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Item Name</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-32 text-[10.5px] uppercase font-bold tracking-wider">Rate</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-24 text-[10.5px] uppercase font-bold tracking-wider">Unit</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-32 text-[10.5px] uppercase font-bold tracking-wider">Conversion</th>
                    <th className="px-5 py-2 text-center border-r border-white/10 w-32 text-[10.5px] uppercase font-bold tracking-wider leading-tight">Opening <br /> Stock</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-main/30 transition-colors">
                      <td className="px-5 py-1.5 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                        {item.name}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[13px] font-bold text-brand-blue border-r border-border-soft">
                        ₹{parseFloat(item.rate).toFixed(2)}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[11.5px] font-bold text-text-secondary border-r border-border-soft uppercase">
                        {item.unit}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[12.5px] font-medium text-text-light border-r border-border-soft">
                        {item.conversion}
                      </td>
                      <td className="px-5 py-1.5 text-center text-[13px] font-bold text-brand-blue border-r border-border-soft">
                        {item.opening || 0}
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button className="text-brand-blue hover:scale-110 transition p-1" title="Edit Item">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:scale-110 transition p-1" 
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
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-text-light italic text-[13px]">
                        No items found in master. Add a new item to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ItemList;
