import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [masterOpen, setMasterOpen] = useState(true);

  const mainMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: 'Order Summary', path: '/order-summary', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { name: 'Purchase', path: '/purchase', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )},
    { name: 'Payment', path: '/payment', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12l-3-12H6L3 19z" />
      </svg>
    )},
  ];

  const masterItems = [
    { name: 'Item List', path: '/master/items' },
    { name: 'Party List', path: '/master/party-list' },
    { name: 'Jobber List', path: '/master/jobber' },
    { name: 'Transporter List', path: '/master/transporters' },
  ];

  const navLinkClass = (isActive) => `
    flex items-center gap-2.5 px-3.5 py-2 rounded transition-all duration-150 text-[12px] font-medium
    ${isActive 
      ? 'bg-brand-blue text-white shadow-lg' 
      : 'text-text-light hover:bg-white/5 hover:text-white'
    }
  `;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[210px] bg-brand-navy flex flex-col shadow-2xl z-50">
      {/* Branding */}
      <div className="h-14 flex items-center gap-2.5 px-4 mb-2">
        <div className="w-7 h-7 bg-brand-blue rounded flex items-center justify-center text-white font-bold text-xs shadow-inner">
          NP
        </div>
        <span className="text-white font-medium text-sm tracking-tight opacity-95">Navkar Plast</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5">
          {mainMenuItems.map((item) => (
            <li key={item.name}>
              <NavLink to={item.path} className={({ isActive }) => navLinkClass(isActive)}>
                <span className="opacity-80">{item.icon}</span>
                {item.name}
              </NavLink>
            </li>
          ))}

          {/* Master Section */}
          <li className="pt-2">
            <button 
              onClick={() => setMasterOpen(!masterOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-bold text-text-light uppercase tracking-widest hover:text-white transition-colors"
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
                      flex items-center px-3 py-1.5 rounded transition-all duration-150 text-[11.5px] font-medium
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
          </li>
        </ul>
      </nav>

      <div className="px-5 py-3 border-t border-white/5">
        <div className="text-[10px] text-text-light font-medium tracking-tight opacity-40">Accounting System</div>
      </div>
    </aside>
  );
};

export default Sidebar;
