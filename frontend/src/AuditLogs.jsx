import React, { useState, useEffect } from 'react';
import './PayrollRunner.css';

function AuditLogs({ user }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const roleQuery = user?.role ? `?role=${user.role}` : '';
            const response = await fetch(`http://localhost:5000/api/admin/audit-logs${roleQuery}`);
            const data = await response.json();
            if (data.success) {
                const humanLogs = data.logs.filter(log => !log.ActionType.includes('SYNC_HISTORICAL_PAYROLL'));
                setLogs(humanLogs);
            } else {
                setError(data.message || 'Error loading audit logs');
            }
        } catch (err) {
            console.error('Audit log fetch error:', err);
            setError('Unable to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    const formatDetails = (log) => {
        if (log.Details) return log.Details;
        if (log.ActionType === 'ADMIN_SYNC_HISTORICAL_PAYROLL completed for all employees') {
            return `Batch generated ${log.NewValue?.totalRecordsCreated || 0} records for ${log.NewValue?.totalEmployees || 0} employees. Total Net: ₹${log.NewValue?.totalNetPayGenerated || 0}`;
        }
        return JSON.stringify(log.NewValue || log.PreviousValue || 'No specific details');
    };

    return (
        <div className="payroll-runner-container">
            <div className="payroll-header">
                <h2>System Audit Logs</h2>
                <p>Immutable record of all financial and administrative actions in AuditPay.</p>
            </div>

            {error && (
                <div className="payroll-alert payroll-alert-error">
                    {error}
                </div>
            )}

            <div className="payroll-table history-table">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action By</th>
                            <th>Target</th>
                            <th>Action Type</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>Loading logs...</td>
                            </tr>
                        )}
                        {!loading && logs.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>No audit logs found.</td>
                            </tr>
                        )}
                            {!loading && logs.map((log) => {
                                const ts = log.createdAt || log.Timestamp;
                                const dateStr = ts && !isNaN(new Date(ts).getTime())
                                    ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                    : 'N/A';
                                return (
                            <tr key={log._id}>
                                <td>{dateStr}</td>
                                <td>{log.ActionBy_EmpID || 'SYSTEM'}</td>
                                <td>{log.Target_EmpID || '-'}</td>
                                <td><span className="payout-status status-paid">{log.ActionType}</span></td>
                                <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{formatDetails(log)}</td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AuditLogs;
