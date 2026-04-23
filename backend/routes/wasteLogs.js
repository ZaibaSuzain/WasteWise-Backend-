const router = require('express').Router();
const WasteLog = require('../models/WasteLog');
const Flag = require('../models/Flag');

// GET all waste logs
router.get('/', async (req, res) => {
  try {
    const logs = await WasteLog.find().sort({ created_at: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET today's waste logs
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logs = await WasteLog.find({ created_at: { $gte: today } });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET waste logs by date range
router.get('/range', async (req, res) => {
  try {
    const { from } = req.query;
    const logs = await WasteLog.find({
      created_at: { $gte: new Date(from) }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST - create waste log and auto flag if needed
router.post('/', async (req, res) => {
  try {
    const log = new WasteLog(req.body);
    const saved = await log.save();

    // auto flag if wasted >= 5kg
    if (saved.wasted_kg >= 5) {
      const existing = await Flag.findOne({ 
        dish_name: saved.dish_name,
        status: { $ne: "resolved" }
      });

      if (existing) {
        // update existing flag
        existing.days_flagged += 1;
        existing.avg_waste_kg = ((existing.avg_waste_kg * (existing.days_flagged - 1)) + saved.wasted_kg) / existing.days_flagged;
        if (existing.days_flagged >= 3) existing.status = "escalated";
        await existing.save();
      } else {
        // create new flag
        await Flag.create({
          dish_name: saved.dish_name,
          days_flagged: 1,
          avg_waste_kg: saved.wasted_kg,
          status: "open"
        });
      }
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;