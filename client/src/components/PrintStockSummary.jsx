import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintStockSummary = ({ items, paperSize = 'A4' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;

  // Group items into pairs for the 2-column layout
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push([items[i], items[i + 1]]);
  }

  const CSS = `
    ${getBasePrintCSS(config)}
    ${getReportTableCSS(config)}

    @media print {
      @page { size: A4; margin: 5mm !important; }
    }

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
      font-size: 11px !important;
      color: #000 !important;
      font-weight: 700;
    }

    .report-table th {
      font-size: 11px !important;
      padding: 2px 4px !important;
    }

    .report-table td {
      padding: 2px 4px !important;
      height: 14px !important;
    }

    /* Column Widths for 2-column layout */
    .col-item { width: 35%; }
    .col-qty { width: 15%; text-align: right; }

    .text-right { text-align: right !important; }
    .font-black { font-weight: 900; }
    
    .report-table tbody tr td {
      border-bottom: 1px solid #000 !important;
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
              <th className="col-qty text-right" style={{ borderRight: '2px solid #000' }}>Current Stock</th>
              <th className="col-item" style={{ paddingLeft: '20px' }}>Item Name</th>
              <th className="col-qty text-right">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {/* Left Column Item */}
                  <td className="col-item" style={{ textTransform: 'uppercase' }}>
                    {row[0].name}
                  </td>
                  <td className="col-qty font-black text-right" style={{ borderRight: '2px solid #000' }}>
                    {row[0].stock} <span style={{ fontSize: '0.75em', opacity: 0.8 }}>{row[0].unit}</span>
                  </td>

                  {/* Right Column Item */}
                  {row[1] ? (
                    <>
                      <td className="col-item" style={{ textTransform: 'uppercase', paddingLeft: '20px' }}>
                        {row[1].name}
                      </td>
                      <td className="col-qty font-black text-right">
                        {row[1].stock} <span style={{ fontSize: '0.75em', opacity: 0.8 }}>{row[1].unit}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="col-item" style={{ paddingLeft: '20px' }}></td>
                      <td className="col-qty text-right"></td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic', borderRight: 'none' }}>
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
