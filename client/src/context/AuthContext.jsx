import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sweety_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem('sweety_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.data.user);
        localStorage.setItem('sweety_user', JSON.stringify(data.data.user));
      } catch {
        localStorage.removeItem('sweety_token');
        localStorage.removeItem('sweety_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sweety_token', data.data.token);
    localStorage.setItem('sweety_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('sweety_token', data.data.token);
    localStorage.setItem('sweety_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }

  function logout() {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
