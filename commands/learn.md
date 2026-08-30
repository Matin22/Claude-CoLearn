---
description: Bind this and future sessions to one theme note in Obsidian
argument-hint: "[vault] <folder>/<Theme>.md   (or just a theme name)"
---

Bind a learning **theme** to one note — in an Obsidian vault, or a plain local file if you're not using Obsidian. Everything taught from now on deepens that single note instead of scattering dated ones.

Steps:

1. If the user gave a full `<vault> <path>`, bind it directly. If they gave only a theme name or a partial path, run `node .claude/skills/recap/vault.mjs list` and ask (ungraded `AskUserQuestion`) where to bind it — **"Just this project — no Obsidian" is a real option, offer it alongside whatever vaults `list` reported** (or skip straight to it if none were found). For local, pass the project root as `<vault>` to `theme.mjs bind` below.

2. Bind it:

   ```
   node .claude/skills/recap/theme.mjs bind "<vault>" "<folder>/<Theme>.md"
   ```

   The note is created if it doesn't exist. `CREATED` means a fresh theme; `BOUND` means one with history.

3. **If it already existed, read the note now** with the `Read` tool. It is the record of what this person already understands about the theme — everything in it is ground you must not re-teach. Say briefly what it shows is covered and what its **Open threads** say is not, then ask what they want to work on this time.

4. If it was just created, say so and ask what they want to start with.

Do not begin teaching in this command — binding and orienting only.

Theme to bind (may be empty — ask if so): $ARGUMENTS
