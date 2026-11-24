
import { useEffect, useState } from 'react'
import NPCChat from '../components/NPCChat'
import './Village.css'
import './Quest.css'

const objectives = {
  meet_elden: 'Speak with Elden at the Ancient Library.',
  visit_garrick: 'Visit Garrick and obtain the Old Forest Map.',
  visit_lyra: 'Show Lyra the map at the Forest Gate.',
  explore_shrine: 'Explore the forest and recover the Ancient Relic.',
  return_to_elden: 'Return the Ancient Relic to Elden.',
  completed: 'The Whispering Forest has been completed!'
}

function Village({ gameSave, onReturnToMenu }) {
  const [npcs, setNpcs] = useState([])
  const [selectedNPC, setSelectedNPC] = useState(null)

  const [save, setSave] = useState(gameSave)
  const [inventory, setInventory] = useState([])

  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  const [error, setError] = useState('')
  const [notification, setNotification] = useState('')

  // Load current player and NPC information
  useEffect(() => {
    let cancelled = false

    const loadGame = async () => {
      try {
        const [npcResponse, saveResponse, inventoryResponse] =
          await Promise.all([
            fetch('/api/npcs'),
            fetch(`/api/saves/${gameSave._id}`),
            fetch(`/api/saves/${gameSave._id}/inventory`)
          ])

        if (
          !npcResponse.ok ||
          !saveResponse.ok ||
          !inventoryResponse.ok
        ) {
          throw new Error('Failed to load village data')
        }

        const [npcData, saveData, inventoryData] =
          await Promise.all([
            npcResponse.json(),
            saveResponse.json(),
            inventoryResponse.json()
          ])

        if (!cancelled) {
          setNpcs(npcData)
          setSave(saveData)
          setInventory(inventoryData.inventory || [])
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError('Could not load village data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGame()

    return () => {
      cancelled = true
    }
  }, [gameSave._id])

  // Determine quest stage, including older saves
  let questStep = save.questStep

  if (!questStep) {
    if (save.questStatus === 'completed') {
      questStep = 'completed'
    } else if (save.questStatus === 'active') {
      const hasMap = inventory.some(
        item => item.name === 'Old Forest Map'
      )

      questStep = hasMap ? 'visit_lyra' : 'visit_garrick'
    } else {
      questStep = 'meet_elden'
    }
  }

  // Perform a game-controlled quest action
  const performQuestAction = async (action) => {
    if (acting) return

    setActing(true)
    setError('')
    setNotification('')

    try {
      const response = await fetch(
        `/api/saves/${gameSave._id}/quest/action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Quest action failed')
      }

      setSave(data.gameSave)
      setInventory(data.gameSave.inventory || [])
      setNotification(data.message)
      setSelectedNPC(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="village-page">

      {/* Header */}
      <div className="village-header">
        <div>
          <p className="eyebrow">
            WELCOME TO YOUR ADVENTURE
          </p>

          <h1>The Talking Village</h1>

          <p className="village-subtitle">
            A peaceful settlement surrounded by ancient mysteries.
          </p>
        </div>

        <button
          className="village-menu-button"
          onClick={onReturnToMenu}
        >
          ← Main Menu
        </button>
      </div>

      {notification && (
        <div className="quest-notification" role="status">
          ✦ {notification}
          <button
            onClick={() => setNotification('')}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="quest-error" role="alert">
          {error}
          <button
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <div className="game-layout">

        {/* Village */}
        <section className="village-main">
          <div className="village-intro">
            <span className="village-icon">🏰</span>

            <h2>Village of Eldermere</h2>

            <p>
              Cobblestone paths wind between timber-framed buildings.
              Merchants prepare their stalls while travelers
              gather near the village square.
            </p>

            <p>
              Three villagers catch your attention.
              Who will you speak with first?
            </p>
          </div>

          {loading ? (
            <div className="npc-loading">
              Loading villagers...
            </div>
          ) : (
            <div className="npc-grid">
              {npcs.map((npc) => (
                <button
                  key={npc._id}
                  className="npc-card"
                  onClick={() => setSelectedNPC(npc)}
                >
                  <div
                    className={`npc-art ${npc.name.toLowerCase()}`}
                  >
                    <span>{npc.symbol}</span>
                  </div>

                  <div className="npc-info">
                    <span className="npc-location">
                      {npc.location}
                    </span>

                    <h3>{npc.name}</h3>

                    <p className="npc-title">
                      {npc.title}
                    </p>

                    <span className="npc-action">
                      Speak with {npc.name} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Forest location */}
          {questStep === 'explore_shrine' && (
            <div className="forest-location">
              <span className="forest-symbol">🌲</span>

              <div>
                <h3>The Abandoned Shrine</h3>

                <p>
                  Following Lyra's directions, you discover
                  an ancient shrine hidden among the trees.
                  A mysterious blue light glows inside.
                </p>
              </div>

              <button
                className="primary-button"
                disabled={acting}
                onClick={() => performQuestAction('collect_relic')}
              >
                🔮 Recover Ancient Relic
              </button>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="game-sidebar">

          {/* Player */}
          <div className="sidebar-panel">
            <h3>⚔ Adventurer</h3>

            <p>
              <strong>Name</strong>
              <span>{save.playerName}</span>
            </p>

            <p>
              <strong>Location</strong>
              <span>Eldermere</span>
            </p>
          </div>

          {/* Quest */}
          <div className="sidebar-panel">
            <h3>📜 Quest Journal</h3>

            <div className="quest-name">
              The Whispering Forest
            </div>

            <div className="quest-status">
              Status: {save.questStatus.replaceAll('_', ' ')}
            </div>

            <p className="sidebar-description">
              {objectives[questStep]}
            </p>

            <div className="quest-progress">
              {[
                'meet_elden',
                'visit_garrick',
                'visit_lyra',
                'explore_shrine',
                'return_to_elden'
              ].map((step, index) => {
                const allSteps = [
                  'meet_elden',
                  'visit_garrick',
                  'visit_lyra',
                  'explore_shrine',
                  'return_to_elden',
                  'completed'
                ]

                const complete =
                  allSteps.indexOf(questStep) > index

                return (
                  <div
                    key={step}
                    className={
                      complete
                        ? 'quest-step done'
                        : step === questStep
                        ? 'quest-step current'
                        : 'quest-step'
                    }
                  >
                    {complete ? '✓' : '○'}
                    <span>{objectives[step]}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inventory */}
          <div className="sidebar-panel">
            <h3>🎒 Inventory</h3>

            {inventory.length === 0 ? (
              <p className="sidebar-description">
                Your inventory is empty.
              </p>
            ) : (
              <div className="inventory-list">
                {inventory.map((item) => (
                  <div
                    key={item._id}
                    className="inventory-item"
                    title={item.description}
                  >
                    <span className="inventory-symbol">
                      {item.symbol}
                    </span>

                    <div className="inventory-details">
                      <strong>{item.name}</strong>

                      <span>
                        {item.questItem
                          ? 'Quest Item'
                          : item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* AI NPC Chat */}
      {selectedNPC && (
        <NPCChat
          npc={selectedNPC}
          gameSaveId={save._id}
          questStep={questStep}
          onQuestAction={performQuestAction}
          onClose={() => setSelectedNPC(null)}
        />
      )}

    </div>
  )
}

export default Village
