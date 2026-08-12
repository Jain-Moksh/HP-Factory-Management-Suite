import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import { API_BASE_URL } from '../../config';

const MOCK_ITEMS = [
  { id: 101, name: 'ELECTRICAL WIRE 1.5MM', rate: 120.00, unit: 'DOZ' },
  { id: 102, name: 'LED BULB 9W', rate: 85.00, unit: 'PCS' },
  { id: 103, name: 'PVC CONDUIT PIPE 20MM', rate: 45.00, unit: 'PCS' },
  { id: 104, name: 'MODULAR SWITCH 6A', rate: 25.00, unit: 'PCS' },
  { id: 105, name: 'PLASTIC SOCKET 3-PIN', rate: 35.00, unit: 'PCS' },
  { id: 106, name: 'CPVC BALL VALVE 1 INCH', rate: 150.00, unit: 'PCS' },
  { id: 107, name: 'TEFLON TAPE STANDARD', rate: 15.00, unit: 'PCS' },
  { id: 108, name: 'STAINLESS SCREW 2 INCH', rate: 250.00, unit: 'GROSS' },
  { id: 109, name: 'BRASS ELBOW 1/2 INCH', rate: 95.00, unit: 'PCS' },
  { id: 110, name: 'HEX BOLT WITH NUT M8', rate: 180.00, unit: 'GROSS' }
];

