import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuthStore } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore();

  // Helpers: normalize ids and dedupe messages robustly
  const normalizeId = (id) => {
    if (id === null || id === undefined) return id;
    if (typeof id === 'object') return id._id || String(id);
    return String(id);
  };

  const dedupeById = (arr) => {
    const seen = new Set();
    return (arr || []).filter(m => {
      const id = normalizeId(m._id);
      if (!id) return true; // keep messages without id (rare)
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  // ── State ────────────────────────────────────────────────────────────────────
  const pusherClient     = ref(null);
  const users            = ref([]);
  const activeUserId     = ref(null);
  const conversations    = ref({});
  const broadcasts       = ref([]);
  const unreadDirect     = ref({});
  const unreadBroadcast  = ref(0);
  const presence         = ref({});
  const activeChatType   = ref('direct');
  const loading          = ref(false);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const totalUnread = computed(() => {
    const direct = Object.values(unreadDirect.value).reduce((a, b) => a + b, 0);
    return direct + unreadBroadcast.value;
  });

  const activeMessages = computed(() => {
    if (activeChatType.value === 'broadcast') return broadcasts.value;
    if (!activeUserId.value) return [];
    return conversations.value[activeUserId.value] || [];
  });

  const activeUser = computed(() => users.value.find(u => u._id === activeUserId.value));

  function pruneUnreadDirectToVisibleUsers() {
    if (!users.value.length) return;
    const visibleUserIds = new Set(users.value.map(user => user._id));
    unreadDirect.value = Object.fromEntries(
      Object.entries(unreadDirect.value).filter(([userId]) => visibleUserIds.has(userId))
    );
  }

  // ── Pusher ────────────────────────────────────────────────────────────────────
  function initPusher() {
    if (pusherClient.value) return;
    const myId = authStore.user?.id;
    if (!myId) return;

    const pusherKey = import.meta.env.VITE_PUSHER_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;
    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher is not configured. Real-time chat updates are disabled.');
      return;
    }

    pusherClient.value = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const myChannel = pusherClient.value.subscribe(`user-${myId}`);

    myChannel.bind('new-message', (msg) => {
      // Normalise IDs — populated objects vs raw strings
      const senderId   = normalizeId(typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId);
      const receiverId = normalizeId(typeof msg.receiverId === 'object' ? msg.receiverId._id : msg.receiverId);
      msg._id = normalizeId(msg._id);

      // The "other person" in this conversation from MY perspective
      const otherId = senderId === myId ? receiverId : senderId;

      if (!conversations.value[otherId]) conversations.value[otherId] = [];

      // Deduplicate by _id
      const exists = conversations.value[otherId].some(m => normalizeId(m._id) === msg._id);
      if (exists) return;

      // Also remove any optimistic entry that looks identical (same content + createdAt)
      conversations.value[otherId] = conversations.value[otherId].filter(m => {
        if (m._optimistic) {
          const sameContent = (m.content || '').trim() === (msg.content || '').trim();
          const mTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
          const msgTime = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
          if (sameContent && Math.abs(mTime - msgTime) < 3000) return false;
        }
        return true;
      });

      // Add message — this updates the chat window instantly for BOTH sender and receiver
      conversations.value[otherId] = [...conversations.value[otherId], msg];

      // Only increment unread badge if the message is FROM someone else
      // AND that conversation is not currently open
      if (senderId !== myId && activeUserId.value !== senderId) {
        unreadDirect.value = {
          ...unreadDirect.value,
          [senderId]: (unreadDirect.value[senderId] || 0) + 1,
        };
      }
    });

    myChannel.bind('messages-read', ({ byUserId }) => {
      if (conversations.value[byUserId]) {
        conversations.value[byUserId] = conversations.value[byUserId].map(m => {
          if (!m.readBy.includes(byUserId)) {
            return { ...m, readBy: [...m.readBy, byUserId] };
          }
          return m;
        });
      }
    });

    // Broadcast channel
    const broadcastChannel = pusherClient.value.subscribe('broadcast-channel');
    broadcastChannel.bind('new-broadcast', (msg) => {
      const exists = broadcasts.value.some(m => m._id === msg._id);
      if (!exists) broadcasts.value = [...broadcasts.value, msg];
      if (activeChatType.value !== 'broadcast') {
        unreadBroadcast.value = unreadBroadcast.value + 1;
      }
    });

    // Presence channel
    const presenceChannel = pusherClient.value.subscribe('presence-channel');
    presenceChannel.bind('presence-update', ({ userId, isOnline, lastSeen }) => {
      presence.value = { ...presence.value, [userId]: { isOnline, lastSeen } };
    });
  }

  function disconnectPusher() {
    if (pusherClient.value) {
      pusherClient.value.disconnect();
      pusherClient.value = null;
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function loadUsers() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/users`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      users.value = res.data.filter(user => user.emailVerified !== false);
      pruneUnreadDirectToVisibleUsers();
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const refreshUsersIfVisible = () => {
      if (authStore.token) {
        loadUsers();
      }
    };

    const handleStorageRefresh = (event) => {
      if (event.key === 'user-list-refresh') {
        refreshUsersIfVisible();
      }
    };

    window.addEventListener('user-list-refresh', refreshUsersIfVisible);
    window.addEventListener('storage', handleStorageRefresh);
  }

  async function loadPresence() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/presence`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      const map = {};
      res.data.forEach(p => { map[p.userId] = { isOnline: p.isOnline, lastSeen: p.lastSeen }; });
      presence.value = map;
    } catch (err) {
      console.error('Failed to load presence:', err);
    }
  }

  async function setOnline(isOnline) {
    try {
      await axios.post(`${API_BASE_URL}/api/messages/presence`,
        { isOnline },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
    } catch (err) {
      console.error('Failed to update presence:', err);
    }
  }

  async function loadUnread() {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/unread`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      unreadDirect.value    = res.data.direct    || {};
      unreadBroadcast.value = res.data.broadcast || 0;
      pruneUnreadDirectToVisibleUsers();
    } catch (err) {
      console.error('Failed to load unread:', err);
    }
  }

  async function openConversation(userId) {
    activeChatType.value = 'direct';
    activeUserId.value   = userId;
    loading.value        = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/conversation/${userId}`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      conversations.value[userId] = res.data;
      const updated = { ...unreadDirect.value };
      delete updated[userId];
      unreadDirect.value = updated;
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      loading.value = false;
    }
  }

  async function openBroadcasts() {
    activeChatType.value  = 'broadcast';
    activeUserId.value    = null;
    loading.value         = true;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/messages/broadcasts`, {
        headers: { Authorization: `Bearer ${authStore.token}` },
      });
      broadcasts.value = res.data;
      unreadBroadcast.value = 0;
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    } finally {
      loading.value = false;
    }
  }

  async function openFirstUnread() {
    const firstUnreadUserId = Object.keys(unreadDirect.value)[0];
    if (firstUnreadUserId) {
      await openConversation(firstUnreadUserId);
      return;
    }

    if (unreadBroadcast.value > 0) {
      await openBroadcasts();
    }
  }

  async function sendMessage(content) {
    if (!content.trim() || !activeUserId.value) return;
    const myId       = authStore.user?.id;
    const receiverId = activeUserId.value;

    // ── Optimistic update ────────────────────────────────────────────────────
    // Add message to local state IMMEDIATELY so sender sees it without waiting
    // for Pusher. Pusher echo will be deduplicated by _id when it arrives.
    const tempMsg = {
      _id:         `temp-${Date.now()}`,
      senderId:    { _id: myId, username: authStore.user?.username, role: authStore.role },
      receiverId:  { _id: receiverId },
      senderName:  authStore.user?.username,
      content:     content.trim(),
      isBroadcast: false,
      readBy:      [myId],
      createdAt:   new Date().toISOString(),
      _optimistic: true,
    };

    if (!conversations.value[receiverId]) conversations.value[receiverId] = [];
    conversations.value[receiverId] = [...conversations.value[receiverId], tempMsg];

    try {
      const res = await axios.post(`${API_BASE_URL}/api/messages/send`,
        { receiverId, content },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      // Replace the optimistic temp message with the real one from server
      conversations.value[receiverId] = conversations.value[receiverId].map(m =>
        m._optimistic ? res.data : m
      );

      // Ensure we don't end up with duplicates (e.g., Pusher already pushed the server message)
      conversations.value[receiverId] = dedupeById(conversations.value[receiverId]);
    } catch (err) {
      // Roll back optimistic message on failure
      conversations.value[receiverId] = conversations.value[receiverId].filter(m => !m._optimistic);
      console.error('Failed to send message:', err);
      throw err;
    }
  }

  async function sendBroadcast(content) {
    if (!content.trim()) return;
    const myId = authStore.user?.id;

    // Optimistic update for broadcast too
    const tempMsg = {
      _id:         `temp-${Date.now()}`,
      senderId:    { _id: myId, username: authStore.user?.username, role: authStore.role },
      senderName:  authStore.user?.username,
      content:     content.trim(),
      isBroadcast: true,
      readBy:      [myId],
      createdAt:   new Date().toISOString(),
      _optimistic: true,
    };
    broadcasts.value = [...broadcasts.value, tempMsg];

    try {
      const res = await axios.post(`${API_BASE_URL}/api/messages/broadcast`,
        { content },
        { headers: { Authorization: `Bearer ${authStore.token}` } }
      );
      broadcasts.value = broadcasts.value.map(m => m._optimistic ? res.data : m);
    } catch (err) {
      broadcasts.value = broadcasts.value.filter(m => !m._optimistic);
      console.error('Failed to broadcast:', err);
      throw err;
    }
  }

  function isOnline(userId) {
    return presence.value[userId]?.isOnline || false;
  }

  function lastSeen(userId) {
    const ls = presence.value[userId]?.lastSeen;
    if (!ls) return 'Never';
    const d    = new Date(ls);
    const now  = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  }

  // Reset all state on logout — required for setup stores since $reset() doesn't work
  function resetStore() {
    disconnectPusher();
    users.value           = [];
    activeUserId.value    = null;
    conversations.value   = {};
    broadcasts.value      = [];
    unreadDirect.value    = {};
    unreadBroadcast.value = 0;
    presence.value        = {};
    activeChatType.value  = 'direct';
    loading.value         = false;
  }

  return {
    users, activeUserId, conversations, broadcasts,
    unreadDirect, unreadBroadcast, totalUnread,
    presence, activeChatType, loading,
    activeMessages, activeUser,
    initPusher, disconnectPusher, resetStore,
    loadUsers, loadPresence, setOnline, loadUnread,
    openConversation, openBroadcasts, openFirstUnread,
    sendMessage, sendBroadcast,
    isOnline, lastSeen,
  };
});
