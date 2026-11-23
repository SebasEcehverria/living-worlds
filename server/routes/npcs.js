
const express = require('express');
const mongoose = require('mongoose');
const NPC = require('../models/NPC');

const router = express.Router();

// GET all NPCs
router.get('/', async (req, res) => {
  try {
    const npcs = await NPC.find()
      .select('-systemPrompt')
      .sort({ name: 1 });

    res.json(npcs);
  } catch (error) {
    console.error('NPC retrieval error:', error);

    res.status(500).json({
      error: 'Failed to retrieve NPCs.'
    });
  }
});

// GET a specific NPC
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid NPC ID.'
      });
    }

    const npc = await NPC.findById(req.params.id)
      .select('-systemPrompt');

    if (!npc) {
      return res.status(404).json({
        error: 'NPC not found.'
      });
    }

    res.json(npc);
  } catch (error) {
    console.error('NPC retrieval error:', error);

    res.status(500).json({
      error: 'Failed to retrieve NPC.'
    });
  }
});

module.exports = router;
