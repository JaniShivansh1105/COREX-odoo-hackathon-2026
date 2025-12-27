# GearGuard Frontend

Production-grade React frontend for the GearGuard Maintenance Management System.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Context API** - State management

## Features

✅ JWT-based authentication  
✅ Role-based access control  
✅ Protected routing  
✅ Centralized API service layer  
✅ Auto token refresh handling  
✅ Responsive layout with navbar and sidebar  
✅ Clean architecture with separation of concerns  

## Project Structure

```
src/
├── api/                    # API service layer
│   ├── axios.js           # Configured axios instance
│   ├── auth.api.js        # Auth API calls
│   ├── equipment.api.js   # Equipment API calls
│   ├── request.api.js     # Request API calls
│   ├── team.api.js        # Team API calls
│   ├── user.api.js        # User API calls
│   └── report.api.js      # Report API calls
├── context/               # Global state
│   └── AuthContext.jsx    # Authentication context
├── hooks/                 # Custom hooks
│   └── useAuth.js         # Auth hook
├── routes/                # Routing
│   ├── AppRoutes.jsx      # Main routes
│   └── ProtectedRoute.jsx # Route guard
├── pages/                 # Page components
│   ├── auth/              # Auth pages
│   ├── Dashboard.jsx
│   ├── Equipment.jsx
│   ├── Maintenance.jsx
│   ├── Calendar.jsx
│   ├── Teams.jsx
│   ├── Users.jsx
│   └── NotFound.jsx
├── layouts/               # Layout components
│   ├── MainLayout.jsx
│   └── AuthLayout.jsx
├── components/            # Reusable components
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   └── LoadingSpinner.jsx
├── utils/                 # Utilities
│   ├── constants.js
│   └── rolePermissions.js
├── App.jsx
└── main.jsx
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Integration

All API calls are centralized in the `src/api/` directory:

```javascript
import * as authAPI from '../api/auth.api';

// Login
const result = await authAPI.login({ email, password });

// Get equipment
const equipment = await equipmentAPI.getAllEquipment();
```

## Authentication Flow

1. User logs in via `/login`
2. JWT token stored in localStorage
3. Token automatically attached to all API requests
4. On 401 error, user is logged out and redirected to login
5. Protected routes check authentication before rendering

## Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | Full access to all pages |
| **Manager** | Dashboard, Equipment, Maintenance, Calendar, Teams, Users |
| **Technician** | Dashboard, Equipment, Maintenance, Calendar |
| **User** | Dashboard, Equipment, Maintenance, Calendar |

## Protected Routes

```jsx
// Protect single route
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Protect with role check
<ProtectedRoute allowedRoles={['Admin', 'Manager']}>
  <Teams />
</ProtectedRoute>
```

## Components

### Navbar
Top navigation with user info and logout button.

### Sidebar
Side navigation with role-based menu items.

### LoadingSpinner
Reusable loading indicator component.

## State Management

Authentication state is managed using React Context API:

```jsx
const { user, token, login, logout, isAuthenticated } = useAuth();
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=GearGuard
```

## Next Steps

This phase implements the **foundation architecture only**. Next phases will include:

- Equipment CRUD operations
- Maintenance request Kanban board
- Calendar integration
- Dashboard analytics
- Reports and charts

## Testing the App

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Register a new user at `http://localhost:3000/register`
4. Login and explore the interface

## License

ISC
