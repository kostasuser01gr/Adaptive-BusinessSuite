import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

interface ShakeOnErrorProps {
  children: React.ReactNode;
  hasError: boolean;
  className?: string;
}

export function ShakeOnError({
  children,
  hasError,
  className,
}: ShakeOnErrorProps) {
  const controls = useAnimation();

  useEffect(() => {
    if (hasError) {
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [hasError, controls]);

  return (
    <motion.div animate={controls} className={className}>
      {children}
    </motion.div>
  );
}
