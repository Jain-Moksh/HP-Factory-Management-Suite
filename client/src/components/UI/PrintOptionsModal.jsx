import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { PAPER_CONFIG } from '../../constants/printSettings';

const PrintOptionsModal = ({
  isOpen,
  onClose,
  onPrint,
  selectedSize,
  setSelectedSize
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SELECT PAPER SIZE"
      footer={
        <>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
            className="h-9 px-6 text-[11px] font-bold uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onPrint} 
            className="h-9 px-6 text-[11px] font-bold uppercase tracking-wider bg-brand-blue hover:bg-brand-blue-hover"
          >
            Print Now
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-slate-500 font-medium text-[13px] leading-relaxed">
          Choose a layout optimized for your printer paper. All layouts maximize content area and minimize margin waste.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {Object.values(PAPER_CONFIG).map((size) => (
            <label 
              key={size.id} 
              className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedSize === size.id 
                  ? 'border-brand-blue bg-brand-blue/5 shadow-md shadow-brand-blue/10' 
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value={size.id}
                checked={selectedSize === size.id}
                onChange={() => setSelectedSize(size.id)}
                className="hidden"
              />
              
              {/* Paper Icon Mockup */}
              <div className={`w-12 h-16 border-2 rounded shadow-sm flex items-center justify-center ${
                selectedSize === size.id ? 'border-brand-blue bg-white' : 'border-slate-300 bg-white'
              }`}>
                <div className="flex flex-col gap-1 w-full px-2">
                   <div className="h-1 w-full bg-slate-100 rounded"></div>
                   <div className="h-1 w-3/4 bg-slate-100 rounded"></div>
                   <div className="h-1 w-full bg-slate-100 rounded"></div>
                </div>
              </div>

              <div className="text-center">
                <span className={`block text-[13px] font-black uppercase tracking-tight ${
                  selectedSize === size.id ? 'text-brand-blue' : 'text-slate-700'
                }`}>
                  {size.id}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                  {size.width} × {size.height}
                </span>
              </div>

              {selectedSize === size.id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-brand-blue text-white rounded-full p-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </label>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-amber-800 leading-snug">
            <strong>Pro Tip:</strong> Ensure your browser's print settings have "Margins" set to <strong>None</strong> or <strong>Default</strong> for the best utilization.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PrintOptionsModal;
