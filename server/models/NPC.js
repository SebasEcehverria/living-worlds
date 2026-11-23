
const mongoose = require('mongoose');

const npcSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    title: {
      type: String,
      required: true
    },

    personality: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    location: {
      type: String,
      required: true
    },

    symbol: {
      type: String,
      required: true
    },

    greeting: {
      type: String,
      required: true
    },

    systemPrompt: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NPC', npcSchema);
