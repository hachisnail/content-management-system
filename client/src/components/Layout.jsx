import React from 'react';
import { Link } from 'react-router-dom';

const Layout = ({ children, user, logout, isAuthenticated }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-white text-2xl font-bold">CMS MIS</Link>
          <ul className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
                </li>
                <li>
                  <Link to="/socket-test" className="text-gray-300 hover:text-white">Socket Test</Link>
                </li>
                <li>
                  <Link to="/admin-test" className="text-gray-300 hover:text-white">Admin Test</Link>
                </li>
                <li>
                  <Link to="/test-dashboard" className="text-gray-300 hover:text-white">Test Dashboard</Link>
                </li>
                <li>
                  <Link to="/monitor" className="text-gray-300 hover:text-white">Monitor</Link>
                </li>
                <li className="text-gray-300">Welcome, {user?.username || user?.email}!</li>
                <li>
                  <button
                    onClick={logout}
                    className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login-test" className="text-gray-300 hover:text-white">Login</Link>
                </li>
                <li>
                  <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default Layout;
