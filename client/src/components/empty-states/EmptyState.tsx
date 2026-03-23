import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * Reusable empty state component with animated illustration.
 * Features a gentle floating/bobbing animation on the icon
 * and glass card styling consistent with the dark theme.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6",
        // Glass card styling
        "rounded-2xl border border-white/[0.06]",
        "bg-white/[0.02] backdrop-blur-xl",
        "shadow-[0_0_1px_0_rgba(255,255,255,0.05)_inset]",
        className,
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Floating / bobbing icon container */}
      <motion.div
        className="w-16 h-16 rounded-2xl bg-muted/30 border border-white/[0.08] flex items-center justify-center mb-5"
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      >
        <Icon className="h-7 w-7 text-muted-foreground" />
      </motion.div>

      <motion.h3
        className="text-sm font-semibold text-foreground/90 mb-1.5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-xs text-muted-foreground max-w-[300px] text-center leading-relaxed"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          className="mt-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
