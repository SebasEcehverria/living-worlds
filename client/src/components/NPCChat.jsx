
import { useEffect, useRef, useState } from 'react'
import './NPCChat.css'

const npcActions = {
  meet_elden: {
    npc: 'Elden',
    action: 'start',
    label: '📜 Accept The Whispering Forest Quest'
  },
  visit_garrick: {
    npc: 'Garrick',
    action: 'get_map',
    label: '🗺️ Receive Old Forest Map'
  },
  visit_lyra: {
    npc: 'Lyra',
    action: 'ranger_clearance',
    label: '🏹 Ask Lyra for Forest Access'
  },
  return_to_elden: {
    npc: 'Elden',
    action: 'complete',
    label: '🔮 Return the Ancient Relic'
  }
}

function NPCChat({
  npc,
  gameSaveId,
  questStep,
  onQuestAction,
  onClose
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef = useRef(null)
  const npcClass = npc.name.toLowerCase()

  const availableAction = npcActions[questStep]
  const canInteract =
    availableAction?.npc === npc.name

  // Load conversation history
  useEffect(() => {
    let cancelled = false

    const loadHistory = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/conversations/${gameSaveId}/${npc._id}`
        )

        if (!response.ok) {
          throw new Error('Failed to load conversation')
        }

        const data = await response.json()

        if (!cancelled) {
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError('Could not load conversation history.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      cancelled = true
    }
  }, [gameSaveId, npc._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  // Send AI conversation message
  const sendMessage = async (e) => {
    e.preventDefault()

    const text = input.trim()
    if (!text || sending || loading) return

    setSending(true)
    setError('')

    try {
      const response = await fetch(
        `/api/conversations/${gameSaveId}/${npc._id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: text })
        }
      )

      if (!response.ok) {
        throw new Error('Message failed')
      }

      const data = await response.json()

      setMessages(data.messages)
      setInput('')
    } catch (err) {
      console.error(err)
      setError('Could not send message. Try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div
        className="chat-window"
        role="dialog"
        aria-modal="true"
        aria-label={`Conversation with ${npc.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="chat-header">
          <div className={`chat-avatar ${npcClass}`}>
            {npc.symbol}
          </div>

          <div className="chat-character">
            <h2>{npc.name}</h2>
            <p>{npc.title} • {npc.location}</p>
          </div>

          <button
            className="chat-close"
            onClick={onClose}
            aria-label="Close conversation"
          >
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <p className="chat-notice">
              Loading conversation...
            </p>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="chat-introduction">
                  <span>{npc.symbol}</span>
                  <h3>{npc.name}</h3>
                  <p>{npc.description}</p>

                  <div className="chat-greeting">
                    "{npc.greeting}"
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={
                    message.role === 'user'
                      ? 'chat-message player-message'
                      : 'chat-message npc-message'
                  }
                >
                  <span className="message-author">
                    {message.role === 'user'
                      ? 'You'
                      : npc.name}
                  </span>

                  <p>{message.content}</p>
                </div>
              ))}

              {sending && (
                <p className="chat-notice">
                  {npc.name} is thinking...
                </p>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {error && (
          <p className="chat-error">{error}</p>
        )}

        {/* Quest interaction */}
        {canInteract && (
          <div className="quest-chat-action">
            <button
              type="button"
              disabled={sending || loading}
              onClick={() => onQuestAction(availableAction.action)}
            >
              {availableAction.label}
            </button>
          </div>
        )}

        <form
          className="chat-input-area"
          onSubmit={sendMessage}
        >
          <input
            type="text"
            placeholder={`Speak to ${npc.name}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            disabled={loading || sending}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading || sending}
          >
            {sending ? '...' : 'Send ➤'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NPCChat
