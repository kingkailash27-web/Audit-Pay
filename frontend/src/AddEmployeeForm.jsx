import React, { useState } from 'react';
import axios from 'axios';

function AddEmployeeForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    EmpID: '',
    Name: '',
    DeptID: '151 - Engineering',
    JoiningDate: '',
    Password: '',
    BaseSalary: '',
    BankAccount: '',
    role: 'employee',
    providentFund: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);

  const taxRate = 0.10; // 10%
  const pfRate = 0.05;  // 5%

  const baseSalNum = Number(formData.BaseSalary) || 0;
  const calculatedTax = baseSalNum * taxRate;
  const calculatedPF = formData.providentFund ? baseSalNum * pfRate : 0;
  const netPay = baseSalNum - calculatedTax - calculatedPF;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleReview = (e) => {
    e.preventDefault();
    setShowReview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/admin/add-employee', formData);
      
      if (response.data.success) {
        onSuccess(response.data.message || 'Employee added successfully!');
        // Reset form
        setFormData({
          EmpID: '',
          Name: '',
          DeptID: '151 - Engineering',
          JoiningDate: '',
          Password: '',
          BaseSalary: '',
          BankAccount: '',
          role: 'employee',
          providentFund: false
        });
        setShowReview(false);
      } else {
        setError(response.data.message || 'An error occurred.');
        setShowReview(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error communicating with server.');
      setShowReview(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-employee-container">
      <h2 style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        {showReview ? 'Review Details' : 'Add New Member'}
      </h2>
      
      {error && <div className="error-toast">{error}</div>}

      {!showReview ? (
        <form onSubmit={handleReview} className="admin-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: 'var(--text-light)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-dark)', color: 'var(--text-light)' }}>
              <option value="employee">Employee</option>
              <option value="audit">Auditor</option>
            </select>
          </div>

          <div className="form-grid">
            {formData.role === 'audit' ? (
              <>
                <div className="form-group">
                  <label>Audit ID</label>
                  <input type="text" name="EmpID" value={formData.EmpID} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="Name" value={formData.Name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="Password" value={formData.Password} onChange={handleChange} required />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" name="EmpID" value={formData.EmpID} onChange={handleChange} required />
                </div>
                
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" name="Name" value={formData.Name} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Department Selection</label>
                  <select name="DeptID" value={formData.DeptID} onChange={handleChange} required>
                    <option value="151 - Engineering">151 - Engineering</option>
                    <option value="152 - Marketing">152 - Marketing</option>
                    <option value="153 - Finance">153 - Finance</option>
                    <option value="154 - Human Resources">154 - Human Resources</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Joining Date</label>
                  <input type="date" name="JoiningDate" value={formData.JoiningDate} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input type="password" name="Password" value={formData.Password} onChange={handleChange} required />
                </div>

                <div className="form-group full-width">
                  <h3 style={{ color: 'var(--accent-blue)', margin: '1rem 0 0.5rem', fontSize: '1.1rem' }}>Financial Details</h3>
                  <hr style={{ borderColor: 'var(--border-subtle)', marginBottom: '1rem' }} />
                </div>

                <div className="form-group">
                  <label>Base Salary (₹)</label>
                  <input type="number" name="BaseSalary" value={formData.BaseSalary} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input type="text" name="BankAccount" value={formData.BankAccount} onChange={handleChange} required />
                </div>

                <div className="form-group">
                  <label>Taxes (Fixed 10%)</label>
                  <input type="text" value={`₹${calculatedTax.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="providentFund" 
                    name="providentFund" 
                    checked={formData.providentFund} 
                    onChange={handleChange} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <label htmlFor="providentFund" style={{ cursor: 'pointer', margin: 0 }}>Enrolled in Provident Fund (5%)</label>
                </div>

                <div className="form-group full-width">
                  <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>Estimated Net Pay: </span>
                    <span style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 'bold' }}>₹{netPay.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="submit-action-btn">
              Proceed to Review
            </button>
          </div>
        </form>
      ) : (
        <div className="review-section">
          <div className="review-card" style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0, color: 'var(--accent-blue)', marginBottom: '1rem' }}>Is this fine?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-muted)' }}>
              {formData.role === 'audit' ? (
                <>
                  <p><strong>Role:</strong> <span style={{ color: 'var(--text-light)' }}>Auditor</span></p>
                  <p><strong>Audit ID:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.EmpID}</span></p>
                  <p><strong>Name:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.Name}</span></p>
                </>
              ) : (
                <>
                  <p><strong>Role:</strong> <span style={{ color: 'var(--text-light)' }}>Employee</span></p>
                  <p><strong>EmpID:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.EmpID}</span></p>
                  <p><strong>Name:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.Name}</span></p>
                  <p><strong>Department:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.DeptID}</span></p>
                  <p><strong>Joining Date:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.JoiningDate}</span></p>
                  <p><strong>Base Salary:</strong> <span style={{ color: 'var(--text-light)' }}>₹{baseSalNum.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></p>
                  <p><strong>Taxes (10%):</strong> <span style={{ color: 'var(--text-light)' }}>₹{calculatedTax.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></p>
                  <p><strong>Provident Fund:</strong> <span style={{ color: 'var(--text-light)' }}>{formData.providentFund ? `Yes (₹${calculatedPF.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})})` : 'No'}</span></p>
                  <p><strong>Net Pay:</strong> <span style={{ color: '#34d399' }}>₹{netPay.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</span></p>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="submit-action-btn" onClick={() => setShowReview(false)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-light)' }}>
              Back to Edit
            </button>
            <button type="button" className="submit-action-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing...' : `Confirm & Save ${formData.role === 'audit' ? 'Auditor' : 'Employee'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddEmployeeForm;