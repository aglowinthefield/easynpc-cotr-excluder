import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { parse } from 'smol-toml';
import {
  type Config,
  type ProfileLogEntry,
  type NPC,
  expandPath,
  updateNpc,
  generateExclusionOutput,
} from './utils';

function findConfigPath(): string {
  // Check next to executable first
  const exeDir = path.dirname(process.execPath);
  const exeConfigPath = path.join(exeDir, 'config.toml');
  if (fs.existsSync(exeConfigPath)) {
    return exeConfigPath;
  }
  // Fall back to current working directory
  const cwdConfigPath = path.join(process.cwd(), 'config.toml');
  if (fs.existsSync(cwdConfigPath)) {
    return cwdConfigPath;
  }
  console.error(`Config file not found. Checked:\n  - ${exeConfigPath}\n  - ${cwdConfigPath}`);
  process.exit(1);
}

const configPath = findConfigPath();
console.log(`Using config: ${configPath}`);
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = parse(configContent) as Config;

const profilePath = expandPath(config.EasyNpcProfilePath);

if (!fs.existsSync(profilePath)) {
  console.error(`File not found: ${profilePath}`);
  process.exit(1);
}

const fileStream = fs.createReadStream(profilePath);

// Create an interface to read the file line by line
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const npcs: Record<string, NPC> = {};

function processNpcs() {
  const result = generateExclusionOutput(npcs, config.COTRPlugins);
  const outputPath = expandPath(config.OutputPath);
  fs.writeFileSync(outputPath, result);
  console.log(`Result written to ${outputPath}`);
}

rl.on('line', (line) => {
  try {
    const profileLogEntry: ProfileLogEntry = JSON.parse(line);
    updateNpc(npcs, profileLogEntry);
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});

rl.on('close', () => {
  console.log('Finished reading file.');
  processNpcs();
});
