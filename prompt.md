# Challan Number Creation Formats

This document outlines the existing format and logic for creating Challan Numbers in the system, specifically for the **Order Summary** (Billing) and **Job Work** (Purchase) pages.

## 1. Order Summary (Billing) Format
The Challan Number for Billing follows this structure:
**`[SEQUENCE]/[MONTH]/[FY_RANGE]`**

*   **Example**: `103/APR/26-27`
*   **[SEQUENCE]**: A numeric counter that resets at the beginning of each month.
*   **[MONTH]**: 3-letter uppercase short name of the month (e.g., JAN, FEB, MAR, APR, etc.).
*   **[FY_RANGE]**: Two-digit representation of the Financial Year range (e.g., 24-25, 26-27).

## 2. Job Work (Purchase) Format
The Challan Number for Job Work follows a similar structure but with a **'P'** prefix:
**`P[SEQUENCE]/[MONTH]/[FY_RANGE]`**

*   **Example**: `P103/APR/26-27`
*   **[SEQUENCE]**: A numeric counter that resets at the beginning of each month.
*   **[MONTH]**: 3-letter uppercase short name of the month.
*   **[FY_RANGE]**: Two-digit representation of the Financial Year range.

---

## 🛠️ Creation Logic (Server-Side)

The generation of these numbers is handled automatically by the backend to ensure consistency and concurrency safety.

### A. Sequence Calculation
The sequence number is determined by counting existing records for the **same month** and **same financial year** in the database.
*   For Billing: Counts records in the `billing` table.
*   For Job Work: Counts records in the `purchase` table.
*   The next available number is `Count + 1`.

### B. Financial Year (FY) Determination
The Financial Year starts on **April 1st** and ends on **March 31st**.
*   If the transaction date is in **April or later** (Month >= 4):
    *   `Start Year = Current Year`
    *   `End Year = Current Year + 1`
*   If the transaction date is in **January to March** (Month < 4):
    *   `Start Year = Current Year - 1`
    *   `End Year = Current Year`
*   The range is formatted as `YY-YY` (e.g., 2026-2027 becomes `26-27`).

### C. Concurrency Safety
The server applies a `LOCK TABLE` in `SHARE ROW EXCLUSIVE MODE` during the creation process. This prevents two users from being assigned the same sequence number if they save records at the exact same time.

### D. Edit Mode Rules
*   If a record's date is updated but remains within the **same month and FY**, the original Challan Number is **retained**.
*   If the date is changed to a **different month or FY**, a **new Challan Number** is automatically generated based on the new date's sequence.
