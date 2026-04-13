import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import AdminSidebar from './AdminSidebar';
import AddEmployeeForm from './AddEmployeeForm';
import PayrollRunner from './PayrollRunner';
import AuditLogs from './AuditLogs';
import AttendanceModule from './AttendanceModule';
import AnalyticsDashboard from './AnalyticsDashboard';
import PAOPayroll from './PAOPayroll';
import LeaveApprovals from './LeaveApprovals';

// ── Helpers ──────────────────────────────────────────────
const formatRupee = (value) => {
    if (value == null || isNaN(value)) return '₹0';
    return `₹${Number(value).toLocaleString('en-IN')}`;
};

const safeDate = (raw) => {
    if (!raw) return 'N/A';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Department options for filter
const DEPARTMENTS = [
    { value: '', label: 'All Departments' },
    { value: '151', label: '151 - Engineering' },
    { value: '152', label: '152 - Finance' },
    { value: '153', label: '153 - Human Resources' },
    { value: '154', label: '154 - Marketing' },
];

function AdminDashboard({ user, onLogout }) {
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [loading, setIsLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [currentView, setCurrentView] = useState(user?.role === 'pao' ? 'attendance' : 'directory');
    const [toastMessage, setToastMessage] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [mockLoading, setMockLoading] = useState(false);

    // Dashboard Stats
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Bonus State
    const [bonusEmployees, setBonusEmployees] = useState([]);
    const [bonusEmpId, setBonusEmpId] = useState('');
    const [bonusAmount, setBonusAmount] = useState('');
    const [bonusReason, setBonusReason] = useState('');
    const [bonusSubmitting, setBonusSubmitting] = useState(false);
    const [bonusToast, setBonusToast] = useState(null);

    // ── Fetch Stats ──────────────────────────────────────
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // ── Fetch Employees ──────────────────────────────────
    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('query', searchQuery);
            if (deptFilter) params.set('deptId', deptFilter);
            const response = await fetch(`http://localhost:5000/api/employees/search?${params.toString()}`);
            const data = await response.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, deptFilter]);

    useEffect(() => {
        if (currentView !== 'directory') return;
        const debounceTimeout = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(debounceTimeout);
    }, [currentView, fetchEmployees]);

    // ── Handlers ─────────────────────────────────────────
    const handleAddEmployeeSuccess = (msg) => {
        setToastMessage(msg);
        setCurrentView('directory');
        fetchStats();
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleEditEmployee = (emp) => {
        setEditingEmployee({ ...emp });
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/admin/update-employee/${editingEmployee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingEmployee)
            });
            const data = await response.json();
            if (response.ok) {
                setToastMessage('Employee updated successfully');
                setEditingEmployee(null);
                fetchEmployees();
                fetchStats();
                setTimeout(() => setToastMessage(''), 3000);
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (error) {
            console.error("Error updating employee:", error);
            alert("Error updating employee");
        }
    };

    const handleDeleteEmployee = (emp) => {
        setEmployeeToDelete(emp);
    };

    const confirmDeleteEmployee = async () => {
        if (!employeeToDelete) return;
        try {
            const response = await fetch(`http://localhost:5000/api/admin/delete-employee/${employeeToDelete._id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (response.ok) {
                setToastMessage('Employee deleted successfully');
                setEmployeeToDelete(null);
                fetchEmployees();
                fetchStats();
                setTimeout(() => setToastMessage(''), 3000);
            } else {
                alert(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Error deleting employee");
        }
    };

    const submitAddPAO = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        data.role = 'pao';

        try {
            const response = await fetch(`http://localhost:5000/api/admin/add-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                setToastMessage('PAO account created successfully!');
                e.target.reset();
                setTimeout(() => setToastMessage(''), 3000);
            } else {
                const result = await response.json();
                alert(result.message || 'Error occurred');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating PAO account');
        }
    };

    const generateMockEmployee = async () => {
        setMockLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/generate-mock-employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok) {
                setToastMessage(data.message || 'Mock employee generated!');
                fetchEmployees();
                fetchStats();
                setTimeout(() => setToastMessage(''), 4000);
            } else {
                alert(data.message || 'Failed to generate mock employee');
            }
        } catch (err) {
            console.error('Error generating mock employee:', err);
            alert('Network error generating mock employee');
        } finally {
            setMockLoading(false);
        }
    };

    // ── Stats Cards Config ───────────────────────────────
    const statsCards = [
        {
            id: 'total-employees',
            label: 'Total Employees',
            value: stats ? stats.totalEmployees : '—',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
            ),
            color: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.08)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
        },
        {
            id: 'monthly-payout',
            label: 'Monthly Payout',
            value: stats ? formatRupee(stats.monthlyPayout) : '—',
            subtitle: stats ? `${stats.month} ${stats.year}` : '',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
            ),
            color: '#4ade80',
            bg: 'rgba(74, 222, 128, 0.08)',
            borderColor: 'rgba(74, 222, 128, 0.2)',
        },
        {
            id: 'tax-pool',
            label: 'Total Tax Pool',
            value: stats ? formatRupee(stats.totalTaxPool) : '—',
            subtitle: '10% of Base Salary',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
            ),
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.08)',
            borderColor: 'rgba(245, 158, 11, 0.2)',
        },
        {
            id: 'pf-reserve',
            label: 'PF Reserve',
            value: stats ? formatRupee(stats.pfReserve) : '—',
            subtitle: '5% (active PF only)',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                    <path d="M3 5v14a2 2 0 002 2h16v-5" />
                    <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
            ),
            color: '#a78bfa',
            bg: 'rgba(167, 139, 250, 0.08)',
            borderColor: 'rgba(167, 139, 250, 0.2)',
        },
    ];

    return (
        <div className={`admin-dashboard-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <AdminSidebar
                currentView={currentView}
                onViewChange={setCurrentView}
                onLogout={onLogout}
                user={user}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            {/* Main Content Area */}
            <main className="admin-main">
                {toastMessage && (
                    <div className="success-toast">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {toastMessage}
                    </div>
                )}

                {/* ── Quick Stats Cards ─────────────────────── */}
                {currentView === 'directory' && (
                    <>
                        <div className="admin-stats-grid" id="dashboard-stats">
                            {statsCards.map((card) => (
                                <div
                                    className={`stat-card ${statsLoading ? 'stat-card-loading' : ''}`}
                                    key={card.id}
                                    id={card.id}
                                    style={{
                                        '--card-accent': card.color,
                                        '--card-bg': card.bg,
                                        '--card-border': card.borderColor,
                                    }}
                                >
                                    <div className="stat-icon">{card.icon}</div>
                                    <div className="stat-content">
                                        <span className="stat-label">{card.label}</span>
                                        <span className="stat-value">{card.value}</span>
                                        {card.subtitle && <span className="stat-subtitle">{card.subtitle}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Header + Search + Department Filter ── */}
                        <header className="main-header">
                            <h1>Employee Directory</h1>
                            <div className="header-actions">
                                <div className="search-bar" id="employee-search">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Search by Name or EmpID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="dept-filter" id="dept-filter">
                                    <select
                                        value={deptFilter}
                                        onChange={(e) => setDeptFilter(e.target.value)}
                                    >
                                        {DEPARTMENTS.map((dept) => (
                                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={generateMockEmployee}
                                    disabled={mockLoading}
                                    style={{
                                        padding: '0.5rem 1.2rem',
                                        backgroundColor: mockLoading ? '#21262d' : '#0B0E14',
                                        color: '#3B82F6',
                                        border: '1px solid #3B82F6',
                                        borderRadius: '6px',
                                        cursor: mockLoading ? 'wait' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {mockLoading ? 'Generating...' : '✨ Generate Mock Employee'}
                                </button>
                            </div>
                        </header>

                        {/* ── Employee Table ────────────────────── */}
                        <div className="table-container">
                            <table className="employee-table">
                                <thead>
                                    <tr>
                                        <th>EMPLOYEE ID</th>
                                        <th>NAME</th>
                                        <th>DEPARTMENT</th>
                                        <th>JOINING DATE</th>
                                        <th>CURRENT SALARY</th>
                                        <th>DAYS ON LEAVE (CURRENT MONTH)</th>
                                        <th>PF</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.length > 0 ? employees.map((emp) => (
                                        <tr key={emp._id || emp.id || emp.EmpID}>
                                            <td className="emp-id">{emp.EmpID || emp.id}</td>
                                            <td className="emp-name">{emp.Name || emp.name}</td>
                                            <td className="emp-role">{emp.DeptID || 'N/A'}</td>
                                            <td className="emp-date">{safeDate(emp.JoiningDate)}</td>
                                            <td className="emp-salary">{formatRupee(emp.BaseSalary)}</td>
                                            <td style={{textAlign: 'center', fontWeight: '600', color: emp.currentMonthLeaves > 0 ? '#ef4444' : '#22c55e'}}>{emp.currentMonthLeaves || 0}</td>
                                            <td>
                                                <span className={`pf-badge ${emp.pfActive ? 'pf-active' : 'pf-inactive'}`}>
                                                    {emp.pfActive ? 'Active' : 'Off'}
                                                </span>
                                            </td>
                                            <td className="emp-actions">
                                                {user?.role !== 'pao' && (
                                                    <button className="action-btn edit-btn" onClick={() => handleEditEmployee(emp)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                                        Edit
                                                    </button>
                                                )}
                                                {user?.role !== 'pao' && (
                                                    <button className="action-btn delete-btn" onClick={() => handleDeleteEmployee(emp)}>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="8" style={{textAlign: 'center', color: '#94A3B8', padding: '2rem'}}>
                                                {loading ? 'Searching employees...' : 'No employees found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}


                {currentView === 'add-employee' && (
                    <AddEmployeeForm onSuccess={handleAddEmployeeSuccess} />
                )}

                {currentView === 'payroll-runner' && (
                    <PayrollRunner user={user} />
                )}

                {currentView === 'attendance' && (
                    <AttendanceModule user={user} />
                )}

                {currentView === 'pao-payroll' && (
                    <PAOPayroll user={user} />
                )}

                {currentView === 'audit-logs' && (
                    <AuditLogs user={user} />
                )}

                {currentView === 'insights' && (
                    <AnalyticsDashboard user={user} />
                )}

                {currentView === 'leave-approvals' && (
                    <LeaveApprovals user={user} />
                )}

                {currentView === 'award-bonus' && (
                    <div className="add-employee-container audit-form">
                        <div className="audit-form-header">
                            <h2>Award Bonus</h2>
                            <p>Select an employee and award a bonus for the current month. The bonus will be added to their payroll record.</p>
                        </div>

                        {bonusToast && (
                            <div style={{
                                padding: '14px 20px',
                                marginBottom: '20px',
                                borderRadius: '8px',
                                background: bonusToast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                border: `1px solid ${bonusToast.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: bonusToast.type === 'success' ? '#10B981' : '#EF4444',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                {bonusToast.type === 'success' ? '✅' : '❌'} {bonusToast.message}
                            </div>
                        )}

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!bonusEmpId || !bonusAmount || Number(bonusAmount) <= 0) return;
                            setBonusSubmitting(true);
                            setBonusToast(null);
                            try {
                                const res = await fetch('http://localhost:5000/api/admin/award-bonus', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ empId: bonusEmpId, amount: Number(bonusAmount), reason: bonusReason })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    setBonusToast({ type: 'success', message: data.message });
                                    setBonusAmount('');
                                    setBonusReason('');
                                    setTimeout(() => setBonusToast(null), 6000);
                                } else {
                                    setBonusToast({ type: 'error', message: data.message || 'Failed to award bonus' });
                                    setTimeout(() => setBonusToast(null), 5000);
                                }
                            } catch (err) {
                                setBonusToast({ type: 'error', message: 'Network error. Ensure backend is running.' });
                                setTimeout(() => setBonusToast(null), 5000);
                            } finally {
                                setBonusSubmitting(false);
                            }
                        }} className="admin-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Select Employee</label>
                                    <select
                                        value={bonusEmpId}
                                        onChange={(e) => setBonusEmpId(e.target.value)}
                                        required
                                        onFocus={async () => {
                                            if (bonusEmployees.length === 0) {
                                                try {
                                                    const res = await fetch('http://localhost:5000/api/admin/employees-for-bonus');
                                                    const data = await res.json();
                                                    if (data.success) setBonusEmployees(data.employees);
                                                } catch (err) { console.error(err); }
                                            }
                                        }}
                                    >
                                        <option value="">— Choose Employee —</option>
                                        {bonusEmployees.map(emp => (
                                            <option key={emp.EmpID} value={emp.EmpID}>
                                                {emp.Name} ({emp.EmpID}) — {emp.DeptID || 'N/A'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Bonus Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bonusAmount}
                                        onChange={(e) => setBonusAmount(e.target.value)}
                                        placeholder="e.g. 10000"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Reason (Optional)</label>
                                    <input
                                        type="text"
                                        value={bonusReason}
                                        onChange={(e) => setBonusReason(e.target.value)}
                                        placeholder="Performance bonus, festival bonus, etc."
                                        maxLength={200}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="submit-action-btn" disabled={bonusSubmitting}>
                                    {bonusSubmitting ? 'Awarding...' : '🎁 Award Bonus'}
                                </button>
                                <button type="button" className="submit-action-btn audit-outline-btn" onClick={() => setCurrentView('directory')}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {currentView === 'add-pao' && (
                    <div className="add-employee-container audit-form">
                        <div className="audit-form-header">
                            <h2>Register PAO</h2>
                            <p>PAOs only need a name, a PAO ID, and a secure password.</p>
                        </div>
                        <form onSubmit={submitAddPAO} className="admin-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input name="Name" type="text" required placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label>PAO ID (Username)</label>
                                    <input name="PAOID" type="text" required placeholder="Unique PAO ID" />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input name="Password" type="password" required placeholder="Secure password" />
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <button type="submit" className="submit-action-btn">Create PAO</button>
                                <button type="button" className="submit-action-btn audit-outline-btn" onClick={() => setCurrentView('directory')}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Edit Employee Modal */}
                {editingEmployee && (
                    <div className="modal-overlay" style={modalOverlayStyle}>
                        <div className="modal-content" style={modalContentStyle}>
                            <h2>Edit Employee</h2>
                            <form onSubmit={handleUpdateEmployee}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Full Name</label>
                                        <input
                                            type="text"
                                            value={editingEmployee.Name || ''}
                                            onChange={(e) => setEditingEmployee({...editingEmployee, Name: e.target.value})}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Department</label>
                                        <select
                                            value={editingEmployee.DeptID || ''}
                                            onChange={(e) => setEditingEmployee({...editingEmployee, DeptID: e.target.value})}
                                            style={inputStyle}
                                            required
                                        >
                                            <option value="151 - Engineering">151 - Engineering</option>
                                            <option value="152 - Finance">152 - Finance</option>
                                            <option value="153 - Human Resources">153 - Human Resources</option>
                                            <option value="154 - Marketing">154 - Marketing</option>
                                            <option value="155 - Operations">155 - Operations</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Joining Date</label>
                                        <input
                                            type="date"
                                            value={editingEmployee.JoiningDate ? new Date(editingEmployee.JoiningDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => setEditingEmployee({...editingEmployee, JoiningDate: e.target.value})}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Bank Account</label>
                                        <input
                                            type="text"
                                            value={editingEmployee.BankAccount || ''}
                                            onChange={(e) => setEditingEmployee({...editingEmployee, BankAccount: e.target.value})}
                                            style={inputStyle}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={labelStyle}>Base Salary (₹)</label>
                                    <input
                                        type="number"
                                        value={editingEmployee.BaseSalary || ''}
                                        onChange={(e) => setEditingEmployee({...editingEmployee, BaseSalary: e.target.value})}
                                        style={inputStyle}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                                    <label style={{...labelStyle, marginBottom: 0}}>Provident Fund (5%)</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                                            <input
                                                type="radio"
                                                name="providentFund"
                                                checked={editingEmployee.pfActive || editingEmployee.providentFund?.isActive || editingEmployee.providentFund === true}
                                                onChange={() => setEditingEmployee({ ...editingEmployee, pfActive: true, providentFund: { isActive: true }})}
                                                style={{accentColor: '#3B82F6'}}
                                            /> Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                                            <input
                                                type="radio"
                                                name="providentFund"
                                                checked={!(editingEmployee.pfActive || editingEmployee.providentFund?.isActive || editingEmployee.providentFund === true)}
                                                onChange={() => setEditingEmployee({ ...editingEmployee, pfActive: false, providentFund: { isActive: false }})}
                                                style={{accentColor: '#3B82F6'}}
                                            /> No
                                        </label>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                                    <button type="button" onClick={() => setEditingEmployee(null)} style={{...cancelBtnStyle, flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)'}}>Cancel</button>
                                    <button type="submit" style={{...btnStyle, flex: 1, backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)'}}>Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Employee Modal */}
                {employeeToDelete && (
                    <div style={modalOverlayStyle}>
                        <div style={{ ...modalContentStyle, minWidth: '400px', maxWidth: '450px' }}>
                            <h3 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                Delete Employee
                            </h3>
                            <p style={{ color: '#9ca3af', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                                Are you sure you want to delete <strong>{employeeToDelete.Name}</strong> ({employeeToDelete.EmpID})?
                            </p>
                            <p style={{ color: '#ef4444', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.9rem' }}>
                                This will permanently remove their records along with any existing payroll history. This action cannot be undone.
                            </p>
                            
                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                <button type="button" onClick={() => setEmployeeToDelete(null)} style={{...cancelBtnStyle, flex: 1}}>Cancel</button>
                                <button type="button" onClick={confirmDeleteEmployee} style={{...btnStyle, flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)'}}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContentStyle = {
    backgroundColor: 'var(--bg-card, #11141B)', padding: '2rem',
    borderRadius: '8px', minWidth: '400px', border: '1px solid var(--border-subtle, #1E293B)'
};

const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#9ca3af' };
const inputStyle = { width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white', boxSizing: 'border-box' };
const btnStyle = { padding: '0.5rem 1rem', background: '#3B82F6', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { padding: '0.5rem 1rem', background: 'transparent', color: '#fff', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' };

export default AdminDashboard;
