import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Keyboard,
  Gamepad2,
  Smartphone,
  Mouse,
  Check,
  RotateCcw,
  Vibrate,
  Target,
  Move,
  Crosshair,
  CircleDot,
  Pause,
  Zap,
  MousePointer2,
  ArrowUpFromDot,
} from 'lucide-react';
import {
  type InputConfig,
  type InputMethod,
  type KeyBindings,
  DEFAULT_INPUT_CONFIG,
  prettyKey,
  GAMEPAD_BUTTONS,
} from '../../engine/InputConfig';
import { SectionLabel, Divider, PanelButton } from './DisplayPanel';

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
const MONO = '"SF Mono", "Fira Code", "Cascadia Code", monospace';

interface Props {
  config: InputConfig;
  onChange: (config: InputConfig) => void;
  gamepadConnected: boolean;
  gamepadName: string;
}

const ACTIONS: { key: keyof KeyBindings; label: string; icon: React.ReactNode }[] = [
  { key: 'moveUp', label: 'Move Up', icon: <Move size={13} style={{ transform: 'rotate(-90deg)' }} /> },
  { key: 'moveDown', label: 'Move Down', icon: <Move size={13} style={{ transform: 'rotate(90deg)' }} /> },
  { key: 'moveLeft', label: 'Move Left', icon: <Move size={13} style={{ transform: 'rotate(180deg)' }} /> },
  { key: 'moveRight', label: 'Move Right', icon: <Move size={13} /> },
  { key: 'shoot', label: 'Shoot', icon: <Crosshair size={13} /> },
  { key: 'pause', label: 'Pause', icon: <Pause size={13} /> },
];

