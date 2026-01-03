// client/src/pages/public/Register.jsx
import React, { useState } from 'react';
import api from '../../api'; // Assuming api.js is configured to make requests to the backend

function Register() {
  const [formData, setFormData] = useState({
    token: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      const response = await api.post('/users/complete-registration', {
        token: formData.token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      });
      setMessage('Registration successful! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
    }
  };

  return (
    <div>
      <h2>Complete Your Registration</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Registration Token</label>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Register;
