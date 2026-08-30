<div align="center">

# Claude CoLearn

**A Claude Code power tool for learning *anything* properly.**

Orbital mechanics. Counterpoint. Contract law. Knife skills. Bayesian inference.
One teaching loop, zero subject-specific tuning.

[![Claude Code](https://img.shields.io/badge/built%20for-Claude%20Code-D97757)](https://claude.com/claude-code)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)

[Why it exists](#why) · [Install](#install) · [Getting started](#getting-started) · [How it works](#how-it-works) · [Pieces](#commands-and-pieces)

</div>

---

## Why

Most "explain X" prompting gives you a pile of disconnected facts that feel true in the moment and evaporate a week later. Claude CoLearn is built on a different claim: **understanding is a graph, not a list.**

It runs a **probe → plan → teach** loop that finds the edge of what you already know, teaches from there one dependency at a time, puts every diagram on a live Obsidian board next to your terminal, and — when you stop — compresses the whole session into one revision note you can actually study from later.

Two teaching principles drive all of it, and they're about how minds accept facts — not about any subject. That's why the same machinery teaches a proof and a chord progression.

## Install

This repo **is** a `.claude` directory — clone it straight into your learning project.

```bash
git clone https://github.com/Matin22/Claude-CoLearn.git .claude
```

Claude Code auto-discovers `skills/`, `agents/`, `commands/`, and `settings.json` from `.claude/`.

> **Already have a `.claude/` with other stuff in it?**
> Copy `agents/`, `skills/`, `commands/`, and `lib/` into it, keeping the same relative layout, and merge this repo's `settings.json` into your own.

Then install the one system dependency and verify your setup:

```bash
brew install librsvg                                  # macOS — see Requirements for other platforms
node .claude/skills/run-claude-learn/driver.mjs
```

This runs **17 checks** and exits non-zero if anything is wrong. Do this *before* your first real session — without a renderer, diagrams fail silently.

## Getting started

```bash
claude
```

```
> teach me how sourdough fermentation works
```

`teach` triggers on anything that reads as "explain/teach me X" — **no slash command needed.** It probes what you already know, proposes a plan and waits for your go-ahead, then teaches node by node, checking understanding as it goes.

When you're done:

```
> /recap
```

### Themes, not sessions

Learning is organized by **theme** — one Obsidian note per subject that gets deeper every sitting, instead of a pile of dated fragments. Bind one and it sticks:

```
> /learn 02 Concepts/Bayesian Inference.md
```

From then on, `teach` **reads that note before it teaches you**:

- What the note establishes is treated as already understood and never re-taught.
- Its logged mistakes get re-tested.
- Its open threads become the natural next lesson.

`/recap` folds each session back in — extending the one dependency graph, slotting new ideas into place, closing threads that got closed. It never appends a "Session 2."

## How it works

The system runs on two claims:

1. **An outlet built for many learners can't be optimal for any one of them.** Optimal teaching depends entirely on what *this* learner already holds, so the system has to measure that before it teaches.
2. **Struggle belongs in the material, not the logistics.** Planning, sequencing, finding sources, verifying facts, and drawing pictures are all overhead the system should absorb — so all your effort goes into the ideas themselves.

Everything below follows from those.

### The teaching

Two principles, applied to every explanation:

| Principle | What it means |
|---|---|
| **Unconditional truths first** | Start from facts you can accept as-is, with no caveats. They're safe, so the brain commits to them instantly — and they give you ground to build on. Everything else is built up from them, explicitly. |
| **"How could I have discovered this?"** | Nothing appears from nowhere. Every step is motivated: why are we doing this, why reach for *this* move. Facts that feel arbitrary never lock in. |

Layered on top: concrete before abstract, worked example → completion → independent problem, contrast cases at the boundary, confidence checked *before* the answer is revealed, and earlier nodes pulled back into later quizzes.

### The loop

```
  PROBE                    PLAN                       TEACH
┌──────────────┐        ┌──────────────┐        ┌──────────────────┐
│ binary-search│  --->  │ researcher   │  --->  │ one node at a time│
│ your edge of │        │ scopes it →  │        │ motivate → build →│
│ understanding│        │ dependency   │        │ connect → quiz    │
│              │        │ DAG, you OK  │        │                   │
└──────────────┘        │ it first     │        └──────────────────┘
                         └──────────────┘
```

- **Probe** — graded questions that binary-search the edge of your understanding, until each strand the lesson depends on is bracketed by something you got right and something you didn't. All-correct means the questions were too easy, not that probing is done.
- **Plan** — the topic gets scoped by the `researcher` subagent, then reasoned out as a dependency DAG with unconditional truths at the roots and your goal as the sink. Presented and confirmed before any teaching starts. Drawing the graph is also what stops the model winging it.
- **Teach** — one node at a time: motivate → establish → connect → quiz-check. Slow on purpose; you can interrupt anywhere without derailing it.

### The visuals

**The Claude Code terminal renders no images, no mermaid, and no LaTeX.** So visuals get a deliberate destination: a **Lesson Board** — one Obsidian note you keep open beside the terminal that receives *only* the lesson's diagrams, graphs, and display math. Never dialogue. It's truncated at the start of each lesson, so it holds one lesson at a time and never turns into a transcript.

Replies also carry a small Unicode sketch, so there's always a picture where you're already reading.

| Kind of picture | Made by | Cost |
|---|---|---|
| Unicode sketch in the reply | written inline | free |
| Dependency graph, flow, sequence, state machine | mermaid written inline, pushed to the board | free |
| Dense graph where layout could break | `mermaid-maker` subagent — renders, **looks at it**, iterates | one round-trip |
| Coordinate geometry, vectors, plots, number lines | `svg-maker` subagent — same render-and-look loop | one round-trip |

If a maker fails, the lesson falls back to inline mermaid rather than silently shipping no picture.

### The notes

`/recap` writes **one standalone revision note** into your Obsidian vault. Not a transcript — nobody re-reads a conversation. It carries the compression (the whole session in a paragraph), the dependency graph, the rediscovery path, a worked example, and the mistakes you actually made. The test every line has to pass: *would this still work for someone who wasn't there?*

It reads your vault's existing conventions and writes into them rather than imposing its own. It asks which vault and folder rather than assuming, copies the session's diagrams in so the embeds resolve, and if the note already exists, it reads and revises it in place instead of overwriting.

## Commands and pieces

| Piece | What it does |
|---|---|
| **`teach`** | The main skill, auto-triggered. Probe → plan → teach. |
| **`visualize`** | Invoked by `teach` whenever an idea has a shape. Picks the cheapest tool that carries it. |
| **`/learn <note>`** | Bind a theme note. Persists across sessions; switch by binding another. |
| **`/recap`** | Fold the session into the bound theme note, or write a standalone one if none is bound. |
| **`researcher`, `mermaid-maker`, `svg-maker`** | Subagents the above delegate to. You can invoke them by hand ("have the researcher fact-check X") but normally don't. |
| **`run-claude-learn`** | Verification. `driver.mjs` checks renderers, vault plumbing, and skill discovery. |

<details>
<summary><strong>Full file layout</strong></summary>

```
skills/
  teach/SKILL.md              the philosophy + probe → plan → teach loop
  visualize/SKILL.md          when a picture earns its place, and which maker
  visualize/board.mjs         the live Lesson Board
  recap/SKILL.md              what a note worth re-reading contains
  recap/vault.mjs             vault discovery, attachments, safe note creation
  recap/theme.mjs             theme binding — the note a subject accumulates into
  run-claude-learn/SKILL.md   how to run and verify all of it
  run-claude-learn/driver.mjs the 17-check smoke suite
agents/
  researcher.md               fact-checks and scopes topics before they're taught
  mermaid-maker.md            structural diagrams
  svg-maker.md                spatial/geometric figures
commands/
  learn.md, recap.md          /learn and /recap
lib/
  obsidian.mjs                shared vault plumbing
settings.json                  permission allowlist for the render commands
```

</details>

## Models

| Component | Model | Why |
|---|---|---|
| `teach` (your session) | whatever you run | The judgment-heavy part — planning, probing, deciding what's actually understood. **Run real sessions on Opus**; Sonnet is a fine fast default. |
| `researcher` | `sonnet` | Search + synthesize is mechanical, and it may run several times per session. |
| `mermaid-maker` | `sonnet` | Structural authoring and fast render-look-iterate cycles. |
| `svg-maker` | `opus` | Hand-authored coordinate geometry is precision-critical — a flipped vector is a correctness bug, not a style nit. |

Change any of these by editing `model:` in that agent's frontmatter.

## Obsidian setup

Nothing to configure — the system reads Obsidian's own vault registry and each vault's `app.json` to find your vaults, your attachment folder, and whether you use wikilinks. It asks which vault to use rather than guessing.

Keep the Lesson Board open beside your terminal while you learn; that's where the diagrams and the typeset math appear.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node.js 18+
- `rsvg-convert` (librsvg) or ImageMagick's `magick`, for `svg-maker`:
  - macOS: `brew install librsvg` (or `brew install imagemagick`)
  - Linux: `apt install librsvg2-bin` (or `imagemagick`)
  - Windows: `choco install imagemagick`
- **Windows**: the maker subagents and helper scripts run through `Bash`, so they need [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) or Git Bash.
- A working directory you don't `cd` away from mid-session.

`mermaid-cli` is fetched by `npx` on first use — no install, but the first render downloads a bundled Chromium and is slow.

## How grading works

There's one interactive tool, `AskUserQuestion` — no separate quiz tool. `teach` calls it with the real options plus an explicit "I don't know" it adds itself, then **it** states the verdict, reveals the answer, and explains why. See "Tools: probing vs. checking" in `skills/teach/SKILL.md`.

## Make it yours

The system ships **blank** — it assumes nothing about who you are or what you study, and finds out by probing at the start of each session.

If you get tired of it rediscovering you, `skills/teach/SKILL.md` opens with an **About the learner** section, empty by default. Record what's durable there — fields you already have solid footing in, how long you want probing to run, how much Socratic back-and-forth you like, how formal you want it — and every session starts from that instead.

Everything else is general on purpose. Don't narrow it to one subject; the whole point is that the same loop teaches you a proof and a chord progression.
