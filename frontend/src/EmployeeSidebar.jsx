import React from 'react';
import './AdminSidebar.css'; // Reusing Admin Sidebar class logic

function EmployeeSidebar({ currentView, onViewChange, onLogout, isCollapsed, onToggleCollapse, employeeName, empID }) {
    const initials = (employeeName || empID || 'EM').substring(0, 2).toUpperCase();

    return (
        <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Sidebar Header */}
            <div className={`sidebar-header ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {!isCollapsed && <span className="sidebar-logo-text">AuditPay</span>}
                </div>
            </div>

            <button className="sidebar-collapse-floating-toggle" onClick={onToggleCollapse} title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    {isCollapsed ? (
                        <polyline points="9 18 15 12 9 6" />
                    ) : (
                        <polyline points="15 18 9 12 15 6" />
                    )}
                </svg>
            </button>

            {/* Sidebar Navigation */}
            <nav className="sidebar-nav">
                <div className="nav-section">
                    <button
                        className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
                        onClick={() => onViewChange('overview')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 9l-5 5-4-4-4 4" />
                        </svg>
                        {!isCollapsed && "My Overview"}
                    </button>
                    
                    <button
                        className={`nav-item ${currentView === 'attendance' ? 'active' : ''}`}
                        onClick={() => onViewChange('attendance')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {!isCollapsed && "My Attendance"}
                    </button>

                    <button
                        className={`nav-item ${currentView === 'salary' ? 'active' : ''}`}
                        onClick={() => onViewChange('salary')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        {!isCollapsed && "Salary History"}
                    </button>

                    <div className="nav-section-divider" />

                    <button
                        className={`nav-item ${currentView === 'leaves' ? 'active' : ''}`}
                        onClick={() => onViewChange('leaves')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {!isCollapsed && "Leave Management"}
                    </button>
                </div>
            </nav>

            {/* Sidebar Footer — matching Admin sidebar style */}
            <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="user-profile">
                    <div className="user-profile-click">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', width: isCollapsed ? '100%' : 'auto' }}>
                            <div className="avatar">{initials}</div>
                            {!isCollapsed && (
                                <div className="user-info">
                                    <span className="user-name">{employeeName || 'Employee'}</span>
                                    <span className="user-email">{empID || 'EMP'}</span>
                                </div>
                            )}
                        </div>
                        {!isCollapsed && (
                            <button className="quick-logout-btn" onClick={onLogout} title="Log Out">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {isCollapsed && (
                        <button className="quick-logout-btn collapsed-logout" onClick={onLogout} title="Log Out">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}

export default EmployeeSidebar;