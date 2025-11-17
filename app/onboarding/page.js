"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SkipForward, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/ui/loading-screen";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading..." subMessage="Please wait" />;
  }

  return (
    <div className="min-h-screen bg-gradient-bg flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Skip Button */}
      <div className="flex justify-end p-6 relative z-10 animate-fade-in">
        <Link href="/login">
          <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 transition-smooth">
            <SkipForward className="w-4 h-4 mr-2" />
            SKIP
          </Button>
        </Link>
      </div>

      {/* Phone Preview */}
      <div className="flex-1 flex items-center justify-center px-8 relative z-10">
        <div className="w-full max-w-xs animate-scale-in">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-3 shadow-premium-lg border border-white/20">
            <div className="bg-white rounded-2xl overflow-hidden shadow-premium">
              {/* Mock phone screen */}
              <div className="bg-white min-h-[600px] p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Your Budgets</h2>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    NK
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-6 font-medium">
                  for Axess Platinum Card
                </div>
                <div className="flex justify-center my-12">
                  <div className="relative w-40 h-40 animate-float">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="10"
                        strokeDasharray={`${(6390 / 3248) * 100 * 4.4} 440`}
                        strokeLinecap="round"
                        className="transition-smooth"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-xs text-gray-600 mb-1 font-medium">You Are Spent</p>
                      <p className="text-2xl font-bold text-gray-900">$6,390</p>
                      <p className="text-xs text-gray-500">of $3,248</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mt-8">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                          item === 1 ? 'from-blue-500 to-cyan-500' :
                          item === 2 ? 'from-purple-500 to-pink-500' :
                          'from-green-500 to-emerald-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Category {item}</p>
                          <p className="text-xs text-gray-500">Budget item</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900">${(item * 1000).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Text */}
      <div className="px-8 pb-4 text-center relative z-10 animate-fade-in">
        <h3 className="text-white text-xl font-bold mb-2">Manage Your Finances</h3>
        <p className="text-white/90 text-sm leading-relaxed max-w-md mx-auto">
          Take control of your money with Nova Kasse. Track expenses, set budgets, and achieve your financial goals.
        </p>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 pb-6 relative z-10">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-smooth rounded-full ${
              currentSlide === index
                ? "w-8 h-2 bg-white shadow-lg"
                : "w-2 h-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="px-8 pb-8 flex gap-4 relative z-10 animate-slide-in-up">
        <Link href="/login" className="flex-1">
          <Button
            variant="outline"
            className="w-full h-14 bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 hover:bg-white/20 rounded-xl transition-smooth transform hover:scale-105 font-semibold"
          >
            Login
          </Button>
        </Link>
        <Link href="/signup" className="flex-1">
          <Button
            className="w-full h-14 bg-white text-blue-600 border-0 hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-smooth transform hover:scale-105 font-semibold flex items-center justify-center gap-2"
          >
            Sign Up
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
