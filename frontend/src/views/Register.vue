<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 mt-6">
    <h2 class="text-2xl font-bold mb-4">Register</h2>
    <form @submit.prevent="register">
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Username</label>
        <input
          v-model="form.username"
          type="text"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
      </div>
      <button
        type="submit"
        class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
      >
        Register
      </button>
    </form>
    <p class="mt-4 text-gray-600">
      Note: All users register as employees. Project Director role is assigned by an existing PD.
    </p>
    <p class="mt-2">
      Already have an account? <router-link to="/login" class="text-secondary">Login</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({ username: '', password: '' });

const register = async () => {
  try {
    await axios.post('/api/users/register', form.value);
    router.push('/login');
  } catch (err) {
    alert('Registration failed: ' + err.message);
  }
};
</script>