# easynpc-rsv-excluder

A utility tool that scans your EasyNPC profile selections and generates an RSV exclusion file for NPCs using Charmers of the Reach (COTR) presets. Since RSV and COTR are incompatible, this tool helps you automatically exclude all COTR-assigned NPCs from RSV modifications.

## What It Does

The tool reads your EasyNPC `Profile.log` file and identifies every NPC that has been assigned a preset from any of the Charmers of the Reach mods. It then generates an RSV exclusion file (`zzzEasyNPC RSV Exclude_DISTR.ini`) that tells RSV to ignore those NPCs.

## Requirements

- Bun runtime (v1.2.4 or later)
- EasyNPC installed with a `Profile.log` file at `%USERPROFILE%\AppData\Local\EasyNPC\Profile.log`

## Installation

```bash
bun install
```

## Usage

Simply run:

```bash
bun run src/index.ts
```

The tool will read your EasyNPC profile log, identify all NPCs with COTR presets, and generate the exclusion file in the current directory. The output file can then be placed in your RSV installation directory or used as needed for your mod setup.

## How It Works

The tool parses your EasyNPC profile log line by line, tracking which NPCs have been assigned which face presets. When it finds an NPC using a COTR preset (like MOSRefined, TSOSRefined, or Karura's Ordinary People Refined), it adds that NPC to the exclusion list in the format RSV expects.

The generated exclusion file uses RSV's keyword-based exclusion system, so you can drop it into your modlist and it will automatically exclude all the identified NPCs from RSV's modifications.
