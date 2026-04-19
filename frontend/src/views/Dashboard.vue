<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Header Section -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-2">
          {{ authStore.role === 'pd' ? 'Fines Overview' : 'Your Fines Dashboard' }}
        </h2>
        <p class="text-gray-600">{{ authStore.role === 'pd' ? 'Manage all employee fines and analytics' : 'View your fines and analytics' }}</p>
      </div>


      <!-- New Fine Alert for Employees -->
      <div v-if="authStore.role !== 'pd' && newFinesDetected.length > 0" class="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <span class="text-2xl">⚠️</span>
          </div>
          <div class="ml-3">
            <h3 class="text-lg font-bold text-yellow-900">New Fines Assigned!</h3>
            <div class="mt-2 space-y-1">
              <p v-for="fine in newFinesDetected" :key="fine._id" class="text-sm text-yellow-800">
                • <strong>${{ fine.value }}</strong> for <strong>{{ fine.category }}</strong> - {{ fine.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State with Skeleton -->
      <div v-if="finesStore.loading" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
        </div>
        <div class="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
        <div class="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Unified Stats Cards (For Everyone) -->
        <div :class="authStore.role === 'pd' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'">
          <!-- Total Fines Card -->
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Fines</h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ authStore.role === 'pd' ? finesStore.fines.length : displayedFines.length }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ authStore.role === 'pd' ? 'System wide' : 'Assigned to you' }}</p>
          </div>

          <!-- Collected Amount Card -->
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Collected Amount</h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">${{ dashboardCollectedAmount }}</p>
            <p class="text-xs text-gray-500 mt-1">Amount from paid fines</p>
          </div>

          <!-- Pending Amount Card -->
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Amount</h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">${{ dashboardPendingAmount }}</p>
            <p class="text-xs text-gray-500 mt-1">Outstanding fines</p>
          </div>

          <!-- Amount Used Card (PD Only) -->
          <div v-if="authStore.role === 'pd'" class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 cursor-pointer hover:shadow-lg transition" @click="openAmountUsedModal">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Amount Used</h3>
                <p class="text-3xl font-bold text-gray-900 mt-2">${{ amountUsed }}</p>
                <p class="text-xs text-gray-500 mt-1">From collected amount</p>
              </div>
              <button class="text-purple-600 hover:text-purple-800 text-xl" title="Edit Amount Used">✏️</button>
            </div>
          </div>

          <!-- Active Employees / Users Card -->
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active {{ authStore.role === 'pd' ? 'Employees' : 'Users' }}</h3>
            <p class="text-3xl font-bold text-gray-900 mt-2">{{ dashboardActiveEmployeeCount }}</p>
            <p class="text-xs text-gray-500 mt-1">Unique users with fines</p>
          </div>
        </div>

        <!-- Category Analytics (All Users) -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900">Category Analytics</h3>
            <p class="text-sm text-gray-600 mt-1">{{ authStore.role === 'pd' ? 'Fine distribution by category' : 'Your fines by category' }}</p>
          </div>
          
          <div v-if="categoryStats.length === 0" class="text-center py-8 text-gray-500">
            No data available
          </div>
          
          <div v-else class="space-y-4">
            <div v-for="stat in categoryStats" :key="stat.category" class="flex items-end gap-4">
              <div class="w-32">
                <p class="text-sm font-semibold text-gray-700">{{ stat.category }}</p>
                <p class="text-xs text-gray-500">${{ stat.value }}</p>
              </div>
              <div class="flex-1">
                <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    :style="{ width: stat.percentage + '%' }"
                    :class="stat.color"
                    class="h-full transition-all duration-300"
                  ></div>
                </div>
              </div>
              <div class="w-16 text-right">
                <p class="text-sm font-bold text-gray-900">{{ stat.percentage }}%</p>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="mt-8 grid grid-cols-2 gap-4">
            <div class="bg-orange-50 rounded p-4">
              <p class="text-xs text-orange-600 font-semibold">{{ authStore.role === 'pd' ? 'Average Fine' : 'Your Avg Fine' }}</p>
              <p class="text-2xl font-bold text-orange-900 mt-2">${{ averageFineAmount }}</p>
            </div>
          </div>
        </div>

        <!-- Your Fines Section (Employees Only) - REMOVED, now in Timeline view -->

        <!-- Employee Summary (All Users) -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">
              {{ authStore.role === 'pd' ? 'Employee Summary' : 'Fines Summary' }}
            </h3>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div v-if="filteredEmployeeAnalytics.length === 0" class="text-center py-8">
            <p class="text-gray-500">{{ searchQuery ? 'No matching records found' : 'No data available' }}</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">{{ authStore.role === 'pd' ? 'Employee Name' : 'Name' }}</th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total Fines</th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Collected</th>
                  <th class="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pending</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="employee in filteredEmployeeAnalytics" :key="employee.userId" class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ employee.name }}</td>
                  <td class="px-6 py-4 text-sm text-right text-gray-900">{{ employee.totalCount }}</td>
                  <td class="px-6 py-4 text-sm text-right font-semibold text-green-600">${{ employee.collectedAmount }}</td>
                  <td class="px-6 py-4 text-sm text-right font-semibold text-red-600">${{ employee.pendingAmount }}</td>
                  <!-- <td class="px-6 py-4 text-sm text-gray-600 font-medium">{{ employee.latestDate }}</td> -->
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Amount Used Modal (PD Only) -->
    <div
      v-if="showAmountUsedModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click="closeAmountUsedModal"
    >
      <div
        class="bg-white rounded-lg shadow-lg max-w-sm w-full p-6"
        @click.stop
      >
        <h3 class="text-lg font-bold text-gray-900 mb-4">Update Amount Used</h3>
        <p class="text-sm text-gray-600 mb-4">
          Enter the amount that has been used from the collected fines.
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Amount ($)</label>
          <input
            v-model.number="amountUsedInput"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0.00"
          />
        </div>

        <div class="flex gap-4">
          <button
            @click="closeAmountUsedModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition duration-200"
          >
            Cancel
          </button>
          <button
            @click="updateAmountUsed"
            :disabled="savingAmountUsed"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ savingAmountUsed ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Display fines based on role - handle both string and ObjectId formats
