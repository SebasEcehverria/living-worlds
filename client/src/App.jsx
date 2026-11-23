
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // Player information
  const [playerName, setPlayerName] = useState('')
  const [showNewGame, setShowNewGame] = useState(false)

  // Backend connection status
  const [serverStatus, setServerStatus] = useState('Connecting...')

  // Check connection to Express backend
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('/api/health')

        if (!response.ok) {
          throw new Error('Server unavailable')
        }

        const data = await response.json()

        if (data.status === 'ok') {
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

  // Start a new adventure
  const startAdventure = (e) => {
    e.preventDefault()

    if (!playerName.trim()) return

    // Temporary placeholder until MongoDB is connected
    alert(`Welcome to Living Worlds, ${playerName.trim()}!`)
  }

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

          {/* Main Menu Buttons */}
          {!showNewGame ? (
            <div className="menu-buttons">

              <button
                className="primary-button"
                onClick={() => setShowNewGame(true)}
              >
                ⚔ Begin Adventure
              </button>

              <button
                className="secondary-button"
                disabled
                title="Available after game saves are implemented"
              >
                Continue Adventure
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
              />

              <button
                className="primary-button"
                type="submit"
              >
                Enter the Village
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
