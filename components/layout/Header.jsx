"use client";

import { Bell, ArrowRight, Edit, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header({ title, rightIcon = null, onRightClick, badgeCount = 0 }) {
  const getIcon = () => {
    if (rightIcon === "edit") return <Edit className="w-5 h-5" />;
    if (rightIcon === "arrow") return <ArrowRight className="w-5 h-5" />;
    if (rightIcon === "bell") return <Bell className="w-5 h-5" />;
    if (rightIcon === "card") return <CreditCard className="w-5 h-5" />;
    return null;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {rightIcon && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRightClick}
            className="text-gray-600 relative"
          >
            {getIcon()}
            {badgeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}

