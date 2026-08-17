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
    acc.outward += parseFloat(row.outward_pcs) || 0;
    acc.loss += parseFloat(row.loss_pcs) || 0;
    acc.pending += parseFloat(row.pending_pcs) || 0;
    return acc;
  }, { inward: 0, outward: 0, loss: 0, pending: 0 });

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
              <th style={{ textAlign: 'left', width: '40%', padding: '4px 0' }}>Item Name</th>
              <th className="text-center" style={{ width: '15%', padding: '4px 0' }}>Inward Pcs</th>
              <th className="text-center" style={{ width: '15%', padding: '4px 0' }}>Outward Pcs</th>
              <th className="text-center" style={{ width: '15%', padding: '4px 0' }}>Loss Pcs</th>
              <th className="text-center" style={{ width: '15%', padding: '4px 0' }}>Pending Pcs</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ textAlign: 'left', textTransform: 'uppercase', padding: '3px 0' }}>
                    {row.item_name}
                  </td>
                  <td className="text-center" style={{ padding: '3px 0' }}>
                    {parseFloat(row.inward_pcs || 0).toLocaleString()}
                  </td>
                  <td className="text-center" style={{ padding: '3px 0' }}>
                    {parseFloat(row.outward_pcs || 0).toLocaleString()}
                  </td>
                  <td className="text-center" style={{ padding: '3px 0', color: '#ef4444' }}>
                    {parseFloat(row.loss_pcs || 0).toLocaleString()}
                  </td>
                  <td className="text-center font-bold" style={{ padding: '3px 0' }}>
                    {parseFloat(row.pending_pcs || 0).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #000', fontWeight: '900' }}>
                <td style={{ textAlign: 'right', padding: '5px 10px 5px 0' }}>Report Total:</td>
                <td className="text-center" style={{ padding: '5px 0' }}>{totals.inward.toLocaleString()}</td>
                <td className="text-center" style={{ padding: '5px 0' }}>{totals.outward.toLocaleString()}</td>
                <td className="text-center" style={{ padding: '5px 0', color: '#ef4444' }}>{totals.loss.toLocaleString()}</td>
                <td className="text-center font-bold" style={{ padding: '5px 0' }}>{totals.pending.toLocaleString()}</td>
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
