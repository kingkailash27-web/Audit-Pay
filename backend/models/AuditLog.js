const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    ActionBy_EmpID: { type: String, required: true }, // The admin or auditor who did it
    ActionType: { type: String, required: true }, // e.g., "UPDATE_SALARY", "APPROVE_LEAVE"
    Target_EmpID: { type: String }, // The employee whose record was changed    
    PreviousValue: { type: mongoose.Schema.Types.Mixed }, // What the data looked like before
    NewValue: { type: mongoose.Schema.Types.Mixed }, // What the data was changed to
    Details: { type: String }, // e.g. "Admin processed payment for EmpID for Month"
}, { timestamps: true, collection: 'AuditLogs' });

module.exports = mongoose.model('AuditLog', auditLogSchema);
