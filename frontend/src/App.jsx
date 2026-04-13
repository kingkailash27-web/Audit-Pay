import React, { useState } from 'react';
import './App.css';
import LoginContainer from './LoginContainer';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

function App() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // This function routes the user to the dedicated Login Form
  const handleCardClick = (role) => {
    setSelectedRole(role);
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
  };

  const handleLoginSuccess = (data) => {
    setIsLoggedIn(true);
    setLoggedInUser(data.user || null);
  };

  const cards = [
    { id: 'admin', title: 'Admin', color: '#3B82F6', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'pao', title: 'Payroll & Attendance Officer (PAO)', color: '#7B2CBF', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'employee', title: 'Employee', color: '#3B82F6', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
  ];

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser(null);
    setSelectedRole(null);
  };

  // If successfully logged in as Admin or PAO, render the Dashboard
  if (isLoggedIn && (selectedRole === 'Admin' || selectedRole === 'Payroll & Attendance Officer (PAO)')) {
    return <AdminDashboard user={loggedInUser} onLogout={handleLogout} />;
  }
  if (isLoggedIn && selectedRole === 'Employee') {
    return <EmployeeDashboard user={loggedInUser} onLogout={handleLogout} />;
  }

  // If a role is selected but not logged in, render the Login Container
  if (selectedRole) {
    return <LoginContainer role={selectedRole} onBack={handleBackToRoles} onLoginSuccess={handleLoginSuccess} />;
  }

  const cardDescriptions = {
    admin: 'Full system control with employee management, analytics, and payroll oversight.',
    pao: 'Run payroll cycles, manage attendance records, and handle disbursements.',
    employee: 'View salary history, request leaves, and track attendance data.'
  };

  // Otherwise, render the Landing Portal
  return (
    <div className="landing-container">
      {/* Ambient background orbs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <header className="landing-header">
        <div className="logo-group">
          <div className="logo-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="logo-text">AuditPay</span>
        </div>
        <div className="header-right">
          <span className="header-status">
            <span className="status-dot"></span>
            System Operational
          </span>
        </div>
      </header>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Enterprise Payroll Management
          </div>
          <h1 className="hero-title">
            <span className="title-line">Secure.</span>
            <span className="title-line">Payroll.</span>
            <span className="title-line title-accent">Audited.</span>
          </h1>
          <p className="hero-subtitle">
            A next-generation platform engineered for transparent payroll processing, real-time attendance tracking, and precision financial auditing.
          </p>
        </div>



        <div className="portal-label">
          <span className="portal-label-line"></span>
          <span className="portal-label-text">Select your portal</span>
          <span className="portal-label-line"></span>
        </div>

        <div className="role-grid">
          {cards.map((card, index) => (
            <button
              key={card.id}
              className="role-glass-card"
              onClick={() => handleCardClick(card.title)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-icon-wrapper" style={{ '--card-accent': card.color }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={card.icon} />
                </svg>
              </div>
              <div className="card-body">
                <span className="card-title">{card.title}</span>
              </div>
              <div className="card-footer">
                <span className="card-cta">Access Portal</span>
                <span className="card-arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="landing-footer">
        <span className="footer-brand">© 2026 AuditPay</span>
        <span className="footer-sep">·</span>
        <span className="footer-text">Enterprise Payroll & Audit Platform</span>
      </footer>
    </div>
  );
}

export default App;