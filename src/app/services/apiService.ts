// API Service for EcoTrack Backend
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api';

// Custom API error with status and parsed body
export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Helper: extract user-friendly error message
function friendlyMessage(status: number, data: any): string {
  if (data?.error) return data.error;
  if (status === 403) return 'You are not authorized to perform this action.';
  if (status === 409) return 'This resource has already been modified by someone else.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 400) return 'Invalid request. Please check your input.';
  if (status >= 500) return 'Server error. Please try again later.';
  return `Unexpected error (${status})`;
}

// Helper function for API calls
const apiCall = async (endpoint: string, method: string = 'GET', data?: any, silent: boolean = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Attach JWT token for authenticated requests
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      // Handle expired/invalid token — redirect to login
      // Only redirect if we have a token AND it's actually a 401 (not just any error)
      if (response.status === 401 && localStorage.getItem('token')) {
        localStorage.clear();
        // Use a small delay to ensure clear() completes before redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 50);
        throw new ApiError(401, null, 'Session expired. Please log in again.');
      }

      // 403 with no token in storage = unauthenticated, redirect to login
      if (response.status === 403 && !localStorage.getItem('token')) {
        window.location.href = '/';
        throw new ApiError(403, null, 'Please log in to continue.');
      }

      let errorData: any = null;
      try {
        const text = await response.text();
        if (text) {
          try { errorData = JSON.parse(text); } catch { errorData = { error: text }; }
        }
      } catch { /* ignore */ }

      const msg = friendlyMessage(response.status, errorData);
      const apiError = new ApiError(response.status, errorData, msg);

      // Show toast for all non-silenced errors
      if (!silent) {
        if (response.status === 403) {
          toast.error(msg, { id: `err-403-${endpoint}` });
        } else if (response.status === 409) {
          toast.error(msg, { id: `err-409-${endpoint}` });
        } else if (response.status >= 500) {
          toast.error(msg, { id: `err-500-${endpoint}` });
        }
      }
      // 400/404 are usually handled inline, so we don't toast them by default

      throw apiError;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    // If it's already an ApiError, re-throw as-is
    if (error instanceof ApiError) throw error;

    // Network / connection errors
    console.error('API call failed:', error);
    toast.error('Unable to reach server. Check your connection.', { id: 'network-error' });
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
  resetPassword: (email: string, newPassword: string) =>
    apiCall('/users/reset-password', 'POST', { email, newPassword }),
  updateUser: (id: number, userData: any) => 
    apiCall(`/users/${id}`, 'PUT', userData),
  deleteUser: (id: number) => apiCall(`/users/${id}`, 'DELETE'),
  // Admin APIs
  getAdminStats: (adminId: number) => apiCall(`/users/admin/stats?adminId=${adminId}`),
  getPendingCollectors: (adminId: number) => apiCall(`/users/pending-collectors?adminId=${adminId}`),
  updateAccountStatus: (userId: number, accountStatus: string, adminId: number, reason?: string) => {
    const body: any = { accountStatus };
    if (reason) {
      body.reason = reason;
    }
    return apiCall(`/users/${userId}/account-status?adminId=${adminId}`, 'PATCH', body);
  },
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
  updateWasteStatus: (id: number, status: string, currentUserId?: number, collectorNotes?: string, extras?: { collectionPhotoUrl?: string; collectorLatitude?: number; collectorLongitude?: number }) => {
    const body: any = { status };
    if (collectorNotes) body.collectorNotes = collectorNotes;
    if (extras?.collectionPhotoUrl) body.collectionPhotoUrl = extras.collectionPhotoUrl;
    if (extras?.collectorLatitude != null) body.collectorLatitude = String(extras.collectorLatitude);
    if (extras?.collectorLongitude != null) body.collectorLongitude = String(extras.collectorLongitude);
    return apiCall(`/waste/${id}/status${currentUserId ? `?currentUserId=${currentUserId}` : ''}`, 'PATCH', body);
  },
  deleteWaste: (id: number) => apiCall(`/waste/${id}`, 'DELETE'),
  
  // Analytics APIs
  getUserAnalytics: (userId: number, timeRange: string = 'month', startDate?: Date, endDate?: Date) => {
    let endpoint = `/waste/analytics/user/${userId}?timeRange=${timeRange}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    }
    return apiCall(endpoint);
  },
  getUserTrends: (userId: number, timeRange: string = 'month', startDate?: Date, endDate?: Date) => {
    let endpoint = `/waste/analytics/trends/${userId}?timeRange=${timeRange}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    }
    return apiCall(endpoint);
  },
  getGlobalAnalytics: () => apiCall('/waste/analytics/global'),
  // Collector-specific analytics
  getCollectorAnalytics: (collectorId: number, timeRange: string = 'month', startDate?: Date, endDate?: Date) => {
    let endpoint = `/waste/analytics/collector/${collectorId}?timeRange=${timeRange}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    }
    return apiCall(endpoint);
  },
  getCollectorTrends: (collectorId: number, timeRange: string = 'month', startDate?: Date, endDate?: Date) => {
    let endpoint = `/waste/analytics/collector-trends/${collectorId}?timeRange=${timeRange}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    }
    return apiCall(endpoint);
  },
  getCollectorDashboardStats: (collectorId: number) =>
    apiCall(`/waste/analytics/collector-dashboard/${collectorId}`),
  getCollectorHistory: (collectorId: number) =>
    apiCall(`/waste/collector-history/${collectorId}`),
  classifyImage: (userId: number, imageBase64: string) =>
    apiCall('/waste/classify', 'POST', { userId, imageBase64 }, true),
  updateClassificationAccepted: (id: number, wasAccepted: boolean) =>
    apiCall(`/waste/classifications/${id}/accepted`, 'PATCH', { wasAccepted }),
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

