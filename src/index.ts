import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { homedir } from 'os';

const COTR_PLUGINS: string[] = [
  "Karura's Ordinary People Refined.esp",
  "MOSRefined.esp",
  "MOSRefinedDawnguard.esp",
  "MOSRefinedDragonborn.esp",
  "TDOSRefined.esp",
  "TSOSRefined.esp",
  "TSOSRefinedDawnguard.esp",
  "TSOSRefinedDragonborn.esp",
  "TSOSRefinedHearthfire.esp",
]

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

const appDataPath = path.join(homedir(), 'AppData', 'Local', 'EasyNPC', 'Profile.log');

if (!fs.existsSync(appDataPath)) {
  console.error(`File not found: ${appDataPath}`);
  process.exit(1);
}

const fileStream = fs.createReadStream(appDataPath);

// Create an interface to read the file line by line
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

const npcs: {[key: string]: NPC} = {};

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
    if (npc.FacePlugin && COTR_PLUGINS.includes(npc.FacePlugin)) {
      const npcTargetString = getNpcTargetString(npc);
      npcStrings.push(npcTargetString);
    }
  }
  result += npcStrings.join(',');
  const outputPath = path.join(process.cwd(), 'zzzEasyNPC RSV Exclude_DISTR.ini');
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