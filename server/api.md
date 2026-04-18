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
    *   *Description*: Fetch movement history (inward/outward) for a specific item.
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

### 3. Jobbers
Manages manufacturing/job worker records and their assigned items.

*   **GET `/jobbers`**
*   **GET `/jobbers/:id`**
*   **POST `/jobbers`**
    *   *Request Body*: `{"name": "John Doe"}`
*   **PUT `/jobbers/:id`**

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

---

## 🧾 TRANSACTION MODULES

### 1. Billing (Invoices)
Used for sales/billing. Creating a bill automatically **decrements** item stock.

*   **POST `/billing`**
    *   *Description*: Create a new bill with multiple items (Transaction-safe). **Challan Number is automatically generated on the server** based on selected date and financial year.
    *   *Challan Format*: `<sequence>/<month>/<fy>` (e.g., `103/jan/25-26`). Sequence resets monthly.
    *   *Request Body*:
        ```json
        {
          "client_id": 1,
          "transporter_id": 2,
          "date": "2024-04-09",
          "transport_charge": 100,
          "packing_charge": 50,
          "discount_percent": 10,
          "discount_amount": 15,
          "total_amount": 1500,
          "short_remark": "Rush order",
          "long_remark": "Deliver to side entrance",
          "grand_total": 1535,
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
    *   *Description*: List all billing records with client names.
*   **GET `/billing/next-id`**
    *   *Description*: Fetch the dynamic next numeric ID for internal tracking (Note: This is NOT the formatted Challan Number).
*   **PUT `/billing/:id`**
    *   *Description*: Update an existing invoice and its items. This operation **reverts** the stock changes of the old bill and **applies** new stock changes based on the updated items.
    *   *Request Body*: Same as POST.
*   **DELETE `/billing/:id`**
    *   *Description*: Securely delete an invoice and revert stock.
    *   *Request Body*: `{"password": "your_del_pass"}`

### 2. Purchase
Used for receiving stock from jobbers. Creating a purchase automatically **increments** item stock.

*   **POST `/purchase`**
    *   *Description*: Create a new purchase record. **Challan Number is automatically generated on the server.**
    *   *Challan Format*: `P<sequence>/<month>/<fy>` (e.g., `P103/jan/25-26`). Sequence resets monthly.
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
    *   *Description*: Fetch the next internal numeric sequence ID.
*   **PUT `/purchase/:id`**
    *   *Description*: Update an existing purchase and its items. This operation **reverts** the stock changes of the old purchase and **applies** new stock changes.
    *   *Request Body*: Same as POST.
*   **DELETE `/purchase/:id`**
    *   *Description*: Securely delete a purchase and revert stock.

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

---

## 📊 REPORTS APIs

All Report APIs support `from` and `to` date filters (YYYY-MM-DD) via query parameters.

### 1. Party Wise Stock
*   **GET `/reports/party-stock-summary`**
    *   *Description*: Returns unique items sold to a client with their current master stock levels.
    *   *Query Params*: `client_id` (required), `from`, `to` (optional).
*   **GET `/reports/party-stock-detail`**
    *   *Description*: Full transaction ledger for a specific client and item.
    *   *Query Params*: `client_id`, `item_id` (required), `from`, `to` (optional).

### 2. Party Wise Sales
*   **GET `/reports/party-sales`**
    *   *Description*: Aggregated sales (billing) volume and revenue per client within a specific date range. Supports filtering by a specific client.
    *   *Query Params*: `client_id` (optional), `from`, `to` (optional).

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
               { "challan_no": "101/apr/26-27", "date": "2026-04-10", "amount": 5000.00 }
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
