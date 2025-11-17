-- Add 'request' type to transactions table CHECK constraint
-- Run this SQL in your Supabase SQL Editor if you get an error about invalid type 'request'

-- First, drop the existing constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add the new constraint with 'request' included
ALTER TABLE transactions 
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'income', 'expense', 'request'));

