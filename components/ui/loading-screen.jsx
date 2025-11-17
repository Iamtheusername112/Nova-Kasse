"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, TrendingUp, Shield, CreditCard } from "lucide-react";

/**
 * Premium animated loading screen component with dynamic Nova Kasse branding
 * Ensures minimum display time of 3 seconds for smooth user experience
 * @param {string} message - Main loading message
 * @param {string} subMessage - Subtitle message
 * @param {number} minDisplayTime - Minimum time to display in milliseconds (default: 3000ms)
 */
export default function LoadingScreen({ message = "Loading...", subMessage = null, minDisplayTime = 3000 }) {
  const appName = "Nova Kasse";
  const letters = appName.split("");
  const [particles, setParticles] = useState([]);
  const [mounted, setMounted] = useState(false);
  const mountTimeRef = useRef(null);

  // Generate random particle positions only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Record mount time
    mountTimeRef.current = Date.now();
    const particleData = Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${4 + Math.random() * 3}s`,
      delay: `${Math.random() * 3}s`,
    }));
    setParticles(particleData);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs with more movement */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-blue-400 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
        <div className="absolute top-40 right-32 w-48 h-48 bg-purple-400 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '1.5s', animationDuration: '8s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-44 h-44 bg-pink-400 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '3s', animationDuration: '7s' }}></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-cyan-400 rounded-full opacity-20 blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '9s' }}></div>
        
        {/* Moving particles with trails - only render after mount to avoid hydration mismatch */}
        {mounted && particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-40 shadow-lg"
            style={{
              left: particle.left,
              top: particle.top,
              animation: `particle-float ${particle.duration} ease-in-out infinite`,
              animationDelay: particle.delay,
            }}
          ></div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-4">
        {/* Animated Nova Kasse Logo/Text */}
        <div className="relative mb-8">
          {/* Glow effect behind text */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-2xl opacity-30 animate-pulse" style={{ transform: 'scale(1.5)' }}></div>
          
          {/* Animated app name with letter-by-letter animation */}
          <h1 className="relative text-6xl md:text-7xl font-black tracking-tight">
            <span className="inline-block">
              {letters.map((letter, index) => (
                <span
                  key={index}
                  className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-letter-bounce"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: '2s',
                  }}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </span>
              ))}
            </span>
          </h1>
          
          {/* Underline animation */}
          <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-underline-expand"></div>
        </div>

        {/* Animated logo/icon container */}
        <div className="relative mt-8">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-40 h-40 border-4 border-blue-200 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 w-36 h-36 border-4 border-purple-200 rounded-full animate-pulse"></div>
          
          {/* Inner icon container */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-scale-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse opacity-75"></div>
            <Sparkles className="w-16 h-16 text-white relative z-10 animate-pulse" />
          </div>
          
          {/* Orbiting icons with enhanced animation */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full animate-orbit">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center shadow-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full animate-orbit" style={{ animationDelay: '1s' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full animate-orbit" style={{ animationDelay: '2s' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-xl">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full animate-orbit" style={{ animationDelay: '3s' }}>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-xl">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-4 mt-8">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-shift">
            {message}
          </h2>
          {subMessage && (
            <p className="text-gray-600 text-base font-medium animate-fade-in">
              {subMessage}
            </p>
          )}
        </div>

        {/* Enhanced progress dots */}
        <div className="flex space-x-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-bounce shadow-lg"
              style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1s' }}
            ></div>
          ))}
        </div>

        {/* Animated progress bar */}
        <div className="w-72 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-progress-shimmer shadow-lg"></div>
        </div>
      </div>

    </div>
  );
}

