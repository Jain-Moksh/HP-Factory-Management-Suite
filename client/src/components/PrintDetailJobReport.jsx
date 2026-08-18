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
      font-size: 15.5px !important;
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
      font-size: 15.5px !important;
      color: #000 !important;
      margin-top: 5px;
      font-weight: 700;
    }

    .report-table th {
      font-size: 15.5px !important;
      padding: 6px 10px !important;
    }

    .report-table td {
      padding: 6px 10px !important;
      height: 30px !important;
    }

    /* Column Widths - Optimized for borderless view */
    .col-jobber { width: 40%; }
    .col-item { width: 45%; }
    .col-qty  { width: 15%; text-align: right; }

    .text-right { text-align: right !important; }
    .font-bold { font-weight: 900; }
    
    .report-table tbody tr td {
      border-bottom: 1px solid #e0e0e0 !important;
    }
  `;

  // Calculate totals inline
  const totals = data.reduce((acc, row) => {
    acc.quantity += parseFloat(row.total_quantity) || 0;
    return acc;
  }, { quantity: 0 });

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
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th className="col-jobber" style={{ textAlign: 'left', padding: '4px 10px' }}>JOBBER NAME</th>
              <th className="col-item" style={{ textAlign: 'left', padding: '4px 10px' }}>ITEM NAME</th>
              <th className="col-qty text-right" style={{ padding: '4px 10px' }}>TOTAL QTY</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const showJobberName = index === 0 || row.jobber_name !== data[index - 1].jobber_name;
                return (
                  <tr key={index}>
                    <td className="col-jobber" style={{ textTransform: 'uppercase', padding: '6px 10px' }}>
                      {showJobberName ? row.jobber_name : ''}
                    </td>
                    <td className="col-item" style={{ textTransform: 'uppercase', padding: '6px 10px' }}>
                      {row.item_name}
                    </td>
                    <td className="col-qty font-bold text-right" style={{ padding: '6px 10px' }}>
                      {parseFloat(row.total_quantity || 0).toLocaleString('en-IN')}
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
          {data.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #000', fontWeight: '900' }}>
                <td colSpan="2" style={{ textAlign: 'right', padding: '5px 10px' }}>Report Total:</td>
                <td className="text-right font-bold" style={{ padding: '5px 10px' }}>{totals.quantity.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          )}
        </table>

      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintDetailJobReport;
