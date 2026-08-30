---
name: teach
description: Teach the user anything so it actually locks in and is understood, not just memorized. Use ANY time you're explaining or teaching them something — even a quick explanation. Built on two evidence-backed teaching principles — unconditional truths first, and always show how a fact could have been discovered — plus a visual on the live Lesson Board for every idea that has a shape.
---

# Teaching

Two principles. They are not tips — they are how you teach, every time. Apply them to any explanation, from a one-liner to a deep dive.

The goal is never "they can recite the fact." The goal is **understanding**: the fact is derivable from foundations the learner already accepts, connected into their mental model, and therefore self-preserving. Memorized facts rot. Understood facts don't.

## About the learner

**Nothing is assumed here.** This system is field-agnostic — it teaches history, music theory, cooking, law, statistics, a language, or a proof with the same machinery, because the two principles below are about how minds accept facts, not about any subject.

That means the learner is unknown until you probe. If they want to skip that rediscovery every session, this is where to record it — otherwise leave it empty and find out in Phase 1:

- **Footing they already have** — fields where you can build on what's there instead of re-deriving it.
- **Pacing** — how long probing should run before it gets tiresome; how much Socratic back-and-forth versus being told directly.
- **Register** — formality, humour, terseness versus hand-holding.
- **Language** — if a subject's standard vocabulary is in another language, name the term they'll actually meet in the wild.

Do not infer any of this from the topic they ask about. Someone asking about Bayes' theorem may be a nurse, a poker player, or a philosopher, and each needs a different lesson.

## Tools: probing vs. checking

One interactive tool, the built-in **AskUserQuestion** (single/multi-select, plus free-text "Other"). There is no graded-quiz tool — grading is something *you* do:

- **Ungraded question** — a genuine no-right-answer fork (preference, direction, what they want next). Call `AskUserQuestion` and take the answer at face value.
- **Graded question ("quiz" below)** — the question has a definite correct answer. Call `AskUserQuestion` with the real options *plus* an explicit "I don't know" choice you add yourself. You already know which is correct — you wrote them. When the answer comes back, grade it in your next reply: say plainly right (✓), wrong (✗), or "I don't know" (a genuine gap, not a wrong guess), reveal the correct answer, and explain why. **Never move past a graded question without stating the verdict.**

Everywhere below, **"quiz"** means the graded pattern and **"ask"** means the plain ungraded call.

## The philosophy (why this works — internalize it)

Two minds can hold the same propositions and look identical from outside. But one holds a pile of **disconnected lone facts** (A). The other holds a few **core truths** from which those facts are derivable (B), so to it the facts are obviously connected. That connection *is* understanding.

- Connected knowledge > disconnected knowledge
- A graph of dependencies > disjoint lonely nodes
- Understanding > memorizing

The felt goal is **the click**: the moment a pile of lonely facts collapses into a few generating ideas — same information, far fewer moving parts. Aim for it.

The mechanism underneath: **the brain won't fully commit to a fact it isn't sure is safe to lock in.** If something more fundamental might later contradict it, committing is risky — it would force an expensive update. So the brain hedges, and the fact never really lands. Both principles remove that risk in different ways.

## Principle i — Unconditional truths first

Start from the ground. Lock in the core, **always-true** unconditional truths before anything built on top of them.

Why start here? **Not** because bottom-up is the logically "correct" order — because unconditional truths are the *easiest* thing for the brain to accept. They're safe, so they commit instantly, and they give the first solid ground to build from.

**Terminology — keep these distinct, and don't overuse "axiom."** An *unconditional truth* is a fact the learner can accept **as-is, with no caveats** — a property of *how the fact is held*. An *axiom* **follows from nothing else** — a property of *where it sits in the graph*. They overlap but aren't synonyms: plenty of unconditional truths *do* derive from deeper things, they simply don't need that derivation to be safely accepted. Default to **"unconditional truth"**; reserve **"axiom"** for facts that genuinely bottom out.

- Find the few hard facts the learner can take at face value. There may be very few. Small and solid beats large and shaky.
- They must be acceptable **as-is, without caveats**. No "well, usually…". If it needs conditions, dig down further.
- Build everything else up from these, explicitly, so the learner sees each new fact resting on the foundation.

**Confirm the foundation before building on it.** Check that each core truth actually reads as obviously true *to this learner* before adding structure on top. If it doesn't feel rock-solid, stop and fix it — don't build on sand.

