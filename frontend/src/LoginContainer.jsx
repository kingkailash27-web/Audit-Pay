import React, { useState, useEffect } from 'react';
import './LoginContainer.css';

function LoginContainer({ role, onBack, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [apiMessage, setApiMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Force Admin and PAO to always be in Login mode
    useEffect(() => {
        if (role === 'Admin' || role === 'Payroll & Attendance Officer (PAO)') {
            setIsLogin(true);
        }
    }, [role]);

    const toggleMode = () => {
        if (role === 'Admin' || role === 'Payroll & Attendance Officer (PAO)') return;
        setIsLogin(!isLogin);
        setApiMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setApiMessage(null);

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role, username, password, action: isLogin ? 'login' : 'register' })
            });

            const data = await response.json();

            if (response.ok) {
                setApiMessage({ type: 'success', text: data.message });
                // Persist auth data for Employee Dashboard
                localStorage.setItem('empID', username);
                if (data.token) localStorage.setItem('token', data.token);
                if (onLoginSuccess) {
                    onLoginSuccess(data);
                }
            } else {
                setApiMessage({ type: 'error', text: data.message || 'Authentication failed' });
            }
        } catch (error) {
            console.error('Error connecting to backend:', error);
            setApiMessage({
                type: 'error',
                text: 'Failed to connect to backend. Ensure server is running.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-split-screen">
            <div className="login-rect-frame">
                <div className="login-form-section">
                    <div className="login-form-wrapper">
                        <button className="login-back-btn" onClick={onBack} aria-label="Go back">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Back
                        </button>

                        <div className="login-header-section">
                            <h1 className="login-welcome-heading">
                                {role === 'Admin' ? 'Admin Login' : role === 'Payroll & Attendance Officer (PAO)' ? 'PAO Login' : isLogin ? 'Welcome back' : 'Create Account'}
                            </h1>
                            <p className="login-role-badge">
                                Signing in as <span className={`role-badge-text ${role === 'Payroll & Attendance Officer (PAO)' ? 'pao' : role.toLowerCase()}`}>{role}</span>
                            </p>
                        </div>

                        {apiMessage && (
                            <div className={`login-message login-message-${apiMessage.type}`}>
                                {apiMessage.type === 'success' && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                                {apiMessage.type === 'error' && (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                )}
                                <span>{apiMessage.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-auth-form">
                            <div className="login-form-group">
                                <label htmlFor="username" className="login-label">
                                    {role === 'Admin' ? 'Admin Username' : role === 'Payroll & Attendance Officer (PAO)' ? 'PAO ID' : 'Employee ID'}
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={role === 'Admin' ? 'Enter admin username' : role === 'Payroll & Attendance Officer (PAO)' ? 'Enter your PAO ID' : 'Enter your Employee ID'}
                                    required
                                    className="login-input"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="login-form-group">
                                <label htmlFor="password" className="login-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="login-input"
                                    disabled={isLoading}
                                />
                            </div>

                            <button type="submit" className="login-submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <svg className="login-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10" opacity="0.25" />
                                            <path d="M12 2a10 10 0 0 1 8.66 14.66" opacity="1" />
                                        </svg>
                                        Processing...
                                    </>
                                ) : (isLogin ? 'Login to Portal' : 'Register Account')}
                            </button>
                        </form>

                        {role !== 'Admin' && role !== 'Payroll & Attendance Officer (PAO)' && (
                            <div className="login-footer-section">
                                <p className="login-toggle-text">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                                    <button className="login-toggle-btn" onClick={toggleMode} type="button" disabled={isLoading}>
                                        {isLogin ? 'Create one now' : 'Log in instead'}
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="login-visual-section">
                    <svg className="login-geometric-bg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
                        <defs>
                            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor: '#0C1220', stopOpacity: 1}} />
                                <stop offset="50%" style={{stopColor: '#090E18', stopOpacity: 1}} />
                                <stop offset="100%" style={{stopColor: '#06090F', stopOpacity: 1}} />
                            </linearGradient>
                            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor: '#3B82F6', stopOpacity: 0.18}} />
                                <stop offset="100%" style={{stopColor: '#6366F1', stopOpacity: 0.08}} />
                            </linearGradient>
                        </defs>

                        <rect width="400" height="800" fill="url(#grad1)" />

                        <g opacity="0.85">
                            <polygon points="200,50 350,150 350,350 200,450 50,350 50,150" 
                                     fill="none" stroke="url(#grad2)" strokeWidth="2" />

                            <polygon points="200,200 320,300 80,300" 
                                     fill="none" stroke="#6366F1" strokeWidth="1" opacity="0.4" />
                            <polygon points="200,250 280,320 120,320" 
                                     fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />

                            <circle cx="100" cy="600" r="80" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.15" />
                            <circle cx="300" cy="650" r="60" fill="none" stroke="#7B2CBF" strokeWidth="1" opacity="0.18" />

                            <g opacity="0.2" stroke="#1E293B" strokeWidth="0.5">
                                <line x1="50" y1="500" x2="350" y2="500" />
                                <line x1="50" y1="530" x2="350" y2="530" />
                                <line x1="50" y1="560" x2="350" y2="560" />
                                <line x1="100" y1="480" x2="100" y2="600" />
                                <line x1="150" y1="480" x2="150" y2="600" />
                                <line x1="200" y1="480" x2="200" y2="600" />
                                <line x1="250" y1="480" x2="250" y2="600" />
                                <line x1="300" y1="480" x2="300" y2="600" />
                            </g>

                            <circle cx="50" cy="100" r="3" fill="#3B82F6" opacity="0.5" />
                            <circle cx="350" cy="250" r="2.5" fill="#6366F1" opacity="0.4" />
                            <circle cx="200" cy="450" r="3.5" fill="#7B2CBF" opacity="0.3" />
                            <circle cx="75" cy="700" r="2" fill="#3B82F6" opacity="0.35" />
                        </g>

                        <g opacity="0.08">
                            <circle cx="200" cy="400" r="300" fill="#3B82F6" />
                        </g>
                    </svg>

                    <div className="login-visual-overlay" />
                </div>
            </div>
        </div>
    );
}

export default LoginContainer;
