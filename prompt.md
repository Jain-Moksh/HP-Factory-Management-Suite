# Challan Number Generation Workflow

This document details the exact sequence of how challan numbers are generated, handled, and persisted in the application for both **New Bill Generation (Creation)** and **Editing Bills**.

## 1. Core Principles & Format
- **Format:** `<Prefix><Sequence>/<Month>/<FY>` 
  - *Billing:* `1/APR/24-25` (No prefix)
  - *Job Work (Purchase):* `P1/APR/24-25` (Prefix `P`)
- **Uniqueness Context:** The sequence resets every month. The uniqueness is maintained based on the combination of `(type, month, financial_year)`.
- **Database Tracking:** The sequences are tracked in a dedicated table `challan_sequences` ensuring thread-safe, robust generation.

---

## 2. New Bill Generation (Creation)

When a user creates a new invoice or job work, the sequence is automatically assigned and permanently reserved at the moment the record is saved to the database.

### Workflow:
1. **Frontend Preview:** When creating a new bill, the UI initially sets the field to `AUTO`. When a date is selected, it fetches a preview using the `/next-challan` endpoint. This preview simply queries the `challan_sequences` table for `last_number + 1` but **does not** reserve or increment it.
2. **Submission:** The frontend submits the bill payload.
3. **Backend Generation (Atomic Increment):** 
   - Inside the database transaction (e.g., `billingService.create`), the backend ignores the frontend preview and calls `generateChallanNo(date, type, client)`.
   - A row-level locking SQL query is executed: `INSERT INTO challan_sequences ... ON CONFLICT (type, month, financial_year) DO UPDATE SET last_number = challan_sequences.last_number + 1 RETURNING last_number`.
   - This ensures that even under high concurrency, two bills created at the exact same millisecond will receive different sequence numbers.
4. **Persistence:** The securely generated sequence is attached to the new bill and saved.

*Note: Once generated via the atomic query, the number is considered "used". If the bill is later deleted, that sequence number is never reused (no gaps are filled).*

---

## 3. Editing Bills

When an existing bill is edited, the system's primary goal is to retain the original challan number to preserve historical accuracy.

### Workflow:
1. **Initial Load:** When opening the edit page, the frontend fetches the bill details and populates the form with the **existing** `challan_no` (e.g., `15/APR/24-25`).
2. **Date Change Behavior:** 
   - If the user changes the billing date on the frontend, the UI fires an API call to `/next-challan` in **preview mode** to see what the next number would be for the new date's month.
   - The UI updates the `challanNo` form field with this newly previewed sequence (e.g., `1/MAY/24-25`).
3. **Submission:** The frontend sends a `PUT` request containing the explicitly defined `challan_no` field from the form.
4. **Backend Processing:**
   - In `billingService.update` (or the equivalent purchase service), the backend trusts and accepts the `challan_no` directly from the payload.
   - It **does not** call `generateChallanNo()` to perform the atomic increment.
   - The `UPDATE` SQL query simply overwrites the bill's `challan_no` with the string provided by the frontend.

### System Implication During Edit:
Because the backend does not increment the `challan_sequences` tracker during an edit operation:
- **No Date Change:** The bill correctly retains its original, already-reserved challan number.
- **Date Change:** If the UI grabs a new preview number (e.g., `1/MAY/24-25`) and submits it, the bill will be updated to `1/MAY/24-25`. However, the sequence tracker for May is **not incremented**. As a result, the next *brand new* bill created in May will also be assigned `1/MAY/24-25`, potentially resulting in duplicate challan numbers.
