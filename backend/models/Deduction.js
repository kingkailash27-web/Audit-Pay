const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema({
    TypeID: { type: String, required: true, unique: true },
    Description: { type: String, required: true },
    AmountType: { type: String, enum: ['Fixed', 'Percentage'], required: true },
    Amount: { type: Number, required: true } // Can represent a flat dollar amount or a %
}, { timestamps: true, collection: 'Deductions' });

module.exports = mongoose.model('Deduction', deductionSchema);
