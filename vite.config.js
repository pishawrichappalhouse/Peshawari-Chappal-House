import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        adminDashboard: resolve(__dirname, 'admin-dashboard.html'),
        login: resolve(__dirname, 'login.html'),
        profile: resolve(__dirname, 'profile.html'),
        shop: resolve(__dirname, 'shop.html'),
        signup: resolve(__dirname, 'signup.html')
      }
    }
  }
});
