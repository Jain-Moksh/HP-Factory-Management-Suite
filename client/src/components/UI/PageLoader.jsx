import React from 'react';

const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-blue/10 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue animate-pulse">
          Loading Module
        </span>
        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent"></div>
      </div>
    </div>
  );
};

export default PageLoader;
