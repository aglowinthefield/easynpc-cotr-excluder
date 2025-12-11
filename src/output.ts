import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import type { NPC } from './utils';

const OUTPUT_FOLDER = 'easynpc_rsv_excluder_output';
const ARCHIVE_NAME = 'EasyNPC RSV Exclusion File.7z';
const INI_FILENAME = 'zzzEasyNPC RSV Exclude_DISTR.ini';

/**
 * Find 7za.exe - looks in the same directory as the executable first,
 * then falls back to the bundled node_modules path for development.
 */
function find7zaPath(): string {
  const exeDir = path.dirname(process.execPath);
  
  // For standalone exe: look for 7za.exe next to the executable
  const localPath = path.join(exeDir, '7za.exe');
  if (fs.existsSync(localPath)) {
    return localPath;
  }
  
  // For development: try to use the 7zip-bin package
  try {
    const sevenZipBin = require('7zip-bin');
    if (sevenZipBin.path7za && fs.existsSync(sevenZipBin.path7za)) {
      return sevenZipBin.path7za;
    }
  } catch {
    // 7zip-bin not available
  }
  
  throw new Error(
    `Could not find 7za.exe. Please ensure 7za.exe is in the same folder as the executable (${exeDir})`
  );
}

/**
 * Create a 7z archive using the 7za command-line tool
 */
function create7zArchive(inputFile: string, outputArchive: string): void {
  const sevenZaPath = find7zaPath();
  
  const proc = spawnSync(sevenZaPath, ['a', outputArchive, inputFile], {
    stdio: 'inherit',
  });
  
  if (proc.status !== 0) {
    throw new Error(`7za failed with exit code ${proc.status}`);
  }
}

export interface OutputResult {
  outputDir: string;
  archivePath: string;
}

export async function createOutput(
  npcs: Record<string, NPC>,
  excludePlugins: string[]
): Promise<OutputResult> {
  const exeDir = path.dirname(process.execPath);
  const outputDir = path.join(exeDir, OUTPUT_FOLDER);

  // Clean and create output folder
  if (fs.existsSync(outputDir)) {
    console.log(`\nRemoving existing output folder...`);
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // Write INI file
  const iniContent = generateExclusionOutput(npcs, excludePlugins);
  const iniPath = path.join(outputDir, INI_FILENAME);
  fs.writeFileSync(iniPath, iniContent);
  console.log(`\nCreated: ${iniPath}`);

  // Create archive
  const archivePath = path.join(outputDir, ARCHIVE_NAME);
  console.log(`Creating archive: ${archivePath}`);

  create7zArchive(iniPath, archivePath);

  // Remove loose INI after successful archive
  fs.unlinkSync(iniPath);

  return { outputDir, archivePath };
}

export function generateExclusionOutput(npcs: Record<string, NPC>, excludePlugins: string[]): string {
  let result = "Keyword = RSVignore|NONE|";
  const npcStrings: string[] = [];
  for (const key of Object.keys(npcs)) {
    const npc = npcs[key];
    if (npc.FacePlugin && excludePlugins.includes(npc.FacePlugin)) {
      npcStrings.push(getNpcTargetString(npc));
    }
  }
  result += npcStrings.join(',');
  return result;
}

export function getNpcTargetString(npc: NPC): string {
  return `${getNpcFormId(npc)}~${npc.master}`;
}

export function getNpcFormId(npc: NPC): string {
  return '0x' + npc.id.replace(/^0+/, '');
}


