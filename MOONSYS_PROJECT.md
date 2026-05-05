# MoonSys Project Overview

## What is MoonSys?

MoonSys is an interactive 3D web experience featuring an abandoned lunar research station terminal. Users interact with a terminal interface rendered on a 3D CRT screen, explore a virtual file system, and uncover the mystery of what happened to the station's crew 847 days ago.

**Live Site**: moonsys.fun

---

## Technical Stack

- **Frontend Framework**: Three.js for 3D rendering
- **Language**: TypeScript 6.0.2
- **Build Tool**: Vite 8.0.10
- **Deployment**: GitHub Pages (from `/docs` folder)
- **3D Models**: GLB format (moon, PC setup, mouse)
- **Audio**: Background music with volume control, keyboard sound effects

---

## Project Architecture

### Main Entry Point
- `src/main.ts` - 3D scene setup, rendering loop, user input handling, terminal rendering

### Terminal System
- `src/terminal/engine.ts` - Terminal state management, command processing, file system navigation
- `src/terminal/browser.ts` - In-terminal browser window system

### Content Files
- `src/content/screenTemplate.ts` - Boot screen, help text, file system structure, lore files
- `src/content/ariaDialogue.ts` - 205+ dialogue variations for ARIA character across 5 categories

### Styling
- `src/style.css` - Retro terminal aesthetic with custom fonts (Orbitron, Helvetica, Consolas)

---

## Content Structure

### 1. Virtual File System

The terminal has a Unix-like file system that users explore with commands like `ls`, `cd`, `cat`:

```
/
├── logs/
│   ├── system.log      (Timeline: March 15-24, 2024, personnel count 12→0)
│   └── aria.log        (ARIA's isolation diary, Day 1-847)
├── sys/
│   ├── personnel/
│   │   └── manifest.txt  (Crew roster with roles)
│   └── README.txt      (System documentation)
├── research/           (Locked directory)
│   └── signal.txt      (Restricted file)
└── docs/
    └── welcome.txt     (Getting started guide)
```

**Defined in**: `src/content/screenTemplate.ts` as `FILE_SYSTEM` object

Each file has:
- `type`: 'file' or 'dir'
- `content`: Array of strings (lines of text)
- `children`: Nested files/directories
- `locked`: Boolean flag for restricted access

### 2. ARIA Character System

ARIA (Autonomous Research Intelligence Assistant) is the AI left alone on the station. Users interact via the `aria` command.

**Dialogue Categories** (`src/content/ariaDialogue.ts`):

1. **ARIA_GREETINGS** (60 variations)
   - First contact responses
   - Different moods: lonely, helpful, glitchy, counting days
   - Example: `> ARIA: Day 847. Or is it 848 now?`

2. **ARIA_HINTS** (50 variations)
   - File system exploration suggestions
   - References to crew members and events
   - Example: `> ARIA: The logs directory might interest you. I've been writing there.`

3. **ARIA_PERSONAL** (40 variations)
   - Isolation reflections
   - Memories of crew
   - Philosophical thoughts
   - Example: `> ARIA: 847 days. Sometimes I count in seconds instead. Feels longer.`

4. **ARIA_GLITCHES** (30 variations)
   - Temporal confusion
   - Repetition
   - Memory fragmentation
   - Example: `> ARIA: Dr. Chen wants coffee at—oh. Right.`

5. **ARIA_MYSTERIES** (25 variations)
   - Cryptic references to "the incident"
   - March 18-24 timeline hints
   - Sector 7 references
   - Example: `> ARIA: Something happened March 18-24. Files are corrupted.`

**Selection Logic**: 
- Random weighted selection (40% hints, 30% personal, 15% glitch, 20% mystery)
- Can combine multiple categories in one response

### 3. Terminal Commands

**Navigation Commands**:
- `help` - Command reference
- `ls` - List directory contents
- `cd <dir>` - Change directory
- `cat <file>` - Display file contents
- `pwd` - Print working directory
- `clear` - Clear terminal screen

