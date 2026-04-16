-- =============================================
-- SQL Script to convert existing text data to uppercase
-- Run this once to clean up existing database records
-- =============================================

-- Master Tables
UPDATE items SET 
    name = UPPER(name),
    unit = UPPER(unit);

UPDATE clients SET 
    name = UPPER(name),
    street = UPPER(street),
    city = UPPER(city),
    shortform = UPPER(shortform),
    remark = UPPER(remark);

UPDATE jobbers SET 
    name = UPPER(name);

UPDATE transporters SET 
    name = UPPER(name);

-- Billing Tables
UPDATE billing SET 
    short_remark = UPPER(short_remark),
    long_remark = UPPER(long_remark),
    challan_no = UPPER(challan_no);

UPDATE billing_items SET 
    unit = UPPER(unit);

-- Purchase Tables
UPDATE purchase SET 
    remark = UPPER(remark),
    challan_no = UPPER(challan_no);

UPDATE purchase_items SET 
    unit = UPPER(unit);

-- Group Tables
UPDATE groups SET 
    name = UPPER(name),
    description = UPPER(description);
