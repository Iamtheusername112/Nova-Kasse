"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Search,
  UserPlus,
  User,
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Building2,
  Phone,
  Mail,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { supabase } from "@/lib/supabase/client";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { calculateBalance, hasSufficientBalance } from "@/lib/utils/balance";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency";

const STEPS = [
  { id: 1, title: "Recipient", icon: User },
  { id: 2, title: "Amount", icon: DollarSign },
  { id: 3, title: "Review", icon: CheckCircle2 },
  { id: 4, title: "PIN", icon: Shield },
];

function TransferPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { transactions } = useTransactions(1000); // Fetch all transactions for balance calculation
  
  // Get user's currency (default to USD)
  const userCurrency = profile?.currency || user?.user_metadata?.currency || 'USD';
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [showPin, setShowPin] = useState(false);
  
  const [formData, setFormData] = useState({
    recipientType: "phone", // phone, email, account
    recipientPhone: "",
    recipientEmail: "",
    recipientAccount: "",
    recipientName: "",
    amount: "",
    note: "",
    transferMethod: "instant", // instant, scheduled
    pin: "",
  });

  const [recentRecipients] = useState([
    { id: 1, name: "John Doe", phone: "+1 (555) 123-4567", type: "phone" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", type: "email" },
    { id: 3, name: "Mike Johnson", phone: "+1 (555) 987-6543", type: "phone" },
  ]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (formData.recipientType === "phone" && !formData.recipientPhone.trim()) {
          toast.error("Please enter recipient phone number");
          return false;
        }
        if (formData.recipientType === "email" && !formData.recipientEmail.trim()) {
          toast.error("Please enter recipient email");
          return false;
        }
        if (formData.recipientType === "account" && !formData.recipientAccount.trim()) {
          toast.error("Please enter account number");
          return false;
        }
        if (!formData.recipientName.trim()) {
          toast.error("Please enter recipient name");
          return false;
        }
        return true;
      
      case 2:
        const amount = parseFloat(formData.amount);
        if (!formData.amount || isNaN(amount) || amount <= 0) {
          toast.error("Please enter a valid amount");
          return false;
        }
        if (amount < 1) {
          toast.error("Minimum transfer amount is $1.00");
          return false;
        }
        if (amount > 10000) {
          toast.error("Maximum transfer amount is $10,000.00");
          return false;
        }
        return true;
      
      case 3:
        return true;
      
      case 4:
        if (!formData.pin || formData.pin.length !== 4) {
          toast.error("Please enter your 4-digit PIN");
          return false;
        }
        if (!/^\d+$/.test(formData.pin)) {
          toast.error("PIN must contain only numbers");
          return false;
        }
        // PIN verification will happen in handleSubmit
        return true;
      
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setStepDirection("forward");
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    setStepDirection("backward");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectRecentRecipient = (recipient) => {
    if (recipient.type === "phone") {
      updateFormData("recipientType", "phone");
      updateFormData("recipientPhone", recipient.phone);
      updateFormData("recipientName", recipient.name);
    } else {
      updateFormData("recipientType", "email");
      updateFormData("recipientEmail", recipient.email);
      updateFormData("recipientName", recipient.name);
    }
    toast.success(`Selected ${recipient.name}`);
  };

  const verifyPIN = () => {
    const storedPin = profile?.security_pin || user?.user_metadata?.security_pin;
    
    if (!storedPin) {
      toast.error("Security PIN not found. Please set up your PIN in profile settings.");
      return false;
    }

    if (formData.pin !== storedPin) {
      setPinAttempts(prev => prev + 1);
      updateFormData("pin", ""); // Clear PIN input
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    // Verify PIN before proceeding
    if (!verifyPIN()) {
      if (pinAttempts >= 3) {
        toast.error("Transfer cancelled due to security reasons. Please try again later.");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        toast.error("Incorrect PIN. Please try again.");
      }
      return;
    }

    // Check balance before proceeding
    const transferAmount = parseFloat(formData.amount);
    const currentBalance = calculateBalance(transactions);
    
    if (!hasSufficientBalance(transactions, transferAmount)) {
      toast.error(`Insufficient balance. Your current balance is ${formatCurrencyUtil(currentBalance, userCurrency)}`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create transaction record in Supabase
      // Transfer amount should be negative (debit from account)
      const transactionData = {
        user_id: user.id,
        type: 'transfer',
        amount: -Math.abs(transferAmount), // Negative amount for debit
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientType === 'phone' ? formData.recipientPhone : null,
        recipient_email: formData.recipientType === 'email' ? formData.recipientEmail : null,
        recipient_account: formData.recipientType === 'account' ? formData.recipientAccount : null,
        description: `Transfer to ${formData.recipientName}`,
        category: 'Transfer',
        note: formData.note || null,
        status: formData.transferMethod === 'instant' ? 'completed' : 'pending',
        transfer_method: formData.transferMethod,
      };

      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) {
        console.error("Transaction creation error:", transactionError);
        throw transactionError;
      }

      // Notification will be created automatically by database trigger
      
      toast.success(`Successfully transferred $${parseFloat(formData.amount).toFixed(2)} to ${formData.recipientName}`);
      
      // Redirect to home after success
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Transfer failed. Please try again.");
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, userCurrency);
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];
  const IconComponent = currentStepData.icon;

  const renderStepContent = () => {
    const animationClass = stepDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";
    
    switch (currentStep) {
      case 1:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            {/* Recent Recipients */}
            {recentRecipients.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Recent Recipients</p>
                <div className="space-y-2">
                  {recentRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      onClick={() => selectRecentRecipient(recipient)}
                      className="w-full p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {recipient.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{recipient.name}</p>
                          <p className="text-sm text-gray-500">
                            {recipient.type === "phone" ? recipient.phone : recipient.email}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Or Add New */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or add new recipient</span>
              </div>
            </div>

            {/* Recipient Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Transfer To <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateFormData("recipientType", "phone")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.recipientType === "phone"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Phone className={`w-6 h-6 mx-auto mb-2 ${
                    formData.recipientType === "phone" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.recipientType === "phone" ? "text-blue-600" : "text-gray-600"
                  }`}>Phone</p>
                </button>
                
                <button
                  onClick={() => updateFormData("recipientType", "email")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.recipientType === "email"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Mail className={`w-6 h-6 mx-auto mb-2 ${
                    formData.recipientType === "email" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.recipientType === "email" ? "text-blue-600" : "text-gray-600"
                  }`}>Email</p>
                </button>
                
                <button
                  onClick={() => updateFormData("recipientType", "account")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.recipientType === "account"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                    formData.recipientType === "account" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.recipientType === "account" ? "text-blue-600" : "text-gray-600"
                  }`}>Account</p>
                </button>
              </div>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => updateFormData("recipientName", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="Enter recipient name"
                required
              />
            </div>

            {/* Recipient Details Based on Type */}
            {formData.recipientType === "phone" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => updateFormData("recipientPhone", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            )}

            {formData.recipientType === "email" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => updateFormData("recipientEmail", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="recipient@example.com"
                  required
                />
              </div>
            )}

            {formData.recipientType === "account" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.recipientAccount}
                  onChange={(e) => updateFormData("recipientAccount", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="Enter account number"
                  required
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transfer Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <DollarSign className="w-6 h-6 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="0.00"
                  min="1"
                  max="10000"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Minimum: $1.00 • Maximum: $10,000.00
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Quick Amount</p>
              <div className="grid grid-cols-4 gap-3">
                {[50, 100, 250, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => updateFormData("amount", amount.toString())}
                    className="p-3 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 font-semibold text-gray-700"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer Method */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Transfer Method
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => updateFormData("transferMethod", "instant")}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.transferMethod === "instant"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Instant Transfer</p>
                      <p className="text-sm text-gray-500">Arrives immediately</p>
                    </div>
                    {formData.transferMethod === "instant" && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
                
                <button
                  onClick={() => updateFormData("transferMethod", "scheduled")}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.transferMethod === "scheduled"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Scheduled Transfer</p>
                      <p className="text-sm text-gray-500">Schedule for later</p>
                    </div>
                    {formData.transferMethod === "scheduled" && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Note (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => updateFormData("note", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white resize-none"
                placeholder="Add a note for this transfer"
                rows="3"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.note.length}/200 characters
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review Transfer</h3>
              <p className="text-sm text-gray-500">Please review the details before confirming</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {formData.recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formData.recipientName}</p>
                      <p className="text-sm text-gray-500">
                        {formData.recipientType === "phone" && formData.recipientPhone}
                        {formData.recipientType === "email" && formData.recipientEmail}
                        {formData.recipientType === "account" && `Account: ${formData.recipientAccount}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formData.amount ? formatCurrency(parseFloat(formData.amount)) : "$0.00"}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Transfer Method</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {formData.transferMethod}
                    </p>
                  </div>

                  {formData.note && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Note</p>
                      <p className="text-sm text-gray-900">{formData.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Security Notice:</strong> Once confirmed, this transfer cannot be cancelled. 
                Please verify all details before proceeding.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enter Your PIN</h3>
              <p className="text-sm text-gray-500">Please enter your 4-digit security PIN to confirm this transfer</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Security PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type={showPin ? "text" : "password"}
                    value={formData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateFormData("pin", value);
                    }}
                    className="w-full px-4 py-4 text-3xl font-bold text-center tracking-widest border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                    placeholder="••••"
                    maxLength={4}
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter your 4-digit security PIN
                </p>
              </div>

              {/* PIN Pad */}
              <div className="max-w-[240px] mx-auto">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        if (formData.pin.length < 4) {
                          updateFormData("pin", formData.pin + num.toString());
                        }
                      }}
                      className="h-14 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-500 transition-all duration-300 font-semibold text-base text-gray-900 shadow-sm"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      if (formData.pin.length > 0) {
                        updateFormData("pin", formData.pin.slice(0, -1));
                      }
                    }}
                    className="h-14 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-red-500 transition-all duration-300 font-semibold text-sm text-gray-900 shadow-sm"
                  >
                    ⌫
                  </button>
                  <button
                    onClick={() => {
                      if (formData.pin.length < 4) {
                        updateFormData("pin", formData.pin + "0");
                      }
                    }}
                    className="h-14 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-500 transition-all duration-300 font-semibold text-base text-gray-900 shadow-sm"
                  >
                    0
                  </button>
                  <button
                    onClick={() => updateFormData("pin", "")}
                    className="h-14 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-red-500 transition-all duration-300 font-semibold text-xs text-gray-900 shadow-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {pinAttempts > 0 && pinAttempts < 3 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-xs text-red-800 text-center">
                    <strong>Incorrect PIN.</strong> {3 - pinAttempts} attempt{3 - pinAttempts !== 1 ? 's' : ''} remaining.
                  </p>
                </div>
              )}

              {pinAttempts >= 3 && (
                <div className="p-4 rounded-xl bg-red-100 border-2 border-red-500">
                  <p className="text-sm text-red-900 text-center font-semibold">
                    Too many incorrect attempts. Transfer has been cancelled for security.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Transfer Money" rightIcon={null} />
      
      <div className="px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg scale-110" 
                      : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  }`}>
                    {step.title}
                  </p>
                </div>
              );
            })}
          </div>
          
          {/* Progress Line */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl mb-6">
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          {currentStep > 1 && (
            <Button
              onClick={prevStep}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-200 hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || pinAttempts >= 3}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : pinAttempts >= 3 ? (
                "Transfer Cancelled"
              ) : (
                <>
                  Confirm Transfer
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function TransferPage() {
  return (
    <ProtectedRoute>
      <TransferPageContent />
    </ProtectedRoute>
  );
}

