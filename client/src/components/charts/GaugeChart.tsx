import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/animation/use-reduced-motion";

interface GaugeChartProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  color?: string;
}

export function GaugeChart({
  value,
  max = 100,
  label,
  size = 120,
  color = "oklch(0.72 0.19 142)",
}: GaugeChartProps) {
  const prefersReduced = useReducedMotion();
  const pct = Math.min(value / max, 1);
  const radius = (size - 16) / 2;
  const circumference = Math.PI * radius; // semicircle
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size / 2 + 12}
        viewBox={`0 0 ${size} ${size / 2 + 12}`}
      >
        {/* Background arc */}
        <path
          d={`M 8 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 4}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d={`M 8 ${size / 2 + 4} A ${radius} ${radius} 0 0 1 ${size - 8} ${size / 2 + 4}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { duration: 1, ease: "easeOut", delay: 0.2 }
          }
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          fill="currentColor"
          fontSize={size / 5}
          fontWeight="600"
        >
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && (
        <span className="text-[10px] text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
