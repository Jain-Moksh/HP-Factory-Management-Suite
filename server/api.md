# API Documentation - Accounting Software

This document provides a comprehensive list of all available API endpoints, their expected request formats, and response structures.

**Base URL**: `http://localhost:5000/api`

---

## 🏗️ MASTER APIs

All Master APIs support searching via the query parameter `?search=term`.

### 1. Items
Manages the inventory of items.

*   **GET `/items`**
    *   *Description*: List all items or search by name.
    *   *Query Params*: `search` (optional)
*   **GET `/items/:id`**
    *   *Description*: Fetch details of a single item.
*   **POST `/items`**
    *   *Description*: Create a new item.
    *   *Request Body*:
        ```json
        {
          "name": "Red Pen",
          "rate": 10.50,
          "stock": 100,
          "open_stock": 0,
          "conversion": 1,
          "unit": "Pcs",
          "min_stock": 20
        }
        ```
*   **PUT `/items/:id`**
    *   *Description*: Update an existing item.
    *   *Request Body*: Same as POST.
*   **DELETE `/items/:id`**
    *   *Description*: Securely delete an item.
    *   *Request Body*:
        ```json
        {
          "password": "your_del_pass_here"
        }
        ```
*   **GET `/items/:id/transactions`**
    *   *Description*: Fetch movement history (inward/outward) for a specific item. The response includes a standardized `name` field corresponding to the client name (for billing) or jobber name (for purchase).
    *   *Query Params*: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            {
              "challan_no": "103/apr/26-27",
              "date": "2026-04-16T00:00:00.000Z",
              "inward": 0,
              "outward": 10,
              "type": "billing",
              "name": "Acme Corp"
              "created_at": "2026-04-16T17:23:17.000Z"
            },
            {
              "challan_no": "P101/apr/26-27",
              "date": "2026-04-16T00:00:00.000Z",
              "inward": 50,
              "outward": 0,
              "type": "purchase",
              "created_at": "2026-04-16T17:20:10.000Z"
            }
          ]
        }
        ```

### 2. Clients
Manages customer/client records.

*   **GET `/clients`**
*   **GET `/clients/:id`**
*   **POST `/clients`**
    *   *Request Body*:
        ```json
        {
          "name": "Acme Corp",
          "street": "123 Business Rd",
          "city": "Mumbai",
          "shortform": "AC",
          "balance": 5000,
          "remark": "Regular client"
        }
        ```
*   **PUT `/clients/:id`**
*   **DELETE `/clients/:id`**
    *   *Description*: Securely delete a client (requires password).
    *   *Request Body*: `{"password": "your_del_pass"}`

### 3. Jobbers
Manages manufacturing/job worker records and their assigned items.

*   **GET `/jobbers`**
*   **GET `/jobbers/:id`**
*   **POST `/jobbers`**
    *   *Request Body*: `{"name": "John Doe", "item_ids": [1, 2]}` (item_ids is optional)
*   **PUT `/jobbers/:id`**
*   **DELETE `/jobbers/:id`**
    *   *Description*: Securely delete a jobber (requires password).
    *   *Request Body*: `{"password": "your_del_pass"}`

#### 🔗 Many-to-Many: Jobber Items
*   **POST `/jobbers/:id/items`**
    *   *Description*: Assign multiple items to a jobber.
    *   *Request Body*:
        ```json
        {
          "item_ids": [1, 2, 5]
        }
        ```
*   **GET `/jobbers/:id/items`**
    *   *Description*: Get all items currently assigned to a jobber with item names.

### 4. Transporters
Manages transport service records.

*   **GET `/transporters`**
*   **GET `/transporters/:id`**
*   **POST `/transporters`**
    *   *Request Body*: `{"name": "Blue Dart"}`
*   **PUT `/transporters/:id`**
*   **DELETE `/transporters/:id`**
    *   *Description*: Securely delete a transporter (requires password).
    *   *Request Body*: `{"password": "your_del_pass"}`

---

## 🧾 TRANSACTION MODULES

### 1. Billing (Invoices)
Used for sales/billing. Creating a bill automatically **decrements** item stock.

*   **POST `/billing`**
    *   *Description*: Create a new bill with multiple items (Transaction-safe). **Challan Number is automatically generated on the server** based on selected date and financial year.
    *   *Challan Format*: `<sequence>/<MONTH>/<FY>` (e.g., `103/JAN/25-26`). Sequence resets monthly.
    *   *Request Body*:
        ```json
        {
          "client_id": 1,
          "transporter_id": 2,
          "date": "2024-04-09",
          "transport_charge": 100,
          "packing_charge": 50,
          "discount_percent": 0,
          "discount_amount": 0,
          "total_amount": 1000,
          "short_remark": "Rush order",
          "long_remark": "Deliver to side entrance",
          "grand_total": 1150,
          "items": [
            {
              "item_id": 1,
              "rate": 100,
              "discount_percent": 5,
              "discount_amount": 5,
              "unit": "Pcs",
              "quantity": 10,
              "bundle": 1,
              "total_amount": 950
            }
          ]
        }
        ```
*   **GET `/billing/:id`**
    *   *Description*: Returns bill details, client name, transporter name, and item list with item names.
*   **GET `/billing`**
    *   *Description*: List all billing records with client names. Supports server-side filtering.
    *   *Query Params*:
        *   `searchChallan` (optional): Filter by challan number (ILIKE).
        *   `searchClient` (optional): Filter by client name (ILIKE).
        *   `startDate` (optional, YYYY-MM-DD): Filter records on or after this date.
        *   `endDate` (optional, YYYY-MM-DD): Filter records on or before this date.
        *   `month` (optional, 0-11): Filter by specific month.
        *   `year` (optional): Filter by specific year.
*   **GET `/billing/next-id`**
    *   *Description*: Fetch the dynamic next numeric ID for internal tracking. If `date` is provided, it returns the formatted Challan Number (same as `next-challan`).
    *   *Query Params*: `date` (optional, YYYY-MM-DD)
    *   *Response*: `{"success": true, "nextId": 105}` or `{"success": true, "nextId": "105/APR/26-27"}`
*   **GET `/billing/next-challan`**
    *   *Description*: Fetch the dynamically generated **next available** Challan Number for a specific date. Supports both Create and Edit modes. Acts as **Preview ONLY**.
    *   *Query Params*: `date` (required, YYYY-MM-DD), `billing_id` (optional, for edit mode to exclude the current record from sequence counting).
    *   *Response*:
        ```json
        {
          "success": true,
          "challan_no": "6/APR/26-27"
        }
        ```
*   **PUT `/billing/:id`**
    *   *Description*: Update an existing invoice and its items. This operation **reverts** the stock changes of the old bill and **applies** new stock changes. **Challan generation rules:** The frontend `challan_no` is ignored. If the month/FY changes, the backend automatically generates a new sequence number. Otherwise, the original sequence is retained. (e.g., `103/JAN/25-26`)
    *   *Request Body*: Same as POST.
*   **DELETE `/billing/:id`**
    *   *Description*: Securely delete an invoice. On deletion of invoice, associated item quantities are restored back to stock. Operation is transactional to ensure stock consistency.
    *   *Request Body*: `{"password": "your_del_pass"}`

### 2. Purchase
Used for receiving stock from jobbers. Creating a purchase automatically **increments** item stock.

*   **POST `/purchase`**
    *   *Description*: Create a new purchase record. **Challan Number is automatically generated on the server.**
    *   *Challan Format*: `P<sequence>/<MONTH>/<FY>` (e.g., `P103/JAN/25-26`). Sequence resets monthly.
    *   *Request Body*:
        ```json
        {
          "jobber_id": 1,
          "date": "2024-04-09",
          "remark": "Batch 101 received",
          "items": [
            {
              "item_id": 1,
              "quantity": 50,
              "unit": "Pcs"
            }
          ]
        }
        ```
*   **GET `/purchase/:id`**
    *   *Description*: Returns purchase details with jobber name and item list with item names.
*   **GET `/purchase`**
    *   *Description*: List all purchase transactions with jobber names.
*   **GET `/purchase/next-id`**
    *   *Description*: Fetch the next internal numeric sequence ID. If `date` is provided, returns the formatted Challan Number.
    *   *Response*: `{"success": true, "nextId": 50}` or `{"success": true, "nextId": "P50/APR/26-27"}`
*   **GET `/purchase/next-challan`**
    *   *Description*: Fetch the dynamically generated **next available** Challan Number for a specific date. Acts as **Preview ONLY**.
    *   *Query Params*: `date` (required, YYYY-MM-DD).
*   **PUT `/purchase/:id`**
    *   *Description*: Update an existing purchase and its items. This operation **reverts** the stock changes of the old purchase and **applies** new stock changes. **Challan generation rules:** The frontend `challan_no` is ignored. If the month/FY changes, the backend automatically generates a new sequence number. Otherwise, the original sequence is retained.
    *   *Request Body*: Same as POST.
*   **DELETE `/purchase/:id`**
    *   *Description*: Securely delete a purchase and revert stock.
    *   *Request Body*: `{"password": "your_del_pass"}`

---

### 5. Groups
Manages groups of jobbers and clients.

*   **GET `/groups`**
    *   *Description*: List all groups with their resolved members (names and details).
*   **GET `/groups/:id`**
    *   *Description*: Fetch a single group with all its members (jobbers and clients).
*   **POST `/groups`**
    *   *Description*: Create a new group. Validates that all member IDs exist in their respective tables.
    *   *Request Body*:
        ```json
        {
          "name": "North Distributors",
          "description": "Primary distributors in the north region",
          "members": [
            { "member_type": "jobber", "member_id": 1 },
            { "member_type": "client", "member_id": 3 }
          ]
        }
        ```
*   **PUT `/groups/:id`**
    *   *Description*: Update a group and its members. Old members are replaced by the new array.
    *   *Request Body*: Same as POST.
*   **DELETE `/groups/:id`**
    *   *Description*: Delete a group. Members are automatically removed via cascade deletion.

---

## 🛠️ UTILITIES

*   **GET `/health`**
    *   *Description*: System health check.
    *   *Response*: `{"status": "OK", "timestamp": "..."}`
1. 
### 2. Backup & Restore
*   **GET `/backup/manual`**
    *   *Description*: Generates a full database backup and streams it as a `.sql` file download. Uses a concurrency lock.
    *   *Error*: Returns `429` if another backup/restore is in progress.
*   **GET `/backup/settings`**
    *   *Description*: Retrieves current automatic backup configuration.
    *   *Response*: Returns current settings. If a backup is missing and being recreated by the self-healing logic, `last_backup_file` will return `"Creating fresh backup..."`.
        ```json
        {
          "id": 1,
          "auto_backup_enabled": true,
          "auto_backup_path": "C:/NP-Backups/",
          "auto_backup_interval": 60,
          "last_backup_time": "...",
          "last_backup_file": "..."
        }
        ```
*   **PUT `/backup/settings`**
    *   *Description*: Updates automatic backup settings.
    *   *Request Body*:
        ```json
        {
          "auto_backup_enabled": true,
          "auto_backup_path": "D:/NP-Backups/",
          "auto_backup_interval": 60
        }
        ```
*   **GET `/backup/status`**
    *   *Description*: Returns timestamp and filename of the latest automatic backup. Used for quick dashboard status checks.
    *   *Response*:
        ```json
        {
          "success": true,
          "last_backup_time": "2026-05-12T19:00:00Z",
          "last_backup_file": "AutoBackup-12-05-2026-19-00.sql"
        }
        ```
*   **POST `/backup/restore`**
    *   *Description*: Restores the database from an uploaded `.sql` or `.backup` file. **WARNING: Overwrites all existing data.**
    *   *Request Body*: `multipart/form-data` with field `backup` containing the file.
    *   *Error*: Returns `429` if another backup/restore is in progress.

---

## 📊 REPORTS APIs

All Report APIs support `from` and `to` date filters (YYYY-MM-DD) via query parameters unless otherwise noted.

### 0. Dashboard Summaries
*   **GET `/reports/party-stock`**
    *   *Description*: Overview of all items linked to all jobbers. Returns current stock for each item.
*   **GET `/reports/job-work`**
    *   *Description*: Overview of production volumes across all jobbers.
    *   *Query Params*: `from`, `to` (optional).

### 1. Party Wise Stock
*   **GET `/reports/party-stock-summary`**
    *   *Description*: Returns total quantity of each item billed to a client, aggregated using `SUM` over `billing_items`.
    *   *Query Params*: `client_id` (required), `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "item_id": 1, "item_name": "RED PEN", "total_quantity": 200, "unit": "DOZ" }
          ]
        }
        ```
*   **GET `/reports/party-stock-detail`**
    *   *Description*: Full transaction ledger for a specific client and item. Includes unit rate for price tracking.
    *   *Query Params*: `client_id`, `item_id` (required), `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "data": {
            "item_name": "",
            "transactions": [
              { "challan_no": "101/APR/26-27", "date": "2026-04-10", "rate": 10.50, "quantity": 100 }
            ],
            "total_quantity": 100
          }
        }
        ```

### 2. Party Wise Sales
*   **GET `/reports/party-sales`**
    *   *Description*: Aggregated sales (billing) volume and revenue per client within a specific date range. Supports filtering by a specific client.
    *   *Query Params*: `client_id` (optional), `from`, `to` (optional).
    *   *Response Fields*: `client_id`, `client_name`, `total_quantity`, `total_amount`.

### 3. Group Sales
*   **GET `/reports/group-sales`**
    *   *Description*: Total sales revenue aggregated by group membership. Handles polymorphic mapping between clients and jobbers within groups.
    *   *Query Params*: `from`, `to` (optional).
*   **GET `/reports/group-sales-summary`**
    *   *Description*: Fetches summary of sales for all clients belonging to a specific group.
    *   *Query Params*: `group_id` (required), `from`, `to` (optional).
    *   *Response*: 
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "client_id": 1, "client_name": "ACME CORP", "total_amount": 15000.00 }
          ]
        }
        ```
