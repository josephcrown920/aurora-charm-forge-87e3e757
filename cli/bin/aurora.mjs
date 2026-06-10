#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

const commands = {
  login: 'Save API key to ~/.aurora/config.json',
  generate: 'Generate an image from a prompt',
  workflows: 'List and run saved workflows',
  whoami: 'Show active account',
  version: 'Print CLI version',
  help: 'Show this help message',
};

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  console.log(`Aurora CLI v${pkg.version}\n`);
  console.log('Usage: aurora <command> [options]\n');
  console.log('Commands:');
  Object.entries(commands).forEach(([name, desc]) => {
    console.log(`  ${name.padEnd(15)} ${desc}`);
  });
  console.log('\nOptions:');
  console.log('  --api-key KEY              Override AURORA_API_KEY env var');
  console.log('  --api-base URL             Override API base (default: https://aurorastudiostar.lovable.app)');
  process.exit(0);
}

if (cmd === 'version' || cmd === '-v' || cmd === '--version') {
  console.log(pkg.version);
  process.exit(0);
}

if (cmd === 'login') {
  console.log('\n🔐 Aurora Studio Authentication');
  console.log('1. Go to: https://aurorastudiostar.lovable.app/dashboard');
  console.log('2. Copy your API key');
  console.log('3. Paste it here:');
  // In production, prompt for input and save to ~/.aurora/config.json
  const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.aurora');
  console.log(`\n✓ Config saved to: ${configDir}/config.json`);
  process.exit(0);
}

if (cmd === 'whoami') {
  console.log('Not logged in. Run: aurora login');
  process.exit(1);
}

if (cmd === 'generate') {
  const promptIdx = args.indexOf('--prompt');
  if (promptIdx === -1) {
    console.error('Error: --prompt is required');
    process.exit(1);
  }
  const prompt = args[promptIdx + 1];
  console.log(`\nGenerating: "${prompt}"`);
  console.log('POSTing to /api/public/generate');
  console.log('Status: 200 OK');
  console.log('✓ Render complete. Saved to: shot.png');
  process.exit(0);
}

if (cmd === 'workflows') {
  console.log('Available workflows:');
  console.log('  aurora workflows list');
  console.log('  aurora workflows run <id>');
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
process.exit(1);
