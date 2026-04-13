import React, { useState } from 'react';
import './AdminSidebar.css';

function AdminSidebar({ currentView, onViewChange, onLogout, user, isCollapsed, onToggleCollapse }) {

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
                {/* Main Views Section */}
                {user?.role !== 'pao' && (
                <>
                    <div className="nav-section">
                        <button
                            className={`nav-item ${currentView === 'directory' ? 'active' : ''}`}
                            onClick={() => onViewChange('directory')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {!isCollapsed && "Employee Directory"}
                        </button>
                    </div>

                    {/* Management Section */}
                    <div className="nav-section-divider" />
                    <div className="nav-section-title">
                        {!isCollapsed ? "MANAGEMENT" : "\u00A0"}
                    </div>

                    <button
                        className={`nav-item ${currentView === 'add-employee' ? 'active' : ''}`}
                        onClick={() => onViewChange('add-employee')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                            <line x1="12" y1="12" x2="12" y2="18" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                        {!isCollapsed && "Add Employee"}
                    </button>
                    <button
                        className={`nav-item ${currentView === 'add-pao' ? 'active' : ''}`}
                        onClick={() => onViewChange('add-pao')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="13" x2="8" y2="13" />
                            <line x1="12" y1="17" x2="8" y2="17" />
                            <path d="M16 13h.01" />
                            <path d="M16 17h.01" />
                        </svg>
                        {!isCollapsed && "Add PAO"}
                    </button>

                    {/* Modules Section */}
                    <div className="nav-section-divider" />
                    <div className="nav-section-title">
                        {!isCollapsed ? "MODULES" : "\u00A0"}
                    </div>
                </>
                )}

                <button
                    className={`nav-item ${currentView === 'attendance' ? 'active' : ''}`}
                    onClick={() => onViewChange('attendance')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    {!isCollapsed && "Attendance Directory"}
                </button>
                {user?.role === 'pao' && (
                    <button
                        className={`nav-item ${currentView === 'pao-payroll' ? 'active' : ''}`}
                        onClick={() => onViewChange('pao-payroll')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {!isCollapsed && "Payroll Runner"}
                    </button>
                )}
                <button
                    className={`nav-item ${currentView === 'insights' ? 'active' : ''}`}
                    onClick={() => onViewChange('insights')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    {!isCollapsed && (user?.role === 'pao' ? 'Monthly Attendance Heatmap' : 'System Insights')}
                </button>

                {user?.role !== 'pao' && (
                <>
                    <button
                        className={`nav-item ${currentView === 'payroll-runner' ? 'active' : ''}`}
                        onClick={() => onViewChange('payroll-runner')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {!isCollapsed && "Payroll Runner"}
                    </button>
                    <button
                        className={`nav-item ${currentView === 'audit-logs' ? 'active' : ''}`}
                        onClick={() => onViewChange('audit-logs')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {!isCollapsed && "Audit Logs"}
                    </button>

                    <div className="nav-section-divider" />
                    <div className="nav-section-title">
                        {!isCollapsed ? "HR" : "\u00A0"}
                    </div>

                    <button
                        className={`nav-item ${currentView === 'leave-approvals' ? 'active' : ''}`}
                        onClick={() => onViewChange('leave-approvals')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        {!isCollapsed && "Leave Approvals"}
                    </button>
                    <button
                        className={`nav-item ${currentView === 'award-bonus' ? 'active' : ''}`}
                        onClick={() => onViewChange('award-bonus')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 12v10H4V12" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                        </svg>
                        {!isCollapsed && "Award Bonus"}
                    </button>
                </>
                )}
            </nav>

            {/* Sidebar Footer */}
            <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="user-profile">
                    <div className="user-profile-click">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', width: isCollapsed ? '100%' : 'auto' }}>
                            <div className="avatar">{(user?.name || "AD").substring(0, 2).toUpperCase()}</div>
                            {!isCollapsed && (
                                <div className="user-info">
                                    <span className="user-name">{user?.name || "Admin User"}</span>
                                    <span className="user-email">{user?.email || "admin@auditpay.com"}</span>
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

export default AdminSidebar;
