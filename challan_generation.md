# Custom Challan Number Generation System

This document outlines the architecture, formatting rules, calculation logic, and concurrency controls of the Challan Number Generation system in the HP Factory Management Suite.

---

## 1. Challan Number Format

Challan numbers are generated dynamically based on the transaction type and date of entry.

* **Outward Billing Challans**: `<sequence>/<MONTH>/<fy>` (e.g., `14/OCT/26-27`)
* **Goods Inward (Purchase) Challans**: `P<sequence>/<MONTH>/<fy>` (e.g., `P3/OCT/26-27`)

### Components of the Challan Number:
1. **Type Prefix**: 
   * **Billing**: Empty prefix (`""`).
   * **Purchase**: `"P"` prefix (e.g., `P1`, `P2`).
2. **Monthly Sequence**: A rolling sequential number starting at `1` that resets at the beginning of each calendar month.
3. **Month Code**: Three-letter uppercase abbreviation of the calendar month (e.g., `APR`, `MAY`, `DEC`).
4. **Financial Year (FY)**: Two-digit financial range (April 1st to March 31st), formatted as `YY-YY` (e.g., `26-27`).

---

## 2. Date Extraction Logic

The system resolves the calendar month and the target financial year boundaries dynamically via the `getMonthAndFY` utility. 

### Financial Year Boundaries:
Since the Indian Financial Year starts on **April 1st** and ends on **March 31st**, the system splits the calendar year:
* **April to December** (Months $\ge$ 4): 
  * Financial Year starts in the *current* calendar year and ends in the *next* calendar year.
  * Formula: `fyRange = currentYear(YY) - nextYear(YY)`.
  * *Example*: `2026-08-15` $\rightarrow$ August (8) $\ge$ 4 $\rightarrow$ **`26-27`**.
* **January to March** (Months < 4): 
  * Financial Year starts in the *previous* calendar year and ends in the *current* calendar year.
  * Formula: `fyRange = previousYear(YY) - currentYear(YY)`.
  * *Example*: `2027-02-10` $\rightarrow$ February (2) < 4 $\rightarrow$ **`26-27`**.

---

## 3. Sequence Number Extraction (SQL Technique)

The system queries the database to find the maximum existing sequence number for the target calendar month and financial year range.

### The SQL Query:
```sql
SELECT MAX(CAST(NULLIF(regexp_replace(split_part(challan_no, '/', 1), '[^0-9]', '', 'g'), '') AS INTEGER)) as max_seq
FROM billing -- (or purchase)
WHERE EXTRACT(MONTH FROM date) = $1
AND date BETWEEN $2 AND $3
```

### Technical breakdown of the sequence extraction functions:
* **`split_part(challan_no, '/', 1)`**: Extracts everything before the first slash `/`.
  * *Example*: `"P14/OCT/26-27"` $\rightarrow$ **`"P14"`**.
* **`regexp_replace(..., '[^0-9]', '', 'g')`**: Removes any non-numeric characters globally (such as the `"P"` prefix).
  * *Example*: `"P14"` $\rightarrow$ **`"14"`**.
* **`NULLIF(..., '')`**: Returns `NULL` if the string is empty, preventing casting exceptions.
* **`CAST(... AS INTEGER)`**: Converts the text digits into a numeric integer value so mathematical sorting works correctly (otherwise, string sorting would put `"9"` after `"10"`).
* **`MAX(...)`**: Finds the highest numeric sequence number in the current calendar month.
* **Fallback**: If no records exist in the current calendar month, the query returns `NULL` (which defaults to `0` in Node.js), and the system starts the month sequence at `1` (`maxSeq + 1`).

---

## 4. Concurrency Protection & Locking

In multi-user or high-traffic environments, two users inserting invoices at the same instant could query the database, receive the same `maxSeq` number, and concurrently attempt to insert rows with identical challan numbers. This would trigger a PostgreSQL **duplicate key constraint violation** on the `UNIQUE` index of the `challan_no` column.

### Implementation:
To prevent duplicate sequence numbers, the system executes the generation logic inside a Postgres Transaction block and locks the table:

```javascript
const generateChallanNo = async (dateStr, type, client, excludeId = null) => {
  const tableName = type === 'billing' ? 'billing' : 'purchase';

  // Lock table to prevent duplicate sequence numbers during concurrent inserts
  await client.query(`LOCK TABLE ${tableName} IN SHARE ROW EXCLUSIVE MODE`);

  return await getFormattedChallan(dateStr, type, client, excludeId);
};
```

### Table Locking Mechanism:
* **`SHARE ROW EXCLUSIVE MODE`**: This lock mode allows other transactions to query the table (read-only operations are unblocked), but **prevents other write/lock operations** from executing on the table until the current transaction commits or rolls back.
* Concurrent insert transactions are forced to queue sequentially, guaranteeing that each transaction receives a unique, incremented sequence number.

---

## 5. Edit Mode & Date Re-evaluations

When editing an existing invoice (where `excludeId` is provided), changing the invoice date could change its month or financial year:

1. **Date in Same Month/FY**: If the new date has the same month number and financial year range as the original invoice, the system **retains the original challan number** unchanged.
2. **Date in Different Month/FY**: If the user shifts the date to another month or year, the original challan number is discarded. The system generates a new sequence number based on the target month/FY records, excluding the current record (`id != excludeId`) to avoid mathematical pollution.
