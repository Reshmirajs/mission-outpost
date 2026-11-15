/**
 * MISSION: OUTPOST - Crew Communication & Chat Service
 * NASA Space Apps Challenge 2026
 *
 * Real-time cross-tab synchronized messaging system using BroadcastChannel and localStorage.
 * Shared seamlessly across both the Mission Dashboard and in-game Habitat Map HUD.
 */

const CHAT_STORAGE_PREFIX = 'mission_outpost_chat_'
const CHAT_CHANNEL_NAME = 'mission_outpost_crew_chat'

/**
 * Safe BroadcastChannel initializer with fallback
 */
function getBroadcastChannel() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(CHAT_CHANNEL_NAME)
    } catch {
      return null
    }
  }
  return null
}

const chatChannel = getBroadcastChannel()

// Map of roomCode -> Set of subscriber callback functions active in the current tab/window
const subscribersByRoom = new Map()

/**
 * Notifies all active in-memory subscribers in the current tab/window.
 *
 * @param {string} roomCode
 * @param {Array<Object>} [messages]
 */
function notifyLocalSubscribers(roomCode, messages) {
  const normalized = (roomCode || 'DEFAULT').trim().toUpperCase()
  const list = messages || getChatHistory(normalized)
  const roomSubscribers = subscribersByRoom.get(normalized)
  if (roomSubscribers) {
    for (const callback of roomSubscribers) {
      try {
        callback(list)
      } catch (err) {
        console.error('Error in chat subscriber callback:', err)
      }
    }
  }
}

/**
 * Retrieves stored chat history for a specific room or global fallback.
 *
 * @param {string} [roomCode]
 * @returns {Array<Object>}
 */
export function getChatHistory(roomCode = 'DEFAULT') {
  if (typeof window === 'undefined') return []
  const key = `${CHAT_STORAGE_PREFIX}${(roomCode || 'DEFAULT').trim().toUpperCase()}`
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn('Failed to load chat history:', err)
    return []
  }
}

/**
 * Saves chat history, updates local subscribers synchronously, and broadcasts update to all active browser tabs.
 *
 * @param {string} roomCode
 * @param {Array<Object>} messages
 */
function saveAndBroadcast(roomCode, messages) {
  const normalizedCode = (roomCode || 'DEFAULT').trim().toUpperCase()
  const key = `${CHAT_STORAGE_PREFIX}${normalizedCode}`

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(messages))
      if (chatChannel) {
        chatChannel.postMessage({
          type: 'CHAT_UPDATED',
          roomCode: normalizedCode,
          timestamp: Date.now(),
        })
      }
    } catch (err) {
      console.error('Failed to save chat message:', err)
    }
  }

  // Synchronously update all local subscribers in this tab immediately
  notifyLocalSubscribers(normalizedCode, messages)
}

/**
 * Dispatches a new transmission from an astronaut to the crew chat stream.
 *
 * @param {string} roomCode
 * @param {Object} payload
 * @param {string} payload.senderId
 * @param {string} payload.senderName
 * @param {string} [payload.senderRole]
 * @param {string} payload.text
 * @returns {Object|null} The created message, or null if invalid
 */
export function sendChatMessage(roomCode = 'DEFAULT', { senderId, senderName, senderRole, text }) {
  const cleanText = (text || '').trim()
  if (!cleanText) return null

  const currentMessages = getChatHistory(roomCode)
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    roomCode: (roomCode || 'DEFAULT').trim().toUpperCase(),
    senderId: senderId || 'anon',
    senderName: senderName || 'Astronaut',
    senderRole: senderRole || 'Crew Member',
    text: cleanText.slice(0, 500),
    timestamp: Date.now(),
  }

  // Keep latest 100 messages to prevent unbounded storage
  const updatedMessages = [...currentMessages, newMessage].slice(-100)
  saveAndBroadcast(roomCode, updatedMessages)
  return newMessage
}

/**
 * Subscribes to real-time chat updates for a given room.
 *
 * @param {string} roomCode
 * @param {Function} onUpdate - Callback receiving the updated messages array
 * @returns {Function} Cleanup unsubscribe function
 */
export function subscribeToChat(roomCode = 'DEFAULT', onUpdate) {
  const normalizedCode = (roomCode || 'DEFAULT').trim().toUpperCase()

  // Register in local subscribers Set
  if (!subscribersByRoom.has(normalizedCode)) {
    subscribersByRoom.set(normalizedCode, new Set())
  }
  subscribersByRoom.get(normalizedCode).add(onUpdate)

  // Deliver current messages immediately on subscribe
  try {
    onUpdate(getChatHistory(normalizedCode))
  } catch (err) {
    console.error('Error in initial chat update:', err)
  }

  if (typeof window === 'undefined') {
    return () => {
      const set = subscribersByRoom.get(normalizedCode)
      if (set) {
        set.delete(onUpdate)
        if (set.size === 0) subscribersByRoom.delete(normalizedCode)
      }
    }
  }

  // 1. Listen via BroadcastChannel (same-origin cross-tab from OTHER tabs)
  const handleBroadcast = (event) => {
    if (event?.data?.type === 'CHAT_UPDATED' && event.data.roomCode === normalizedCode) {
      notifyLocalSubscribers(normalizedCode, getChatHistory(normalizedCode))
    }
  }

  // 2. Listen via storage event (cross-window storage change from OTHER windows)
  const handleStorage = (event) => {
    if (event.key === `${CHAT_STORAGE_PREFIX}${normalizedCode}`) {
      notifyLocalSubscribers(normalizedCode, getChatHistory(normalizedCode))
    }
  }

  if (chatChannel) {
    chatChannel.addEventListener('message', handleBroadcast)
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    const set = subscribersByRoom.get(normalizedCode)
    if (set) {
      set.delete(onUpdate)
      if (set.size === 0) subscribersByRoom.delete(normalizedCode)
    }
    if (chatChannel) {
      chatChannel.removeEventListener('message', handleBroadcast)
    }
    window.removeEventListener('storage', handleStorage)
  }
}

