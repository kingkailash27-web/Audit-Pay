import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './PayrollRunner.css';

const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const COLORS = ['#3B82F6', '#7B2CBF', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];
const DAYS = [
    { id: 2, label: 'Mon' },
    { id: 3, label: 'Tue' },
    { id: 4, label: 'Wed' },
    { id: 5, label: 'Thu' },
    { id: 6, label: 'Fri' },
    { id: 7, label: 'Sat' },
    { id: 1, label: 'Sun' },
];

function AnalyticsDashboard({ user }) {
    const [data, setData] = useState({
        salaryDistribution: [],
        monthlyTrend: [],
        heatmapRaw: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [weekOffset, setWeekOffset] = useState(0);

    const getWeekStr = (offset) => {
        const d = new Date(); 
        d.setDate(d.getDate() + (offset * 7));
        const day = d.getDay();
        const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diffToMonday));
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0],
            label: `${monday.toLocaleDateString('en-IN', {month: 'short', day:'numeric'})} - ${sunday.toLocaleDateString('en-IN', {month: 'short', day:'numeric'})}`
        };
    };

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const week = getWeekStr(weekOffset);
                const response = await fetch(`http://localhost:5000/api/admin/analytics?startDate=${week.start}&endDate=${week.end}`);
                const result = await response.json();
                if (result.success) {
                    setData({
                        salaryDistribution: result.salaryDistribution || [],
                        monthlyTrend: result.monthlyTrend || [],
                        heatmapRaw: result.heatmapRaw || []
                    });
                } else {
                    setError('Failed to load analytical data.');
                }
            } catch (error) {
                console.error("Error fetching analytics", error);
                setError('Network error: Unable to connect to Audit Payn server.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [weekOffset]);

    const getHeatmapColor = (count, maxCount) => {
        if (count === 0) return '#1f2937'; // Empty state
        const intensity = 0.3 + (0.7 * (count / (maxCount || 1)));
        return `rgba(239, 68, 68, ${intensity})`; // Red shade
    };

    const heatmapData = DAYS.map(day => {
        const found = data.heatmapRaw.find(d => d._id === day.id);
        return { ...day, count: found ? found.count : 0 };
    });

    const maxAbsence = Math.max(...heatmapData.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="payroll-runner-container" style={{ backgroundColor: '#0B0E14', height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ border: '4px solid rgba(59, 130, 246, 0.1)', borderTop: '4px solid #3B82F6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#3B82F6', marginTop: '1rem', fontWeight: 'bold' }}>Synchronizing System Insights...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payroll-runner-container" style={{ backgroundColor: '#0B0E14', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #ef4444', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <p style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.2rem' }}>{error}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry Connection</button>
                </div>
            </div>
        );
    }

    const isAdmin = user?.role !== 'pao';
    const noData = data.salaryDistribution.length === 0 && data.monthlyTrend.length === 0 && data.heatmapRaw.length === 0;

    return (
        <div className="payroll-runner-container" style={{ backgroundColor: '#0B0E14' }}>
            <div className="payroll-header">
                <h2 style={{ color: '#3B82F6' }}>System Insights</h2>
                <p style={{ color: '#9ca3af' }}>Advanced metrics and visual analytics for the Audit Payn database.</p>
            </div>

            {noData ? (
                <div style={{ marginTop: '2rem', padding: '4rem', textAlign: 'center', backgroundColor: '#11141B', borderRadius: '8px', border: '1px dashed #1E293B' }}>
                    <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>No data available for visualization yet.</p>
                    <p style={{ color: '#636e7b', fontSize: '0.9rem' }}>Charts will populate once employees and payroll records are processed.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                    {isAdmin && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Salary Distribution Pie Chart */}
                            <div style={{ backgroundColor: '#11141B', padding: '1.5rem', borderRadius: '8px', border: '1px solid #161B22' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '3px', height: '15px', backgroundColor: '#3B82F6' }}></div>
                                    Base Salary by Department
                                </h3>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.salaryDistribution}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                stroke="none"
                                            >
                                                {data.salaryDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                formatter={(value) => formatRupee(value)} 
                                                contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#161B22', color: '#fff' }} 
                                            />
                                            <Legend wrapperStyle={{ color: '#9ca3af', paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Monthly Expense Trend */}
                            <div style={{ backgroundColor: '#11141B', padding: '1.5rem', borderRadius: '8px', border: '1px solid #161B22' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '3px', height: '15px', backgroundColor: '#3B82F6' }}></div>
                                    Payroll Expense Trend (6M)
                                </h3>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
                                            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6, fill: '#0B0E14', stroke: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                            <CartesianGrid stroke="#161B22" strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" stroke="#636e7b" tick={{ fontSize: 12 }} tickFormatter={(val) => { try { const d = new Date(val + ' 1'); return isNaN(d.getTime()) ? val : d.toLocaleString('default', { month: 'short' }); } catch { return val; } }} />
                                            <YAxis stroke="#636e7b" tickFormatter={(val) => `₹${val/1000}k`} tick={{ fontSize: 12 }} />
                                            <RechartsTooltip 
                                                formatter={(value) => formatRupee(value)} 
                                                contentStyle={{ backgroundColor: '#0B0E14', borderColor: '#161B22', color: '#fff' }} 
                                                labelStyle={{ color: '#3B82F6', marginBottom: '0.5rem' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Attendance Heatmap (Available to PAO and Admin) */}
                    <div style={{ backgroundColor: '#11141B', padding: '1.5rem', borderRadius: '8px', border: '1px solid #161B22' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ marginBottom: '0.5rem', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '3px', height: '15px', backgroundColor: '#3B82F6' }}></div>
                                    Overall Attendance Heatmap
                                </h3>
                                <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>Visualizing leave density across workdays.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#0d1117', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #1E293B' }}>
                                <button onClick={() => setWeekOffset(prev => prev - 1)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500', minWidth: '110px', textAlign: 'center' }}>{getWeekStr(weekOffset).label}</span>
                                <button onClick={() => setWeekOffset(prev => prev + 1)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
                            {heatmapData.map((day) => (
                                <div key={day.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ color: '#636e7b', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{day.label}</div>
                                    <div 
                                        style={{ 
                                            width: '100%', 
                                            height: '70px', 
                                            backgroundColor: getHeatmapColor(day.count, maxAbsence),
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '1.4rem',
                                            border: day.count > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #161B22',
                                            boxShadow: day.count > 0 ? '0 4px 12px rgba(239, 68, 68, 0.1)' : 'none'
                                        }}
                                        title={`${day.count} Total Leaves Recorded`}
                                    >
                                        {day.count > 0 ? day.count : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '2rem', fontSize: '0.85rem', color: '#636e7b' }}>
                            <span>Low Density</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#1f2937' }}></div>
                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></div>
                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.7)' }}></div>
                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#ef4444' }}></div>
                            </div>
                            <span>High Leave Density</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnalyticsDashboard;
