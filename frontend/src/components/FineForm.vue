<template>
  <form
    @submit.prevent="submit"
    class="bg-white shadow-lg rounded-lg p-6 border border-gray-200"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Employee Name</label>
        <input
          v-model="form.name"
          type="text"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Description</label>
        <textarea
          v-model="form.description"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          rows="3"
        ></textarea>
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Category</label>
        <select
          v-model="form.category"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        >
          <option value="Attendance">Attendance</option>
          <option value="Conduct">Conduct</option>
          <option value="Performance">Performance</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Fine Value ($)</label>
        <input
          v-model.number="form.value"
          type="number"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        />
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Date</label>
        <input
          v-model="form.date"
          type="date"
          disabled
          class="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 text-gray-700 cursor-not-allowed transition duration-200"
          required
        />
        <p class="text-xs text-gray-500 mt-1">Auto-filled with today's date</p>
      </div>
      <div class="mb-4">
        <label class="block text-gray-800 font-medium mb-1">Status</label>
        <select
          v-model="form.status"
          class="w-full border-gray-300 rounded-lg p-2 bg-gray-100 text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
          required
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>
    </div>
    <button
      type="submit"
      class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold mt-4"
    >
      Submit
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps(['fine']);
const emit = defineEmits(['submit']);

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const form = ref({
  name: props.fine?.name || '',
  description: props.fine?.description || '',
  category: props.fine?.category || 'Attendance',
  value: props.fine?.value || 0,
  date: props.fine?.date || getTodayDate(),
  status: props.fine?.status || 'pending',
});

const submit = () => {
  emit('submit', form.value);
};
</script>