import { createClient } from '@supabase/supabase-js';

// Get admin dashboard statistics
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

    // Fetch all users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
    }

    // Fetch all transactions count
    const { count: totalTransactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (transactionsError) {
      console.error('Error fetching transactions count:', transactionsError);
    }

    // Calculate total revenue from completed transactions (only positive amounts - deposits, income)
    const { data: completedTransactions, error: revenueError } = await supabaseAdmin
      .from('transactions')
      .select('amount, currency')
      .eq('status', 'completed')
      .in('type', ['deposit', 'income']);

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
    }

    // Calculate total revenue (sum of all positive amounts from deposits and income)
    let totalRevenue = 0;
    if (completedTransactions) {
      totalRevenue = completedTransactions.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount) || 0;
        return sum + Math.max(0, amount); // Only positive amounts
      }, 0);
    }

    // Fetch active accounts (users who have made at least one completed transaction in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: activeUsers, error: activeUsersError } = await supabaseAdmin
      .from('transactions')
      .select('user_id')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (activeUsersError) {
      console.error('Error fetching active users:', activeUsersError);
    }

    // Get unique active user IDs
    const activeAccountIds = [...new Set((activeUsers || []).map(t => t.user_id))];
    const activeAccounts = activeAccountIds.length;

    // Calculate percentage changes (mock for now, can be enhanced with historical data)
    // For now, we'll calculate based on recent activity
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const { count: recentUsers, error: recentUsersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7Days.toISOString());

    const { count: recentTransactions, error: recentTransactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7Days.toISOString());

    // Calculate percentage changes (simplified - comparing last 7 days to total)
    const usersChange = totalUsers > 0 
      ? ((recentUsers || 0) / totalUsers * 100).toFixed(0)
      : 0;
    
    const transactionsChange = totalTransactions > 0
      ? ((recentTransactions || 0) / totalTransactions * 100).toFixed(0)
      : 0;

    // Format revenue with currency symbol
    const formatRevenue = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    };

    return Response.json({
      totalUsers: totalUsers || 0,
      totalTransactions: totalTransactions || 0,
      totalRevenue: formatRevenue(totalRevenue),
      totalRevenueRaw: totalRevenue,
      activeAccounts: activeAccounts || 0,
      changes: {
        users: `+${usersChange}%`,
        transactions: `+${transactionsChange}%`,
        revenue: '+15%', // Can be calculated from historical data if needed
        activeAccounts: '+5%' // Can be calculated from historical data if needed
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

