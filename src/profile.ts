import * as fs from 'fs';
import * as readline from 'readline';
import type { NPC, ProfileLogEntry } from './utils';
import { updateNpc } from './utils';

export interface ProcessResult {
  npcs: Record<string, NPC>;
  lineCount: number;
  parseErrors: number;
}

export async function processProfileLog(profilePath: string): Promise<ProcessResult> {
  const npcs: Record<string, NPC> = {};
  let lineCount = 0;
  let parseErrors = 0;

  const fileStream = fs.createReadStream(profilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;
    try {
      const entry = JSON.parse(line) as ProfileLogEntry;
      updateNpc(npcs, entry);
    } catch {
      parseErrors++;
    }
  }

  return { npcs, lineCount, parseErrors };
}

export function filterMatchingNpcs(npcs: Record<string, NPC>, excludePlugins: string[]): NPC[] {
  return Object.values(npcs).filter(
    npc => npc.FacePlugin && excludePlugins.includes(npc.FacePlugin)
  );
}

