
const express = require('express');
const mongoose = require('mongoose');

const GameSave = require('../models/GameSave');
const Item = require('../models/Item');
const Conversation = require('../models/Conversation');

const router = express.Router();

const validId = (id) => mongoose.isValidObjectId(id);

// Determine progress for older saves
function getQuestStep(save) {
  if (save.questStep) return save.questStep;

  if (save.questStatus === 'completed') {
    return 'completed';
  }

  if (save.questStatus === 'not_started') {
    return 'meet_elden';
  }

  return 'visit_garrick';
}

// CREATE a new game
router.post('/', async (req, res) => {
  try {
    const { playerName } = req.body || {};

    if (
      typeof playerName !== 'string' ||
      !playerName.trim() ||
      playerName.trim().length > 30
    ) {
      return res.status(400).json({
        error: 'Player name must contain 1-30 characters.'
      });
    }

    const save = await GameSave.create({
      playerName: playerName.trim(),
      questStep: 'meet_elden'
    });

    res.status(201).json(save);
  } catch (error) {
    console.error('Create save error:', error);

    res.status(500).json({
      error: 'Failed to create adventure.'
    });
  }
});

// GET player's inventory
router.get('/:id/inventory', async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const save = await GameSave.findById(req.params.id)
      .populate('inventory');

    if (!save) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    res.json({
      playerName: save.playerName,
      inventory: save.inventory
    });
  } catch (error) {
    console.error('Inventory error:', error);

    res.status(500).json({
      error: 'Failed to load inventory.'
    });
  }
});

// POST a quest action
router.post('/:id/quest/action', async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const { action } = req.body || {};

    const allowedActions = [
      'start',
      'get_map',
      'ranger_clearance',
      'collect_relic',
      'complete'
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        error: 'Invalid quest action.'
      });
    }

    const save = await GameSave.findById(req.params.id);

    if (!save) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    // Handle existing saves created before questStep
    if (!save.questStep) {
      save.questStep = getQuestStep(save);

      if (save.questStatus === 'active') {
        const oldMap = await Item.findOne({
          name: 'Old Forest Map'
        });

        if (
          oldMap &&
          save.inventory.some(
            id => id.toString() === oldMap._id.toString()
          )
        ) {
          save.questStep = 'visit_lyra';
        }
      }
    }

    const currentStep = save.questStep;
    let message = '';
    let awardedItem = null;

    // Step 1: Elden starts the quest
    if (action === 'start') {
      if (
        save.questStatus !== 'not_started' ||
        currentStep !== 'meet_elden'
      ) {
        return res.status(409).json({
          error: 'This quest has already started.'
        });
      }

      save.questStatus = 'active';
      save.questStep = 'visit_garrick';

      message =
        'Elden has entrusted you with investigating the Whispering Forest.';
    }

    // Step 2: Garrick gives the map
    else if (action === 'get_map') {
      if (
        save.questStatus !== 'active' ||
        currentStep !== 'visit_garrick'
      ) {
        return res.status(409).json({
          error: 'You are not ready to receive the map.'
        });
      }

      const map = await Item.findOne({
        name: 'Old Forest Map'
      });

      if (!map) {
        return res.status(500).json({
          error: 'Old Forest Map is missing.'
        });
      }

      if (!save.inventory.some(id => id.equals(map._id))) {
        save.inventory.push(map._id);
      }

      save.questStep = 'visit_lyra';
      awardedItem = map;

      message = 'Garrick gave you the Old Forest Map!';
    }

    // Step 3: Lyra grants access
    else if (action === 'ranger_clearance') {
      if (
        save.questStatus !== 'active' ||
        currentStep !== 'visit_lyra'
      ) {
        return res.status(409).json({
          error: 'You must obtain the map before visiting Lyra.'
        });
      }

      const map = await Item.findOne({
        name: 'Old Forest Map'
      });

      if (
        !map ||
        !save.inventory.some(id => id.equals(map._id))
      ) {
        return res.status(409).json({
          error: 'The Old Forest Map is required.'
        });
      }

      save.questStep = 'explore_shrine';

      message =
        'Lyra has shown you the safe path to the abandoned shrine.';
    }

    // Step 4: Collect the relic
    else if (action === 'collect_relic') {
      if (
        save.questStatus !== 'active' ||
        currentStep !== 'explore_shrine'
      ) {
        return res.status(409).json({
          error: 'The forest shrine is not accessible yet.'
        });
      }

      const relic = await Item.findOne({
        name: 'Ancient Relic'
      });

      if (!relic) {
        return res.status(500).json({
          error: 'Ancient Relic is missing.'
        });
      }

      if (!save.inventory.some(id => id.equals(relic._id))) {
        save.inventory.push(relic._id);
      }

      save.questStep = 'return_to_elden';
      awardedItem = relic;

      message = 'You recovered the Ancient Relic!';
    }

    // Step 5: Complete the quest
    else if (action === 'complete') {
      if (
        save.questStatus !== 'active' ||
        currentStep !== 'return_to_elden'
      ) {
        return res.status(409).json({
          error: 'You must recover the relic first.'
        });
      }

      const relic = await Item.findOne({
        name: 'Ancient Relic'
      });

      if (
        !relic ||
        !save.inventory.some(id => id.equals(relic._id))
      ) {
        return res.status(409).json({
          error: 'You do not have the Ancient Relic.'
        });
      }

      // Deliver the relic to Elden
      save.inventory = save.inventory.filter(
        id => !id.equals(relic._id)
      );

      save.questStatus = 'completed';
      save.questStep = 'completed';

      message =
        'Quest Complete! You returned the Ancient Relic to Elden.';
    }

    await save.save();
    await save.populate('inventory');

    res.json({
      message,
      awardedItem,
      gameSave: save
    });
  } catch (error) {
    console.error('Quest action error:', error);

    res.status(500).json({
      error: 'Failed to perform quest action.'
    });
  }
});

// Keep the previous quest-start endpoint
router.post('/:id/quest/start', async (req, res) => {
  req.body = { action: 'start' };
  // Redirect internally through HTTP semantics
  res.redirect(307, `/api/saves/${req.params.id}/quest/action`);
});

// Keep the previous map endpoint
router.post('/:id/quest/map', async (req, res) => {
  req.body = { action: 'get_map' };
  res.status(410).json({
    error: 'Use POST /api/saves/:id/quest/action with action get_map.'
  });
});

// READ a game save
router.get('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const save = await GameSave.findById(req.params.id);

    if (!save) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    res.json({
      ...save.toObject(),
      questStep: getQuestStep(save)
    });
  } catch (error) {
    console.error('Load save error:', error);

    res.status(500).json({
      error: 'Failed to load adventure.'
    });
  }
});

// UPDATE a player's name
router.put('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const { playerName } = req.body || {};

    if (
      typeof playerName !== 'string' ||
      !playerName.trim() ||
      playerName.trim().length > 30
    ) {
      return res.status(400).json({
        error: 'Player name must contain 1-30 characters.'
      });
    }

    const save = await GameSave.findByIdAndUpdate(
      req.params.id,
      { $set: { playerName: playerName.trim() } },
      { new: true, runValidators: true }
    );

    if (!save) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    res.json(save);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update adventure.'
    });
  }
});

// DELETE a saved adventure and its conversations
router.delete('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid save ID.'
      });
    }

    const save = await GameSave.findByIdAndDelete(req.params.id);

    if (!save) {
      return res.status(404).json({
        error: 'Adventure not found.'
      });
    }

    await Conversation.deleteMany({
      gameSaveId: save._id
    });

    res.json({
      message: 'Adventure deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete adventure.'
    });
  }
});

module.exports = router;
