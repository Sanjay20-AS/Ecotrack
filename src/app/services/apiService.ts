// API Service for EcoTrack Backend
const API_BASE_URL = 'http://localhost:8080/api';

// Helper function for API calls
const apiCall = async (endpoint: string, method: string = 'GET', data?: any) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorMessage += ` - ${errorBody}`;
        }
      } catch (e) {
        // Ignore parsing errors for error response
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// User APIs
export const userAPI = {
  getAllUsers: () => apiCall('/users'),
  getUserById: (id: number) => apiCall(`/users/${id}`),
  signup: (userData: any) => apiCall('/users/signup', 'POST', userData),
  login: (email: string, password: string) => 
    apiCall('/users/login', 'POST', { email, password }),
  updateUser: (id: number, userData: any) => 
    apiCall(`/users/${id}`, 'PUT', userData),
  deleteUser: (id: number) => apiCall(`/users/${id}`, 'DELETE'),
};

// Waste APIs
export const wasteAPI = {
  getAllWaste: () => apiCall('/waste'),
  getWasteById: (id: number) => apiCall(`/waste/${id}`),
  getWasteByUserId: (userId: number) => apiCall(`/waste/user/${userId}`),
  getWasteByType: (type: string) => apiCall(`/waste/type/${type}`),
  getWasteByStatus: (status: string) => apiCall(`/waste/status/${status}`),
  createWaste: (wasteData: any) => apiCall('/waste', 'POST', wasteData),
  updateWaste: (id: number, wasteData: any, currentUserId?: number) => 
    apiCall(`/waste/${id}${currentUserId ? `?currentUserId=${currentUserId}` : ''}`, 'PUT', wasteData),
  deleteWaste: (id: number) => apiCall(`/waste/${id}`, 'DELETE'),
  
  // Analytics APIs
  getUserAnalytics: (userId: number, timeRange: string = 'month') => 
    apiCall(`/waste/analytics/user/${userId}?timeRange=${timeRange}`),
  getUserTrends: (userId: number, timeRange: string = 'month') => 
    apiCall(`/waste/analytics/trends/${userId}?timeRange=${timeRange}`),
  getGlobalAnalytics: () => apiCall('/waste/analytics/global'),
};

// Facility APIs
export const facilityAPI = {
  getAllFacilities: () => apiCall('/facilities'),
  getFacilityById: (id: number) => apiCall(`/facilities/${id}`),
  getFacilitiesByType: (type: string) => apiCall(`/facilities/type/${type}`),
  getActiveFacilities: () => apiCall('/facilities/active'),
  getNearestFacility: (type: string, lat: number, lng: number) => 
    apiCall(`/facilities/nearest?type=${type}&lat=${lat}&lng=${lng}`),
  createFacility: (facilityData: any) => 
    apiCall('/facilities', 'POST', facilityData),
  updateFacility: (id: number, facilityData: any) => 
    apiCall(`/facilities/${id}`, 'PUT', facilityData),
  deleteFacility: (id: number) => apiCall(`/facilities/${id}`, 'DELETE'),
};

// Waste Priority APIs
export const wastePriorityAPI = {
  calculatePriority: (type: string, quantity: number, days: number, distance: number) =>
    apiCall(`/waste/priority?type=${type}&quantity=${quantity}&days=${days}&distance=${distance}`),
};

// Pickup Scheduling APIs
export const pickupAPI = {
  schedulePickup: (type: string, quantity: number, days: number, availableSlots: number) =>
    apiCall(`/waste/pickup-schedule?type=${type}&quantity=${quantity}&days=${days}&availableSlots=${availableSlots}`),
};

// Community APIs
export const communityAPI = {
  getAllCommunities: () => apiCall('/communities'),
  getCommunityById: (id: number) => apiCall(`/communities/${id}`),
  createCommunity: (communityData: any) => apiCall('/communities/create', 'POST', communityData),
  joinCommunity: (id: number, userId: number) => apiCall(`/communities/${id}/join`, 'POST', { userId }),
  leaveCommunity: (id: number, userId: number) => apiCall(`/communities/${id}/leave`, 'POST', { userId }),
  getCommunityStats: (id: number) => apiCall(`/communities/${id}/stats`),
  getCommunityMembers: (id: number) => apiCall(`/communities/${id}/members`),
  getCommunityLeaderboard: (id: number) => apiCall(`/communities/${id}/leaderboard`),
  searchCommunities: (name: string) => apiCall(`/communities/search?name=${encodeURIComponent(name)}`),
};
