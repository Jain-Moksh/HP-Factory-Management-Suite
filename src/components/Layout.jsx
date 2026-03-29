import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex bg-bg-main min-h-screen font-inter antialiased overflow-x-hidden">
      {/* Sidebar (Fixed) */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-[210px] bg-bg-main min-h-screen">
        {/* Children contains the PageHeader and the content */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
