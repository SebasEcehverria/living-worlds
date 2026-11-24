
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    description: {
      type: String,
      default: ''
    },

    type: {
      type: String,
      enum: [
        'quest',
        'equipment',
        'consumable',
        'misc'
      ],
      required: true
    },

    questItem: {
      type: Boolean,
      default: false
    },

    symbol: {
      type: String,
      default: '📦'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Item', itemSchema);
