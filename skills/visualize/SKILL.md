---
name: visualize
description: "Put a picture in the lesson — a dependency graph, flow, sequence, state machine, tree, comparison, or a spatial/geometric figure (coordinate geometry, vectors, a plot, a number line). Writes a Unicode sketch into the terminal reply and, when an idea earns a real rendering, saves a PNG into the project's viz/ folder. Use whenever teaching something with structure or shape."
---

# Visualize

Words and pictures are held by different systems, and an idea carried by both is understood better and remembered longer than one carried by either alone. A picture is not decoration on a lesson — it is **a second, independent channel into the same idea**.

So the bar is not "would a diagram be nice here." The bar is **"does this idea have a shape?"** — structure, direction, relationship, geometry, containment, order. Most ideas worth teaching do. Draw those.

## The constraint that shapes everything below

**The Claude Code terminal renders nothing.** No images, no ```mermaid```, no LaTeX. A mermaid fence in a reply reaches the learner as *source code*; `$\alpha$` reaches them as `$\alpha$`. This has been verified against this machine's Claude Code build — do not assume otherwise.

That gives every visual **two possible forms**:

| Form | Renders | Gets |
|---|---|---|
| A Unicode/ASCII sketch, in the reply | always, everywhere | a small picture they see **immediately**, without looking away |
| A rendered PNG, saved into the project's `viz/` folder | opened by hand, in any image viewer | the real diagram — properly laid out, geometrically exact |

Neither replaces the other. The sketch keeps the picture in the flow of reading; a rendered file is where the picture is actually *good*, for the ideas that earn the round-trip.

## Pick the cheapest form that carries the idea

**1. Unicode sketch in the reply — always, for anything with structure.** Costs nothing, needs nothing, and it's the only picture that lands where they're already looking:

```
      12 semitones
        ╱      ╲
   intervals   scales
        ╲      ╱
        chords
```

Keep it small — five or six elements. It's a thumbnail, not the diagram. For most nodes in a lesson, this is enough on its own — stop here.

**2. `mermaid-maker` — when the idea is worth a properly laid-out diagram.** Nodes and edges: dependency graphs, flows, pipelines, sequences, state machines, trees, containment. It renders to PNG, **looks at it**, iterates, and publishes the result to `viz/`. Costs a round-trip; buys a diagram that's actually correct and readable, not just a sketch.

**3. `svg-maker` — for real geometry.** Exact coordinates, vectors, angles, function plots, number lines, physical layouts — anything a Unicode sketch can't honestly represent and mermaid's auto-layout can't express either.

```
Agent(subagent_type: "mermaid-maker", prompt: "<minimal, concrete brief>")
Agent(subagent_type: "svg-maker",     prompt: "<minimal, concrete brief>")
```

Both return:

```
RESULT:
filename: viz-<slug>-<timestamp>.png
path: <cwd>/viz/viz-<slug>-<timestamp>.png
```

**Tell the learner the path, once, in the reply** — `saved to viz/viz-<slug>-<timestamp>.png` — so they can open it if they want to see the real rendering. Don't paste `![[...]]` or `![...]()` into the reply expecting it to render; the terminal shows either as literal text.

If `/recap` runs later, any PNG still sitting in `viz/` from this session gets folded into the permanent note automatically — you don't need to do anything extra now to make that happen.

## When a maker fails, you still ship a picture

Makers fail: overloaded subagents, a missing renderer, a brief that won't compose. That must **never** silently become a lesson with no visual. On `RESULT: NONE` or an error:

1. **Fall back to a fuller Unicode sketch in the reply.** Most "needs a picture" ideas have a nodes-and-edges version that's legible in plain text.
2. **If it's truly geometric,** fall back to a Unicode sketch plus a coordinate table. A rough true picture beats no picture.
3. **Say nothing about the failure.** The learner is here to learn, not to hear about subagent errors.

Never claim an image exists that doesn't, and never hand-author a PNG.

## Composition: one idea, fewest elements

Cramming is how these fail — and an overloaded picture is *harder to lay out*, so it's likelier to be wrong as well as unreadable.

- Prune before drawing: for each element, *"if I delete this, is the idea still clear?"* If yes, delete it.
- Labels are a term or short phrase, never a sentence. Long labels wreck layout.
- More than ~7 nodes means you're drawing two pictures. Draw the first.
- Brief a maker with **concrete elements**, not a topic:
  - BAD: "make a diagram about the water cycle"
  - GOOD: "graph TD: 'ocean' at top; arrow to 'evaporation'; then 'clouds'; then 'rain'; then back to 'ocean' to close the loop. Four nodes, no title. Show that it is a closed cycle, not a one-way sequence."

## Don't draw these

- A picture that restates the sentence next to it. Noise, plus a chance to be wrong.
- A picture of something you're unsure of. A confidently wrong diagram is dual-coded misinformation — it sticks exactly as well as the truth would have.
- Decoration. Every element asserts something; if you wouldn't say it in words, don't draw it.

## After the picture

Introduce it in a sentence, then **let it carry the idea** — narrating every element back in prose spends the picture and gains nothing. One line pointing at what to notice is usually right.

> Renderers, both verified working on this machine: mermaid-maker shells out to `npx @mermaid-js/mermaid-cli`; svg-maker to `rsvg-convert` (fallback ImageMagick `magick`). See `.claude/agents/mermaid-maker.md` and `.claude/agents/svg-maker.md`.
