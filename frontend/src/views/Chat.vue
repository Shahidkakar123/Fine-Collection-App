<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden" style="height: calc(100vh - 72px)">

    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside class="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">

      <!-- Sidebar header -->
      <div class="px-4 py-4 border-b border-gray-100">
        <h2 class="text-lg font-bold text-gray-900">Messages</h2>
        <p class="text-xs text-gray-500 mt-0.5">{{ authStore.role === 'pd' ? 'Project Director' : authStore?.user?.username }}</p>
      </div>

      <!-- Broadcast (PD only or read for all) -->
      <div class="px-3 pt-3">
        <button
          @click="chatStore.openBroadcasts()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
          :class="chatStore.activeChatType === 'broadcast'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'"
        >
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="chatStore.activeChatType === 'broadcast' ? 'bg-blue-500' : 'bg-blue-100'">
            <svg class="w-4 h-4" :class="chatStore.activeChatType === 'broadcast' ? 'text-white' : 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="font-semibold text-sm">Announcements</p>
            <p class="text-xs opacity-70 truncate">
              {{ chatStore.activeChatType === 'broadcast' ? 'Broadcast to all' : 'All employees' }}
            </p>
          </div>
          <span v-if="chatStore.unreadBroadcast > 0"
            class="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
            {{ chatStore.unreadBroadcast }}
          </span>
        </button>
      </div>

      <!-- Section label -->
      <div class="px-4 pt-4 pb-1">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {{ authStore.role === 'pd' ? 'Employees' : 'Project Director' }}
        </p>
      </div>

      <!-- User list -->
      <div class="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        <button
          v-for="user in chatStore.users"
          :key="user._id"
          @click="chatStore.openConversation(user._id)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
          :class="chatStore.activeUserId === user._id && chatStore.activeChatType === 'direct'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 hover:bg-gray-100'"
        >
          <!-- Avatar with online dot -->
          <div class="relative flex-shrink-0">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
              :class="chatStore.activeUserId === user._id && chatStore.activeChatType === 'direct'
                ? 'bg-blue-500 text-white'
                : user.role === 'pd' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'">
              {{ user.username.slice(0, 2).toUpperCase() }}
            </div>
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              :class="[
                chatStore.isOnline(user._id) ? 'bg-green-400' : 'bg-gray-300',
                chatStore.activeUserId === user._id && chatStore.activeChatType === 'direct' ? 'border-blue-600' : 'border-white'
              ]">
            </span>
          </div>

          <!-- Name & last seen -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm truncate">{{ user.username }}</p>
            <p class="text-xs opacity-60 truncate">
              {{ chatStore.isOnline(user._id) ? 'Online' : chatStore.lastSeen(user._id) }}
            </p>
          </div>

          <!-- Unread badge -->
          <span v-if="chatStore.unreadDirect[user._id]"
            class="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
            {{ chatStore.unreadDirect[user._id] }}
          </span>
        </button>

        <!-- Empty state -->
        <div v-if="!chatStore.users.length" class="text-center py-8">
          <p class="text-sm text-gray-400">No users available</p>
        </div>
      </div>
    </aside>

    <!-- ── Main chat area ──────────────────────────────────────────────────── -->
    <main class="flex-1 flex flex-col min-w-0 bg-white">

      <!-- No conversation selected -->
      <div v-if="!chatStore.activeUserId && chatStore.activeChatType !== 'broadcast'"
        class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div class="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 mb-1">Select a conversation</h3>
        <p class="text-sm text-gray-400">Choose a user from the sidebar to start chatting</p>
      </div>

      <!-- Chat header -->
      <div v-else class="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
              :class="chatStore.activeChatType === 'broadcast'
                ? 'bg-blue-100 text-blue-600'
                : chatStore.activeUser?.role === 'pd' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'">
              {{ chatStore.activeChatType === 'broadcast' ? '📢' : chatStore.activeUser?.username?.slice(0, 2).toUpperCase() }}
            </div>
            <span v-if="chatStore.activeChatType === 'direct'"
              class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
              :class="chatStore.isOnline(chatStore.activeUserId) ? 'bg-green-400' : 'bg-gray-300'">
            </span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 text-sm">
              {{ chatStore.activeChatType === 'broadcast' ? 'Announcements' : chatStore.activeUser?.username }}
            </h3>
            <p class="text-xs text-gray-400">
              {{ chatStore.activeChatType === 'broadcast'
                ? 'Broadcast to all employees'
                : chatStore.isOnline(chatStore.activeUserId) ? 'Online' : 'Last seen ' + chatStore.lastSeen(chatStore.activeUserId) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Messages area -->
      <div v-if="chatStore.activeUserId || chatStore.activeChatType === 'broadcast'"
        ref="messageContainer"
        class="flex-1 overflow-y-auto px-6 py-4 space-y-1"
        style="background: #f9fafb">

        <div v-if="chatStore.loading" class="flex justify-center py-8">
          <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Empty conversation -->
        <div v-else-if="!chatStore.activeMessages.length" class="flex flex-col items-center justify-center h-full text-center">
          <p class="text-sm text-gray-400">No messages yet. Say hello!</p>
        </div>

        <!-- Message groups -->
        <template v-else>
          <div v-for="(msg, index) in chatStore.activeMessages" :key="msg._id">
            <!-- Date separator -->
            <div v-if="showDateSeparator(index)" class="flex items-center gap-3 my-4">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-xs text-gray-400 font-medium px-2">{{ formatDate(msg.createdAt) }}</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            <!-- Message bubble -->
            <div class="flex gap-3 group"
              :class="isMyMessage(msg) ? 'flex-row-reverse' : 'flex-row'"
              :style="isSameAuthor(index) ? 'margin-top: 2px' : 'margin-top: 12px'">

              <!-- Avatar (only for first in a group) -->
              <div class="flex-shrink-0 w-8"
                :class="{ 'invisible': isSameAuthor(index) }">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  :class="isMyMessage(msg) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'">
                  {{ msg.senderName?.slice(0, 2).toUpperCase() }}
                </div>
              </div>

              <!-- Bubble + meta -->
              <div class="flex flex-col max-w-xs lg:max-w-md"
                :class="isMyMessage(msg) ? 'items-end' : 'items-start'">

                <!-- Sender name (only for first in group, and not my own) -->
                <span v-if="!isSameAuthor(index) && !isMyMessage(msg)"
                  class="text-xs text-gray-500 font-medium mb-1 ml-1">
                  {{ msg.senderName }}
                  <span v-if="msg.isBroadcast" class="ml-1 text-blue-500 text-xs">· Announcement</span>
                </span>

                <div class="flex items-end gap-1.5" :class="isMyMessage(msg) ? 'flex-row-reverse' : 'flex-row'">
                  <!-- Bubble -->
                  <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words"
                    :class="[
                      isMyMessage(msg)
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : msg.isBroadcast
                          ? 'bg-amber-50 text-gray-800 border border-amber-200 rounded-tl-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                    ]">
                    {{ msg.content }}
                  </div>

                  <!-- Time + read receipt -->
                  <div class="flex items-center gap-1 mb-0.5">
                    <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatTime(msg.createdAt) }}</span>
                    <!-- Read receipt for sent messages — always visible, clear SVG ticks -->
                    <span v-if="isMyMessage(msg) && !msg.isBroadcast" class="flex items-center"
                      :class="isReadByReceiver(msg) ? 'text-blue-400' : 'text-gray-300'">
                      <!-- Single tick: sent. Double tick: delivered+read (blue) -->
                      <svg v-if="!isReadByReceiver(msg)" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span v-else class="relative inline-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:-6px">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Input area -->
      <div v-if="chatStore.activeUserId || chatStore.activeChatType === 'broadcast'"
        class="px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">

        <!-- Broadcast notice for employees -->
        <div v-if="chatStore.activeChatType === 'broadcast' && authStore.role !== 'pd'"
          class="text-center text-sm text-gray-400 py-2">
          Only the Project Director can send announcements.
        </div>

        <!-- Broadcast compose for PD -->
        <div v-else-if="chatStore.activeChatType === 'broadcast' && authStore.role === 'pd'">
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
            </svg>
            <p class="text-xs text-amber-700">This message will be sent to <strong>all employees</strong></p>
          </div>
          <div class="flex gap-3">
            <textarea
              v-model="inputText"
              @keydown.enter.exact.prevent="handleSend"
              placeholder="Write an announcement..."
              rows="2"
              class="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            ></textarea>
            <button @click="handleSend" :disabled="!inputText.trim() || sending"
              class="self-end px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2">
              <svg v-if="!sending" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Broadcast
            </button>
          </div>
        </div>

        <!-- Direct message input -->
        <div v-else class="flex gap-3 items-end">
          <textarea
            v-model="inputText"
            @keydown.enter.exact.prevent="handleSend"
            :placeholder="`Message ${chatStore.activeUser?.username || ''}...`"
            rows="1"
            class="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            style="min-height: 44px; max-height: 120px"
            @input="autoResize"
            ref="inputRef"
          ></textarea>
          <button @click="handleSend" :disabled="!inputText.trim() || sending"
            class="self-end px-5 py-2.5 bg-green-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 flex-shrink-0">
            <svg v-if="!sending" class="w-12 h-6 rotate-100" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
      
          </button>
        </div>
        <p v-if="authStore.role === 'pd' || authStore.role === 'admin'" class="text-xs text-gray-400 mt-1.5">Press Enter to send · Shift+Enter for new line</p>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useChatStore } from '../store/chat';
