import { defineStore } from 'pinia';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuthStore } from './auth'; // Import auth store for token access

const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;

const getFineUserId = (fine) => {
  if (!fine?.userId) return '';
  return typeof fine.userId === 'object' ? fine.userId?._id || fine.userId?.id : fine.userId;
};

const timelineSeenKey = (userId) => `timelineSeenFines_${userId}`;

export const useFinesStore = defineStore('fines', {
  state: () => ({
    fines: [],
    loading: false,
    error: null,
    timelineSeenFineIds: [],
    pusherClient: null,
    previousFineCycles: [],
  }),

  getters: {
    timelineUnreadCount: (state) => {
      const authStore = useAuthStore();
      if (authStore.role !== 'employee') return 0;

      const userId = authStore.user?.id;
      if (!userId) return 0;

      const seen = new Set(state.timelineSeenFineIds);
      return state.fines.filter(fine => {
        const fineUserId = getFineUserId(fine);
        const belongsToUser = fineUserId === userId || fineUserId?.toString() === userId?.toString();
        return belongsToUser && !seen.has(fine._id);
      }).length;
    },

    employeeFines: (state) => {
      const employees = {};
      state.fines.forEach(fine => {
        if (!employees[fine.name]) {
          employees[fine.name] = {
            name: fine.name,
            fines: [],
            totalAmount: 0,
            status: 'pending',
          };
        }
        employees[fine.name].fines.push(fine);
        employees[fine.name].totalAmount += fine.value;
        employees[fine.name].status = employees[fine.name].fines.every(f => f.status === 'paid')
          ? 'paid'
          : 'pending';
      });
      return Object.values(employees);
    },

    totalFineValue: (state) => {
      return state.fines.reduce((sum, fine) => sum + fine.value, 0);
    },
  },

  actions: {
    hydrateTimelineSeen() {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) {
        this.timelineSeenFineIds = [];
        return;
      }

      try {
        this.timelineSeenFineIds = JSON.parse(localStorage.getItem(timelineSeenKey(userId)) || '[]');
      } catch (err) {
        console.warn('Failed to load seen timeline fines:', err);
        this.timelineSeenFineIds = [];
      }
    },

    markTimelineFinesSeen() {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId) return;

      const userFineIds = this.fines
        .filter(fine => {
          const fineUserId = getFineUserId(fine);
          return fineUserId === userId || fineUserId?.toString() === userId?.toString();
        })
        .map(fine => fine._id)
        .filter(Boolean);

      const seen = Array.from(new Set([...this.timelineSeenFineIds, ...userFineIds]));
      this.timelineSeenFineIds = seen;
      localStorage.setItem(timelineSeenKey(userId), JSON.stringify(seen));
    },

    initFinePusher() {
      const authStore = useAuthStore();
      const userId = authStore.user?.id;
      if (!userId || this.pusherClient) return;

      this.pusherClient = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
        cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      });

      const channel = this.pusherClient.subscribe(`user-${userId}`);
      channel.bind('new-fine', (fine) => {
        if (this.fines.some(existingFine => existingFine._id === fine._id)) return;
        this.fines = [fine, ...this.fines];
      });
    },

    disconnectFinePusher() {
      if (!this.pusherClient) return;
      this.pusherClient.disconnect();
      this.pusherClient = null;
    },

    async fetchFines(options = {}) {
      const silent = options.silent === true;
      if (!silent) this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        this.hydrateTimelineSeen();
        const response = await axios.get(`${API_BASE_URL}/api/items`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines = response.data;
        console.log('Fetched fines:', this.fines);
      } catch (err) {
        this.error = err.message || 'Failed to fetch fines';
        console.error('Error fetching fines:', err);
      } finally {
        if (!silent) this.loading = false;
      }
    },

    async createFine(fine) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.post(`${API_BASE_URL}/api/items`, fine, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines.push(response.data);
        console.log('Created fine:', response.data);
      } catch (err) {
        this.error = err.message || 'Failed to create fine';
        console.error('Error creating fine:', err);
        throw err; // Re-throw so caller can handle
      } finally {
        this.loading = false;
      }
    },

    async updateFine(id, fine) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.put(`${API_BASE_URL}/api/items/${id}`, fine, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        const index = this.fines.findIndex(f => f._id === id);
        if (index !== -1) this.fines[index] = response.data;
        console.log('Updated fine:', response.data);
      } catch (err) {
        this.error = err.message || 'Failed to update fine';
        console.error('Error updating fine:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteFine(id) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        await axios.delete(`${API_BASE_URL}/api/items/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines = this.fines.filter(f => f._id !== id);
        console.log('Deleted fine with id:', id);
      } catch (err) {
        this.error = err.message || 'Failed to delete fine';
        console.error('Error deleting fine:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchPreviousFineCycles() {
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_BASE_URL}/api/items/previous-cycles`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.previousFineCycles = response.data;
        return response.data;
      } catch (err) {
        this.error = err.message || 'Failed to fetch previous fine cycles';
        console.error('Error fetching previous fine cycles:', err);
        throw err;
      }
    },

    async deletePreviousCycle(dateKey) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        await axios.delete(`${API_BASE_URL}/api/items/cycles/${dateKey}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        // Refresh list
        await this.fetchPreviousFineCycles();
      } catch (err) {
        this.error = err.message || 'Failed to delete previous fine cycle';
        console.error('Error deleting previous fine cycle:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async closeFineCycle() {
      this.loading = true;
      this.error = null;
      try {     
        const authStore = useAuthStore();
        const response = await axios.post(`${API_BASE_URL}/api/items/close-cycle`, {}, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines = [];
        await this.fetchPreviousFineCycles();
        console.log('Closed fine cycle:', response.data);
        return response.data;
      } catch (err) {
        this.error = err.message || 'Failed to close fine cycle';
        console.error('Error closing fine cycle:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
