<template>
  <div
    class="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group"
  >
    <h3 class="text-xl font-bold text-white group-hover:text-secondary transition-colors duration-200">
      {{ fine.name }}
    </h3>
    <p class="text-gray-400 mt-2">{{ fine.description }}</p>
    <p class="text-gray-400 mt-1">Category: {{ fine.category }}</p>
    <p class="text-secondary font-bold text-lg mt-2">${{ fine.value }}</p>
    <div class="mt-4 flex space-x-3">
      <button
        @click="$emit('edit', fine)"
        class="bg-primary text-white px-4 py-2 rounded-full hover:bg-blue-500 transition-all duration-300 transform hover:scale-105"
      >
        Edit
      </button>
      <button
        @click="$emit('delete', fine._id)"
        class="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-500 transition-all duration-300 transform hover:scale-105"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps(['fine']);
defineEmits(['edit', 'delete']);
</script>