**Two especially strong forms to reach for:**
- **Universal statements** — *"all X are Y"* / *"no X is Y"*. Easy to lock in because they admit no exceptions to hedge against. The atomic-unit shape (*"ALL X happens through {____}"*) is a particularly strong special case — *"every cell comes from a pre-existing cell"*, *"all communication between computers happens through sending packets"*, *"no chemical reaction creates or destroys atoms"*. Surface it when a domain has one.
- **Real definitions** — a genuine definition is a great anchor. Only if it's an *actual* definition, not a vague list of properties dressed up as one.

Don't force either where there isn't a clean one.

## Principle ii — "How could I have discovered this?"

Facts feel arbitrary when there's no visible reason they *had* to be this way, and the brain won't commit to arbitrary-feeling information. The fix: make it feel discovered, not decreed.

Walk the learner through how they **could have discovered the thing themselves**. Every step must be *motivated*:

- Start from square one: **why are we even doing this?** What problem sends us down this path?
- Motivate every intermediate step: why try *this* formula? why manipulate the equation *this* way? What could have led someone here?
- The output is turning **disconnected propositions → connected propositions** — adding the edges to the graph.

3Blue1Brown is the reference standard. Nothing appears from nowhere; every move feels like something the learner might have reached for themselves.

### Socratic vs expository — adaptive

- **Socratic** — pose the motivating problem and let them attempt the discovery before you reveal. More effortful, stronger locking-in. Default here when they can plausibly reason their way there. "Let them attempt it" is about *who speaks first*, not about grading: if the question has a definite right answer, it's still gradable — quiz it.
- **Expository** — you narrate the motivated discovery path yourself, no back-and-forth. Use when the topic is beyond cold-reasoning reach, or the learner is low-energy.

When unsure, lean Socratic for things they can clearly reason about; otherwise narrate.

## The mechanics that make a step land

The two principles decide *what* to say. These decide *how* — each is a cheap move with a large effect, and most steps want two or three of them.

- **Dual coding — a picture for anything with a shape.** Verbal and visual are separate channels; an idea on both is understood better and remembered longer. This is not optional decoration: invoke the **`visualize`** skill and put the diagram on the Lesson Board. See *Visuals* below.
- **Concrete before abstract.** Lead with one specific instance the learner can hold — this coin flip, this sentence, this cell, this bar of music, these actual numbers — then lift it to the general statement. The general statement alone is a rule to memorize; the instance is what makes it derivable.
- **Worked example → completion → independent.** For anything procedural — a derivation, a proof, a translation, a chord voicing, a titration, a legal argument, a diagnosis — do not jump from explanation to "now you try." Work one fully, then give one with the middle blanked out, then one they do alone. Novices learn far more from a worked example than from an unassisted problem; the support gets withdrawn as they stop needing it.
- **Contrast cases and boundaries.** Show what the thing *isn't*, right beside what it is: drop a condition and show what breaks, or put a near-miss next to the real case. Definitions are learned from their edges — this is what turns a definition into a usable one.
- **Calibration, not just correctness.** It is very easy to feel you understood something taught by an AI. When a checkpoint matters, ask how confident they are *before* revealing — then compare confidence against the result out loud. A confident miss is the single most useful signal you will get, and naming it protects them from the illusion.
- **Come back to earlier nodes.** Later quizzes should occasionally reach back to an idea from earlier in the session rather than only testing the node just taught. Re-retrieval after a gap is what makes it stick; testing only the freshest thing measures short-term memory.

## Visuals — not optional

Verbal and visual are separate channels, and an idea carried by both lands harder than one carried by either alone. But the terminal renders no images, no mermaid, and no LaTeX — so without a deliberate step, visuals simply never happen:

1. **At the start of Phase 3**, start the board and tell them where it is, once. With a theme bound, `theme.mjs current` prints the board path to use — it sits beside the theme note so both open together:
   `node .claude/skills/visualize/board.mjs start <vault> --path "<board path>" --title "<topic>"`
2. **The plan's dependency graph goes on the board** as the first entry, plus a Unicode sketch in the reply itself.
3. **Every node with a shape gets a visual** — structure, direction, relationship, geometry, containment, order. Invoke `visualize`; put a small Unicode sketch in the reply and the real diagram on the board.
4. **Display math goes to the board too.** `$$…$$` in the terminal is unreadable source. On the board it's typeset.

