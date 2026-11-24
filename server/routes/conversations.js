
const express = require('express');
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const GameSave = require('../models/GameSave');
const NPC = require('../models/NPC');
const SideQuest = require('../models/SideQuest');

const { generateNPCResponse } = require('../services/qwen');
const { discoverQuest } = require('../services/questDiscovery');

const router = express.Router();

async function getGameAndNPC(saveId, npcId) {
  if (
    !mongoose.isValidObjectId(saveId) ||
    !mongoose.isValidObjectId(npcId)
  ) {
    return {
      error: 'Invalid game save or NPC ID.',
      status: 400
    };
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

// GET conversation history and discovered quests
router.get('/:saveId/:npcId', async (req, res) => {
  try {
    const { saveId, npcId } = req.params;

    const result = await getGameAndNPC(saveId, npcId);

    if (result.error) {
      return res.status(result.status).json({
        error: result.error
      });
    }

    const [conversation, quests] = await Promise.all([
      Conversation.findOne({
        gameSaveId: saveId,
        npcId
      }),

      SideQuest.find({
        gameSaveId: saveId,
        npcId
      })
    ]);

    res.json({
      gameSaveId: saveId,
      npcId,
      messages: conversation?.messages || [],
      quests
    });
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

    if (
      typeof message !== 'string' ||
      !message.trim() ||
      message.trim().length > 1000
    ) {
      return res.status(400).json({
        error: 'Message must contain 1-1000 characters.'
      });
    }

    const result = await getGameAndNPC(saveId, npcId);

    if (result.error) {
      return res.status(result.status).json({
        error: result.error
      });
    }

    const { gameSave, npc } = result;
    const playerMessage = message.trim();

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

    // Preserve the existing context for discovery and AI
    const history = conversation.messages.map(entry => ({
      role: entry.role,
      content: entry.content
    }));

    let reply;
    let source = 'fallback';

    // Add consistent quest context for Garrick
    const npcContext = npc.toObject();

    if (npc.name === 'Garrick') {
      npcContext.systemPrompt += `

ADDITIONAL WORLD INFORMATION:
A merchant shipment belonging to you went missing on
the forest road three nights ago. It carried ordinary
supplies, including lantern oil and provisions.

You are worried about the missing driver.
You may discuss this problem if the player asks
about local trouble, trade, jobs, or rumors.

If the player offers to help, respond naturally.
The game server handles official quest acceptance.
`;
    }

    if (process.env.QWEN_ENABLED === 'true') {
      try {
        reply = await generateNPCResponse(
          npcContext,
          gameSave.playerName,
          history,
          playerMessage
        );

        source = 'qwen';
      } catch (error) {
        console.error('Qwen generation failed:', error.message);
      }
    }

    if (!reply) {
      reply = npc.greeting;
    }

    // Save conversation
    conversation.messages.push(
      {
        role: 'user',
        content: playerMessage
      },
      {
        role: 'assistant',
        content: reply
      }
    );

    await conversation.save();

    // Check whether the conversation reveals a quest
    const discoveredQuest = await discoverQuest(
      gameSave._id,
      npc,
      playerMessage,
      history
    );

    // Retrieve all quest offers for this NPC
    const quests = await SideQuest.find({
      gameSaveId: saveId,
      npcId
    });

    res.status(201).json({
      npc: npc.name,
      reply,
      source,
      messages: conversation.messages,
      discoveredQuest,
      quests
    });
  } catch (error) {
    console.error('NPC message error:', error);

    res.status(500).json({
      error: 'Failed to send message.'
    });
  }
});

// POST - Accept a discovered side quest
router.post('/:saveId/:npcId/quests/:questKey/accept',
  async (req, res) => {
    try {
      const { saveId, npcId, questKey } = req.params;

      const result = await getGameAndNPC(saveId, npcId);

      if (result.error) {
        return res.status(result.status).json({
          error: result.error
        });
      }

      const quest = await SideQuest.findOneAndUpdate(
        {
          gameSaveId: saveId,
          npcId,
          questKey,
          status: 'discovered'
        },
        {
          $set: {
            status: 'active'
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!quest) {
        return res.status(409).json({
          error: 'Quest is unavailable or already accepted.'
        });
      }

      res.json({
        message: `Quest accepted: ${quest.title}`,
        quest
      });
    } catch (error) {
      console.error('Quest acceptance error:', error);

      res.status(500).json({
        error: 'Failed to accept quest.'
      });
    }
  }
);

module.exports = router;
