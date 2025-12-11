import * as readline from 'readline';
import type { NPC } from './utils';

export function printBanner(): void {
  console.log('='.repeat(60));
  console.log('  EasyNPC RSV Excluder');
  console.log('  Generates RSV exclusion file from EasyNPC choices');
  console.log('='.repeat(60));
  console.log();
}

export function printSuccess(npcCount: number, archivePath: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  SUCCESS!');
  console.log('='.repeat(60));
  console.log(`\nExcluded ${npcCount} NPCs from RSV.`);
  console.log(`\nOutput archive created at:`);
  console.log(`  ${archivePath}`);
  console.log(`\nTo install:`);
  console.log(`  1. Install the archive as a new mod`);
  console.log(`  2. Enable it!`);
}

export function printSampleNpcs(npcs: NPC[]): void {
  if (npcs.length === 0) return;
  console.log('\nSample excluded NPCs:');
  npcs.slice(0, 5).forEach(npc => {
    console.log(`  - ${npc.id} (${npc.master}) -> ${npc.FacePlugin}`);
  });
  if (npcs.length > 5) {
    console.log(`  ... and ${npcs.length - 5} more`);
  }
}

export async function waitForKeypress(message = 'Press Enter to exit...'): Promise<void> {
  console.log(`\n${message}`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

