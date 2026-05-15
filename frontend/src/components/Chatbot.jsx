import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles, Minimize2 } from 'lucide-react'
import { chatbotApi } from '../api/client'

const SUGGESTIONS = [
  'What are the onboarding steps?',
  'What documents are needed for a new hire?',
  'How does the approval workflow work?',
  'What happens after manager approval?',
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi there! 👋 I\'m **OnboardFlow AI**, your HR assistant.\n\nI can help you with onboarding queries, HR policies, workflow questions, and more. How can I assist you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  async function handleSend(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatbotApi.sendMessage(msg, messages.slice(1))
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an issue processing your request. Please try again in a moment.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function renderContent(text) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>
        }
        return part
      })

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 8, marginBottom: 2 }}>
            <span style={{ color: 'var(--accent-1)' }}>•</span>
            <span>{parts.map(p => typeof p === 'string' ? p.replace(/^[-•]\s*/, '') : p)}</span>
          </div>
        )
      }

      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />
      return <div key={i} style={{ marginBottom: 2 }}>{parts}</div>
    })
  }

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.fab}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(6, 182, 212, 0.4), 0 0 40px rgba(139, 92, 246, 0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(6, 182, 212, 0.25)'
          }}
        >
          <MessageCircle size={24} />
          <div style={styles.fabPulse} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.headerIcon}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>OnboardFlow AI</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                  Powered by GPT-4o mini
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setOpen(false)} style={styles.headerBtn}>
                <Minimize2 size={14} />
              </button>
              <button onClick={() => setOpen(false)} style={styles.headerBtn}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 8,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 14,
                animation: 'fadeIn 0.3s ease forwards',
              }}>
                {msg.role === 'assistant' && (
                  <div style={styles.avatarBot}>
                    <Bot size={14} />
                  </div>
                )}
                <div style={{
                  ...styles.bubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.botBubble),
                }}>
                  {renderContent(msg.content)}
                </div>
                {msg.role === 'user' && (
                  <div style={styles.avatarUser}>
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={styles.avatarBot}>
                  <Bot size={14} />
                </div>
                <div style={{ ...styles.bubble, ...styles.botBubble, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--accent-1)',
                        animation: `dotBounce 1.4s ${i * 0.16}s ease-in-out infinite`,
                        display: 'inline-block',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thinking...</span>
                </div>
              </div>
            )}

            {/* Suggestions — only show at start */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    style={styles.suggestion}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(6,182,212,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'
                      e.currentTarget.style.color = 'var(--accent-1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      e.currentTarget.style.borderColor = 'var(--border2)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <div style={styles.inputWrapper}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about HR & onboarding..."
                style={styles.input}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{
                  ...styles.sendBtn,
                  opacity: loading || !input.trim() ? 0.3 : 1,
                }}
              >
                <Send size={14} />
              </button>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
              Responses are AI-generated. Verify important information with HR.
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fabBounce {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'var(--gradient)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(6, 182, 212, 0.25)',
    transition: 'all 0.2s ease',
    zIndex: 9999,
    animation: 'fabBounce 0.3s ease',
  },
  fabPulse: {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    border: '2px solid rgba(6, 182, 212, 0.4)',
    animation: 'pulseRing 2s ease-in-out infinite',
    pointerEvents: 'none',
  },
  chatWindow: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 400,
    height: 560,
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.06)',
    zIndex: 9999,
    animation: 'chatSlideIn 0.25s ease forwards',
    background: 'var(--bg2)',
    border: '1px solid var(--border2)',
  },
  header: {
    background: 'var(--gradient)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  headerBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  messages: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 14px',
    background: 'var(--bg)',
  },
  avatarBot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'var(--gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    marginTop: 2,
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    flexShrink: 0,
    marginTop: 2,
    border: '1px solid var(--border)',
  },
  bubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.55,
  },
  botBubble: {
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    background: 'var(--gradient)',
    color: '#ffffff',
    borderTopRightRadius: 4,
  },
  suggestion: {
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 500,
    border: '1px solid var(--border2)',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font)',
  },
  inputArea: {
    padding: '12px 14px',
    borderTop: '1px solid var(--border)',
    background: 'var(--bg2)',
    flexShrink: 0,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: '4px 4px 4px 14px',
    border: '1px solid var(--border2)',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--font)',
    padding: '8px 0',
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: 'none',
    background: 'var(--gradient)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
    flexShrink: 0,
  },
}
