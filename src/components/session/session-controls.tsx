// src/components/session/session-controls.tsx
'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pen, 
  Highlighter, 
  Eraser, 
  Trash2,
  ZoomIn,
  ZoomOut,
  Palette
} from 'lucide-react';
import type { TutorSession } from '@/types/session';

interface SessionControlsProps {
  session: TutorSession;
  onPageChange: (page: number) => void;
  onClearCanvas: () => void;
}

export type DrawingTool = 'pen' | 'highlighter' | 'eraser' | 'none';

interface DrawingSettings {
  tool: DrawingTool;
  color: string;
  width: number;
}

// Export for use in SessionViewer
export const useDrawingSettings = () => {
  const [settings, setSettings] = useState<DrawingSettings>({
    tool: 'pen',
    color: '#ef4444', // Red
    width: 3
  });

  return { settings, setSettings };
};

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Black', value: '#000000' },
];

const WIDTHS = [
  { name: 'Thin', value: 2 },
  { name: 'Medium', value: 4 },
  { name: 'Thick', value: 8 },
];

export function SessionControls({ 
  session, 
  onPageChange, 
  onClearCanvas 
}: SessionControlsProps) {
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(3);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [totalPages, setTotalPages] = useState(10); // This should come from the PDF

  const handlePrevPage = () => {
    if (session.current_page > 1) {
      onPageChange(session.current_page - 1);
    }
  };

  const handleNextPage = () => {
    if (session.current_page < totalPages) {
      onPageChange(session.current_page + 1);
    }
  };

  const handleClearCanvas = () => {
    if (confirm('Clear all drawings on this page?')) {
      onClearCanvas();
    }
  };

  // Store settings in window for SessionViewer to access
  if (typeof window !== 'undefined') {
    (window as any).__drawingSettings = { tool, color, width };
  }

  return (
    <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={session.current_page <= 1}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1 min-w-[100px] justify-center">
          <input
            type="number"
            value={session.current_page}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            className="w-12 text-center border rounded px-2 py-1 text-sm"
            min={1}
            max={totalPages}
          />
          <span className="text-gray-500 text-sm">/ {totalPages}</span>
        </div>
        
        <button
          onClick={handleNextPage}
          disabled={session.current_page >= totalPages}
          className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Drawing Tools */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'pen' 
              ? 'bg-white shadow text-primary' 
              : 'hover:bg-white/50'
          }`}
          title="Pen"
        >
          <Pen className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => setTool('highlighter')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'highlighter' 
              ? 'bg-white shadow text-yellow-600' 
              : 'hover:bg-white/50'
          }`}
          title="Highlighter"
        >
          <Highlighter className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'eraser' 
              ? 'bg-white shadow text-gray-600' 
              : 'hover:bg-white/50'
          }`}
          title="Eraser"
        >
          <Eraser className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Color Picker */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            title="Color"
          >
            <div 
              className="w-5 h-5 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: color }}
            />
          </button>
          
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-lg shadow-lg border z-10">
              <div className="grid grid-cols-3 gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setColor(c.value);
                      setShowColorPicker(false);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c.value ? 'border-gray-800 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              
              {/* Width Selector */}
              <div className="mt-2 pt-2 border-t">
                <div className="flex gap-1">
                  {WIDTHS.map((w) => (
                    <button
                      key={w.value}
                      onClick={() => setWidth(w.value)}
                      className={`flex-1 py-1 text-xs rounded ${
                        width === w.value 
                          ? 'bg-primary-100 text-primary' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear Canvas */}
        <button
          onClick={handleClearCanvas}
          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          title="Clear Canvas"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Controls (placeholder) */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm text-gray-600 min-w-[50px] text-center">100%</span>
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}