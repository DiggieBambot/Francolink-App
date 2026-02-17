// src/components/session/session-viewer.tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { TutorSession, SessionEvent, DrawData, CursorData } from '@/types/session';

interface SessionViewerProps {
  session: TutorSession;
  pdfUrl: string;
  drawEvents: SessionEvent[];
  cursorEvents: SessionEvent[];
  currentUserId: string | undefined;
  isTutor: boolean;
  onDraw: (data: DrawData) => void;
  onCursorMove: (data: CursorData) => void;
}

export function SessionViewer({
  session,
  pdfUrl,
  drawEvents,
  cursorEvents,
  currentUserId,
  isTutor,
  onDraw,
  onCursorMove
}: SessionViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const lastCursorUpdate = useRef<number>(0);

  // Get drawing settings from window (set by SessionControls)
  const getDrawingSettings = () => {
    if (typeof window !== 'undefined' && (window as any).__drawingSettings) {
      return (window as any).__drawingSettings;
    }
    return { tool: 'pen', color: '#ef4444', width: 3 };
  };

  // Resize canvas to match container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Redraw after resize
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when events change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    drawEvents.forEach((event) => {
      const data = event.data as DrawData;
      if (!data.points || data.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
      ctx.lineWidth = data.tool === 'highlighter' ? data.width * 3 : data.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (data.tool === 'highlighter') {
        ctx.globalAlpha = 0.3;
      } else {
        ctx.globalAlpha = 1;
      }

      ctx.moveTo(data.points[0].x, data.points[0].y);
      
      for (let i = 1; i < data.points.length; i++) {
        ctx.lineTo(data.points[i].x, data.points[i].y);
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [drawEvents]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle mouse events
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTutor) return; // Only tutors can draw
    
    const settings = getDrawingSettings();
    if (settings.tool === 'none') return;

    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentPath([point]);

    // Start drawing preview
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = settings.tool === 'eraser' ? '#ffffff' : settings.color;
      ctx.lineWidth = settings.tool === 'highlighter' ? settings.width * 3 : settings.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (settings.tool === 'highlighter') {
        ctx.globalAlpha = 0.3;
      }
      ctx.moveTo(point.x, point.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    const settings = getDrawingSettings();

    // Send cursor position (throttled)
    const now = Date.now();
    if (now - lastCursorUpdate.current > 50) { // 20 updates per second max
      onCursorMove({
        x: point.x,
        y: point.y,
        page: session.current_page
      });
      lastCursorUpdate.current = now;
    }

    // Draw if mouse is down
    if (!isDrawing || !isTutor) return;

    setCurrentPath((prev) => [...prev, point]);

    // Draw preview
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !isTutor) return;

    const settings = getDrawingSettings();
    
    // Send the completed path
    if (currentPath.length > 1) {
      onDraw({
        points: currentPath,
        color: settings.color,
        width: settings.width,
        tool: settings.tool
      });
    }

    setIsDrawing(false);
    setCurrentPath([]);

    // Reset context
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.globalAlpha = 1;
    }
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  // Get remote cursor (last cursor from other users)
  const remoteCursor = cursorEvents
    .filter(e => e.user_id !== currentUserId)
    .slice(-1)[0]?.data as CursorData | undefined;

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative bg-gray-200 overflow-hidden"
    >
      {/* PDF Viewer */}
      {pdfUrl ? (
        <iframe
          src={`${pdfUrl}#page=${session.current_page}&toolbar=0&navpanes=0`}
          className="absolute inset-0 w-full h-full border-0"
          title="Lesson PDF"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No PDF loaded</p>
            <p className="text-sm text-gray-400 mt-1">Select a lesson to display content</p>
          </div>
        </div>
      )}

      {/* Whiteboard Canvas Layer */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${
          isTutor ? 'cursor-crosshair' : 'pointer-events-none'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Remote Cursor */}
      {remoteCursor && remoteCursor.page === session.current_page && (
        <div
          className="absolute pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: remoteCursor.x - 8,
            top: remoteCursor.y - 8,
            zIndex: 50
          }}
        >
          {/* Cursor Icon */}
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            className="drop-shadow-md"
          >
            <path 
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 00-.85.36z" 
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>
          {/* Cursor Label */}
          <span className="absolute left-6 top-4 bg-blue-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
            Tutor
          </span>
        </div>
      )}

      {/* Page Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
        Page {session.current_page}
      </div>

      {/* Drawing Mode Indicator - Tutor Only */}
      {isTutor && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow text-sm">
          {getDrawingSettings().tool === 'none' 
            ? '👆 Click to draw' 
            : `✏️ Drawing with ${getDrawingSettings().tool}`}
        </div>
      )}
    </div>
  );
}