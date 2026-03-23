import { motion, type Variants } from "framer-motion";

const containerVariants = (
  staggerChildren: number,
  delayChildren: number,
): Variants => ({
  initial: {},
  animate: {
    transition: { staggerChildren, delayChildren },
  },
});

const childVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}

export function StaggerChildren({
  children,
  className,
  stagger = 0.05,
  delay = 0,
}: StaggerChildrenProps) {
  return (
    <motion.div
      variants={containerVariants(stagger, delay)}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={childVariants} className={className}>
      {children}
    </motion.div>
  );
}
