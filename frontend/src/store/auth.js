import { defineStore } from 'pinia';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const savedToken = localStorage.getItem('token') || '';
const savedRole = localStorage.getItem('role') || 'employee';
let initialUser = null;
let initialAuthenticated = false;

if (savedToken) {
  try {
    const decoded = jwtDecode(savedToken);
    initialUser = { id: decoded.id, role: decoded.role, username: decoded.username };
    initialAuthenticated = true;
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  } catch (err) {
    console.warn('Invalid stored token, clearing auth header:', err.message);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: initialAuthenticated,
    token: savedToken,
    role: savedRole,
    user: initialUser,
  }),
  actions: {
    async login(credentials) {
      try {
        const res = await axios.post(`${API_BASE_URL}/api/users/login`, credentials);
        this.token = res.data.token;
        const decoded = jwtDecode(this.token); // Decode token
        this.user = { id: decoded.id, role: decoded.role, username: decoded.username };
        this.role = decoded.role;
        this.isAuthenticated = true;
        localStorage.setItem('token', this.token);
        localStorage.setItem('role', this.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } catch (err) {
        console.error('Login error:', err);
        throw err;
      }
    },
    async refreshToken() {
      const res = await axios.post(`${API_BASE_URL}/api/users/refresh-token`, {}, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      this.token = res.data.token;
      this.user = {
        id: res.data.user.id,
        role: res.data.user.role,
        username: res.data.user.username,
      };
      this.role = res.data.user.role;
      localStorage.setItem('token', this.token);
      localStorage.setItem('role', this.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      return res.data;
    },
    async initializeAuth() {
      if (!this.token) return;
      try {
        const res = await axios.post(`${API_BASE_URL}/api/users/refresh-token`, {}, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        this.token = res.data.token;
        this.user = {
          id: res.data.user.id,
          role: res.data.user.role,
          username: res.data.user.username,
        };
        this.role = res.data.user.role;
        this.isAuthenticated = true;
        localStorage.setItem('token', this.token);
        localStorage.setItem('role', this.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      } catch (err) {
        console.warn('Stored auth token invalid, clearing session:', err.response?.data?.message || err.message);
        this.logout();
      }
    },

    logout() {
      this.isAuthenticated = false;
      this.token = '';
      this.role = 'employee';
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      delete axios.defaults.headers.common['Authorization'];
    },
  },
});
