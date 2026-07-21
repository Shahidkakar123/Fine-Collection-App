<template>
  <footer class="border-t border-gray-200 bg-white mt-auto">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
      <p class="text-xs text-gray-400">
        © {{ currentYear }} Shahid Khan. All rights reserved.
      </p>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script>