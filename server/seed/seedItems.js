
require('dotenv').config();

const mongoose = require('mongoose');
const Item = require('../models/Item');

const items = [
  {
    name: 'Old Forest Map',
    description:
      'A weathered parchment map showing forgotten paths ' +
      'through the forest surrounding Eldermere. ' +
      'A small red mark identifies an abandoned shrine.',
    type: 'quest',
    questItem: true,
    symbol: '🗺️'
  },

  {
    name: 'Ancient Relic',
    description:
      'A mysterious crystal artifact recovered from an ' +
      'abandoned forest shrine. It emits a faint blue glow ' +
      'and seems to pulse with an unknown magical energy.',
    type: 'quest',
    questItem: true,
    symbol: '🔮'
  },

  {
    name: 'Healing Potion',
    description:
      'A small glass vial filled with a bright red liquid. ' +
      'Local herbalists claim it restores strength ' +
      'to weary adventurers.',
    type: 'consumable',
    questItem: false,
    symbol: '🧪'
  },

  {
    name: 'Rusted Key',
    description:
      'An old iron key covered in rust. ' +
      'Its original purpose has been forgotten, ' +
      'but it may unlock something important.',
    type: 'misc',
    questItem: false,
    symbol: '🗝️'
  },

  {
    name: 'Ancient Manuscript',
    description:
      'A fragile manuscript containing forgotten legends ' +
      'about the Whispering Forest and a mysterious relic. ' +
      'Elden believes it contains clues to the village\'s past.',
    type: 'quest',
    questItem: true,
    symbol: '📜'
  }
];

async function seedItems() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('Connected to MongoDB.');

    for (const item of items) {
      await Item.updateOne(
        { name: item.name },
        { $set: item },
        { upsert: true, runValidators: true }
      );

      console.log(`Seeded item: ${item.name}`);
    }

    console.log('All items seeded successfully!');
  } catch (error) {
    console.error('Item seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedItems();
