import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { completeRegistration } from '../api/auth.api';

export const CompleteRegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    birthDate: '',
    contactNumber: ''
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing registration token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus('loading');
    try {
      await completeRegistration({ ...formData, token });
      navigate('/dashboard', { 
        state: { message: 'Registration complete! Welcome aboard.', type: 'success' } 
      });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!token) return <div className="p-10 text-center text-error">Invalid URL</div>;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold">Complete Registration</h2>
          <p className="text-sm text-base-content/70">Set up your account details.</p>

          {error && <div className="alert alert-error text-sm mt-2">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-3 mt-4">
             <div className="grid grid-cols-2 gap-2">
                <div className="form-control">
                  <label className="label"><span className="label-text">Birth Date</span></label>
                  <input type="date" name="birthDate" className="input input-bordered w-full" onChange={handleChange} />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Contact #</span></label>
                  <input type="tel" name="contactNumber" placeholder="+123..." className="input input-bordered w-full" onChange={handleChange} />
                </div>
             </div>

             <div className="form-control">
               <label className="label"><span className="label-text">New Password</span></label>
               <input type="password" name="password" className="input input-bordered" required onChange={handleChange} />
             </div>

             <div className="form-control">
               <label className="label"><span className="label-text">Confirm Password</span></label>
               <input type="password" name="confirmPassword" className="input input-bordered" required onChange={handleChange} />
             </div>

             <div className="form-control mt-6">
               <button className="btn btn-primary" disabled={status === 'loading'}>
                 {status === 'loading' && <span className="loading loading-spinner"></span>}
                 Finalize Account
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;    