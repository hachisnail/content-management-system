import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      {user ? (
        <div>
          <p className="text-lg">Welcome, <span className="font-semibold">{user.username || user.email}</span>!</p>
          <p className="text-lg">Your Role: <span className="font-semibold">{user.role}</span></p>
          <p className="mt-4 text-gray-600">This is a protected page. You can access it because you are logged in.</p>
        </div>
      ) : (
        <p className="text-lg text-red-600">You are not logged in. Please log in to view this page.</p>
      )}
    </div>
  );
};

export default Dashboard;