*   **GET `/reports/group-sales-print`**
    *   *Description*: Fetches detailed billing transactions for all clients in a group, pre-grouped by client for printing.
    *   *Query Params*: `group_id` (required), `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            {
              "client_id": 1,
              "client_name": "ACME CORP",
              "party_total": 5000.00,
              "transactions": [
                { "challan_no": "101/APR/26-27", "date": "2026-04-10", "amount": 5000.00 }
              ]
            }
          ]
        }
        ```

### 4. Party Billing detail
*   **GET `/reports/party-billing-detail`**
    *   *Description*: Full transaction details (challans) for a specific client within a date range.
    *   *Query Params*: `client_id` (required), `from`, `to` (optional).
    *   *Response*: 
        ```json
        {
          "success": true,
          "data": {
            "client_name": "ACME CORP",
            "transactions": [
               { "challan_no": "101/APR/26-27", "date": "2026-04-10", "amount": 5000.00 }
            ],
            "total_amount": 5000.00
          }
        }
        ```

### 5. Job Work Analysis
*   **GET `/reports/job-work-summary`**
    *   *Description*: Aggregates total quantities purchased from a jobber, grouped by item, within a date range.
    *   *Query Params*: `jobber_id` (required), `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "data": [
            { "item_id": 1, "item_name": "RED PEN", "total_quantity": 500, "unit": "PCS" }
          ]
        }
        ```
