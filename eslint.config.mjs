import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
const config = [...nextVitals, ...nextTs, { ignores: ["**/node_modules/**", "**/.next/**", "**/.next-dev/**", "**/next-env.d.ts", "coverage/**", "data/local/**", "output/**", "**/test-results/**", "**/playwright-report/**"] }, { settings: { next: { rootDir: "apps/web/" } } }];
export default config;
