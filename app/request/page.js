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
  UserPlus,
  MessageSquare,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/lib/hooks/useProfile";
import { supabase } from "@/lib/supabase/client";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency";

const STEPS = [
  { id: 1, title: "From", icon: User },
  { id: 2, title: "Amount", icon: DollarSign },
  { id: 3, title: "Review", icon: CheckCircle2 },
];

function RequestPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get user's currency (default to USD)
  const userCurrency = profile?.currency || user?.user_metadata?.currency || 'USD';
  const [stepDirection, setStepDirection] = useState("forward");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    requestFromType: "phone", // phone, email, account
    requestFromPhone: "",
    requestFromEmail: "",
    requestFromAccount: "",
    requestFromName: "",
    amount: "",
    note: "",
    dueDate: "",
  });

  const [recentContacts] = useState([
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
        if (formData.requestFromType === "phone" && !formData.requestFromPhone.trim()) {
          toast.error("Please enter contact phone number");
          return false;
        }
        if (formData.requestFromType === "email" && !formData.requestFromEmail.trim()) {
          toast.error("Please enter contact email");
          return false;
        }
        if (formData.requestFromType === "account" && !formData.requestFromAccount.trim()) {
          toast.error("Please enter account number");
          return false;
        }
        if (!formData.requestFromName.trim()) {
          toast.error("Please enter contact name");
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
          toast.error("Minimum request amount is $1.00");
          return false;
        }
        if (amount > 10000) {
          toast.error("Maximum request amount is $10,000.00");
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

  const selectRecentContact = (contact) => {
    if (contact.type === "phone") {
      updateFormData("requestFromType", "phone");
      updateFormData("requestFromPhone", contact.phone);
      updateFormData("requestFromName", contact.name);
    } else {
      updateFormData("requestFromType", "email");
      updateFormData("requestFromEmail", contact.email);
      updateFormData("requestFromName", contact.name);
    }
    toast.success(`Selected ${contact.name}`);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    
    try {
      // Create request record in Supabase
      const requestData = {
        user_id: user.id,
        type: 'request',
        amount: parseFloat(formData.amount),
        recipient_name: formData.requestFromName,
        recipient_phone: formData.requestFromType === 'phone' ? formData.requestFromPhone : null,
        recipient_email: formData.requestFromType === 'email' ? formData.requestFromEmail : null,
        recipient_account: formData.requestFromType === 'account' ? formData.requestFromAccount : null,
        description: `Request from ${formData.requestFromName}`,
        category: 'Request',
        note: formData.note || null,
        status: 'pending',
      };

      console.log("Creating request with data:", requestData);

      const { data: request, error: requestError } = await supabase
        .from("transactions")
        .insert(requestData)
        .select()
        .single();

      if (requestError) {
        console.error("Request creation error:", requestError);
        console.error("Error details:", {
          message: requestError.message,
          code: requestError.code,
          details: requestError.details,
          hint: requestError.hint,
        });
        toast.error(requestError.message || "Failed to create request. Please try again.");
        setIsLoading(false);
        return;
      }

      // Create notification for the request
      const notificationData = {
        user_id: user.id,
        type: 'transaction',
        title: 'Money Request Sent',
        message: `You requested $${parseFloat(formData.amount).toFixed(2)} from ${formData.requestFromName}`,
        data: {
          transaction_id: request.id,
          amount: parseFloat(formData.amount),
          type: 'request',
          status: 'pending'
        }
      };

      await supabase
        .from("notifications")
        .insert(notificationData);

      toast.success(`Request sent to ${formData.requestFromName} for $${parseFloat(formData.amount).toFixed(2)}`);
      
      // Redirect to home after success
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Request error:", error);
      toast.error(error.message || "Failed to send request. Please try again.");
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
            {/* Recent Contacts */}
            {recentContacts.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Recent Contacts</p>
                <div className="space-y-2">
                  {recentContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => selectRecentContact(contact)}
                      className="w-full p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">
                            {contact.type === "phone" ? contact.phone : contact.email}
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
                <span className="px-4 bg-white text-gray-500">Or add new contact</span>
              </div>
            </div>

            {/* Contact Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Request From <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateFormData("requestFromType", "phone")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.requestFromType === "phone"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Phone className={`w-6 h-6 mx-auto mb-2 ${
                    formData.requestFromType === "phone" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.requestFromType === "phone" ? "text-blue-600" : "text-gray-600"
                  }`}>Phone</p>
                </button>
                
                <button
                  onClick={() => updateFormData("requestFromType", "email")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.requestFromType === "email"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Mail className={`w-6 h-6 mx-auto mb-2 ${
                    formData.requestFromType === "email" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.requestFromType === "email" ? "text-blue-600" : "text-gray-600"
                  }`}>Email</p>
                </button>
                
                <button
                  onClick={() => updateFormData("requestFromType", "account")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData.requestFromType === "account"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                    formData.requestFromType === "account" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <p className={`text-xs font-semibold ${
                    formData.requestFromType === "account" ? "text-blue-600" : "text-gray-600"
                  }`}>Account</p>
                </button>
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.requestFromName}
                onChange={(e) => updateFormData("requestFromName", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="Enter contact name"
                required
              />
            </div>

            {/* Contact Details Based on Type */}
            {formData.requestFromType === "phone" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.requestFromPhone}
                  onChange={(e) => updateFormData("requestFromPhone", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            )}

            {formData.requestFromType === "email" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.requestFromEmail}
                  onChange={(e) => updateFormData("requestFromEmail", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="contact@example.com"
                  required
                />
              </div>
            )}

            {formData.requestFromType === "account" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.requestFromAccount}
                  onChange={(e) => updateFormData("requestFromAccount", e.target.value)}
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
                Request Amount <span className="text-red-500">*</span>
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
                placeholder="Add a note for this request (e.g., 'For dinner', 'Rent payment')"
                rows="3"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.note.length}/200 characters
              </p>
            </div>

            {/* Due Date (Optional) */}
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
              <p className="text-xs text-gray-500 mt-1">
                When would you like to receive this payment?
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Review Request</h3>
              <p className="text-sm text-gray-500">Please review the details before sending</p>
            </div>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {formData.requestFromName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formData.requestFromName}</p>
                      <p className="text-sm text-gray-500">
                        {formData.requestFromType === "phone" && formData.requestFromPhone}
                        {formData.requestFromType === "email" && formData.requestFromEmail}
                        {formData.requestFromType === "account" && `Account: ${formData.requestFromAccount}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Request Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formData.amount ? formatCurrency(parseFloat(formData.amount)) : "$0.00"}
                    </p>
                  </div>

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

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> The recipient will receive a notification about your request. 
                They can choose to accept or decline it.
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
      <Header title="Request Money" rightIcon={null} />
      
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
                  Sending...
                </>
              ) : (
                <>
                  Send Request
                  <UserPlus className="w-5 h-5 ml-2" />
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

export default function RequestPage() {
  return (
    <ProtectedRoute>
      <RequestPageContent />
    </ProtectedRoute>
  );
}

