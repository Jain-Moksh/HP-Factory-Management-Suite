import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded";
  
  const variants = {
    primary: "bg-brand-blue text-white hover:bg-brand-blue-hover shadow-lg shadow-brand-blue/20",
    secondary: "bg-white text-text-primary border border-divider-soft hover:bg-bg-main shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
    outline: "bg-transparent border border-brand-blue text-brand-blue hover:bg-brand-blue/5"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-[12.5px]",
    lg: "px-6 py-2.5 text-[14px]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
