const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { auth, checkRole } = require('../middleware/auth');

router.get('/', [auth, checkRole('pd')], async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.name = req.body.name || item.name;
    item.description = req.body.description || item.description;
    item.category = req.body.category || item.category;
    item.value = req.body.value || item.value;
    item.status = req.body.status || item.status;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', [auth, checkRole('pd')], async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    await item.remove();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;