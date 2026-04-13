import React, { useState, useEffect } from 'react';
import './EmployeeDashboard.css';

const API_BASE = '';

const MyLeaves = ({ empID, token }) => {
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveValidationErr, setLeaveValidationErr] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);
  const [leaveToast, setLeaveToast] = useState(null);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  // Calculate leave days (inclusive)
  const calcLeaveDays = () => {
    if (!leaveStart || !leaveEnd) return 0;
    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    if (end < start) return -1;
    const diff = Math.abs(end - start);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const leaveDays = calcLeaveDays();

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

  // Fetch leave history
  const fetchLeaveHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch('/api/leaves/me');
      if (res.ok) {
        const data = await res.json();
        setLeaveHistory(data);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveHistory();
  }, [empID]);

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
        setLeaveToast({ type: 'success', message: '✅ Your leave request has been successfully sent to the Admin for approval.' });
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
        fetchLeaveHistory();
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

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'leave-status-pending';
      case 'Approved': return 'leave-status-approved';
      case 'Rejected': return 'leave-status-rejected';
      default: return '';
    }
  };

  return (
    <div className="tab-pane">
      <h2>Leave Management</h2>

      {/* Leave Request Form */}
      <div className="leave-form-container">
        <h3>Request Leave</h3>
        <p className="leave-form-subtitle">Submit a leave application to your Admin for approval.</p>

        {leaveToast && (
          <div className={`emp-toast ${leaveToast.type}`}>
            <span className="emp-toast-icon">{leaveToast.type === 'success' ? '✅' : '❌'}</span>
            <span>{leaveToast.message}</span>
          </div>
        )}

        <form onSubmit={handleLeaveSubmit} className="leave-form">
          <div className="leave-date-row">
            <div className="form-group">
              <label htmlFor="my-leave-start">Start Date</label>
              <input
                type="date"
                id="my-leave-start"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="my-leave-end">End Date</label>
              <input
                type="date"
                id="my-leave-end"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                min={leaveStart || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {leaveDays > 0 && (
            <div className="leave-days-badge">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {leaveDays} day{leaveDays > 1 ? 's' : ''} requested
            </div>
          )}

          {leaveValidationErr && (
            <div className="leave-validation-error">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {leaveValidationErr}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="my-leave-reason">Reason</label>
            <textarea
              id="my-leave-reason"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
              placeholder="Briefly explain the reason for your leave request..."
              maxLength={500}
            ></textarea>
            <div className="textarea-footer">
              <span className="char-count">{leaveReason.length}/500 characters</span>
            </div>
          </div>

          <button
            type="submit"
            className={`btn-primary ${leaveSent ? 'btn-success' : ''}`}
            disabled={leaveSubmitting || leaveDays < 0 || leaveSent}
          >
            {leaveSent ? '✅ Sent!' : leaveSubmitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>

      {/* Leave History Table */}
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>My Leave History</h3>

        {historyLoading ? (
          <div className="loading-container" style={{ height: '200px' }}>
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading leave history...</span>
          </div>
        ) : leaveHistory.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h4>No leave requests yet</h4>
            <p>Your leave requests will appear here once submitted.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="salary-table">
              <thead>
                <tr>
                  <th>Applied On</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((leave, idx) => (
                  <tr key={leave._id || idx}>
                    <td>{formatDate(leave.appliedOn)}</td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td style={{ fontWeight: 600, textAlign: 'center' }}>{leave.totalDays || '—'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={leave.reason}>{leave.reason}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(leave.status)}`}>
                        {leave.status === 'Pending' && '⏳'} 
                        {leave.status === 'Approved' && '✅'} 
                        {leave.status === 'Rejected' && '❌'} 
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLeaves;
