import { Outlet } from 'react-router-dom';

/**
 * Auth Layout
 * Simple layout for authentication pages (login, register)
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
