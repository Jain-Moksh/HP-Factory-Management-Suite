import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import SearchableSelect from '../components/UI/SearchableSelect';
import { API_BASE_URL } from '../config';

const CreatePayment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [originalTransactionType, setOriginalTransactionType] = useState('');
  const [originalDate, setOriginalDate] = useState('');
  const [originalChallanNo, setOriginalChallanNo] = useState('');

  const [transactionType, setTransactionType] = useState('PAYMENT'); // 'PAYMENT', 'REPLACE', 'DISCOUNT'
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyId: '', // client_[id] or jobber_[id]
    amount: '',  // Represents amountPaid, amountReturned, or discountAmount
    paymentMode: 'Cash', // Bank or Cash (for Payment mode)
    remarks: ''
  });

  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextChallan, setNextChallan] = useState('');

  // Dynamic outstanding balance state
  const [outstandingData, setOutstandingData] = useState({
    openingAmount: 0,
    totalBilling: 0,
    totalPayments: 0,
    totalReturns: 0,
    totalDiscounts: 0,
    currentOutstanding: 0
  });
  const [isOutstandingLoading, setIsOutstandingLoading] = useState(false);

  // History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [modalPartyName, setModalPartyName] = useState('');
  const [modalPartyType, setModalPartyType] = useState('');

  // Fetch clients and jobbers from the backend API to populate Party Name / Jobber select options
  useEffect(() => {
    const fetchPartiesAndJobbers = async () => {
      try {
        const [clientsRes, jobbersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/clients`),
          fetch(`${API_BASE_URL}/jobbers`)
        ]);
        const clientsJson = await clientsRes.json();
        const jobbersJson = await jobbersRes.json();
        
        let clientOptions = [];
        let jobberOptions = [];
        
        if (clientsJson.success && Array.isArray(clientsJson.data)) {
          clientOptions = clientsJson.data.map(c => ({
            id: `client_${c.id}`,
            name: c.name,
            shortform: c.shortform || '',
            type: 'client',
            originalId: c.id
          }));
        }
        
        if (jobbersJson.success && Array.isArray(jobbersJson.data)) {
          jobberOptions = jobbersJson.data.map(j => ({
            id: `jobber_${j.id}`,
            name: j.name,
            shortform: '',
            type: 'jobber',
            originalId: j.id
          }));
        }
        
        setOptions([...clientOptions, ...jobberOptions]);
      } catch (err) {
        console.error("Error fetching parties/jobbers:", err);
      }
    };
    
    fetchPartiesAndJobbers();
  }, []);

  // Fetch existing transaction details in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const fetchTransaction = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/party-transactions/${id}`);
          const result = await response.json();
          if (result.success) {
            const tx = result.data;
            setTransactionType(tx.transaction_type);
            setOriginalTransactionType(tx.transaction_type);
            setOriginalDate(tx.date);
            setOriginalChallanNo(tx.challan_no);

            // Capitalize paymentMode to match Toggle casing (e.g. BANK -> Bank)
            let initialPaymentMode = 'Cash';
            if (tx.payment_mode) {
              initialPaymentMode = tx.payment_mode.charAt(0).toUpperCase() + tx.payment_mode.slice(1).toLowerCase();
            }

            setFormData({
              date: tx.date,
              partyId: `${tx.party_type.toLowerCase()}_${tx.party_id}`,
              amount: tx.amount.toString(),
              paymentMode: initialPaymentMode,
              remarks: tx.remark || ''
            });
          } else {
            setError(result.error || 'Failed to fetch transaction details.');
          }
        } catch (err) {
          console.error('Error fetching transaction:', err);
          setError('Network error: failed to fetch transaction details.');
        }
      };
      fetchTransaction();
    }
  }, [id, isEditMode]);

  // Fetch outstanding balance dynamically when party changes
  useEffect(() => {
    if (!formData.partyId) {
      setOutstandingData({
        openingAmount: 0,
        totalBilling: 0,
        totalPayments: 0,
        totalReturns: 0,
        totalDiscounts: 0,
        currentOutstanding: 0
      });
      return;
    }

    const fetchOutstanding = async () => {
      setIsOutstandingLoading(true);
      setError('');
      try {
        const parts = formData.partyId.split('_');
        const type = parts[0].toUpperCase(); // 'CLIENT' or 'JOBBER'
        const id = parts[1];

        const res = await fetch(`${API_BASE_URL}/party-transactions/outstanding?partyType=${type}&partyId=${id}`);
        const json = await res.json();
        if (json.success) {
          setOutstandingData(json.data);
        } else {
          setError(json.error || 'Failed to fetch outstanding balance.');
        }
      } catch (err) {
        console.error('Error fetching outstanding:', err);
        setError('Network error: failed to fetch outstanding.');
      } finally {
        setIsOutstandingLoading(false);
      }
    };

    fetchOutstanding();
  }, [formData.partyId]);

  // Fetch next generated/reserved challan number when type or date changes
  useEffect(() => {
    const fetchChallan = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/party-transactions/next-challan?transactionType=${transactionType}&date=${formData.date}`);
        const result = await response.json();
        if (result.success) {
          setNextChallan(result.challan_no);
        }
      } catch (err) {
        console.error('Error fetching next challan:', err);
      }
    };
    fetchChallan();
  }, [transactionType, formData.date]);

  const handleOpenHistory = async () => {
    if (!formData.partyId) return;

    // Resolve clean party name and type immediately from list of options
    const selectedOption = options.find(opt => opt.id === formData.partyId);
    const cleanName = selectedOption ? selectedOption.name.replace(/\s*\[(CLIENT|JOBBER)\]\s*$/i, '') : 'Unknown';
    const partyType = selectedOption ? selectedOption.type.toUpperCase() : 'CLIENT';

    setModalPartyName(cleanName);
    setModalPartyType(partyType);
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    setHistoryError('');
    setHistoryData(null);

    try {
      const parts = formData.partyId.split('_');
      const id = parts[1];

      // Calculate dynamic date boundaries in server/local time
      const today = new Date();
      const prevMonthFirstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const fromDate = formatDate(prevMonthFirstDay);
      const toDate = formatDate(today);

      const res = await fetch(`${API_BASE_URL}/party-transactions/history?partyType=${partyType}&partyId=${id}&from=${fromDate}&to=${toDate}`);
      const json = await res.json();
      if (json.success) {
        setHistoryData(json.data);
      } else {
        setHistoryError(json.error || 'Failed to fetch transaction history.');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryError('Network error: failed to fetch transaction history.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setHistoryData(null);
    setHistoryError('');
    setModalPartyName('');
    setModalPartyType('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePaymentMode = (mode) => {
    setFormData(prev => ({ ...prev, paymentMode: mode }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);

    if (!formData.partyId) {
      setError('Please select a Party Name / Jobber.');
      return;
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const parts = formData.partyId.split('_');
      const partyType = parts[0].toUpperCase(); // 'CLIENT' or 'JOBBER'
      const partyId = parseInt(parts[1]);

      const payload = {
        partyType,
        partyId,
        transactionType,
        date: formData.date,
        amount: amt,
        paymentMode: transactionType === 'PAYMENT' ? formData.paymentMode : null,
        remark: formData.remarks
      };

      const url = isEditMode 
        ? `${API_BASE_URL}/party-transactions/${id}`
        : `${API_BASE_URL}/party-transactions`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      
      if (json.success) {
        setSuccess(true);
        // Redirect to payments lists after success
        setTimeout(() => {
          setSuccess(false);
          navigate('/payment');
        }, 1500);
      } else {
        setError(json.error || `Failed to ${isEditMode ? 'update' : 'save'} transaction.`);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Network error: failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPartyIdentified = !!formData.partyId;
  const openingPendingBalance = outstandingData.currentOutstanding;
  const parsedAmount = parseFloat(formData.amount) || 0;
  const closingBalance = openingPendingBalance - parsedAmount;

  const getHeaderInfo = () => {
    const prefix = isEditMode ? "Edit" : "Create";
    switch (transactionType) {
      case 'PAYMENT':
        return {
          title: `${prefix} Payment`,
          subtitle: isEditMode 
            ? "MODIFY EXISTING TRANSACTION DETAILS AND BALANCES" 
            : "RECORD NEW JOBBER PAYMENT AND TRACK PENDING SETTLEMENTS"
        };
      case 'REPLACE':
        return {
          title: `${prefix} Replace`,
          subtitle: isEditMode 
            ? "MODIFY EXISTING REPLACE TRANSACTION AND BALANCES"
            : "RECORD JOBBER GOODS REPLACE AND OUTSTANDING SETTLEMENTS"
        };
      case 'DISCOUNT':
        return {
          title: `${prefix} Discount`,
          subtitle: isEditMode 
            ? "MODIFY EXISTING DISCOUNT ADJUSTMENT AND BALANCES"
            : "RECORD PARTY DISCOUNT AND ADJUST BALANCES"
        };
      default:
        return {
          title: `${prefix} Payment`,
          subtitle: "RECORD NEW JOBBER PAYMENT AND TRACK PENDING SETTLEMENTS"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const displayedChallan = isEditMode && transactionType === originalTransactionType && formData.date === originalDate
    ? originalChallanNo
    : nextChallan;

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title={headerInfo.title}
          subtitle={headerInfo.subtitle} 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Transaction Type Segmented Toggle */}
          <div className="flex p-1 bg-bg-main rounded-xl border border-border-soft w-full md:max-w-md mx-auto mb-1 shadow-sm">
            <button 
              onClick={() => {
                setTransactionType('PAYMENT');
                setError('');
                setSuccess(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'PAYMENT' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
            >
              Payment
            </button>
            <button 
              onClick={() => {
                setTransactionType('REPLACE');
                setError('');
                setSuccess(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'REPLACE' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
            >
              Replace
            </button>
            <button 
              onClick={() => {
                setTransactionType('DISCOUNT');
                setError('');
                setSuccess(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'DISCOUNT' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
            >
              Discount
            </button>
          </div>

          {/* Validation & Success Feedbacks */}
          {error && (
            <div className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-left uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-left uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200">
              🎉 {transactionType} {isEditMode ? 'updated' : 'saved'} successfully! Redirecting...
            </div>
          )}

          {/* Box 1: Identification - Common Header */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Challan No</label>
                <div className="w-full h-9 px-3 bg-bg-main/50 border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary flex items-center shadow-sm select-none">
                  {displayedChallan || 'Loading...'}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Date</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2 text-left relative">
                <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Party Name / Jobber</label>
                <SearchableSelect 
                  options={options}
                  value={formData.partyId}
                  onChange={(val) => setFormData(prev => ({ ...prev, partyId: val }))}
                  placeholder="Search Party / Jobber Database..."
                  className="w-full"
                  disabled={isEditMode}
                />
              </div>
            </div>
          </Card>

          {/* Box 2: Payment/Return/Discount Details - High Density Financial Zone */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm overflow-hidden min-h-[140px] relative">
            <div className={`flex flex-col gap-5 transition-all duration-300 ${isPartyIdentified && !isOutstandingLoading ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
              <div className="flex items-center justify-between border-b border-border-soft/50 pb-3">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[9px] font-bold text-text-primary uppercase tracking-[0.15em]">Opening Pending Amount</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-black text-red-500 tracking-tight leading-none">
                      ₹{openingPendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenHistory}
                      className="px-2 py-0.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-[9.5px] font-black uppercase tracking-widest rounded transition active:scale-95 shadow-sm shadow-brand-blue/10 flex items-center justify-center cursor-pointer ml-1"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5 text-left">
                    {transactionType === 'PAYMENT' && 'AMOUNT PAID (₹)'}
                    {transactionType === 'REPLACE' && 'REPLACE AMOUNT (₹)'}
                    {transactionType === 'DISCOUNT' && 'DISCOUNT AMOUNT (₹)'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="flex-1 h-9 px-3 bg-white border border-brand-blue/30 rounded-lg text-[15px] font-black text-brand-blue outline-none focus:border-brand-blue transition-all shadow-sm"
                      placeholder="0.00"
                    />
                    
                    {/* Bank / Cash Toggle - ONLY for PAYMENT mode */}
                    {transactionType === 'PAYMENT' && (
                      <div className="flex p-0.5 bg-bg-main rounded-lg border border-border-soft h-9 shrink-0">
                        <button 
                          onClick={() => togglePaymentMode('Cash')}
                          className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Cash' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                        >
                          Cash
                        </button>
                        <button 
                          onClick={() => togglePaymentMode('Bank')}
                          className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Bank' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                        >
                          Bank
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <div className="text-right pr-4 border-r border-border-soft/50 mr-4 h-8 flex flex-col justify-center">
                    <div className="text-[8px] font-bold text-text-primary uppercase tracking-widest opacity-60">Adjustment</div>
                    <div className="text-xs font-bold text-text-primary leading-none">- ₹{parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div className="text-right flex flex-col justify-center h-8">
                    <div className="text-[9px] font-bold text-text-primary uppercase tracking-[0.15em] mb-0.5">Closing Balance</div>
                    <div className="text-base font-black text-text-primary leading-none">
                      ₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isPartyIdentified && isOutstandingLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-bounce"></div>
                  Loading outstanding details...
                </span>
              </div>
            )}

            {!isPartyIdentified && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
                <span className="bg-white px-3 py-1.5 rounded border border-border-soft shadow-lg text-[10px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-ping"></div>
                  Identify Party to access Ledger
                </span>
              </div>
            )}
          </Card>

          {/* Footer Section: Remarks beside Actions */}
          <div className="flex flex-row gap-4 items-start mt-1 pb-12 animate-in fade-in duration-700">
            <div className="flex-[3] relative group">
              <label className="absolute -top-2 left-3 px-1.5 bg-[#f8fafc] text-[9px] font-bold text-text-primary uppercase tracking-widest group-focus-within:text-brand-blue transition-colors z-10">
                {transactionType === 'PAYMENT' && 'Internal Payment Remarks'}
                {transactionType === 'REPLACE' && 'Internal Replace Remarks'}
                {transactionType === 'DISCOUNT' && 'Internal Discount Remarks'}
              </label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="w-full h-[84px] px-4 py-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none pt-3"
                placeholder="Cheque details, transaction reference, book adjust vouchers, or notes..."
              />
            </div>
            
            <div className="flex-1 flex flex-col gap-2 min-h-[84px]">
              <button 
                onClick={handleSave}
                disabled={success || isSubmitting}
                className="flex-1 flex items-center justify-center bg-brand-blue rounded-lg text-[12px] font-bold text-white hover:bg-brand-blue-hover transition transform active:scale-95 shadow-md shadow-brand-blue/10 uppercase tracking-widest px-4 h-9 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {transactionType === 'PAYMENT' && (isEditMode ? 'UPDATE PAYMENT' : 'SAVE PAYMENT')}
                {transactionType === 'REPLACE' && (isEditMode ? 'UPDATE REPLACE' : 'SAVE REPLACE')}
                {transactionType === 'DISCOUNT' && (isEditMode ? 'UPDATE DISCOUNT' : 'SAVE DISCOUNT')}
              </button>
              <button 
                onClick={() => navigate('/payment')}
                className="h-8 flex items-center justify-center bg-white border border-border-soft rounded-lg text-[10.5px] font-bold text-text-primary hover:text-red-500 hover:bg-red-50 transition uppercase tracking-widest shadow-sm"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View-Only History Modal Portal */}
      {isHistoryOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 transition-opacity animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] cursor-pointer" 
            onClick={handleCloseHistory}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
            
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] bg-brand-blue/10 text-brand-blue">
                  HS
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider leading-none mb-1">
                    {modalPartyType === 'CLIENT' ? 'Client Transaction History' : 'Jobber Transaction History'}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    Party: {modalPartyName || 'Loading...'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleCloseHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 text-slate-600">
              {isHistoryLoading && (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[12px] font-bold text-text-light uppercase tracking-widest">Fetching transaction history...</span>
                </div>
              )}

              {historyError && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 text-red-500">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-[12px] font-black uppercase tracking-wider">{historyError}</p>
                </div>
              )}

              {!isHistoryLoading && !historyError && historyData && (
                <div className="flex flex-col gap-6 text-[12px]">
                  {/* Summary row */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Name</span>
                      <span className="text-[14px] font-black text-slate-800 uppercase tracking-tight">{historyData.partyName}</span>
                    </div>
                    <div className="flex flex-col sm:text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Outstanding</span>
                      <span className="text-[16px] font-black text-red-500">
                        ₹{historyData.currentOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* History Table */}
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Historical Ledger
                    </h4>
                    <div className="border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                            <th className="px-4 py-2 text-left">Challan No</th>
                            <th className="px-4 py-2 text-center w-36">Challan Type</th>
                            <th className="px-4 py-2 text-center w-36">Date</th>
                            <th className="px-4 py-2 text-right w-40">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historyData.history && historyData.history.length > 0 ? (
                            historyData.history.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-bold text-slate-800 uppercase tracking-tight">
                                  {row.challan_no}
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9.5px] tracking-wider font-extrabold uppercase ${
                                    row.transaction_type === 'BILLING' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    row.transaction_type === 'PAYMENT' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    row.transaction_type === 'REPLACE' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    row.transaction_type === 'DISCOUNT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    'bg-slate-50 text-slate-700 border border-slate-200'
                                  }`}>
                                    {row.transaction_type === 'BILLING' ? 'SALES' : row.transaction_type}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center font-bold text-slate-600">
                                  {row.date && row.date !== '—' ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right font-black text-brand-blue">
                                  ₹{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-slate-400 italic font-medium animate-pulse">
                                No transaction history found for the current and previous month.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={handleCloseHistory}
                className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold uppercase rounded-lg active:scale-95 transition-all text-[11px] tracking-widest cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Layout>
  );
};

export default CreatePayment;
