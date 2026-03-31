import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PageHeader = ({ title, subtitle, actions }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hideDefaultButton = 
    location.pathname === '/create-invoice' || 
    location.pathname === '/create-purchase' || 
    location.pathname.startsWith('/master');

  return (
    <div className="bg-white border-b border-border-soft h-14 flex items-center justify-between px-6 sticky top-0 z-40 w-full mb-6 py-2 shadow-sm">
      <div className="flex flex-col select-none text-left">
        <h1 className="text-base font-bold text-text-primary tracking-tight leading-none mb-1.5 uppercase">
          {title}
        </h1>
        {subtitle && (
          <span className="text-[10px] uppercase font-bold text-text-light tracking-widest leading-none">
            {subtitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Render custom actions if provided */}
        {actions ? (
          actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`
                px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 text-[12px] font-bold
                ${action.variant === 'secondary' 
                  ? 'bg-white border border-brand-blue/30 text-brand-blue hover:bg-brand-blue/5' 
                  : 'bg-brand-blue hover:bg-brand-blue-hover text-white shadow-brand-blue/20'
                }
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))
        ) : (
          /* Default Fallback for existing pages */
          !hideDefaultButton && (
            <button 
              onClick={() => navigate('/create-invoice')}
              className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Create Invoice
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default PageHeader;
