'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Sparkles, TrendingUp, Users, Calendar } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  data?: any
}

const suggestedQuestions = [
  { icon: Users, text: "How often do guests return?" },
  { icon: TrendingUp, text: "What's our year-on-year performance?" },
  { icon: Calendar, text: "Which months have the highest occupancy?" },
  { icon: TrendingUp, text: "What's our average booking value?" }
]

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your BookingFocus AI assistant. Ask me anything about your booking data, performance metrics, or trends. Try asking something like 'How is our year-on-year performance looking?'",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (question?: string) => {
    const messageText = question || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: messageText })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        data: data.data
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your question. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-brand-gold text-brand-navy rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group z-50"
        >
          <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[420px] h-[650px] bg-white border border-soft-gray rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-brand-navy text-white px-6 py-5 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-brand-gold/20 rounded-full flex items-center justify-center mr-3">
                <Sparkles className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-base">AI Assistant</h3>
                <p className="text-xs text-white/70 font-light">Analyze your booking data</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-off-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                    message.role === 'user'
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'bg-white text-brand-navy border border-soft-gray shadow-sm'
                  }`}
                >
                  <p className="text-sm font-book leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-brand-navy border border-soft-gray shadow-sm rounded-2xl px-5 py-3.5">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-brand-navy/40 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand-navy/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-brand-navy/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-5 pb-3 bg-off-white border-t border-soft-gray">
              <p className="text-xs font-semibold text-brand-navy/50 uppercase tracking-widest mb-3 pt-3">
                Try asking:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center p-2.5 bg-white hover:bg-brand-gold/10 border border-soft-gray hover:border-brand-gold/40 rounded-xl text-xs font-book text-brand-navy transition-all shadow-sm hover:shadow"
                  >
                    <q.icon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-brand-navy/60" />
                    <span className="truncate">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-5 border-t border-soft-gray bg-white rounded-b-2xl">
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your bookings..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-soft-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold text-sm font-book bg-white disabled:opacity-50 disabled:bg-gray-50 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-4 py-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
