import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth.api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await forgotPassword(email);
      setStatus('success');
      setMessage('If an account exists for this email, you will receive a reset link shortly.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center">Reset Password</h2>
          <p className="text-center text-sm text-base-content/70">Enter your email to receive a reset link.</p>

          {status === 'success' ? (
            <div className="alert alert-success mt-4">
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {status === 'error' && (
                <div className="alert alert-error text-sm">{message}</div>
              )}
              
              <div className="form-control">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="input input-bordered w-full" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' && <span className="loading loading-spinner"></span>}
                Send Reset Link
              </button>
            </form>
          )}
          
          <div className="divider">OR</div>
          <Link to="/login" className="btn btn-outline btn-sm w-full">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;