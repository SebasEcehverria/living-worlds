
import { useEffect, useState } from 'react'
import Village from './pages/Village'
import './App.css'

function App() {
  // Player information
  const [playerName, setPlayerName] = useState('')
  const [showNewGame, setShowNewGame] = useState(false)

  // Backend connection
  const [serverStatus, setServerStatus] = useState('Connecting...')

  // Game save information
  const [gameSave, setGameSave] = useState(null)
  const [hasSavedGame, setHasSavedGame] = useState(
    Boolean(localStorage.getItem('livingWorldsSaveId'))
  )

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check backend and MongoDB connection
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error('Server unavailable')
        }

        const data = await response.json()

        if (data.status === 'ok' && data.database === 'connected') {
          setServerStatus('Online')
          console.log('Living Worlds backend connected!')
        } else {
          setServerStatus('Offline')
        }
      } catch (error) {
        console.error('Backend connection failed:', error)
        setServerStatus('Offline')
      }
    }

    checkServer()
  }, [])

  // Create a new adventure in MongoDB
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

      // Remember the saved game's ID
      localStorage.setItem('livingWorldsSaveId', data._id)

      setGameSave(data)
      setHasSavedGame(true)
      setShowNewGame(false)

      console.log('Adventure created:', data)
    } catch (error) {
      console.error('Create adventure error:', error)
      setError('Could not create your adventure. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Continue an existing MongoDB adventure
  const continueAdventure = async () => {
    const saveId = localStorage.getItem('livingWorldsSaveId')

    if (!saveId) {
      setError('No saved adventure was found.')
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
      console.error('Load adventure error:', error)
      setError('Could not load your saved adventure.')
    } finally {
      setLoading(false)
    }
  }

  // Return to the main menu without deleting the game
  const returnToMenu = () => {
    setGameSave(null)
    setShowNewGame(false)
    setError('')
  }

  // Display the Village when an adventure is active
  if (gameSave) {
    return (
      <div className="app">
        <Village
          gameSave={gameSave}
          onReturnToMenu={returnToMenu}
        />
      </div>
    )
  }

  // Display the main menu
  return (
    <div className="app">

      {/* Navigation Bar */}
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

      {/* Main Menu */}
      <main className="main-menu">
        <div className="menu-content">

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

              {/* Start New Game */}
              <button
                className="primary-button"
                onClick={() => {
                  setError('')
                  setShowNewGame(true)
                }}
              >
                ⚔ Begin Adventure
              </button>

              {/* Continue Existing Game */}
              <button
                className="secondary-button"
                onClick={continueAdventure}
                disabled={!hasSavedGame || loading}
              >
                {loading ? 'Loading...' : 'Continue Adventure'}
              </button>

            </div>
          ) : (

            /* Character Creation */
            <form
              className="new-game"
              onSubmit={startAdventure}
            >
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

          {/* Error Messages */}
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer>
        <p>
          Every character has a story. What will yours become?
        </p>

        <span>
          CS333 Final Project • Sebastian Echeverria
        </span>
      </footer>

    </div>
  )
}

export default App
