import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintJobSummaryReport = ({ data, startDate, endDate, paperSize = 'A4' }) => {
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

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 900; }
  `;

  // Calculate totals inline
  const totals = data.reduce((acc, row) => {
    acc.inward += parseFloat(row.inward_pcs) || 0;
    return acc;
  }, { inward: 0 });

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

        {/* Data List */}
        <table className="report-table">
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', width: '25%', padding: '4px 0' }}>DATE</th>
              <th style={{ textAlign: 'left', width: '55%', padding: '4px 0' }}>ITEM NAME</th>
              <th className="text-right" style={{ width: '20%', padding: '4px 0' }}>INWARD QTY</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const showDate = index === 0 || row.date !== data[index - 1].date;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ textAlign: 'left', padding: '3px 0', width: '25%' }}>
                      {showDate ? (row.date ? new Date(row.date).toLocaleDateString('en-GB') : '—') : ''}
                    </td>
                    <td style={{ textAlign: 'left', textTransform: 'uppercase', padding: '3px 0', width: '55%' }}>
                      {row.item_name}
                    </td>
                    <td className="text-right font-bold" style={{ padding: '3px 0', width: '20%' }}>
                      {parseFloat(row.inward_pcs || 0).toLocaleString('en-IN')}
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
                <td colSpan="2" style={{ textAlign: 'right', padding: '5px 10px 5px 0' }}>Report Total:</td>
                <td className="text-right font-bold" style={{ padding: '5px 0' }}>{totals.inward.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          )}
        </table>

      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintJobSummaryReport;
