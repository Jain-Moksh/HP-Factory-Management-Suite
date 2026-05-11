# Reports Documentation

## How Reports Work
Reports in this application are implemented as React components that fetch data from specific backend endpoints. They typically follow a pattern:
1.  **Filters**: Most reports have a filter bar at the top (Dates, Searchable Selects for Parties/Groups/Jobbers).
2.  **Data Fetching**: Data is fetched using `fetch` from `API_BASE_URL/reports/...`.
3.  **State Management**: Use `useState` for filter values, report data, and loading state.
4.  **Display**: Data is displayed in a styled table within a `Layout` component.
5.  **Navigation**: Some reports allow clicking on rows to drill down into detailed views.

## Reusable Components
The following components are designed for or frequently used in reports:
*   `Layout`: Wraps the entire page, providing the sidebar and main content area.
*   `PageHeader`: Displays the title, subtitle, and optional back button.
*   `SearchableSelect`: A custom searchable dropdown for selecting parties, items, etc.
*   `Card`: For dashboard-style metric displays (used in Reports Dashboard).
*   `FilterBar`: Generic filter bar component for dates and search.
*   `MonthFilterFooter`: Used in some reports for quick month-wise filtering.

## Existing Reports
| Report Name | Location | Route | Description |
| :--- | :--- | :--- | :--- |
| Reports Dashboard | `client/src/pages/reports/ReportsDashboard.jsx` | `/reports` | Hub for all reports. |
| Group Sales Report | `client/src/pages/reports/GroupSalesReport.jsx` | `/reports/group-sales` | Aggregated sales by group. |
| Job Work Detail | `client/src/pages/reports/JobWorkDetail.jsx` | `/reports/job-work-detail/:jobberId/:itemId` | Detailed ledger for a specific jobber/item. |
| Job Work Report | `client/src/pages/reports/JobWorkReport.jsx` | `/reports/job-work` | Summary of work done by jobbers. |
| Party Billing Detail | `client/src/pages/reports/PartyBillingDetail.jsx` | `/reports/party-billing-detail/:clientId` | Specific challan details for a party. |
| Party Sales Report | `client/src/pages/reports/PartySalesReport.jsx` | `/reports/party-sales` | Sales performance by individual parties. |
| Party Stock Detail | `client/src/pages/reports/PartyStockDetail.jsx` | `/reports/party-stock-detail/:clientId/:itemId` | Detailed stock ledger for a party/item. |
| Party Stock Report | `client/src/pages/reports/PartyStockReport.jsx` | `/reports/party-stock` | Summary of stock held by parties. |
| Stock Summary | `client/src/pages/StockSummary.jsx` | `/stock-summary` | Overall inventory levels. |
| Item Stock Details | `client/src/pages/ItemStockDetails.jsx` | `/item-stock-details/:id` | Movement log for a specific item. |
| Day Book | `client/src/pages/DayBook.jsx` | `/day-book` | Combined ledger of all Billing and Purchase. |

## Instructions for Creating a New Report
1.  **Define the Route**: Add the new report route in `client/src/App.jsx`.
2.  **Add to Dashboard**: Add a new tile for the report in `client/src/pages/reports/ReportsDashboard.jsx`.
3.  **Component Structure**:
    *   Use `Layout` as the root wrapper.
    *   Use `PageHeader` for the title and subtitle.
    *   Implement a filter section using `SearchableSelect` and native date inputs.
    *   Style the table using the standard `bg-table-header` for the `<thead>`.
    *   Handle loading states with a spinner.
    *   Add a summary/total row in `<tfoot>` if applicable.
    *   Ensure all numeric values are formatted using `toLocaleString`.
4.  **Backend Integration**:
    *   Ensure the corresponding SQL query exists in the backend.
    *   Expose the endpoint via the reports router in the server.

---

## Database: Job Work (Purchase) Schema
The following tables are central to Job Work (formerly Purchase) reporting. Note that in the UI, "Purchase" has been renamed to "Job Work".

### `purchase` Table
Stores the header information for a job work inward entry.
*   `id`: SERIAL PRIMARY KEY.
*   `jobber_id`: INT (FOREIGN KEY to `jobbers.id`).
*   `date`: DATE of the transaction.
*   `remark`: TEXT (Optional notes).
*   `challan_no`: TEXT (Unique identifier for the inward challan).
*   `created_at`: TIMESTAMP (Default CURRENT_TIMESTAMP).

### `purchase_items` Table
Stores individual line items for a job work entry.
*   `id`: SERIAL PRIMARY KEY.
*   `purchase_id`: INT (FOREIGN KEY to `purchase.id` ON DELETE CASCADE).
*   `item_id`: INT (FOREIGN KEY to `items.id`).
*   `quantity`: NUMERIC (Number of items received).
*   `unit`: TEXT (Unit of measurement, e.g., PCS, KG).
*   `order_index`: INT (Maintains visual order of items, defaults to 0).
