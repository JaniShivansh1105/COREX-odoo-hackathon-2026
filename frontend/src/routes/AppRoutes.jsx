import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// App Pages
import Dashboard from '../pages/Dashboard';
import EquipmentModule from '../pages/EquipmentModule';
import EquipmentDetail from '../pages/EquipmentDetail';
import EquipmentForm from '../pages/EquipmentForm';
import MaintenanceModule from '../pages/MaintenanceModule';
import MaintenanceDetail from '../pages/MaintenanceDetail';
import MaintenanceForm from '../pages/MaintenanceForm';
import Kanban from '../pages/Kanban';
import Calendar from '../pages/Calendar';
import TeamsModule from '../pages/TeamsModule';
import ReportsModule from '../pages/ReportsModule';
import UsersModule from '../pages/UsersModule';
import SettingsModule from '../pages/SettingsModule';
import AuditLog from '../pages/AuditLog';
import NotFound from '../pages/NotFound';

// Role constants
import { ROLES } from '../utils/constants';

/**
 * Application Routes
 * Defines all routes and their access control
 */
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* Auth Routes (Public) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Register />
            }
          />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - All authenticated users */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Equipment Module - Tab-based navigation */}
          <Route path="/equipment" element={<EquipmentModule />} />
          <Route path="/equipment/by-department" element={<EquipmentModule />} />
          <Route path="/equipment/by-employee" element={<EquipmentModule />} />
          
          {/* Equipment Detail - Standalone page */}
          <Route path="/equipment/:id" element={<EquipmentDetail />} />
          
          {/* Equipment Form - Admin and Manager only */}
          <Route
            path="/equipment/new"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <EquipmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <EquipmentForm />
              </ProtectedRoute>
            }
          />

          {/* Maintenance Module - Tab-based navigation */}
          <Route path="/maintenance" element={<MaintenanceModule />} />
          <Route path="/maintenance/kanban" element={<MaintenanceModule />} />
          <Route path="/maintenance/calendar" element={<MaintenanceModule />} />
          <Route path="/maintenance/new" element={<MaintenanceModule />} />
          <Route path="/maintenance/my-requests" element={<MaintenanceModule />} />
          <Route path="/maintenance/overdue" element={<MaintenanceModule />} />
          
          {/* Maintenance Detail - Standalone page */}
          <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
          
          {/* Maintenance Request Edit - Admin and Manager only */}
          <Route
            path="/maintenance/:id/edit"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <MaintenanceForm />
              </ProtectedRoute>
            }
          />

          {/* Calendar - Standalone route for backward compatibility */}
          <Route path="/calendar" element={<Calendar />} />

          {/* Teams Module - Admin and Manager only */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TeamsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/new"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <TeamsModule />
              </ProtectedRoute>
            }
          />

          {/* Users Module - Admin and Manager only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <UsersModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/by-role"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <UsersModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/create"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <UsersModule />
              </ProtectedRoute>
            }
          />

          {/* Reports Module - Admin and Manager only */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ReportsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/equipment"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ReportsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/teams"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ReportsModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/trends"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <ReportsModule />
              </ProtectedRoute>
            }
          />

          {/* Audit Log - Admin and Manager only */}
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
                <AuditLog />
              </ProtectedRoute>
            }
          />

          {/* Settings Module - All authenticated users */}
          <Route path="/settings" element={<SettingsModule />} />
          <Route path="/settings/system" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <SettingsModule />
            </ProtectedRoute>
          } />
          <Route path="/settings/categories" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
              <SettingsModule />
            </ProtectedRoute>
          } />
          <Route path="/settings/notifications" element={<SettingsModule />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
