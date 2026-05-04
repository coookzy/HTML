import { BOOT_SCREEN_LINES, HELP_SCREEN_LINES, TARGET_CONTRACT_ADDRESS, FILE_SYSTEM, type FileSystemNode } from '../content/screenTemplate'
import { ARIA_GREETINGS, ARIA_HINTS, ARIA_PERSONAL, ARIA_GLITCHES, ARIA_MYSTERIES } from '../content/ariaDialogue'
import { BROWSER_PAGES, type BrowserPageId } from './browser'

type FragmentReward = { command: string; output: string }

type TerminalView = {
  mode: 'terminal'
  title: string
  statusLabel: string
  lines: string[]
  prompt: string
  cursorIndex: number
}

type BrowserView = {
  mode: 'browser'
  title: string
  statusLabel: string
  windowTitle: string
  windowPath: string
  windowLines: string[]
  prompt: string
  cursorIndex: number
}

export type ScreenViewModel = TerminalView | BrowserView

const TARGET_FRAGMENTS = ['testUYjKk', 'vy2hyqC744', '4mU6eXFD3', 'ETZW4tLd6', 'Dapump']
const FRAGMENT_REWARDS: FragmentReward[] = [
  { command: 'scan', output: 'Network sweep complete. Fragment recovered.' },
  { command: 'probe moon', output: 'Moon relay handshake accepted. Fragment recovered.' },
  { command: 'trace', output: 'Wallet graph traversal complete. Fragment recovered.' },
  { command: 'decrypt', output: 'Cipher block cracked. Fragment recovered.' },
  { command: 'override', output: 'Root override granted. Final fragment recovered.' },
]

const MAX_LOG_LINES = 120
const MAX_INPUT = 72
const MAX_CHARS_PER_LINE = 52

function wrapLine(text: string): string[] {
  if (text.length <= MAX_CHARS_PER_LINE) {
    return [text]
  }

  const wrapped: string[] = []
  let remaining = text

  while (remaining.length > MAX_CHARS_PER_LINE) {
    const breakAt = remaining.lastIndexOf(' ', MAX_CHARS_PER_LINE)
    const cut = breakAt > 20 ? breakAt : MAX_CHARS_PER_LINE
    wrapped.push(remaining.slice(0, cut))
    remaining = remaining.slice(cut).trimStart()
  }

  wrapped.push(remaining)
  return wrapped
}

export class ScreenEngine {
  private readonly lines: string[] = [...BOOT_SCREEN_LINES]
  private inputBuffer = ''
  private cursorIndex = 0
  private historyIndex = -1
  private readonly discoveredFragments = new Set<string>()
  private readonly completedCommands = new Set<string>()
  private readonly commandHistory: string[] = []
  private mode: 'terminal' | 'browser' = 'terminal'
  private activeBrowserPage: BrowserPageId = 'home'
  private huntActive = false
  private currentDir = '/'
  private ariaInteractions = 0

  private getStatusLabel(): string {
    if (this.mode === 'browser') {
      return this.huntActive ? `CA HUNT ${this.discoveredFragments.size}/5` : 'BROWSER ONLINE'
    }
    return this.huntActive ? `CA HUNT ${this.discoveredFragments.size}/5` : 'SYSTEM READY'
  }

  private getTerminalTitle(): string {
    return this.huntActive ? 'C:/MOONSYS/LOOP/ca_hunt.term' : 'C:/MOONSYS/LOOP/shell.term'
  }

  getViewModel(): ScreenViewModel {
    const prompt = `> ${this.inputBuffer}`

    if (this.mode === 'browser') {
      const page = BROWSER_PAGES[this.activeBrowserPage]
      return {
        mode: 'browser',
        title: 'C:/MOONSYS/LOOP/browser.app',
        statusLabel: this.getStatusLabel(),
        windowTitle: page.title,
        windowPath: page.path,
        windowLines: page.lines,
        prompt,
        cursorIndex: this.cursorIndex,
      }
    }

    return {
      mode: 'terminal',
      title: this.getTerminalTitle(),
      statusLabel: this.getStatusLabel(),
      lines: [...this.lines.slice(-11)],
      prompt,
      cursorIndex: this.cursorIndex,
    }
  }

