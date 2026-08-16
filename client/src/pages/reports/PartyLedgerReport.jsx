import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import SearchableSelect from '../../components/UI/SearchableSelect';
import PrintPendingPaymentReport from '../../components/PrintPendingPaymentReport';
import PrintOptionsModal from '../../components/UI/PrintOptionsModal';
import { API_BASE_URL } from '../../config';

const PartyLedgerReport = () => {
  const navigate = useNavigate();
  const [parties, setParties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');

  // Filter States
  const [selectedPartyId, setSelectedPartyId] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState('all');

  // Fetch initial select options
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const [clientsRes, groupsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/clients`),
          fetch(`${API_BASE_URL}/groups`)
        ]);
        const clientsJson = await clientsRes.json();
        const groupsJson = await groupsRes.json();

        if (clientsJson.success) {
          const allOption = { id: 'all', name: '--- ALL CLIENTS ---' };
          setParties([allOption, ...clientsJson.data]);
        }
        if (groupsJson.success) {
          setGroups(groupsJson.data);
        }
      } catch (err) {
        console.error('Error fetching dropdown options:', err);
      }
    };
    fetchDropdownOptions();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const clientIdParam = selectedPartyId === 'all' ? '' : selectedPartyId;
      const groupIdParam = selectedGroupId === 'all' ? '' : selectedGroupId;

      const response = await fetch(
        `${API_BASE_URL}/reports/pending-payment?client_id=${clientIdParam}&group_id=${groupIdParam}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Error fetching pending payment report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch report data on filter changes
  useEffect(() => {
    fetchData();
  }, [selectedPartyId, selectedGroupId]);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchData);
    return () => window.removeEventListener('app-refresh', fetchData);
  }, [selectedPartyId, selectedGroupId]);

  // Print lifecycle
  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => {
        setIsPrinting(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        window.print();
      }, 1500);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting]);

  const reportTotal = useMemo(() => {
    return data.reduce((sum, row) => sum + (parseFloat(row.pending_amount) || 0), 0);
  }, [data]);

  const handleRowClick = (clientId) => {
    navigate(`/reports/party-ledger/${clientId}`);
  };

  const handlePrintRequest = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    setShowPrintModal(false);
    setIsPrinting(true);
  };

  // Resolve current filter text for the print header
  const currentClientText = useMemo(() => {
    if (selectedPartyId === 'all') return 'ALL CLIENTS';
    const match = parties.find((p) => p.id === parseInt(selectedPartyId) || p.id === selectedPartyId);
    return match ? match.name.toUpperCase() : 'ALL CLIENTS';
  }, [selectedPartyId, parties]);

  const currentGroupText = useMemo(() => {
    if (selectedGroupId === 'all') return 'ALL GROUPS';
    const match = groups.find((g) => g.id === parseInt(selectedGroupId) || g.id === selectedGroupId);
    return match ? match.name.toUpperCase() : 'ALL GROUPS';
  }, [selectedGroupId, groups]);

  const actions = [
    {
      label: 'Print Report',
      onClick: handlePrintRequest,
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Party Ledger" 
          subtitle="VIEW DETAILED CREDIT, DEBIT AND CLOSING BALANCES FOR CLIENTS" 
          actions={actions}
          backAction={() => navigate('/reports')}
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          {/* Filters Bar */}
          <div className="bg-white border border-border-soft rounded-xl px-4 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 group">
            <div className="flex items-center gap-2 shrink-0 border-r border-border-soft pr-4">
              <svg className="w-3.5 h-3.5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-[11px] font-bold text-text-primary uppercase tracking-tight whitespace-nowrap">Filter Report</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Client Filter */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">Client Name</label>
                <SearchableSelect 
                  options={parties}
                  value={selectedPartyId}
                  onChange={setSelectedPartyId}
                  placeholder="Select Client..."
                  className="w-full"
                />
              </div>

              {/* Group Filter */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-black text-text-light uppercase tracking-wider ml-0.5">Group By</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full h-8 px-2 bg-bg-main/50 border border-divider-soft rounded text-[11.5px] font-bold text-text-primary uppercase outline-none focus:border-brand-blue transition-all"
                >
                  <option value="all">--- ALL GROUPS ---</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Button */}
              <div className="flex items-end h-full pt-4 md:pt-0">
                <button 
                  onClick={fetchData}
                  disabled={isLoading}
                  className="w-full md:w-auto bg-brand-blue hover:bg-brand-blue-hover text-white text-[11.5px] font-black uppercase tracking-widest px-5 h-8 rounded transition shadow-lg flex items-center justify-center gap-1.5 shadow-brand-blue/20 disabled:opacity-50 active:scale-95 cursor-pointer ml-auto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                  </svg>
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-border-soft rounded-xl shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-table-header text-white">
                        <th className="px-5 py-2 text-left border-r border-white/10 text-[10.5px] uppercase font-bold tracking-wider">Client Name</th>
                        <th className="px-5 py-2 text-right text-[10.5px] uppercase font-bold tracking-wider px-10 w-72">Pending Outstanding Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                        {isLoading ? (
                          <tr>
                            <td colSpan="2" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[13px] font-medium text-text-light uppercase tracking-widest">Calculating pending balances...</span>
                                </div>
                            </td>
                          </tr>
                        ) : data.length > 0 ? (
                           data.map((row) => (
                             <tr 
                               key={row.client_id} 
                               className="hover:bg-bg-main/30 transition-colors"
                             >
                                <td className="px-5 py-1.5 text-[12.5px] font-bold text-text-primary border-r border-border-soft uppercase tracking-tight">
                                   <span 
                                     onClick={() => handleRowClick(row.client_id)}
                                     className="text-brand-blue hover:underline cursor-pointer"
                                   >
                                     {row.client_name}
                                   </span>
                                </td>
                                <td className="px-5 py-1.5 text-right text-[13.5px] font-black text-brand-blue px-10">
                                   ₹{parseFloat(row.pending_amount).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </td>
                             </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan="2" className="px-6 py-12 text-center italic text-text-light text-[12px] opacity-60">
                                 No clients found matching the current client or group selections.
                              </td>
                           </tr>
                        )}
                    </tbody>
                    {data.length > 0 && (
                      <tfoot>
                        <tr className="bg-bg-main/50 border-t-2 border-border-soft">
                          <td className="px-5 py-3 text-right text-[10px] font-black uppercase text-text-light tracking-widest italic opacity-70 border-r border-border-soft">
                             Total Pending:
                          </td>
                          <td className="px-5 py-3 text-right text-[15px] font-black text-brand-blue px-10">
                             ₹{reportTotal.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                </table>
             </div>
          </div>

          <div className="bg-bg-main/30 border border-border-soft rounded-lg p-3 flex items-start gap-3">
            <svg className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[11px] text-text-light leading-snug font-medium italic">
              This report displays all clients that currently have positive pending outstanding balances. 
              Clicking a client name opens that client's detailed financial credit, debit, and chronological running ledger.
            </p>
          </div>
        </div>
      </div>

      {isPrinting && (
        <PrintPendingPaymentReport 
          data={data} 
          clientName={currentClientText} 
          groupName={currentGroupText} 
          paperSize={selectedPaperSize}
          title="Party Ledger Report"
        />
      )}

      <PrintOptionsModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={executePrint}
        selectedSize={selectedPaperSize}
        setSelectedSize={setSelectedPaperSize}
      />
    </Layout>
  );
};

export default PartyLedgerReport;
