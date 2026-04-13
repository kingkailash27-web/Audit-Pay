const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    PayrollID: { type: String, required: true, unique: true },
    EmpID: { type: String, required: true, ref: 'Employee' },
    Month: { type: String, required: true },
    Year: { type: Number, required: true },
    BaseSalary: { type: Number, default: 0 },
    GrossPay: { type: Number, required: true },
    LeaveDays: { type: Number, default: 0 },
    LeaveDeduction: { type: Number, default: 0 },
    Taxes: { type: Number, required: true },
    PF: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    Bonus: { type: Number, default: 0 },
    NetPay: { type: Number, required: true },
    Status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' }
}, { timestamps: true, collection: 'Payroll' });

module.exports = mongoose.model('Payroll', payrollSchema);
