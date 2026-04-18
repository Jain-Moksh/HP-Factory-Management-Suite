import React, { useState, useEffect, useRef } from 'react';

const SearchableSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = "Search...", 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Find the label for the current value
  const selectedOption = options.find(opt => String(opt.id) === String(value));
  const displayValue = selectedOption ? selectedOption.name : '';

  // Filter options based on search term
  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.shortform && opt.shortform.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange?.(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative w-full h-8 px-3 bg-bg-main/50 border border-divider-soft rounded flex items-center gap-2 transition-all
          ${isOpen ? 'border-brand-blue ring-1 ring-brand-blue/10 bg-white shadow-sm' : 'hover:bg-bg-main/80'}
          ${className}
        `}
      >
        <span className="shrink-0 text-text-light opacity-50">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        
        <div className="flex-1 overflow-hidden">
          {!isOpen && !displayValue ? (
            <span className="text-[12px] font-medium text-text-light opacity-60 uppercase tracking-tight">{placeholder}</span>
          ) : (
            <span className="text-[12px] font-bold text-text-primary truncate uppercase tracking-tight">
              {isOpen ? (searchTerm || displayValue || placeholder) : displayValue}
            </span>
          )}
        </div>

        <svg 
          className={`w-3 h-3 text-text-primary/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-white border border-border-soft rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-border-soft/30 bg-bg-main/30">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light opacity-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                autoFocus
                type="text"
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-10 pr-4 bg-white border border-border-soft rounded-lg text-[12px] font-bold outline-none focus:border-brand-blue/30"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt)}
                  className={`
                    px-4 py-2.5 hover:bg-bg-main cursor-pointer border-b border-border-soft/20 last:border-none group transition-colors
                    ${String(opt.id) === String(value) ? 'bg-brand-blue/5' : ''}
                  `}
                >
                  <div className={`text-[13px] font-bold uppercase tracking-tight transition-colors ${String(opt.id) === String(value) ? 'text-brand-blue' : 'text-text-primary group-hover:text-brand-blue'}`}>
                    {opt.name}
                    {opt.shortform && <span className="text-text-primary/40 font-medium ml-1.5 opacity-60">({opt.shortform})</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[12px] text-text-light italic opacity-60">
                No matching options found.
              </div>
            )}
          </div>
          
          <div 
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setSearchTerm(''); }}
            className="bg-bg-main/50 px-4 py-1.5 text-center text-[10px] font-black text-text-primary hover:text-brand-blue cursor-pointer uppercase tracking-widest border-t border-border-soft/30"
          >
            Close Selection
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
