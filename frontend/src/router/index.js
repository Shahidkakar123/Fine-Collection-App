import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import Login from '../views/login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import Timeline from '../views/Timeline.vue';
import FinesList from '../views/FinesList.vue';
import ForgotPassword from '../views/ForgotPassword.vue';
import ResetPassword from '../views/ResetPassword.vue';
import EmployeeManagement from '../views/EmployeeManagement.vue';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { 
    path: '/login', 
    component: Login,
    meta: { requiresGuest: true } // Only accessible if not logged in
  },
  { 
    path: '/register', 
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/timeline',
    component: Timeline,
    meta: { requiresAuth: true }, // Employees only (enforced in component)
  },
  {
    path: '/fines',
    component: FinesList,
    meta: { requiresAuth: true, requiresRole: 'pd' }, // PD only
  },
  {
    path: '/employees',
    component: EmployeeManagement,
    meta: { requiresAuth: true, requiresRole: 'pd' }, // PD only
  },
  {
    path: '/forgot-password',
    component: ForgotPassword,
    meta: { requiresGuest: true }
  },
  {
    path: '/reset-password/:token',
    component: ResetPassword,
    meta: { requiresGuest: true }
  },
  // Catch-all for 404
  { 
    path: '/:pathMatch(.*)*', 
    redirect: '/dashboard' 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // If route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login');
      return;
    }
    
    // If route requires specific role
    if (to.meta.requiresRole && authStore.role !== to.meta.requiresRole) {
      next('/dashboard');
      return;
    }
  }

  // If route is for guests only (login/register)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard');
    return;
  }

  next();
});

export default router;