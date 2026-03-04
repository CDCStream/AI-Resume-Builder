"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate,
} from "framer-motion";

interface AnimatedGridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  gridSize?: number;
  revealRadius?: number;
  baseOpacity?: number;
  revealOpacity?: number;
}

export const AnimatedGridBackground = ({
  className,
  children,
  gridSize = 40,
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

  const maskImage = useMotionTemplate`radial-gradient(${revealRadius}px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  const animDuration = `${gridSize / 18}s`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn("relative w-full overflow-hidden", className)}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gridScroll {
          from { transform: translate(0, 0); }
          to { transform: translate(-${gridSize}px, -${gridSize}px); }
        }
      `}} />

      {/* Base grid layer — CSS-animated, GPU composited */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ opacity: baseOpacity }}
      >
        <div style={{
          position: "absolute",
          inset: `-${gridSize}px`,
          animation: `gridScroll ${animDuration} linear infinite`,
        }}>
          <GridPattern gridSize={gridSize} patternId="grid-base" />
        </div>
      </div>

      {/* Reveal grid layer - visible on mouse hover (desktop only) */}
      <motion.div 
        className="hidden md:block absolute inset-0 z-0"
        style={{ 
          maskImage, 
          WebkitMaskImage: maskImage,
          opacity: revealOpacity 
        }}
      >
        <div style={{
          position: "absolute",
          inset: `-${gridSize}px`,
          animation: `gridScroll ${animDuration} linear infinite`,
        }}>
          <GridPattern gridSize={gridSize} patternId="grid-reveal" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface GridPatternProps {
  gridSize: number;
  patternId: string;
}

const GridPattern = ({ gridSize, patternId }: GridPatternProps) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <pattern
          id={patternId}
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-blue-500/50" 
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};

export default AnimatedGridBackground;
