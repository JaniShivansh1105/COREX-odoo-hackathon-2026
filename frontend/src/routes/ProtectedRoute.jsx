import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 * Optionally checks for required roles
 * 
 * @param {Object} props
 * @param {JSX.Element} props.children - Child components to render
 * @param {Array<string>} props.allowedRoles - Optional array of allowed roles
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You do not have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {allowedRoles.join(' or ')}
          </p>
          <p className="text-sm text-gray-500">Your role: {user?.role}</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return children;
};

export default ProtectedRoute;
