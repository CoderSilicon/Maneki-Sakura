'use client';

import { useRef, useState, type ReactNode, type MouseEvent } from 'react';

interface RetroWindowProps {
  id?: string;
  className?: string;
  bodyClassName?: string;
  icon: string;
  title: string;
  children: ReactNode;
  hidden?: boolean;
  onClose?: () => void;
}

export function RetroWindow({
  id,
  className = '',
  bodyClassName = '',
  icon,
  title,
  children,
  hidden = false,
  onClose,
}: RetroWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [bodyHidden, setBodyHidden] = useState(false);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const handleTitleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.win-btn')) return;
    const win = windowRef.current;
    if (!win) return;

    const rect = win.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
    };
    win.style.position = 'fixed';
    win.style.left = `${rect.left}px`;
    win.style.top = `${rect.top}px`;
    win.style.zIndex = '100';

    const onMove = (ev: globalThis.MouseEvent) => {
      if (!dragRef.current.dragging || !windowRef.current) return;
      windowRef.current.style.left = `${dragRef.current.origX + (ev.clientX - dragRef.current.startX)}px`;
      windowRef.current.style.top = `${dragRef.current.origY + (ev.clientY - dragRef.current.startY)}px`;
    };

    const onUp = () => {
      dragRef.current.dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (hidden) return null;

  return (
    <div ref={windowRef} id={id} className={`retro-window ${className}`}>
      <div className="window-titlebar" onMouseDown={handleTitleMouseDown}>
        <span className="window-icon">{icon}</span>
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <button type="button" className="win-btn minimize" onClick={() => setBodyHidden((v) => !v)}>
            _
          </button>
          <button type="button" className="win-btn maximize">□</button>
          <button type="button" className="win-btn close" onClick={onClose}>×</button>
        </div>
      </div>
      {!bodyHidden && <div className={`window-body ${bodyClassName}`.trim()}>{children}</div>}
    </div>
  );
}
