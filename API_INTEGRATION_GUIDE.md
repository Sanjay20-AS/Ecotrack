# EcoTrack Frontend-Backend Integration Guide

## Server Status

✅ **Backend Server**: Running on `http://localhost:8080`
✅ **Frontend Server**: Running on `http://localhost:5173`
✅ **Database**: PostgreSQL (`ecotrack_db`)

## API Endpoints

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users/signup` - Create new user
- `POST /api/users/login` - User login
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Waste Tracking
- `GET /api/waste` - Get all waste items
- `GET /api/waste/{id}` - Get waste by ID
- `GET /api/waste/user/{userId}` - Get waste by user
- `GET /api/waste/type/{type}` - Get waste by type
- `GET /api/waste/status/{status}` - Get waste by status
- `POST /api/waste` - Create waste item
- `PUT /api/waste/{id}` - Update waste item
- `DELETE /api/waste/{id}` - Delete waste item

### Facility Management
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/{id}` - Get facility by ID
- `GET /api/facilities/type/{type}` - Get facilities by type
- `GET /api/facilities/active` - Get active facilities
- `GET /api/facilities/nearest?type={type}&lat={lat}&lng={lng}` - Find nearest facility
- `POST /api/facilities` - Create facility
- `PUT /api/facilities/{id}` - Update facility
- `DELETE /api/facilities/{id}` - Delete facility

### Waste Priority & Scheduling
- `GET /api/waste/priority?type={type}&quantity={qty}&days={days}&distance={dist}` - Calculate priority
- `GET /api/waste/pickup-schedule?type={type}&quantity={qty}&days={days}&availableSlots={slots}` - Schedule pickup

## API Service Usage

Import the API service in your components:

```typescript
import { 
  userAPI, 
  wasteAPI, 
  facilityAPI, 
  wastePriorityAPI,
  pickupAPI 
} from '@/app/services/apiService';

// Example: Get all facilities
const facilities = await facilityAPI.getAllFacilities();

// Example: Create waste item
const newWaste = await wasteAPI.createWaste({
  userId: 1,
  type: 'FOOD',
  quantity: 5.5,
  description: 'Food waste from restaurant',
  locationLatitude: 12.9716,
  locationLongitude: 77.5946,
  locationAddress: '123 Main St'
});

// Example: Login user
const user = await userAPI.login('user@example.com', 'password123');

// Example: Find nearest facility
const nearestFacility = await facilityAPI.getNearestFacility('FOOD', 12.9716, 77.5946);
```

## Database Tables

- **users** - User profiles and authentication
- **waste** - Waste items tracking
- **waste_pickups** - Scheduled pickups
- **facilities** - Waste processing facilities
- **communities** - Community groups
- **education_content** - Educational materials
- **marketplace_items** - Eco-friendly products/services

## CORS Configuration

Frontend origins allowed:
- `http://localhost:5173`
- `http://localhost:3000`
- `http://127.0.0.1:5173`

## Next Steps

1. Update screens to use the API service
2. Add authentication token handling
3. Implement error handling in API calls
4. Add loading states in UI
5. Create community and marketplace endpoints (optional)
6. Add education content endpoints (optional)
