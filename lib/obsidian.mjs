/**
 * obsidian.mjs — shared vault plumbing for the learn system.
 *
 * One caller: skills/recap/vault.mjs, which writes the permanent revision
 * note. It needs the same three things every time and shouldn't guess at
 * them:
 *
 *   - where the vaults are            → Obsidian's own registry
 *   - where attachments go            → that vault's .obsidian/app.json
 *   - wikilinks or markdown links     → same place, defaulting to markdown
 *                                        links for a plain (non-Obsidian)
 *                                        folder, since wikilinks are dead
 *                                        text outside Obsidian
 *
 * Guessing any of these produces embeds that silently don't resolve, which
 * is the worst failure mode available: it looks like it worked.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/** Obsidian's vault registry — the only reliable source of vault paths. */
function registryPath() {
	const home = os.homedir();
	const candidates =
		process.platform === "darwin"
			? [path.join(home, "Library", "Application Support", "obsidian", "obsidian.json")]
			: process.platform === "win32"
				? [path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "obsidian", "obsidian.json")]
				: [
						path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "obsidian", "obsidian.json"),
						path.join(home, ".var", "app", "md.obsidian.Obsidian", "config", "obsidian", "obsidian.json"),
					];
	return candidates.find((p) => fs.existsSync(p)) || null;
}

export function readVaults() {
	const reg = registryPath();
	if (!reg) return [];
	let parsed;
	try {
		parsed = JSON.parse(fs.readFileSync(reg, "utf8"));
	} catch {
		return [];
	}
	return Object.values(parsed.vaults || {})
		.map((v) => v.path)
		.filter((p) => p && fs.existsSync(p))
		.map((p) => ({ name: path.basename(p), path: p }));
}

/** A vault's own settings decide attachment location and link syntax. */
export function vaultConfig(vaultPath) {
	let cfg = {};
	let isObsidianVault = false;
	try {
		cfg = JSON.parse(fs.readFileSync(path.join(vaultPath, ".obsidian", "app.json"), "utf8"));
		isObsidianVault = true;
	} catch {
		/* no app.json — either a fresh Obsidian vault (its defaults apply), or a
		 * plain project folder with no Obsidian involved at all. Either way
		 * there's no config to read. */
	}
	return {
		attachmentFolder: cfg.attachmentFolderPath || "",
		// A real Obsidian vault defaults to wikilinks unless it opts into
		// markdown links. A plain folder has no Obsidian to resolve a wikilink,
		// so it must default to markdown links — anything else is dead text.
		useMarkdownLinks: isObsidianVault ? cfg.useMarkdownLinks === true : true,
		newFileFolder: cfg.newFileFolderPath || "",
		isObsidianVault,
	};
}

export function topFolders(vaultPath) {
	try {
		return fs
			.readdirSync(vaultPath, { withFileTypes: true })
			.filter((e) => e.isDirectory() && !e.name.startsWith("."))
			.map((e) => e.name)
			.sort();
	} catch {
		return [];
	}
}

/** Resolve by absolute path, or by vault name (case-insensitive). */
export function resolveVault(arg) {
	if (!arg) return { error: "missing vault argument — run `list` first" };
	if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) return { path: arg };
	const hit = readVaults().find((v) => v.name.toLowerCase() === String(arg).toLowerCase());
	if (!hit) return { error: `no vault named or located at ${arg} — run \`list\` to see what's registered` };
	return { path: hit.path };
}

/** Keep writes inside the vault, whatever relative path we were handed. */
export function safeJoin(vaultPath, rel) {
	const abs = path.join(vaultPath, rel);
	if (!path.resolve(abs).startsWith(path.resolve(vaultPath) + path.sep)) return null;
	return abs;
}

export function embedFor(cfg, basename, width = 560) {
	if (cfg.useMarkdownLinks) {
		const rel = cfg.attachmentFolder ? path.posix.join(...cfg.attachmentFolder.split(path.sep), basename) : basename;
		return `![](${encodeURI(rel)})`;
	}
	return `![[${basename}${width ? `|${width}` : ""}]]`;
}

/**
 * Copy one image into the vault's attachment folder.
 *
 * Maker filenames already carry a timestamp, so they're unique across
 * sessions and Obsidian's shortest-link format resolves them from a bare
 * `![[name.png]]` anywhere in the vault. Only rename on a genuine collision
 * with different content.
 */
export function attachFile(vaultPath, srcPath, width = 560) {
	const cfg = vaultConfig(vaultPath);
	const abs = path.resolve(process.cwd(), srcPath);
	if (!fs.existsSync(abs)) return { error: "not found" };

	const destDir = path.join(vaultPath, cfg.attachmentFolder);
	try {
		fs.mkdirSync(destDir, { recursive: true });
	} catch (e) {
		return { error: `cannot create ${destDir} — ${e.message}` };
	}

	let base = path.basename(abs);
	let dest = path.join(destDir, base);
	if (fs.existsSync(dest) && fs.statSync(dest).size !== fs.statSync(abs).size) {
		const ext = path.extname(base);
		base = `${path.basename(base, ext)}-${Date.now()}${ext}`;
		dest = path.join(destDir, base);
	}
	try {
		fs.copyFileSync(abs, dest);
	} catch (e) {
		return { error: e.message };
	}
	return { basename: base, dest, embed: embedFor(cfg, base, width) };
}

/** Images published by the makers during this session. */
export function recentViz(sinceMin = 240) {
	const dir = path.resolve(process.cwd(), "viz");
	if (!fs.existsSync(dir)) return [];
	const cutoff = Date.now() - sinceMin * 60_000;
	return fs
		.readdirSync(dir)
		.filter((f) => /\.(png|jpg|jpeg|svg|webp)$/i.test(f))
		.map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
		.filter((x) => x.m >= cutoff)
		.sort((a, b) => a.m - b.m)
		.map((x) => path.join("viz", x.f));
}
