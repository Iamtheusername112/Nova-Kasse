import { createClient } from '@supabase/supabase-js';

// Admin API route to create transactions (credit/debit user accounts)
export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return Response.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { user_id, type, amount, description, note, category, status } = body;

    // Validate required fields
    if (!user_id) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!type || !['deposit', 'withdrawal', 'transfer', 'payment', 'income', 'expense', 'request'].includes(type)) {
      return Response.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    if (!amount || isNaN(amount) || amount === 0) {
      return Response.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!description || description.trim() === '') {
      return Response.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Verify user exists - check auth.users first (more reliable)
    let userExists = false;
    let userEmail = null;
    let userName = null;

    try {
      // Check auth.users using admin API
      const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      
      if (!authError && authUserData?.user) {
        userExists = true;
        userEmail = authUserData.user.email;
        userName = authUserData.user.user_metadata?.full_name || null;
        console.log('User found in auth.users:', { user_id, email: userEmail });
      } else {
        // Fallback: check profiles table
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', user_id)
          .single();

        if (!profileError && userProfile) {
          userExists = true;
          userEmail = userProfile.email;
          userName = userProfile.full_name;
          console.log('User found in profiles:', { user_id, email: userEmail });
        }
      }

      if (!userExists) {
        console.error('User not found in auth.users or profiles:', { user_id });
        return Response.json(
          { error: `User not found. User ID: ${user_id}. Please ensure the user exists.` },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      return Response.json(
        { error: 'Failed to verify user. Please try again.' },
        { status: 500 }
      );
    }

    // Create transaction
    // For deposits (credits), amount should be positive
    // For withdrawals (debits), amount should be negative
    // Ensure amount doesn't exceed DECIMAL(10, 2) precision
    const amountValue = parseFloat(amount);
    const transactionAmount = type === 'deposit' 
      ? Math.abs(amountValue)
      : -Math.abs(amountValue);
    
    // Round to 2 decimal places to match DECIMAL(10, 2) precision
    const roundedAmount = Math.round(transactionAmount * 100) / 100;

    const transactionData = {
      user_id,
      type,
      amount: roundedAmount, // Use rounded amount to match DECIMAL(10, 2) precision
      description: description.trim(),
      note: note?.trim() || null,
      category: category || 'admin_adjustment',
      status: status || 'completed',
      recipient_name: null,
      recipient_phone: null,
      recipient_email: null,
      recipient_account: null,
      transfer_method: null,
    };

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return Response.json(
        { error: transactionError.message || 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Create notification for the user
    const notificationData = {
      user_id,
      type: type === 'deposit' ? 'deposit' : 'transaction',
      title: type === 'deposit' 
        ? `Account Credited: $${Math.abs(roundedAmount).toFixed(2)}`
        : `Account Debited: $${Math.abs(roundedAmount).toFixed(2)}`,
      message: description,
      data: {
        transaction_id: transaction.id,
        amount: roundedAmount,
        type,
        status: status || 'completed',
        category: category || 'admin_adjustment',
      },
      read: false,
    };

    await supabaseAdmin
      .from('notifications')
      .insert(notificationData);

    return Response.json({
      success: true,
      transaction,
      message: `Transaction ${type === 'deposit' ? 'credit' : 'debit'} processed successfully`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/transactions:', error);
    return Response.json(
      { error: error.message || 'Failed to process transaction' },
      { status: 500 }
    );
  }
}

