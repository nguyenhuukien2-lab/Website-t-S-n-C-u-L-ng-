import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'smashcourt-dev-info',
      configResolved(config) {
        if (config.command === 'serve') {
          // Chỉ chạy ở dev mode
        }
      },
      transformIndexHtml(html) {
        // Inject thông tin khởi động vào index.html
        const message = `
        <script>
          console.log('%c🎾 SMASHCOURT PRO - DEVELOPMENT MODE', 'font-size: 16px; color: #00ff00; font-weight: bold; background: #000; padding: 10px;');
          console.log('%c👨‍💼 Admin:     http://localhost:5174/admin', 'font-size: 14px; color: #0088ff;');
          console.log('%c👤 Chủ sân:   http://localhost:5174/owner', 'font-size: 14px; color: #ff8800;');
          console.log('%c🧑‍💼 Nhân viên:  http://localhost:5174/staff', 'font-size: 14px; color: #88ff00;');
          console.log('%c👥 Khách:     http://localhost:5174', 'font-size: 14px; color: #ff00ff;');
        </script>
        `;
        return html.replace('<head>', `<head>${message}`);
      }
    }
  ],
})
