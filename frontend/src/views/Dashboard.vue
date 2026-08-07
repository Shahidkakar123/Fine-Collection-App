<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Fines Overview
        </h2>
        <p class="text-xxl text-gray-600">
          {{ authStore.role === 'pd' ? 'Manage all employee fines and analytics' : 'View fines and analytics' }}
        </p>
      </div>

      <div v-if="authStore.role !== 'pd' && newFinesDetected.length > 0"
        class="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-2xl">⚠️</span>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-bold text-yellow-900">New Fines Assigned!</h3>
            <div class="mt-2 space-y-1">
              <p v-for="fine in newFinesDetected" :key="fine._id" class="text-sm text-yellow-800">
                • <strong>Rs {{ formatAmount(fine.value) }}</strong> for <strong>{{ fine.category }}</strong> - {{
                  fine.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="finesStore.loading" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
        </div>
        <div class="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
        <div class="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
      </div>

      <div v-else class="space-y-6">
        <h1 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Current Cycle Analytics</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Fines</h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ finesStore.fines.length }}</p>
            <p class="text-xs text-gray-500 mt-1">System wide
            </p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Active Users
            </h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ dashboardActiveEmployeeCount }}</p>
            <p class="text-xs text-gray-500 mt-1">Unique users system wide</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div
            class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 border-l-4 border-emerald-600">
            <h3 class="text-xs font-semibold text-emerald-700 uppercase tracking-wide whitespace-nowrap">Collected
              Amount
            </h3>
            <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
              Rs {{ dashboardCollectedAmount }}</p>
            <p class="text-xs text-gray-500 mt-1">Amount from paid fines</p>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">Pending Amount
            </h3>
            <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
              Rs {{ dashboardPendingAmount }}</p>
            <p class="text-xs text-gray-500 mt-1">Outstanding fines</p>
          </div>

          <div v-if="authStore.role === 'pd'"
            class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-md p-6 border-l-4 border-violet-600"
            @click="openAmountUsedModal">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs font-semibold text-violet-700 uppercase tracking-wide whitespace-nowrap">Amount Used
                </h3>
                <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
                  Rs {{ amountUsed }}</p>
                <p class="text-xs text-gray-500 mt-1">From collected amount</p>
              </div>
              <button class="text-purple-600 hover:text-purple-800 text-xl flex-shrink-0 self-start"
                title="Edit Amount Used">✏️</button>
            </div>
          </div>

          <div v-else
            class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-md p-6 border-l-4 border-violet-600">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-xs font-semibold text-violet-700 uppercase tracking-wide whitespace-nowrap">Amount Used
                </h3>
                <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
                  Rs {{ amountUsed }}</p>
                <p class="text-xs text-gray-500 mt-1">From collected amount</p>
              </div>
            </div>
          </div>


        </div>

        <div class="mt-6">
          <h1 class="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">All-Time Totals</h1>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div
              class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg shadow-md p-6 border-l-4 border-emerald-600">
              <h3 class="text-xs font-semibold text-emerald-700 uppercase tracking-wide whitespace-nowrap">All-Time
                Collected</h3>
              <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
                Rs {{ allTimeCollectedAmount }}</p>
              <p class="text-xs text-gray-500 mt-1">Across all cycles</p>
            </div>

            <div
              class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-md p-6 border-l-4 border-violet-600">
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <h3 class="text-xs font-semibold text-violet-700 uppercase tracking-wide whitespace-nowrap">All-Time
                    Amount Used</h3>
                  <p :class="'font-bold text-gray-900 mt-2 whitespace-nowrap overflow-hidden text-ellipsis'">
                    Rs {{ allTimeAmountUsed }}</p>
                  <p class="text-xs text-gray-500 mt-1">Across all cycles</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900">Category Analytics</h3>
            <p class="text-sm text-gray-600 mt-1">
              {{ authStore.role === 'pd' ? 'Fine distribution by category' : 'Your fines by category' }}
            </p>
          </div>

          <div v-if="categoryStats.length === 0" class="text-center py-8 text-gray-500">
            No data available
          </div>

          <div v-else class="space-y-4">
            <div v-for="stat in categoryStats" :key="stat.category" class="flex items-end gap-4">
              <div class="w-32">
                <p class="text-sm font-semibold text-gray-700">{{ stat.category }}</p>
                <p class="text-xs text-gray-500">Rs {{ formatAmount(stat.value) }}</p>
              </div>
              <div class="flex-1">
                <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div :style="{ width: stat.percentage + '%' }" :class="stat.color"
                    class="h-full transition-all duration-300"></div>
                </div>
              </div>
              <div class="w-16 text-right">
                <p class="text-sm font-bold text-gray-900">{{ stat.percentage }}%</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">
              {{ authStore.role === 'pd' ? 'Employee Summary' : 'Fines Summary' }}
            </h3>
            <input v-model="searchQuery" type="text" placeholder="Search by name..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div v-if="filteredEmployeeAnalytics.length === 0" class="text-center py-8">
            <p class="text-gray-500">{{ searchQuery ? 'No matching records found' : 'No data available' }}</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {{ authStore.role === 'pd' ? 'Employee Name' : 'Name' }}
                  </th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total Fines</th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Collected</th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pending</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="employee in filteredEmployeeAnalytics" :key="employee.userId"
                  class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ employee.name }}</td>
                  <td class="px-6 py-4 text-sm text-right text-gray-900">{{ employee.totalCount }}</td>
                  <td class="px-6 py-4 text-sm text-right font-semibold text-green-600">Rs {{
                    formatAmount(employee.collectedAmount) }}</td>
                  <td class="px-6 py-4 text-sm text-right font-semibold text-red-600">Rs {{
                    formatAmount(employee.pendingAmount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAmountUsedModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closeAmountUsedModal">
      <div class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6" @click.stop>
        <h3 class="text-lg font-bold text-gray-900 mb-4">Update Amount Used</h3>
        <p class="text-sm text-gray-600 mb-4">
          Enter the amount that has been used from the collected fines.
        </p>

        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Amount (Rs)</label>
          <input v-model.number="amountUsedInput" type="number" step="0.01" min="0" max="999999"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0.00" @input="limitAmountUsedInput" />
        </div>

        <div class="flex gap-4">
          <button @click="closeAmountUsedModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition duration-200">
            Cancel
          </button>
          <button @click="updateAmountUsed" :disabled="savingAmountUsed"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ savingAmountUsed ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>

    <!-- All-time amount used is display-only (fetched from server) -->
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useFinesStore } from '../store/fines';
import { useNotificationStore } from '../store/notifications';

const route = useRoute();
const authStore = useAuthStore();
const finesStore = useFinesStore();
const notificationStore = useNotificationStore();

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const formatAmount = (value) => {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseAmount = (value) => Number(String(value || 0).replace(/,/g, ''));

const displayedFines = computed(() => {
  const userId = authStore.user?.id;
  if (authStore.role === 'pd') return finesStore.fines;

  return finesStore.fines.filter(fine => {
    const fineUserId = typeof fine.userId === 'object' ? fine.userId?._id || fine.userId : fine.userId;
    return fineUserId === userId || fineUserId?.toString() === userId?.toString();
  });
});

const categoryStats = computed(() => {
  const finesToAnalyze = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;

  const stats = finesToAnalyze.reduce((acc, fine) => {
    const existing = acc.find(s => s.category === fine.category);
    if (existing) {
      existing.value += fine.value;
      existing.count += 1;
    } else {
      acc.push({ category: fine.category, value: fine.value, count: 1 });
    }
    return acc;
  }, []);

  if (stats.length === 0) return [];

  const total = stats.reduce((sum, s) => sum + s.value, 0);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];

  return stats.map((stat, i) => ({
    ...stat,
    percentage: Math.round((stat.value / total) * 100) || 0,
    color: colors[i % colors.length],
  }));
});

const employeeAnalytics = computed(() => {
  const finesToAnalyze = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;
  const employeeMap = new Map();

  finesToAnalyze.forEach(fine => {
    const userId = typeof fine.userId === 'string' ? fine.userId : fine.userId?._id;
    const userName = typeof fine.userId === 'object' ? fine.userId?.username : fine.name;
    if (!userId) return;

    if (!employeeMap.has(userId)) {
      employeeMap.set(userId, {
        userId,
        name: userName || 'Unknown',
        totalCount: 0,
        collectedAmount: 0,
        pendingAmount: 0,
      });
    }

    const employee = employeeMap.get(userId);
    employee.totalCount += 1;

    if (fine.status === 'paid') {
      employee.collectedAmount += fine.value;
    } else {
      employee.pendingAmount += fine.value;
    }
  });

  return Array.from(employeeMap.values())
    .sort((a, b) => (b.collectedAmount + b.pendingAmount) - (a.collectedAmount + a.pendingAmount));
});

const searchQuery = ref('');

const filteredEmployeeAnalytics = computed(() => {
  if (!searchQuery.value.trim()) return employeeAnalytics.value;
  return employeeAnalytics.value.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const dashboardCollectedAmount = computed(() => {
  const source = finesStore.fines;
  return formatAmount(source
    .filter(fine => fine.status === 'paid')
    .reduce((sum, fine) => sum + fine.value, 0));
});

const dashboardPendingAmount = computed(() => {
  const source = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;
  return formatAmount(source
    .filter(fine => fine.status !== 'paid')
    .reduce((sum, fine) => sum + fine.value, 0));
});


const activeEmployeesList = ref([]);

const dashboardActiveEmployeeCount = computed(() => {
  return activeEmployeesList.value.length;
});

const newFinesDetected = ref([]);

const fetchActiveEmployees = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/users/active/list`,
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    activeEmployeesList.value = response.data;
  } catch (err) {
    console.error('Error fetching active employees:', err);
  }
};

const checkForNewFines = () => {
  const storedLastCheck = localStorage.getItem(`lastFineCheck_${authStore.user?.id}`);
  const lastCheckTime = storedLastCheck ? parseInt(storedLastCheck) : 0;

  const newFines = displayedFines.value.filter(fine => {
    if (!fine.createdAt) return false;
    return new Date(fine.createdAt).getTime() > lastCheckTime;
  });

  if (newFines.length > 0) {
    newFinesDetected.value = newFines;
    newFines.forEach(fine => {
      notificationStore.warning(
        `New fine: Rs ${formatAmount(fine.value)} for ${fine.category}`,
        5000
      );
    });
  }

  localStorage.setItem(`lastFineCheck_${authStore.user?.id}`, Date.now().toString());
};

onMounted(async () => {
  if (finesStore.fines.length === 0) {
    await finesStore.fetchFines();
  }

  // fetch common data
  await fetchAllTimeAmountUsed();
  await fetchActiveEmployees();
  await fetchAmountUsed();
  if (authStore.role === 'pd') {
  } else {
    checkForNewFines();
  }
});

watch(() => route.path, (newPath) => {
  if (newPath !== '/dashboard') return;

  if (finesStore.fines.length === 0) {
    finesStore.fetchFines();
  }

  // refresh all-time value and role-specific values
  fetchAllTimeAmountUsed();
  if (authStore.role === 'pd') {
    fetchActiveEmployees();
  } else {
    checkForNewFines();
  }
});

const amountUsed = ref('0.00');
const amountUsedInput = ref(0);
const showAmountUsedModal = ref(false);
const savingAmountUsed = ref(false);

const fetchAmountUsed = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/config/amountUsed`,
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    const value = response.data.value || 0;
    amountUsed.value = formatAmount(value);
    amountUsedInput.value = parseFloat(value);
  } catch (err) {
    console.error('Error fetching amount used:', err);
    amountUsed.value = formatAmount(0);
  }
};

const fetchAllTimeAmountUsed = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/config/allTimeAmountUsed`, { headers: { Authorization: `Bearer ${authStore.token}` } });
    const value = response.data.value || 0;
    allTimeAmountUsed.value = formatAmount(value);
  } catch (err) {
    console.error('Error fetching all-time amount used:', err);
    allTimeAmountUsed.value = formatAmount(0);
  }
};

const openAmountUsedModal = () => {
  if (authStore.role !== 'pd') return;
  amountUsedInput.value = parseAmount(amountUsed.value);
  showAmountUsedModal.value = true;
};

const closeAmountUsedModal = () => {
  showAmountUsedModal.value = false;
  amountUsedInput.value = 0;
};

const limitAmountUsedInput = () => {
  if (amountUsedInput.value === null || amountUsedInput.value === undefined || amountUsedInput.value === '') return;
  const amount = Number(amountUsedInput.value);
  amountUsedInput.value = Number.isNaN(amount) ? 0 : Math.min(amount, 999999);
};

const updateAmountUsed = async () => {
  if (amountUsedInput.value === null || amountUsedInput.value === undefined) {
    notificationStore.error('Please enter a valid amount', 2000);
    return;
  }

  if (amountUsedInput.value < 0) {
    notificationStore.error('Amount cannot be negative', 2000);
    return;
  }

  if (amountUsedInput.value > 999999) {
    notificationStore.error('Amount cannot exceed 6 digits', 2000);
    return;
  }

  const collectedAmount = parseAmount(dashboardCollectedAmount.value);
  if (amountUsedInput.value > collectedAmount) {
    notificationStore.error('Amount cannot be greater than collected amount', 2000);
    return;
  }

  savingAmountUsed.value = true;
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/config/amountUsed`,
      { value: amountUsedInput.value },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    amountUsed.value = formatAmount(response.data.value);
    notificationStore.success('Amount used updated successfully', 2000);
    closeAmountUsedModal();
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to update amount used';
    notificationStore.error(errorMsg, 3000);
    console.error('Error updating amount used:', err);
  } finally {
    savingAmountUsed.value = false;
  }
};

// --- All-time totals (keeps running total even after cycles are closed) ---
const allTimeCollectedAmount = computed(() => {
  const source = finesStore.fines;
  const currentCollected = (source || []).filter(f => f.status === 'paid').reduce((s, f) => s + (f.value || 0), 0);
  const previousCollected = (finesStore.previousFineCycles || []).reduce((s, cycle) => s + (cycle.totalAmount || 0), 0);
  return formatAmount(currentCollected + previousCollected);
});

// All-time amount used is maintained server-side; fetch into this ref and display read-only
const allTimeAmountUsed = ref(formatAmount(0));
</script>
