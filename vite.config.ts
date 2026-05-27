import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/crime-mapper/",// /crime/ for maps.raleighnc.gov, /crime-mapper/ for GitHub
  // server: {
  //   proxy: {
  //     "/crime-mapper/api": {
  //       target: "http://localhost:5050",
  //       changeOrigin: true,
  //       secure: false,
  //       rewrite: (path) => path.replace(/^\/crime-mapper\/api/, '/api'),
  //     },
  //   },
  // },
});
