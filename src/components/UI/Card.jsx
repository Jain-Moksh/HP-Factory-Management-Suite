import React from 'react';
import './Card.css';

const Card = ({ children, title, subtitle, footer, noPadding = false, style, className = '' }) => {
  return (
    <div className={`ui-card ${className}`} style={style}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className={`card-body ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
