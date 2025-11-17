import { createClient } from '@supabase/supabase-js';

// Get all transfers for admin review
export async function GET() {
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

    // Fetch all transfer transactions
    const { data: transfers, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('type', 'transfer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transfers:', error);
      return Response.json(
        { error: error.message || 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    // Fetch user profiles for each transfer
    const userIds = [...new Set(transfers.map(t => t.user_id))];
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, currency')
      .in('id', userIds);

    // Fetch user emails from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    // Create a map for quick lookup
    const profilesMap = {};
    (profiles || []).forEach(profile => {
      profilesMap[profile.id] = profile;
    });

    const authUsersMap = {};
    (authUsers?.users || []).forEach(authUser => {
      authUsersMap[authUser.id] = authUser;
    });

    // Format the transfers with user information
    const formattedTransfers = transfers.map(transfer => {
      const profile = profilesMap[transfer.user_id];
      const authUser = authUsersMap[transfer.user_id];
      
      return {
        ...transfer,
        user_name: profile?.full_name || null,
        user_email: authUser?.email || null,
        user_currency: profile?.currency || 'USD',
      };
    });

    return Response.json({ transfers: formattedTransfers });
  } catch (error) {
    console.error('Error in GET /api/admin/transfers:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

