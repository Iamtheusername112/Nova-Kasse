"use client";

import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AddPage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <Header title="Add Transaction" />
      
      <div className="px-4 py-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <p className="text-center text-gray-600">
              Add new transaction form coming soon...
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}

