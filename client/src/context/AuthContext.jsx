import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('jobfit_user');
    const token = localStorage.getItem('jobfit_token');
    if (saved && token) {
      setUser(JSON.parse(saved));
      // Always fetch fresh user data from server
      api.get('/auth/me').then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('jobfit_user', JSON.stringify(data.user));
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('jobfit_token', data.token);
    localStorage.setItem('jobfit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, username, password) => {
    const { data } = await api.post('/auth/register', { name, username, password });
    localStorage.setItem('jobfit_token', data.token);
    localStorage.setItem('jobfit_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jobfit_token');
    localStorage.removeItem('jobfit_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
