
import { useEffect, useState } from 'react'
import NPCChat from '../components/NPCChat'
import './Village.css'

function Village({ gameSave, onReturnToMenu }) {
  // NPC information
  const [npcs, setNpcs] = useState([])
  const [selectedNPC, setSelectedNPC] = useState(null)
  const [loadingNPCs, setLoadingNPCs] = useState(true)
  const [npcError, setNpcError] = useState('')

  // Player inventory
  const [inventory, setInventory] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState('')

  // Load NPCs from MongoDB
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

  // Load player inventory from MongoDB
  useEffect(() => {
    const loadInventory = async () => {
      setInventoryLoading(true)
      setInventoryError('')

      try {
        const response = await fetch(
          `/api/saves/${gameSave._id}/inventory`
        )

        if (!response.ok) {
          throw new Error('Failed to retrieve inventory')
        }

        const data = await response.json()

        setInventory(data.inventory || [])
        console.log('Inventory loaded from MongoDB:', data.inventory)
      } catch (error) {
        console.error('Inventory loading error:', error)
        setInventoryError('Could not load inventory.')
      } finally {
        setInventoryLoading(false)
      }
    }

    loadInventory()
  }, [gameSave._id])

  // Close the active NPC conversation
  const closeConversation = () => {
    setSelectedNPC(null)
  }

  return (
    <div className="village-page">

      {/* ========================= */}
      {/* VILLAGE HEADER            */}
      {/* ========================= */}

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

      {/* ========================= */}
      {/* MAIN GAME LAYOUT          */}
      {/* ========================= */}

      <div className="game-layout">

        {/* MAIN VILLAGE AREA */}
        <section className="village-main">

          {/* Village Introduction */}
          <div className="village-intro">
            <span className="village-icon">
              🏰
            </span>

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

          {/* ========================= */}
          {/* NPC CARDS                 */}
          {/* ========================= */}

          {loadingNPCs ? (
            <div className="npc-loading">
              <p>Loading villagers...</p>
            </div>
          ) : npcError ? (
            <div className="npc-loading">
              <p>{npcError}</p>

              <button
                className="secondary-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="npc-grid">

                {npcs.map((npc) => {
                  const npcClass = npc.name.toLowerCase()

                  return (
                    <button
                      key={npc._id}
                      className="npc-card"
                      onClick={() => setSelectedNPC(npc)}
                    >

                      {/* NPC Artwork */}
                      <div className={`npc-art ${npcClass}`}>
                        <span>{npc.symbol}</span>
                      </div>

                      {/* NPC Information */}
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

              {npcs.length === 0 && (
                <div className="npc-loading">
                  <p>No villagers were found.</p>
                </div>
              )}
            </>
          )}

        </section>

        {/* ========================= */}
        {/* GAME SIDEBAR              */}
        {/* ========================= */}

        <aside className="game-sidebar">

          {/* PLAYER INFORMATION */}
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

          {/* ========================= */}
          {/* QUEST JOURNAL             */}
          {/* ========================= */}

          <div className="sidebar-panel">
            <h3>📜 Quest Journal</h3>

            <p className="sidebar-description">
              {gameSave.questStatus === 'not_started'
                ? 'Your adventure has only just begun. Explore the village and meet its inhabitants.'
                : gameSave.questStatus === 'active'
                ? 'The Whispering Forest quest is active. Investigate the mysterious activity surrounding Eldermere.'
                : 'The Whispering Forest quest has been completed!'}
            </p>

            <div className="quest-status">
              Quest: {gameSave.questStatus.replaceAll('_', ' ')}
            </div>

            {gameSave.questStatus === 'active' && (
              <div className="quest-objective">
                <strong>Current Quest</strong>
                <p>The Whispering Forest</p>

                <span>
                  Investigate the forest and uncover its secrets.
                </span>
              </div>
            )}
          </div>

          {/* ========================= */}
          {/* PLAYER INVENTORY          */}
          {/* ========================= */}

          <div className="sidebar-panel">
            <h3>🎒 Inventory</h3>

            {inventoryLoading ? (
              <p className="sidebar-description">
                Loading inventory...
              </p>
            ) : inventoryError ? (
              <p className="sidebar-description">
                {inventoryError}
              </p>
            ) : inventory.length === 0 ? (
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

      {/* ========================= */}
      {/* AI NPC CONVERSATION       */}
      {/* ========================= */}

      {selectedNPC && (
        <NPCChat
          npc={selectedNPC}
          gameSaveId={gameSave._id}
          onClose={closeConversation}
        />
      )}

    </div>
  )
}

export default Village
