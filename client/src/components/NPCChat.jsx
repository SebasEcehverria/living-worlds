
import { useEffect, useRef, useState } from 'react'
import './NPCChat.css'
import './SideQuests.css'

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
  const [quests, setQuests] = useState([])
  const [input, setInput] = useState('')

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const messagesEndRef = useRef(null)
  const npcClass = npc.name.toLowerCase()

  const mainQuestAction = npcActions[questStep]
  const canInteract = mainQuestAction?.npc === npc.name

  // Load conversation and quest history
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
          setQuests(data.quests || [])
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

  // Send message to Qwen
  const sendMessage = async (e) => {
    e.preventDefault()

    const text = input.trim()
    if (!text || sending || loading) return

    setSending(true)
    setError('')
    setNotice('')

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

      setMessages(data.messages || [])
      setQuests(data.quests || [])
      setInput('')

      if (
        data.discoveredQuest &&
        data.discoveredQuest.status === 'discovered'
      ) {
        setNotice(
          `New quest discovered: ${data.discoveredQuest.title}`
        )
      }
    } catch (err) {
      console.error(err)
      setError('Could not send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Accept a discovered side quest
  const acceptQuest = async (quest) => {
    if (accepting) return

    setAccepting(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(
        `/api/conversations/${gameSaveId}/${npc._id}/quests/${quest.questKey}/accept`,
        {
          method: 'POST'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Could not accept quest')
      }

      setQuests(current =>
        current.map(item =>
          item._id === data.quest._id
            ? data.quest
            : item
        )
      )

      setNotice(data.message)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setAccepting(false)
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
        {/* Character header */}
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

        {/* Conversation messages */}
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

        {/* Feedback */}
        {notice && (
          <div className="sidequest-notice" role="status">
            ✦ {notice}
          </div>
        )}

        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}

        {/* Side quests */}
        {quests.length > 0 && (
          <div className="sidequest-panel">
            {quests.map(quest => (
              <div
                key={quest._id}
                className="sidequest-offer"
              >
                <div className="sidequest-heading">
                  <span>✦ SIDE QUEST</span>
                  <span className="sidequest-status">
                    {quest.status}
                  </span>
                </div>

                <h3>{quest.title}</h3>
                <p>{quest.description}</p>

                {quest.status === 'discovered' && (
                  <button
                    type="button"
                    disabled={accepting}
                    onClick={() => acceptQuest(quest)}
                  >
                    {accepting ? 'Accepting...' : 'Accept Quest'}
                  </button>
                )}

                {quest.status === 'active' && (
                  <div className="sidequest-objectives">
                    {quest.objectives.map((objective, index) => (
                      <div key={index}>
                        {objective.completed ? '✓' : '○'}
                        {' '}{objective.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Existing main quest action */}
        {canInteract && (
          <div className="quest-chat-action">
            <button
              type="button"
              disabled={sending || loading}
              onClick={() => onQuestAction(mainQuestAction.action)}
            >
              {mainQuestAction.label}
            </button>
          </div>
        )}

        {/* Player input */}
        <form
          className="chat-input-area"
          onSubmit={sendMessage}
        >
          <input
            type="text"
            placeholder={`Speak to ${npc.name}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
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
