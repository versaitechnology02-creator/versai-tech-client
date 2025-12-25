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

  // Helper function to check if a link is a UPI payment link
  const isUpiLink = (link: string): boolean => {
    if (!link) return false
    return link.startsWith("upi://") || 
           link.startsWith("https://pay?") || 
           link.includes("upi://pay") ||
           (link.startsWith("https://") && (link.includes("/pay?") || link.includes("upi")))
  }

  // Check user verification status - refetch on focus to catch verification updates
  useEffect(() => {
    const checkVerification = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/sign-in")
        return
      }

      try {
        // Add cache-busting timestamp to ensure fresh data
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/user/me?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        
        if (!res.ok) {
          console.error("User API error:", res.status, res.statusText)
          if (res.status === 401 || res.status === 403) {
            router.push("/sign-in")
          } else {
            // For other errors, still show the page but mark as not verified
            setIsVerified(false)
          }
          return
        }
        
        const data = await res.json()
        console.log("User data response:", data)
        
        if (data.success && data.user) {
          // Backend returns { success: true, user: {...} }
          // Check both isVerified and verified fields for compatibility
          const verified = data.user.isVerified === true || data.user.verified === true
          console.log("[Pay-In] User verification status:", {
            isVerified: data.user.isVerified,
            verified: data.user.verified,
            finalStatus: verified,
            userId: data.user._id || data.user.id
          })
          setIsVerified(verified)
          // Store in localStorage to track verification state
          localStorage.setItem('lastVerifiedStatus', verified ? 'true' : 'false')
        } else {
          console.error("[Pay-In] Invalid user data:", data)
          // Don't redirect, just mark as not verified so user can see the access denied message
          setIsVerified(false)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        // Don't redirect on network errors, just mark as not verified
        setIsVerified(false)
      }
    }
    
    checkVerification()
    
    // Refetch when window gains focus (user might have been verified in another tab)
    const handleFocus = () => {
      console.log("[Pay-In] Window focused, refreshing verification status...")
      checkVerification()
    }
    window.addEventListener('focus', handleFocus)
    
    // Periodic refresh every 5 seconds to catch verification updates
    const intervalId = setInterval(() => {
      // Only refresh if we're still checking (null) or not verified (false)
      // Don't refresh if already verified to avoid unnecessary API calls
      const currentVerified = localStorage.getItem('lastVerifiedStatus')
      if (currentVerified !== 'true') {
        console.log("[Pay-In] Periodic check - refreshing verification status...")
        checkVerification()
      }
    }, 5000)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(intervalId)
    }
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
    setMessage("")

    try {
      // Validate form fields
      if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
        setLoading(false)
        setStatus("error")
        setMessage("Please enter a valid amount greater than 0")
        return
      }

      // Ensure a provider is selected before creating the link
      if (!provider) {
        setLoading(false)
        setStatus("error")
        setMessage("Please select a payment provider (Razorpay, Smepay, or Unpay)")
        return
      }

      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        setStatus("error")
        setMessage("Please sign in to create payment links")
        router.push("/sign-in")
        return
      }

      console.log("Creating payment order with:", { amount: formData.amount, provider, description: formData.description })

      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

      // Check if response is ok
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Server error: ${res.status} ${res.statusText}` }))
        setStatus("error")
        setMessage(errorData.message || `Failed to create payment link (${res.status})`)
        setLoading(false)
        return
      }

      const data = await res.json()
      if (data.success) {
        // CRITICAL: Only use UPI intents or official gateway hosted links
        // NEVER generate frontend URLs for payment links/QR codes
        let paymentLink = ""
        let qrCodeValue = ""
        
        // Helper to validate and extract UPI intent
        const getUpiIntent = (upiString: string | null | undefined): string | null => {
          if (!upiString || typeof upiString !== 'string') return null
          // Check if it's already a valid UPI intent format
          if (upiString.startsWith('upi://') || upiString.startsWith('UPI://')) {
            return upiString
          }
          // If it's a URL that might contain UPI intent, try to extract it
          if (upiString.includes('upi://')) {
            const match = upiString.match(/upi:\/\/[^\s"']+/i)
            if (match) return match[0]
          }
          // Return null if not a valid UPI intent
          return null
        }
        
        // Helper to check if URL is an official gateway hosted link
        const isOfficialGatewayLink = (url: string): boolean => {
          if (!url || typeof url !== 'string') return false
          // Check for official gateway domains (NOT our frontend domain)
          const frontendDomains = ['versai-tech-client', 'vercel.app', 'localhost', '127.0.0.1']
          const isFrontendUrl = frontendDomains.some(domain => url.includes(domain))
          if (isFrontendUrl) return false
          
          // Check for official gateway domains
          return url.includes('razorpay.com') || 
                 url.includes('rzp.io') ||
                 url.includes('smepay') ||
                 url.includes('unpay.in') ||
                 url.includes('typof.co') ||
                 url.includes('checkout') ||
                 url.startsWith('https://') // Any HTTPS URL that's not our frontend
        }
        
        if (provider === "unpay") {
          // UnPay: Use UPI intent or official UnPay hosted link
          const upiIntent = getUpiIntent(data.data.unpay_upi_intent)
          if (upiIntent) {
            paymentLink = upiIntent
            qrCodeValue = upiIntent
          } else if (data.data.unpay_upi_intent && isOfficialGatewayLink(data.data.unpay_upi_intent)) {
            // Use official UnPay hosted link if available
            paymentLink = data.data.unpay_upi_intent
            qrCodeValue = data.data.unpay_upi_intent
          } else {
            // No valid payment link available from UnPay
            setStatus("error")
            setMessage("UnPay payment link not available. Please try again or use a different provider.")
            setLoading(false)
            return
          }
        } else if (provider === "smepay") {
          // SMEPay: Use UPI intent or official SMEPay hosted link
          const upiIntent = getUpiIntent(data.data.smepay_upi_link)
          if (upiIntent) {
            paymentLink = upiIntent
            qrCodeValue = upiIntent
          } else if (data.data.smepay_upi_link && isOfficialGatewayLink(data.data.smepay_upi_link)) {
            // Use official SMEPay hosted link if available
            paymentLink = data.data.smepay_upi_link
            qrCodeValue = data.data.smepay_upi_link
          } else {
            // No valid payment link available from SMEPay
            setStatus("error")
            setMessage("SMEPay payment link not available. Please try again or use a different provider.")
            setLoading(false)
            return
          }
        } else if (provider === "razorpay") {
          // Razorpay: Use Razorpay checkout link (rzp.io or razorpay.com)
          // Razorpay checkout URLs are generated client-side, but we need the order_id
          // For QR codes, we should use Razorpay's hosted checkout page
          const razorpayCheckoutUrl = `https://checkout.razorpay.com/v1/checkout.js?key=${data.data.key_id}&order_id=${data.data.order_id}`
          // However, Razorpay QR codes typically use their hosted payment page
          // For now, we'll use the order_id and let Razorpay handle the payment flow
          // But we should NOT generate our frontend URL
          setStatus("error")
          setMessage("Razorpay requires checkout integration. Please use UnPay or SMEPay for direct payment links and QR codes.")
          setLoading(false)
          return
        } else {
          // Unknown provider or no provider selected
          setStatus("error")
          setMessage("Invalid payment provider. Please select UnPay or SMEPay for payment links.")
          setLoading(false)
          return
        }
        
        // CRITICAL VALIDATION: Ensure we NEVER use frontend URLs
        // Validate that we have a valid payment link (UPI intent or official gateway link)
        if (!paymentLink) {
          setStatus("error")
          setMessage("Failed to generate valid payment link. Please try again or contact support.")
          setLoading(false)
          return
        }
        
        // Final check: Reject any frontend URLs
        const frontendDomains = ['versai-tech-client', 'vercel.app', 'localhost', '127.0.0.1']
        const isFrontendUrl = frontendDomains.some(domain => paymentLink.includes(domain))
        if (isFrontendUrl && !paymentLink.startsWith('upi://')) {
          console.error("[CRITICAL] Frontend URL detected in payment link:", paymentLink)
          setStatus("error")
          setMessage("Invalid payment link format. Please contact support.")
          setLoading(false)
          return
        }
        
        // Validate it's either UPI intent or official gateway link
        const isValidLink = paymentLink.startsWith('upi://') || 
                           paymentLink.startsWith('UPI://') || 
                           isOfficialGatewayLink(paymentLink)
        
        if (!isValidLink) {
          console.error("[CRITICAL] Invalid payment link format:", paymentLink)
          setStatus("error")
          setMessage("Invalid payment link format. Please try again or contact support.")
          setLoading(false)
          return
        }
        
        setGeneratedLink(paymentLink)
        setStatus("success")
        setMessage("Payment link created successfully!")
        
        // Reset form for next payment (optional - keep amount and description)
        // setFormData(prev => ({ ...prev, amount: "", customer_name: "", customer_email: "" }))
      } else {
        setStatus("error")
        setMessage(data.message || "Failed to create payment link")
      }
    } catch (error: any) {
      console.error("Payment creation error:", error)
      setStatus("error")
      setMessage(error.message || "Network error: Please check your connection and try again")
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
              disabled={loading || !provider}
              className="w-full btn-gradient py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Payment Link"}
            </button>
            {!provider && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Please select a payment provider above
              </p>
            )}
          </form>
        </div>

        {/* Result */}
        <div>
          {status === "success" && (
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-secondary" size={32} />
                  <h3 className="text-2xl font-bold">Link Created!</h3>
                </div>
                <button
                  onClick={() => {
                    setStatus("idle")
                    setGeneratedLink("")
                    setMessage("")
                    setProvider("")
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Create Another
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {isUpiLink(generatedLink)
                    ? "Share this UPI payment link with your customer (click to open UPI app):" 
                    : "Share this link with your customer:"}
                </p>
                {isUpiLink(generatedLink) ? (
                  <a 
                    href={generatedLink}
                    className="bg-background border border-border rounded-lg p-4 break-all text-sm text-primary hover:underline block"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {generatedLink}
                  </a>
                ) : (
                  <div className="bg-background border border-border rounded-lg p-4 break-all text-sm">
                    {generatedLink}
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {isUpiLink(generatedLink)
                      ? "Scan QR code to pay directly via UPI app" 
                      : `Scan to pay via ${provider.toUpperCase()}`}
                  </p>
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
              <p className="text-muted-foreground mb-4">{message}</p>
              <button
                onClick={() => {
                  setStatus("idle")
                  setMessage("")
                }}
                className="text-sm text-destructive hover:underline"
              >
                Try Again
              </button>
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