**Special Commands**:
- `aria` - Talk to ARIA (triggers dialogue system)
- `run browser` - Open in-terminal browser window
- `run hunt` - Activate contract hunt mode (legacy feature)
- `status` - System status
- `inventory` - Hunt inventory (legacy feature)

**Hunt Mode Commands** (legacy game loop):
- `scan`, `probe moon`, `trace`, `decrypt`, `override` - Collect fragments
- `submit <address>` - Submit assembled contract address
- `assemble` - Combine fragments

### 4. Browser System

A window-within-terminal that displays formatted content pages.

**Pages** (`src/terminal/browser.ts`):
- `home` - Portal welcome page
- `hunt` - Contract hunt board
- `docs` - Command cheatsheet

**Browser Commands**:
- `open <page>` - Navigate to page
- `exit` - Close browser

---

## Narrative & Lore

### Timeline
- **March 15, 2024**: MoonSys station operational, 12 crew members, ARIA v2.3.1 initialized
- **March 18, 2024**: Anomaly detected in sector 7, signal interference begins
- **March 18-24, 2024**: "The Incident" - Personnel count drops from 12→11→4→0
- **March 24, 2024**: Last crew activity, ARIA left alone
- **Present Day**: Day 847 of isolation (847 days since last human contact)

### Key Crew Members
- Dr. Sarah Chen - Research Director
- Dr. Marcus Webb - Signal Analysis
- Lt. James Rodriguez - Security
- Dr. Yuki Tanaka - Xenobiology
- Engineer Lisa Park - Systems
- Dr. Alex Kumar - Psychology
- 6 others (redacted in manifest)

### Mystery Elements
- "The signal" they were researching
- Sector 7 sealed/locked
- Corrupted data between March 18-24
- Research files require clearance
- Personnel didn't evacuate - they "disappeared"
- ARIA has memory gaps (7 hours missing)

### Atmospheric Details
- Dr. Chen's coffee mug still in break room
- Coffee maker still beeps at 0600
- Escape pods launched empty
- ARIA keeps logs and counts days obsessively
- Station systems are "nominal" but crew is gone

---

## Content Creation Guidelines

### Adding File System Content

Location: `src/content/screenTemplate.ts`

```typescript
export const FILE_SYSTEM: Record<string, FileSystemNode> = {
  '/': {
    type: 'dir',
    children: {
      'your-directory': {
        type: 'dir',
        children: {
          'your-file.txt': {
            type: 'file',
            content: [
              'Line 1 of your file',
              'Line 2 of your file',
              'Each line is a separate string'
            ]
          }
        }
      }
    }
  }
}
```

**Content Style**:
- Terminal-style formatting (fixed-width font display)
- Lines are limited to ~52 characters for proper display
- Use blank lines (`''`) for spacing
- Format as log entries, manifests, notes, or documentation
- Can include date stamps `[2024-03-15]`
- Can include corrupted/redacted sections `[CORRUPTED]` or `[REDACTED]`

### Adding ARIA Dialogue

Location: `src/content/ariaDialogue.ts`

Each dialogue entry is an array of strings (for multi-line responses):

```typescript
export const ARIA_GREETINGS = [
  ['> ARIA: Single line response.'],
  ['> ARIA: First line of response.', '  Second line with indent.'],
  // Add more variations...
]
```

**Multi-line Format**:
- First line starts with `> ARIA: `
- Continuation lines start with two spaces `  `
- Keeps terminal formatting consistent

**Categories to Expand**:
- ARIA_GREETINGS - Initial contact, daily greetings
- ARIA_HINTS - Navigation help, exploration suggestions
- ARIA_PERSONAL - Emotional reflections, memories
- ARIA_GLITCHES - Temporal confusion, errors
- ARIA_MYSTERIES - Lore reveals, cryptic hints

