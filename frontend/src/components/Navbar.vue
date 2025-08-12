<template>
  <nav class="bg-gradient-to-r from-primary to-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div class="container mx-auto flex justify-between items-center">
      <h1 class="text-2xl font-extrabold tracking-wide animate-pulse-slow">Fine Collection</h1>
      <div class="flex items-center space-x-6">
        <router-link
          to="/dashboard"
          class="hover:text-secondary transition duration-300 font-medium"
          :class="{ 'text-secondary underline': $route.path === '/dashboard' }"
        >
          Dashboard
        </router-link>
        <router-link
          v-if="authStore.role === 'pd' || authStore.role === 'employee'"
          to="/fines"
          class="hover:text-secondary transition duration-300 font-medium"
          :class="{ 'text-secondary underline': $route.path === '/fines' }"
        >
          Fines
        </router-link>
        <div v-if="authStore.isAuthenticated" class="relative group">
          <button
            class="hover:text-secondary transition duration-300 focus:outline-none font-medium"
            @click="toggleDropdown"
          >
            Account
          </button>
          <div
            v-show="isDropdownOpen"
            class="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-xl p-1"
          >
            <button
              @click="logout"
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition duration-200"
            >
              Logout
            </button>
            <button
              v-if="authStore.role === 'pd'"
              @click="promoteUser"
              class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md transition duration-200 mt-1"
            >
              Promote User
            </button>
          </div>
        </div>
        <router-link
          v-else
          to="/login"
          class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300 font-semibold"
        >
          Login
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();
const isDropdownOpen = ref(false);

// Debug: Log role to verify
console.log('Navbar role:', authStore.role);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const logout = () => {
  authStore.logout();
  router.push('/login');
  isDropdownOpen.value = false;
};

const promoteUser = async () => {
  const username = prompt('Enter username to promote to PD:');
  if (username) {
    try {
      await axios.put(`/api/auth/promote/${username}`);
      alert(`User ${username} promoted to PD`);
    } catch (err) {
      alert('Promotion failed: ' + err.message);
    }
  }
  isDropdownOpen.value = false;
};

document.addEventListener('click', (e) => {
  const navbar = document.querySelector('nav');
  if (!navbar.contains(e.target)) {
    isDropdownOpen.value = false;
  }
});
</script>