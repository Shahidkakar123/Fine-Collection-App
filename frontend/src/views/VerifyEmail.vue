<template>
  <div class="max-w-md mx-auto bg-white shadow-md rounded p-6 mt-12">
    <h2 class="text-2xl font-bold mb-4 text-gray-900">Email Verification</h2>
    <div v-if="loading" class="text-gray-700">Verifying your email...</div>
    <div v-else-if="success" class="p-3 bg-green-100 border border-green-400 text-green-800 rounded">
      {{ message }}
    </div>
    <div v-else class="p-3 bg-red-100 border border-red-400 text-red-800 rounded">
      {{ message }}
    </div>
    <router-link v-if="!loading" to="/login" class="mt-4 inline-block text-primary font-semibold hover:underline">
      Go to login
    </router-link>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const loading = ref(true);
const success = ref(false);
const message = ref('Verifying your email...');
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

onMounted(async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/verify-email/${route.params.token}`);
    success.value = true;
    message.value = response.data.message || 'Email verified successfully.';
  } catch (error) {
    success.value = false;
    message.value = error.response?.data?.message || 'Unable to verify email.';
  } finally {
    loading.value = false;
  }
});
</script>
