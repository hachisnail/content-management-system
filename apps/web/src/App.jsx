import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './providers/SocketProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './features/auth/hooks/useAuth';
import { ProtectedRoute } from './components/common';
import { SidebarLayout } from './components/layout/SidebarLayout';
import { PermissionProvider } from './providers/PermissionProvider';
import { GlobalAuthAlert } from './components/common/GlobalAuthAlert';
import { NotificationProvider } from './providers/NotificationProvider';
// Config
import { routeConfig, publicRoutes, standaloneRoutes } from './config/routeConfig'; 

// Import Error Pages
import { NotFoundPage, UnauthorizedPage } from './features/auth/pages/ErrorPages';

const queryClient = new QueryClient();

const renderRoutes = (routes) => {
  return routes.map((route, index) => {
    if (route.type === 'section' && route.children) {
      return (
        <React.Fragment key={`section-${index}`}>
          {renderRoutes(route.children)}
        </React.Fragment>
      );
    }
    if (route.path && route.element) {
      return <Route key={route.path} path={route.path} element={route.element} />;
    }
    return null;
  });
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <SocketProvider>
              <PermissionProvider>
                
                <GlobalAuthAlert /> 

                <Routes>
                  {/* --- Public Routes --- */}
                  {renderRoutes(publicRoutes)}
                  
                  {/* --- Error Pages --- */}
                  <Route path="/403" element={<UnauthorizedPage />} />
                  <Route path="/404" element={<NotFoundPage />} />

                  {/* --- Protected Routes --- */}
                  <Route element={<ProtectedRoute />}>
                    {renderRoutes(standaloneRoutes)}

                    <Route element={
                      <NotificationProvider>
                        <SidebarLayout />
                      </NotificationProvider>
                    }>
                      {renderRoutes(routeConfig)}
                    </Route>
                  </Route>

                  {/* --- Catch All --- */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </PermissionProvider>
            </SocketProvider>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;