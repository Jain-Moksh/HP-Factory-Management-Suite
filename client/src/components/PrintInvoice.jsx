import React from 'react';

const PrintInvoice = ({ data, items }) => {
  const ITEMS_PER_PAGE = 20;

  const chunkItems = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const itemChunks = chunkItems(items, ITEMS_PER_PAGE);
  const totalPages = itemChunks.length;

  return (
    <div className="print-container">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container,
            .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
            }
            @page {
              size: A5 landscape;
              margin: 10mm;
            }
            .print-page {
              width: 210mm;
              height: 148mm;
              padding: 0;
              margin: 0;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              font-family: 'Inter', sans-serif;
              color: #000;
              position: relative;
              background: white;
              box-sizing: border-box;
            }
            .print-page:last-child {
              page-break-after: auto;
            }

            /* Header */
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .invoice-title {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: 3px;
            }
            .page-info {
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
            }

            /* Client Box */
            .client-details-grid {
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 16px;
              margin-bottom: 8px;
              padding: 6px 8px;
              border: 1px solid #ccc;
              background: #fafafa;
            }
            .detail-row {
              display: flex;
              margin-bottom: 2px;
            }
            .detail-label {
              font-weight: 700;
              width: 90px;
              text-transform: uppercase;
              font-size: 8px;
              color: #555;
              flex-shrink: 0;
            }
            .detail-value {
              flex: 1;
              font-weight: 500;
              font-size: 10px;
            }

            /* Table */
            .product-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .product-table th {
              background: #334155;
              color: #fff;
              border: 1px solid #000;
              padding: 4px 5px;
              font-size: 9px;
              text-transform: uppercase;
              font-weight: 800;
              text-align: center;
            }
            .product-table td {
              border: 1px solid #666;
              padding: 3px 5px;
              font-size: 10px;
              font-weight: 500;
            }
            .col-name  { text-align: left;   width: 38%; }
            .col-qty   { text-align: center;  width: 9%;  }
            .col-unit  { text-align: center;  width: 8%;  }
            .col-rate  { text-align: right;   width: 11%; }
            .col-disc-p{ text-align: center;  width: 8%;  }
            .col-disc-a{ text-align: right;   width: 11%; }
            .col-total { text-align: right;   width: 15%; font-weight: 700; }

            /* Footer */
            .page-footer {
              margin-top: auto;
              padding-top: 6px;
            }
            .page-total-row {
              display: flex;
              justify-content: flex-end;
              font-size: 10px;
              font-weight: 700;
              border-top: 1px solid #000;
              padding-top: 4px;
            }

            /* Final Totals Box */
            .final-total-box {
              margin-top: 8px;
              border: 2px solid #000;
              padding: 6px 8px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 4px 20px;
            }
            .total-item {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              padding: 1px 0;
            }
            .total-item span:first-child {
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9px;
              color: #444;
            }
            .grand-total-row {
              grid-column: span 2;
              border-top: 2px solid #000;
              margin-top: 4px;
              padding-top: 5px;
              display: flex;
              justify-content: space-between;
              font-size: 15px;
              font-weight: 900;
              text-transform: uppercase;
            }
          }
        `}
      </style>

      {itemChunks.map((chunk, index) => {
        const isFirstPage = index === 0;
        const isLastPage = index === totalPages - 1;
        const pageTotal = chunk.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        return (
          <div key={index} className="print-page">
            {/* Page Header */}
            <div className="invoice-header">
              <div className="invoice-title">INVOICE</div>
              <div className="page-info">Page {index + 1} of {totalPages}</div>
            </div>

            {/* Client Details — First Page Only */}
            {isFirstPage && (
              <div className="client-details-grid">
                <div>
                  <div className="detail-row">
                    <div className="detail-label">Party:</div>
                    <div className="detail-value" style={{ fontSize: '12px', fontWeight: 800 }}>{data.clientName}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Address:</div>
                    <div className="detail-value">
                      {data.address1}{data.address2 ? `, ${data.address2}` : ''}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Remarks:</div>
                    <div className="detail-value">{data.short_remark || data.long_remark || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="detail-row">
                    <div className="detail-label">Invoice No:</div>
                    <div className="detail-value" style={{ fontWeight: 800 }}>{data.challanNo}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Date:</div>
                    <div className="detail-value">{data.date}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Transporter:</div>
                    <div className="detail-value">{data.transporterName || '—'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Table */}
            <table className="product-table">
              <thead>
                <tr>
                  <th className="col-name">Item Name</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-unit">Unit</th>
                  <th className="col-rate">Rate (₹)</th>
                  <th className="col-disc-p">Disc %</th>
                  <th className="col-disc-a">Disc (₹)</th>
                  <th className="col-total">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((item, i) => (
                  <tr key={i}>
                    <td className="col-name">{item.item}</td>
                    <td className="col-qty">{item.qty}</td>
                    <td className="col-unit">{item.unit}</td>
                    <td className="col-rate">₹{parseFloat(item.rate).toFixed(2)}</td>
                    <td className="col-disc-p">{item.dPercent || 0}%</td>
                    <td className="col-disc-a">₹{parseFloat(item.dAmount || 0).toFixed(2)}</td>
                    <td className="col-total">₹{parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="page-footer">
              <div className="page-total-row">
                <span>PAGE TOTAL: ₹{pageTotal.toFixed(2)}</span>
              </div>

              {/* Final Totals — Last Page Only */}
              {isLastPage && (
                <div className="final-total-box">
                  <div className="total-item">
                    <span>Items Subtotal</span>
                    <span>₹{parseFloat(data.itemsSubtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-item">
                    <span>Transport</span>
                    <span>₹{parseFloat(data.transport || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-item">
                    <span>Packing</span>
                    <span>₹{parseFloat(data.packing || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-item">
                    <span>Discount</span>
                    <span>- ₹{parseFloat(data.extraDiscountAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-item">
                    <span>Round Off</span>
                    <span>{data.roundOffDisplay}</span>
                  </div>
                  <div className="grand-total-row">
                    <span>Grand Total</span>
                    <span>₹{parseFloat(data.grandTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrintInvoice;
