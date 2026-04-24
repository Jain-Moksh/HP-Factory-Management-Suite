-- Create challan_sequences table
CREATE TABLE IF NOT EXISTS challan_sequences (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'billing' or 'purchase'
    month INT NOT NULL,
    financial_year TEXT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    UNIQUE(type, month, financial_year)
);

-- Seed with existing billing data
-- Note: This regex assumes challan format like '123/APR/26-27'
INSERT INTO challan_sequences (type, month, financial_year, last_number)
SELECT 
    'billing',
    EXTRACT(MONTH FROM date) as m,
    CASE 
        WHEN EXTRACT(MONTH FROM date) >= 4 THEN 
            CONCAT(SUBSTRING(CAST(EXTRACT(YEAR FROM date) AS TEXT), 3, 2), '-', SUBSTRING(CAST(EXTRACT(YEAR FROM date) + 1 AS TEXT), 3, 2))
        ELSE 
            CONCAT(SUBSTRING(CAST(EXTRACT(YEAR FROM date) - 1 AS TEXT), 3, 2), '-', SUBSTRING(CAST(EXTRACT(YEAR FROM date) AS TEXT), 3, 2))
    END as fy,
    MAX(CAST(SPLIT_PART(challan_no, '/', 1) AS INTEGER))
FROM billing
WHERE challan_no IS NOT NULL AND challan_no != ''
GROUP BY m, fy
ON CONFLICT (type, month, financial_year) DO UPDATE 
SET last_number = EXCLUDED.last_number;

-- Seed with existing purchase data
-- Note: This regex assumes challan format like 'P123/APR/26-27'
INSERT INTO challan_sequences (type, month, financial_year, last_number)
SELECT 
    'purchase',
    EXTRACT(MONTH FROM date) as m,
    CASE 
        WHEN EXTRACT(MONTH FROM date) >= 4 THEN 
            CONCAT(SUBSTRING(CAST(EXTRACT(YEAR FROM date) AS TEXT), 3, 2), '-', SUBSTRING(CAST(EXTRACT(YEAR FROM date) + 1 AS TEXT), 3, 2))
        ELSE 
            CONCAT(SUBSTRING(CAST(EXTRACT(YEAR FROM date) - 1 AS TEXT), 3, 2), '-', SUBSTRING(CAST(EXTRACT(YEAR FROM date) AS TEXT), 3, 2))
    END as fy,
    MAX(CAST(REPLACE(SPLIT_PART(challan_no, '/', 1), 'P', '') AS INTEGER))
FROM purchase
WHERE challan_no IS NOT NULL AND challan_no != ''
GROUP BY m, fy
ON CONFLICT (type, month, financial_year) DO UPDATE 
SET last_number = EXCLUDED.last_number;
