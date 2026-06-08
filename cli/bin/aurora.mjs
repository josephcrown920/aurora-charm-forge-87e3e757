#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || "/tmp", ".aurora");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const API_BASE = process.env.AURORA_API_BASE || "https://aurorastudiostar.lovable.app";

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {}
  return { apiKey: null };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function rl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

async function prompt(question) {
  const interface = rl();
  return new Promise((resolve) => {
    interface.question(question, (answer) => {
      interface.close();
      resolve(answer);
    });
  });
}

async function login() {
  console.log("\n🎬 Aurora Studio CLI Login\n");
  console.log(`Open your dashboard to get an API key:\n  ${API_BASE}/dashboard\n`);
  const apiKey = await prompt("Paste your API key: ");
  if (!apiKey.trim()) {
    console.error("❌ API key required");
    process.exit(1);
  }
  saveConfig({ apiKey: apiKey.trim() });
  console.log("✅ API key saved to " + CONFIG_FILE);
}

async function generate() {
  const config = getConfig();
  if (!config.apiKey) {
    console.error("❌ Not logged in. Run: aurora login");
    process.exit(1);
  }

  const argv = process.argv.slice(2);
  let prompt = "";
  let outFile = "aurora-shot.png";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--prompt" && argv[i + 1]) {
      prompt = argv[i + 1];
      i++;
    } else if (argv[i] === "--out" && argv[i + 1]) {
      outFile = argv[i + 1];
      i++;
    }
  }

  if (!prompt) {
    console.error("❌ --prompt required");
    process.exit(1);
  }

  console.log("\n📸 Generating...");
  try {
    const res = await fetch(`${API_BASE}/api/public/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ ${res.status}: ${err}`);
      process.exit(1);
    }

    const json = await res.json();
    const imageUrl = json.resultUrl || json.url;
    if (!imageUrl) {
      console.error("❌ No image returned");
      process.exit(1);
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to fetch image");
    const buf = await imgRes.arrayBuffer();
    fs.writeFileSync(outFile, Buffer.from(buf));
    console.log(`✅ Saved to ${outFile}`);
  } catch (e) {
    console.error("❌ Generate failed:", e.message);
    process.exit(1);
  }
}

async function whoami() {
  const config = getConfig();
  if (config.apiKey) {
    console.log(`✅ Logged in (API key: ${config.apiKey.slice(0, 8)}...)`);
  } else {
    console.log("❌ Not logged in");
  }
}

function version() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));
  console.log(pkg.version);
}

function help() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));
  console.log(`
🎬 Aurora Studio CLI v${pkg.version}

Usage:
  aurora login                         Login with API key
  aurora generate --prompt "..."      Generate image
  aurora generate --prompt "..." --out file.png
  aurora whoami                        Show current account
  aurora version                       Print version
  aurora help                          Show this help

Environment:
  AURORA_API_BASE                    Override API base (default: aurorastudiostar.lovable.app)

Get an API key: ${API_BASE}/dashboard
`);
}

const cmd = process.argv[2];

switch (cmd) {
  case "login":
    await login();
    break;
  case "generate":
    await generate();
    break;
  case "whoami":
    await whoami();
    break;
  case "version":
    version();
    break;
  case "help":
  case "-h":
  case "--help":
    help();
    break;
  default:
    console.log(`aurora: unknown command '${cmd || "(none)"}'\\nRun: aurora help`);
    process.exit(1);
}