<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 text-gray-900 mt-6">
    <h2 class="text-2xl font-bold mb-4">Login</h2>
    
    <!-- Error Alert -->
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
      {{ error }}
    </div>

    <form @submit.prevent="login" class="space-y-4">
      <div>
        <label class="block text-gray-800 font-medium mb-2">Username</label>
        <input 
          v-model="form.username" 
          type="text" 
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          placeholder="Enter your username"
          required 
        />
      </div>

      <div>  
        <label class="block text-gray-800 font-medium mb-2">Password</label>
        <input 
          v-model="form.password" 
          type="password" 
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          placeholder="Enter your password"
          required 
        />
      </div>

      <button 
        type="submit" 
        :disabled="loading"
        class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <div class="text-right">
        <router-link to="/forgot-password" class="text-sm text-primary hover:underline">Forgot Password?</router-link>
      </div>
    </form>

    <div class="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
      <p class="text-sm text-gray-700 mb-2">
        <strong>Demo Accounts:</strong>
      </p>
      <ul class="text-xs text-gray-700 space-y-1">
        <li>• <span class="font-mono">PD / admin</span> (Project Director)</li>
        <li>• Or register a new employee account</li>
      </ul>
    </div>

    <p class="mt-4 text-center">
      <span class="text-gray-600">Don't have an account? </span>
      <router-link to="/register" class="text-primary font-semibold hover:underline">Register</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';
import axios from 'axios';

const authStore = useAuthStore();
const router = useRouter();
const form = ref({ username: '', password: '' });
const error = ref('');
const loading = ref(false);

const login = async () => {
  error.value = '';
  
  if (!form.value.username || !form.value.password) {
    error.value = 'Username and password are required';
    return;
  }

  loading.value = true;

  try {
    await authStore.login(form.value);
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`;
    router.push('/dashboard');
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err.response?.status === 401) {
      error.value = 'Invalid username or password';
    } else if (err.response?.status === 400) {
      error.value = 'Invalid input';
    } else if (err.message === 'Network Error') {
      error.value = 'Cannot connect to server. Is the backend running?';
    } else {
      error.value = err.message || 'Login failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>