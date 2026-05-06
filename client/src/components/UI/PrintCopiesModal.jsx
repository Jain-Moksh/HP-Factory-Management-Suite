import React from 'react';
import Modal from './Modal';
import Button from './Button';

const PrintCopiesModal = ({
  isOpen,
  onClose,
  onPrint,
  printCopies,
  setPrintCopies
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PRINT COPIES SELECTION"
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
            className="h-9 px-6 text-[11px] font-bold uppercase tracking-wider"
          >
            Print
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-slate-600 font-medium text-[13.5px] leading-relaxed">
          Please select the number of invoice copies you wish to print.
        </p>
        <div className="flex flex-col gap-3">
          {[
            { value: 1, label: 'Single Copy' },
            { value: 2, label: 'Double Copy' },
            { value: 3, label: 'Triple Copy' }
          ].map((option) => (
            <label 
              key={option.value} 
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                printCopies === option.value 
                  ? 'border-brand-blue bg-brand-blue/5' 
                  : 'border-slate-200 hover:border-brand-blue/50 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="printCopies"
                value={option.value}
                checked={printCopies === option.value}
                onChange={() => setPrintCopies(option.value)}
                className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
              />
              <span className={`text-[13.5px] font-bold ${printCopies === option.value ? 'text-brand-blue' : 'text-slate-700'}`}>
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default PrintCopiesModal;
