
import { useEffect, useState } from 'react'
import './Village.css'
import NPCChat from '../components/NPCChat'

function Village({ gameSave, onReturnToMenu }) {
  const [npcs, setNpcs] = useState([])
  const [selectedNPC, setSelectedNPC] = useState(null)
  const [loadingNPCs, setLoadingNPCs] = useState(true)
  const [npcError, setNpcError] = useState('')

  // Retrieve NPCs from MongoDB through Express
  useEffect(() => {
    const loadNPCs = async () => {
      setLoadingNPCs(true)
      setNpcError('')

      try {
        const response = await fetch('/api/npcs')

        if (!response.ok) {
          throw new Error('Failed to retrieve NPCs')
        }

        const data = await response.json()

        setNpcs(data)
        console.log('NPCs loaded from MongoDB:', data)
      } catch (error) {
        console.error('NPC loading error:', error)
        setNpcError('Could not load the villagers.')
      } finally {
        setLoadingNPCs(false)
      }
    }

    loadNPCs()
  }, [])

  return (
    <div className="village-page">

      {/* Village Header */}
      <div className="village-header">
        <div>
          <p className="eyebrow">WELCOME TO YOUR ADVENTURE</p>

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

      <div className="game-layout">

        {/* Main Village Area */}
        <section className="village-main">

          <div className="village-intro">
            <span className="village-icon">🏰</span>

            <h2>Village of Eldermere</h2>

            <p>
              Cobblestone paths wind between timber-framed buildings.
              Merchants prepare their stalls while travelers gather
              near the village square.
            </p>

            <p>
              Three villagers catch your attention.
              Who will you speak with first?
            </p>
          </div>

          {/* Loading State */}
          {loadingNPCs && (
            <div className="npc-loading">
              <p>Loading villagers...</p>
            </div>
          )}

          {/* Error State */}
          {npcError && (
            <div className="npc-loading">
              <p>{npcError}</p>
              <button
                className="secondary-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          )}

          {/* MongoDB NPC Cards */}
          {!loadingNPCs && !npcError && (
            <div className="npc-grid">
              {npcs.map((npc) => {
                const npcClass = npc.name.toLowerCase()

                return (
                  <button
                    key={npc._id}
                    className="npc-card"
                    onClick={() => setSelectedNPC(npc)}
                  >
                    <div className={`npc-art ${npcClass}`}>
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
                )
              })}
            </div>
          )}

          {!loadingNPCs && !npcError && npcs.length === 0 && (
            <p className="npc-loading">
              No villagers were found.
            </p>
          )}

        </section>

        {/* Player Sidebar */}
        <aside className="game-sidebar">

          {/* Player Information */}
          <div className="sidebar-panel">
            <h3>⚔ Adventurer</h3>

            <p>
              <strong>Name</strong>
              <span>{gameSave.playerName}</span>
            </p>

            <p>
              <strong>Location</strong>
              <span>Eldermere</span>
            </p>
          </div>

          {/* Quest Journal */}
          <div className="sidebar-panel">
            <h3>📜 Quest Journal</h3>

            <p className="sidebar-description">
              Your adventure has only just begun.
              Explore the village and meet its inhabitants.
            </p>

            <div className="quest-status">
              Quest: {gameSave.questStatus.replaceAll('_', ' ')}
            </div>
          </div>

          {/* Inventory */}
          <div className="sidebar-panel">
            <h3>🎒 Inventory</h3>

            {gameSave.inventory.length === 0 ? (
              <p className="sidebar-description">
                Your inventory is empty.
              </p>
            ) : (
              <p className="sidebar-description">
                You have {gameSave.inventory.length} items.
              </p>
            )}
          </div>

        </aside>
      </div>

      {/* Interactive NPC Chat */}
      {selectedNPC && (
        <NPCChat
          npc={selectedNPC}
          gameSaveId={gameSave._id}
          onClose={() => setSelectedNPC(null)}
        />
      )}
      

    </div>
  )
}

export default Village
