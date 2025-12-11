import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'smol-toml';
import type { Config } from './utils';

export function findConfigPath(): string | null {
  const exeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(exeDir, 'config.toml'),
    path.join(process.cwd(), 'config.toml'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function loadConfig(configPath: string): Config {
  const content = fs.readFileSync(configPath, 'utf-8');
  return parse(content) as unknown as Config;
}

