import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/UI/Button';

const JobberList = () => {
  // --- Available Items (Mock Data from Item Master) ---
  const availableItems = [
    'PVC Resin', 'Master Batch Red', 'Master Batch Black', 'Granules HDPE', 'PP Bags', 'Stretch Film'
  ];

  // --- Form State ---
  const [formData, setFormData] = useState({
    jobberName: '',
    selectedItems: []
  });

  // --- List State (Local Mock) ---
  const [jobbers, setJobbers] = useState([
    { id: 1, name: 'Hemant Plast', items: ['PVC Resin', 'Master Batch Red'] },
    { id: 2, name: 'RK Industries', items: ['PP Bags'] },
  ]);

  // --- Multi-Select State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = availableItems.filter(item => 
    item.toLowerCase().includes(searchTerm.toLowerCase()) && 
    !formData.selectedItems.includes(item)
  );

  // --- Handlers ---
  const handleToggleItem = (item) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(item)
        ? prev.selectedItems.filter(i => i !== item)
        : [...prev.selectedItems, item]
    }));
    setSearchTerm('');
  };

  const removeItem = (item) => {
    setFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(i => i !== item)
    }));
  };

  const handleSave = () => {
    if (!formData.jobberName) return;
    const newJobber = {
      id: Date.now(),
      name: formData.jobberName,
      items: formData.selectedItems
    };
    setJobbers([...jobbers, newJobber]);
    handleRedo();
  };

  const handleRedo = () => {
    setFormData({ jobberName: '', selectedItems: [] });
    setSearchTerm('');
  };

  const handleDelete = (id) => {
    setJobbers(jobbers.filter(j => j.id !== id));
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen pb-10">
        <PageHeader 
          title="Jobber List" 
          subtitle="MANAGE SYSTEM JOBBER MASTER DATA & ITEM ASSIGNMENTS" 
        />

        <div className="px-6 flex flex-col gap-6">
          {/* Data Entry Section */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-visible">
            <div className="bg-table-header px-4 py-2 border-b border-border-soft rounded-t-xl">
              <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">New Jobber Entry</h3>
            </div>
            
            <div className="p-0 overflow-visible">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-bg-main/50 border-b border-border-soft text-[10px] uppercase font-bold text-text-secondary">
                    <th className="px-4 py-2 text-left border-r border-border-soft w-1/3">Jobber Name</th>
                    <th className="px-4 py-2 text-left">Assigned Item List (Multi-Select)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border-soft/50">
                    <td className="p-0 border-r border-border-soft h-12">
                      <input 
                        type="text"
                        value={formData.jobberName}
                        onChange={(e) => setFormData({...formData, jobberName: e.target.value})}
                        className="w-full h-full px-4 bg-transparent outline-none text-[13px] font-medium placeholder:text-text-light/50"
                        placeholder="Enter jobber name..."
                      />
                    </td>
                    <td className="p-0 h-12">
                      <div className="relative w-full h-full flex items-center px-4" ref={dropdownRef}>
                        <div className="flex flex-wrap gap-1.5 flex-1 items-center overflow-hidden">
                          {formData.selectedItems.map(item => (
                            <span key={item} className="bg-brand-blue/10 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-brand-blue/20">
                              {item}
                              <button onClick={() => removeItem(item)} className="hover:text-red-500">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setIsDropdownOpen(true);
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="flex-1 min-w-[120px] bg-transparent outline-none text-[12px] placeholder:text-text-light/50 h-8"
                            placeholder={formData.selectedItems.length === 0 ? "Type to filter items..." : "Add more..."}
                          />
                        </div>

                        {isDropdownOpen && filteredItems.length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-white border border-border-soft shadow-xl rounded-b-lg z-50 max-h-48 overflow-y-auto mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {filteredItems.map(item => (
                              <button
                                key={item}
                                onClick={() => handleToggleItem(item)}
                                className="w-full text-left px-4 py-2 text-[12px] hover:bg-bg-main/50 text-text-secondary hover:text-brand-blue font-medium transition-colors border-b last:border-none border-border-soft/30"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 bg-bg-main/30 flex justify-end gap-3 border-t border-border-soft">
              <button 
                onClick={handleRedo}
                className="flex items-center gap-1.5 px-4 py-1.5 text-[11.5px] font-bold text-text-secondary hover:text-text-primary transition uppercase tracking-tight"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redo
              </button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleSave}
                className="px-6 shadow-brand-blue/20"
              >
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Jobber
              </Button>
            </div>
          </div>

          {/* Master Table Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-4 bg-brand-blue rounded-full"></div>
              <h2 className="text-[13px] font-bold text-text-primary uppercase tracking-tight">Jobber Master List</h2>
            </div>
            
            <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-table-header text-white">
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider w-1/3">Jobber Name</th>
                    <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Assigned Items</th>
                    <th className="px-4 py-2 text-center text-[10.5px] uppercase font-bold tracking-wider w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {jobbers.map((jobber) => (
                    <tr key={jobber.id} className="hover:bg-bg-main/30 transition-colors">
                      <td className="px-5 py-2 font-bold text-[12.5px] text-text-primary border-r border-border-soft uppercase tracking-tight">
                        {jobber.name}
                      </td>
                      <td className="px-5 py-2 border-r border-border-soft">
                        <div className="flex flex-wrap gap-1.5">
                          {jobber.items.map(item => (
                            <span key={item} className="text-[10px] font-bold text-text-secondary bg-bg-main px-2 py-0.5 rounded border border-divider-soft">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center justify-center gap-2.5">
                          <button className="text-brand-blue hover:scale-110 transition p-1" title="Edit Jobber">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(jobber.id)}
                            className="text-red-500 hover:scale-110 transition p-1" 
                            title="Delete Jobber"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobbers.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-10 text-center text-text-light italic text-[13px]">
                        No jobbers found in master. Add a new jobber to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JobberList;
