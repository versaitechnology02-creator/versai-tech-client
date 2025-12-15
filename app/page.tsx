"use client"

import Link from "next/link"
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react"
import Footer from "@/components/footer"
import FAQs from "@/components/Faqs"
import About from "@/components/Aboutus"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/90 border-b border-primary/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <a href="/" className="flex items-center gap-3">
              <img src="/logo-white.png" alt="Versai Technologies" className="h-8 w-auto" />
            </a>
         
          <div className="flex gap-4 items-center">
           
            <Link href="/sign-in" className="bg-brand-gradient hover:opacity-90 text-white px-6 py-2 rounded-lg transition shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6 text-balance text-brand-gradient">Secure Payment Gateway Middleware</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Versai Technologies acts as a trusted middleman between your application and Razorpay, providing a seamless payment
              experience with enterprise-grade security.
            </p>
            <div className="flex gap-4">
              <Link
                href="/payment"
                className="bg-brand-gradient hover:opacity-90 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition shadow-lg"
              >
                Start Payment <ArrowRight size={20} />
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-3 rounded-lg font-semibold transition shadow-md"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg p-8 backdrop-blur-sm shadow-xl">
            <div className="text-6xl font-bold text-primary mb-4">∞</div>
            <p className="text-muted-foreground">Unlimited transaction capacity</p>
          </div>
        </div>
      </section>
<About/>
      {/* Features */}
      {/* <section className="bg-card py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-12 text-center">Why Versai Technologies?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Secure", desc: "Bank-level encryption and signature verification" },
              { icon: Zap, title: "Fast", desc: "Lightning-quick transaction processing" },
              { icon: BarChart3, title: "Track", desc: "Real-time transaction monitoring and analytics" },
            ].map((feature, i) => (
              <div key={i} className="bg-background border border-border p-8 rounded-lg">
                <feature.icon className="text-primary mb-4" size={32} />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      <FAQs/>
 <Footer/>
     
    </main>
  )
}