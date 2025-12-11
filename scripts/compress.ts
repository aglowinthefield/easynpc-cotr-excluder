import { existsSync } from 'fs';
import { join } from 'path';
import { $ } from 'bun';

const UPX_VERSION = '4.2.4';
const UPX_DIR = `upx-${UPX_VERSION}-win64`;
const UPX_ZIP = 'upx.zip';
const UPX_URL = `https://github.com/upx/upx/releases/download/v${UPX_VERSION}/upx-${UPX_VERSION}-win64.zip`;

async function ensureUpx(): Promise<string> {
  const upxPath = join(UPX_DIR, 'upx.exe');
  
  if (existsSync(upxPath)) {
    return upxPath;
  }

  console.log(`UPX not found, downloading v${UPX_VERSION}...`);
  
  // Download UPX
  const response = await fetch(UPX_URL);
  if (!response.ok) {
    throw new Error(`Failed to download UPX: ${response.statusText}`);
  }
  
  await Bun.write(UPX_ZIP, response);
  
  // Extract using PowerShell
  await $`powershell -Command "Expand-Archive -Path ${UPX_ZIP} -DestinationPath . -Force"`;
  
  console.log('UPX downloaded and extracted.');
  return upxPath;
}

async function compress() {
  const exePath = 'dist/easynpc-rsv-excluder.exe';
  
  if (!existsSync(exePath)) {
    console.error(`Executable not found: ${exePath}`);
    console.error('Run "bun run build" first.');
    process.exit(1);
  }

  const upxPath = await ensureUpx();
  
  console.log(`Compressing ${exePath}...`);
  
  const result = await $`${upxPath} --best --lzma ${exePath}`.quiet();
  
  console.log(result.text());
  console.log('Compression complete!');
}

compress().catch((err) => {
  console.error('Compression failed:', err);
  process.exit(1);
});
