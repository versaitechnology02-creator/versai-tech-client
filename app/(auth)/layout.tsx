"use client"

import Link from "next/link"

export default function AuthLayout({ children }) {
  return (
    // h-screen aur overflow-hidden se scrolling band ho jayegi
    <main className="h-screen flex flex-col overflow-hidden bg-white">
      
      {/* Navigation - Fixed height */}
      <nav className="flex-none bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
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

      {/* Main Content Area - flex-1 occupies remaining space */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side - Hero (Only visible on Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#DC24E9] via-[#AA55FE] to-[#1DE2FF] p-12 items-center justify-center">
          <div className="max-w-md space-y-6 text-white">
            <h1 className="text-4xl font-bold leading-tight">
              Smart IT Solutions to Drive Your Tech Success
            </h1>
            <p className="text-lg text-white/90">
              Versai Technology has been delivering top-notch services for over a decade.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form (Scrollable inside if form is long) */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 overflow-hidden p-6">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>

      {/* Footer - Fixed height */}
      <footer className="flex-none bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Versai Technologies. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}