// Notification APIs
export const notificationAPI = {
  getUserNotifications: (userId: number) => apiCall(`/notifications/user/${userId}`),
  getUnreadCount: (userId: number) => apiCall(`/notifications/user/${userId}/unread`),
  markAsRead: (id: number) => apiCall(`/notifications/${id}/read`, 'PATCH'),
  markAllAsRead: (userId: number) => apiCall(`/notifications/user/${userId}/read-all`, 'PATCH'),
  deleteNotification: (id: number) => apiCall(`/notifications/${id}`, 'DELETE'),
};

// Marketplace APIs
export const marketplaceAPI = {
  getAll: () => apiCall('/marketplace'),
  getByCategory: (category: string) => apiCall(`/marketplace/category/${encodeURIComponent(category)}`),
  getMine: (sellerId: number) => apiCall(`/marketplace/seller/${sellerId}`),
  getById: (id: number) => apiCall(`/marketplace/${id}`),
  create: (data: any) => apiCall('/marketplace', 'POST', data),
  update: (id: number, data: any) => apiCall(`/marketplace/${id}`, 'PUT', data),
  delete: (id: number) => apiCall(`/marketplace/${id}`, 'DELETE'),
};

// Education APIs
export const educationAPI = {
  getAll: () => apiCall('/education'),
  getByCategory: (category: string) => apiCall(`/education/category/${encodeURIComponent(category)}`),
  getFeatured: () => apiCall('/education/featured'),
  getById: (id: number) => apiCall(`/education/${id}`),
};

// Rewards APIs
export const rewardsAPI = {
  getPoints: (userId: number) => apiCall(`/rewards/points/${userId}`),
  getBadges: () => apiCall('/rewards/badges'),
  getUserBadges: (userId: number) => apiCall(`/rewards/user-badges/${userId}`),
  checkBadges: (userId: number) => apiCall(`/rewards/check-badges/${userId}`, 'POST'),
  redeem: (data: { userId: number; rewardId: string; rewardName: string; pointsCost: number }) =>
    apiCall('/rewards/redeem', 'POST', data),
  getRedemptions: (userId: number) => apiCall(`/rewards/redemptions/${userId}`),
};

// Settings APIs
export const settingsAPI = {
  get: (userId: number) => apiCall(`/settings/${userId}`),
  save: (userId: number, data: any) => apiCall(`/settings/${userId}`, 'PUT', data),
};

// Support APIs
export const supportAPI = {
  submit: (data: { userId: number; subject: string; message: string }) =>
    apiCall('/support/tickets', 'POST', data),
  getTickets: (userId: number) => apiCall(`/support/tickets/user/${userId}`),
};

// Events APIs
export const eventsAPI = {
  getAllEvents: () => apiCall('/events'),
  getUpcomingEvents: () => apiCall('/events/upcoming'),
  getUpcomingEventsByLocation: (location: string) => apiCall(`/events/upcoming/location/${encodeURIComponent(location)}`),
  getEventById: (id: number) => apiCall(`/events/${id}`),
  getEventsByCategory: (category: string) => apiCall(`/events/upcoming/category/${encodeURIComponent(category)}`),
  getEventsByLocationAndCategory: (location: string, category: string) => apiCall(`/events/upcoming/location/${encodeURIComponent(location)}/category/${encodeURIComponent(category)}`),
  createEvent: (data: any) => apiCall('/events', 'POST', data),
  updateEvent: (id: number, data: any) => apiCall(`/events/${id}`, 'PUT', data),
  deleteEvent: (id: number) => apiCall(`/events/${id}`, 'DELETE'),
};

// File Upload API
export const uploadAPI = {
  uploadWasteImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE_URL}/upload/waste-image`, { method: 'POST', body: formData, headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data, data.error || 'Upload failed');
    }
    return res.json();
  },
};

// Carbon APIs
export const carbonAPI = {
  getCurrentCarbon: (userId: number) => apiCall(`/carbon/${userId}`),
  getCarbonHistory: (userId: number) => apiCall(`/carbon/${userId}/history`),
  getLeaderboard: () => apiCall('/carbon/leaderboard'),
  recalculate: (userId: number) => apiCall(`/carbon/${userId}/recalculate`, 'POST')
};
