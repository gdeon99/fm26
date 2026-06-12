import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Monitor,
  Maximize,
  Minimize,
  Check,
  Link,
  Unlink,
  Lock,
  Info,
  Sparkles,
  GripVertical,
  ArrowRight,
} from 'lucide-react';
import { type CanvasSize } from '../SettingsPanel';

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
const MONO = '"SF Mono", "Fira Code", "Cascadia Code", monospace';

const ALL_PRESETS: { w: number; h: number }[] = [
  { w: 1920, h: 1080 },
  { w: 1600, h: 900 },
  { w: 1366, h: 768 },
  { w: 1280, h: 720 },
  { w: 960, h: 540 },
  { w: 854, h: 480 },
  { w: 640, h: 360 },
  { w: 426, h: 240 },
];

interface Props {
  currentSize: CanvasSize;
  onSizeChange: (size: CanvasSize) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function DisplayPanel({ currentSize, onSizeChange, isFullscreen, onToggleFullscreen }: Props) {
  const [customW, setCustomW] = useState(String(currentSize.width || 1280));
  const [customH, setCustomH] = useState(String(currentSize.height || 720));
  const [lockRatio, setLockRatio] = useState(true);
  const [screenW, setScreenW] = useState(window.innerWidth);
  const [screenH, setScreenH] = useState(window.innerHeight);

  useEffect(() => {
    const update = () => { setScreenW(window.innerWidth); setScreenH(window.innerHeight); };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filteredPresets = useMemo(() => ALL_PRESETS.filter(p => p.w <= screenW && p.h <= screenH), [screenW, screenH]);
  const maxW = screenW;
  const maxH = screenH;

  const handlePresetClick = useCallback((w: number, h: number) => {
    onSizeChange({ mode: 'preset', width: w, height: h, label: `${w} × ${h}` });
    setCustomW(String(w));
    setCustomH(String(h));
  }, [onSizeChange]);

  const handleFillClick = useCallback(() => {
    onSizeChange({ mode: 'fill', width: 0, height: 0, label: 'Fill Window' });
  }, [onSizeChange]);

  const handleCustomApply = useCallback(() => {
    const w = Math.max(320, Math.min(maxW, parseInt(customW) || 1280));
    const h = Math.max(180, Math.min(maxH, parseInt(customH) || 720));
    setCustomW(String(w)); setCustomH(String(h));
    onSizeChange({ mode: 'custom', width: w, height: h, label: `${w} × ${h}` });
  }, [customW, customH, maxW, maxH, onSizeChange]);

  const handleWidthChange = useCallback((val: string) => {
    setCustomW(val);
    if (lockRatio) { const w = parseInt(val) || 0; setCustomH(String(Math.round(w / (16 / 9)))); }
  }, [lockRatio]);

  const handleHeightChange = useCallback((val: string) => {
    setCustomH(val);
    if (lockRatio) { const h = parseInt(val) || 0; setCustomW(String(Math.round(h * (16 / 9)))); }
  }, [lockRatio]);

  const isPresetActive = (w: number, h: number) => currentSize.mode !== 'fill' && currentSize.width === w && currentSize.height === h;
  const isFillActive = currentSize.mode === 'fill';

  return (
    <div>
      {/* Current info */}
      <div style={{
        background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.1)',
        borderRadius: 11, padding: '13px 15px', marginBottom: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              <span style={{ color: 'rgba(200,215,240,0.65)', fontSize: 10.5, fontFamily: FONT, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active</span>
            </div>
            <div style={{ color: '#fff', fontSize: 19, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.01em' }}>
              {isFillActive ? 'Fill Window' : currentSize.label}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(148,163,194,0.4)', fontSize: 10, fontFamily: FONT, marginBottom: 2 }}>Screen</div>
            <div style={{ color: 'rgba(148,163,194,0.55)', fontSize: 12, fontFamily: MONO }}>{screenW}×{screenH}</div>
          </div>
        </div>
      </div>

      {/* Fullscreen */}
      <SectionLabel icon={<Maximize size={11} color="rgba(148,163,194,0.5)" />} text="Fullscreen" />
      <PanelButton
        active={isFullscreen}
        onClick={onToggleFullscreen}
        accentColor="#10b981"
        icon={isFullscreen ? <Minimize size={15} strokeWidth={2} /> : <Maximize size={15} strokeWidth={2} />}
        label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        right={isFullscreen ? <Check size={14} color="#10b981" strokeWidth={2.5} /> : undefined}
      />

      <Divider />

      {/* Fill Window */}
      <SectionLabel icon={<Sparkles size={11} color="rgba(148,163,194,0.5)" />} text="Mode" />
      <PanelButton
        active={isFillActive}
        onClick={handleFillClick}
        icon={<Monitor size={15} strokeWidth={2} />}
        label="Fill Window"
        badge="AUTO"
        right={isFillActive ? <Check size={14} color="#0ea5e9" strokeWidth={2.5} /> : undefined}
      />

      {/* Presets */}
      {filteredPresets.length > 0 && (
        <>
          <SectionLabel icon={<GripVertical size={11} color="rgba(148,163,194,0.5)" />} text="Presets" extra={`≤ ${screenW}×${screenH}`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 18 }}>
            {filteredPresets.map(({ w, h }) => (
              <PanelButton
                key={`${w}x${h}`}
                active={isPresetActive(w, h)}
                onClick={() => handlePresetClick(w, h)}
                icon={<Monitor size={13} strokeWidth={1.5} style={{ opacity: 0.4 }} />}
                label={`${w} × ${h}`}
                badge="16:9"
                mono
                right={isPresetActive(w, h) ? <Check size={13} color="#0ea5e9" strokeWidth={2.5} /> : undefined}
              />
            ))}
          </div>
        </>
      )}

      <Divider />

      {/* Custom */}
      <SectionLabel icon={<ArrowRight size={11} color="rgba(148,163,194,0.5)" />} text="Custom Size" extra={`max ${maxW}×${maxH}`} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ color: 'rgba(148,163,194,0.4)', fontSize: 10, display: 'block', marginBottom: 4, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Width</label>
          <NumInput value={customW} onChange={handleWidthChange} max={maxW} min={320} />
        </div>
        <button
          onClick={() => setLockRatio(!lockRatio)}
          title={lockRatio ? 'Ratio locked (16:9)' : 'Ratio free'}
          style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            border: lockRatio ? '1px solid rgba(14,165,233,0.25)' : '1px solid rgba(255,255,255,0.07)',
            background: lockRatio ? 'rgba(14,165,233,0.08)' : 'rgba(255,255,255,0.02)',
            color: lockRatio ? '#38bdf8' : '#555',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}
        >
          {lockRatio ? <Link size={14} strokeWidth={2} /> : <Unlink size={14} strokeWidth={2} />}
        </button>
        <div style={{ flex: 1 }}>
          <label style={{ color: 'rgba(148,163,194,0.4)', fontSize: 10, display: 'block', marginBottom: 4, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Height</label>
          <NumInput value={customH} onChange={handleHeightChange} max={maxH} min={180} />
        </div>
      </div>
      {lockRatio && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <Lock size={10} color="rgba(14,165,233,0.4)" />
          <span style={{ color: 'rgba(14,165,233,0.4)', fontSize: 10.5, fontFamily: FONT }}>Locked to 16:9</span>
        </div>
      )}
      <button
        onClick={handleCustomApply}
        style={{
          width: '100%', padding: '10px', borderRadius: 9,
          border: '1px solid rgba(14,165,233,0.25)',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))',
          color: '#38bdf8', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: FONT,
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(6,182,212,0.14))'}
        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,182,212,0.08))'}
      >
        <ArrowRight size={13} /> Apply Custom Size
      </button>

      <div style={{ height: 14 }} />
      <Divider />

      {/* Info */}
      <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 9, padding: '11px 13px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <Info size={13} color="rgba(148,163,194,0.3)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ color: 'rgba(148,163,194,0.4)', fontSize: 11, margin: 0, lineHeight: 1.55, fontFamily: FONT }}>
            Virtual resolution is <strong style={{ color: 'rgba(200,215,240,0.55)' }}>1920×1080</strong>. Viewport changes only affect display — game scales with 16:9 letterbox. Presets larger than your screen are hidden.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ──

export function SectionLabel({ icon, text, extra }: { icon: React.ReactNode; text: string; extra?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
      {icon}
      <span style={{ color: 'rgba(148,163,194,0.5)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>{text}</span>
      {extra && <span style={{ color: 'rgba(148,163,194,0.2)', fontSize: 9.5, fontFamily: '"SF Mono", monospace', marginLeft: 'auto' }}>{extra}</span>}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', margin: '6px 0 14px' }} />;
}

interface PanelButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  badge?: string;
  right?: React.ReactNode;
  accentColor?: string;
  mono?: boolean;
}

export function PanelButton({ active, onClick, icon, label, badge, right, accentColor = '#0ea5e9', mono }: PanelButtonProps) {
  const activeBorder = `1px solid ${accentColor}55`;
  const activeBg = `${accentColor}14`;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '10px 13px', borderRadius: 9,
        border: active ? activeBorder : '1px solid rgba(255,255,255,0.06)',
        background: active ? activeBg : 'rgba(255,255,255,0.015)',
        color: active ? accentColor : 'rgba(200,210,230,0.7)',
        cursor: 'pointer', fontSize: 12.5,
        fontFamily: mono ? '"SF Mono", "Fira Code", monospace' : '"Segoe UI", system-ui, sans-serif',
        fontWeight: active ? 600 : 400, textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 9, transition: 'all 0.15s', marginBottom: 4,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}}
    >
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 9.5, opacity: 0.3, fontFamily: '"SF Mono", monospace' }}>{badge}</span>}
      {right}
    </button>
  );
}

function NumInput({ value, onChange, min, max }: { value: string; onChange: (v: string) => void; min: number; max: number }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      min={min} max={max}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 7,
        border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.25)',
        color: '#e2e8f0', fontSize: 13, fontFamily: '"SF Mono", "Fira Code", monospace',
        outline: 'none', transition: 'border-color 0.2s',
      }}
      onFocus={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)'}
      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    />
  );
}
