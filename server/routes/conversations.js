
const express = require('express');
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const GameSave = require('../models/GameSave');
const NPC = require('../models/NPC');

const { generateNPCResponse } = require('../services/qwen');

const router = express.Router();

// Verify both IDs and retrieve the associated records
async function getGameAndNPC(saveId, npcId) {
  if (
    !mongoose.isValidObjectId(saveId) ||
    !mongoose.isValidObjectId(npcId)
  ) {
    return { error: 'Invalid game save or NPC ID.', status: 400 };
  }

  const [gameSave, npc] = await Promise.all([
    GameSave.findById(saveId),
    NPC.findById(npcId)
  ]);

  if (!gameSave) {
    return { error: 'Game save not found.', status: 404 };
  }

  if (!npc) {
    return { error: 'NPC not found.', status: 404 };
  }

  return { gameSave, npc };
}

// GET conversation history
router.get('/:saveId/:npcId', async (req, res) => {
  try {
    const { saveId, npcId } = req.params;

    const result = await getGameAndNPC(saveId, npcId);

    if (result.error) {
      return res.status(result.status).json({
        error: result.error
      });
    }

    const conversation = await Conversation.findOne({
      gameSaveId: saveId,
      npcId
    });

    if (!conversation) {
      return res.json({
        gameSaveId: saveId,
        npcId,
        messages: []
      });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Conversation retrieval error:', error);

    res.status(500).json({
      error: 'Failed to retrieve conversation.'
    });
  }
});

// POST a message to an NPC
router.post('/:saveId/:npcId/messages', async (req, res) => {
  try {
    const { saveId, npcId } = req.params;
    const { message } = req.body || {};

    // Validate player message
    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.trim().length > 1000
    ) {
      return res.status(400).json({
        error: 'Message must contain 1-1000 characters.'
      });
    }

    // Validate game save and NPC
    const result = await getGameAndNPC(saveId, npcId);

    if (result.error) {
      return res.status(result.status).json({
        error: result.error
      });
    }

    const { gameSave, npc } = result;

    // Load existing conversation
    let conversation = await Conversation.findOne({
      gameSaveId: saveId,
      npcId
    });

    if (!conversation) {
      conversation = new Conversation({
        gameSaveId: saveId,
        npcId,
        messages: []
      });
    }

    const playerMessage = message.trim();
    let npcResponse;
    let responseSource = 'fallback';

    // Generate AI dialogue when enabled
    if (process.env.QWEN_ENABLED === 'true') {
      try {
        npcResponse = await generateNPCResponse(
          npc,
          gameSave.playerName,
          conversation.messages,
          playerMessage
        );

        responseSource = 'qwen';
      } catch (error) {
        console.error('Qwen generation failed:', error.message);
      }
    }

    // Predefined dialogue if Qwen is unavailable
    if (!npcResponse) {
      npcResponse = npc.greeting;
    }

    // Store both messages
    conversation.messages.push(
      {
        role: 'user',
        content: playerMessage
      },
      {
        role: 'assistant',
        content: npcResponse
      }
    );

    await conversation.save();

    res.status(201).json({
      npc: npc.name,
      reply: npcResponse,
      source: responseSource,
      messages: conversation.messages
    });

  } catch (error) {
    console.error('NPC message error:', error);

    res.status(500).json({
      error: 'Failed to send message.'
    });
  }
});

module.exports = router;
