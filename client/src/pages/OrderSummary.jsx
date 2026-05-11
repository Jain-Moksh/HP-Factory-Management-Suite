import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import BillingTable from '../components/BillingTable';
import MonthFilterFooter from '../components/MonthFilterFooter';
import PrintInvoice from '../components/PrintInvoice';
import PrintCopiesModal from '../components/UI/PrintCopiesModal';
import { API_BASE_URL } from '../config';

const OrderSummary = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [printItems, setPrintItems] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printCopies, setPrintCopies] = useState(2);
  
  // --- Filter State ---
  const [searchChallan, setSearchChallan] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/billing`);
      const result = await response.json();
      if (result.success) {
        setBills(result.data);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Listen for global refresh event
  useEffect(() => {
    window.addEventListener('app-refresh', fetchBills);
    return () => window.removeEventListener('app-refresh', fetchBills);
  }, []);

  const handleDelete = async (id, password) => {
    if (password !== import.meta.env.VITE_DEL_PASS) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (result.success) {
        fetchBills();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting bill:", err);
      return false;
    }
  };

  const handlePrint = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/billing/${id}`);
      const result = await response.json();
      if (result.success) {
        const bill = result.data;
        
        // Map backend data to PrintInvoice format
        const summaryData = {
          challanNo: bill.challan_no,
          date: bill.date.split('T')[0],
          clientName: bill.client_name,
          clientRawName: bill.client_name,
          client_shortform: bill.client_shortform,
          address1: bill.address1 || '', // Assume backend provides these or handled in PrintInvoice
          address2: bill.address2 || '',
          transporterName: bill.transporter_name,
          short_remark: bill.short_remark || '',
          long_remark: bill.long_remark || '',
          itemsSubtotal: parseFloat(bill.total_amount),
          transport: bill.transport_charge || 0,
          packing: bill.packing_charge || 0,
          extraDiscountPercent: bill.discount_percent || 0,
          extraDiscountAmount: bill.discount_amount || 0,
          grandTotal: parseFloat(bill.grand_total)
        };

        // Standardized mapping similar to CreateInvoice
        const subtotalBeforeRound = summaryData.itemsSubtotal + parseFloat(summaryData.transport) + parseFloat(summaryData.packing) - parseFloat(summaryData.extraDiscountAmount);
        const calculatedRoundOff = Math.round(subtotalBeforeRound) - subtotalBeforeRound;
        summaryData.roundOffDisplay = calculatedRoundOff === 0 ? "0.00" : (calculatedRoundOff > 0 ? "+" : "-") + Math.abs(calculatedRoundOff).toFixed(2);

        const mappedItems = bill.items.map(item => ({
          item: item.item_name,
          qty: item.quantity,
          unit: item.unit,
          rate: item.rate,
          dAmount: item.discount_amount,
          conversion: item.conversion,
          total: item.total_amount
        }));

        setPrintData(summaryData);
        setPrintItems(mappedItems);
        setShowPrintModal(true);
      }
    } catch (err) {
      console.error("Error fetching print data:", err);
      alert("Failed to fetch invoice details for printing");
    }
  };

  // Print lifecycle: trigger window.print() after component mounts
  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const matchesChallan = bill.challan_no.toString().includes(searchChallan);
      const matchesClient = bill.client_name.toLowerCase().includes(searchClient.toLowerCase());
      
      const billDateStr = bill.date.split('T')[0];
      const matchesStart = !startDate || billDateStr >= startDate;
      const matchesEnd = !endDate || billDateStr <= endDate;

      // Extract month and year for filtering
      const bDate = new Date(billDateStr);
      const matchesMonth = bDate.getMonth() === selectedMonth;
      const matchesYear = bDate.getFullYear() === selectedYear;

      return matchesChallan && matchesClient && matchesStart && matchesEnd && matchesMonth && matchesYear;
    });
  }, [bills, searchChallan, searchClient, startDate, endDate, selectedMonth, selectedYear]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen relative pb-16">
        <PageHeader 
          title="Order Summary" 
          subtitle="MANAGE AND TRACK ALL PARTY BILLING RECORDS" 
        />
        
        <div className="px-6 flex flex-col gap-4 w-full">
          <FilterBar 
            onSearch1={setSearchChallan}
            onSearch2={setSearchClient}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
          />
          <BillingTable 
            data={filteredBills} 
            isLoading={isLoading} 
            onDelete={handleDelete}
            onPrint={handlePrint}
          />
        </div>

        {isPrinting && printData && (
          <PrintInvoice data={printData} items={printItems} printCopies={printCopies} />
        )}

        <PrintCopiesModal 
          isOpen={showPrintModal} 
          onClose={() => setShowPrintModal(false)} 
          onPrint={() => {
            setShowPrintModal(false);
            setIsPrinting(true);
          }} 
          printCopies={printCopies} 
          setPrintCopies={setPrintCopies} 
        />

        <MonthFilterFooter 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          recordCount={filteredBills.length}
        />
      </div>
    </Layout>
  );
};

export default OrderSummary;
