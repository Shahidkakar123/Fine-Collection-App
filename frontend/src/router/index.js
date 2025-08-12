import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import Login from '../views/login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import FinesList from '../views/FinesList.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
 {
  path: '/fines',
  component: FinesList,
  beforeEnter: (to, from, next) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated || authStore.role !== 'pd') next('/dashboard');
    else next();
  },
},
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;