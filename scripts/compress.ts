import { existsSync, copyFileSync, unlinkSync } from 'fs';

/**
 * Copy 7za.exe from 7zip-bin package to dist folder
 */
function copy7za(): void {
  const destPath = 'dist/7za.exe';
  
  // Try to find 7za from 7zip-bin package
  try {
    const sevenZipBin = require('7zip-bin');
    if (sevenZipBin.path7za && existsSync(sevenZipBin.path7za)) {
      copyFileSync(sevenZipBin.path7za, destPath);
      console.log(`Copied 7za.exe to dist/`);
      return;
    }
  } catch {
    // Fall through to error
  }
  
  throw new Error(
    'Could not find 7za.exe from 7zip-bin package. Run "bun install" first.'
  );
}

/**
 * Remove intermediate build artifacts
 */
function cleanupBuildArtifacts(): void {
  const intermediateFiles = ['dist/index.js'];
  for (const file of intermediateFiles) {
    if (existsSync(file)) {
      unlinkSync(file);
      console.log(`Cleaned up: ${file}`);
    }
  }
}

function prepare() {
  const exePath = 'dist/easynpc-rsv-excluder.exe';
  
  if (!existsSync(exePath)) {
    console.error(`Executable not found: ${exePath}`);
    console.error('Run "bun run build:pkg" first.');
    process.exit(1);
  }

  // Copy 7za.exe to dist folder for distribution
  copy7za();
  
  // Clean up intermediate files
  cleanupBuildArtifacts();
  
  console.log('Build preparation complete!');
}

prepare();
