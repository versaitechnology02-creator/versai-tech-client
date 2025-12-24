"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

const inter = { className: "font-inter" }

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const isAuthPage = pathname?.includes("/sign-in") || pathname?.includes("/sign-up")

    if (!token && !isAuthPage) {
      router.push("/sign-in")
    }

    if (token && (isAuthPage || pathname === "/")) {
      router.push("/dashboard")
    }
  }, [pathname, router])

  return (
    <html lang="en">
      <body className={inter.className}>
        <>{children}</>
      </body>
    </html>
  )
}
