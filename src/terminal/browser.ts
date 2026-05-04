export type BrowserPageId = 'home' | 'hunt' | 'docs'

export type BrowserPage = {
  id: BrowserPageId
  title: string
  path: string
  lines: string[]
}

export const BROWSER_PAGES: Record<BrowserPageId, BrowserPage> = {
  home: {
    id: 'home',
    title: 'MoonSys Portal',
    path: 'portal://home',
    lines: [
      'WELCOME TO MOONSYS PORTAL',
      '',
      'Available sections:',
      '- hunt : mission board and clue flow',
      '- docs : command cheatsheet',
      '',
      'Browser commands:',
      'open <home|hunt|docs>',
      'exit',
    ],
  },
  hunt: {
    id: 'hunt',
    title: 'Contract Hunt Board',
    path: 'portal://hunt',
    lines: [
      'CA HUNT TRACKER',
      '',
      'Objective:',
      'Run run hunt in terminal, recover 5 fragments,',
      'assemble and submit the target address.',
      '',
      'Tip: exit browser and run help for commands.',
    ],
  },
  docs: {
    id: 'docs',
    title: 'Runtime Docs',
    path: 'portal://docs',
    lines: [
      'COMMAND REFERENCE',
      '',
      'Terminal: help, status, run hunt, inventory,',
      'assemble,',
      'scan, probe moon, trace, decrypt, override,',
      'submit <contract-address>, clear, run browser',
      '',
      'Browser: open <home|hunt|docs>, exit',
    ],
  },
}
