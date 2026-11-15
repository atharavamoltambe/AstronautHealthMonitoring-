import axios from 'axios';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000';
  }
  return '';
};

const API_BASE = getApiBase();
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

export async function loginAstronaut({ name, email, role, callSign, missionName, userId } = {}) {
  const finalEmail = email || `${(callSign || 'astro').toLowerCase().replace(/[^a-z0-9]/g, '')}@novaguard.nasa.gov`;
  let token = null;
  let resolvedUserId = userId || DEFAULT_USER_ID;

  try {
    const res = await axios.post(`${API_BASE}/auth/dev-token`, null, {
      params: {
        user_id: userId || undefined,
        display_name: name || 'Astronaut',
        email: finalEmail,
      },
      timeout: 3500,
    });
    token = res.data.access_token;
    resolvedUserId = res.data.user_id || resolvedUserId;
  } catch (err) {
    console.warn('Backend dev-token call failed or timed out, using fallback session token:', err);
    token = localStorage.getItem('novaguard_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMGQzNjYzMy0yNzZkLTUwZTUtYTZmZS1lMGNlNjkzMmVmMzUiLCJpYXQiOjE3OTQ3MzMwOTMsImV4cCI6MTc5NTMzNzg5Mywicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJlbWFpbCI6ImNhcnRlckBub3ZhZ3VhcmQubmFzYS5nb3YiLCJ1c2VyX21ldGFkYXRhIjp7ImZ1bGxfbmFtZSI6IkNtZHIuIEFsZXggQ2FydGVyIiwibmFtZSI6IkNtZHIuIEFsZXggQ2FydGVyIn19.e04a3FwIh7ijK-hGQgNogSLQMf46NcXTO3klI7dj7rI';
  }

  localStorage.setItem('novaguard_token', token);
  const astronautData = {
    name: name || 'Astronaut',
    callSign: callSign || 'ASTRO',
    role: role || 'Commander',
    missionName: missionName || 'Artemis Exploration Mission',
    email: finalEmail,
    id: resolvedUserId,
  };
  localStorage.setItem('novaguard_user', JSON.stringify(astronautData));
  return { token, user: astronautData };
}

export const createMission = async (data) => (await api.post('/api/v1/missions', data)).data;
export const createMissionDay = async (missionId, data) => (await api.post(`/api/v1/missions/${missionId}/days`, data)).data;

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
  (await api.get('/api/v1/symptom-logs', { params: { mission_day_id: missionDayId, limit: 50 } })).data;

export const createSymptomLog = async (data) => 
  (await api.post('/api/v1/symptom-logs', data)).data;

export const fetchChecklists = async (missionDayId) => 
  (await api.get('/api/v1/daily-checklists', { params: { mission_day_id: missionDayId } })).data;

export const updateChecklist = async (id, isCompleted) => 
  (await api.patch(`/api/v1/daily-checklists/${id}`, { is_completed: isCompleted })).data;

export const evaluateFlightDay = async (missionDayId) => 
  (await api.post(`/api/v1/health-assessments/evaluate/${missionDayId}`)).data;

export const fetchAssessments = async (missionDayId) => 
  (await api.get('/api/v1/health-assessments', { params: { mission_day_id: missionDayId, limit: 20 } })).data;

export const fetchPlaybooks = async (astronautWeight) => {
  const params = astronautWeight ? { astronaut_weight: astronautWeight } : {};
  return (await api.get('/api/v1/playbooks', { params })).data;
};

export const deployPlaybook = async (payload) => {
  return (await api.post('/api/v1/playbooks/deploy', payload)).data;
};

export const fetchRadiationStatus = async (missionDayId) => {
  return (await api.get('/api/v1/radiation/status', { params: { mission_day_id: missionDayId } })).data;
};

export const simulateSPE = async (payload) => {
  return (await api.post('/api/v1/radiation/simulate-spe', payload)).data;
};

export const resetSPE = async (missionDayId) => {
  return (await api.post('/api/v1/radiation/reset', null, { params: { mission_day_id: missionDayId } })).data;
};

export default api;

