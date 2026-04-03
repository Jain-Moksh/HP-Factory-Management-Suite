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

        <div className="px-6 flex flex-col gap-5 w-full max-w-5xl mx-auto">
          {/* Box 1: Identification */}
          <Card className="p-5 bg-white shadow-sm border-border-soft/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-light uppercase tracking-widest ml-0.5">Challan No</label>
                <input 
                  type="text"
                  name="challanNo"
                  value={formData.challanNo}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3.5 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30"
                  placeholder="e.g. PAY-882"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-light uppercase tracking-widest ml-0.5">Date</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3.5 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10.5px] font-bold text-text-light uppercase tracking-widest ml-0.5">Client Name / Jobber</label>
                <input 
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3.5 bg-white border border-border-soft rounded-lg text-[13px] font-medium outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/10 transition-all placeholder:opacity-30 font-bold uppercase tracking-tight"
                  placeholder="Enter Client Name..."
                />
              </div>
            </div>
          </Card>

          {/* Box 2: Payment Details */}
          <Card className="p-6 bg-white shadow-sm border-border-soft/60">
            <div className={`flex flex-col gap-6 transition-all duration-300 ${formData.clientName ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <div className="flex items-center justify-between border-b border-border-soft/50 pb-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-text-light uppercase tracking-widest">Amount Pending</span>
                  <span className="text-2xl font-black text-red-500 tracking-tight">₹15,450.00</span>
                </div>
                <div className="text-[10px] font-bold text-brand-blue bg-brand-blue/5 px-3 py-1 rounded-full uppercase tracking-widest border border-brand-blue/10">
                  Auto-calculated from ledger
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10.5px] font-bold text-text-light uppercase tracking-widest ml-0.5">Amount Paid (₹)</label>
                  <div className="flex gap-3">
                    <input 
                      type="number"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleInputChange}
                      className="flex-1 h-11 px-4 bg-white border-2 border-brand-blue/20 rounded-xl text-lg font-black text-brand-blue outline-none focus:border-brand-blue transition-all shadow-sm"
                      placeholder="0.00"
                    />
                    <div className="flex p-1 bg-bg-main rounded-xl border border-border-soft h-11">
                      <button 
                        onClick={() => togglePaymentMode('Bank')}
                        className={`px-6 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Bank' ? 'bg-white text-brand-blue shadow-md shadow-black/5' : 'text-text-light hover:text-text-primary'}`}
                      >
                        Bank
                      </button>
                      <button 
                        onClick={() => togglePaymentMode('Cash')}
                        className={`px-6 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all ${formData.paymentMode === 'Cash' ? 'bg-white text-brand-blue shadow-md shadow-black/5' : 'text-text-light hover:text-text-primary'}`}
                      >
                        Cash
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center p-4 bg-bg-main/30 rounded-xl border border-dashed border-border-soft">
                  <div className="text-center">
                    <div className="text-[9px] font-bold text-text-light uppercase tracking-[0.2em] mb-1">New Balance</div>
                    <div className="text-xl font-bold text-text-primary">₹{(15450 - (parseFloat(formData.amountPaid) || 0)).toLocaleString()}.00</div>
                  </div>
                </div>
              </div>
            </div>
            {!formData.clientName && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] z-10 pointer-events-none rounded-xl">
                <span className="bg-white/90 px-4 py-2 rounded-lg border border-border-soft shadow-xl text-[11px] font-bold text-text-light uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-blue animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Please enter client name above
                </span>
              </div>
            )}
          </Card>

          {/* Footer Section: Remarks beside Buttons */}
          <div className="flex flex-row gap-4 items-start mt-2 pb-12 animate-in fade-in duration-700">
            <div className="flex-[3] relative group">
              <label className="absolute -top-2.5 left-4 px-1.5 bg-[#f8fafc] text-[9.5px] font-bold text-text-light uppercase tracking-widest group-focus-within:text-brand-blue transition-colors z-10">Payment Remark</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                className="w-full h-[92px] px-4 py-3 bg-white border border-border-soft rounded-xl text-[12.5px] font-medium outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all shadow-sm placeholder:italic placeholder:opacity-20 resize-none pt-4"
                placeholder="Reference No, Cheque Details, or Bank Transfer ID..."
              />
            </div>
            
            <div className="flex-1 flex flex-col gap-3 min-h-[92px]">
              <button 
                onClick={handleSave}
                className="flex-1 flex items-center justify-center bg-brand-blue rounded-xl text-[13px] font-bold text-white hover:bg-brand-blue-hover transition transform active:scale-95 shadow-lg shadow-brand-blue/20 uppercase tracking-widest px-4"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Confirm Payment
              </button>
              <button 
                onClick={() => navigate('/payment')}
                className="h-9 flex items-center justify-center bg-white border border-border-soft rounded-xl text-[11px] font-bold text-text-secondary hover:text-red-500 hover:bg-red-50 transition uppercase tracking-widest shadow-sm"
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
