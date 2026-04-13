import React, { useState, useEffect, useCallback } from 'react';
import './PayrollRunner.css';

const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

function AttendanceModule({ user }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedDate, setSelectedDate] = useState('2026-04-10'); // Current system context date

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeAttendance, setEmployeeAttendance] = useState([]);
    const [fetchingDetail, setFetchingDetail] = useState(false);
    const [employeeDetails, setEmployeeDetails] = useState(null);

    const fetchRecords = useCallback(async (date) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:5000/api/attendance?date=${date}`);
            const data = await response.json();
            if (data.success) {
                setRecords(data.records);
            } else {
                setError('Failed to load records.');
            }
        } catch (err) {
            console.error('Error fetching attendance records', err);
            setError('Unable to load attendance module.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchRecords(selectedDate);
        }
    }, [selectedDate, fetchRecords]);

    const toggleAttendance = async (empId, currentStatus) => {
        setActionLoading(empId);
        const newStatus = currentStatus === 'Leave' ? 'Present' : 'Leave';
        console.log('[TOGGLE ATTENDANCE] Sending:', { EmpID: String(empId), Date: selectedDate, Status: newStatus });
        try {
            const response = await fetch('http://localhost:5000/api/attendance/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    EmpID: String(empId),
                    Date: selectedDate,
                    Status: newStatus,
                    actionBy: user?.username || user?.name || 'PAO'
                })
            });
            const data = await response.json();
            console.log('[TOGGLE ATTENDANCE] Response:', data);
            if (response.ok) {
                setRecords(prev => prev.map(r => r.EmpID === empId ? { ...r, Status: newStatus } : r));
            } else {
                alert(data.message || 'Update failed');
            }
        } catch (err) {
            console.error('[TOGGLE ATTENDANCE] Network error:', err);
            alert('Network error updating status');
        } finally {
            setActionLoading(null);
        }
    };

    const shiftDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const openEmployeeModal = async (emp) => {
        setSelectedEmployee(emp);
        setFetchingDetail(true);
        setEmployeeDetails(null);
        try {
            const monthStr = '2026-04'; // Explicit April 2026
            const [attRes, detailsRes] = await Promise.all([
                fetch(`http://localhost:5000/api/attendance/${emp.EmpID}/${monthStr}`),
                fetch(`http://localhost:5000/api/employees/details/${emp.EmpID}`)
            ]);
            const attData = await attRes.json();
            const detailsData = await detailsRes.json();
            
            if (attData.success) setEmployeeAttendance(attData.records);
            if (detailsData.success) setEmployeeDetails(detailsData.employee);
        } catch (e) {
            console.error('Error fetching employee detail', e);
        } finally {
            setFetchingDetail(false);
        }
    };

    const closeEmployeeModal = () => {
        setSelectedEmployee(null);
        setEmployeeAttendance([]);
        setEmployeeDetails(null);
    };

    // Calendar & Stats Calculation Logic for April 2026
    const TOTAL_DAYS = 30; // April has 30 days
    const SYSTEM_DATE = 10; // Date is April 10, 2026

    const calculateStats = () => {
        if (!employeeAttendance) return { present: 0, leave: 0, deduction: 0 };
        // We only consider days up to SYSTEM_DATE
        let present = 0;
        let leave = 0;
        for (let day = 1; day <= SYSTEM_DATE; day++) {
             const dStr = `2026-04-${String(day).padStart(2, '0')}`;
             const record = employeeAttendance.find(r => r.Date === dStr);
             if (record) {
                if (record.Status === 'Leave') leave++;
                else present++;
             } else {
                present++; // default is present
             }
        }
        
        const baseSalary = employeeDetails?.BaseSalary || 0;
        const dailyRate = baseSalary / 30;
        const deduction = leave * dailyRate;

        return { present, leave, deduction };
    };

    const stats = calculateStats();

    return (
        <div className="payroll-runner-container" style={{ backgroundColor: '#0B0E14' }}>
            <div className="payroll-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: '#3B82F6' }}>Attendance Directory</h2>
                    <p style={{ color: '#9ca3af' }}>Manage daily records. Unified Status: Present or Leave.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                        onClick={() => shiftDate(-1)} 
                        style={{ background: '#161B22', color: '#9ca3af', border: '1px solid #30363d', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = 'white'}
                        onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={handleDateChange} 
                        style={{
                            padding: '0.5rem 1rem', 
                            borderRadius: '4px', 
                            border: '1px solid #30363d', 
                            backgroundColor: '#0d1117', 
                            color: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    />
                    <button 
                        onClick={() => shiftDate(1)} 
                        style={{ background: '#161B22', color: '#9ca3af', border: '1px solid #30363d', borderRadius: '4px', padding: '0.4rem 0.6rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = 'white'}
                        onMouseOut={(e) => e.target.style.color = '#9ca3af'}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
            </div>

            {error && <div className="error-toast">{error}</div>}

            <div className="table-container">
                <table className="employee-table">
                    <thead style={{ backgroundColor: '#161B22' }}>
                        <tr>
                            <th>EMPLOYEE ID</th>
                            <th>NAME</th>
                            <th>DEPARTMENT</th>
                            <th>DATE</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#9ca3af'}}>Loading records...</td></tr>
                        )}
                        {!loading && records.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#9ca3af'}}>No employees found.</td></tr>
                        )}
                        {!loading && records.map(record => {
                            const isLeave = record.Status === 'Leave';
                            const dateObj = new Date(record.Date);
                            const formattedDate = !isNaN(dateObj) 
                                ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : record.Date;

                            return (
                                <tr key={record.EmpID} style={{ cursor: 'pointer' }}>
                                    <td className="emp-id" onClick={() => openEmployeeModal(record)} style={{ color: '#3B82F6' }}>{record.EmpID}</td>
                                    <td className="emp-name" onClick={() => openEmployeeModal(record)}>{record.EmpName}</td>
                                    <td onClick={() => openEmployeeModal(record)}>{record.DeptID}</td>
                                    <td onClick={() => openEmployeeModal(record)}>{formattedDate}</td>
                                    <td onClick={() => openEmployeeModal(record)}>
                                        <span className={`payout-status ${isLeave ? 'status-failed' : 'status-paid'}`}>
                                            {record.Status}
                                        </span>
                                    </td>
                                    <td className="emp-actions">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '500', color: isLeave ? '#ef4444' : '#10b981' }}>
                                                {isLeave ? 'Absent' : 'Present'}
                                            </span>
                                            <label className="attendance-toggle" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={!isLeave}
                                                    onChange={() => toggleAttendance(record.EmpID, record.Status)}
                                                    disabled={actionLoading === record.EmpID}
                                                    style={{ opacity: 0, width: 0, height: 0 }}
                                                />
                                                <span 
                                                    style={{
                                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                                                        backgroundColor: isLeave ? '#ef4444' : '#10b981', 
                                                        transition: '.4s', borderRadius: '20px',
                                                        opacity: actionLoading === record.EmpID ? 0.5 : 1
                                                    }}
                                                >
                                                    <span 
                                                        style={{
                                                            position: 'absolute', content: '""', height: '16px', width: '16px', left: '2px', bottom: '2px', 
                                                            backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                                            transform: isLeave ? 'translateX(0)' : 'translateX(20px)'
                                                        }}
                                                    ></span>
                                                </span>
                                            </label>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Monthly Attendance Detail Modal */}
            {selectedEmployee && (
                <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div style={{backgroundColor: '#0B0E14', padding: '2.5rem', borderRadius: '12px', width: '900px', border: '1px solid #161B22', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #161B22', paddingBottom: '1rem'}}>
                            <div>
                                <h3 style={{color: '#fff', fontSize: '1.5rem', margin: 0}}>Monthly Attendance Detail</h3>
                                <p style={{ color: '#3B82F6', margin: '4px 0 0 0' }}>{selectedEmployee.EmpName} ({selectedEmployee.EmpID}) • April 2026</p>
                            </div>
                            <button onClick={closeEmployeeModal} style={{background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '2rem'}}>&times;</button>
                        </div>
                        
                        {fetchingDetail ? (
                            <div style={{color: '#9ca3af', textAlign: 'center', padding: '4rem'}}>Crunching Database Records...</div>
                        ) : (
                            <div style={{ display: 'flex', gap: '3rem' }}>
                                {/* Left Side: 30-Day Smart Calendar */}
                                <div style={{ flex: 1.5 }}>
                                    <h4 style={{ color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '16px', backgroundColor: '#3B82F6', borderRadius: '2px' }}></div>
                                        Attendance History
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                                        {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map(day => {
                                            const dStr = `2026-04-${String(day).padStart(2, '0')}`;
                                            const record = employeeAttendance.find(r => r.Date === dStr);
                                            const status = record ? record.Status : 'Present';
                                            const isFuture = day > SYSTEM_DATE;
                                            
                                            let color = '#10b981'; // Green
                                            if (status === 'Leave') color = '#ef4444'; // Red (User said "Red for Leave")

                                            return (
                                                <div 
                                                    key={day} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        height: '65px', 
                                                        backgroundColor: isFuture ? '#0d1117' : '#161B22', 
                                                        borderRadius: '6px', 
                                                        border: isFuture ? '1px solid #21262d' : `1.5px solid ${color}`,
                                                        opacity: isFuture ? 0.3 : 1,
                                                        pointerEvents: 'none'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '1rem', color: isFuture ? '#9ca3af' : '#fff', fontWeight: 'bold' }}>{day}</span>
                                                    {!isFuture && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color, marginTop: '5px' }}></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></div> Present</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> Leave</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#21262d' }}></div> Future</div>
                                    </div>
                                </div>

                                {/* Right Side: Month-to-Date Summary */}
                                <div style={{ flex: 1, backgroundColor: '#0d1117', padding: '1.5rem', borderRadius: '8px', border: '1px solid #161B22', alignSelf: 'flex-start' }}>
                                    <h4 style={{ color: '#fff', marginBottom: '1.5rem', borderBottom: '1px solid #21262d', paddingBottom: '0.5rem' }}>Month-to-Date Summary</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                        <div>
                                            <p style={{ color: '#9ca3af', margin: '0 0 4px 0', fontSize: '0.85rem' }}>Total Working Days</p>
                                            <p style={{ color: '#fff', margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>{SYSTEM_DATE - 1} Days</p>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <p style={{ color: '#9ca3af', margin: '0 0 4px 0', fontSize: '0.85rem' }}>Days Present</p>
                                                <p style={{ color: '#10b981', margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.present}</p>
                                            </div>
                                            <div>
                                                <p style={{ color: '#9ca3af', margin: '0 0 4px 0', fontSize: '0.85rem' }}>Days on Leave</p>
                                                <p style={{ color: '#ef4444', margin: 0, fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.leave}</p>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <p style={{ color: '#9ca3af', margin: '0 0 6px 0', fontSize: '0.85rem' }}>Salary Deduction</p>
                                            <p style={{ color: '#ef4444', margin: 0, fontWeight: 'bold', fontSize: '1.5rem' }}>{formatRupee(stats.deduction)}</p>
                                            <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.75rem' }}>Logic: {stats.leave} x ({formatRupee(employeeDetails?.BaseSalary || 0)} / 30)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AttendanceModule;
