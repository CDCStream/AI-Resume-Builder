"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface PhotoPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialPosition: { x: number; y: number; scale: number };
  onSave: (position: { x: number; y: number; scale: number }) => void;
}

export function PhotoPositionModal({
  isOpen,
  onClose,
  imageUrl,
  initialPosition,
  onSave,
}: PhotoPositionModalProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition, isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Convert pixel movement to percentage (adjust sensitivity)
      const sensitivity = 0.5;
      const newX = Math.max(-50, Math.min(50, position.x + deltaX * sensitivity));
      const newY = Math.max(-50, Math.min(50, position.y + deltaY * sensitivity));

      setPosition((prev) => ({ ...prev, x: newX, y: newY }));
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, position.x, position.y]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setPosition((prev) => ({
      ...prev,
      scale: Math.max(1, Math.min(2, prev.scale + delta)),
    }));
  }, []);

  const handleSave = () => {
    onSave(position);
    onClose();
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0, scale: 1 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
          Adjust Photo Position
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          Drag to move • Scroll to zoom
        </p>

        {/* Photo Container */}
        <div
          ref={containerRef}
          className="relative mx-auto mb-6 select-none"
          style={{ width: 200, height: 200 }}
        >
          {/* Transparent overlay with circle cutout */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <defs>
                <mask id="circleMask">
                  <rect width="200" height="200" fill="white" />
                  <circle cx="100" cy="100" r="90" fill="black" />
                </mask>
              </defs>
              <rect
                width="200"
                height="200"
                fill="rgba(0,0,0,0.6)"
                mask="url(#circleMask)"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Draggable Image */}
          <div
            className="absolute inset-0 overflow-hidden rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
          >
            <img
              src={imageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${position.x}%, ${position.y}%) scale(${position.scale})`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>Zoom</span>
            <span>{Math.round(position.scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              min="100"
              max="200"
              value={position.scale * 100}
              onChange={(e) =>
                setPosition((prev) => ({
                  ...prev,
                  scale: parseInt(e.target.value) / 100,
                }))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

