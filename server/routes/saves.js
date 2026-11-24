
const express = require('express');
const mongoose = require('mongoose');
const GameSave = require('../models/GameSave');
const Item = require('../models/Item');

const router = express.Router();


// GET a player's inventory
router.get('/:id/inventory', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Invalid game save ID.'
        });
      }
  
      // Find saved game and populate its inventory
      const gameSave = await GameSave.findById(id)
        .populate('inventory');
  
      if (!gameSave) {
        return res.status(404).json({
          error: 'Game save not found.'
        });
      }
  
      res.json({
        playerName: gameSave.playerName,
        inventory: gameSave.inventory
      });
  
    } catch (error) {
      console.error('Inventory retrieval error:', error);
  
      res.status(500).json({
        error: 'Failed to retrieve inventory.'
      });
    }
  });
  


// POST - Start The Whispering Forest quest
router.post('/:id/quest/start', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Invalid game save ID.'
        });
      }
  
      // Only start quests that have not already begun
      const gameSave = await GameSave.findOneAndUpdate(
        {
          _id: id,
          questStatus: 'not_started'
        },
        {
          $set: {
            questStatus: 'active'
          }
        },
        {
          new: true,
          runValidators: true
        }
      );
  
      if (!gameSave) {
        const existingSave = await GameSave.findById(id);
  
        if (!existingSave) {
          return res.status(404).json({
            error: 'Game save not found.'
          });
        }
  
        return res.status(409).json({
          error: 'Quest has already been started or completed.',
          questStatus: existingSave.questStatus
        });
      }
  
      res.json({
        message: 'The Whispering Forest quest has begun!',
        gameSave
      });
  
    } catch (error) {
      console.error('Quest start error:', error);
  
      res.status(500).json({
        error: 'Failed to start quest.'
      });
    }
  });
  

// POST - Receive the Old Forest Map from Garrick
router.post('/:id/quest/map', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          error: 'Invalid game save ID.'
        });
      }
  
      // Find the map in MongoDB
      const map = await Item.findOne({
        name: 'Old Forest Map'
      });
  
      if (!map) {
        return res.status(500).json({
          error: 'Old Forest Map is missing from the database.'
        });
      }
  
      // Only active quests can receive the map.
      // Do not award duplicates.
      const gameSave = await GameSave.findOneAndUpdate(
        {
          _id: id,
          questStatus: 'active',
          inventory: { $ne: map._id }
        },
        {
          $addToSet: {
            inventory: map._id
          }
        },
        {
          new: true,
          runValidators: true
        }
      ).populate('inventory');
  
      if (!gameSave) {
        const existingSave = await GameSave.findById(id);
  
        if (!existingSave) {
          return res.status(404).json({
            error: 'Game save not found.'
          });
        }
  
        if (existingSave.questStatus !== 'active') {
          return res.status(409).json({
            error: 'The quest must be active to receive this item.'
          });
        }
  
        return res.status(409).json({
          error: 'You already have the Old Forest Map.'
        });
      }
  
      res.json({
        message: 'Garrick gave you the Old Forest Map!',
        item: map,
        gameSave
      });
  
    } catch (error) {
      console.error('Map collection error:', error);
  
      res.status(500).json({
        error: 'Failed to collect the Old Forest Map.'
      });
    }
  });
  


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
