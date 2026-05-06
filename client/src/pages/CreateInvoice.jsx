import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import DeleteModal from '../components/UI/DeleteModal';
import WarningModal from '../components/UI/WarningModal';
import PrintCopiesModal from '../components/UI/PrintCopiesModal';
import { API_BASE_URL } from '../config';
import PrintInvoice from '../components/PrintInvoice';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // --- Master Data State ---
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(false);

  // --- Search/Dropdown State ---
  const [itemSearch, setItemSearch] = useState('');
  const [transporterSearch, setTransporterSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showTransporterDropdown, setShowTransporterDropdown] = useState(false);

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // --- Warning Modal State ---
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // --- Refs for Click Outside ---
  const clientRef = useRef(null);
  const itemRef = useRef(null);
  const transporterRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clientRef.current && !clientRef.current.contains(event.target)) {
        setShowClientDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowItemDropdown(false);
      }
      if (transporterRef.current && !transporterRef.current.contains(event.target)) {
        setShowTransporterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Header Form State ---
  const [showClientForm, setShowClientForm] = useState(false);
  const [isSavingNewClient, setIsSavingNewClient] = useState(false);
  const [newClientFormData, setNewClientFormData] = useState({
    name: '',
    shortform: '',
    street: '',
    city: '',
    balance: '',
    remark: ''
  });

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
    transporter_id: '',
    client_id: '',
    clientName: '',
    address1: '',
    address2: '',
    short_remark: '',
    long_remark: '',
    transport: '',
    packing: '',
    extraDiscountPercent: '',
    extraDiscountAmount: '',
    roundOff: ''
  });

  // --- Current Entry State (Single Row) ---
  const [currentItem, setCurrentItem] = useState({
    item_id: '',
    item: '',
    stock: '0',
    qty: '',
    unit: 'DOZ',
    rate: '',
    dPercent: '',
    dAmount: '',
    discount: '0.00',
    total: '0.00',
    min_stock: '0'
  });

  // --- Invoice Summary State ---
  const [addedItems, setAddedItems] = useState([]);
  
  // --- In-place Editing State ---
  const [editingId, setEditingId] = useState(null);

  // --- Print State ---
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCopies, setPrintCopies] = useState(2);

  // Print lifecycle: trigger window.print() after component mounts
  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
        navigate('/order-summary');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting, navigate]);

  useEffect(() => {
    const fetchMasters = async () => {
      setIsLoadingMasters(true);
      try {
        const [clientsRes, itemsRes, transportersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/clients`),
          fetch(`${API_BASE_URL}/items`),
          fetch(`${API_BASE_URL}/transporters`)
        ]);
        
        const clientsData = await clientsRes.json();
        const itemsData = await itemsRes.json();
        const transportersData = await transportersRes.json();

        if (clientsData.success) setClients(clientsData.data);
        if (itemsData.success) setItems(itemsData.data);
        if (transportersData.success) setTransporters(transportersData.data);
      } catch (err) {
        console.error("Error fetching masters:", err);
      } finally {
        setIsLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  // --- Fetch Bill Data for Edit Mode ---
  useEffect(() => {
    if (isEditMode) {
      const fetchBillData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/billing/${id}`);
          const result = await response.json();
          if (result.success) {
            const bill = result.data;
            setFormData({
              challanNo: bill.challan_no,
              date: bill.date.split('T')[0],
              transporter_id: bill.transporter_id || '',
              transporterName: bill.transporter_name || '',
              client_id: bill.client_id,
              clientName: bill.client_name,
              address1: bill.address1 || '', // Note: Check if these exist in DB or map from client
              address2: bill.address2 || '',
              short_remark: bill.short_remark || '',
              long_remark: bill.long_remark || '',
              transport: bill.transport_charge || '0',
              packing: bill.packing_charge || '0',
              extraDiscountPercent: bill.discount_percent || '0',
              extraDiscountAmount: bill.discount_amount || '0',
              roundOff: '' // Calculated automatically
            });

            // Map billing items
            const mappedItems = bill.items.map(item => ({
              id: item.id, // Or use a separate internal ID
              item_id: item.item_id,
              item: item.item_name,
              qty: item.quantity,
              unit: item.unit,
              rate: item.rate,
              dPercent: item.discount_percent,
              dAmount: item.discount_amount,
              conversion: item.conversion,
              total: item.total_amount
            }));
            setAddedItems(mappedItems);
          }
        } catch (err) {
          console.error("Error fetching bill data:", err);
        }
      };
      fetchBillData();
    }
  }, [isEditMode, id]);

  // Fetch Next Challan Number when date changes
  useEffect(() => {
    const fetchNextChallan = async () => {
      try {
        const url = `${API_BASE_URL}/billing/next-challan?date=${formData.date}${isEditMode ? `&billing_id=${id}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setFormData(prev => ({ ...prev, challanNo: data.challan_no }));
        }
      } catch (err) {
        console.error("Error fetching next challan:", err);
      }
    };
    if (formData.date) {
      fetchNextChallan();
    }
  }, [formData.date, isEditMode, id]);

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAppendItem = () => {
    if (!currentItem.item || !currentItem.qty) return;

    // --- Validation: Check for negative stock ---
    const stock = parseFloat(currentItem.stock) || 0;
    const qty = parseFloat(currentItem.qty) || 0;
    const minStock = parseFloat(currentItem.min_stock) || 0;

    if (qty > stock) {
      setWarningMessage(`Current stock is only ${stock} ${currentItem.unit}, but you are entering ${qty} ${currentItem.unit}. This will result in negative stock. Do you want to proceed?`);
      setIsWarningOpen(true);
      return;
    }

    if (stock - qty < minStock) {
      setWarningMessage(`This transaction will leave you with ${(stock - qty).toFixed(2)} ${currentItem.unit} in stock, which is BELOW your Minimum Stock threshold of ${minStock} ${currentItem.unit}. Do you want to proceed?`);
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
    handleRedoCurrent();
    setIsWarningOpen(false);
  };

  const handleSummaryFieldChange = (e) => {
    const { name, value } = e.target;
    updateSummaryValue(name, value);
  };

  const updateSummaryValue = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      const itemsSub = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
      if (name === 'extraDiscountPercent') {
        const percent = parseFloat(value) || 0;
        updated.extraDiscountAmount = ((itemsSub * percent) / 100).toFixed(2);
      } else if (name === 'extraDiscountAmount') {
        const amount = parseFloat(value) || 0;
        updated.extraDiscountPercent = itemsSub > 0 ? ((amount / itemsSub) * 100).toFixed(2) : '0';
      }
      return updated;
    });
  };

  const handleSummaryStep = (field, delta) => {
    const current = parseFloat(formData[field]) || 0;
    const nextValue = Math.max(0, current + delta).toString();
    updateSummaryValue(field, nextValue);
  };

  const calculateRowValues = (qty, rate, dPercent, dAmount, priority = 'percent') => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const subtotal = q * r;
    
    let dp = parseFloat(dPercent) || 0;
    let da = parseFloat(dAmount) || 0;

    if (priority === 'percent') {
      da = (subtotal * dp) / 100;
      return {
        dAmount: da === 0 ? '' : da.toFixed(2),
        discount: da.toFixed(2),
        total: (subtotal - da).toFixed(2)
      };
    } else {
      dp = subtotal > 0 ? (da / subtotal) * 100 : 0;
      return {
        dPercent: dp === 0 ? '' : dp.toFixed(2),
        discount: da.toFixed(2),
        total: (subtotal - da).toFixed(2)
      };
    }
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    updateEntryValue(name, value);
  };

  const updateEntryValue = (name, value) => {
    setCurrentItem(prev => {
      let updated = { ...prev, [name]: value };
      if (['qty', 'rate', 'dPercent', 'dAmount'].includes(name)) {
        const priority = name === 'dAmount' ? 'amount' : 'percent';
        const results = calculateRowValues(updated.qty, updated.rate, updated.dPercent, updated.dAmount, priority);
        updated = { ...updated, ...results };
      }
      return updated;
    });
  };

  const handleEntryStep = (field, delta) => {
    const current = parseFloat(currentItem[field]) || 0;
    const nextValue = Math.max(0, current + delta).toString();
    updateEntryValue(field, nextValue);
  };

  const handleRedoCurrent = () => {
    setCurrentItem({ item: '', stock: '0', qty: '', unit: 'DOZ', rate: '', dPercent: '', dAmount: '', discount: '0.00', total: '0.00' });
  };

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setNewClientFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewClient = async () => {
    setIsSavingNewClient(true);
    const sanitizedData = {
      ...newClientFormData,
      balance: newClientFormData.balance === '' ? null : newClientFormData.balance
    };
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData)
      });
      const result = await response.json();
      if (result.success) {
        setClients(prev => [...prev, result.data]);
        handleSelectClient(result.data);
        setShowClientForm(false);
        setNewClientFormData({ name: '', shortform: '', street: '', city: '', balance: '', remark: '' });
      }
    } catch (err) {
      console.error("Error saving client:", err);
    } finally {
      setIsSavingNewClient(false);
    }
  };

  const handleNewItemFormChange = (e) => {
    const { name, value } = e.target;
    setNewItemFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewItem = async () => {
    if (!newItemFormData.name) return;
    setIsSavingNewItem(true);
    const sanitizedData = {
      ...newItemFormData,
      rate: newItemFormData.rate === '' ? null : newItemFormData.rate,
      stock: newItemFormData.stock === '' ? null : newItemFormData.stock,
      conversion: newItemFormData.conversion === '' ? null : newItemFormData.conversion,
      min_stock: newItemFormData.min_stock === '' ? null : newItemFormData.min_stock
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
        // Auto-select the newly created item in the entry row
        setCurrentItem(prev => ({
          ...prev,
          item_id: result.data.id,
          item: result.data.name,
          unit: result.data.unit,
          rate: result.data.rate.toString(),
          stock: result.data.stock.toString(),
          conversion: (result.data.conversion || 1).toString(),
          min_stock: (result.data.min_stock || 0).toString()
        }));
        setShowItemModal(false);
        handleRedoNewItem();
      }
    } catch (err) {
      console.error("Error saving item:", err);
    } finally {
      setIsSavingNewItem(false);
    }
  };

  const handleRedoNewItem = () => {
    setNewItemFormData({ name: '', rate: '', unit: 'DOZ', conversion: '1', stock: '0', min_stock: '0' });
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client_id: client.id,
      clientName: `${client.name}${client.shortform ? ` (${client.shortform})` : ''}`,
      clientRawName: client.name,
      address1: client.street || '',
      address2: client.city || ''
    }));
    setShowClientDropdown(false);
  };

  const handleSelectItem = (item) => {
    setCurrentItem(prev => ({
      ...prev,
      item_id: item.id,
      item: item.name,
      rate: item.rate || '',
      unit: item.unit || 'PCS',
      stock: item.stock || '0',
      conversion: item.conversion || 1,
      min_stock: item.min_stock || '0'
    }));
    setShowItemDropdown(false);
  };

  const handleSelectTransporter = (transporter) => {
    setFormData(prev => ({
      ...prev,
      transporter_id: transporter.id,
      transporterName: transporter.name
    }));
    setShowTransporterDropdown(false);
  };

  const handleCreateTransporter = async (name) => {
    if (!name) return;
    try {
      const response = await fetch(`${API_BASE_URL}/transporters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const result = await response.json();
      if (result.success) {
        setTransporters(prev => [...prev, result.data]);
        handleSelectTransporter(result.data);
      }
    } catch (err) {
      console.error("Error creating transporter:", err);
    }
  };

  const handleToggleEdit = (id) => {
    if (editingId === id) {
      setEditingId(null);
    } else {
      setEditingId(id);
    }
  };

  const openDeleteModal = (id) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteItem = () => {
    if (deletePassword === import.meta.env.VITE_DEL_PASS) {
      setAddedItems(prev => prev.filter(item => item.id !== itemToDelete));
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } else {
      setDeleteError('Incorrect password');
    }
  };

  const handleSummaryRowChange = (id, field, value) => {
    updateTableRowValue(id, field, value);
  };

  const updateTableRowValue = (id, field, value) => {
    setAddedItems(prev => prev.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        if (['qty', 'rate', 'dPercent', 'dAmount'].includes(field)) {
          const priority = field === 'dAmount' ? 'amount' : 'percent';
          const results = calculateRowValues(updated.qty, updated.rate, updated.dPercent, updated.dAmount, priority);
          updated = { ...updated, ...results };
        }
        return updated;
      }
      return item;
    }));
  };

  const handleTableRowStep = (id, field, delta) => {
    const item = addedItems.find(i => i.id === id);
    if (!item) return;
    const current = parseFloat(item[field]) || 0;
    const nextValue = Math.max(0, current + delta).toString();
    updateTableRowValue(id, field, nextValue);
  };

  const handleFinalSave = async (shouldNavigate = true) => {
    if (addedItems.length === 0 || !formData.client_id) {
        alert("Please select a client and add at least one item.");
        return false;
    }
    
    const itemsSubtotal = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
    const transport = parseFloat(formData.transport) || 0;
    const packing = parseFloat(formData.packing) || 0;
    const discountAmount = parseFloat(formData.extraDiscountAmount) || 0;
    const subtotalBeforeRound = itemsSubtotal + transport + packing - discountAmount;
    const grandTotal = Math.round(subtotalBeforeRound);
    
    const payload = {
      client_id: formData.client_id,
      transporter_id: formData.transporter_id || null,
      date: formData.date,
      transport_charge: transport,
      packing_charge: packing,
      discount_percent: parseFloat(formData.extraDiscountPercent) || 0,
      discount_amount: discountAmount,
      total_amount: itemsSubtotal,
      short_remark: formData.short_remark,
      long_remark: formData.long_remark,
      grand_total: grandTotal,
      challan_no: formData.challanNo,
      items: addedItems.map(item => ({
        id: item.id && item.id.toString().length < 13 ? item.id : null,
        item_id: item.item_id,
        rate: parseFloat(item.rate),
        discount_percent: parseFloat(item.dPercent) || 0,
        discount_amount: parseFloat(item.dAmount) || 0,
        unit: item.unit,
        quantity: parseFloat(item.qty),
        bundle: 1,
        total_amount: parseFloat(item.total)
      }))
    };

    try {
      const url = isEditMode ? `${API_BASE_URL}/billing/${id}` : `${API_BASE_URL}/billing`;
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        if (shouldNavigate) navigate('/order-summary');
        return true;
      } else {
        alert(result.message || `Failed to ${isEditMode ? 'update' : 'save'} invoice`);
        return false;
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'saving'} invoice:`, err);
      alert(`Network error while ${isEditMode ? 'updating' : 'saving'} invoice`);
      return false;
    }
  };

  const handleSaveAndPrint = async () => {
    // Save without navigating; on success, show print modal
    const success = await handleFinalSave(false);
    if (success) {
      setShowPrintModal(true);
    }
  };

  // --- Derived Summary Values for UI ---
  const itemsSubtotal = addedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  const transport = parseFloat(formData.transport) || 0;
  const packing = parseFloat(formData.packing) || 0;
  const discountAmount = parseFloat(formData.extraDiscountAmount) || 0;
  const totalAmount = itemsSubtotal;
  const subtotalBeforeRound = itemsSubtotal + transport + packing - discountAmount;
  const grandTotal = Math.round(subtotalBeforeRound).toFixed(2);
  const calculatedRoundOff = Math.round(subtotalBeforeRound) - subtotalBeforeRound;
  // Flipped logic: show + when rounding up, - when rounding down
  const roundOffDisplay = calculatedRoundOff === 0 ? "0.00" : (calculatedRoundOff > 0 ? "+" : "-") + Math.abs(calculatedRoundOff).toFixed(2);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title={isEditMode ? "Edit Invoice" : "Create Invoice"} 
          subtitle={isEditMode ? "MODIFY EXISTING SALES INVOICE AND BILLING DETAILS" : "GENERATE SALES INVOICE AND MANAGE CLIENT BILLING"} 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Top Identification Card */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm border-border-soft/60 relative z-[60] overflow-visible">
            <div className="flex flex-col gap-4">
              {/* Row 1: Core Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Challan No / Invoice No</label>
                  <input 
                    type="text"
                    name="challanNo"
                    value={formData.challanNo}
                    readOnly
                    className="w-full h-9 px-3 bg-bg-main border border-border-soft rounded-lg text-[12.5px] font-bold text-brand-blue outline-none cursor-not-allowed shadow-inner"
                    placeholder="ID will be assigned"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Date</label>
                  <input 
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Row 2: Client & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-1 text-left relative col-span-2">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Party Name</label>
                  <div className="flex gap-2" ref={clientRef}>
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        name="clientName"
                        value={formData.clientName}
                        onChange={(e) => {
                          handleFormChange(e);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue shadow-sm"
                        placeholder="Search Party Database..."
                        autoComplete="off"
                      />
                      {showClientDropdown && (
                        <div className="absolute top-full left-0 right-0 z-[999] mt-1 bg-white border border-border-soft rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                           {clients
                             .filter(c => c.name.toLowerCase().includes(formData.clientName.toLowerCase()) || c.shortform?.toLowerCase().includes(formData.clientName.toLowerCase()))
                             .map(c => (
                               <div 
                                 key={c.id} 
                                 onClick={() => handleSelectClient(c)}
                                 className="px-4 py-2.5 hover:bg-bg-main cursor-pointer border-b border-border-soft/30 last:border-none group"
                               >
                               <div className="text-[13px] font-bold text-text-primary group-hover:text-brand-blue transition-colors uppercase tracking-tight">
                                 {c.name} {c.shortform && <span className="text-text-primary/50 font-medium ml-1">({c.shortform})</span>}
                               </div>
                               <div className="text-[10px] font-bold text-text-primary opacity-50 uppercase tracking-widest">{c.shortform || 'No Pet Name'} • {c.city || 'Unknown City'}</div>
                               </div>
                             ))
                           }
                           <div onClick={() => setShowClientDropdown(false)} className="bg-bg-main/50 px-4 py-1.5 text-center text-[10px] font-black text-text-primary hover:text-brand-blue cursor-pointer uppercase tracking-widest">Close Search</div>
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="whitespace-nowrap h-9 px-5 text-[11px] font-bold uppercase tracking-wide rounded-lg shadow-sm"
                      onClick={() => setShowClientForm(true)}
                    >
                      New Party
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Address Line 1</label>
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
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Address Line 2</label>
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

              {/* Row 3: Remarks & Transporter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left relative">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Parcel</label>
                  <input 
                    type="text"
                    name="short_remark"
                    value={formData.short_remark}
                    onChange={handleFormChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                    placeholder="Short Reference / Note"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left relative">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Transporter Name</label>
                  <div className="relative" ref={transporterRef}>
                    <input 
                      type="text"
                      name="transporterName"
                      value={formData.transporterName || ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        setFormData(prev => ({ ...prev, transporterName: value }));
                        setShowTransporterDropdown(true);
                      }}
                      onFocus={() => setShowTransporterDropdown(true)}
                      className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue shadow-sm"
                      placeholder="Search Transporter..."
                      autoComplete="off"
                    />
                    {showTransporterDropdown && (
                      <div className="absolute top-full left-0 right-0 z-[999] mt-1 bg-white border border-border-soft rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                         {transporters
                           .filter(t => t.name.toLowerCase().includes((formData.transporterName || '').toLowerCase()))
                           .map(t => (
                             <div 
                               key={t.id} 
                               onClick={() => handleSelectTransporter(t)}
                               className="px-4 py-2 hover:bg-bg-main cursor-pointer border-b border-border-soft/30 last:border-none group"
                             >
                               <div className="text-[12.5px] font-bold text-text-primary group-hover:text-brand-blue transition-colors uppercase tracking-tight">{t.name}</div>
                             </div>
                           ))
                         }
                         {/* Dynamic "Add New" Option */}
                         {formData.transporterName && !transporters.some(t => t.name.toLowerCase() === formData.transporterName.toLowerCase()) && (
                           <div 
                             onClick={() => handleCreateTransporter(formData.transporterName)}
                             className="px-4 py-3 bg-brand-blue/5 hover:bg-brand-blue/10 cursor-pointer border-t border-border-soft/50 group"
                           >
                              <div className="flex items-center gap-2">
                                <span className="text-brand-blue">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                  </svg>
                                </span>
                                <span className="text-[12px] font-black text-brand-blue uppercase tracking-tight">Add "{formData.transporterName}"</span>
                              </div>
                           </div>
                         )}
                         <div onClick={() => setShowTransporterDropdown(false)} className="bg-bg-main/50 px-4 py-1 text-center text-[9px] font-black text-text-primary hover:text-brand-blue cursor-pointer uppercase tracking-widest">Close</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* New Client Entry Modal - Integrated Overlay */}
          {showClientForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowClientForm(false)}></div>
              
              <Card className="relative w-full max-w-xl bg-white border border-border-soft rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="bg-table-header px-6 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-4 bg-white/30 rounded-full"></div>
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">New Party Entry</h3>
                  </div>
                  <button onClick={() => setShowClientForm(false)} className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="p-6 flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Party Name</label>
                      <input 
                        type="text"
                        name="name"
                        value={newClientFormData.name}
                        onChange={handleNewClientChange}
                        className="w-full h-10 px-3 bg-bg-main border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                        placeholder="Enter primary business name..."
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Pet Name / Shorthand</label>
                      <input 
                        type="text"
                        name="shortform"
                        value={newClientFormData.shortform}
                        onChange={handleNewClientChange}
                        className="w-full h-10 px-3 bg-bg-main border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30 italic"
                        placeholder="Reference name..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Address Line 1</label>
                      <input 
                        type="text"
                        name="street"
                        value={newClientFormData.street}
                        onChange={handleNewClientChange}
                        className="w-full h-10 px-3 bg-bg-main border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                        placeholder="GIDC, Area or Street"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Address Line 2</label>
                      <input 
                        type="text"
                        name="city"
                        value={newClientFormData.city}
                        onChange={handleNewClientChange}
                        className="w-full h-10 px-3 bg-bg-main border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          name="balance"
                          value={newClientFormData.balance}
                          onChange={handleNewClientChange}
                          className="w-full h-10 pl-6 pr-3 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-black text-brand-blue outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                          placeholder="0.00"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-blue/40">₹</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Internal Remarks</label>
                      <input 
                        type="text"
                        name="remark"
                        value={newClientFormData.remark}
                        onChange={handleNewClientChange}
                        className="w-full h-10 px-3 bg-bg-main border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                        placeholder="Payment cycle, instructions, etc."
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-bg-main/40 flex justify-end items-center gap-4 border-t border-border-soft/60">
                  <button 
                    onClick={() => setShowClientForm(false)}
                    className="px-4 py-2 text-[11px] font-bold text-text-primary hover:text-red-500 transition-all uppercase tracking-[0.1em]"
                  >
                    Cancel
                  </button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveNewClient}
                    disabled={isSavingNewClient}
                    className="px-10 h-10 shadow-lg shadow-brand-blue/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
                  >
                    {isSavingNewClient ? "Saving..." : "Save Party"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Item Entry Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-visible flex flex-col relative z-[50]">
            <div className="bg-table-header h-9 px-4 flex items-center">
              <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">New Item Entry</h3>
            </div>
            
            <div className="p-4 bg-bg-main/20 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-9 gap-3">
                <div className="flex flex-col gap-1 col-span-2 text-left relative" ref={itemRef}>
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Item Name</label>
                  <input 
                    type="text" 
                    name="item"
                    value={currentItem.item}
                    onChange={(e) => {
                      handleEntryChange(e);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue shadow-sm" 
                    placeholder="Start typing item..."
                    autoComplete="off"
                  />
                  {showItemDropdown && (
                    <div className="absolute top-full left-0 right-0 z-[999] mt-1 bg-white border border-border-soft rounded-xl shadow-2xl max-h-[400px] overflow-y-auto">
                       {items
                         .filter(i => i.name.toLowerCase().includes(currentItem.item.toLowerCase()))
                         .map(i => (
                           <div 
                             key={i.id} 
                             onClick={() => handleSelectItem(i)}
                             className="px-4 py-2.5 hover:bg-bg-main cursor-pointer border-b border-border-soft/30 last:border-none group"
                           >
                             <div className="flex justify-between items-center">
                                <span className="text-[13px] font-bold text-text-primary group-hover:text-brand-blue transition-colors uppercase tracking-tight">{i.name}</span>
                                <span className="text-[10px] font-black text-brand-blue ml-2">₹{i.rate}</span>
                             </div>
                             <div className={`text-[10px] font-bold uppercase tracking-widest ${parseFloat(i.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>Stock: {i.stock} {i.unit}</div>
                           </div>
                         ))
                       }
                       <div onClick={() => setShowItemDropdown(false)} className="bg-bg-main/50 px-4 py-1.5 text-center text-[10px] font-black text-text-primary hover:text-brand-blue cursor-pointer uppercase tracking-widest">Close Search</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Stock</label>
                  <div className={`w-full h-9 flex items-center justify-center bg-bg-main border border-border-soft rounded-lg text-[13px] font-bold shadow-inner ${parseFloat(currentItem.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {currentItem.stock}
                  </div>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Qty / Unit</label>
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
                      className="w-20 h-9 px-2 bg-white border border-border-soft rounded-lg text-[11px] font-bold text-text-primary outline-none focus:border-brand-blue cursor-pointer shadow-sm appearance-none"
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
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Rate (₹)</label>
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
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Disc %</label>
                  <input 
                    type="number" 
                    name="dPercent"
                    value={currentItem.dPercent}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-bold text-text-primary text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1 text-center">
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest">Disc (₹)</label>
                  <input 
                    type="number" 
                    name="dAmount"
                    value={currentItem.dAmount}
                    onChange={handleEntryChange}
                    className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[13px] font-bold text-text-primary text-center outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm" 
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <label className="text-[10px] uppercase font-bold text-text-primary tracking-widest opacity-70 mr-1">Total Amount</label>
                  <div className="w-full h-9 flex items-center justify-end px-3 bg-bg-main border border-brand-blue/10 rounded-lg text-[14px] font-black text-brand-blue">
                    ₹{currentItem.total}
                  </div>
                </div>
              </div>

              {/* Action Buttons below inputs */}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-border-soft/50">
                <button 
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-2 px-3.5 h-8 bg-white border border-brand-navy rounded-lg text-[11.5px] font-bold text-text-primary hover:bg-bg-main transition shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  New Item
                </button>

                <div className="flex items-center gap-16">
                  <button 
                    onClick={handleRedoCurrent}
                    className="flex items-center gap-2 px-3.5 h-8 bg-white border border-brand-navy rounded-lg text-[11px] font-bold text-text-primary hover:text-text-primary transition shadow-sm uppercase tracking-wider"
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
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Item Name</label>
                    <input 
                      type="text"
                      name="name"
                      value={newItemFormData.name}
                      onChange={handleNewItemFormChange}
                      className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:text-text-primary/30"
                      placeholder="Enter new item name..."
                      autoFocus
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-5 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Base Rate (₹)</label>
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
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Selling Unit</label>
                      <select 
                        name="unit"
                        value={newItemFormData.unit}
                        onChange={handleNewItemFormChange}
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
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Conversion</label>
                      <input 
                        type="number"
                        name="conversion"
                        value={newItemFormData.conversion}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[12.5px] font-medium text-text-primary outline-none focus:border-brand-blue transition-all"
                        placeholder="1"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Opening Stock</label>
                      <input 
                        type="number"
                        name="stock"
                        value={newItemFormData.stock}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-brand-blue outline-none focus:border-brand-blue transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Min Stock</label>
                      <input 
                        type="number"
                        name="min_stock"
                        value={newItemFormData.min_stock}
                        onChange={handleNewItemFormChange}
                        className="w-full h-11 px-4 bg-bg-main border border-border-soft rounded-lg text-[13.5px] font-bold text-red-500 outline-none focus:border-brand-blue transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-bg-main/40 flex justify-end items-center gap-4 border-t border-border-soft/60 mt-4">
                  <button 
                    onClick={handleRedoNewItem}
                    className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold text-text-primary hover:text-text-primary transition-all uppercase tracking-widest border border-brand-navy rounded-xl"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    REDO
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

          {/* Invoice Summary Section - With Far Left Actions and In-place Edits */}
          {addedItems.length > 0 && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-brand-blue rounded-full"></div>
                  <h3 className="text-[11px] font-bold text-brand-blue uppercase tracking-widest">Invoice Summary</h3>
                </div>
                <div className="text-[10px] font-bold text-text-primary opacity-50 uppercase tracking-widest bg-bg-main px-2 py-0.5 rounded border border-border-soft">
                  {addedItems.length} {addedItems.length === 1 ? 'Item' : 'Items'} Ready to Bill
                </div>
              </div>
              
              <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-table-header h-9 text-white text-[10px] uppercase font-bold tracking-[0.15em]">
                      <th className="px-5 text-left border-r border-white/10">Item Detail</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Quantity</th>
                      <th className="px-5 text-center border-r border-white/10 w-24">Unit</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Rate</th>
                      <th className="px-5 text-center border-r border-white/10 w-20">Disc %</th>
                      <th className="px-5 text-center border-r border-white/10 w-28">Disc (₹)</th>
                      <th className="px-5 text-right border-r border-white/10 w-36">Total Amount</th>
                      <th className="px-4 text-center w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/50">
                    {addedItems.map((item, idx) => (
                      <tr key={item.id} className={`hover:bg-bg-main/30 group transition-colors duration-75 ${editingId === item.id ? 'bg-brand-blue/[0.03]' : ''}`}>
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
                              className="bg-white border border-brand-blue/20 rounded px-1 py-0.5 text-[11px] font-bold text-text-primary outline-none"
                            >
                              <option value="GMS">GMS</option>
                              <option value="BUNDLE">BUNDLE</option>
                              <option value="GROSS">GROSS</option>
                              <option value="SET">SET</option>
                              <option value="PCS">PCS</option>
                              <option value="DOZ">DOZ</option>
                            </select>
                          ) : (
                            <span className="text-text-primary font-bold text-[11px]">{item.unit}</span>
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
                            <span className="text-text-primary text-[12.5px] font-medium">₹{item.rate}</span>
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
                            <span className="text-text-primary text-[11px] font-bold">{item.dPercent}%</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-center border-r border-border-soft/50 font-bold text-text-primary text-[11px]">
                           {editingId === item.id ? (
                            <input 
                              type="number"
                              value={item.dAmount}
                              onChange={(e) => handleSummaryRowChange(item.id, 'dAmount', e.target.value)}
                              className="w-20 bg-white border border-brand-blue/20 rounded px-2 py-0.5 text-[11px] font-bold text-center outline-none"
                            />
                          ) : (
                            <span>₹{item.dAmount}</span>
                          )}
                        </td>
                        <td className="px-5 py-2 text-right border-r border-border-soft/50 bg-bg-main/10 font-black text-text-primary text-[13px]">
                          ₹{item.total}
                        </td>
                        <td className="px-4 py-2 text-center">
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
                               onClick={() => openDeleteModal(item.id)}
                              className="p-1.5 text-text-primary hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                              title="Delete Row"
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
              
              {/* Extra Charges, Discounts & Totals Section */}
              <div className="flex gap-6 mt-4">
                {/* Left Side: Remarks */}
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-1">Invoice Remarks</label>
                  <textarea 
                    name="long_remark"
                    value={formData.long_remark}
                    onChange={handleFormChange}
                    className="w-full h-full min-h-[180px] px-4 py-3 bg-white border border-border-soft rounded-xl text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none"
                    placeholder="Enter detailed customer notes, terms, or internal billing details..."
                  />
                </div>

                {/* Right Side: Totals Stack */}
                <div className="w-full md:w-80 bg-white border border-border-soft rounded-xl p-4 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Total Amount</label>
                    <span className="text-[14px] font-bold text-text-primary">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Transport (₹)</label>
                    <input 
                      type="number"
                      name="transport"
                      value={formData.transport}
                      onChange={handleFormChange}
                      className="w-28 h-8 px-3 bg-bg-main/30 border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary text-right outline-none focus:border-brand-blue transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Packing (₹)</label>
                    <input 
                      type="number"
                      name="packing"
                      value={formData.packing}
                      onChange={handleFormChange}
                      className="w-28 h-8 px-3 bg-bg-main/30 border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary text-right outline-none focus:border-brand-blue transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2 bg-bg-main/20 p-2 rounded-lg border border-border-soft/50">
                    <label className="text-[9px] font-black text-text-primary uppercase tracking-[0.2em]">Discount</label>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 relative">
                          <input 
                            type="number"
                            name="extraDiscountPercent"
                            value={formData.extraDiscountPercent}
                            onChange={handleSummaryFieldChange}
                            className="w-full h-8 pl-3 pr-6 bg-white border border-border-soft rounded-lg text-[12px] font-bold text-text-primary outline-none focus:border-brand-blue transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-primary opacity-40">%</span>
                       </div>
                       <div className="flex-1 relative">
                          <input 
                            type="number"
                            name="extraDiscountAmount"
                            value={formData.extraDiscountAmount}
                            onChange={handleSummaryFieldChange}
                            className="w-full h-8 pl-6 pr-3 bg-white border border-border-soft rounded-lg text-[12px] font-bold text-text-primary text-right outline-none focus:border-brand-blue transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-primary opacity-40">₹</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Round Off</label>
                    <input 
                      type="text"
                      readOnly
                      value={roundOffDisplay}
                      className="w-28 h-8 px-3 bg-bg-main/50 border border-border-soft rounded-lg text-[12.5px] font-bold text-brand-blue text-right outline-none cursor-default shadow-inner"
                    />
                  </div>

                  <div className="mt-2 pt-4 border-t border-dashed border-border-soft flex items-center justify-between px-1">
                    <label className="text-[12px] font-black text-brand-blue uppercase tracking-widest">Grand Total</label>
                    <div className="text-[20px] font-black text-brand-blue">
                      ₹{grandTotal}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1 h-10 text-[11px] font-bold uppercase tracking-widest"
                        onClick={() => navigate('/order-summary')}
                      >
                        Cancel
                      </Button>
                      <button 
                        onClick={handleSaveAndPrint}
                        className="flex-1 h-10 bg-white border-2 border-brand-blue text-brand-blue rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Save & Print
                      </button>
                    </div>
                    <Button 
                      variant="primary" 
                      className="w-full h-12 text-[13px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-blue/20"
                      onClick={handleFinalSave}
                    >
                      {isEditMode ? "Update Invoice" : "Save Invoice"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Print Component — rendered only when isPrinting is true */}
          {isPrinting && (
            <PrintInvoice 
              data={{
                ...formData,
                itemsSubtotal,
                grandTotal,
                roundOffDisplay
              }} 
              items={addedItems} 
              printCopies={printCopies}
            />
          )}

          <PrintCopiesModal 
            isOpen={showPrintModal} 
            onClose={() => setShowPrintModal(false)} 
            onPrint={() => {
              setShowPrintModal(false);
              setIsPrinting(true);
            }} 
            printCopies={printCopies} 
            setPrintCopies={setPrintCopies} 
          />

          {/* Secure Delete Confirmation Modal */}
          <DeleteModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteItem}
            password={deletePassword}
            setPassword={setDeletePassword}
            error={deleteError}
            message="You are about to remove an item from this invoice. This action cannot be undone."
          />
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

export default CreateInvoice;
