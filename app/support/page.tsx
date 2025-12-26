"use client"

import { useState, useEffect, useRef } from "react"
import { Mail, Phone, MessageSquare, ChevronRight, Send, X, User, Bot } from "lucide-react"
import Link from "next/link"

const faqs = [
  {
    question: "How do I get started with Versai Technologies?",
    answer: "Simply create an account, generate an API key from the Payment API section, and start integrating our endpoints into your application.",
  },
  // ... rest of your faqs
]

export default function SupportPage() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm the Versai Assistant. How can I help you today?", sender: "bot" }
  ])
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = { id: Date.now(), text: inputValue, sender: "user" }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simple Bot Logic
    setTimeout(() => {
      let botResponse = "I'm sorry, I didn't quite catch that. Would you like to speak to a human agent?"
      
      if (inputValue.toLowerCase().includes("hello") || inputValue.toLowerCase().includes("hi")) {
        botResponse = "Hi there! How can I assist you with Versai payments today?"
      } else if (inputValue.toLowerCase().includes("payment")) {
        botResponse = "We support UPI, Cards, and Net Banking via Razorpay integration."
      } else if (inputValue.toLowerCase().includes("settlement")) {
        botResponse = "Settlements are typically processed within 24 hours."
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botResponse, sender: "bot" }])
    }, 1000)
  }

  return (
    <div className="p-8 relative">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Support</h1>
        <p className="text-muted-foreground">Get help with Versai Technologies</p>
      </div>

      {/* Contact Methods */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card border border-border rounded-lg p-8">
          <Mail className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Email Support</h3>
          <p className="text-muted-foreground mb-4">payexpress00@gmail.com</p>
          <Link href="mailto:payexpress00@gmail.com" className="text-primary hover:underline">
            Send Email
          </Link>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <Phone className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Phone Support</h3>
          <p className="text-muted-foreground mb-4">+91 1800 123 4567</p>
          <Link href="tel:+911800123456" className="text-primary hover:underline">
            Call Now
          </Link>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <MessageSquare className="text-primary mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Live Chat</h3>
          <p className="text-muted-foreground mb-4">Available 24/7</p>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="text-primary hover:underline"
          >
            Start Chat
          </button>
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mt-12 bg-primary/10 border border-primary/20 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/api-docs" className="flex items-center justify-between p-4 rounded-lg hover:bg-primary/20 transition">
            <span className="font-semibold">API Documentation</span>
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>

      {/* CHATBOT UI WINDOW */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-bold">Versai Bot</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-primary-foreground/20 p-1 rounded">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted text-foreground rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
            <button type="submit" className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