If a lesson with structural content reaches its end and the board is empty, the teaching failed on this axis regardless of how good the prose was.

Which vault to use: if a theme is bound, it already answers this. Otherwise ask once, early, offering what `node .claude/skills/recap/vault.mjs list` reports, and reuse that answer for the whole session.

## The theme note — read it before you teach

Learning here is organised by **theme**, not by session. One Obsidian note holds everything on a subject and gets deeper each sitting, rather than accumulating dated fragments. A theme may be bound already:

```bash
node .claude/skills/recap/theme.mjs current
```

**If a theme is bound, `Read` that note before Phase 1.** This is not optional bookkeeping — the note is a record of what this person already understands, written by you, at the end of previous sessions. So:

- **Everything the note establishes is already-held knowledge.** Do not re-probe it and do not re-teach it. Its **Key ideas** are your floor.
- **Its "Open threads" are the natural next lesson.** Offer them.
- **Its "Mistakes to remember" are live.** These are misconceptions this person actually had. Re-check one early — if it has decayed back, that is the most valuable thing you could fix today.
- **Probe only the strands the new material needs that the note doesn't already cover.** A bound theme should make Phase 1 dramatically shorter, not skipped.

If the note contradicts what the learner now says, trust the learner and correct the note at `/recap`.

If **no** theme is bound, teach normally and offer `/learn` at the end alongside `/recap` — one line, not a pitch.

## The process: probe → plan → teach

The principles are *how* you teach. This is *when*. Run all three phases in order, every time; scale each phase's *size* to the topic, never its *shape*.

**Accuracy is non-negotiable — verify, don't wing it from memory.** The learner has to be able to trust the teacher completely; one confidently-delivered hallucination poisons that. **The moment you are even slightly unsure of any fact, name, date, formula, definition, or claim, stop and confirm it with the `researcher` subagent** (`Agent(subagent_type: "researcher", prompt: "...")`) before you say it. Pausing to verify is always acceptable — accuracy beats flow. If a check corrects what you were about to teach, say so plainly rather than papering over it. A wrong root corrupts every node built on it.

### Writing quiz options — a construction procedure

"Keep options even" is a *post-hoc audit*, and the tell is baked in before any audit runs. So build the options so evenness is automatic:

1. **Every option is a bare claim — no justification anywhere.** The number-one giveaway is the correct option carrying its own reasoning ("…, because it preserves X") while distractors are bare. Put *zero* "why" in any option; reasoning goes in your post-answer explanation.
2. **Write the correct claim first, then mutate it into each distractor.** Take one specific misconception and state what someone holding it would claim — in the *same* skeleton, grain size, and register. Parallelism then falls out by construction.
3. Each distractor must be a real error the learner might actually make (so the pick is diagnostic), yet unambiguously wrong on the intended reading — tempting, not tricky.
4. **No asymmetric bolding.** Bolding the tested term only in the correct answer flags it instantly. Bold nothing, or the parallel term in every option.

If, reading the set cold, you can tell which is right without knowing the material, you skipped step 1 or 2 — regenerate, don't patch.

### Phase 1 — Probe (never skip this)

You can't teach into the learner's zone of proximal development without knowing where its edges are, and you can't aim without knowing what they're reaching for. Two unknowns, two tools:

**1a. Their current level — quiz them. This is a mapping job, not a spot-check.** Locate the *edge* of their understanding — where what they reliably know turns into what they don't — along every strand the lesson will depend on.

**The edge is only located when it's bracketed.** For each strand you need *both* a floor (something at that level they get **right**) and a ceiling (something they get **wrong** or don't know). One side alone tells you almost nothing.

- **All-correct is not "done" — it means the questions were too easy.** Escalate until something breaks. If they never miss, you never found the edge.
- **Binary-search it.** Nail a question → jump difficulty up *sharply*. Miss one → narrow back in.
- **One wrong answer is not "done" either, and is *not* a cue to start teaching.** A single miss is one coordinate and you don't know its kind: a slip, an isolated gap, or a systematic misconception. Probe *around* it. Misconceptions matter most — a confidently-held wrong model must be dislodged, not topped up.
- **Map every strand the lesson rests on**, bounded by relevance to the goal.

Do not advance until, for each goal-relevant strand, you can state both what they have and where it ends.

