"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Lock, User, MapPin, Shield, FileText, Upload, CreditCard, FileCheck } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import LoadingScreen from "@/components/ui/loading-screen";

const STEPS = [
  { number: 1, title: "Account Credentials", icon: Lock, color: "from-blue-500 to-cyan-500" },
  { number: 2, title: "Personal Information", icon: User, color: "from-purple-500 to-pink-500" },
  { number: 3, title: "Address Information", icon: MapPin, color: "from-green-500 to-emerald-500" },
  { number: 4, title: "Security PIN", icon: Shield, color: "from-orange-500 to-red-500" },
  { number: 5, title: "Document Upload", icon: Upload, color: "from-teal-500 to-cyan-500" },
  { number: 6, title: "Terms & Conditions", icon: FileText, color: "from-indigo-500 to-blue-500" },
];

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [stepDirection, setStepDirection] = useState("forward");
  const { signUp, user, loading } = useAuth();
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Account Credentials
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2: Personal Information
    fullName: "",
    dateOfBirth: "",
    phone: "",
    // Step 3: Address Information
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    // Step 4: Security PIN
    securityPin: "",
    confirmSecurityPin: "",
        // Step 5: Documents
        documentType: "", // Selected document type from dropdown
        idDocument: null,
        idDocumentFront: null, // For card-type documents
        idDocumentBack: null, // For card-type documents
        proofOfAddress: null,
    // Step 6: Terms
    acceptTerms: false,
  });

  useEffect(() => {
    // Don't auto-redirect if we're in the signup flow
    // Let the handleSubmit handle the redirect after successful signup
  }, [user, loading, router]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          toast.error("Please fill in all fields");
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords do not match");
          return false;
        }
        if (formData.password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return false;
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          toast.error("Password must contain uppercase, lowercase, and a number");
          return false;
        }
        return true;

      case 2:
        if (!formData.fullName || !formData.dateOfBirth || !formData.phone) {
          toast.error("Please fill in all fields");
          return false;
        }
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (age < 18 || (age === 18 && monthDiff < 0)) {
          toast.error("You must be at least 18 years old to open an account");
          return false;
        }
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.phone) || formData.phone.replace(/\D/g, "").length < 10) {
          toast.error("Please enter a valid phone number");
          return false;
        }
        return true;

      case 3:
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          toast.error("Please fill in all required fields");
          return false;
        }
        if (formData.zipCode.length < 5) {
          toast.error("Please enter a valid ZIP code");
          return false;
        }
        return true;

      case 4:
        if (!formData.securityPin || !formData.confirmSecurityPin) {
          toast.error("Please enter your security PIN");
          return false;
        }
        if (formData.securityPin.length !== 4) {
          toast.error("Security PIN must be 4 digits");
          return false;
        }
        if (!/^\d+$/.test(formData.securityPin)) {
          toast.error("Security PIN must contain only numbers");
          return false;
        }
        if (formData.securityPin !== formData.confirmSecurityPin) {
          toast.error("Security PINs do not match");
          return false;
        }
        return true;

      case 5:
        // Require document type selection
        if (!formData.documentType) {
          toast.error("Please select a document type");
          return false;
        }
        
        // Check if document is uploaded based on type
        const isCardType = ['driver_license', 'national_id', 'state_id'].includes(formData.documentType);
        
        if (isCardType) {
          // For card types, require both front and back
          if (!formData.idDocumentFront || !formData.idDocumentBack) {
            toast.error("Please upload both front and back of the document");
            return false;
          }
        } else if (formData.documentType === 'passport') {
          // For passport, require single document
          if (!formData.idDocument) {
            toast.error("Please upload your passport");
            return false;
          }
        } else if (formData.documentType === 'proof_of_address') {
          // For proof of address, require single document
          if (!formData.proofOfAddress) {
            toast.error("Please upload proof of address");
            return false;
          }
        }
        
        return true;

      case 6:
        if (!formData.acceptTerms) {
          toast.error("You must accept the terms and conditions");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStepDirection("forward");
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setStepDirection("backward");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(6)) {
      return;
    }

    setIsLoading(true);

    // Prepare user data - ensure all fields are included
    // For card-type documents, use front/back, otherwise use single document
    const isCardType = ['driver_license', 'national_id', 'state_id'].includes(formData.documentType);
    
    // Validate files are File objects before sending
    const validateFile = (file) => {
      if (!file) return null;
      if (file instanceof File) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
          return null;
        }
        return file;
      }
      console.warn("Invalid file object:", file);
      return null;
    };
    
    const userDataToSend = {
      fullName: formData.fullName?.trim() || null,
      phone: formData.phone?.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      zipCode: formData.zipCode?.trim() || null,
      country: formData.country || "United States",
      securityPin: formData.securityPin || null,
      documentType: formData.documentType || null,
      // For card types, send front and back separately (validate files)
      idDocument: isCardType ? null : validateFile(formData.idDocument),
      idDocumentFront: isCardType ? validateFile(formData.idDocumentFront) : null,
      idDocumentBack: isCardType ? validateFile(formData.idDocumentBack) : null,
      proofOfAddress: formData.documentType === 'proof_of_address' ? validateFile(formData.proofOfAddress) : null,
    };

    console.log("=== SIGNUP DATA ===");
    console.log("Email:", formData.email);
    console.log("Document Type:", formData.documentType);
    console.log("Is Card Type:", isCardType);
    console.log("Form Data Files:", {
      idDocument: formData.idDocument ? { name: formData.idDocument.name, size: formData.idDocument.size, type: formData.idDocument.type } : null,
      idDocumentFront: formData.idDocumentFront ? { name: formData.idDocumentFront.name, size: formData.idDocumentFront.size, type: formData.idDocumentFront.type } : null,
      idDocumentBack: formData.idDocumentBack ? { name: formData.idDocumentBack.name, size: formData.idDocumentBack.size, type: formData.idDocumentBack.type } : null,
      proofOfAddress: formData.proofOfAddress ? { name: formData.proofOfAddress.name, size: formData.proofOfAddress.size, type: formData.proofOfAddress.type } : null,
    });
    console.log("User Data to Send:", {
      ...userDataToSend,
      // Log file objects separately (they're too large to log fully)
      idDocument: userDataToSend.idDocument ? `[File: ${userDataToSend.idDocument.name}]` : null,
      idDocumentFront: userDataToSend.idDocumentFront ? `[File: ${userDataToSend.idDocumentFront.name}]` : null,
      idDocumentBack: userDataToSend.idDocumentBack ? `[File: ${userDataToSend.idDocumentBack.name}]` : null,
      proofOfAddress: userDataToSend.proofOfAddress ? `[File: ${userDataToSend.proofOfAddress.name}]` : null,
    });

    const result = await signUp(formData.email, formData.password, userDataToSend);

    if (result.success) {
      // Keep loading state true while showing confetti and redirecting
      // Dynamically import confetti to avoid SSR issues
      import('canvas-confetti').then((confettiModule) => {
        const confetti = confettiModule.default;
        
        // Trigger confetti animation
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          
          // Launch confetti from both sides
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);
      }).catch((err) => {
        console.warn("Could not load confetti:", err);
      });

      // Show welcome message
      toast.success(`Welcome to Nova Kasse, ${formData.fullName?.split(' ')[0] || 'there'}! 🎉`, {
        description: "Your account has been created successfully. Redirecting to your dashboard...",
        duration: 3000,
      });

      // Wait for confetti animation, then redirect to dashboard
      setTimeout(() => {
        setIsLoading(false);
        router.push("/");
      }, 2500);
    } else {
      console.error("Signup failed:", result.error);
      setIsLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Initializing..." subMessage="Please wait" />;
  }

  if (user) {
    return null;
  }

  // Show loading screen during account creation
  if (isLoading) {
    return (
      <LoadingScreen 
        message="Creating Your Account..." 
        subMessage="Please wait while we set up your banking profile"
      />
    );
  }

  const progressPercentage = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep - 1];
  const IconComponent = currentStepData.icon;

  const renderStepContent = () => {
    const animationClass = stepDirection === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";
    
    switch (currentStep) {
      case 1:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Must be at least 8 characters with uppercase, lowercase, and a number
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth bg-white"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth bg-white"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                required
              />
              <p className="text-xs text-gray-500 mt-2">You must be at least 18 years old</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-smooth bg-white"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth bg-white"
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="New York"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => updateFormData("state", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="NY"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData("zipCode", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth bg-white"
                  placeholder="10001"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-smooth bg-white"
                  required
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5 mb-4">
              <p className="text-sm text-orange-900 font-medium">
                <strong>🔒 Important:</strong> Your security PIN will be used to authorize transactions and access sensitive account features. Keep it secure and never share it with anyone.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Create Security PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.securityPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  updateFormData("securityPin", value);
                }}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-smooth bg-white text-center text-3xl tracking-[0.5em] font-semibold"
                placeholder="••••"
                maxLength={4}
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Enter a 4-digit PIN</p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Security PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmSecurityPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  updateFormData("confirmSecurityPin", value);
                }}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-smooth bg-white text-center text-3xl tracking-[0.5em] font-semibold"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>
          </div>
        );

      case 5:
        const isCardType = ['driver_license', 'national_id', 'state_id'].includes(formData.documentType);
        
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200 rounded-xl p-5 mb-4">
              <p className="text-sm text-teal-900 font-medium">
                <strong>📄 Document Upload (Required):</strong> Please select a document type and upload the required document(s). Upload clear, readable copies for faster account verification.
              </p>
            </div>
            
            {/* Document Type Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => {
                  updateFormData("documentType", e.target.value);
                  // Clear previous uploads when changing document type
                  updateFormData("idDocument", null);
                  updateFormData("idDocumentFront", null);
                  updateFormData("idDocumentBack", null);
                  updateFormData("proofOfAddress", null);
                }}
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-smooth bg-white"
                required
              >
                <option value="">-- Select Document Type --</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver's License</option>
                <option value="national_id">National ID Card</option>
                <option value="state_id">State ID Card</option>
                <option value="proof_of_address">Proof of Address</option>
              </select>
            </div>

            {/* Document Upload Based on Type */}
            {formData.documentType && (
              <div className="space-y-6">
                {isCardType ? (
                  // Card-type documents: Front and Back
                  <>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-900 font-medium">
                        <CreditCard className="w-4 h-4 inline mr-2" />
                        Card-type document detected. Please upload both front and back sides.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <FileUpload
                          label="Front Side"
                          required={true}
                          accept="*"
                          maxSizeMB={5}
                          value={formData.idDocumentFront}
                          onChange={(file) => updateFormData("idDocumentFront", file)}
                          documentType="front"
                        />
                      </div>
                      
                      <div>
                        <FileUpload
                          label="Back Side"
                          required={true}
                          accept="*"
                          maxSizeMB={5}
                          value={formData.idDocumentBack}
                          onChange={(file) => updateFormData("idDocumentBack", file)}
                          documentType="back"
                        />
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      <p>• Ensure both sides are clearly visible and readable</p>
                      <p>• All file types accepted • Max size: 5MB per file</p>
                    </div>
                  </>
                ) : formData.documentType === 'passport' ? (
                  // Passport: Single document
                  <>
                    <FileUpload
                      label="Passport"
                      required={true}
                      accept="*"
                      maxSizeMB={5}
                      value={formData.idDocument}
                      onChange={(file) => updateFormData("idDocument", file)}
                      documentType="passport"
                    />
                    <div className="text-xs text-gray-500 mt-2 ml-1">
                      <p>Upload a clear photo of your passport information page</p>
                      <p>All file types accepted • Max size: 5MB</p>
                    </div>
                  </>
                ) : formData.documentType === 'proof_of_address' ? (
                  // Proof of Address: Single document
                  <>
                    <FileUpload
                      label="Proof of Address"
                      required={true}
                      accept="*"
                      maxSizeMB={5}
                      value={formData.proofOfAddress}
                      onChange={(file) => updateFormData("proofOfAddress", file)}
                      documentType="address"
                    />
                    <div className="text-xs text-gray-500 mt-2 ml-1">
                      <p>Accepted: Utility bill, Bank statement, Lease agreement, or Government-issued document</p>
                      <p>Must be dated within the last 3 months • All file types accepted • Max size: 5MB</p>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mt-4">
              <p className="text-sm text-orange-900">
                <strong>⚠️ Required:</strong> You must select a document type and upload the required document(s) to continue. Card-type documents require both front and back sides.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className={`space-y-6 ${animationClass}`}>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Terms and Conditions</h3>
              <div className="text-sm text-gray-700 space-y-4 leading-relaxed">
                <div>
                  <strong className="text-gray-900">1. Account Agreement</strong>
                  <p className="mt-1">By opening an account with Nova Kasse, you agree to be bound by these terms and conditions. This agreement governs your use of our banking services.</p>
                </div>
                <div>
                  <strong className="text-gray-900">2. Account Security</strong>
                  <p className="mt-1">You are responsible for maintaining the confidentiality of your account credentials, including your password and security PIN. You agree to notify us immediately of any unauthorized access.</p>
                </div>
                <div>
                  <strong className="text-gray-900">3. Privacy Policy</strong>
                  <p className="mt-1">We collect and process your personal information in accordance with our Privacy Policy. By using our services, you consent to such processing.</p>
                </div>
                <div>
                  <strong className="text-gray-900">4. Transaction Authorization</strong>
                  <p className="mt-1">You authorize us to process transactions initiated using your account credentials. You are responsible for all transactions made with your account.</p>
                </div>
                <div>
                  <strong className="text-gray-900">5. Fees and Charges</strong>
                  <p className="mt-1">Certain services may be subject to fees. We will notify you of any applicable fees before you incur them.</p>
                </div>
                <div>
                  <strong className="text-gray-900">6. Limitation of Liability</strong>
                  <p className="mt-1">Nova Kasse shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => updateFormData("acceptTerms", e.target.checked)}
                className="mt-1 w-6 h-6 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer transition-smooth"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer flex-1">
                I have read and agree to the Terms and Conditions and Privacy Policy <span className="text-red-500">*</span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg py-8 px-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-white/90">Join Nova Kasse and experience premium banking</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 animate-slide-in-up">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;
              const isPast = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1 relative">
                    <div
                      className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-smooth transform ${
                        isCompleted
                          ? `bg-gradient-to-br ${step.color} text-white shadow-lg scale-110`
                          : isActive
                          ? `bg-gradient-to-br ${step.color} text-white shadow-glow scale-110`
                          : "bg-white/20 text-white/60 backdrop-blur-sm"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 animate-scale-in" />
                      ) : (
                        <StepIcon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                      )}
                      {isActive && (
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-50 animate-ping`}></div>
                      )}
                    </div>
                    <p
                      className={`text-xs mt-3 text-center font-medium transition-smooth ${
                        isActive || isPast ? "text-white" : "text-white/60"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 h-1 relative">
                      <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                      <div
                        className={`absolute inset-0 rounded-full transition-smooth animate-progress ${
                          isPast ? `bg-gradient-to-r ${step.color}` : ""
                        }`}
                        style={{ width: isPast ? "100%" : "0%" }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Overall Progress Bar */}
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-smooth animate-progress shadow-glow"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-center text-white/80 text-sm mt-2">
            Step {currentStep} of {STEPS.length} • {Math.round(progressPercentage)}% Complete
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-premium-lg bg-white/95 backdrop-blur-xl animate-scale-in">
          <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${currentStepData.color} text-white shadow-lg`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {currentStepData.title}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={currentStep === 6 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    type="submit"
                    className={`bg-gradient-to-r ${currentStepData.color} text-white flex items-center gap-2 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-smooth transform hover:scale-105`}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-smooth transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Create Account
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-white/90 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline transition-smooth">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
