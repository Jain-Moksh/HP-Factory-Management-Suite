import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintDetailJobReport = ({ data, startDate, endDate, paperSize = 'A4' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;

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

    .date-section {
      display: flex;
      justify-content: flex-start;
      gap: 15px;
      margin-bottom: 5px;
      padding-bottom: 2px;
      border-bottom: 1px solid #000;
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
      margin-top: 5px;
      font-weight: 700;
    }

    /* Column Widths - Optimized for borderless view */
    .col-date { width: 15%; }
    .col-item { width: 67%; }
    .col-qty  { width: 18%; text-align: right; }

    .text-right { text-align: right !important; }
    .font-bold { font-weight: 900; }
    
    .report-table tbody tr td {
      border-bottom: 1px solid #e0e0e0 !important;
    }
  `;

  const portalContent = (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="print-report-container">
        
        {/* Date Section */}
        <div className="date-section">
          <div className="date-info">
            <span>FROM :</span> {startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'N/A'}
          </div>
          <div className="date-info">
            <span>TO :</span> {endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'N/A'}
          </div>
        </div>

        {/* Data List (Using borderless table for alignment) */}
        <table className="report-table">
          <thead>
            <tr>
              <th className="col-date">Date</th>
              <th className="col-item">Item Name</th>
              <th className="col-qty text-right">Inward Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const isFirstOfDate = index === 0 || new Date(row.date).toLocaleDateString('en-GB') !== new Date(data[index - 1].date).toLocaleDateString('en-GB');
                return (
                  <tr key={row.purchase_item_id || index}>
                    <td className="col-date">
                      {isFirstOfDate ? new Date(row.date).toLocaleDateString('en-GB') : ''}
                    </td>
                    <td className="col-item" style={{ textTransform: 'uppercase' }}>
                      {row.item_name}
                    </td>
                    <td className="col-qty font-bold text-right">
                      {parseFloat(row.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
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

export default PrintDetailJobReport;
