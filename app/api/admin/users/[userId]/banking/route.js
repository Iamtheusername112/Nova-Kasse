import { createClient } from '@supabase/supabase-js';

// Update user banking credentials (account number, routing number)
export async function PATCH(request, { params }) {
  try {
    // In Next.js 13+, params might be a Promise, so await it
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid userId received:', userId);
      return Response.json(
        { error: 'Invalid user ID provided' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format:', userId);
      return Response.json(
        { error: 'Invalid user ID format' },
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

    const body = await request.json();
    const { account_number, routing_number, account_type } = body;

    // Validate account number (should be 10 digits)
    if (account_number && !/^\d{10}$/.test(account_number)) {
      return Response.json(
        { error: 'Account number must be exactly 10 digits' },
        { status: 400 }
      );
    }

    // Validate routing number (should be 9 digits)
    if (routing_number && !/^\d{9}$/.test(routing_number)) {
      return Response.json(
        { error: 'Routing number must be exactly 9 digits' },
        { status: 400 }
      );
    }

    // Check if account number already exists (if provided and different from current)
    if (account_number) {
      // Get current user's account number
      const { data: currentUser } = await supabaseAdmin
        .from('profiles')
        .select('account_number')
        .eq('id', userId)
        .single();

      // Only check for duplicates if the new account number is different from current
      if (!currentUser || currentUser.account_number !== account_number) {
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('account_number', account_number)
          .neq('id', userId)
          .single();

        if (existingProfile) {
          return Response.json(
            { error: 'Account number already assigned to another user' },
            { status: 400 }
          );
        }
      }
    }

    // Update profile
    const updateData = {};
    if (account_number !== undefined) updateData.account_number = account_number;
    if (routing_number !== undefined) updateData.routing_number = routing_number;
    if (account_type !== undefined) updateData.account_type = account_type;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating banking credentials:', error);
      return Response.json(
        { error: error.message || 'Failed to update banking credentials' },
        { status: 500 }
      );
    }

    // Also update user metadata for consistency
    if (account_number || routing_number || account_type) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user) {
        const updatedMetadata = {
          ...authUser.user.user_metadata,
          account_number: account_number || authUser.user.user_metadata?.account_number,
          routing_number: routing_number || authUser.user.user_metadata?.routing_number,
          account_type: account_type || authUser.user.user_metadata?.account_type || 'checking',
        };

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: updatedMetadata,
        });
      }
    }

    return Response.json({ 
      success: true, 
      data,
      message: 'Banking credentials updated successfully' 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[userId]/banking:', error);
    return Response.json(
      { error: error.message || 'Failed to update banking credentials' },
      { status: 500 }
    );
  }
}

