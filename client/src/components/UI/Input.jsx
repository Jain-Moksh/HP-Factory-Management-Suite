import React from 'react';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[11px] font-bold text-text-light uppercase tracking-tight ml-0.5">
          {label}
        </label>
      )}
      <input 
        className={`
          w-full h-9 px-3 bg-bg-main/50 border rounded text-[13px] outline-none transition-all
          ${error 
            ? 'border-red-500 focus:border-red-600' 
            : 'border-divider-soft focus:border-brand-blue'
          }
        `} 
        {...props} 
      />
      {error && (
        <span className="text-[10px] text-red-500 font-medium mt-0.5 ml-0.5 uppercase tracking-tight">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
