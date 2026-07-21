<template>
  <div class="min-h-screen bg-gray-100 text-gray-900 transition-all duration-300 flex flex-col">
    <NotificationCenter />
    <Navbar />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import NotificationCenter from './components/NotificationCenter.vue';
import Footer from './components/Footer.vue';

export default {
  components: { Navbar, NotificationCenter, Footer },
};
</script>