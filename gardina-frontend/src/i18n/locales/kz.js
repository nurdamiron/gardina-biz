import common from './kz/common';
import auth from './kz/auth';
import forgotPassword from './kz/forgotPassword';
import resetPassword from './kz/resetPassword';
import onboardingChecklist from './kz/onboardingChecklist';
import nav from './kz/nav';
import landing from './kz/landing';
import onboarding from './kz/onboarding';
import profile from './kz/profile';
import dashboard from './kz/dashboard';
import orders from './kz/orders';
import notifications from './kz/notifications';
import measurements from './kz/measurements';
import clients from './kz/clients';
import deals from './kz/deals';
import tasks from './kz/tasks';
import proposalsNs from './kz/proposals';
import fabrics from './kz/fabrics';
import services from './kz/services';
import prompts from './kz/prompts';
import rooms from './kz/rooms';
import adminLayout from './kz/adminLayout';
import adminSettings from './kz/adminSettings';
import notificationSettings from './kz/notificationSettings';
import adminDashboard from './kz/adminDashboard';
import adminReports from './kz/adminReports';
import adminNotifications from './kz/adminNotifications';
import adminCatalog from './kz/adminCatalog';
import adminUsers from './kz/adminUsers';

const kz = {
  common,
  auth,
  forgotPassword,
  resetPassword,
  onboardingChecklist,
  nav,
  landing,
  onboarding,
  profile,
  dashboard,
  orders,
  notifications,
  measurements,
  clients,
  deals,
  tasks,
  proposals: proposalsNs,
  fabrics,
  services,
  prompts,
  rooms,
  adminLayout,
  adminSettings,
  notificationSettings,
  adminDashboard,
  adminReports,
  adminNotifications,
  adminCatalog,
  adminUsers,
};

export default kz;
