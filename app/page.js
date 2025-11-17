"use client";

import { useState, useEffect } from "react";
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

function HomePageContent() {
  const { user } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data - replace with real data from your backend
  const accountBalance = 12450.75;
  const availableBalance = 11500.00;
  const monthlyIncome = 8500.00;
  const monthlyExpenses = 3200.50;
  
  const quickActions = [
    { icon: Send, label: "Send", color: "bg-blue-600", delay: "delay-100" },
    { icon: ArrowDownLeft, label: "Request", color: "bg-blue-600", delay: "delay-200" },
    { icon: CreditCard, label: "Pay", color: "bg-blue-600", delay: "delay-300" },
    { icon: MoreHorizontal, label: "More", color: "bg-blue-600", delay: "delay-400" },
  ];

  const recentTransactions = [
    { id: 1, name: "Shell Gas Station", category: "Fuel", amount: -35.88, date: "Today", icon: Fuel, color: "bg-gray-600" },
    { id: 2, name: "Amazon", category: "Shopping", amount: -70.00, date: "Yesterday", icon: ShoppingBag, color: "bg-gray-600" },
    { id: 3, name: "Starbucks", category: "Food", amount: -12.50, date: "2 days ago", icon: Coffee, color: "bg-gray-600" },
    { id: 4, name: "Salary Deposit", category: "Income", amount: 8500.00, date: "5 days ago", icon: CircleDollarSign, color: "bg-green-600" },
    { id: 5, name: "Netflix", category: "Entertainment", amount: -15.99, date: "1 week ago", icon: Film, color: "bg-gray-600" },
  ];


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Dashboard" rightIcon="bell" />
      
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
                className={`group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${action.delay}`}
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
                <Button variant="ghost" size="sm" className="text-blue-600">
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
            <Button variant="ghost" size="sm" className="text-blue-600">
              See All <ArrowRightCircle className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => {
              const Icon = transaction.icon;
              const isIncome = transaction.amount > 0;
              
              return (
                <Card 
                  key={transaction.id} 
                  className="border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-slide-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-12 h-12 rounded-xl ${transaction.color} flex items-center justify-center shadow-md`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{transaction.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">{transaction.category}</p>
                            <span className="text-gray-300">•</span>
                            <p className="text-xs text-gray-500">{transaction.date}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                          {isIncome ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
