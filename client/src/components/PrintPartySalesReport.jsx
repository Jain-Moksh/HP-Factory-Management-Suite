import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintPartySalesReport = ({ data, startDate, endDate, paperSize = 'A4' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;

  const totalAmount = data.reduce((sum, row) => sum + parseFloat(row.total_amount), 0);

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
      margin-bottom: 10px;
      border-bottom: 2px solid #000;
      padding-bottom: 5px;
    }

    .report-title {
      font-size: ${config.headerFontSize};
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }

    .date-section {
      display: flex;
      justify-content: flex-start;
      gap: 15px;
      margin-bottom: 5px;
    }

    .date-info {
      font-size: ${config.fontSize};
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
      font-size: ${config.fontSize};
      color: #000 !important;
      font-weight: 700;
    }

    /* Column Widths */
    .col-party { width: 70%; }
    .col-amount { width: 30%; text-align: right; }

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
          <div className="report-title">Party Wise Sales Report</div>
          <div className="date-section">
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
              <th className="col-party">Party Name</th>
              <th className="col-amount text-right">Total Sales Amount</th>
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
                      ₹{parseFloat(row.total_amount).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(parseFloat(row.total_amount)) ? 0 : 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="footer-row">
                  <td className="col-party text-right uppercase italic" style={{ fontSize: '0.9em', opacity: 0.8 }}>
                    Grand Total:
                  </td>
                  <td className="col-amount font-black text-right" style={{ fontSize: '1.1em' }}>
                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(totalAmount) ? 0 : 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                  No data found
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

export default PrintPartySalesReport;
