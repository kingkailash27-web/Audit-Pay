import React, { useCallback, useEffect, useState } from 'react';
import './PayrollRunner.css';

const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value || 0);
const formatRupee = (value) => `\u20B9${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)}`;

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function PayrollRunner({ user }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [payrollData, setPayrollData] = useState([]);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [payingId, setPayingId] = useState('');

    const now = new Date();
    const currentMonth = MONTHS[now.getMonth()];
    const currentYear = now.getFullYear();

    // Fetch all payroll records for this month (both Pending and Paid)
    const fetchPayroll = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/api/payroll/pending-current');
            const data = await response.json();

            if (response.ok) {
                setPayrollData(data.records || []);
            }
        } catch (err) {
            console.error('Payroll fetch error:', err);
        }
    }, []);

    useEffect(() => {
        fetchPayroll();
    }, [fetchPayroll]);

    // Generate payroll for the current month
    const handleGenerate = async () => {
        setIsGenerating(true);
        setError('');
        setToast(null);

        try {
            const response = await fetch('http://localhost:5000/api/payroll/run-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionBy: 'ADMIN' })
            });

            const data = await response.json();

            if (response.ok) {
                const created = data.summary?.totalRecordsCreated || 0;
                if (created > 0) {
                    setToast({ type: 'success', message: `✅ Generated ${created} payroll records for ${currentMonth} ${currentYear}` });
                } else {
                    setToast({ type: 'info', message: `All payroll records already exist for ${currentMonth} ${currentYear}` });
                }
                fetchPayroll();
                setTimeout(() => setToast(null), 5000);
            } else {
                setError(data.message || 'Payroll generation failed.');
            }
        } catch (err) {
            console.error('Payroll generate error:', err);
            setError('Unable to connect to the server. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Mark a single employee's payroll as Paid
    const handleMarkPaid = async (payrollId) => {
        setPayingId(payrollId);
        setToast(null);
        try {
            const response = await fetch(`http://localhost:5000/api/payroll/mark-paid/${payrollId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actionBy: 'ADMIN' })
            });
            const data = await response.json();

            if (response.ok) {
                setToast({ type: 'success', message: `✅ Salary disbursed successfully.` });
                fetchPayroll();
                setTimeout(() => setToast(null), 4000);
            } else {
                setError(data.message || 'Unable to update payroll status.');
            }
        } catch (err) {
            console.error('Payroll pay error:', err);
            setError('Unable to update payroll status.');
        } finally {
            setPayingId('');
        }
    };

    const paidCount = payrollData.filter(r => r.Status === 'Paid').length;
    const pendingCount = payrollData.filter(r => r.Status !== 'Paid').length;

    return (
        <section className="payroll-runner">
            <div className="payroll-hero">
                <div>
                    <p className="payroll-kicker">Payroll Runner</p>
                    <h1>Disburse monthly salaries dynamically mapped to live attendance.</h1>
                </div>
            </div>

            {/* Month Header + Generate Button */}
            <div className="payroll-month-header">
                <div className="payroll-month-badge">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{currentMonth} {currentYear}</span>
                </div>
                <button className="sync-btn" onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : `Generate ${currentMonth} Payroll`}
                </button>
            </div>

            {/* Toast / Error */}
            {toast && (
                <div className={`payroll-toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
            {error && (
                <div className="payroll-alert payroll-alert-error">
                    {error}
                </div>
            )}

            {/* Summary Pills */}
            {payrollData.length > 0 && (
                <div className="payroll-pills">
                    <div className="payroll-pill total">
                        <span>Total Employees</span>
                        <strong>{payrollData.length}</strong>
                    </div>
                    <div className="payroll-pill paid">
                        <span>Disbursed</span>
                        <strong>{paidCount}</strong>
                    </div>
                    <div className="payroll-pill pending">
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>
                </div>
            )}

            {/* Payroll Table */}
            <div className="payroll-table payouts-table">
                <table>
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Base Salary</th>
                            <th>Days on Leave</th>
                            <th>Leave Deductions</th>
                            <th>Net Pay (After Tax + PF)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollData.length > 0 ? (
                            payrollData.map((item) => {
                                const isPaid = item.Status === 'Paid';
                                return (
                                    <tr key={item._id} className={isPaid ? 'row-paid' : 'row-pending'}>
                                        <td className="emp-id-cell">{item.EmpID}</td>
                                        <td className="emp-name-cell">{item.Name}</td>
                                        <td>{formatRupee(item.BaseSalary || item.GrossPay)}</td>
                                        <td style={{ textAlign: 'center' }}>{item.LeaveDays || 0}</td>
                                        <td>{formatRupee(item.LeaveDeduction || 0)}</td>
                                        <td className="net-pay-cell">{formatRupee(item.NetPay)}</td>
                                        <td>
                                            <span className={`status-pill ${isPaid ? 'status-ok' : 'status-muted'}`}>
                                                {isPaid ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            {isPaid ? (
                                                <span className="disbursed-badge">Disbursed</span>
                                            ) : (
                                                <button
                                                    className="payout-btn"
                                                    onClick={() => handleMarkPaid(item._id)}
                                                    disabled={payingId === item._id}
                                                >
                                                    {payingId === item._id ? 'Processing...' : 'Mark Paid'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="empty-state">
                                    No payroll records found. Click "Generate {currentMonth} Payroll" to create them.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Loading Overlay */}
            {isGenerating && (
                <div className="payroll-overlay" role="status" aria-live="polite">
                    <div className="overlay-card">
                        <p>Generating payroll for {currentMonth} {currentYear}...</p>
                        <div className="progress-track">
                            <div className="progress-bar" />
                        </div>
                        <span>Calculating deductions from attendance data.</span>
                    </div>
                </div>
            )}
        </section>
    );
}

export default PayrollRunner;
