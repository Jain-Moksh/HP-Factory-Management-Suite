/**
 * Generates the base CSS for printing to ensure only the print container is visible.
 */
export const getBasePrintCSS = (config) => `
  @media print {
    @page {
      size: ${config.width} ${config.height} portrait;
      margin: 0 !important;
    }
    
    /* Hide EVERYTHING in the body except our print container */
    body > *:not(.print-container) {
      display: none !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      height: auto !important;
      width: 100% !important;
      overflow: visible !important;
    }

    .print-container {
      display: block !important;
      position: relative !important;
      width: ${config.width} !important;
      height: auto !important;
      margin: 0 auto !important;
      padding: ${config.margin} !important;
      background: white !important;
      box-sizing: border-box !important;
      page-break-after: avoid !important;
    }
  }

  @media screen {
    .print-container {
      display: none !important;
    }
  }
`;

/**
 * Common table styles for accounting reports - Clean, borderless version
 */
export const getReportTableCSS = (config) => `
  .report-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: ${config.fontSize};
    color: #000 !important;
    margin-top: 5px;
  }

  .report-table th {
    border-bottom: 2px solid #000 !important; /* Keep a single line for header */
    padding: ${config.tablePadding} !important;
    background-color: transparent !important;
    font-weight: 800;
    text-transform: uppercase;
    text-align: left;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .report-table td {
    border: none !important; /* Remove all cell borders */
    padding: ${config.tablePadding} !important;
    height: ${config.rowHeight} !important;
    vertical-align: middle;
    color: #000 !important;
  }

  /* Optional: Add a very faint bottom border to rows for readability if needed, 
     but user asked to "remove tables", so let's go purely borderless */

  .report-table thead {
    display: table-header-group;
  }

  .report-table tr {
    page-break-inside: avoid;
  }
`;
