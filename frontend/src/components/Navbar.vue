<template>
  <nav class="bg-white shadow-md sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4">
      <div class="flex justify-between items-center">
        <router-link to="/" class="flex items-center">
          <h1 class="text-2xl font-bold text-primary">FineMate</h1>
        </router-link>

        <div class="flex items-center space-x-8">
          <router-link v-if="authStore.isAuthenticated" to="/dashboard"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium flex items-center gap-2"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/dashboard' }">
            <span class="text-lg">📊</span>
            <span class="truncate">Dashboard</span>
          </router-link>

          <router-link v-if="authStore.isAuthenticated && authStore.role === 'employee'" to="/timeline"
            class="relative text-gray-700 hover:text-primary transition duration-300 font-medium flex items-center gap-2"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/timeline' }"
            @click="markTimelineSeen">
            <span class="text-lg">📅</span>
            <span class="truncate">Timeline</span>
            <span v-if="finesStore.timelineUnreadCount > 0"
              class="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {{ finesStore.timelineUnreadCount > 99 ? '99+' : finesStore.timelineUnreadCount }}
            </span>
          </router-link>

          <router-link v-if="authStore.isAuthenticated && authStore.role === 'pd'" to="/fines"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium flex items-center gap-2"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/fines' }">
            <span class="text-lg">📋</span>
            <span class="truncate">Manage Fines</span>
          </router-link>

          <router-link v-if="authStore.isAuthenticated && authStore.role === 'pd'" to="/employees"
            class="text-gray-700 hover:text-primary transition duration-300 font-medium flex items-center gap-2"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/employees' }">
            <span class="text-lg">👥</span>
            <span class="truncate">Employees</span>
          </router-link>

          <!-- Chat link with unread badge -->
          <router-link v-if="authStore.isAuthenticated" to="/chat"
            class="relative text-gray-700 hover:text-primary transition duration-300 font-medium flex items-center gap-2"
            :class="{ 'text-primary border-b-2 border-primary': $route.path === '/chat' }">
            <span class="text-lg">💬</span>
            <span class="truncate">Chat</span>
            <span v-if="chatStore.totalUnread > 0"
              class="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{{
                chatStore.totalUnread > 99 ? '99+' : chatStore.totalUnread }}</span>
          </router-link>

          <!-- Account Menu -->
          <div v-if="authStore.isAuthenticated" class="relative">
            <button @click="toggleDropdown"
              class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary transition duration-300 font-medium">
              {{ authStore.role === 'pd' ? '👤 PD' : '👤 Account' }}
              <svg :class="{ 'rotate-180': isDropdownOpen }" class="w-4 h-4 transition duration-300" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3">
                </path>
              </svg>
            </button>

            <div v-show="isDropdownOpen"
              class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10">
              <div class="px-4 py-2 border-b border-gray-200">
                <p class="text-xs text-gray-500 uppercase tracking-wider">Account</p>
                <p class="font-semibold text-gray-900 mt-1 truncate max-w-[200px]" :title="authStore.user?.username">Name: <span class="text-primary">{{ authStore?.user?.username }}</span>
                </p>

                <p class="font-semibold text-gray-900 mt-1">Role: <span class="text-primary">{{ authStore.role }}</span>
                </p>
              </div>

              <button @click="logout"
                class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-800 transition duration-200 font-medium mt-2 border-t border-gray-200">🚪
                Logout</button>
            </div>
          </div>

          <router-link v-if="!authStore.isAuthenticated" to="/login"
            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold">Login</router-link>
        </div>
      </div>
    </div>
  </nav>

</template>

<script setup>
import { useAuthStore } from '../store/auth';
import { useChatStore } from '../store/chat';
import { useFinesStore } from '../store/fines';
import { useRouter } from 'vue-router';
import { ref, watch, onMounted, onUnmounted } from 'vue';

const authStore = useAuthStore();
const chatStore = useChatStore();
const finesStore = useFinesStore();
const router = useRouter();
const isDropdownOpen = ref(false);
const finesPollInterval = ref(null);

// Load unread count + start Pusher immediately after login
// so the badge shows on the navbar without visiting the chat page
async function initChat() {
  if (authStore.isAuthenticated) {
    if (!authStore.user?.username) {
      try {
        await authStore.refreshToken();
      } catch (err) {
        console.warn('Auth refresh failed:', err);
      }
    }
    await chatStore.loadUsers();
    await chatStore.loadUnread();
    chatStore.initPusher();
  }
}

const stopTimelineBadge = () => {
  if (!finesPollInterval.value) return;
  window.clearInterval(finesPollInterval.value);
  finesPollInterval.value = null;
};

const initTimelineBadge = async () => {
  if (!authStore.isAuthenticated || authStore.role !== 'employee') {
    stopTimelineBadge();
    return;
  }

  finesStore.hydrateTimelineSeen();
  await finesStore.fetchFines({ silent: true });
  finesStore.initFinePusher();

  if (!finesPollInterval.value) {
    finesPollInterval.value = window.setInterval(() => {
      if (authStore.isAuthenticated && authStore.role === 'employee') {
        finesStore.fetchFines({ silent: true });
      }
    }, 30000);
  }
};

onMounted(() => {
  initChat();
  initTimelineBadge();
});

// Re-init if auth changes (page refresh / session restore)
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    initChat();
    initTimelineBadge();
  } else {
    chatStore.disconnectPusher();
    finesStore.disconnectFinePusher();
    stopTimelineBadge();
  }
});

watch(() => authStore.role, () => {
  initTimelineBadge();
});

onUnmounted(() => {
  stopTimelineBadge();
});

const toggleDropdown = () => { isDropdownOpen.value = !isDropdownOpen.value; };

const markTimelineSeen = () => {
  finesStore.markTimelineFinesSeen();
};

const logout = () => {
  // Disconnect Pusher and reset all chat state before clearing auth
  // so the next user who logs in starts with a clean slate
  chatStore.resetStore();
  finesStore.disconnectFinePusher();
  stopTimelineBadge();
  authStore.logout();
  router.push('/login');
  isDropdownOpen.value = false;
};

if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const button = document.querySelector('nav button');
    if (button && !button.contains(e.target) && !e.target.closest('.relative')) {
      isDropdownOpen.value = false;
    }
  });
}
</script>
