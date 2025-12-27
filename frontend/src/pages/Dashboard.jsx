import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  AlertCircle,
  ClipboardList,
  Clock,
  Trash2,
  TrendingUp,
  Filter,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { requestAPI } from '../api/request.api';
import * as equipmentAPI from '../api/equipment.api';
import { reportAPI } from '../api/report.api';
import useAuth from '../hooks/useAuth';
import { isAdminOrManager } from '../utils/rolePermissions';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

/**
 * Dashboard Component
 * Analytics and KPI overview for Admin/Manager roles
 * 
 * Features:
 * - KPI summary cards
 * - Charts (requests by team, category, over time)
 * - Report filters
 * - Role-based access control
 * 
 * @param {string} reportType - Specific report type to show
 * @param {boolean} showHeader - Show page header (default: true)
 */
const Dashboard = ({ reportType, showHeader = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    totalRequests: 0,
    openRequests: 0,
    overdueRequests: 0,
    scrappedEquipment: 0,
  });
  const [chartData, setChartData] = useState({
    byTeam: [],
    byCategory: [],
    overTime: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    requestType: '',
    priority: '',
  });

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, filters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Check if user has admin/manager role for full dashboard
      const hasFullAccess = isAdminOrManager(user?.role);

      if (hasFullAccess) {
        // Fetch all data in parallel for Admin/Manager
        const [requests, equipment, teamReports, categoryReports] = await Promise.all([
          requestAPI.getAllRequests(buildFilterParams()),
          equipmentAPI.getAllEquipment(),
          reportAPI.getReportsByTeam(),
          reportAPI.getReportsByCategory(),
        ]);

        // Calculate KPIs
        const openRequests = requests.filter(
          (r) => r.stage === 'New' || r.stage === 'In Progress'
        ).length;
        const overdueRequests = requests.filter((r) => r.isOverdue).length;
        const scrappedEquipment = equipment.filter((e) => !e.isActive).length;

        setKpiData({
          totalRequests: requests.length,
          openRequests,
          overdueRequests,
          scrappedEquipment,
        });

        // Process team data
        const teamData = teamReports.map((item) => ({
          name: item.teamName || 'Unassigned',
          requests: item.count,
        }));

        // Process category data
        const categoryData = categoryReports.map((item) => ({
          name: item.category || 'Unknown',
          value: item.count,
        }));

        // Process over time data (group by month)
        const overTimeData = processOverTimeData(requests);

        setChartData({
          byTeam: teamData,
          byCategory: categoryData,
          overTime: overTimeData,
        });
      } else {
        // For User/Technician: only fetch basic data without reports
        const [requests, equipment] = await Promise.all([
          requestAPI.getAllRequests(buildFilterParams()),
          equipmentAPI.getAllEquipment(),
        ]);

        // Calculate basic KPIs
        const openRequests = requests.filter(
          (r) => r.stage === 'New' || r.stage === 'In Progress'
        ).length;
        const overdueRequests = requests.filter((r) => r.isOverdue).length;
        const scrappedEquipment = equipment.filter((e) => !e.isActive).length;

        setKpiData({
          totalRequests: requests.length,
          openRequests,
          overdueRequests,
          scrappedEquipment,
        });

        // No chart data for basic users
        setChartData({
          byTeam: [],
          byCategory: [],
          overTime: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const buildFilterParams = () => {
    const params = {};
    if (filters.requestType) params.requestType = filters.requestType;
    if (filters.priority) params.priority = filters.priority;
    // Date filtering would need backend support - simplified here
    return params;
  };

  const processOverTimeData = (requests) => {
    // Group requests by month
    const grouped = {};
    requests.forEach((req) => {
      const date = new Date(req.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[monthKey] = (grouped[monthKey] || 0) + 1;
    });

    // Convert to array and sort
    return Object.keys(grouped)
      .sort()
      .slice(-6) // Last 6 months
      .map((key) => ({
        month: key,
        requests: grouped[key],
      }));
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      requestType: '',
      priority: '',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <ToastContainer />
      
      {/* Header */}
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
          <p className="text-sm text-gray-500">Role: {user?.role}</p>
        </div>
      )}

      {/* User/Technician Simple Dashboard */}
      {!isAdminOrManager(user?.role) && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/maintenance/new')}
                className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                Create Request
              </button>
              <button
                onClick={() => navigate('/maintenance/my-requests')}
                className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="w-5 h-5 mr-2" />
                My Requests
              </button>
              <button
                onClick={() => navigate('/equipment')}
                className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                View Equipment
              </button>
            </div>
          </div>

          {/* Simple Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Requests</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{kpiData.openRequests}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Requests</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{kpiData.overdueRequests}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">Welcome to GearGuard! 🛠️</h3>
            <p className="text-blue-50">
              Manage your equipment maintenance requests efficiently. Create new requests, track existing ones, and stay updated on your equipment status.
            </p>
          </div>
        </div>
      )}

      {/* Admin/Manager Full Dashboard */}
      {isAdminOrManager(user?.role) && (
        <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Report Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Type
              </label>
              <select
                value={filters.requestType}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Corrective">Corrective</option>
                <option value="Preventive">Preventive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Requests */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
             onClick={() => navigate('/maintenance')}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Requests</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{kpiData.totalRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">All maintenance requests</p>
        </div>

        {/* Open Requests */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
             onClick={() => navigate('/maintenance/kanban')}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Open Requests</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{kpiData.openRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">New + In Progress</p>
        </div>

        {/* Overdue Requests */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Overdue Requests</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{kpiData.overdueRequests}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Requires attention</p>
        </div>

        {/* Scrapped Equipment */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
             onClick={() => navigate('/equipment')}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Scrapped Equipment</h3>
              <p className="text-3xl font-bold text-gray-700 mt-2">{kpiData.scrappedEquipment}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Trash2 className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Inactive equipment</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Requests by Team - Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests by Team</h3>
          {chartData.byTeam.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.byTeam}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#3B82F6" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Requests by Category - Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Requests by Equipment Category
          </h3>
          {chartData.byCategory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.byCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Requests Over Time - Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests Over Time (Last 6 Months)</h3>
        {chartData.overTime.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Requests"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/maintenance/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Request
          </button>
          <button
            onClick={() => navigate('/maintenance/kanban')}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Kanban Board
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Calendar
          </button>
          <button
            onClick={() => navigate('/equipment')}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Manage Equipment
          </button>
        </div>
      </div>
        </div>
      )}
      {/* End Admin/Manager Dashboard */}
    </div>
  );
};

export default Dashboard;
