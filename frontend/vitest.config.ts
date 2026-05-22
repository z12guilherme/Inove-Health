import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom', // Usa o ambiente JSDOM para simular um navegador
        globals: true, // Permite usar globals como describe, it, expect sem importá-los
    },
});