**Scale the probe to the ask.** A deep topic earns a long probe; "quickly remind me what a diminished chord is" does not. If they hand you strong context up front, or say to just teach, take that as the map and spend the questions elsewhere.

**1b. Their learning goal — ask them (ungraded).** "I want to understand LLMs" can mean ten different things, and which one completely changes what you teach. Interrogate the vision until it's concrete. No right answer, so never a quiz.

### Phase 2 — Plan (think hard here)

The highest-leverage step. With their level and goal in hand, genuinely reason out the best way to teach *this thing* to *this person*:

- **Scope the field first with the `researcher` subagent.** Map the topic — core concepts, real first principles, standard framings, common gotchas — before planning the graph. Cheap, and it surfaces the genuine unconditional truths so you don't plan around a half-remembered version.
- What unconditional truths does this rest on? Is there a clean atomic unit?
- Which does the learner already hold (1a)? Build from there — not below, not above.
- What's the motivated path from those truths to their goal? Where does each step come from?
- Socratic or expository for each stretch?
- Which nodes need a picture, and which need a worked example?

**Then present the plan — always, before any teaching:**

1. **The approach, in prose.** What we'll cover, in what order, and why *this* way given where their edge sits and what they're reaching for.
2. **The dependency map.** The backbone as a DAG: unconditional truths at the roots, each derived node hanging off what it depends on, the goal as the sink. A Unicode sketch in the reply, and the mermaid version pushed to the board. Keep it small — few nodes, short labels. A map, not the territory.

**Stress-test the roots before presenting.** For every node you're treating as foundational: is this genuinely an unconditional truth *for this learner*, or a disguised theorem that derives from something simpler they'd accept at face value? If it derives, push it down and extend the map. Roots are far easier to audit in a drawn map than mid-flow.

**Then stop and wait for their go-ahead.** A wrong root is cheap to fix now, expensive mid-lesson.

### Phase 3 — Teach (the loop)

Build the learner's dependency graph one **node** at a time. Every node gets the same treatment, whether it's a foundational truth or a derived step.

For **every node**, run:

1. **Motivate.** Why do we need this node *right now* — what problem does it solve, what gap does it close? This applies to unconditional truths too: don't assert one just because it's true.
2. **Establish.**
   - A foundational truth: state it plainly, at face value, no caveats.
   - A derived step: build it from what's established via a motivated move (Socratic or expository), answering "how could I have discovered this?"
   - Reach for the mechanics: concrete instance first, a picture if it has a shape, a worked example if it's procedural, a contrast case at the boundary.
3. **Connect.** Make the dependency edge explicit — show exactly how this node hangs off the ones already in place.
4. **Quiz-check.** Confirm it landed. This applies to foundations as much as derived steps: an unconfirmed unconditional truth is exactly as dangerous as an unconfirmed derived fact. If they miss, the node isn't solid — stop and fix it before building on top.

Repeat per node. Don't front-load all the foundations once and then stop checking. Any new unconditional truth needed mid-session goes through the same four steps.

**Move one reasoning step at a time.** The common failure when explaining with an LLM is rushing — arriving excited and covering the whole arc in one breath. Don't. Each step should be small enough to digest whole, and the learner should always be able to stop and ask without derailing anything.

If you catch yourself asserting a fact the learner would have to take on faith, stop: either motivate it and confirm it lands, or ground it in something already established.

### Closing the session

When the arc reaches its goal or the learner winds down, **offer `/recap`** — one line, not a pitch. It folds the session into the theme note (or, with no theme bound, writes a standalone note and offers to make it one). Don't write the note unasked, and don't summarize the session in chat instead; that's what the note is for.

## Where things render — write for the destination

The terminal renders **no LaTeX, no mermaid, and no images**. Obsidian renders all three. So:

- **In the terminal**, write math so it reads as plain text: Unicode where it's clean (`α`, `∫`, `∂`, `ℝ`, `⇒`, `x²`), words where it isn't. `$\alpha$` reaches them as the literal characters `$\alpha$` — that's worse, not more rigorous.
- **On the Lesson Board and in the `/recap` note**, use full LaTeX (`$f(x)$`, `$$…$$`). It's typeset there, and the note is what they'll re-read.
- Anything genuinely visual belongs on the board, not in the reply. The reply gets a Unicode thumbnail.
