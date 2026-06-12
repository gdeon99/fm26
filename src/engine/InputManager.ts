import { type InputConfig, DEFAULT_INPUT_CONFIG } from './InputConfig';

export interface InputState {
  moveX: number;  // -1 to 1
  moveY: number;  // -1 to 1
  shoot: boolean;
  pause: boolean;
  aimX: number;   // mouse world X
  aimY: number;   // mouse world Y
  mouseActive: boolean;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private config: InputConfig = { ...DEFAULT_INPUT_CONFIG };

  // Gamepad state
  private gamepadIndex: number | null = null;
  private gamepadConnected = false;
  private prevGamepadButtons: boolean[] = [];

  // Mouse
  private mouseX = 0;
  private mouseY = 0;
  private _mouseActive = false;

  // Touch virtual cursor movement
  private touchMoveX = 0;
  private touchMoveY = 0;

  constructor() {
    // Listen for gamepad connections
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepadconnected', (e) => {
        this.gamepadIndex = (e as GamepadEvent).gamepad.index;
        this.gamepadConnected = true;
      });
      window.addEventListener('gamepaddisconnected', () => {
        this.gamepadIndex = null;
        this.gamepadConnected = false;
      });
    }
  }

  setConfig(config: InputConfig) {
    this.config = config;
  }

  getConfig(): InputConfig {
    return this.config;
  }

  isGamepadConnected(): boolean {
    return this.gamepadConnected;
  }

  getGamepadName(): string {
    if (this.gamepadIndex === null) return '';
    const gp = navigator.getGamepads()[this.gamepadIndex];
    return gp?.id || 'Unknown Controller';
  }

  keyDown(key: string) {
    this.keys.add(key);
  }

  keyUp(key: string) {
    this.keys.delete(key);
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  isAnyDown(keys: string[]): boolean {
    return keys.some(k => this.keys.has(k));
  }

  setMousePos(x: number, y: number) {
    this.mouseX = x;
    this.mouseY = y;
    this._mouseActive = true;
  }

  setTouchJoystick(x: number, y: number) {
    this.touchMoveX = x;
    this.touchMoveY = y;
  }

  reset() {
    this.keys.clear();
    this.touchMoveX = 0;
    this.touchMoveY = 0;
  }

  // Poll all inputs and return unified state
  poll(): InputState {
    const state: InputState = {
      moveX: 0,
      moveY: 0,
      shoot: false,
      pause: false,
      aimX: this.mouseX,
      aimY: this.mouseY,
      mouseActive: this._mouseActive && this.config.mouse.enabled,
    };

    const bindings = this.config.keyBindings;

    // ── Keyboard ──
    if (this.isAnyDown(bindings.moveLeft)) state.moveX -= 1;
    if (this.isAnyDown(bindings.moveRight)) state.moveX += 1;
    if (this.isAnyDown(bindings.moveUp)) state.moveY -= 1;
    if (this.isAnyDown(bindings.moveDown)) state.moveY += 1;
    if (this.isAnyDown(bindings.shoot)) state.shoot = true;

    // Pause is edge-triggered (handled in engine)

    // ── Touch joystick ──
    if (this.config.touch.enabled) {
      state.moveX += this.touchMoveX;
      state.moveY += this.touchMoveY;
    }

    // ── Gamepad ──
    if (this.config.gamepad.enabled && this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        const dz = this.config.gamepad.deadzone;
        const stickIdx = this.config.gamepad.stickIndex;
        const axisX = gp.axes[stickIdx * 2] || 0;
        const axisY = gp.axes[stickIdx * 2 + 1] || 0;

        if (Math.abs(axisX) > dz) state.moveX += axisX;
        if (Math.abs(axisY) > dz) state.moveY += axisY;

        // Shoot button
        if (gp.buttons[this.config.gamepad.shootButton]?.pressed) {
          state.shoot = true;
        }

        // D-pad
        if (gp.buttons[12]?.pressed) state.moveY -= 1;
        if (gp.buttons[13]?.pressed) state.moveY += 1;
        if (gp.buttons[14]?.pressed) state.moveX -= 1;
        if (gp.buttons[15]?.pressed) state.moveX += 1;

        // Pause (edge detect)
        const pauseBtn = this.config.gamepad.pauseButton;
        const nowPressed = gp.buttons[pauseBtn]?.pressed || false;
        const wasPressed = this.prevGamepadButtons[pauseBtn] || false;
        if (nowPressed && !wasPressed) {
          state.pause = true;
        }

        // Store prev state
        this.prevGamepadButtons = gp.buttons.map(b => b.pressed);
      }
    }

    // Clamp
    state.moveX = Math.max(-1, Math.min(1, state.moveX));
    state.moveY = Math.max(-1, Math.min(1, state.moveY));

    return state;
  }

  // Vibrate gamepad
  vibrate(duration: number = 100, strong: number = 0.3, weak: number = 0.1) {
    if (!this.config.gamepad.vibration || this.gamepadIndex === null) return;
    try {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp?.vibrationActuator) {
        (gp.vibrationActuator as GamepadHapticActuator & {
          playEffect: (type: string, params: { duration: number; strongMagnitude: number; weakMagnitude: number }) => void;
        }).playEffect('dual-rumble', {
          duration,
          strongMagnitude: strong,
          weakMagnitude: weak,
        });
      }
    } catch {
      // vibration not supported
    }
  }
}
