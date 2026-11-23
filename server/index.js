
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Game save routes
const saveRoutes = require('./routes/saves');
app.use('/api/saves', saveRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Living Worlds API!',
    status: 'running'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Living Worlds backend is running!',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB before starting Express
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log('=================================');
      console.log('    LIVING WORLDS BACKEND');
      console.log('=================================');
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

startServer();
