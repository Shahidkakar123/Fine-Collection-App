<template>
  <div class="max-w-md mx-auto bg-gray-50 shadow-lg rounded p-6 mt-12">
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
        <div class="relative">
          <input
            v-model="form.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            placeholder="Min 8 characters"
            class="w-full border border-gray-300 rounded-lg p-2 pr-11 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            required
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Toggle password visibility"
            @click="togglePasswordVisibility('new')"
          >
            <svg v-if="!showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.036 12.322a1.012 1.012 0 010-.628C3.423 7.53 7.36 4.5 12 4.5c4.64 0 8.577 3.03 9.964 7.194a1.012 1.012 0 010 .628C20.577 16.47 16.64 19.5 12 19.5c-4.64 0-8.577-3.03-9.964-7.178z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3l18 18"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.56 10.56A2 2 0 0113.44 13.44"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.88 5.08A10.94 10.94 0 0112 5c5.38 0 10 7 10 7a15.76 15.76 0 01-4.59 5.52"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6.61 6.61A15.6 15.6 0 002 12s3.5 7 10 7a9.86 9.86 0 005.39-1.61"/>
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-600 mt-1">At least one letter, one number, and one special character</p>
      </div>

      <div>
        <label class="block text-gray-800 font-medium mb-2">Confirm Password</label>
        <div class="relative">
          <input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Re-enter your password"
            class="w-full border border-gray-300 rounded-lg p-2 pr-11 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            required
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Toggle password visibility"
            @click="togglePasswordVisibility('confirm')"
          >
            <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.036 12.322a1.012 1.012 0 010-.628C3.423 7.53 7.36 4.5 12 4.5c4.64 0 8.577 3.03 9.964 7.194a1.012 1.012 0 010 .628C20.577 16.47 16.64 19.5 12 19.5c-4.64 0-8.577-3.03-9.964-7.178z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 3l18 18"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.56 10.56A2 2 0 0113.44 13.44"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.88 5.08A10.94 10.94 0 0112 5c5.38 0 10 7 10 7a15.76 15.76 0 01-4.59 5.52"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6.61 6.61A15.6 15.6 0 002 12s3.5 7 10 7a9.86 9.86 0 005.39-1.61"/>
            </svg>
          </button>
        </div>
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
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
// Same rule used by Register.vue: 8+ non-space chars with a letter, number, and special character.
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[\S]{8,}$/;
const error = ref('');
const success = ref('');
const loading = ref(false);
const tokenInvalid = ref('');
const resetToken = ref('');
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const togglePasswordVisibility = (field) => {
  if (field === 'new') {
    showNewPassword.value = !showNewPassword.value;
  } else if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value;
  }
};

onMounted(() => {
  resetToken.value = route.params.token;
  if (!resetToken.value) {
    tokenInvalid.value = true;
  }
});

const submitForm = async () => {
  error.value = '';
  success.value = '';

  if (!passwordRegex.test(form.value.newPassword)) {
    error.value = 'Password must be at least 8 characters and contain both letters , numbers and special characters';
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
