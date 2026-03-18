import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  NexusComplianceStatus,
  NexusGate,
  NexusMetric,
  NexusSignal,
  NexusUltraPayload,
} from "@shared/nexus-ultra";
import {
  Activity,
  Bot,
  Cloud,
  Gauge,
  GitBranch,
  Shield,
  Sparkles,
} from "lucide-react";

const signalStyles: Record<NexusSignal, string> = {
  healthy: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  attention: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  critical: "border-red-500/20 bg-red-500/10 text-red-100",
  planned: "border-sky-500/20 bg-sky-500/10 text-sky-100",
};

const complianceStyles: Record<NexusComplianceStatus, string> = {
  COMPLIANT: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  IN_PROGRESS: "border-amber-500/20 bg-amber-500/10 text-amber-100",
  NOT_APPLICABLE: "border-slate-500/20 bg-slate-500/10 text-slate-200",
};

function MetricCard({ metric }: { metric: NexusMetric }) {
  return (
    <Card className="border-white/10 bg-black/20 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {metric.label}
          </CardDescription>
          <Badge variant="outline" className={signalStyles[metric.signal]}>
            {metric.signal}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-heading">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">
          {metric.detail}
        </p>
      </CardContent>
    </Card>
  );
}

function GateGroup({
  title,
  description,
  gates,
}: {
  title: string;
  description: string;
  gates: NexusGate[];
}) {
  return (
    <Card className="border-white/10 bg-card/40 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-heading">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {gates.map((gate) => (
          <div
            key={gate.id}
            className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/10 text-primary"
                  >
                    {gate.id}
                  </Badge>
                  <h3 className="text-sm font-medium">{gate.purpose}</h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tools: {gate.tools.join(", ")}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-[11px] text-muted-foreground lg:min-w-[290px]">
                <div>
                  <p className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground/70">
                    Stack
                  </p>
                  <p className="mt-1 text-foreground">{gate.stack}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground/70">
                    SLA
                  </p>
                  <p className="mt-1 text-foreground">{gate.sla}</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground/70">
                    Auto-Fix
                  </p>
                  <p className="mt-1 text-foreground">{gate.autoFix}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function NexusUltraPage() {
  const { data, isLoading, error } = useQuery<NexusUltraPayload>({
    queryKey: ["/api/nexus-ultra"],
    queryFn: api.nexusUltra.get,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Loading NEXUS ULTRA control plane...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="border-red-500/20 bg-red-500/5 shadow-none">
          <CardContent className="p-6">
            <p className="text-sm text-red-100">Unable to load NEXUS ULTRA.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.14),transparent_26%),linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.06))] md:block" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/10 text-primary"
            >
              {data.product.name}
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/5">
              v{data.product.version}
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/5">
              Release {data.product.releaseDate}
            </Badge>
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            >
              {data.product.status}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3">
                  <Shield className="h-6 w-6 text-sky-200" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-heading font-bold tracking-tight md:text-4xl"
                    data-testid="text-nexus-ultra-title"
                  >
                    {data.product.headline}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {data.product.outcome}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {data.highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-100"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-white/10 bg-black/20 shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-heading">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Executive Snapshot
                </CardTitle>
                <CardDescription>
                  Current target posture modeled from the NEXUS ULTRA spec.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.executiveMetrics.slice(0, 4).map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {metric.label}
                      </p>
                      <span className="text-sm font-semibold">
                        {metric.value}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                      {metric.detail}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.heroMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-heading font-semibold">
            Intelligence Layer
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data.intelligence.map((program) => (
            <Card
              key={program.title}
              className="border-white/10 bg-card/40 shadow-none"
            >
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  {program.title}
                </CardTitle>
                <CardDescription>{program.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-6 text-muted-foreground">
                  {program.automation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-heading font-semibold">
            Control Plane Architecture
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          {data.architecture.map((layer) => (
            <Card
              key={layer.title}
              className="border-white/10 bg-card/40 shadow-none"
            >
              <CardHeader>
                <CardTitle className="text-base font-heading">
                  {layer.title}
                </CardTitle>
                <CardDescription>{layer.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {layer.capabilities.map((capability) => (
                  <div
                    key={capability}
                    className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-xs text-slate-100"
                  >
                    {capability}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-heading font-semibold">
            Automated Gates
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <GateGroup
            title="Critical Merge Gates"
            description="Required before merge to prevent unstable or unsafe changes from landing."
            gates={data.gates.critical}
          />
          <GateGroup
            title="Release Gates"
            description="Required before release to uphold deep quality, audit, and security expectations."
            gates={data.gates.release}
          />
          <GateGroup
            title="Continuous Enterprise Gates"
            description="Nightly, weekly, or continuous controls for policy, supply chain, runtime, and cost."
            gates={data.gates.continuous}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Shield className="h-4 w-4 text-primary" />
              Compliance Automation
            </CardTitle>
            <CardDescription>
              Signed evidence and controls modeled per framework.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {data.compliance.map((framework) => (
              <div
                key={framework.name}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{framework.name}</h3>
                  <Badge
                    variant="outline"
                    className={complianceStyles[framework.status]}
                  >
                    {framework.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Score: {framework.score}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {framework.controls.map((control) => (
                    <span
                      key={control}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-100"
                    >
                      {control}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <GitBranch className="h-4 w-4 text-primary" />
              Executive Metrics
            </CardTitle>
            <CardDescription>
              Board-level reporting targets exposed by the control plane.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.executiveMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-sm font-semibold">{metric.value}</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Cloud className="h-4 w-4 text-primary" />
              Cloud and Federation
            </CardTitle>
            <CardDescription>
              Deployment targets and organization-wide control surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.cloudTargets.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <h3 className="text-sm font-medium">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <p
                      key={item}
                      className="text-xs leading-5 text-muted-foreground"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-heading">
              <Sparkles className="h-4 w-4 text-primary" />
              Advanced Integrations
            </CardTitle>
            <CardDescription>
              Monitoring, response, analytics, and workflow hooks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.integrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{integration.name}</h3>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    {integration.category}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-100">
                  {integration.capability}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {integration.automation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="border-white/10 bg-card/40 shadow-none xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-heading">
              Supply Chain Security
            </CardTitle>
            <CardDescription>
              SBOM, provenance, and verification controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.supplyChain.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <h3 className="text-sm font-medium">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <p
                      key={item}
                      className="text-xs leading-5 text-muted-foreground"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/40 shadow-none xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-heading">
              Self-Healing Workflows
            </CardTitle>
            <CardDescription>
              Recovery controls that reduce operator toil during failures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.selfHealing.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <h3 className="text-sm font-medium">{group.title}</h3>
                <div className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <p
                      key={item}
                      className="text-xs leading-5 text-muted-foreground"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/40 shadow-none xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-heading">
              Deployment Path
            </CardTitle>
            <CardDescription>
              One-command rollout staged into four implementation phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-primary/[0.15] bg-primary/[0.08] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Deployment Command
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-primary">
                {data.product.deploymentCommand}
              </pre>
            </div>
            {data.deployment.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{phase.title}</h3>
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/5"
                  >
                    {phase.phase}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {phase.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {phase.deliverables.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-white/10 bg-card/40 shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-heading">
              Recommended Next Moves
            </CardTitle>
            <CardDescription>
              Highest-signal follow-up actions from the enterprise blueprint.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {data.recommendations.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-4 text-sm leading-6 text-slate-100"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