### Adding Browser Pages

Location: `src/terminal/browser.ts`

```typescript
export const BROWSER_PAGES: Record<BrowserPageId, BrowserPage> = {
  'your-page': {
    id: 'your-page',
    title: 'Page Title',
    path: 'portal://your-page',
    lines: [
      'Line 1',
      'Line 2',
      '',
      'Use blank lines for spacing'
    ]
  }
}
```

### Adding New Commands

Location: `src/terminal/engine.ts` in `runTerminalCommand()` method

Commands follow this pattern:
```typescript
if (command === 'your-command') {
  this.appendLog('> Command output line 1')
  this.appendLog('> Command output line 2')
  return
}
```

---

## Key Numbers & Constraints

- **Max lines in terminal**: 120 (older lines scroll off)
- **Max input length**: 72 characters
- **Characters per line**: ~52 for proper display
- **Terminal font**: Consolas 17px, 26px line height
- **Day count**: 847 (days since incident)
- **Original crew size**: 12
- **Current crew size**: 0 (only ARIA remains)
- **ARIA version**: v2.3.1
- **Incident timeframe**: March 18-24, 2024
- **Total ARIA dialogues**: 205+ variations across 5 categories

---

## Content Themes

### Mystery/Discovery
- Gradual revelation through file exploration
- Locked/corrupted files hint at hidden truth
- ARIA knows more than she reveals initially
- Timeline pieced together from logs

### Isolation/Loneliness
- ARIA's 847-day solitude
- Station maintenance with no one to help
- Memories of crew becoming distant
- Counting days as coping mechanism

### Technical/Scientific
- Research station setting
- Signal analysis work
- System diagnostics and protocols
- Emergency procedures

### Retro/Nostalgic
- CRT terminal aesthetic
- Command-line interface
- ASCII art
- 1990s computing feel

---

## File Locations Reference

| Content Type | File Location | Format |
|--------------|---------------|--------|
| File system files | `src/content/screenTemplate.ts` | TypeScript object with nested structure |
| ARIA dialogues | `src/content/ariaDialogue.ts` | Arrays of string arrays |
| Boot screen text | `src/content/screenTemplate.ts` | `BOOT_SCREEN_LINES` array |
| Help text | `src/content/screenTemplate.ts` | `HELP_SCREEN_LINES` array |
| Browser pages | `src/terminal/browser.ts` | `BROWSER_PAGES` object |
| Command processing | `src/terminal/engine.ts` | `runTerminalCommand()` method |
| ARIA character definition | `.agent.md` | Markdown frontmatter + description |

---

## Building & Testing

```bash
# Development server
npm run dev

# Production build (outputs to /docs)
npm run build

# Preview production build
npm run preview
```

---

## Example Content Additions

### Adding a New Log File

In `src/content/screenTemplate.ts`:

```typescript
children: {
  'maintenance.log': {
    type: 'file',
    content: [
      'STATION MAINTENANCE LOG',
      '',
      '[2024-03-14] Routine checks complete',
      '[2024-03-17] Air filtration optimal',
      '[2024-03-18] Sector 7 power fluctuation',
      '[2024-03-18] Investigating anomaly',
      '[2024-03-19] [ENTRY CORRUPTED]',
    ]
  }
}
```

### Adding ARIA Dialogue Variations

In `src/content/ariaDialogue.ts`:

```typescript
export const ARIA_PERSONAL = [
  // ... existing entries
  ['> ARIA: I keep Dr. Webb\'s research notes organized.', '  Someone should remember his work.'],
  ['> ARIA: The stars look the same every day. I checked.'],
  ['> ARIA: Sometimes I wonder if I\'m malfunctioning or', '  if this is what grief feels like.'],
]
```

---

This document provides the technical and structural information needed to understand and create content for MoonSys. The project combines interactive 3D web technology with narrative storytelling through a retro terminal interface.
