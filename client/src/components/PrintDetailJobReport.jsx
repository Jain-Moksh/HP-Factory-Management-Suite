import React from 'react';
import { createPortal } from 'react-dom';

const PrintDetailJobReport = ({ data, startDate, endDate }) => {
  const CSS = `
    @media print {
      @page {
        size: A4 portrait;
        margin: 12mm;
      }
      
      #root {
        display: none !important;
      }

      .print-container {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        z-index: 99999 !important;
        background: white !important;
        visibility: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-container * {
        visibility: visible !important;
      }
    }

    @media screen {
      .print-container {
        display: none;
      }
    }

    .print-report-container {
      font-family: Arial, sans-serif;
      color: #000;
      width: 100%;
    }

    .date-section {
      display: flex;
      justify-content: center;
      gap: 50px;
      margin-bottom: 20px;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 10px 0;
    }

    .date-info {
      font-size: 13px;
      text-transform: uppercase;
    }

    .date-info span {
      font-weight: bold;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .report-table th, .report-table td {
      border: 1px solid #000;
      padding: 6px 10px;
      font-size: 12px;
      text-align: left;
    }

    .report-table th {
      background-color: #f2f2f2 !important;
      font-weight: bold;
      text-transform: uppercase;
    }

    .report-table tr {
      page-break-inside: avoid;
    }

    .report-table thead {
      display: table-header-group;
    }

    .text-right {
      text-align: right;
    }

    .footer {
      margin-top: 30px;
      text-align: right;
      font-size: 10px;
      font-style: italic;
      color: #666;
    }
  `;

  const portalContent = (
    <div className="print-container">
      <style>{CSS}</style>
      <div className="print-report-container">
        {/* Date Section */}
        <div className="date-section">
          <div className="date-info">
            <span>Start Date :</span> {startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'N/A'}
          </div>
          <div className="date-info">
            <span>End Date :</span> {endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'N/A'}
          </div>
        </div>

        {/* Data Table */}
        <table className="report-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Date</th>
              <th style={{ width: '60%' }}>Item Name</th>
              <th style={{ width: '20%' }} className="text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => {
                const isFirstOfDate = index === 0 || new Date(row.date).toLocaleDateString('en-GB') !== new Date(data[index - 1].date).toLocaleDateString('en-GB');
                return (
                  <tr key={row.purchase_item_id}>
                    <td style={{ fontWeight: 'bold' }}>
                      {isFirstOfDate ? new Date(row.date).toLocaleDateString('en-GB') : ''}
                    </td>
                    <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {row.item_name}
                    </td>
                    <td className="text-right" style={{ fontWeight: 'bold' }}>
                      {parseFloat(row.quantity).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', fontStyle: 'italic' }}>
                  No inward stock records found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="footer">
          Generated on: {new Date().toLocaleString('en-GB')}
        </div>
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintDetailJobReport;
