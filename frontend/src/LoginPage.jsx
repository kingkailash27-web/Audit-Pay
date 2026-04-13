import React, { useState, useEffect } from 'react';
import './LoginPage.css'; // Create this stylesheet next

function LoginPage({ role, onBack, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [apiMessage, setApiMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Force Admin and Audit to always be in Login mode
    useEffect(() => {
        if (role === 'Admin' || role === 'Audit' || role === 'Auditor') {
            setIsLogin(true);
        }
    }, [role]);

    const toggleMode = () => {
        if (role === 'Admin' || role === 'Audit' || role === 'Auditor') return; // Admin AND Audit strictly cannot create accounts
        setIsLogin(!isLogin);
        setApiMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setApiMessage(null);

        // In a real app, you would route to a different endpoint for register vs login
        // e.g., /api/register or /api/login
        // For now, we reuse the mock login endpoint to test the connection.
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
        <div className="login-page-overlay">
            <div className="login-modal-container">
                <div className="login-left">
                    <button className="back-btn" onClick={onBack}>
                        &larr; Back
                    </button>

                    <div className="modal-header">
                        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p>Proceeding as <span className={`role-badge ${role.toLowerCase()}`}>{role}</span></p>
                    </div>

                    {apiMessage && (
                        <div className={`form-message ${apiMessage.type}`}>
                            {apiMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username / EmpID</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your ID"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Processing...' : (isLogin ? 'Login to Portal' : 'Register Account')}
                        </button>
                    </form>

                    {role !== 'Admin' && role !== 'Audit' && role !== 'Auditor' && (
                        <div className="modal-footer">
                            <p>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button className="toggle-mode-btn" onClick={toggleMode} type="button">
                                    {isLogin ? 'Create one now' : 'Log in instead'}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
                <div className="login-right">
                    <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070" alt="Geometric Abstract Art" className="geometric-img" />
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
