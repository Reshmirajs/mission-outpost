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
}) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Resolve current player name and role
  const resolvedName = currentPlayer?.name || 'Astronaut'
  const resolvedRole = currentPlayer?.role || 'Mission Specialist'
  const resolvedId = currentPlayer?.id || 'local_user'

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

    sendChatMessage(roomCode, {
      senderId: resolvedId,
      senderName: resolvedName,
      senderRole: resolvedRole,
      text: clean,
    })

    setInputText('')
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

  return (
    <div className={`crew-chat-container ${compact ? 'is-compact' : ''}`}>
      {/* Panel Header */}
      <div className="crew-chat-header">
        <div className="crew-chat-title-group">
          <span className="chat-live-pulse-dot" aria-hidden="true" />
          <h3 className="crew-chat-title">CREW CHAT</h3>
          <span className="chat-room-badge font-mono">
            {roomCode ? `#${roomCode}` : '#OUTPOST'}
          </span>
        </div>
        {compact && onClose && (
          <button
            type="button"
            className="btn-chat-close"
            onClick={onClose}
            title="Close chat drawer"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
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

