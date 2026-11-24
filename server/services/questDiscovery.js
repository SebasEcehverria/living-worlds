
const SideQuest = require('../models/SideQuest');

const QUEST_TEMPLATES = {
  missing_shipment: {
    questKey: 'missing_shipment',

    title: 'The Missing Shipment',

    description:
      'Garrick has lost a shipment of supplies along the ' +
      'forest road. Investigate what happened and help ' +
      'recover his missing goods.',

    objectives: [
      {
        description: 'Ask Garrick about the missing shipment.',
        completed: true
      },
      {
        description: 'Investigate the forest road.',
        completed: false
      },
      {
        description: 'Return to Garrick with your findings.',
        completed: false
      }
    ]
  }
};

// Detect whether the player is investigating Garrick's problem
function detectQuest(npc, playerMessage, history = []) {
  if (npc.name !== 'Garrick') {
    return null;
  }

  const message = playerMessage.toLowerCase();

  // Directly mentioning the shipment
  const mentionsShipment =
    /\b(shipment|supplies|wagon|caravan|delivery|missing goods)\b/i
      .test(message);

  // Player offers to help Garrick
  const offersHelp =
    /\b(help|assist|quest|job|work|task|investigate)\b/i
      .test(message);

  // Determine whether Garrick previously mentioned the problem
  const previousDialogue = history
    .filter(entry => entry.role === 'assistant')
    .slice(-6)
    .map(entry => entry.content)
    .join(' ')
    .toLowerCase();

  const discussedShipment =
    /\b(shipment|supplies|wagon|caravan|delivery)\b/i
      .test(previousDialogue);

  if (mentionsShipment || (offersHelp && discussedShipment)) {
    return QUEST_TEMPLATES.missing_shipment;
  }

  return null;
}

// Save a discovered quest
async function discoverQuest(gameSaveId, npc, playerMessage, history) {
  const template = detectQuest(npc, playerMessage, history);

  if (!template) {
    return null;
  }

  // Atomic upsert avoids duplicate quest discoveries
  await SideQuest.updateOne(
    {
      gameSaveId,
      questKey: template.questKey
    },
    {
      $setOnInsert: {
        gameSaveId,
        npcId: npc._id,
        ...template,
        status: 'discovered'
      }
    },
    {
      upsert: true,
      runValidators: true
    }
  );

  return SideQuest.findOne({
    gameSaveId,
    questKey: template.questKey
  });
}

module.exports = {
  detectQuest,
  discoverQuest
};
