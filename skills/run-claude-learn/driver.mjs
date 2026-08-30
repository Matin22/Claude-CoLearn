#!/usr/bin/env node
/**
 * driver.mjs — exercise the learn system without teaching a lesson.
 *
 * This repo has no app to launch: it is a Claude Code configuration, and its
 * "runtime" is a teaching session. That makes the interesting failures the
 * silent ones — a renderer that isn't installed, an embed that doesn't
 * resolve, a skill whose frontmatter stops it being discovered. None of those
 * announce themselves; they just quietly produce a lesson with no pictures,
 * which is the exact bug this system was rebuilt to fix.
 *
 * So the driver checks the four things that actually break:
 *
 *   deps    the binaries the makers shell out to
 *   skills  frontmatter, so Claude Code can discover and route to them
 *   vault   the Obsidian plumbing, against a THROWAWAY vault fixture
 *   render  a real mermaid PNG and a real SVG PNG, on disk, with real bytes
 *
 * The vault checks build their own vault in a temp dir. The driver never
 * touches the user's real notes.
 *
 * Usage:
 *   node .claude/skills/run-claude-learn/driver.mjs            # all offline checks
 *   node .claude/skills/run-claude-learn/driver.mjs --render   # just the renderers
 *   node .claude/skills/run-claude-learn/driver.mjs --session "topic"
 *                                                # + a real headless claude run
 * Exits non-zero if any check fails.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", ".."); // the .claude / repo root
const argv = process.argv.slice(2);
const only = (name) => argv.includes(`--${name}`);
const runAll = !argv.some((a) => a.startsWith("--") && a !== "--verbose");

const results = [];
function check(name, fn) {
	try {
		const detail = fn();
		results.push({ name, ok: true, detail: detail || "" });
	} catch (e) {
		results.push({ name, ok: false, detail: e.message });
	}
}
function assert(cond, msg) {
	if (!cond) throw new Error(msg);
}
function which(bin) {
	try {
		return execSync(`command -v ${bin}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
	} catch {
		return null;
	}
}
function node(script, args, opts = {}) {
	return execFileSync(process.execPath, [script, ...args], {
		encoding: "utf8",
		stdio: [opts.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
		cwd: opts.cwd || ROOT,
		...opts,
	});
}

// ---------------------------------------------------------------- deps
if (runAll || only("deps")) {
	check("deps: node >= 18", () => {
		const major = Number(process.versions.node.split(".")[0]);
		assert(major >= 18, `node ${process.versions.node} is too old`);
		return `v${process.versions.node}`;
	});
	check("deps: npx (mermaid-maker)", () => {
		const p = which("npx");
		assert(p, "npx not found — mermaid-maker cannot render");
		return p;
	});
	check("deps: rsvg-convert or magick (svg-maker)", () => {
		const p = which("rsvg-convert") || which("magick");
		assert(p, "neither rsvg-convert nor magick found — svg-maker can ONLY return RESULT: NONE.\n" + "    Fix: brew install librsvg   (macOS)  |  apt install librsvg2-bin  (Linux)");
		return p;
	});
}

// ---------------------------------------------------------------- skills
if (runAll || only("skills")) {
	const front = (file) => {
		const src = fs.readFileSync(file, "utf8");
		const m = src.match(/^---\n([\s\S]*?)\n---/);
		assert(m, `${path.relative(ROOT, file)}: missing YAML frontmatter`);
		const out = {};
		for (const line of m[1].split("\n")) {
			const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
			if (kv) out[kv[1]] = kv[2].trim();
		}
		return out;
	};

	check("skills: every SKILL.md is discoverable", () => {
		const dirs = fs.readdirSync(path.join(ROOT, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory());
		assert(dirs.length, "no skills found");
		const names = [];
		for (const d of dirs) {
			const f = path.join(ROOT, "skills", d.name, "SKILL.md");
			assert(fs.existsSync(f), `skills/${d.name}/ has no SKILL.md`);
			const fm = front(f);
			assert(fm.name, `skills/${d.name}: frontmatter has no name`);
			assert(fm.description, `skills/${d.name}: frontmatter has no description — it will never auto-trigger`);
			assert(fm.name === d.name, `skills/${d.name}: frontmatter name "${fm.name}" != directory name`);
			names.push(fm.name);
		}
		return names.join(", ");
	});

	check("agents: frontmatter complete", () => {
		const files = fs.readdirSync(path.join(ROOT, "agents")).filter((f) => f.endsWith(".md"));
		assert(files.length, "no agents found");
		for (const f of files) {
			const fm = front(path.join(ROOT, "agents", f));
			for (const key of ["name", "description", "tools", "model"]) {
				assert(fm[key], `agents/${f}: missing ${key}`);
			}
			assert(fm.name === f.replace(/\.md$/, ""), `agents/${f}: name != filename`);
		}
		return `${files.length} agents`;
	});

	check("commands: frontmatter complete", () => {
		const dir = path.join(ROOT, "commands");
		if (!fs.existsSync(dir)) return "none";
		const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
		for (const f of files) assert(front(path.join(dir, f)).description, `commands/${f}: missing description`);
		return `${files.length} commands`;
	});

	check("settings.json parses", () => {
		JSON.parse(fs.readFileSync(path.join(ROOT, "settings.json"), "utf8"));
		return "ok";
	});

	check("no dangling references to removed files", () => {
		const stale = [];
		const walk = (d) => {
			for (const e of fs.readdirSync(d, { withFileTypes: true })) {
				if (e.name === ".git" || e.name === "node_modules" || e.name === "viz") continue;
				const p = path.join(d, e.name);
				if (e.isDirectory()) walk(p);
				else if (/\.(md|json|mjs)$/.test(e.name)) {
					// Skip this file: it necessarily contains the pattern it searches for.
					if (path.resolve(p) === path.resolve(fileURLToPath(import.meta.url))) continue;
					const src = fs.readFileSync(p, "utf8");
					// The chronological logger was removed; a lingering mention means
					// the docs describe a system that no longer exists.
					if (/md-log|md-unlog/.test(src)) stale.push(path.relative(ROOT, p));
				}
			}
		};
		walk(ROOT);
		assert(!stale.length, `stale md-log references in: ${stale.join(", ")}`);
		return "clean";
	});
}

// ---------------------------------------------------------------- vault
if (runAll || only("vault")) {
	// A throwaway vault, so the real notes are never touched.
	const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "learn-vault-"));
	fs.mkdirSync(path.join(fixture, ".obsidian"), { recursive: true });
	fs.mkdirSync(path.join(fixture, "00 Inbox"), { recursive: true });
	fs.mkdirSync(path.join(fixture, "02 Concepts"), { recursive: true });
	fs.writeFileSync(
		path.join(fixture, ".obsidian", "app.json"),
		JSON.stringify({ attachmentFolderPath: "99 Meta/Attachments", useMarkdownLinks: false, newFileFolderPath: "00 Inbox" }),
	);
	const VAULT = path.join(ROOT, "skills", "recap", "vault.mjs");

	check("vault.mjs: reads a vault's own config", () => {
		const out = node(VAULT, ["folders", fixture]);
		assert(out.includes("00 Inbox") && out.includes("02 Concepts"), `unexpected folders:\n${out}`);
		return "folders ok";
	});

	check("vault.mjs: new reports NEW then EXISTS", () => {
		const rel = "02 Concepts/Driver Probe.md";
		const a = node(VAULT, ["new", fixture, rel]);
		assert(a.startsWith("NEW"), `expected NEW, got: ${a.trim()}`);
		fs.writeFileSync(path.join(fixture, rel), "# probe\n");
		const b = node(VAULT, ["new", fixture, rel]);
		assert(b.startsWith("EXISTS"), `expected EXISTS, got: ${b.trim()}`);
		return "NEW → EXISTS";
	});

	check("vault.mjs: refuses to escape the vault", () => {
		let escaped = false;
		try {
			node(VAULT, ["new", fixture, "../../escape.md"]);
			escaped = true;
		} catch {
			/* non-zero exit is the pass */
		}
		assert(!escaped, "path traversal was NOT blocked");
		return "blocked";
	});

	check("theme.mjs: bind creates, rebind preserves", () => {
		const THEME = path.join(ROOT, "skills", "recap", "theme.mjs");
		// Binding writes machine-local state; stash and restore the real one so
		// running the driver never clobbers whatever theme the user is on.
		const statePath = path.join(ROOT, "learn-state", "themes.json");
		const saved = fs.existsSync(statePath) ? fs.readFileSync(statePath, "utf8") : null;
		try {
			const rel = "02 Concepts/Driver Theme.md";
			const created = node(THEME, ["bind", fixture, rel, "--title", "Driver Theme"]);
			assert(created.startsWith("CREATED"), `expected CREATED, got: ${created.split("\n")[0]}`);
			assert(fs.existsSync(path.join(fixture, rel)), "theme note not created");

			// Re-binding must not clobber a note that already has content.
			fs.appendFileSync(path.join(fixture, rel), "\n## Key ideas\n\n- something learned\n");
			const again = node(THEME, ["bind", fixture, rel]);
			assert(again.startsWith("BOUND"), `expected BOUND on rebind, got: ${again.split("\n")[0]}`);
			assert(/Key ideas/.test(again), `digest should surface existing sections:\n${again}`);
			assert(/something learned/.test(fs.readFileSync(path.join(fixture, rel), "utf8")), "rebind destroyed note content");

			const cur = node(THEME, ["current"]);
			assert(/Driver Theme/.test(cur), `current did not report the bound theme:\n${cur}`);

			node(THEME, ["unbind"]);
			assert(/No theme bound/.test(node(THEME, ["current"])), "unbind did not clear the binding");

			let escaped = false;
			try {
				node(THEME, ["bind", fixture, "../../escape.md"]);
				escaped = true;
			} catch {
				/* non-zero exit is the pass */
			}
			assert(!escaped, "theme bind allowed a path outside the vault");
			return "create → rebind → current → unbind";
		} finally {
			if (saved !== null) fs.writeFileSync(statePath, saved, "utf8");
			else fs.rmSync(statePath, { force: true });
		}
	});

	check("obsidian.mjs: a plain local folder defaults to markdown links, not wikilinks", () => {
		// A folder with no .obsidian/app.json is the "no Obsidian" case /learn and
		// /recap now offer. It must not default to Obsidian's own wikilink style,
		// which is dead text outside Obsidian.
		const local = fs.mkdtempSync(path.join(os.tmpdir(), "learn-local-"));
		const srcDir = fs.mkdtempSync(path.join(os.tmpdir(), "learn-local-src-"));
		try {
			const png = path.join(srcDir, "probe.png");
			fs.writeFileSync(png, Buffer.from("89504e470d0a1a0a0000000d494844520000000100000001080600000" + "01f15c4890000000a49444154789c6300010000050001" + "0d0a2db40000000049454e44ae426082", "hex"));
			const out = node(VAULT, ["attach", local, png]);
			assert(out.startsWith("OK"), `attach failed: ${out}`);
			assert(!/\[\[/.test(out), `local folder produced a wikilink embed, expected markdown: ${out}`);
			assert(/!\[\]\(/.test(out), `expected a markdown image link, got: ${out}`);
			return "markdown links ok";
		} finally {
			fs.rmSync(local, { recursive: true, force: true });
			fs.rmSync(srcDir, { recursive: true, force: true });
		}
	});

	fs.rmSync(fixture, { recursive: true, force: true });
}

// ---------------------------------------------------------------- render
if (runAll || only("render")) {
	const work = fs.mkdtempSync(path.join(os.tmpdir(), "learn-render-"));

	check("render: svg-maker pipeline produces a real PNG", () => {
		const bin = which("rsvg-convert") || which("magick");
		assert(bin, "no SVG renderer installed");
		const svg = path.join(work, "d.svg");
		const png = path.join(work, "d.png");
		fs.writeFileSync(
			svg,
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">
<rect width="200" height="120" fill="white"/>
<line x1="20" y1="100" x2="180" y2="100" stroke="#333" stroke-width="2"/>
<line x1="20" y1="100" x2="140" y2="30" stroke="#c0392b" stroke-width="3"/>
<text x="146" y="28" font-family="sans-serif" font-size="13" fill="#c0392b">v</text></svg>`,
		);
		if (bin.endsWith("rsvg-convert")) execFileSync(bin, ["-z", "2", svg, "-o", png], { stdio: "ignore" });
		else execFileSync(bin, ["-density", "192", "-background", "white", svg, png], { stdio: "ignore" });
		const size = fs.statSync(png).size;
		assert(size > 1000, `PNG suspiciously small (${size} bytes) — renderer probably produced a blank`);
		return `${bin.split("/").pop()} → ${size} bytes`;
	});

	check("render: mermaid-maker pipeline produces a real PNG", () => {
		assert(which("npx"), "npx missing");
		const mmd = path.join(work, "d.mmd");
		const png = path.join(work, "m.png");
		fs.writeFileSync(mmd, "graph TD\n  A[ocean] --> B[evaporation]\n  B --> C[clouds]\n  C --> D[rain]\n  D --> A\n");
		try {
			execFileSync("npx", ["-y", "@mermaid-js/mermaid-cli", "-i", mmd, "-o", png, "-s", "2", "-b", "white"], {
				stdio: "ignore",
				timeout: 300000,
			});
		} catch (e) {
			throw new Error(`mermaid-cli failed (first run downloads ~200MB of Chromium; retry, or check network): ${e.message}`);
		}
		const size = fs.statSync(png).size;
		assert(size > 2000, `PNG suspiciously small (${size} bytes)`);
		return `${size} bytes`;
	});

	console.log(`\n  rendered fixtures kept at: ${work}\n  (look at them — a renderer that emits a blank PNG still "passes" a size check)`);
}

// ---------------------------------------------------------------- session
const sessionIdx = argv.indexOf("--session");
if (sessionIdx !== -1) {
	const topic = argv[sessionIdx + 1] || "what a hash table is";
	check("session: headless claude engages the teach skill", () => {
		assert(which("claude"), "claude CLI not found");
		// Skills are discovered from `<project>/.claude/skills`, so the repo has
		// to BE a .claude directory. Running from the checkout finds nothing.
		const proj = fs.mkdtempSync(path.join(os.tmpdir(), "learn-session-"));
		fs.symlinkSync(ROOT, path.join(proj, ".claude"), "dir");
		try {
			const out = execSync(
				`claude -p ${JSON.stringify(`teach me ${topic}`)} --max-turns 8 ` +
					`--permission-mode bypassPermissions ` +
					`--allowed-tools "Skill,Bash,Read,Write,Agent" ` +
					`--output-format stream-json --verbose 2>&1`,
				{ encoding: "utf8", cwd: proj, timeout: 480000, maxBuffer: 64 * 1024 * 1024 },
			);
			const tools = [];
			for (const line of out.split("\n")) {
				if (!line.trim()) continue;
				let j;
				try {
					j = JSON.parse(line);
				} catch {
					continue;
				}
				const c = j?.message?.content;
				if (!Array.isArray(c)) continue;
				for (const b of c) if (b.type === "tool_use") tools.push(`${b.name}:${b.input?.skill || b.input?.command || ""}`);
			}
			assert(tools.some((t) => t.startsWith("Skill:teach")), `teach skill never engaged. Tools seen: ${tools.join(", ") || "(none)"}`);
			return `tools: ${tools.map((t) => t.split(":")[0]).join(" → ")}`;
		} finally {
			fs.rmSync(proj, { recursive: true, force: true });
		}
	});
}

// ---------------------------------------------------------------- report
const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
for (const r of results) {
	console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(pad)}  ${r.detail}`);
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
	console.log(`\nFailures:`);
	for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
}
process.exit(failed.length ? 1 : 0);
