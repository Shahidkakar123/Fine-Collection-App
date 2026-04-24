

<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-2">Manage Fines</h2>
        <p class="text-gray-600">Add, update, and manage employee fines</p>
      </div>

      <!-- Alert for non-PD users -->
      <div v-if="!isPD" class="bg-red-100 border-l-4 border-red-600 p-4 mb-6 rounded">
        <p class="text-red-800 font-semibold">Restricted Access</p>
        <p class="text-red-700 text-sm">Only Project Directors can manage fines.</p>
      </div>

      <!-- Loading state -->
      <div v-if="finesStore.loading" class="text-center py-12">
        <p class="text-gray-600">Loading fines...</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="isPD" class="space-y-6">
        <!-- Add New Fine Form -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Add New Fine</h3>
          <form @submit.prevent="createFine" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select Employee *</label>
                <select
                  v-model="newFine.selectedEmployee"
                  @change="onEmployeeSelect"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  <option v-for="employee in employees" :key="employee._id" :value="employee._id">
                    {{ employee.username }} ({{ employee.role }})
                  </option>
                </select>
                <p v-if="employees.length === 0" class="text-xs text-gray-500 mt-1">Loading employees...</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  v-model="newFine.category"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Late">Late</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Fine Value ($) *</label>
                <input
                  v-model.number="newFine.value"
                  type="number"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  v-model="newFine.status"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Fine Date</label>
                <input
                  v-model="newFine.date"
                  type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                v-model="newFine.description"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                placeholder="Reason for the fine..."
                rows="3"
              ></textarea>
            </div>

            <div class="flex gap-4">
              <button
                type="submit"
                class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
                :disabled="submitting"
              >
                {{ submitting ? 'Submitting...' : 'Add Fine' }}
              </button>
              <button
                type="reset"
                @click="resetForm"
                class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold"
              >
                Clear
              </button>
            </div>

            <!-- Success/Error Message -->
            <div
              v-if="submissionMessage"
              :class="success ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'"
              class="border-l-4 p-4 rounded"
            >
              {{ submissionMessage }}
            </div>
          </form>
        </div>

        <!-- Fines List -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">
              Fines List ({{ filteredFines.length }} of {{ finesStore.fines.length }} total)
            </h3>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by employee name..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div v-if="finesStore.fines.length === 0" class="text-center py-8">
            <p class="text-gray-500">No fines created yet. Add one to get started.</p>
          </div>

          <div v-else-if="filteredFines.length === 0" class="text-center py-8">
            <p class="text-gray-500">No fines match your search criteria.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Value</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="fine in filteredFines" :key="fine._id" class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ fine.name }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded">
                      {{ fine.category }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ fine.description || '-' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(fine.date) }}</td>
                  <td class="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                    ${{ fine.value.toFixed(2) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <span
                      :class="
                        fine.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      "
                      class="inline-block px-3 py-1 text-xs font-semibold rounded"
                    >
                      {{ fine.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <div class="flex gap-2 justify-center">
                      <button
                        v-if="fine.status === 'pending'"
                        @click="updateFineStatus(fine._id, 'paid')"
                        class="text-green-600 hover:text-green-800 font-semibold text-xs hover:underline"
                        title="Mark as paid"
                      >
                        Mark Paid
                      </button>
                      <button
                        v-else
                        @click="updateFineStatus(fine._id, 'pending')"
                        class="text-orange-600 hover:text-orange-800 font-semibold text-xs hover:underline"
                        title="Mark as pending"
                      >
                        Mark Pending
                      </button>
                      <button
                        @click="deleteFine(fine._id)"
                        class="text-red-600 hover:text-red-800 font-semibold text-xs hover:underline"
                        title="Delete fine"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinesStore } from '../store/fines';
import { useAuthStore } from '../store/auth';
import { useNotificationStore } from '../store/notifications';
import { useRouter } from 'vue-router';
import axios from 'axios';

const authStore = useAuthStore();
const finesStore = useFinesStore();
const notificationStore = useNotificationStore();
const router = useRouter();

// Check if user is PD
const isPD = computed(() => authStore.role === 'pd');

const employees = ref([]);
const loadingEmployees = ref(false);
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const newFine = ref({
  selectedEmployee: '',
  name: '',
  description: '',
  category: '',
  value: null,
  date: new Date().toISOString().split('T')[0],
  status: 'pending',
  userId: '',
});

const submitting = ref(false);
const submissionMessage = ref('');
const success = ref(false);
const searchQuery = ref('');

const filteredFines = computed(() => {
  if (!searchQuery.value.trim()) return finesStore.fines;
  return finesStore.fines.filter(fine =>
    fine.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

onMounted(async () => {
  // Redirect non-PD users to dashboard
  if (!isPD.value) {
    notificationStore.error('Only Project Directors can manage fines', 2000);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  } else {
    finesStore.fetchFines();
    await loadEmployees();
  }
});

const loadEmployees = async () => {
  try {
    loadingEmployees.value = true;
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    // Filter out PD themselves from list
    employees.value = response.data.filter(user => user._id !== authStore.user?.id);
  } catch (err) {
    const errorMsg = err.response?.status === 403 
      ? 'You do not have permission to view employees'
      : err.response?.data?.message 
      ? err.response.data.message
      : 'Failed to load employees list. Please try again.';
    notificationStore.error(errorMsg, 3000);
    console.error('Error loading employees:', { status: err.response?.status, message: errorMsg });
  } finally {
    loadingEmployees.value = false;
  }
};

const onEmployeeSelect = () => {
  // Find selected employee and set name
  const selected = employees.value.find(emp => emp._id === newFine.value.selectedEmployee);
  if (selected) {
    newFine.value.name = selected.username;
    newFine.value.userId = selected._id;
  }
};

const resetForm = () => {
  newFine.value = {
    selectedEmployee: '',
    name: '',
    description: '',
    category: '',
    value: null,
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    userId: '',
  };
  submissionMessage.value = '';
};

const createFine = async () => {
  if (!isPD.value) {
    notificationStore.error('Only PDs can create fines');
    return;
  }

  submitting.value = true;
  submissionMessage.value = '';

  // Validate required fields
  if (!newFine.value.selectedEmployee) {
    submissionMessage.value = 'Please select an employee';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Employee selection is required');
    return;
  }

  if (!newFine.value.category) {
    submissionMessage.value = 'Please select a fine category';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Category is required');
    return;
  }

  if (newFine.value.value == null || newFine.value.value === '') {
    submissionMessage.value = 'Please enter a fine amount';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Fine amount is required');
    return;
  }

  if (newFine.value.value <= 0) {
    submissionMessage.value = 'Fine value must be greater than 0';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Fine value must be positive');
    return;
  }

  if (newFine.value.value > 100000) {
    submissionMessage.value = 'Fine value seems too high. Please verify the amount';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Please enter a reasonable fine amount');
    return;
  }

  try {
    await finesStore.createFine(newFine.value);
    
    // Show success notification
    const employeeName = newFine.value.name;
    submissionMessage.value = `✓ Fine added successfully for ${employeeName}`;
    success.value = true;
    notificationStore.success(`✓ Fine added for ${employeeName}`, 3000);
    resetForm();
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Failed to create fine. Please try again.';
    submissionMessage.value = errorMsg;
    notificationStore.error(errorMsg, 4000);
    success.value = false;
    console.error('Error creating fine:', { status: err.response?.status, message: errorMsg });
  } finally {
    submitting.value = false;
  }
};

const updateFineStatus = async (id, status) => {
  try {
    await finesStore.updateFine(id, { status });
    const statusText = status === 'paid' ? 'marked as paid' : 'marked as pending';
    notificationStore.success(`✓ Fine ${statusText}`, 2000);
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to update fine status. Please try again.';
    notificationStore.error(errorMsg, 3000);
    console.error('Error updating fine:', { status: err.response?.status, message: errorMsg });
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const deleteFine = async (id) => {
  if (confirm('Are you sure you want to delete this fine? This action cannot be undone.')) {
    try {
      await finesStore.deleteFine(id);
      notificationStore.success('✓ Fine deleted successfully', 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete fine. Please try again.';
      notificationStore.error(errorMsg, 3000);
      console.error('Error deleting fine:', { status: err.response?.status, message: errorMsg });
    }
  }
};
</script>
