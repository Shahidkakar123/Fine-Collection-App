

<template>
  <div class="min-h-screen bg-gray-900 py-6">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-white mb-6 animate-pulse">Manage Fines</h2>
      <div v-if="finesStore.loading" class="text-white text-center">Loading...</div>
      <div v-else-if="finesStore.error" class="text-red-500 text-center">{{ finesStore.error }}</div>
      <div v-else class="space-y-6">
        <!-- Fine Creation Form -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-300">Add New Fine</h3>
          <form @submit.prevent="createFine" class="mt-4 space-y-4">
            <div>
              <label class="block text-gray-300">Employee Name</label>
              <input
                v-model="newFine.name"
                type="text"
                class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-secondary"
                required
              />
            </div>
            <div>
              <label class="block text-gray-300">Description</label>
              <input
                v-model="newFine.description"
                type="text"
                class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-secondary"
              />
            </div>
            <div>
              <label class="block text-gray-300">Category</label>
              <select
                v-model="newFine.category"
                class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-secondary"
                required
              >
                <option value="Attendance">Attendance</option>
                <option value="Late">Late</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-300">Value ($)</label>
              <input
                v-model.number="newFine.value"
                type="number"
                class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-secondary"
                required
              />
            </div>
            <button
              type="submit"
              class="bg-secondary text-white px-4 py-2 rounded hover:bg-yellow-600 transition duration-300"
              :disabled="submitting"
            >
              {{ submitting ? 'Submitting...' : 'Submit Fine' }}
            </button>
            <p v-if="submissionMessage" class="text-sm mt-2" :class="{ 'text-green-500': success, 'text-red-500': !success }">
              {{ submissionMessage }}
            </p>
          </form>
        </div>

        <!-- Fines List -->
        <div class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-gray-300">Fines List</h3>
          <div v-if="finesStore.fines.length === 0" class="text-gray-400 mt-2">No fines available.</div>
          <div v-else class="mt-4 space-y-4">
            <div
              v-for="fine in finesStore.fines"
              :key="fine._id"
              class="p-4 bg-gray-700 rounded-lg flex justify-between items-center"
            >
              <div>
                <p class="text-gray-300">{{ fine.name }} - {{ fine.category }}</p>
                <p class="text-gray-400 text-sm">{{ fine.description }}</p>
                <p class="text-gray-400 text-sm">Value: ${{ fine.value }}</p>
                <p class="text-gray-400 text-sm">Status: <span :class="{ 'text-red-500': fine.status === 'pending', 'text-green-500': fine.status === 'paid' }">{{ fine.status }}</span></p>
              </div>
              <div class="space-x-2">
                <button
                  @click="updateFineStatus(fine._id, 'paid')"
                  class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition duration-300"
                >
                  Mark Paid
                </button>
                <button
                  @click="deleteFine(fine._id)"
                  class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFinesStore } from '../store/fines';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';


const finesStore = useFinesStore();
const router = useRouter();
const newFine = ref({
  name: '',
  description: '',
  category: 'Attendance',
  value: null,
  status: 'pending',
  userId: '',
});
const submitting = ref(false);
const submissionMessage = ref('');
const success = ref(false);

onMounted(() => {
  finesStore.fetchFines();
});

const createFine = async () => {
  debugger
  console.log('Creating fine with data:', newFine.value); // Debug start
  submitting.value = true;
  submissionMessage.value = '';
  const authStore = useAuthStore();
  newFine.value.userId = authStore.user?.id || '';
  console.log('User ID:', newFine.value.userId); // Debug userId

  if (!newFine.value.userId) {
    console.error('User ID not available in auth store');
    submissionMessage.value = 'User not authenticated. Please log in.';
    success.value = false;
    submitting.value = false;
    return;
  }

  if (!newFine.value.name || !newFine.value.category || newFine.value.value == null) {
    console.error('Missing required fields:', newFine.value);
    submissionMessage.value = 'Please fill all required fields.';
    success.value = false;
    submitting.value = false;
    return;
  }

  try {
    console.log('Sending POST request to /api/items'); // Debug API call
    await finesStore.createFine(newFine.value);
    submissionMessage.value = 'Fine created successfully!';
    success.value = true;
    newFine.value = { name: '', description: '', category: 'Attendance', value: null, status: 'pending', userId: '' };
    console.log('Fine created successfully');
  } catch (err) {
    console.error('Error creating fine:', err.response?.data || err.message);
    submissionMessage.value = err.response?.data?.message || 'Failed to create fine. Please try again.';
    success.value = false;
  } finally {
    submitting.value = false;
  }
};

const updateFineStatus = async (id, status) => {
  await finesStore.updateFine(id, { status });
};

const deleteFine = async (id) => {
  if (confirm('Are you sure you want to delete this fine?')) {
    await finesStore.deleteFine(id);
  }
};

// Helper to access authStore
// function useAuthStore() {
//   return useAuthStore('auth'); // Ensure this matches the auth store name
// }
</script>

<style scoped>
/* Existing styles remain unchanged */
</style>