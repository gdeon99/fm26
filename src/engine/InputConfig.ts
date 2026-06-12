// ── Input configuration types ──

export type InputMethod = 'keyboard' | 'gamepad' | 'touch';

export interface KeyBindings {
  moveUp: string[];
  moveDown: string[];
  moveLeft: string[];
  moveRight: string[];
  shoot: string[];
  pause: string[];
}

export interface GamepadConfig {
  enabled: boolean;
  deadzone: number;       // 0.0 - 0.5
  vibration: boolean;
  stickIndex: 0 | 1;     // 0 = left stick, 1 = right stick
  shootButton: number;    // gamepad button index
  pauseButton: number;
}

export interface MouseConfig {
  enabled: boolean;
  aimAssist: boolean;
  sensitivity: number;    // 0.5 - 2.0
}

export interface TouchConfig {
  enabled: boolean;
  cursorOffsetY: number;  // 30 - 150  pixels above finger
  cursorSize: number;     // 20 - 50   cursor sprite size
  cursorSpeed: number;    // 0.5 - 3.0  movement multiplier
}

export interface InputConfig {
  activeMethod: InputMethod;
  keyBindings: KeyBindings;
  gamepad: GamepadConfig;
  mouse: MouseConfig;
  touch: TouchConfig;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveUp: ['w', 'W', 'ArrowUp'],
  moveDown: ['s', 'S', 'ArrowDown'],
  moveLeft: ['a', 'A', 'ArrowLeft'],
  moveRight: ['d', 'D', 'ArrowRight'],
  shoot: [' '],
  pause: ['Escape', 'p', 'P'],
};

export const DEFAULT_INPUT_CONFIG: InputConfig = {
  activeMethod: 'keyboard',
  keyBindings: { ...DEFAULT_KEY_BINDINGS },
  gamepad: {
    enabled: false,
    deadzone: 0.15,
    vibration: true,
    stickIndex: 0,
    shootButton: 0,   // A / Cross
    pauseButton: 9,   // Start
  },
  mouse: {
    enabled: true,
    aimAssist: false,
    sensitivity: 1.0,
  },
  touch: {
    enabled: true,
    cursorOffsetY: 80,
    cursorSize: 28,
    cursorSpeed: 1.2,
  },
};

// Pretty names for keyboard keys
export function prettyKey(key: string): string {
  const map: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Enter': 'Enter',
    'Shift': 'Shift',
    'Control': 'Ctrl',
    'Alt': 'Alt',
    'Tab': 'Tab',
    'Backspace': '⌫',
  };
  return map[key] || key.toUpperCase();
}

// Gamepad button names (standard mapping)
export const GAMEPAD_BUTTONS: string[] = [
  'A / Cross',        // 0
  'B / Circle',       // 1
  'X / Square',       // 2
  'Y / Triangle',     // 3
  'LB / L1',          // 4
  'RB / R1',          // 5
  'LT / L2',          // 6
  'RT / R2',          // 7
  'Back / Select',    // 8
  'Start',            // 9
  'L3 (Stick)',       // 10
  'R3 (Stick)',       // 11
  'D-Pad Up',         // 12
  'D-Pad Down',       // 13
  'D-Pad Left',       // 14
  'D-Pad Right',      // 15
  'Home / Guide',     // 16
];
