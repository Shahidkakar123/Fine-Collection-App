<template>
  <nav class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <!-- Logo/Brand -->
        <router-link to="/" class="flex items-center">
          <h1 class="text-2xl font-bold text-primary">FineMate</h1>
        </router-link>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-8">
          <router-link
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/dashboard' }"
          >
            {{ authStore.role === 'pd' ? 'Dashboard' : 'Dashboard' }}
          </router-link>

          <router-link
            v-if="authStore.isAuthenticated && authStore.role === 'employee'"
            to="/timeline"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/timeline' }"
          >
            Timeline
          </router-link>

          <router-link
            v-if="authStore.isAuthenticated && authStore.role === 'pd'"
            to="/fines"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/fines' }"
          >
            Manage Fines
          </router-link>

          <router-link
            v-if="authStore.isAuthenticated && authStore.role === 'pd'"
            to="/employees"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/employees' }"
          >
            Employees
          </router-link>

          <!-- Account Menu -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button
              @click="toggleDropdown"
              class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary transition duration-300 font-medium"
            >
              {{ authStore.role === 'pd' ? '👤 PD' : '👤 Account' }}
              <svg :class="{ 'rotate-180': isDropdownOpen }" class="w-4 h-4 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-show="isDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10"
            >
              <div class="px-4 py-2 border-b border-gray-200">
                <p class="text-xs text-gray-500 uppercase tracking-wider">Account</p>
                <p class="font-semibold text-gray-900 mt-1">Role: <span class="text-primary">{{ authStore.role }}</span></p>
              </div>

              <button
                v-if="authStore.role === 'pd'"
                @click="showPromoteModal = true; isDropdownOpen = false"
                class="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-primary transition duration-200 font-medium"
              >
                🔑 Promote User to PD
              </button>

              <button
                v-if="authStore.role === 'pd'"
                @click="showDemoteModal = true; isDropdownOpen = false"
                class="w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition duration-200 font-medium whitespace-nowrap"
              >
                ⬇️ Demote to Employee
              </button>

              <button
                @click="logout"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-800 transition duration-200 font-medium mt-2 border-t border-gray-200"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          <!-- Login Button -->
          <router-link
            v-if="!authStore.isAuthenticated"
            to="/login"
            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
          >
            Login
          </router-link>
        </div>
      </div>
    </div>
  </nav>

  <!-- Promote User Modal -->
  <div v-if="showPromoteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Promote User to PD</h3>
      <input
        v-model="usernameToPromote"
        type="text"
        placeholder="Enter username to promote"
        class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20"
        @keyup.enter="promoteUser"
      />
      <div class="flex gap-2">
        <button
          @click="promoteUser"
          class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
        >
          Promote
        </button>
        <button
          @click="showPromoteModal = false; usernameToPromote = ''"
          class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>

  <!-- Demote User Modal -->
  <div v-if="showDemoteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Demote to Employee</h3>
      <p class="text-gray-600 mb-4 text-sm">Enter the username of the PD you want to demote back to employee role:</p>
      <input
        v-model="usernameToDemote"
        type="text"
        placeholder="Enter username to demote"
        class="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600 focus:ring-opacity-20"
        @keyup.enter="demoteUser"
      />
      <div class="flex gap-2">
        <button
          @click="demoteUser"
          class="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition duration-300 font-semibold"
        >
          Demote
        </button>
        <button
          @click="showDemoteModal = false; usernameToDemote = ''"
          class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth';
import { useNotificationStore } from '../store/notifications';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import axios from 'axios';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const router = useRouter();
const isDropdownOpen = ref(false);
const showPromoteModal = ref(false);
const showDemoteModal = ref(false);
const usernameToPromote = ref('');
const usernameToDemote = ref('');
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const logout = () => {
  authStore.logout();
  router.push('/login');
  isDropdownOpen.value = false;
};

const promoteUser = async () => {
  if (!usernameToPromote.value.trim()) {
    notificationStore.error('Please enter a username');
    return;
  }

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/promote/${usernameToPromote.value}`,
      {},
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    notificationStore.success(`✓ User "${usernameToPromote.value}" promoted to Project Director`, 3000);
    usernameToPromote.value = '';
    showPromoteModal.value = false;
    
    // Refresh token to get updated role in case this affects PD status
    try {
      const refreshRes = await axios.post(
        `${API_BASE_URL}/api/users/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      authStore.token = refreshRes.data.token;
      authStore.role = refreshRes.data.user.role;
      authStore.user = { id: refreshRes.data.user.id, role: refreshRes.data.user.role };
      localStorage.setItem('token', refreshRes.data.token);
      localStorage.setItem('role', refreshRes.data.user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.token}`;
    } catch (refreshErr) {
      console.warn('Token refresh failed:', refreshErr);
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message 
      ? err.response.data.message 
      : err.message === 'Network Error' 
      ? 'Network error - please check your connection'
      : 'Failed to promote user';
    notificationStore.error(errorMessage, 4000);
  }
};

const demoteUser = async () => {
  if (!usernameToDemote.value.trim()) {
    notificationStore.error('Please enter a username');
    return;
  }

  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/demote/${usernameToDemote.value}`,
      {},
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    notificationStore.success(`✓ User "${usernameToDemote.value}" demoted to Employee`, 3000);
    usernameToDemote.value = '';
    showDemoteModal.value = false;
    
    // Refresh token to get updated role
    try {
      const refreshRes = await axios.post(
        `${API_BASE_URL}/api/users/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      authStore.token = refreshRes.data.token;
      authStore.role = refreshRes.data.user.role;
      authStore.user = { id: refreshRes.data.user.id, role: refreshRes.data.user.role };
      localStorage.setItem('token', refreshRes.data.token);
      localStorage.setItem('role', refreshRes.data.user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.token}`;
    } catch (refreshErr) {
      console.warn('Token refresh failed:', refreshErr);
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message 
      ? err.response.data.message 
      : err.message === 'Network Error' 
      ? 'Network error - please check your connection'
      : 'Failed to demote user';
    notificationStore.error(errorMessage, 4000);
  }
};

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const button = document.querySelector('nav button');
    if (button && !button.contains(e.target) && !e.target.closest('.relative')) {
      isDropdownOpen.value = false;
    }
  });
}
</script>