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
                    :class="statusClass(employee)"
                    class="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ statusLabel(employee) }}
                  </span>
                </td>
                <!-- <td class="px-6 py-4 text-sm text-gray-900">{{ getFineCount(employee._id) }}</td> -->
                <td class="px-6 py-4 text-sm space-x-2">
                  <!-- Active employee buttons -->
                  <div v-if="employee.isActive && employee.username !== 'admin' && employee.username !== 'PD'" class="flex gap-2 flex-wrap">
                    <button
                      v-if="isPrincipalPD && employee.role !== 'pd'"
                      @click="promoteEmployee(employee)"
                      :disabled="promoting === employee._id || Boolean(actingPD)"
                      class="text-purple-600 hover:text-purple-800 font-semibold transition duration-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      :title="actingPD ? `${actingPD.username} is already Acting Project Director` : 'Promote to Acting Project Director'"
                    >
                      {{ promoting === employee._id ? 'Promoting...' : 'Promote' }}
                    </button>
                    <button
                      v-else-if="isPrincipalPD"
                      @click="demoteEmployee(employee)"
                      :disabled="demoting === employee._id"
                      class="text-amber-600 hover:text-amber-800 font-semibold transition duration-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ demoting === employee._id ? 'Demoting...' : 'Demote' }}
                    </button>
                    <!-- Remove button -->
                    <button
                      v-if="employee.role !== 'pd'"
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
                  
                  <!-- Admin/Principal PD - no action -->
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Remove Employee Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeDeleteModal"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
            <div class="h-1.5 bg-gradient-to-r from-orange-400 via-red-400 to-red-500"></div>
            <div class="p-6">
              <div class="flex items-center justify-center w-14 h-14 rounded-full bg-orange-50 mx-auto mb-4">
                <svg class="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zm8-4h6m-3-3v6"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 text-center mb-1">Remove Employee</h3>
              <p class="text-sm text-gray-500 text-center leading-relaxed">
                Are you sure you want to remove
                <span class="font-semibold text-gray-800">{{ selectedEmployee?.username }}</span>?
                Their account will be <span class="font-semibold text-orange-500">deactivated</span>
                and they will be notified.
              </p>
              <div class="flex gap-3 mt-6">
                <button
                  @click="closeDeleteModal"
                  class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200"
                >Cancel</button>
                <button
                  @click="confirmDelete"
                  :disabled="deleting"
                  class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md shadow-orange-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ deleting ? 'Removing...' : 'Yes, Remove' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Permanent Delete Employee Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPermanentDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closePermanentDeleteModal"
        >
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
            <div class="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-700"></div>
            <div class="p-6">
              <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
                <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900 text-center mb-1">Permanently Delete</h3>
              <!-- Warning badge -->
              <div class="flex items-center justify-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 mx-auto w-fit mt-2 mb-3">
                <svg class="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span class="text-xs font-semibold text-red-600">This cannot be undone</span>
              </div>
              <p class="text-sm text-gray-500 text-center leading-relaxed">
                <span class="font-semibold text-gray-800">{{ selectedEmployee?.username }}</span>
                will be <span class="font-semibold text-red-600">permanently removed</span>
                from the database along with all their records.
              </p>
              <div class="flex gap-3 mt-6">
                <button
                  @click="closePermanentDeleteModal"
                  class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200"
                >Cancel</button>
                <button
                  @click="confirmPermanentDelete"
                  :disabled="permanently_deleting === selectedEmployee?._id"
                  class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold text-sm hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <svg v-if="permanently_deleting === selectedEmployee?._id" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ permanently_deleting === selectedEmployee?._id ? 'Deleting...' : 'Yes, Delete Forever' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
const demoting = ref(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const PRINCIPAL_PD_USERNAME = 'PD';

const actingPD = computed(() => employees.value.find(employee =>
  employee.role === 'pd' && employee.username !== PRINCIPAL_PD_USERNAME
));
const isPrincipalPD = computed(() => authStore.user?.username === PRINCIPAL_PD_USERNAME);

const statusLabel = (employee) => {
  if (!employee.isActive) return 'Removed';
  if (employee.username === PRINCIPAL_PD_USERNAME && employee.role === 'pd') return 'Principal PD';
  if (employee.role === 'pd') return 'Acting PD';
  return 'Employee';
};

const statusClass = (employee) => {
  if (!employee.isActive) return 'bg-red-100 text-red-800';
  if (employee.username === PRINCIPAL_PD_USERNAME && employee.role === 'pd') return 'bg-indigo-100 text-indigo-800';
  if (employee.role === 'pd') return 'bg-purple-100 text-purple-800';
  return 'bg-green-100 text-green-800';
};

// Fetch all employees
const fetchEmployees = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`, {
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
    deleting.value = false;
    showDeleteModal.value = false;
    selectedEmployee.value = null;
  } catch (error) {
    deleting.value = false;
    const errorMsg = error.response?.data?.message || 'Failed to remove employee. Please try again.';
    console.error('Error deleting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  }
};

// Promote employee to PD
const promoteEmployee = async (employee) => {
  promoting.value = employee._id;
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/promote/${employee.username}`,
      {},
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    // Update local list immediately
    const employeeToUpdate = employees.value.find(e => e._id === employee._id);
    if (employeeToUpdate) {
      employeeToUpdate.role = response.data.user?.role || 'pd';
    }
    
    notificationStore.success(`✓ Employee ${employee.username} has been promoted to Acting Project Director`, 3000);
    
    // Refresh token to keep username/role in sync for Principal PD checks
    try {
      await authStore.refreshToken();
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

// Demote Acting Project Director to employee
const demoteEmployee = async (employee) => {
  demoting.value = employee._id;
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/users/demote/${employee.username}`,
      {},
      {
        headers: { Authorization: `Bearer ${authStore.token}` }
      }
    );

    const employeeToUpdate = employees.value.find(e => e._id === employee._id);
    if (employeeToUpdate) {
      employeeToUpdate.role = response.data.user?.role || 'employee';
    }

    notificationStore.success(`✓ ${employee.username} has been demoted to Employee`, 3000);
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to demote employee. Please try again.';
    console.error('Error demoting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  } finally {
    demoting.value = null;
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
    permanently_deleting.value = null;
    showPermanentDeleteModal.value = false;
    selectedEmployee.value = null;
  } catch (error) {
    permanently_deleting.value = null;
    const errorMsg = error.response?.data?.message || 'Failed to permanently delete employee. Please try again.';
    console.error('Error permanently deleting employee:', {
      status: error.response?.status,
      message: errorMsg
    });
    notificationStore.error(errorMsg, 3000);
  }
};

onMounted(async () => {
  // Only PD can access this
  if (authStore.role !== 'pd') {
    notificationStore.error('Only Project Directors can manage employees');
    // Redirect to dashboard
    window.location.href = '/dashboard';
    return;
  }

  if (!authStore.user?.username) {
    try {
      await authStore.refreshToken();
    } catch (refreshErr) {
      console.warn('Token refresh failed:', refreshErr);
    }
  }
  
  fetchEmployees();
  finesStore.fetchFines();
});
</script>


<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .relative {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
</style>
