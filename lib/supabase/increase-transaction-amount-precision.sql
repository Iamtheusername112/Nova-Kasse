-- Increase transaction amount precision to support unlimited amounts
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Change amount column from DECIMAL(10, 2) to NUMERIC (unlimited precision)
-- NUMERIC without precision allows for very large numbers
ALTER TABLE transactions 
ALTER COLUMN amount TYPE NUMERIC;

-- If the above doesn't work, try this alternative:
-- ALTER TABLE transactions 
-- ALTER COLUMN amount TYPE NUMERIC(20, 2);

-- Note: NUMERIC without precision allows for unlimited precision
-- NUMERIC(20, 2) allows up to 999,999,999,999,999,999.99 (18 digits before decimal, 2 after)

