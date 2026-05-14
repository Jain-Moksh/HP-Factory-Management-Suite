import React from 'react';
import { createPortal } from 'react-dom';
import { PAPER_CONFIG } from '../constants/printSettings';
import { getBasePrintCSS, getReportTableCSS } from '../utils/printUtils';

const PrintGroupPartySalesReport = ({ data, startDate, endDate, paperSize = 'A5' }) => {
  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A5;

  const CSS = `
    ${getBasePrintCSS(config)}
    ${getReportTableCSS(config)}

    .print-report-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #000 !important;
      width: 100%;
      line-height: 1.2;
      background: #fff !important;
    }

    .party-section {
      page-break-before: always;
      padding-top: 10px;
    }

    .party-section:first-child {
      page-break-before: auto;
      padding-top: 0;
    }

    .report-header {
      margin-bottom: 8px;
      border-bottom: 1.5px solid #000;
      padding-bottom: 4px;
    }

    .party-name-title {
      font-size: ${parseFloat(config.headerFontSize) * 1.5}px;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }

    .date-section {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      margin-bottom: 4px;
    }

    .date-info {
      font-size: ${parseFloat(config.fontSize) * 1.5}px;
      text-transform: uppercase;
      font-weight: 700;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: ${parseFloat(config.fontSize) * 1.5}px;
      color: #000 !important;
    }

    .report-table thead {
      display: table-header-group;
    }

    .report-table th {
      border: 1px solid #000 !important;
      padding: 6px 8px !important;
      background: #f0f0f0 !important;
      -webkit-print-color-adjust: exact;
      font-weight: 900;
      text-transform: uppercase;
    }

    .report-table td {
      border: 1px solid #000 !important;
      padding: 5px 8px !important;
      font-weight: 600;
    }

    /* Column Widths */
    .col-no { width: 25%; }
    .col-date { width: 35%; }
    .col-amount { width: 40%; text-align: right; }

    .text-right { text-align: right; }
    .font-black { font-weight: 900; }
    
    .party-total-row td {
      border-top: 2px solid #000 !important;
      font-weight: 900;
      padding-top: 6px !important;
      font-size: ${parseFloat(config.fontSize) * 1.65}px;
    }

    @media print {
      .party-section {
        page-break-inside: auto;
      }
      .report-table {
        page-break-inside: auto;
      }
      .report-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  `;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const portalContent = (
    <div className="print-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="print-report-container">
        {data.map((party, pIndex) => (
          <div key={party.client_id || pIndex} className="party-section">
            {/* Header for each party */}
            <div className="report-header">
              <div className="party-name-title">{party.client_name}</div>
              <div className="date-section">
                <div className="date-info">
                  <span>FROM :</span> {startDate ? formatDate(startDate) : 'ALL TIME'}
                </div>
                <div className="date-info">
                  <span>TO :</span> {endDate ? formatDate(endDate) : 'PRESENT'}
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <table className="report-table">
              <thead>
                <tr>
                  <th className="col-no">Challan No</th>
                  <th className="col-date">Date</th>
                  <th className="col-amount text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {party.transactions.map((t, tIndex) => (
                  <tr key={tIndex}>
                    <td className="col-no uppercase">{t.challan_no}</td>
                    <td className="col-date">{formatDate(t.date)}</td>
                    <td className="col-amount text-right">
                      ₹{parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(parseFloat(t.amount)) ? 0 : 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="party-total-row">
                  <td colSpan="2" className="text-right uppercase italic" style={{ border: 'none' }}>
                    Total Party Sales:
                  </td>
                  <td className="text-right font-black" style={{ borderLeft: '1px solid #000' }}>
                    ₹{parseFloat(party.party_total).toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(parseFloat(party.party_total)) ? 0 : 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintGroupPartySalesReport;
