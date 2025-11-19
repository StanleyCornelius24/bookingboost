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
      content: "Hi! I'm your BookingBoost AI assistant. Ask me anything about your booking data, performance metrics, or trends. Try asking something like 'How is our year-on-year performance looking?'",
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-brand-gold text-brand-navy rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group z-50"
        >
          <Sparkles className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-brand-navy text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-white/80">Analyze your booking data</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 p-1 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-brand-navy text-white'
                      : 'bg-brand-gold/10 text-brand-navy border border-brand-gold/30'
                  }`}
                >
                  <p className="text-sm font-light whitespace-pre-wrap">{message.content}</p>
                  {message.data && (
                    <div className="mt-2 pt-2 border-t border-brand-navy/10">
                      <pre className="text-xs font-mono overflow-x-auto">
                        {JSON.stringify(message.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-brand-gold/10 text-brand-navy border border-brand-gold/30 rounded-2xl px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wider mb-2">
                Try asking:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center p-2 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-lg text-xs font-light text-brand-navy transition-all"
                  >
                    <q.icon className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your bookings..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-sm font-light bg-card disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
