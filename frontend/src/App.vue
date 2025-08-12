<template>
  <div class="min-h-screen bg-gray-900 text-white transition-all duration-300">
    <Navbar />
    <main class="container mx-auto p-6">
      <router-view />
    </main>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';

export default {
  components: { Navbar },
};
</script>