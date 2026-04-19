<template>
  <div class="fixed top-20 right-4 z-9999 space-y-3 pointer-events-none">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="getNotificationClass(notification.type)"
        class="pointer-events-auto rounded-lg shadow-lg p-4 max-w-sm animate-slideIn"
      >
        <div class="flex items-start gap-3">
          <span class="text-xl">
            {{ getNotificationIcon(notification.type) }}
          </span>
          <div class="flex-1">
            <p class="font-medium text-sm">{{ notification.message }}</p>
          </div>
          <button
            @click="notificationStore.removeNotification(notification.id)"
            class="text-lg flex-shrink-0 opacity-70 hover:opacity-100 transition"
          >
            ✕
          </button>
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
    success: 'bg-green-100 text-green-800 border border-green-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  };
  return classes[type] || classes.info;
};

const getNotificationIcon = (type) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  return icons[type] || icons.info;
};
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
</style>
