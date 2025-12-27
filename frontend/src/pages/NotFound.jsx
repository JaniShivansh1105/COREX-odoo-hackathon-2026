import { Link } from 'react-router-dom';

/**
 * 404 Not Found Page
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-4xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-4 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
