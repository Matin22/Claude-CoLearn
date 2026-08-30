#!/usr/bin/env node
/**
 * board.mjs — the live "Lesson Board".
 *
 * The Claude Code terminal renders no images, no mermaid and no LaTeX, so a
 * lesson taught purely in the terminal is a lesson with no pictures in it.
 * The board is the fix: ONE note the learner keeps open in Obsidian beside
 * the terminal, which receives only the visual half of the lesson — diagrams,
 * graphs, and display math — rendered live.
 *
 * It is deliberately NOT a transcript. `start` truncates it, so it holds one
 * lesson at a time and never accumulates dialogue. The permanent artifact of
 * a session is the /recap note; this file is scratch and can be deleted at
 * any time without losing anything.
 *
 *   start <vault> [--title T] [--path REL]   begin a lesson (truncates)
 *   add   <vault> [--caption C] [--image F] [--stdin] [--no-lint]  append one visual
 *   where <vault> [--path REL]               print the board's path
 */
import fs from "node:fs";
import path from "node:path";
import { resolveVault, safeJoin, vaultConfig, attachFile } from "../../lib/obsidian.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];

function flag(name, fallback) {
	const i = argv.indexOf(name);
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

function die(msg) {
	console.log(msg);
	process.exit(1);
}

function vaultOrDie(arg) {
	const r = resolveVault(arg);
	if (r.error) die(`board.mjs: ${r.error}`);
	return r.path;
}

/** Default into the vault's own "new file" folder so the board lands where
 *  scratch notes already live in that vault, not somewhere invented. */
function boardPath(vaultPath) {
	const explicit = flag("--path", null);
	if (explicit) {
		const abs = safeJoin(vaultPath, explicit.endsWith(".md") ? explicit : `${explicit}.md`);
		if (!abs) die("board.mjs: refusing to write outside the vault.");
		return abs;
	}
	const folder = vaultConfig(vaultPath).newFileFolder || "";
	return path.join(vaultPath, folder, "Lesson Board.md");
}

/**
 * Read the markdown body from stdin — ONLY when --stdin was passed.
 *
 * Reading unconditionally hangs: under an agent's shell, stdin is an
 * inherited pipe that is neither a TTY nor ever closed, so `end` never
 * fires and `board.mjs add --image x.png` blocks forever. Opt-in plus a
 * hard timeout means the command always terminates.
 */
/**
 * Cheap mermaid lint — run on every block before it reaches the board.
 *
 * A diagram that fails to parse renders in Obsidian as an error box, and
 * nothing upstream notices: the teaching carries on believing it drew a
 * picture. That is the exact silent failure this system exists to remove, so
 * the board refuses to accept mermaid it can see is broken.
 *
 * Deliberately syntactic and instant — a real parse costs a ~10s mermaid-cli
 * round-trip, which is too slow to sit inside a lesson. These are the
 * footguns that actually come up.
 */
const MERMAID_RESERVED = new Set([
	"click", "class", "classDef", "graph", "subgraph", "end", "style",
	"linkStyle", "default", "call", "href", "link", "direction",
]);

function lintMermaid(body) {
	const problems = [];
	const fences = [...body.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
	for (const src of fences) {
		for (const line of src.split("\n")) {
			// `classDef click ...` / `A:::click` — a reserved word used as a class
			// name makes the parser expect a click-handler and abort the graph.
			const def = line.match(/^\s*classDef\s+([A-Za-z_][\w-]*)/);
			if (def && MERMAID_RESERVED.has(def[1])) {
				problems.push(`classDef "${def[1]}" is a reserved mermaid keyword — rename it (e.g. "${def[1]}Node")`);
			}
			for (const m of line.matchAll(/:::([A-Za-z_][\w-]*)/g)) {
				if (MERMAID_RESERVED.has(m[1])) {
					problems.push(`class ":::${m[1]}" is a reserved mermaid keyword — rename it (e.g. "${m[1]}Node")`);
				}
			}
			// A node whose id is `end` breaks flowchart parsing outright — and it
			// shows up mid-line far more often than at the start (`A --> end[done]`).
			// Requiring a bracket after keeps `subgraph ... end` untouched.
			if (/(^|[\s>])end\s*[[({]/.test(line)) {
				problems.push('node id "end" is reserved — rename it (e.g. "finish")');
			}
		}
	}
	return [...new Set(problems)];
}

function readStdin() {
	if (!argv.includes("--stdin")) return Promise.resolve("");
	return new Promise((resolve) => {
		let d = "";
		const done = (v) => {
			clearTimeout(timer);
			resolve(v);
		};
		const timer = setTimeout(() => done(d), 5000);
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (c) => (d += c));
		process.stdin.on("end", () => done(d));
		process.stdin.on("error", () => done(d));
	});
}

if (cmd === "start") {
	const vaultPath = vaultOrDie(argv[1]);
	const abs = boardPath(vaultPath);
	const title = flag("--title", "Lesson");
	const header = `---
type: lesson-board
status: live
---

# ${title}

> [!info] Live board — diagrams only
> This note is rewritten at the start of every lesson and holds no dialogue.
> The permanent note for this session comes from \`/recap\`.

`;
	try {
		fs.mkdirSync(path.dirname(abs), { recursive: true });
		fs.writeFileSync(abs, header, "utf8");
	} catch (e) {
		die(`board.mjs start: cannot write ${abs} — ${e.message}`);
	}
	console.log(`BOARD  ${abs}`);
	console.log("Tell the learner to open this note in Obsidian and keep it beside the terminal.");
	process.exit(0);
}

if (cmd === "add") {
	const vaultPath = vaultOrDie(argv[1]);
	const abs = boardPath(vaultPath);
	if (!fs.existsSync(abs)) die(`board.mjs add: no board at ${abs} — run \`start\` first.`);

	const caption = flag("--caption", null);
	const image = flag("--image", null);
	const body = await readStdin();

	let chunk = "";
	if (caption) chunk += `## ${caption}\n\n`;
	if (image) {
		const r = attachFile(vaultPath, image);
		if (r.error) {
			console.log(`FAIL  ${image} — ${r.error}`);
			process.exit(1);
		}
		chunk += `${r.embed}\n\n`;
	}
	if (body.trim()) {
		const problems = argv.includes("--no-lint") ? [] : lintMermaid(body);
		if (problems.length) {
			console.log("REJECTED  this mermaid will not render — Obsidian would show an error box:");
			for (const p of problems) console.log(`  - ${p}`);
			console.log("Fix it and re-run. Override with --no-lint only if you are certain.");
			process.exit(1);
		}
		chunk += `${body.trim()}\n\n`;
	}
	if (!chunk.trim()) die("board.mjs add: nothing to add — pass --caption, --image, or --stdin with a body.");

	try {
		fs.appendFileSync(abs, chunk, "utf8");
	} catch (e) {
		die(`board.mjs add: cannot append — ${e.message}`);
	}
	console.log(`ADDED  ${caption || image || "block"} → ${path.basename(abs)}`);
	process.exit(0);
}

if (cmd === "where") {
	const vaultPath = vaultOrDie(argv[1]);
	const abs = boardPath(vaultPath);
	console.log(`${fs.existsSync(abs) ? "EXISTS" : "ABSENT"}  ${abs}`);
	process.exit(0);
}

console.log(`board.mjs — the live, diagrams-only lesson board

  start <vault> [--title T] [--path REL]   begin a lesson (TRUNCATES the board)
  add   <vault> [--caption C] [--image F] [--stdin] [--no-lint]
        append one visual. With --stdin, the markdown body is read from stdin
        (use a heredoc); without it, stdin is not read at all.
  where <vault> [--path REL]               print the board's path

<vault> is a registered vault NAME or an absolute path.
Default board path: <vault>/<newFileFolder>/Lesson Board.md`);
process.exit(cmd ? 1 : 0);
