import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const REPORT_BASE = import.meta.env.VITE_REPORT_URL || 'http://localhost:8080/reports';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── AUTH ────────────────────────────────────────────────────
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

// ── INFRASTRUCTURE ───────────────────────────────────────────
export const zoneAPI = {
    getAll: () => api.get('/infrastructure/zones'),
    getOne: (id) => api.get(`/infrastructure/zones/${id}`),
    create: (data) => api.post('/infrastructure/zones', data),
    update: (id, data) => api.put(`/infrastructure/zones/${id}`, data),
    delete: (id) => api.delete(`/infrastructure/zones/${id}`),
};

export const tankAPI = {
    getAll: () => api.get('/infrastructure/tanks'),
    getOne: (id) => api.get(`/infrastructure/tanks/${id}`),
    create: (data) => api.post('/infrastructure/tanks', data),
    update: (id, data) => api.put(`/infrastructure/tanks/${id}`, data),
    delete: (id) => api.delete(`/infrastructure/tanks/${id}`),
};

export const tapAPI = {
    getAll: () => api.get('/infrastructure/taps'),
    getOne: (id) => api.get(`/infrastructure/taps/${id}`),
    create: (data) => api.post('/infrastructure/taps', data),
    update: (id, data) => api.put(`/infrastructure/taps/${id}`, data),
    delete: (id) => api.delete(`/infrastructure/taps/${id}`),
};

// ── PEOPLE ───────────────────────────────────────────────────
export const householdAPI = {
    getAll: () => api.get('/people/households'),
    getOne: (id) => api.get(`/people/households/${id}`),
    getMembers: (id) => api.get(`/people/households/${id}/members`),
    create: (data) => api.post('/people/households', data),
    update: (id, data) => api.put(`/people/households/${id}`, data),
    delete: (id) => api.delete(`/people/households/${id}`),
};

export const memberAPI = {
    getAll: () => api.get('/people/members'),
    getOne: (id) => api.get(`/people/members/${id}`),
    create: (data) => api.post('/people/members', data),
    update: (id, data) => api.put(`/people/members/${id}`, data),
    delete: (id) => api.delete(`/people/members/${id}`),
};

export const committeeAPI = {
    getAll: () => api.get('/people/committee'),
    getOne: (id) => api.get(`/people/committee/${id}`),
    create: (data) => api.post('/people/committee', data),
    update: (id, data) => api.put(`/people/committee/${id}`, data),
    delete: (id) => api.delete(`/people/committee/${id}`),
};

export const userAPI = {
    getAll: () => api.get('/people/users'),
    getZonal: () => api.get('/people/users/zonal'),
    create: (data) => api.post('/people/users', data),
    delete: (id) => api.delete(`/people/users/${id}`),
};

// ── FINANCE ──────────────────────────────────────────────────
export const rateAPI = {
    getAll: () => api.get('/finance/rates'),
    create: (data) => api.post('/finance/rates', data),
};

export const subscriptionAPI = {
    getAll: () => api.get('/finance/subscriptions'),
    getByHousehold: (id) => api.get(`/finance/subscriptions/household/${id}`),
    create: (data) => api.post('/finance/subscriptions', data),
};

export const paymentAPI = {
    getAll: () => api.get('/finance/payments'),
    getBySubscription: (id) => api.get(`/finance/payments/subscription/${id}`),
    create: (data) => api.post('/finance/payments', data),
};

export const maintenanceAPI = {
    getAll: () => api.get('/finance/maintenance'),
    getOne: (id) => api.get(`/finance/maintenance/${id}`),
    create: (data) => api.post('/finance/maintenance', data),
    update: (id, data) => api.put(`/finance/maintenance/${id}`, data),
    addCost: (id, data) => api.post(`/finance/maintenance/${id}/costs`, data),
};

export const expenditureAPI = {
    getAll: () => api.get('/finance/expenditures'),
    getCategories: () => api.get('/finance/categories'),
    create: (data) => api.post('/finance/expenditures', data),
    update: (id, data) => api.put(`/finance/expenditures/${id}`, data),
    createCategory: (data) => api.post('/finance/categories', data),
};

export const committeePaymentAPI = {
    getAll: () => api.get('/finance/committee-payments'),
    create: (data) => api.post('/finance/committee-payments', data),
};

export const financeAPI = {
    getSummary: () => api.get('/finance/summary'),
    getYearSummary: (year) => api.get(`/finance/summary/${year}`),
};

// ── REPORTS (JasperReports on port 8080) ─────────────────────
export const reportAPI = {
    annualFinance: (year, format = 'pdf') =>
        `${REPORT_BASE}/annual-finance?year=${year}&format=${format}`,
    subscriptionStatement: (householdId, year, format = 'pdf') =>
        `${REPORT_BASE}/subscription-statement?householdId=${householdId}&year=${year}&format=${format}`,
    maintenanceCost: (year, format = 'pdf') =>
        `${REPORT_BASE}/maintenance-cost?year=${year}&format=${format}`,
    overdueSubscriptions: (year, format = 'pdf') =>
        `${REPORT_BASE}/overdue-subscriptions?year=${year}&format=${format}`,
    committeePayments: (year, format = 'pdf') =>
        `${REPORT_BASE}/committee-payments?year=${year}&format=${format}`,
};

export default api;