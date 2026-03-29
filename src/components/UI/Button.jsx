import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  return (
    <button 
      className={`ui-button ${variant} ${size} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
