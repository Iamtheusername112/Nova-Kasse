import { createClient } from '@supabase/supabase-js';

// Delete a user completely from the database
export async function DELETE(request, { params }) {
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

    // First, verify the user exists
    const { data: authUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (fetchError || !authUser?.user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user from auth.users (this will cascade delete from profiles due to ON DELETE CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return Response.json(
        { error: deleteError.message || 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Also explicitly delete from profiles table (in case cascade doesn't work)
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // Note: We don't fail if profile deletion fails, as it might already be deleted by cascade
    if (profileDeleteError) {
      console.warn('Profile deletion warning (may already be deleted):', profileDeleteError);
    }

    return Response.json({ 
      success: true,
      message: 'User deleted successfully from database' 
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[userId]:', error);
    return Response.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

