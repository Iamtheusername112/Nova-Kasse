"use client";

import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ExpensesPageContent() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="Expenses" rightIcon="arrow" />
      
      <div className="px-4 py-6">
        {/* Card Balance Section */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-600 mb-2">Card Balance</h3>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">$6,390</h2>
          
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Income</p>
                <p className="text-sm font-semibold text-green-600">$3,214</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDown className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Expense</p>
                <p className="text-sm font-semibold text-red-600">$1,168</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6">
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0">
              <TabsTrigger
                value="monthly"
                className="px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-full"
              >
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 mt-4">
            {["Jan", "Feb", "Mar", "Apr", "May"].map((month, index) => (
              <button
                key={month}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  index === 0
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="h-48 relative">
              <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                {/* Y-axis labels */}
                <text x="5" y="20" fontSize="10" fill="#6b7280">3,000</text>
                <text x="5" y="75" fontSize="10" fill="#6b7280">2,000</text>
                <text x="5" y="130" fontSize="10" fill="#6b7280">1,000</text>
                
                {/* Grid lines */}
                <line x1="30" y1="20" x2="300" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="30" y1="75" x2="300" y2="75" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="30" y1="130" x2="300" y2="130" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Green line (income trend) */}
                <polyline
                  points="40,60 60,55 80,50 100,45 120,40 140,38 160,35 180,32 200,30"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                
                {/* Red line (expense trend - dips around 04 and 05) */}
                <polyline
                  points="40,100 60,95 80,90 100,110 120,105 140,95 160,90 180,85 200,80"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                
                {/* X-axis labels */}
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((day, index) => (
                  <text
                    key={day}
                    x={40 + index * 20}
                    y="145"
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {String(day).padStart(2, "0")}
                  </text>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Spending Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Spending Breakdown
          </h3>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Shopping</h4>
                    <p className="text-sm text-gray-500">17 Monday January</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-red-600">-$279,90</p>
              </div>
            </CardContent>
          </Card>
        </div>
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

