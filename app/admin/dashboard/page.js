"use client";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Shield,
  LogOut,
  Menu,
  X,
  Send,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LoadingScreen from "@/components/ui/loading-screen";
import { useMinimumLoadingTime } from "@/lib/hooks/useMinimumLoadingTime";
import { supabase } from "@/lib/supabase/client";

function AdminDashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: "$0",
    activeAccounts: 0,
    changes: {
      users: "+0%",
      transactions: "+0%",
      revenue: "+0%",
      activeAccounts: "+0%"
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const displayLoading = useMinimumLoadingTime(loading, 3000);

  const fetchStats = async (isRefresh = false) => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStats(data);
      if (!isRefresh) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      if (!isRefresh) {
        toast.error('Failed to load dashboard statistics');
        setLoading(false);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up real-time subscriptions for immediate updates
    const transactionsChannel = supabase
      .channel('admin-dashboard-transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('Transaction change detected:', payload.eventType);
          // Refresh stats when transactions change (silent refresh)
          fetchStats(true);
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('admin-dashboard-users')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('User change detected:', payload.eventType);
          // Refresh stats when users change (silent refresh)
          fetchStats(true);
        }
      )
      .subscribe();
    
    // Also refresh stats every 30 seconds as a fallback (silent refresh)
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/admin/login" });
  };

  const statsData = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      change: stats.changes.users,
      changeType: "positive"
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: Activity,
      color: "bg-green-500",
      change: stats.changes.transactions,
      changeType: "positive"
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: DollarSign,
      color: "bg-purple-500",
      change: stats.changes.revenue,
      changeType: "positive"
    },
    {
      title: "Active Accounts",
      value: stats.activeAccounts.toLocaleString(),
      icon: TrendingUp,
      color: "bg-orange-500",
      change: stats.changes.activeAccounts,
      changeType: "positive"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Nova Kasse Banking</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <a 
                href="/admin/dashboard" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-medium"
              >
                <Shield className="w-5 h-5" />
                Dashboard
              </a>
              <a 
                href="/admin/users" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="w-5 h-5" />
                Users
              </a>
              <a 
                href="/admin/transactions" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Activity className="w-5 h-5" />
                Transactions
              </a>
              <a 
                href="/admin/transfers" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Send className="w-5 h-5" />
                Transfers
              </a>
              <a 
                href="/admin/tickets" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                Support Tickets
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <DollarSign className="w-5 h-5" />
                Financial Reports
              </a>
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Real-time statistics and activity monitoring</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {displayLoading ? (
              <LoadingScreen message="Loading Dashboard..." subMessage="Fetching statistics and activity data" />
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statsData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-sm font-semibold ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-sm text-gray-600">{stat.title}</p>
                    </CardContent>
                  </Card>
                );
              })}
                </div>

                {/* Welcome Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-8">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">Welcome back, Administrator!</h2>
                <p className="text-blue-100">
                  Manage your banking platform, monitor transactions, and oversee user accounts from this centralized dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">View and manage all user accounts, verify KYC documents, and handle account issues.</p>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/users")}
                  >
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Transaction Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Credit and debit user accounts, monitor transactions, and manage transaction disputes.</p>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/transactions")}
                  >
                    Manage Transactions
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Transfer Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Review, approve, or block pending transfer requests from users.</p>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/transfers")}
                  >
                    Manage Transfers
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">View and respond to user support tickets and account appeals.</p>
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/admin/tickets")}
                  >
                    Manage Tickets
                  </Button>
                </CardContent>
              </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent />
    </AdminProtectedRoute>
  );
}

