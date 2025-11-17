-- Fix transfer status default to 'pending' instead of 'completed'
-- This ensures transfers require admin approval by default

-- First, update the default value for the status column
ALTER TABLE transactions 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE transactions 
  ALTER COLUMN status SET DEFAULT 'pending';

-- Update the notification trigger to handle pending transfers correctly
-- Only create notifications for completed transactions, not pending ones
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if transaction is completed (not pending)
  IF NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.type = 'transfer' THEN 'transfer'
        WHEN NEW.type = 'deposit' THEN 'deposit'
        WHEN NEW.type = 'payment' THEN 'payment'
        ELSE 'transaction'
      END,
      CASE 
        WHEN NEW.type = 'transfer' THEN 'Transfer Successful'
        WHEN NEW.type = 'deposit' THEN 'Deposit Received'
        WHEN NEW.type = 'payment' THEN 'Payment Processed'
        WHEN NEW.type = 'income' THEN 'Income Received'
        WHEN NEW.type = 'expense' THEN 'Expense Recorded'
        ELSE 'Transaction Completed'
      END,
      CASE 
        WHEN NEW.type = 'transfer' THEN 
          TO_CHAR(ABS(NEW.amount), '$999,999.99') || ' sent to ' || COALESCE(NEW.recipient_name, 'recipient') || '. Transfer completed successfully.'
        WHEN NEW.type = 'deposit' THEN 
          'You received ' || TO_CHAR(NEW.amount, '$999,999.99')
        WHEN NEW.type = 'payment' THEN 
          'Payment of ' || TO_CHAR(ABS(NEW.amount), '$999,999.99') || ' processed'
        WHEN NEW.type = 'income' THEN 
          'Income of ' || TO_CHAR(NEW.amount, '$999,999.99') || ' recorded'
        WHEN NEW.type = 'expense' THEN 
          'Expense of ' || TO_CHAR(ABS(NEW.amount), '$999,999.99') || ' recorded'
        ELSE 
          'Transaction of ' || TO_CHAR(ABS(NEW.amount), '$999,999.99') || ' completed'
      END,
      jsonb_build_object(
        'transaction_id', NEW.id,
        'amount', NEW.amount,
        'type', NEW.type,
        'status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

