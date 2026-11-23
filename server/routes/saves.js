
const express = require('express');
const mongoose = require('mongoose');
const GameSave = require('../models/GameSave');

const router = express.Router();

// CREATE a new adventure
router.post('/', async (req, res) => {
  try {
    const { playerName } = req.body;

    if (
      typeof playerName !== 'string' ||
      !playerName.trim() ||
      playerName.trim().length > 30
    ) {
      return res.status(400).json({
        error: 'Player name must contain 1-30 characters.'
      });
    }

    const gameSave = await GameSave.create({
      playerName: playerName.trim()
    });

    res.status(201).json(gameSave);
  } catch (error) {
    console.error('Create save error:', error);
    res.status(500).json({
      error: 'Failed to create adventure.'
    });
  }
});

// READ a saved adventure
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const gameSave = await GameSave.findById(req.params.id);

    if (!gameSave) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    res.json(gameSave);
  } catch (error) {
    console.error('Load save error:', error);
    res.status(500).json({
      error: 'Failed to load adventure.'
    });
  }
});

module.exports = router;
