"use client"

import Link from "next/link"

export default function AuthLayout({ children }) {
  return (
    <main className="h-screen flex flex-col overflow-hidden bg-transparent">
      
      {/* 1. Navigation - Solid White Header */}
      <nav className="flex-none bg-white border-b border-gray-200 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-white.png" alt="Versai Technologies" className="h-10 w-auto" />
          </a>
          <div className="flex gap-4 items-center">
            <a
              href="/sign-in"
              className="bg-gradient-to-r from-[#DC24E9] via-[#AA55FE] to-[#1DE2FF] hover:opacity-90 text-white px-5 py-2 rounded-lg transition font-medium shadow-md text-sm"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* 2. Main Gradient Area - Poore page par yahi background dikhega */}
      <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#DC24E9] via-[#AA55FE] to-[#1DE2FF]">
        
        {/* Left Side Content (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center">
          <div className="max-w-md space-y-6 text-white">
            <h1 className="text-5xl font-bold leading-tight">
              Smart IT Solutions to Drive Your Tech Success
            </h1>
            <p className="text-xl text-white/90">
              Versai Technology has been delivering top-notch services for over a decade.
            </p>
          </div>
        </div>

        {/* Right Side - Welcome Back Box Area */}
        {/* Is container se bg-white/gray-50 ko poori tarah hata diya hai */}
        <div className="flex-1 flex items-center bg-transparent justify-center p-6">
          {/* Welcome Back Box - Iske peeche gradient hi nazar aayega */}
          <div className="w-full max-w-md bg-transparent p-8 rounded-3xl">
            {children}
          </div>
        </div>
      </div>

      {/* 3. Footer - Solid White Footer */}
      <footer className="flex-none bg-white border-t border-gray-200 py-4 z-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm font-medium">
          <p>© 2025 Versai Technologies. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}