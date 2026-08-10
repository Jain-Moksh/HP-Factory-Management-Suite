import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import SearchableSelect from '../components/UI/SearchableSelect';
import { API_BASE_URL } from '../config';

const CreatePayment = () => {
  const navigate = useNavigate();

  const [transactionType, setTransactionType] = useState('PAYMENT'); // 'PAYMENT', 'RETURN', 'DISCOUNT'
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyId: '', // client_[id] or jobber_[id]
    amount: '',  // Represents amountPaid, amountReturned, or discountAmount
    paymentMode: 'Bank', // Bank or Cash (for Payment mode)
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
            name: `${c.name} [CLIENT]`,
            shortform: c.shortform || '',
            type: 'client',
            originalId: c.id
          }));
        }
        
        if (jobbersJson.success && Array.isArray(jobbersJson.data)) {
          jobberOptions = jobbersJson.data.map(j => ({
            id: `jobber_${j.id}`,
            name: `${j.name} [JOBBER]`,
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

      const response = await fetch(`${API_BASE_URL}/party-transactions`, {
        method: 'POST',
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
        setError(json.error || 'Failed to save transaction.');
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

  // Dynamic header strings based on selected transaction mode
  const getHeaderInfo = () => {
    switch (transactionType) {
      case 'PAYMENT':
        return {
          title: "Create Payment",
          subtitle: "RECORD NEW JOBBER PAYMENT AND TRACK PENDING SETTLEMENTS"
        };
      case 'RETURN':
        return {
          title: "Create Return",
          subtitle: "RECORD JOBBER GOODS RETURN AND OUTSTANDING SETTLEMENTS"
        };
      case 'DISCOUNT':
        return {
          title: "Create Discount",
          subtitle: "RECORD PARTY DISCOUNT AND ADJUST BALANCES"
        };
      default:
        return {
          title: "Create Payment",
          subtitle: "RECORD NEW JOBBER PAYMENT AND TRACK PENDING SETTLEMENTS"
        };
    }
  };

  const headerInfo = getHeaderInfo();

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
                setTransactionType('RETURN');
                setError('');
                setSuccess(false);
              }}
              className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'RETURN' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
            >
              Return
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
              🎉 {transactionType} saved successfully! Redirecting...
            </div>
          )}

          {/* Box 1: Identification - Common Header */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Challan No</label>
                <div className="w-full h-9 px-3 bg-bg-main/50 border border-border-soft rounded-lg text-[12.5px] font-bold text-text-primary flex items-center shadow-sm select-none">
                  {nextChallan || 'Loading...'}
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
                />
              </div>
            </div>
          </Card>

          {/* Box 2: Payment/Return/Discount Details - High Density Financial Zone */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm overflow-hidden min-h-[140px] relative">
            <div className={`flex flex-col gap-5 transition-all duration-300 ${isPartyIdentified && !isOutstandingLoading ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
              <div className="flex items-center justify-between border-b border-border-soft/50 pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-text-primary uppercase tracking-[0.15em]">Opening Pending Amount</span>
                  <span className="text-lg font-black text-red-500 tracking-tight leading-none">
                    ₹{openingPendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-[9px] font-bold text-brand-blue bg-brand-blue/5 px-2.5 py-1 rounded border border-brand-blue/10 uppercase tracking-widest">
                  Real-time Ledger Sync
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5 text-left">
                    {transactionType === 'PAYMENT' && 'AMOUNT PAID (₹)'}
                    {transactionType === 'RETURN' && 'RETURN AMOUNT (₹)'}
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
                          onClick={() => togglePaymentMode('Bank')}
                          className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Bank' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                        >
                          Bank
                        </button>
                        <button 
                          onClick={() => togglePaymentMode('Cash')}
                          className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Cash' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                        >
                          Cash
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
                {transactionType === 'RETURN' && 'Internal Return Remarks'}
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
                {transactionType === 'PAYMENT' && 'SAVE PAYMENT'}
                {transactionType === 'RETURN' && 'SAVE RETURN'}
                {transactionType === 'DISCOUNT' && 'SAVE DISCOUNT'}
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
    </Layout>
  );
};

export default CreatePayment;
