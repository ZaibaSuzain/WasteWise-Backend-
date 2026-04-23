const mongoose = require('mongoose');

const flagSchema = new mongoose.Schema({
  dish_name:    { type: String, required: true },
  days_flagged: { type: Number, default: 1 },
  avg_waste_kg: { type: Number, default: 0 },
  avg_rating:   { type: Number },
  status:       { 
    type: String, 
    enum: ["open", "acknowledged", "fix scheduled", "escalated", "resolved"],
    default: "open" 
  },
  last_action:  { type: String },
  created_at:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Flag', flagSchema);