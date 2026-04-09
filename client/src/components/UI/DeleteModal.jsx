import React from 'react';
import Modal from './Modal';
import Button from './Button';

const DeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  password, 
  setPassword, 
  error, 
  title = "SECURITY VERIFICATION", 
  message = "This action is permanent. Please enter the master deletion password to proceed." 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
            onClick={onConfirm} 
            className="h-9 px-6 bg-red-500 hover:bg-red-600 border-red-500 text-[11px] font-bold uppercase tracking-wider"
          >
            Confirm Delete
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-slate-600 font-medium text-[13.5px] leading-relaxed">
          {message}
        </p>
        <div className="space-y-2">
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
            className="w-full h-11 px-4 border border-slate-200 rounded-lg outline-none focus:border-brand-blue transition-colors text-[14px] font-medium"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-[12px] font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
