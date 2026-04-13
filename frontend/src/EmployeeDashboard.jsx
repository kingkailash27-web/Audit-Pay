import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './AdminDashboard.css';
import './EmployeeDashboard.css';
import EmployeeSidebar from './EmployeeSidebar';
import MyLeaves from './MyLeaves';

const API_BASE = '';

const EmployeeDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Leave form state
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveValidationErr, setLeaveValidationErr] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);
  const [leaveToast, setLeaveToast] = useState(null);

  // Seed data state
  const [seeding, setSeeding] = useState(false);

  // Formatter for Currency
  const formatRupee = (value) => {
    if (value == null || isNaN(value)) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN')}`;
  };

  const empID = localStorage.getItem('empID') || 'EMP001';
  const token = localStorage.getItem('token') || '';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'empid': empID
  });

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...getHeaders(), ...(options.headers || {}) }
    });
    return res;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [overviewRes, attendanceRes, payrollRes] = await Promise.all([
          apiFetch('/api/employee/me/overview'),
          apiFetch('/api/attendance/me'),
          apiFetch('/api/payroll/me')
        ]);

        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          setEmployeeData({
            name: overviewData.name,
            baseSalary: overviewData.baseSalary,
            leavesTaken: overviewData.leavesTaken,
            dailyRate: overviewData.dailyRate,
            pfActive: overviewData.pfActive
          });
        }

        if (payrollRes.ok) {
          const payrollData = await payrollRes.json();
          const mappedHistory = payrollData.map(p => ({
            month: `${p.Month} ${p.Year}`,
            base: p.GrossPay,
            taxes: p.Taxes,
            pf: p.pfActive ? (p.GrossPay * 0.05) : 0,
            deductions: p.totalDeductions || 0,
            bonus: p.Bonus || 0,
            net: p.NetPay,
            status: p.Status
          }));
          setSalaryHistory(mappedHistory);
        }

        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          setAttendance(attendanceData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [empID]);

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('empID');
    if (onLogout) onLogout();
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  // Calculate total leave days from dates
  const calcLeaveDays = () => {
    if (!leaveStart || !leaveEnd) return 0;
    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    if (end < start) return -1;
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveDays = calcLeaveDays();

  // Validate dates when they change
  useEffect(() => {
    if (leaveStart && leaveEnd) {
      if (leaveDays < 0) {
        setLeaveValidationErr('End date cannot be before start date.');
      } else {
        setLeaveValidationErr('');
      }
    } else {
      setLeaveValidationErr('');
    }
  }, [leaveStart, leaveEnd]);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (leaveDays < 0) return;
    if (!leaveReason.trim()) return;

    setLeaveSubmitting(true);
    setLeaveToast(null);
    try {
      const res = await apiFetch('/api/leaves/request', {
        method: 'POST',
        body: JSON.stringify({
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveSent(true);
        setLeaveToast({ type: 'success', message: '✅ Your leave request has been successfully sent to the PAO.' });
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
        setTimeout(() => setLeaveSent(false), 2500);
        setTimeout(() => setLeaveToast(null), 6000);
      } else {
        setLeaveToast({ type: 'error', message: data.error || 'Failed to submit leave request.' });
        setTimeout(() => setLeaveToast(null), 5000);
      }
    } catch (error) {
      console.error(error);
      setLeaveToast({ type: 'error', message: 'Network error. Ensure backend is running.' });
      setTimeout(() => setLeaveToast(null), 5000);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const res = await apiFetch('/api/seed/employee-data', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${data.message}`);
        window.location.reload();
      } else {
        alert(`Error: ${data.error || 'Seed failed'}`);
      }
    } catch (err) {
      alert('Failed to seed data. Ensure backend is running.');
    } finally {
      setSeeding(false);
    }
  };

  const downloadPayslip = (record) => {
    const printDiv = document.createElement('div');
    printDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #0F172A;">
        <h1 style="color: #3B82F6; text-align: center;">AuditPay</h1>
        <h2 style="text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px;">Payslip - ${record.month}</h2>
        <p><strong>Employee ID:</strong> ${empID}</p>
        <p><strong>Employee Name:</strong> ${employeeData?.name || 'Employee'}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr style="background-color: #F8FAFC; border: 1px solid #CBD5E1;">
            <th style="padding: 12px; text-align: left; border: 1px solid #CBD5E1;">Earnings</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">Amount (₹)</th>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #CBD5E1;">Base Salary</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">${formatRupee(record.base)}</td>
          </tr>
          <tr style="background-color: #F8FAFC; border: 1px solid #CBD5E1;">
            <th style="padding: 12px; text-align: left; border: 1px solid #CBD5E1;">Deductions</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">Amount (₹)</th>
          </tr>
           <tr>
            <td style="padding: 12px; border: 1px solid #CBD5E1;">Leave Deductions</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">${formatRupee(record.deductions)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #CBD5E1;">Taxes (10%)</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">${formatRupee(record.taxes)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #CBD5E1;">PF (5%)</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #CBD5E1;">${formatRupee(record.pf)}</td>
          </tr>
          ${record.bonus > 0 ? `
          <tr style="background-color: #F0FDF4;">
            <td style="padding: 12px; border: 1px solid #CBD5E1; color: #16a34a; font-weight: 600;">Bonus</td>
            <td style="padding: 12px; text-align: right; border: 1px solid #CBD5E1; color: #16a34a; font-weight: 600;">+${formatRupee(record.bonus)}</td>
          </tr>` : ''}
          <tr style="background-color: #0F172A; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #0F172A;">Net Pay</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #0F172A;">${formatRupee(record.net)}</th>
          </tr>
        </table>
        <p style="margin-top: 50px; text-align: center; color: #64748B; font-size: 12px;">This is a computer-generated document. No signature is required.</p>
      </div>
    `;
    document.body.appendChild(printDiv);
    import('html2pdf.js').then(({ default: html2pdf }) => {
      html2pdf().from(printDiv).set({
        margin: 1,
        filename: `Payslip_${record.month}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      }).save().then(() => {
        document.body.removeChild(printDiv);
      });
    });
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = employeeData?.name || 'E';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0]?.toUpperCase() || 'E';
  };

  const renderLoading = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <span className="loading-text">Loading your dashboard...</span>
    </div>
  );

  const renderEmptyState = (icon, title, subtitle) => (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h4>{title}</h4>
      <p>{subtitle}</p>
      <button className="seed-btn" onClick={handleSeedData} disabled={seeding}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {seeding ? 'Seeding...' : 'Seed Test Data'}
      </button>
    </div>
  );

  const renderOverview = () => {
    if (isLoading) return renderLoading();
    
    if (!employeeData) {
      return (
        <div className="tab-pane">
          <h2>My Overview</h2>
          {renderEmptyState(
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>,
            'No employee data found',
            'Your profile data could not be loaded. Contact your administrator or seed test data.'
          )}
        </div>
      );
    }

    const currBase = employeeData.baseSalary;
    const leaves = employeeData.leavesTaken;
    const daily = employeeData.dailyRate;
    const taxes = currBase * 0.10;
    const pf = employeeData.pfActive ? (currBase * 0.05) : 0;
    const leaveDeductions = leaves * daily;
    const netPay = currBase - leaveDeductions - taxes - pf;

    // Pay breakdown percentages
    const total = currBase || 1;
    const netPct = Math.max(0, (netPay / total) * 100);
    const taxPct = (taxes / total) * 100;
    const pfPct = (pf / total) * 100;
    const leavePct = (leaveDeductions / total) * 100;

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const workingDays = Math.min(today.getDate(), daysInMonth);

    return (
      <div className="tab-pane">
        <h2>My Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <h3>Leaves This Month</h3>
            <p>{leaves}</p>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            </div>
            <h3>Working Days</h3>
            <p>{workingDays - leaves} <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 400 }}>/ {workingDays}</span></p>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            </div>
            <h3>Estimated Net Pay</h3>
            <p className="highlight">{formatRupee(Math.round(netPay))}</p>
          </div>
        </div>

        {/* Pay Breakdown */}
        <div className="pay-breakdown-container">
          <h3>Monthly Pay Breakdown</h3>
          <div className="pay-breakdown-bar">
            <div className="pay-segment net" style={{ width: `${netPct}%` }}></div>
            <div className="pay-segment tax" style={{ width: `${taxPct}%` }}></div>
            <div className="pay-segment pf" style={{ width: `${pfPct}%` }}></div>
            <div className="pay-segment leave" style={{ width: `${leavePct}%` }}></div>
          </div>
          <div className="pay-breakdown-legend">
            <div className="pay-legend-item">
              <span className="pay-legend-dot net"></span>
              Net Pay<span className="pay-legend-value">{formatRupee(Math.round(netPay))}</span>
            </div>
            <div className="pay-legend-item">
              <span className="pay-legend-dot tax"></span>
              Tax (10%)<span className="pay-legend-value">{formatRupee(Math.round(taxes))}</span>
            </div>
            {employeeData.pfActive && (
              <div className="pay-legend-item">
                <span className="pay-legend-dot pf"></span>
                PF (5%)<span className="pay-legend-value">{formatRupee(Math.round(pf))}</span>
              </div>
            )}
            {leaveDeductions > 0 && (
              <div className="pay-legend-item">
                <span className="pay-legend-dot leave"></span>
                Leave Ded.<span className="pay-legend-value">{formatRupee(Math.round(leaveDeductions))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {salaryHistory.length > 0 ? (
          <div className="chart-container">
            <h3>Net Pay History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salaryHistory.slice().sort((a, b) => {
                try {
                  const partsA = a.month.split(' ');
                  const partsB = b.month.split(' ');
                  const dateA = new Date(`${partsA[0]} 1, ${partsA[1] || '2026'}`);
                  const dateB = new Date(`${partsB[0]} 1, ${partsB[1] || '2026'}`);
                  return dateA - dateB;
                } catch { return 0; }
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickFormatter={(val) => { try { const parts = val.split(' '); const d = new Date(parts[0] + ' 1, ' + (parts[1] || '2026')); return isNaN(d.getTime()) ? val : d.toLocaleString('default', { month: 'short' }); } catch { return val; } }} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={v => `\u20B9${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '10px', color: '#F8FAFC' }}
                  formatter={(value, name) => {
                    if (name === 'net') return [formatRupee(value), 'Net Pay'];
                    if (name === 'bonus') return [formatRupee(value), 'Bonus'];
                    return [formatRupee(value), name];
                  }}
                />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#1E293B' }} activeDot={{ r: 8, fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container">
            <h3>Net Pay History</h3>
            {renderEmptyState(
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-4 4"/></svg>,
              'No pay history yet',
              'Salary history will appear once payroll records are generated.'
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAttendance = () => {
    if (isLoading) return renderLoading();

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();
    const monthName = today.toLocaleString('default', { month: 'long' });

    // Calc stats
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthAttendance = attendance.filter(a => a.Date?.startsWith(prefix));
    const presentCount = monthAttendance.filter(a => a.Status === 'Present').length;
    const leaveCount = monthAttendance.filter(a => a.Status === 'Leave').length;
    const totalTracked = presentCount + leaveCount;

    return (
      <div className="tab-pane">
        <h2>My Attendance</h2>

        {/* Mini Stats */}
        <div className="attendance-stats-row">
          <div className="attendance-mini-stat">
            <div className="mini-stat-value green">{presentCount}</div>
            <div className="mini-stat-label">Days Present</div>
          </div>
          <div className="attendance-mini-stat">
            <div className="mini-stat-value red">{leaveCount}</div>
            <div className="mini-stat-label">Days on Leave</div>
          </div>
          <div className="attendance-mini-stat">
            <div className="mini-stat-value blue">{daysInMonth - currentDay}</div>
            <div className="mini-stat-label">Remaining Days</div>
          </div>
        </div>



        {/* Calendar */}
        <div className="attendance-grid-container">
          <h3>Monthly Attendance</h3>
          <p className="attendance-month-label">{monthName} {year}</p>
          <div className="attendance-legend">
            <span className="legend present">Present</span>
            <span className="legend leave">Leave</span>
            <span className="legend future">Future / Untracked</span>
          </div>
          <div className="calendar-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            {(() => {
              let firstDayIndex = new Date(year, month, 1).getDay();
              firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

              const cells = [];
              for (let i = 0; i < firstDayIndex; i++) {
                cells.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
              }

              for (let i = 1; i <= daysInMonth; i++) {
                let statusClass = 'future';
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

                if (i < currentDay) {
                  const rec = attendance.find(a => a.Date === dateStr);
                  statusClass = (rec && rec.Status === 'Leave') ? 'leave' : 'present';
                } else if (i === currentDay) {
                  statusClass = 'today';
                }

                cells.push(
                  <div key={`day-${i}`} className={`calendar-day ${statusClass}`} title={`${dateStr} — ${statusClass === 'today' ? 'Today' : statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}`}>
                    <span className="calendar-num">{i}</span>
                    {statusClass === 'leave' && <span className="calendar-tag">Leave</span>}
                    {statusClass === 'today' && <span className="calendar-tag">Today</span>}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderSalaryHistory = () => {
    if (isLoading) return renderLoading();

    return (
      <div className="tab-pane">
        <h2>My Salary History</h2>
        {salaryHistory.length === 0 ? (
          <div className="table-responsive">
            {renderEmptyState(
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
              'No salary records available yet',
              'Your salary history will appear here once payroll records are processed and marked as paid.'
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Month/Year</th>
                  <th>Base Salary</th>
                  <th>Leave Deductions</th>
                  <th>Taxes (10%)</th>
                  <th>PF (5%)</th>
                  <th>Bonus</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {salaryHistory.map((record, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600 }}>{record.month}</td>
                    <td>{formatRupee(record.base)}</td>
                    <td className="deduction">{formatRupee(record.deductions)}</td>
                    <td className="deduction">{formatRupee(record.taxes)}</td>
                    <td className="deduction">{formatRupee(record.pf)}</td>
                    <td style={{ color: record.bonus > 0 ? '#10B981' : '#64748B', fontWeight: record.bonus > 0 ? 600 : 400 }}>{record.bonus > 0 ? `+${formatRupee(record.bonus)}` : '—'}</td>
                    <td className="net-pay">{formatRupee(record.net)}</td>
                    <td>
                      <span className={`status-badge ${record.status?.toLowerCase()}`}>
                        {record.status === 'Paid' && '●'} {record.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-secondary" onClick={() => downloadPayslip(record)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`admin-dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <EmployeeSidebar
        currentView={activeTab}
        onViewChange={setActiveTab}
        onLogout={handleLogoutClick}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        employeeName={employeeData ? employeeData.name : 'Employee'}
        empID={empID}
      />

      <main className="admin-main">
        <header className="employee-topbar">
          <div className="welcome-msg">
            <h2>Welcome back, {employeeData ? employeeData.name : 'Employee'}</h2>
            <p>EmpID: {empID} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </header>

        <div className="employee-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'salary' && renderSalaryHistory()}
          {activeTab === 'leaves' && <MyLeaves empID={empID} token={token} />}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;