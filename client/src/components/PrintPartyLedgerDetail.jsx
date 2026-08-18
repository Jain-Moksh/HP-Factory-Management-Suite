import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintPartyLedgerDetail = ({ data, clientName, startDate, endDate, paperSize = 'A4' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;

  const totalCredit = data.reduce((sum, row) => sum + (parseFloat(row.credit) || 0), 0);
  const totalDebit = data.reduce((sum, row) => sum + (parseFloat(row.debit) || 0), 0);
  const closingBalance = data.length > 0 ? data[data.length - 1].closing_balance : 0;

  const CSS = `
    ${getBasePrintCSS(config)}
    ${getReportTableCSS(config)}

    .print-report-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #000 !important;
      width: 100%;
      line-height: 1.2;
      background: #fff !important;
      margin-bottom: 0 !important;
    }

    .report-header {
      margin-bottom: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
    }

    .report-title {
      font-size: 19px !important;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }

    .date-section {
      display: flex;
      justify-content: flex-start;
      gap: 20px;
      margin-bottom: 5px;
    }

    .date-info {
      font-size: 14.5px !important;
      text-transform: uppercase;
      font-weight: 800;
    }

    .date-info span {
      font-weight: 800;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 14px !important;
      color: #000 !important;
      font-weight: 700;
    }

    .report-table th {
      font-size: 14px !important;
      padding: 6px 8px !important;
    }

    .report-table td {
      padding: 6px 8px !important;
      height: 30px !important;
    }

    /* Column Widths */
    .col-challan { width: 22%; }
    .col-type { width: 18%; text-align: center; }
    .col-date { width: 18%; text-align: center; }
    .col-credit { width: 14%; text-align: right; }
    .col-debit { width: 14%; text-align: right; }
    .col-balance { width: 14%; text-align: right; }

    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .font-black { font-weight: 900; }
    
    .report-table tbody tr:not(.footer-row) td {
      border-bottom: 1px solid #e0e0e0 !important;
    }
    
    .footer-row td {
      border-top: 2px solid #000 !important;
      font-weight: 900;
      padding-top: 5px !important;
    }
  `;

  const portalContent = (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="print-report-container">
        
        {/* Header */}
        <div className="report-header">
          <div className="report-title">Party Ledger Report</div>
          <div className="date-section">
            <div className="date-info">
              <span>CLIENT :</span> {clientName}
            </div>
            <div className="date-info">
              <span>FROM :</span> {startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'ALL TIME'}
            </div>
            <div className="date-info">
              <span>TO :</span> {endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'PRESENT'}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <table className="report-table">
          <thead>
            <tr>
              <th className="col-challan">Challan No</th>
              <th className="col-type text-center">Challan Type</th>
              <th className="col-date text-center">Date</th>
              <th className="col-credit text-right">Credit</th>
              <th className="col-debit text-right">Debit</th>
              <th className="col-balance text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              <>
                {data.map((row, index) => (
                  <tr key={row.id || index}>
                    <td className="col-challan" style={{ textTransform: 'uppercase' }}>
                      {row.challan_no}
                    </td>
                    <td className="col-type text-center uppercase">
                      {row.transaction_type === 'BILLING' ? 'SALES' : row.transaction_type}
                    </td>
                    <td className="col-date text-center">
                      {row.date && row.date !== '—' && row.transaction_type !== 'OPENING BALANCE' ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : row.date}
                    </td>
                    <td className="col-credit font-black text-right">
                      {row.credit > 0 ? `₹${parseFloat(row.credit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="col-debit font-black text-right">
                      {row.debit > 0 ? `₹${parseFloat(row.debit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="col-balance font-black text-right">
                      ₹{parseFloat(row.closing_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="footer-row">
                  <td colSpan="3" className="text-right uppercase italic" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                    Totals / Closing Bal:
                  </td>
                  <td className="col-credit font-black text-right">
                    ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="col-debit font-black text-right">
                    ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="col-balance font-black text-right" style={{ fontSize: '1.1em' }}>
                    ₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                  No ledger transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintPartyLedgerDetail;
