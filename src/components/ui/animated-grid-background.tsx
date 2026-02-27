"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate, 
  useAnimationFrame,
  MotionValue
} from "framer-motion";

interface AnimatedGridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  gridSize?: number;
  speedX?: number;
  speedY?: number;
  revealRadius?: number;
  baseOpacity?: number;
  revealOpacity?: number;
}

export const AnimatedGridBackground = ({
  className,
  children,
  gridSize = 40,
  speedX = 0.3,
  speedY = 0.3,
  revealRadius = 350,
  baseOpacity = 0.03,
  revealOpacity = 0.15,
}: AnimatedGridBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % gridSize);
    gridOffsetY.set((currentY + speedY) % gridSize);
  });

  const maskImage = useMotionTemplate`radial-gradient(${revealRadius}px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative w-full overflow-hidden", className)}
    >
      {/* Base grid layer - always visible, very subtle */}
      <div 
        className="absolute inset-0 z-0"
        style={{ opacity: baseOpacity }}
      >
        <GridPattern 
          offsetX={gridOffsetX} 
          offsetY={gridOffsetY} 
          gridSize={gridSize}
          patternId="grid-base"
        />
      </div>

      {/* Reveal grid layer - visible on mouse hover */}
      <motion.div 
        className="absolute inset-0 z-0"
        style={{ 
          maskImage, 
          WebkitMaskImage: maskImage,
          opacity: revealOpacity 
        }}
      >
        <GridPattern 
          offsetX={gridOffsetX} 
          offsetY={gridOffsetY} 
          gridSize={gridSize}
          patternId="grid-reveal"
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface GridPatternProps {
  offsetX: MotionValue<number>;
  offsetY: MotionValue<number>;
  gridSize: number;
  patternId: string;
}

const GridPattern = ({ offsetX, offsetY, gridSize, patternId }: GridPatternProps) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={patternId}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-blue-500/50" 
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export default AnimatedGridBackground;
