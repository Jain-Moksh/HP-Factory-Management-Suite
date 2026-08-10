# Client Balance & Outstanding Architecture Audit

This document details the analysis of how the client balance and outstanding tracking system is currently implemented across the database, queries, backend services, and frontend pages of the application.

---

## 1. Clients Table & Balance Column

### What `balance` represents:
* In the database, the `clients.balance` column exists physically as a `NUMERIC` type in the `clients` table.
* On the frontend (in [PartyList.jsx](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/client/src/pages/master/PartyList.jsx) and [CreateInvoice.jsx](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/client/src/pages/CreateInvoice.jsx)), this field is exclusively labeled and input as the **"Opening Balance"** of the client (the outstanding amount when the customer was first set up).
* It is **not** a dynamically updated "Current Outstanding Balance" or "Ledger Balance".

### Initial Value:
* The user enters it when creating a client. It parses as a float on the frontend or defaults to `0` if left blank:
  ```javascript
  balance: parseFloat(formData.balance) || 0
  ```

### Columns in the `clients` Table:
* `id` (SERIAL PRIMARY KEY)
* `name` (TEXT NOT NULL)
* `street` (TEXT)
* `city` (TEXT)
* `shortform` (TEXT)
* `balance` (NUMERIC)
* `remark` (TEXT)

---

## 2. Where Balance is Updated

The `clients.balance` field is **only** modified during client master configuration actions. 

