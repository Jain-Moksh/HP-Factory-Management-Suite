import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex bg-bg-main min-h-screen font-inter antialiased">
      {/* Sidebar (Fixed width) */}
      <Sidebar activeItem="Billing Entries" />

      {/* Main Content Area */}
      <main className="flex-1 ml-[220px] transition-all duration-300">
        {/* Dynamic Page Content */}
        <div className="px-6 py-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