*   **GET `/reports/job-work-detail`**
    *   *Description*: Individual transaction ledger (ledger style) for a specific jobber and item.
    *   *Query Params*: `jobber_id`, `item_id` (required), `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "data": {
            "item_name": "RED PEN",
            "transactions": [
              { "challan_no": "P101/APR/26-27", "date": "2026-04-10", "quantity": 100 }
            ],
            "total_quantity": 100
          }
        }
        ```

### 6. Day Book
*   **GET `/reports/day-book`**
    *   *Description*: Combined daily ledger of all Billing and Purchase transactions for a specific date.
    *   *Query Params*: `date` (required, format: YYYY-MM-DD).
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "id": 1, "type": "billing", "challan_no": "101", "name": "ACME CORP", "amount": 5000.00 },
            { "id": 5, "type": "purchase", "challan_no": "P-55", "name": "JAIN PRINTERS", "amount": null }
          ]
        }
        ```

### 7. Detail Job Report
*   **GET `/reports/detail-job-report`**
    *   *Description*: Returns inward stock movement details from Job Work (Purchase) entries between selected dates.
    *   *Query Params*: `startDate` (required, YYYY-MM-DD), `endDate` (required, YYYY-MM-DD).
    *   *Response Fields*:
        *   `purchase_id`: Internal ID of the purchase record.
        *   `date`: Date of the transaction.
        *   `item_name`: Name of the item received.
        *   `quantity`: Inward quantity.
    *   *Sorting*: Ordered by date ASC, purchase_id ASC, and order_index ASC.
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "purchase_id": 1, "date": "2026-05-01", "item_name": "ITEM A", "quantity": 100 }
          ]
        }
        ```

### 8. Job Summary Report
*   **GET `/reports/job-summary`**
    *   *Description*: Aggregates total quantities of items per jobber within a date range. Only includes jobbers with purchase activity in the period.
    *   *Query Params*: `from`, `to` (optional).
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "jobber_name": "JAIN PRINTERS", "item_name": "RED PEN", "total_quantity": 500 }
          ]
        }
        ```

### 9. Item Sold Summary Report
*   **GET `/reports/item-sold-summary`**
    *   *Description*: Returns aggregated quantities of items sold (from billing) within a date range.
    *   *Query Params*: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD).
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 2,
          "data": [
            { "item_name": "RED PEN", "total_quantity": 1000 }
          ]
        }
        ```

---

## 📈 DASHBOARD APIs

### 1. Low Stock Alerts
*   **GET `/dashboard/low-stock`**
    *   *Description*: Returns all items where current stock is less than minimum stock.
    *   *Response*:
        ```json
        {
          "success": true,
          "count": 1,
          "data": [
            {
              "item_id": 1,
              "item_name": "Sugar",
              "stock": 20,
              "unit": "kg",
              "min_stock": 50
            }
          ]
        }
        ```
