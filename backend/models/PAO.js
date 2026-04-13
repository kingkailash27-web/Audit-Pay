const mongoose = require('mongoose');

const paoSchema = new mongoose.Schema({
  PAOID: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Name: { type: String, required: true },
  role: { type: String, default: 'pao' }
}, { timestamps: true, collection: 'PAOs' });

module.exports = mongoose.model('PAO', paoSchema);
