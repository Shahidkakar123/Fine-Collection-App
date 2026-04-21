const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const { auth, checkRole } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

// GET all fines - PD gets all, employees get only their fines
router.get('/', auth, async (req, res) => {
  try {
    let items;
    if (req.user.role === 'pd') {
      // PD can see all fines
      items = await Item.find().populate('userId', 'username');
    } else {
      // Employees can only see their own fines
      items = await Item.find({ userId: req.user.id });
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single fine by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('userId', 'username');
    if (!item) return res.status(404).json({ message: 'Fine not found' });

    // Check authorization: PD can view any, employees only their own
    if (req.user.role !== 'pd' && item.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view this fine' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE fine - PD only
router.post('/', [auth, checkRole('pd')], async (req, res) => {
  const item = new Item({
    userId: req.body.userId,
    name: req.body.name,
    description: req.body.description,
    category: req.body.category,
    value: req.body.value,
    status: req.body.status || 'pending',
  });

  try {
    // Validate required fields
    if (!item.userId || !item.name || !item.category || item.value == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (item.value <= 0) {
      return res.status(400).json({ message: 'Fine value must be positive' });
    }

    const savedItem = await item.save();
    
    // Send email notification to employee (email service will handle if not configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const employee = await User.findById(req.body.userId);
        if (employee && employee.email) {
          const pdName = req.user.username || 'Project Director';
          const subject = `⚠️ Fine ho giya apko - $${item.value}`;
          const message = `
         
           
             <h2>New Fine </h2>
            <p>Hello ${employee.username},</p>
            <p>A new fine has been assigned to you by <strong>${pdName}</strong>.</p>
            <div style="border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; background-color: #fef2f2;">
              <p><strong>Category:</strong> ${item.category}</p>
              <p><strong>Amount:</strong> $${item.value}</p>
              <p><strong>Description:</strong> ${item.description || 'N/A'}</p>
              <p><strong>Status:</strong> ${item.status}</p>
            </div>
            <p>Please log in to your dashboard to view more details.</p>
            <p>Best regards,<br>FineMate</p>
          `;
          await sendEmail(employee.email, subject, message);
        }
      } catch (emailErr) {
        console.warn('⚠️  Email not sent:', emailErr.message);
        // Don't fail the API call if email fails
      }
    }
    
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE fine - PD only
router.put('/:id', [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Fine not found' });

    // Update allowed fields
    if (req.body.name) item.name = req.body.name;
    if (req.body.description) item.description = req.body.description;
    if (req.body.category) item.category = req.body.category;
    if (req.body.value !== undefined) {
      if (req.body.value <= 0) {
        return res.status(400).json({ message: 'Fine value must be positive' });
      }
      item.value = req.body.value;
    }
    if (req.body.status) item.status = req.body.status;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE fine - PD only
router.delete('/:id', [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Fine not found' });

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fine deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;