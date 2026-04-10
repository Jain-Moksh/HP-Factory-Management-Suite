import React from 'react';
import Modal from './Modal';
import Button from './Button';

const WarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ATTENTION REQUIRED", 
  message = "Are you sure you want to proceed with this action?" 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onClose}
            className="h-10 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-light hover:text-text-primary transition-all"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={onConfirm} 
            className="h-10 px-10 bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-lg shadow-amber-500/20 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl"
          >
            Proceed Anyway
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4 p-2">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-[14px] font-black text-text-primary uppercase tracking-tight">System Warning</h4>
          <p className="text-text-secondary font-medium text-[13.5px] leading-relaxed opacity-80">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default WarningModal;
