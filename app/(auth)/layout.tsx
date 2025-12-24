"use client"

import Link from "next/link"

export default function AuthLayout({ children }) {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-white.png" alt="Versai Technologies" className="h-12 w-auto" />
          </a>

          <div className="flex gap-4 items-center">
            <a
              href="/sign-in"
              className="bg-gradient-to-r from-[#DC24E9] via-[#AA55FE] to-[#1DE2FF] hover:opacity-90 text-white px-6 py-2.5 rounded-lg transition font-medium shadow-lg"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Split Layout */}
      <div className="flex-1 flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#DC24E9] via-[#AA55FE] to-[#1DE2FF] p-16 items-center justify-center">
          <div className="max-w-lg space-y-6 text-white">
            <h1 className="text-5xl font-bold leading-tight">
              Keep 100% of Your Earnings with 0% UPI Commission
            </h1>
            <p className="text-xl text-white/90">
              Join thousands of businesses choosing us to simplify payments—with no hidden cuts.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center py-16 px-4 bg-gray-50">
          <div className="w-full max-w-xl">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2025 Versai Technologies. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}