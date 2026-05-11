import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex bg-bg-main min-h-screen font-inter antialiased overflow-x-hidden">
      {/* Sidebar (Fixed) */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-[70px]' : 'ml-[210px]'} bg-bg-main min-h-screen`}>
        {/* Children contains the PageHeader and the content */}
        {children}
      </main>
    </div>
  );
};

export default Layout;
