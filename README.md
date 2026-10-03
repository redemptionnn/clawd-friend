# Claude Friend

A tiny Clawd who lives above your prompt in [Claude Code](https://claude.com/claude-code) and acts out whatever Claude is doing, live.

He taps away at a laptop while Claude codes, reads the newspaper during a web search, watches a flask bubble while your tests run, stamps a parcel on every commit, launches a rocket when you deploy, chases a bug with a net, and nods off when you go quiet.

![Claude Friend running tests above the prompt](media/hero-testing.png)

## Install

In Claude Code, run:

```
/plugin marketplace add redemptionnn/clawd-friend
/plugin install clawd-friend
```

Then start a new session (or run `/reload-plugins`) and your friend shows up above the prompt.

Or from a shell:

```bash
claude plugin marketplace add redemptionnn/clawd-friend
```

```bash
claude plugin install clawd-friend
```

To update later:

```bash
claude plugin marketplace update clawd-friend
```

**Requirements:** Claude Code 2.1.286 or newer. Mods are an early-access Claude Code feature, so the API may change between releases. The full animated character is drawn in the Claude Code desktop app (and the VS Code extension); the terminal shows a compact text version.

## 23 scenes, one tiny friend

![All 23 scenes](media/all-scenes.png)

He picks a scene from what Claude is actually doing, as it happens:

| Scene | When |
| --- | --- |
| 💭 Thinking | Claude is thinking, or reading a tool's result before its next move |
| ⌨️ Writing | Claude is writing its reply, or editing `.md` / `.txt` docs (a typewriter that faces him) |
| 💻 Coding | Editing or writing code (a laptop, lid turned toward him) |
| 📰 Web search | `WebSearch`, `WebFetch` and search or docs MCP tools (he reads the paper with a coffee) |
| 🔍 Reading | `Read`, `Grep`, `Glob` (a magnifying glass over the docs) |
| ⚡ Commands | Any other shell command (green hacker glyphs rain above him) |
| 🧪 Tests | `npm test`, `pytest`, `vitest`, `jest`, `go test`, `cargo test`, ... |
| 📦 Commit | `git commit` |
| 🚀 Deploy | `git push`, `vercel`, `npm publish`, `npm run deploy`, deploy MCP tools |
| 🧱 Build | `npm run build`, `tsc`, `cargo build`, `docker build`, `make`, ... |
| 🗄️ Database | `psql`, `prisma migrate`, Supabase / SQL MCP tools, `.sql` files and migrations |
| 🐞 Debugging | `node --inspect`, `pdb`, `gdb`, debugging skills |
| 🎨 Design | `.css` / `.svg` / Tailwind config edits, Figma and design MCP tools |
| 📔 Memory | Writing `CLAUDE.md` or Claude's memory files |
| 🐾 Subagents | Claude sends out subagents (tiny Clawds march off with their tasks) |
| 📋 Planning | Todo and task list updates |
| 🌐 Browsing | Browser automation tools |
| 👋 Asking | Claude asks you a question |
| 🪧 Needs your OK | A tool call is waiting for your permission |
| 🎉 Done | A turn finished: he jumps, confetti flies |
| 💧 Oops | A turn ended on an error |
| 😌 Chilling | Nothing going on |
| 💤 Napping | Two quiet minutes in a row |

![Claude Friend querying a database](media/hero-database.png)

## Commands

| Command | What it does |
| --- | --- |
| `/friend` | Show or hide your friend |
| `/friend on` / `/friend off` | Show or hide him for good (remembered across sessions) |
| `/friend <scene>` | Play any scene for a few seconds, e.g. `/friend deploy` or `/friend build` |
| `/friend pane` | Move him into a side pane |
| `/friend stage` | Put him back above the prompt |
| `/friend stats` | What he saw today: file edits, reads, commands, web lookups, helpers, finished turns |

## How it works

Claude Friend is a Claude Code mod: a plugin whose behaviour is a TypeScript module of function hooks.

- **What Claude is doing.** A `turn.step` hook watches the model's response as it streams: thinking, visible text, and the start of each tool call, whose arguments it reads as they arrive, so the scene changes before the tool even runs. A `tool.call` hook confirms the scene while the tool runs, and a `tool.check` hook notices when a call needs your permission.
- **Which scene.** [`plugin/hooks/classify.ts`](plugin/hooks/classify.ts) maps tool names, shell commands and file paths to scenes: `git commit` is a commit, `npm test` is tests, a `.css` edit is design, an MCP tool named `execute_sql` is the database.
- **Drawing.** A `ui.render` hook draws the band above the prompt. Every scene is an SVG built in code in [`plugin/hooks/scenes.ts`](plugin/hooks/scenes.ts), animated with CSS. There are no image files.
- **Cheap and private.** No model calls, no tokens, no network. Your daily stats stay on your machine in the plugin's own store.

## Develop

Clone the repo and load the plugin straight from disk; saving a file hot-reloads it.

```bash
git clone https://github.com/redemptionnn/clawd-friend.git
```

```bash
claude --plugin-dir ./clawd-friend/plugin
```

In the desktop app, where you can't pass flags, add the folder to the `env` block of `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "/absolute/path/to/clawd-friend/plugin"
  }
}
```

If you also installed it with `/plugin install`, disable that copy (`claude plugin disable clawd-friend`) so it doesn't load twice.

Check and test it against the engine:

```bash
claude plugin validate ./plugin
```

```bash
claude plugin test ./plugin
```

The tests in [`plugin/tests/scenes.test.ts`](plugin/tests/scenes.test.ts) run real tool calls through Claude Code's engine, draw the band while each call is in flight, and check that the right scene shows.

## Good to know

- The rounded panel behind the friend is drawn by Claude Code itself; a mod can't remove or recolor it.
- Claude Code doesn't tell a mod the moment you approve a permission prompt, so the "OK?" sign stays up until that tool call finishes.

## Layout

```
.claude-plugin/marketplace.json   lets /plugin find and install the plugin
plugin/
  .claude-plugin/plugin.json      name, version, metadata
  hooks/hooks.json                points at the hooks module
  hooks/register.tsx              the hooks: what Claude is doing, commands, drawing
  hooks/classify.ts               tool calls to scenes
  hooks/scenes.ts                 the 23 scenes, drawn as SVG in code
  types/index.d.ts                the plugin's state contract
  tests/scenes.test.ts            claude plugin test
media/                            screenshots
```

## License

[MIT](LICENSE)
