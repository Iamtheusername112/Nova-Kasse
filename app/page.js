"use client";

import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Bell, Globe, Calculator, Droplet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

function HomePageContent() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="Your Budgets" rightIcon="bell" />
      
      <div className="px-4 py-6">
        {/* Budget Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">for Axess Platinum Card</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Budget
            </Button>
          </div>

          {/* Circular Progress */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${(6390 / 3248) * 100 * 5.28} 528`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-600 mb-1">You Are Spent</p>
                <p className="text-2xl font-bold text-gray-900">$6,390</p>
                <p className="text-sm text-gray-500">of $3,248</p>
              </div>
            </div>
            <div className="flex w-48 justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-12 border-gray-200"
            >
              <Globe className="w-5 h-5 mr-2" />
              Send Money
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-gray-200"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculation
            </Button>
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

          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Droplet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Shell</h4>
                      <p className="text-sm text-gray-500">17 Monday June</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-red-600">-$35,88</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">A</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Amazon</h4>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-red-600">-$70.00</p>
                </div>
              </CardContent>
            </Card>
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
