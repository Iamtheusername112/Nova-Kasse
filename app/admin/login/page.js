"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Shield, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { isAdmin } from "@/lib/utils/admin";
import LoadingScreen from "@/components/ui/loading-screen";
import { useMinimumLoadingTime } from "@/lib/hooks/useMinimumLoadingTime";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const displayLoading = useMinimumLoadingTime(loading, 3000);
  const displayIsLoading = useMinimumLoadingTime(isLoading, 3000);

  useEffect(() => {
    if (!loading && user) {
      // Check if user is admin
      if (isAdmin(user)) {
        // Use setTimeout to avoid updating Router during render
        const timer = setTimeout(() => {
          router.push("/admin/dashboard");
        }, 0);
        return () => clearTimeout(timer);
      } else {
        // Regular user, redirect to home
        const timer = setTimeout(() => {
          router.push("/");
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsLoading(true);

    // Clear any previous errors
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    emailInput?.classList.remove("border-red-500");
    passwordInput?.classList.remove("border-red-500");

    try {
      // Basic validation
      if (!email || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        emailInput?.classList.add("border-red-500");
        setIsLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        toast.error("Password must be at least 6 characters");
        passwordInput?.classList.add("border-red-500");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Handle specific error types
        let errorMessage = "Failed to sign in";
        
        if (error.message && error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
          emailInput?.classList.add("border-red-500");
          passwordInput?.classList.add("border-red-500");
        } else if (error.message && error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email address before signing in.";
          emailInput?.classList.add("border-red-500");
        } else if (error.message && error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please wait a few minutes and try again.";
        } else {
          errorMessage = error.message || "An error occurred during login. Please try again.";
        }
        
        toast.error(errorMessage);
        setIsLoading(false);
        return; // Exit early on error
      }

      // Check if we have user data
      if (!data || !data.user) {
        toast.error("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if user is admin
      try {
        if (isAdmin(data.user)) {
          toast.success("Welcome, Admin!");
          // Small delay to show success message
          setTimeout(() => {
            router.push("/admin/dashboard");
          }, 500);
        } else {
          toast.error("Access denied. Admin credentials required.");
          // Sign out non-admin users
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error("Sign out error:", signOutError);
          }
          setIsLoading(false);
        }
      } catch (adminCheckError) {
        console.error("Admin check error:", adminCheckError);
        toast.error("Error verifying admin access. Please try again.");
        setIsLoading(false);
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error("Admin login error:", error);
      
      // Only show error if we haven't already shown one
      if (!error.message || !error.message.includes("Invalid login credentials")) {
        toast.error("An unexpected error occurred. Please try again.");
      }
      
      setIsLoading(false);
    }
  };

  if (displayLoading) {
    return <LoadingScreen message="Initializing Admin Portal..." subMessage="Please wait" />;
  }

  if (displayIsLoading) {
    return <LoadingScreen message="Signing In..." subMessage="Verifying admin credentials" />;
  }

  // Don't render if user is already logged in as admin
  // Let useEffect handle the redirect
  if (user && isAdmin(user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="mt-4 text-white font-medium">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-300">Sign in to access the admin dashboard</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      e.target.classList.remove("border-red-500");
                    }}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter admin email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      e.target.classList.remove("border-red-500");
                    }}
                    required
                    className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-center text-sm text-gray-300">
                <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Regular User Login
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Secure admin access • Nova Kasse Banking Platform
          </p>
        </div>
      </div>
    </div>
  );
}

