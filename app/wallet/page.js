"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle2,
  Calendar,
  Lock,
  Shield,
  Smartphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { toast } from "sonner";

function WalletPageContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [cardNumberVisible, setCardNumberVisible] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name.toUpperCase();
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.toUpperCase();
    }
    if (user?.email) {
      return user.email.split("@")[0].replace(/[._-]/g, " ").toUpperCase();
    }
    return "CARDHOLDER NAME";
  };

  const formatCardNumber = (number) => {
    if (!number) return "4532 1234 5678 9010";
    // Format as XXXX XXXX XXXX XXXX
    const cleaned = number.replace(/\s/g, '');
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const getAccountNumber = () => {
    return profile?.account_number || user?.user_metadata?.account_number || "1234567890";
  };

  const getCardNumber = () => {
    // Generate card number from account number (last 16 digits)
    const accountNumber = getAccountNumber();
    if (accountNumber && accountNumber.length >= 10) {
      // Use last 10 digits and pad with 4s to make 16 digits
      const lastDigits = accountNumber.slice(-10);
      return `4532${lastDigits.padStart(12, '0')}`.slice(0, 16);
    }
    return "4532123456789010";
  };

  const getExpiryDate = () => {
    // Set expiry date to 3 years from now
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getCvv = () => {
    // Generate CVV from account number (last 3 digits)
    const accountNumber = getAccountNumber();
    if (accountNumber && accountNumber.length >= 3) {
      const lastThree = accountNumber.slice(-3);
      // Ensure it's a valid 3-digit CVV (100-999)
      return String(parseInt(lastThree) || 100).padStart(3, '0');
    }
    return "456"; // Default fallback
  };

  const cardNumber = getCardNumber();
  const formattedCardNumber = formatCardNumber(cardNumber);
  const displayName = getUserDisplayName();
  const expiryDate = getExpiryDate();
  const cvv = getCvv();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Wallet" rightIcon={null} />
      
      <div className="px-4 py-6">
        {/* Credit Card */}
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
              <div className="flex items-center gap-2">
                <p className="text-xl font-mono tracking-wider">
                  {cardNumberVisible ? formattedCardNumber : ".... .... .... " + cardNumber.slice(-4)}
                </p>
                <button
                  onClick={() => setCardNumberVisible(!cardNumberVisible)}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  {cardNumberVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-blue-200 mb-1">Card Holder</p>
                <p className="text-sm font-semibold">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 mb-1">Expires</p>
                <p className="text-sm font-semibold">{expiryDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Details */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h3>
            
            {/* Card Number */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Card Number</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {cardNumberVisible ? formattedCardNumber : "4532 •••• •••• ••••"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCardNumberVisible(!cardNumberVisible)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title={cardNumberVisible ? "Hide" : "Show"}
                  >
                    {cardNumberVisible ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''), 'Card Number')}
                    className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
                    title="Copy"
                  >
                    {copiedField === 'Card Number' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Expiry Date</p>
                  <p className="text-lg font-semibold text-gray-900">{expiryDate}</p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* CVV */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">CVV</p>
                  <p className="text-lg font-mono font-semibold text-gray-900">
                    {cvvVisible ? cvv : "•••"}
                  </p>
                </div>
                <button
                  onClick={() => setCvvVisible(!cvvVisible)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title={cvvVisible ? "Hide" : "Show"}
                >
                  {cvvVisible ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl">
            <CardContent className="p-0">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Lock Card</p>
                  <p className="text-sm text-gray-500">Temporarily lock your card</p>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl">
            <CardContent className="p-0">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Security Settings</p>
                  <p className="text-sm text-gray-500">Manage card security</p>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm rounded-xl">
            <CardContent className="p-0">
              <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Add to Wallet</p>
                  <p className="text-sm text-gray-500">Add card to Apple Pay or Google Pay</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Security Notice:</strong> Never share your card details with anyone. Keep your CVV secure and never write it down.
          </p>
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
