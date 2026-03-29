import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: 'Billing Entries', path: '/billing-entries', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[210px] bg-brand-navy flex flex-col shadow-2xl z-50">
      {/* Branding (Matching reference style) */}
      <div className="h-14 flex items-center gap-2.5 px-4 mb-2">
        <div className="w-7 h-7 bg-brand-blue rounded flex items-center justify-center text-white font-bold text-xs shadow-inner">
          NP
        </div>
        <span className="text-white font-medium text-sm tracking-tight opacity-95">Navkar Plast</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5">
        <ul className="space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-2.5 px-3.5 py-2.5 rounded transition-all duration-150 text-[12.5px] font-medium
                  ${isActive 
                    ? 'bg-brand-blue text-white shadow-lg' 
                    : 'text-text-light hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className="opacity-80">
                  {item.icon}
                </span>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer (Simplified) */}
      <div className="px-5 py-3 border-t border-white/5">
        <div className="text-[10px] text-text-light font-medium tracking-tight opacity-40">Accounting System</div>
      </div>
    </aside>
  );
};

export default Sidebar;
