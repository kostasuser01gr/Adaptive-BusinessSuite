import { useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedFormFieldProps {
  children: React.ReactNode;
  error?: string;
  success?: boolean;
  className?: string;
}

/**
 * Wraps form inputs with success/error animation feedback.
 * Green pulse on success validation, red shake on error.
 * Uses AnimatePresence for error message entrance/exit.
 */
export function AnimatedFormField({
  children,
  error,
  success,
  className,
}: AnimatedFormFieldProps) {
  const controls = useAnimation();

  // Shake on error
  useEffect(() => {
    if (error) {
      controls.start({
        x: [0, -8, 8, -8, 8, 0],
        transition: { duration: 0.4 },
      });
    }
  }, [error, controls]);

  // Green pulse on success
  useEffect(() => {
    if (success) {
      controls.start({
        boxShadow: [
          "0 0 0 0 rgba(74, 222, 128, 0)",
          "0 0 0 4px rgba(74, 222, 128, 0.25)",
          "0 0 0 0 rgba(74, 222, 128, 0)",
        ],
        transition: { duration: 0.6 },
      });
    }
  }, [success, controls]);

  return (
    <div className={cn("relative", className)}>
      <motion.div
        animate={controls}
        className={cn(
          "rounded-md transition-colors duration-200",
          error && "ring-1 ring-red-500/40",
          success && "ring-1 ring-green-500/40",
        )}
      >
        {children}
      </motion.div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            className="mt-1.5 text-xs text-red-400"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
