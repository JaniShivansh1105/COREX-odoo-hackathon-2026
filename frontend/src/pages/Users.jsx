/**
 * Users Page (Placeholder)
 * Will contain user management in future phases
 * Access: Admin and Manager only
 */
const Users = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">View and manage system users</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            User Management
          </h3>
          <p className="text-gray-600">
            User listing, role management, and user details will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users;