export default function ControlsPanel({ config, onChange, gamepadConnected, gamepadName }: Props) {
  const [bindingAction, setBindingAction] = useState<keyof KeyBindings | null>(null);
  const [bindingSlot, setBindingSlot] = useState<number>(0);
  const bindingRef = useRef<keyof KeyBindings | null>(null);

  useEffect(() => { bindingRef.current = bindingAction; }, [bindingAction]);

  useEffect(() => {
    if (!bindingAction) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      const action = bindingRef.current;
      if (!action) return;
      const newBindings = { ...config.keyBindings };
      const arr = [...newBindings[action]];
      arr[bindingSlot] = e.key;
      newBindings[action] = arr;
      onChange({ ...config, keyBindings: newBindings });
      setBindingAction(null);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [bindingAction, bindingSlot, config, onChange]);

  // ── Setters ──
  const setMethod = useCallback((m: InputMethod) => onChange({ ...config, activeMethod: m }), [config, onChange]);
  const setGamepadEnabled = useCallback((v: boolean) => onChange({ ...config, gamepad: { ...config.gamepad, enabled: v } }), [config, onChange]);
  const setGamepadDeadzone = useCallback((v: number) => onChange({ ...config, gamepad: { ...config.gamepad, deadzone: v } }), [config, onChange]);
  const setGamepadVibration = useCallback((v: boolean) => onChange({ ...config, gamepad: { ...config.gamepad, vibration: v } }), [config, onChange]);
  const setGamepadStick = useCallback((v: 0 | 1) => onChange({ ...config, gamepad: { ...config.gamepad, stickIndex: v } }), [config, onChange]);
  const setGamepadShootBtn = useCallback((v: number) => onChange({ ...config, gamepad: { ...config.gamepad, shootButton: v } }), [config, onChange]);
  const setMouseEnabled = useCallback((v: boolean) => onChange({ ...config, mouse: { ...config.mouse, enabled: v } }), [config, onChange]);
  const setMouseAimAssist = useCallback((v: boolean) => onChange({ ...config, mouse: { ...config.mouse, aimAssist: v } }), [config, onChange]);
  const setMouseSensitivity = useCallback((v: number) => onChange({ ...config, mouse: { ...config.mouse, sensitivity: v } }), [config, onChange]);
  const setTouchEnabled = useCallback((v: boolean) => onChange({ ...config, touch: { ...config.touch, enabled: v } }), [config, onChange]);
  const setTouchCursorOffset = useCallback((v: number) => onChange({ ...config, touch: { ...config.touch, cursorOffsetY: v } }), [config, onChange]);
  const setTouchCursorSize = useCallback((v: number) => onChange({ ...config, touch: { ...config.touch, cursorSize: v } }), [config, onChange]);
  const setTouchCursorSpeed = useCallback((v: number) => onChange({ ...config, touch: { ...config.touch, cursorSpeed: v } }), [config, onChange]);
  const resetBindings = useCallback(() => onChange({ ...config, keyBindings: { ...DEFAULT_INPUT_CONFIG.keyBindings } }), [config, onChange]);
  const resetAll = useCallback(() => onChange({ ...DEFAULT_INPUT_CONFIG }), [onChange]);

  return (
    <div>
      {/* ── Input Method ── */}
      <SectionLabel icon={<Zap size={11} color="rgba(148,163,194,0.5)" />} text="Primary Input" />
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([
          { method: 'keyboard' as InputMethod, icon: <Keyboard size={15} />, label: 'Keyboard' },
          { method: 'gamepad' as InputMethod, icon: <Gamepad2 size={15} />, label: 'Gamepad' },
          { method: 'touch' as InputMethod, icon: <Smartphone size={15} />, label: 'Touch' },
        ]).map(({ method, icon, label }) => (
          <button
            key={method}
            onClick={() => setMethod(method)}
            style={{
              flex: 1, padding: '10px 6px', borderRadius: 8,
              border: config.activeMethod === method ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(255,255,255,0.06)',
              background: config.activeMethod === method ? 'rgba(168,85,247,0.1)' : 'rgba(255,255,255,0.015)',
              color: config.activeMethod === method ? '#c084fc' : 'rgba(200,210,230,0.6)',
              cursor: 'pointer', fontSize: 11, fontFamily: FONT, fontWeight: config.activeMethod === method ? 600 : 400,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (config.activeMethod !== method) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { if (config.activeMethod !== method) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Keyboard Bindings ── */}
      <SectionLabel icon={<Keyboard size={11} color="rgba(148,163,194,0.5)" />} text="Key Bindings" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
        {ACTIONS.map(({ key, label, icon }) => {
          const keys = config.keyBindings[key];
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ color: 'rgba(148,163,194,0.45)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>
              <span style={{ color: 'rgba(200,215,240,0.6)', fontSize: 11.5, fontFamily: FONT, flex: 1, minWidth: 70 }}>{label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.slice(0, 3).map((k, i) => (
                  <button
                    key={i}
                    onClick={() => { setBindingAction(key); setBindingSlot(i); }}
                    style={{
                      padding: '3px 8px', borderRadius: 5, minWidth: 32,
                      border: (bindingAction === key && bindingSlot === i) ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      background: (bindingAction === key && bindingSlot === i) ? 'rgba(251,191,36,0.15)' : 'rgba(0,0,0,0.2)',
                      color: (bindingAction === key && bindingSlot === i) ? '#fbbf24' : 'rgba(200,215,240,0.7)',
                      cursor: 'pointer', fontSize: 11, fontFamily: MONO, fontWeight: 600, transition: 'all 0.15s', textAlign: 'center',
                    }}
                  >
                    {(bindingAction === key && bindingSlot === i) ? '...' : prettyKey(k)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={resetBindings}
        style={{
          padding: '6px 12px', borderRadius: 7,
          border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)',
          color: 'rgba(148,163,194,0.5)', cursor: 'pointer', fontSize: 11, fontFamily: FONT,
          display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
      >
        <RotateCcw size={12} /> Reset to Default
      </button>

      <Divider />

      {/* ── Gamepad ── */}
      <SectionLabel icon={<Gamepad2 size={11} color="rgba(148,163,194,0.5)" />} text="Gamepad" />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 8,
        background: gamepadConnected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.015)',
        border: gamepadConnected ? '1px solid rgba(16,185,129,0.12)' : '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: gamepadConnected ? '#10b981' : '#555',
          boxShadow: gamepadConnected ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
        }} />
        <span style={{ color: gamepadConnected ? 'rgba(16,185,129,0.8)' : 'rgba(148,163,194,0.4)', fontSize: 11, fontFamily: FONT, flex: 1 }}>
          {gamepadConnected ? gamepadName || 'Controller Connected' : 'No controller detected'}
        </span>
        {gamepadConnected && <Check size={13} color="#10b981" strokeWidth={2.5} />}
      </div>

      <PanelButton active={config.gamepad.enabled} onClick={() => setGamepadEnabled(!config.gamepad.enabled)}
        icon={<Gamepad2 size={14} />} label="Enable Gamepad" accentColor="#10b981"
        right={config.gamepad.enabled ? <Check size={13} color="#10b981" strokeWidth={2.5} /> : undefined}
      />

      {config.gamepad.enabled && (
        <div style={{ marginLeft: 4, marginBottom: 4 }}>
          <SliderRow label="Deadzone" icon={<CircleDot size={12} />} value={config.gamepad.deadzone}
            min={0.05} max={0.5} step={0.05} onChange={setGamepadDeadzone} display={config.gamepad.deadzone.toFixed(2)} />
          <PanelButton active={config.gamepad.vibration} onClick={() => setGamepadVibration(!config.gamepad.vibration)}
            icon={<Vibrate size={14} />} label="Vibration / Haptics" accentColor="#f59e0b"
            right={config.gamepad.vibration ? <Check size={13} color="#f59e0b" strokeWidth={2.5} /> : undefined}
          />
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {([0, 1] as const).map(idx => (
              <button key={idx} onClick={() => setGamepadStick(idx)} style={{
                flex: 1, padding: '7px', borderRadius: 7,
                border: config.gamepad.stickIndex === idx ? '1px solid rgba(14,165,233,0.3)' : '1px solid rgba(255,255,255,0.06)',
                background: config.gamepad.stickIndex === idx ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.015)',
                color: config.gamepad.stickIndex === idx ? '#38bdf8' : 'rgba(200,210,230,0.5)',
                cursor: 'pointer', fontSize: 11, fontFamily: FONT, fontWeight: config.gamepad.stickIndex === idx ? 600 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s',
              }}>
                <Move size={12} /> {idx === 0 ? 'Left Stick' : 'Right Stick'}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={{ color: 'rgba(148,163,194,0.4)', fontSize: 10, display: 'block', marginBottom: 4, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shoot Button</label>
            <select value={config.gamepad.shootButton} onChange={e => setGamepadShootBtn(parseInt(e.target.value))} style={{
              width: '100%', padding: '7px 10px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)',
              color: '#e2e8f0', fontSize: 12, fontFamily: MONO, outline: 'none', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
            }}>
              {GAMEPAD_BUTTONS.map((name, i) => (
                <option key={i} value={i} style={{ background: '#1a1a2e', color: '#e2e8f0' }}>{i}: {name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Divider />

      {/* ── Mouse ── */}
      <SectionLabel icon={<Mouse size={11} color="rgba(148,163,194,0.5)" />} text="Mouse" />
      <PanelButton active={config.mouse.enabled} onClick={() => setMouseEnabled(!config.mouse.enabled)}
        icon={<Mouse size={14} />} label="Enable Mouse Input" accentColor="#0ea5e9"
        right={config.mouse.enabled ? <Check size={13} color="#0ea5e9" strokeWidth={2.5} /> : undefined}
      />
      {config.mouse.enabled && (
        <div style={{ marginLeft: 4, marginBottom: 4 }}>
          <PanelButton active={config.mouse.aimAssist} onClick={() => setMouseAimAssist(!config.mouse.aimAssist)}
            icon={<Target size={14} />} label="Aim Assist" accentColor="#f59e0b"
            right={config.mouse.aimAssist ? <Check size={13} color="#f59e0b" strokeWidth={2.5} /> : undefined}
          />
          <SliderRow label="Sensitivity" icon={<Crosshair size={12} />} value={config.mouse.sensitivity}
            min={0.3} max={2.5} step={0.1} onChange={setMouseSensitivity} display={`${config.mouse.sensitivity.toFixed(1)}×`} />
        </div>
      )}

      <Divider />

      {/* ── Touch Cursor ── */}
      <SectionLabel icon={<MousePointer2 size={11} color="rgba(148,163,194,0.5)" />} text="Touch Cursor" />
      <PanelButton active={config.touch.enabled} onClick={() => setTouchEnabled(!config.touch.enabled)}
        icon={<Smartphone size={14} />} label="Enable Touch Cursor" accentColor="#10b981"
        right={config.touch.enabled ? <Check size={13} color="#10b981" strokeWidth={2.5} /> : undefined}
      />
      {config.touch.enabled && (
        <div style={{ marginLeft: 4, marginBottom: 4 }}>
          <SliderRow label="Finger Offset" icon={<ArrowUpFromDot size={12} />} value={config.touch.cursorOffsetY}
            min={30} max={160} step={5} onChange={setTouchCursorOffset} display={`${config.touch.cursorOffsetY}px`} />
          <SliderRow label="Cursor Size" icon={<MousePointer2 size={12} />} value={config.touch.cursorSize}
            min={18} max={48} step={2} onChange={setTouchCursorSize} display={`${config.touch.cursorSize}px`} />
          <SliderRow label="Speed" icon={<Zap size={12} />} value={config.touch.cursorSpeed}
            min={0.5} max={3.0} step={0.1} onChange={setTouchCursorSpeed} display={`${config.touch.cursorSpeed.toFixed(1)}×`} />

          <div style={{
            background: 'rgba(14,165,233,0.04)', borderRadius: 7, padding: '8px 10px',
            border: '1px solid rgba(14,165,233,0.06)', marginTop: 6,
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <MousePointer2 size={12} color="rgba(14,165,233,0.3)" style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ color: 'rgba(148,163,194,0.4)', fontSize: 10.5, lineHeight: 1.5, fontFamily: FONT }}>
              Works like a laptop touchpad — drag to move cursor, tap to click. Cursor stays where you left it.
            </span>
          </div>
        </div>
      )}

      <Divider />

      {/* Reset All */}
      <button onClick={resetAll} style={{
        width: '100%', padding: '10px', borderRadius: 9,
        border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
        color: 'rgba(239,68,68,0.7)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
      >
        <RotateCcw size={13} /> Reset All Controls
      </button>
    </div>
  );
}

function SliderRow({ label, icon, value, min, max, step, onChange, display }: {
  label: string; icon: React.ReactNode;
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 4,
      borderRadius: 7, background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)',
    }}>
      <div style={{ color: 'rgba(148,163,194,0.4)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</div>
      <span style={{ color: 'rgba(200,215,240,0.55)', fontSize: 11, fontFamily: FONT, minWidth: 60, flexShrink: 0 }}>{label}</span>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#0ea5e9', height: 4, cursor: 'pointer' }} />
      <span style={{ color: 'rgba(200,215,240,0.5)', fontSize: 11, fontFamily: MONO, minWidth: 38, textAlign: 'right' }}>{display}</span>
    </div>
  );
}
