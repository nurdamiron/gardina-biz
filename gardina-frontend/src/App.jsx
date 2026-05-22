import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { UIProvider } from './contexts/UIContext';
import Icon from './components/common/Icon';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import Sidebar from './components/navigation/Sidebar';
import EmailVerificationBanner from './components/common/EmailVerificationBanner';

// ─── Eagerly loaded (needed on first render) ──────────────────────────────────
import Login from './screens/Login';
import Register from './screens/Register';
import PlanOnboarding from './screens/PlanOnboarding';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import VerifyEmail from './screens/VerifyEmail';
import AcceptInvite from './screens/AcceptInvite';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PushPermissionPrompt from './components/common/PushPermissionPrompt';

// Landing is lazy-loaded — authenticated users never see it, and even for
// guests the framer-motion bundle is only loaded when they hit "/".
const Landing = lazy(() => import('./screens/Landing'));


const DesignerDashboard    = lazy(() => import('./screens/DesignerDashboard'));
const MeasurementsList     = lazy(() => import('./screens/MeasurementsList'));
const MeasurementDetails   = lazy(() => import('./screens/MeasurementDetails'));
const MeasurementForm      = lazy(() => import('./screens/MeasurementFormNew'));
const FabricSelection      = lazy(() => import('./screens/FabricSelection'));
const ProposalView         = lazy(() => import('./screens/ProposalView'));
const Profile              = lazy(() => import('./screens/Profile'));

// Sales
const SalesClientsList      = lazy(() => import('./screens/ManagerClientsList'));
const SalesCreateClient     = lazy(() => import('./screens/CreateClient'));
const SalesClientDetail     = lazy(() => import('./screens/ClientDetail'));
const SalesDealsFunnel      = lazy(() => import('./screens/DealsFunnel'));
const SalesDealDetail       = lazy(() => import('./screens/DealDetail'));

// Manager
const ManagerDashboard      = lazy(() => import('./screens/ManagerDashboard'));
const ManagerClientsList    = lazy(() => import('./screens/ManagerClientsList'));
const CreateClient          = lazy(() => import('./screens/CreateClient'));
const ManagerTasksList      = lazy(() => import('./screens/ManagerTasksList'));
const CreateMeasurementTask = lazy(() => import('./screens/CreateMeasurementTask'));
const ClientDetail          = lazy(() => import('./screens/ClientDetail'));
const DealsFunnel           = lazy(() => import('./screens/DealsFunnel'));
const DealDetail            = lazy(() => import('./screens/DealDetail'));
const OrdersList            = lazy(() => import('./screens/OrdersList'));

// Admin
const AdminDashboard     = lazy(() => import('./screens/admin/AdminDashboard'));
const AdminCatalog       = lazy(() => import('./screens/admin/AdminCatalog'));
const CreateFabric       = lazy(() => import('./screens/admin/CreateFabric'));
const ServiceForm        = lazy(() => import('./screens/admin/ServiceForm'));
const FabricDetails      = lazy(() => import('./screens/admin/FabricDetails'));
const AdminSettings      = lazy(() => import('./screens/admin/AdminSettings'));
const AdminNotifications = lazy(() => import('./screens/admin/AdminNotifications'));
const AdminUsers         = lazy(() => import('./screens/admin/AdminUsers'));
const AdminReports       = lazy(() => import('./screens/admin/AdminReports'));
const AdminBilling       = lazy(() => import('./screens/admin/AdminBilling'));

// Common
const NotificationsList    = lazy(() => import('./screens/NotificationsList'));
const NotificationSettings = lazy(() => import('./screens/NotificationSettings'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background-light">
    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <PageLoader />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
          <Icon name="block" size={48} className="text-red-500" />
          <h2 className="text-xl font-bold mt-4">Қол жетімсіз</h2>
          <p className="text-text-secondary mt-2">Бұл бетке қол жеткізу құқығыңыз жоқ</p>
          <button onClick={() => window.history.back()} className="mt-6 px-6 py-2 bg-primary text-white rounded-lg font-bold">
            Артқа
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const HomeRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) return <RoleDashboard />;
  return <Landing />;
};

