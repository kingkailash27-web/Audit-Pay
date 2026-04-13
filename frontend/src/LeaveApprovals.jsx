import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const LeaveApprovals = ({ user }) => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchPendingLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/leaves/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingLeaves(data);
      }
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingLeaves();
  }, [fetchPendingLeaves]);

  const handleAction = async (leaveId, action) => {
    setActionLoading(leaveId + '-' + action);
    try {
      const endpoint = action === 'approve'
        ? `/api/leaves/approve/${leaveId}`
        : `/api/leaves/reject/${leaveId}`;

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (res.ok) {
        const emoji = action === 'approve' ? '✅' : '❌';
        setToast({ type: 'success', message: `${emoji} Leave ${action === 'approve' ? 'approved' : 'rejected'} successfully. ${data.message || ''}` });
        fetchPendingLeaves();
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({ type: 'error', message: data.error || `Failed to ${action} leave.` });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
      setToast({ type: 'error', message: `Network error while trying to ${action} leave.` });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (start, end) => {
    return `${formatDate(start)} — ${formatDate(end)}`;
  };

  return (
    <div style={{ animation: 'fadeUp 0.5s ease' }}>
      <header className="main-header">
        <h1>Leave Approvals</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: pendingLeaves.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: pendingLeaves.length > 0 ? '#f59e0b' : '#10b981',
            border: `1px solid ${pendingLeaves.length > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}>
            {pendingLeaves.length > 0 ? `${pendingLeaves.length} Pending` : '0 Pending'}
          </span>
          <button
            onClick={fetchPendingLeaves}
            disabled={loading}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#3B82F6',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {toast && (
        <div className="success-toast" style={{
          background: toast.type === 'success' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          borderColor: toast.type === 'success' ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          color: toast.type === 'success' ? '#34d399' : '#ef4444'
        }}>
          {toast.message}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #1E293B', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <span style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 500 }}>Loading leave requests...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : pendingLeaves.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
          background: '#11141B',
          borderRadius: '14px',
          border: '1px solid #1E293B'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.08)', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px'
          }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#94A3B8' }}>All caught up!</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748B', maxWidth: '320px' }}>
            There are no pending leave requests at this time. They will appear here when employees submit new requests.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>EMP ID</th>
                <th>NAME</th>
                <th>DATES REQUESTED</th>
                <th>TOTAL DAYS</th>
                <th>REASON</th>
                <th>APPLIED ON</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td className="emp-id">{leave.EmpID}</td>
                  <td className="emp-name">{leave.employeeName || leave.EmpID}</td>
                  <td>{formatDateRange(leave.startDate, leave.endDate)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#f59e0b' }}>{leave.totalDays || '—'}</td>
                  <td style={{
                    maxWidth: '200px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94A3B8'
                  }} title={leave.reason}>{leave.reason}</td>
                  <td style={{ color: '#94A3B8' }}>{formatDate(leave.appliedOn)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAction(leave._id, 'approve')}
                        disabled={actionLoading === leave._id + '-approve'}
                        style={{
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {actionLoading === leave._id + '-approve' ? '...' : '✅ Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(leave._id, 'reject')}
                        disabled={actionLoading === leave._id + '-reject'}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {actionLoading === leave._id + '-reject' ? '...' : '❌ Reject'}
                      </button>
                    </div>
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

export default LeaveApprovals;
