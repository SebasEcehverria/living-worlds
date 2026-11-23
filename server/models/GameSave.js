
const mongoose = require('mongoose');

const gameSaveSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30
    },

    location: {
      type: String,
      required: true,
      default: 'village'
    },

    inventory: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }],

    questStatus: {
      type: String,
      enum: ['not_started', 'active', 'completed'],
      default: 'not_started'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('GameSave', gameSaveSchema);
