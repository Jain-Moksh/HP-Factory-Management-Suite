import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [masterOpen, setMasterOpen] = useState(false);

  const mainMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: 'Day Book', path: '/day-book', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { name: 'Order Summary', path: '/order-summary', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { name: 'Stock Summary', path: '/stock-summary', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
    { name: 'Job Work', path: '/job-work', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )},
    { name: 'Payment', path: '/payment', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12l-3-12H6L3 19z" />
      </svg>
    )},
    { name: 'Reports', path: '/reports', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  const masterItems = [
    { name: 'Item List', path: '/master/items' },
    { name: 'Party List', path: '/master/party-list' },
    { name: 'Jobber List', path: '/master/jobber' },
    { name: 'Group List', path: '/master/groups' },
    { name: 'Transporter List', path: '/master/transporters' },
    { name: 'Price List', path: '/master/price-list' },
  ];

  const navLinkClass = (isActive) => `
    flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3.5'} py-2.5 rounded transition-all duration-300 text-[12px] font-medium
    ${isActive 
      ? 'bg-brand-blue text-white shadow-lg' 
      : 'text-text-light hover:bg-white/5 hover:text-white'
    }
  `;

  return (
    <aside className={`fixed left-0 top-0 h-screen transition-all duration-300 ${isCollapsed ? 'w-[70px]' : 'w-[210px]'} bg-brand-navy flex flex-col shadow-2xl z-50`}>
      {/* Toggle Button Section */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'justify-end px-4'} mb-2 border-b border-white/5`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/5 text-white hover:bg-brand-blue transition-colors group"
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden pt-2">
        <ul className="space-y-1">
          {mainMenuItems.map((item) => (
            <li key={item.name}>
              <NavLink to={item.path} title={isCollapsed ? item.name : ''} className={({ isActive }) => navLinkClass(isActive)}>
                <span className={`transition-all duration-300 ${isCollapsed ? 'scale-110' : 'opacity-80'}`}>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            </li>
          ))}

          {/* Master Section */}
          <li className="pt-4">
            {!isCollapsed ? (
              <>
                <button 
                  onClick={() => setMasterOpen(!masterOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-bold text-text-light uppercase tracking-widest hover:text-white transition-colors"
                >
                  <span>Master</span>
                  <svg className={`w-3 h-3 transition-transform duration-200 ${masterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {masterOpen && (
                  <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-2 animate-in slide-in-from-top-1 duration-200">
                    {masterItems.map((item) => (
                      <li key={item.name}>
                        <NavLink to={item.path} className={({ isActive }) => `
                          flex items-center px-3 py-1.5 rounded transition-all duration-150 text-[11px] font-medium
                          ${isActive 
                            ? 'bg-brand-blue/20 text-brand-blue brightness-150' 
                            : 'text-text-light hover:text-white hover:bg-white/5'
                          }
                        `}>
                          {item.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="flex justify-center py-2 border-t border-white/5 mt-2">
                <div className="w-6 h-0.5 bg-white/10 rounded-full" />
              </div>
            )}
          </li>
        </ul>
      </nav>

      <div className={`px-2.5 py-4 border-t border-white/5 transition-all duration-300 flex flex-col`}>
        <NavLink 
          to="/utility" 
          title={isCollapsed ? 'Utility' : ''} 
          className={({ isActive }) => navLinkClass(isActive)}
        >
          <span className={`transition-all duration-300 ${isCollapsed ? 'scale-110' : 'opacity-80'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
          {!isCollapsed && <span className="truncate">Utility</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
