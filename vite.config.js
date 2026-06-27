import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";

function decoratorPreset(options) {
    return {
        preset: () => ({
            plugins: [["@babel/plugin-proposal-decorators", options]],
        }),
        rolldown: {
            // Only run Babel on files that actually contain decorators
            filter: { code: "@" },
        },
    };
}
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        babel({ presets: [decoratorPreset({ version: "2023-11" })] }),
    ],
    server: {
        port: 3000,
    },
});
