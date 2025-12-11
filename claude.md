# easynpc-rsv-excluder

## Overview

This tool scans EasyNPC profile logs to identify NPCs that have been assigned presets from "Charmers of the Reach" (COTR) mods, then generates an RSV (Realistic Solitude and Villages) exclusion file. This is necessary because RSV and COTR are incompatible - NPCs using COTR presets need to be excluded from RSV's modifications.

## How It Works

1. **Reads EasyNPC Profile Log**: The tool reads `Profile.log` from the user's EasyNPC installation directory (`%USERPROFILE%\AppData\Local\EasyNPC\Profile.log`)

2. **Parses NPC Configuration**: Each line in the log file is a JSON object representing a change to an NPC's configuration. The tool tracks:
   - NPC FormID (`id`)
   - Master plugin (`master`)
   - FacePlugin assignment (which preset mod is being used)

3. **Identifies COTR NPCs**: The tool filters NPCs where the `FacePlugin` matches any of the known COTR plugin files:
   - Karura's Ordinary People Refined.esp
   - MOSRefined.esp
   - MOSRefinedDawnguard.esp
   - MOSRefinedDragonborn.esp
   - TDOSRefined.esp
   - TSOSRefined.esp
   - TSOSRefinedDawnguard.esp
   - TSOSRefinedDragonborn.esp
   - TSOSRefinedHearthfire.esp

4. **Generates RSV Exclusion File**: Creates `zzzEasyNPC RSV Exclude_DISTR.ini` in the project directory with the format:
   ```
   Keyword = RSVignore|NONE|0xFORMID~MASTER.esp,0xFORMID~MASTER.esp,...
   ```

## Code Structure

### Types

- `ProfileLogEntry`: Represents a single log entry with fields for master plugin, NPC ID, timestamp, field type (DefaultPlugin/FacePlugin/FaceMod), and old/new values
- `NPC`: Represents an NPC with its FormID, master plugin, and optional plugin assignments

### Key Functions

- `updateNpc()`: Updates the NPC map with information from a log entry
- `getNpcFormId()`: Converts NPC ID to hex format (removes leading zeros, adds 0x prefix)
- `getNpcTargetString()`: Formats NPC for RSV exclusion format: `0xFORMID~MASTER.esp`
- `processNpcs()`: Filters NPCs with COTR FacePlugins and writes the exclusion file

### Data Flow

1. File stream → Readline interface → Line-by-line JSON parsing
2. Each parsed entry updates the `npcs` map
3. On file close, `processNpcs()` filters and generates output

## Dependencies

- **Bun**: Runtime environment (v1.2.4+)
- **TypeScript**: Type checking and compilation
- **Node.js built-ins**: `fs`, `path`, `readline`, `os` for file operations

## Usage

Run with:
```bash
bun run src/index.ts
```

The tool will:
- Check for `Profile.log` in the default EasyNPC location
- Exit with error if file not found
- Process all log entries
- Generate `zzzEasyNPC RSV Exclude_DISTR.ini` in the current working directory

## Output Format

The generated INI file uses RSV's keyword-based exclusion system. Each NPC is represented as `0xFORMID~MASTER.esp` where:
- `FORMID` is the NPC's FormID in hexadecimal (with leading zeros removed)
- `MASTER.esp` is the master plugin file that defines the NPC

## Notes

- The tool only processes NPCs that have a `FacePlugin` assigned (not just `DefaultPlugin` or `FaceMod`)
- Only NPCs with COTR plugins in their `FacePlugin` field are included in the exclusion list
- The output file is overwritten each time the tool runs
- Error handling is minimal - JSON parse errors are logged but don't stop processing

