<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 mt-12">
    <h2 class="text-2xl font-bold mb-4 text-gray-900">Reset Password</h2>
    
    <!-- Invalid Token -->
    <div v-if="tokenInvalid" class="p-4 bg-red-100 border border-red-400 text-red-800 rounded">
      <p class="font-semibold">Invalid or Expired Link</p>
      <p class="text-sm mt-2">The reset link has expired or is invalid. Please request a new link.</p>
      <router-link to="/forgot-password" class="text-primary font-semibold hover:underline text-sm mt-2 inline-block">
        Request New Link
      </router-link>
    </div>

    <!-- Success Message -->
    <div v-else-if="success" class="p-4 bg-green-100 border border-green-400 text-green-800 rounded">
      <p class="font-semibold">✓ Password Reset Successful!</p>
      <p class="text-sm mt-2">Your password has been updated. Redirecting to login...</p>
    </div>

    <!-- Error Alert -->
    <div v-else-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
      {{ error }}
    </div>

    <!-- Reset Form -->
    <form @submit.prevent="submitForm" class="space-y-4" v-if="!success && !tokenInvalid">
      <div>
        <label class="block text-gray-800 font-medium mb-2">New Password</label>
        <input
          v-model="form.newPassword"
          type="password"
          placeholder="Min 6 characters"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
        <p class="text-xs text-gray-600 mt-1">Must be at least 6 characters</p>
      </div>

      <div>
        <label class="block text-gray-800 font-medium mb-2">Confirm Password</label>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Resetting...' : 'Reset Password' }}
      </button>
    </form>

    <!-- Help Box -->
    <div v-if="!success && !tokenInvalid" class="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
      <p class="text-sm text-gray-700">
        <strong>Security Note:</strong> Use a strong password that's different from your previous one.
      </p>
    </div>

    <!-- Back to Login -->
    <p v-if="!success && !tokenInvalid" class="mt-4 text-center text-gray-600">
      <router-link to="/login" class="text-primary font-semibold hover:underline">Back to Login</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const form = ref({ newPassword: '', confirmPassword: '' });
const error = ref('');
const success = ref('');
const loading = ref(false);
const tokenInvalid = ref('');
const resetToken = ref('');
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

onMounted(() => {
  resetToken.value = route.params.token;
  if (!resetToken.value) {
    tokenInvalid.value = true;
  }
});

const submitForm = async () => {
  error.value = '';
  success.value = '';

  if (form.value.newPassword.length < 6) {
    error.value = 'Password must be at least 6 characters';
    return;
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/reset-password`, {
      token: resetToken.value,
      newPassword: form.value.newPassword
    });
    
    success.value = true;
    
    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message;
      if (error.value.includes('expired') || error.value.includes('Invalid')) {
        tokenInvalid.value = true;
      }
    } else if (err.message === 'Network Error') {
      error.value = 'Cannot connect to server. Is the backend running?';
    } else {
      error.value = err.message || 'Failed to reset password. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
