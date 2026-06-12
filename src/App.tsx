"use client";
import { useEffect, useRef, useCallback, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { type InputConfig, DEFAULT_INPUT_CONFIG } from './engine/InputConfig';
import DraggableBubble from './components/DraggableBubble';
import SettingsPanel, { type CanvasSize } from './components/SettingsPanel';
import TouchLayer from './components/TouchLayer';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    mode: 'fill', width: 0, height: 0, label: 'Fill Window',
  });
  const [inputConfig, setInputConfig] = useState<InputConfig>(() => {
    try {
      const saved = localStorage.getItem('galaxyDefenderInputConfig');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { ...DEFAULT_INPUT_CONFIG };
  });
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (engine) {
        const im = engine.getInputManager();
        setGamepadConnected(im.isGamepadConnected());
        setGamepadName(im.getGamepadName());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInputConfigChange = useCallback((config: InputConfig) => {
    setInputConfig(config);
    engineRef.current?.setInputConfig(config);
    try { localStorage.setItem('galaxyDefenderInputConfig', JSON.stringify(config)); } catch { /* */ }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* */ }
  }, []);

  // Container size — used for the ABSOLUTE positioned canvas container
  const getContainerDims = useCallback(() => {
    if (canvasSize.mode === 'fill') return { w: window.innerWidth, h: window.innerHeight };
    return {
      w: Math.min(canvasSize.width, window.innerWidth),
      h: Math.min(canvasSize.height, window.innerHeight),
    };
  }, [canvasSize]);

  const doResize = useCallback(() => {
    if (!containerRef.current || !engineRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    engineRef.current.resize(clientWidth, clientHeight);
  }, []);

  // Resize on config/fullscreen change
  useEffect(() => {
    // Update container size via DOM directly (no layout shift)
    const el = containerRef.current;
    if (!el) return;
    const { w, h } = getContainerDims();
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.left = `${(window.innerWidth - w) / 2}px`;
    el.style.top = `${(window.innerHeight - h) / 2}px`;
    requestAnimationFrame(() => doResize());
    const timer = setTimeout(() => doResize(), 100);
    return () => clearTimeout(timer);
  }, [canvasSize, isFullscreen, doResize, getContainerDims]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.setInputConfig(inputConfig);

    const { clientWidth, clientHeight } = containerRef.current;
    engine.resize(clientWidth, clientHeight);
    engine.start();

    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      // Recalc fill mode
      if (canvasSize.mode === 'fill') {
        el.style.width = `${window.innerWidth}px`;
        el.style.height = `${window.innerHeight}px`;
        el.style.left = '0px';
        el.style.top = '0px';
      }
      doResize();
    };
    window.addEventListener('resize', onResize);

    // Keyboard
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      engine.handleKeyDown(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse
    const onClick = (e: MouseEvent) => engine.handleClick(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => engine.handleMouseMove(e.clientX, e.clientY);
    canvasRef.current.addEventListener('click', onClick);
    canvasRef.current.addEventListener('mousemove', onMouseMove);

    const preventZoom = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('touchmove', preventZoom, { passive: false });

    const preventContext = (e: Event) => e.preventDefault();
    canvasRef.current.addEventListener('contextmenu', preventContext);

    const saved = canvasRef.current;
    return () => {
      engine.stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      saved.removeEventListener('click', onClick);
      saved.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', preventZoom);
      saved.removeEventListener('contextmenu', preventContext);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doResize]);

  const handleSizeChange = useCallback((size: CanvasSize) => setCanvasSize(size), []);
  const togglePanel = useCallback(() => setPanelOpen(prev => !prev), []);
  const isFill = canvasSize.mode === 'fill';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>

      {/* Grid BG when not fill */}
      {!isFill && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      )}

      {/* Size label */}
      {!isFill && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.12)', fontSize: 11,
          fontFamily: '"SF Mono", "Fira Code", monospace',
          pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, zIndex: 5,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(14,165,233,0.35)' }} />
          {canvasSize.label}
        </div>
      )}

      {/*
        Canvas container — ABSOLUTE positioned, never affected by panel.
        Panel overlays on top. Canvas stays put.
      */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          background: '#000',
          overflow: 'hidden',
          cursor: 'none',
          boxShadow: !isFill ? '0 0 60px rgba(0,0,0,0.9), 0 0 1px rgba(100,150,255,0.12)' : 'none',
          borderRadius: !isFill ? 3 : 0,
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', imageRendering: 'auto' }} />
      </div>

      {/* Draggable bubble */}
      <DraggableBubble onClick={togglePanel} isOpen={panelOpen} />

      {/* Settings panel — overlays on top, canvas untouched */}
      <SettingsPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        currentSize={canvasSize}
        onSizeChange={handleSizeChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        inputConfig={inputConfig}
        onInputConfigChange={handleInputConfigChange}
        gamepadConnected={gamepadConnected}
        gamepadName={gamepadName}
      />

      {/* Touch cursor */}
      {'ontouchstart' in window && (
        <TouchLayer
          engineRef={engineRef}
          touchConfig={inputConfig.touch}
          enabled={inputConfig.touch.enabled && !panelOpen}
        />
      )}

      <style>{`
        @keyframes bubblePulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { opacity: 0.3; }
        input[type="number"]:hover::-webkit-inner-spin-button,
        input[type="number"]:hover::-webkit-outer-spin-button { opacity: 1; }
        input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #0ea5e9; cursor: pointer; border: 2px solid rgba(0,0,0,0.3); box-shadow: 0 0 6px rgba(14,165,233,0.4); }
        input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #0ea5e9; cursor: pointer; border: 2px solid rgba(0,0,0,0.3); }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }
      `}</style>
    </div>
  );
}

export default App;
