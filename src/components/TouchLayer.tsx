import { useEffect, useRef, useCallback } from 'react';
import { type TouchConfig } from '../engine/InputConfig';
import { type GameEngine } from '../engine/GameEngine';

interface Props {
  engineRef: React.RefObject<GameEngine | null>;
  touchConfig: TouchConfig;
  enabled: boolean;
}

/**
 * TouchLayer — touchpad-style virtual cursor
 * 
 * - Drag = move cursor relative (like laptop touchpad)
 * - Cursor stays where you left it on release (never blinks/resets)
 * - Single tap = left click at cursor position
 * - Double tap = special action (e.g. shoot/confirm)
 * - Two-finger tap = right-click / pause
 * - Renders a real Windows-style arrow cursor via SVG
 */
export default function TouchLayer({ engineRef, touchConfig, enabled }: Props) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const cursorElRef = useRef<HTMLDivElement>(null);

  // All state in ref — no React re-renders, zero lag
  const s = useRef({
    // Cursor position (screen coords)
    x: window.innerWidth / 2,
    y: window.innerHeight / 3,
    visible: false,

    // Primary touch tracking
    touchId: null as number | null,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    startTime: 0,

    // Double tap
    lastTapTime: 0,

    // Two-finger tracking
    twoFingerDetected: false,
  });

  // ── Direct DOM update (no React) ──
  const updateDOM = useCallback(() => {
    const el = cursorElRef.current;
    if (!el) return;
    const c = s.current;
    el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    if (c.visible) el.style.opacity = '1';
  }, []);

  const syncEngine = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.handleMouseMove(s.current.x, s.current.y);
  }, [engineRef]);

  // ── Touch events ──
  const onStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const c = s.current;

    // Two-finger detection
    if (e.touches.length >= 2) {
      c.twoFingerDetected = true;
      return;
    }

    c.twoFingerDetected = false;

    // Already tracking a finger
    if (c.touchId !== null) return;

    const t = e.changedTouches[0];
    c.touchId = t.identifier;
    c.lastX = t.clientX;
    c.lastY = t.clientY;
    c.startX = t.clientX;
    c.startY = t.clientY;
    c.startTime = Date.now();

    // First ever touch — place cursor offset above finger
    if (!c.visible) {
      c.visible = true;
      c.x = t.clientX;
      c.y = Math.max(0, t.clientY - touchConfig.cursorOffsetY);
      updateDOM();
      syncEngine();
    }
  }, [enabled, touchConfig.cursorOffsetY, updateDOM, syncEngine]);

  const onMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const c = s.current;
    if (c.touchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== c.touchId) continue;

      const dx = (t.clientX - c.lastX) * touchConfig.cursorSpeed;
      const dy = (t.clientY - c.lastY) * touchConfig.cursorSpeed;

      c.x = Math.max(0, Math.min(window.innerWidth, c.x + dx));
      c.y = Math.max(0, Math.min(window.innerHeight, c.y + dy));
      c.lastX = t.clientX;
      c.lastY = t.clientY;

      updateDOM();
      syncEngine();
      break;
    }
  }, [enabled, touchConfig.cursorSpeed, updateDOM, syncEngine]);

  const onEnd = useCallback((e: TouchEvent) => {
    const c = s.current;

    // Two-finger tap → pause
    if (c.twoFingerDetected && e.touches.length === 0) {
      c.twoFingerDetected = false;
      const engine = engineRef.current;
      if (engine) engine.handleKeyDown('Escape');
      // Release immediately
      setTimeout(() => engineRef.current?.handleKeyUp('Escape'), 50);
      c.touchId = null;
      return;
    }

    if (c.touchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== c.touchId) continue;

      const dt = Date.now() - c.startTime;
      const dist = Math.hypot(t.clientX - c.startX, t.clientY - c.startY);
      const isTap = dt < 300 && dist < 15;

      if (isTap) {
        const now = Date.now();
        const sinceLast = now - c.lastTapTime;

        if (sinceLast < 350) {
          // ── DOUBLE TAP ──
          // Send Enter key (confirms / starts game / selects upgrade)
          const engine = engineRef.current;
          if (engine) {
            engine.handleClick(c.x, c.y);
            engine.handleKeyDown('Enter');
            setTimeout(() => engineRef.current?.handleKeyUp('Enter'), 50);
          }
          c.lastTapTime = 0; // reset so next tap is single
        } else {
          // ── SINGLE TAP ── (click at cursor position)
          c.lastTapTime = now;
          const engine = engineRef.current;
          if (engine) engine.handleClick(c.x, c.y);
        }
      }
      // else: just a drag — cursor stays, no click

      // Cursor STAYS in place. Never resets, never fades.
      c.touchId = null;
      break;
    }
  }, [engineRef]);

  // ── Attach listeners ──
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone || !enabled) return;

    zone.addEventListener('touchstart', onStart, { passive: false });
    zone.addEventListener('touchmove', onMove, { passive: false });
    zone.addEventListener('touchend', onEnd, { passive: false });
    zone.addEventListener('touchcancel', onEnd, { passive: false });

    return () => {
      zone.removeEventListener('touchstart', onStart);
      zone.removeEventListener('touchmove', onMove);
      zone.removeEventListener('touchend', onEnd);
      zone.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, onStart, onMove, onEnd]);

  // Hide system cursor
  useEffect(() => {
    if (!enabled) return;
    document.body.style.cursor = 'none';
    return () => { document.body.style.cursor = ''; };
  }, [enabled]);

  if (!enabled) return null;

  const sz = touchConfig.cursorSize;

  return (
    <>
      {/* Full-screen touch zone */}
      <div
        ref={zoneRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 99980,
          touchAction: 'none', cursor: 'none',
        }}
      />

      {/* Cursor — DOM-manipulated directly */}
      <div
        ref={cursorElRef}
        style={{
          position: 'fixed', left: 0, top: 0,
          width: 0, height: 0,
          zIndex: 99985, pointerEvents: 'none',
          opacity: 0, willChange: 'transform',
          transition: 'none',
        }}
      >
        {/* Windows arrow cursor */}
        <svg
          width={sz}
          height={sz}
          viewBox="0 0 24 24"
          style={{
            position: 'absolute', left: -1, top: -1,
            filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.6))',
          }}
        >
          <path
            d="M 2 1 L 2 19 L 6.5 14.5 L 10.5 22 L 13.5 20.5 L 9.5 12.5 L 15.5 12.5 Z"
            fill="black" stroke="black" strokeWidth="0.5" strokeLinejoin="round"
          />
          <path
            d="M 3.2 3 L 3.2 17 L 6.8 13.5 L 10.8 21 L 12.5 20.2 L 8.5 12 L 13.8 12 Z"
            fill="white"
          />
        </svg>
      </div>
    </>
  );
}
