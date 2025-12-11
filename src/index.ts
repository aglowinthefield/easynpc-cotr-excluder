import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { parse } from 'smol-toml';
import sevenZip from '7zip-min';
import {
  type Config,
  type ProfileLogEntry,
  type NPC,
  expandPath,
  updateNpc,
  generateExclusionOutput,
} from './utils';

const OUTPUT_FOLDER = 'easynpc_rsv_excluder_output';
const ARCHIVE_NAME = 'EasyNPC RSV Exclusion File.7z';
const INI_FILENAME = 'zzzEasyNPC RSV Exclude_DISTR.ini';

// Wait for user to press Enter before exiting
async function waitForKeypress(message = 'Press Enter to exit...'): Promise<void> {
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

async function main(): Promise<string | null | false> {
  console.log('='.repeat(60));
  console.log('  EasyNPC RSV Excluder');
  console.log('  Generates RSV exclusion file for COTR NPCs');
  console.log('='.repeat(60));
  console.log();

  // Find and load config
  let configPath: string;
  const exeDir = path.dirname(process.execPath);
  const exeConfigPath = path.join(exeDir, 'config.toml');
  const cwdConfigPath = path.join(process.cwd(), 'config.toml');

  if (fs.existsSync(exeConfigPath)) {
    configPath = exeConfigPath;
  } else if (fs.existsSync(cwdConfigPath)) {
    configPath = cwdConfigPath;
  } else {
    console.error('ERROR: Config file not found!');
    console.error('Checked locations:');
    console.error(`  - ${exeConfigPath}`);
    console.error(`  - ${cwdConfigPath}`);
    console.error('\nMake sure config.toml is in the same folder as the exe.');
    return false;
  }

  console.log(`Config: ${configPath}`);
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = parse(configContent) as Config;

  // Resolve profile path
  const profilePath = expandPath(config.EasyNpcProfilePath);
  console.log(`Profile log: ${profilePath}`);

  if (!fs.existsSync(profilePath)) {
    console.error(`\nERROR: EasyNPC Profile.log not found!`);
    console.error(`Expected location: ${profilePath}`);
    console.error('\nMake sure EasyNPC has been run at least once.');
    return false;
  }

  // Process the profile log
  console.log('\nProcessing profile log...');
  
  const npcs: Record<string, NPC> = {};
  let lineCount = 0;
  let parseErrors = 0;

  const fileStream = fs.createReadStream(profilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    lineCount++;
    try {
      const profileLogEntry = JSON.parse(line) as ProfileLogEntry;
      updateNpc(npcs, profileLogEntry);
    } catch {
      parseErrors++;
    }
  }

  console.log(`  Processed ${lineCount} log entries`);
  if (parseErrors > 0) {
    console.log(`  (${parseErrors} entries skipped due to parse errors)`);
  }

  // Count NPCs and COTR matches
  const totalNpcs = Object.keys(npcs).length;
  const cotrNpcs = Object.values(npcs).filter(
    npc => npc.FacePlugin && config.COTRPlugins.includes(npc.FacePlugin)
  );

  console.log(`  Found ${totalNpcs} unique NPCs with modifications`);
  console.log(`  Found ${cotrNpcs.length} NPCs using COTR presets`);

  if (cotrNpcs.length === 0) {
    console.log('\nNo COTR NPCs found - nothing to exclude.');
    console.log('This might mean:');
    console.log('  - No NPCs are using COTR presets in EasyNPC');
    console.log('  - The COTR plugin names in config.toml need updating');
    return null;
  }

  // Generate output
  const result = generateExclusionOutput(npcs, config.COTRPlugins);
  
  // Create output folder (delete existing if present)
  const outputDir = path.join(exeDir, OUTPUT_FOLDER);
  
  if (fs.existsSync(outputDir)) {
    console.log(`\nRemoving existing output folder...`);
    fs.rmSync(outputDir, { recursive: true });
  }
  
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Write the INI file
  const iniPath = path.join(outputDir, INI_FILENAME);
  fs.writeFileSync(iniPath, result);
  console.log(`\nCreated: ${iniPath}`);

  // Create 7z archive
  const archivePath = path.join(outputDir, ARCHIVE_NAME);
  console.log(`Creating archive: ${archivePath}`);
  
  try {
    await new Promise<void>((resolve, reject) => {
      sevenZip.pack(iniPath, archivePath, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (err: unknown) {
    console.error(`\nERROR: Failed to create 7z archive!`);
    console.error('Details:', err);
    console.log(`\nThe INI file was still created at:`);
    console.log(`  ${iniPath}`);
    return false;
  }
  
  // Delete the loose INI file after successful archive creation
  fs.unlinkSync(iniPath);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SUCCESS!`);
  console.log('='.repeat(60));
  console.log(`\nExcluded ${cotrNpcs.length} NPCs from RSV.`);
  console.log(`\nOutput archive created at:`);
  console.log(`  ${archivePath}`);
  console.log(`\nTo install:`);
  console.log(`  1. Open your mod manager (MO2, Vortex, etc.)`);
  console.log(`  2. Install the archive as a new mod`);
  console.log(`  3. Enable the mod and place it after RSV in your load order`);

  // Show a few examples
  if (cotrNpcs.length > 0) {
    console.log('\nSample excluded NPCs:');
    cotrNpcs.slice(0, 5).forEach(npc => {
      console.log(`  - ${npc.id} (${npc.master}) -> ${npc.FacePlugin}`);
    });
    if (cotrNpcs.length > 5) {
      console.log(`  ... and ${cotrNpcs.length - 5} more`);
    }
  }

  return outputDir;
}

// Run main and handle errors
main()
  .then(async (result) => {
    if (typeof result === 'string') {
      // Success - open output folder
      await waitForKeypress('Press Enter to open output folder and exit...');
      Bun.spawn(['explorer', result], { stdout: 'ignore', stderr: 'ignore' });
      process.exit(0);
    } else if (result === null) {
      // No COTR NPCs found - not an error, just nothing to do
      await waitForKeypress();
      process.exit(0);
    } else {
      // Error occurred (result is false)
      console.log('\n[!] There were errors. See above for details.');
      await waitForKeypress();
      process.exit(1);
    }
  })
  .catch(async (error: unknown) => {
    console.error('\nUnexpected error:', error);
    await waitForKeypress();
    process.exit(1);
  });
