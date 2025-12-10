import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { homedir } from 'os';
import { parse } from 'smol-toml';

type Config = {
  EasyNpcProfilePath: string;
  OutputPath: string;
  COTRPlugins: string[];
};

function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(homedir(), p.slice(2));
  }
  if (p.startsWith('./')) {
    return path.join(process.cwd(), p.slice(2));
  }
  return p;
}

const configPath = path.join(process.cwd(), 'config.toml');
if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}
const configContent = fs.readFileSync(configPath, 'utf-8');
const config = parse(configContent) as Config;

type ProfileLogEntry = {
  master: string;
  id: string;
  time: string;
  field: 'DefaultPlugin' | 'FacePlugin' | 'FaceMod';
  oldValue: string | null;
  newValue: string;
};

type NPC = {
  id: string;
  master: string;
  DefaultPlugin?: string;
  FacePlugin?: string;
  FaceMod?: string;
}

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

const npcs: { [key: string]: NPC } = {};

function updateNpc(profileLogEntry: ProfileLogEntry) {
  const npcId = profileLogEntry.id;
  const field = profileLogEntry.field;
  if (!npcs[npcId]) {
    npcs[npcId] = { id: npcId, master: profileLogEntry.master };
  }
  npcs[npcId].master = profileLogEntry.master;
  npcs[npcId][field] = profileLogEntry.newValue;
}

function getNpcTargetString(npc: NPC) {
  return `${getNpcFormId(npc)}~${npc.master}`;
}

// private. dont use directly
function getNpcFormId(npc: NPC) {
  return '0x' + npc.id.replace(/^0+/, '');
}

function processNpcs() {
  const npcKeys = Object.keys(npcs);
  let result = "Keyword = RSVignore|NONE|";
  const npcStrings = [];
  for (const key of npcKeys) {
    const npc = npcs[key];
    if (npc.FacePlugin && config.COTRPlugins.includes(npc.FacePlugin)) {
      const npcTargetString = getNpcTargetString(npc);
      npcStrings.push(npcTargetString);
    }
  }
  result += npcStrings.join(',');
  const outputPath = expandPath(config.OutputPath);
  fs.writeFileSync(outputPath, result);
  console.log(`Result written to ${outputPath}`);
}

rl.on('line', (line) => {
  try {
    const profileLogEntry: ProfileLogEntry = JSON.parse(line);
    updateNpc(profileLogEntry);
  } catch (error) {
    console.error('Error parsing JSON:', error);
  }
});

rl.on('close', () => {
  console.log('Finished reading file.');
  processNpcs();
})
