
const mongoose = require('mongoose');

// Individual chat messages
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

// Conversation between a player and an NPC
const conversationSchema = new mongoose.Schema(
  {
    gameSaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GameSave',
      required: true
    },

    npcId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NPC',
      required: true
    },

    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Only one conversation per player save and NPC
conversationSchema.index(
  { gameSaveId: 1, npcId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'Conversation',
  conversationSchema
);
