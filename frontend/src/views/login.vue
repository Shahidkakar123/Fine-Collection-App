<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 text-gray-900">
    <h2 class="text-2xl font-bold mb-4">Login</h2>
    <form @submit.prevent="login">
      <div class="mb-4">
        <label class="block text-gray-800">Username</label>
        <input v-model="form.username" type="text" class="w-full border rounded p-2 text-gray-900" required />
      </div>
      <div class="mb-4">  
        <label class="block text-gray-800">Password</label>
        <input v-model="form.password" type="password" class="w-full border rounded p-2 text-gray-900"  required />
      </div>
      <button type="submit" class="bg-primary text-white px-4 py-2 rounded">Login</button>
    </form>
    <p class="mt-4">
      Don't have an account? <router-link to="/register" class="text-secondary">Register</router-link>
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

const login = async () => {
  try {
    await authStore.login(form.value);
    console.log('Logged in with role:', authStore.role); // Debug log
    axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`; // Ensure token is set
    router.push('/dashboard');
  } catch (err) {
    alert('Login failed: ' + err.message);
  }
};
</script>