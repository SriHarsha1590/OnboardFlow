import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('onboardflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  stats: () => api.get('/employees/stats'),
  create: (data) => api.post('/employees', data),
  approveManager: (id, payload) => api.post(`/employees/${id}/approve-manager`, payload),
  approveIT: (id, payload) => api.post(`/employees/${id}/approve-it`, payload),
  approveHR: (id, payload) => api.post(`/employees/${id}/approve-hr`, payload),
  activities: (id) => api.get(`/employees/${id}/activities`),
  logs: (id) => api.get(`/employees/${id}/logs`),
  approvals: (id) => api.get(`/employees/${id}/approvals`),
  getPendingApprovals: (email) => api.get(`/employees/approvals/pending/${email}`),
  delete: (id) => api.delete(`/employees/${id}`),
}

export const managerApi = {
  list: (params) => api.get('/managers', { params }),
  getByRole: (role, department) => api.get(`/managers/role/${encodeURIComponent(role)}`, { params: department ? { department } : undefined }),
  getByDepartment: (dept) => api.get(`/managers/department/${encodeURIComponent(dept)}`),
  getOrgStructure: () => api.get('/managers/org-structure'),
}

export const itTeamApi = {
  list: () => api.get('/it-team'),
  getLead: () => api.get('/it-team/lead'),
  get: (id) => api.get(`/it-team/${id}`),
}

export const chatbotApi = {
  sendMessage: (message, history) => api.post('/chatbot/message', { message, history }),
}

export const onboardingPortalApi = {
  getData: (employeeId) => api.get(`/onboarding-portal/${employeeId}`),
  submitInsurance: (employeeId, dependents) => api.post(`/onboarding-portal/${employeeId}/insurance`, { dependents }),
  submitBanking: (employeeId, data) => api.post(`/onboarding-portal/${employeeId}/banking`, data),
  getBGV: (employeeId) => api.get(`/onboarding-portal/${employeeId}/bgv`),
}

export default api
