const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    EmpID: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    totalDays: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedOn: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'LeaveRequests' });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
