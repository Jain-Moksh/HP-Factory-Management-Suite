import React from 'react';
import { createPortal } from 'react-dom';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const numToWords = (n) => {
  n = Math.round(n);
  if (n === 0) return 'Zero';
  if (n < 0) return 'Minus ' + numToWords(-n);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let words = '';
  if (n >= 10000000) { words += numToWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
  if (n >= 100000)   { words += numToWords(Math.floor(n / 100000))   + ' Lakh ';  n %= 100000;   }
  if (n >= 1000)     { words += numToWords(Math.floor(n / 1000))     + ' Thousand '; n %= 1000;  }
  if (n >= 100)      { words += numToWords(Math.floor(n / 100))      + ' Hundred '; n %= 100;    }
  if (n >= 20)       { words += tens[Math.floor(n / 10)] + ' '; n %= 10; }
  if (n > 0)         { words += ones[n] + ' '; }
  return words.trim();
};

const amountInWords = (amount) => {
  const n = parseFloat(amount) || 0;
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = 'Rupees ' + numToWords(rupees);
  if (paise > 0) result += ' and ' + numToWords(paise) + ' Paise';
  return result + ' Only';
};

// ─── Component ───────────────────────────────────────────────────────────────
const PrintInvoice = ({ data, items }) => {
  // Configurable pagination
  const ROWS_PER_PAGE = 22; 
  // Conditionally show discount column
  const hasDiscount = items.some(item => parseFloat(item.dAmount) > 0);

  const paginate = (rawItems) => {
    const pages = [];
    const chunks = [];
    for (let i = 0; i < rawItems.length; i += ROWS_PER_PAGE) {
      chunks.push(rawItems.slice(i, i + ROWS_PER_PAGE));
    }
    return chunks;
  };

  const itemPages = React.useMemo(() => paginate(items), [items]);
  const totalPages = itemPages.length;

  const CSS = `
    /* 1. Print Master Controls */
    @media print {
      @page {
        size: 148mm 210mm;
        margin: 0;
      }
      
      /* THE KEY: Hide the entire React App root to kill its height */
      #root {
        display: none !important;
      }

      /* Show ONLY the portal content */
      .print-container {
        display: block !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 148mm !important;
        z-index: 99999 !important;
        background: white !important;
        visibility: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-container * {
        visibility: visible !important;
      }

      .bill-page {
        height: 210mm !important;
        width: 148mm !important;
        page-break-after: always !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
      
      .bill-page:last-child {
        page-break-after: avoid !important;
      }
    }

    /* 2. Screen Preview Styling (Paper Look) */
    @media screen {
      .print-container {
        background: #dee2e6;
        padding: 40px 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      .bill-page {
        box-shadow: 0 15px 45px rgba(0,0,0,0.2);
        margin-bottom: 40px;
        background: white;
      }
    }

    /* 3. Base Layout (Shared) */
    .print-container {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #000;
    }

    .bill-page {
      width: 148mm;
      height: 210mm;
      display: flex;
      flex-direction: column;
      padding: 6mm;
      position: relative;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .bill-page * {
      box-sizing: border-box;
    }

    /* 4. CONTENT SECTIONS */
    .section-top {
      border: 1px solid #000;
      margin: 0 auto 2mm auto;
      display: flex;
      flex-shrink: 0;
      width: 98%;
    }
    .top-left {
      flex: 1.5;
      padding: 2mm;
      border-right: 1px solid #000;
    }
    .top-right {
      flex: 1;
      padding: 2mm;
    }
    .party-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 1mm;
    }
    .info-row {
      display: flex;
      font-size: 10px;
      margin-bottom: 0.5mm;
    }
    .info-label {
      font-weight: 700;
      width: 20mm;
      flex-shrink: 0;
    }
    .info-val {
      font-weight: 500;
      word-break: break-all;
    }

    .section-middle {
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: 98%;
      margin: 0 auto;
    }
    .bill-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .bill-table th {
      border-bottom: 1px solid #000;
      border-right: 1px solid #000;
      padding: 1.5mm 1mm;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      background: #fdfdfd;
      text-align: center;
    }
    .bill-table th:last-child { border-right: none; }

    .bill-table td {
      border-right: 1px solid #000;
      padding: 0.8mm 1.5mm;
      font-size: 10px;
      height: 6mm;
      vertical-align: middle;
    }
    .bill-table td:last-child { border-right: none; }

    /* Column Widths */
    .c-bund  { width: 8%; text-align: center; }
    .c-desc  { width: ${hasDiscount ? '44%' : '53%'}; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .c-qty   { width: 17%; text-align: center; }
    .c-rate  { width: 11%; text-align: right; }
    .c-disc  { width: 9%; text-align: right; }
    .c-total { width: 11%; text-align: right; font-weight: 700; }

    .section-bottom {
      padding-top: 1mm;
      flex-shrink: 0;
    }


    .page-total-container {
      display: flex;
      justify-content: flex-end;
      width: 98%;
      margin: 0 auto;
      padding: 2mm 0;
    }

    .page-total {
      border: 1px solid #000;
      padding: 1.5mm 3mm;
      font-size: 12px;
      font-weight: 800;
      background: #f9f9f9;
      min-width: 50%;
      text-align: right;
      display: flex;
      justify-content: space-between;
    }

    .bottom-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      gap: 10px;
      width: 98%;
      margin: 2mm auto 0 auto;
    }

    .remark-box {
      width: 60%;
      border: 1px solid black;
      padding: 5px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .remark-title {
      font-size: 11px;
      margin-bottom: 3px;
      font-weight: 700;
    }

    .remark-content {
      font-size: 10px;
      font-style: italic;
      color: #333;
      white-space: pre-wrap;
    }

    .totals-box {
      width: 38%;
      margin-left: auto;
      border: 1px solid #000;
      padding: 1.5mm;
    }

    .t-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 0.3mm 0;
    }
    .t-label {
      font-weight: 500;
      color: #333;
    }
    .t-val {
      font-weight: 700;
    }
    .t-grand {
      border-top: 1px solid #000;
      margin-top: 1mm;
      padding-top: 1mm;
      font-size: 14px;
      font-weight: 900;
    }

    .footer-extra {
      margin-top: 1mm;
      font-size: 8px;
    }
    
    .watermark {
      text-align: center;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 5px;
      text-transform: uppercase;
      padding-bottom: 1mm;
      border-bottom: 2px solid #000;
      margin-bottom: 2mm;
    }
  `;

  const portalContent = (
    <div className="print-container">
      <style>{CSS}</style>
      
      {itemPages.map((chunk, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === totalPages - 1;
        const chunkTotal = chunk.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
        const serialOffset = pageIndex * ROWS_PER_PAGE;
        const emptyRows = Array.from({ length: Math.max(0, ROWS_PER_PAGE - chunk.length) });


        return (
          <div key={pageIndex} className="bill-page">
            <div className="watermark">ORDER SUMMARY</div>
            
            {isFirst && (
              <div className="section-top">
                <div className="top-left">
                  <div className="party-title">{data.clientRawName || data.clientName}</div>
                  <div className="info-row">
                    <div className="info-val">
                      {[data.address1, data.address2].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="top-right">
                  <div className="info-row">
                    <div className="info-label">No :</div>
                    <div className="info-val" style={{ fontWeight: 800 }}>#{data.challanNo}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Date:</div>
                    <div className="info-val">{formatDate(data.date)}</div>
                  </div>
                  {data.transporterName && (
                    <div className="info-row">
                      <div className="info-label">Transport:</div>
                      <div className="info-val">{data.transporterName}</div>
                    </div>
                  )}
                  {data.short_remark && (
                    <div className="info-row">
                      <div className="info-label">Parcel:</div>
                      <div className="info-val">{data.short_remark}</div>
                    </div>
                  )}
                </div>
              </div>
            )}


            <div className="section-middle">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th className="c-bund">Bundle</th>
                    <th className="c-desc">Description</th>
                    <th className="c-qty">Qty</th>
                    <th className="c-rate">Rate</th>
                    {hasDiscount && <th className="c-disc">Disc</th>}
                    <th className="c-total">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const bundle = item.qty && item.conversion ? (parseFloat(item.qty) / parseFloat(item.conversion)).toFixed(2) : '—';
                    return (
                      <tr key={idx}>
                        <td className="c-bund">{bundle}</td>
                        <td className="c-desc">{item.item}</td>
                        <td className="c-qty">{item.qty} {item.unit}</td>
                        <td className="c-rate">{fmt(item.rate)}</td>
                        {hasDiscount && <td className="c-disc">{fmt(item.dAmount)}</td>}
                        <td className="c-total">{fmt(item.total)}</td>
                      </tr>
                    );
                  })}
                  {emptyRows.map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="c-bund"></td>
                      <td className="c-desc"></td>
                      <td className="c-qty"></td>
                      <td className="c-rate"></td>
                      {hasDiscount && <td className="c-disc"></td>}
                      <td className="c-total"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section-bottom">
              {isLast ? (
                <div className="bottom-wrapper">
                  <div className="remark-box">
                    <div className="remark-title">Invoice Remark:</div>
                    <div className="remark-content">{data.long_remark?.trim() || ''}</div>
                  </div>

                  <div className="totals-box">
                    <div className="t-row">
                      <span className="t-label">Items Subtotal</span>
                      <span className="t-val">₹{fmt(data.itemsSubtotal)}</span>
                    </div>
                    {parseFloat(data.transport) > 0 && (
                      <div className="t-row">
                        <span className="t-label">Transport</span>
                        <span className="t-val">₹{fmt(data.transport)}</span>
                      </div>
                    )}
                    {parseFloat(data.packing) > 0 && (
                      <div className="t-row">
                        <span className="t-label">Packing</span>
                        <span className="t-val">₹{fmt(data.packing)}</span>
                      </div>
                    )}
                    {parseFloat(data.extraDiscountAmount) > 0 && (
                      <div className="t-row">
                        <span className="t-label">Discount ({data.extraDiscountPercent}%)</span>
                        <span className="t-val">(-) ₹{fmt(data.extraDiscountAmount)}</span>
                      </div>
                    )}
                    {data.roundOffDisplay !== '0.00' && (
                      <div className="t-row">
                        <span className="t-label">Round Off</span>
                        <span className="t-val">{data.roundOffDisplay}</span>
                      </div>
                    )}
                    <div className="t-row t-grand">
                      <span>Grand Total</span>
                      <span>₹{fmt(data.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                totalPages > 1 && (
                  <div className="page-total-container">
                    <div className="page-total">
                      <span>Page Total:</span>
                      <span>₹{fmt(chunkTotal)}</span>
                    </div>
                  </div>
                )
              )}

            </div>
          </div>
        );
      })}
    </div>
  );

  return createPortal(portalContent, document.body);
};

export default PrintInvoice;
