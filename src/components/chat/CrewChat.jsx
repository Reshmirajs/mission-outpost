import { useState, useEffect, useRef } from 'react'
import { subscribeToChat, sendChatMessage } from '../../services/chat/chatService.js'
import './CrewChat.css'

/**
 * CrewChat Component
 *
 * Real-time messaging interface for MISSION: OUTPOST crew members.
 * Supports:
 * - Real-time synchronization across browser tabs
 * - Scrollable message history with auto-scroll to newest message
 * - Enter-to-send message input
 * - Sender name, role badge, timestamp
 * - Clean empty state when no transmissions exist
 * - Compact mode for in-game Phaser map floating drawer
 */
export default function CrewChat({
  roomCode = 'DEFAULT',
  currentPlayer = null,
  compact = false,
  onClose = null,
  onMinimize = null,
  isMinimized = false,
  onHeaderPointerDown = null,
}) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Persistent client session id for unauthenticated/test tabs
  const [localFallbackId] = useState(() => {
    if (typeof window === 'undefined') return 'local_user'
    try {
      let tempId = window.sessionStorage.getItem('mission_outpost_chat_sender_id')
      if (!tempId) {
        tempId = `astro_${Math.random().toString(36).substring(2, 9)}`
        window.sessionStorage.setItem('mission_outpost_chat_sender_id', tempId)
      }
      return tempId
    } catch {
      return 'local_user'
    }
  })

  // Resolve current player name, role, and persistent identifier
  const resolvedName = currentPlayer?.name || 'Astronaut'
  const resolvedRole = currentPlayer?.role || 'Mission Specialist'
  const resolvedId = currentPlayer?.id || localFallbackId

  // Subscribe to real-time chat updates
  useEffect(() => {
    const unsubscribe = subscribeToChat(roomCode, (updatedMessages) => {
      setMessages(updatedMessages || [])
    })

    return () => {
      unsubscribe()
    }
  }, [roomCode])

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    if (e) e.preventDefault()
    const clean = inputText.trim()
    if (!clean) return

    const sentMessage = sendChatMessage(roomCode, {
      senderId: resolvedId,
      senderName: resolvedName,
      senderRole: resolvedRole,
      text: clean,
    })

    if (sentMessage) {
      setInputText('')
      // Optimistically add to messages so sender sees it immediately
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === sentMessage.id)) return prev
        return [...prev, sentMessage]
      })
    }

    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTimestamp = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // If compact floating drawer is minimized, render the small sleek mini-pill
  if (compact && isMinimized) {
    const latestMsg = messages[messages.length - 1]
    return (
      <div
        className="crew-chat-mini-pill"
        onPointerDown={onHeaderPointerDown}
        onClick={() => onMinimize && onMinimize()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onMinimize?.()
          }
        }}
        title="Crew Chat (Minimized) — Click to expand, drag header to move"
      >
        <span className="chat-drag-grip" aria-hidden="true">⠿</span>
        <span className="chat-live-pulse-dot" aria-hidden="true" />
        <span className="mini-pill-title">CREW CHAT</span>
        {latestMsg ? (
          <span className="mini-pill-snippet">
            <strong>{latestMsg.senderName}:</strong> {latestMsg.text}
          </span>
        ) : (
          <span className="mini-pill-snippet">Standby</span>
        )}
        <div className="mini-pill-actions">
          <button
            type="button"
            className="mini-pill-btn-expand"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize?.()
            }}
            title="Expand chat window"
            aria-label="Expand chat"
          >
            ⤢
          </button>
          {onClose && (
            <button
              type="button"
              className="mini-pill-btn-close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              title="Close chat"
              aria-label="Close chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`crew-chat-container ${compact ? 'is-compact' : ''}`}>
      {/* Panel Header */}
      <div
        className={`crew-chat-header ${onHeaderPointerDown ? 'is-draggable' : ''}`}
        onPointerDown={onHeaderPointerDown}
        title={onHeaderPointerDown ? 'Click and drag to move chat window' : undefined}
      >
        <div className="crew-chat-title-group">
          {onHeaderPointerDown && (
            <span className="chat-drag-grip" aria-hidden="true" title="Drag to move">
              ⠿
            </span>
          )}
          <span className="chat-live-pulse-dot" aria-hidden="true" />
          <h3 className="crew-chat-title">CREW CHAT</h3>
          <span className="chat-room-badge font-mono">
            {roomCode ? `#${roomCode}` : '#OUTPOST'}
          </span>
        </div>
        <div className="crew-chat-header-actions">
          {compact && onMinimize && (
            <button
              type="button"
              className="btn-chat-minimize"
              onClick={(e) => {
                e.stopPropagation()
                onMinimize()
              }}
              title="Minimize chat"
              aria-label="Minimize chat"
            >
              —
            </button>
          )}
          {compact && onClose && (
            <button
              type="button"
              className="btn-chat-close"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              title="Close chat window"
              aria-label="Close chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="crew-chat-messages-stream" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="crew-chat-empty-state">
            <span className="empty-chat-icon" aria-hidden="true">📡</span>
            <p className="empty-chat-title">NO COMMS TRAFFIC</p>
            <p className="empty-chat-subtext">
              Channel clear. Send a transmission to coordinate with your Mars squad.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === resolvedId
            return (
              <div
                key={msg.id}
                className={`crew-chat-message-row ${isMe ? 'is-outgoing' : 'is-incoming'}`}
              >
                <div className="message-meta-header">
                  <span className="message-sender-name">{msg.senderName}</span>
                  {msg.senderRole && (
                    <span className="message-sender-role">{msg.senderRole}</span>
                  )}
                  <span className="message-timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <div className="message-bubble-content">
                  <p className="message-text">{msg.text}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSend}
        className="crew-chat-input-form"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          className="crew-chat-input"
          placeholder="Transmit to squad... [Enter]"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            handleKeyDown(e)
          }}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          maxLength={500}
        />
        <button
          type="submit"
          className="btn-crew-chat-send"
          disabled={!inputText.trim()}
          title="Send transmission"
        >
          Send
        </button>
      </form>
    </div>
  )
}

