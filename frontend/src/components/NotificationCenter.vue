<template>
  <div class="fixed top-20 right-4 z-[9999] space-y-3 pointer-events-none">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="getNotificationClass(notification.type)"
        class="pointer-events-auto rounded-xl shadow-lg p-4 max-w-sm"
      >
        <div class="flex items-center gap-2.5">
          <!-- Icon — SVG, sized to match text -->
          <svg v-if="notification.type === 'success'" class="w-4 h-4 flex-shrink-0 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else-if="notification.type === 'error'" class="w-4 h-4 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          <svg v-else-if="notification.type === 'warning'" class="w-4 h-4 flex-shrink-0 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          <svg v-else class="w-4 h-4 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
          </svg>

          <!-- Message — strip leading ✓ / ✕ chars added by callers -->
          <p class="flex-1 font-medium text-sm">{{ cleanMessage(notification.message) }}</p>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotificationStore } from '../store/notifications';

const notificationStore = useNotificationStore();

const getNotificationClass = (type) => {
  const classes = {
    success: 'bg-green-50 text-green-800 border border-green-200',
    error:   'bg-red-50 text-red-800 border border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    info:    'bg-blue-50 text-blue-800 border border-blue-200',
  };
  return classes[type] || classes.info;
};

// Strip leading ✓ ✕ ⚠ ℹ chars that callers sometimes prepend to messages
const cleanMessage = (msg) => {
  return (msg || '').replace(/^[✓✕⚠ℹ✗✘×]\s*/, '').trim();
};
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}
.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
