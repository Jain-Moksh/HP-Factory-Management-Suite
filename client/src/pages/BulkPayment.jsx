import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import SearchableSelect from '../components/UI/SearchableSelect';
import { API_BASE_URL } from '../config';

const BulkPayment = () => {
  const navigate = useNavigate();
  
  // Common Settings
  const [transactionType, setTransactionType] = useState('PAYMENT'); // 'PAYMENT', 'REPLACE', 'DISCOUNT'
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Rows Data
  const [rows, setRows] = useState([
    { id: Date.now(), partyId: '', amount: '', remarks: '', paymentMode: 'Cash', outstanding: 0, isLoadingOutstanding: false, closingBalance: 0 }
  ]);
  
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients and jobbers for options
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

  // Fetch outstanding for a specific row when party changes
  const fetchOutstanding = async (rowIndex, partyIdStr) => {
    if (!partyIdStr) {
      setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, outstanding: 0, closingBalance: 0 - (parseFloat(r.amount) || 0) } : r));
      return;
    }

    setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, isLoadingOutstanding: true } : r));
    
    try {
      const parts = partyIdStr.split('_');
      const type = parts[0].toUpperCase();
      const id = parts[1];

      const res = await fetch(`${API_BASE_URL}/party-transactions/outstanding?partyType=${type}&partyId=${id}`);
      const json = await res.json();
      if (json.success) {
        const outAmt = json.data.currentOutstanding;
        setRows(prev => prev.map((r, i) => {
          if (i === rowIndex) {
            const parsedAmt = parseFloat(r.amount) || 0;
            return { ...r, outstanding: outAmt, closingBalance: outAmt - parsedAmt, isLoadingOutstanding: false };
          }
          return r;
        }));
      } else {
        setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, isLoadingOutstanding: false } : r));
      }
    } catch (err) {
      console.error('Error fetching outstanding:', err);
      setRows(prev => prev.map((r, i) => i === rowIndex ? { ...r, isLoadingOutstanding: false } : r));
    }
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), partyId: '', amount: '', remarks: '', paymentMode: 'Cash', outstanding: 0, isLoadingOutstanding: false, closingBalance: 0 }]);
  };

  const removeRow = (idToRemove) => {
    if (rows.length === 1) return; // Always keep at least one row
    setRows(rows.filter(r => r.id !== idToRemove));
  };

  const handleRowChange = (index, field, value) => {
    setRows(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      
      if (field === 'partyId') {
        // Trigger outstanding fetch
        setTimeout(() => fetchOutstanding(index, value), 0);
      } else if (field === 'amount') {
        const parsedAmt = parseFloat(value) || 0;
        newRows[index].closingBalance = newRows[index].outstanding - parsedAmt;
      }
      
      return newRows;
    });
  };

  const handleSaveBulk = async () => {
    setError('');
    setSuccess(false);

    // Filter out rows that are completely empty
    const filledRows = rows.filter(r => r.partyId || r.amount || r.remarks);

    if (filledRows.length === 0) {
      setError('Please add at least one party transaction.');
      return;
    }

    const partyKeys = new Set();
    const payloadTransactions = [];

    for (let i = 0; i < filledRows.length; i++) {
      const row = filledRows[i];
      if (!row.partyId) {
        setError(`Row ${i + 1}: Please select a Party Name / Jobber.`);
        return;
      }
      const amt = parseFloat(row.amount);
      if (isNaN(amt) || amt <= 0) {
        setError(`Row ${i + 1}: Please enter a valid amount greater than 0.`);
        return;
      }
      if (partyKeys.has(row.partyId)) {
        setError(`Row ${i + 1}: Duplicate party selected. A party can only have one entry per bulk request.`);
        return;
      }
      partyKeys.add(row.partyId);

      const parts = row.partyId.split('_');
      payloadTransactions.push({
        partyType: parts[0].toUpperCase(),
        partyId: parseInt(parts[1]),
        amount: amt,
        paymentMode: row.paymentMode,
        remark: row.remarks
      });
    }

    setIsSubmitting(true);

    try {
      const payload = {
        transactionType,
        date,
        transactions: payloadTransactions
      };

      const response = await fetch(`${API_BASE_URL}/party-transactions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      
      if (json.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigate('/payment');
        }, 1500);
      } else {
        setError(json.error || 'Failed to save bulk payment.');
      }
    } catch (err) {
      console.error('Error saving bulk payment:', err);
      setError('Network error: failed to connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const headerInfo = {
    title: 'Bulk Payment',
    subtitle: 'RECORD MULTIPLE TRANSACTIONS EFFICIENTLY'
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-24">
        <PageHeader 
          title={headerInfo.title}
          subtitle={headerInfo.subtitle} 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {error && (
            <div className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-left uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-left uppercase tracking-tight animate-in fade-in slide-in-from-top-1 duration-200">
              🎉 Bulk {transactionType.toLowerCase()} saved successfully! Redirecting...
            </div>
          )}

          {/* Common Settings Card */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm">
            <h2 className="text-[11px] font-black text-text-primary uppercase tracking-widest mb-4 pb-2 border-b border-border-soft">Common Settings</h2>
            
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex-1 flex p-1 bg-bg-main rounded-xl border border-border-soft shadow-sm max-w-[300px]">
                <button 
                  onClick={() => setTransactionType('PAYMENT')}
                  className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'PAYMENT' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
                >
                  Payment
                </button>
                <button 
                  onClick={() => setTransactionType('REPLACE')}
                  className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'REPLACE' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
                >
                  Replace
                </button>
                <button 
                  onClick={() => setTransactionType('DISCOUNT')}
                  className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-widest transition-all ${transactionType === 'DISCOUNT' ? 'bg-white text-brand-blue shadow-sm border border-border-soft/30' : 'text-text-primary hover:text-brand-blue'}`}
                >
                  Discount
                </button>
              </div>

              <div className="flex flex-col gap-1 w-48">
                <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                />
              </div>
            </div>
          </Card>

          {/* Bulk Rows */}
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <Card key={row.id} className="p-4 bg-white border-border-soft/60 shadow-sm relative group overflow-hidden">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  
                  {/* Party Selection */}
                  <div className="flex flex-col gap-1 flex-[2] w-full relative h-full">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">
                        Party Name / Jobber <span className="text-red-500">*</span>
                      </label>
                    </div>
                    <SearchableSelect 
                      options={options}
                      value={row.partyId}
                      onChange={(val) => handleRowChange(index, 'partyId', val)}
                      placeholder="Search Party / Jobber Database..."
                      className="w-full z-20"
                    />
                    
                    {/* Payment Mode Selector specifically for PAYMENT type */}
                    {transactionType === 'PAYMENT' && (
                      <div className="mt-3 flex gap-2 items-center w-full">
                        <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5 whitespace-nowrap">Mode:</label>
                        <div className="flex p-0.5 bg-bg-main rounded-lg border border-border-soft h-8 shrink-0 flex-1">
                          <button 
                            onClick={() => handleRowChange(index, 'paymentMode', 'Cash')}
                            className={`flex-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${row.paymentMode === 'Cash' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                          >
                            Cash
                          </button>
                          <button 
                            onClick={() => handleRowChange(index, 'paymentMode', 'Bank')}
                            className={`flex-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${row.paymentMode === 'Bank' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-primary hover:text-text-primary'}`}
                          >
                            Bank
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financials Column */}
                  <div className="flex flex-col gap-2 flex-1 w-full min-w-[200px] border-l border-border-soft/50 pl-4 h-full">
                    {/* Amount Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        value={row.amount}
                        onChange={(e) => handleRowChange(index, 'amount', e.target.value)}
                        className="w-full h-9 px-3 bg-white border border-brand-blue/30 rounded-lg text-[15px] font-black text-brand-blue outline-none focus:border-brand-blue transition-all shadow-sm"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Balances Display */}
                    {row.partyId && (
                      <div className="flex flex-row gap-4 justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold text-text-light uppercase tracking-widest leading-none mb-0.5">Pending</span>
                          {row.isLoadingOutstanding ? (
                            <span className="text-[11px] font-black text-brand-blue animate-pulse">...</span>
                          ) : (
                            <span className="text-[11px] font-black text-red-500">
                              ₹{row.outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] font-bold text-text-light uppercase tracking-widest leading-none mb-0.5">Closing</span>
                          <span className="text-[11px] font-black text-text-primary">
                            ₹{row.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="flex flex-col gap-1 flex-[2] w-full h-full">
                    <label className="text-[10px] font-bold text-text-primary uppercase tracking-widest ml-0.5">Remarks</label>
                    <textarea 
                      value={row.remarks}
                      onChange={(e) => handleRowChange(index, 'remarks', e.target.value)}
                      className="w-full flex-1 min-h-[60px] px-3 py-2 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all shadow-sm placeholder:italic placeholder:opacity-40 resize-none"
                      placeholder="Cheque details or notes..."
                    />
                  </div>

                  {/* Remove Action */}
                  <div className="flex items-center justify-center shrink-0 w-10">
                    <button 
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="p-2 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-light"
                      title="Remove Row"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center mt-2">
            <button 
              onClick={addRow}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-dashed border-brand-blue text-brand-blue rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-brand-blue/5 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Another Party
            </button>
          </div>
        </div>

        {/* Fixed Footer for Save Action */}
        <div className="fixed bottom-0 left-0 right-0 md:pl-64 bg-white border-t border-border-soft p-4 flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <button 
            onClick={() => navigate('/payment')}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all"
          >
            Discard
          </button>
          <button 
            onClick={handleSaveBulk}
            disabled={success || isSubmitting}
            className="flex items-center gap-2 px-8 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 transition transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Bulk Payment'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BulkPayment;
