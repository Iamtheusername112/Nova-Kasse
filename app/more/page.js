"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings,
  HelpCircle,
  Shield,
  FileText,
  CreditCard,
  Bell,
  User,
  LogOut,
  ChevronRight,
  History,
  Download,
  Share2,
  Star,
  Info,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  Globe,
  QrCode,
  Wallet,
  TrendingUp,
  Gift
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { toast } from "sonner";

function MorePageContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [showAccountDetails, setShowAccountDetails] = useState(false);

  const menuSections = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile",
          description: "View and edit your profile",
          action: () => router.push("/profile"),
          color: "bg-blue-500"
        },
        {
          icon: CreditCard,
          label: "Banking Credentials",
          description: "View account & routing numbers",
          action: () => router.push("/profile"),
          color: "bg-purple-500"
        },
        {
          icon: History,
          label: "Transaction History",
          description: "View all your transactions",
          action: () => {
            toast.info("Transaction history coming soon");
          },
          color: "bg-green-500"
        },
        {
          icon: FileText,
          label: "Statements",
          description: "Download account statements",
          action: () => {
            toast.info("Statements feature coming soon");
          },
          color: "bg-orange-500"
        },
      ]
    },
    {
      title: "Security & Privacy",
      items: [
        {
          icon: Shield,
          label: "Security Settings",
          description: "Manage security preferences",
          action: () => {
            toast.info("Security settings coming soon");
          },
          color: "bg-red-500"
        },
        {
          icon: Lock,
          label: "Change PIN",
          description: "Update your security PIN",
          action: () => {
            toast.info("PIN change feature coming soon");
          },
          color: "bg-indigo-500"
        },
        {
          icon: Eye,
          label: "Privacy Settings",
          description: "Control your privacy",
          action: () => {
            toast.info("Privacy settings coming soon");
          },
          color: "bg-gray-500"
        },
      ]
    },
    {
      title: "Services",
      items: [
        {
          icon: QrCode,
          label: "QR Code Payments",
          description: "Scan to pay or receive",
          action: () => {
            toast.info("QR code payments coming soon");
          },
          color: "bg-teal-500"
        },
        {
          icon: Wallet,
          label: "Cards",
          description: "Manage your cards",
          action: () => router.push("/wallet"),
          color: "bg-pink-500"
        },
        {
          icon: TrendingUp,
          label: "Investments",
          description: "View investment options",
          action: () => {
            toast.info("Investments feature coming soon");
          },
          color: "bg-emerald-500"
        },
        {
          icon: Gift,
          label: "Rewards",
          description: "View rewards and offers",
          action: () => {
            toast.info("Rewards feature coming soon");
          },
          color: "bg-yellow-500"
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "Get help and FAQs",
          action: () => {
            toast.info("Help center coming soon");
          },
          color: "bg-cyan-500"
        },
        {
          icon: Phone,
          label: "Contact Us",
          description: "Reach out to customer service",
          action: () => {
            toast.info("Contact information coming soon");
          },
          color: "bg-blue-600"
        },
        {
          icon: Info,
          label: "About",
          description: "App version and information",
          action: () => {
            toast.info("Nova Kasse Banking App v1.0.0");
          },
          color: "bg-slate-500"
        },
      ]
    }
  ];

  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return "Not available";
    return accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1-$2-$3');
  };

  const formatRoutingNumber = (routingNumber) => {
    if (!routingNumber) return "Not available";
    return routingNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="More" rightIcon={null} />
      
      <div className="px-4 py-6">
        {/* Account Summary Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-mono font-bold">
                    {showAccountDetails 
                      ? formatAccountNumber(profile?.account_number || user?.user_metadata?.account_number || "")
                      : "••••-••••-••"
                    }
                  </p>
                  <button
                    onClick={() => setShowAccountDetails(!showAccountDetails)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {showAccountDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-white/80 text-xs mb-1">Routing Number</p>
              <p className="text-lg font-mono font-semibold">
                {showAccountDetails
                  ? formatRoutingNumber(profile?.routing_number || user?.user_metadata?.routing_number || "")
                  : "•••-•••-•••"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        onClick={item.action}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white flex-shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900 mb-0.5">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-red-600"
              >
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Sign Out</p>
                  <p className="text-xs text-gray-500">Sign out of your account</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* App Version */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">Nova Kasse Banking App</p>
          <p className="text-xs text-gray-400 mt-1">Version 1.0.0</p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function MorePage() {
  return (
    <ProtectedRoute>
      <MorePageContent />
    </ProtectedRoute>
  );
}

