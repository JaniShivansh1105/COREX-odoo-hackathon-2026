import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Login Page
 * Handles user authentication
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { email: formData.email, password: '***' });
      const result = await login(formData);
      console.log('Login result:', result);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🛠️ GearGuard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Maintenance Management System
          </p>
          <h3 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Sign in to your account
          </h3>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Message */}
          {(error || authError) && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error || authError}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Test Accounts Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-md border border-blue-200">
            <p className="text-sm font-semibold text-gray-800 mb-2">🧪 Test Accounts Available:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded">
                <span className="font-medium text-purple-600">Admin:</span>
                <p className="text-gray-600">admin@gearguard.com</p>
                <p className="text-gray-500">Admin@123</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium text-blue-600">Manager:</span>
                <p className="text-gray-600">manager@gearguard.com</p>
                <p className="text-gray-500">Manager@123</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium text-green-600">Technician:</span>
                <p className="text-gray-600">technician@gearguard.com</p>
                <p className="text-gray-500">Tech@123</p>
              </div>
              <div className="bg-white p-2 rounded">
                <span className="font-medium text-orange-600">User:</span>
                <p className="text-gray-600">user@gearguard.com</p>
                <p className="text-gray-500">User@123</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">💡 Role is automatically assigned</p>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Don't have an account? Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