const RoleDashboard = () => {
  const { user, logout } = useAuth();
  switch (user?.role) {
    case 'designer':  return <Navigate to="/designer/dashboard" replace />;
    case 'manager':   return <Navigate to="/manager/dashboard" replace />;
    case 'admin':     return <Navigate to="/admin/dashboard" replace />;
    case 'sales':     return <Navigate to="/sales/clients" replace />;
    default:
      logout();
      return <Navigate to="/login" replace />;
  }
};

const AppRoutes = () => {
  const [currentMeasurement, setCurrentMeasurement] = useState(null);
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      {isAuthenticated && <Sidebar />}
      <div className={isAuthenticated ? 'md:pl-60' : ''}>
      {isAuthenticated && <EmailVerificationBanner />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/onboarding/plan" element={<ProtectedRoute><PlanOnboarding /></ProtectedRoute>} />
        <Route path="/" element={<HomeRoute />} />

        {/* DESIGNER */}
        <Route path="/designer/dashboard"              element={<ProtectedRoute allowedRoles={['designer','admin']}><DesignerDashboard /></ProtectedRoute>} />
        <Route path="/designer/measurements"           element={<ProtectedRoute allowedRoles={['designer','admin']}><MeasurementsList /></ProtectedRoute>} />
        <Route path="/designer/measurements/:id"       element={<ProtectedRoute allowedRoles={['designer','admin']}><MeasurementDetails /></ProtectedRoute>} />
        <Route path="/designer/measurements/:id/proposal" element={<ProtectedRoute allowedRoles={['designer','admin','manager']}><ProposalView /></ProtectedRoute>} />
        <Route path="/designer/measurements/:id/room"  element={<ProtectedRoute allowedRoles={['designer','admin']}><MeasurementForm /></ProtectedRoute>} />
        <Route path="/designer/measurements/:id/fabric" element={<ProtectedRoute allowedRoles={['designer','admin']}><FabricSelection measurement={currentMeasurement} onComplete={setCurrentMeasurement} /></ProtectedRoute>} />

        {/* Legacy measurement routes */}
        <Route path="/measurements"                    element={<ProtectedRoute allowedRoles={['designer','manager','admin']}><MeasurementsList /></ProtectedRoute>} />
        <Route path="/measurements/:id"                element={<ProtectedRoute allowedRoles={['designer','manager','admin']}><MeasurementDetails /></ProtectedRoute>} />
        <Route path="/measurements/:id/proposal"       element={<ProtectedRoute allowedRoles={['designer','manager','admin']}><ProposalView /></ProtectedRoute>} />

        {/* SALES */}
        <Route path="/sales/clients"      element={<ProtectedRoute allowedRoles={['sales','admin']}><SalesClientsList /></ProtectedRoute>} />
        <Route path="/sales/client/new"   element={<ProtectedRoute allowedRoles={['sales','admin']}><SalesCreateClient /></ProtectedRoute>} />
        <Route path="/sales/clients/:id"  element={<ProtectedRoute allowedRoles={['sales','admin']}><SalesClientDetail /></ProtectedRoute>} />
        <Route path="/sales/funnel"       element={<ProtectedRoute allowedRoles={['sales','admin']}><SalesDealsFunnel /></ProtectedRoute>} />
        <Route path="/sales/deals/:id"    element={<ProtectedRoute allowedRoles={['sales','admin']}><SalesDealDetail /></ProtectedRoute>} />
        <Route path="/sales/order/new"    element={<ProtectedRoute allowedRoles={['sales','admin']}><CreateMeasurementTask /></ProtectedRoute>} />
        <Route path="/sales/profile"      element={<ProtectedRoute allowedRoles={['sales','admin']}><Profile /></ProtectedRoute>} />

        {/* MANAGER */}
        <Route path="/manager/dashboard"        element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/manager/clients"          element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerClientsList /></ProtectedRoute>} />
        <Route path="/manager/client/new"       element={<ProtectedRoute allowedRoles={['manager','admin']}><CreateClient /></ProtectedRoute>} />
        <Route path="/manager/clients/:id"      element={<ProtectedRoute allowedRoles={['manager','admin']}><ClientDetail /></ProtectedRoute>} />
        <Route path="/manager/funnel"           element={<ProtectedRoute allowedRoles={['manager','admin']}><DealsFunnel filterByManager /></ProtectedRoute>} />
        <Route path="/manager/order/new"        element={<ProtectedRoute allowedRoles={['manager','admin']}><CreateMeasurementTask /></ProtectedRoute>} />
        <Route path="/manager/orders"           element={<ProtectedRoute allowedRoles={['manager','admin']}><OrdersList filterByManager /></ProtectedRoute>} />
        <Route path="/manager/orders/:id"       element={<ProtectedRoute allowedRoles={['manager','admin']}><DealDetail /></ProtectedRoute>} />
        <Route path="/manager/tasks"            element={<ProtectedRoute allowedRoles={['manager','admin']}><ManagerTasksList /></ProtectedRoute>} />
        <Route path="/manager/measurements"     element={<ProtectedRoute allowedRoles={['manager','admin']}><MeasurementsList /></ProtectedRoute>} />
        <Route path="/manager/measurements/:id" element={<ProtectedRoute allowedRoles={['manager','admin']}><MeasurementDetails /></ProtectedRoute>} />
        <Route path="/manager/profile"          element={<ProtectedRoute allowedRoles={['manager','admin']}><Profile /></ProtectedRoute>} />
        <Route path="/deals/:id"                element={<ProtectedRoute allowedRoles={['manager','admin']}><DealDetail /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin/dashboard"              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/catalog"                element={<ProtectedRoute allowedRoles={['admin']}><AdminCatalog /></ProtectedRoute>} />
        <Route path="/admin/catalog/products/new"   element={<ProtectedRoute allowedRoles={['admin']}><CreateFabric /></ProtectedRoute>} />
        <Route path="/admin/catalog/products/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><CreateFabric /></ProtectedRoute>} />
        <Route path="/admin/catalog/products/:id"   element={<ProtectedRoute allowedRoles={['admin']}><FabricDetails /></ProtectedRoute>} />
        <Route path="/admin/clients"                element={<ProtectedRoute allowedRoles={['admin']}><ManagerClientsList /></ProtectedRoute>} />
        <Route path="/admin/client/new"             element={<ProtectedRoute allowedRoles={['admin']}><CreateClient /></ProtectedRoute>} />
        <Route path="/admin/clients/:id"            element={<ProtectedRoute allowedRoles={['admin']}><ClientDetail /></ProtectedRoute>} />
        <Route path="/admin/catalog/services/new"   element={<ProtectedRoute allowedRoles={['admin']}><ServiceForm /></ProtectedRoute>} />
        <Route path="/admin/catalog/services/:id"   element={<ProtectedRoute allowedRoles={['admin']}><ServiceForm /></ProtectedRoute>} />
        <Route path="/admin/settings"               element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/users"                  element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/reports"                element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/notifications"          element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/orders"                 element={<ProtectedRoute allowedRoles={['admin']}><OrdersList /></ProtectedRoute>} />
        <Route path="/admin/order/new"              element={<ProtectedRoute allowedRoles={['admin']}><CreateMeasurementTask /></ProtectedRoute>} />
        <Route path="/admin/billing"                element={<ProtectedRoute allowedRoles={['admin']}><AdminBilling /></ProtectedRoute>} />

        {/* COMMON */}
        <Route path="/designer/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile"             element={<Navigate to="/designer/profile" replace />} />
        <Route path="/notifications"       element={<ProtectedRoute><NotificationsList /></ProtectedRoute>} />
        <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </Suspense>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <UIProvider>
            <div className="min-h-screen bg-background-light">
              <GlobalLanguageSwitcher />
              <AppRoutes />
              <PWAInstallPrompt />
              <PushPromptWrapper />
            </div>
          </UIProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

const PushPromptWrapper = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <PushPermissionPrompt />;
};

const GlobalLanguageSwitcher = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Auth pages already have their own switcher.
  if (location.pathname === '/login' || location.pathname === '/register') return null;
  // Landing for guests keeps its own static experience.
  if (!isAuthenticated) return null;

  return (
    <div className="fixed top-3 right-3 z-[1200]">
      <LanguageSwitcher compact />
    </div>
  );
};

export default App;
