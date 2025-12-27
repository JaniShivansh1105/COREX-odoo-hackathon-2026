# GearGuard Backend API

Production-grade backend for the GearGuard Maintenance Management System.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Features

✅ JWT-based authentication  
✅ Role-based access control (Admin, Manager, Technician, User)  
✅ Equipment management with ownership tracking  
✅ Maintenance team management  
✅ Maintenance request workflow with stages  
✅ Auto-fill functionality for requests  
✅ Overdue detection  
✅ Scrap equipment handling  
✅ Analytics and reports  
✅ Calendar view for scheduled maintenance  

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and configure:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string
   - `PORT` - Server port (default: 5000)

3. **Start MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   ```

4. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Equipment
- `POST /api/equipment` - Create equipment
- `GET /api/equipment` - Get all equipment
- `GET /api/equipment/:id` - Get single equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment
- `GET /api/equipment/:id/requests` - Get equipment requests
- `GET /api/equipment/:id/requests/open` - Get open requests
- `GET /api/equipment/:id/auto-fill` - Get auto-fill data

### Maintenance Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get single team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member

### Maintenance Requests
- `POST /api/requests` - Create request
- `GET /api/requests` - Get all requests
- `GET /api/requests/:id` - Get single request
- `PUT /api/requests/:id` - Update request
- `PATCH /api/requests/:id/stage` - Update stage
- `PATCH /api/requests/:id/assign` - Assign technician
- `DELETE /api/requests/:id` - Delete request
- `GET /api/requests/calendar` - Calendar view
- `GET /api/requests/overdue` - Overdue requests

### Users
- `GET /api/users` - Get all users
- `GET /api/users/technicians` - Get technicians

### Reports
- `GET /api/reports/by-team` - Reports by team
- `GET /api/reports/by-category` - Reports by category

## Role Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all resources |
| **Manager** | Manage equipment, teams, requests |
| **Technician** | Update assigned requests, view team requests |
| **User** | Create requests, view own requests |

## Database Models

### User
- name, email, password (hashed)
- role: Admin / Manager / Technician / User
- team reference
- avatar

### MaintenanceTeam
- teamName, specialization
- members array
- teamLead reference

### Equipment
- equipmentName, serialNumber, category
- purchaseDate, warrantyExpiryDate
- location, ownershipType (Department/Employee)
- department or assignedEmployee
- maintenanceTeam, defaultTechnician
- isActive

### MaintenanceRequest
- subject, equipment reference
- equipmentCategory, maintenanceTeam (auto-filled)
- requestType: Corrective / Preventive
- stage: New / In Progress / Repaired / Scrap
- priority: Low / Medium / High / Urgent
- scheduledDate, durationHours
- assignedTechnician, createdBy
- description, resolutionNotes

## Business Logic

### Auto-Fill
When creating a request, selecting equipment auto-fills:
- equipmentCategory
- maintenanceTeam
- defaultTechnician (as assignedTechnician)

### Overdue Detection
Requests are overdue when:
- scheduledDate < today
- stage NOT IN ['Repaired', 'Scrap']

### Scrap Handling
When stage is changed to 'Scrap':
- Equipment.isActive is set to false
- No new requests can be created for that equipment

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/gearguard
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

## Testing

Use tools like Postman, Insomnia, or Thunder Client to test API endpoints.

Example login request:
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@gearguard.com",
  "password": "password123"
}
```

## Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── models/
│   ├── User.js
│   ├── MaintenanceTeam.js
│   ├── Equipment.js
│   └── MaintenanceRequest.js
├── middleware/
│   ├── auth.js                # JWT authentication
│   └── roleAuth.js            # Role-based authorization
├── controllers/
│   ├── authController.js
│   ├── equipmentController.js
│   ├── teamController.js
│   ├── requestController.js
│   ├── userController.js
│   └── reportController.js
├── routes/
│   ├── authRoutes.js
│   ├── equipmentRoutes.js
│   ├── teamRoutes.js
│   ├── requestRoutes.js
│   ├── userRoutes.js
│   └── reportRoutes.js
├── utils/
│   └── validators.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js                  # Entry point
```

## License

ISC
