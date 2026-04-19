<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 transition-all duration-300">
    <NotificationCenter />
    <Navbar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import NotificationCenter from './components/NotificationCenter.vue';

export default {
  components: { Navbar, NotificationCenter },
};
</script>