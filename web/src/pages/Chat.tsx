/**
 * Chat page — Phase 1 skeleton.
 *
 * This is the correct layout and structure for the ExamPrep AI chat interface.
 * The actual chat functionality (API calls, message streaming, source display)
 * will be implemented in Phase 11 (Frontend Integration).
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────┐
 * │ Header: ExamPrep AI          Subject: [DBMS ▼]      │
 * ├──────────────┬──────────────────────────────────────┤
 * │              │                                      │
 * │  + New Chat  │         Chat Messages                │
 * │              │                                      │
 * │  Recent      │  User: message                       │
 * │  Chats       │  AI: response with sources           │
 * │              │                                      │
 * │              ├──────────────────────────────────────┤
 * │              │ Ask your question...          [➤]    │
 * └──────────────┴──────────────────────────────────────┘
 */
export default function ChatPage() {
  const subjects = ['DBMS', 'CN', 'OS', 'DSA', 'TOC', 'CD']

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
            defaultValue="DBMS"
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

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          style={{
            width: '220px',
            flexShrink: 0,
            backgroundColor: '#1a1d27',
            borderRight: '1px solid #2a2d3d',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 12px',
            gap: '8px',
          }}
        >
          <button
            id="new-chat-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#6366f1',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span> New Chat
          </button>

          <div style={{ marginTop: '8px' }}>
            <p style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', padding: '0 4px' }}>
              Recent Chats
            </p>
            {/* Recent chat items — populated in Phase 9 (Chat History) */}
            {['DBMS — Normalization', 'CN — OSI Model', 'OS — Deadlocks'].map((chat) => (
              <div
                key={chat}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {chat}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main Chat Area ───────────────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* ── Messages ─────────────────────────────────────────────── */}
          <div
            id="messages-container"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Welcome state — shown when no messages */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: '16px',
                color: '#475569',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px' }}>🎓</div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#94a3b8', margin: 0 }}>
                ExamPrep AI — IIITN
              </h1>
              <p style={{ fontSize: '14px', color: '#475569', maxWidth: '400px', lineHeight: 1.6, margin: 0 }}>
                Ask me anything about your syllabus, get PYQ analysis, topic predictions, or concept explanations.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  maxWidth: '500px',
                  marginTop: '8px',
                }}
              >
                {[
                  'Explain normalization',
                  'DBMS ke important topics?',
                  'Is baar kya aa sakta hai?',
                  'PYQ frequency batao',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#1e2130',
                      border: '1px solid #2a2d3d',
                      borderRadius: '20px',
                      color: '#94a3b8',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#334155', marginTop: '16px' }}>
                ⚡ Phase 1 — UI skeleton. Chat functionality coming in Phase 11.
              </p>
            </div>
          </div>

          {/* ── Input Bar ────────────────────────────────────────────── */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #2a2d3d',
              backgroundColor: '#1a1d27',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
                backgroundColor: '#1e2130',
                border: '1px solid #2a2d3d',
                borderRadius: '12px',
                padding: '12px 16px',
              }}
            >
              <textarea
                id="chat-input"
                placeholder="Ask your question... (e.g. Normalization explain karo)"
                rows={1}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                }}
              />
              <button
                id="send-btn"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#6366f1',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
