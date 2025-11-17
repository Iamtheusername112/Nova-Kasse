"use client";

import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { CreditCard, ArrowUp, ArrowDown, Plus, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function WalletPageContent() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="Wallet for Axess Platinum Card" rightIcon="card" />
      
      <div className="px-4 py-6">
        {/* Credit Card Display */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-8">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500"></div>
                <div className="w-8 h-8 rounded-full bg-yellow-400 -ml-4"></div>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-blue-200 mb-2">Card Number</p>
              <p className="text-xl font-mono tracking-wider">.... .... .... 0113</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-blue-200 mb-1">Card Holder</p>
                <p className="text-sm font-semibold">JONATHAN DAVIS</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 mb-1">Expires</p>
                <p className="text-sm font-semibold">11/22</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Amount */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Remaining Amount</span>
            <span className="text-lg font-semibold text-gray-900">%38</span>
          </div>
        </div>

        {/* Income/Expense Summary */}
        <div className="flex gap-6 mb-6">
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
              <p className="text-sm font-semibold text-red-600">$1,640</p>
            </div>
          </div>
        </div>

        {/* Send Money To */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Send Money to
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
              <Plus className="w-6 h-6 text-gray-400" />
            </button>
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Josie+Maran&background=6366f1&color=fff&size=64"
                alt="Josie Maran"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Ricardo+Joseph&background=3b82f6&color=fff&size=64"
                alt="Ricardo Joseph"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
              <img
                src="https://ui-avatars.com/api/?name=Li+Hur&background=ec4899&color=fff&size=64"
                alt="Li Hur"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div>
          <Tabs defaultValue="day" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Vodafone</h4>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function WalletPage() {
  return (
    <ProtectedRoute>
      <WalletPageContent />
    </ProtectedRoute>
  );
}

