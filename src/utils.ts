import { homedir } from 'os';
import * as path from 'path';

export type Config = {
  EasyNpcProfilePath: string;
  OutputPath: string;
  COTRPlugins: string[];
};

export type ProfileLogEntry = {
  master: string;
  id: string;
  time: string;
  field: 'DefaultPlugin' | 'FacePlugin' | 'FaceMod';
  oldValue: string | null;
  newValue: string;
};

export type NPC = {
  id: string;
  master: string;
  DefaultPlugin?: string;
  FacePlugin?: string;
  FaceMod?: string;
};

export function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(homedir(), p.slice(2));
  }
  if (p.startsWith('./')) {
    return path.join(process.cwd(), p.slice(2));
  }
  return p;
}

export function getNpcFormId(npc: NPC): string {
  return '0x' + npc.id.replace(/^0+/, '');
}

export function getNpcTargetString(npc: NPC): string {
  return `${getNpcFormId(npc)}~${npc.master}`;
}

export function updateNpc(npcs: Record<string, NPC>, entry: ProfileLogEntry): void {
  const npcId = entry.id;
  const field = entry.field;
  if (!npcs[npcId]) {
    npcs[npcId] = { id: npcId, master: entry.master };
  }
  npcs[npcId].master = entry.master;
  npcs[npcId][field] = entry.newValue;
}

export function generateExclusionOutput(npcs: Record<string, NPC>, cotrPlugins: string[]): string {
  let result = "Keyword = RSVignore|NONE|";
  const npcStrings: string[] = [];
  for (const key of Object.keys(npcs)) {
    const npc = npcs[key];
    if (npc.FacePlugin && cotrPlugins.includes(npc.FacePlugin)) {
      npcStrings.push(getNpcTargetString(npc));
    }
  }
  result += npcStrings.join(',');
  return result;
}

