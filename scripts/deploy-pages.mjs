import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
function run(command, args, cwd = process.cwd(), capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.status !== 0) throw new Error(`${command} ${args[0]} failed`);
  return result.stdout?.trim();
}
run(process.execPath, ["scripts/export-pages.mjs"]);
const remote = run("git", ["remote", "get-url", "origin"], process.cwd(), true);
const name = run("git", ["config", "user.name"], process.cwd(), true);
const email = run("git", ["config", "user.email"], process.cwd(), true);
const directory = mkdtempSync(path.join(tmpdir(), "partyup-pages-"));
try {
  run("git", ["init", "-b", "gh-pages"], directory);
  run("git", ["remote", "add", "origin", remote], directory);
  run("git", ["config", "user.name", name], directory);
  run("git", ["config", "user.email", email], directory);
  const exists = spawnSync("git", ["ls-remote", "--exit-code", "--heads", remote, "gh-pages"], { stdio: "ignore" }).status;
  if (exists === 0) {
    run("git", ["fetch", "--depth", "1", "origin", "gh-pages"], directory);
    run("git", ["checkout", "-B", "gh-pages", "FETCH_HEAD"], directory);
  } else if (exists !== 2) throw new Error("Could not check deployment branch");
  for (const entry of readdirSync(directory)) if (entry !== ".git") rmSync(path.join(directory, entry), { recursive: true, force: true });
  cpSync(path.resolve("dist-pages"), directory, { recursive: true });
  run("git", ["add", "--all"], directory);
  if (spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: directory }).status !== 0) {
    run("git", ["commit", "-m", "Deploy PartyUp web app"], directory);
    run("git", ["-c", "http.version=HTTP/1.1", "push", "origin", "gh-pages"], directory);
  }
} finally { rmSync(directory, { recursive: true, force: true }); }
