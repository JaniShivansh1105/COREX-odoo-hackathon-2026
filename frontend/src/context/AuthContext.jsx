import { createContext, useState, useEffect } from 'react';
import * as authAPI from '../api/auth.api';

/**
 * Authentication Context
 * Manages global authentication state
 */

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize auth state from localStorage on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication from stored token
   */
  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          // Token invalid, clear storage
          logout();
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    try {
      setError(null);
      console.log('AuthContext: Calling login API');
      const response = await authAPI.login(credentials);
      console.log('AuthContext: Login response:', response);
      
      const { token: newToken, user: newUser } = response.data;
      
      // Store in state
      setToken(newToken);
      setUser(newUser);
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return { success: true };
    } catch (err) {
      console.error('AuthContext: Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Register new user
   * @param {Object} userData - { name, email, password, role }
   */
  const register = async (userData) => {
    try {
      setError(null);
      console.log('AuthContext: Calling register API');
      const response = await authAPI.register(userData);
      console.log('AuthContext: Register response:', response);
      
      const { token: newToken, user: newUser } = response.data;
      
      // Store in state
      setToken(newToken);
      setUser(newUser);
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return { success: true };
    } catch (err) {
      console.error('AuthContext: Register error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Check if user has one of the specified roles
   * @param {Array<string>} roles - Array of roles to check
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
