import React from 'react';

const Card = ({ children, title, subtitle, footer, noPadding = false, style, className = '' }) => {
  return (
    <div 
      className={`bg-white border border-border-soft rounded-lg shadow-sm overflow-visible flex flex-col ${className}`} 
      style={style}
    >
      {(title || subtitle) && (
        <div className="px-5 py-3.5 border-b border-border-soft bg-bg-main/20">
          {title && <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">{title}</h3>}
          {subtitle && <p className="text-[11px] font-medium text-text-light uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className={`flex-1 ${noPadding ? 'p-0' : 'p-5'}`}>
        {children}
      </div>
      {footer && (
        <div className="px-5 py-3 border-t border-border-soft bg-bg-main/10">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
