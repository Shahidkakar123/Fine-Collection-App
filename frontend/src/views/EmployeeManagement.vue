<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-2">Employee Management</h2>
        <p class="text-gray-600">View all employees and manage their status</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
      </div>

      <!-- Employees List -->
      <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
        <div v-if="employees.length === 0" class="p-8 text-center text-gray-500">
          <p class="text-lg">No employees found</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <!-- <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fines Count</th> -->
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="employee in employees" :key="employee._id" class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">{{ employee.username }}</td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ employee.email }}</td>
                <td class="px-6 py-4 text-sm">
                  <span
                    :class="employee.role === 'pd' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
                  >
                    {{ employee.role }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <span
                    :class="employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ employee.isActive ? 'Active' : 'Removed' }}
                  </span>
                </td>
                <!-- <td class="px-6 py-4 text-sm text-gray-900">{{ getFineCount(employee._id) }}</td> -->
                <td class="px-6 py-4 text-sm space-x-2">
                  <!-- Active employee buttons -->
                  <div v-if="employee.isActive && employee.username !== 'admin' && employee.username !== 'PD'" class="flex gap-2 flex-wrap">
                    <!-- Remove button -->
                    <button
                      @click="openDeleteModal(employee)"
                      class="text-red-600 hover:text-red-800 font-semibold transition duration-200 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <!-- Removed employee buttons -->
                  <div v-else-if="!employee.isActive" class="flex gap-2 flex-wrap">
                    <button
                      @click="reactivateEmployee(employee)"
                      :disabled="reactivating === employee._id"
                      class="text-green-600 hover:text-green-800 font-semibold transition duration-200 disabled:opacity-50"
                    >
                      {{ reactivating === employee._id ? 'Re-adding...' : 'Re-Add' }}
                    </button>
                    <button
                      @click="openPermanentDeleteModal(employee)"
                      :disabled="permanently_deleting === employee._id"
                      class="text-red-600 hover:text-red-800 font-semibold transition duration-200 disabled:opacity-50"
                    >
                      {{ permanently_deleting === employee._id ? 'Deleting...' : 'Delete' }}
                    </button>
                  </div>
                  
                  <!-- Admin/PD - no action -->
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closeDeleteModal"
    >
      <div
        class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6"
        @click.stop
      >
        <h3 class="text-lg font-bold text-gray-900 mb-4">Remove Employee</h3>
        <p class="text-gray-600 mb-6">
          Are you sure you want to remove <strong>{{ selectedEmployee?.username }}</strong>?
          This will deactivate their account and send a notification email.
        </p>
        <div class="flex gap-4">
          <button
            @click="closeDeleteModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ deleting ? 'Removing...' : 'Remove' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Permanent Delete Confirmation Modal -->
    <div
      v-if="showPermanentDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closePermanentDeleteModal"
    >
      <div
        class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6"
        @click.stop
      >
        <h3 class="text-lg font-bold text-gray-900 mb-4">Permanently Delete Employee</h3>
        <p class="text-gray-600 mb-4">
          <strong>Warning:</strong> This action cannot be undone. You are about to permanently delete <strong>{{ selectedEmployee?.username }}</strong> from the system.
        </p>
        <p class="text-gray-600 mb-6">
          Their record will be removed from the database. Are you absolutely sure?
        </p>
        <div class="flex gap-4">
          <button
            @click="closePermanentDeleteModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            @click="confirmPermanentDelete"
            :disabled="permanently_deleting === selectedEmployee?._id"
            class="flex-1 px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ permanently_deleting === selectedEmployee?._id ? 'Deleting...' : 'Delete Permanently' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../store/auth';
import { useFinesStore } from '../store/fines';
import { useNotificationStore } from '../store/notifications';
import axios from 'axios';

const authStore = useAuthStore();
const finesStore = useFinesStore();
const notificationStore = useNotificationStore();

const employees = ref([]);
const loading = ref(false);
const showDeleteModal = ref(false);
const showPermanentDeleteModal = ref(false);
const selectedEmployee = ref(null);
const deleting = ref(false);
const reactivating = ref(null);
const permanently_deleting = ref(null);
const promoting = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch all employees
const fetchEmployees = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    employees.value = response.data;
  } catch (error) {
    const errorMsg = error.response?.status === 403
      ? 'You do not have permission to view employees'
      : error.response?.data?.message
      ? error.response.data.message
      : 'Failed to load employees';
    console.error('Error fetching employees:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    loading.value = false;
  }
};