const displayedFines = computed(() => {
  const userId = authStore.user?.id;
  if (authStore.role === 'pd') {
    return finesStore.fines;
  } else {
    // Employees see only their fines
    return finesStore.fines.filter(fine => {
      const fineUserId = typeof fine.userId === 'object' ? fine.userId?._id || fine.userId : fine.userId;
      return fineUserId === userId || fineUserId?.toString() === userId?.toString();
    });
  }
});

const totalFineValue = computed(() => {
  return displayedFines.value.reduce((sum, fine) => sum + fine.value, 0).toFixed(2);
});

const collectedAmount = computed(() => {
  return displayedFines.value
    .filter(fine => fine.status === 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

const pendingAmount = computed(() => {
  return displayedFines.value
    .filter(fine => fine.status !== 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

const paidCount = computed(() => {
  return displayedFines.value.filter(fine => fine.status === 'paid').length;
});

const pendingCount = computed(() => {
  return displayedFines.value.filter(fine => fine.status === 'pending').length;
});

// Category Analytics - Works for both PD and Employees
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

const activeEmployeeCount = computed(() => {
  const uniqueUsers = new Set(
    displayedFines.value.map(f => {
      if (!f.userId) return '';
      return typeof f.userId === 'string'
        ? f.userId
        : f.userId._id || f.userId.id || '';
    }).filter(Boolean)
  );
  return uniqueUsers.size;
});

const averageFineAmount = computed(() => {
  const finesToAnalyze = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;
  if (finesToAnalyze.length === 0) return '0.00';
  const avg = finesToAnalyze.reduce((sum, fine) => sum + fine.value, 0) / finesToAnalyze.length;
  return avg.toFixed(2);
});

// Employee Analytics for Dashboard (Both PD and Employees)
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
        latestDate: '-'
      });
    }
    
    const employee = employeeMap.get(userId);
    employee.totalCount += 1;
    
    if (fine.status === 'paid') {
      employee.collectedAmount += fine.value;
    } else {
      employee.pendingAmount += fine.value;
    }
    
    // Update latest date
    if (fine.date) {
      if (employee.latestDate === '-') {
        // First fine for this employee
        const d = new Date(fine.date);
        employee.latestDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } else {
        // Compare with existing latest date
        const fineDate = new Date(fine.date);
        const currentLatestDate = new Date(employee.latestDate);
        
        if (fineDate > currentLatestDate) {
          const d = new Date(fine.date);
          employee.latestDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
    }
  });
  
  return Array.from(employeeMap.values())
    .sort((a, b) => (b.collectedAmount + b.pendingAmount) - (a.collectedAmount + a.pendingAmount));
});

// Search functionality
const searchQuery = ref('');

const filteredEmployeeAnalytics = computed(() => {
  if (!searchQuery.value.trim()) return employeeAnalytics.value;
  return employeeAnalytics.value.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Dashboard specific calculations
const dashboardCollectedAmount = computed(() => {
  const source = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;
  return source
    .filter(fine => fine.status === 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

const dashboardPendingAmount = computed(() => {
  const source = authStore.role === 'pd' ? finesStore.fines : displayedFines.value;
  return source
    .filter(fine => fine.status !== 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

const activeEmployeesList = ref([]);

const dashboardActiveEmployeeCount = computed(() => {
  if (authStore.role === 'pd') {
    // For PD, return count of active employees from the backend
    return activeEmployeesList.value.length;
  } else {
    // For employees, show 1
    return 1;
  }
});

const lastCheckedFines = ref(0);
const newFinesDetected = ref([]);

const fetchActiveEmployees = async () => {
  if (authStore.role === 'pd') {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/active/list`,
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      activeEmployeesList.value = response.data;
    } catch (err) {
      console.error('Error fetching active employees:', err);
    }
  }
};

onMounted(async () => {
  // Only fetch if not already loaded to avoid unnecessary reloads
  if (finesStore.fines.length === 0) {
    await finesStore.fetchFines();
  }
  
  // Fetch active employees if PD
  if (authStore.role === 'pd') {
    await fetchActiveEmployees();
    await fetchAmountUsed();
  }
  
  // Check for new fines if employee
  if (authStore.role !== 'pd') {
    checkForNewFines();
  }
});

// Watch for route changes - refresh employee list when returning to dashboard
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/dashboard') {
    // Don't re-fetch fines if data exists
    if (finesStore.fines.length === 0) {
      finesStore.fetchFines();
    }
    
    if (authStore.role === 'pd') {
      // Refresh active employees list
      fetchActiveEmployees();
    }
    
    if (authStore.role !== 'pd') {
      checkForNewFines();
    }
  }
});

const checkForNewFines = () => {
  const storedLastCheck = localStorage.getItem(`lastFineCheck_${authStore.user?.id}`);
  const lastCheckTime = storedLastCheck ? parseInt(storedLastCheck) : 0;
  
  // Get new fines created after last check
  const newFines = displayedFines.value.filter(fine => {
    if (!fine.createdAt) return false; // Skip if no createdAt
    const fineTime = new Date(fine.createdAt).getTime();
    return fineTime > lastCheckTime;
  });

  if (newFines.length > 0) {
    newFinesDetected.value = newFines;
    newFines.forEach(fine => {
      notificationStore.warning(
        `⚠️ New fine: $${fine.value} for ${fine.category}`,
        5000
      );
    });
  }
  
  // Update last check time
  localStorage.setItem(`lastFineCheck_${authStore.user?.id}`, Date.now().toString());
};

const getEmployeeInfo = (userId) => {
  if (!userId) return 'User: Unknown';
  if (typeof userId === 'string') {
    return `User: ${userId.substring(0, 8)}...`;
  }
  if (typeof userId === 'object') {
    if (userId.username) {
      return `User: ${userId.username}`;
    }
    const id = userId._id || userId.id;
    return id ? `User: ${id.substring(0, 8)}...` : 'User: Unknown';
  }
  return 'User: Unknown';
};

// Amount Used Management
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
    amountUsed.value = parseFloat(value).toFixed(2);
    amountUsedInput.value = parseFloat(value);
  } catch (err) {
    console.error('Error fetching amount used:', err);
    amountUsed.value = '0.00';
  }
};

const openAmountUsedModal = () => {
  amountUsedInput.value = parseFloat(amountUsed.value);
  showAmountUsedModal.value = true;
};

const closeAmountUsedModal = () => {
  showAmountUsedModal.value = false;
  amountUsedInput.value = 0;
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

  savingAmountUsed.value = true;
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/config/amountUsed`,
      { value: amountUsedInput.value },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    amountUsed.value = parseFloat(response.data.value).toFixed(2);
    notificationStore.success('✓ Amount used updated successfully', 2000);
    closeAmountUsedModal();
  } catch (err) {
    const errorMsg = err.response?.data?.message || 'Failed to update amount used';
    notificationStore.error(errorMsg, 3000);
    console.error('Error updating amount used:', err);
  } finally {
    savingAmountUsed.value = false;
  }
};

// Initial fetch
// Amount used is fetched in the main onMounted hook
</script>