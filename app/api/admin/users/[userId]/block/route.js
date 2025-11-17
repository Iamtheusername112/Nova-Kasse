import { createClient } from '@supabase/supabase-js';

// Block or unblock a user
export async function PATCH(request, { params }) {
  try {
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

    // Get request body
    const body = await request.json();
    const { is_blocked } = body;

    if (typeof is_blocked !== 'boolean') {
      return Response.json(
        { error: 'is_blocked must be a boolean value' },
        { status: 400 }
      );
    }

    // Verify user exists - try profiles first
    let profile;
    try {
      const { data: profileData, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, is_blocked')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching profile for block/unblock:', fetchError);
        // If profile doesn't exist, try to get from auth.users
        const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
        
        if (authError || !authUserData?.user) {
          return Response.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // User exists in auth but not in profiles - create a minimal profile object
        profile = {
          id: userId,
          full_name: authUserData.user.user_metadata?.full_name || null,
          email: authUserData.user.email || null,
          is_blocked: false
        };
      } else {
        profile = profileData;
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return Response.json(
        { error: 'Failed to fetch user information' },
        { status: 500 }
      );
    }

    // Prevent blocking admin users
    let authUser;
    try {
      const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (authError) {
        console.warn('Could not fetch auth user for admin check:', authError);
        // Continue anyway - we'll just skip the admin check
      } else if (authUserData?.user) {
        authUser = authUserData.user;
        const isAdminUser = authUser.user_metadata?.role === 'admin' || 
                           authUser.email === 'admin@novakasse.com';
        
        if (isAdminUser && is_blocked) {
          return Response.json(
            { error: 'Cannot block admin users' },
            { status: 400 }
          );
        }
      }
    } catch (error) {
      console.warn('Exception checking admin status:', error);
      // Continue anyway - we'll just skip the admin check
    }

    // Update user's blocked status
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_blocked })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user block status:', updateError);
      return Response.json(
        { error: updateError.message || 'Failed to update user status' },
        { status: 500 }
      );
    }

    // Also update user_metadata for consistency (if we have authUser)
    if (authUser) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...authUser.user_metadata,
            is_blocked
          }
        });
      } catch (metadataError) {
        console.warn('Could not update user_metadata (non-critical):', metadataError);
        // Continue - profile update was successful
      }
    }

    // Note: Users remain logged in but see blocked overlay on home page
    // All buttons/actions are disabled when account is blocked

    return Response.json({ 
      success: true,
      user: updatedProfile,
      message: is_blocked ? 'User blocked successfully' : 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[userId]/block:', error);
    return Response.json(
      { error: error.message || 'Failed to update user status' },
      { status: 500 }
    );
  }
}

