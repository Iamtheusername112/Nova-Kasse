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
  User,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Phone,
  Mail,
  Loader2,
  Building2,
  Zap,
  Wifi,
  ShoppingBag,
  Receipt,
  Search,
  Calendar,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { calculateBalance, hasSufficientBalance } from "@/lib/utils/balance";

const STEPS = [
  { id: 1, title: "Payee", icon: User },
  { id: 2, title: "Amount", icon: DollarSign },
  { id: 3, title: "Review", icon: CheckCircle2 },
];

const BILL_CATEGORIES = [
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'bg-yellow-500' },
  { id: 'internet', name: 'Internet', icon: Wifi, color: 'bg-blue-500' },
  { id: 'phone', name: 'Phone', icon: Phone, color: 'bg-green-500' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-purple-500' },
  { id: 'other', name: 'Other', icon: Receipt, color: 'bg-gray-500' },
];

function PayPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { transactions } = useTransactions(1000); // Fetch all transactions for balance calculation
  const [currentStep, setCurrentStep] = useState(1);
  const [stepDirection, setStepDirection] = useState("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    paymentType: "bill", // bill, merchant, quick
    billCategory: "",
    payeeName: "",
    payeeAccount: "",
    payeePhone: "",
    payeeEmail: "",
    amount: "",
    note: "",
    dueDate: "",
    billReference: "",
  });

  const [savedPayees] = useState([
    { id: 1, name: "Electric Company", category: "utilities", account: "ACC-12345", type: "bill" },
    { id: 2, name: "Internet Provider", category: "internet", account: "ACC-67890", type: "bill" },
    { id: 3, name: "Amazon Store", category: "shopping", account: "", type: "merchant" },
  ]);

  const filteredPayees = savedPayees.filter(payee =>
    payee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payee.account.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectPayee = (payee) => {
    updateFormData("payeeName", payee.name);
    updateFormData("billCategory", payee.category);
    if (payee.account) {
      updateFormData("payeeAccount", payee.account);
    }
    updateFormData("paymentType", payee.type);
    toast.success(`Selected ${payee.name}`);
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.payeeName.trim()) {
          toast.error("Please select or enter a payee");
          return false;
        }
        if (formData.paymentType === "bill" && !formData.billCategory) {
          toast.error("Please select a bill category");
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
          toast.error("Minimum payment amount is $1.00");
          return false;
        }
        if (amount > 10000) {
          toast.error("Maximum payment amount is $10,000.00");
          return false;
        }
        return true;
      
      case 3:
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

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    // Check balance before proceeding
    const paymentAmount = parseFloat(formData.amount);
    const currentBalance = calculateBalance(transactions);
    
    if (!hasSufficientBalance(transactions, paymentAmount)) {
      toast.error(`Insufficient balance. Your current balance is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentBalance)}`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Create payment record in Supabase
      // Payment amount should be negative (debit from account)
      const paymentData = {
        user_id: user.id,
        type: 'payment',
        amount: -Math.abs(paymentAmount), // Negative amount for debit
        recipient_name: formData.payeeName,
        recipient_account: formData.payeeAccount || null,
        recipient_phone: formData.payeePhone || null,
        recipient_email: formData.payeeEmail || null,
        description: `Payment to ${formData.payeeName}`,
        category: formData.billCategory || 'Payment',
        note: formData.note || null,
        status: 'completed',
      };

      console.log("Creating payment with data:", paymentData);

      const { data: payment, error: paymentError } = await supabase
        .from("transactions")
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error("Payment creation error:", paymentError);
        console.error("Error details:", {
          message: paymentError.message,
          code: paymentError.code,
          details: paymentError.details,
          hint: paymentError.hint,
        });
        toast.error(paymentError.message || "Failed to process payment. Please try again.");
        setIsLoading(false);
        return;
      }

      // Create notification for the payment
      const notificationData = {
        user_id: user.id,
        type: 'payment',
        title: 'Payment Processed',
        message: `Payment of $${parseFloat(formData.amount).toFixed(2)} to ${formData.payeeName} completed`,
        data: {
          transaction_id: payment.id,
          amount: parseFloat(formData.amount),
          type: 'payment',
          status: 'completed'
        }
      };

      await supabase
        .from("notifications")
        .insert(notificationData);

      toast.success(`Payment of $${parseFloat(formData.amount).toFixed(2)} to ${formData.payeeName} completed`);
      
      // Redirect to home after success
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to process payment. Please try again.");
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
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
            {/* Payment Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Payment Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateFormData("paymentType", "bill")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.paymentType === "bill"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Receipt className={`w-6 h-6 mx-auto mb-2 ${
                    formData.paymentType === "bill" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.paymentType === "bill" ? "text-blue-600" : "text-gray-600"
                  }`}>Bill</p>
                </button>
                
                <button
                  onClick={() => updateFormData("paymentType", "merchant")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.paymentType === "merchant"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <ShoppingBag className={`w-6 h-6 mx-auto mb-2 ${
                    formData.paymentType === "merchant" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.paymentType === "merchant" ? "text-blue-600" : "text-gray-600"
                  }`}>Merchant</p>
                </button>
                
                <button
                  onClick={() => updateFormData("paymentType", "quick")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.paymentType === "quick"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Zap className={`w-6 h-6 mx-auto mb-2 ${
                    formData.paymentType === "quick" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.paymentType === "quick" ? "text-blue-600" : "text-gray-600"
                  }`}>Quick</p>
                </button>
              </div>
            </div>

            {/* Search Saved Payees */}
            {formData.paymentType === "bill" && (
              <>
                <div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                      placeholder="Search saved payees..."
                    />
                  </div>
                </div>

                {/* Saved Payees */}
                {filteredPayees.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Saved Payees</p>
                    <div className="space-y-2">
                      {filteredPayees.map((payee) => {
                        const CategoryIcon = BILL_CATEGORIES.find(c => c.id === payee.category)?.icon || Receipt;
                        const categoryColor = BILL_CATEGORIES.find(c => c.id === payee.category)?.color || 'bg-gray-500';
                        return (
                          <button
                            key={payee.id}
                            onClick={() => selectPayee(payee)}
                            className="w-full p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${categoryColor} flex items-center justify-center text-white`}>
                                <CategoryIcon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{payee.name}</p>
                                {payee.account && (
                                  <p className="text-sm text-gray-500">Account: {payee.account}</p>
                                )}
                              </div>
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bill Categories */}
                {!formData.payeeName && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Bill Categories</p>
                    <div className="grid grid-cols-2 gap-3">
                      {BILL_CATEGORIES.map((category) => {
                        const CategoryIcon = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              updateFormData("billCategory", category.id);
                              updateFormData("payeeName", category.name);
                            }}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                              formData.billCategory === category.id
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <CategoryIcon className={`w-6 h-6 mx-auto mb-2 ${
                              formData.billCategory === category.id ? "text-blue-600" : "text-gray-400"
                            }`} />
                            <p className={`text-xs font-semibold ${
                              formData.billCategory === category.id ? "text-blue-600" : "text-gray-600"
                            }`}>{category.name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Payee Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.payeeName}
                onChange={(e) => updateFormData("payeeName", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="Enter payee name"
                required
              />
            </div>

            {/* Account Number (for bills) */}
            {formData.paymentType === "bill" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.payeeAccount}
                  onChange={(e) => updateFormData("payeeAccount", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="Enter account number"
                />
              </div>
            )}

            {/* Contact Info (for merchants/quick) */}
            {(formData.paymentType === "merchant" || formData.paymentType === "quick") && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone or Email (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.payeePhone || formData.payeeEmail}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('@')) {
                        updateFormData("payeeEmail", value);
                        updateFormData("payeePhone", "");
                      } else {
                        updateFormData("payeePhone", value);
                        updateFormData("payeeEmail", "");
                      }
                    }}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                    placeholder="Phone or email"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Amount <span className="text-red-500">*</span>
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
                {[25, 50, 100, 250].map((amount) => (
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

            {/* Note (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Note (Optional)
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => updateFormData("note", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white resize-none"
                placeholder="Add a note for this payment"
                rows="3"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.note.length}/200 characters
              </p>
            </div>

            {/* Due Date (for bills) */}
            {formData.paymentType === "bill" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => updateFormData("dueDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review Payment</h3>
              <p className="text-sm text-gray-500">Please review the details before confirming</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {formData.payeeName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formData.payeeName}</p>
                      {formData.payeeAccount && (
                        <p className="text-sm text-gray-500">Account: {formData.payeeAccount}</p>
                      )}
                      {formData.payeePhone && (
                        <p className="text-sm text-gray-500">{formData.payeePhone}</p>
                      )}
                      {formData.payeeEmail && (
                        <p className="text-sm text-gray-500">{formData.payeeEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Payment Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formData.amount ? formatCurrency(parseFloat(formData.amount)) : "$0.00"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Payment Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {formData.paymentType}
                    </p>
                  </div>

                  {formData.billCategory && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {formData.billCategory}
                      </p>
                    </div>
                  )}

                  {formData.dueDate && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(formData.dueDate).toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric" 
                        })}
                      </p>
                    </div>
                  )}

                  {formData.note && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Note</p>
                      <p className="text-sm text-gray-900">{formData.note}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs text-green-800">
                <strong>Payment will be processed immediately</strong> after confirmation.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 pb-20">
      <Header title="Make Payment" rightIcon={null} />
      
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
              disabled={isLoading}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Payment
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

export default function PayPage() {
  return (
    <ProtectedRoute>
      <PayPageContent />
    </ProtectedRoute>
  );
}

