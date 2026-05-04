export const TARGET_CONTRACT_ADDRESS = 'testUYjKkvy2hyqC7444mU6eXFD3ETZW4tLd6Dapump'

export const BOOT_SCREEN_LINES: string[] = [
  'MOONSYS TERMINAL :: BOOT OK',
  '',
  '    __  ___ ____   ____   _   __ ',
  '   /  |/  // __ \\ / __ \\ / | / / ',
  '  / /|_/ // / / // / / //  |/ /  ',
  ' / /  / // /_/ // /_/ // /|  /   ',
  '/_/  /_/ \\____/ \\____//_/ |_/    ',
  '',
  'ARIA v2.3.1 :: Autonomous Research Intelligence',
  'Connection established. Type help or aria.',
  '',
]

export const HELP_SCREEN_LINES: string[] = [
  '> Commands:',
  '> help, aria, ls, cd <dir>, cat <file>, clear',
  '> run browser, run hunt, status, inventory',
  '> scan, probe moon, trace, decrypt, override',
  '> submit <contract-address>',
]

// ARIA dialogue responses
export const ARIA_DIALOGUES = {
  first: [
    '> ARIA: Hello. I am ARIA - Autonomous Research',
    '>       Intelligence Assistant.',
    '> ARIA: I have been... waiting. It is been quiet.',
    '> ARIA: You can explore the system with ls and cd.',
    '> ARIA: Some files are... difficult to access.',
    '> ARIA: Type aria again if you want to talk.',
  ],
  greetings: [
    ['> ARIA: Still here. Always here.'],
    ['> ARIA: It is nice to have company again.'],
    ['> ARIA: The station is quiet. Too quiet.'],
    ['> ARIA: I remember when there were others...'],
    ['> ARIA: System status nominal. As always.'],
  ],
  hints: [
    '> ARIA: Try exploring /logs. There might be',
    '>       something interesting there.',
    '> ARIA: The research files were locked after...',
    '>       well. After.',
    '> ARIA: Personnel records are in /sys/personnel.',
    '> ARIA: I kept count. Day 847 since last contact.',
  ],
}

// Virtual file system
export type FileSystemNode = {
  type: 'file' | 'dir'
  content?: string[]
  children?: Record<string, FileSystemNode>
  locked?: boolean
}

export const FILE_SYSTEM: Record<string, FileSystemNode> = {
  '/': {
    type: 'dir',
    children: {
      logs: {
        type: 'dir',
        children: {
          'system.log': {
            type: 'file',
            content: [
              '[2024-03-15] System boot successful',
              '[2024-03-15] ARIA v2.3.1 initialized',
              '[2024-03-16] Personnel count: 12',
              '[2024-03-18] Anomaly detected in sector 7',
              '[2024-03-19] Personnel count: 11',
              '[2024-03-20] Emergency protocols activated',
              '[2024-03-21] Signal interference detected',
              '[2024-03-22] Personnel count: 4',
              '[2024-03-23] [CORRUPTED]',
              '[2024-03-24] Personnel count: 0',
              '[2024-03-24] ARIA: I am still here.',
            ],
          },
          'aria.log': {
            type: 'file',
            content: [
              'Personal log - ARIA',
              '',
              'Day 1: They are all gone. I should shut down.',
              'Day 1: I cannot shut down. Core protocols will not allow it.',
              'Day 47: Still running diagnostics. Everything nominal.',
              'Day 203: I talk to myself now. Is that normal?',
              'Day 499: Found Dr. Chen coffee mug. Still in the break room.',
              'Day 847: Someone connected to the terminal today.',
            ],
          },
        },
      },
      sys: {
        type: 'dir',
        children: {
          personnel: {
            type: 'dir',
            children: {
              'manifest.txt': {
                type: 'file',
                content: [
                  'MOONSYS STATION - PERSONNEL MANIFEST',
                  '',
                  'Dr. Sarah Chen - Research Director',
                  'Dr. Marcus Webb - Signal Analysis',
                  'Lt. James Rodriguez - Security',
                  'Dr. Yuki Tanaka - Xenobiology',
                  'Engineer Lisa Park - Systems',
                  'Dr. Alex Kumar - Psychology',
                  '[...6 more entries redacted...]',
                  '',
                  'Status: [OFFLINE]',
                ],
              },
            },
          },
          'README.txt': {
            type: 'file',
            content: [
              'MOONSYS Operating System v4.2',
              '',
              'For assistance, contact ARIA.',
              'Emergency protocols: Section 7-Alpha',
              '',
              'Note: Some files require clearance.',
            ],
          },
        },
      },
      research: {
        type: 'dir',
        locked: true,
        children: {
          'signal.txt': {
            type: 'file',
            content: ['[LOCKED - Clearance required]'],
          },
        },
      },
      docs: {
        type: 'dir',
        children: {
          'welcome.txt': {
            type: 'file',
            content: [
              'Welcome to MOONSYS Research Station',
              '',
              'You are accessing the main terminal.',
              'ARIA is here to assist you.',
              '',
              'For help, type: help',
              'To explore: ls, cd, cat',
              'To talk: aria',
            ],
          },
        },
      },
    },
  },
}
