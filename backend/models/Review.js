const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  roll_number: { type: String, required: true },
  hostel:      { type: String, required: true },
  meal_type:   { type: String, required: true },
  dish_name:   { type: String, required: true },
  rating:      { type: Number, default: 0 },
  comment:     { type: String },
  portion:     { type: String },
  skipped:     { type: Boolean, default: false },
  skip_reason: { type: String },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);