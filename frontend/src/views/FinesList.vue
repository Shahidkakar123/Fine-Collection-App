<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-2">Manage Fines</h2>
        <p class="text-gray-600">Add, update, and manage fines</p>
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
        <div class="bg-white rounded-lg shadow-md p-2 flex gap-2">
          <button @click="activeTab = 'current'"
            :class="activeTab === 'current' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'"
            class="px-4 py-2 rounded-md font-semibold text-sm transition">
            Current Fine Cycle
          </button>
          <button @click="activeTab = 'previous'"
            :class="activeTab === 'previous' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'"
            class="px-4 py-2 rounded-md font-semibold text-sm transition">
            Previous Fine Cycles
          </button>
        </div>

        <!-- Add New Fine Form -->
        <div v-if="activeTab === 'current'" class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Add New Fine</h3>
          <form @submit.prevent="createFine" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select Employee *</label>
                <div class="relative">
                  <input v-model="employeeSearch" type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                    placeholder="Search employee..." autocomplete="off" @focus="showEmployeeOptions = true"
                    @blur="hideEmployeeOptions" />
                  <div v-if="showEmployeeOptions && filteredEmployees.length"
                    class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    <button v-for="employee in filteredEmployees" :key="employee._id" type="button"
                      class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      @mousedown.prevent="selectEmployee(employee)">
                      {{ employee.username }} ({{ employee.role }})
                    </button>
                  </div>
                </div>
                <p v-if="employees.length === 0" class="text-xs text-gray-500 mt-1">Loading employees...</p>
                <p v-else-if="employeeSearch && filteredEmployees.length === 0" class="text-xs text-gray-500 mt-1">No
                  employee found.</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select v-model="newFine.category"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                  required>
                  <option value="">Select a category</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Late">Late</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Fine Value (Rs ) *</label>
                <input v-model.number="newFine.value" type="number" step="0.01" min="0" max="999999"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                  placeholder="0.00" required @input="limitFineAmount" />
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select v-model="newFine.status"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Fine Date</label>
                <input v-model="newFine.date" type="date"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Description <span v-if="isOtherCategory" class="text-red-600">*</span>
              </label>
              <textarea v-model="newFine.description"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition"
                :placeholder="isOtherCategory ? 'Description is required for Other...' : 'Reason for the fine...'"
                rows="3" :required="isOtherCategory"></textarea>
            </div>

            <div class="flex gap-4">
              <button type="submit"
                class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
                :disabled="submitting">
                {{ submitting ? 'Submitting...' : 'Add Fine' }}
              </button>
              <button type="reset" @click="resetForm"
                class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition duration-300 font-semibold">
                Clear
              </button>
            </div>

            <!-- Success/Error Message -->
            <div v-if="submissionMessage"
              :class="success ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'"
              class="border-l-4 p-4 rounded">
              {{ submissionMessage }}
            </div>
          </form>
        </div>

        <!-- Fines List -->
        <div v-if="activeTab === 'current'" class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">
              Current Fine Cycle ({{ filteredFines.length }} of {{ finesStore.fines.length }} total)
            </h3>
            <div class="flex items-center gap-2">
              <input v-model="searchQuery" type="text" placeholder="Search by employee name..."
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              <button
                v-if="isPD "
                @click="checkAndOpenClearModal"
                :disabled="finesStore.fines.length === 0 || clearLoading"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 font-semibold
                disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                title="Close current fine cycle (Principal PD only)">
                {{ clearLoading ? 'Closing...' : 'Close Fine Cycle' }}
              </button>
            </div>
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
                    Rs {{ formatAmount(fine.value) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <span :class="fine.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      " class="inline-block px-3 py-1 text-xs font-semibold rounded">
                      {{ fine.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <div v-if="canManageFine(fine)" class="flex gap-2 justify-center">
                      <button v-if="fine.status === 'pending'" @click="updateFineStatus(fine._id, 'paid')"
                        class="text-green-600 hover:text-green-800 font-semibold text-xs hover:underline"
                        title="Mark as paid">
                        Mark Paid
                      </button>
                      <button v-else @click="updateFineStatus(fine._id, 'pending')"
                        class="text-orange-600 hover:text-orange-800 font-semibold text-xs hover:underline"
                        title="Mark as pending">
                        Mark Pending
                      </button>
                      <button @click="openDeleteModal(fine._id)"
                        class="text-red-600 hover:text-red-800 font-semibold text-xs hover:underline"
                        title="Delete fine">
                        Delete
                      </button>
                    </div>
                    <span v-else class="text-xs text-gray-400">Own fine</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Previous Fine Cycles -->
        <div v-if="activeTab === 'previous'" class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900">Previous Fine Cycles</h3>
            <button @click="loadPreviousFineCycles(true)" :disabled="previousCyclesLoading"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {{ previousCyclesLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
          </div>

          <div v-if="finesStore.previousFineCycles.length === 0" class="text-center py-8">
            <p class="text-gray-500">No previous fine cycles yet.</p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="cycle in finesStore.previousFineCycles" :key="cycle.date"
              class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gray-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h4 class="font-bold text-gray-900">
                    {{ formatDate(cycle.startDate) }} - {{ formatDate(cycle.closedAt || cycle.date) }}
                  </h4>
                  <p class="text-xs text-gray-500">Closed by {{ cycle.closedBy }}</p>
                </div>
                <div class="flex items-center gap-4 text-sm">
                  <div class="flex gap-4 text-sm">
                    <span class="font-semibold text-gray-700">{{ cycle.totalFines }} fines</span>
                    <span class="font-semibold text-gray-900">Rs {{ formatAmount(cycle.totalAmount) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button @click="openDeleteCycleModal(cycle)"
                      class="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition duration-200 font-semibold text-xs whitespace-nowrap"
                      title="Delete this fine cycle">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-white border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fine Date</th>
                      <th class="px-4 py-3 text-right text-sm font-semibold text-gray-700">Value</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="fine in cycle.fines" :key="fine._id" class="hover:bg-gray-50 transition">
                      <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ fine.name }}</td>
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded">
                          {{ fine.category }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600">{{ fine.description || '-' }}</td>
                      <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(fine.date) }}</td>
                      <td class="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                        Rs {{ formatAmount(fine.value) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Delete Confirmation Modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeDeleteModal">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-rose-500"></div>
          <div class="p-6">
            <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 text-center mb-1">Delete Fine</h3>
            <p class="text-sm text-gray-500 text-center leading-relaxed">
              This fine will be <span class="font-semibold text-red-500">permanently deleted</span>
              and cannot be recovered.
            </p>
            <div class="flex gap-3 mt-6">
              <button @click="closeDeleteModal"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200">Cancel</button>
              <button @click="confirmDelete" :disabled="deleteLoading"
                class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-sm hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                <svg v-if="deleteLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {{ deleteLoading ? 'Deleting...' : 'Yes, Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Close Fine Cycle Confirmation Modal ───────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showClearModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeClearModal">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-700"></div>
          <div class="p-6">
            <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
              <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4v2m0 0v2m0-2h2m-2 0h-2m0-4V5a2 2 0 012-2h4a2 2 0 012 2v4m0 0h2m-2 0h-2" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 text-center mb-1">Close Fine Cycle</h3>
            <p class="text-sm text-gray-500 text-center leading-relaxed mb-4">
              This will move all {{ finesStore.fines.length }} paid fines from the current list to
              <span class="font-semibold text-red-600">Previous Fine Cycles</span>.
            </p>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p class="text-xs text-yellow-800">
                <span class="font-semibold">Note:</span> The fines will stay in the database and can be viewed later.
              </p>
            </div>
            <div class="flex gap-3">
              <button @click="closeClearModal" :disabled="clearLoading"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50">Cancel</button>
              <button @click="confirmClear" :disabled="clearLoading"
                class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-sm hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                <svg v-if="clearLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {{ clearLoading ? 'Closing...' : 'Yes, Close Cycle' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Previous Cycle Confirmation Modal ───────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showDeleteCycleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closeDeleteCycleModal">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
          <div class="h-1.5 bg-gradient-to-r from-red-400 via-red-500 to-rose-500"></div>
          <div class="p-6">
            <div class="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 text-center mb-1">Delete Fine Cycle</h3>
            <p class="text-sm text-gray-500 text-center leading-relaxed">
              This fine cycle will be <span class="font-semibold text-red-500">permanently deleted</span>
              and cannot be recovered.
            </p>
            <p v-if="deleteCycleTarget" class="text-xs text-gray-600 text-center mt-3 bg-gray-50 p-2 rounded">
              {{ formatDate(deleteCycleTarget.startDate) }} - {{ formatDate(deleteCycleTarget.closedAt ||
              deleteCycleTarget.date) }}
            </p>
            <div class="flex gap-3 mt-6">
              <button @click="closeDeleteCycleModal"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors duration-200">Cancel</button>
              <button @click="confirmDeleteCycle" :disabled="deleteCycleLoading"
                class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-sm hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-200 disabled:opacity-60 flex items-center justify-center gap-2">
                <svg v-if="deleteCycleLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {{ deleteCycleLoading ? 'Deleting...' : 'Yes, Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl;

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
const activeTab = ref('current');
const employeeSearch = ref('');
const showEmployeeOptions = ref(false);

const formatAmount = (value) => {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const limitAmount = (value) => {
  if (value === null || value === undefined || value === '') return value;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return Math.min(amount, 999999);
};

const filteredFines = computed(() => {
  if (!searchQuery.value.trim()) return finesStore.fines;
  return finesStore.fines.filter(fine =>
    fine.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredEmployees = computed(() => {
  const query = employeeSearch.value.trim().toLowerCase();
  if (!query) return employees.value;
  return employees.value.filter(employee =>
    employee.username.toLowerCase().includes(query)
  );
});

const isOtherCategory = computed(() => {
  return newFine.value.category?.trim().toLowerCase() === 'other';
});

const fineUserId = (fine) => {
  if (!fine?.userId) return '';
  return typeof fine.userId === 'object' ? fine.userId._id : fine.userId;
};

const canManageFine = (fine) => {
  const isOwnFine = fineUserId(fine) === authStore.user?.id;
  const isPrincipalPD = authStore.user?.username === 'PD';
  return !isOwnFine || isPrincipalPD;
};

onMounted(async () => {
  // Redirect non-PD users to dashboard
  if (!isPD.value) {
    notificationStore.error('Only Project Directors can manage fines', 2000);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  } else {
    await finesStore.fetchFines();
    await loadPreviousFineCycles();
    await loadEmployees();
  }
});

const loadEmployees = async () => {
  try {
    loadingEmployees.value = true;
    const response = await axios.get(`${API_BASE_URL}/api/users/active/list`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    employees.value = response.data;
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
    employeeSearch.value = selected.username;
  }
};

const selectEmployee = (employee) => {
  newFine.value.selectedEmployee = employee._id;
  newFine.value.name = employee.username;
  newFine.value.userId = employee._id;
  employeeSearch.value = employee.username;
  showEmployeeOptions.value = false;
};

const hideEmployeeOptions = () => {
  window.setTimeout(() => {
    showEmployeeOptions.value = false;
  }, 120);
};

const limitFineAmount = () => {
  newFine.value.value = limitAmount(newFine.value.value);
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
  employeeSearch.value = '';
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

  if (isOtherCategory.value && !newFine.value.description.trim()) {
    submissionMessage.value = 'Description is required when category is Other';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Description is required for Other category');
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

  if (newFine.value.value > 999999) {
    submissionMessage.value = 'Fine value cannot exceed 6 digits';
    success.value = false;
    submitting.value = false;
    notificationStore.error('Fine value cannot exceed 6 digits');
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

// ── Delete modal state ────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const deleteTargetId = ref(null);
const deleteLoading = ref(false);

// ── Previous cycle delete state ───────────────────────────────────────────
const showDeleteCycleModal = ref(false);
const deleteCycleTarget = ref(null);
const deleteCycleLoading = ref(false);

// ── Clear finelist modal state ─────────────────────────────────────────────
const showClearModal = ref(false);
const clearLoading = ref(false);
const previousCyclesLoading = ref(false);

const openDeleteModal = (id) => {
  deleteTargetId.value = id;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  if (deleteLoading.value) return;
  showDeleteModal.value = false;
  deleteTargetId.value = null;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  deleteLoading.value = true;
  try {
    await finesStore.deleteFine(deleteTargetId.value);
    // Reset loading FIRST so closeDeleteModal guard doesn't block
    deleteLoading.value = false;
    showDeleteModal.value = false;
    deleteTargetId.value = null;
    notificationStore.success('✓ Fine deleted successfully', 2000);
  } catch (err) {
    deleteLoading.value = false;
    const errorMsg = err.response?.data?.message || 'Failed to delete fine. Please try again.';
    notificationStore.error(errorMsg, 3000);
    console.error('Error deleting fine:', { status: err.response?.status, message: errorMsg });
  }
};

const deleteFine = openDeleteModal;

const openDeleteCycleModal = (cycle) => {
  deleteCycleTarget.value = cycle;
  showDeleteCycleModal.value = true;
};

const closeDeleteCycleModal = () => {
  if (deleteCycleLoading.value) return;
  showDeleteCycleModal.value = false;
  deleteCycleTarget.value = null;
};

const confirmDeleteCycle = async () => {
  if (!deleteCycleTarget.value) return;
  deleteCycleLoading.value = true;
  try {
    await finesStore.deletePreviousCycle(deleteCycleTarget.value.date);
    deleteCycleLoading.value = false;
    closeDeleteCycleModal();
    notificationStore.success('✓ Fine cycle deleted', 2000);
  } catch (err) {
    deleteCycleLoading.value = false;
    const errorMsg = err.response?.data?.message || 'Failed to delete fine cycle.';
    notificationStore.error(errorMsg, 3000);
    console.error('Error deleting cycle:', err);
  }
};

const loadPreviousFineCycles = async (showSuccess = false) => {
  previousCyclesLoading.value = true;
  try {
    await finesStore.fetchPreviousFineCycles();
    if (showSuccess) {
      notificationStore.success('Previous fine cycles refreshed', 1500);
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to load previous fine cycles.';
    notificationStore.error(errorMsg, 3000);
    console.error('Error loading previous fine cycles:', { status: err.response?.status, message: errorMsg });
  } finally {
    previousCyclesLoading.value = false;
  }
};

// ── Close fine cycle functions ────────────────────────────────────────────
const checkAndOpenClearModal = () => {
  // Check if all fines are paid
  const pendingFines = finesStore.fines.filter(f => f.status === 'pending');

  if (pendingFines.length > 0) {
    notificationStore.error(
      `Cannot close fine cycle: ${pendingFines.length} pending fine(s) found. All fines must be marked as paid before closing.`,
      4000
    );
    return;
  }

  if (finesStore.fines.length === 0) {
    notificationStore.error('There are no fines in the current cycle', 2000);
    return;
  }

  openClearModal();
};

const openClearModal = () => {
  showClearModal.value = true;
};

const closeClearModal = () => {
  if (clearLoading.value) return;
  showClearModal.value = false;
};

const confirmClear = async () => {
  clearLoading.value = true;
  try {
    await finesStore.closeFineCycle();
    clearLoading.value = false;
    showClearModal.value = false;
    activeTab.value = 'previous';
    notificationStore.success('Fine cycle closed successfully', 2000);
  } catch (err) {
    clearLoading.value = false;
    const errorMsg = err.response?.data?.message || 'Failed to close fine cycle. Please try again.';
    notificationStore.error(errorMsg, 4000);
    console.error('Error closing fine cycle:', { status: err.response?.status, message: errorMsg });
  }
};
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
