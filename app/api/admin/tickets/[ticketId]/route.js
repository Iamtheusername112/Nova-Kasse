import { createClient } from '@supabase/supabase-js';

// Update ticket (admin response, status change)
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { ticketId } = resolvedParams;
    
    const body = await request.json();
    const { status, admin_response, admin_id } = body;

    if (!ticketId || ticketId === 'undefined' || ticketId === 'null') {
      return Response.json(
        { error: 'Invalid ticket ID' },
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

    // Get the ticket first
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return Response.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
    }
    if (admin_id !== undefined) {
      updateData.admin_id = admin_id;
    }

    // Update ticket
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return Response.json(
        { error: updateError.message || 'Failed to update ticket' },
        { status: 500 }
      );
    }

    // Create notification for user if admin responded
    if (admin_response) {
      const notificationData = {
        user_id: ticket.user_id,
        type: 'system',
        title: 'Support Response',
        message: `We've responded to your support ticket: "${ticket.subject}". Please check your messages.`,
        data: {
          ticket_id: ticket.id,
          subject: ticket.subject,
        }
      };

      await supabaseAdmin
        .from('notifications')
        .insert(notificationData);
    }

    return Response.json({ 
      success: true,
      ticket: updatedTicket,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/tickets/[ticketId]:', error);
    return Response.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

