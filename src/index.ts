import * as fs from 'fs';
import { expandPath } from './utils';
import { printBanner, printSuccess, printSampleNpcs, waitForKeypress } from './cli';
import { findConfigPath, loadConfig } from './config';
import { processProfileLog, filterMatchingNpcs } from './profile';
import { createOutput } from './output';

async function main(): Promise<string | null | false> {
  printBanner();

  // Load config
  const configPath = findConfigPath();
  if (!configPath) {
    console.error('ERROR: config.toml not found!');
    console.error('\nMake sure config.toml is in the same folder as the exe.');
    return false;
  }
  console.log(`Config: ${configPath}`);
  const config = loadConfig(configPath);

  // Check profile exists
  const profilePath = expandPath(config.EasyNpcProfilePath);
  console.log(`Profile log: ${profilePath}`);
  if (!fs.existsSync(profilePath)) {
    console.error(`\nERROR: EasyNPC Profile.log not found!`);
    console.error(`Expected location: ${profilePath}`);
    console.error('\nMake sure EasyNPC has been run at least once.');
    return false;
  }

  // Process profile log
  console.log('\nProcessing profile log...');
  const { npcs, lineCount, parseErrors } = await processProfileLog(profilePath);
  console.log(`  Processed ${lineCount} log entries`);
  if (parseErrors > 0) {
    console.log(`  (${parseErrors} entries skipped due to parse errors)`);
  }

  // Filter matches
  const totalNpcs = Object.keys(npcs).length;
  const matchedNpcs = filterMatchingNpcs(npcs, config.ExcludePlugins);
  console.log(`  Found ${totalNpcs} unique NPCs with modifications`);
  console.log(`  Found ${matchedNpcs.length} NPCs to exclude from RSV`);

  if (matchedNpcs.length === 0) {
    console.log('\nNo matching NPCs found - nothing to exclude.');
    console.log('This might mean:');
    console.log('  - No NPCs match the configured plugins in EasyNPC');
    console.log('  - The plugin names in config.toml need updating');
    return null;
  }

  // Create output
  try {
    const { outputDir, archivePath } = await createOutput(npcs, config.ExcludePlugins);
    printSuccess(matchedNpcs.length, archivePath);
    printSampleNpcs(matchedNpcs);
    return outputDir;
  } catch (err: unknown) {
    console.error(`\nERROR: Failed to create output!`);
    console.error('Details:', err);
    return false;
  }
}

// Entry point
main()
  .then(async (result) => {
    if (typeof result === 'string') {
      // Success - open output folder
      await waitForKeypress('Press Enter to open output folder and exit...');
      Bun.spawnSync(['cmd', '/c', 'start', '', result]);
    } else if (result === null) {
      // No matching NPCs found - not an error, just nothing to do
      await waitForKeypress();
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
