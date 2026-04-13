const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    EmpID: { type: String, required: true },
    Date: { type: String, required: true }, // e.g., 'YYYY-MM-DD'
    Status: { type: String, enum: ['Present', 'Leave'], default: 'Present' }
}, { timestamps: true, collection: 'Attendance' });

// Ensure one record per employee per day
attendanceSchema.index({ EmpID: 1, Date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
