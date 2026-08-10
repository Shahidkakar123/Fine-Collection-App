<template>
  <div class="max-w-md mx-auto bg-gray-100 shadow-md rounded p-6 mt-6">
    <h2 class="text-2xl font-bold mb-4 text-gray-900">Register</h2>

    <!-- Error Alert -->
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
      {{ error }}
    </div>

    <!-- Success Alert -->
    <div v-if="success" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded">
      {{ success }}
    </div>

    <form @submit.prevent="register" class="space-y-4">
      <div>
        <label class="block text-gray-800 font-medium mb-2">Username</label>
        <input v-model="form.username" type="text" placeholder="Min 3 characters"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required />
        <p class="text-xs text-gray-600 mt-1">Must be at least 3 characters</p>
      </div>

      <div>
        <label class="block text-gray-800 font-medium mb-2">Email</label>
        <input v-model="form.email" type="email" placeholder="your@email.com"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required />
        <p class="text-xs text-gray-600 mt-1">For fine notifications</p>
      </div>

      <div>
        <label class="block text-gray-800 font-medium mb-2">Password</label>
        <input v-model="form.password" type="password" placeholder="Min 6 characters"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required />
        <p class="text-xs text-gray-600 mt-1">Must be at least 8 characters</p>
      </div>

      <div>
        <label class="block text-gray-800 font-medium mb-2">Phone Number (Optional)</label>
        <input v-model="form.phone" type="tel" placeholder="1234567890"
          class="w-full border border-gray-300 rounded-lg p-2 bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200" />
        <p class="text-xs text-gray-600 mt-1">For SMS notifications (10 digits, e.g., 3xxxxxxxxx for Pakistan)</p>
      </div>

      <button type="submit" :disabled="loading"
        class="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>
    </form>

    <div class="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
      <p class="text-sm text-gray-700">
        <strong>Note:</strong> All users register as employees. Project Directors can promote users.
      </p>
    </div>

    <p class="mt-4 text-center text-gray-600">
      Already have an account?
      <router-link to="/login" class="text-primary font-semibold hover:underline">Login</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({ username: '', email: '', password: '', phone: '' });
// At least 8 characters, with at least one letter, one number, and one special character
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])[\S]{8,}$/;
const error = ref('');
const success = ref('');
const loading = ref(false);
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;


const register = async () => {
  // Reset messages
  error.value = '';
  success.value = '';

  // Client-side validation
  if (!form.value.username || !form.value.email || !form.value.password) {
    error.value = 'Username, email, and password are required';
    return;
  }

  if (form.value.username.length < 3) {
    error.value = 'Username must be at least 3 characters';
    return;
  }

  // Stricter email validation for common providers
  const emailRegex = /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.(com|net|org)$/i;
  if (!emailRegex.test(form.value.email)) {
    error.value = 'Please enter a valid email address.';
    return;
  }
  // Note: To verify true existence, a verification email is required after registration.'

  if (!passwordRegex.test(form.value.password)) {
    error.value = 'Password must be at least 8 characters and contain both letters , numbers and special characters';
    return;
  }

  loading.value = true;
  debugger

  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/register`, form.value);

    success.value = response.data.message || '✓ Registration successful! Redirecting to login...';

    // Clear form
    form.value = { username: '', email: '', password: '', phone: '' };

    // Redirect after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err) {
    debugger

    console.log('Registration error:', err);
    // Show detailed error from backend or generic error
    if (err?.response?.data?.message.includes('email_1 dup key')) {
      error.value = 'Email already exists. Please use a different email.';
    } else
      if (err.response?.data?.message) {
        error.value = err.response.data.message;
      } else if (err.response?.status === 400) {
        error.value = 'Invalid input. Please check your username and password requirements.';
      } else if (err.response?.status === 500) {
        error.value = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        error.value = 'Cannot connect to server. Is the backend running?';
      } else {
        error.value = err.message || 'Registration failed. Please try again.';
      }
  } finally {
    loading.value = false;
  }
};
</script>