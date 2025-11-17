import { createClient } from '@supabase/supabase-js';

// Approve a transfer
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { transferId } = resolvedParams;

    if (!transferId || transferId === 'undefined' || transferId === 'null') {
      return Response.json(
        { error: 'Invalid transfer ID' },
        { status: 400 }
      );
    }

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

    // Get the transfer first to verify it exists and is pending
    const { data: transfer, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transferId)
      .eq('type', 'transfer')
      .single();

    if (fetchError || !transfer) {
      return Response.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    if (transfer.status !== 'pending') {
      return Response.json(
        { error: `Transfer is already ${transfer.status}` },
        { status: 400 }
      );
    }

    // Get user currency for notification
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('currency')
      .eq('id', transfer.user_id)
      .single();

    const userCurrency = profile?.currency || 'USD';
    const transferAmount = Math.abs(transfer.amount);

    // Update transfer status to completed
    // This will now include the transaction in balance calculation (amount is deducted)
    const { data: updatedTransfer, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transferId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving transfer:', updateError);
      return Response.json(
        { error: updateError.message || 'Failed to approve transfer' },
        { status: 500 }
      );
    }

    // Create notification for the user
    const notificationData = {
      user_id: transfer.user_id,
      type: 'transfer',
      title: 'Transfer Successful',
      message: `${transferAmount.toLocaleString('en-US', { style: 'currency', currency: userCurrency })} has been sent to ${transfer.recipient_name}. Your transfer was processed successfully.`,
      data: {
        transaction_id: transfer.id,
        amount: transferAmount,
        recipient_name: transfer.recipient_name,
        status: 'completed'
      }
    };

    await supabaseAdmin
      .from('notifications')
      .insert(notificationData);

    return Response.json({ 
      success: true, 
      transfer: updatedTransfer,
      message: 'Transfer approved successfully' 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/transfers/[transferId]/approve:', error);
    return Response.json(
      { error: error.message || 'Failed to approve transfer' },
      { status: 500 }
    );
  }
}

