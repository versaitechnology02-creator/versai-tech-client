"use client"

import { Loader2 } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  )
}