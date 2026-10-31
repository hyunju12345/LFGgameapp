import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((v) => v && !v.internal && v.family === "IPv4");
const ip =
  addresses.find(
    (v) => v.address.startsWith("192.168.") || v.address.startsWith("10."),
  )?.address ||
  addresses[0]?.address ||
  "localhost";
const port = process.env.PORT || "8787";
const env = {
  ...process.env,
  EXPO_PUBLIC_API_URL:
    process.env.EXPO_PUBLIC_API_URL || `http://${ip}:${port}`,
};
console.log(
  `PartyUp API: ${env.EXPO_PUBLIC_API_URL}\nPhone and computer must share a Wi-Fi network.\nFor browser-only testing: npm run dev -- --web`,
);
const api = spawn(process.execPath, ["server/server.mjs"], {
  cwd: root,
  env,
  stdio: "inherit",
});
const expo = spawn(
  process.execPath,
  ["node_modules/expo/bin/cli", "start", "--lan", ...process.argv.slice(2)],
  { cwd: root, env, stdio: "inherit" },
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  api.kill("SIGTERM");
  expo.kill("SIGTERM");
  setTimeout(() => process.exit(code), 300).unref();
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
api.on("exit", (code) => stop(code || 0));
expo.on("exit", (code) => stop(code || 0));
