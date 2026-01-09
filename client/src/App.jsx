import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { router } from './router'; // Import the JSX-defined router
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <RouterProvider router={router} />
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;