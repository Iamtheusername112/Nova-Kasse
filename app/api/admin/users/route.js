import { createClient } from '@supabase/supabase-js';

// This is a server-side API route that uses service role key
// to fetch all users including emails

export async function GET(request) {
  try {
    // Get service role key from environment (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
      return Response.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return Response.json(
        { 
          error: 'Service role key not configured. Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.',
          details: 'Get your service role key from: Supabase Dashboard → Project Settings → API → Service Role Key'
        },
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Fetch all auth users
    let authUsers = { users: [] };
    try {
      const { data, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      if (authError) {
        console.error('Error fetching auth users:', authError);
        // If we can't fetch auth users, continue with profiles only
        console.warn('Continuing with profiles data only (no email/auth data)');
      } else {
        authUsers = data || { users: [] };
      }
    } catch (authErr) {
      console.error('Exception fetching auth users:', authErr);
      // Continue with profiles only
    }

    // Merge profile data with auth user data
    const mergedUsers = (profiles || []).map((profile) => {
      const authUser = authUsers?.users?.find((u) => u.id === profile.id);
      return {
        ...profile,
        email: authUser?.email || 'N/A',
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        last_sign_in: authUser?.last_sign_in_at || null,
        role: authUser?.user_metadata?.role || 'user',
      };
    });

    return Response.json({ users: mergedUsers });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to fetch users',
        details: error.stack || 'No additional details available'
      },
      { status: 500 }
    );
  }
}
