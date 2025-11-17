"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  Bell, 
  Send, 
  ArrowDownLeft, 
  MoreHorizontal,
  TrendingUp,
  CreditCard,
  Eye,
  EyeOff,
  ShoppingBag,
  Coffee,
  Film,
  Fuel,
  PiggyBank,
  TrendingDown,
  ArrowRightCircle,
  CircleDollarSign
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useProfile } from "@/lib/hooks/useProfile";
import { useAccountStatus } from "@/lib/hooks/useAccountStatus";
import { calculateBalance as calculateBalanceUtil } from "@/lib/utils/balance";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency";
import AccountBlockedOverlay from "@/components/account/AccountBlockedOverlay";

function HomePageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { transactions, loading: transactionsLoading } = useTransactions(1000); // Fetch all transactions for accurate balance calculation
  const { unreadCount } = useNotifications();
  const { profile } = useProfile();
  const { isBlocked } = useAccountStatus();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Get user's currency (default to USD)
  const userCurrency = profile?.currency || user?.user_metadata?.currency || 'USD';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate balance and monthly stats from transactions
  // New accounts start at $0.00 - balance is calculated purely from transactions
  const calculateBalance = () => {
    const accountBalance = calculateBalanceUtil(transactions);
    
    if (!transactions || transactions.length === 0) {
      return {
        accountBalance,
        availableBalance: accountBalance,
        monthlyIncome: 0,
        monthlyExpenses: 0,
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get all transactions for monthly calculation (we need to fetch more than displayed)
    const monthlyTransactions = transactions.filter(
      (t) => t.created_at && new Date(t.created_at) >= startOfMonth
    );

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'income' || t.type === 'deposit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthlyExpenses = monthlyTransactions
      .filter((t) => {
        // For expenses, payments, transfers, withdrawals - use absolute value since amounts can be negative
        const isExpenseType = ['expense', 'payment', 'transfer', 'withdrawal', 'request'].includes(t.type);
        return isExpenseType;
      })
      .reduce((sum, t) => {
        // For withdrawals and transfers, amount is already negative, so we add the absolute value
        const amount = Math.abs(parseFloat(t.amount || 0));
        return sum + amount;
      }, 0);

    const availableBalance = accountBalance; // Available balance equals account balance (no reserve for now)

    return {
      accountBalance,
      availableBalance,
      monthlyIncome,
      monthlyExpenses,
    };
  };

  const balanceData = calculateBalance();
  const accountBalance = balanceData.accountBalance;
  const availableBalance = balanceData.availableBalance;
  const monthlyIncome = balanceData.monthlyIncome;
  const monthlyExpenses = balanceData.monthlyExpenses;
  
  const quickActions = [
    { icon: Send, label: "Send", color: "bg-blue-600", delay: "delay-100", href: "/transfer" },
    { icon: ArrowDownLeft, label: "Request", color: "bg-blue-600", delay: "delay-200", href: "/request" },
    { icon: CreditCard, label: "Pay", color: "bg-blue-600", delay: "delay-300", href: "/pay" },
    { icon: MoreHorizontal, label: "More", color: "bg-blue-600", delay: "delay-400", href: "/more" },
  ];

  // Map transaction types to icons and colors
  const getTransactionIcon = (type, category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('fuel') || categoryLower.includes('gas')) return Fuel;
    if (categoryLower.includes('shopping') || categoryLower.includes('store')) return ShoppingBag;
    if (categoryLower.includes('food') || categoryLower.includes('restaurant') || categoryLower.includes('coffee')) return Coffee;
    if (type === 'income' || type === 'deposit') return CircleDollarSign;
    if (categoryLower.includes('entertainment') || categoryLower.includes('movie')) return Film;
    return ShoppingBag; // Default icon
  };

  const formatTransactionDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };


  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, userCurrency);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20 relative">
      {/* Show blocked overlay if account is blocked */}
      {isBlocked && user && <AccountBlockedOverlay userId={user.id} />}
      
      {/* Disable all interactions when blocked */}
      <div className={isBlocked ? "pointer-events-none opacity-50" : ""}>
        <Header 
          title="Dashboard" 
          rightIcon="bell" 
          onRightClick={() => !isBlocked && router.push("/notifications")}
          badgeCount={unreadCount}
        />
        
        <div className="px-4 py-6 space-y-6">
        {/* Account Balance Card - Premium Design */}
        <div className={`transform transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 shadow-2xl animate-gradient-shift">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Total Balance</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold text-white">
                      {balanceVisible ? formatCurrency(accountBalance) : "••••••"}
                    </h2>
                    <button
                      onClick={() => setBalanceVisible(!balanceVisible)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Account Info */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/60 text-xs mb-1">Available</p>
                  <p className="text-white font-semibold">{balanceVisible ? formatCurrency(availableBalance) : "••••"}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs mb-1">Card Number</p>
                  <p className="text-white font-mono text-sm tracking-wider">
                    {balanceVisible ? "**** 4532" : "**** ****"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-4 gap-4 transform transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => !isBlocked && action.href && action.href !== "#" && router.push(action.href)}
                disabled={isBlocked}
                className={`group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${action.delay} ${isBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Monthly Summary */}
        <div className={`transform transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">This Month</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600"
                  disabled={isBlocked}
                >
                  View All <ArrowRightCircle className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-600">Income</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyIncome)}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-600">Expenses</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyExpenses)}</p>
                </div>
              </div>

              {/* Spending Progress */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Spending Progress</p>
                  <p className="text-sm font-bold text-gray-900">
                    {Math.round((monthlyExpenses / monthlyIncome) * 100)}%
                  </p>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((monthlyExpenses / monthlyIncome) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className={`transform transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">Recent Transactions</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              disabled={isBlocked}
            >
              See All <ArrowRightCircle className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {transactionsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading transactions...</p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => {
                const Icon = getTransactionIcon(transaction.type, transaction.category);
                // Credits: income, deposit (money coming in)
                // Debits: expense, payment, transfer, withdrawal, request (money going out)
                const isCredit = transaction.type === 'income' || transaction.type === 'deposit';
                const isDebit = transaction.type === 'expense' || transaction.type === 'payment' || 
                               transaction.type === 'transfer' || transaction.type === 'withdrawal' || 
                               transaction.type === 'request';
                const amount = parseFloat(transaction.amount || 0);
                
                return (
                  <Card 
                    key={transaction.id} 
                    className="border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-slide-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl ${isCredit ? 'bg-green-600' : 'bg-gray-600'} flex items-center justify-center shadow-md flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {transaction.recipient_name || transaction.description || transaction.category || 'Transaction'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500 truncate">{transaction.category || transaction.type}</p>
                              <span className="text-gray-300 flex-shrink-0">•</span>
                              <p className="text-xs text-gray-500 whitespace-nowrap">{formatTransactionDate(transaction.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 min-w-0 max-w-[45%]">
                          <p className={`text-base sm:text-lg font-bold break-words ${isCredit ? 'text-green-600' : isDebit ? 'text-red-600' : 'text-gray-900'}`}>
                            {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(Math.abs(amount))}
                          </p>
                          {transaction.status === 'pending' && (
                            <p className="text-xs text-yellow-600 font-medium mt-1">Pending</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Your recent transactions will appear here</p>
            </div>
          )}
        </div>
      </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}
