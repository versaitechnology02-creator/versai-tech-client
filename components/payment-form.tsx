"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface PaymentFormProps {
  onSuccess: (orderId: string) => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentForm({ onSuccess, onError }: PaymentFormProps) {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string>("")
  const [provider, setProvider] = useState<string>("")
  const [providerUrl, setProviderUrl] = useState<string>("")
  const [smepaySlug, setSmepaySlug] = useState<string>("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: "",
    description: "",
    currency: "INR",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isReadonly, setIsReadonly] = useState(false)

  // Load order details if order_id is present in URL
  useEffect(() => {
    const id = searchParams.get("order_id") || ""
    const prov = searchParams.get("provider") || ""
    setOrderId(id)
    setProvider(prov)

    async function fetchOrder() {
      if (!id) return
      try {
        setLoading(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/transaction/${id}`)
        const data = await res.json()
        if (!data.success || !data.data) {
          throw new Error(data.message || "Order not found")
        }
        const txn = data.data
        setFormData({
          name: txn.customer_name || "",
          email: txn.customer_email || "",
          amount: String(txn.amount ?? ""),
          description: txn.description || txn.notes?.description || "",
          currency: txn.currency || "INR",
        })
        setIsReadonly(true)

        // Attempt to derive provider redirect URL from transaction payload
        const getUrl = (obj: any): string | undefined => {
          const seen = new Set<any>()
          const dfs = (node: any, depth: number): string | undefined => {
            if (!node || typeof node !== "object" || depth > 3 || seen.has(node)) return undefined
            seen.add(node)
            for (const [k, v] of Object.entries(node)) {
              if (typeof v === "string" && v) {
                // Prioritize payment URLs over callback URLs
                if (/payment_url|payment_link|checkout_url|redirect_url|dqr_link|deeplink|upi_link|longurl/i.test(k)) {
                  return v
                }
              }
            }
            // Fallback to generic url/link but exclude callback_url
            for (const [k, v] of Object.entries(node)) {
              if (typeof v === "string" && v && !/callback/i.test(k)) {
                if (/^(url|link)$/i.test(k)) {
                  return v
                }
              }
            }
            for (const v of Object.values(node)) {
              if (typeof v === "object") {
                const found = dfs(v, depth + 1)
                if (found) return found
              }
            }
            return undefined
          }
          return dfs(obj, 0)
        }

        let url: string | undefined = undefined
        if (prov === "smepay") {
          const smepayObj = (txn as any).smepay || txn.notes?.smepay
          url = getUrl(smepayObj)
          const slugCandidates = (node: any): string | undefined => {
            const seen = new Set<any>()
            const dfs = (n: any, depth: number): string | undefined => {
              if (!n || typeof n !== "object" || depth > 3 || seen.has(n)) return undefined
              seen.add(n)
              for (const [k, v] of Object.entries(n)) {
                if (typeof v === "string" && v) {
                  if (/order_slug|wizorder_slug|wiz_order_slug|orderSlug|slug|order_id|orderId/i.test(k)) {
                    return v
                  }
                }
              }
              for (const v of Object.values(n)) {
                if (typeof v === "object") {
                  const found = dfs(v, depth + 1)
                  if (found) return found
                }
              }
              return undefined
            }
            return dfs(node, 0)
          }

          const slug = slugCandidates(smepayObj)
          if (slug) setSmepaySlug(slug)
          else if (id) setSmepaySlug(id) // fallback to order_id
        } else if (prov === "unpay") {
          url = getUrl((txn as any).unpay) || getUrl(txn.notes?.unpay)
        }
        if (url) setProviderUrl(url)
        // Surface backend provider errors if any
        const smepayError = (txn as any).smepay_error || txn.notes?.smepay_error
        if (smepayError) {
          setError(`SMEPay error: ${smepayError}`)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // When an `order_id` is present in the URL, use it directly
      if (orderId) {
        // If provider is non-Razorpay, redirect to provider URL if available
        if (provider && provider !== "razorpay") {
          // Prefer direct provider URL if present
          if (providerUrl) {
            window.location.href = providerUrl
            return
          }

          // For SMEPay, if we have a slug, invoke the widget
          if (provider === "smepay" && smepaySlug) {
            await new Promise<void>((resolve, reject) => {
              // Ensure script is loaded
              if (!document.querySelector('script[src="https://typof.co/smepay/checkout-v2.js"]')) {
                const script = document.createElement("script")
                script.src = "https://typof.co/smepay/checkout-v2.js"
                script.async = true
                script.onload = () => resolve()
                script.onerror = (e) => reject(new Error("Failed to load SMEPay widget"))
                document.body.appendChild(script)
              } else {
                resolve()
              }
            })

            if (typeof (window as any).smepayCheckout !== "function") {
              throw new Error("SMEPay widget is not available. Please retry or regenerate the link.")
            }

            ;(window as any).smepayCheckout({
              slug: smepaySlug,
              onSuccess: () => {
                onSuccess(orderId)
              },
              onFailure: () => {
                onError("Payment cancelled or failed.")
              },
            })
            return
          }

          throw new Error("Payment link for selected provider is unavailable. Please try Razorpay or regenerate the link.")
        }

        if (!formData.name || !formData.email || !formData.amount) {
          throw new Error("Missing order details. Please refresh the page.")
        }

        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        script.onload = () => {
          const razorpay = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            order_id: orderId,
            amount: Number(formData.amount) * 100, // paise; optional when order_id present
            currency: formData.currency,
            name: "Versai Technologies",
            description: formData.description,
            prefill: {
              name: formData.name,
              email: formData.email,
            },
            handler: async (response: any) => {
              try {
                const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/verify-payment`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                })
                const verifyData = await verifyRes.json()
                if (verifyData.success) {
                  onSuccess(orderId)
                } else {
                  onError(verifyData.message)
                }
              } catch (err: any) {
                onError(err.message)
              }
            },
            modal: {
              ondismiss: () => {
                onError("Payment cancelled")
              },
            },
          })
          razorpay.open()
        }
        document.body.appendChild(script)
        return
      }

      // Fallback: create a new order if `order_id` is not present
      // Validate form
      if (!formData.name || !formData.email || !formData.amount) {
        throw new Error("Please fill in all required fields")
      }

      if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
        throw new Error("Please enter a valid amount")
      }

      const orderRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(formData.amount),
          currency: formData.currency,
          description: formData.description,
          notes: {
            name: formData.name,
            email: formData.email,
            description: formData.description,
          },
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.success) {
        throw new Error(orderData.message)
      }

      // Load Razorpay script
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        const razorpay = new window.Razorpay({
          key: orderData.data.key_id,
          order_id: orderData.data.order_id,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: "Versai Technologies",
          description: formData.description,
          prefill: {
            name: formData.name,
            email: formData.email,
          },
          handler: async (response: any) => {
            try {
              // Verify payment
              const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/payments/verify-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              })

              const verifyData = await verifyRes.json()
              if (verifyData.success) {
                onSuccess(orderData.data.order_id)
              } else {
                onError(verifyData.message)
              }
            } catch (err: any) {
              onError(err.message)
            }
          },
          modal: {
            ondismiss: () => {
              onError("Payment cancelled")
            },
          },
        })
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (err: any) {
      setError(err.message)
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            readOnly={isReadonly}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            readOnly={isReadonly}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Amount (INR) *</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="500"
            step="0.01"
            min="1"
            required
            readOnly={true}
            className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground"
          />
          {isReadonly && <p className="text-xs text-muted-foreground mt-1">Amount is fixed for this order.</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Order description..."
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gradient disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 rounded-lg transition"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  )
}
