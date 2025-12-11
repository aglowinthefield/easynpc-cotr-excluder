import { homedir } from 'os';
import * as path from 'path';

export interface Config {
  EasyNpcProfilePath: string;
  ExcludePlugins: string[];
}

export interface ProfileLogEntry {
  master: string;
  id: string;
  time: string;
  field: 'DefaultPlugin' | 'FacePlugin' | 'FaceMod';
  oldValue: string | null;
  newValue: string;
}

export interface NPC {
  id: string;
  master: string;
  DefaultPlugin?: string;
  FacePlugin?: string;
  FaceMod?: string;
}

export function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(homedir(), p.slice(2));
  }
  if (p.startsWith('./')) {
    return path.join(process.cwd(), p.slice(2));
  }
  return p;
}

