const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 1. Initialize the Express App
const app = express();

// 2. Set up Middleware
app.use(cors()); // Allows your React frontend to communicate with this backend
app.use(express.json()); // Allows the server to accept and read JSON data

// 3. Connect to MongoDB using Mongoose
// Append database name Audit Payn or let it be the default one. The prompt says "Database Name: Audit Payn."
// Assuming URI uses a specific path or we can just append it
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/Audit_Payn';
mongoose.connect(uri)
  .then(async () => {
    console.log('MongoDB connection established successfully!');
    // Migration: Convert any old 'Absent' records to 'Leave'
    try {
      const migrationResult = await Attendance.updateMany({ Status: 'Absent' }, { $set: { Status: 'Leave' } });
      if (migrationResult.modifiedCount > 0) console.log(`[MIGRATION] Unified ${migrationResult.modifiedCount} 'Absent' records to 'Leave'.`);
    } catch (err) {
      console.error('[MIGRATION ERROR]:', err.message);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// 4. Create a Mongoose Schema and Model
// This defines the structure of a single reminder in your database
const reminderSchema = new mongoose.Schema({
  title: { type: String, required: true },
  assignee: { type: String, required: true }, // e.g., "Roommate 1" or "Mom"
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

const Reminder = mongoose.model('Reminder', reminderSchema);

const Employee = require('./models/Employee');
const PAO = require('./models/PAO');
const Payroll = require('./models/Payroll');
const AuditLog = require('./models/AuditLog');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const bcrypt = require('bcryptjs');

// 5. Create a basic test route
app.get('/', (req, res) => {
  res.send('Home Reminder API is running!');
});

// Admin Add Employee Route
app.post('/api/admin/add-employee', async (req, res) => {
  try {
    const { EmpID, Name, DeptID, JoiningDate, Password, BaseSalary, BankAccount, role, pfActive, providentFund } = req.body;

    // Check if adding PAO
    if (role === 'pao') {
      const { PAOID, Password: paoPassword, Name: paoName } = req.body;
      const effectivePAOID = PAOID || EmpID; // Fallback in case frontend sends it as EmpID
      const effectiveName = paoName || Name;
      const effectivePassword = paoPassword || Password;

      if (!effectivePAOID || !effectivePassword || !effectiveName) {
        return res.status(400).json({ success: false, message: 'Missing required fields for PAO.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(effectivePassword, salt);

      const newPAO = new PAO({
        PAOID: effectivePAOID,
        Name: effectiveName,
        Password: hashedPassword
      });

      await newPAO.save();
      return res.json({ success: true, message: 'PAO created successfully!' });
    }

    // Basic validation for employee
    if (!EmpID || !Name || !Password || !BaseSalary) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    // Create Employee
    const newEmployee = new Employee({
      EmpID,
      Name,
      DeptID,
      JoiningDate: JoiningDate || Date.now(),
      Password: hashedPassword,
      BaseSalary: Number(BaseSalary),
      BankAccount,
      role: 'employee',
      pfActive: pfActive === true || providentFund === true || providentFund?.isActive === true
    });

    await newEmployee.save();
    console.log(`[SUCCESS] Employee ${EmpID} saved to MongoDB Employees collection.`);

    res.json({ success: true, message: 'Employee added correctly!' });
  } catch (err) {
    console.error('[ERROR] Failed to add employee:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin Update Employee Route
app.put('/api/admin/update-employee/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.providentFund !== undefined) {
      updateData.pfActive = updateData.providentFund === true || updateData.providentFund?.isActive === true;
      delete updateData.providentFund;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (updateData.BaseSalary !== undefined || updateData.pfActive !== undefined) {
      const baseSalNum = Number(updatedEmployee.BaseSalary);
      const taxAmount = baseSalNum * 0.10;
      const pfAmount = updatedEmployee.pfActive ? (baseSalNum * 0.05) : 0;
      const finalNetPay = baseSalNum - taxAmount - pfAmount;
      
      console.log(`[UPDATE] recalculating NetPay for ${updatedEmployee.EmpID}. Old Base: -> New Base: ${baseSalNum}, Net: ${finalNetPay}`);
      
      await Payroll.findOneAndUpdate(
        { EmpID: updatedEmployee.EmpID, Status: 'Pending' }, 
        { GrossPay: baseSalNum, NetPay: finalNetPay, Taxes: taxAmount },
        { new: true, sort: { createdAt: -1 } }
      );
    }
    
    res.json({ success: true, employee: updatedEmployee });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(400).json({ success: false, message: 'Error updating employee' });
  }
});

// Admin Delete Employee Route
app.delete('/api/admin/delete-employee/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await Employee.findByIdAndDelete(req.params.id);
    await Payroll.deleteMany({ EmpID: employee.EmpID }); // also delete payrolls

    res.json({ success: true, message: 'Employee and related payroll records deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ success: false, message: 'Error deleting employee' });
  }
});


// Employee Search Route
app.get('/api/employees/search', async (req, res) => {
  try {
    const { query, deptId } = req.query;
    let filter = {};

    if (query) {
      const regex = new RegExp(query, 'i');
      filter.$or = [
        { Name: regex },
        { EmpID: regex }
      ];
    }

    if (deptId) {
      // Match DeptID starting with the code (e.g., "151")
      filter.DeptID = new RegExp('^' + deptId, 'i');
    }

    const employeesRaw = await Employee.find(filter).limit(50);
    
    // Calculate Days on Leave for current month
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Extract employee IDs
    const empIds = employeesRaw.map(e => e.EmpID);
    
    // Get all leave records for these employees this month
    const leaves = await Attendance.find({
      EmpID: { $in: empIds },
      Status: 'Leave',
      Date: { $regex: `^${prefix}` }
    });
    
    const leaveMap = leaves.reduce((acc, curr) => {
      acc[curr.EmpID] = (acc[curr.EmpID] || 0) + 1;
      return acc;
    }, {});
    
    const employees = employeesRaw.map(emp => {
      const e = emp.toObject();
      e.currentMonthLeaves = leaveMap[emp.EmpID] || 0;
      return e;
    });

    res.json({ success: true, data: employees });
  } catch (error) {
    console.error('Error in employee search:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get('/api/employees/details/:empId', async (req, res) => {
  try {
    const { empId } = req.params;
    const employee = await Employee.findOne({ EmpID: empId });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const formatMonthRange = (startDate, endDate) => {
  const startLabel = startDate.toLocaleString('default', { month: 'short' });
  const endLabel = endDate.toLocaleString('default', { month: 'short' });
  return `${startLabel} ${startDate.getFullYear()} - ${endLabel} ${endDate.getFullYear()}`;
};

const toMonthYear = (date) => ({
  month: date.toLocaleString('default', { month: 'long' }),
  year: date.getFullYear()
});

const isSameMonthYear = (left, right) => (
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth()
);

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Payroll Runner: Historical Sync
app.post('/api/payroll/run-sync', async (req, res) => {
  try {
    const employees = await Employee.find({});
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let totalRecordsCreated = 0;
    let totalNetPayGenerated = 0;
    const results = [];

    for (const emp of employees) {
      const empId = emp.EmpID;
      const empName = emp.Name || 'Unknown';
      const baseSalary = Number(emp.BaseSalary || 0);
      const joinDate = emp.JoiningDate ? new Date(emp.JoiningDate) : null;
      const pfActive = emp.pfActive === true;

      let createdCount = 0;
      let existingCount = 0;
      let totalRecordsInRange = 0;
      let employeeNetTotal = 0;
      let syncRange = 'No eligible months';
      let status = 'Verified & Saved to Audit Payn';

      if (!empId || !joinDate || Number.isNaN(joinDate.getTime())) {
        status = 'Skipped - missing joining date';
      } else if (!baseSalary) {
        status = 'Skipped - missing salary data';
      } else {
        const startDate = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 1);

        if (startDate <= endDate) {
          syncRange = formatMonthRange(startDate, endDate);

          const cursor = new Date(startDate);
          while (cursor <= endDate) {
            const { month, year } = toMonthYear(cursor);
            const monthIndex = String(cursor.getMonth() + 1).padStart(2, '0');

            const exists = await Payroll.exists({ EmpID: empId, Month: month, Year: year });
            if (!exists) {
              const taxAmount = roundMoney(baseSalary * 0.10);
              const pfAmount = pfActive ? roundMoney(baseSalary * 0.05) : 0;
              // Auto ₹10,000 bonus every January
              const bonus = (month === 'January') ? 10000 : 0;
              const netPay = roundMoney(baseSalary - taxAmount - pfAmount + bonus);

              await Payroll.create({
                PayrollID: `PR-${empId}-${year}-${monthIndex}`,
                EmpID: empId,
                Month: month,
                Year: year,
                GrossPay: baseSalary,
                Bonus: bonus,
                NetPay: netPay,
                Taxes: taxAmount,
                Status: 'Paid'
              });

              createdCount += 1;
              totalRecordsCreated += 1;
              employeeNetTotal += netPay;
              totalNetPayGenerated += netPay;
            } else {
              existingCount += 1;
            }

            cursor.setMonth(cursor.getMonth() + 1);
          }

          totalRecordsInRange = createdCount + existingCount;
        } else {
          status = 'No eligible months';
        }
      }

      console.log(`[Payroll Runner]: Generated ${createdCount} records for EmpID: ${empId}.`);

      results.push({
        EmpID: empId,
        Name: empName,
        SyncRange: syncRange,
        TotalRecordsCreated: createdCount,
        TotalRecordsInRange: totalRecordsInRange,
        Status: status,
        TotalNetPayGenerated: roundMoney(employeeNetTotal)
      });
    }

    await AuditLog.create({
      ActionBy_EmpID: req.body?.actionBy || 'ADMIN',
      ActionType: 'ADMIN_SYNC_HISTORICAL_PAYROLL completed for all employees',
      Target_EmpID: null,
      PreviousValue: null,
      NewValue: {
        totalEmployees: employees.length,
        totalRecordsCreated: totalRecordsCreated,
        totalNetPayGenerated: roundMoney(totalNetPayGenerated)
      }
    });

    res.json({
      success: true,
      summary: {
        totalEmployees: employees.length,
        totalRecordsCreated,
        totalNetPayGenerated: roundMoney(totalNetPayGenerated)
      },
      results
    });
  } catch (error) {
    console.error('[Payroll Runner] Error during historical sync:', error);
    res.status(500).json({ success: false, message: 'Payroll runner failed' });
  }
});

// Payroll Runner: Sync History
app.get('/api/payroll/sync-history', async (req, res) => {
  try {
    const history = await AuditLog.find({
      ActionType: 'ADMIN_SYNC_HISTORICAL_PAYROLL completed for all employees'
    })
      .sort({ Timestamp: -1 })
      .limit(20);

    res.json({ success: true, history });
  } catch (error) {
    console.error('[Payroll Runner] Error fetching sync history:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch sync history' });
  }
});

// Payroll Runner: Pending payouts for current month
app.get('/api/payroll/pending-current', async (req, res) => {
  try {
    const now = new Date();
    const { month, year } = toMonthYear(now);
    const monthIndex = String(now.getMonth() + 1).padStart(2, '0');

    const employees = await Employee.find({});
    const employeeNameMap = new Map();

    for (const emp of employees) {
      if (!emp.EmpID) continue;
      employeeNameMap.set(emp.EmpID, emp.Name || 'Unknown');

      const joinDate = emp.JoiningDate ? new Date(emp.JoiningDate) : null;
      if (!joinDate || Number.isNaN(joinDate.getTime())) continue;
      if (isSameMonthYear(joinDate, now)) continue;

      const baseSalary = Number(emp.BaseSalary || 0);
      if (!baseSalary) continue;

      const existing = await Payroll.findOne({ EmpID: emp.EmpID, Month: month, Year: year });
      if (!existing) {
        const prefix = `${year}-${monthIndex}`;
        const leavesCount = await Attendance.countDocuments({
           EmpID: emp.EmpID,
           Status: 'Leave',
           Date: { $regex: `^${prefix}` }
        });

        const dailyRate = baseSalary / 30;
        const leaveDeduction = roundMoney(leavesCount * dailyRate);
        const taxAmount = roundMoney(baseSalary * 0.10);
        const pfAmount = emp.pfActive === true ? roundMoney(baseSalary * 0.05) : 0;
        // Auto ₹10,000 bonus every January
        const bonus = (month === 'January') ? 10000 : 0;
        const netPay = roundMoney(baseSalary - leaveDeduction - taxAmount - pfAmount + bonus);

        await Payroll.create({
          PayrollID: `PR-${emp.EmpID}-${year}-${monthIndex}`,
          EmpID: emp.EmpID,
          Month: month,
          Year: year,
          BaseSalary: baseSalary,
          GrossPay: baseSalary,
          LeaveDays: leavesCount,
          LeaveDeduction: leaveDeduction,
          Taxes: taxAmount,
          PF: pfAmount,
          Bonus: bonus,
          totalDeductions: roundMoney(leaveDeduction + taxAmount + pfAmount),
          NetPay: netPay,
          Status: 'Pending'
        });
      }
    }

    // Return ALL records for current month (both Paid and Pending)
    const allPayrolls = await Payroll.find({ Month: month, Year: year }).sort({ Status: 1, EmpID: 1 });
    const records = allPayrolls.map((payroll) => ({
      _id: payroll._id,
      PayrollID: payroll.PayrollID,
      EmpID: payroll.EmpID,
      Name: employeeNameMap.get(payroll.EmpID) || 'Unknown',
      Month: payroll.Month,
      Year: payroll.Year,
      BaseSalary: payroll.BaseSalary || payroll.GrossPay,
      GrossPay: payroll.GrossPay,
      LeaveDays: payroll.LeaveDays || 0,
      LeaveDeduction: payroll.LeaveDeduction || 0,
      Taxes: payroll.Taxes,
      PF: payroll.PF || 0,
      Bonus: payroll.Bonus || 0,
      NetPay: payroll.NetPay,
      Status: payroll.Status
    }));

    const totalDue = records.filter(r => r.Status === 'Pending').reduce((sum, r) => sum + (r.NetPay || 0), 0);

    res.json({
      success: true,
      month,
      year,
      totalDue: roundMoney(totalDue),
      records
    });
  } catch (error) {
    console.error('[Payroll Runner] Error fetching payrolls:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch payrolls' });
  }
});

// Payroll Runner: Generate PAO Payroll
app.post('/api/payroll/generate', async (req, res) => {
  try {
    const { year, month, actionBy } = req.body;
    if (!year || !month) return res.status(400).json({ success: false, message: 'Year and month required' });

    // Ensure 1-indexed month mapping correctly creates standard label format
    const d = new Date(year, month - 1, 1);
    const monthName = d.toLocaleString('default', { month: 'long' });
    const monthIndex = String(month).padStart(2, '0');
    const prefix = `${year}-${monthIndex}`;

    const employees = await Employee.find({});
    const records = [];

    for (const emp of employees) {
      if (!emp.EmpID || !emp.BaseSalary) continue;

      const baseMoney = Number(emp.BaseSalary);
      const dailyRate = baseMoney / 30;

      const leavesCount = await Attendance.countDocuments({
        EmpID: String(emp.EmpID),
        Status: 'Leave',
        Date: { $regex: `^${prefix}` }
      });

      const totalDeductions = roundMoney(leavesCount * dailyRate);
      const taxAmount = roundMoney(baseMoney * 0.10);
      const pfAmount = emp.pfActive === true ? roundMoney(baseMoney * 0.05) : 0;
      // Auto ₹10,000 bonus every January
      const bonus = (monthName === 'January') ? 10000 : 0;
      const netPay = roundMoney(baseMoney - totalDeductions - taxAmount - pfAmount + bonus);

      const payrollRecordDetails = {
        PayrollID: `PR-${emp.EmpID}-${year}-${monthIndex}`,
        EmpID: emp.EmpID,
        Month: monthName,
        Year: year,
        GrossPay: baseMoney,
        NetPay: netPay,
        Taxes: taxAmount,
        Bonus: bonus,
        totalDeductions: totalDeductions,
        Status: 'Pending'
      };

      const existingRecord = await Payroll.findOne({ EmpID: emp.EmpID, Month: monthName, Year: year });
      let savedRecord;

      if (existingRecord) {
        if (existingRecord.Status !== 'Paid') {
          savedRecord = await Payroll.findOneAndUpdate(
            { _id: existingRecord._id }, 
            payrollRecordDetails, 
            { new: true }
          );
        } else {
          savedRecord = existingRecord;
        }
      } else {
        savedRecord = await Payroll.create(payrollRecordDetails);
      }

      records.push({
        _id: savedRecord._id,
        EmpID: emp.EmpID,
        Name: emp.Name,
        BaseSalary: baseMoney,
        DaysOnLeave: leavesCount,
        LeaveDeductions: totalDeductions,
        NetPay: savedRecord.NetPay,
        Status: savedRecord.Status
      });
    }

    res.json({ success: true, records });
  } catch (error) {
    console.error('[PAO Payroll Generate] Error:', error);
    res.status(500).json({ success: false, message: 'Server generation failed' });
  }
});

// Payroll Runner: Mark payroll as paid
app.put('/api/payroll/mark-paid/:id', async (req, res) => {
  try {
    const payrollId = req.params.id;
    const { actionBy } = req.body || {};
    if (!payrollId) {
      return res.status(400).json({ success: false, message: 'Payroll ID is required' });
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (payroll.Status !== 'Paid') {
      payroll.Status = 'Paid';
      await payroll.save();

      await AuditLog.create({
        ActionBy_EmpID: actionBy || 'PAO',
        ActionType: 'PAYROLL_MARKED_PAID',
        Target_EmpID: payroll.EmpID,
        Details: `PAO disbursed payroll for ${payroll.EmpID} for ${payroll.Month}`,
        PreviousValue: { Status: 'Pending' },
        NewValue: {
          Status: 'Paid',
          PayrollID: payroll.PayrollID,
          Month: payroll.Month,
          Year: payroll.Year,
          NetPay: payroll.NetPay
        }
      });
    }
    res.json({ success: true, payroll });
  } catch (error) {
    console.error('[Payroll Runner] Error marking payroll paid:', error);
    res.status(500).json({ success: false, message: 'Unable to update payroll status' });
  }
});


// Dashboard Stats Endpoint (Admin + Audit read access)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({});

    // Current month payroll aggregation
    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();

    const payrollAgg = await Payroll.aggregate([
      { $match: { Month: monthName, Year: year } },
      {
        $group: {
          _id: null,
          totalNetPay: { $sum: '$NetPay' },
          totalTaxes: { $sum: '$Taxes' }
        }
      }
    ]);

    const monthlyPayout = payrollAgg.length > 0 ? payrollAgg[0].totalNetPay : 0;
    const totalTaxPool = payrollAgg.length > 0 ? payrollAgg[0].totalTaxes : 0;

    // PF Reserve: 5% of BaseSalary for all pfActive employees
    const pfAgg = await Employee.aggregate([
      { $match: { pfActive: true } },
      {
        $group: {
          _id: null,
          totalPF: { $sum: { $multiply: ['$BaseSalary', 0.05] } }
        }
      }
    ]);

    const pfReserve = pfAgg.length > 0 ? pfAgg[0].totalPF : 0;

    res.json({
      success: true,
      stats: {
        totalEmployees,
        monthlyPayout: Math.round((monthlyPayout + Number.EPSILON) * 100) / 100,
        totalTaxPool: Math.round((totalTaxPool + Number.EPSILON) * 100) / 100,
        pfReserve: Math.round((pfReserve + Number.EPSILON) * 100) / 100,
        month: monthName,
        year
      }
    });
  } catch (error) {
    console.error('[Stats] Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch stats' });
  }
});

// 6. Real DB Login Endpoint
app.post('/api/login', async (req, res) => {
  const { role, username, password, action } = req.body;

  if (!role) {
    return res.status(400).json({ success: false, message: 'Role is required' });
  }

  console.log(`[AUTH] Login attempt received for role: ${role}, username: ${username}`);

  try {
    // ---- ADMIN STRICT LOGIC ----
    if (role === 'Admin') {
      if (action === 'register') {
        return res.status(403).json({ success: false, message: 'Admin accounts cannot be registered via this portal.' });
      }

      if (username === 'ADMIN' && password === 'ADMIN') {
        return res.json({
          success: true,
          message: 'Admin authenticated successfully.',
          user: { name: 'Admin User', email: 'admin@auditpay.com' },
          role: 'Admin'
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
      }
    }

    // ---- DB LOOKUP FOR OTHER ROLES ----
    let user;
    let foundRole = role;

    if (role.toLowerCase() === 'employee') {
      user = await Employee.findOne({ EmpID: username });
    } else if (role.toLowerCase() === 'pao' || role === 'Payroll & Attendance Officer (PAO)') {
      user = await PAO.findOne({ PAOID: username });
      foundRole = 'pao';
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Try bcrypt first, fallback to plaintext for simple setup
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.Password);
    } catch(e) {
      isMatch = false;
    }
    
    if (!isMatch && password === user.Password) {
      isMatch = true; 
    }
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      message: `Successfully connected to backend. Authenticated as ${foundRole}.`,
      token: `mock-jwt-token-for-${foundRole.toLowerCase()}`,
      user: {
        name: user?.Name || username,
        role: foundRole.toLowerCase()
      }
    });

  } catch (err) {
    console.error(`[AUTH] Error during login:`, err);
    res.status(500).json({ success: false, message: 'Server Login Error' });
  }
});

// Fetch Audit Logs
app.get('/api/admin/audit-logs', async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role === 'pao') {
      filter = { ActionType: { $in: ['PAYROLL_MARKED_PAID', 'ATTENDANCE_MARKED', 'ATTENDANCE_UPDATED'] } };
    }
    const logs = await AuditLog.find(filter).sort({ Timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch audit logs' });
  }
});

// Attendance Routes
app.get('/api/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });

    const employees = await Employee.find({});
    const records = await Attendance.find({ Date: date });
    const attendanceMap = new Map();
    records.forEach(r => attendanceMap.set(r.EmpID, r));

    const enrichedRecords = employees.map(emp => {
      const existing = attendanceMap.get(emp.EmpID);
      return {
        _id: existing ? existing._id : `${emp.EmpID}-${date}`,
        EmpID: emp.EmpID,
        EmpName: emp.Name,
        DeptID: emp.DeptID || 'N/A',
        Date: date,
        Status: existing ? existing.Status : 'Present', // Default to Present
      };
    });

    res.json({ success: true, records: enrichedRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch attendance records' });
  }
});

app.post('/api/attendance/update', async (req, res) => {
  try {
    const { EmpID, Date, Status, actionBy } = req.body;
    if (!EmpID || !Date || !Status) {
       return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Upsert the record
    let record = await Attendance.findOne({ EmpID, Date });
    let prevStatus = 'Present';

    if (record) {
      prevStatus = record.Status;
      record.Status = Status;
      await record.save();
    } else {
      record = await Attendance.create({ EmpID, Date, Status });
    }

    await AuditLog.create({
      ActionBy_EmpID: actionBy || 'SYSTEM',
      ActionType: 'ATTENDANCE_UPDATED',
      Target_EmpID: EmpID,
      Details: `Attendance for ${Date} updated to ${Status}`,
      PreviousValue: { Status: prevStatus },
      NewValue: { Status }
    });
    
    res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

app.post('/api/attendance/mark-leave', async (req, res) => {
  try {
    console.log('[MARK LEAVE] Incoming payload:', req.body);
    const { EmpID, Date: dateStr, actionBy } = req.body;
    if (!EmpID || !dateStr) {
       console.log('[MARK LEAVE] Validation fail: EmpID or Date missing');
       return res.status(400).json({ success: false, message: `Missing required fields. Got EmpID=${EmpID}, Date=${dateStr}` });
    }
    
    // Upsert the record
    let record = await Attendance.findOne({ EmpID: String(EmpID), Date: String(dateStr) });
    let prevStatus = 'Present';

    if (record) {
      if (record.Status === 'Leave') return res.json({ success: true, message: 'Already marked as leave', record });
      prevStatus = record.Status;
      record.Status = 'Leave';
      await record.save();
    } else {
      record = await Attendance.create({ EmpID: String(EmpID), Date: String(dateStr), Status: 'Leave' });
    }

    const emp = await Employee.findOne({ EmpID: String(EmpID) });
    if (emp) {
       emp.totalLeaves = (emp.totalLeaves || 0) + 1;
       await emp.save();

       const d = new Date(dateStr);
       const month = d.toLocaleString('default', { month: 'long' });
       const year = d.getFullYear();
       const monthIndex = String(d.getMonth() + 1).padStart(2, '0');
       const prefix = `${year}-${monthIndex}`;

       const baseSalary = Number(emp.BaseSalary || 0);
       const dailyRate = baseSalary / 30;

       const leavesCount = await Attendance.countDocuments({
         EmpID: String(EmpID),
         Status: 'Leave',
         Date: { $regex: `^${prefix}` }
       });

       const totalDeductions = roundMoney(leavesCount * dailyRate);
       const taxAmount = roundMoney(baseSalary * 0.10);
       const pfAmount = emp.pfActive === true ? roundMoney(baseSalary * 0.05) : 0;
       const netPay = roundMoney(baseSalary - totalDeductions - taxAmount - pfAmount);

       const pendingPayroll = await Payroll.findOne({ EmpID: String(EmpID), Month: month, Year: year, Status: 'Pending' });
       if (pendingPayroll) {
         pendingPayroll.totalDeductions = totalDeductions;
         pendingPayroll.NetPay = netPay;
         await pendingPayroll.save();
       }
    }

    await AuditLog.create({
      ActionBy_EmpID: actionBy || 'SYSTEM',
      ActionType: 'ATTENDANCE_UPDATED',
      Target_EmpID: String(EmpID),
      Details: `PAO marked ${EmpID} as Leave for ${dateStr}`,
      PreviousValue: { Status: prevStatus },
      NewValue: { Status: 'Leave' }
    });
    
    console.log(`[MARK LEAVE] Success: ${EmpID} marked Leave for ${dateStr}`);
    res.json({ success: true, record });
  } catch (error) {
    console.error('[MARK LEAVE ERROR]:', error.message, error.stack);
    res.status(500).json({ success: false, message: `Mark leave failed: ${error.message}` });
  }
});

// System Insights & Drill-Downs
app.get('/api/attendance/:empId/:month', async (req, res) => {
  try {
    const { empId, month } = req.params;
    const records = await Attendance.find({
      EmpID: empId,
      Date: { $regex: `^${month}` }
    }).sort({ Date: 1 });
    res.json({ success: true, records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Unable to fetch monthly attendance' });
  }
});

app.get('/api/admin/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const salaryDistributionRaw = await Employee.aggregate([
      { $group: { _id: "$DeptID", totalSalary: { $sum: "$BaseSalary" } } }
    ]);
    const salaryDistribution = salaryDistributionRaw.map(d => ({
       name: d._id || 'Unassigned',
       value: d.totalSalary
    }));

    const monthlyTrendRaw = await Payroll.aggregate([
      { $group: { _id: { month: "$Month", year: "$Year" }, sumNetPay: { $sum: "$NetPay" } } }
    ]);

    const monthlyTrend = monthlyTrendRaw
      .map(item => ({
        name: `${item._id.month} ${item._id.year}`,
        value: item.sumNetPay,
        dateValue: new Date(`${item._id.month} 1, ${item._id.year}`).getTime()
      }))
      .sort((a,b) => a.dateValue - b.dateValue)
      .slice(-6);

    let heatmapMatch = { Status: 'Leave' };
    if (startDate && endDate) {
      heatmapMatch.Date = { $gte: startDate, $lte: endDate };
    }

    const heatmapRaw = await Attendance.aggregate([
      { $match: heatmapMatch },
      { $project: { dayOfWeek: { $dayOfWeek: { $dateFromString: { dateString: "$Date" } } } } },
      { $group: { _id: "$dayOfWeek", count: { $sum: 1 } } }
    ]);

    console.log('[Analytics] Aggregated Data Sent to Frontend:', { salaryDistribution, monthlyTrend, heatmapRaw });
    res.json({ success: true, salaryDistribution, monthlyTrend, heatmapRaw });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch analytics' });
  }
});

// Mock Employee Generator
const MOCK_FIRST_NAMES = ['Aarav', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Kavya', 'Dev', 'Ishita', 'Rohan', 'Meera', 'Kiran', 'Nisha', 'Siddharth', 'Pooja', 'Aditya', 'Divya', 'Manish', 'Ritu'];
const MOCK_LAST_NAMES = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Joshi', 'Verma', 'Iyer', 'Rao', 'Mehta', 'Bose', 'Chatterjee', 'Pillai'];
const MOCK_DEPTS = ['151 - Engineering', '152 - Marketing', '153 - Finance'];

app.post('/api/admin/generate-mock-employee', async (req, res) => {
  try {
    const firstName = MOCK_FIRST_NAMES[Math.floor(Math.random() * MOCK_FIRST_NAMES.length)];
    const lastName = MOCK_LAST_NAMES[Math.floor(Math.random() * MOCK_LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const empId = String(Math.floor(1000 + Math.random() * 9000));
    const dept = MOCK_DEPTS[Math.floor(Math.random() * MOCK_DEPTS.length)];
    const baseSalary = Math.round((30000 + Math.random() * 90000) / 1000) * 1000;
    const pfActive = Math.random() > 0.5;
    const bankAcc = `HDFC${Math.floor(100000000 + Math.random() * 900000000)}`;

    // Random joining date in 2024
    const startOf2024 = new Date(2024, 0, 1).getTime();
    const endOf2024 = new Date(2024, 11, 31).getTime();
    const randomJoinTs = startOf2024 + Math.random() * (endOf2024 - startOf2024);
    const joiningDate = new Date(randomJoinTs);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const newEmployee = new Employee({
      EmpID: empId,
      Name: name,
      DeptID: dept,
      JoiningDate: joiningDate,
      Password: hashedPassword,
      BaseSalary: baseSalary,
      BankAccount: bankAcc,
      role: 'employee',
      pfActive: pfActive
    });

    await newEmployee.save();
    console.log(`[MOCK] Generated employee: ${empId} - ${name} (${dept})`);

    res.json({ success: true, message: `Mock employee ${name} (${empId}) created!`, employee: newEmployee });
  } catch (error) {
    console.error('[MOCK ERROR]:', error.message);
    res.status(500).json({ success: false, message: `Failed to generate mock employee: ${error.message}` });
  }
});

// ==========================================
// ADMIN BONUS MANAGEMENT
// ==========================================

// List employees for bonus dropdown
app.get('/api/admin/employees-for-bonus', async (req, res) => {
  try {
    const employees = await Employee.find({}, 'EmpID Name DeptID BaseSalary').sort({ Name: 1 });
    res.json({ success: true, employees });
  } catch (error) {
    console.error('[BONUS] Error fetching employees:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

// Award bonus to an employee for the current month
app.post('/api/admin/award-bonus', async (req, res) => {
  try {
    const { empId, amount, reason } = req.body;
    if (!empId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Employee ID and a positive bonus amount are required.' });
    }

    const emp = await Employee.findOne({ EmpID: empId });
    if (!emp) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const now = new Date();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    const monthIndex = String(now.getMonth() + 1).padStart(2, '0');

    // Find existing payroll for this month or create one
    let payroll = await Payroll.findOne({ EmpID: empId, Month: monthName, Year: year });

    if (payroll) {
      // Update existing payroll with bonus
      const oldBonus = payroll.Bonus || 0;
      const newBonus = oldBonus + Number(amount);
      const bonusDelta = Number(amount);
      payroll.Bonus = newBonus;
      payroll.NetPay = roundMoney((payroll.NetPay || 0) + bonusDelta);
      await payroll.save();
      console.log(`[BONUS] Updated payroll for ${empId} ${monthName} ${year}: +${amount}, total bonus: ${newBonus}`);
    } else {
      // Create a new payroll record with bonus
      const baseSalary = Number(emp.BaseSalary || 0);
      const taxAmount = roundMoney(baseSalary * 0.10);
      const pfAmount = emp.pfActive === true ? roundMoney(baseSalary * 0.05) : 0;
      const bonusAmount = Number(amount);
      const janBonus = (monthName === 'January') ? 10000 : 0;
      const totalBonus = bonusAmount + janBonus;
      const netPay = roundMoney(baseSalary - taxAmount - pfAmount + totalBonus);

      payroll = await Payroll.create({
        PayrollID: `PR-${empId}-${year}-${monthIndex}`,
        EmpID: empId,
        Month: monthName,
        Year: year,
        BaseSalary: baseSalary,
        GrossPay: baseSalary,
        Taxes: taxAmount,
        PF: pfAmount,
        Bonus: totalBonus,
        totalDeductions: 0,
        NetPay: netPay,
        Status: 'Pending'
      });
      console.log(`[BONUS] Created payroll for ${empId} ${monthName} ${year} with bonus ${totalBonus}`);
    }

    // Audit log
    await AuditLog.create({
      ActionBy_EmpID: 'ADMIN',
      ActionType: 'AWARD_BONUS',
      Target_EmpID: empId,
      Details: `Admin awarded bonus ${amount} to ${emp.Name} (${empId}) for ${monthName} ${year}. Reason: ${reason || 'N/A'}`
    });

    res.json({
      success: true,
      message: `Bonus of ${Number(amount).toLocaleString('en-IN')} awarded to ${emp.Name} (${empId}) for ${monthName} ${year}.`,
      payroll
    });
  } catch (error) {
    console.error('[BONUS] Error awarding bonus:', error);
    res.status(500).json({ success: false, message: 'Failed to award bonus' });
  }
});

// 7. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is actively running on port: ${PORT}`);
});

// ==========================================
// EMPLOYEE SELF-SERVICE ENDPOINTS
// ==========================================

const employeeOnly = (req, res, next) => {
  req.user = req.user || { EmpID: req.headers['empid'] || 'EMP001', role: 'Employee' };
  console.log('[AUTH MIDDLEWARE] Logged in EmpID:', req.user.EmpID);
  next();
};

app.get('/api/employee/me/overview', employeeOnly, async (req, res) => {
  try {
    const emp = await Employee.findOne({ EmpID: req.user.EmpID });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const leaveCount = await Attendance.countDocuments({ EmpID: req.user.EmpID, Status: 'Leave', Date: { $regex: `^${prefix}` } });
    
    res.json({
      name: emp.Name,
      empID: emp.EmpID,
      baseSalary: emp.BaseSalary,
      leavesTaken: leaveCount,
      dailyRate: emp.BaseSalary / 30,
      pfActive: emp.pfActive
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

app.get('/api/attendance/me', employeeOnly, async (req, res) => {
  try {
    const empId = String(req.user.EmpID);
    console.log('[ATTENDANCE/ME] Fetching attendance for EmpID:', empId);
    const history = await Attendance.find({ EmpID: empId });
    console.log('[ATTENDANCE/ME] Found', history.length, 'records');
    res.json(history);
  } catch (error) {
    console.error('[ATTENDANCE/ME] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

app.post('/api/leaves/request', employeeOnly, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    // Security: Use EmpID from auth header, NOT body
    const empId = String(req.user.EmpID);
    console.log('[LEAVE REQUEST] EmpID:', empId, 'Start:', startDate, 'End:', endDate);

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Start date, end date, and reason are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be before start date.' });
    }

    // Calculate total days (inclusive)
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leaveReq = new LeaveRequest({
      EmpID: empId,
      startDate: start,
      endDate: end,
      reason,
      totalDays,
      status: 'Pending'
    });
    await leaveReq.save();
    console.log('[LEAVE REQUEST] Saved:', leaveReq._id, 'TotalDays:', totalDays);
    res.status(200).json({ message: 'Leave request submitted successfully', leaveReq, totalDays });
  } catch (error) {
    console.error('[LEAVE REQUEST] Error:', error.message);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

app.get('/api/payroll/me', employeeOnly, async (req, res) => {
  try {
    const empId = String(req.user.EmpID);
    console.log('[PAYROLL/ME] Fetching payroll for EmpID:', empId);
    const history = await Payroll.find({ EmpID: empId, Status: 'Paid' }).sort({ createdAt: -1 });
    console.log('[PAYROLL/ME] Found', history.length, 'paid records');
    res.status(200).json(history);
  } catch (error) {
    console.error('[PAYROLL/ME] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch salary history' });
  }
});

// ==========================================
// TEST DATA SEEDING ENDPOINT
// ==========================================
app.post('/api/seed/employee-data', employeeOnly, async (req, res) => {
  try {
    const empId = String(req.user.EmpID);
    console.log('[SEED] Seeding test data for EmpID:', empId);

    const emp = await Employee.findOne({ EmpID: empId });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const baseSalary = Number(emp.BaseSalary || 50000);
    const pfActive = emp.pfActive === true;
    const now = new Date();
    let payrollCreated = 0;
    let attendanceCreated = 0;

    // Seed 3 months of past "Paid" payroll records
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'long' });
      const year = d.getFullYear();
      const monthIndex = String(d.getMonth() + 1).padStart(2, '0');

      const existing = await Payroll.findOne({ EmpID: empId, Month: monthName, Year: year });
      if (!existing) {
        const taxAmount = roundMoney(baseSalary * 0.10);
        const pfAmount = pfActive ? roundMoney(baseSalary * 0.05) : 0;
        const netPay = roundMoney(baseSalary - taxAmount - pfAmount);

        await Payroll.create({
          PayrollID: `PR-${empId}-${year}-${monthIndex}`,
          EmpID: empId,
          Month: monthName,
          Year: year,
          GrossPay: baseSalary,
          NetPay: netPay,
          Taxes: taxAmount,
          totalDeductions: 0,
          Status: 'Paid'
        });
        payrollCreated++;
      }
    }

    // Seed 15 days of attendance for current month (mix of Present and Leave)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const maxDay = Math.min(now.getDate(), daysInMonth);
    const daysToSeed = Math.min(15, maxDay);

    for (let i = 1; i <= daysToSeed; i++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const existing = await Attendance.findOne({ EmpID: empId, Date: dateStr });
      if (!existing) {
        // Make roughly 2-3 days leave, rest present
        const status = (i === 3 || i === 7 || i === 12) ? 'Leave' : 'Present';
        await Attendance.create({ EmpID: empId, Date: dateStr, Status: status });
        attendanceCreated++;
      }
    }

    console.log(`[SEED] Done: ${payrollCreated} payroll, ${attendanceCreated} attendance records created`);
    res.json({
      success: true,
      message: `Seeded ${payrollCreated} payroll records and ${attendanceCreated} attendance records for ${empId}`,
      payrollCreated,
      attendanceCreated
    });
  } catch (error) {
    console.error('[SEED] Error:', error.message);
    res.status(500).json({ error: 'Failed to seed employee data' });
  }
});

// ==========================================
// LEAVE MANAGEMENT ROUTES
// ==========================================

// Employee: Get my leave history
app.get('/api/leaves/me', employeeOnly, async (req, res) => {
  try {
    const empId = String(req.user.EmpID);
    console.log('[LEAVES/ME] Fetching leave history for EmpID:', empId);
    const leaves = await LeaveRequest.find({ EmpID: empId }).sort({ appliedOn: -1 });
    console.log('[LEAVES/ME] Found', leaves.length, 'leave records');
    res.json(leaves);
  } catch (error) {
    console.error('[LEAVES/ME] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leave history' });
  }
});

// Admin: Get all pending leave requests (with employee names)
app.get('/api/leaves/pending', async (req, res) => {
  try {
    const pendingLeaves = await LeaveRequest.find({ status: 'Pending' }).sort({ appliedOn: -1 });
    
    // Enrich with employee names
    const enriched = await Promise.all(pendingLeaves.map(async (leave) => {
      const emp = await Employee.findOne({ EmpID: leave.EmpID });
      return {
        ...leave.toObject(),
        employeeName: emp ? emp.Name : leave.EmpID
      };
    }));
    
    console.log('[LEAVES/PENDING] Found', enriched.length, 'pending requests');
    res.json(enriched);
  } catch (error) {
    console.error('[LEAVES/PENDING] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch pending leaves' });
  }
});

// Admin: Approve a leave request
app.put('/api/leaves/approve/:id', async (req, res) => {
  try {
    const leaveReq = await LeaveRequest.findById(req.params.id);
    if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });
    if (leaveReq.status !== 'Pending') return res.status(400).json({ error: 'Leave is already ' + leaveReq.status });

    // Update status to Approved
    leaveReq.status = 'Approved';
    await leaveReq.save();
    console.log('[LEAVE APPROVE] Approved leave', leaveReq._id, 'for EmpID:', leaveReq.EmpID);

    // Auto-insert attendance records for each day in the leave range
    const start = new Date(leaveReq.startDate);
    const end = new Date(leaveReq.endDate);
    let attendanceCreated = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = await Attendance.findOne({ EmpID: leaveReq.EmpID, Date: dateStr });
      if (!existing) {
        await Attendance.create({ EmpID: leaveReq.EmpID, Date: dateStr, Status: 'Leave' });
        attendanceCreated++;
      } else if (existing.Status !== 'Leave') {
        existing.Status = 'Leave';
        await existing.save();
        attendanceCreated++;
      }
    }

    console.log(`[LEAVE APPROVE] Created/updated ${attendanceCreated} attendance records as 'Leave'`);

    // Log to Audit_Log
    await AuditLog.create({
      ActionBy_EmpID: 'ADMIN',
      ActionType: 'APPROVE_LEAVE',
      Target_EmpID: leaveReq.EmpID,
      Details: `Admin approved leave for ${leaveReq.EmpID} (${leaveReq.totalDays} days: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`
    });

    res.json({
      success: true,
      message: `Leave approved. ${attendanceCreated} attendance records synced.`,
      attendanceCreated
    });
  } catch (error) {
    console.error('[LEAVE APPROVE] Error:', error.message);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// Admin: Reject a leave request
app.put('/api/leaves/reject/:id', async (req, res) => {
  try {
    const leaveReq = await LeaveRequest.findById(req.params.id);
    if (!leaveReq) return res.status(404).json({ error: 'Leave request not found' });
    if (leaveReq.status !== 'Pending') return res.status(400).json({ error: 'Leave is already ' + leaveReq.status });

    // Update status to Rejected
    leaveReq.status = 'Rejected';
    await leaveReq.save();
    console.log('[LEAVE REJECT] Rejected leave', leaveReq._id, 'for EmpID:', leaveReq.EmpID);

    // Log to Audit_Log
    await AuditLog.create({
      ActionBy_EmpID: 'ADMIN',
      ActionType: 'REJECT_LEAVE',
      Target_EmpID: leaveReq.EmpID,
      Details: `Admin rejected leave for ${leaveReq.EmpID} (${leaveReq.totalDays} days requested)`
    });

    res.json({
      success: true,
      message: `Leave request rejected for ${leaveReq.EmpID}.`
    });
  } catch (error) {
    console.error('[LEAVE REJECT] Error:', error.message);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});