| File | Function | Query | Execution Trigger |
| :--- | :--- | :--- | :--- |
| [masterQueries.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/queries/masterQueries.js#L13) | `createClient` | `INSERT INTO clients (name, street, city, shortform, balance, remark) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *` | When a user creates a new client on the Client Master page or via the modal. |
| [masterQueries.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/queries/masterQueries.js#L14) | `updateClient` | `UPDATE clients SET name = $1, street = $2, city = $3, shortform = $4, balance = $5, remark = $6 WHERE id = $7 RETURNING *` | When a user edits a client's details on the Client Master page. |

No other file, service, controller, or database procedure alters this value.

---

## 3. Billing Creation Flow

When a new outward billing/challan is created:

1. The frontend sends a `POST` request to `/api/billing` with the invoice metadata (including `client_id`, `grand_total`, etc.) and items.
2. The route matches `billingController.create`, which invokes `billingService.create`.
3. Inside `billingService.create`, a database client connection is established, and a transaction is opened (`BEGIN`).
4. A unique monthly challan sequence is locked and generated.
5. The billing record is inserted into the `billing` table with `grand_total`.
6. Line items are bulk inserted into `billing_items`.
7. Stock levels are updated (decremented) in the `items` table.
8. The transaction commits (`COMMIT`).
9. **Impact on `clients.balance`**: **No update is performed**. The `clients` table is not queried for updates, and `clients.balance` remains completely unchanged.

---

## 4. Billing Edit Flow

When a billing/challan is updated:

1. The controller maps the request to `billingService.update`.
2. The service opens a database transaction (`BEGIN`).
3. It fetches old line items to reverse stock counts.
4. It updates the `billing` table row using `queries.updateBill` to set the new `grand_total`.
5. It deletes removed line items and inserts/updates active line items.
6. Stock counts are adjusted differentially.
7. The transaction commits (`COMMIT`).
8. **Impact on `clients.balance`**: **No update is performed**. The updated `grand_total` does not propagate to the client outstanding balance.

---

## 5. Billing Delete Flow

When a billing/challan is deleted:

1. The controller maps the request to `billingService.delete`.
2. The service opens a transaction (`BEGIN`).
3. It selects bill items to restore/revert the stock counts.
4. It deletes the line items from `billing_items`.
5. It deletes the parent record from the `billing` table.
6. The transaction commits (`COMMIT`).
7. **Impact on `clients.balance`**: **No update is performed**. The deleted invoice amount does not subtract from any client balances.

---

## 6. Existing Payment/Return/Discount Logic

### What already exists:
* **Frontend mockup**: A static table displaying hardcoded `DUMMY_PAYMENTS` on the `/payment` page, and the frontend mode-switch toggle page on `/create-payment` (simulating Payment, Return, and Discount creation).
* **Database columns**: The `clients` table has a static `balance` column, which acts as the Opening Balance.

### What does not exist:
* **No Database Tables**: There are no tables for payments, returns, discounts, ledger entries, or outstanding adjustments.
* **No APIs**: There are no backend routes, controllers, queries, or services to record, fetch, edit, or delete payments, returns, or discounts.
* **No dynamic ledger links**: Invoices (`billing`) do not connect to client balances or track paid vs. unpaid statuses.

---

## 7. Source of Truth

The current implementation behaves as follows:

* **Billing records are the sole source of truth for invoices and total sales value.**
* **`clients.balance` is only a static opening configuration value.** It does *not* dynamically calculate or accumulate sales or payments. 
* There is **no database-driven source of truth for client outstanding balance** (currently there is no ledger sync). When the payment page displays `₹15,450.00` as the opening balance, it is a hardcoded mock value on the frontend.

---

## 8. Transaction Safety

* Currently, there are **no balance updates** triggered by billing events. Therefore, there are no database procedures maintaining client outstanding atomically.
* However, all billing writes (`create`/`edit`/`delete`) occur within strict database transaction blocks (`BEGIN` / `COMMIT` / `ROLLBACK`).
* *Design Note*: For the future payment system, we must perform any ledger or balance updates inside these same transactions to ensure that if a bill fail to write, its outstanding balance update is rolled back.

---

## 9. Numerical Example (Current Implementation)

Assuming a client is created with an opening balance of `₹0`:

1. **Initial State**:
   * `clients.balance` = **`₹0`**
2. **Create Billing of `₹10,000`**:
   * A row is added in `billing` with `grand_total` = `10000`.
   * `clients.balance` = **`₹0`** *(Unchanged)*
3. **Edit Billing from `₹10,000` to `₹12,000`**:
   * The row in `billing` is updated to `grand_total` = `12000`.
   * `clients.balance` = **`₹0`** *(Unchanged)*
4. **Delete Billing**:
   * The row in `billing` is deleted.
   * `clients.balance` = **`₹0`** *(Unchanged)*

---

## 10. Important Findings for Our New Payment System

* **Do Not Break Client Master**: The `clients.balance` column must remain available as the static **"Opening Balance"** when creating or editing clients.
* **Avoid Hardcoded Calculations**: The new payment page UI must eventually pull the dynamic outstanding balance from a new database-backed ledger query rather than using hardcoded values or just reading `clients.balance`.
* **Atomic Ledger updates**: When we implement the backend payment triggers, every billing creation/edit/delete must update a new ledger record or outstanding balance inside the same transaction block as the bill insert to prevent data corruption.
* **Jobber Balance**: The `jobbers` table currently does not have a `balance` column. We will need to design the Jobber outstanding mechanism (likely via a unified ledger table or direct column addition) when we build the backend.

---

## 11. Files Inspected

The following project files were analyzed to verify this workflow:
* [server/db.md](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/db.md)
* [server/queries/masterQueries.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/queries/masterQueries.js)
* [server/queries/billingQueries.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/queries/billingQueries.js)
* [server/services/masterService.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/services/masterService.js)
* [server/services/billingService.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/services/billingService.js)
* [server/controllers/masterController.js](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/server/controllers/masterController.js)
* [client/src/pages/master/PartyList.jsx](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/client/src/pages/master/PartyList.jsx)
* [client/src/pages/CreatePayment.jsx](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/client/src/pages/CreatePayment.jsx)
* [client/src/pages/CreateInvoice.jsx](file:///c:/Users/moksh/Videos/Projects/HP%20Factory/NP-Frontend/client/src/pages/CreateInvoice.jsx)
