import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      assetsInclude: ["/*.png", "/.jpg", "**/.jpeg", "*/.svg"],
      server: {
        host: true, // Allows access from the local network
        port: 5173, // Default port; change if needed
        strictPort: true, // Exit if the port is already in use
        open: true, // Automatically open the app in the browser
        hmr: {
          // Configure HMR settings if needed
          overlay: true, // Show overlay for errors
        },
        cors: true, // Enable CORS if required
      },
    },
  },
});
