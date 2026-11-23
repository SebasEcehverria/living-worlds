
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [playerName, setPlayerName] = useState('')
  const [showNewGame, setShowNewGame] = useState(false)
  const [serverStatus, setServerStatus] = useState('Connecting...')
  const [gameSave, setGameSave] = useState(null)
  const [hasSavedGame, setHasSavedGame] = useState(
    Boolean(localStorage.getItem('livingWorldsSaveId'))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check backend connection
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error('Server unavailable')
        }

        const data = await response.json()

        setServerStatus(
          data.status === 'ok' && data.database === 'connected'
            ? 'Online'
            : 'Offline'
        )
      } catch (error) {
        console.error('Backend connection failed:', error)
        setServerStatus('Offline')
      }
    }

    checkServer()
  }, [])

  // Create a new MongoDB game save
  const startAdventure = async (e) => {
    e.preventDefault()

    if (!playerName.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerName: playerName.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create adventure')
      }

      const data = await response.json()

      // Remember the MongoDB save ID
      localStorage.setItem('livingWorldsSaveId', data._id)

      setGameSave(data)
      setHasSavedGame(true)
      setShowNewGame(false)

      console.log('Adventure created:', data)
    } catch (error) {
      console.error(error)
      setError('Could not create your adventure. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load an existing adventure
  const continueAdventure = async () => {
    const saveId = localStorage.getItem('livingWorldsSaveId')

    if (!saveId) {
      setError('No saved adventure found.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/saves/${saveId}`)

      if (!response.ok) {
        throw new Error('Failed to load adventure')
      }

      const data = await response.json()

      setGameSave(data)
      console.log('Adventure loaded:', data)
    } catch (error) {
      console.error(error)
      setError('Could not load your saved adventure.')
    } finally {
      setLoading(false)
    }
  }

  // Return to main menu
  const returnToMenu = () => {
    setGameSave(null)
    setShowNewGame(false)
    setError('')
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">⚔ Living Worlds</div>

        <div className="header-right">
          <span className="version">The Talking Village</span>

          <span className="server-status">
            <span
              className={
                serverStatus === 'Online'
                  ? 'status-dot online'
                  : 'status-dot offline'
              }
            />
            Server: {serverStatus}
          </span>
        </div>
      </header>

      <main className="main-menu">
        <div className="menu-content">

          {!gameSave ? (
            <>
              <p className="eyebrow">
                AN AI-POWERED FANTASY ADVENTURE
              </p>

              <h1>
                LIVING <span>WORLDS</span>
              </h1>

              <h2>The Talking Village</h2>

              <div className="ornament">
                ✦ ─────── ✦ ─────── ✦
              </div>

              <p className="description">
                Beyond the mist lies a village filled with secrets,
                forgotten legends, and characters who remember your story.
                Every conversation shapes your adventure.
              </p>

              {!showNewGame ? (
                <div className="menu-buttons">
                  <button
                    className="primary-button"
                    onClick={() => {
                      setError('')
                      setShowNewGame(true)
                    }}
                  >
                    ⚔ Begin Adventure
                  </button>

                  <button
                    className="secondary-button"
                    onClick={continueAdventure}
                    disabled={!hasSavedGame || loading}
                  >
                    {loading ? 'Loading...' : 'Continue Adventure'}
                  </button>
                </div>
              ) : (
                <form className="new-game" onSubmit={startAdventure}>
                  <h3>Create Your Character</h3>

                  <input
                    type="text"
                    placeholder="Enter your character name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={30}
                    required
                    disabled={loading}
                  />

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating Adventure...' : 'Enter the Village'}
                  </button>

                  <button
                    className="back-button"
                    type="button"
                    onClick={() => setShowNewGame(false)}
                  >
                    ← Back
                  </button>
                </form>
              )}

              {error && <p className="error-message">{error}</p>}
            </>
          ) : (
            <div className="adventure-screen">
              <p className="eyebrow">YOUR ADVENTURE BEGINS</p>

              <h1>Welcome, <span>{gameSave.playerName}</span></h1>

              <div className="ornament">
                ✦ ─────── ✦ ─────── ✦
              </div>

              <p className="description">
                You arrive at the gates of a mysterious village.
                The morning mist drifts between ancient stone buildings.
                Somewhere nearby, a merchant calls out to passing travelers.
              </p>

              <div className="player-card">
                <h3>⚔ Character Information</h3>

                <p>
                  <strong>Name:</strong> {gameSave.playerName}
                </p>

                <p>
                  <strong>Location:</strong> {gameSave.location}
                </p>

                <p>
                  <strong>Quest:</strong> {gameSave.questStatus}
                </p>

                <p>
                  <strong>Inventory:</strong> {gameSave.inventory.length} items
                </p>
              </div>

              <p className="coming-soon">
                The village awaits your arrival...
              </p>

              <button
                className="secondary-button"
                onClick={returnToMenu}
              >
                ← Return to Main Menu
              </button>
            </div>
          )}

        </div>
      </main>

      <footer>
        <p>Every character has a story. What will yours become?</p>
        <span>CS333 Final Project • Sebastian Echeverria</span>
      </footer>
    </div>
  )
}

export default App
