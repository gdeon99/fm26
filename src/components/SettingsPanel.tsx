import { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Gamepad2,
  GripVertical,
} from 'lucide-react';
import DisplayPanel from './panels/DisplayPanel';
import ControlsPanel from './panels/ControlsPanel';
import { type InputConfig } from '../engine/InputConfig';

export interface CanvasSize {
  mode: 'fill' | 'preset' | 'custom';
  width: number;
  height: number;
  label: string;
}

type Tab = 'display' | 'controls';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSize: CanvasSize;
  onSizeChange: (size: CanvasSize) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  inputConfig: InputConfig;
  onInputConfigChange: (config: InputConfig) => void;
  gamepadConnected: boolean;
  gamepadName: string;
}

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

export default function SettingsPanel({
  isOpen,
  onClose,
  currentSize,
  onSizeChange,
  isFullscreen,
  onToggleFullscreen,
  inputConfig,
  onInputConfigChange,
  gamepadConnected,
  gamepadName,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('display');

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'display', label: 'Display', icon: <Monitor size={14} /> },
    { id: 'controls', label: 'Controls', icon: <Gamepad2 size={14} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 99990,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        onKeyUp={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0,
          width: 380, height: '100vh', zIndex: 99995,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Glass bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(12,12,28,0.97), rgba(8,8,22,0.98))',
          borderLeft: '1px solid rgba(100,150,255,0.1)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Header ── */}
          <div style={{ padding: '18px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: FONT, margin: 0, letterSpacing: '-0.01em' }}>
                Settings
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#555', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#555'; }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 2, marginBottom: -1 }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '9px 10px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #0ea5e9' : '2px solid transparent',
                    background: activeTab === tab.id ? 'rgba(14,165,233,0.06)' : 'transparent',
                    color: activeTab === tab.id ? '#38bdf8' : 'rgba(148,163,194,0.5)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: FONT,
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(200,215,240,0.7)'; }}
                  onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(148,163,194,0.5)'; }}
                >
                  {tab.icon}
                  {tab.label}
                  {/* Badge for gamepad connected */}
                  {tab.id === 'controls' && gamepadConnected && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#10b981', boxShadow: '0 0 4px rgba(16,185,129,0.5)',
                    }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {activeTab === 'display' && (
              <DisplayPanel
                currentSize={currentSize}
                onSizeChange={onSizeChange}
                isFullscreen={isFullscreen}
                onToggleFullscreen={onToggleFullscreen}
              />
            )}
            {activeTab === 'controls' && (
              <ControlsPanel
                config={inputConfig}
                onChange={onInputConfigChange}
                gamepadConnected={gamepadConnected}
                gamepadName={gamepadName}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
              <GripVertical size={11} color="rgba(148,163,194,0.2)" />
              <span style={{ color: 'rgba(148,163,194,0.25)', fontSize: 10.5, fontFamily: FONT }}>
                Drag the bubble to reposition
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
