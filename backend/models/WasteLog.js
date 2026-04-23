
const mongoose = require('mongoose');

const wasteLogSchema = new mongoose.Schema({
  staff_id:    { type: String, required: true },
  meal_type:   { type: String, required: true },
  dish_name:   { type: String, required: true },
  cooked_kg:   { type: Number, required: true },
  consumed_kg: { type: Number, required: true },
  wasted_kg:   { type: Number, required: true },
  money_wasted:{ type: Number, required: true },
  co2_kg:      { type: Number, required: true },
  created_at:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('WasteLog', wasteLogSchema);
