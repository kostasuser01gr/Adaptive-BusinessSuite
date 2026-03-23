import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface AnimatedBarChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xKey?: string;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  colorScale?: boolean;
}

const BAR_COLORS = [
  "oklch(0.72 0.19 142)",
  "oklch(0.65 0.20 250)",
  "oklch(0.80 0.15 85)",
  "oklch(0.75 0.18 40)",
  "oklch(0.70 0.22 310)",
];

export function AnimatedBarChart({
  data,
  dataKey,
  xKey = "name",
  color = "oklch(0.72 0.19 142)",
  height = 300,
  formatValue,
  colorScale = false,
}: AnimatedBarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            formatter={(value: number) => [
              formatValue ? formatValue(value) : value,
              dataKey,
            ]}
          />
          <Bar
            dataKey={dataKey}
            radius={[4, 4, 0, 0]}
            animationDuration={600}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={colorScale ? BAR_COLORS[index % BAR_COLORS.length] : color}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
