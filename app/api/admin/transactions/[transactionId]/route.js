import { createClient } from '@supabase/supabase-js';

// Admin API route to update a transaction
export async function PATCH(request, { params }) {
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

    // Ensure params is resolved
    const resolvedParams = await params;
    const transactionId = resolvedParams?.transactionId;

    if (!transactionId) {
      return Response.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(transactionId)) {
      return Response.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      type,
      amount,
      description,
      note,
      category,
      status,
      recipient_name,
      recipient_phone,
      recipient_email,
      recipient_account,
      transfer_method,
      created_at,
    } = body;

    // Build update object with only provided fields
    const updateData = {};

    if (type !== undefined) {
      if (!['transfer', 'deposit', 'withdrawal', 'payment', 'income', 'expense', 'request'].includes(type)) {
        return Response.json(
          { error: 'Invalid transaction type' },
          { status: 400 }
        );
      }
      updateData.type = type;
    }

    if (amount !== undefined) {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue === 0) {
        return Response.json(
          { error: 'Valid amount is required' },
          { status: 400 }
        );
      }
      // Round to 2 decimal places
      updateData.amount = Math.round(amountValue * 100) / 100;
    }

    if (description !== undefined) {
      if (description.trim() === '') {
        return Response.json(
          { error: 'Description cannot be empty' },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }

    if (note !== undefined) {
      updateData.note = note?.trim() || null;
    }

    if (category !== undefined) {
      updateData.category = category?.trim() || null;
    }

    if (status !== undefined) {
      if (!['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
        return Response.json(
          { error: 'Invalid transaction status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (recipient_name !== undefined) {
      updateData.recipient_name = recipient_name?.trim() || null;
    }

    if (recipient_phone !== undefined) {
      updateData.recipient_phone = recipient_phone?.trim() || null;
    }

    if (recipient_email !== undefined) {
      updateData.recipient_email = recipient_email?.trim() || null;
    }

    if (recipient_account !== undefined) {
      updateData.recipient_account = recipient_account?.trim() || null;
    }

    if (transfer_method !== undefined) {
      if (transfer_method && !['instant', 'scheduled'].includes(transfer_method)) {
        return Response.json(
          { error: 'Invalid transfer method' },
          { status: 400 }
        );
      }
      updateData.transfer_method = transfer_method || null;
    }

    // Handle custom created_at timestamp (for backdating/forward dating)
    if (created_at !== undefined) {
      try {
        const parsedDate = new Date(created_at);
        if (isNaN(parsedDate.getTime())) {
          return Response.json(
            { error: 'Invalid date/time format' },
            { status: 400 }
          );
        }
        updateData.created_at = parsedDate.toISOString();
        console.log('Updating transaction timestamp:', {
          transactionId,
          input: created_at,
          parsed: parsedDate,
          iso: updateData.created_at
        });
      } catch (error) {
        console.error('Error parsing timestamp:', error);
        return Response.json(
          { error: 'Invalid date/time format' },
          { status: 400 }
        );
      }
    }

    // Check if transaction exists
    const { data: existingTransaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !existingTransaction) {
      return Response.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return Response.json(
        { error: updateError.message || 'Failed to update transaction' },
        { status: 500 }
      );
    }

    console.log('Transaction updated successfully:', {
      id: updatedTransaction.id,
      updates: updateData,
    });

    return Response.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/transactions/[transactionId]:', error);
    return Response.json(
      { error: error.message || 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

