import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PageHeader = ({ title, subtitle, actions, backAction }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const excludedPaths = [
    '/create-invoice',
    '/create-job-work'
  ];

  const isExcluded = excludedPaths.some(path => {
    // Exact match or matches with an ID (e.g., /create-invoice/123)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });

  const hideDefaultButton = 
    location.pathname === '/create-invoice' || 
    location.pathname === '/create-job-work' || 
    location.pathname === '/create-payment' || 
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/master');

  const rootPaths = [
    '/dashboard',
    '/order-summary',
    '/stock-summary',
    '/job-work',
    '/payment',
    '/reports',
    '/day-book',
    '/utility',
    '/master/items',
    '/master/party-list',
    '/master/jobber',
    '/master/groups',
    '/master/transporters'
  ];

  const isRootPath = rootPaths.includes(location.pathname);
  const showBackButton = !!backAction || !isRootPath;

  const getFallbackPath = (pathname) => {
    if (pathname.startsWith('/reports/party-stock-detail')) {
      return '/reports/party-stock';
    }
    if (pathname.startsWith('/reports/job-work-detail')) {
      return '/reports/job-work';
    }
    if (pathname.startsWith('/reports/party-billing-detail')) {
      return '/reports/party-sales';
    }
    if (pathname.startsWith('/reports/')) {
      return '/reports';
    }
    if (pathname.startsWith('/utility/')) {
      return '/utility';
    }
    if (pathname.startsWith('/item-stock-details')) {
      return '/stock-summary';
    }
    if (pathname.startsWith('/create-invoice')) {
      return '/order-summary';
    }
    if (pathname.startsWith('/create-job-work')) {
      return '/job-work';
    }
    if (pathname.startsWith('/create-payment')) {
      return '/payment';
    }
    return '/dashboard';
  };

  const handleBack = () => {
    // If browser history has a valid previous page in the current session
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
      return;
    }

    // Fallback path deduction based on pathname
    const fallbackPath = getFallbackPath(location.pathname);
    
    if (backAction) {
      const actionStr = backAction.toString();
      if (actionStr.includes('-1') || actionStr.includes('goBack')) {
        navigate(fallbackPath);
      } else {
        backAction();
      }
    } else {
      navigate(fallbackPath);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Dispatch custom event for pages to listen to
    window.dispatchEvent(new CustomEvent('app-refresh'));
    
    // Animation timeout
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="bg-white border-b border-border-soft h-14 flex items-center justify-between px-6 sticky top-0 z-40 w-full mb-6 py-2 shadow-sm">
      <div className="flex items-center gap-3.5 select-none text-left">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-text-light hover:text-brand-blue transition-all duration-200 group flex items-center justify-center shrink-0 border border-transparent hover:border-border-soft"
            title="Back"
            aria-label="Go Back"
          >
            <svg 
              className="w-4 h-4 stroke-[2.5]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-text-primary tracking-tight leading-none mb-1.5 uppercase">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[10px] uppercase font-bold text-text-light tracking-widest leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        {!isExcluded && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              p-2 rounded-full transition-all duration-300 group
              ${isRefreshing ? 'bg-brand-blue/10 text-brand-blue' : 'hover:bg-gray-100 text-text-light hover:text-brand-blue'}
            `}
            title="Refresh Data"
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-700 ${isRefreshing ? 'rotate-180' : 'group-hover:rotate-45'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}

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
            <>
              <button 
                onClick={() => navigate('/create-payment')}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Create Payment
              </button>
              <button 
                onClick={() => navigate('/create-job-work')}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Create Jobwork
              </button>
              <button 
                onClick={() => navigate('/create-invoice')}
                className="bg-brand-blue hover:bg-brand-blue-hover text-white text-[12.5px] font-bold px-4 py-1.5 rounded transition shadow-lg flex items-center gap-1.5 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default PageHeader;
