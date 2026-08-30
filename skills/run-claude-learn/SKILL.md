---
name: run-claude-learn
description: Run, verify, and smoke-test the Claude-Learn teaching system — check the diagram renderers, the Obsidian vault plumbing, and skill discovery, or start a real teaching session. Use when asked to run, test, verify, debug, or screenshot this learning setup, when diagrams aren't appearing in lessons, or when /recap can't find a vault.
---

# Run Claude-Learn

This repo is not an application — it is a Claude Code configuration that gets cloned as a project's `.claude/` directory. Its runtime is a **teaching session** on any subject at all: you ask to be taught something, the `teach` skill runs probe → plan → teach, and diagrams land on a live Obsidian **Lesson Board** while `/recap` writes the permanent note.

That makes every interesting failure a **silent** one. A missing renderer, an embed that doesn't resolve, a skill whose frontmatter stops it being discovered — none of these produce an error. They produce a lesson with no pictures, which is precisely the bug this system was rebuilt to fix. So verification is a script, not a read-through.

All paths below are relative to the repo root (which is the project's `.claude/` directory when installed).

## Verify everything (the agent path — start here)

```bash
node skills/run-claude-learn/driver.mjs
```

Runs 17 checks across four groups and exits non-zero if any fail. Takes ~10s warm; the first run can take several minutes because `mermaid-cli` downloads a bundled Chromium.

Expected output when healthy:

```
PASS  deps: node >= 18                                                   v24.15.0
PASS  deps: npx (mermaid-maker)                                          .../bin/npx
PASS  deps: rsvg-convert or magick (svg-maker)                           /opt/homebrew/bin/rsvg-convert
PASS  skills: every SKILL.md is discoverable                             recap, run-claude-learn, teach, visualize
PASS  agents: frontmatter complete                                       3 agents
PASS  commands: frontmatter complete                                     2 commands
PASS  settings.json parses                                               ok
PASS  no dangling references to removed files                            clean
PASS  vault.mjs: reads a vault's own config                              folders ok
PASS  vault.mjs: new reports NEW then EXISTS                             NEW → EXISTS
PASS  vault.mjs: refuses to escape the vault                             blocked
PASS  board.mjs: start truncates, add appends, embed matches link style  start/add/truncate ok
PASS  board.mjs: add --image does not hang without stdin                 returned in 20ms
PASS  theme.mjs: bind creates, rebind preserves, board path derives      create → rebind → current → unbind
PASS  board.mjs: rejects mermaid that cannot render                      rejects reserved keywords, passes subgraph/end
PASS  render: svg-maker pipeline produces a real PNG                     rsvg-convert → 2290 bytes
PASS  render: mermaid-maker pipeline produces a real PNG                 17917 bytes
17/17 checks passed
```

Run a single group when iterating:

```bash
node skills/run-claude-learn/driver.mjs --deps
node skills/run-claude-learn/driver.mjs --skills
node skills/run-claude-learn/driver.mjs --vault
node skills/run-claude-learn/driver.mjs --render
```

`--render` prints a temp directory holding the two PNGs it produced. **Open them.** A renderer that emits a blank image still passes a byte-size check; the only way to know a diagram is real is to look at it — which is the same rule the maker subagents follow.

The `--vault` group builds a **throwaway vault** in a temp dir (with its own `.obsidian/app.json`) and runs everything against that. It never touches real notes.

## Verify against a live teaching session

```bash
node skills/run-claude-learn/driver.mjs --session "what a hash table is"
```

Shells out to a real headless `claude -p` run and asserts the `teach` skill actually engages, printing the tool chain it observed. Slower and it spends tokens, so it's opt-in and not part of the default run. Requires the `claude` CLI on `PATH`.

It installs the repo as `.claude` in a temp project first — skills are discovered from `<project>/.claude/skills`, so running from the checkout finds nothing.

It asserts only that `teach` fires; how far the lesson gets depends on `--max-turns` and the prompt. To see the whole chain reach the vault, give it a directive prompt by hand and watch the tool calls:

```bash
claude -p "Teach me how a bill becomes law. Skip probing — set up the Lesson Board and give me the plan graph." --max-turns 8 --permission-mode bypassPermissions --allowed-tools "Skill,Bash,Read,Write,Agent"
```

A healthy run goes `Skill:teach → vault.mjs list → Agent:researcher → board.mjs start → Skill:visualize → board.mjs add`, and leaves a rendered dependency graph in the vault.

## Drive the real thing by hand

Learning is organised by **theme**: one Obsidian note per subject, deepened across many sittings. Bind one first and every session continues it:

```bash
node skills/recap/theme.mjs bind <vault> "<folder>/<Theme>.md"
node skills/recap/theme.mjs current
node skills/recap/theme.mjs list
node skills/recap/theme.mjs unbind
```

`bind` creates the note if it's missing (`CREATED`) or reports an existing one (`BOUND`) along with the sections it already has. `current` prints the note path and the derived board path — the board is `<Theme> — Board.md` beside the note, so both open together.

With a theme bound, `teach` reads the note before Phase 1 and treats it as already-held knowledge; `/recap` merges into it rather than asking where to write. Verified live: a session on a bound "Bayesian Inference" note ran `theme.mjs current` → `Read` the note → then declined to re-teach what the note covered, re-tested a logged mistake, and took its target from **Open threads**.

The system has no launch command beyond that — you use it by asking to be taught:

```bash
claude
```

```
> teach me how sourdough fermentation works
```

`teach` auto-triggers on anything that reads as "explain/teach me X". It will ask which Obsidian vault to use, start the Lesson Board, and tell you the path to open. Then:

- `/learn <folder>/<Theme>.md` — bind a theme note (also works mid-session).
- `/recap` — fold the session into the bound theme note, or write a standalone one.

The two pieces of plumbing can also be driven directly, which is the fastest way to reproduce a vault bug:

```bash
node skills/recap/vault.mjs list
node skills/visualize/board.mjs start <vault> --title "Fermentation"
node skills/visualize/board.mjs where <vault>
```

`<vault>` is a vault **name** as printed by `vault.mjs list`, or an absolute path. Both forms are verified; names are easier to type, paths are what you need when Obsidian has never run on the machine.

`board.mjs add` needs `--stdin` for a markdown body (heredoc), and nothing for an image:

```bash
node skills/visualize/board.mjs add <vault> --caption "Bayes, in one line" --stdin <<'EOF'
$$P(H \mid E) = \frac{P(E \mid H)\,P(H)}{P(E)}$$
EOF
```

```bash
node skills/visualize/board.mjs add <vault> --caption "The rise curve" --image viz/viz-foo-123.png
```

## Prerequisites

```bash
brew install librsvg
```

Node 18+ and the `claude` CLI are the only other requirements. `mermaid-cli` is fetched by `npx` on first use — no install step, but the first render is slow and needs network.

On Linux use `apt install librsvg2-bin` (or `imagemagick`) instead. On Windows the maker subagents shell out through `Bash`, so they need WSL or Git Bash.

## Gotchas

- **The terminal renders nothing.** Not images, not ```mermaid```, not LaTeX. Verified against the Claude Code 2.1.251 binary: every mermaid code path in it belongs to Artifact/preview-frame rendering, and the iTerm2/Kitty strings are about tmux panes and clipboard, not inline graphics. This is *why* the Lesson Board exists — without it a terminal-only lesson is a lesson with zero visible pictures. Don't "simplify" by pasting `![[x.png]]` into a reply; it arrives as literal text.
- **`board.mjs add` only reads stdin with `--stdin`.** This is deliberate and load-bearing. Reading unconditionally hangs forever under an agent shell, where stdin is an inherited pipe that is neither a TTY nor ever closed — `board.mjs add --image x.png` blocked indefinitely before this was fixed. There is a regression check for it.
- **Mermaid has reserved words that kill the whole graph.** A real session emitted `classDef click` — `click` is mermaid's node-interactivity keyword, so the entire diagram failed to parse and Obsidian showed an error box instead. Nothing upstream noticed, which is the exact silent failure this system exists to remove. `board.mjs` now lints for it (reserved class names, `end` as a node id) and rejects the block with the fix named. There's a regression check.
- **`svg-maker` fails silently without a renderer.** With no `rsvg-convert` and no `magick` it can only ever return `RESULT: NONE`, and the teaching just carries on without a picture. This is the single most likely cause of "why are there no diagrams" — check `--deps` first, always.
- **`settings.json` permissions are ignored in an untrusted workspace.** A fresh project prints `Ignoring N permissions.allow entries from .claude/settings.json: this workspace has not been trusted` and prompts for every render command. Run `claude` interactively there once and accept the trust dialog. Headless runs can sidestep it with `--permission-mode bypassPermissions`, which is what `--session` does.
- **Never guess vault paths.** Vaults live wherever Obsidian put them (here: inside iCloud Drive, with spaces and a `com~apple~CloudDocs` segment in the path). `vault.mjs list` reads Obsidian's own registry; anything else will be wrong. Quote every path.
- **Embeds resolve by filename, not path.** Obsidian's `newLinkFormat: shortest` means `![[viz-foo-123.png]]` resolves from anywhere in the vault — but only once the file is actually *inside* the vault. `viz/` in the project directory is not. `board.mjs add --image` and `vault.mjs attach` do the copy; skipping them yields an embed that renders as a broken link.
- **Theme state is machine-local and shared across sessions.** It lives in `learn-state/themes.json` (gitignored), so two concurrent sessions on different themes will fight over it. Bind per sitting if that ever matters. The driver stashes and restores it, so running checks never clobbers your current theme.
- **`board.mjs start` truncates the board.** That's the point — it keeps the board from silently becoming the transcript the user asked to be rid of. Don't call it mid-lesson.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `FAIL deps: rsvg-convert or magick` | no SVG renderer | `brew install librsvg` |
| Lessons have no diagrams | renderer missing, or `visualize` never invoked | `driver.mjs --deps`, then check `teach`'s *Visuals* section is intact |
| `mermaid-cli failed` on first run | downloading bundled Chromium | re-run; needs network and up to several minutes |
| `board.mjs: no vault named X` | vault name typo, or Obsidian never ran here | `node skills/recap/vault.mjs list` for exact names |
| `teach` re-teaches what you already know | no theme bound, or the note is empty | `theme.mjs current`; bind one with `/learn` |
| Theme note grows a "Session 2" heading | merge discipline ignored | see the merge table in `skills/recap/SKILL.md` — a theme note deepens, it doesn't append |
| `board.mjs add: no board at ...` | `add` before `start` | run `board.mjs start <vault>` first |
| `REJECTED  this mermaid will not render` | reserved keyword in the graph | rename the classDef/node as the message says; don't use `--no-lint` |
| A command hangs with no output | `add` waiting on stdin | pass `--stdin` with a heredoc, or drop it entirely |
| Broken image link in Obsidian | PNG never copied into the vault | use `board.mjs add --image` / `vault.mjs attach`, not a hand-written embed |
| `FAIL no dangling references` | docs mention the removed chronological logger | delete the stale mention |
