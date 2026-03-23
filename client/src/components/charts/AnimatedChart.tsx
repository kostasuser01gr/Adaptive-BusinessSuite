import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedChartProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Wraps recharts charts with entrance animations using framer-motion.
 * Uses useInView to trigger animation when scrolled into view.
 * Fade up + scale from 0.95 to 1.
 */
export function AnimatedChart({
  children,
  delay = 0,
  className,
}: AnimatedChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 16, scale: 0.95 }
      }
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
}
