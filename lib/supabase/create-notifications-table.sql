-- Create notifications table
-- Run this SQL in your Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'transfer', 'deposit', 'payment', 'security', 'system', 'promotion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Store additional data like transaction_id, amount, etc.
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Create policy to allow users to read their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own notifications
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Function to create notification when transaction is created
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
BEGIN
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
        'Payment of ' || TO_CHAR(NEW.amount, '$999,999.99') || ' processed'
      WHEN NEW.type = 'income' THEN 
        'Income of ' || TO_CHAR(NEW.amount, '$999,999.99') || ' recorded'
      WHEN NEW.type = 'expense' THEN 
        'Expense of ' || TO_CHAR(NEW.amount, '$999,999.99') || ' recorded'
      ELSE 
        'Transaction of ' || TO_CHAR(NEW.amount, '$999,999.99') || ' completed'
    END,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'type', NEW.type,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create notification on transaction insert
DROP TRIGGER IF EXISTS trigger_create_transaction_notification ON transactions;
CREATE TRIGGER trigger_create_transaction_notification
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

