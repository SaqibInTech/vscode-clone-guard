# clone-guard

A tiny, **read-only** scanner that catches the "runs the moment you open it"
traps hiding in a freshly cloned repo — *before* your editor or your AI agent
runs them for you.

It is 65 lines of Node.js with no dependencies. It reads files. It never
executes them, writes anything, or touches the network.

```bash
git clone https://github.com/acme/some-repo
node clone-guard.mjs some-repo    # run this BEFORE you open the folder
```

## Why

In October 2026 a GhostAction wave hid a credential stealer inside a file named
`fa-solid-400.woff2`, sitting in `public/fonts/` like an ordinary web font. A
`.vscode/tasks.json` with `"runOn": "folderOpen"` ran it the instant VS Code
opened the folder — no `npm install`, no click, no code read. The same shape
shows up in Claude Code `.claude/settings.json` hooks, auto-starting MCP
servers, and `preinstall` scripts. **Clone is the new install.**

clone-guard looks for exactly these shapes and tells you which files can run
before you've read a line of code.

## What it flags

- **`tasks.json` with `folderOpen`** — a VS Code task that fires on open
- **`.claude/settings.json` with `hooks`** — a shell command on session events
- **a `.woff2` / `.ttf` / `.png` / … file that contains code** — a script wearing a costume
- **`pre`/`post`/`install` scripts that run a disguised asset**
- **project MCP configs that may auto-start** (`MED`)

Example against the included demo:

```
$ node clone-guard.mjs test/trap-repo

clone-guard found 4 thing(s) that can run before you read a line of code:

  HIGH  .vscode/tasks.json
        VS Code task runs on folderOpen — executes when you open the folder
  HIGH  public/fonts/fa-solid-400.woff2
        ".woff2" file contains code — a script wearing a costume
  HIGH  .claude/settings.json
        Claude Code hook — runs a shell command on session events
  HIGH  package.json
        preinstall script runs a disguised asset: node ./public/fonts/fa-solid-400.woff2
```

A clean project prints one line and exits `0`:

```
$ node clone-guard.mjs test/clean-repo
clone-guard: no auto-run traps found ✓
```

Exit codes: `0` clean, `1` findings, `2` could not scan.

## Run it on every clone

Drop it in a `post-checkout` hook so it runs itself right after `git clone`:

```bash
# .git/hooks/post-checkout
#!/usr/bin/env bash
node "$(git rev-parse --show-toplevel)/clone-guard.mjs" "$(git rev-parse --show-toplevel)" || true
```

## What it is *not*

clone-guard matches four known shapes. A payload buried in a build plugin, a
test fixture, or a dependency's own `postinstall` will sail past it. Treat it as
a fast doorman, not a full malware engine — keep running real scanning (Snyk,
`npm audit`, etc.) in CI next to it.

And it does nothing once something has already run. If a `folderOpen` task fired
on your machine, the fix is **rotation**, not deletion: revoke tokens from a
clean device, pull your SSH keys, and check `crontab -l`.

The free defense still beats all of this: when VS Code asks whether you trust
the authors of a cloned folder, on a repo you don't recognize the answer is
**"No, I don't trust the authors."** In Restricted Mode the task never runs.

## License

MIT — see [LICENSE](LICENSE).
