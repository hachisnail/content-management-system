import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/auth.api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.password !== passwords.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus('loading');
    try {
      await resetPassword({ ...passwords, token });
      navigate('/login', { 
        state: { message: 'Password reset successfully. Please login.', type: 'success' } 
      });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  if (!token) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-error">Invalid or Missing Token</h2>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title justify-center">Set New Password</h2>
          
          {error && <div className="alert alert-error text-sm mt-2">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="form-control">
              <label className="label"><span className="label-text">New Password</span></label>
              <input 
                type="password" 
                className="input input-bordered" 
                value={passwords.password}
                onChange={e => setPasswords({...passwords, password: e.target.value})}
                required 
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Confirm Password</span></label>
              <input 
                type="password" 
                className="input input-bordered" 
                value={passwords.confirmPassword}
                onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                required 
              />
            </div>
            <button className="btn btn-primary w-full mt-4" disabled={status === 'loading'}>
                {status === 'loading' ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;