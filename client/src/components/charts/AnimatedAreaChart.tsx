import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

interface AnimatedAreaChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xKey?: string;
  color?: string;
  gradientId?: string;
  height?: number;
  formatValue?: (value: number) => string;
  formatLabel?: (label: string) => string;
}

export function AnimatedAreaChart({
  data,
  dataKey,
  xKey = "date",
  color = "oklch(0.72 0.19 142)",
  gradientId = "areaGradient",
  height = 300,
  formatValue,
  formatLabel,
}: AnimatedAreaChartProps) {
  const id = useMemo(() => gradientId + Math.random().toString(36).slice(2, 8), [gradientId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatLabel}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue as any}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              fontSize: 11,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.6)" }}
            formatter={(value: number) => [
              formatValue ? formatValue(value) : value,
              dataKey,
            ]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
