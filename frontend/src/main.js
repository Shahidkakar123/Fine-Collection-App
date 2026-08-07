import { createApp } from "vue";
import { createPinia } from "pinia";
import axios from "axios";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./store/auth";

import "./assets/tailwind.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);

  const authStore = useAuthStore(pinia);
  axios.interceptors.request.use((config) => {
    const token = authStore.token || localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authStore.logout();
        router.push('/login');
      }
      return Promise.reject(error);
    },
  );
  await authStore.initializeAuth();

  app.mount("#app");
}

bootstrap();
