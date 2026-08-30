#!/usr/bin/env node
/**
 * theme.mjs — bind a learning theme to ONE note.
 *
 * The system is theme-based, not session-based: you learn "Bayesian
 * inference" or "counterpoint" over many sittings, and all of it belongs in
 * a single note that gets deeper each time rather than a pile of dated ones.
 *
 * The note can live in an Obsidian vault, or in a plain local folder (pass
 * the project root as <vault>) — Obsidian is never required.
 *
 * Binding does two jobs, and the second is the one that matters:
 *
 *   1. /recap knows where to write without asking again.
 *   2. `teach` READS the note before teaching, so it already knows what has
 *      been covered — it probes only the new strands instead of re-walking
 *      ground the note shows is solid.
 *
 * The binding persists across sessions, because a theme does. Switching
 * themes is just binding another note.
 *
 *   bind <vault> <relpath> [--title T]   create if missing, make it current
 *   current                              the current theme note
 *   unbind                               stop targeting a theme
 *   list                                 themes bound before, most recent first
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVault, safeJoin } from "../../lib/obsidian.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const STATE = path.join(ROOT, "learn-state", "themes.json");

const argv = process.argv.slice(2);
const cmd = argv[0];

function flag(name, fallback = null) {
	const i = argv.indexOf(name);
	return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

function die(msg) {
	console.log(msg);
	process.exit(1);
}

function readState() {
	try {
		return JSON.parse(fs.readFileSync(STATE, "utf8"));
	} catch {
		return { current: null, recent: [] };
	}
}

function writeState(state) {
	fs.mkdirSync(path.dirname(STATE), { recursive: true });
	fs.writeFileSync(STATE, JSON.stringify(state, null, 2), "utf8");
}

function describe(entry, label) {
	const abs = path.join(entry.vault, entry.note);
	const exists = fs.existsSync(abs);
	console.log(`${label}  ${entry.title}`);
	console.log(`  vault: ${entry.vault}`);
	console.log(`  note:  ${abs}${exists ? "" : "   (MISSING — recreate or rebind)"}`);
	if (exists) {
		const src = fs.readFileSync(abs, "utf8");
		const heads = src.split("\n").filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, ""));
		console.log(`  size:  ${src.split("\n").length} lines`);
		console.log(`  has:   ${heads.length ? heads.join(" | ") : "(no sections yet)"}`);
	}
}

if (cmd === "bind") {
	const r = resolveVault(argv[1]);
	if (r.error) die(`theme.mjs: ${r.error}`);
	const vaultPath = r.path;
	const rel = argv[2];
	if (!rel) die("theme.mjs bind: missing note path relative to the vault.");

	const noteRel = rel.endsWith(".md") ? rel : `${rel}.md`;
	const abs = safeJoin(vaultPath, noteRel);
	if (!abs) die("theme.mjs bind: refusing to bind a note outside the vault.");

	const title = flag("--title", path.basename(noteRel, ".md"));
	let created = false;
	if (!fs.existsSync(abs)) {
		try {
			fs.mkdirSync(path.dirname(abs), { recursive: true });
			fs.writeFileSync(
				abs,
				`---\ntype: theme\ntags:\n  - learn\nstatus: seedling\n---\n\n# ${title}\n\n> [!abstract] In one paragraph\n> *(filled in at the first \`/recap\`)*\n\n`,
				"utf8",
			);
			created = true;
		} catch (e) {
			die(`theme.mjs bind: cannot create ${abs} — ${e.message}`);
		}
	}

	const state = readState();
	const entry = { title, vault: vaultPath, note: noteRel, boundAt: new Date().toISOString() };
	state.current = entry;
	state.recent = [entry, ...(state.recent || []).filter((e) => !(e.vault === vaultPath && e.note === noteRel))].slice(0, 12);
	writeState(state);

	describe(entry, created ? "CREATED" : "BOUND  ");
	if (!created) console.log("\nRead this note before teaching — it is the record of what is already understood.");
	process.exit(0);
}

if (cmd === "current") {
	const state = readState();
	if (!state.current) {
		console.log("No theme bound.");
		console.log("Bind one with: theme.mjs bind <vault> <folder>/<Theme>.md");
		console.log("Without a theme, /recap will ask where to write each time.");
		process.exit(0);
	}
	describe(state.current, "CURRENT");
	process.exit(0);
}

if (cmd === "unbind") {
	const state = readState();
	if (!state.current) {
		console.log("No theme bound.");
	} else {
		console.log(`UNBOUND  ${state.current.title}`);
		state.current = null;
		writeState(state);
	}
	process.exit(0);
}

if (cmd === "list") {
	const state = readState();
	const recent = state.recent || [];
	if (!recent.length) {
		console.log("No themes bound yet.");
		process.exit(0);
	}
	for (const e of recent) {
		const mark = state.current && state.current.vault === e.vault && state.current.note === e.note ? "*" : " ";
		console.log(`${mark} ${e.title}  —  ${path.join(e.vault, e.note)}`);
	}
	console.log("\n(* = current)");
	process.exit(0);
}

console.log(`theme.mjs — bind a learning theme to one note

  bind <vault> <relpath> [--title T]   create if missing, make it current
  current                              the current theme note
  unbind                               stop targeting a theme
  list                                 themes bound before, most recent first

<vault> is a registered Obsidian vault NAME, or any absolute directory path
(pass the project root itself to keep a theme entirely local, no Obsidian).`);
process.exit(cmd ? 1 : 0);
