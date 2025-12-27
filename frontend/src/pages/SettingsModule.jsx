import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Settings as SettingsIcon, Bell, Tag } from 'lucide-react';
import useAuth from '../hooks/useAuth';

/**
 * SettingsModule Component
 * Tab-based container for system settings
 * 
 * Tabs:
 * 1. Profile - User profile management
 * 2. System Config - System-wide configuration (Admin only)
 * 3. Categories - Equipment/Request categories
 * 4. Notifications - Notification preferences
 */
const SettingsModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Determine active tab from URL or default to 'profile'
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/settings/system')) return 'system';
    if (path.includes('/settings/categories')) return 'categories';
    if (path.includes('/settings/notifications')) return 'notifications';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Tab definitions
  const tabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    },
    {
      id: 'system',
      label: 'System Config',
      icon: SettingsIcon,
      roles: ['Admin']
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Tag,
      roles: ['Admin', 'Manager']
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      roles: ['Admin', 'Manager', 'Technician', 'User']
    }
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => tab.roles.includes(user?.role));

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    
    // Update URL without page reload
    const paths = {
      'profile': '/settings',
      'system': '/settings/system',
      'categories': '/settings/categories',
      'notifications': '/settings/notifications'
    };
    
    navigate(paths[tabId], { replace: true });
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'system':
        return <SystemConfig />;
      case 'categories':
        return <Categories />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Settings Tabs">
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
 * ProfileSettings Component
 * User profile management
 */
const ProfileSettings = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="mt-2 text-gray-600">
          Manage your personal information and account settings
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Profile Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={user?.role || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Profile editing functionality will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * SystemConfig Component
 * System-wide configuration (Admin only)
 */
const SystemConfig = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">System Configuration</h2>
        <p className="mt-2 text-gray-600">
          Manage system-wide settings and preferences
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            System Settings
          </h3>
          <p className="text-gray-600">
            Application configuration, backup settings, and system preferences will be available here.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Categories Component
 * Equipment and request category management
 */
const Categories = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
        <p className="mt-2 text-gray-600">
          Manage equipment categories and request types
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Equipment Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Categories</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Electrical</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Mechanical</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>HVAC</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Plumbing</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Category management features coming soon.
          </p>
        </div>
        
        {/* Request Types */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Types</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Corrective</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Preventive</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Inspection</span>
              <Tag className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Request type management features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * NotificationSettings Component
 * User notification preferences
 */
const NotificationSettings = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        <p className="mt-2 text-gray-600">
          Manage how you receive notifications
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* In-App Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">In-App Notifications</h3>
              <p className="text-sm text-gray-500">Show notifications in the app</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Advanced notification settings will be available in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;
