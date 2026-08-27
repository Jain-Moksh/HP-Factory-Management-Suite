import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintStockSummary = ({ items, paperSize = 'A4' }) => {
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

    .report-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 15.5px !important;
      color: #000 !important;
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

    /* Column Widths */
    .col-item { width: 70%; }
    .col-qty { width: 30%; text-align: right; }

    .text-right { text-align: right !important; }
    .font-black { font-weight: 900; }
    
    .report-table tbody tr td {
      border-bottom: 1px solid #e0e0e0 !important;
    }
  `;

  const portalContent = (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="print-report-container">
        
        {/* Header */}
        <div className="report-header">
          <div className="report-title">Stock Summary Report</div>
        </div>

        {/* Data Table */}
        <table className="report-table">
          <thead>
            <tr>
              <th className="col-item">Item Name</th>
              <th className="col-qty text-right">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="col-item" style={{ textTransform: 'uppercase' }}>
                    {item.name}
                  </td>
                  <td className="col-qty font-black text-right">
                    {item.stock} <span style={{ fontSize: '0.75em', opacity: 0.8 }}>{item.unit}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                  No items in stock.
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

export default PrintStockSummary;
