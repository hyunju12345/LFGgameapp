import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const result = spawnSync(process.execPath, ["node_modules/expo/bin/cli", "export", "--platform", "web", "--output-dir", "dist-pages"], {
  stdio: "inherit", env: { ...process.env, EXPO_BASE_URL: "/LFGgameapp", EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || "" },
});
if (result.status !== 0) process.exit(result.status || 1);
writeFileSync("dist-pages/.nojekyll", "");
copyFileSync("dist-pages/index.html", "dist-pages/404.html");
// Serve the SPA at each fixed route, including direct links and page refreshes.
function routes(folder, parts = []) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) routes(path.join(folder, entry.name), entry.name.startsWith("(") ? parts : [...parts, entry.name]);
    else if (/\.tsx$/.test(entry.name) && !/^[+_]/.test(entry.name) && !parts.some(part => part.includes("[")) && !entry.name.includes("[")) {
      const route = [...parts, entry.name.replace(/\.tsx$/, "")].filter(part => part !== "index").join("/");
      if (!route) continue;
      const target = path.join("dist-pages", route);
      mkdirSync(target, { recursive: true });
      copyFileSync("dist-pages/index.html", path.join(target, "index.html"));
    }
  }
}
routes("src/app");
console.log("GitHub Pages site ready in dist-pages/");
