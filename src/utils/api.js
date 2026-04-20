import axios from 'axios';

const api = axios.create({
  baseURL: 'https://hostel-be-imyw.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hostelToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hostelToken');
      localStorage.removeItem('hostelUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getOne: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  checkIn: (id, data) => api.post(`/rooms/${id}/checkin`, data),
  checkOut: (id, data) => api.post(`/rooms/${id}/checkout`, data),
};

export const residentsAPI = {
  getAll: (params) => api.get('/residents', { params }),
  getOne: (id) => api.get(`/residents/${id}`),
  create: (data) => api.post('/residents', data),
  update: (id, data) => api.put(`/residents/${id}`, data),
  delete: (id) => api.delete(`/residents/${id}`),
  getInvoices: (id) => api.get(`/residents/${id}/invoices`),
};

export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getOne: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getOne: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  recordPayment: (id, data) => api.post(`/billing/${id}/payment`, data),
  generateBulk: (data) => api.post('/billing/generate-bulk', data),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  create: (data) => api.post('/notifications', data),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
  delete: (id) => api.delete(`/users/${id}`),
};

export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  revenue: (params) => api.get('/reports/revenue', { params }),
  occupancy: () => api.get('/reports/occupancy'),
  maintenance: () => api.get('/reports/maintenance'),
};

export const paymentsAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

export default api;
