import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyToContentProps {
  /** Show content when true, empty state when false */
  hasContent: boolean;
  /** The empty state component */
  empty: ReactNode;
  /** The content to show when data is available */
  children: ReactNode;
}

/**
 * Smooth cross-fade transition between empty state and content.
 * Empty state shrinks and fades out while content items stagger in.
 */
export function EmptyToContent({
  hasContent,
  empty,
  children,
}: EmptyToContentProps) {
  return (
    <AnimatePresence mode="wait">
      {hasContent ? (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {empty}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
