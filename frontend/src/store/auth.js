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
    initialUser = { id: decoded.id, role: decoded.role };
    initialAuthenticated = true;
    axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  } catch (err) {
    console.warn('Invalid stored token, clearing auth header:', err.message);
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
        this.user = { id: decoded.id, role: decoded.role }; // Store user ID and role
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