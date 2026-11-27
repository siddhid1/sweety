import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sweety_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('sweety_token');
      localStorage.removeItem('sweety_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const SLOT_OPTIONS = [
  { value: 'MORNING', label: 'Morning (fasting)' },
  { value: 'AFTER_BREAKFAST', label: 'After breakfast' },
  { value: 'AFTER_LUNCH', label: 'After lunch' },
  { value: 'AFTER_DINNER', label: 'After dinner' },
];

export function slotLabel(slot) {
  return SLOT_OPTIONS.find((o) => o.value === slot)?.label || slot;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function rangeColor(value) {
  if (value < 70) return 'bg-red-100 text-red-700';
  if (value <= 140) return 'bg-emerald-100 text-emerald-700';
  if (value <= 180) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default api;
