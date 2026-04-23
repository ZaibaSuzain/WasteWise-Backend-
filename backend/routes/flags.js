const router = require('express').Router();
const Flag = require('../models/Flag');

// GET all flags
router.get('/', async (req, res) => {
  try {
    const flags = await Flag.find().sort({ days_flagged: -1 });
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET only open/active flags
router.get('/active', async (req, res) => {
  try {
    const flags = await Flag.find({ 
      status: { $in: ["open", "acknowledged", "escalated"] } 
    }).sort({ days_flagged: -1 });
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET escalated flags
router.get('/escalated', async (req, res) => {
  try {
    const flags = await Flag.find({ status: "escalated" })
      .sort({ days_flagged: -1 });
    res.json(flags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT - update flag status
router.put('/:id', async (req, res) => {
  try {
    const updated = await Flag.findByIdAndUpdate(
      req.params.id,
      { 
        status: req.body.status,
        last_action: req.body.status 
      },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE flag
router.delete('/:id', async (req, res) => {
  try {
    await Flag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Flag deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;