// Get fine count for an employee
// const getFineCount = (userId) => {
//   return finesStore.fines.filter(fine => {
//     if (!fine.userId) return false;
//     const fineUserId = typeof fine.userId === 'object' ? fine.userId._id : fine.userId;
//     return fineUserId === userId;
//   }).length;
// };

// Open delete confirmation modal
const openDeleteModal = (employee) => {
  selectedEmployee.value = employee;
  showDeleteModal.value = true;
};

// Close delete confirmation modal
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedEmployee.value = null;
};

// Confirm and delete employee
const confirmDelete = async () => {
  if (!selectedEmployee.value) return;

  deleting.value = true;
  try {
    await axios.delete(
      `${API_BASE_URL}/api/users/${selectedEmployee.value._id}`,
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    // Mark as inactive in local list instead of removing
    const employee = employees.value.find(e => e._id === selectedEmployee.value._id);
    if (employee) {
      employee.isActive = false;
    }
    
    notificationStore.success(`✓ Employee ${selectedEmployee.value.username} has been removed`);
    closeDeleteModal();
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to remove employee. Please try again.';
    console.error('Error deleting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    deleting.value = false;
  }
};

// Promote employee to PD
const promoteEmployee = async (employee) => {
  promoting.value = employee._id;
  try {
    await axios.put(
      `${API_BASE_URL}/api/users/promote/${employee.username}`,
      {},
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    // Update local list
    const employeeToUpdate = employees.value.find(e => e._id === employee._id);
    if (employeeToUpdate) {
      employeeToUpdate.role = 'pd';
    }
    
    notificationStore.success(`✓ Employee ${employee.username} has been promoted to Project Director`, 3000);
    
    // Refresh token to ensure PD role is updated in JWT
    try {
      const refreshRes = await axios.post(
        `${API_BASE_URL}/api/users/refresh-token`,
        {},
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      authStore.token = refreshRes.data.token;
      authStore.role = refreshRes.data.user.role;
      authStore.user = { id: refreshRes.data.user.id, role: refreshRes.data.user.role };
      localStorage.setItem('token', refreshRes.data.token);
      localStorage.setItem('role', refreshRes.data.user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${refreshRes.data.token}`;
    } catch (refreshErr) {
      console.warn('Token refresh failed:', refreshErr);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to promote employee. Please try again.';
    console.error('Error promoting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    promoting.value = null;
  }
};

// Reactivate removed employee
const reactivateEmployee = async (employee) => {
  reactivating.value = employee._id;
  try {
    await axios.put(
      `${API_BASE_URL}/api/users/reactivate/${employee._id}`,
      {},
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    // Update local list
    const employeeToUpdate = employees.value.find(e => e._id === employee._id);
    if (employeeToUpdate) {
      employeeToUpdate.isActive = true;
    }
    
    notificationStore.success(`✓ Employee ${employee.username} has been re-added`);
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to re-add employee. Please try again.';
    console.error('Error reactivating employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    reactivating.value = null;
  }
};

// Open permanent delete modal
const openPermanentDeleteModal = (employee) => {
  selectedEmployee.value = employee;
  showPermanentDeleteModal.value = true;
};

// Close permanent delete modal
const closePermanentDeleteModal = () => {
  showPermanentDeleteModal.value = false;
  selectedEmployee.value = null;
};

// Permanently delete employee from database
const confirmPermanentDelete = async () => {
  if (!selectedEmployee.value) return;

  permanently_deleting.value = selectedEmployee.value._id;
  try {
    await axios.delete(
      `${API_BASE_URL}/api/users/permanent/${selectedEmployee.value._id}`,
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    // Remove from local list
    employees.value = employees.value.filter(e => e._id !== selectedEmployee.value._id);
    
    // Refresh fines list to remove deleted user's fines
    await finesStore.fetchFines();
    
    notificationStore.success(`✓ Employee ${selectedEmployee.value.username} and all their fines have been permanently deleted`);
    closePermanentDeleteModal();
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to permanently delete employee. Please try again.';
    console.error('Error permanently deleting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    permanently_deleting.value = null;
  }
};

onMounted(() => {
  // Only PD can access this
  if (authStore.role !== 'pd') {
    notificationStore.error('Only Project Directors can manage employees');
    // Redirect to dashboard
    window.location.href = '/dashboard';
    return;
  }
  
  fetchEmployees();
  finesStore.fetchFines();
});
</script>