const PriceList = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [allItems, setAllItems] = useState([]);
  const [categories, setCategories] = useState([
    {
      id: 'cat-1',
      name: 'ELECTRICAL ITEMS',
      expanded: true,
      items: [
        { id: 101, name: 'ELECTRICAL WIRE 1.5MM', rate: 120.00, unit: 'DOZ' },
        { id: 102, name: 'LED BULB 9W', rate: 85.00, unit: 'PCS' }
      ]
    },
    {
      id: 'cat-2',
      name: 'PLUMBING ITEMS',
      expanded: false,
      items: [
        { id: 106, name: 'CPVC BALL VALVE 1 INCH', rate: 150.00, unit: 'PCS' }
      ]
    }
  ]);

  // --- Category Modal State ---
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // --- Item Selector Modal State ---
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  // --- Fetch items on mount ---
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/items`);
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          setAllItems(result.data);
        } else {
          setAllItems(MOCK_ITEMS);
        }
      } catch (err) {
        console.warn('Unable to connect to backend, falling back to mock item data');
        setAllItems(MOCK_ITEMS);
      }
    };
    fetchItems();
  }, []);

  // --- Global set of all assigned item IDs across all categories ---
  const globallyAssignedItemIds = useMemo(() => {
    const ids = new Set();
    categories.forEach(cat => {
      cat.items.forEach(item => ids.add(item.id));
    });
    return ids;
  }, [categories]);

  // --- Available items that can be assigned to the active category ---
  const availableItemsForSelector = useMemo(() => {
    return allItems.filter(item => {
      // Show item if it is not assigned anywhere, OR if it's already assigned to the active category
      // (so they can toggle selections in the modal)
      const isAssignedElsewhere = globallyAssignedItemIds.has(item.id);
      const isAssignedToActiveCategory = activeCategoryId 
        ? categories.find(c => c.id === activeCategoryId)?.items.some(i => i.id === item.id)
        : false;
      
      return !isAssignedElsewhere || isAssignedToActiveCategory;
    });
  }, [allItems, globallyAssignedItemIds, activeCategoryId, categories]);

  const filteredItemsInSelector = useMemo(() => {
    return availableItemsForSelector.filter(item =>
      item.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
    );
  }, [availableItemsForSelector, itemSearchTerm]);

  // --- Category Handlers ---
  const handleOpenCategoryModal = () => {
    setNewCategoryName('');
    setCategoryError('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = () => {
    const trimmedName = newCategoryName.trim().toUpperCase();
    if (!trimmedName) {
      setCategoryError('Category name cannot be empty');
      return;
    }

    const duplicateExists = categories.some(
      cat => cat.name.toUpperCase() === trimmedName
    );
    if (duplicateExists) {
      setCategoryError('A category with this name already exists');
      return;
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      expanded: true,
      items: []
    };

    setCategories(prev => [...prev, newCategory]);
    setIsCategoryModalOpen(false);
  };

  const toggleCategoryCollapse = (id) => {
    setCategories(prev =>
      prev.map(cat => cat.id === id ? { ...cat, expanded: !cat.expanded } : cat)
    );
  };

  const handleDeleteCategory = (id, e) => {
    e.stopPropagation(); // Avoid collapse toggling
    if (window.confirm('Are you sure you want to delete this category? All its item assignments will be cleared.')) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  // --- Item Selector Handlers ---
  const handleOpenItemSelector = (categoryId, e) => {
    e.stopPropagation(); // Prevent category card accordion collapse
    setActiveCategoryId(categoryId);
    setItemSearchTerm('');
    
    // Pre-populate checkboxes with currently assigned items in this category
    const category = categories.find(c => c.id === categoryId);
    const preselected = new Set(category ? category.items.map(i => i.id) : []);
    setSelectedItemIds(preselected);
    
    setIsItemModalOpen(true);
  };

  const handleToggleItemCheckbox = (itemId) => {
    setSelectedItemIds(prev => {
      const copy = new Set(prev);
      if (copy.has(itemId)) {
        copy.delete(itemId);
      } else {
        copy.add(itemId);
      }
      return copy;
    });
  };

  const handleSaveItemSelection = () => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== activeCategoryId) return cat;

        // Construct new list of items from selector, preserving the order of newly checked items
        const newItemsList = [];
        
        // Retain existing items if they are still checked (maintaining order)
        cat.items.forEach(existingItem => {
          if (selectedItemIds.has(existingItem.id)) {
            newItemsList.push(existingItem);
          }
        });

        // Add newly selected items at the end
        allItems.forEach(item => {
          if (selectedItemIds.has(item.id) && !newItemsList.some(i => i.id === item.id)) {
            newItemsList.push(item);
          }
        });

        return { ...cat, items: newItemsList };
      })
    );
    setIsItemModalOpen(false);
  };

  const handleRemoveItem = (categoryId, itemId, e) => {
    e.stopPropagation();
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
      })
    );
  };

  // --- Reordering Logic ---
  const handleMoveItem = (categoryId, index, direction, e) => {
    e.stopPropagation();
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        const newItems = [...cat.items];
        const targetIndex = index + direction;

        if (targetIndex >= 0 && targetIndex < newItems.length) {
          // Swap items
          const temp = newItems[index];
          newItems[index] = newItems[targetIndex];
          newItems[targetIndex] = temp;
        }

        return { ...cat, items: newItems };
      })
    );
  };

  // --- Printing Handler ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      {/* Dynamic Printing Media Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          .print-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            background: white !important;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table th, .print-table td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            font-size: 12px;
            color: #000 !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            font-weight: bold;
          }
        }
      `}} />

      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title="Price List" 
          subtitle="MANAGE ITEM PRICE LIST" 
          backAction={() => window.history.back()}
        />

        <div className="px-6 flex flex-col gap-6 w-full">
          
          {/* Top Control Section */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-3 shadow-sm flex items-center justify-between gap-4 group no-print">
            <div className="flex items-center gap-6">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleOpenCategoryModal}
                className="flex items-center gap-1.5 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Create Category
              </Button>

              <div className="flex items-center gap-2 border-l border-border-soft pl-6">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Date</span>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-8 px-3 bg-bg-main border border-border-soft rounded text-[11px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                />
              </div>
            </div>

            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
          </div>

          {/* Collapsible / Expandable Categories Display */}
          <div id="print-area" className="flex flex-col gap-5 w-full">
            
            {/* Print Only Header Info */}
            <div className="hidden print-header w-full">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">HP Factory Management Suite</h1>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Item Price List</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Date</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {categories.length === 0 ? (
              <div className="bg-white border border-border-soft rounded-xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-text-primary uppercase tracking-wider mb-1">No Categories Created Yet</h4>
                  <p className="text-[11px] text-text-secondary uppercase tracking-tight">Create a category to start building your Price List.</p>
                </div>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="print-card bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                  
                  {/* Category Header Card */}
                  <div 
                    onClick={() => toggleCategoryCollapse(cat.id)}
                    className="px-5 py-3.5 bg-slate-50 border-b border-border-soft flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/50 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-text-secondary text-[11px] font-bold no-print">
                        {cat.expanded ? '▼' : '▶'}
                      </span>
                      <h3 className="text-[12.5px] font-black text-text-primary uppercase tracking-wider">
                        {cat.name}
                      </h3>
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[9.5px] font-bold tracking-wider">
                        {cat.items.length} {cat.items.length === 1 ? 'ITEM' : 'ITEMS'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 no-print">
                      <button
                        onClick={(e) => handleOpenItemSelector(cat.id, e)}
                        className="w-7 h-7 rounded-lg bg-white border border-border-soft text-brand-blue flex items-center justify-center font-black text-sm hover:bg-brand-blue hover:text-white transition-all active:scale-90"
                        title="Add/Manage Items"
                      >
                        +
                      </button>
                      <button
                        onClick={(e) => handleDeleteCategory(cat.id, e)}
                        className="w-7 h-7 rounded-lg bg-white border border-border-soft text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all active:scale-90"
                        title="Delete Category"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Category Assigned Items List */}
                  {cat.expanded && (
                    <div className="p-0">
                      {cat.items.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary italic text-[12px] no-print">
                          No items added to this category. Click the "+" button to assign items.
                        </div>
                      ) : (
                        <table className="print-table w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary no-print">
                              <th className="px-5 py-2 w-12 text-center">Pos</th>
                              <th className="px-5 py-2">Item Name</th>
                              <th className="px-5 py-2 w-36 text-center">Unit</th>
                              <th className="px-5 py-2 w-44 text-right">Rate (₹)</th>
                              <th className="px-5 py-2 w-28 text-center">Reorder</th>
                              <th className="px-5 py-2 w-16 text-center">Remove</th>
                            </tr>
                            <tr className="hidden print:table-row">
                              <th className="px-5 py-2 text-left">Pos</th>
                              <th className="px-5 py-2 text-left">Item Name</th>
                              <th className="px-5 py-2 text-center">Unit</th>
                              <th className="px-5 py-2 text-right">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-soft text-text-primary text-[12.5px]">
                            {cat.items.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-bg-main/20">
                                
                                {/* Position column */}
                                <td className="px-5 py-2 text-center font-bold text-text-light border-r border-border-soft no-print">
                                  {idx + 1}
                                </td>
                                <td className="hidden print:table-cell px-5 py-2 font-bold text-left w-12">
                                  {idx + 1}
                                </td>

                                {/* Item Name */}
                                <td className="px-5 py-2 font-bold uppercase tracking-tight border-r border-border-soft">
                                  <span className="no-print mr-2 text-text-light opacity-50">☰</span>
                                  {item.name}
                                </td>

                                {/* Unit */}
                                <td className="px-5 py-2 text-center border-r border-border-soft text-[11px] font-bold text-text-secondary uppercase">
                                  {item.unit}
                                </td>

                                {/* Rate */}
                                <td className="px-5 py-2 text-right font-black text-brand-blue border-r border-border-soft print:text-black">
                                  ₹{parseFloat(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>

                                {/* Reorder arrow buttons */}
                                <td className="px-5 py-2 border-r border-border-soft no-print">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      disabled={idx === 0}
                                      onClick={(e) => handleMoveItem(cat.id, idx, -1, e)}
                                      className="w-5 h-5 rounded border border-border-soft text-slate-500 hover:bg-slate-100 flex items-center justify-center text-[10px] font-bold disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                                      title="Move Up"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      disabled={idx === cat.items.length - 1}
                                      onClick={(e) => handleMoveItem(cat.id, idx, 1, e)}
                                      className="w-5 h-5 rounded border border-border-soft text-slate-500 hover:bg-slate-100 flex items-center justify-center text-[10px] font-bold disabled:opacity-30 disabled:pointer-events-none active:scale-90 transition-all"
                                      title="Move Down"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </td>

                                {/* Remove item button */}
                                <td className="px-5 py-2 text-center no-print">
                                  <button
                                    onClick={(e) => handleRemoveItem(cat.id, item.id, e)}
                                    className="text-red-500 hover:scale-125 font-bold transition-all text-sm px-2"
                                    title="Remove from Category"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Category Creation Dialog Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Create Price Category"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveCategory}>
              Save Category
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input 
            label="Category Name"
            placeholder="e.g. ELECTRICAL ITEMS"
            value={newCategoryName}
            onChange={(e) => {
              setNewCategoryName(e.target.value);
              setCategoryError('');
            }}
            error={categoryError}
            autoFocus
          />
        </div>
      </Modal>

      {/* Item Selector Multi-Select Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Select Items to Assign"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsItemModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveItemSelection}>
              Add Selected Items
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 max-h-[60vh]">
          {/* Search box inside selector */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-text-light opacity-50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search items by name..."
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-bg-main border border-border-soft rounded text-[12px] outline-none focus:border-brand-blue transition-all"
            />
          </div>

          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-1">
            Available Items ({filteredItemsInSelector.length})
          </div>

          {/* List items with checkboxes */}
          <div className="flex-1 overflow-y-auto border border-border-soft rounded-lg divide-y divide-border-soft max-h-[40vh] bg-bg-main/20">
            {filteredItemsInSelector.length === 0 ? (
              <div className="p-8 text-center text-text-light italic text-[12px]">
                {itemSearchTerm 
                  ? "No matching available items found." 
                  : "All system items are already assigned to a category."
                }
              </div>
            ) : (
              filteredItemsInSelector.map(item => {
                const isChecked = selectedItemIds.has(item.id);
                return (
                  <label 
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 select-none transition-colors"
                  >
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItemCheckbox(item.id)}
                      className="w-4 h-4 rounded text-brand-blue border-border-soft focus:ring-brand-blue"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <div className="font-bold text-[12px] text-text-primary uppercase truncate">
                        {item.name}
                      </div>
                      <div className="text-[10.5px] font-black text-brand-blue text-right shrink-0">
                        ₹{parseFloat(item.rate || 0).toLocaleString()} / {item.unit}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default PriceList;
