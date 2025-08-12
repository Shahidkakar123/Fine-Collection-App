import { defineStore } from 'pinia';
import axios from 'axios';
import { useAuthStore } from './auth'; // Import auth store for token access

export const useFinesStore = defineStore('fines', {
  state: () => ({
    fines: [],
    loading: false,
    error: null,
  }),

  getters: {
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
    async fetchFines() {  
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.get('/api/items', {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines = response.data;
        console.log('Fetched fines:', this.fines);
      } catch (err) {
        this.error = err.message || 'Failed to fetch fines';
        console.error('Error fetching fines:', err);
      } finally {
        this.loading = false;
      }
    },

    async createFine(fine) {
      debugger
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.post('/api/items', fine, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines.push(response.data);
        console.log('Created fine:', response.data);
      } catch (err) {
        this.error = err.message || 'Failed to create fine';
        console.error('Error creating fine:', err);
      } finally {
        this.loading = false;
      }
    },

    async updateFine(id, fine) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const response = await axios.put(`/api/items/${id}`, fine, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        const index = this.fines.findIndex(f => f._id === id);
        if (index !== -1) this.fines[index] = response.data;
        console.log('Updated fine:', response.data);
      } catch (err) {
        this.error = err.message || 'Failed to update fine';
        console.error('Error updating fine:', err);
      } finally {
        this.loading = false;
      }
    },

    async deleteFine(id) {
      this.loading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        await axios.delete(`/api/items/${id}`, {
          headers: { Authorization: `Bearer ${authStore.token}` },
        });
        this.fines = this.fines.filter(f => f._id !== id);
        console.log('Deleted fine with id:', id);
      } catch (err) {
        this.error = err.message || 'Failed to delete fine';
        console.error('Error deleting fine:', err);
      } finally {
        this.loading = false;
      }
    },
  },
});