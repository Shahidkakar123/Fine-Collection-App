<template>
  <div class="min-h-screen bg-gray-100 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <!-- Header Section -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-2">Your Fines Timeline</h2>
        <p class="text-gray-600">View all your assigned fines in chronological order</p>
      </div>

      <!-- Loading State -->
      <div v-if="finesStore.loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-gray-200 rounded-lg h-24 animate-pulse"></div>
      </div>

      <!-- New Fines Alert -->
      <div v-if="newFinesDetected.length > 0" class="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
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

      <!-- Fines Timeline -->
      <div v-else-if="!finesStore.loading" class="space-y-6">
        <!-- Summary Stats (First) -->
        <div v-if="userFines.length > 0" class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Your Summary</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
              <p class="text-xs text-blue-600 font-semibold uppercase">Total Fines</p>
              <p class="text-2xl font-bold text-blue-900 mt-2">{{ userFines.length }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
              <p class="text-xs text-green-600 font-semibold uppercase">Paid</p>
              <p class="text-2xl font-bold text-green-900 mt-2">${{ paidTotal }}</p>
            </div>
            <div class="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
              <p class="text-xs text-red-600 font-semibold uppercase">Outstanding</p>
              <p class="text-2xl font-bold text-red-900 mt-2">${{ unpaidTotal }}</p>
            </div>
          </div>
        </div>

        <!-- Search and Filter (Second) -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex gap-4 flex-wrap">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by category or description..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              v-model="filterStatus"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <!-- Timeline (Third) -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div v-if="filteredFines.length === 0" class="text-center py-12">
            <div class="text-gray-400 text-5xl mb-4">📋</div>
            <p class="text-gray-600 text-lg">{{ searchQuery || filterStatus ? 'No matching fines found' : 'You have no fines assigned' }}</p>
          </div>

          <div v-else class="space-y-4">
            <!-- Timeline Items -->
            <div 
              v-for="(fine, index) in sortedFines" 
              :key="fine._id"
              class="flex gap-4"
            >
              <!-- Timeline Line and Dot -->
              <div class="flex flex-col items-center">
                <div
                  :class="fine.status === 'paid' ? 'bg-green-500' : 'bg-red-500'"
                  class="w-4 h-4 rounded-full border-4 border-white shadow-md"
                ></div>
                <div
                  v-if="index < sortedFines.length - 1"
                  class="w-1 bg-gray-300 flex-1 my-2"
                ></div>
              </div>

              <!-- Timeline Content -->
              <div class="flex-1 pb-8">
                <div
                  :class="fine.status === 'paid' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
                  class="p-4 rounded-lg border-l-4"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-gray-900">{{ fine.name }}</h3>
                      <p class="text-sm text-gray-600 mt-1">{{ fine.description }}</p>
                      
                      <!-- Fine Details -->
                      <div class="flex gap-4 mt-3 flex-wrap">
                        <span class="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded">
                          📂 {{ fine.category }}
                        </span>
                        <span
                          :class="fine.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'"
                          class="inline-block px-3 py-1 text-xs font-semibold rounded"
                        >
                          {{ fine.status === 'paid' ? '✓ Paid' : '⏳ Unpaid' }}
                        </span>
                        <span v-if="fine.date" class="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded border border-gray-300">
                          📅 {{ new Date(fine.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Amount -->
                    <div class="text-right ml-4">
                      <p class="text-3xl font-bold text-gray-900">${{ fine.value }}</p>
                      <p v-if="fine.status !== 'paid'" class="text-xs text-gray-600 mt-1">Amount Due</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '../store/auth';
import { useFinesStore } from '../store/fines';

const authStore = useAuthStore();
const finesStore = useFinesStore();

const searchQuery = ref('');
const filterStatus = ref('');
const newFinesSeen = ref(new Set());

// Get user's fines - handle both string and ObjectId formats
const userFines = computed(() => {
  const userId = authStore.user?.id;
  return finesStore.fines.filter(fine => {
    const fineUserId = typeof fine.userId === 'object' ? fine.userId?._id || fine.userId : fine.userId;
    return fineUserId === userId || fineUserId?.toString() === userId?.toString();
  });
});

// Filter fines based on search and status
const filteredFines = computed(() => {
  return userFines.value.filter(fine => {
    const matchesSearch = 
      fine.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fine.category.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      fine.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // Handle unpaid filter - unpaid means status is not 'paid' (could be 'pending' or other)
    const matchesStatus = !filterStatus.value || 
      (filterStatus.value === 'unpaid' ? fine.status !== 'paid' : fine.status === filterStatus.value);
    
    return matchesSearch && matchesStatus;
  });
});

// Sort fines by date (newest first)
const sortedFines = computed(() => {
  return [...filteredFines.value].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
});

// Detect new fines
const newFinesDetected = computed(() => {
  return userFines.value.filter(fine => !newFinesSeen.value.has(fine._id));
});

// Calculate totals
const paidTotal = computed(() => {
  return filteredFines.value
    .filter(fine => fine.status === 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

const unpaidTotal = computed(() => {
  return filteredFines.value
    .filter(fine => fine.status !== 'paid')
    .reduce((sum, fine) => sum + fine.value, 0)
    .toFixed(2);
});

// Mark fines as seen on mount
onMounted(() => {
  userFines.value.forEach(fine => newFinesSeen.value.add(fine._id));
  // Only fetch if not already loaded
  if (finesStore.fines.length === 0) {
    finesStore.fetchFines();
  }
});
</script>