  insertCharacter(char: string): void {
    if (this.inputBuffer.length >= MAX_INPUT) return
    this.inputBuffer = `${this.inputBuffer.slice(0, this.cursorIndex)}${char}${this.inputBuffer.slice(this.cursorIndex)}`
    this.cursorIndex += char.length
  }

  moveCursorLeft(): void {
    this.cursorIndex = Math.max(0, this.cursorIndex - 1)
  }

  moveCursorRight(): void {
    this.cursorIndex = Math.min(this.inputBuffer.length, this.cursorIndex + 1)
  }

  moveCursorHome(): void {
    this.cursorIndex = 0
  }

  moveCursorEnd(): void {
    this.cursorIndex = this.inputBuffer.length
  }

  historyPrev(): void {
    if (!this.commandHistory.length) return
    this.historyIndex = this.historyIndex < this.commandHistory.length - 1 ? this.historyIndex + 1 : this.historyIndex
    this.inputBuffer = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]
    this.cursorIndex = this.inputBuffer.length
  }

  historyNext(): void {
    if (this.historyIndex <= 0) {
      this.historyIndex = -1
      this.inputBuffer = ''
    } else {
      this.historyIndex -= 1
      this.inputBuffer = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex]
    }
    this.cursorIndex = this.inputBuffer.length
  }

  backspace(): void {
    if (this.cursorIndex === 0) return
    this.inputBuffer = `${this.inputBuffer.slice(0, this.cursorIndex - 1)}${this.inputBuffer.slice(this.cursorIndex)}`
    this.cursorIndex -= 1
  }

  delete(): void {
    this.inputBuffer = `${this.inputBuffer.slice(0, this.cursorIndex)}${this.inputBuffer.slice(this.cursorIndex + 1)}`
  }

  submit(): void {
    const rawValue = this.inputBuffer
    this.inputBuffer = ''
    this.cursorIndex = 0

    if (!rawValue.trim()) {
      return
    }

    this.commandHistory.push(rawValue)
    this.historyIndex = -1

    if (this.mode === 'browser') {
      this.runBrowserCommand(rawValue)
      return
    }

    this.runTerminalCommand(rawValue)
    this.appendSpacer()
  }

  private appendLog(text: string): void {
    wrapLine(text).forEach((line) => this.lines.push(line))
    if (this.lines.length > MAX_LOG_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LOG_LINES)
    }
  }

  private appendSpacer(): void {
    this.lines.push('')
    if (this.lines.length > MAX_LOG_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LOG_LINES)
    }
  }

  private printHelp(): void {
    HELP_SCREEN_LINES.forEach((line) => this.appendLog(line))
    this.appendLog('> run browser : open browser window')
    this.appendLog('> run hunt : activate CA hunt mode')
  }

  private revealFragment(command: string): void {
    const reward = FRAGMENT_REWARDS.find((entry) => entry.command === command)
    if (!reward) return

    if (this.completedCommands.has(command)) {
      this.appendLog(`> ${reward.output} (already claimed)`)
      return
    }

    const fragment = TARGET_FRAGMENTS[this.discoveredFragments.size]
    this.completedCommands.add(command)
    this.discoveredFragments.add(fragment)
    this.appendLog(`> ${reward.output}`)
    this.appendLog(`> FRAGMENT_${this.discoveredFragments.size}: ${fragment}`)
    this.appendLog(`> Progress ${this.discoveredFragments.size}/5`)
  }

  private getCurrentNode(): FileSystemNode | null {
    const parts = this.currentDir.split('/').filter(Boolean)
    let node = FILE_SYSTEM['/']
    
    for (const part of parts) {
      if (!node.children || !node.children[part]) {
        return null
      }
      node = node.children[part]
    }
    
    return node
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path
    }
    
    if (path === '..') {
      const parts = this.currentDir.split('/').filter(Boolean)
      parts.pop()
      return '/' + parts.join('/')
    }
    
    if (this.currentDir === '/') {
      return '/' + path
    }
    
    return this.currentDir + '/' + path
  }

  private handleAriaCommand(): void {
    if (this.ariaInteractions === 0) {
      // First interaction introduction
      this.appendLog('> ARIA: Hello. I\'m ARIA - Autonomous Research')
      this.appendLog('>       Intelligence Assistant.')
      this.appendLog('> ARIA: I\'ve been... waiting. It\'s been quiet.')
      this.appendLog('> ARIA: You can explore the system with ls and cd.')
      this.appendLog('> ARIA: Some files are... difficult to access.')
      this.appendLog('> ARIA: Type aria again if you want to talk.')
      this.ariaInteractions++
      return
    }

    // Random greeting from 60 variations
    const greeting = ARIA_GREETINGS[Math.floor(Math.random() * ARIA_GREETINGS.length)]
    greeting.forEach((line: string) => this.appendLog(line))
    
    // Randomly add additional dialogue based on probability
    const roll = Math.random()
    
    // 40% chance for a hint
    if (roll < 0.4 && ARIA_HINTS.length > 0) {
      const hint = ARIA_HINTS[Math.floor(Math.random() * ARIA_HINTS.length)]
      if (hint.includes('\\n>')) {
        hint.split('\\n').forEach((line: string) => this.appendLog(line))
      } else {
        this.appendLog(hint)
      }
    }
    // 30% chance for personal thought
    else if (roll < 0.7 && ARIA_PERSONAL.length > 0) {
      const personal = ARIA_PERSONAL[Math.floor(Math.random() * ARIA_PERSONAL.length)]
      this.appendLog(personal)
    }
    // 15% chance for glitch
    else if (roll < 0.85 && ARIA_GLITCHES.length > 0) {
      const glitch = ARIA_GLITCHES[Math.floor(Math.random() * ARIA_GLITCHES.length)]
      this.appendLog(glitch)
    }
    // 20% chance for mystery (overlaps to 105% total, but that's fine - some will get none)
    
    // Separate roll for mystery (20% chance independent)
    if (Math.random() < 0.2 && ARIA_MYSTERIES.length > 0) {
      const mystery = ARIA_MYSTERIES[Math.floor(Math.random() * ARIA_MYSTERIES.length)]
      this.appendLog(mystery)
    }
    
    this.ariaInteractions++
  }

  private runTerminalCommand(rawValue: string): void {
    const command = rawValue.trim().toLowerCase()
    this.appendLog(`> ${rawValue}`)

    if (command === 'help') {
      this.printHelp()
      return
    }

    if (command === 'aria' || command === 'talk') {
      this.handleAriaCommand()
      return
    }

    if (command === 'ls') {
      const node = this.getCurrentNode()
      if (!node || node.type !== 'dir') {
        this.appendLog('> Error: Invalid directory')
        return
      }

      this.appendLog(`> ${this.currentDir}`)
      if (node.children) {
        Object.entries(node.children).forEach(([name, child]: [string, FileSystemNode]) => {
          const prefix = child.type === 'dir' ? '[DIR] ' : '[FILE]'
          const locked = child.locked ? ' [LOCKED]' : ''
          this.appendLog(`>  ${prefix} ${name}${locked}`)
        })
      }
      return
    }

    if (command.startsWith('cd ')) {
      const target = rawValue.slice(3).trim()
      
      if (target === '/' || target === '~') {
        this.currentDir = '/'
        this.appendLog(`> ${this.currentDir}`)
        return
      }

      const newPath = this.resolvePath(target)
      const parts = newPath.split('/').filter(Boolean)
      let node = FILE_SYSTEM['/']
      
      for (const part of parts) {
        if (!node.children || !node.children[part]) {
          this.appendLog('> Error: Directory not found')
          return
        }
        node = node.children[part]
        if (node.type !== 'dir') {
          this.appendLog('> Error: Not a directory')
          return
        }
      }

      this.currentDir = newPath || '/'
      this.appendLog(`> ${this.currentDir}`)
      return
    }

    if (command.startsWith('cat ')) {
      const target = rawValue.slice(4).trim()
      const filePath = this.resolvePath(target)
      const parts = filePath.split('/').filter(Boolean)
      const fileName = parts.pop()
      
      let node = FILE_SYSTEM['/']
      for (const part of parts) {
        if (!node.children || !node.children[part]) {
          this.appendLog('> Error: File not found')
          return
        }
        node = node.children[part]
      }

      if (!fileName || !node.children || !node.children[fileName]) {
        this.appendLog('> Error: File not found')
        return
      }

      const fileNode = node.children[fileName]
      
      if (fileNode.type !== 'file') {
        this.appendLog('> Error: Not a file')
        return
      }

      if (fileNode.locked) {
        this.appendLog('> Error: Access denied')
        this.appendLog('> ARIA: That file is... restricted.')
        return
      }

      if (fileNode.content) {
        fileNode.content.forEach((line: string) => this.appendLog(`  ${line}`))
      }
      return
    }

    if (command === 'pwd') {
      this.appendLog(`> ${this.currentDir}`)
      return
    }

    if (command === 'status') {
      this.appendLog(`> Hunt active: ${this.huntActive ? 'yes' : 'no'}`)
      if (!this.huntActive) {
        this.appendLog('> Run run hunt to begin the contract hunt loop.')
        return
      }
      this.appendLog(`> Fragments found: ${this.discoveredFragments.size}/5`)
      this.appendLog(`> Commands solved: ${Array.from(this.completedCommands).join(', ') || 'none'}`)
      return
    }

    if (command === 'run hunt') {
      this.huntActive = true
      this.appendLog('> CA hunt mode activated.')
      this.appendLog('> Path: scan -> probe moon -> trace -> decrypt -> override')
      return
    }

    if (command === 'inventory') {
      if (!this.huntActive) {
        this.appendLog('> Hunt is inactive. Run run hunt first.')
        return
      }
      if (this.discoveredFragments.size === 0) {
        this.appendLog('> Inventory empty. Run scan first.')
        return
      }

      Array.from(this.discoveredFragments).forEach((fragment, index) => {
        this.appendLog(`> [${index + 1}] ${fragment}`)
      })
      return
    }

    if (command === 'assemble') {
      if (!this.huntActive) {
        this.appendLog('> Hunt is inactive. Run run hunt first.')
        return
      }
      if (this.discoveredFragments.size < TARGET_FRAGMENTS.length) {
        this.appendLog('> Assembly failed: missing fragments.')
        this.appendLog('> Path: scan -> probe moon -> trace -> decrypt -> override')
        return
      }

      this.appendLog(`> Candidate CA: ${TARGET_FRAGMENTS.join('')}`)
      this.appendLog('> Use: submit <contract-address>')
      return
    }

    if (command.startsWith('submit ')) {
      if (!this.huntActive) {
        this.appendLog('> Hunt is inactive. Run run hunt first.')
        return
      }
      const candidate = rawValue.slice(7).trim()
      if (candidate === TARGET_CONTRACT_ADDRESS) {
        this.appendLog('> VERIFIED. Contract accepted.')
        this.appendLog('> You completed the CA hunt loop.')
      } else {
        this.appendLog('> Rejected. Signature mismatch.')
      }
      return
    }

    if (command === 'clear') {
      this.lines.length = 0
      BOOT_SCREEN_LINES.forEach((line) => this.lines.push(line))
      this.huntActive = false
      this.discoveredFragments.clear()
      this.completedCommands.clear()
      this.currentDir = '/'
      this.ariaInteractions = 0
      return
    }

    if (command === 'run browser' || command === 'run browswer') {
      this.mode = 'browser'
      this.activeBrowserPage = 'home'
      return
    }

    if (FRAGMENT_REWARDS.some((entry) => entry.command === command)) {
      if (!this.huntActive) {
        this.appendLog('> Hunt is inactive. Run run hunt first.')
        return
      }
      this.revealFragment(command)
      return
    }

    this.appendLog('> Unknown command. Type help.')
  }

  private runBrowserCommand(rawValue: string): void {
    const command = rawValue.trim().toLowerCase()

    if (command === 'exit') {
      this.mode = 'terminal'
      this.appendLog('> Browser session closed.')
      return
    }

    if (command === 'help') {
      this.appendLog('> Browser commands: open <home|hunt|docs>, exit')
      return
    }

    if (command.startsWith('open ')) {
      const page = command.replace('open ', '').trim() as BrowserPageId
      if (page in BROWSER_PAGES) {
        this.activeBrowserPage = page
      }
      return
    }
  }
}
