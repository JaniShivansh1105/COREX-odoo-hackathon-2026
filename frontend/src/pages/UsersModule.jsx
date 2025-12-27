import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users as UsersIcon, UserPlus, Shield, UserCheck } from 'lucide-react';
import * as userAPI from '../api/user.api';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

/**
 * UsersModule Component
 * Tab-based container for user management
 * 
 * Tabs:
 * 1. All Users - Complete user list with filters
 * 2. By Role - Users grouped by role
 * 3. Create User - Add new user (Admin only)
 */
const UsersModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'all'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/users/by-role')) return 'by-role';
    if (path.includes('/users/create')) return 'create';
    return 'all';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'all',
      label: 'All Users',
      icon: UsersIcon,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'by-role',
      label: 'By Role',
      icon: Shield,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'create',
      label: 'Create User',
      icon: UserPlus,
      roles: ['Admin']
    }
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role));

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Update URL without page reload
    const paths = {
      'all': '/users',
      'by-role': '/users/by-role',
      'create': '/users/create'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return <AllUsers />;
      case 'by-role':
        return <UsersByRole />;
      case 'create':
        return <CreateUser />;
      default:
        return <AllUsers />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Users Tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors duration-200
                  ${isActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {renderTabContent()}
      </div>
    </div>
  );
};

/**
 * AllUsers Component
 * Complete user list with search and filters
 */
const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({
        type: 'error',
        message: 'Failed to load users'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'Manager': 'bg-blue-100 text-blue-800',
      'Technician': 'bg-green-100 text-green-800',
      'User': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Users</h2>
        <p className="mt-2 text-gray-600">
          Manage system users and their roles
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Technician">Technician</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
};

/**
 * UsersByRole Component
 * Users grouped by role
 */
const UsersByRole = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({
        type: 'error',
        message: 'Failed to load users'
      });
    } finally {
      setLoading(false);
    }
  };

  // Group users by role
  const usersByRole = {
    'Admin': users.filter(u => u.role === 'Admin'),
    'Manager': users.filter(u => u.role === 'Manager'),
    'Technician': users.filter(u => u.role === 'Technician'),
    'User': users.filter(u => u.role === 'User')
  };

  const getRoleIcon = (role) => {
    if (role === 'Admin') return '👑';
    if (role === 'Manager') return '📋';
    if (role === 'Technician') return '🔧';
    return '👤';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users by Role</h2>
        <p className="mt-2 text-gray-600">
          View users organized by their role in the system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(usersByRole).map(([role, roleUsers]) => (
          <div key={role} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{role}</h3>
              <span className="text-2xl">{getRoleIcon(role)}</span>
            </div>
            
            <div className="text-3xl font-bold text-blue-600 mb-4">
              {roleUsers.length}
            </div>
            
            <div className="space-y-2">
              {roleUsers.slice(0, 3).map((user) => (
                <div key={user._id} className="flex items-center space-x-2 text-sm">
                  <div className="h-6 w-6 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-semibold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 truncate">{user.name}</span>
                </div>
              ))}
              {roleUsers.length > 3 && (
                <div className="text-xs text-gray-500 pl-8">
                  +{roleUsers.length - 3} more
                </div>
              )}
              {roleUsers.length === 0 && (
                <div className="text-sm text-gray-500">No users</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CreateUser Component
 * Form to create new user (Admin only)
 */
const CreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User'
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await userAPI.createUser(formData);
      
      setToast({
        type: 'success',
        message: 'User created successfully'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'User'
      });
      
      // Navigate to all users tab after 1.5 seconds
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (error) {
      console.error('Failed to create user:', error);
      setToast({
        type: 'error',
        message: error.response?.data?.message || 'Failed to create user'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
        <p className="mt-2 text-gray-600">
          Add a new user to the system
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum 6 characters"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="User">User</option>
              <option value="Technician">Technician</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Select the user's role and access level
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersModule;
