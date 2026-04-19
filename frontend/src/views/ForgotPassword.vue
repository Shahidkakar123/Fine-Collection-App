<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 mt-12">
    <h2 class="text-2xl font-bold mb-4 text-gray-900">Forgot Password</h2>
    
    <!-- Success Message -->
    <div v-if="success" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded">
      {{ success }}
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
      {{ error }}
    </div>

    <!-- Form -->
    <form @submit.prevent="submitForm" class="space-y-4" v-if="!success">
      <div>
        <label class="block text-gray-800 font-medium mb-2">Email Address</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="Enter your registered email"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
        <p class="text-xs text-gray-600 mt-1">We'll send you a password reset link</p>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Sending...' : 'Send Reset Link' }}
      </button>
    </form>

    <!-- Help Box -->
    <div class="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
      <p class="text-sm text-gray-700">
        <strong>Password Reset:</strong> Check your email for a reset link. The link will expire in 15 minutes.
      </p>
    </div>

    <!-- Back to Login -->
    <p class="mt-4 text-center text-gray-600">
      Remember your password? 
      <router-link to="/login" class="text-primary font-semibold hover:underline">Back to Login</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({ email: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const submitForm = async () => {
  error.value = '';
  success.value = '';

  if (!form.value.email.includes('@')) {
    error.value = 'Please enter a valid email address';
    return;
  }

  loading.value = true;

  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/forgot-password`, form.value);
    success.value = '✓ ' + response.data.message;
    form.value = { email: '' };
    
    // Redirect after 3 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err.message === 'Network Error') {
      error.value = 'Cannot connect to server. Is the backend running?';
    } else {
      error.value = err.message || 'Failed to process request. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
