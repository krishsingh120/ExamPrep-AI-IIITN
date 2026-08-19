import { useState, useRef, useEffect } from 'react'

/**
 * Chat page — Phase 11 & 12 Integration
 */
export default function ChatPage() {
  const subjects = ['DBMS', 'CN', 'OS', 'DSA', 'TOC', 'CD']

  const [subject, setSubject] = useState('DBMS')
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string; sources?: any[] }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate an anonymous session ID on load
    setSessionId(crypto.randomUUID())
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          subject,
          message: userMessage,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: data.answer },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: `Error: ${data.error}` },
        ])
      }
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Network error. Make sure the backend is running.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0f1117',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '60px',
          backgroundColor: '#1a1d27',
          borderBottom: '1px solid #2a2d3d',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            🎓
          </div>
          <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.02em' }}>
            ExamPrep <span style={{ color: '#6366f1' }}>AI</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              backgroundColor: '#1e2130',
              border: '1px solid #2a2d3d',
              borderRadius: '4px',
              padding: '2px 6px',
              color: '#64748b',
              letterSpacing: '0.05em',
            }}
          >
            IIITN
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#64748b' }}>Subject:</label>
          <select
            id="subject-selector"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              backgroundColor: '#1e2130',
              border: '1px solid #2a2d3d',
              borderRadius: '6px',
              color: '#e2e8f0',
              padding: '6px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '260px',
            backgroundColor: '#1a1d27',
            borderRight: '1px solid #2a2d3d',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => {
                setMessages([])
                setSessionId(crypto.randomUUID())
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4f46e5')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6366f1')}
            >
              <span>+</span> New Chat
            </button>
          </div>

          <div style={{ padding: '0 16px', marginTop: '10px' }}>
            <h3
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                color: '#64748b',
                letterSpacing: '0.05em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Recent Chats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1e2130',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  borderLeft: '2px solid #6366f1',
                }}
              >
                Current Session
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backgroundColor: '#0f1117',
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#1a1d27',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  👋
                </div>
                <h2>How can I help you prepare?</h2>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => setInput('Explain normalization')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1e2130',
                      border: '1px solid #2a2d3d',
                      borderRadius: '20px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    "Explain normalization"
                  </button>
                  <button
                    onClick={() => setInput(`${subject} mein is baar kya aa sakta hai?`)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#1e2130',
                      border: '1px solid #2a2d3d',
                      borderRadius: '20px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    "{subject} predictions"
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  {msg.role === 'ai' && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      🎓
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: msg.role === 'user' ? '#6366f1' : '#1a1d27',
                      padding: '16px',
                      borderRadius: '12px',
                      borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
                      borderTopLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      color: msg.role === 'user' ? '#ffffff' : '#e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  🎓
                </div>
                <div
                  style={{
                    backgroundColor: '#1a1d27',
                    padding: '16px',
                    borderRadius: '12px',
                    borderTopLeftRadius: '4px',
                    fontSize: '14px',
                    color: '#94a3b8',
                  }}
                >
                  <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '24px',
              backgroundColor: '#0f1117',
              borderTop: '1px solid #1e2130',
            }}
          >
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1a1d27',
                border: '1px solid #2a2d3d',
                borderRadius: '12px',
                padding: '8px',
                alignItems: 'flex-end',
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your question..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  padding: '10px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  maxHeight: '150px',
                  minHeight: '24px',
                }}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  backgroundColor: input.trim() && !isLoading ? '#6366f1' : '#2a2d3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                  marginBottom: '2px',
                  marginRight: '2px',
                }}
              >
                ➤
              </button>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: '#64748b',
                marginTop: '12px',
              }}
            >
              AI can make mistakes. Always verify with official course material.
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
