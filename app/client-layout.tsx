"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"

const inter = { className: "font-inter" }

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const isAuthPage = pathname?.includes("/sign-in") || pathname?.includes("/sign-up")

    setIsLoggedIn(!!token)

    if (!token && !isAuthPage) {
      router.push("/sign-in")
    }

    if (token && (isAuthPage || pathname === "/")) {
      router.push("/dashboard")
    }
  }, [pathname, router])

  const isAuthPage = pathname?.includes("/sign-in") || pathname?.includes("/sign-up")

  if (isLoggedIn && !isAuthPage) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <>{children}</>
      </body>
    </html>
  )
}
