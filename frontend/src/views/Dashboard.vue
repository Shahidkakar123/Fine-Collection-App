<template>
  <div class="min-h-screen bg-gray-900 py-6">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold text-white mb-6 animate-pulse">Dashboard</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Total Fines Card -->
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
        >
          <h3 class="text-lg font-semibold text-gray-300">Total Fines</h3>
          <p class="text-4xl text-secondary font-bold mt-2 animate-bounce">
            {{ finesStore.fines.length }}
          </p>
        </div>

        <!-- Total Fine Value Card -->
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
        >
          <h3 class="text-lg font-semibold text-gray-300">Total Fine Value</h3>
          <p class="text-4xl text-secondary font-bold mt-2 animate-bounce">
            ${{ totalFineValue }}
          </p>
        </div>

        <!-- Fines by Category Card -->
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
        >
          <h3 class="text-lg font-semibold text-gray-300">Fines by Category</h3>
          <div class="mt-2">
            <p v-for="cat in categories" :key="cat.name" class="text-gray-400">
              {{ cat.name }}: {{ cat.count }}
            </p>
          </div>
        </div>

        <!-- New Chart Card -->
        <div
          class="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 col-span-1 md:col-span-2 lg:col-span-3"
        >
          <h3 class="text-lg font-semibold text-gray-300">Fine Values by Category</h3>
          <div class="relative overflow-hidden" style="max-height: 16rem;"> <!-- Fixed height container -->
            <canvas ref="barChartRef" class="w-full h-full"></canvas> <!-- Remove inline height -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'; // All required imports
import { useFinesStore } from '../store/fines';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables); // Register all Chart.js components

const finesStore = useFinesStore();
const totalFineValue = computed(() => finesStore.fines.reduce((sum, fine) => sum + fine.value, 0));
const categories = computed(() => {
  const counts = finesStore.fines.reduce((acc, fine) => {
    acc[fine.category] = (acc[fine.category] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
});

const barChartRef = ref(null);
let barChartInstance = null;

onMounted(() => {
  finesStore.fetchFines();
  initializeBarChart();
  console.log('Bar Chart Ref:', barChartRef.value);
});

const initializeBarChart = () => {
  if (barChartInstance) barChartInstance.destroy();
  const ctx = barChartRef.value?.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not found for bar chart');
    return;
  }

  // Group fines by category and calculate total value
  const categoryData = finesStore.fines.reduce((acc, fine) => {
    acc[fine.category] = (acc[fine.category] || 0) + fine.value;
    return acc;
  }, {});

  barChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(categoryData),
      datasets: [{
        label: 'Total Fine Value',
        data: Object.values(categoryData),
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, '#3B82F6'); // Blue start
          gradient.addColorStop(1, '#9333EA'); // Purple end
          return gradient;
        },
        borderColor: '#6B46C1',
        borderWidth: 1,
        borderRadius: 5,
        barThickness: 20,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0, // Disable animation to prevent redraw issues
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Value ($)',
            color: '#D1D5DB',
          },
          ticks: {
            color: '#D1D5DB',
            callback: (value) => `$${value}`,
          },
        },
        x: {
          title: {
            display: true,
            text: 'Categories',
            color: '#D1D5DB',
          },
          ticks: {
            color: '#D1D5DB',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#D1D5DB',
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.parsed.y}`,
          },
          backgroundColor: '#1F2937',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
        },
      },
    },
  });
  console.log('Bar Chart initialized with data:', barChartInstance.data);
};

// Debounce the watch to prevent excessive updates
let watchTimeout;
watch(() => finesStore.fines, () => {
  clearTimeout(watchTimeout);
  watchTimeout = setTimeout(() => {
    initializeBarChart();
    console.log('Fines updated, reinitializing bar chart');
  }, 300); // 300ms debounce
}, { deep: true });
</script>

<style scoped>
/* No changes needed to existing styles */
</style>