
const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');

const router = express.Router();

// GET all available items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });

    res.json(items);
  } catch (error) {
    console.error('Item retrieval error:', error);

    res.status(500).json({
      error: 'Failed to retrieve items.'
    });
  }
});

// GET one item
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: 'Invalid item ID.'
      });
    }

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        error: 'Item not found.'
      });
    }

    res.json(item);
  } catch (error) {
    console.error('Item retrieval error:', error);

    res.status(500).json({
      error: 'Failed to retrieve item.'
    });
  }
});

module.exports = router;
