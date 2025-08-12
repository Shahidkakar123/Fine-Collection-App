import { defineStore } from 'pinia';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({

    isAuthenticated: false,
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || 'employee',
    user: null, // Add user object to store decoded data
  }),
  actions: {
    async login(credentials) {
      try {
        
        const res = await axios.post('/api/users/login', credentials);
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