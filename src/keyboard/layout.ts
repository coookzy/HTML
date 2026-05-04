export type KeyTone = 'normal' | 'warm' | 'cool'
export type KeyLayout = { code: string; width?: number; tone?: KeyTone }

const buildKeyLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {
    Escape: 'ESC',
    Backquote: '` ~',
    Minus: '- _',
    Equal: '= +',
    Backspace: 'BACKSPACE',
    Tab: 'TAB',
    BracketLeft: '[ {',
    BracketRight: '] }',
    Backslash: '\\ |',
    CapsLock: 'CAPS',
    Semicolon: '; :',
    Quote: "' \"",
    Enter: 'ENTER',
    ShiftLeft: 'SHIFT',
    ShiftRight: 'SHIFT',
    Comma: ', <',
    Period: '. >',
    Slash: '/ ?',
    ControlLeft: 'CTRL',
    ControlRight: 'CTRL',
    MetaLeft: 'WIN',
    MetaRight: 'WIN',
    AltLeft: 'ALT',
    AltRight: 'ALT',
    Space: 'SPACE',
    ContextMenu: 'MENU',
    Insert: 'INS',
    Delete: 'DEL',
    Home: 'HOME',
    End: 'END',
    PageUp: 'PGUP',
    PageDown: 'PGDN',
    ArrowUp: 'UP',
    ArrowLeft: 'LEFT',
    ArrowDown: 'DOWN',
    ArrowRight: 'RIGHT',
    NumLock: 'NUM',
    NumpadDivide: '/',
    NumpadMultiply: '*',
    NumpadSubtract: '-',
    NumpadAdd: '+',
    NumpadDecimal: '.',
    NumpadEnter: 'ENTER',
  }

  for (let i = 1; i <= 12; i += 1) {
    labels[`F${i}`] = `F${i}`
  }

  for (let i = 0; i <= 9; i += 1) {
    const key = i === 0 ? 'Digit0' : `Digit${i}`
    const shifted = [')', '!', '@', '#', '$', '%', '^', '&', '*', '('][i]
    labels[key] = `${i} ${shifted}`
  }

  for (let i = 0; i <= 9; i += 1) {
    labels[`Numpad${i}`] = `${i}`
  }

  for (let code = 65; code <= 90; code += 1) {
    const letter = String.fromCharCode(code)
    labels[`Key${letter}`] = letter
  }

  return labels
}

export const KEY_LABELS = buildKeyLabels()

export const PRIMARY_ROWS: KeyLayout[][] = [
  [
    { code: 'Escape', tone: 'warm' },
    { code: 'F1' },
    { code: 'F2' },
    { code: 'F3' },
    { code: 'F4' },
    { code: 'F5' },
    { code: 'F6' },
    { code: 'F7' },
    { code: 'F8' },
    { code: 'F9' },
    { code: 'F10' },
    { code: 'F11' },
    { code: 'F12' },
  ],
  [
    { code: 'Backquote' },
    { code: 'Digit1' },
    { code: 'Digit2' },
    { code: 'Digit3' },
    { code: 'Digit4' },
    { code: 'Digit5' },
    { code: 'Digit6' },
    { code: 'Digit7' },
    { code: 'Digit8' },
    { code: 'Digit9' },
    { code: 'Digit0' },
    { code: 'Minus' },
    { code: 'Equal' },
    { code: 'Backspace', width: 1.9 },
  ],
  [
    { code: 'Tab', width: 1.45 },
    { code: 'KeyQ' },
    { code: 'KeyW' },
    { code: 'KeyE' },
    { code: 'KeyR' },
    { code: 'KeyT' },
    { code: 'KeyY' },
    { code: 'KeyU' },
    { code: 'KeyI' },
    { code: 'KeyO' },
    { code: 'KeyP' },
    { code: 'BracketLeft' },
    { code: 'BracketRight' },
    { code: 'Backslash', width: 1.45 },
  ],
  [
    { code: 'CapsLock', width: 1.85 },
    { code: 'KeyA' },
    { code: 'KeyS' },
    { code: 'KeyD' },
    { code: 'KeyF' },
    { code: 'KeyG' },
    { code: 'KeyH' },
    { code: 'KeyJ' },
    { code: 'KeyK' },
    { code: 'KeyL' },
    { code: 'Semicolon' },
    { code: 'Quote' },
    { code: 'Enter', width: 2.25, tone: 'cool' },
  ],
  [
    { code: 'ShiftLeft', width: 2.25 },
    { code: 'KeyZ' },
    { code: 'KeyX' },
    { code: 'KeyC' },
    { code: 'KeyV' },
    { code: 'KeyB' },
    { code: 'KeyN' },
    { code: 'KeyM' },
    { code: 'Comma' },
    { code: 'Period' },
    { code: 'Slash' },
    { code: 'ShiftRight', width: 2.6 },
  ],
  [
    { code: 'ControlLeft', width: 1.35 },
    { code: 'MetaLeft', width: 1.35 },
    { code: 'AltLeft', width: 1.35 },
    { code: 'Space', width: 5, tone: 'cool' },
    { code: 'AltRight', width: 1.35 },
    { code: 'MetaRight', width: 1.35 },
    { code: 'ContextMenu', width: 1.35 },
    { code: 'ControlRight', width: 1.35 },
  ],
]

export const NAV_ROWS: KeyLayout[][] = [
  [
    { code: 'Insert' },
    { code: 'Home' },
    { code: 'PageUp' },
  ],
  [
    { code: 'Delete' },
    { code: 'End' },
    { code: 'PageDown' },
  ],
  [
    { code: 'ArrowUp' },
  ],
  [
    { code: 'ArrowLeft' },
    { code: 'ArrowDown' },
    { code: 'ArrowRight' },
  ],
]

export const NUMPAD_ROWS: KeyLayout[][] = [
  [
    { code: 'NumLock' },
    { code: 'NumpadDivide' },
    { code: 'NumpadMultiply' },
    { code: 'NumpadSubtract' },
  ],
  [
    { code: 'Numpad7' },
    { code: 'Numpad8' },
    { code: 'Numpad9' },
    { code: 'NumpadAdd', width: 1.1, tone: 'cool' },
  ],
  [
    { code: 'Numpad4' },
    { code: 'Numpad5' },
    { code: 'Numpad6' },
    { code: 'NumpadAddGhost', width: 1.1, tone: 'cool' },
  ],
  [
    { code: 'Numpad1' },
    { code: 'Numpad2' },
    { code: 'Numpad3' },
    { code: 'NumpadEnter', width: 1.1, tone: 'cool' },
  ],
  [
    { code: 'Numpad0', width: 2.1 },
    { code: 'NumpadDecimal' },
    { code: 'NumpadEnterGhost', width: 1.1, tone: 'cool' },
  ],
]

export const KEYBOARD_GRID = {
  unit: 0.45,
  gap: 0.08,
  rowDepth: 0.64,
  rowStart: -1.86,
  primaryStartX: -5.66,
  navCenterX: 3.05,
  numpadCenterX: 4.92,
}
