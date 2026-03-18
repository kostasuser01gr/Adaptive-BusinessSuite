import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShieldAlert, BarChart3 } from "lucide-react";

// --- Specialized "Ultra" Components ---

const YieldRecommendation = ({ multiplier, uplift, reason }: any) => (
  <Card className="bg-primary/10 border-primary/20">
    <CardHeader className="p-3 pb-0">
      <CardTitle className="text-xs flex items-center gap-2">
        <TrendingUp className="h-3 w-3 text-primary" />
        Pricing Optimization
      </CardTitle>
    </CardHeader>
    <CardContent className="p-3">
      <div className="text-2xl font-bold text-primary">{multiplier}x</div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Recommended rate adjustment. Projected revenue uplift:{" "}
        <span className="text-green-500 font-bold">{uplift}</span>.
      </p>
      <div className="mt-2 text-[10px] italic">Reason: {reason}</div>
    </CardContent>
  </Card>
);

const InspectionFindings = ({ findings }: any) => (
  <div className="space-y-2">
    {findings.map((f: any, i: number) => (
      <div
        key={i}
        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-white/5"
      >
        <ShieldAlert
          className={`h-3 w-3 ${f.severity === "high" ? "text-destructive" : "text-amber-500"}`}
        />
        <div className="flex-1">
          <div className="text-[11px] font-bold">{f.part}</div>
          <div className="text-[10px] text-muted-foreground capitalize">
            {f.type} - {f.severity} severity
          </div>
        </div>
        <div className="text-[9px] font-mono opacity-50">
          {Math.round(f.confidence * 100)}% conf.
        </div>
      </div>
    ))}
  </div>
);

// --- Registry ---

const COMPONENT_MAP: Record<string, React.FC<any>> = {
  YieldRecommendation: YieldRecommendation,
  InspectionFindings: InspectionFindings,
};

export const GenerativeRenderer = ({
  type,
  props,
}: {
  type: string;
  props: any;
}) => {
  const Component = COMPONENT_MAP[type];
  if (!Component) return null;
  return <Component {...props} />;
};
