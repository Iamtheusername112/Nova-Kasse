# Transactions & Notifications Setup Guide

## Overview

This guide will help you set up the transactions and notifications system for your banking app.

## Step 1: Create Transactions Table

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy and paste the entire contents of `lib/supabase/create-transactions-table.sql`
4. Click **"Run"**

This creates:
- `transactions` table with all necessary columns
- Row Level Security (RLS) policies
- Indexes for performance
- Auto-update trigger for `updated_at`

## Step 2: Create Notifications Table

1. In the same SQL Editor, click **"New Query"**
2. Copy and paste the entire contents of `lib/supabase/create-notifications-table.sql`
3. Click **"Run"**

This creates:
- `notifications` table
- Auto-notification trigger (creates notification when transaction is inserted)
- RLS policies
- Indexes for performance

## Step 3: Verify Tables

After running both SQL scripts, verify the tables exist:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see:
   - ✅ `transactions` table
   - ✅ `notifications` table

## Step 4: Test the System

1. **Make a Transfer**: Go to transfer page and complete a transfer
2. **Check Transactions**: Go to home page - you should see the transaction in "Recent Transactions"
3. **Check Notifications**: Click the bell icon - you should see a notification about the transfer

## Features

### Transactions Table
- Stores all user transactions (transfers, deposits, payments, etc.)
- Automatically tracks timestamps
- Supports different transaction types and statuses
- Real-time updates via Supabase subscriptions

### Notifications Table
- Automatically creates notifications when transactions occur
- Supports different notification types
- Read/unread status tracking
- Real-time updates

### Real-Time Features
- Transactions appear instantly on home page
- Notifications appear instantly
- No page refresh needed

## Transaction Types

- `transfer` - Money transfers to other users
- `deposit` - Money received
- `withdrawal` - Money withdrawn
- `payment` - Payments made
- `income` - Income received
- `expense` - Expenses recorded

## Notification Types

- `transaction` - General transaction notifications
- `transfer` - Transfer-specific notifications
- `deposit` - Deposit notifications
- `payment` - Payment notifications
- `security` - Security-related notifications
- `system` - System notifications
- `promotion` - Promotional notifications

## Database Schema

### Transactions Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- type (TEXT) - transaction type
- amount (DECIMAL) - transaction amount
- recipient_name (TEXT) - recipient name
- recipient_phone (TEXT) - recipient phone
- recipient_email (TEXT) - recipient email
- recipient_account (TEXT) - recipient account number
- description (TEXT) - transaction description
- category (TEXT) - transaction category
- note (TEXT) - user note
- status (TEXT) - pending, completed, failed, cancelled
- transfer_method (TEXT) - instant or scheduled
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Notifications Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- type (TEXT) - notification type
- title (TEXT) - notification title
- message (TEXT) - notification message
- data (JSONB) - additional data
- read (BOOLEAN) - read status
- created_at (TIMESTAMP)
```

## Troubleshooting

### Transactions not appearing?
1. Check if `transactions` table exists
2. Verify RLS policies are enabled
3. Check browser console for errors
4. Verify user is authenticated

### Notifications not creating?
1. Check if `notifications` table exists
2. Verify trigger function was created
3. Check if transaction was successfully inserted
4. Check browser console for errors

### Real-time not working?
1. Verify Supabase real-time is enabled in project settings
2. Check browser console for subscription errors
3. Ensure you're authenticated

