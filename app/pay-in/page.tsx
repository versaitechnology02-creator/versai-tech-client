"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Copy } from "lucide-react"
import QRCode from "react-qr-code"

export default function PayInPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: "",
    customer_name: "",
    customer_email: "",
    description: "Versai Technologies",
  })
  const [provider, setProvider] = useState<"razorpay" | "smepay" | "unpay" | "">("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [generatedLink, setGeneratedLink] = useState("")
  const [isVerified, setIsVerified] = useState<boolean | null>(null)

  // Check user verification status
  useEffect(() => {
    const checkVerification = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/sign-in")
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setIsVerified(data.data.isVerified)
        } else {
          router.push("/sign-in")
        }
      } catch {
        router.push("/sign-in")
      }
    }
    checkVerification()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus("idle")

    try {
      // Ensure a provider is selected before creating the link
      if (!provider) {
        setLoading(false)
        setStatus("error")
        setMessage("Please select a payment provider (Razorpay, Smepay, or Unpay)")
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(formData.amount),
          currency: "INR",
          description: formData.description,
          notes: {
            name: formData.customer_name,
            email: formData.customer_email,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || window.location.origin
        const paymentLink = `${clientUrl}/payment?order_id=${data.data.order_id}&provider=${provider}`
        setGeneratedLink(paymentLink)
        setStatus("success")
        setMessage("Payment link created successfully!")
      } else {
        setStatus("error")
        setMessage(data.message || "Failed to create payment link")
      }
    } catch (error) {
      setStatus("error")
      setMessage("Error creating payment link")
    } finally {
      setLoading(false)
    }
  }

  if (isVerified === null) {
    return (
      <div className="p-8 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">Your account is pending admin verification. Please contact support or wait for approval.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-gradient px-6 py-2 rounded-lg"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">Pay In</h1>
      <p className="text-muted-foreground mb-8">Create payment links for your customers</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Create Payment Link</h2>
          <form onSubmit={handleCreateOrder} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amount (INR)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Customer Name</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Customer Email</label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                placeholder="Enter customer email"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter payment description"
                rows={3}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Payment Provider</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setProvider("razorpay")}
                  className={`px-4 py-2 rounded-lg border ${provider === "razorpay" ? "border-primary text-primary" : "border-border"}`}
                >
                  Razorpay
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("smepay")}
                  className={`px-4 py-2 rounded-lg border ${provider === "smepay" ? "border-primary text-primary" : "border-border"}`}
                >
                  Smepay
                </button>
                <button
                  type="button"
                  onClick={() => setProvider("unpay")}
                  className={`px-4 py-2 rounded-lg border ${provider === "unpay" ? "border-primary text-primary" : "border-border"}`}
                >
                  Unpay
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Please choose one provider before creating the link.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Payment Link"}
            </button>
          </form>
        </div>

        {/* Result */}
        <div>
          {status === "success" && (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="text-secondary" size={32} />
                <h3 className="text-2xl font-bold">Link Created!</h3>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">Share this link with your customer:</p>
                <div className="bg-background border border-border rounded-lg p-4 break-all text-sm">
                  {generatedLink}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">Scan to pay via {provider.toUpperCase()}</p>
                  <div className="bg-white p-4 rounded-md inline-block">
                    <QRCode value={generatedLink} size={160} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    setMessage("Link copied to clipboard!")
                  }}
                  className="w-full btn-gradient py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Copy size={20} />
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="bg-destructive/20 border border-destructive rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-destructive" size={32} />
                <h3 className="text-2xl font-bold">Error</h3>
              </div>
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "idle" && (
            <div className="bg-muted/50 border border-border rounded-lg p-8 text-center text-muted-foreground">
              <p>Fill in the form and create a payment link</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
