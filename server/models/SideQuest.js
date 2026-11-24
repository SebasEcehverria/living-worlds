
const mongoose = require('mongoose');

const sideQuestSchema = new mongoose.Schema(
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

    questKey: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['discovered', 'active', 'completed'],
      default: 'discovered'
    },

    objectives: [{
      description: {
        type: String,
        required: true
      },

      completed: {
        type: Boolean,
        default: false
      }
    }],

    discoveredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// One instance of each side quest per adventure
sideQuestSchema.index(
  { gameSaveId: 1, questKey: 1 },
  { unique: true }
);

module.exports = mongoose.model('SideQuest', sideQuestSchema);
