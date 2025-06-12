import express from 'express';
import { PrismaClient } from '@prisma/client';
import { auth } from '../utils/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const codenames = ["The Nightingale", "The Kraken", "The Falcon", "The Phantom", "The Viper", "The Ghost", "The Cobra", "The Raptor"];

function getRandomCodename() {
  return codenames[Math.floor(Math.random() * codenames.length)];
}

// random mission success probability
function getRandomSuccessProbability() {
  return Math.floor(Math.random() * 101);
}

const confirmationCodes = new Map();

// Get a specific gadget
router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const gadget = await prisma.gadget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        codename: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        decommissionedAt: true,
        destroyedAt: true
      }
    });
    
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }

    const gadgetWithProbability = {
      ...gadget,
      missionSuccessProbability: `${getRandomSuccessProbability()}% success probability`
    };
    res.json(gadgetWithProbability);
  } 
  catch (error) {
    console.error('Error fetching gadget:', error);
    res.status(500).json({ error: 'Failed to retrieve gadget' });
  }
});

// Get all gadgets
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let gadgets;
    
    if (status) {
      gadgets = await prisma.gadget.findMany({ 
        where: { status },
        select: {
          id: true,
          name: true,
          codename: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          decommissionedAt: true
        }
      });
    } else {
      gadgets = await prisma.gadget.findMany({
        select: {
          id: true,
          name: true,
          codename: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          decommissionedAt: true
        }
      });
    }
    
    const gadgetsWithProbability = gadgets.map(gadget => ({
      ...gadget,
      missionSuccessProbability: `${getRandomSuccessProbability()}% success probability`
    }));
    
    res.json(gadgetsWithProbability);
  } catch (error) {
    console.error('Error fetching gadgets:', error);
    res.status(500).json({ error: 'Failed to retrieve gadgets' });
  }
});

// Add a new gadget
router.post('/', auth(), async (req, res) => {
  try {
    const { name, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    let codename;
    let isUnique = false;
    
    while (!isUnique) {
      codename = getRandomCodename();
      const existing = await prisma.gadget.findUnique({
        where: { codename },
        select: { id: true }
      });
      if (!existing) isUnique = true;
    }

    const gadget = await prisma.gadget.create({
      data: {
        name,
        codename,
        status: status || 'Available',
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    });
    res.status(201).json(gadget);
  }
  catch (error) {
    console.error('Error creating gadget:', error);
    res.status(500).json({ error: 'Failed to add gadget' });
  }
});

// Update a gadget
router.patch('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const updateData = { updatedBy: req.user.id };

    if (name) updateData.name = name;
    if (status) updateData.status = status;

    const gadget = await prisma.gadget.findUnique({ 
      where: { id },
      select: { id: true }
    });
    
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }

    const updatedGadget = await prisma.gadget.update({
      where: { id },
      data: updateData
    });

    res.json(updatedGadget);
  } catch (error) {
    console.error('Error updating gadget:', error);
    res.status(500).json({ error: 'Failed to update gadget' });
  }
});

// Decommission a gadget
router.delete('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const gadget = await prisma.gadget.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }

    const now = new Date();
    const updatedGadget = await prisma.gadget.update({
      where: { id },
      data: {
        status: 'Decommissioned',
        decommissionedAt: now,
        updatedBy: req.user.id
      }
    });
    
    res.json({ 
      message: 'Gadget decommissioned', 
      gadget: updatedGadget 
    });
  } catch (error) {
    console.error('Error decommissioning gadget:', error);
    res.status(500).json({ error: 'Failed to decommission gadget' });
  }
});

// Generate self-destruct confirmation code
router.post('/:id/generate-confirmation', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const gadget = await prisma.gadget.findUnique({
      where: { id },
      select: { 
        id: true,
        status: true
      }
    });
    
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    if (['Destroyed', 'Decommissioned'].includes(gadget.status)) {
      return res.status(400).json({ 
        error: `Cannot self-destruct a ${gadget.status.toLowerCase()} gadget` 
      });
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    confirmationCodes.set(id, confirmationCode);

    // Set code expiry after 5 minutes
    setTimeout(() => {
      if (confirmationCodes.get(id) === confirmationCode) {
        confirmationCodes.delete(id);
      }
    }, 5 * 60 * 1000);

    res.json({ 
      message: 'Confirmation code generated',
      confirmationCode,
      expiresIn: '5 minutes'
    });
  } catch (error) {
    console.error('Error generating confirmation code:', error);
    res.status(500).json({ error: 'Failed to generate confirmation code' });
  }
});

// Self-destruct a gadget
router.post('/:id/self-destruct', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body;
    
    if (!confirmation) {
      return res.status(400).json({ error: 'Confirmation code is required' });
    }
    
    const storedCode = confirmationCodes.get(id);
    
    if (!storedCode || confirmation !== storedCode) {
      return res.status(400).json({ 
        error: 'Invalid or expired confirmation code' 
      });
    }
    
    const gadget = await prisma.gadget.findUnique({
      where: { id },
      select: { status: true }
    });
    
    if (!gadget) {
      return res.status(404).json({ error: 'Gadget not found' });
    }
    
    if (gadget.status === 'Destroyed') {
      return res.status(400).json({ error: 'Gadget is already destroyed' });
    }
    
    if (gadget.status === 'Decommissioned') {
      return res.status(400).json({ error: 'Cannot destroy a decommissioned gadget' });
    }

    const updatedGadget = await prisma.gadget.update({
      where: { id },
      data: { 
        status: 'Destroyed',
        updatedBy: req.user.id
      }
    });
    
    confirmationCodes.delete(id);
    
    res.json({ 
      message: 'Gadget self-destruct sequence initiated successfully',
      gadget: updatedGadget 
    });
  }
  catch (error) {
    console.error('Error in self-destruct sequence:', error);
    res.status(500).json({ error: 'Failed to initiate self-destruct sequence' });
  }
});

export default router;
