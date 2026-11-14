import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';
export const DEFAULT_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
export const DEFAULT_MISSION_DAY_ID = '5edd565e-737a-40bf-b35a-7d3bfe047ce2';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatic JWT injection interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('novaguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ensure a valid token exists
export async function ensureAuthToken() {
  let token = localStorage.getItem('novaguard_token');
  if (!token) {
    try {
      const res = await axios.post(`${API_BASE}/auth/dev-token?user_id=${DEFAULT_USER_ID}`);
      token = res.data.access_token;
      localStorage.setItem('novaguard_token', token);
    } catch (err) {
      console.error('Failed to acquire dev token:', err);
    }
  }
  return token;
}

export async function loginAstronaut(userId = DEFAULT_USER_ID, astronautData = null) {
  const res = await axios.post(`${API_BASE}/auth/dev-token?user_id=${userId}`);
  const token = res.data.access_token;
  localStorage.setItem('novaguard_token', token);
  if (astronautData) {
    localStorage.setItem('novaguard_user', JSON.stringify(astronautData));
  }
  return { token, user: astronautData };
}

export function logoutAstronaut() {
  localStorage.removeItem('novaguard_token');
  localStorage.removeItem('novaguard_user');
}

export function getStoredAstronaut() {
  const data = localStorage.getItem('novaguard_user');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// API methods
export const fetchMissions = async () => (await api.get('/api/v1/missions')).data;

export const fetchMissionDays = async (missionId) => 
  (await api.get(`/api/v1/missions/${missionId}/days`)).data;

export const fetchHealthRecords = async (missionDayId) => 
  (await api.get(`/api/v1/health-records`, { params: { mission_day_id: missionDayId, limit: 100 } })).data;

export const fetchVitalsSummary = async (missionDayId) => 
  (await api.get(`/api/v1/health-records/summary`, { params: { mission_day_id: missionDayId } })).data;

export const createHealthRecord = async (data) => 
  (await api.post('/api/v1/health-records', data)).data;

export const fetchSymptomLogs = async (missionDayId) => 
  (await api.get('/api/v1/symptoms', { params: { mission_day_id: missionDayId, limit: 50 } })).data;

export const createSymptomLog = async (data) => 
  (await api.post('/api/v1/symptoms', data)).data;

export const fetchChecklists = async (missionDayId) => 
  (await api.get('/api/v1/checklists', { params: { mission_day_id: missionDayId } })).data;

export const updateChecklist = async (id, isCompleted) => 
  (await api.patch(`/api/v1/checklists/${id}`, { is_completed: isCompleted })).data;

export const evaluateFlightDay = async (missionDayId) => 
  (await api.post(`/api/v1/health-assessments/evaluate/${missionDayId}`)).data;

export const fetchAssessments = async (missionDayId) => 
  (await api.get('/api/v1/health-assessments', { params: { mission_day_id: missionDayId, limit: 20 } })).data;

export default api;

