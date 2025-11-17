import { createClient } from '@supabase/supabase-js';

// Get all tickets for admin review
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

    // Fetch all tickets
    const { data: tickets, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return Response.json(
        { error: error.message || 'Failed to fetch tickets' },
        { status: 500 }
      );
    }

    // Fetch user profiles for each ticket
    const userIds = [...new Set(tickets.map(t => t.user_id).filter(Boolean))];
    
    let profilesMap = {};
    let authUsersMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles for tickets:', profilesError);
        // Continue without profiles - tickets will show without user names
      } else {
        (profiles || []).forEach(profile => {
          profilesMap[profile.id] = profile;
        });
      }

      // Fetch user emails from auth.users
      try {
        const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authError) {
          console.warn('Error fetching auth users for tickets:', authError);
          // Continue without auth users - tickets will show without emails
        } else {
          (authUsers?.users || []).forEach(authUser => {
            authUsersMap[authUser.id] = authUser;
          });
        }
      } catch (authError) {
        console.warn('Exception fetching auth users:', authError);
        // Continue without auth users
      }
    }

    // Format tickets with user information
    const formattedTickets = tickets.map(ticket => {
      const profile = profilesMap[ticket.user_id];
      const authUser = authUsersMap[ticket.user_id];
      
      return {
        ...ticket,
        user_name: profile?.full_name || 'User not found',
        user_email: authUser?.email || 'Email not available',
      };
    });

    return Response.json({ tickets: formattedTickets });
  } catch (error) {
    console.error('Error in GET /api/admin/tickets:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

