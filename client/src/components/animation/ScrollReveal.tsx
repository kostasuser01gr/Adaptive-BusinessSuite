import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { springs } from "@/lib/animation";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
  threshold?: number;
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  once = true,
  threshold = 0.2,
  delay = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: threshold });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ ...springs.gentle, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
