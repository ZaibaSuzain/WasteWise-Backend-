const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());

// ── ROUTES ──
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/waste-logs', require('./routes/wasteLogs'));
app.use('/api/flags', require('./routes/flags'));

// ── TEST ROUTE ──
app.get('/', (req, res) => {
  res.json({ message: 'WasteWise API is running!' });
});
// ── STATS ROUTE (for landing page) ──
app.get('/api/stats', async (req, res) => {
  try {
    const Review = require('./models/Review');
    const WasteLog = require('./models/WasteLog');
    const Flag = require('./models/Flag');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayWaste, todayReviews, weekWaste, weekReviews, flags] = await Promise.all([
      WasteLog.find({ created_at: { $gte: today } }),
      Review.find({ created_at: { $gte: today } }),
      WasteLog.find({ created_at: { $gte: weekAgo } }),
      Review.find({ created_at: { $gte: weekAgo } }),
      Flag.find({ status: { $in: ["open", "acknowledged", "escalated"] }, days_flagged: { $gte: 5 } }).sort({ days_flagged: -1 }).limit(3),
    ]);

    res.json({ todayWaste, todayReviews, weekWaste, weekReviews, flags });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ── CONNECT TO DATABASE & START SERVER ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.log('DB Error:', err));