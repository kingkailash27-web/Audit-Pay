const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  EmpID: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Name: { type: String, required: true },
  DeptID: { type: String },
  JoiningDate: { type: Date, default: Date.now },
  BaseSalary: { type: Number, required: true },
  BankAccount: { type: String, required: true },
  role: { type: String, enum: ['admin', 'pao', 'employee'], default: 'employee' },
  pfActive: { type: Boolean, default: false },
  totalLeaves: { type: Number, default: 0 }
}, { timestamps: true, collection: 'Employees' });

module.exports = mongoose.model('Employee', employeeSchema);