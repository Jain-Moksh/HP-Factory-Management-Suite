import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const CreatePayment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    challanNo: '',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    amountPaid: '',
    paymentMode: 'Bank', // Bank or Cash
    remarks: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePaymentMode = (mode) => {
    setFormData(prev => ({ ...prev, paymentMode: mode }));
  };

  const handleSave = () => {
    console.log("Saving Payment:", formData);
    navigate('/payment');
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-16">
        <PageHeader 
          title="Create Payment" 
          subtitle="RECORD NEW JOBBER PAYMENT AND TRACK PENDING SETTLEMENTS" 
        />

        <div className="px-6 flex flex-col gap-5 w-full">
          {/* Box 1: Identification - Sleek Uniform Grid */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Challan No</label>
                <input 
                  type="text"
                  name="challanNo"
                  value={formData.challanNo}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2 text-left relative">
                <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Client Name / Jobber</label>
                <input 
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full h-9 px-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-bold text-brand-blue uppercase tracking-tight outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 shadow-sm"
                  placeholder="Search Client Database..."
                />
              </div>
            </div>
          </Card>

          {/* Box 2: Payment Details - High Density Financial Zone */}
          <Card className="p-4 bg-white border-border-soft/60 shadow-sm overflow-hidden min-h-[140px] relative">
            <div className={`flex flex-col gap-5 transition-all duration-300 ${formData.clientName ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
              <div className="flex items-center justify-between border-b border-border-soft/50 pb-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-text-light uppercase tracking-[0.15em]">Opening Pending Amount</span>
                  <span className="text-lg font-black text-red-500 tracking-tight leading-none">₹15,450.00</span>
                </div>
                <div className="text-[9px] font-bold text-brand-blue bg-brand-blue/5 px-2.5 py-1 rounded border border-brand-blue/10 uppercase tracking-widest">
                  Real-time Ledger Sync
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-bold text-text-light uppercase tracking-widest ml-0.5">Amount Paid (₹)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleInputChange}
                      className="flex-1 h-9 px-3 bg-white border border-brand-blue/30 rounded-lg text-[15px] font-black text-brand-blue outline-none focus:border-brand-blue transition-all shadow-sm"
                      placeholder="0.00"
                    />
                    <div className="flex p-0.5 bg-bg-main rounded-lg border border-border-soft h-9 shrink-0">
                      <button 
                        onClick={() => togglePaymentMode('Bank')}
                        className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Bank' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-light hover:text-text-primary'}`}
                      >
                        Bank
                      </button>
                      <button 
                        onClick={() => togglePaymentMode('Cash')}
                        className={`px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Cash' ? 'bg-white text-brand-blue shadow-sm' : 'text-text-light hover:text-text-primary'}`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <div className="text-right pr-4 border-r border-border-soft/50 mr-4 h-8 flex flex-col justify-center">
                    <div className="text-[8px] font-bold text-text-light uppercase tracking-widest opacity-60">Adjustment</div>
                    <div className="text-xs font-bold text-text-secondary leading-none">- ₹{(parseFloat(formData.amountPaid) || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-right flex flex-col justify-center h-8">
                    <div className="text-[9px] font-bold text-text-light uppercase tracking-[0.15em] mb-0.5">Closing Balance</div>
                    <div className="text-base font-black text-text-primary leading-none">₹{(15450 - (parseFloat(formData.amountPaid) || 0)).toLocaleString()}.00</div>
                  </div>
                </div>
              </div>
            </div>

            {!formData.clientName && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
                <span className="bg-white px-3 py-1.5 rounded border border-border-soft shadow-lg text-[10px] font-bold text-text-light uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-ping"></div>
                  Identify Client to access Ledger
                </span>
              </div>
            )}
          </Card>

          {/* Footer Section: Remarks beside Actions - High Efficiency Pattern */}
          <div className="flex flex-row gap-4 items-start mt-1 pb-12 animate-in fade-in duration-700">
            <div className="flex-[3] relative group">
              <label className="absolute -top-2 left-3 px-1.5 bg-[#f8fafc] text-[9px] font-bold text-text-light uppercase tracking-widest group-focus-within:text-brand-blue transition-colors z-10">Internal Payment Remarks</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="w-full h-[84px] px-4 py-3 bg-white border border-border-soft rounded-lg text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none pt-3"
                placeholder="Reference No, Cheque Details, or Bank Transfer ID..."
              />
            </div>
            
            <div className="flex-1 flex flex-col gap-2 min-h-[84px]">
              <button 
                onClick={handleSave}
                className="flex-1 flex items-center justify-center bg-brand-blue rounded-lg text-[12px] font-bold text-white hover:bg-brand-blue-hover transition transform active:scale-95 shadow-md shadow-brand-blue/10 uppercase tracking-widest px-4 h-9"
              >
                <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Payment
              </button>
              <button 
                onClick={() => navigate('/payment')}
                className="h-8 flex items-center justify-center bg-white border border-border-soft rounded-lg text-[10.5px] font-bold text-text-secondary hover:text-red-500 hover:bg-red-50 transition uppercase tracking-widest shadow-sm"
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
