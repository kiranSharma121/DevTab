import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import {crx} from "@crxjs/vite-plugin";
import manifest from "./Manifest.json" with {type:"json"};
export default defineConfig({
  base:"./",
  plugins: [
    react(),
    crx({manifest})
  ]
});
