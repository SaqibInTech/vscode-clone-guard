#!/usr/bin/env node
// clone-guard: scan a freshly cloned repo for "runs the moment you open it" traps.
// Flags the patterns behind the Oct 2026 GhostAction + npm-worm waves. Read-only.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename, relative } from "node:path";

const root = process.argv[2] || ".";
const findings = [];
const add = (sev, file, msg) => findings.push({ sev, file, msg });

const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    const s = statSync(p);
    s.isDirectory() ? walk(p) : inspect(p);
  }
};

const SCRIPT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".py", ".sh"]);
const DISGUISE_EXT = new Set([".woff2", ".woff", ".ttf", ".png", ".jpg", ".ico", ".dat", ".bin"]);

const inspect = (p) => {
  const rel = relative(root, p);
  const base = basename(p);
  let text = "";
  try { text = readFileSync(p, "utf8"); } catch { return; }

  // 1) Editor/agent configs that run commands automatically
  if (base === "tasks.json" && /folderOpen/.test(text))
    add("HIGH", rel, 'VS Code task runs on folderOpen — executes when you open the folder');
  if (p.includes(".claude") && base === "settings.json" && /"hooks"/.test(text))
    add("HIGH", rel, "Claude Code hook — runs a shell command on session events");
  if (base === ".mcp.json" || (extname(base) === ".json" && /enableAllProjectMcpServers/.test(text)))
    add("MED", rel, "Project MCP servers may auto-start without a prompt");

  // 2) A binary/asset extension that is really a script
  if (DISGUISE_EXT.has(extname(base).toLowerCase()) && /\b(require|import|exec|child_process|https?:|curl|bash)\b/.test(text))
    add("HIGH", rel, `"${extname(base)}" file contains code — a script wearing a costume`);

  // 3) package.json lifecycle scripts that invoke an odd file
  if (base === "package.json") {
    try {
      const s = JSON.parse(text).scripts || {};
      for (const [k, v] of Object.entries(s))
        if (/^(pre|post)?install$/.test(k) && /\.(woff2?|ttf|png|dat|bin)\b/.test(v))
          add("HIGH", rel, `${k} script runs a disguised asset: ${v}`);
    } catch {}
  }
};

try { walk(root); } catch (e) { console.error("cannot scan:", e.message); process.exit(2); }

const order = { HIGH: 0, MED: 1 };
findings.sort((a, b) => order[a.sev] - order[b.sev]);
if (!findings.length) {
  console.log("clone-guard: no auto-run traps found ✓");
  process.exit(0);
}
const C = { HIGH: "\x1b[31m", MED: "\x1b[33m", r: "\x1b[0m", d: "\x1b[2m" };
console.log(`\nclone-guard found ${findings.length} thing(s) that can run before you read a line of code:\n`);
for (const f of findings)
  console.log(`  ${C[f.sev]}${f.sev}${C.r}  ${f.file}\n        ${C.d}${f.msg}${C.r}`);
console.log(`\nDo NOT open this folder in a trusted editor until you've read these files.\n`);
process.exit(1);
