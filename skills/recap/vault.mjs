#!/usr/bin/env node
/**
 * vault.mjs — the filesystem half of /recap.
 *
 * /recap writes ONE distilled study note into an Obsidian vault. The prose is
 * the model's job; everything that touches the filesystem is this script's:
 * finding vaults, copying diagrams in so `![[...]]` resolves, creating parent
 * folders, and refusing to silently clobber an existing note.
 *
 * Prints readable diagnostics and never throws — the caller is a language
 * model, not a shell script.
 */
import fs from "node:fs";
import path from "node:path";
import { readVaults, vaultConfig, topFolders, resolveVault, safeJoin, attachFile, recentViz } from "../../lib/obsidian.mjs";

const argv = process.argv.slice(2);
const cmd = argv[0];

function die(msg) {
	console.log(msg);
	process.exit(1);
}

function vaultOrDie(arg) {
	const r = resolveVault(arg);
	if (r.error) die(`vault.mjs: ${r.error}`);
	return r.path;
}

if (cmd === "list") {
	const vaults = readVaults();
	if (!vaults.length) {
		console.log("No Obsidian vaults registered on this machine.");
		console.log("Ask the user for an absolute path to their vault and pass that instead of a name.");
		process.exit(0);
	}
	console.log(`${vaults.length} vault(s):\n`);
	for (const v of vaults) {
		const cfg = vaultConfig(v.path);
		console.log(`- ${v.name}`);
		console.log(`  path:        ${v.path}`);
		console.log(`  attachments: ${cfg.attachmentFolder || "(vault root)"}`);
		console.log(`  links:       ${cfg.useMarkdownLinks ? "markdown []()" : "wikilinks [[]]"}`);
		console.log(`  folders:     ${topFolders(v.path).join(" | ") || "(none)"}`);
		console.log("");
	}
	process.exit(0);
}

if (cmd === "folders") {
	console.log(topFolders(vaultOrDie(argv[1])).join("\n") || "(no folders)");
	process.exit(0);
}

if (cmd === "viz") {
	const i = argv.indexOf("--since-min");
	const files = recentViz(i !== -1 ? Number(argv[i + 1]) : 240);
	console.log(files.length ? files.join("\n") : "(no rendered images this session)");
	process.exit(0);
}

if (cmd === "attach") {
	const vaultPath = vaultOrDie(argv[1]);
	const files = argv.slice(2);
	if (!files.length) die("vault.mjs attach: no files given.");
	for (const src of files) {
		const r = attachFile(vaultPath, src);
		console.log(r.error ? `FAIL  ${src} — ${r.error}` : `OK    ${r.embed}`);
	}
	process.exit(0);
}

if (cmd === "new") {
	const vaultPath = vaultOrDie(argv[1]);
	const rel = argv[2];
	if (!rel) die("vault.mjs new: missing note path relative to the vault.");
	const abs = safeJoin(vaultPath, rel.endsWith(".md") ? rel : `${rel}.md`);
	if (!abs) die("vault.mjs new: refusing to write outside the vault.");
	try {
		fs.mkdirSync(path.dirname(abs), { recursive: true });
	} catch (e) {
		die(`vault.mjs new: cannot create folder — ${e.message}`);
	}
	if (fs.existsSync(abs)) {
		console.log(`EXISTS  ${abs}`);
		console.log("Read it first and revise in place — do NOT overwrite it blind.");
	} else {
		console.log(`NEW     ${abs}`);
	}
	process.exit(0);
}

console.log(`vault.mjs — filesystem helper for /recap

  list                        registered vaults, their folders and config
  folders <vault>             top-level folders of one vault
  viz [--since-min <n>]       images published to viz/ (default 240 min)
  attach  <vault> <file...>   copy images in, print the embed for each
  new     <vault> <relpath>   mkdir parents; report NEW or EXISTS

<vault> is a registered vault NAME or an absolute path.`);
process.exit(cmd ? 1 : 0);
