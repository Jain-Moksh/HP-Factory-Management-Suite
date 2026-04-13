import React from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  // Fill functionality
  const paginate = (rawItems) => {
    const pages = [];
    const chunks = [];
    for (let i = 0; i < rawItems.length; i += ROWS_PER_PAGE) {
      chunks.push(rawItems.slice(i, i + ROWS_PER_PAGE));
    }
    return chunks;
  };

  const itemPages = paginate(items);
  const totalPages = itemPages.length;

  const CSS = `
    /* Page Configuration */
    @media print {
      @page {
        size: A5 portrait;
        margin: 5mm;
      }
      body * { visibility: hidden; }
      .print-container, .print-container * { visibility: visible; }
      .print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
      }
    }

    .print-container {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #000;
    }

    .bill-page {
      width: 148mm;
      height: 148mm; /* Exactly as requested */
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-after: always;
      background: white;
      border: none; /* No outer border */
    }

    .bill-page:last-child {
      page-break-after: auto;
    }

    /* 1. TOP SECTION */
    .section-top {
      border: 1px solid #000;
      margin-bottom: 2mm;
      display: flex;
      flex-shrink: 0;
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
    }

    /* 2. MIDDLE SECTION (Product Table) */
    .section-middle {
      flex-grow: 1;
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
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
      font-size: 10.5px;
      height: 6mm; /* Fixed height helps visual consistency */
      vertical-align: middle;
      box-sizing: border-box;
    }
    .bill-table td:last-child { border-right: none; }

    /* Column Widths */
    .c-no    { width: 7%; text-align: center; }
    .c-bund  { width: 8%; text-align: center; }
    .c-desc  { width: ${hasDiscount ? '37%' : '46%'}; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .c-qty   { width: 9%; text-align: center; }
    .c-unit  { width: 8%; text-align: center; }
    .c-rate  { width: 11%; text-align: right; }
    .c-disc  { width: 9%; text-align: right; }
    .c-total { width: 11%; text-align: right; font-weight: 700; }

    /* 3. BOTTOM SECTION */
    .section-bottom {
      margin-top: auto;
      padding-top: 2mm;
      flex-shrink: 0;
    }

    .totals-box {
      width: 55%;
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
      margin-top: 2mm;
      font-size: 9px;
    }
    .words {
      font-style: italic;
      margin-bottom: 2mm;
      border-bottom: 0.5px dashed #ccc;
      padding-bottom: 1mm;
    }
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 4mm;
    }
    .sig-box {
      text-align: center;
      width: 40mm;
    }
    .sig-line {
      border-top: 1px solid #000;
      margin-bottom: 1mm;
    }
    .sig-text {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
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

  return (
    <div className="print-container">
      <style>{CSS}</style>
      
      {itemPages.map((chunk, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === totalPages - 1;
        const serialOffset = pageIndex * ROWS_PER_PAGE;
        
        // Calculate empty rows to fill
        const emptyRows = Array.from({ length: Math.max(0, ROWS_PER_PAGE - chunk.length) });

        return (
          <div key={pageIndex} className="bill-page">
            
            {/* 1. TOP SECTION */}
            <div className="watermark">Tax Invoice</div>
            
            <div className="section-top">
              <div className="top-left">
                <div className="party-title">{data.clientRawName || data.clientName}</div>
                <div className="info-row">
                  <div className="info-val">
                    {[data.address1, data.address2].filter(Boolean).join(', ')}
                  </div>
                </div>
                {isFirst && (data.short_remark || data.long_remark) && (
                  <div className="info-row" style={{ marginTop: '1.5mm' }}>
                    <div className="info-label">Remarks:</div>
                    <div className="info-val">{data.short_remark || data.long_remark}</div>
                  </div>
                )}
              </div>
              <div className="top-right">
                <div className="info-row">
                  <div className="info-label">Inv No:</div>
                  <div className="info-val" style={{ fontWeight: 800 }}>#{data.challanNo}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Date:</div>
                  <div className="info-val">{data.date}</div>
                </div>
                {data.transporterName && (
                  <div className="info-row">
                    <div className="info-label">Transport:</div>
                    <div className="info-val">{data.transporterName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. MIDDLE SECTION (Table) */}
            <div className="section-middle">
              <table className="bill-table">
                <thead>
                  <tr>
                    <th className="c-no">#</th>
                    <th className="c-bund">Bundle</th>
                    <th className="c-desc">Description</th>
                    <th className="c-qty">Qty</th>
                    <th className="c-unit">Unit</th>
                    <th className="c-rate">Rate</th>
                    {hasDiscount && <th className="c-disc">Disc</th>}
                    <th className="c-total">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => {
                    const bundle = item.qty && item.conversion ? (Math.floor(parseFloat(item.qty) / parseFloat(item.conversion))) : '—';
                    return (
                      <tr key={idx}>
                        <td className="c-no">{serialOffset + idx + 1}</td>
                        <td className="c-bund">{bundle}</td>
                        <td className="c-desc">{item.item}</td>
                        <td className="c-qty">{item.qty}</td>
                        <td className="c-unit">{item.unit}</td>
                        <td className="c-rate">{fmt(item.rate)}</td>
                        {hasDiscount && <td className="c-disc">{fmt(item.dAmount)}</td>}
                        <td className="c-total">{fmt(item.total)}</td>
                      </tr>
                    );
                  })}
                  {/* Empty Rows Fill */}
                  {emptyRows.map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td className="c-no"></td>
                      <td className="c-bund"></td>
                      <td className="c-desc"></td>
                      <td className="c-qty"></td>
                      <td className="c-unit"></td>
                      <td className="c-rate"></td>
                      {hasDiscount && <td className="c-disc"></td>}
                      <td className="c-total"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. BOTTOM SECTION */}
            <div className="section-bottom">
              {isLast && (
                <>
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

                  <div className="footer-extra">
                    <div className="words">
                      <strong>Amount in words:</strong> {amountInWords(data.grandTotal)}
                    </div>
                    <div className="sig-row">
                      <div className="sig-box">
                        <div className="sig-line"></div>
                        <div className="sig-text">Receiver's Signature</div>
                      </div>
                      <div className="sig-box">
                        <div className="sig-line"></div>
                        <div className="sig-text">Authorised Signatory</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {!isLast && (
                <div style={{ textAlign: 'right', fontSize: '10px', fontStyle: 'italic', fontWeight: 700 }}>
                  Continued on next page...
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
