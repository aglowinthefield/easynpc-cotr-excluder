import * as fs from 'fs';
import * as path from 'path';
import sevenZip from '7zip-min';
import type { NPC } from './utils';
import { generateExclusionOutput } from './utils';

const OUTPUT_FOLDER = 'easynpc_rsv_excluder_output';
const ARCHIVE_NAME = 'EasyNPC RSV Exclusion File.7z';
const INI_FILENAME = 'zzzEasyNPC RSV Exclude_DISTR.ini';

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

  await new Promise<void>((resolve, reject) => {
    sevenZip.pack(iniPath, archivePath, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Remove loose INI after successful archive
  fs.unlinkSync(iniPath);

  return { outputDir, archivePath };
}

