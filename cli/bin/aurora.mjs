#!/usr/bin/env node
// Aurora Studio CLI — minimal, dependency-free.
// Talks to the public API at https://aurorastudiostar.lovable.app/api/public/*

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { stdin, stdout, argv, exit, env } from "node:process";

const API_BASE = env.AURORA_API_BASE || "https://aurorastudiostar.lovable.app";
const CFG_DIR = join(homedir(), ".aurora");
const CFG_FILE = join(CFG_DIR, "config.json");
const VERSION = "0.1.0";

function readConfig() {
  try { return JSON.parse(readFileSync(CFG_FILE, "utf8")); } catch { return {}; }
}
function writeConfig(c) {
  mkdirSync(CFG_DIR, { recursive: true });
  writeFileSync(CFG_FILE, JSON.stringify(c, null, 2));
}
function color(s, c) {
  const codes = { pink: 35, cyan: 36, gray: 90, green: 32, red: 31, bold: 1 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}

async function prompt(q) {
  const rl = createInterface({ input: stdin, output: stdout });
  const a = await rl.question(q);
  rl.close();
  return a.trim();
}

async function cmdLogin() {
  console.log(color("\n  Aurora Studio CLI", "pink"));
  console.log(color("  Get your API key at " + API_BASE + "/dashboard\n", "gray"));
  const key = await prompt("API key: ");
  if (!key) { console.error(color("No key provided.", "red")); exit(1); }
  writeConfig({ ...readConfig(), apiKey: key });
  console.log(color("✓ Saved to " + CFG_FILE, "green"));
}

async function cmdGenerate(args) {
  const cfg = readConfig();
  if (!cfg.apiKey) { console.error(color("Run 'aurora login' first.", "red")); exit(1); }
  const promptIdx = args.indexOf("--prompt");
  const outIdx = args.indexOf("--out");
  if (promptIdx < 0) { console.error(color("Usage: aurora generate --prompt \"...\" [--out file.png]", "red")); exit(1); }
  const p = args[promptIdx + 1];
  const out = outIdx > 0 ? args[outIdx + 1] : "aurora-output.png";

  console.log(color("→ Generating...", "cyan"));
  const res = await fetch(`${API_BASE}/api/public/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ prompt: p }),
  });
  if (!res.ok) {
    console.error(color(`✗ HTTP ${res.status}: ${await res.text()}`, "red"));
    exit(1);
  }
  const { url } = await res.json();
  if (!url) { console.error(color("✗ No image URL returned.", "red")); exit(1); }
  const img = await fetch(url);
  const buf = Buffer.from(await img.arrayBuffer());
  mkdirSync(dirname(out) || ".", { recursive: true });
  writeFileSync(out, buf);
  console.log(color(`✓ Saved ${out}  (${(buf.length / 1024).toFixed(0)} KB)`, "green"));
  console.log(color(`  Hosted: ${url}`, "gray"));
}

function cmdHelp() {
  console.log(`
${color("Aurora Studio CLI", "pink")} ${color("v" + VERSION, "gray")}

${color("Commands:", "bold")}
  aurora login                              Save your API key
  aurora generate --prompt "..." [--out f]  Render a cinematic shot
  aurora whoami                             Show current account
  aurora version                            Print version
  aurora help                               Show this help

${color("Environment:", "bold")}
  AURORA_API_BASE   Override the API (default: https://aurorastudiostar.lovable.app)

${color("Docs:", "bold")}  https://aurorastudiostar.lovable.app/docs/cli
`);
}

async function cmdWhoami() {
  const cfg = readConfig();
  if (!cfg.apiKey) { console.log(color("Not logged in. Run 'aurora login'.", "gray")); return; }
  const res = await fetch(`${API_BASE}/api/public/whoami`, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });
  if (!res.ok) { console.error(color(`HTTP ${res.status}`, "red")); return; }
  console.log(await res.text());
}

const [, , cmd, ...rest] = argv;
try {
  switch (cmd) {
    case "login": await cmdLogin(); break;
    case "generate": await cmdGenerate(rest); break;
    case "whoami": await cmdWhoami(); break;
    case "version":
    case "--version":
    case "-v": console.log(VERSION); break;
    case "help":
    case "--help":
    case "-h":
    case undefined: cmdHelp(); break;
    default: console.error(color(`Unknown command: ${cmd}`, "red")); cmdHelp(); exit(1);
  }
} catch (e) {
  console.error(color(`✗ ${e.message || e}`, "red"));
  exit(1);
}
