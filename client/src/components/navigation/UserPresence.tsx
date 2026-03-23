import { motion } from "framer-motion";

type Status = "online" | "away" | "offline";
type Size = "sm" | "md";

interface UserPresenceProps {
  status: Status;
  size?: Size;
}

const colorMap: Record<Status, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  offline: "bg-gray-500",
};

const sizeMap: Record<Size, string> = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
};

export function UserPresence({ status, size = "sm" }: UserPresenceProps) {
  const dot = (
    <span
      className={`inline-block rounded-full ${colorMap[status]} ${sizeMap[size]}`}
    />
  );

  if (status === "online") {
    return (
      <span className="relative inline-flex" aria-label="Online">
        {/* pulse ring */}
        <motion.span
          className={`absolute inline-flex rounded-full ${colorMap.online} ${sizeMap[size]} opacity-75`}
          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        {dot}
      </span>
    );
  }

  return (
    <span
      className="relative inline-flex"
      aria-label={status === "away" ? "Away" : "Offline"}
    >
      {dot}
    </span>
  );
}
