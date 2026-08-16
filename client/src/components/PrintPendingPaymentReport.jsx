import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintPendingPaymentReport = ({ data, clientName, groupName, paperSize = 'A4' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;

  const totalPending = data.reduce((sum, row) => sum + (parseFloat(row.pending_amount) || 0), 0);

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
      font-size: 14.5px !important;
      color: #000 !important;
      font-weight: 700;
    }

    .report-table th {
      font-size: 14.5px !important;
      padding: 6px 10px !important;
    }

    .report-table td {
      padding: 6px 10px !important;
      height: 30px !important;
    }

    /* Column Widths */
    .col-party { width: 65%; }
    .col-amount { width: 35%; text-align: right; }

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
          <div className="report-title">Pending Payment Report</div>
          <div className="date-section">
            <div className="date-info">
              <span>CLIENT :</span> {clientName}
            </div>
            <div className="date-info">
              <span>GROUP :</span> {groupName}
            </div>
            <div className="date-info">
              <span>DATE :</span> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <table className="report-table">
          <thead>
            <tr>
              <th className="col-party">Client Name</th>
              <th className="col-amount text-right">Pending Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              <>
                {data.map((row, index) => (
                  <tr key={row.client_id || index}>
                    <td className="col-party" style={{ textTransform: 'uppercase' }}>
                      {row.client_name}
                    </td>
                    <td className="col-amount font-black text-right">
                      ₹{parseFloat(row.pending_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="footer-row">
                  <td className="col-party text-right uppercase italic" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                    Total Pending:
                  </td>
                  <td className="col-amount font-black text-right" style={{ fontSize: '1.1em' }}>
                    ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                  No pending payments found
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

export default PrintPendingPaymentReport;
