"use client";

import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Filter,
  ShoppingBag,
  Coffee,
  Fuel,
  Film,
  Zap,
  Wifi,
  Phone,
  Receipt,
  CreditCard,
  ArrowDownLeft,
  Building2,
  UtensilsCrossed,
  Car,
  Gamepad2,
  Music,
  Plane,
  Heart,
  Gift,
  Store,
  Banknote
} from "lucide-react";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency";

function ExpensesPageContent() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { transactions, loading } = useTransactions(100); // Fetch more transactions for analysis
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  
  // Get user's currency (default to USD)
  const userCurrency = profile?.currency || user?.user_metadata?.currency || 'USD';

  // Get category icon and color
  const getCategoryInfo = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    
    if (categoryLower.includes('food') || categoryLower.includes('dining') || categoryLower.includes('restaurant') || categoryLower.includes('coffee')) {
      return { icon: Coffee, color: 'bg-orange-500', name: 'Food & Dining' };
    }
    if (categoryLower.includes('shopping') || categoryLower.includes('store') || categoryLower.includes('retail')) {
      return { icon: ShoppingBag, color: 'bg-purple-500', name: 'Shopping' };
    }
    if (categoryLower.includes('fuel') || categoryLower.includes('gas') || categoryLower.includes('transportation') || categoryLower.includes('uber') || categoryLower.includes('taxi')) {
      return { icon: Fuel, color: 'bg-green-500', name: 'Transportation' };
    }
    if (categoryLower.includes('entertainment') || categoryLower.includes('movie') || categoryLower.includes('netflix') || categoryLower.includes('streaming')) {
      return { icon: Film, color: 'bg-yellow-500', name: 'Entertainment' };
    }
    if (categoryLower.includes('utilities') || categoryLower.includes('electric') || categoryLower.includes('water') || categoryLower.includes('utility')) {
      return { icon: Zap, color: 'bg-red-500', name: 'Bills & Utilities' };
    }
    if (categoryLower.includes('internet') || categoryLower.includes('wifi')) {
      return { icon: Wifi, color: 'bg-blue-500', name: 'Internet' };
    }
    if (categoryLower.includes('phone') || categoryLower.includes('mobile')) {
      return { icon: Phone, color: 'bg-indigo-500', name: 'Phone' };
    }
    if (categoryLower.includes('payment') || categoryLower.includes('bill')) {
      return { icon: Receipt, color: 'bg-pink-500', name: 'Payments' };
    }
    if (categoryLower.includes('transfer')) {
      return { icon: ArrowDownLeft, color: 'bg-teal-500', name: 'Transfers' };
    }
    if (categoryLower.includes('request')) {
      return { icon: Gift, color: 'bg-cyan-500', name: 'Requests' };
    }
    
    return { icon: Banknote, color: 'bg-gray-500', name: category || 'Other' };
  };

  // Calculate expenses based on selected period
  const expenseData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalExpenses: 0,
        expensesByCategory: [],
        previousPeriodTotal: 0,
        percentageChange: 0,
      };
    }

    const now = new Date();
    let startDate, previousStartDate, previousEndDate;

    switch (selectedPeriod) {
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter debit transactions (money going out)
    const debitTypes = ['expense', 'payment', 'transfer', 'withdrawal', 'request'];
    const currentPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return debitTypes.includes(t.type) && 
             transactionDate >= startDate && 
             transactionDate <= now;
    });

    const previousPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.created_at);
      return debitTypes.includes(t.type) && 
             transactionDate >= previousStartDate && 
             transactionDate <= previousEndDate;
    });

    // Calculate total expenses for current period
    const totalExpenses = currentPeriodTransactions.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 
      0
    );

    // Calculate total expenses for previous period
    const previousPeriodTotal = previousPeriodTransactions.reduce(
      (sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 
      0
    );

    // Calculate percentage change
    const percentageChange = previousPeriodTotal > 0
      ? ((totalExpenses - previousPeriodTotal) / previousPeriodTotal) * 100
      : 0;

    // Group expenses by category
    const categoryMap = new Map();
    
    currentPeriodTransactions.forEach(transaction => {
      const category = transaction.category || transaction.type || 'Other';
      const amount = Math.abs(parseFloat(transaction.amount || 0));
      
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + amount);
      } else {
        categoryMap.set(category, amount);
      }
    });

    // Convert to array and sort by amount
    const expensesByCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        ...getCategoryInfo(category),
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpenses,
      expensesByCategory,
      previousPeriodTotal,
      percentageChange,
    };
  }, [transactions, selectedPeriod]);

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, userCurrency);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Expenses" rightIcon={null} />
      
      <div className="px-4 py-6">
        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          {["week", "month", "year"].map((period) => (
            <Button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              variant={selectedPeriod === period ? "default" : "outline"}
              className={`capitalize ${selectedPeriod === period ? 'bg-blue-600 text-white' : ''}`}
            >
              {period}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Loading expenses...</p>
          </div>
        ) : (
          <>
            {/* Total Expenses Card */}
            <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {formatCurrency(expenseData.totalExpenses)}
                    </h2>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                {expenseData.previousPeriodTotal > 0 && (
                  <div className={`flex items-center gap-2 text-sm ${expenseData.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {expenseData.percentageChange >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {Math.abs(expenseData.percentageChange).toFixed(1)}% {expenseData.percentageChange >= 0 ? 'increase' : 'decrease'} from last {selectedPeriod}
                    </span>
                  </div>
                )}
                {expenseData.previousPeriodTotal === 0 && expenseData.totalExpenses > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>First {selectedPeriod} with expenses</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            {expenseData.expensesByCategory.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">By Category</h3>
                {expenseData.expensesByCategory.map((expense, index) => {
                  const CategoryIcon = expense.icon;
                  return (
                    <Card key={index} className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${expense.color} flex items-center justify-center text-white`}>
                              <CategoryIcon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-gray-900">{expense.name}</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${expense.color} transition-all duration-500`}
                            style={{ width: `${expense.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{expense.percentage.toFixed(1)}% of total</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl">
                <CardContent className="p-8 text-center">
                  <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 font-semibold mb-1">No expenses yet</p>
                  <p className="text-sm text-gray-500">Your expenses for this {selectedPeriod} will appear here</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <ProtectedRoute>
      <ExpensesPageContent />
    </ProtectedRoute>
  );
}