import { useAuthStore } from '../store/auth';

const chatStore  = useChatStore();
const authStore  = useAuthStore();
const inputText  = ref('');
const sending    = ref(false);
const messageContainer = ref(null);
const inputRef   = ref(null);

onMounted(async () => {
  console.log('Initializing chat...',authStore);
    console.log('Initializing chat...',chatStore);

  chatStore.initPusher();
  await chatStore.loadUsers();
  await chatStore.loadPresence();
  await chatStore.loadUnread();
  await chatStore.openFirstUnread();
  await chatStore.setOnline(true);
});

onUnmounted(async () => {
  await chatStore.setOnline(false);
  chatStore.disconnectPusher();
});

// Auto-scroll when messages change
watch(() => chatStore.activeMessages.length, async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
});

// Also scroll when switching conversations
watch(() => chatStore.activeUserId, async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
  inputText.value = '';
  if (inputRef.value) inputRef.value.style.height = '44px';
});

async function handleSend() {
  if (!inputText.value.trim() || sending.value) return;
  sending.value = true;
  const text = inputText.value.trim();
  inputText.value = '';
  try {
    if (chatStore.activeChatType === 'broadcast') {
      await chatStore.sendBroadcast(text);
    } else {
      await chatStore.sendMessage(text);
    }
  } catch (e) {
    inputText.value = text;
  } finally {
    sending.value = false;
    if (inputRef.value) inputRef.value.style.height = '44px';
  }
}

function autoResize(e) {
  e.target.style.height = '44px';
  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
}

function isMyMessage(msg) {
  return msg.senderId?._id === authStore.user?.id || msg.senderId === authStore.user?.id;
}

function isReadByReceiver(msg) {
  const receiverId = msg.receiverId?._id || msg.receiverId;
  return msg.readBy?.includes(receiverId);
}

function isSameAuthor(index) {
  const messages = chatStore.activeMessages;
  if (index === 0) return false;
  const current  = messages[index];
  const previous = messages[index - 1];
  const currentSender  = current.senderId?._id  || current.senderId;
  const previousSender = previous.senderId?._id || previous.senderId;
  return currentSender === previousSender;
}

function showDateSeparator(index) {
  const messages = chatStore.activeMessages;
  if (index === 0) return true;
  const current  = new Date(messages[index].createdAt).toDateString();
  const previous = new Date(messages[index - 1].createdAt).toDateString();
  return current !== previous;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d   = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>
