import { motion, type Variants } from "framer-motion";
import { springs } from "@/lib/animation";

const variants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

interface AnimatedMountProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnimatedMount({
  children,
  className,
  delay = 0,
}: AnimatedMountProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...springs.snappy, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
