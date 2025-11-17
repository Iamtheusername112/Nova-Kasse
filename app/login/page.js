"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, ArrowRight } from "lucide-react";
import LoadingScreen from "@/components/ui/loading-screen";
import { useMinimumLoadingTime } from "@/lib/hooks/useMinimumLoadingTime";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const displayLoading = useMinimumLoadingTime(loading, 3000);
  const displayIsLoading = useMinimumLoadingTime(isLoading, 3000);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      router.push("/");
    }
    
    setIsLoading(false);
  };

  if (displayLoading) {
    return <LoadingScreen message="Initializing..." subMessage="Please wait" />;
  }

  if (displayIsLoading) {
    return <LoadingScreen message="Signing In..." subMessage="Please wait while we authenticate you" />;
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-fade-in px-4">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-white mb-6 shadow-2xl border-4 border-white/80 backdrop-blur-md">
            <div className="text-5xl font-black text-gray-900">NK</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4" style={{ textShadow: '3px 3px 12px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}>Welcome Back</h1>
          <p className="text-white text-xl font-bold" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.4), 0 0 10px rgba(0,0,0,0.2)' }}>Sign in to your Nova Kasse account</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-premium-lg bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sign In
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter your credentials to continue
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth bg-white"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-smooth"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-smooth">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-smooth transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-semibold text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-smooth hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center animate-fade-in">
          <p className="text-white/80 text-sm">
            Secure banking powered by Nova Kasse
          </p>
        </div>
      </div>
    </div>
  );
}
