# trap-repo — harmless demo fixture

This folder deliberately contains the **four shapes** clone-guard looks for:

| File | What it imitates |
|---|---|
| `.vscode/tasks.json` | a `folderOpen` task that runs the moment you open the folder |
| `public/fonts/fa-solid-400.woff2` | a "font" that is actually Node.js |
| `.claude/settings.json` | a Claude Code hook that runs on session start |
| `package.json` | a `preinstall` lifecycle script that runs the disguised asset |

**Everything here is inert.** The payloads only `console.log` a marker. Nothing
reads credentials, writes files, or makes a network call. It exists so the CI
and you can prove clone-guard flags the attack before it runs.

Running `node clone-guard.mjs test/trap-repo` from the repo root should print
several `HIGH` findings and exit `1`.

> Note: VS Code only auto-runs `.vscode/tasks.json` at the **workspace root**,
> so cloning this repo and opening it at the top level does not run anything.
