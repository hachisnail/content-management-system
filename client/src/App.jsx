import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
} from "react-router-dom";

/* =========================
   CONTEXT PROVIDERS & GUARDS
========================= */
import { PublicProvider } from "./context/PublicContext";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import {
  RequireAuth,
  RequirePermission,
  RequireFeature,
} from "./components/common/RouteGuards";
import MainLayout from "./layouts/MainLayout";
import PublicLayout from "./layouts/PublicLayout";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ErrorPage } from "./features/shared";
import { routeConfig } from "./config/routeConfig";

/* =========================
   SCOPES (PROVIDERS)
========================= */
const PublicScope = () => (
  <PublicProvider>
    <Outlet />
  </PublicProvider>
);

const AuthScope = () => (
  <AuthProvider>
    <Outlet />
  </AuthProvider>
);

const ConfigScope = () => (
  <ConfigProvider>
    <Outlet />
  </ConfigProvider>
);

/* =========================
   ROUTING HELPERS
========================= */
const renderRoutes = (routes, isPrivate = true) => {
  return routes.flatMap((route, index) => {
    if (route.type === "section")
      return renderRoutes(route.children, isPrivate);
    const key = route.index ? `index-${index}` : route.path || `route-${index}`;
    let element = route.element || <Outlet />;
    if (isPrivate && route.permission) {
      element = (
        <RequirePermission permission={route.permission}>
          {element}
        </RequirePermission>
      );
    }
    if (route.featureFlag) {
      element = (
        <RequireFeature flag={route.featureFlag}>{element}</RequireFeature>
      );
    }
    return (
      <Route key={key} path={route.path} index={route.index} element={element}>
        {route.children && renderRoutes(route.children, isPrivate)}
      </Route>
    );
  });
};

/* =========================
   ROUTE SPLITTING
========================= */

// 1. Auth-Dependent Public Routes (Login, Setup)
// They are public (no guard) but need AuthContext to function
const authPublicRoutes = routeConfig.filter(
  (r) => r.isPublic && r.needsAuthContext
);

// 2. Pure Public Routes (Landing, Donation)
// They don't need user data or login functions
const purePublicRoutes = routeConfig.filter(
  (r) => r.isPublic && !r.needsAuthContext
);

// 3. Private Routes (Dashboard, Inventory, etc.)
// Require login and usually live inside the MainLayout
const privateRoutes = routeConfig.filter((r) => !r.isPublic);

/* =========================
   MAIN APP COMPONENT
========================= */
const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<PublicScope />}>
        
        {/* ZONE 1: PURE PUBLIC (No AuthContext) */}
      <Route element={<PublicLayout />}>
        {renderRoutes(purePublicRoutes, false)}
      </Route>

        {/* ZONE 2 & 3: EVERYTHING THAT NEEDS AUTH LOGIC */}
        <Route element={<AuthScope />}>
          
          {/* ZONE 2: Auth-Dependent Public (Login, Setup) */}
          {renderRoutes(authPublicRoutes, false)}

          {/* ZONE 3: Private Area (Needs 'isAuthenticated' check) */}
          <Route element={<RequireAuth />}>
            <Route element={<ConfigScope />}>
              <Route element={<MainLayout />} errorElement={<ErrorBoundary />}>
                {renderRoutes(privateRoutes, true)}
              </Route>
            </Route>
          </Route>
        </Route>

        {/* 404 FALLBACK */}
        <Route path="*" element={<ErrorPage code={404} />} />
      </Route>,
    ),
  );

  return <RouterProvider router={router} />;
};

export default App;