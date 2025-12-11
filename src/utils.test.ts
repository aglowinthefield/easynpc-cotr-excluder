import { describe, expect, it } from 'bun:test';
import type { NPC, ProfileLogEntry } from './utils';
import { getNpcFormId, getNpcTargetString, generateExclusionOutput } from './output';
import { updateNpc } from './profile';

describe('getNpcFormId', () => {
  it('removes leading zeros and adds 0x prefix', () => {
    const npc: NPC = { id: '00012345', master: 'Skyrim.esm' };
    expect(getNpcFormId(npc)).toBe('0x12345');
  });

  it('handles IDs with no leading zeros', () => {
    const npc: NPC = { id: 'ABCDEF', master: 'Skyrim.esm' };
    expect(getNpcFormId(npc)).toBe('0xABCDEF');
  });

  it('handles IDs that are all zeros except last digit', () => {
    const npc: NPC = { id: '00000001', master: 'Skyrim.esm' };
    expect(getNpcFormId(npc)).toBe('0x1');
  });
});

describe('getNpcTargetString', () => {
  it('formats NPC as FormID~Master', () => {
    const npc: NPC = { id: '00013BBB', master: 'Skyrim.esm' };
    expect(getNpcTargetString(npc)).toBe('0x13BBB~Skyrim.esm');
  });

  it('handles mod plugins correctly', () => {
    const npc: NPC = { id: '01000800', master: 'SomeModPlugin.esp' };
    expect(getNpcTargetString(npc)).toBe('0x1000800~SomeModPlugin.esp');
  });
});

describe('updateNpc', () => {
  it('creates new NPC if not exists', () => {
    const npcs: Record<string, NPC> = {};
    const entry: ProfileLogEntry = {
      master: 'Skyrim.esm',
      id: '00012345',
      time: '2024-01-01T00:00:00Z',
      field: 'FacePlugin',
      oldValue: null,
      newValue: 'MOSRefined.esp',
    };

    updateNpc(npcs, entry);

    expect(npcs['00012345']).toBeDefined();
    expect(npcs['00012345'].id).toBe('00012345');
    expect(npcs['00012345'].master).toBe('Skyrim.esm');
    expect(npcs['00012345'].FacePlugin).toBe('MOSRefined.esp');
  });

  it('updates existing NPC', () => {
    const npcs: Record<string, NPC> = {
      '00012345': { id: '00012345', master: 'Skyrim.esm', FacePlugin: 'OldPlugin.esp' },
    };
    const entry: ProfileLogEntry = {
      master: 'Skyrim.esm',
      id: '00012345',
      time: '2024-01-01T00:00:00Z',
      field: 'FacePlugin',
      oldValue: 'OldPlugin.esp',
      newValue: 'MOSRefined.esp',
    };

    updateNpc(npcs, entry);

    expect(npcs['00012345'].FacePlugin).toBe('MOSRefined.esp');
  });

  it('handles different field types', () => {
    const npcs: Record<string, NPC> = {};
    
    updateNpc(npcs, {
      master: 'Skyrim.esm',
      id: '00012345',
      time: '2024-01-01T00:00:00Z',
      field: 'DefaultPlugin',
      oldValue: null,
      newValue: 'Default.esp',
    });

    updateNpc(npcs, {
      master: 'Skyrim.esm',
      id: '00012345',
      time: '2024-01-01T00:00:00Z',
      field: 'FaceMod',
      oldValue: null,
      newValue: 'FaceMod.esp',
    });

    expect(npcs['00012345'].DefaultPlugin).toBe('Default.esp');
    expect(npcs['00012345'].FaceMod).toBe('FaceMod.esp');
  });
});

describe('generateExclusionOutput', () => {
  const excludePlugins = [
    'MOSRefined.esp',
    'TSOSRefined.esp',
    "Karura's Ordinary People Refined.esp",
  ];

  it('generates correct output for NPCs with matching plugins', () => {
    const npcs: Record<string, NPC> = {
      '00012345': { id: '00012345', master: 'Skyrim.esm', FacePlugin: 'MOSRefined.esp' },
    };

    const result = generateExclusionOutput(npcs, excludePlugins);

    expect(result).toBe('Keyword = RSVignore|NONE|0x12345~Skyrim.esm');
  });

  it('excludes NPCs without matching plugins', () => {
    const npcs: Record<string, NPC> = {
      '00012345': { id: '00012345', master: 'Skyrim.esm', FacePlugin: 'SomeOtherMod.esp' },
    };

    const result = generateExclusionOutput(npcs, excludePlugins);

    expect(result).toBe('Keyword = RSVignore|NONE|');
  });

  it('excludes NPCs without FacePlugin', () => {
    const npcs: Record<string, NPC> = {
      '00012345': { id: '00012345', master: 'Skyrim.esm', DefaultPlugin: 'MOSRefined.esp' },
    };

    const result = generateExclusionOutput(npcs, excludePlugins);

    expect(result).toBe('Keyword = RSVignore|NONE|');
  });

  it('handles multiple NPCs with matching plugins', () => {
    const npcs: Record<string, NPC> = {
      '00012345': { id: '00012345', master: 'Skyrim.esm', FacePlugin: 'MOSRefined.esp' },
      '00054321': { id: '00054321', master: 'Dawnguard.esm', FacePlugin: 'TSOSRefined.esp' },
    };

    const result = generateExclusionOutput(npcs, excludePlugins);

    expect(result).toContain('0x12345~Skyrim.esm');
    expect(result).toContain('0x54321~Dawnguard.esm');
    expect(result).toMatch(/Keyword = RSVignore\|NONE\|.+,.+/);
  });

  it('handles empty NPC list', () => {
    const npcs: Record<string, NPC> = {};

    const result = generateExclusionOutput(npcs, excludePlugins);

    expect(result).toBe('Keyword = RSVignore|NONE|');
  });
});

