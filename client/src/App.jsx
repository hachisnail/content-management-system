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
} from "./components/RouteGuards";
import MainLayout from "./layouts/MainLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorPage from "./pages/error/ErrorPage";
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

// Split public routes into those that need auth logic and those that don't
const loginRoute = routeConfig.filter((r) => r.path === "auth");
const otherPublicRoutes = routeConfig.filter(
  (r) => r.isPublic && r.path !== "auth",
);
const privateRoutes = routeConfig.filter((r) => !r.isPublic);

/* =========================
   MAIN APP COMPONENT
========================= */
const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<PublicScope />}>
        {/* ZONE 1: PURE PUBLIC (No AuthContext) */}
        {renderRoutes(otherPublicRoutes, false)}

        {/* ZONE 2 & 3: EVERYTHING THAT NEEDS AUTH LOGIC */}
        <Route element={<AuthScope />}>
          {/* Auth-Dependent Public (Login page needs the 'login' function) */}
          {renderRoutes(loginRoute, false)}

          {/* Private Area (Needs 'isAuthenticated' check) */}
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
