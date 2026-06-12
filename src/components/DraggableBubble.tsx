import { useRef, useCallback, useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';

interface Props {
  onClick: () => void;
  isOpen: boolean;
}

export default function DraggableBubble({ onClick, isOpen }: Props) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
  });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = bubbleRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);

    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      hasMoved: false,
    };
    setDragging(true);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragState.current.hasMoved = true;
    }

    const newX = Math.max(0, Math.min(window.innerWidth - 52, dragState.current.startPosX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 52, dragState.current.startPosY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState.current.hasMoved) {
      onClick();
    }
    dragState.current.isDragging = false;
    setDragging(false);
  }, [onClick]);

  useEffect(() => {
    const handleResize = () => {
      setPos(p => ({
        x: Math.min(p.x, window.innerWidth - 52),
        y: Math.min(p.y, window.innerHeight - 52),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={bubbleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 99999,
        width: 48,
        height: 48,
        borderRadius: '50%',
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Pulse ring */}
      <div
        style={{
          position: 'absolute',
          inset: -5,
          borderRadius: '50%',
          border: `2px solid ${isOpen ? 'rgba(255,80,100,0.2)' : 'rgba(0,180,255,0.2)'}`,
          animation: 'bubblePulse 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Body */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
          boxShadow: isOpen
            ? '0 2px 16px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
            : '0 2px 16px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s, box-shadow 0.3s, transform 0.15s ease',
          transform: dragging ? 'scale(1.18)' : 'scale(1)',
        }}
      >
        <div
          style={{
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isOpen ? (
            <X size={20} color="#fff" strokeWidth={2.5} />
          ) : (
            <Settings size={20} color="#fff" strokeWidth={2} />
          )}
        </div>
      </div>
    </div>
  );
}
