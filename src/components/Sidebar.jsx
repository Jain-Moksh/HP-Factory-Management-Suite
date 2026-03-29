import React from 'react';

const Sidebar = ({ activeItem = 'Billing Entries' }) => {
  const menuItems = [
    { name: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )},
    { name: 'Billing Entries', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )},
    { name: 'Reports', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-brand-navy flex flex-col shadow-xl z-50">
      {/* Branding */}
      <div className="h-16 flex items-center gap-3 px-6">
        <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold text-sm">
          NP
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Navkar Plast</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.name}>
              <a
                href="#"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                  ${activeItem === item.name 
                    ? 'bg-brand-blue text-white shadow-md' 
                    : 'text-text-light hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className={`${activeItem === item.name ? 'text-white' : 'text-text-light opacity-80'}`}>
                  {item.icon}
                </span>
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Branding */}
      <div className="px-6 py-4 border-t border-white/5 bg-black/10">
        <div className="text-[10px] uppercase tracking-wider text-text-light font-medium mb-1 opacity-50">Accounting System</div>
        <div className="text-white text-[11px] font-medium opacity-80">v1.2.0 • Navkar Plast</div>
      </div>
    </aside>
  );
};

export default Sidebar;
