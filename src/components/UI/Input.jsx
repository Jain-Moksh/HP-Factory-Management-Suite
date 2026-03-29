import React from 'react';
import './Input.css';

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`ui-input-wrapper ${className}`}>
      {label && <label className="ui-label">{label}</label>}
      <input className={`ui-input ${error ? 'error' : ''}`} {...props} />
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
};

export default Input;
