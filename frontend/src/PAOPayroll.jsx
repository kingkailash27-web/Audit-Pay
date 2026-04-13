import React, { useState, useEffect, useCallback } from 'react';
import './PAOPayroll.css';

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value || 0);
const formatRupee = (value) => `\u20B9${formatNumber(value)}`;

function PAOPayroll({ user }) {
    const [monthOffset, setMonthOffset] = useState(0); // 0 = current, -1 = last, etc.
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState('');
    const [error, setError] = useState('');
    const [targetDate, setTargetDate] = useState(new Date());

    useEffect(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthOffset);
        setTargetDate(d);
    }, [monthOffset]);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        try {
            const year = targetDate.getFullYear();
            const monthObj = targetDate.getMonth() + 1;
            
            const response = await fetch('http://localhost:5000/api/payroll/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    year,
                    month: monthObj,
                    actionBy: user?.username || user?.name || 'PAO' 
                })
            });
            const data = await response.json();
            if (response.ok) {
                setRecords(data.records);
            } else {
                setError(data.message || 'Error generating payroll');
            }
        } catch (err) {
            setError('Network error syncing payroll data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (payrollId) => {
        setActionLoading(payrollId);
        try {
            const response = await fetch(`http://localhost:5000/api/payroll/mark-paid/${payrollId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionBy: user?.username || user?.name || 'PAO' })
            });
            const data = await response.json();
            if (response.ok) {
                setRecords(prev => prev.map(r => r._id === payrollId ? { ...r, Status: 'Paid' } : r));
            } else {
                alert(data.message || 'Error updating status');
            }
        } catch (err) {
            alert('Network error updating payroll status');
            console.error(err);
        } finally {
            setActionLoading('');
        }
    };

    const monthName = targetDate.toLocaleString('default', { month: 'long' });
    const yearNumber = targetDate.getFullYear();

    return (
        <section className="pao-payroll-section">
            <div className="payroll-hero">
                <div>
                    <h1 style={{color: '#F8FAFC'}}>Payroll Runner</h1>
                    <p style={{color: '#94A3B8'}}>Disburse monthly salaries dynamically mapped to live attendance.</p>
                </div>
            </div>

            <div className="controls-bar">
                <div className="month-selector">
                    <button onClick={() => setMonthOffset(p => p - 1)}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <div className="current-month">
                        {monthName} {yearNumber}
                    </div>
                    <button onClick={() => setMonthOffset(p => p + 1)} disabled={monthOffset >= 0}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
                <button 
                    className="generate-btn" 
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? 'Generating...' : `Generate ${monthName} Payroll`}
                </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="payroll-table-container">
                <table className="pao-payroll-table">
                    <thead>
                        <tr>
                            <th>EMPLOYEE ID</th>
                            <th>NAME</th>
                            <th>BASE SALARY</th>
                            <th>DAYS ON LEAVE</th>
                            <th>LEAVE DEDUCTIONS</th>
                            <th>NET PAY (AFTER TAX + PF)</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.length > 0 ? (
                            records.map((r) => (
                                <tr key={r._id}>
                                    <td className="emp-id">{r.EmpID}</td>
                                    <td>{r.Name}</td>
                                    <td className="emp-salary">{formatRupee(r.BaseSalary)}</td>
                                    <td>{r.DaysOnLeave || 0}</td>
                                    <td style={{ color: '#ef4444' }}>{formatRupee(r.LeaveDeductions)}</td>
                                    <td className="emp-salary">{formatRupee(r.NetPay)}</td>
                                    <td>
                                        <span className={`status-badge ${r.Status === 'Paid' ? 'paid' : 'pending'}`}>
                                            {r.Status}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="action-btn pay-btn"
                                            disabled={r.Status === 'Paid' || actionLoading === r._id}
                                            onClick={() => handleMarkPaid(r._id)}
                                        >
                                            {actionLoading === r._id ? 'Processing...' : (r.Status === 'Paid' ? 'Disbursed' : 'Mark Paid')}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="empty-state">
                                    No payroll records generated for {monthName} {yearNumber} yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default PAOPayroll;
