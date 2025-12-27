import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Calendar,
  Users,
  UserCog,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { isAdminOrManager } from '../utils/rolePermissions';

/**
 * Sidebar Component
 * Side navigation menu with role-based menu items
 */
const Sidebar = () => {
  const { user } = useAuth();

  // Define menu items with role-based access
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Manager', 'Technician', 'User'],
    },
    {
      name: 'Equipment',
      path: '/equipment',
      icon: Wrench,
      roles: ['Admin', 'Manager', 'Technician', 'User'],
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: ClipboardList,
      roles: ['Admin', 'Manager', 'Technician', 'User'],
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: Calendar,
      roles: ['Admin', 'Manager', 'Technician', 'User'],
    },
    {
      name: 'Teams',
      path: '/teams',
      icon: Users,
      roles: ['Admin', 'Manager'],
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: BarChart3,
      roles: ['Admin', 'Manager'],
    },
    {
      name: 'Users',
      path: '/users',
      icon: UserCog,
      roles: ['Admin', 'Manager'],
    },
    {
      name: 'Audit Log',
      path: '/audit-log',
      icon: FileText,
      roles: ['Admin', 'Manager'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Admin', 'Manager', 'Technician', 'User'],
    },
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="px-3 py-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Role Info */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Logged in as</p>
          <p className="text-sm font-medium text-gray-900">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
